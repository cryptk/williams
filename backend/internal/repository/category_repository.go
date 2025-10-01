package repository

import (
	"fmt"

	"github.com/cryptk/williams/internal/models"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// CategoryRepository defines the interface for category data operations
type CategoryRepository interface {
	Create(category *models.Category) error
	ListByUser(userID string) ([]*models.Category, error)
	DeleteByUser(id string, userID string) error
	CreateDefaultCategories(userID string) error
}

// categoryRepository implements CategoryRepository
type categoryRepository struct {
	db *gorm.DB
}

// NewCategoryRepository creates a new category repository
func NewCategoryRepository(db *gorm.DB) CategoryRepository {
	return &categoryRepository{db: db}
}

// Create creates a new category
func (r *categoryRepository) Create(category *models.Category) error {
	if category.ID == "" {
		category.ID = uuid.New().String()
	}
	return r.db.Create(category).Error
}

// ListByUser retrieves all categories for a specific user
func (r *categoryRepository) ListByUser(userID string) ([]*models.Category, error) {
	var categories []*models.Category
	if err := r.db.Where("user_id = ?", userID).Order("name ASC").Find(&categories).Error; err != nil {
		return nil, err
	}
	return categories, nil
}

// DeleteByUser deletes a category by ID and verifies ownership
func (r *categoryRepository) DeleteByUser(id string, userID string) error {
	result := r.db.Delete(&models.Category{}, "id = ? AND user_id = ?", id, userID)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return fmt.Errorf("category not found or access denied")
	}
	return nil
}

// CreateDefaultCategories creates default categories for a new user
func (r *categoryRepository) CreateDefaultCategories(userID string) error {
	defaultCategories := []models.Category{
		{ID: uuid.New().String(), UserID: userID, Name: "Utilities", Color: "#3498db"},
		{ID: uuid.New().String(), UserID: userID, Name: "Rent", Color: "#e74c3c"},
		{ID: uuid.New().String(), UserID: userID, Name: "Insurance", Color: "#2ecc71"},
		{ID: uuid.New().String(), UserID: userID, Name: "Subscriptions", Color: "#f39c12"},
		{ID: uuid.New().String(), UserID: userID, Name: "Other", Color: "#95a5a6"},
	}

	for _, category := range defaultCategories {
		if err := r.db.Create(&category).Error; err != nil {
			return err
		}
	}

	return nil
}
