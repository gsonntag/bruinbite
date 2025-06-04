package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/gsonntag/bruinbite/db"
)

type DishSearchRequest struct {
	Keyword string `form:"keyword" binding:"required"`
}

type DishSearchResponse struct {
	ID            uint    `json:"id"`
	Name          string  `json:"name"`
	HallName      string  `json:"hall_name"`
	AverageRating float64 `json:"average_rating"`
	Location      *string `json:"location,omitempty"`
}

func DishesSearchHandler(mgr *db.DBManager) gin.HandlerFunc {
	return func(c *gin.Context) {
		var request DishSearchRequest
		if err := c.ShouldBindQuery(&request); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		dishes, err := mgr.GetDishesByName(request.Keyword, 10)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		dishResponses := make([]DishSearchResponse, len(dishes))
		for i, dish := range dishes {
			dishResponses[i] = DishSearchResponse{
				ID:            dish.ID,
				Name:          dish.Name,
				HallName:      dish.Hall.Name,
				AverageRating: dish.AverageRating,
				Location:      dish.Location,
			}
		}

		c.JSON(http.StatusOK, gin.H{"dishes": dishResponses})
	}
}

// handler to get details for a specific dish by ID (used for /dish frontend data)
func GetDishDetailsHandler(mgr *db.DBManager) gin.HandlerFunc {
	return func(c *gin.Context) {
		dishIDStr := c.Param("id")
		if dishIDStr == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "dish_id is required"})
			return
		}

		dishID, err := strconv.Atoi(dishIDStr)
		if err != nil || dishID <= 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid dish_id"})
			return
		}

		dish, err := mgr.GetDishByID(uint(dishID))
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "dish not found"})
			return
		}
		hall, err := mgr.GetHallByID(dish.HallID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "hall info not found"})
			return
		}

		//use ts for search params
		response := map[string]interface{}{
			"id":             dish.ID,
			"name":           dish.Name,
			"description":    dish.Description,
			"average_rating": dish.AverageRating,
			"tags":           dish.Tags,
			"location":       dish.Location,
			"last_seen_date": dish.LastSeenDate,
			"hall": map[string]interface{}{
				"id":       hall.ID,
				"name":     hall.Name,
				"location": hall.Location,
			},
		}

		c.JSON(http.StatusOK, gin.H{"dish": response})
	}
}
