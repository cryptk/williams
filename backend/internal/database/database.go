package database

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/cryptk/williams/internal/config"
	"github.com/rs/zerolog/log"
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

// zerologGormLogger is a GORM logger implementation using zerolog
type zerologGormLogger struct {
	SlowThreshold             time.Duration
	IgnoreRecordNotFoundError bool
}

// LogMode implements gorm logger.Interface
func (l *zerologGormLogger) LogMode(level logger.LogLevel) logger.Interface {
	return l
}

// Info implements gorm logger.Interface
func (l *zerologGormLogger) Info(ctx context.Context, msg string, data ...interface{}) {
	log.Info().Msgf(msg, data...)
}

// Warn implements gorm logger.Interface
func (l *zerologGormLogger) Warn(ctx context.Context, msg string, data ...interface{}) {
	log.Warn().Msgf(msg, data...)
}

// Error implements gorm logger.Interface
func (l *zerologGormLogger) Error(ctx context.Context, msg string, data ...interface{}) {
	log.Error().Msgf(msg, data...)
}

// Trace implements gorm logger.Interface
func (l *zerologGormLogger) Trace(ctx context.Context, begin time.Time, fc func() (string, int64), err error) {
	elapsed := time.Since(begin)
	sql, rows := fc()

	if err != nil {
		// Skip logging if it's a "record not found" error and we're configured to ignore it
		if l.IgnoreRecordNotFoundError && err.Error() == "record not found" {
			return
		}

		log.Error().
			Err(err).
			Dur("elapsed", elapsed).
			Int64("rows", rows).
			Str("sql", sql).
			Msg("Database query error")
		return
	}

	if elapsed > l.SlowThreshold && l.SlowThreshold != 0 {
		log.Warn().
			Dur("elapsed", elapsed).
			Dur("threshold", l.SlowThreshold).
			Int64("rows", rows).
			Str("sql", sql).
			Msg("Slow query detected")
	} else {
		log.Debug().
			Dur("elapsed", elapsed).
			Int64("rows", rows).
			Str("sql", sql).
			Msg("Database query")
	}
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
		Logger: &zerologGormLogger{
			SlowThreshold:             200 * time.Millisecond,
			IgnoreRecordNotFoundError: true, // Don't log "record not found" errors (expected in normal operation)
		},
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
