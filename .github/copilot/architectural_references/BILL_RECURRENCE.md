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

### Database Schema

```sql
CREATE TABLE bills (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    amount REAL NOT NULL,
    recurrence_days INTEGER NOT NULL CHECK(recurrence_days >= 1),
    category_id TEXT NULL,
    recurrence_type TEXT DEFAULT 'none' CHECK(recurrence_type IN ('none', 'fixed_date', 'interval')),
    start_date DATETIME NULL,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);
```

**Key Fields:**
- `recurrence_type`: Determines how the bill recurs
  - `"none"`: One-time bill (non-recurring)
  - `"fixed_date"`: Recurs monthly on a specific day
  - `"interval"`: Recurs every N days
- `recurrence_days`: Meaning depends on `recurrence_type`
  - For `fixed_date`: Day of month (1-31)
  - For `interval`: Number of days between occurrences (1-365)
  - For `none`: Unused but must have a value (typically 1)
- `start_date`: Optional reference date for calculating due dates
  - For `none`: The date when the bill is due
  - For `interval`: The starting date for the interval calculation
  - For `fixed_date`: Not used (uses current month logic)
  - If null, falls back to `created_at` for backward compatibility

### Go Model

```go
type Bill struct {
    ID             string    `json:"id" gorm:"primaryKey"`
    UserID         string    `json:"user_id" gorm:"not null"`
    Name           string    `json:"name" gorm:"not null" binding:"required"`
    Amount         float64   `json:"amount" gorm:"not null" binding:"required,gt=0"`
    RecurrenceDays int       `json:"recurrence_days" gorm:"not null;check:recurrence_days >= 1" binding:"required,min=1"`
    CategoryID     *string   `json:"category_id"`
    RecurrenceType string    `json:"recurrence_type" gorm:"default:none;check:recurrence_type IN ('none', 'fixed_date', 'interval')" binding:"oneof=none fixed_date interval"`
    StartDate      *time.Time `json:"start_date,omitempty"`
    Notes          string    `json:"notes"`
    CreatedAt      time.Time `json:"created_at" gorm:"autoCreateTime" binding:"-"`
    UpdatedAt      time.Time `json:"updated_at" gorm:"autoUpdateTime" binding:"-"`

    // Computed fields (not stored in database)
    IsPaid       bool       `json:"is_paid" gorm:"-"`
    NextDueDate  *time.Time `json:"next_due_date,omitempty" gorm:"-"`
    LastPaidDate *time.Time `json:"last_paid_date,omitempty" gorm:"-"`
}
```

## Validation Rules

### Application-Level Validation (`bill_service.go`)

```go
func (s *BillService) validateBillRecurrence(bill *models.Bill) error {
    // Validate recurrence_type
    if bill.RecurrenceType != "none" && bill.RecurrenceType != "fixed_date" && bill.RecurrenceType != "interval" {
        return fmt.Errorf("invalid recurrence_type: must be 'none', 'fixed_date', or 'interval'")
    }

    // Validate recurrence_days based on recurrence_type
    if bill.RecurrenceType == "fixed_date" {
        // For fixed_date, recurrence_days must be 1-31 (day of month)
        if bill.RecurrenceDays < 1 || bill.RecurrenceDays > 31 {
            return fmt.Errorf("recurrence_days must be between 1 and 31 for fixed_date bills")
        }
    } else if bill.RecurrenceType == "interval" {
        // For interval, recurrence_days must be at least 1 and not exceed maximum
        if bill.RecurrenceDays < 1 {
            return fmt.Errorf("recurrence_days must be at least 1 for interval bills")
        }
        if bill.RecurrenceDays > s.config.Bills.MaximumBillingInterval {
            return fmt.Errorf("recurrence_days cannot exceed %d days for interval bills", s.config.Bills.MaximumBillingInterval)
        }
    }

    return nil
}
```

**Why validate at application level:**
- Database constraints are basic (just >= 1)
- Application logic enforces context-specific rules
- Better error messages for users
- Configuration-based limits (MaximumBillingInterval)

