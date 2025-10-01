# Logging

Williams uses [rs/zerolog](https://github.com/rs/zerolog) for structured logging.

## Configuration

**Via config.yaml:**
```yaml
logging:
  level: info  # debug, info, warn, error, fatal, panic, disabled
  format: console  # console or json
```

**Via environment:**
```bash
export WILLIAMS_LOGGING_LEVEL=debug
export WILLIAMS_LOGGING_FORMAT=json
```

## Log Levels

- **debug**: SQL queries, detailed traces
- **info**: Normal operations (default)
- **warn**: Recoverable issues
- **error**: Operation failures
- **fatal**: Startup errors (exits app)

## Usage

### Import

```go
import "github.com/rs/zerolog/log"
```

### Basic Logging

```go
// Simple message
log.Info().Msg("Server starting")

// With fields
log.Info().Str("user_id", userID).Int("port", 8080).Msg("Server started")

// With error
log.Error().Err(err).Str("operation", "create_bill").Msg("Operation failed")
```

### Field Types

```go
Str("key", "value")        // string
Int("count", 42)           // integer
Float64("amount", 29.99)   // float
Bool("active", true)       // boolean
Err(err)                   // error
Dur("latency", duration)   // time.Duration
Time("at", timestamp)      // time.Time
```

## Output Formats

**Console (development):**
```
2025-10-01T15:06:55-05:00 INF Williams server started host=localhost port=8080
```

**JSON (production):**
```json
{"level":"info","time":"2025-10-01T15:07:13-05:00","message":"Williams server started","host":"localhost","port":8080}
```

## Automatic Logging

- **HTTP requests**: Method, path, status, latency, IP (automatic)
- **Database queries**: Queries at debug level, slow queries at warn level (>200ms)
- **"Record not found" errors**: Not logged (expected behavior)

## Tips

- Use structured fields, not string formatting: `.Str("user_id", id)` not `.Msgf("user %s", id)`
- Choose appropriate levels: debug for traces, info for operations, error for failures
- Include identifiers: user_id, bill_id, etc. for debugging
- Don't log sensitive data: passwords, tokens, etc.
