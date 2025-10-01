package repository

import (
	"fmt"

	"github.com/cryptk/williams/internal/models"
	"github.com/cryptk/williams/pkg/utils"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// BillRepository defines the interface for bill data operations
type BillRepository interface {
	Create(bill *models.Bill) error
	GetByIDAndUser(id string, userID string) (*models.Bill, error)
	GetByUserID(userID string) ([]*models.Bill, error)
	UpdateByUser(bill *models.Bill, userID string) error
	DeleteByUser(id string, userID string) error
	GetStatsByUser(userID string) (*models.BillStats, error)
}

// billRepository implements BillRepository
type billRepository struct {
	db *gorm.DB
}

// NewBillRepository creates a new bill repository
func NewBillRepository(db *gorm.DB) BillRepository {
	return &billRepository{db: db}
}

// Create creates a new bill
func (r *billRepository) Create(bill *models.Bill) error {
	if bill.ID == "" {
		bill.ID = uuid.New().String()
	}
	bill.CreatedAt = utils.NowInAppTimezone()
	bill.UpdatedAt = utils.NowInAppTimezone()

	return r.db.Create(bill).Error
}

// GetByIDAndUser retrieves a bill by ID and verifies ownership
func (r *billRepository) GetByIDAndUser(id string, userID string) (*models.Bill, error) {
	var bill models.Bill
	if err := r.db.First(&bill, "id = ? AND user_id = ?", id, userID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("bill not found")
		}
		return nil, err
	}
	return &bill, nil
}

// GetByUserID retrieves bills for a specific user
func (r *billRepository) GetByUserID(userID string) ([]*models.Bill, error) {
	var bills []*models.Bill
	if err := r.db.Where("user_id = ?", userID).Order("name ASC").Find(&bills).Error; err != nil {
		return nil, err
	}
	return bills, nil
}

// UpdateByUser updates an existing bill and verifies ownership
func (r *billRepository) UpdateByUser(bill *models.Bill, userID string) error {
	// Fetch the existing bill to preserve CreatedAt and verify ownership
	var existing models.Bill
	if err := r.db.First(&existing, "id = ? AND user_id = ?", bill.ID, userID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return fmt.Errorf("bill not found or access denied")
		}
		return err
	}

	// Preserve CreatedAt and UserID from existing record, set UpdatedAt to now
	bill.CreatedAt = existing.CreatedAt
	bill.UserID = existing.UserID
	bill.UpdatedAt = utils.NowInAppTimezone()

	return r.db.Save(bill).Error
}

// DeleteByUser deletes a bill by ID and verifies ownership
func (r *billRepository) DeleteByUser(id string, userID string) error {
	result := r.db.Delete(&models.Bill{}, "id = ? AND user_id = ?", id, userID)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return fmt.Errorf("bill not found or access denied")
	}
	return nil
}

// GetStatsByUser calculates bill statistics for a specific user
func (r *billRepository) GetStatsByUser(userID string) (*models.BillStats, error) {
	var stats models.BillStats

	// Total bills count for user
	var totalCount int64
	if err := r.db.Model(&models.Bill{}).Where("user_id = ?", userID).Count(&totalCount).Error; err != nil {
		return nil, err
	}
	stats.TotalBills = int(totalCount)

	// Total amount for user
	type Result struct {
		Total float64
	}
	var result Result
	if err := r.db.Model(&models.Bill{}).Where("user_id = ?", userID).Select("COALESCE(SUM(amount), 0) as total").Scan(&result).Error; err != nil {
		return nil, err
	}
	stats.TotalAmount = result.Total

	// Note: Paid/Unpaid/Upcoming stats are now calculated in the service layer
	// since is_paid is a computed field based on payments and grace period
	stats.PaidBills = 0
	stats.UnpaidBills = 0
	stats.UpcomingBills = 0

	return &stats, nil
}
