package database

import (
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	"github.com/cryptk/williams/internal/config"
	"gorm.io/driver/mysql"
	"gorm.io/driver/postgres"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// DB represents the database connection
type DB struct {
	*gorm.DB
	Driver string
}

// New creates a new database connection based on the configuration
func New(cfg *config.DatabaseConfig) (*DB, error) {
	var dialector gorm.Dialector

	// Prepare DSN with SQLite foreign keys enabled
	dsn := cfg.DSN
	if cfg.Driver == "sqlite" {
		// Ensure foreign keys are enabled for SQLite
		if !strings.Contains(dsn, "_foreign_keys=") {
			if strings.Contains(dsn, "?") {
				dsn += "&_foreign_keys=on"
			} else {
				dsn += "?_foreign_keys=on"
			}
		}
	}

	switch cfg.Driver {
	case "sqlite":
		dialector = sqlite.Open(dsn)
	case "mysql":
		dialector = mysql.Open(cfg.DSN)
	case "postgres", "postgresql":
		dialector = postgres.Open(cfg.DSN)
	default:
		return nil, fmt.Errorf("unsupported database driver: %s", cfg.Driver)
	}

	db, err := gorm.Open(dialector, &gorm.Config{
		Logger: logger.New(
			log.New(os.Stdout, "\r\n", log.LstdFlags),
			logger.Config{
				SlowThreshold:             200 * time.Millisecond,
				LogLevel:                  logger.Info,
				IgnoreRecordNotFoundError: true, // Don't log ErrRecordNotFound
				Colorful:                  true,
			},
		),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	return &DB{
		DB:     db,
		Driver: cfg.Driver,
	}, nil
}

// Close closes the database connection
func (db *DB) Close() error {
	sqlDB, err := db.DB.DB()
	if err != nil {
		return err
	}
	return sqlDB.Close()
}

// GetDSN returns the migration-compatible DSN
func (db *DB) GetDSN(dsn string) string {
	switch db.Driver {
	case "sqlite":
		return "sqlite3://" + dsn
	case "mysql":
		return "mysql://" + dsn
	case "postgres", "postgresql":
		return "postgres://" + dsn
	default:
		return dsn
	}
}
