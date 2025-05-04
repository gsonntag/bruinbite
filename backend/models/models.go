package models

import (
	"time"

	"gorm.io/gorm"
)

type User struct {
	gorm.Model              // includes ID, created at, modified at, etc
	Username       string   `gorm:"type:text;unique;not null" json:"username"`
	HashedPassword string   `gorm:"type:text;not null" json:"-"`
	Email          string   `gorm:"type:text;unique;not null" json:"email"`
	IsAdmin        bool     `gorm:"not null;default:false" json:"is_admin"`
	Ratings        []Rating `gorm:"foreignKey:UserID" json:"ratings,omitempty"`
}

type DiningHall struct {
	ID       uint    `gorm:"primaryKey;autoIncrement" json:"id"`
	Name     string  `gorm:"type:text;not null" json:"name"`
	Location *string `gorm:"type:text" json:"location,omitempty"`
	Dishes   []Dish  `gorm:"foreignKey:HallID" json:"dishes,omitempty"`
	Menus    []Menu  `gorm:"foreignKey:HallID" json:"menus,omitempty"`
}

type Dish struct {
	ID            uint       `gorm:"primaryKey;autoIncrement" json:"id"`
	HallID        uint       `gorm:"not null;index" json:"hall_id"`
	Hall          DiningHall `gorm:"foreignKey:HallID" json:"hall"`
	Name          string     `gorm:"type:text;not null" json:"name"`
	Description   *string    `gorm:"type:text" json:"description,omitempty"`
	AverageRating float64    `gorm:"type:numeric(7,5);not null;default:0.00000" json:"average_rating"`
	Tags          []string   `gorm:"type:text[];not null;default:'{}'" json:"tags"`
	Ratings       []Rating   `gorm:"foreignKey:DishID" json:"ratings,omitempty"`
}

type Menu struct {
	ID         uint       `gorm:"primaryKey;autoIncrement" json:"id"`
	HallID     uint       `gorm:"not null;index" json:"hall_id"`
	Hall       DiningHall `gorm:"foreignKey:HallID" json:"hall"`
	Date       time.Time  `gorm:"type:date;not null" json:"date"`
	MealPeriod string     `gorm:"type:text;not null" json:"meal_period"`
}

type Rating struct {
	ID        uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	UserID    uint      `gorm:"not null;index" json:"user_id"`
	User      User      `gorm:"foreignKey:UserID" json:"user"`
	DishID    uint      `gorm:"not null;index" json:"dish_id"`
	Dish      Dish      `gorm:"foreignKey:DishID" json:"dish"`
	Score     int16     `gorm:"type:smallint;not null;check:score >= 0 AND score <= 10" json:"score"`
	Comment   *string   `gorm:"type:text" json:"comment,omitempty"`
	CreatedAt time.Time `gorm:"type:timestamp with time zone;not null;default:now()" json:"created_at"`
}
