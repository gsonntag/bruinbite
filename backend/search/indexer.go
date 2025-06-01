package search

import (
	"fmt"
	"log"

	"github.com/gsonntag/bruinbite/db"
	"github.com/gsonntag/bruinbite/models"
)

// Indexer provides functionality to index dishes from the database
type Indexer struct {
	dbManager *db.DBManager
	search    *BleveSearchManager
	batchSize int
}

// NewIndexer creates a new indexer
func NewIndexer(dbManager *db.DBManager, search *BleveSearchManager, batchSize int) *Indexer {
	if batchSize <= 0 {
		batchSize = 100 // Default batch size
	}
	
	return &Indexer{
		dbManager: dbManager,
		search:    search,
		batchSize: batchSize,
	}
}

// IndexAllDishes indexes all dishes from the database
func (i *Indexer) IndexAllDishes() error {
	// Get all dishes from the database
	dishes, err := i.dbManager.GetAllDishes()
	if err != nil {
		return fmt.Errorf("error fetching dishes: %w", err)
	}

	log.Printf("Indexing %d dishes...\n", len(dishes))

	// Create batch of dish documents
	var batch []DishDocument
	hallNameCache := make(map[uint]string) // Cache to avoid repeated hall lookups

	for _, dish := range dishes {
		// Get hall name from cache or database
		hallName, ok := hallNameCache[dish.HallID]
		if !ok {
			hall, err := i.dbManager.GetHallByID(dish.HallID)
			if err != nil {
				log.Printf("Warning: couldn't find hall for dish %s (ID: %d): %v", dish.Name, dish.ID, err)
				hallName = "Unknown Hall"
			} else {
				hallName = hall.Name
				hallNameCache[dish.HallID] = hallName
			}
		}

		// Convert dish to document
		doc := DishToDocument(dish, hallName)
		batch = append(batch, doc)

		// Index in batches
		if len(batch) >= i.batchSize {
			if err := i.search.BatchIndexDishes(batch); err != nil {
				return fmt.Errorf("error batch indexing dishes: %w", err)
			}
			log.Printf("Indexed batch of %d dishes\n", len(batch))
			batch = batch[:0] // Clear batch
		}
	}

	// Index remaining dishes
	if len(batch) > 0 {
		if err := i.search.BatchIndexDishes(batch); err != nil {
			return fmt.Errorf("error batch indexing remaining dishes: %w", err)
		}
		log.Printf("Indexed final batch of %d dishes\n", len(batch))
	}

	log.Printf("Successfully indexed all %d dishes\n", len(dishes))
	return nil
}

// ReindexAll rebuilds the entire index
func (i *Indexer) ReindexAll() error {
	log.Println("Starting full reindex...")
	
	// Get all dishes from the database
	dishes, err := i.dbManager.GetAllDishes()
	if err != nil {
		return fmt.Errorf("error fetching dishes: %w", err)
	}

	log.Printf("Found %d dishes to reindex\n", len(dishes))

	// Create dish documents
	var docs []DishDocument
	hallNameCache := make(map[uint]string) // Cache to avoid repeated hall lookups

	for _, dish := range dishes {
		// Get hall name from cache or database
		hallName, ok := hallNameCache[dish.HallID]
		if !ok {
			hall, err := i.dbManager.GetHallByID(dish.HallID)
			if err != nil {
				log.Printf("Warning: couldn't find hall for dish %s (ID: %d): %v", dish.Name, dish.ID, err)
				hallName = "Unknown Hall"
			} else {
				hallName = hall.Name
				hallNameCache[dish.HallID] = hallName
			}
		}

		// Convert dish to document
		doc := DishToDocument(dish, hallName)
		docs = append(docs, doc)
	}

	// Rebuild index with all documents
	if err := i.search.ReindexAll(docs); err != nil {
		return fmt.Errorf("error rebuilding index: %w", err)
	}

	count, err := i.search.Count()
	if err != nil {
		log.Printf("Warning: couldn't count documents in index: %v", err)
	} else {
		log.Printf("Successfully reindexed %d dishes\n", count)
	}

	return nil
}

// IndexNewDish indexes a newly created dish
func (i *Indexer) IndexNewDish(dish models.Dish) error {
	// Get hall name
	hall, err := i.dbManager.GetHallByID(dish.HallID)
	if err != nil {
		return fmt.Errorf("error getting hall for dish: %w", err)
	}

	// Convert dish to document
	doc := DishToDocument(dish, hall.Name)
	
	// Index document
	return i.search.IndexDish(doc)
}

// UpdateDishIndex updates a dish in the index
func (i *Indexer) UpdateDishIndex(dish models.Dish) error {
	// Get hall name
	hall, err := i.dbManager.GetHallByID(dish.HallID)
	if err != nil {
		return fmt.Errorf("error getting hall for dish: %w", err)
	}

	// Convert dish to document
	doc := DishToDocument(dish, hall.Name)
	
	// Update document in index
	return i.search.UpdateDish(doc)
}

// DeleteDishFromIndex removes a dish from the index
func (i *Indexer) DeleteDishFromIndex(dishID uint) error {
	return i.search.DeleteDish(fmt.Sprintf("%d", dishID))
}
