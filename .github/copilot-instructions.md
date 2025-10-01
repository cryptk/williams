# Williams - Bill Management System

## Project Overview
Williams is a bill management application designed to help users track and manage their bills. The name is a play on words (William/Bill).

## Technology Stack

### Backend
- **Language**: Go (Golang)
- **API**: RESTful API
- **Database**: Multi-database support via GORM (SQLite, MySQL, PostgreSQL)
- **Migrations**: golang-migrate with embedded SQL migrations
- **Configuration**: Viper library for config file and environment variable management
- **Architecture**: Clean architecture with separation of concerns

### Frontend
- **Framework**: Preact (lightweight React alternative, ~3KB)
- **Build Tool**: Vite
- **Language**: JavaScript/TypeScript

## Project Structure

```
williams/
├── backend/
│   ├── cmd/
│   │   └── server/
│   │       └── main.go          # Application entry point
│   ├── internal/
│   │   ├── api/                 # API handlers and routes
│   │   │   └── middleware/      # Authentication and other middleware
│   │   ├── config/              # Configuration management (Viper)
│   │   ├── database/            # Database connection and migrations
│   │   │   └── migrations/      # SQL migration files
│   │   ├── models/              # Data models
│   │   ├── services/            # Business logic
│   │   └── repository/          # Data access layer
│   ├── pkg/                     # Public packages
│   │   └── utils/               # Utility functions (date, timezone)
│   ├── configs/                 # Configuration files
│   │   └── config.yaml
│   ├── go.mod
│   └── go.sum
├── frontend/
│   ├── src/
│   │   ├── components/          # Reusable components
│   │   ├── pages/               # Page components
│   │   ├── services/            # API service calls
│   │   ├── styles/              # Global styles
│   │   ├── utils/               # Utility functions
│   │   └── main.jsx             # Entry point
│   ├── public/
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── docs/                        # User-facing documentation
│   ├── backend/                 # Backend usage guides
│   └── frontend/                # Frontend usage guides
├── .github/
│   ├── copilot-instructions.md
│   └── copilot/
│       └── architectural_references/  # Implementation details & decisions (for Copilot)
├── .gitignore
└── README.md
```

## Documentation Structure

### User-Facing Documentation (`docs/`)
- **Purpose**: How to use, configure, and work with features
- **Audience**: Developers working on the project
- **Examples**: Configuration guides, API usage, troubleshooting
- **Location**: `docs/backend/` and `docs/frontend/`
- **Style**: Concise API reference format
  - Quick reference for configuration options
  - Brief usage examples
  - Minimal explanatory text
  - Focus on "what" and "how to use"

### Architectural References (`.github/copilot/architectural_references/`)
- **Purpose**: Implementation details, architectural decisions, design rationale
- **Audience**: Copilot (for context on why/how things were built)
- **Examples**: Architecture explanations, trade-off discussions, implementation specifics
- **Location**: `.github/copilot/architectural_references/`
- **Style**: Prescriptive architectural guidance
  - **What**: Explain the current implementation and architecture
  - **Why**: Reasoning behind architectural decisions
  - **How**: Usage patterns with code examples
  - **Examples**: Include ✅ correct patterns and ❌ common mistakes
  - **Focus on present state**, not historical changes
  - Avoid past-tense narrative like "Successfully migrated from..." or "Before/After" comparisons
  - Don't document what was changed; document what should be done

#### Writing Architectural References

When creating architectural reference documentation:

1. **Start with "Why"**: Explain the reasoning for the architectural decision
2. **Describe "What"**: Current implementation details and structure
3. **Show "How"**: Usage patterns with concrete code examples
4. **Highlight correct patterns**: Use ✅ to show proper usage
5. **Note common pitfalls**: Use ❌ to show what NOT to do (only when necessary to avoid problems)
6. **Provide context**: Explain when to use certain patterns over others
7. **Include references**: Link to external documentation or resources

**❌ Avoid:**
- Past-tense migration narrative ("Successfully migrated Williams from...")
- "Before/After" comparison sections
- "Changes Made" or "Migration Checklist" sections
- Historical context about what used to be in the codebase
- References to previous implementations

**✅ Do:**
- Write in present tense about current architecture
- Focus on what should be done and why
- Provide examples of correct implementation
- Explain trade-offs and design decisions
- Include troubleshooting for common issues

**Document Separation:**
- Put "how to use" guides in `docs/`
- Put "why/how it was built" architectural details in `.github/copilot/architectural_references/`

## Configuration Management

### Environment Variables
- `WILLIAMS_SERVER_HOST`: Server host (default: localhost)
- `WILLIAMS_SERVER_PORT`: Server port (default: 8080)
- `WILLIAMS_DATABASE_DRIVER`: Database driver - sqlite, mysql, or postgres (default: sqlite)
- `WILLIAMS_DATABASE_DSN`: Database connection string (default: ./williams.db)
- `WILLIAMS_LOGGING_LEVEL`: Log level (default: info)
- `WILLIAMS_LOGGING_FORMAT`: Log format (default: json)

### Config File (config.yaml)
```yaml
server:
  port: 8080
  host: localhost
database:
  driver: sqlite  # sqlite, mysql, or postgres
  dsn: ./williams.db
  # For MySQL: user:pass@tcp(host:port)/dbname
  # For PostgreSQL: postgres://user:pass@host:port/dbname
auth:
  jwt_secret: your-secret-key-here  # Change in production!
bills:
  payment_grace_days: 3  # Days before due date to consider bill paid
timezone: America/Los_Angeles  # Application timezone for date calculations
logging:
  level: info
  format: json
```

### Database Support

The application supports multiple databases:

**SQLite** (default - best for development/small deployments):
```yaml
database:
  driver: sqlite
  dsn: ./williams.db
```

