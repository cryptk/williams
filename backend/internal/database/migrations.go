package database

import (
	"database/sql"
	"embed"
	"fmt"

	"github.com/golang-migrate/migrate/v4"
	"github.com/golang-migrate/migrate/v4/database"
	"github.com/golang-migrate/migrate/v4/database/mysql"
	"github.com/golang-migrate/migrate/v4/database/postgres"
	"github.com/golang-migrate/migrate/v4/database/sqlite3"
	"github.com/golang-migrate/migrate/v4/source/iofs"
)

//go:embed migrations/*.sql
var migrationsFS embed.FS

// RunMigrations runs all pending database migrations
func (db *DB) RunMigrations() error {
	// Get the underlying *sql.DB
	sqlDB, err := db.DB.DB()
	if err != nil {
		return fmt.Errorf("failed to get sql.DB: %w", err)
	}

	// Create the appropriate database driver for migrations
	driver, err := db.getMigrationDriver(sqlDB)
	if err != nil {
		return fmt.Errorf("failed to create migration driver: %w", err)
	}

	// Create source driver from embedded filesystem
	sourceDriver, err := iofs.New(migrationsFS, "migrations")
	if err != nil {
		return fmt.Errorf("failed to create source driver: %w", err)
	}

	// Create migrate instance
	m, err := migrate.NewWithInstance("iofs", sourceDriver, db.Driver, driver)
	if err != nil {
		return fmt.Errorf("failed to create migrate instance: %w", err)
	}

	// Run migrations
	if err := m.Up(); err != nil && err != migrate.ErrNoChange {
		return fmt.Errorf("failed to run migrations: %w", err)
	}

	return nil
}

// getMigrationDriver returns the appropriate migration driver for the database
func (db *DB) getMigrationDriver(sqlDB *sql.DB) (database.Driver, error) {
	switch db.Driver {
	case "sqlite":
		return sqlite3.WithInstance(sqlDB, &sqlite3.Config{})
	case "mysql":
		return mysql.WithInstance(sqlDB, &mysql.Config{})
	case "postgres", "postgresql":
		return postgres.WithInstance(sqlDB, &postgres.Config{})
	default:
		return nil, fmt.Errorf("unsupported database driver: %s", db.Driver)
	}
}
