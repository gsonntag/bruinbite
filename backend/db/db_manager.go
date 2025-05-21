package db

import (
	"fmt"
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
		FirstOrCreate(&queryDish, models.Dish{
			Location:     &location,
			LastSeenDate: today,
		})

	if err := result.Error; err != nil {
		return models.Dish{}, err
	}

	// If it already existed (RowsAffected == 0), update its last seen date
	if result.RowsAffected == 0 {
		queryDish.LastSeenDate = today
		if err := m.DB.
			Model(&queryDish).
			Select("Location", "LastSeenDate").
			Updates(queryDish).
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
		fmt.Print(err)
		return nil, err
	}
	return dishes, nil
}

// CreateRating creates a new rating for a dish
func (m *DBManager) CreateRating(rating *models.Rating) error {
	return m.DB.Create(rating).Error
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