**MySQL**:
```yaml
database:
  driver: mysql
  dsn: username:password@tcp(localhost:3306)/williams?parseTime=true
```

**PostgreSQL**:
```yaml
database:
  driver: postgres
  dsn: postgres://username:password@localhost:5432/williams?sslmode=disable
```

### Migrations

- Database migrations are embedded in the binary
- Located in `internal/database/migrations/`
- Run automatically on application startup
- Written in database-agnostic SQL for maximum compatibility
- Versioned with golang-migrate

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user account
- `POST /api/v1/auth/login` - Login and receive JWT token
- `GET /api/v1/auth/me` - Get current user info (protected)

### Bills
- `GET /api/v1/bills` - List all bills for the authenticated user
- `GET /api/v1/bills/:id` - Get bill details (protected, ownership verified)
- `POST /api/v1/bills` - Create new bill (protected)
- `PUT /api/v1/bills/:id` - Update bill (protected, ownership verified)
- `DELETE /api/v1/bills/:id` - Delete bill (protected, ownership verified)

### Payments
- `POST /api/v1/bills/:id/payments` - Create payment for a bill (protected, ownership verified)
- `GET /api/v1/bills/:id/payments` - List payments for a bill (protected, ownership verified)
- `DELETE /api/v1/bills/:id/payments/:payment_id` - Delete payment (protected, ownership verified)

### Categories
- `GET /api/v1/categories` - List categories for the authenticated user (protected)
- `POST /api/v1/categories` - Create category (protected)
- `DELETE /api/v1/categories/:id` - Delete category (protected, ownership verified)

### Statistics
- `GET /api/v1/stats/summary` - Get bill statistics for the authenticated user (protected)

## Development Guidelines

### Security Best Practices
1. **Never trust user_id from request bodies** - Always extract from validated JWT tokens
2. **Always verify resource ownership** - Check that the authenticated user owns the resource
3. **Use the `*ByUser` repository methods** - These enforce ownership checks at the data layer
4. **Protected endpoints require authentication** - Use the AuthMiddleware for all protected routes

### Go Backend
1. Follow standard Go project layout
2. Use dependency injection where appropriate
3. Write unit tests for services and handlers
4. Use proper error handling and logging
5. Follow Go naming conventions and idioms
6. Use Go modules for dependency management
7. All timestamps use application timezone (configured in config.yaml)
8. Use structured logging with zerolog (see `docs/backend/LOGGING.md`)

### Logging
- **Package**: `github.com/rs/zerolog/log`
- **Usage**: `log.Info().Str("user_id", userID).Msg("User action")`
- **Levels**: debug, info, warn, error, fatal
- **Configuration**: Set via `config.yaml` or environment variables
- **Documentation**: `docs/backend/LOGGING.md`

### Frontend
1. Keep components small and focused
2. Use hooks for state management
3. Implement proper error handling
4. Create reusable components
5. Follow accessibility best practices

### Code Style
- **Go**: Use `gofmt` and `golint`
- **JavaScript**: Use ESLint and Prettier
- Write clear, self-documenting code
- Add comments for complex logic

### Git Workflow
- Use meaningful commit messages
- Create feature branches
- Keep commits atomic and focused

## Data Models

### User
```go
type User struct {
    ID           string    `json:"id"`
    Username     string    `json:"username"`
    Email        string    `json:"email"`
    PasswordHash string    `json:"-"` // Never exposed in JSON
    CreatedAt    time.Time `json:"created_at"`
    UpdatedAt    time.Time `json:"updated_at"`
}
```

### Bill
```go
type Bill struct {
    ID          string    `json:"id"`
    UserID      string    `json:"user_id"`
    Name        string    `json:"name"`
    Amount      float64   `json:"amount"`
    DueDay      int       `json:"due_day"` // Day of month (1-31)
    Category    string    `json:"category"`
    IsRecurring bool      `json:"is_recurring"`
    Notes       string    `json:"notes"`
    CreatedAt   time.Time `json:"created_at"`
    UpdatedAt   time.Time `json:"updated_at"`
    
    // Computed fields (not stored in database)
    IsPaid       bool       `json:"is_paid"`
    NextDueDate  *time.Time `json:"next_due_date,omitempty"`
    LastPaidDate *time.Time `json:"last_paid_date,omitempty"`
}
```

### Payment
```go
type Payment struct {
    ID          string    `json:"id"`
    BillID      string    `json:"bill_id"`
    Amount      float64   `json:"amount"`
    PaymentDate time.Time `json:"payment_date"` // The due date being paid
    Notes       string    `json:"notes"`
    CreatedAt   time.Time `json:"created_at"` // When payment was recorded
}
```

### Category
```go
type Category struct {
    ID        string    `json:"id"`
    UserID    string    `json:"user_id"` // Categories are user-specific
    Name      string    `json:"name"`
    Color     string    `json:"color"`
    CreatedAt time.Time `json:"created_at"`
}
```

### BillStats
```go
type BillStats struct {
    TotalBills    int     `json:"total_bills"`
    TotalAmount   float64 `json:"total_amount"`
    DueAmount     float64 `json:"due_amount"` // Total amount of unpaid bills
    PaidBills     int     `json:"paid_bills"`
    UnpaidBills   int     `json:"unpaid_bills"`
    UpcomingBills int     `json:"upcoming_bills"`
}
```

## Getting Started

### Backend
```bash
cd backend
go mod download
go run cmd/server/main.go
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Future Enhancements
- Payment reminders
- Bill history tracking
- Budget planning
- Payment integrations
- Mobile app
- Export to CSV/PDF
- Recurring bill automation enhancements
- Bill sharing between users
- Multiple payment methods tracking
