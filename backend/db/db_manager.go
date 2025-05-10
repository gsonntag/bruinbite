package db

import (
	"github.com/gsonntag/bruinbite/models"
	"gorm.io/gorm"
)

type DBManager struct {
	DB *gorm.DB
}

func NewDBManager(db *gorm.DB) *DBManager {
	return &DBManager{DB: db}
}

// Use GORM to automatically migrate our models if there are any changes to them
func (m *DBManager) Migrate() error {
	return m.DB.AutoMigrate(
		&models.User{},
		&models.DiningHall{},
		&models.Dish{},
		&models.Menu{},
		&models.Rating{},
	)
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

	err = m.DB.Where("hall_id=?", hall.ID).Find(&dishes).Error
	if err != nil {
		return nil, err
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