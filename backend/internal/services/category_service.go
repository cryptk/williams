package services

import (
	"github.com/cryptk/williams/internal/models"
	"github.com/cryptk/williams/internal/repository"
)

// CategoryService handles business logic for categories
type CategoryService struct {
	repo repository.CategoryRepository
}

// NewCategoryService creates a new category service
func NewCategoryService(repo repository.CategoryRepository) *CategoryService {
	return &CategoryService{repo: repo}
}

// CreateCategory creates a new category
func (s *CategoryService) CreateCategory(category *models.Category) error {
	return s.repo.Create(category)
}

// GetCategory retrieves a category by ID
func (s *CategoryService) GetCategory(id string) (*models.Category, error) {
	return s.repo.GetByID(id)
}

// ListCategories retrieves all categories
func (s *CategoryService) ListCategories() ([]*models.Category, error) {
	return s.repo.List()
}

// DeleteCategory deletes a category
func (s *CategoryService) DeleteCategory(id string) error {
	return s.repo.Delete(id)
}
