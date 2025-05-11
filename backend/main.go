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
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

const Port = 8080

var DBManager *db.DBManager

func InitializeDatabase() error {
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatal("DATABASE_URL env var not set, exiting")
	}

	// Try to cnnect to database
	database, err := gorm.Open(postgres.Open(dbURL), &gorm.Config{})
	if err != nil {
		return err
	}
	DBManager = db.NewDBManager(database)
	err = DBManager.Migrate()
	if err != nil {
		return err
	}
	return nil
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
}

func InitializeRouter() error {
	router := gin.Default()
	RegisterRoutes(router)
	log.Printf("Listening on port %d", Port)

	// Try to run router, if it fails, log error
	if err := router.Run(":" + strconv.Itoa(Port)); err != nil {
		log.Fatalf("server error: %v", err)
		return err
	}
	return nil
}

// func main() {
// 	err := InitializeDatabase()
// 	if err != nil {
// 		log.Fatalln("Failed to connect to database")
// 		return
// 	}
// 	err = InitializeRouter()
// 	if err != nil {
// 		log.Fatalln("Failed to initialize Gin router")
// 		return
// 	}
// }

func main() {

	err := ingest.FetchAndIngest()
	if err != nil {
		fmt.Printf("%w\n", err)
	}

}
