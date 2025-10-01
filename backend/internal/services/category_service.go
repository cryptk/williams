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

// ListCategoriesByUser retrieves all categories for a specific user
func (s *CategoryService) ListCategoriesByUser(userID string) ([]*models.Category, error) {
	return s.repo.ListByUser(userID)
}

// DeleteCategoryByUser deletes a category and verifies ownership
func (s *CategoryService) DeleteCategoryByUser(id string, userID string) error {
	return s.repo.DeleteByUser(id, userID)
}

// CreateDefaultCategories creates default categories for a new user
func (s *CategoryService) CreateDefaultCategories(userID string) error {
	return s.repo.CreateDefaultCategories(userID)
}
