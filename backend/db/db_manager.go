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