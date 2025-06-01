package search

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/blevesearch/bleve/v2"
	"github.com/blevesearch/bleve/v2/analysis/analyzer/custom"
	"github.com/blevesearch/bleve/v2/analysis/analyzer/standard"
	"github.com/blevesearch/bleve/v2/analysis/token/lowercase"
	"github.com/blevesearch/bleve/v2/analysis/token/porter"
	"github.com/blevesearch/bleve/v2/analysis/tokenizer/unicode"
	"github.com/blevesearch/bleve/v2/mapping"
	"github.com/blevesearch/bleve/v2/search/query"

	"github.com/gsonntag/bruinbite/models"
)

const (
	IndexPath = "./bleve_index"
)

// DishDocument represents a document in the Bleve index
type DishDocument struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	HallID      uint      `json:"hall_id"`
	HallName    string    `json:"hall_name"`
	Location    string    `json:"location"`
	LastSeen    time.Time `json:"last_seen"`
}

// Convert dish model to dish document
func DishToDocument(dish models.Dish, hallName string) DishDocument {
	// Default description, location if empty
	description := "No description available"
	location := "Unknown"
	
	if dish.Description != nil && *dish.Description != "" {
		description = *dish.Description
	}
	
	if dish.Location != nil && *dish.Location != "" {
		location = *dish.Location
	}

	// Convert the Date struct to time.Time
	lastSeen := time.Date(
		dish.LastSeenDate.Year,
		time.Month(dish.LastSeenDate.Month),
		dish.LastSeenDate.Day,
		0, 0, 0, 0,
		time.Local,
	)

	return DishDocument{
		ID:          fmt.Sprintf("%d", dish.ID),
		Name:        dish.Name,
		Description: description,
		HallID:      dish.HallID,
		HallName:    hallName,
		Location:    location,
		LastSeen:    lastSeen,
	}
}

// BleveSearchManager handles Bleve index operations
type BleveSearchManager struct {
	index bleve.Index
}

// NewBleveSearchManager creates a new Bleve search manager
func NewBleveSearchManager(forceReindex bool) (*BleveSearchManager, error) {
	var index bleve.Index

	// Create index directory if it doesn't exist
	if err := os.MkdirAll(filepath.Dir(IndexPath), 0755); err != nil {
		return nil, fmt.Errorf("error creating index directory: %w", err)
	}

	// Check if index exists and we're not forcing reindex
	if _, err := os.Stat(IndexPath); os.IsNotExist(err) || forceReindex {
		// Create a new index with custom mapping
		indexMapping, err := buildIndexMapping()
		if err != nil {
			return nil, fmt.Errorf("error building index mapping: %w", err)
		}

		if forceReindex && !os.IsNotExist(err) {
			// Remove existing index
			if err := os.RemoveAll(IndexPath); err != nil {
				return nil, fmt.Errorf("error removing existing index: %w", err)
			}
		}

		// Create new index
		index, err = bleve.New(IndexPath, indexMapping)
		if err != nil {
			return nil, fmt.Errorf("error creating new index: %w", err)
		}
	} else {
		// Open existing index
		index, err = bleve.Open(IndexPath)
		if err != nil {
			return nil, fmt.Errorf("error opening existing index: %w", err)
		}
	}

	return &BleveSearchManager{
		index: index,
	}, nil
}

// buildIndexMapping creates a custom index mapping with specific analyzers
func buildIndexMapping() (mapping.IndexMapping, error) {
	// Create a new index mapping
	indexMapping := bleve.NewIndexMapping()

	// Create a custom analyzer for dish descriptions with stemming
	err := indexMapping.AddCustomAnalyzer("description_analyzer", map[string]interface{}{
		"type":      custom.Name,
		"tokenizer": unicode.Name,
		"token_filters": []string{
			lowercase.Name,
			porter.Name,
		},
	})
	if err != nil {
		return nil, err
	}

	// Create document mapping for dishes
	dishMapping := bleve.NewDocumentMapping()

	// Field mappings - use standard analyzer for name field for now
	nameFieldMapping := bleve.NewTextFieldMapping()
	nameFieldMapping.Analyzer = standard.Name
	dishMapping.AddFieldMappingsAt("name", nameFieldMapping)

	descriptionFieldMapping := bleve.NewTextFieldMapping()
	descriptionFieldMapping.Analyzer = "description_analyzer"
	dishMapping.AddFieldMappingsAt("description", descriptionFieldMapping)

	hallNameFieldMapping := bleve.NewTextFieldMapping()
	hallNameFieldMapping.Analyzer = standard.Name
	dishMapping.AddFieldMappingsAt("hall_name", hallNameFieldMapping)

	locationFieldMapping := bleve.NewTextFieldMapping()
	locationFieldMapping.Analyzer = standard.Name
	dishMapping.AddFieldMappingsAt("location", locationFieldMapping)

	// Add document mapping to index
	indexMapping.AddDocumentMapping("dish", dishMapping)
	indexMapping.DefaultAnalyzer = standard.Name

	return indexMapping, nil
}

