package handlers

import (
	"net/http"
	"strconv"
	"github.com/gin-gonic/gin"
	"github.com/gsonntag/bruinbite/db"
	"github.com/gsonntag/bruinbite/models"
)

type RatingsRequest struct {
	DishID uint    	`json:"dish_id" binding:"required"`
	Score  int16    `json:"score" binding:"required"`
	Comment *string `json:"comment"`
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
			UserID: uint(userId),
			DishID: request.DishID,
			Score:  request.Score,
			Comment: request.Comment,
		}
		if err := mgr.CreateRating(&rating); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Rating submitted successfully"})
	}
}