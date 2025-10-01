package models

import "time"

// User represents a user account
type User struct {
	ID           string    `json:"id" gorm:"primaryKey;type:text"`
	Username     string    `json:"username" gorm:"uniqueIndex;not null;type:text" binding:"required,min=3,max=50"`
	Email        string    `json:"email" gorm:"uniqueIndex;not null;type:text" binding:"required,email"`
	PasswordHash string    `json:"-" gorm:"column:password_hash;not null;type:text"` // Never send password hash in JSON
	CreatedAt    time.Time `json:"created_at" gorm:"autoCreateTime" binding:"-"`     // Read-only, managed by backend
	UpdatedAt    time.Time `json:"updated_at" gorm:"autoUpdateTime" binding:"-"`     // Read-only, managed by backend
}

// RegisterRequest represents a registration request
type RegisterRequest struct {
	Username string `json:"username" binding:"required,min=3,max=50"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=8"`
}

// LoginRequest represents a login request
type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

// AuthResponse represents an authentication response
type AuthResponse struct {
	Token string `json:"token"`
	User  User   `json:"user"`
}