// Close closes the Bleve index
func (m *BleveSearchManager) Close() error {
	return m.index.Close()
}

// IndexDish indexes a single dish document
func (m *BleveSearchManager) IndexDish(doc DishDocument) error {
	return m.index.Index(doc.ID, doc)
}

// BatchIndexDishes indexes multiple dish documents
func (m *BleveSearchManager) BatchIndexDishes(docs []DishDocument) error {
	batch := m.index.NewBatch()
	for _, doc := range docs {
		batch.Index(doc.ID, doc)
	}
	return m.index.Batch(batch)
}

// DeleteDish removes a dish from the index
func (m *BleveSearchManager) DeleteDish(id string) error {
	return m.index.Delete(id)
}

// SearchDishes searches for dishes matching the query
func (m *BleveSearchManager) SearchDishes(queryString string, hallFilter string, limit int) ([]DishDocument, error) {
	// Clean query string
	queryString = strings.TrimSpace(queryString)
	if queryString == "" {
		return nil, fmt.Errorf("empty query string")
	}
	
	var finalQuery query.Query

	// Create a match query for dish name with fuzzy matching
	nameQuery := bleve.NewMatchQuery(queryString)
	nameQuery.SetField("name")
	nameQuery.SetFuzziness(1) // Allow 1 typo/edit distance

	// Create a match query for dish description
	descQuery := bleve.NewMatchQuery(queryString)
	descQuery.SetField("description")

	// Combine queries with disjunction (OR)
	queryDisjunction := bleve.NewDisjunctionQuery(nameQuery, descQuery)
	
	// If hall filter is provided, add a match query for hall
	if hallFilter != "" {
		hallQuery := bleve.NewMatchQuery(hallFilter)
		hallQuery.SetField("hall_name")
		
		// Combine with conjunction (AND)
		finalQuery = bleve.NewConjunctionQuery(queryDisjunction, hallQuery)
	} else {
		finalQuery = queryDisjunction
	}

	// Create search request
	searchRequest := bleve.NewSearchRequest(finalQuery)
	searchRequest.Size = limit
	searchRequest.Fields = []string{"*"} // Retrieve all fields
	
	// Sort by relevance (default)
	searchRequest.SortBy([]string{"-_score"})

	// Execute search
	searchResults, err := m.index.Search(searchRequest)
	if err != nil {
		return nil, err
	}

	// Convert search results to dish documents
	dishes := make([]DishDocument, 0, len(searchResults.Hits))
	for _, hit := range searchResults.Hits {
		var dish DishDocument
		
		// Extract fields
		dish.ID = hit.ID
		
		if name, ok := hit.Fields["name"].(string); ok {
			dish.Name = name
		}
		
		if description, ok := hit.Fields["description"].(string); ok {
			dish.Description = description
		}
		
		if hallID, ok := hit.Fields["hall_id"].(float64); ok {
			dish.HallID = uint(hallID)
		}
		
		if hallName, ok := hit.Fields["hall_name"].(string); ok {
			dish.HallName = hallName
		}
		
		if location, ok := hit.Fields["location"].(string); ok {
			dish.Location = location
		}
		
		dishes = append(dishes, dish)
	}

	return dishes, nil
}

// Count returns the number of documents in the index
func (m *BleveSearchManager) Count() (uint64, error) {
	return m.index.DocCount()
}

// ReindexAll completely rebuilds the index with the provided dishes
func (m *BleveSearchManager) ReindexAll(docs []DishDocument) error {
	// Close and remove existing index
	if err := m.index.Close(); err != nil {
		return err
	}
	
	if err := os.RemoveAll(IndexPath); err != nil {
		return err
	}
	
	// Create new index
	indexMapping, err := buildIndexMapping()
	if err != nil {
		return err
	}
	
	index, err := bleve.New(IndexPath, indexMapping)
	if err != nil {
		return err
	}
	
	m.index = index
	
	// Batch index all documents
	return m.BatchIndexDishes(docs)
}

// UpdateDishIndex updates a dish in the index
func (m *BleveSearchManager) UpdateDish(doc DishDocument) error {
	// Delete and re-index
	if err := m.index.Delete(doc.ID); err != nil {
		// Ignore not found errors
		if !strings.Contains(err.Error(), "not found") {
			return err
		}
	}
	
	return m.index.Index(doc.ID, doc)
}

// SynonymMap provides synonyms for food terms
var SynonymMap = map[string][]string{
	"marinara":     {"tomato sauce", "red sauce"},
	"tomato sauce": {"marinara", "red sauce"},
	"pizza":        {"flatbread"},
	"pasta":        {"noodles", "spaghetti", "fettuccine", "linguine", "penne"},
	"burger":       {"hamburger", "cheeseburger", "sandwich"},
	"fries":        {"french fries", "potato"},
	"chicken":      {"poultry"},
	"beef":         {"steak", "meat"},
	"vegetable":    {"veggie", "greens"},
	"salad":        {"greens", "lettuce"},
}
