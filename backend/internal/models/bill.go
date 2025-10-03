package models

import "time"

// Bill represents a bill entity
type Bill struct {
	ID             string     `json:"id" gorm:"primaryKey"`
	UserID         string     `json:"user_id" gorm:"not null"`
	Name           string     `json:"name" gorm:"not null" binding:"required"`
	Amount         float64    `json:"amount" gorm:"not null" binding:"required,gt=0"`
	RecurrenceDays int        `json:"recurrence_days" gorm:"not null;check:recurrence_days >= 1" binding:"required,min=1"`
	CategoryID     *string    `json:"category_id"`
	RecurrenceType string     `json:"recurrence_type" gorm:"default:none;check:recurrence_type IN ('none', 'fixed_date', 'interval')" binding:"oneof=none fixed_date interval"`
	StartDate      *time.Time `json:"start_date,omitempty"` // Used for interval and one-time bills
	Notes          string     `json:"notes"`
	CreatedAt      time.Time  `json:"created_at" gorm:"autoCreateTime" binding:"-"` // Read-only, managed by backend
	UpdatedAt      time.Time  `json:"updated_at" gorm:"autoUpdateTime" binding:"-"` // Read-only, managed by backend

	// Computed fields (not stored in database)
	IsPaid       bool       `json:"is_paid" gorm:"-"`
	NextDueDate  *time.Time `json:"next_due_date,omitempty" gorm:"-"`
	LastPaidDate *time.Time `json:"last_paid_date,omitempty" gorm:"-"`
}

// Payment represents a payment made for a bill
type Payment struct {
	ID          string    `json:"id" gorm:"primaryKey"`
	BillID      string    `json:"bill_id" gorm:"not null;index"` // Set from URL param, not request body
	Amount      float64   `json:"amount" gorm:"not null" binding:"required,gt=0"`
	PaymentDate time.Time `json:"payment_date" gorm:"not null" binding:"required"`
	Notes       string    `json:"notes"`
	CreatedAt   time.Time `json:"created_at" gorm:"autoCreateTime" binding:"-"` // Read-only, managed by backend
}

// Category represents a bill category
type Category struct {
	ID        string    `json:"id" gorm:"primaryKey"`
	UserID    string    `json:"user_id" gorm:"not null;index"`
	Name      string    `json:"name" gorm:"not null" binding:"required"`
	Color     string    `json:"color"`
	CreatedAt time.Time `json:"created_at" gorm:"autoCreateTime" binding:"-"` // Read-only, managed by backend
}

// BillStats represents bill statistics
type BillStats struct {
	TotalBills    int     `json:"total_bills"`
	TotalAmount   float64 `json:"total_amount"`
	DueAmount     float64 `json:"due_amount"` // Total amount of unpaid bills
	PaidBills     int     `json:"paid_bills"`
	UnpaidBills   int     `json:"unpaid_bills"`
	UpcomingBills int     `json:"upcoming_bills"`
}
