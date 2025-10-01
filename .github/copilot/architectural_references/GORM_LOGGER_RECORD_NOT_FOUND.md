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

The `zerologGormLogger` implements GORM's `logger.Interface` with an `IgnoreRecordNotFoundError` field:

```go
type zerologGormLogger struct {
    SlowThreshold             time.Duration
    IgnoreRecordNotFoundError bool
}

func (l *zerologGormLogger) Trace(ctx context.Context, begin time.Time, fc func() (string, int64), err error) {
    if err != nil {
        // Skip record not found - it's not an error
        if l.IgnoreRecordNotFoundError && err.Error() == "record not found" {
            return
        }
        
        // Log actual errors
        log.Error().Err(err).Str("sql", sql).Msg("Database query error")
        return
    }
    
    // ... handle success cases
}
```

### Configuration

In `internal/database/database.go`:

```go
db, err := gorm.Open(dialector, &gorm.Config{
    Logger: &zerologGormLogger{
        SlowThreshold:             200 * time.Millisecond,
        IgnoreRecordNotFoundError: true,  // Always enable this
    },
})
```

**Why always `true`:**
- Application code handles "not found" explicitly
- Services check `err != nil` and decide what to do
- If "not found" is actually an error for your use case, handle it in service layer

## Handling "Not Found" in Services

**✅ Correct pattern:**
```go
func (s *AuthService) Login(username, password string) (*User, error) {
    user, err := s.userRepo.FindByUsername(username)
    if err != nil {
        // "record not found" returns here, but we don't log it
        // Let the handler decide what to log
        return nil, fmt.Errorf("invalid credentials")  // Generic message
    }
    
    if !checkPassword(user, password) {
        return nil, fmt.Errorf("invalid credentials")
    }
    
    return user, nil
}

// Handler logs the warn (failed login is expected)
func (s *Server) login(c *gin.Context) {
    user, err := s.authService.Login(req.Username, req.Password)
    if err != nil {
        log.Warn().
            Str("username", req.Username).
            Msg("Login failed")  // Warn level, not Error
        c.JSON(401, gin.H{"error": "Invalid credentials"})
        return
    }
}
```

**❌ Wrong pattern:**
```go
func (s *AuthService) Login(username, password string) (*User, error) {
    user, err := s.userRepo.FindByUsername(username)
    if err != nil {
        log.Error().Err(err).Msg("User not found")  // Don't log here!
        return nil, err
    }
}
```

**Why this is wrong:**
- Service layer doesn't know if "not found" matters
- Can't distinguish between "user doesn't exist" (expected) vs "database down" (error)
- Handler has more context (authentication attempt, user_id from JWT)

## When to Log Errors in Handlers

**Log in handler when:**
```go
// User is trying to access their own resource that should exist
bill, err := s.billService.GetBillByUser(billID, userID)
if err != nil {
    log.Error().  // ERROR because it should exist
        Err(err).
        Str("user_id", userID).
        Str("bill_id", billID).
        Msg("Failed to retrieve bill")
    c.JSON(500, gin.H{"error": "Failed to retrieve bill"})
}
```

**Don't log when:**
```go
// Checking if username exists during registration
user, err := s.authService.GetUserByUsername(username)
if err == nil {
    c.JSON(400, gin.H{"error": "Username already exists"})
    return
}
// "Not found" is success here - no log needed
```

## Repository Layer Conventions

Repositories should return GORM errors directly:

```go
func (r *UserRepository) FindByUsername(username string) (*models.User, error) {
    var user models.User
    err := r.db.Where("username = ?", username).First(&user).Error
    return &user, err  // Return GORM error directly
}
```

**Why:**
- Keeps repository simple (just data access)
- Lets service layer interpret the error
- Handler can add context before logging

## Alternative: Custom Error Types

If you need to distinguish "not found" from other errors programmatically:

```go
var ErrNotFound = errors.New("resource not found")

func (r *UserRepository) FindByUsername(username string) (*models.User, error) {
    var user models.User
    err := r.db.Where("username = ?", username).First(&user).Error
    if err != nil {
        if err.Error() == "record not found" {
            return nil, ErrNotFound
        }
        return nil, err
    }
    return &user, nil
}

// Service can check explicitly
func (s *AuthService) Login(username, password string) error {
    user, err := s.userRepo.FindByUsername(username)
    if errors.Is(err, repository.ErrNotFound) {
        // Handle not found specifically
    } else if err != nil {
        // Handle actual errors
    }
}
```

**When to use custom errors:**
- Need different status codes (404 vs 500)
- Different logging levels
- Business logic depends on error type

**When GORM errors are fine:**
- Handler treats all errors the same
- Just returning 500 or 401 for any failure
- Simple CRUD operations

## Testing Considerations

**Why this matters for tests:**
```go
func TestLogin_UserNotFound(t *testing.T) {
    // This shouldn't fill test logs with ERROR messages
    _, err := authService.Login("nonexistent", "password")
    assert.Error(t, err)  // Expected error
}
```

With `IgnoreRecordNotFoundError: true`, test logs stay clean - only actual errors appear.

## Summary

**Key principles:**
1. "Record not found" is control flow, not an error
2. Don't log at ERROR level in GORM logger for this case
3. Let service/handler layer decide what to log
4. Handler has most context (user_id, operation intent)
5. Always set `IgnoreRecordNotFoundError: true`

**The error still propagates up** - just doesn't create log noise.
