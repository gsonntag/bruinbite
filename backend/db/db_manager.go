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