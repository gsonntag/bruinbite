package db

import (
	"errors"
	"fmt"
	"log"
	"math"
	"regexp"
	"time"

	"github.com/gsonntag/bruinbite/models"
	"gorm.io/gorm"
)

type DBManager struct {
	DB *gorm.DB
	TZ *time.Location
}

func NewDBManager(db *gorm.DB) (*DBManager, error) {
	loc, err := time.LoadLocation("America/Los_Angeles")
	if err != nil {
		return nil, fmt.Errorf("Could not load Pacific timezone: %w", err)
	}
	return &DBManager{DB: db, TZ: loc}, nil
}

// Use GORM to automatically migrate our models if there are any changes to them
func (m *DBManager) Migrate() error {

	return m.DB.AutoMigrate(
		&models.UpdateTracker{},
		&models.User{},
		&models.DiningHall{},
		&models.Dish{},
		&models.Menu{},
		&models.Rating{},
		&models.Friendship{},
		&models.FriendRequest{},
	)
}

// Returns true if the scraper has previously fully
// loaded the menu for a specific meal period
func (m *DBManager) HasScraperLoaded(date models.Date) (bool, error) {
	var tracker models.UpdateTracker
	result := m.DB.Where("key = ?", "scraper").Find(&tracker)

	if result.Error != nil {
		return false, result.Error
	}

	if result.RowsAffected == 0 {
		return false, nil
	}

	return tracker.IsEqualOrAfter(date), nil
}

// Should only be called when the scraper has fully
// ran successfully for a given meal period.
func (m *DBManager) SetScraperLastRan(date models.Date) error {
	*date.MealPeriod = "DINNER"
	var tracker models.UpdateTracker
	result := m.DB.Where("key = ?", "scraper").Find(&tracker)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		tracker = models.UpdateTracker{
			Key:       "scraper",
			LastRunAt: date,
		}
		return m.DB.Create(&tracker).Error
	}

	if tracker.IsEqualOrAfter(date) {
		return nil
	}

	tracker.LastRunAt = date
	return m.DB.Save(&tracker).Error
}

// CreateNewHall creates a new hall if a hall of that name does not already
// exist. It returns an error if the hall was unable to be created. It returns
// nil if the hall already exists or if the hall was successfully created.
func (m *DBManager) CreateNewHall(name string) (models.DiningHall, error) {
	hall := models.DiningHall{Name: name}
	result := m.DB.
		Where(models.DiningHall{Name: name}).
		FirstOrCreate(&hall)

	if result.Error != nil {
		return models.DiningHall{}, result.Error
	}

	return hall, nil
}

// Returns true if the menu for this day and meal period has already been loaded into the database.
func (m *DBManager) DoesMenuExist(date time.Time, hallName string, mealPeriod string) (bool, error) {

	// Normalize date so it matches what is in our database (at midnight exactly)
	day, month, year := date.Day(), date.Month(), date.Year()
	normalizedDate := time.Date(year, month, day, 0, 0, 0, 0, m.TZ)

	// Search the database for a matching menu (same date, hall, meal period)
	var count int64
	err := m.DB.Model(&models.Menu{}).Joins("JOIN dining_halls ON dining_halls.id = menus.hall_id").
		Where("dining_halls.name = ? AND menus.date = ? AND menus.meal_period = ?", hallName, normalizedDate, mealPeriod).
		Count(&count).
		Error

	if err != nil {
		return false, err
	}

	return count > 0, nil
}

func (m *DBManager) GetOrCreateDishByName(name string, hallId uint, location string, today models.Date) (models.Dish, error) {

	// First, lookup if dish exists by parameters hall id and name
	queryDish := models.Dish{
		HallID: hallId,
		Name:   name,
	}

	// If it needs to be created, set its location
	// within the hall and last seen date accordingly
	result := m.DB.
		Where("hall_id = ? AND name = ?", hallId, name).
		Attrs(models.Dish{
			Location:     &location,
			LastSeenDate: today,
		}).
		FirstOrCreate(&queryDish)

	if err := result.Error; err != nil {
		return models.Dish{}, err
	}

	// If it already existed (RowsAffected == 0), update its last seen date
	if result.RowsAffected == 0 {
		if err := m.DB.
			Model(&queryDish).
			Updates(models.Dish{LastSeenDate: today}).
			Error; err != nil {
			return models.Dish{}, err
		}
	}

	return queryDish, nil
}

