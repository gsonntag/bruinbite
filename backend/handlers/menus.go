package handlers

import (
	"net/http"
	"github.com/gin-gonic/gin"
	"github.com/gsonntag/bruinbite/db"
	"github.com/gsonntag/bruinbite/models"
)

type MenusQuery struct {
	HallID uint     `form:"hall_id" binding:"required"`
	Day    int      `form:"day" binding:"required"`
	Month  int      `form:"month" binding:"required"`
	Year   int      `form:"year" binding:"required"`
	MealPeriod *string `form:"meal_period" binding:"required"`
}

func GetMenuHandler(mgr *db.DBManager) gin.HandlerFunc {
	return func(c *gin.Context) {
		var query MenusQuery
		if err := c.ShouldBindQuery(&query); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		date := models.Date{
			Day:       query.Day,
			Month:    query.Month,
			Year:     query.Year,
			MealPeriod: query.MealPeriod,
		}

		menu, err := mgr.GetMenuByHallIDAndDate(query.HallID, date)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		
		c.JSON(http.StatusOK, gin.H{
			"menu": menu,
		})
	}
		
}