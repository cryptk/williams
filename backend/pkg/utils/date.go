package utils

import "time"

// CalculateNextDueDate calculates the next due date for a bill based on:
// - dueDay: the day of the month (1-31) the bill is due
// - referenceDate: the date to calculate from (created date or last payment date)
// Returns the next occurrence of dueDay that is >= referenceDate
func CalculateNextDueDate(dueDay int, referenceDate time.Time) time.Time {
	// Ensure we're working in the application's timezone
	referenceDate = ConvertToAppTimezone(referenceDate)

	// Only compare the date (year, month, day), ignore time
	year := referenceDate.Year()
	month := referenceDate.Month()
	refDay := referenceDate.Day()

	// Try the current month first
	nextDue := time.Date(year, month, dueDay, 0, 0, 0, 0, GetAppLocation())

	// If the due date in this month is before the reference date (by date only), move to next month
	if (month < nextDue.Month()) || (month == nextDue.Month() && dueDay < refDay) {
		// Move to next month
		month++
		if month > 12 {
			month = 1
			year++
		}
		nextDue = time.Date(year, month, dueDay, 0, 0, 0, 0, GetAppLocation())
	} else if dueDay < refDay {
		// If today is after the due day, move to next month
		month++
		if month > 12 {
			month = 1
			year++
		}
		nextDue = time.Date(year, month, dueDay, 0, 0, 0, 0, GetAppLocation())
	}

	// Handle case where due_day doesn't exist in the month (e.g., Feb 30)
	// Go automatically adjusts to the last valid day of the month
	if nextDue.Day() != dueDay {
		// The date was adjusted because the day doesn't exist in this month
		// Use the last day of the previous month instead
		nextDue = time.Date(year, month, 1, 0, 0, 0, 0, GetAppLocation()).AddDate(0, 0, -1)
	}

	return nextDue
}

// CalculateNextDueDateAfterPayment calculates the next due date after a payment
// This moves to the next occurrence of dueDay after the payment date
func CalculateNextDueDateAfterPayment(dueDay int, paymentDate time.Time) time.Time {
	// Ensure we're working in the application's timezone
	paymentDate = ConvertToAppTimezone(paymentDate)

	// Start by moving to next month using AddDate - this handles year rollover automatically
	nextMonth := paymentDate.AddDate(0, 1, 0)

	// Create the next due date with the specified day
	nextDue := time.Date(nextMonth.Year(), nextMonth.Month(), dueDay, 0, 0, 0, 0, GetAppLocation())

	// Check if we rolled forward 2+ months instead of 1
	// This happens when the due day doesn't exist in the next month (e.g., due day 31 in February)
	monthDiff := int(nextDue.Month()) - int(paymentDate.Month())
	if monthDiff < 0 {
		monthDiff += 12 // Handle year boundary
	}

	if monthDiff > 1 {
		// We rolled too far forward, use the last day of the next month instead
		// Get the first day of the next month, then go back one day
		nextDue = time.Date(nextMonth.Year(), nextMonth.Month()+1, 1, 0, 0, 0, 0, GetAppLocation()).AddDate(0, 0, -1)
	}

	return nextDue
}