### Configuration

```yaml
bills:
  payment_grace_days: 7  # Days before due date to consider paid
  maximum_billing_interval: 365  # Max days for interval bills
```

**Why configurable maximum:**
- Prevents unreasonably long intervals
- Can be adjusted per deployment
- Default 365 days (1 year) is sensible

## Date Calculation Logic

### Fixed Date Recurrence

**Behavior:** Bill recurs on the same day each month
- Example: Bill with `recurrence_days=15` is due on the 15th of every month
- If the day doesn't exist in a month (e.g., 31st in February), uses last day of month

**Initial calculation** (`CalculateNextDueDate`):
```go
func CalculateNextDueDate(dueDay int, referenceDate time.Time) time.Time {
    referenceDate = ConvertToAppTimezone(referenceDate)
    
    year := referenceDate.Year()
    month := referenceDate.Month()
    refDay := referenceDate.Day()

    // Try current month first
    nextDue := time.Date(year, month, dueDay, 0, 0, 0, 0, GetAppLocation())

    // If due day already passed this month, move to next month
    if dueDay < refDay {
        month++
        if month > 12 {
            month = 1
            year++
        }
        nextDue = time.Date(year, month, dueDay, 0, 0, 0, 0, GetAppLocation())
    }

    // Handle months where day doesn't exist
    if nextDue.Day() != dueDay {
        nextDue = time.Date(year, month, 1, 0, 0, 0, 0, GetAppLocation()).AddDate(0, 0, -1)
    }

    return nextDue
}
```

**After payment** (`CalculateNextDueDateAfterPayment`):
```go
func CalculateNextDueDateAfterPayment(dueDay int, paymentDate time.Time) time.Time {
    paymentDate = ConvertToAppTimezone(paymentDate)
    
    // Move to next month
    nextMonth := paymentDate.AddDate(0, 1, 0)
    
    nextDue := time.Date(nextMonth.Year(), nextMonth.Month(), dueDay, 0, 0, 0, 0, GetAppLocation())

    // Check if we rolled too far forward
    monthDiff := int(nextDue.Month()) - int(paymentDate.Month())
    if monthDiff < 0 {
        monthDiff += 12
    }

    if monthDiff > 1 {
        // Use last day of next month
        nextDue = time.Date(nextMonth.Year(), nextMonth.Month()+1, 1, 0, 0, 0, 0, GetAppLocation()).AddDate(0, 0, -1)
    }

    return nextDue
}
```

**✅ Correct usage:**
```go
// Bill created Jan 5 with recurrence_days=15
nextDue := utils.CalculateNextDueDate(15, createdDate)  // Jan 15

// After paying on Jan 15
nextDue := utils.CalculateNextDueDateAfterPayment(15, jan15)  // Feb 15
```

**❌ Common mistakes:**
```go
// Don't use interval functions for fixed_date
nextDue := utils.CalculateNextDueDateInterval(15, createdDate)  // Wrong!

// Don't forget timezone conversion
nextDue := time.Date(year, month, dueDay, 0, 0, 0, 0, time.UTC)  // Wrong!
```

### Interval Recurrence

**Behavior:** Bill recurs every N days
- Example: Bill with `recurrence_days=14` is due every 14 days
- Simple addition, no month boundaries to worry about

**Initial calculation** (`CalculateNextDueDateInterval`):
```go
func CalculateNextDueDateInterval(intervalDays int, referenceDate time.Time) time.Time {
    referenceDate = ConvertToAppTimezone(referenceDate)
    
    // Normalize to midnight
    nextDue := time.Date(referenceDate.Year(), referenceDate.Month(), referenceDate.Day(), 0, 0, 0, 0, GetAppLocation())
    nextDue = nextDue.AddDate(0, 0, intervalDays)

    return nextDue
}
```