func (m *DBManager) AddMenu(menu *models.Menu) error {
	return m.DB.Create(menu).Error
}

func (m *DBManager) CreateUser(user *models.User) error {
	return m.DB.Create(user).Error
}

func (m *DBManager) GetUserByNameOrEmail(username string) (*models.User, error) {
	var user models.User
	err := m.DB.Where("username=? or email=?", username, username).First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (m *DBManager) GetUserByID(id uint) (*models.User, error) {
	var user models.User
	err := m.DB.First(&user, id).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (m *DBManager) GetAllDishesByHallID(hallID uint) ([]models.Dish, error) {
	var dishes []models.Dish
	err := m.DB.Where("id=?", hallID).Find(&dishes).Error
	if err != nil {
		return nil, err
	}
	return dishes, nil
}

func (m *DBManager) GetAllDishesByHallName(hallName string) ([]models.Dish, error) {
	var dishes []models.Dish
	// use name of hall to first find the hall ID
	var hall models.DiningHall
	err := m.DB.Where("name=?", hallName).First(&hall).Error
	// TODO: doesnt return error if cant find hall, which is odd so itll throw server error instead
	if err != nil {
		return nil, err
	}
	// use hall ID to find all dishes

	err2 := m.DB.Where("hall_id=?", hall.ID).Find(&dishes).Error
	if err2 != nil {
		return nil, err2
	}
	return dishes, nil
}

func (m *DBManager) GetAllDishes() ([]models.Dish, error) {
	var dishes []models.Dish
	err := m.DB.Find(&dishes).Error
	if err != nil {
		return nil, err
	}
	return dishes, nil
}

func (m *DBManager) GetDishesByName(name string, limit int) ([]models.Dish, error) {

	// escape regex metacharacters
	escapedName := regexp.QuoteMeta(name)
	pattern := fmt.Sprintf(`\m%s`, escapedName)

	var dishes []models.Dish
	err := m.DB.Preload("Hall").Where("name ~* ?", pattern).Limit(limit).Find(&dishes).Error
	if err != nil {
		return nil, err
	}
	return dishes, nil
}

// CreateRating creates a new rating for a dish
func (m *DBManager) CreateRating(rating *models.Rating) error {
	// update the average rating of the dish
	var dish models.Dish
	err := m.DB.First(&dish, rating.DishID).Error
	if err != nil {
		return fmt.Errorf("could not find dish with ID %d: %w", rating.DishID, err)
	}
	// Calculate new average rating
	var ratingsCount int64
	err = m.DB.Model(&models.Rating{}).Where("dish_id = ?", rating.DishID).Count(&ratingsCount).Error
	if err != nil {
		return fmt.Errorf("could not count ratings for dish with ID %d: %w", rating.DishID, err)
	}
	if ratingsCount == 0 {
		dish.AverageRating = float64(rating.Score)
	} else {
		var totalRating float64
		err = m.DB.Model(&models.Rating{}).Where("dish_id = ?", rating.DishID).Select("SUM(score)").Scan(&totalRating).Error
		if err != nil {
			return fmt.Errorf("could not sum ratings for dish with ID %d: %w", rating.DishID, err)
		}
		dish.AverageRating = (totalRating + float64(rating.Score)) / float64(ratingsCount+1)
	}
	// Save the updated dish average rating
	err = m.DB.Save(&dish).Error
	if err != nil {
		return fmt.Errorf("could not update dish average rating: %w", err)
	}
	// Create the rating
	return m.DB.Create(rating).Error
}

// RecalculateAllRatings recalculates the average ratings for all dishes
func (m *DBManager) RecalculateAllRatings() error {
	var dishes []models.Dish
	err := m.DB.Find(&dishes).Error
	if err != nil {
		return fmt.Errorf("could not retrieve dishes: %w", err)
	}

	for _, dish := range dishes {
		var totalRating float64
		var ratingsCount int64

		err = m.DB.Model(&models.Rating{}).
			Where("dish_id = ?", dish.ID).
			Count(&ratingsCount).Error
		if err != nil {
			return fmt.Errorf("could not count ratings for dish with ID %d: %w", dish.ID, err)
		}

		if ratingsCount <= 0 {
			dish.AverageRating = 0
			err = m.DB.Save(&dish).Error
			if err != nil {
				return fmt.Errorf("could not update dish average rating for dish with ID %d: %w", dish.ID, err)
			}
			continue
		}

		err = m.DB.Model(&models.Rating{}).
			Where("dish_id = ?", dish.ID).
			Select("SUM(score)").
			Scan(&totalRating).Error
		if err != nil {
			return fmt.Errorf("could not sum ratings for dish with ID %d: %w", dish.ID, err)
		}


		dish.AverageRating = totalRating / float64(ratingsCount)
		
		err = m.DB.Save(&dish).Error
		if err != nil {
			return fmt.Errorf("could not update dish average rating for dish with ID %d: %w", dish.ID, err)
		}
	}

	return nil
}

func (m *DBManager) CreateMultipleRatings(ratings []models.Rating) error {
	for _, rating := range ratings {
		err := m.CreateRating(&rating)
		if err != nil {
			return err
		}
	}
	return nil
}

func (m *DBManager) GetMenuByHallIDAndDate(hallID uint, date models.Date) (*models.Menu, error) {
	var menu models.Menu

	err := m.DB.Preload("Dishes").
		Where("hall_id = ? AND date_day = ? AND date_month = ? AND date_year = ? AND date_meal_period = ?",
			hallID,
			date.Day,
			date.Month,
			date.Year,
			date.MealPeriod).
		First(&menu).Error

	if err != nil {
		return nil, err
	}
	return &menu, nil
}

// GetAllRatingsByUserID retrieves all ratings made by a user
// preload dish and user info
func (m *DBManager) GetAllRatingsByUserID(userID uint) ([]models.Rating, error) {
	var ratings []models.Rating

	err := m.DB.Preload("Dish").Preload("User").
		Where("user_id = ?", userID).
		Find(&ratings).Error

	if err != nil {
		return nil, err
	}

	return ratings, nil
}

// GetAllRatingsByUserIDOrUsername retrieves all ratings made by a user
func (m *DBManager) GetAllRatingsByUserIDOrUsername(userID uint, username string) ([]models.Rating, error) {
	var ratings []models.Rating

	// get userID from username if provided
	if username != "" {
		var user models.User
		err := m.DB.Where("username = ?", username).First(&user).Error
		if err != nil {
			return nil, err
		}
		userID = user.ID
	}

	err := m.DB.Preload("Dish").Preload("User").
		Where("user_id = ?", userID).
		Find(&ratings).Error

	if err != nil {
		return nil, err
	}
	return ratings, nil
}

// GetAllRatingsByDishID retrieves all ratings made for a dish
func (m *DBManager) GetAllRatingsByDishID(dishID uint) ([]models.Rating, error) {
	var ratings []models.Rating

	err := m.DB.Preload("User").
		Where("dish_id = ?", dishID).
		Find(&ratings).Error

	if err != nil {
		return nil, err
	}

	return ratings, nil
}

// GetRatingsByFriends retrieves all ratings made by a user's friends
func (m *DBManager) GetRatingsByFriends(userID uint) ([]models.Rating, error) {
	var ratings []models.Rating
	// Get all friends of the user
	friends, err := m.GetFriendsByUserID(userID)
	if err != nil {
		return nil, err
	}
	// Extract friend IDs
	friendIDs := make([]uint, len(friends))
	for i, friend := range friends {
		friendIDs[i] = friend.ID
	}
	// Query ratings made by friends
	err = m.DB.Preload("Dish").Preload("User").
		Where("user_id IN (?)", friendIDs).
		Find(&ratings).Error
	if err != nil {
		return nil, err
	}
	return ratings, nil
}

func (m *DBManager) GetMenuByHallNameAndDate(hallName string, date models.Date) (*models.Menu, error) {
	var menu models.Menu

	err := m.DB.Preload("Dishes").
		Joins("JOIN dining_halls ON dining_halls.id = menus.hall_id").
		Where("dining_halls.name = ? AND date_day = ? AND date_month = ? AND date_year = ? AND date_meal_period = ?",
			hallName,
			date.Day,
			date.Month,
			date.Year,
			date.MealPeriod).
		First(&menu).Error

	if err != nil {
		return nil, err
	}

	// from a bug where this was happening
	for _, dish := range menu.Dishes {
		if math.IsNaN(dish.AverageRating) {
			dish.AverageRating = 0
			if err := m.DB.Save(&dish).Error; err != nil {
				log.Printf("failed to update dish %d", dish.ID)
			} else {
				log.Printf("Updated dish %d which had NaN rating", dish.ID)
			}
		}
	}

	return &menu, nil
}

func (m *DBManager) GetMealPeriodsForDate(hallName string, date models.Date) ([]string, error) {
	var periods []string

	err := m.DB.
		Table("menus").
		Joins("JOIN dining_halls ON dining_halls.id = menus.hall_id").
		Where(`dining_halls.name = ? AND date_day   = ? 
			   AND date_month = ? AND date_year = ?`,
			hallName, date.Day, date.Month, date.Year).
		Distinct().
		Order("date_meal_period").
		Pluck("date_meal_period", &periods).Error

	if err != nil {
		return nil, err
	}

	return periods, nil
}

// GetAllHallsWithRatings returns all dining halls with their average ratings and review counts
func (m *DBManager) GetAllHallsWithRatings() ([]map[string]interface{}, error) {
	var results []map[string]interface{}

	// Query to get halls with their average ratings and review counts
	query := `
		SELECT 
			dh.id,
			dh.name,
			dh.location,
			COALESCE(AVG(r.score), 0) as average_rating,
			COUNT(r.id) as review_count
		FROM dining_halls dh
		LEFT JOIN dishes d ON dh.id = d.hall_id
		LEFT JOIN ratings r ON d.id = r.dish_id
		GROUP BY dh.id, dh.name, dh.location
		ORDER BY dh.name
	`

	rows, err := m.DB.Raw(query).Rows()
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var id uint
		var name string
		var location *string
		var avgRating float64
		var reviewCount int64

		err := rows.Scan(&id, &name, &location, &avgRating, &reviewCount)
		if err != nil {
			return nil, err
		}

		// Round average rating to 1 decimal place
		avgRating = float64(int(avgRating*10)) / 10

		result := map[string]interface{}{
			"id":          id,
			"name":        name,
			"location":    location,
			"rating":      avgRating,
			"reviewCount": reviewCount,
		}

		results = append(results, result)
	}

	return results, nil
}

// GetFriendsByUserID retrieves all friends of a user
func (m *DBManager) GetFriendsByUserID(userID uint) ([]models.User, error) {
	var friends []models.User

	// Since friendships are stored with the lower ID first,
	// we need to query for both cases where the user could be either UserID or FriendID
	err := m.DB.Raw(`
		SELECT DISTINCT u.* FROM users u
		JOIN friendships f ON (
			(f.user_id = ? AND f.friend_id = u.id) OR
			(f.friend_id = ? AND f.user_id = u.id)
		)
		WHERE u.id != ?
	`, userID, userID, userID).Scan(&friends).Error

	if err != nil {
		return nil, err
	}

	return friends, nil
}

// GetOutgoingFriendRequestsByUserID retrieves all outgoing friend requests for a user
// gets the full user objects for the requests
func (m *DBManager) GetOutgoingFriendRequestsByUserID(userID uint) ([]models.FriendRequest, error) {
	var requests []models.FriendRequest

	// Use Preload to get the user information for the recipient of each request
	err := m.DB.Preload("ToUser").
		Where("from_id = ?", userID).
		Find(&requests).Error

	if err != nil {
		return nil, err
	}

	return requests, nil
}

// GetIncomingFriendRequestsByUserID retrieves all incoming friend requests for a user
func (m *DBManager) GetIncomingFriendRequestsByUserID(userID uint) ([]models.FriendRequest, error) {
	var requests []models.FriendRequest
	err := m.DB.Preload("FromUser").
		Where("to_id = ?", userID).
		Find(&requests).Error
	if err != nil {
		return nil, err
	}
	return requests, nil
}

// CreateFriendship creates a new friendship between two users
func (m *DBManager) CreateFriendship(userID, friendID uint) error {
	// Create a new friendship record, put lower ID first to avoid duplicates
	if userID > friendID {
		userID, friendID = friendID, userID
	}
	friendship := models.Friendship{
		UserID:   userID,
		FriendID: friendID,
	}
	return m.DB.Create(&friendship).Error
}

// SendFriendRequest sends a friend request from one user to another
func (m *DBManager) SendFriendRequest(fromID, toID uint) error {
	// Check if the friend request already exists
	var existingRequest models.FriendRequest

	// Check if a request already exists from fromID to toID
	// and from toID to fromID (to avoid duplicates in both directions)
	err := m.DB.Where("(from_id = ? AND to_id = ?) OR (from_id = ? AND to_id = ?)",
		fromID, toID, toID, fromID).
		First(&existingRequest).Error
	if err == nil {
		// If a request already exists, return an error
		return errors.New("friend request already exists")
	}

	if fromID == toID {
		return errors.New("cannot send a friend request to yourself")
	}

	request := models.FriendRequest{
		FromID: fromID,
		ToID:   toID,
		Status: "pending",
	}
	return m.DB.Create(&request).Error
}

// AcceptFriendRequest accepts a friend request
func (m *DBManager) AcceptFriendRequest(requestID uint) error {
	// get the request to find out who sent it
	var request models.FriendRequest
	if err := m.DB.First(&request, requestID).Error; err != nil {
		return fmt.Errorf("could not find friend request: %w", err)
	}

	// create a friendship between the two users
	if err := m.CreateFriendship(request.ToID, request.FromID); err != nil {
		return fmt.Errorf("could not create friendship: %w", err)
	}

	// delete the friend request
	if err := m.DB.Delete(&models.FriendRequest{}, requestID).Error; err != nil {
		return fmt.Errorf("could not delete friend request: %w", err)
	}

	return nil
}

// DeleteFriendRequest deletes a friend request by its ID
func (m *DBManager) DeleteFriendRequest(requestID uint) error {
	return m.DB.Delete(&models.FriendRequest{}, requestID).Error
}

// GetUsersByUsername searches for users by their username
func (m *DBManager) GetUsersByUsername(username string) ([]models.User, error) {
	var users []models.User
	err := m.DB.Where("username ILIKE ?", "%"+username+"%").Find(&users).Error
	if err != nil {
		return nil, err
	}
	return users, nil
}

// GetUserByUsername retrieves a user by their username
func (m *DBManager) GetUserByUsername(username string) (*models.User, error) {
	var user models.User
	err := m.DB.Where("username = ?", username).First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

// GetAllUsers retrieves all users (used for indexing)
func (m *DBManager) GetAllUsers() ([]models.User, error) {
	var users []models.User
	err := m.DB.Find(&users).Error
	if err != nil {
		return nil, err
	}
	return users, nil
}

// GetHallByID retrieves a dining hall by its ID
func (m *DBManager) GetHallByID(hallID uint) (*models.DiningHall, error) {
	var hall models.DiningHall
	err := m.DB.First(&hall, hallID).Error
	if err != nil {
		return nil, err
	}
	return &hall, nil
}

// get dish information based on ID (used for search)
func (m *DBManager) GetDishByID(dishID uint) (*models.Dish, error) {
	var dish models.Dish
	err := m.DB.Preload("Hall").First(&dish, dishID).Error
	if err != nil {
		return nil, err
	}
	return &dish, nil
}

// UpdateUserProfile updates a user's profile information
func (m *DBManager) UpdateUserProfile(userID uint, username, email string, profilePicture *string) error {
	// Create update map with the fields we want to update
	updates := map[string]interface{}{
		"username": username,
		"email":    email,
	}

	// Only update profile picture if provided
	if profilePicture != nil {
		updates["profile_picture"] = *profilePicture
	}

	// Update the user record
	result := m.DB.Model(&models.User{}).Where("id = ?", userID).Updates(updates)
	if result.Error != nil {
		return result.Error
	}

	if result.RowsAffected == 0 {
		return fmt.Errorf("user with ID %d not found", userID)
	}

	return nil
}
