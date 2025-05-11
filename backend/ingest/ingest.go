package ingest

import (
	"encoding/json"
	"fmt"
	"os/exec"
	"time"
)

// This is the JSON structure that the scraper provides.
// It is: hall -> meal period (breakfast, lunch, dinner) -> category (different areas of the dining halls) -> array of item names
type MenuData map[string]map[string]map[string][]string

func GetToday() (*time.Time, error) {
	// Base time off Pacific time, so that each menu is unique by day.
	loc, err := time.LoadLocation("America/Los Angeles")

	if err != nil {
		return nil, fmt.Errorf("Could not load Pacific timezone: %w", err)
	}

	now := time.Now().In(loc)
	date := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, loc)
	return &date, nil
}

func FetchAndIngest() error {
	fmt.Println("Scraping website for latest menus...")
	start := time.Now()
	cmd := exec.Command("scraper/.venv/bin/python3", "scraper/scraper.py")
	out, err := cmd.Output()
	elapsed := time.Since(start)
	fmt.Printf("Finished scraping (%s)\n", elapsed)

	if err != nil {
		return fmt.Errorf("scraper failed: %w\noutput:\n%s", err, out)
	}

	var topLevel MenuData
	if err := json.Unmarshal(out, &topLevel); err != nil {
		return fmt.Errorf("invalid json from scraper: %w", err)
	}

	//today := GetToday()

	for hall, mealPeriods := range topLevel {
		for mealPeriod, locations := range mealPeriods {
			for location, items := range locations {
				for _, name := range items {
					fmt.Printf("item: %s, hall: %s, meal period: %s, location: %s\n", name, hall, mealPeriod, location)
				}
			}
		}
	}
	return nil
}