**After payment** (`CalculateNextDueDateAfterPaymentInterval`):
```go
func CalculateNextDueDateAfterPaymentInterval(intervalDays int, paymentDate time.Time) time.Time {
    paymentDate = ConvertToAppTimezone(paymentDate)
    
    // Normalize to midnight
    nextDue := time.Date(paymentDate.Year(), paymentDate.Month(), paymentDate.Day(), 0, 0, 0, 0, GetAppLocation())
    nextDue = nextDue.AddDate(0, 0, intervalDays)

    return nextDue
}
```

**✅ Correct usage:**
```go
// Bill created Jan 1 with recurrence_days=14
nextDue := utils.CalculateNextDueDateInterval(14, jan1)  // Jan 15

// After paying on Jan 15
nextDue := utils.CalculateNextDueDateAfterPaymentInterval(14, jan15)  // Jan 29

// After paying on Jan 29
nextDue := utils.CalculateNextDueDateAfterPaymentInterval(14, jan29)  // Feb 12
```

**Example: Bi-weekly gym membership**
```
Created: Jan 1
Next Due: Jan 15 (Jan 1 + 14 days)
Paid: Jan 15
Next Due: Jan 29 (Jan 15 + 14 days)
Paid: Jan 29
Next Due: Feb 12 (Jan 29 + 14 days)
```

### Non-Recurring Bills

**Behavior:** Bill is due once, no next due date after payment
- `recurrence_type="none"`
- `NextDueDate` is always `nil`
- `IsPaid` is based solely on payment history

```go
func (s *BillService) calculateNextDueDate(bill *models.Bill) (*time.Time, *time.Time, error) {
    // Non-recurring bills don't have a next due date
    if bill.RecurrenceType == "none" {
        return nil, nil, nil
    }
    // ... rest of logic for recurring bills
}
```

## Service Layer Logic

### Calculating Next Due Date

```go
func (s *BillService) calculateNextDueDate(bill *models.Bill) (*time.Time, *time.Time, error) {
    // Non-recurring bills use start_date as due date
    if bill.RecurrenceType == "none" {
        if bill.StartDate != nil {
            return bill.StartDate, nil, nil
        }
        return nil, nil, nil
    }

    // Get the most recent payment
    latestPayment, err := s.paymentRepo.GetLatestByBillID(bill.ID)
    if err != nil {
        return nil, nil, err
    }

    var nextDue time.Time
    var lastPaidPtr *time.Time

    if latestPayment != nil {
        // Bill has payments - calculate from last payment date
        lastPaidPtr = &latestPayment.CreatedAt
        
        // Calculate based on recurrence type
        if bill.RecurrenceType == "fixed_date" {
            nextDue = utils.CalculateNextDueDateAfterPayment(bill.RecurrenceDays, latestPayment.PaymentDate)
        } else if bill.RecurrenceType == "interval" {
            nextDue = utils.CalculateNextDueDateAfterPaymentInterval(bill.RecurrenceDays, latestPayment.PaymentDate)
        }
    } else {
        // No payments - use start_date if provided, otherwise created_at
        referenceDate := bill.CreatedAt
        if bill.StartDate != nil {
            referenceDate = *bill.StartDate
        }
        
        // Calculate based on recurrence type
        if bill.RecurrenceType == "fixed_date" {
            nextDue = utils.CalculateNextDueDate(bill.RecurrenceDays, referenceDate)
        } else if bill.RecurrenceType == "interval" {
            nextDue = utils.CalculateNextDueDateInterval(bill.RecurrenceDays, referenceDate)
        }
    }

    return &nextDue, lastPaidPtr, nil
}
```

**Why separate logic for with/without payments:**
- Bills without payments: Calculate from start_date (if provided) or creation date
- Bills with payments: Calculate from last payment date
- Different semantics for each recurrence type

**Why start_date is optional:**
- Backward compatibility with existing bills (falls back to created_at)
- Fixed date bills don't need it (they use current month logic)
- Interval and one-time bills benefit most from custom start dates

### Determining Paid Status

```go
func (s *BillService) calculateIsPaid(bill *models.Bill) (bool, error) {
    if bill.RecurrenceType != "none" {
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
```

