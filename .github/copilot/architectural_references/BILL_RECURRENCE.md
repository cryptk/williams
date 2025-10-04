# Bill Recurrence Architecture

## Why Multiple Recurrence Types

**Problem:** Bills recur in different patterns
- Monthly bills: due on a specific day each month (rent on 1st, utilities on 15th)
- Interval bills: due every N days regardless of month boundaries (gym every 14 days)
- One-time bills: non-recurring expenses (annual insurance, one-time fees)

**Solution:** Flexible recurrence type system
- Users choose the pattern that matches their bill
- Backend calculates next due dates correctly for each type
- Prevents confusion and improper bill tracking

## Data Model

### Key Fields

**recurrence_type**: Determines how the bill recurs
- `"none"`: One-time bill (non-recurring)
- `"fixed_date"`: Recurs monthly on a specific day
- `"interval"`: Recurs every N days

**recurrence_days**: Meaning depends on recurrence_type
- For `fixed_date`: Day of month (1-31)
- For `interval`: Number of days between occurrences (1-365)
- For `none`: Unused but must have a value (typically 1)

**start_date**: Optional reference date for calculating due dates
- For `none`: The date when the bill is due
- For `interval`: The starting date for the interval calculation
- For `fixed_date`: Not used (uses current month logic)
- If null, falls back to `created_at` for backward compatibility

### Go Model

```go
type Bill struct {
    ID             string
    UserID         string
    Name           string
    Amount         float64
    RecurrenceDays int       // Day of month or interval days
    CategoryID     *string
    RecurrenceType string    // "none", "fixed_date", or "interval"
    StartDate      *time.Time
    Notes          string
    CreatedAt      time.Time
    UpdatedAt      time.Time
    
    // Computed fields (not stored)
    IsPaid       bool
    NextDueDate  *time.Time
    LastPaidDate *time.Time
}
```

## Validation Rules

Validation happens at the application level in `bill_service.go`:

**Fixed Date Bills:**
- `recurrence_days` must be 1-31 (day of month)

**Interval Bills:**
- `recurrence_days` must be at least 1
- Cannot exceed `MaximumBillingInterval` (default: 365 days, configurable)

**Configuration:**
```yaml
bills:
  payment_grace_days: 7
  maximum_billing_interval: 365
```

**Why application-level validation:**
- Database only enforces basic constraint (`>= 1`)
- Application logic enforces context-specific rules
- Better error messages for users
- Configuration-based limits

## Date Calculation Logic

### Fixed Date Recurrence

**Behavior:** Bill recurs on the same day each month (e.g., 15th of every month). If the day doesn't exist in a month (e.g., 31st in February), uses the last day of that month.

**Functions** (in `pkg/utils/date.go`):
- `CalculateNextDueDate(dueDay, referenceDate)` - Initial calculation from creation/start date
- `CalculateNextDueDateAfterPayment(dueDay, paymentDate)` - After payment made

**Key logic:**
- If due day hasn't occurred this month, use this month
- If due day already passed, use next month
- Handle month boundaries automatically (Feb 31 → Feb 28/29)

### Interval Recurrence

**Behavior:** Bill recurs every N days from a reference point. Simple date addition, no month boundaries.

**Functions** (in `pkg/utils/date.go`):
- `CalculateNextDueDateInterval(intervalDays, referenceDate)` - Initial calculation
- `CalculateNextDueDateAfterPaymentInterval(intervalDays, paymentDate)` - After payment

**Key logic:**
- Add interval days to reference date
- Always midnight in application timezone
- Crosses month/year boundaries naturally

### Non-Recurring Bills

**Behavior:** Bill is due once, no next due date after payment.

**Logic:**
- `NextDueDate` is always `nil`
- `IsPaid` based solely on payment existence
- Uses `start_date` as the due date if provided

## Service Layer Logic

The `BillService` calculates next due dates and paid status for each bill type:

