package models

import (
	"time"

	"github.com/lib/pq"
	"gorm.io/gorm"
)

// Date is a struct that doesn't require all the information of time.Time
// (so we don't have to normalize the time when performing database searches)
type Date struct {
	Day        int     `gorm:"column:day;not null" json:"day"`
	Month      int     `gorm:"column:month;not null" json:"month"`
	Year       int     `gorm:"column:year;not null" json:"year"`
	MealPeriod *string `gorm:"column:meal_period;type:text" json:"meal_period,omitempty"`
}

// Used to track when the scraper has last fully run, but also has additional capability
// since it stores a key so it could be used for other things if they need date tracking
// Embedded means that GORM will create columns like "last_run_at_day", "last_run_at_meal_period" etc
type UpdateTracker struct {
	gorm.Model
	Key       string `gorm:"primaryKey;column:key" json:"key"`
	LastRunAt Date   `gorm:"embedded;embeddedPrefix:last_run_at_" json:"last_run_at"`
}

// Mapping from `mealPeriod` string to ordinal value
func mealPeriodRank(p *string) int {
	if p == nil {
		return 0
	}
	switch *p {
	case "BREAKFAST":
		return 1
	case "LUNCH":
		return 2
	case "DINNER":
		return 3
	default:
		return 0
	}
}

// Will return true if the LastRunAt param is after the input
func (u *UpdateTracker) IsEqualOrAfter(date Date) bool {
	if u.LastRunAt.Year != date.Year {
		return u.LastRunAt.Year > date.Year
	}

	if u.LastRunAt.Month != date.Month {
		return u.LastRunAt.Month > date.Month
	}

	if u.LastRunAt.Day != date.Day {
		return u.LastRunAt.Day > date.Day
	}

	return mealPeriodRank(u.LastRunAt.MealPeriod) >= mealPeriodRank(date.MealPeriod)
}

type User struct {
	gorm.Model              // includes ID, created at, modified at, etc
	Username       string   `gorm:"type:text;unique;not null" json:"username"`
	HashedPassword string   `gorm:"type:text;not null" json:"-"`
	Email          string   `gorm:"type:text;unique;not null" json:"email"`
	IsAdmin        bool     `gorm:"not null;default:false" json:"is_admin"`
	Ratings        []Rating `gorm:"foreignKey:UserID" json:"ratings,omitempty"`
	FriendRequestsSent []FriendRequest `gorm:"foreignKey:FromID" json:"friend_requests_sent,omitempty"` // requests sent by this user
	FriendRequestsReceived []FriendRequest `gorm:"foreignKey:ToID" json:"friend_requests_received,omitempty"` // requests received by this user
}

// Friendship represents a friendship between two users
type Friendship struct {
	ID        uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	UserID    uint      `gorm:"not null;index" json:"user_id"`   // the user who sent the friend request
	FriendID  uint      `gorm:"not null;index" json:"friend_id"` // the user who received the friend request
	CreatedAt time.Time `gorm:"type:timestamp with time zone;not null;default:now()" json:"created_at"`
}

// FriendRequest represents a friend request sent from one user to another
type FriendRequest struct {
	ID        uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	FromID    uint      `gorm:"not null;index" json:"from_id"` // the user who sent the friend request
	ToID      uint      `gorm:"not null;index" json:"to_id"`   // the user who received the friend request
	CreatedAt time.Time `gorm:"type:timestamp with time zone;not null;default:now()" json:"created_at"`
	Status    string    `gorm:"type:text;not null;default:'pending'" json:"status"` // e.g. "pending", "accepted", "declined"
	FromUser  User      `gorm:"foreignKey:FromID" json:"from_user,omitempty"`       // the user who sent the request
	ToUser    User      `gorm:"foreignKey:ToID" json:"to_user,omitempty"`           // the user who received the request
}

type DiningHall struct {
	ID       uint    `gorm:"primaryKey;autoIncrement" json:"id"`
	Name     string  `gorm:"type:text;not null" json:"name"`
	Location *string `gorm:"type:text" json:"location,omitempty"`
	Dishes   []Dish  `gorm:"foreignKey:HallID" json:"dishes,omitempty"`
	Menus    []Menu  `gorm:"foreignKey:HallID" json:"menus,omitempty"`
}

type Dish struct {
	ID            uint           `gorm:"primaryKey;autoIncrement" json:"id"`
	HallID        uint           `gorm:"not null;index:idx_dish_hall_name,unique" json:"hall_id"`
	Hall          DiningHall     `gorm:"foreignKey:HallID" json:"-"`
	Name          string         `gorm:"type:text;not null;index:idx_dish_hall_name,unique" json:"name"`
	Description   *string        `gorm:"type:text" json:"description,omitempty"`
	AverageRating float64        `gorm:"type:numeric(7,5);not null;default:0.00000" json:"average_rating"`
	Tags          pq.StringArray `gorm:"type:text[];not null;default:'{}'" json:"tags"`
	Location      *string        `gorm:"type:text" json:"location,omitempty"`
	LastSeenDate  Date           `gorm:"embedded;embeddedPrefix:last_seen_date_" json:"last_seen_date"` // see explanation of embedded above
	Ratings       []Rating       `gorm:"foreignKey:DishID" json:"ratings,omitempty"`
}

type Menu struct {
	ID     uint       `gorm:"primaryKey;autoIncrement" json:"id"`
	HallID uint       `gorm:"not null;index" json:"hall_id"`
	Hall   DiningHall `gorm:"foreignKey:HallID" json:"hall"`
	Date   Date       `gorm:"embedded;embeddedPrefix:date_" json:"date"`     // includes meal period
	Dishes []Dish     `gorm:"many2many:menu_dishes" json:"dishes,omitempty"` // many 2 many: used when you need a subset of the dishes offered in a hall
}

type Rating struct {
	ID        uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	UserID    uint      `gorm:"not null;index" json:"user_id"`
	User      User      `gorm:"foreignKey:UserID" json:"user"`
	DishID    uint      `gorm:"not null;index" json:"dish_id"`
	Dish      Dish      `gorm:"foreignKey:DishID" json:"dish"`
	Score     int16     `gorm:"type:smallint;not null;check:score >= 0 AND score <= 5" json:"score"`
	Comment   *string   `gorm:"type:text" json:"comment,omitempty"`
	CreatedAt time.Time `gorm:"type:timestamp with time zone;not null;default:now()" json:"created_at"`
}