**Why different logic:**
- **Recurring bills:** "Paid" means next due date is far enough away
  - Grace period prevents showing as unpaid immediately before due date
- **Non-recurring bills:** "Paid" means any payment exists
  - Once paid, always paid (no future due dates)

## Frontend Implementation

### Natural Language Sentence UI

**Design Philosophy:**
- Intuitive sentence format: "Due [type] [dynamic content]"
- Users read and understand the pattern naturally
- Interactive elements embedded in the sentence
- Compact, clean layout without separate labeled fields

**Implementation:**
```jsx
<div class="recurrence-sentence">
  <span class="sentence-text">Due</span>
  <select
    id="recurrence_type"
    name="recurrence_type"
    value={formData.recurrence_type}
    onChange={handleInputChange}
    class="inline-select"
    required
  >
    <option value="none">once</option>
    <option value="fixed_date">monthly</option>
    <option value="interval">every</option>
  </select>

  {formData.recurrence_type === "fixed_date" && (
    <>
      <span class="sentence-text">on the</span>
      <input
        type="number"
        name="recurrence_days"
        value={formData.recurrence_days}
        onChange={handleInputChange}
        class="inline-number-input"
        required
        min="1"
        max="31"
      />
      <span class="sentence-text">
        {getDaySuffix(parseInt(formData.recurrence_days))} of the month
      </span>
    </>
  )}

  {formData.recurrence_type === "interval" && (
    <>
      <input
        type="number"
        name="recurrence_days"
        value={formData.recurrence_days}
        onChange={handleInputChange}
        class="inline-number-input"
        required
        min="1"
        max="365"
      />
      <span class="sentence-text">days starting on</span>
      <DatePicker
        selected={formData.start_date}
        onChange={handleDateChange}
        dateFormat="MM/dd/yyyy"
        placeholderText="Select date"
        className="inline-date-picker"
        required
      />
    </>
  )}

  {formData.recurrence_type === "none" && (
    <>
      <span class="sentence-text">on</span>
      <DatePicker
        selected={formData.start_date}
        onChange={handleDateChange}
        dateFormat="MM/dd/yyyy"
        placeholderText="Select date"
        className="inline-date-picker"
        required
      />
    </>
  )}
</div>
```

**Resulting Sentences:**
- One-time: "Due **once** on **11/15/2025**"
- Monthly: "Due **monthly** on the **15th** of the month"
- Interval: "Due **every** **14** days starting on **11/15/2025**"

**Why this approach:**
- **Readable:** Non-technical users understand immediately
- **Compact:** No separate label/field pairs taking vertical space
- **Contextual:** Only shows relevant fields for selected type
- **Professional:** Looks polished and modern

**CSS Styling:**
```css
.recurrence-sentence {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  font-size: 1rem;
}

.inline-select {
  width: auto;
  max-width: 120px;
  padding: 0.4rem 0.6rem;
}

.inline-number-input {
  width: 4rem;
  min-width: 4rem;
  max-width: 4rem;
  text-align: center;
  flex-shrink: 0;
}

.inline-date-picker {
  width: 8rem;
  min-width: 8rem;
  max-width: 8rem;
  flex-shrink: 0;
}
```

**Why specific widths:**
- Dropdown: Auto-sizes to content, prevents unnecessary width
- Number input: Fixed 4rem prevents text overlap with spinner removal
- Date picker: Fixed 8rem fits date format (MM/DD/YYYY)
- `flex-shrink: 0`: Prevents flex container from changing widths

**DatePicker Integration:**
```jsx
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const handleDateChange = (date) => {
  setFormData((prev) => ({
    ...prev,
    start_date: date,
  }));
};

// When submitting
const billData = {
  // ... other fields
  start_date: formData.start_date ? formData.start_date.toISOString() : null,
};
```

**Why react-datepicker:**
- 10M+ weekly downloads, well-maintained
- Works with Preact (React alternative)
- Accessible, keyboard navigable
- Customizable styling
- Mobile-friendly

