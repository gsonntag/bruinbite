package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

// getUserIDFromContext extracts and parses the user ID from the gin context
// Returns the user ID and a boolean indicating success
// If parsing fails, it automatically sends an error response
func getUserIDFromContext(c *gin.Context) (uint, bool) {
	userIdStr := c.GetString("userId")
	userIdInt, err := strconv.Atoi(userIdStr)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "server error"})
		return 0, false
	}
	return uint(userIdInt), true
}

