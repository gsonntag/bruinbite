package handlers

import (
	"fmt"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/gsonntag/bruinbite/db"
	"github.com/gsonntag/bruinbite/models"
)

type RatingsRequest struct {
	DishID  uint    `json:"dish_id" binding:"required"`
	Score   int16   `json:"score" binding:"required"`
	Comment *string `json:"comment"`
}

type BatchRatingsRequest struct {
	Ratings []RatingsRequest `json:"ratings" binding:"required"`
}

func SubmitRatingHandler(mgr *db.DBManager) gin.HandlerFunc {
	return func(c *gin.Context) {
		var request RatingsRequest
		if err := c.ShouldBindJSON(&request); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// get user ID from context
		userId, err := strconv.Atoi(c.GetString("userId"))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user ID"})
			return
		}

		rating := models.Rating{
			UserID:  uint(userId),
			DishID:  request.DishID,
			Score:   request.Score,
			Comment: request.Comment,
		}
		if err := mgr.CreateRating(&rating); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Rating submitted successfully"})
	}
}

func SubmitRatingBatchHandler(mgr *db.DBManager) gin.HandlerFunc {
	return func(c *gin.Context) {
		var request BatchRatingsRequest
		if err := c.ShouldBindJSON(&request); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			fmt.Println(err.Error())
			return
		}

		userId, err := strconv.Atoi(c.GetString("userId"))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user ID"})
			return
		}

		var ratings []models.Rating
		for _, r := range request.Ratings {
			rating := models.Rating{
				UserID:  uint(userId),
				DishID:  r.DishID,
				Score:   r.Score,
				Comment: r.Comment,
			}
			ratings = append(ratings, rating)
		}
		if err := mgr.CreateMultipleRatings(ratings); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": fmt.Sprintf("Successfully submitted %d reviews.", len(ratings))})
	}
}

func GetUserRatingsHandler(mgr *db.DBManager) gin.HandlerFunc {
	return func(c *gin.Context) {
		// get user ID from context OR from query parameters
		userId, err := strconv.Atoi(c.GetString("userId"))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user ID"})
			return
		}

		ratings, err := mgr.GetAllRatingsByUserIDOrUsername(uint(userId), "")
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Review submitted successfully."})
	}
}

func GetUserRatingsFromUsernameHandler(mgr *db.DBManager) gin.HandlerFunc {
	return func(c *gin.Context) {
		username := c.Param("username")
		if username == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "username is required"})
			return
		}

		ratings, err := mgr.GetAllRatingsByUserIDOrUsername(0, username)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, ratings)
	}
}

// GetFriendRatingsHandler retrieves all ratings made by a user's friends
func GetFriendRatingsHandler(mgr *db.DBManager) gin.HandlerFunc {
	return func(c *gin.Context) {
		// get user ID from context
		userId, err := strconv.Atoi(c.GetString("userId"))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user ID"})
			return
		}

		friendRatings, err := mgr.GetRatingsByFriends(uint(userId))
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, friendRatings)
	}
}

// GetDishRatingsHandler retrieves all ratings made for a dish
func GetDishRatingsHandler(mgr *db.DBManager) gin.HandlerFunc {
	return func(c *gin.Context) {
		dishIDStr := c.Query("dish_id")
		if dishIDStr == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "dish_id is required"})
			return
		}

		dishID, err := strconv.Atoi(dishIDStr)
		if err != nil || dishID <= 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid dish_id"})
			return
		}

		ratings, err := mgr.GetAllRatingsByDishID(uint(dishID))
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, ratings)
	}
}
