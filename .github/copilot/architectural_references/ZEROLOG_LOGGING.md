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

**Why centralized initialization:**
- Single point of configuration
- Ensures consistent behavior across application
- Easy to modify global logging behavior

**Implementation:**
```go
func Init(level, format string) {
    logLevel := parseLevel(level)
    zerolog.SetGlobalLevel(logLevel)
    
    if format == "console" {
        log.Logger = log.Output(zerolog.ConsoleWriter{...})
    } else {
        log.Logger = zerolog.New(os.Stdout).With().Timestamp().Logger()
    }
}
```

**Why global logger:**
- Avoids passing logger through every function
- Matches zerolog's recommended pattern
- Simplifies usage: just `import "github.com/rs/zerolog/log"`

### HTTP Request Logging (`internal/api/server.go`)

**Why custom middleware:**
- Gin's default logger doesn't integrate with zerolog
- Need structured fields for log aggregation
- Want consistent format across all logs

**Implementation pattern:**
```go
router.Use(func(c *gin.Context) {
    start := time.Now()
    c.Next()
    
    log.Info().
        Str("method", c.Request.Method).
        Str("path", c.Request.URL.Path).
        Int("status", c.Writer.Status()).
        Dur("latency", time.Since(start)).
        Str("client_ip", c.ClientIP()).
        Msg("HTTP request")
})
```

**Key fields to include:**
- `method`, `path`: Identify the endpoint
- `status`: Response code for filtering errors
- `latency`: Performance monitoring
- `client_ip`: Security auditing

### Database Query Logging (`internal/database/database.go`)

**Why custom GORM logger:**
- GORM's default logger uses standard library `log`
- Need structured fields (SQL, elapsed time, rows)
- Want to ignore "record not found" errors (normal control flow)

**Implementation:**
```go
type zerologGormLogger struct {
    SlowThreshold             time.Duration
    IgnoreRecordNotFoundError bool
}

func (l *zerologGormLogger) Trace(ctx context.Context, begin time.Time, fc func() (string, int64), err error) {
    elapsed := time.Since(begin)
    sql, rows := fc()
    
    if err != nil {
        // Skip "record not found" - it's normal control flow
        if l.IgnoreRecordNotFoundError && err.Error() == "record not found" {
            return
        }
        log.Error().Err(err).Dur("elapsed", elapsed).Int64("rows", rows).Str("sql", sql).Msg("Database query error")
        return
    }
    
    // Warn on slow queries
    if elapsed > l.SlowThreshold {
        log.Warn().Dur("elapsed", elapsed).Str("sql", sql).Msg("Slow query detected")
    } else {
        log.Debug().Dur("elapsed", elapsed).Str("sql", sql).Msg("Database query")
    }
}
```

**Why these thresholds:**
- Debug level: All queries (only visible when debugging)
- Warn level: >200ms (performance issue indicator)
- Error level: Actual errors (not "record not found")

### Handler Logging Pattern

**Why log at error boundaries:**
- Service layer returns errors but doesn't know HTTP context
- Handlers know the user_id from JWT
- Include both error and context for debugging

**Correct pattern:**
```go
func (s *Server) createBill(c *gin.Context) {
    userID, _ := c.Get("user_id")
    
    if err := s.billService.CreateBill(&bill); err != nil {
        log.Error().
            Err(err).
            Str("user_id", userID.(string)).
            Msg("Failed to create bill")
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
}
```

**❌ Wrong pattern:**
```go
// Don't log in service layer - it doesn't have user context
func (s *BillService) CreateBill(bill *Bill) error {
    if err := s.repo.Create(bill); err != nil {
        log.Error().Err(err).Msg("Failed to create bill")  // Missing user_id!
        return err
    }
}
```

### Authentication Logging

**Why log auth events:**
- Security auditing
- Troubleshooting login issues
- Detecting brute force attempts

**What to log:**
```go
// Success - Info level
log.Info().
    Str("user_id", user.ID).
    Str("username", user.Username).
    Msg("User logged in successfully")

// Failure - Warn level (not Error, it's expected behavior)
log.Warn().
    Err(err).
    Str("username", req.Username).  // Don't log password!
    Msg("Login failed")
```

**Why Warn not Error for failed logins:**
- Failed logins are expected (typos, wrong credentials)
- Reserve Error for unexpected failures (DB down, JWT signing fails)

### Structured Fields Strategy

**Always include:**
- Resource identifiers: `user_id`, `bill_id`, `payment_id`, `category_id`
- Operation context: `operation`, `method`, `path`
- Errors: `Err(err)` automatically adds `error` field
- Performance: `Dur("latency", duration)` for timing

**Common field naming conventions:**
```go
Str("user_id", id)      // Snake case for consistency
Str("bill_id", id)      // IDs always suffixed with _id
Int("status", code)     // HTTP status codes
Dur("latency", dur)     // Time durations
Err(err)                // Errors (creates "error" field)
```

**❌ Don't log:**
- Passwords, tokens, API keys
- Full credit card numbers
- Personally identifiable information (PII) without need
- Large objects (use IDs instead)

## Log Level Strategy

### Debug
- SQL queries
- Internal state changes
- Detailed operation traces
- Only enabled during development

### Info
- Application lifecycle (start/stop)
- User actions (login, create, update, delete)
- HTTP requests
- Normal operations

### Warn
- Recoverable errors (failed login, optional operation failed)
- Performance issues (slow queries)
- Deprecated features
- Unusual but handled situations

### Error
- Operation failures that affect functionality
- API errors
- Database errors (except "record not found")
- Business logic failures

### Fatal
- Unrecoverable startup errors
- Configuration failures
- Database connection failures
- **Only use in main.go startup** - exits the application

## Configuration

### Development
```yaml
logging:
  level: debug   # See SQL queries
  format: console  # Human-readable
```

### Production
```yaml
logging:
  level: info   # or warn to reduce volume
  format: json  # For log aggregation (ELK, Splunk, etc.)
```

### Why different formats:
- **Console**: Colored, timestamped, readable for humans
- **JSON**: Structured, parseable, searchable in log systems

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

## References

- [rs/zerolog](https://github.com/rs/zerolog)
- [Structured Logging Best Practices](https://www.honeycomb.io/blog/structured-logging-and-your-team)
