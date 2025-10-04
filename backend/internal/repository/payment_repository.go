package repository

import (
	"fmt"

	"github.com/cryptk/williams/internal/models"
	"github.com/cryptk/williams/pkg/utils"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// PaymentRepository defines the interface for payment data operations
type PaymentRepository interface {
	Create(scopedDB *gorm.DB, payment *models.Payment) error
	List(scopedDB *gorm.DB, billID string) ([]*models.Payment, error)
	GetLatest(scopedDB *gorm.DB, billID string) (*models.Payment, error)
	Delete(scopedDB *gorm.DB, id string) error
}

// paymentRepository implements PaymentRepository
type paymentRepository struct{}

// NewPaymentRepository creates a new payment repository
func NewPaymentRepository() PaymentRepository {
	return &paymentRepository{}
}

// Create creates a new payment
func (r *paymentRepository) Create(scopedDB *gorm.DB, payment *models.Payment) error {
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

	return scopedDB.Session(&gorm.Session{}).Create(payment).Error
}

// List retrieves all payments for a specific bill
func (r *paymentRepository) List(scopedDB *gorm.DB, billID string) ([]*models.Payment, error) {
	var payments []*models.Payment
	if err := scopedDB.Session(&gorm.Session{}).Where("bill_id = ?", billID).
		Order("payment_date DESC").
		Find(&payments).Error; err != nil {
		return nil, err
	}
	return payments, nil
}

// GetLatest retrieves the most recent payment for a bill
func (r *paymentRepository) GetLatest(scopedDB *gorm.DB, billID string) (*models.Payment, error) {
	var payment models.Payment
	if err := scopedDB.Session(&gorm.Session{}).Where("bill_id = ?", billID).Order("payment_date DESC").First(&payment).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &payment, nil
}

// Delete deletes a payment by ID
func (r *paymentRepository) Delete(scopedDB *gorm.DB, id string) error {
	// Verify payment exists
	var payment models.Payment
	if err := scopedDB.Session(&gorm.Session{}).Where("id = ?", id).First(&payment).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return fmt.Errorf("payment not found")
		}
		return err
	}

	// Delete the payment
	return scopedDB.Session(&gorm.Session{}).Delete(&models.Payment{}, "id = ?", id).Error
}
