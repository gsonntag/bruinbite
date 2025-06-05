package handlers

import (
	"net/http"
	"sort"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gsonntag/bruinbite/db"
	"github.com/gsonntag/bruinbite/models"
	"gorm.io/gorm"
)

type RecommendedHallQuery struct {
	Day        int     `form:"day" binding:"required"`
	Month      int     `form:"month" binding:"required"`
	Year       int     `form:"year" binding:"required"`
	MealPeriod *string `form:"meal_period" binding:"required"`
}

// This endpoint recommends which dining hall the user should try
// based on other user rankings and the user's own rankings.
//
// Logic:
//
// If the user has never tried the hall (no dishes rated
// from the hall), the rating is based on other user's
// ratings of the hall exclusively. However, if the user
// has tried dishes that are in the hall for this
// meal period, it is weighted as follows: 2/3 user's
// opinion, 1/3 consensus opinion.
//
// Returns the top 3 halls the user should try for this
// meal period with their corresponding 1-10 rankings on
// if the user is projected to like the hall, as well as
// each hall's top 3 rated dishes.
func GetRecommendedHallForUser(mgr *db.DBManager) gin.HandlerFunc {
	return func(c *gin.Context) {
		userId, err := strconv.Atoi(c.GetString("userId"))

		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid user ID"})
			return
		}

		now := time.Now().In(mgr.TZ)
		periods := GetAllowedMealPeriods(now)

		// Fetch all menus for that meal period
		var menus []models.Menu
		if err := mgr.DB.Preload("Dishes").Where(
			"date_day=? AND date_month=? AND date_year=? AND date_meal_period IN ?",
			now.Day(), int(now.Month()), now.Year(), periods,
		).Find(&menus).Error; err != nil && err != gorm.ErrRecordNotFound {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		if len(menus) == 0 {
			c.JSON(http.StatusOK, gin.H{"message": "No halls are serving meals at this time."})
			return
		}

		dishIDs := make([]uint, 0, 64)
		for _, m := range menus {
			for _, d := range m.Dishes {
				dishIDs = append(dishIDs, d.ID)
			}
		}

		userRatingMap := make(map[uint]float64, len(dishIDs))
		if len(dishIDs) == 0 {
			c.JSON(http.StatusOK, gin.H{"message": "No halls are serving meals at this time."})
			return
		}
		var ratings []models.Rating
		mgr.DB.Where("user_id=? AND dish_id IN ?", userId, dishIDs).Find(&ratings)
		for _, r := range ratings {
			userRatingMap[r.DishID] = float64(r.Score)
		}

		type hallResult struct {
			Hall      models.DiningHall `json:"hall"`
			Score     float64           `json:"score"`
			Basis     string            `json:"basis"`
			TopDishes []models.Dish     `json:"top_dishes"`
		}

		var results []hallResult
		for _, menu := range menus {
			if len(menu.Dishes) == 0 {
				continue
			}

			var consensusSum, userSum float64
			var userCount, consensusCount int
			for _, dish := range menu.Dishes {
				if dish.AverageRating == 0 {
					continue
				}
				consensusSum += dish.AverageRating
				consensusCount++
				if userScore, ok := userRatingMap[dish.ID]; ok {
					userSum += userScore
					userCount++
				}
			}
			if consensusCount == 0 {
				consensusSum = 0
			} else {
				consensusSum /= float64(consensusCount)
			}
			finalScore := consensusSum
			basis := "consensus"
			if userCount > 0 {
				userSum /= float64(userCount)
				finalScore = (2*userSum + consensusSum) / 3
				basis = "user,consensus"
			}

			var hall models.DiningHall
			if err := mgr.DB.First(&hall, menu.HallID).Error; err != nil {
				continue // should never happen
			}

			sort.Slice(menu.Dishes, func(i, j int) bool {
				if menu.Dishes[i].AverageRating == menu.Dishes[j].AverageRating {
					return menu.Dishes[i].ID > menu.Dishes[j].ID // tie breaker
				}
				return menu.Dishes[i].AverageRating > menu.Dishes[j].AverageRating
			})

			topCount := 3
			if len(menu.Dishes) < topCount {
				topCount = len(menu.Dishes)
			}
			topDishes := make([]models.Dish, topCount)
			for i := 0; i < topCount; i++ {
				topDishes[i] = menu.Dishes[i]
			}

			results = append(results, hallResult{
				Hall:      hall,
				Score:     finalScore,
				Basis:     basis,
				TopDishes: topDishes,
			})
		}

		if len(results) == 0 {
			c.JSON(http.StatusOK, gin.H{"message": "No suitable recommendation found."})
			return
		}

		sort.Slice(results, func(i, j int) bool {
			if results[i].Score == results[j].Score {
				return results[i].Hall.ID < results[j].Hall.ID
			}
			return results[i].Score > results[j].Score
		})
		if len(results) > 3 {
			results = results[:3]
		}

		c.JSON(http.StatusOK, gin.H{
			"halls": results,
		})
	}
}

func GetMealPeriodForHall(hallName, mealPeriod string) string {
	if hallName == "bruin-cafe" {
		return "ALL_DAY"
	}
	if hallName == "epicuria-at-ackerman" || hallName == "rendezvous" || hallName == "the-drey" {
		return "LUNCH_DINNER"
	}
	return mealPeriod
}

func GetAllowedMealPeriods(now time.Time) []string {
	mealPeriod := GetActualMealPeriod(now.Hour())
	var results []string
	results = append(results, mealPeriod)
	if mealPeriod != "NONE" && mealPeriod != "LATE_NIGHT" {
		results = append(results, "ALL_DAY")
	}
	if mealPeriod == "LUNCH" || mealPeriod == "DINNER" {
		results = append(results, "LUNCH_DINNER")
	}
	return results
}

func GetActualMealPeriod(hour int) string {
	// Source: https://dining.ucla.edu/hours/
	if hour > 7 && hour < 10 {
		return "BREAKFAST"
	} else if hour > 11 && hour < 15 {
		return "LUNCH"
	} else if hour > 17 && hour < 21 {
		return "DINNER"
	} else if hour < 2 || hour > 21 {
		return "LATE_NIGHT"
	}
	return "NONE"
}
