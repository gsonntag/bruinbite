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
	"github.com/blevesearch/bleve/v2/analysis/tokenizer/unicode"
	"github.com/blevesearch/bleve/v2/mapping"
	"github.com/blevesearch/bleve/v2/search/query"

	"github.com/gsonntag/bruinbite/models"
)

const (
	UserIndexPath = "./user_bleve_index"
)

// UserDocument represents a user document in the Bleve index
type UserDocument struct {
	ID        string    `json:"id"`
	Username  string    `json:"username"`
	Email     string    `json:"email"`
	CreatedAt time.Time `json:"created_at"`
}

// Convert user model to user document
func UserToDocument(user models.User) UserDocument {
	return UserDocument{
		ID:        fmt.Sprintf("%d", user.ID),
		Username:  user.Username,
		Email:     user.Email,
		CreatedAt: user.CreatedAt,
	}
}

// BleveUserSearchManager handles Bleve index operations for users
type BleveUserSearchManager struct {
	index bleve.Index
}

// NewBleveUserSearchManager creates a new Bleve user search manager
func NewBleveUserSearchManager(forceReindex bool) (*BleveUserSearchManager, error) {
	var index bleve.Index

	// Create index directory if it doesn't exist
	if err := os.MkdirAll(filepath.Dir(UserIndexPath), 0755); err != nil {
		return nil, fmt.Errorf("error creating user index directory: %w", err)
	}

	// Check if index exists and we're not forcing reindex
	if _, err := os.Stat(UserIndexPath); os.IsNotExist(err) || forceReindex {
		// Create a new index with custom mapping
		indexMapping, err := buildUserIndexMapping()
		if err != nil {
			return nil, fmt.Errorf("error building user index mapping: %w", err)
		}

		if forceReindex && !os.IsNotExist(err) {
			// Remove existing index
			if err := os.RemoveAll(UserIndexPath); err != nil {
				return nil, fmt.Errorf("error removing existing user index: %w", err)
			}
		}

		// Create new index
		index, err = bleve.New(UserIndexPath, indexMapping)
		if err != nil {
			return nil, fmt.Errorf("error creating new user index: %w", err)
		}
	} else {
		// Open existing index
		index, err = bleve.Open(UserIndexPath)
		if err != nil {
			return nil, fmt.Errorf("error opening existing user index: %w", err)
		}
	}

	return &BleveUserSearchManager{
		index: index,
	}, nil
}

// buildUserIndexMapping creates a custom index mapping for users
func buildUserIndexMapping() (mapping.IndexMapping, error) {
	// Create a new index mapping
	indexMapping := bleve.NewIndexMapping()

	// Create a custom analyzer for usernames with better partial matching
	err := indexMapping.AddCustomAnalyzer("username_analyzer", map[string]interface{}{
		"type":      custom.Name,
		"tokenizer": unicode.Name,
		"token_filters": []string{
			lowercase.Name,
		},
	})
	if err != nil {
		return nil, err
	}

	// Create document mapping for users
	userMapping := bleve.NewDocumentMapping()

	// Field mappings
	usernameFieldMapping := bleve.NewTextFieldMapping()
	usernameFieldMapping.Analyzer = "username_analyzer"
	userMapping.AddFieldMappingsAt("username", usernameFieldMapping)

	emailFieldMapping := bleve.NewTextFieldMapping()
	emailFieldMapping.Analyzer = standard.Name
	userMapping.AddFieldMappingsAt("email", emailFieldMapping)

	// Add document mapping to index
	indexMapping.AddDocumentMapping("user", userMapping)
	indexMapping.DefaultAnalyzer = standard.Name

	return indexMapping, nil
}

// Close closes the Bleve user index
func (m *BleveUserSearchManager) Close() error {
	return m.index.Close()
}

// IndexUser indexes a single user document
func (m *BleveUserSearchManager) IndexUser(doc UserDocument) error {
	return m.index.Index(doc.ID, doc)
}

// BatchIndexUsers indexes multiple user documents
func (m *BleveUserSearchManager) BatchIndexUsers(docs []UserDocument) error {
	batch := m.index.NewBatch()
	for _, doc := range docs {
		batch.Index(doc.ID, doc)
	}
	return m.index.Batch(batch)
}

// DeleteUser removes a user from the index
func (m *BleveUserSearchManager) DeleteUser(id string) error {
	return m.index.Delete(id)
}

