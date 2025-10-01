package repository

import (
	"github.com/cryptk/williams/internal/models"
	"github.com/cryptk/williams/pkg/utils"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// PaymentRepository defines the interface for payment data operations
type PaymentRepository interface {
	Create(payment *models.Payment) error
	GetByID(id string) (*models.Payment, error)
	GetByBillID(billID string) ([]*models.Payment, error)
	GetLatestByBillID(billID string) (*models.Payment, error)
	List() ([]*models.Payment, error)
	Delete(id string) error
}

// paymentRepository implements PaymentRepository
type paymentRepository struct {
	db *gorm.DB
}

// NewPaymentRepository creates a new payment repository
func NewPaymentRepository(db *gorm.DB) PaymentRepository {
	return &paymentRepository{db: db}
}

// Create creates a new payment
func (r *paymentRepository) Create(payment *models.Payment) error {
	if payment.ID == "" {
		payment.ID = uuid.New().String()
	}
	if payment.PaymentDate.IsZero() {
		payment.PaymentDate = utils.NowInAppTimezone()
	}
	// Ensure payment date is in app timezone
	payment.PaymentDate = utils.ConvertToAppTimezone(payment.PaymentDate)

	// Always set CreatedAt on the backend
	payment.CreatedAt = utils.NowInAppTimezone()

	return r.db.Create(payment).Error
}

// GetByID retrieves a payment by ID
func (r *paymentRepository) GetByID(id string) (*models.Payment, error) {
	var payment models.Payment
	if err := r.db.First(&payment, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &payment, nil
}

// GetByBillID retrieves all payments for a specific bill
func (r *paymentRepository) GetByBillID(billID string) ([]*models.Payment, error) {
	var payments []*models.Payment
	if err := r.db.Where("bill_id = ?", billID).Order("payment_date DESC").Find(&payments).Error; err != nil {
		return nil, err
	}
	return payments, nil
}

// GetLatestByBillID retrieves the most recent payment for a bill
func (r *paymentRepository) GetLatestByBillID(billID string) (*models.Payment, error) {
	var payment models.Payment
	if err := r.db.Where("bill_id = ?", billID).Order("payment_date DESC").First(&payment).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &payment, nil
}

// List retrieves all payments
func (r *paymentRepository) List() ([]*models.Payment, error) {
	var payments []*models.Payment
	if err := r.db.Order("payment_date DESC").Find(&payments).Error; err != nil {
		return nil, err
	}
	return payments, nil
}

// Delete deletes a payment by ID
func (r *paymentRepository) Delete(id string) error {
	return r.db.Delete(&models.Payment{}, "id = ?", id).Error
}
