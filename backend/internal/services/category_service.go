package services

import (
	"github.com/cryptk/williams/internal/models"
	"github.com/cryptk/williams/internal/repository"
	"gorm.io/gorm"
)

// CategoryService handles business logic for categories
type CategoryService struct {
	repo repository.CategoryRepository
}

// NewCategoryService creates a new category service
func NewCategoryService(repo repository.CategoryRepository) *CategoryService {
	return &CategoryService{repo: repo}
}

// Create creates a new category
func (s *CategoryService) Create(scopedDB *gorm.DB, category *models.Category) error {
	return s.repo.Create(scopedDB, category)
}

// List retrieves all categories
func (s *CategoryService) List(scopedDB *gorm.DB) ([]*models.Category, error) {
	return s.repo.List(scopedDB)
}

// Delete deletes a category
func (s *CategoryService) Delete(scopedDB *gorm.DB, id string) error {
	return s.repo.Delete(scopedDB, id)
}

// CreateDefaults creates default categories for a new user
func (s *CategoryService) CreateDefaults(userID string) error {
	return s.repo.CreateDefaults(userID)
}

