package repository

import (
	"errors"
	"fmt"
	"time"

	"github.com/cryptk/williams/internal/models"
	"github.com/google/uuid"
	"github.com/rs/zerolog/log"
	"gorm.io/gorm"
)

// UserRepository defines the interface for user data operations
type UserRepository interface {
	Create(user *models.User) error
	CreateWithFirstUserCheck(user *models.User, adminRoles []string) error
	GetByID(id string) (*models.User, error)
	GetByUsername(username string) (*models.User, error)
	GetByEmail(email string) (*models.User, error)
	Update(user *models.User) error
	Count() (int64, error)
}

// userRepository implements UserRepository
type userRepository struct {
	db *gorm.DB
}

// NewUserRepository creates a new user repository
func NewUserRepository(db *gorm.DB) UserRepository {
	return &userRepository{db: db}
}

// Create creates a new user
func (r *userRepository) Create(user *models.User) error {
	if user.ID == "" {
		user.ID = uuid.New().String()
	}
	user.CreatedAt = time.Now()
	user.UpdatedAt = time.Now()

	return r.db.Create(user).Error
}

// CreateWithFirstUserCheck creates a new user and checks if they are the first user in a transaction.
// If they are the first user, assigns adminRoles, otherwise assigns userRoles.
// This uses a transaction with FOR UPDATE locking to prevent race conditions.
func (r *userRepository) CreateWithFirstUserCheck(user *models.User, adminRoles []string) error {
	// 1. start a transaction to ensure that the user count check and creation are atomic
	return r.db.Transaction(func(tx *gorm.DB) (err error) {

		// 2. Determine the dialect and acquire the table-level lock on the 'users' table.
		var lockSQL string
		var unlockSQL string
		dialect := tx.Dialector.Name()

		switch dialect {
		case "postgres":
			// ACCESS EXCLUSIVE MODE is the highest level of lock, preventing all concurrent reads/writes.
			lockSQL = "LOCK TABLE users IN ACCESS EXCLUSIVE MODE"
		case "mysql":
			// LOCK TABLES users WRITE acquires a table-level write lock.
			lockSQL = "LOCK TABLES users WRITE"
			unlockSQL = "UNLOCK TABLES"
		case "sqlite":
			// SQLite uses file-level locking for transactions, providing the necessary serialization
			// and atomicity. Explicit table locking is not necessary or supported with this syntax.
			log.Info().Msg("Running on SQLite. Transaction provides file-level serialization, skipping explicit LOCK TABLE for initial admin creation.")
			// lockSQL remains empty, execution will skip the Exec(lockSQL) call below.
		default:
			return fmt.Errorf("unsupported database dialect for table locking: %s", dialect)
		}

		if unlockSQL != "" {
			// Ensure we unlock tables at the end of the transaction if using MySQL
			defer func() {
				if deferredErr := tx.Exec(unlockSQL).Error; err != nil {
					err = fmt.Errorf("initial user creation failed: %w; sql returned: %v", err, deferredErr)
					log.Error().Str("dialect", dialect).Err(err).Msgf("failed to release table lock")
				}
			}()
		}

		if lockSQL != "" {
			if err := tx.Exec(lockSQL).Error; err != nil {
				return fmt.Errorf("failed to acquire table lock for %s (SQL: %s): %w", dialect, lockSQL, err)
			}
		}

		// 3. RE-CONFIRM the condition under the lock.
		// This is the CRITICAL step that prevents the race condition.
		var count int64
		if err := tx.Model(&models.User{}).Count(&count).Error; err != nil {
			return fmt.Errorf("failed to re-count users under lock: %w", err)
		}

		if count > 0 {
			// Condition failed: another process beat us to it.
			// We release the lock by rolling back and return without creating the admin.
			// We could create the account as a normal user, but if this race actually occurs
			// it indicates a high-concurrency situation that should be investigated.
			return errors.New("first user already registered by concurrent process")
		}

		user.Roles = adminRoles

		// Set user metadata
		if user.ID == "" {
			user.ID = uuid.New().String()
		}
		user.CreatedAt = time.Now()
		user.UpdatedAt = time.Now()

		// Create the user within the transaction
		return tx.Create(user).Error
	})
}

// GetByID retrieves a user by ID
func (r *userRepository) GetByID(id string) (*models.User, error) {
	var user models.User
	if err := r.db.First(&user, "id = ?", id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("user not found")
		}
		return nil, err
	}
	return &user, nil
}

// GetByUsername retrieves a user by username
func (r *userRepository) GetByUsername(username string) (*models.User, error) {
	var user models.User
	if err := r.db.First(&user, "username = ?", username).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("user not found")
		}
		return nil, err
	}
	return &user, nil
}

// GetByEmail retrieves a user by email
func (r *userRepository) GetByEmail(email string) (*models.User, error) {
	var user models.User
	if err := r.db.First(&user, "email = ?", email).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("user not found")
		}
		return nil, err
	}
	return &user, nil
}

// Update updates an existing user
func (r *userRepository) Update(user *models.User) error {
	user.UpdatedAt = time.Now()
	return r.db.Save(user).Error
}

// Count returns the total number of users
func (r *userRepository) Count() (int64, error) {
	var count int64
	if err := r.db.Model(&models.User{}).Count(&count).Error; err != nil {
		return 0, err
	}
	return count, nil
}
