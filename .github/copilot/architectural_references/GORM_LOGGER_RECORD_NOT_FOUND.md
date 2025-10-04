# GORM Logger: Ignoring "Record Not Found"

## Why Ignore This Error

In GORM, `record not found` is **not an error** - it's normal control flow:

```go
user, err := userRepo.FindByUsername("nonexistent")
if err != nil {
    // This is EXPECTED when user doesn't exist
    return nil, err
}
```

**Problem with logging it:**
- Creates noise in logs at ERROR level
- Obscures actual errors
- Triggers false alarms in monitoring systems
- Makes troubleshooting harder

**When "record not found" is normal:**
- Checking if username is available during registration
- Finding optional relationships (bill may not have payments)
- Implementing "find or create" patterns
- Authentication (user might not exist)

## Implementation

### Custom GORM Logger

The `zerologGormLogger` implements GORM's `logger.Interface` with `IgnoreRecordNotFoundError: true`:

```go
func (l *zerologGormLogger) Trace(ctx context.Context, begin time.Time, fc func() (string, int64), err error) {
    if err != nil {
        // Skip record not found
        if l.IgnoreRecordNotFoundError && err.Error() == "record not found" {
            return
        }
        log.Error().Err(err).Str("sql", sql).Msg("Database query error")
        return
    }
    // ... handle success cases
}
```

**Configuration:** Always set `IgnoreRecordNotFoundError: true` in `internal/database/database.go`.

## Handling "Not Found" in Services

**✅ Correct pattern:**
```go
func (s *AuthService) Login(username, password string) (*User, error) {
    user, err := s.userRepo.FindByUsername(username)
    if err != nil {
        // "record not found" returns here without logging
        return nil, fmt.Errorf("invalid credentials")
    }
    return user, nil
}

// Handler logs at Warn level (failed login is expected)
func (s *Server) login(c *gin.Context) {
    user, err := s.authService.Login(req.Username, req.Password)
    if err != nil {
        log.Warn().Str("username", req.Username).Msg("Login failed")
        c.JSON(401, gin.H{"error": "Invalid credentials"})
        return
    }
}
```

**Why Warn not Error:** Failed logins are expected behavior, not system errors.

## Repository Layer

Repositories return GORM errors directly:

```go
func (r *UserRepository) FindByUsername(username string) (*models.User, error) {
    var user models.User
    err := r.db.Where("username = ?", username).First(&user).Error
    return &user, err  // Return error directly
}
```

Service layer interprets the error, handler adds context before logging.

## Alternative: Custom Error Types

For programmatic distinction between "not found" and other errors:

```go
var ErrNotFound = errors.New("resource not found")

func (r *UserRepository) FindByUsername(username string) (*User, error) {
    var user User
    err := r.db.Where("username = ?", username).First(&user).Error
    if err != nil && err.Error() == "record not found" {
        return nil, ErrNotFound
    }
    return &user, err
}

// Service checks explicitly
if errors.Is(err, repository.ErrNotFound) {
    // Handle not found specifically
}
```

**When to use:** Need different status codes (404 vs 500) or business logic depends on error type.

## Summary

**Key principles:**
1. "Record not found" is control flow, not an error
2. Don't log at ERROR level in GORM logger
3. Service layer returns errors without logging
4. Handler layer logs with context (user_id, operation)
5. Always set `IgnoreRecordNotFoundError: true`
