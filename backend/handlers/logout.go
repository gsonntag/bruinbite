package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/gsonntag/bruinbite/db"
)

func LogoutHandler(mgr *db.DBManager) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Using stateless JWT, so there is nothing to remove on the server's end
		c.JSON(http.StatusOK, gin.H{"message": "logout success"})
	}
}