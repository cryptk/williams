package repository

import (
	"fmt"

	"github.com/cryptk/williams/internal/models"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// CategoryRepository defines the interface for category data operations
type CategoryRepository interface {
	Create(scopedDB *gorm.DB, category *models.Category) error
	List(scopedDB *gorm.DB) ([]*models.Category, error)
	Delete(scopedDB *gorm.DB, id string) error
	CreateDefaults(userID string) error
}

// categoryRepository implements CategoryRepository
type categoryRepository struct {
	db *gorm.DB // Only used for CreateDefaults (unauthenticated user registration)
}

// NewCategoryRepository creates a new category repository
func NewCategoryRepository(db *gorm.DB) CategoryRepository {
	return &categoryRepository{db: db}
}

// Create creates a new category
func (r *categoryRepository) Create(scopedDB *gorm.DB, category *models.Category) error {
	if category.ID == "" {
		category.ID = uuid.New().String()
	}
	return scopedDB.Session(&gorm.Session{}).Create(category).Error
}

// List retrieves all categories
func (r *categoryRepository) List(scopedDB *gorm.DB) ([]*models.Category, error) {
	var categories []*models.Category
	if err := scopedDB.Session(&gorm.Session{}).Order("name ASC").Find(&categories).Error; err != nil {
		return nil, err
	}
	return categories, nil
}

// Delete deletes a category by ID
func (r *categoryRepository) Delete(scopedDB *gorm.DB, id string) error {
	result := scopedDB.Session(&gorm.Session{}).Delete(&models.Category{}, "id = ?", id)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return fmt.Errorf("category not found")
	}
	return nil
}

// CreateDefaults creates default categories for a new user
func (r *categoryRepository) CreateDefaults(userID string) error {
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