**For non-recurring bills:**
- Uses `start_date` as due date if provided
- `NextDueDate` is `nil`
- `IsPaid` = true if any payment exists

**For recurring bills without payments:**
- Calculate from `start_date` if provided, otherwise from `created_at`
- Use appropriate function based on `recurrence_type`

**For recurring bills with payments:**
- Calculate from last payment's `PaymentDate`
- Use "after payment" variant of calculation function

**Paid status for recurring bills:**
- Check if `NextDueDate` is at least `payment_grace_days` in the future
- Grace period prevents showing as unpaid immediately before due date

## Frontend Implementation

### Natural Language Sentence UI

The bill form uses an intuitive sentence format: "Due [type] [dynamic content]"

**Implementation approach:**
- Interactive elements embedded in readable sentence
- Conditional rendering based on selected recurrence type
- Compact, clean layout without separate labeled fields

**Resulting sentences:**
- One-time: "Due **once** on **11/15/2025**"
- Monthly: "Due **monthly** on the **15th** of the month"
- Interval: "Due **every** **14** days starting on **11/15/2025**"

**Why this UI pattern:**
- Non-technical users understand immediately
- Professional and polished appearance
- Contextual - only shows relevant fields
- Space-efficient

**Component:** `src/components/BillFormModal/index.jsx`

### Display Logic

Bills show different information based on recurrence type:

**Fixed Date:**
- "Due Day: 15th of each month"

**Interval:**
- "Due every: 14 days"
- "Starting: 11/15/2025" (if start_date present)

**One-time:**
- "One-time bill"
- "Due: 11/15/2025" (if start_date present)

**Badges:**
- Monthly bills show "Monthly" badge
- Interval bills show "Interval" badge
- One-time bills have no badge (default state)

## Common Use Cases

### Monthly Rent (Fixed Date)
Due on 1st of every month
```json
{
  "recurrence_type": "fixed_date",
  "recurrence_days": 1
}
```

### Bi-weekly Gym (Interval)
Due every 14 days
```json
{
  "recurrence_type": "interval",
  "recurrence_days": 14,
  "start_date": "2025-01-15"
}
```

### Annual Insurance (One-time)
Due once on specific date
```json
{
  "recurrence_type": "none",
  "start_date": "2025-06-01"
}
```

### Every 30 Days Subscription (Interval)
Avoids month boundary issues
```json
{
  "recurrence_type": "interval",
  "recurrence_days": 30
}
```

## Design Decisions

### Why Three Types Instead of Two

**Considered:** Just "recurring" (monthly) and "non-recurring"
**Chose:** Three types (fixed_date, interval, none)

**Reasoning:**
- Some bills truly recur on intervals, not monthly dates
- Gym memberships, subscriptions often work on day counts
- More flexible for future bill types
- Clearer semantics

### Why Not Support Weekly/Bi-weekly Directly

**Considered:** Add `recurrence_type="weekly"` with `recurrence_days=1-7`
**Chose:** Use interval with `recurrence_days=7` or `14`

**Reasoning:**
- Interval is more flexible (every 10 days, every 21 days, etc.)
- Simpler data model (one algorithm for all day-based recurrence)
- Users can still achieve weekly/bi-weekly easily
- Fewer special cases in code

### Why Validate Maximum Interval

**Considered:** Allow any interval value
**Chose:** Configurable maximum (default 365 days)

**Reasoning:**
- Prevents data entry errors (typo: 1400 instead of 14)
- Very long intervals likely indicate user confusion
- Can be increased if needed via configuration
- Reasonable default (1 year)

### Why Not Support Multiple Intervals Per Bill

**Considered:** Allow "every 1st and 15th" or "weekly on Monday and Thursday"
**Chose:** One recurrence pattern per bill

**Reasoning:**
- Simpler data model and logic
- Users can create multiple bills if needed
- Covers 95% of use cases
- Can add complex patterns later if needed


