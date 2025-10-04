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

The `TenantScoped` function automatically adds `user_id = ?` to all queries:

```go
func TenantScoped(userID string) func(db *gorm.DB) *gorm.DB {
    return func(db *gorm.DB) *gorm.DB {
        return db.Where("user_id = ?", userID)
    }
}
```

**How it works:**
- Applied to a `*gorm.DB` instance
- All subsequent queries inherit the scope
- Original DB remains unscoped

### 1a. Why Session() is Critical

GORM's query methods mutate the DB instance. Without `Session()`, conditions from one operation leak into subsequent operations:

```go
// ❌ Problem without Session():
scopedDB.Where("bill_id = ?", billID).Find(&payments)
scopedDB.Order("name ASC").Find(&bills)
// Result: SELECT * FROM bills WHERE user_id=X AND bill_id=Y
// ERROR: bills table doesn't have bill_id column!
```

**Solution:** Always use `.Session(&gorm.Session{})`:

```go
// ✅ Correct with Session():
scopedDB.Session(&gorm.Session{}).Where("bill_id = ?", billID).Find(&payments)
scopedDB.Session(&gorm.Session{}).Order("name ASC").Find(&bills)
```

**What Session() does:**
- ✅ Creates fresh query builder
- ✅ Inherits scopes (TenantScoped preserved)
- ✅ Clears accumulated conditions
- ✅ Provides query isolation

### 2. Middleware Integration

**Location:** `internal/api/middleware/scoped_db.go`

The `ScopedDBMiddleware` extracts user ID from JWT and creates a scoped database connection. Stores both `scoped_db` and `user_id` in context - scoped DB for queries, user ID for logging/auditing.

### 3. Handler Pattern

All protected endpoints extract tenancy from context:

```go
func (s *Server) someHandler(c *gin.Context) {
    userID, scopedDB, err := fetchTenancyFromContext(c)
    if err != nil {
        log.Error().Err(err).Msg("Failed to fetch tenancy")
        c.JSON(401, gin.H{"error": "unauthorized"})
        return
    }
    
    result, err := s.someService.SomeMethod(scopedDB, params...)
    log.Info().Str("user_id", userID).Msg("Operation completed")
}
```

**Security pattern:**
1. User ID from validated JWT (single source of truth)
2. Scoped DB created by middleware
3. All queries automatically filtered
4. User ID logged for audit trails

### 4. Service Layer Pattern

Services receive `scopedDB` as first parameter:

```go
func (s *BillService) List(scopedDB *gorm.DB) ([]*models.Bill, error) {
    return s.repo.List(scopedDB)
}
```

Makes tenant context explicit and impossible to forget.

### 5. Repository Layer Pattern

**CRITICAL:** Always use `.Session(&gorm.Session{})` to prevent query condition accumulation:

```go
func (r *billRepository) List(scopedDB *gorm.DB) ([]*models.Bill, error) {
    var bills []*models.Bill
    // Session() prevents conditions from previous queries accumulating
    err := scopedDB.Session(&gorm.Session{}).Order("name ASC").Find(&bills).Error
    return bills, nil
}
```

**Pattern for all repository methods:**

```go
func (r *repository) Create(scopedDB *gorm.DB, entity *Model) error {
    return scopedDB.Session(&gorm.Session{}).Create(entity).Error
}

func (r *repository) Get(scopedDB *gorm.DB, id string) (*Model, error) {
    var entity Model
    err := scopedDB.Session(&gorm.Session{}).First(&entity, "id = ?", id).Error
    return &entity, err
}
```

**No stored database:**
- Bill/Payment repositories are stateless (no `db` field)
- Category repository has `db` only for `CreateDefaults` (unauthenticated)
- User repository has `db` for login/registration (pre-authentication)

## Data Model Requirements

All tenant-scoped tables must have:
1. `user_id` column (TEXT NOT NULL)
2. Foreign key to `users(id)` with `ON DELETE CASCADE`
3. Index on `user_id` for performance

**Why cascade delete:**
- Complete data cleanup when user deleted
- Maintains referential integrity automatically

## Exception: Unauthenticated Operations

Some operations occur before authentication:

### User Registration

Uses unscoped database because user doesn't have JWT yet:

```go
func (s *AuthService) Register(req *RegisterRequest) (*models.User, error) {
    // Create user with unscoped db
    s.userRepo.Create(user)
    
    // Create default categories with unscoped db
    s.categoryRepo.CreateDefaults(user.ID)
}
```

Repositories needing unscoped access store `db` field in constructor.

## Common Patterns

### ✅ Creating Records
Handler sets UserID explicitly from authenticated context:
```go
payment.UserID = userID
payment.BillID = billID
s.billService.CreatePayment(scopedDB, &payment)
```

### ✅ Querying Records
No special handling needed - scope filters automatically:
```go
bills, err := s.billRepo.List(scopedDB)
```

### ✅ Updating/Deleting Records
Ownership verified automatically by scope:
```go
// If bill doesn't belong to user, First() returns not found
bill, err := scopedDB.Session(&gorm.Session{}).First(&bill, "id = ?", id)
```

## Common Mistakes to Avoid

### ❌ Not Using Session() in Repositories
```go
// WRONG - conditions accumulate across operations
scopedDB.Order("name ASC").Find(&bills)
```

### ❌ Using Unscoped Database
```go
// WRONG - bypasses tenant filtering
s.db.Find(&bills) // Returns ALL users' bills!
```

### ❌ Manual user_id Filtering
```go
// WRONG - redundant, scope already filters
scopedDB.Session(&gorm.Session{}).Where("user_id = ?", userID).Find(&bills)
```

### ❌ Forgetting to Set UserID on Create
```go
// WRONG - violates NOT NULL constraint
s.billService.CreatePayment(scopedDB, &payment) // payment.UserID is empty!
```

## Performance Considerations

### Index Strategy
All tenant-scoped tables should have composite indexes:
```sql
CREATE INDEX idx_bills_user_id_created_at ON bills(user_id, created_at DESC);
CREATE INDEX idx_bills_user_id_id ON bills(user_id, id);
```

**Why composite indexes:**
- Queries always filter by `user_id` first (from scope)
- Composite indexes reduce scans to single user's subset
- Database can use index-only scans for many queries
