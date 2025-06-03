package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/gsonntag/bruinbite/db"
	"github.com/gsonntag/bruinbite/search"
)

// BleveSearchRequest defines the query parameters for the Bleve search endpoint
type BleveSearchRequest struct {
	Keyword string `form:"keyword" binding:"required"`
	Hall    string `form:"hall"`  // Optional hall filter
	Limit   int    `form:"limit"` // Optional result limit
}

// BleveSearchHandler returns a handler for Bleve-based dish search
func BleveSearchHandler(mgr *db.DBManager, searchMgr *search.BleveSearchManager) gin.HandlerFunc {
	return func(c *gin.Context) {
		var request BleveSearchRequest
		if err := c.ShouldBindQuery(&request); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Set default limit if not provided
		limit := request.Limit
		if limit <= 0 {
			limit = 10
		}

		// Search for dishes using Bleve
		dishes, err := searchMgr.SearchDishes(request.Keyword, request.Hall, limit)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		// Format response by getting full dish data from database
		results := make([]map[string]interface{}, 0, len(dishes))
		for _, dish := range dishes {
			dishID, err := strconv.ParseUint(dish.ID, 10, 32)
			if err != nil {
				continue
			}

			// get dish info so we can add avg rating to display on frontend
			fullDish, err := mgr.GetDishByID(uint(dishID))
			if err != nil {
				continue
			}

			// add average_rating to response
			dishResponse := map[string]interface{}{
				"id":             fullDish.ID,
				"name":           fullDish.Name,
				"hall_name":      fullDish.Hall.Name,
				"description":    fullDish.Description,
				"location":       fullDish.Location,
				"average_rating": fullDish.AverageRating,
			}

			results = append(results, dishResponse)
		}

		c.JSON(http.StatusOK, gin.H{"dishes": results})
	}
}

// ReindexHandler handles the request to reindex all dishes and users
func ReindexHandler(indexer *search.Indexer, mgr *db.DBManager, userSearchManager *search.BleveUserSearchManager) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Reindex all dishes
		err := indexer.ReindexAll()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to reindex dishes: " + err.Error()})
			return
		}

		// Reindex all users
		if userSearchManager != nil {
			users, err := mgr.GetAllUsers()
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get users for reindexing: " + err.Error()})
				return
			}

			// Convert users to search documents
			userDocs := make([]search.UserDocument, len(users))
			for i, user := range users {
				userDocs[i] = search.UserToDocument(user)
			}

			// Reindex all users
			err = userSearchManager.ReindexAllUsers(userDocs)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to reindex users: " + err.Error()})
				return
			}
		}

		c.JSON(http.StatusOK, gin.H{"message": "Successfully reindexed all dishes and users"})
	}
}

// ReindexUsersHandler handles the request to reindex only users (useful after profile updates)
func ReindexUsersHandler(mgr *db.DBManager, userSearchManager *search.BleveUserSearchManager) gin.HandlerFunc {
	return func(c *gin.Context) {
		if userSearchManager == nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "User search manager not available"})
			return
		}

		// Get all users from database
		users, err := mgr.GetAllUsers()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get users for reindexing: " + err.Error()})
			return
		}

		// Convert users to search documents
		userDocs := make([]search.UserDocument, len(users))
		for i, user := range users {
			userDocs[i] = search.UserToDocument(user)
		}

		// Reindex all users
		err = userSearchManager.ReindexAllUsers(userDocs)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to reindex users: " + err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"message": "Successfully reindexed all users",
			"count":   len(userDocs),
		})
	}
}
