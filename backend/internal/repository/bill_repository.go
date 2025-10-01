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
	GetByID(id string) (*models.Bill, error)
	GetByUserID(userID string) ([]*models.Bill, error)
	List() ([]*models.Bill, error)
	Update(bill *models.Bill) error
	Delete(id string) error
	GetStats() (*models.BillStats, error)
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

// GetByID retrieves a bill by ID
func (r *billRepository) GetByID(id string) (*models.Bill, error) {
	var bill models.Bill
	if err := r.db.First(&bill, "id = ?", id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("bill not found")
		}
		return nil, err
	}
	return &bill, nil
}

// List retrieves all bills
func (r *billRepository) List() ([]*models.Bill, error) {
	var bills []*models.Bill
	if err := r.db.Order("due_day ASC").Find(&bills).Error; err != nil {
		return nil, err
	}
	return bills, nil
}

// GetByUserID retrieves bills for a specific user
func (r *billRepository) GetByUserID(userID string) ([]*models.Bill, error) {
	var bills []*models.Bill
	if err := r.db.Where("user_id = ?", userID).Order("due_day ASC").Find(&bills).Error; err != nil {
		return nil, err
	}
	return bills, nil
}

// Update updates an existing bill
func (r *billRepository) Update(bill *models.Bill) error {
	// Fetch the existing bill to preserve CreatedAt
	var existing models.Bill
	if err := r.db.First(&existing, "id = ?", bill.ID).Error; err != nil {
		return err
	}

	// Preserve CreatedAt from existing record, set UpdatedAt to now
	bill.CreatedAt = existing.CreatedAt
	bill.UpdatedAt = utils.NowInAppTimezone()

	return r.db.Save(bill).Error
}

// Delete deletes a bill by ID
func (r *billRepository) Delete(id string) error {
	return r.db.Delete(&models.Bill{}, "id = ?", id).Error
}

// GetStats calculates bill statistics
func (r *billRepository) GetStats() (*models.BillStats, error) {
	var stats models.BillStats

	// Total bills count
	if err := r.db.Model(&models.Bill{}).Count(&[]int64{int64(stats.TotalBills)}[0]).Error; err != nil {
		return nil, err
	}

	// Total amount
	type Result struct {
		Total float64
	}
	var result Result
	if err := r.db.Model(&models.Bill{}).Select("COALESCE(SUM(amount), 0) as total").Scan(&result).Error; err != nil {
		return nil, err
	}
	stats.TotalAmount = result.Total

	// Note: Paid/Unpaid/Upcoming stats are now calculated in the service layer
	// since is_paid is a computed field based on payments and grace period
	stats.PaidBills = 0
	stats.UnpaidBills = 0
	stats.UpcomingBills = 0

	// Update total bills with actual count
	var totalCount int64
	if err := r.db.Model(&models.Bill{}).Count(&totalCount).Error; err != nil {
		return nil, err
	}
	stats.TotalBills = int(totalCount)

	return &stats, nil
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
