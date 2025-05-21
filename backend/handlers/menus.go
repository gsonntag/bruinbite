package handlers

import (
	"net/http"
	"slices"
	"sort"

	"github.com/gin-gonic/gin"
	"github.com/gsonntag/bruinbite/db"
	"github.com/gsonntag/bruinbite/models"
)

type MenusQuery struct {
	HallName   string  `form:"hall_name" binding:"required"`
	Day        int     `form:"day" binding:"required"`
	Month      int     `form:"month" binding:"required"`
	Year       int     `form:"year" binding:"required"`
	MealPeriod *string `form:"meal_period" binding:"required"`
}

type DayQuery struct {
	HallName string `form:"hall_name" binding:"required"`
	Day      int    `form:"day" binding:"required"`
	Month    int    `form:"month" binding:"required"`
	Year     int    `form:"year" binding:"required"`
}

func GetMenuHandler(mgr *db.DBManager) gin.HandlerFunc {
	return func(c *gin.Context) {
		var query MenusQuery
		if err := c.ShouldBindQuery(&query); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		date := models.Date{
			Day:        query.Day,
			Month:      query.Month,
			Year:       query.Year,
			MealPeriod: query.MealPeriod,
		}

		menu, err := mgr.GetMenuByHallNameAndDate(query.HallName, date)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"menu": menu,
		})
	}
}

func GetHallMealPeriods(mgr *db.DBManager) gin.HandlerFunc {
	return func(c *gin.Context) {
		var query DayQuery
		if err := c.ShouldBindQuery(&query); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		date := models.Date{
			Day:        query.Day,
			Month:      query.Month,
			Year:       query.Year,
			MealPeriod: nil,
		}
		mealPeriods, err := mgr.GetMealPeriodsForDate(query.HallName, date)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}

		// order lunch before dinner
		sort.SliceStable(mealPeriods, func(i, j int) bool {
			mi, mj := mealPeriods[i], mealPeriods[j]
			if mi == "LUNCH" && mj == "DINNER" {
				return true
			}
			return false
		})

		// internally, drey, rende, bcafe, epic ackerman all use breakfast for all periods
		// so if it is one of these, we return "Lunch & Dinner" or "All Day" for Bcafe
		allPeriodsBreakfast := []string{"the-drey", "rendezvous", "epicuria-at-ackerman"}
		if query.HallName == "bruin-cafe" {
			mealPeriods = []string{"ALL_DAY"}
		} else if slices.Contains(allPeriodsBreakfast, query.HallName) {
			mealPeriods = []string{"LUNCH_DINNER"}
		}

		c.JSON(http.StatusOK, gin.H{
			"periods": mealPeriods,
		})
	}
}
