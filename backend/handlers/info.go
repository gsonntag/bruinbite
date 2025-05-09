package handlers

import (
	"fmt"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/gsonntag/bruinbite/db"
)

func GetCurUserInfoHandler(mgr *db.DBManager) gin.HandlerFunc {
	return func(c *gin.Context) {
		userId := c.GetString("userId")
		// userId is a string, but we need to convert it to an int
		userIdInt, err := strconv.Atoi(userId)
		fmt.Println("userId: ", userId)
		user, err := mgr.GetUserByID(uint(userIdInt))
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "server error"})
			return
		}
		c.JSON(http.StatusOK, gin.H{
			"user": user,
		})
	}
}