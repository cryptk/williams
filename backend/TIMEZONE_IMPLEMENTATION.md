# Timezone Implementation

## Overview

The Williams backend now has proper timezone support to ensure consistent date/time handling across the application. All dates and times are stored and processed in a configurable timezone.

## Configuration

### Setting the Timezone

The timezone is configured in `config.yaml`:

```yaml
timezone: America/New_York  # or any IANA timezone like "UTC", "America/Chicago", etc.
```

Or via environment variable:

```bash
export WILLIAMS_TIMEZONE=America/New_York
```

**Default:** UTC

## How It Works

### 1. Application Startup

When the application starts (`cmd/server/main.go`):
1. Configuration is loaded (including timezone)
2. Timezone is initialized via `utils.InitTimezone(cfg.Timezone)`
3. All subsequent date operations use this configured timezone

### 2. Incoming Requests

When the frontend sends a datetime (e.g., payment_date):
- The frontend sends datetime in ISO 8601/RFC3339 format (includes timezone info)
- Backend handler converts it to the configured timezone using `utils.ConvertToAppTimezone()`
- Example in `handlers.go`:
  ```go
  payment.PaymentDate = utils.ConvertToAppTimezone(payment.PaymentDate)
  ```

### 3. Database Storage

All timestamps stored in the database are in the configured timezone:
- `bill.CreatedAt` → stored in app timezone
- `bill.UpdatedAt` → stored in app timezone  
- `payment.PaymentDate` → converted to app timezone before storage
- Repository layer uses `utils.NowInAppTimezone()` for current time

### 4. Date Calculations

Date calculations (in `pkg/utils/date.go`) always use the app timezone:
- `CalculateNextDueDate()` → converts reference date to app timezone
- `CalculateNextDueDateAfterPayment()` → converts payment date to app timezone
- All `time.Date()` calls use `GetAppLocation()` for consistency

### 5. API Responses

When the backend sends responses:
- All datetime fields are already in the configured timezone
- JSON marshaling preserves timezone information
- Frontend should display these in the user's browser local time

## Frontend Integration

### Recommended Frontend Behavior

The frontend should:

1. **Accept user input in local time:**
   ```javascript
   // User enters date/time in their local timezone
   const paymentDate = new Date('2025-09-30T14:30:00'); // Local time
   ```

2. **Send to backend in ISO 8601 format:**
   ```javascript
   // toISOString() converts to UTC but preserves the moment in time
   const payload = {
     payment_date: paymentDate.toISOString() // "2025-09-30T18:30:00.000Z"
   };
   ```

3. **Display responses in local time:**
   ```javascript
   // Backend returns: "2025-09-30T14:30:00-04:00" (in America/New_York)
   // Browser automatically converts to user's local time for display
   const date = new Date(bill.payment_date);
   date.toLocaleString(); // Displays in user's timezone
   ```

## Utility Functions

### `pkg/utils/timezone.go`

- `InitTimezone(tzString)` - Initialize app timezone (call once at startup)
- `GetAppLocation()` - Get the configured timezone location
- `ConvertToAppTimezone(t)` - Convert any time to app timezone
- `NowInAppTimezone()` - Get current time in app timezone
- `ParseAndConvertToAppTimezone(str)` - Parse RFC3339 string and convert to app timezone

### `pkg/utils/date.go`

- `CalculateNextDueDate(dueDay, referenceDate)` - Calculate next due date from a day-of-month
- `CalculateNextDueDateAfterPayment(dueDay, paymentDate)` - Calculate next due date after payment

Both functions automatically convert inputs to app timezone.

## Example Scenarios

### Scenario 1: User in California, Server in New York

**Config:** `timezone: America/New_York`

1. User in LA (Pacific Time, UTC-7) records payment at 2:30 PM local
2. Browser sends: `"2025-09-30T14:30:00-07:00"`
3. Backend converts to: `2025-09-30T17:30:00-04:00` (NY time)
4. Stored in DB as: `2025-09-30 17:30:00` (NY time)
5. Response sent: `"2025-09-30T17:30:00-04:00"`
6. User's browser displays: `Sept 30, 2:30 PM PDT` (converted back to Pacific)

### Scenario 2: Multiple Users in Different Timezones

**Config:** `timezone: UTC`

- All dates stored in UTC for consistency
- Each user sees dates converted to their local time
- Date calculations (bill due dates) happen in UTC
- No confusion about "which timezone is this date in?"

## Migration Notes

### Existing Data

When switching timezone configuration:
- Existing timestamps in the database remain unchanged
- They are simply interpreted in the new timezone
- **Important:** If changing timezone, ensure your data is already normalized to that timezone

### Best Practice

- Use UTC for multi-timezone deployments
- Use local timezone (e.g., America/New_York) for single-location deployments
- Document the chosen timezone in deployment docs

## Testing

To test timezone handling:

```bash
# Start with different timezones
export WILLIAMS_TIMEZONE=America/Los_Angeles
./williams

# Or modify config.yaml
timezone: America/Chicago
```

Then:
1. Create a bill with today's date
2. Record a payment with a specific time
3. Verify next due date calculation is correct for the configured timezone
4. Check that dates display consistently

## Troubleshooting

### "Failed to load timezone" error

- Ensure timezone string is valid IANA format
- Common valid values: `UTC`, `America/New_York`, `America/Chicago`, `America/Los_Angeles`, `Europe/London`
- Invalid: `EST`, `PST`, `EDT` (use full IANA names)

### Dates off by one day

- Check that frontend is sending timezone information in ISO 8601 format
- Verify `payment_date` includes timezone offset (e.g., `-04:00` or `Z` for UTC)
- Use `toISOString()` in JavaScript to ensure proper format

### Calculations show wrong due date

- Verify bill's `created_at` is in the app timezone
- Check that `payment.payment_date` was converted to app timezone before storage
- Review logs for timezone conversion during calculations
