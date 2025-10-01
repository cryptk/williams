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
	GetByID(id string) (*models.Category, error)
	List() ([]*models.Category, error)
	Delete(id string) error
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

// GetByID retrieves a category by ID
func (r *categoryRepository) GetByID(id string) (*models.Category, error) {
	var category models.Category
	if err := r.db.First(&category, "id = ?", id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("category not found")
		}
		return nil, err
	}
	return &category, nil
}

// List retrieves all categories
func (r *categoryRepository) List() ([]*models.Category, error) {
	var categories []*models.Category
	if err := r.db.Order("name ASC").Find(&categories).Error; err != nil {
		return nil, err
	}
	return categories, nil
}

// Delete deletes a category by ID
func (r *categoryRepository) Delete(id string) error {
	return r.db.Delete(&models.Category{}, "id = ?", id).Error
}
