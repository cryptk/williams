# Timezone Architecture

## Why Centralized Timezone Handling

**Problem:** Date calculations vary by timezone
- "Due on the 15th" means different moments in Tokyo vs New York
- Users expect bills to be due at midnight *their* time
- Database timestamps are UTC, but business logic needs local time

**Solution:** Configure a single application timezone
- All date math uses this timezone
- Users see consistent behavior
- Simple to reason about and test

## Configuration

In `config.yaml`:
```yaml
timezone: America/Los_Angeles  # IANA timezone name
```

Or environment variable:
```bash
WILLIAMS_TIMEZONE=America/New_York
```

**Why IANA names:**
- Handle daylight saving time automatically
- Unambiguous (EST vs EDT confusion)
- Standard format across platforms

## Implementation

### Loading Timezone (`pkg/utils/timezone.go`)

```go
var AppLocation *time.Location

func InitTimezone(tzName string) error {
    loc, err := time.LoadLocation(tzName)
    if err != nil {
        return fmt.Errorf("invalid timezone %s: %w", tzName, err)
    }
    AppLocation = loc
    return nil
}
```

**Why global variable:**
- Timezone doesn't change during runtime
- Avoids passing through every function
- Initialized once at startup

### Date Calculations (`pkg/utils/date.go`)

#### Getting Current Date in Application Timezone

```go
func TodayInLocation() time.Time {
    return time.Now().In(AppLocation).Truncate(24 * time.Hour)
}
```

**Why this pattern:**
1. `time.Now()` - Current UTC time
2. `.In(AppLocation)` - Convert to app timezone
3. `.Truncate(24 * time.Hour)` - Midnight of that day

**✅ Use this, not:**
```go
time.Now().Truncate(24 * time.Hour)  // Wrong! Uses local server time
```

#### Creating Dates for a Specific Month

```go
func DateForMonthDay(year, month, day int) time.Time {
    return time.Date(year, time.Month(month), day, 0, 0, 0, 0, AppLocation)
}
```

**Why specify location:**
- `time.Date()` needs a location
- Using `AppLocation` ensures consistency
- Creates midnight in the application timezone

**Example:**
```go
// Bill due on January 15th
dueDate := date.DateForMonthDay(2024, 1, 15)
// Result: 2024-01-15 00:00:00 PST (if AppLocation is America/Los_Angeles)
```

#### Next Due Date for Recurring Bills

```go
func NextDueDateFromDay(dueDay int, location *time.Location) *time.Time {
    today := time.Now().In(location)
    
    // Try this month
    thisMonth := time.Date(today.Year(), today.Month(), dueDay, 0, 0, 0, 0, location)
    if thisMonth.After(today) {
        return &thisMonth
    }
    
    // Must be next month
    nextMonth := thisMonth.AddDate(0, 1, 0)
    return &nextMonth
}
```

**Why this logic:**
- Bill due on 15th, today is 10th → due in 5 days (this month)
- Bill due on 15th, today is 20th → due next month
- Always returns midnight in the application timezone

**Edge case handling:**
```go
// Bill due on 31st, but next month is February
nextMonth := thisMonth.AddDate(0, 1, 0)
// Go automatically normalizes: Feb 31 → Mar 3
// This is correct behavior - bill rolls to first valid day
```

## Usage in Service Layer

### Bill Service (`internal/services/bill_service.go`)

```go
func (s *BillService) GetBillsWithStatus(userID string) ([]*models.Bill, error) {
    bills, err := s.repo.GetBillsByUser(userID)
    if err != nil {
        return nil, err
    }
    
    // Get today in application timezone
    today := date.TodayInLocation()
    
    for _, bill := range bills {
        // Calculate next due date
        bill.NextDueDate = date.NextDueDateFromDay(bill.DueDay, utils.AppLocation)
        
        // Check if paid this cycle
        bill.IsPaid = s.IsBillPaidForCycle(bill.ID, *bill.NextDueDate)
    }
    
    return bills, nil
}
```

**Why in service layer:**
- Services contain business logic
- Repositories just fetch data
- Handlers format for HTTP response

### Payment Service

```go
func (s *BillService) CreatePayment(payment *models.Payment) error {
    // Ensure payment date is in application timezone
    payment.PaymentDate = payment.PaymentDate.In(utils.AppLocation)
    
    return s.paymentRepo.CreatePayment(payment)
}
```

**Why convert timezone:**
- User might submit payment from different timezone
- Need consistent date for "is paid" checks
- Database stores UTC, but we want local date semantics

## Grace Period Logic

