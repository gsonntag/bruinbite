package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/gsonntag/bruinbite/db"
)

func GetCurUserInfoHandler(mgr *db.DBManager) gin.HandlerFunc {
	return func(c *gin.Context) {
		userId := c.GetString("userId")
		userIdInt, err := strconv.Atoi(userId)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "server error"})
			return
		}
		user, err := mgr.GetUserByID(uint(userIdInt))
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "server error"})
			return
		}
		c.JSON(http.StatusOK, user)
	}
}

func GetUserInfoHandler(mgr *db.DBManager) gin.HandlerFunc {
	return func(c *gin.Context) {
		username := c.Param("username")
		if username == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "username is required"})
			return
		}

		user, err := mgr.GetUserByUsername(username)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{
			"user": user,
		})
	}
}

func GetAllHallDishesHandler(mgr *db.DBManager) gin.HandlerFunc {
	return func(c *gin.Context) {
		hallName := c.Query("hall_name")
		if hallName == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "hall_name is required"})
			return
		}

		dishes, err := mgr.GetAllDishesByHallName(hallName)

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{
			"dishes": dishes,
		})
	}
}

func GetAllDiningHallsHandler(mgr *db.DBManager) gin.HandlerFunc {
	return func(c *gin.Context) {
		halls, err := mgr.GetAllHallsWithRatings()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{
			"dining_halls": halls,
		})
	}
}
