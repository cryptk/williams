package models

import "time"

// Bill represents a bill entity
type Bill struct {
	ID          string    `json:"id" gorm:"primaryKey"`
	UserID      string    `json:"user_id" gorm:"not null"`
	Name        string    `json:"name" gorm:"not null" binding:"required"`
	Amount      float64   `json:"amount" gorm:"not null" binding:"required,gt=0"`
	DueDay      int       `json:"due_day" gorm:"not null;check:due_day >= 1 AND due_day <= 31" binding:"required,min=1,max=31"`
	CategoryID  *string   `json:"category_id"`
	IsRecurring bool      `json:"is_recurring" gorm:"default:0"`
	Notes       string    `json:"notes"`
	CreatedAt   time.Time `json:"created_at" gorm:"autoCreateTime" binding:"-"` // Read-only, managed by backend
	UpdatedAt   time.Time `json:"updated_at" gorm:"autoUpdateTime" binding:"-"` // Read-only, managed by backend

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
