package main

import (
	"fmt"
	"log"
	"os"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/gin-contrib/cors"
	"github.com/gsonntag/bruinbite/db"
	"github.com/gsonntag/bruinbite/handlers"
	"github.com/gsonntag/bruinbite/ingest"
	"github.com/joho/godotenv"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

const Port = 8080

var DBManager *db.DBManager

func InitializeDatabase() error {
	dbHost := os.Getenv("POSTGRES_HOST")
	dbPort := os.Getenv("POSTGRES_PORT")
	dbUser := os.Getenv("POSTGRES_USER")
	dbPassword := os.Getenv("POSTGRES_PASSWORD")
	dbName := os.Getenv("POSTGRES_DB")
	dbURL := "postgres://" + dbUser + ":" + dbPassword + "@" + dbHost + ":" + dbPort + "/" + dbName + "?sslmode=disable"
	// Try to cnnect to database
	database, err := gorm.Open(postgres.Open(dbURL), &gorm.Config{})
	if err != nil {
		return err
	}
	if DBManager, err = db.NewDBManager(database); err != nil {
		return err
	}
	return DBManager.Migrate()
}

func RegisterRoutes(router *gin.Engine) {

	// CORS is necessary so that frontend can communicate with backend.
	// Otherwise, it will be viewed as a cross-origin request and will be blocked.
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000"}, // frontend URL
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// Register test route (renamed to ping)
	router.GET("/ping", func(c *gin.Context) {
		c.JSON(200, gin.H{"message": "Pong"})
	})

	// Register auth routes
	router.POST("/signup", handlers.SignupHandler(DBManager))
	router.POST("/login", handlers.LoginHandler(DBManager))

	router.GET("/protected",
		handlers.AuthMiddleware(),
		handlers.ProtectedHandler(DBManager))

	// Register user info route
	router.GET("/userinfo",
		handlers.AuthMiddleware(),
		handlers.GetCurUserInfoHandler(DBManager))

	// Register hall dishes route
	router.GET("/allhalldishes",
		handlers.AuthMiddleware(),
		handlers.GetAllHallDishesHandler(DBManager))

	// Search route
	router.GET("/search",
		handlers.DishesSearchHandler(DBManager))

	// Register ratings route
	// expecting body params: dish_id, rating, comment (optional)
	// e.g. {"dish_id": 1, "rating": 4.5, "comment": "Great dish!"}
	router.POST("/ratings",
		handlers.AuthMiddleware(),
		handlers.SubmitRatingHandler(DBManager))

	// Register menu route
	// expecting query params: hall_id, day, month, year, meal_period
	// e.g. /menu?hall_id=1&day=1&month=1&year=2023&meal_period=LUNCH
	router.GET("/menu",
		handlers.AuthMiddleware(),
		handlers.GetMenuHandler(DBManager))
}

func InitializeRouter() error {
	router := gin.Default()
	RegisterRoutes(router)

	// Try to run router, if it fails, log error
	if err := router.Run(":" + strconv.Itoa(Port)); err != nil {
		log.Fatalf("server error: %v", err)
		return err
	}
	return nil
}

func main() {
	// Load go dot env
	if err := godotenv.Load("db.env"); err != nil {
		log.Fatalln("db.env file not found, exiting")
		return
	}

	err := InitializeDatabase()
	if err != nil {
		log.Fatalln("Failed to connect to database", err)
		return
	}

	err = ingest.FetchAndIngest(DBManager)
	if err != nil {
		fmt.Printf("%w\n", err)
	}

	err = InitializeRouter()
	if err != nil {
		log.Fatalln("Failed to initialize Gin router")
		return
	}
}
