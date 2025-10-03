# Multi-Tenancy Architecture with GORM Scopes

## Overview

Williams implements multi-tenancy at the database level using GORM scopes to automatically filter all queries by `user_id`. This ensures complete data isolation between users and prevents accidental cross-tenant data access.

## Why GORM Scopes for Multi-Tenancy?

**Key Benefits:**
1. **Automatic Enforcement** - Tenant filtering happens at the database layer, impossible to bypass
2. **Defense in Depth** - Even if application logic has bugs, data isolation is maintained
3. **Cleaner Code** - No repetitive `WHERE user_id = ?` clauses in every query
4. **Single Source of Truth** - User ID extracted once from JWT, used consistently throughout request
5. **Impossible to Forget** - Tenant filtering is automatic, not manual

**Design Principle:**
> User authentication happens once at the middleware layer. From that point forward, all database operations are automatically scoped to that user's data.

**Critical Implementation Detail:**
> All repository methods MUST use `.Session(&gorm.Session{})` to prevent query condition accumulation while preserving tenant scoping.

## Architecture Components

### 1. Tenant-Scoped Database Connection

**Location:** `internal/api/middleware/scoped_db.go`

The `TenantScoped` GORM scope automatically adds `user_id = ?` to all queries:

```go
func TenantScoped(userID string) func(db *gorm.DB) *gorm.DB {
    return func(db *gorm.DB) *gorm.DB {
        return db.Where("user_id = ?", userID)
    }
}
```

**How It Works:**
- GORM scopes are functions that modify query conditions
- Applied to a `*gorm.DB` instance, all subsequent queries inherit the scope
- The scoped DB is immutable - original DB remains unscoped

**Important:** While scopes are inherited, query conditions (WHERE, ORDER, LIMIT) can accumulate if not properly isolated using `Session()`.

### 1a. Why Session() is Critical

GORM's query methods mutate the DB instance. Without `Session()`, conditions from one operation leak into subsequent operations:

```go
// Problem scenario without Session():
scopedDB.Where("bill_id = ?", billID).Find(&payments)  // Adds WHERE bill_id
scopedDB.Order("name ASC").Find(&bills)                // Still has bill_id condition!
// Result: SELECT * FROM bills WHERE user_id=X AND bill_id=Y ORDER BY name ASC
// ERROR: bills table doesn't have bill_id column!
```

**Solution:** Always use `.Session(&gorm.Session{})` in repository methods:

```go
// Correct pattern - isolated queries
scopedDB.Session(&gorm.Session{}).Where("bill_id = ?", billID).Find(&payments)
scopedDB.Session(&gorm.Session{}).Order("name ASC").Find(&bills)
// Each query is independent, only tenant scope is inherited
```

**What Session() Does:**
- ✅ Creates fresh query builder
- ✅ Inherits scopes (TenantScoped is preserved)
- ✅ Clears accumulated conditions (WHERE, ORDER, LIMIT, etc.)
- ✅ Provides query isolation between operations

### 2. Middleware Integration

**Location:** `internal/api/middleware/scoped_db.go`

The `ScopedDBMiddleware` extracts user ID from JWT and creates a scoped database connection:

```go
func ScopedDBMiddleware(db *gorm.DB) gin.HandlerFunc {
    return func(c *gin.Context) {
        // Extract user_id from validated JWT token
        userID, exists := c.Get("user_id")
        
        // Create tenant-scoped database connection
        scopedDB := db.Scopes(TenantScoped(userID.(string)))
        
        // Store both in context for handler access
        c.Set("scoped_db", scopedDB)
        c.Set("user_id", userID)
        
        c.Next()
    }
}
```

**Why Store Both userID and scopedDB?**
- `scopedDB` - Used for all database operations
- `userID` - Used for logging, audit trails, and setting ownership on new records

### 3. Handler Pattern

**Location:** `internal/api/handlers.go`

All protected endpoints follow this pattern:

```go
func (s *Server) someHandler(c *gin.Context) {
    // Extract tenancy information from context
    userID, scopedDB, err := fetchTenancyFromContext(c)
    if err != nil {
        log.Error().Err(err).Str("user_id", userID).Msg("Failed to fetch tenancy from context")
        c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
        return
    }
    
    // Use scopedDB for all database operations
    result, err := s.someService.SomeMethod(scopedDB, params...)
    
    // Use userID for logging
    log.Info().Str("user_id", userID).Msg("Operation completed")
}
```

