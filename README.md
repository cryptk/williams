# Williams - Bill Management System

A modern bill management application to help you track and manage your bills. Get to know your bills with William!

## Features

- 📝 Track all your bills in one place
- 💰 Monitor payment due dates
- 📊 View spending statistics
- 🔄 Manage recurring bills
- 🏷️ Organize bills by categories

## Tech Stack

- **Backend**: Go with RESTful API
- **Frontend**: Preact with Vite
- **Configuration**: Viper (config files + environment variables)

## Quick Start

### Prerequisites

- Go 1.21 or higher
- Node.js 18 or higher
- npm or yarn

### Backend Setup

```bash
cd backend
go mod download
go run cmd/server/main.go
```

The API will be available at `http://localhost:8080`

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:5173`

## Configuration

### Environment Variables

- `WILLIAMS_PORT`: Server port (default: 8080)
- `WILLIAMS_DB_PATH`: Database file path
- `WILLIAMS_CONFIG_PATH`: Path to configuration file
- `WILLIAMS_ENV`: Environment (development, production)

### Config File

Create `backend/configs/config.yaml`:

```yaml
server:
  port: 8080
  host: localhost
database:
  path: ./williams.db
logging:
  level: info
  format: json
```

## API Documentation

API documentation will be available at `/api/v1/docs` when the server is running.

## Development

See [copilot-instructions.md](./copilot-instructions.md) for detailed development guidelines.

## License

MIT
