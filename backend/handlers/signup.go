package handlers

import (
	"net/http"
	"regexp"
	"os"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v4"
	"github.com/gsonntag/bruinbite/db"
	"github.com/gsonntag/bruinbite/models"
	"github.com/lib/pq"
	"golang.org/x/crypto/bcrypt"
)

type SignupRequest struct {
	Username string `json:"username"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

var usernameRegexp = regexp.MustCompile(`^[A-Za-z0-9]{3,16}$`)                            // 3-16 characters, letters and digits only
var emailRegex = regexp.MustCompile(`^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$`) // standard email regex
var passwordRegex = regexp.MustCompile(`^.{8,}$`)                                         // 8+ chars

func SignupHandler(mgr *db.DBManager) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		var request SignupRequest
		if err := ctx.ShouldBindJSON(&request); err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		if !usernameRegexp.MatchString(request.Username) {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid username"})
		}

		if !emailRegex.MatchString(request.Email) {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid email"})
			return
		}

		if !passwordRegex.MatchString(request.Password) {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid password"})
			return
		}

		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(request.Password), bcrypt.DefaultCost)
		if err != nil {
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": "unable to hash password"})
			return
		}

		user := &models.User{
			Username:       request.Username,
			HashedPassword: string(hashedPassword),
			Email:          request.Email,
			IsAdmin:        false,
			Ratings:        []models.Rating{},
		}

		if err := mgr.CreateUser(user); err != nil {
			if pqErr, ok := err.(*pq.Error); ok && pqErr.Code == "23505" {
				ctx.JSON(http.StatusBadRequest, gin.H{"error": "username or email already in use"})
				return
			}
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": "user already exists"})
			return
		}

		jwtSecret := os.Getenv("JWT_SECRET")
		if jwtSecret == "" {
			// secret not set
			jwtSecret = "F4LLB4CK" // just for dev
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
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate token"})
			return
		}

		user.HashedPassword = ""
		ctx.JSON(http.StatusOK, gin.H{"token": tokenString, "user": user})
	}
}