**Security Pattern:**
1. ✅ User ID extracted from validated JWT (single source of truth)
2. ✅ Scoped DB created automatically by middleware
3. ✅ All queries automatically filtered by user_id
4. ✅ User ID logged for audit trails

### 4. Service Layer Pattern

**Location:** `internal/services/`

Services receive `scopedDB` as the first parameter:

```go
func (s *BillService) List(scopedDB *gorm.DB) ([]*models.Bill, error) {
    return s.repo.List(scopedDB)
}
```

**Why First Parameter?**
- Makes tenant context explicit and impossible to forget
- Consistent pattern across all tenant-scoped methods
- Clear distinction from methods that don't need scoping

### 5. Repository Layer Pattern

**Location:** `internal/repository/`

Repositories use the provided `scopedDB` for all queries. **CRITICAL:** Always use `.Session(&gorm.Session{})` to prevent query condition accumulation.

```go
func (r *billRepository) List(scopedDB *gorm.DB) ([]*models.Bill, error) {
    var bills []*models.Bill
    // Use Session() to create fresh query builder
    // This prevents conditions from previous queries accumulating
    if err := scopedDB.Session(&gorm.Session{}).Order("name ASC").Find(&bills).Error; err != nil {
        return nil, err
    }
    return bills, nil
}
```

**Why Session() is Required:**

GORM methods like `.Where()`, `.Order()`, and `.Limit()` mutate the DB instance. Without `Session()`, conditions accumulate across multiple operations:

```go
// ❌ WITHOUT Session() - conditions accumulate
scopedDB.Where("bill_id = ?", billID).Find(&payments)  // Adds WHERE bill_id
scopedDB.Order("name ASC").Find(&bills)                // Still has bill_id!
// Result: SELECT * FROM bills WHERE user_id=X AND bill_id=Y ORDER BY name ASC
// ERROR: bills table doesn't have bill_id column!

// ✅ WITH Session() - each query is isolated
scopedDB.Session(&gorm.Session{}).Where("bill_id = ?", billID).Find(&payments)
scopedDB.Session(&gorm.Session{}).Order("name ASC").Find(&bills)
// Result: SELECT * FROM bills WHERE user_id=X ORDER BY name ASC
// SUCCESS: Only tenant scope applied
```

**Session() Behavior:**
- Creates new query builder instance
- **Inherits scopes** from parent DB (TenantScoped is preserved ✅)
- **Resets query conditions** (WHERE, ORDER, LIMIT, etc. are cleared ✅)
- Isolates query from DB instance mutations

**Pattern for All Repository Methods:**

```go
func (r *repository) Create(scopedDB *gorm.DB, entity *Model) error {
    return scopedDB.Session(&gorm.Session{}).Create(entity).Error
}

func (r *repository) Get(scopedDB *gorm.DB, id string) (*Model, error) {
    var entity Model
    err := scopedDB.Session(&gorm.Session{}).First(&entity, "id = ?", id).Error
    return &entity, err
}

func (r *repository) List(scopedDB *gorm.DB) ([]*Model, error) {
    var entities []*Model
    err := scopedDB.Session(&gorm.Session{}).Order("name ASC").Find(&entities).Error
    return entities, err
}

func (r *repository) Update(scopedDB *gorm.DB, entity *Model) error {
    return scopedDB.Session(&gorm.Session{}).Save(entity).Error
}

func (r *repository) Delete(scopedDB *gorm.DB, id string) error {
    return scopedDB.Session(&gorm.Session{}).Delete(&Model{}, "id = ?", id).Error
}
```

**No Stored Database:**
- Bill, Payment repositories have no `db` field (stateless)
- Category repository has `db` field only for `CreateDefaults` (unauthenticated operation)
- User repository has `db` field for login/registration (pre-authentication operations)

## Data Model Requirements

All tenant-scoped tables MUST have:

1. **`user_id` column** - TEXT NOT NULL
2. **Foreign key constraint** - References `users(id)` with `ON DELETE CASCADE`
3. **Index on user_id** - For query performance

