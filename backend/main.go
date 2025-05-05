package main

import (
	"log"
	"os"
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/gsonntag/bruinbite/db"
	"github.com/gsonntag/bruinbite/handlers"
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
	router.GET("/ping", func(c *gin.Context) {
		c.JSON(200, gin.H{"message": "Pong"})
	})

	router.POST("/signup", handlers.SignupHandler(DBManager))
	router.POST("/login", handlers.LoginHandler(DBManager))
}

func InitializeRouter() error {
	router := gin.Default()
	RegisterRoutes(router)
	log.Printf("Listening on port %d", Port)
	if err := router.Run(":" + strconv.Itoa(Port)); err != nil {
		log.Fatalf("server error: %v", err)
		return err
	}
	return nil
}

func main() {
	err := InitializeDatabase()
	if err != nil {
		log.Fatalln("Failed to connect to database")
		return
	}
	err = InitializeRouter()
	if err != nil {
		log.Fatalln("Failed to initialize Gin router")
		return
	}
}
