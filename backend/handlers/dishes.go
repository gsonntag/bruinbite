package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/gsonntag/bruinbite/db"
)

type DishSearchRequest struct {
	Keyword string `form:"keyword" binding:"required"`
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

		// Trim result so we're only returning the text
		names := make([]string, len(dishes))
		for i, dish := range dishes {
			names[i] = dish.Name
		}

		c.JSON(http.StatusOK, gin.H{"dishes": names})
	}
}
