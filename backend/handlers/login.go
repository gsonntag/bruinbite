package handlers

import (
	"errors"
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v4"
	"github.com/gsonntag/bruinbite/db"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type LoginRequest struct {
	Username string `json:"username"` // could be email or username
	Password string `json:"password"`
}

func LoginHandler(mgr *db.DBManager) gin.HandlerFunc {
	return func(c *gin.Context) {
		var request LoginRequest
		if err := c.ShouldBindJSON(&request); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		user, err := mgr.GetUserByNameOrEmail(request.Username)
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid username/password"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "server error"})
			return
		}

		if err := bcrypt.CompareHashAndPassword(
			[]byte(user.HashedPassword),
			[]byte(request.Password),
		); err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid username/password"})
			return
		}

		jwtSecret := os.Getenv("JWT_SECRET")
		if jwtSecret == "" {
			// secret not set
			jwtSecret = "fallback" // just for dev
		}

		claims := jwt.MapClaims{
			"sub":      strconv.Itoa(int(user.ID)),
			"username": user.Username,
			"exp":      time.Now().Add(24 * time.Hour).Unix(),
			"iat":      time.Now().Unix(),
		}

		token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
		tokenString, err := token.SignedString([]byte(jwtSecret))
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate token"})
			return
		}

		user.HashedPassword = ""
		c.JSON(http.StatusOK, gin.H{"token": tokenString, "user": user})
	}
}
