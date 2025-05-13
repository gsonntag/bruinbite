package handlers

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/gsonntag/bruinbite/db"
	"github.com/gsonntag/bruinbite/models"
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

		names := make([]string, len(dishes))
		for i, dish := range dishes {
			names[i] = fmt.Sprintf("%s (%s)", dish.Name, models.HallNameMap[models.HallSlug(dish.Hall.Name)])
		}

		c.JSON(http.StatusOK, gin.H{"dishes": names})
	}
}