From `config.yaml`:
```yaml
bills:
  payment_grace_days: 3
```

**Implementation:**
```go
func (s *BillService) IsBillPaidForCycle(billID string, dueDate time.Time) bool {
    graceDate := dueDate.AddDate(0, 0, s.cfg.Bills.PaymentGraceDays)
    
    payments := s.paymentRepo.GetPaymentsByBill(billID)
    for _, payment := range payments {
        paymentDate := payment.PaymentDate.In(utils.AppLocation).Truncate(24 * time.Hour)
        
        // Paid within grace period?
        if paymentDate.After(dueDate.AddDate(0, -1, 0)) && paymentDate.Before(graceDate) {
            return true
        }
    }
    return false
}
```

**Why grace period:**
- Bill due 15th, paid 17th → still counts as "paid on time"
- Configurable per deployment
- Users see consistent "paid" status

## Database Storage

**Rule:** Database stores UTC timestamps

```go
type Payment struct {
    ID          string    `gorm:"primaryKey"`
    PaymentDate time.Time `gorm:"type:datetime"`  // Stored as UTC
    CreatedAt   time.Time
}
```

**Why UTC in database:**
- Standard practice
- No daylight saving time confusion
- Can query across timezones
- Convert to app timezone when needed

**GORM handles conversion automatically:**
```go
payment.PaymentDate = time.Date(2024, 1, 15, 0, 0, 0, 0, utils.AppLocation)
db.Create(&payment)
// Stored as: 2024-01-15 08:00:00 UTC (if PST is -8 hours)

var loaded Payment
db.First(&loaded)
// loaded.PaymentDate is still 2024-01-15 08:00:00 UTC
// Convert: loaded.PaymentDate.In(utils.AppLocation) → 2024-01-15 00:00:00 PST
```

## Common Pitfalls

### ❌ Using time.Now() directly
```go
today := time.Now().Truncate(24 * time.Hour)  // Uses server's local time!
```

**✅ Correct:**
```go
today := date.TodayInLocation()  // Uses application timezone
```

### ❌ Creating dates without location
```go
dueDate := time.Date(2024, 1, 15, 0, 0, 0, 0, time.Local)  // Server local!
```

**✅ Correct:**
```go
dueDate := date.DateForMonthDay(2024, 1, 15)  // Application timezone
```

### ❌ Comparing dates in different timezones
```go
if payment.PaymentDate.Before(dueDate) {  // Might be in different timezones!
```

**✅ Correct:**
```go
paymentDate := payment.PaymentDate.In(utils.AppLocation).Truncate(24 * time.Hour)
if paymentDate.Before(dueDate) {
```

### ❌ Hardcoding timezone
```go
loc, _ := time.LoadLocation("America/Los_Angeles")  // Wrong!
```

**✅ Correct:**
```go
// Use the configured global
nextDue := date.NextDueDateFromDay(15, utils.AppLocation)
```

## Testing

**Why this matters for tests:**

```go
func TestNextDueDate(t *testing.T) {
    // Set test timezone
    utils.AppLocation, _ = time.LoadLocation("America/Los_Angeles")
    
    // Create test date in that timezone
    testDate := date.DateForMonthDay(2024, 1, 10)
    
    // Test uses consistent timezone
    nextDue := date.NextDueDateFromDay(15, utils.AppLocation)
    assert.True(t, nextDue.After(testDate))
}
```

**Testing different timezones:**
```go
func TestNextDueDate_Tokyo(t *testing.T) {
    utils.AppLocation, _ = time.LoadLocation("Asia/Tokyo")
    // Test still works - uses configured timezone
}
```

## Multi-Timezone Support (Future)

**Current architecture supports per-user timezones:**

```go
type User struct {
    Timezone string  // Add this field
}

func (s *BillService) GetBillsWithStatus(userID string) ([]*models.Bill, error) {
    user := s.userRepo.GetUser(userID)
    userLocation, _ := time.LoadLocation(user.Timezone)
    
    today := time.Now().In(userLocation).Truncate(24 * time.Hour)
    // Rest of logic uses userLocation instead of utils.AppLocation
}
```

**Not implemented because:**
- Adds complexity
- Single-user app doesn't need it
- Can add later without breaking changes

## Summary

**Key principles:**
1. Configure one application timezone
2. Always use `utils.AppLocation` for date math
3. Store UTC in database, convert on read
4. Use `pkg/utils/date.go` functions, not raw `time` package
5. Test with explicit timezone to ensure consistency

**The timezone is set once at startup and never changes during runtime.**
