package main

import (
	"flag"
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
	"github.com/gsonntag/bruinbite/search"
	"github.com/joho/godotenv"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

const Port = 8080

var (
	DBManager         *db.DBManager
	SearchManager     *search.BleveSearchManager
	UserSearchManager *search.BleveUserSearchManager
	Indexer           *search.Indexer
)

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

	frontendUrl := os.Getenv("FRONTEND_URL")
	// CORS is necessary so that frontend can communicate with backend.
	// Otherwise, it will be viewed as a cross-origin request and will be blocked.
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{frontendUrl}, // frontend URL
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization", "ngrok-skip-browser-warning"},
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

	// Register user info by username route
	router.GET("/user/:username",
		handlers.GetUserInfoHandler(DBManager))

	// Register hall dishes route
	router.GET("/allhalldishes",
		handlers.AuthMiddleware(),
		handlers.GetAllHallDishesHandler(DBManager))

	// Legacy search route (SQL-based)
	router.GET("/sql-search",
		handlers.DishesSearchHandler(DBManager))

	// Bleve search route (for enhanced search with fuzzy matching, etc.)
	router.GET("/search",
		handlers.BleveSearchHandler(DBManager, SearchManager))

	// Admin endpoint to manually trigger reindexing
	router.POST("/admin/reindex",
		handlers.ReindexHandler(Indexer, DBManager, UserSearchManager))

	// Admin endpoint to manually trigger user reindexing only (useful after profile updates)
	router.POST("/admin/reindex-users",
		handlers.ReindexUsersHandler(DBManager, UserSearchManager))

	// Register ratings route
	// expecting body params: dish_id, rating, comment (optional)
	// e.g. {"dish_id": 1, "rating": 4.5, "comment": "Great dish!"}
	router.POST("/ratings",
		handlers.AuthMiddleware(),
		handlers.SubmitRatingHandler(DBManager))

	// Register ratings BATCH route
	// expecting body params: dish_id, rating, comment (optional)
	// e.g. {"ratings": [{"dish_id": 1, "rating": 4.5, "comment": "Great dish!"}, {"dish_id": 2, "rating": 1.5, "comment": "Bad dish!"}]}
	router.POST("/ratings/batch",
		handlers.AuthMiddleware(),
		handlers.SubmitRatingBatchHandler(DBManager))

	// Get user ratings route
	// expecting no params, will return all ratings made by the user
	router.GET("/userratings",
		handlers.AuthMiddleware(),
		handlers.GetUserRatingsHandler(DBManager))

	// Get friend ratings route
	// expecting no params, will return all ratings made by the user's friends
	router.GET("/friendratings",
		handlers.AuthMiddleware(),
		handlers.GetFriendRatingsHandler(DBManager))

	// get ratings for specific user
	// expecting path param: username
	router.GET("/user/:username/ratings",
		handlers.GetUserRatingsFromUsernameHandler(DBManager))

	// Get dish ratings route
	// expecting path param: dish_id
	router.GET("/dishratings",
		handlers.GetDishRatingsHandler(DBManager))

	// Register menu route
	// expecting query params: hall_id, day, month, year, meal_period
	// e.g. /menu?hall_id=1&day=1&month=1&year=2023&meal_period=LUNCH
	router.GET("/menu",
		handlers.GetMenuHandler(DBManager))

	// Gets all valid meal periods for a given date
	router.GET("/hall-meal-periods",
		handlers.GetHallMealPeriods(DBManager))

	// Gets all valid meal periods for a given date
	router.GET("/recommended",
		handlers.AuthMiddleware(),
		handlers.GetRecommendedHallForUser(DBManager))

	// Get all dining halls with their ratings
	router.GET("/dining-halls",
		handlers.GetAllDiningHallsHandler(DBManager))

	// Register friends routes
	router.GET("/friends",
		handlers.AuthMiddleware(),
		handlers.GetFriendsHandler(DBManager))
	router.GET("/out-friend-requests",
		handlers.AuthMiddleware(),
		handlers.GetOutgoingFriendRequestsHandler(DBManager))
	router.GET("/in-friend-requests",
		handlers.AuthMiddleware(),
		handlers.GetIncomingFriendRequestsHandler(DBManager))

	// Expecting body params: friend_id
	// e.g. {"friend_id": 2}
	router.POST("/send-friend-request",
		handlers.AuthMiddleware(),
		handlers.SendFriendRequestHandler(DBManager))

	// Expecting body params: request_id
	// e.g. {"request_id": 1}
	router.POST("/accept-friend-request",
		handlers.AuthMiddleware(),
		handlers.AcceptFriendRequestHandler(DBManager))

	// Expecting body params: request_id
	router.POST("/decline-friend-request",
		handlers.AuthMiddleware(),
		handlers.DeclineFriendRequestHandler(DBManager))

	// dish info based on id
	router.GET("/dish/:id",
		handlers.GetDishDetailsHandler(DBManager))

	// Enhanced user search with fuzzy matching and partial search (Bleve-based)
	router.GET("/search-users",
		handlers.AuthMiddleware(),
		handlers.BleveSearchUsersHandler(DBManager, UserSearchManager))

	// Legacy user search (SQL-based) - keeping as fallback
	router.GET("/sql-search-users",
		handlers.AuthMiddleware(),
		handlers.SearchUsersHandler(DBManager))

	// Profile update routes
	router.PUT("/profile",
		handlers.AuthMiddleware(),
		handlers.UpdateProfileHandler(DBManager, UserSearchManager))

	router.POST("/profile/picture",
		handlers.AuthMiddleware(),
		handlers.UploadProfilePictureHandler(DBManager, UserSearchManager))

	// Static file serving for uploads
	router.Static("/uploads", "./uploads")
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

// InitializeSearch initializes the Bleve search system
func InitializeSearch(forceReindex bool) error {
	// Initialize Bleve search manager for dishes
	var err error
	SearchManager, err = search.NewBleveSearchManager(forceReindex)
	if err != nil {
		return fmt.Errorf("failed to initialize search manager: %w", err)
	}

	// Initialize Bleve search manager for users
	UserSearchManager, err = search.NewBleveUserSearchManager(forceReindex)
	if err != nil {
		return fmt.Errorf("failed to initialize user search manager: %w", err)
	}

	// Initialize indexer for dishes
	Indexer = search.NewIndexer(DBManager, SearchManager, 100)

	// If forceReindex is true, rebuild the indices
	if forceReindex {
		log.Println("Rebuilding search indices...")

		// Index dishes
		if err := Indexer.IndexAllDishes(); err != nil {
			return fmt.Errorf("failed to index dishes: %w", err)
		}

		// Index users
		if err := IndexAllUsers(); err != nil {
			return fmt.Errorf("failed to index users: %w", err)
		}

		log.Println("Search indices rebuild complete")
	}

	return nil
}

// IndexAllUsers indexes all users in the user search index
func IndexAllUsers() error {
	// Get all users from database
	users, err := DBManager.GetAllUsers()
	if err != nil {
		return fmt.Errorf("failed to get users from database: %w", err)
	}

	// Convert to user documents
	var userDocs []search.UserDocument
	for _, user := range users {
		userDocs = append(userDocs, search.UserToDocument(user))
	}

	// Batch index all users
	if err := UserSearchManager.BatchIndexUsers(userDocs); err != nil {
		return fmt.Errorf("failed to batch index users: %w", err)
	}

	log.Printf("Indexed %d users", len(userDocs))
	return nil
}

func main() {
	// Parse command line flags
	reindexFlag := flag.Bool("reindex", false, "Rebuild the search index")
	flag.Parse()

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

	// Initialize search system
	forceReindex := *reindexFlag
	err = InitializeSearch(forceReindex)
	if err != nil {
		log.Fatalln("Failed to initialize search system", err)
		return
	}

	// Fetch and ingest data if needed
	err = ingest.FetchAndIngest(DBManager)
	if err != nil {
		fmt.Printf("ERR WITH SCRAPER: %v\n", err)
	}

	err = InitializeRouter()
	if err != nil {
		log.Fatalln("Failed to initialize Gin router")
		return
	}
}
