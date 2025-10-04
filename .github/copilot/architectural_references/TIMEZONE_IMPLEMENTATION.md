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

**Why global:** Timezone doesn't change during runtime, avoids passing through every function, initialized once at startup.

### Date Calculations (`pkg/utils/date.go`)

**Getting current date in app timezone:**
```go
func TodayInLocation() time.Time {
    return time.Now().In(AppLocation).Truncate(24 * time.Hour)
}
```

**Creating dates for specific month:**
```go
func DateForMonthDay(year, month, day int) time.Time {
    return time.Date(year, time.Month(month), day, 0, 0, 0, 0, AppLocation)
}
```

**Next due date for recurring bills:**
See `BILL_RECURRENCE.md` for complete details on:
- `CalculateNextDueDate` / `CalculateNextDueDateInterval`
- `CalculateNextDueDateAfterPayment` / `CalculateNextDueDateAfterPaymentInterval`
- Edge case handling (months with fewer days)

## Usage in Service Layer

Bill service calculates next due dates and paid status using timezone-aware functions from `pkg/utils/date.go`. Services contain business logic; repositories just fetch data.

Payment service ensures dates are in application timezone before storage.

## Grace Period Logic

Configuration: `payment_grace_days: 3` in config.yaml

Bill is considered paid if next due date is at least grace_days in the future. Prevents showing as unpaid immediately before due date.

## Database Storage

**Rule:** Database stores UTC timestamps. GORM handles conversion automatically.

```go
payment.PaymentDate = time.Date(2024, 1, 15, 0, 0, 0, 0, utils.AppLocation)
db.Create(&payment)  // Stored as UTC

var loaded Payment
db.First(&loaded)  // Still UTC
loaded.PaymentDate.In(utils.AppLocation)  // Convert to app timezone
```

## Common Pitfalls

### ❌ Using time.Now() directly
```go
today := time.Now().Truncate(24 * time.Hour)  // Uses server local time!
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
if payment.PaymentDate.Before(dueDate) {  // Might be different timezones!
```

**✅ Correct:**
```go
paymentDate := payment.PaymentDate.In(utils.AppLocation).Truncate(24 * time.Hour)
if paymentDate.Before(dueDate) {
```

## Summary

**Key principles:**
1. Configure one application timezone
2. Always use `utils.AppLocation` for date math
3. Store UTC in database, convert on read
4. Use `pkg/utils/date.go` functions, not raw `time` package
5. Test with explicit timezone for consistency
