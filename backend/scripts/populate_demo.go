//go:build ignore
// +build ignore

package main

// This script populates the Williams database with sample data for development/demo purposes.
// Usage: go run scripts/populate_demo.go

import (
	"fmt"
	"log"
	"os"
	"time"

	"github.com/cryptk/williams/internal/models"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func ptr(s string) *string { return &s }

func main() {
	dbPath := "../build/williams.db"
	if len(os.Args) > 1 {
		dbPath = os.Args[1]
	}
	db, err := gorm.Open(sqlite.Open(dbPath), &gorm.Config{})
	if err != nil {
		log.Fatalf("failed to connect database: %v", err)
	}

	// Create demo user
	user := models.User{
		ID:        uuid.NewString(),
		Username:  "demo",
		Email:     "demo@demo.com",
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
	hash, _ := bcrypt.GenerateFromPassword([]byte("demo1234"), bcrypt.DefaultCost)
	user.PasswordHash = string(hash)
	db.Where(models.User{Email: user.Email}).FirstOrCreate(&user)

	// Create categories
	categories := []models.Category{
		{ID: uuid.NewString(), UserID: user.ID, Name: "Utilities", Color: "#4F8EF7", CreatedAt: time.Now()},
		{ID: uuid.NewString(), UserID: user.ID, Name: "Rent", Color: "#F76E4F", CreatedAt: time.Now()},
		{ID: uuid.NewString(), UserID: user.ID, Name: "Internet", Color: "#4FF7A2", CreatedAt: time.Now()},
		{ID: uuid.NewString(), UserID: user.ID, Name: "Entertainment", Color: "#F7E24F", CreatedAt: time.Now()},
	}
	for _, cat := range categories {
		db.Where(models.Category{Name: cat.Name, UserID: user.ID}).FirstOrCreate(&cat)
	}
	catMap := map[string]string{}
	for _, cat := range categories {
		catMap[cat.Name] = cat.ID
	}

	// Dates for demo bills
	gymStartDate := time.Now().AddDate(0, 0, -28)
	petFoodStartDate := time.Now().AddDate(0, 0, -15)
	insuranceStartDate := time.Now().AddDate(0, 1, 0)

	// Create bills
	bills := []models.Bill{
		// Fixed date recurring bills (monthly on a specific day)
		{ID: uuid.NewString(), UserID: user.ID, Name: "Apartment Rent", Amount: 1500, RecurrenceDays: 1, CategoryID: ptr(catMap["Rent"]), RecurrenceType: "fixed_date", Notes: "Monthly rent", CreatedAt: time.Now(), UpdatedAt: time.Now()},
		{ID: uuid.NewString(), UserID: user.ID, Name: "Electricity", Amount: 80, RecurrenceDays: 10, CategoryID: ptr(catMap["Utilities"]), RecurrenceType: "fixed_date", Notes: "Electric bill", CreatedAt: time.Now(), UpdatedAt: time.Now()},
		{ID: uuid.NewString(), UserID: user.ID, Name: "Internet", Amount: 60, RecurrenceDays: 15, CategoryID: ptr(catMap["Internet"]), RecurrenceType: "fixed_date", Notes: "Fiber internet", CreatedAt: time.Now(), UpdatedAt: time.Now()},
		{ID: uuid.NewString(), UserID: user.ID, Name: "Netflix", Amount: 15.99, RecurrenceDays: 20, CategoryID: ptr(catMap["Entertainment"]), RecurrenceType: "fixed_date", Notes: "Streaming", CreatedAt: time.Now(), UpdatedAt: time.Now()},
		{ID: uuid.NewString(), UserID: user.ID, Name: "Water", Amount: 30, RecurrenceDays: 12, CategoryID: ptr(catMap["Utilities"]), RecurrenceType: "fixed_date", Notes: "Water bill", CreatedAt: time.Now(), UpdatedAt: time.Now()},
		// Interval-based recurring bills (every X days)
		{ID: uuid.NewString(), UserID: user.ID, Name: "Gym Membership", Amount: 45, RecurrenceDays: 14, CategoryID: ptr(catMap["Entertainment"]), RecurrenceType: "interval", StartDate: &gymStartDate, Notes: "Bi-weekly gym payment", CreatedAt: time.Now().AddDate(0, 0, -28), UpdatedAt: time.Now()},
		{ID: uuid.NewString(), UserID: user.ID, Name: "Pet Food Subscription", Amount: 25, RecurrenceDays: 30, CategoryID: nil, RecurrenceType: "interval", StartDate: &petFoodStartDate, Notes: "Every 30 days", CreatedAt: time.Now().AddDate(0, 0, -15), UpdatedAt: time.Now()},
		// One-time bill (non-recurring)
		{ID: uuid.NewString(), UserID: user.ID, Name: "Annual Insurance", Amount: 500, RecurrenceDays: 1, CategoryID: nil, RecurrenceType: "none", StartDate: &insuranceStartDate, Notes: "One-time payment due next month", CreatedAt: time.Now(), UpdatedAt: time.Now()},
	}
	for _, bill := range bills {
		db.Where(models.Bill{Name: bill.Name, UserID: user.ID}).FirstOrCreate(&bill)
	}

	// Create payment history for bills (simulate last 3 months)
	monthsBack := 3
	for _, bill := range bills {
		// Only create payment history for recurring bills
		if bill.RecurrenceType == "none" {
			continue
		}

		// Handle fixed_date recurring bills
		if bill.RecurrenceType == "fixed_date" {
			for i := monthsBack; i >= 0; i-- {
				dueDate := time.Date(time.Now().Year(), time.Now().Month()-time.Month(i), bill.RecurrenceDays, 12, 0, 0, 0, time.Local)
				paid := i != 0 || bill.RecurrenceDays <= time.Now().Day() // Mark current month as unpaid if due day > today
				if paid {
					pay := models.Payment{
						ID:          uuid.NewString(),
						BillID:      bill.ID,
						Amount:      bill.Amount,
						PaymentDate: dueDate,
						Notes:       "Auto-generated payment",
						CreatedAt:   dueDate.AddDate(0, 0, 1),
					}
					db.Where(models.Payment{BillID: bill.ID, PaymentDate: dueDate}).FirstOrCreate(&pay)
				}
			}
		}

		// Handle interval recurring bills
		if bill.RecurrenceType == "interval" {
			// Start from bill creation date and create payments for each interval
			currentDate := bill.CreatedAt
			now := time.Now()
			for currentDate.Before(now.AddDate(0, 0, -7)) { // Create payments up until 7 days ago
				pay := models.Payment{
					ID:          uuid.NewString(),
					BillID:      bill.ID,
					Amount:      bill.Amount,
					PaymentDate: currentDate,
					Notes:       "Auto-generated interval payment",
					CreatedAt:   currentDate.AddDate(0, 0, 1),
				}
				db.Where(models.Payment{BillID: bill.ID, PaymentDate: currentDate}).FirstOrCreate(&pay)
				currentDate = currentDate.AddDate(0, 0, bill.RecurrenceDays)
			}
		}
	}

	fmt.Println("Demo data populated!")
}
