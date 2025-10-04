# Zerolog Logging Architecture

## Why Zerolog

Williams uses [rs/zerolog](https://github.com/rs/zerolog) for structured logging because:

1. **Zero allocation**: No performance impact even with disabled log levels
2. **Structured**: Key-value pairs enable filtering and analysis in log aggregation systems
3. **Flexible output**: Console format for development, JSON for production
4. **Type-safe**: No reflection overhead
5. **Context preservation**: All logs include relevant identifiers (user_id, bill_id, etc.)

## Architecture

### Logger Initialization (`pkg/logger/logger.go`)

Centralized initialization ensures consistent behavior. Global logger pattern matches zerolog's recommended approach - just `import "github.com/rs/zerolog/log"`.

**Configuration options:**
- Level: debug, info, warn, error, fatal
- Format: console (human-readable, colored) or json (structured, for log aggregation)

### HTTP Request Logging (`internal/api/server.go`)

Custom middleware logs requests with structured fields:
- `method`, `path`: Identify endpoint
- `status`: Response code for filtering
- `latency`: Performance monitoring
- `client_ip`: Security auditing

### Database Query Logging (`internal/database/database.go`)

Custom GORM logger integrates with zerolog. Ignores "record not found" errors (normal control flow, not actual errors). See `GORM_LOGGER_RECORD_NOT_FOUND.md` for details.

**Log levels:**
- Debug: All queries
- Warn: Slow queries (>200ms)
- Error: Actual errors (not "record not found")

### Handler Logging Pattern

Log at error boundaries in handlers, not services:

```go
func (s *Server) createBill(c *gin.Context) {
    userID, _ := c.Get("user_id")
    
    if err := s.billService.CreateBill(&bill); err != nil {
        log.Error().
            Err(err).
            Str("user_id", userID.(string)).
            Msg("Failed to create bill")
        c.JSON(500, gin.H{"error": err.Error()})
        return
    }
}
```

**Why handlers log:**
- Services don't have user context
- Handlers know user_id from JWT
- Include both error and context for debugging

### Authentication Logging

Log auth events for security auditing:

```go
// Success - Info level
log.Info().Str("user_id", user.ID).Msg("User logged in")

// Failure - Warn level (not Error - expected behavior)
log.Warn().Str("username", req.Username).Msg("Login failed")
```

**Why Warn for failed logins:** Failed logins are expected (typos, wrong credentials). Reserve Error for unexpected failures (DB down, JWT signing fails).

### Structured Fields Strategy

**Always include:**
- Resource IDs: `user_id`, `bill_id`, `payment_id`, `category_id`
- Operation context: `operation`, `method`, `path`
- Errors: `Err(err)` for automatic error field
- Performance: `Dur("latency", duration)` for timing

**Field naming:** Snake case (`user_id`), IDs suffixed with `_id`, use `Err(err)` for errors.

**Never log:** Passwords, tokens, API keys, PII without need, large objects (use IDs).

## Log Level Strategy

- **Debug**: SQL queries, internal state, detailed traces (development only)
- **Info**: Application lifecycle, user actions, HTTP requests, normal operations
- **Warn**: Recoverable errors (failed login), performance issues (slow queries), unusual but handled situations
- **Error**: Operation failures, API errors, database errors (except "record not found"), business logic failures
- **Fatal**: Unrecoverable startup errors, configuration failures, database connection failures (**only use in main.go** - exits application)

## Configuration

**Development:**
```yaml
logging:
  level: debug
  format: console  # Colored, human-readable
```

**Production:**
```yaml
logging:
  level: info  # or warn to reduce volume
  format: json  # For log aggregation (ELK, Splunk)
```

## Performance Considerations

**Zero allocation when disabled:**
```go
log.Debug().Str("sql", query).Msg("Query")  // No allocation if level > debug
```

**❌ Avoid Msgf (always allocates):**
```go
log.Info().Msgf("User %s logged in", userID)  // Allocates even if disabled
```

**✅ Use structured fields:**
```go
log.Info().Str("user_id", userID).Msg("User logged in")  // Zero alloc if disabled
```
