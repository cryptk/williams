package services

import (
	"time"

	"github.com/cryptk/williams/internal/config"
	"github.com/cryptk/williams/internal/models"
	"github.com/cryptk/williams/internal/repository"
	"github.com/cryptk/williams/pkg/utils"
)

// BillService handles business logic for bills
type BillService struct {
	repo        repository.BillRepository
	paymentRepo repository.PaymentRepository
	config      *config.Config
}

// NewBillService creates a new bill service
func NewBillService(repo repository.BillRepository, paymentRepo repository.PaymentRepository, cfg *config.Config) *BillService {
	return &BillService{
		repo:        repo,
		paymentRepo: paymentRepo,
		config:      cfg,
	}
}

// CreateBill creates a new bill
func (s *BillService) CreateBill(bill *models.Bill) error {
	return s.repo.Create(bill)
}

// GetBillByUser retrieves a bill by ID and verifies ownership
func (s *BillService) GetBillByUser(id string, userID string) (*models.Bill, error) {
	bill, err := s.repo.GetByIDAndUser(id, userID)
	if err != nil {
		return nil, err
	}

	// Calculate next due date
	nextDue, lastPaid, err := s.calculateNextDueDate(bill)
	if err != nil {
		return nil, err
	}
	bill.NextDueDate = nextDue
	bill.LastPaidDate = lastPaid

	// Calculate is_paid status
	isPaid, err := s.calculateIsPaid(bill)
	if err != nil {
		return nil, err
	}
	bill.IsPaid = isPaid

	return bill, nil
}

// CreatePayment creates a payment for a bill
func (s *BillService) CreatePayment(payment *models.Payment) error {
	// Create the payment
	return s.paymentRepo.Create(payment)
}

// CreatePaymentByUser creates a payment for a bill and verifies bill ownership
func (s *BillService) CreatePaymentByUser(payment *models.Payment, userID string) error {
	// First verify the bill exists and belongs to the user
	_, err := s.repo.GetByIDAndUser(payment.BillID, userID)
	if err != nil {
		return err
	}
	// Create the payment
	return s.paymentRepo.Create(payment)
}

// GetPaymentsByBillAndUser retrieves all payments for a bill and verifies ownership
func (s *BillService) GetPaymentsByBillAndUser(billID string, userID string) ([]*models.Payment, error) {
	return s.paymentRepo.GetByBillIDAndUser(billID, userID)
}

// DeletePaymentByUser deletes a payment by ID and verifies bill ownership
func (s *BillService) DeletePaymentByUser(paymentID string, userID string) error {
	return s.paymentRepo.DeleteByUser(paymentID, userID)
}

// ListBillsByUser retrieves all bills for a specific user
func (s *BillService) ListBillsByUser(userID string) ([]*models.Bill, error) {
	bills, err := s.repo.GetByUserID(userID)
	if err != nil {
		return nil, err
	}
	return s.enrichBillsWithPaymentStatus(bills)
}

// enrichBillsWithPaymentStatus calculates the is_paid status and next_due_date for bills
func (s *BillService) enrichBillsWithPaymentStatus(bills []*models.Bill) ([]*models.Bill, error) {
	for _, bill := range bills {
		// Calculate next due date
		nextDue, lastPaid, err := s.calculateNextDueDate(bill)
		if err != nil {
			return nil, err
		}
		bill.NextDueDate = nextDue
		bill.LastPaidDate = lastPaid

		// Calculate is_paid status
		isPaid, err := s.calculateIsPaid(bill)
		if err != nil {
			return nil, err
		}
		bill.IsPaid = isPaid
	}
	return bills, nil
}

// calculateNextDueDate determines the next due date for a bill based on due_day and payment history
func (s *BillService) calculateNextDueDate(bill *models.Bill) (*time.Time, *time.Time, error) {
	// Get the most recent payment
	latestPayment, err := s.paymentRepo.GetLatestByBillID(bill.ID)
	if err != nil {
		return nil, nil, err
	}

	var nextDue time.Time
	var lastPaidPtr *time.Time

	if latestPayment != nil {
		// Bill has payments - calculate from last payment date (the due date being paid)
		// But show when they actually paid (CreatedAt) for last_paid_date
		lastPaidPtr = &latestPayment.CreatedAt
		nextDue = utils.CalculateNextDueDateAfterPayment(bill.DueDay, latestPayment.PaymentDate)
	} else {
		// No payments - calculate from creation date
		nextDue = utils.CalculateNextDueDate(bill.DueDay, bill.CreatedAt)
	}

	return &nextDue, lastPaidPtr, nil
}

// calculateIsPaid determines if a bill is considered paid
func (s *BillService) calculateIsPaid(bill *models.Bill) (bool, error) {
	if bill.IsRecurring {
		// For recurring bills: check if next due date is at least grace_days in the future
		if bill.NextDueDate == nil {
			return false, nil
		}
		graceDays := time.Duration(s.config.Bills.PaymentGraceDays) * 24 * time.Hour
		return time.Until(*bill.NextDueDate) >= graceDays, nil
	}

	// For non-recurring bills: check if there's a payment record
	payment, err := s.paymentRepo.GetLatestByBillID(bill.ID)
	if err != nil {
		return false, err
	}
	return payment != nil, nil
}

// UpdateBillByUser updates an existing bill and verifies ownership
func (s *BillService) UpdateBillByUser(bill *models.Bill, userID string) error {
	return s.repo.UpdateByUser(bill, userID)
}

// DeleteBillByUser deletes a bill and verifies ownership
func (s *BillService) DeleteBillByUser(id string, userID string) error {
	return s.repo.DeleteByUser(id, userID)
}

// GetStatsByUser retrieves bill statistics for a specific user
func (s *BillService) GetStatsByUser(userID string) (*models.BillStats, error) {
	stats, err := s.repo.GetStatsByUser(userID)
	if err != nil {
		return nil, err
	}

	// Get all bills for user to calculate paid/unpaid stats
	bills, err := s.ListBillsByUser(userID)
	if err != nil {
		return nil, err
	}

	// Calculate paid/unpaid counts and due amount based on computed is_paid field
	for _, bill := range bills {
		if bill.IsPaid {
			stats.PaidBills++
		} else {
			stats.UnpaidBills++
			stats.DueAmount += bill.Amount
		}
	}

	return stats, nil
}