### Display Logic

**Bill Card Display:**
```jsx
{bill.recurrence_type === "fixed_date" && (
  <p class="due-date">
    Due Day: {bill.recurrence_days}
    {getDaySuffix(bill.recurrence_days)} of each month
  </p>
)}
{bill.recurrence_type === "interval" && (
  <>
    <p class="due-date">
      Due every: {bill.recurrence_days} day{bill.recurrence_days !== 1 ? "s" : ""}
    </p>
    {bill.start_date && (
      <p class="due-date">
        Starting: {new Date(bill.start_date).toLocaleDateString()}
      </p>
    )}
  </>
)}
{bill.recurrence_type === "none" && (
  <>
    <p class="due-date">One-time bill</p>
    {bill.start_date && (
      <p class="due-date">
        Due: {new Date(bill.start_date).toLocaleDateString()}
      </p>
    )}
  </>
)}
```

**Why conditional rendering:**
- Each recurrence type shows different information
- Natural language descriptions ("15th of each month" vs "every 14 days")
- Clear visual distinction between types
- Shows start_date for interval and one-time bills when available

**Bill Details Page:**
```jsx
{(bill.recurrence_type === "interval" || bill.recurrence_type === "none") && bill.start_date && (
  <div class="info-item">
    <label>
      {bill.recurrence_type === "interval" ? "Start Date" : "Due Date"}
    </label>
    <div>{formatDate(bill.start_date)}</div>
  </div>
)}
```

**Why different labels:**
- Interval bills: "Start Date" indicates when the interval began
- One-time bills: "Due Date" indicates when the bill is due
- Fixed date bills: Don't show start_date (uses current month logic)

**Badge Display:**
```jsx
{bill.recurrence_type === "fixed_date" && <span class="badge">Monthly</span>}
{bill.recurrence_type === "interval" && <span class="badge">Interval</span>}
```

**Why badges:**
- Quick visual identifier of recurrence type
- No badge for one-time bills (default state)
- Color/style can distinguish types

## Common Use Cases

### Monthly Rent (Fixed Date)
```json
{
  "name": "Apartment Rent",
  "amount": 1500,
  "recurrence_type": "fixed_date",
  "recurrence_days": 1
}
```
**Result:** Due on 1st of every month

### Bi-weekly Gym (Interval)
```json
{
  "name": "Gym Membership",
  "amount": 45,
  "recurrence_type": "interval",
  "recurrence_days": 14
}
```
**Result:** Due every 14 days from creation/last payment

### Annual Insurance (One-time)
```json
{
  "name": "Car Insurance",
  "amount": 1200,
  "recurrence_type": "none",
  "recurrence_days": 1
}
```
**Result:** Due once, no recurrence

### Every 30 Days Subscription (Interval)
```json
{
  "name": "Streaming Service",
  "amount": 15.99,
  "recurrence_type": "interval",
  "recurrence_days": 30
}
```
**Result:** Due every 30 days (not monthly - avoids month boundary issues)

## Testing Considerations

**Test Cases for Fixed Date:**
- Bill due on day that exists in all months (e.g., 15th)
- Bill due on day that doesn't exist in some months (e.g., 31st)
- Payment near end of month rolling to next month
- Payment on Feb 28/29 with due day of 31

**Test Cases for Interval:**
- Interval that crosses month boundaries
- Interval that crosses year boundaries
- Very short intervals (1-2 days)
- Longer intervals (30+ days)

**Test Cases for One-time:**
- Bill without payment shows as unpaid
- Bill with payment shows as paid
- No next_due_date calculated

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

## Future Enhancements

Possible future features:
- **Custom recurrence patterns:** "Every 1st and 15th", "Last day of month"
- **End dates:** "Recurring until December 2025"
- **Skip logic:** "Skip December payment"
- **Prorated amounts:** First/last month partial amounts
- **Multiple payment schedules:** Split payments (half on 1st, half on 15th)

These can be added without breaking the current architecture.
