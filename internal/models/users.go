package models

import (
	"database/sql"
	"errors"
	"log/slog"
	"strings"
	"time"

	"github.com/mattn/go-sqlite3"
	"golang.org/x/crypto/bcrypt"
)

type User struct {
	ID             int
	Name           string
	Email          string
	HashedPassword []byte
	Created        time.Time
}

type UserModel struct {
	DB     *sql.DB
	Logger *slog.Logger
}

func (m *UserModel) Insert(name, email, password string) error {
	HashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), 12)
	if err != nil {
		return err
	}

	stmt := `INSERT INTO users (name, email, hashed_password, created)
	VALUES(?, ?, ?, CURRENT_TIMESTAMP)`

	_, err = m.DB.Exec(stmt, name, email, string(HashedPassword))
	if err != nil {
		// We can't use "if errors.As(err, &sqliteError)" here because mattn/go-sqlite3 does not wrap the error.
		// Instead we must cast it and check if the cast was successful
		if sqliteError, ok := err.(sqlite3.Error); ok {
			// Here we check if the error returned is a "constraint error" that mentions the "users.email" field
			if sqliteError.Code == sqlite3.ErrConstraint && strings.Contains(sqliteError.Error(), "users.email") {
				return ErrDuplicateEmail
			}
		}
		return err
	}

	return nil
}

func (m *UserModel) Authenticate(email, password string) (int, error) {
	var id int
	var hashedPassword []byte

	stmt := "SELECT id, hashed_password FROM users WHERE email = ?"

	// Query the users ID and hashed password from the DB
	err := m.DB.QueryRow(stmt, email).Scan(&id, &hashedPassword)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return 0, ErrInvalidCredentials
		} else {
			return 0, err
		}
	}

	// Compare the provided password with the stored password hash
	err = bcrypt.CompareHashAndPassword(hashedPassword, []byte(password))
	if err != nil {
		if errors.Is(err, bcrypt.ErrMismatchedHashAndPassword) {
			return 0, ErrInvalidCredentials
		} else {
			return 0, err
		}
	}

	return id, nil
}

func (m *UserModel) Exists(id int) (bool, error) {
	return false, nil
}