// SearchUsers searches for users matching the query with fuzzy matching
func (m *BleveUserSearchManager) SearchUsers(queryString string, currentUserID uint, limit int) ([]UserDocument, error) {
	// Clean query string
	queryString = strings.TrimSpace(queryString)
	if queryString == "" {
		return nil, fmt.Errorf("empty query string")
	}

	var finalQuery query.Query

	// Create a prefix query for better partial matching
	prefixQuery := bleve.NewPrefixQuery(strings.ToLower(queryString))
	prefixQuery.SetField("username")

	// Create a fuzzy query for typo tolerance
	fuzzyQuery := bleve.NewFuzzyQuery(queryString)
	fuzzyQuery.SetField("username")
	fuzzyQuery.SetFuzziness(1)

	// Create a wildcard query for contains matching
	wildcardQuery := bleve.NewWildcardQuery("*" + strings.ToLower(queryString) + "*")
	wildcardQuery.SetField("username")

	// Combine queries with different boosts
	boolQuery := bleve.NewBooleanQuery()

	// Prefix match gets highest priority (exact prefix match)
	boolQuery.AddShould(prefixQuery)
	prefixQuery.SetBoost(3.0)

	// Fuzzy match gets medium priority (typo tolerance)
	boolQuery.AddShould(fuzzyQuery)
	fuzzyQuery.SetBoost(2.0)

	// Wildcard match gets lowest priority (contains anywhere)
	boolQuery.AddShould(wildcardQuery)
	wildcardQuery.SetBoost(1.0)

	finalQuery = boolQuery

	// Exclude current user from results
	mustNotQuery := bleve.NewTermQuery(fmt.Sprintf("%d", currentUserID))
	mustNotQuery.SetField("id")

	excludeCurrentUserQuery := bleve.NewBooleanQuery()
	excludeCurrentUserQuery.AddMust(finalQuery)
	excludeCurrentUserQuery.AddMustNot(mustNotQuery)

	finalQuery = excludeCurrentUserQuery

	// Create search request
	searchRequest := bleve.NewSearchRequest(finalQuery)
	searchRequest.Size = limit
	searchRequest.Fields = []string{"id", "username", "email", "created_at"}

	// Sort by relevance (score) then username
	searchRequest.SortBy([]string{"-_score", "username"})

	// Execute search
	searchResults, err := m.index.Search(searchRequest)
	if err != nil {
		return nil, fmt.Errorf("error executing user search: %w", err)
	}

	// Convert search results to UserDocument slice
	var users []UserDocument
	for _, hit := range searchResults.Hits {
		user := UserDocument{
			ID:       hit.ID,
			Username: hit.Fields["username"].(string),
			Email:    hit.Fields["email"].(string),
		}

		// Handle created_at field conversion
		if createdAtField, ok := hit.Fields["created_at"]; ok {
			if createdAtStr, ok := createdAtField.(string); ok {
				if parsedTime, err := time.Parse(time.RFC3339, createdAtStr); err == nil {
					user.CreatedAt = parsedTime
				}
			}
		}

		users = append(users, user)
	}

	return users, nil
}

// Count returns the number of users in the index
func (m *BleveUserSearchManager) Count() (uint64, error) {
	return m.index.DocCount()
}

// ReindexAllUsers removes all users from index and re-indexes them
func (m *BleveUserSearchManager) ReindexAllUsers(docs []UserDocument) error {
	// Create new batch
	batch := m.index.NewBatch()

	// Delete all existing documents first
	// Note: This is a simple approach. For large datasets, consider more efficient approaches
	allQuery := bleve.NewMatchAllQuery()
	searchRequest := bleve.NewSearchRequest(allQuery)
	searchRequest.Size = 10000 // Adjust if you have more users
	searchRequest.Fields = []string{"id"}

	searchResults, err := m.index.Search(searchRequest)
	if err != nil {
		return fmt.Errorf("error getting existing users for reindex: %w", err)
	}

	// Delete existing documents
	for _, hit := range searchResults.Hits {
		batch.Delete(hit.ID)
	}

	// Add new documents
	for _, doc := range docs {
		batch.Index(doc.ID, doc)
	}

	return m.index.Batch(batch)
}

// UpdateUser updates a user in the index
func (m *BleveUserSearchManager) UpdateUser(doc UserDocument) error {
	// First delete any existing document with this ID to ensure clean update
	if err := m.index.Delete(doc.ID); err != nil {
		// Ignore "not found" errors, but log other errors
		if !strings.Contains(err.Error(), "not found") {
			fmt.Printf("Warning: error deleting old user document %s: %v\n", doc.ID, err)
		}
	}

	// Re-index the updated document
	if err := m.index.Index(doc.ID, doc); err != nil {
		return fmt.Errorf("failed to index updated user document %s: %w", doc.ID, err)
	}

	return nil
}
