package ingest

import (
	"encoding/json"
	"fmt"
	"os/exec"
	"time"

	"github.com/gsonntag/bruinbite/db"
	"github.com/gsonntag/bruinbite/models"
)

// This is the JSON structure that the scraper provides.
// It is: hall -> meal period (breakfast, lunch, dinner) -> category (different areas of the dining halls) -> array of item names
type MenuData map[string]map[string]map[string][]string

// Returns a models.Date object with no meal period defined
func GetToday() (*models.Date, error) {
	// Base time off Pacific time, so that each menu is unique by day.
	loc, err := time.LoadLocation("America/Los_Angeles")

	if err != nil {
		return nil, fmt.Errorf("Could not load Pacific timezone: %w", err)
	}

	now := time.Now().In(loc)
	dinner := "DINNER"
	date := models.Date{Day: now.Day(), Month: int(now.Month()), Year: now.Year(), MealPeriod: &dinner}
	return &date, nil
}

func FetchAndIngest(mgr *db.DBManager) error {
	fmt.Println("Scraping website for latest menus...")
	start := time.Now()
	today, err := GetToday()
	if err != nil {
		return err
	}

	loaded, err := mgr.HasScraperLoaded(*today)
	if err != nil {
		return err
	}
	if loaded {
		elapsed := time.Since(start)
		fmt.Printf("Already scraped today (%s)\n", elapsed)
		return nil
	}

	cmd := exec.Command("scraper/.venv/bin/python3", "scraper/scraper.py")
	out, err := cmd.Output()
	if err != nil {
		return fmt.Errorf("scraper failed: %w\noutput:\n%s", err, out)
	}
	
	elapsed := time.Since(start)
	fmt.Printf("Finished scraping (%s)\n", elapsed)

	var topLevel MenuData
	if err := json.Unmarshal(out, &topLevel); err != nil {
		return fmt.Errorf("invalid json from scraper: %w", err)
	}

	for hallName, mealPeriods := range topLevel {

		// Create hall if it doesn't exist
		hall, err := mgr.CreateNewHall(hallName)
		if err != nil {
			return err
		}

		for mealPeriod, locations := range mealPeriods {

			// Check if menu has previously been loaded
			today.MealPeriod = &mealPeriod
			loaded, err := mgr.HasScraperLoaded(*today)
			if err != nil {
				return err
			}

			if loaded {
				// If scraper has already run, we are assuming that
				// it has loaded all dining halls, so we don't have
				// to check every dining hall again. (why we return,
				// not break or continue or something else)
				fmt.Print("[DEBUG] Scraper already ran for this period.\n")
				return nil
			}

			menu := models.Menu{Date: *today, HallID: hall.ID, Dishes: []models.Dish{}}

			for hallSubcategory, items := range locations { // hallSubcategory represents the location within the dining hall
				for _, name := range items {

					// Check if dish exists
					dish, err := mgr.GetOrCreateDishByName(name, hall.ID, hallSubcategory, *today)
					if err != nil {
						return err
					}
					//fmt.Printf("[DEBUG] Created dish %s in hall %s.\n", dish.Name, hallName)
					menu.Dishes = append(menu.Dishes, dish)
				}
			}
			err = mgr.AddMenu(&menu)
			if err != nil {
				return err
			}
			fmt.Printf("[DEBUG] Inserted %s menu (meal period %s) into DB.\n", hallName, *menu.Date.MealPeriod)
		}
	}

	mgr.SetScraperLastRan(*today)
	fmt.Printf("[DEBUG] Finished. Set scraper last ran to now (%d/%d/%d %s).\n", today.Month, today.Day, today.Year, *today.MealPeriod)
	return nil
}
