package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/gsonntag/bruinbite/db"
	"github.com/gsonntag/bruinbite/search"
)

// BleveSearchRequest defines the query parameters for the Bleve search endpoint
type BleveSearchRequest struct {
	Keyword string `form:"keyword" binding:"required"`
	Hall    string `form:"hall"`    // Optional hall filter
	Limit   int    `form:"limit"`   // Optional result limit
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

		// Format response
		results := make([]map[string]interface{}, len(dishes))
		for i, dish := range dishes {
			results[i] = map[string]interface{}{
				"id":          dish.ID,
				"name":        dish.Name,
				"hall_name":   dish.HallName,
				"description": dish.Description,
				"location":    dish.Location,
			}
		}

		c.JSON(http.StatusOK, gin.H{"dishes": results})
	}
}

// ReindexHandler handles the request to reindex all dishes
func ReindexHandler(indexer *search.Indexer) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Reindex all dishes
		err := indexer.ReindexAll()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Successfully reindexed all dishes"})
	}
}
