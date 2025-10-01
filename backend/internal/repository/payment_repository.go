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
	Create(payment *models.Payment) error
	GetByBillIDAndUser(billID string, userID string) ([]*models.Payment, error)
	GetLatestByBillID(billID string) (*models.Payment, error)
	DeleteByUser(id string, userID string) error
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

// GetByBillIDAndUser retrieves all payments for a specific bill and verifies bill ownership
func (r *paymentRepository) GetByBillIDAndUser(billID string, userID string) ([]*models.Payment, error) {
	var payments []*models.Payment
	// Join with bills table to verify ownership
	if err := r.db.Joins("JOIN bills ON payments.bill_id = bills.id").
		Where("payments.bill_id = ? AND bills.user_id = ?", billID, userID).
		Order("payments.payment_date DESC").
		Find(&payments).Error; err != nil {
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

// DeleteByUser deletes a payment by ID and verifies bill ownership
func (r *paymentRepository) DeleteByUser(id string, userID string) error {
	// Need to join with bills to verify ownership
	var payment models.Payment
	if err := r.db.Joins("JOIN bills ON payments.bill_id = bills.id").
		Where("payments.id = ? AND bills.user_id = ?", id, userID).
		First(&payment).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return fmt.Errorf("payment not found for specified user")
		}
		return err
	}

	// Now delete the payment
	return r.db.Delete(&models.Payment{}, "id = ?", id).Error
}