```sql
CREATE TABLE bills (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    -- other columns --
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_bills_user_id ON bills(user_id);
```

**Why Cascade Delete?**
- Ensures complete data cleanup when user account is deleted
- Maintains referential integrity automatically
- Simplifies user deletion logic

## Exception: Unauthenticated Operations

Some operations occur before authentication and cannot use scoped DB:

### User Registration

**Location:** `internal/services/auth_service.go`

```go
func (s *AuthService) Register(req *RegisterRequest) (*models.User, error) {
    // Create user using unscoped db
    if err := s.userRepo.Create(user); err != nil {
        return nil, err
    }
    
    // Create default categories using unscoped db
    // User doesn't have a JWT yet, can't create scoped connection
    if err := s.categoryRepo.CreateDefaults(user.ID); err != nil {
        log.Warn().Err(err).Msg("Failed to create default categories")
    }
    
    return user, nil
}
```

**Pattern:**
- Repositories that need unscoped access accept `db *gorm.DB` in constructor
- Methods that need unscoped access use stored `r.db` field
- These are always clearly documented

## Common Patterns

### ✅ Creating Records with User Association

**Handler sets UserID explicitly:**

```go
payment.UserID = userID // From authenticated context
payment.BillID = billID // From URL parameter

if err := s.billService.CreatePayment(scopedDB, &payment); err != nil {
    // Handle error
}
```

**Why Set Explicitly?**
- Scopes only filter reads, not writes
- Ensures new records are associated with correct user
- Makes ownership explicit and auditable

### ✅ Querying Records

**No special handling needed:**

```go
// This automatically filters by user_id
bills, err := s.billRepo.List(scopedDB)
```

### ✅ Updating Records

**Ownership verified automatically:**

```go
// If bill doesn't exist for this user, First() returns not found
bill, err := scopedDB.First(&bill, "id = ?", id)
if err != nil {
    return fmt.Errorf("bill not found") // Can't update other users' bills
}

bill.Amount = newAmount
scopedDB.Save(bill) // Only updates if owned by user
```

### ✅ Deleting Records

**Ownership verified automatically:**

```go
result := scopedDB.Delete(&models.Bill{}, "id = ?", id)
if result.RowsAffected == 0 {
    return fmt.Errorf("bill not found") // Can't delete other users' bills
}
```

## Testing Considerations

### Unit Testing Services/Repositories

Use a mock scoped DB:

```go
func TestBillService_List(t *testing.T) {
    // Create mock scoped DB with test user
    scopedDB := db.Scopes(TenantScoped(testUserID))
    
    // Test service with scoped connection
    bills, err := billService.List(scopedDB)
    
    // Verify only test user's bills returned
    assert.NoError(t, err)
    for _, bill := range bills {
        assert.Equal(t, testUserID, bill.UserID)
    }
}
```

### Integration Testing

Test cross-tenant isolation:

```go
func TestTenantIsolation(t *testing.T) {
    // Create bills for user1
    scopedDB1 := db.Scopes(TenantScoped(user1ID))
    billRepo.Create(scopedDB1, &bill1)
    
    // Query with user2's scope
    scopedDB2 := db.Scopes(TenantScoped(user2ID))
    bills, _ := billRepo.List(scopedDB2)
    
    // Verify user2 cannot see user1's bills
    assert.Empty(t, bills)
}
```

## Security Checklist

When adding new tenant-scoped resources:

- [ ] Add `user_id TEXT NOT NULL` column to table
- [ ] Add foreign key constraint to `users(id)` with `ON DELETE CASCADE`
- [ ] Add index on `user_id`
- [ ] Repository methods accept `scopedDB *gorm.DB` as first parameter
- [ ] **All repository methods use `.Session(&gorm.Session{})` before queries**
- [ ] Handler extracts `userID` and `scopedDB` from context
- [ ] Handler sets `UserID` on new records before creating
- [ ] Service methods pass `scopedDB` to repository
- [ ] No manual `WHERE user_id = ?` clauses in repository queries
- [ ] Test cross-tenant isolation

## Common Mistakes to Avoid

### ❌ Not Using Session() in Repositories

