# Timezone

Williams handles dates and times in a configurable timezone.

## Configuration

**Via config.yaml:**
```yaml
timezone: America/New_York  # Use IANA timezone format
```

**Via environment:**
```bash
export WILLIAMS_TIMEZONE=America/New_York
```

**Default:** UTC

## Common Values

- `UTC` - Coordinated Universal Time
- `America/New_York` - Eastern Time
- `America/Chicago` - Central Time
- `America/Denver` - Mountain Time
- `America/Los_Angeles` - Pacific Time

[Full list of IANA timezones](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones)

## Usage

### Frontend

**Sending dates:**
```javascript
const date = new Date('2025-09-30T14:30:00');
const payload = { payment_date: date.toISOString() };
```

**Displaying dates:**
```javascript
const date = new Date(bill.payment_date);
date.toLocaleString(); // Displays in user's timezone
```

### Backend

**Converting dates:**
```go
import "github.com/cryptk/williams/pkg/utils"

payment.PaymentDate = utils.ConvertToAppTimezone(payment.PaymentDate)
```

**Current time:**
```go
now := utils.NowInAppTimezone()
```

**Date calculations:**
```go
nextDue := utils.CalculateNextDueDate(bill.DueDay, time.Now())
```

## Troubleshooting

### "Failed to load timezone" error

Use full IANA names:
- ✅ `America/New_York` or `UTC`
- ❌ `EST` or `PST`

### Dates off by hours

Frontend must send ISO 8601 format with timezone:
```javascript
date.toISOString() // ✅ "2025-09-30T18:30:00.000Z"
date.toString()    // ❌ No timezone info
```
