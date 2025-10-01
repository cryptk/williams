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
│   │   ├── config/              # Configuration management (Viper)
│   │   ├── database/            # Database connection and migrations
│   │   ├── models/              # Data models
│   │   ├── services/            # Business logic
│   │   └── repository/          # Data access layer
│   ├── pkg/                     # Public packages
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
│   │   └── main.jsx             # Entry point
│   ├── public/
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── .github/
│   └── copilot-instructions.md
├── .gitignore
└── README.md
```

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

## API Endpoints (Planned)

### Bills
- `GET /api/v1/bills` - List all bills
- `GET /api/v1/bills/:id` - Get bill details
- `POST /api/v1/bills` - Create new bill
- `PUT /api/v1/bills/:id` - Update bill
- `DELETE /api/v1/bills/:id` - Delete bill

### Categories
- `GET /api/v1/categories` - List categories
- `POST /api/v1/categories` - Create category

### Statistics
- `GET /api/v1/stats/summary` - Get bill statistics

## Development Guidelines

### Go Backend
1. Follow standard Go project layout
2. Use dependency injection where appropriate
3. Write unit tests for services and handlers
4. Use proper error handling and logging
5. Follow Go naming conventions and idioms
6. Use Go modules for dependency management

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

### Bill
```go
type Bill struct {
    ID          string    `json:"id"`
    Name        string    `json:"name"`
    Amount      float64   `json:"amount"`
    DueDate     time.Time `json:"due_date"`
    Category    string    `json:"category"`
    IsPaid      bool      `json:"is_paid"`
    IsRecurring bool      `json:"is_recurring"`
    Notes       string    `json:"notes"`
    CreatedAt   time.Time `json:"created_at"`
    UpdatedAt   time.Time `json:"updated_at"`
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
- Multi-user support
- Payment integrations
- Mobile app
- Recurring bill automation