```go
// WRONG - query conditions accumulate across operations
func (r *billRepository) List(scopedDB *gorm.DB) ([]*models.Bill, error) {
    var bills []*models.Bill
    // BUG: If scopedDB was used elsewhere with Where() or Order(),
    // those conditions will still be present here!
    scopedDB.Order("name ASC").Find(&bills)
    return bills, nil
}

// Example of the problem:
// 1. List payments: scopedDB.Where("bill_id = ?", id).Find(&payments)
// 2. List bills: scopedDB.Order("name ASC").Find(&bills)
// Result: SELECT * FROM bills WHERE user_id=X AND bill_id=Y
// ERROR: bills table doesn't have bill_id column!
```

```go
// CORRECT - Session() prevents condition accumulation
func (r *billRepository) List(scopedDB *gorm.DB) ([]*models.Bill, error) {
    var bills []*models.Bill
    // Session() creates fresh query builder that inherits scope but not conditions
    scopedDB.Session(&gorm.Session{}).Order("name ASC").Find(&bills)
    return bills, nil
}
```

### ❌ Using Unscoped Database

```go
// WRONG - bypasses tenant filtering
func (s *BillService) List(scopedDB *gorm.DB) ([]*models.Bill, error) {
    var bills []*models.Bill
    s.db.Find(&bills) // BUG: Uses unscoped db, returns ALL users' bills!
    return bills, nil
}
```

```go
// CORRECT - uses scoped database
func (s *BillService) List(scopedDB *gorm.DB) ([]*models.Bill, error) {
    var bills []*models.Bill
    scopedDB.Session(&gorm.Session{}).Find(&bills) // Uses scoped db with fresh session
    return bills, nil
}
```

### ❌ Manual user_id Filtering

```go
// WRONG - redundant and error-prone
func (r *billRepository) List(scopedDB *gorm.DB) ([]*models.Bill, error) {
    var bills []*models.Bill
    // Don't do this - scope already filters by user_id!
    scopedDB.Session(&gorm.Session{}).Where("user_id = ?", someUserID).Find(&bills)
    return bills, nil
}
```

```go
// CORRECT - trust the scope
func (r *billRepository) List(scopedDB *gorm.DB) ([]*models.Bill, error) {
    var bills []*models.Bill
    scopedDB.Session(&gorm.Session{}).Find(&bills) // Scope automatically filters by user_id
    return bills, nil
}
```

### ❌ Forgetting to Set UserID on Create

```go
// WRONG - UserID not set, violates NOT NULL constraint
func (s *Server) createPayment(c *gin.Context) {
    var payment models.Payment
    c.ShouldBindJSON(&payment)
    
    // BUG: payment.UserID is empty!
    s.billService.CreatePayment(scopedDB, &payment) // Database error!
}
```

```go
// CORRECT - explicitly set UserID from authenticated context
func (s *Server) createPayment(c *gin.Context) {
    userID, scopedDB, _ := fetchTenancyFromContext(c)
    
    var payment models.Payment
    c.ShouldBindJSON(&payment)
    payment.UserID = userID // Set from authenticated user
    
    s.billService.CreatePayment(scopedDB, &payment)
}
```

## Performance Considerations

### Index Strategy

All tenant-scoped tables should have:

```sql
-- Composite index for common query patterns
CREATE INDEX idx_bills_user_id_created_at ON bills(user_id, created_at DESC);

-- Composite index for lookups by ID
CREATE INDEX idx_bills_user_id_id ON bills(user_id, id);
```

**Why Composite Indexes?**
- Queries always filter by `user_id` first (from scope)
- Composite indexes with `user_id` as first column are most efficient
- Reduces index scans to single user's data subset

### Query Performance

Scoped queries are efficient because:
1. Index on `user_id` makes filtering fast
2. Each user's data is typically small subset of total
3. Database can use index-only scans for many queries

**Monitoring:**
- Log slow queries that involve tenant-scoped tables
- Watch for queries that don't use `user_id` index
- Profile query plans for tables with many rows

## References

- GORM Scopes Documentation: https://gorm.io/docs/scopes.html
- Multi-tenancy Patterns: https://docs.microsoft.com/en-us/azure/architecture/guide/multitenant/overview
- Gin Context Documentation: https://gin-gonic.com/docs/examples/
