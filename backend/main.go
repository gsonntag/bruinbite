package main

import (
	"context"
	"database/sql"
	"log"
	"os"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	_ "github.com/jackc/pgx/v4/stdlib"
)

const Port = 8080

func main() {
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatal("DATABASE_URL envvar not set, exiting")
	}
	db, err := sql.Open("pgx", dbURL)
	if err != nil {
		log.Fatalf("Failed to start db: %v", err)
	}
	defer db.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := db.PingContext(ctx); err != nil {
		log.Fatalf("Failed to connect to db: %v", err)
	}
	log.Println("Connected to the postgres db")

	router := gin.Default()
	router.GET("/test", func(c *gin.Context) {
		c.JSON(200, gin.H{"message": "test gateway working"})
	})

	log.Printf("Listening on port %d", Port)
	if err := router.Run(":" + strconv.Itoa(Port)); err != nil {
		log.Fatalf("server error: %v", err)
	}
}