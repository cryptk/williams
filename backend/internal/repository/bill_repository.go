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
	Create(scopedDB *gorm.DB, bill *models.Bill) error
	Get(scopedDB *gorm.DB, id string) (*models.Bill, error)
	List(scopedDB *gorm.DB) ([]*models.Bill, error)
	Update(scopedDB *gorm.DB, bill *models.Bill) error
	Delete(scopedDB *gorm.DB, id string) error
	GetStats(scopedDB *gorm.DB) (*models.BillStats, error)
}

// billRepository implements BillRepository
type billRepository struct{}

// NewBillRepository creates a new bill repository
func NewBillRepository() BillRepository {
	return &billRepository{}
}

// Create creates a new bill
func (r *billRepository) Create(scopedDB *gorm.DB, bill *models.Bill) error {
	if bill.ID == "" {
		bill.ID = uuid.New().String()
	}
	bill.CreatedAt = utils.NowInAppTimezone()
	bill.UpdatedAt = utils.NowInAppTimezone()

	return scopedDB.Session(&gorm.Session{}).Create(bill).Error
}

// Get retrieves a bill by ID
func (r *billRepository) Get(scopedDB *gorm.DB, id string) (*models.Bill, error) {
	var bill models.Bill
	if err := scopedDB.Session(&gorm.Session{}).First(&bill, "id = ?", id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("bill not found")
		}
		return nil, err
	}
	return &bill, nil
}

// List retrieves all bills
func (r *billRepository) List(scopedDB *gorm.DB) ([]*models.Bill, error) {
	var bills []*models.Bill
	if err := scopedDB.Session(&gorm.Session{}).Order("name ASC").Find(&bills).Error; err != nil {
		return nil, err
	}
	return bills, nil
}

// Update updates an existing bill
func (r *billRepository) Update(scopedDB *gorm.DB, bill *models.Bill) error {
	// Fetch the existing bill to preserve CreatedAt
	var existing models.Bill
	if err := scopedDB.Session(&gorm.Session{}).First(&existing, "id = ?", bill.ID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return fmt.Errorf("bill not found")
		}
		return err
	}

	// Preserve CreatedAt and UserID from existing record, set UpdatedAt to now
	bill.CreatedAt = existing.CreatedAt
	bill.UserID = existing.UserID
	bill.UpdatedAt = utils.NowInAppTimezone()

	return scopedDB.Session(&gorm.Session{}).Save(bill).Error
}

// Delete deletes a bill by ID
func (r *billRepository) Delete(scopedDB *gorm.DB, id string) error {
	result := scopedDB.Session(&gorm.Session{}).Delete(&models.Bill{}, "id = ?", id)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return fmt.Errorf("bill not found")
	}
	return nil
}

// GetStats calculates bill statistics
func (r *billRepository) GetStats(scopedDB *gorm.DB) (*models.BillStats, error) {
	var stats models.BillStats

	// Total bills count
	var totalCount int64
	if err := scopedDB.Session(&gorm.Session{}).Model(&models.Bill{}).Count(&totalCount).Error; err != nil {
		return nil, err
	}
	stats.TotalBills = int(totalCount)

	// Total amount - use Session to get fresh query builder without inherited clauses
	type Result struct {
		Total float64
	}
	var result Result
	if err := scopedDB.Session(&gorm.Session{}).Model(&models.Bill{}).Select("COALESCE(SUM(amount), 0) as total").Scan(&result).Error; err != nil {
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
