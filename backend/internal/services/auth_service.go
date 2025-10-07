package services

import (
	"errors"
	"fmt"
	"slices"
	"time"

	"github.com/cryptk/williams/internal/models"
	"github.com/cryptk/williams/internal/repository"
	"github.com/golang-jwt/jwt/v5"
	"github.com/rs/zerolog/log"
	"golang.org/x/crypto/bcrypt"
)

// AuthService handles authentication business logic
type AuthService struct {
	userRepo         repository.UserRepository
	categoryRepo     repository.CategoryRepository
	jwtSecret        []byte
	firstUserIsAdmin bool
}

// JWTClaims represents the JWT claims structure
type JWTClaims struct {
	Roles []string `json:"roles"`
	jwt.RegisteredClaims
}

// NewAuthService creates a new authentication service
func NewAuthService(userRepo repository.UserRepository, categoryRepo repository.CategoryRepository, jwtSecret string, firstUserIsAdmin bool) *AuthService {
	return &AuthService{
		userRepo:         userRepo,
		categoryRepo:     categoryRepo,
		jwtSecret:        []byte(jwtSecret),
		firstUserIsAdmin: firstUserIsAdmin,
	}
}

// Register creates a new user account
func (s *AuthService) Register(req *models.RegisterRequest) (*models.User, error) {
	// Check if username already exists
	if _, err := s.userRepo.GetByUsername(req.Username); err == nil {
		return nil, errors.New("username already exists")
	}

	// Check if email already exists
	if _, err := s.userRepo.GetByEmail(req.Email); err == nil {
		return nil, errors.New("email already exists")
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}

	// Create user with appropriate roles
	user := &models.User{
		Username:     req.Username,
		Email:        req.Email,
		PasswordHash: string(hashedPassword),
	}

	// set numUsers to -1 to indicate we haven't checked yet
	numUsers := int64(-1)
	if s.firstUserIsAdmin {
		numUsers, err = s.userRepo.Count()
		if err != nil {
			return nil, fmt.Errorf("failed to count users: %w", err)
		}
	}
	if s.firstUserIsAdmin && numUsers == 0 {
		// CreateWithFirstUserCheck involves an exclusive lock on the users table
		// to prevent race conditions where multiple users could both become admins
		// To avoid the bottleneck, we only do this if there appears to be no users
		// in the database. This will be confirmed inside the locking transaction.
		// In normal operation, this code path will only be hit once when the first user
		// registers. Subsequent registrations will use the standard Create method.

		adminRoles := []string{"admin", "user"}
		if err := s.userRepo.CreateWithFirstUserCheck(user, adminRoles); err != nil {
			return nil, fmt.Errorf("failed to create user: %w", err)
		}

		// Log if admin role was assigned (will have both admin and user roles)
		if slices.Contains(user.Roles, "admin") {
			log.Info().Str("user_id", user.ID).Msg("First user registered with admin role")
		}
	} else {
		// Standard user creation
		user.Roles = []string{"user"}
		if err := s.userRepo.Create(user); err != nil {
			return nil, fmt.Errorf("failed to create user: %w", err)
		}
	}

	// Create default categories for the new user
	if err := s.categoryRepo.CreateDefaults(user.ID); err != nil {
		// Log the error but don't fail registration
		// The user can create categories manually if this fails
		log.Warn().Err(err).Str("user_id", user.ID).Msg("Failed to create default categories for user")
	}

	return user, nil
}

// Login authenticates a user and returns a JWT token
func (s *AuthService) Login(req *models.LoginRequest) (string, *models.User, error) {
	// Get user by username
	user, err := s.userRepo.GetByUsername(req.Username)
	if err != nil {
		return "", nil, errors.New("invalid username or password")
	}

	// Verify password
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		return "", nil, errors.New("invalid username or password")
	}

	// Generate JWT token
	token, err := s.generateToken(user)
	if err != nil {
		return "", nil, fmt.Errorf("failed to generate token: %w", err)
	}

	return token, user, nil
}

// ValidateToken validates a JWT token and returns the user ID
func (s *AuthService) ValidateToken(tokenString string) (*JWTClaims, error) {
	claims := &JWTClaims{}

	keyFunc := func(token *jwt.Token) (any, error) {
		// We use the WithValidMethods option in ParseWithClaims,
		// so we don't need to check the signing method here
		return s.jwtSecret, nil
	}

	// We are using the jwt library provided options to enforce
	// valid signing methods and other checks.
	// This ensures that we are running these checks in ways that follow best practices.
	token, err := jwt.ParseWithClaims(
		tokenString,
		claims,
		keyFunc,
		jwt.WithValidMethods([]string{
			jwt.SigningMethodHS256.Alg(),
			jwt.SigningMethodHS384.Alg(),
			jwt.SigningMethodHS512.Alg(),
		}),
		jwt.WithIssuedAt(),
		jwt.WithLeeway(5*time.Second), // Allow 5 seconds of clock skew
		jwt.WithExpirationRequired(),
	)

	if err != nil {
		log.Error().Err(err).Msg("Failed to parse token")
		return nil, err
	}

	if !token.Valid {
		return nil, errors.New("invalid token")
	}

	// Token is valid, return the user ID from claims
	// In the future we might want to return more information from the claims
	// such as roles or permissions.
	log.Debug().Str("user_id", claims.Subject).Msg("Token validated successfully")
	return claims, nil
}

// generateToken creates a JWT token for a user
func (s *AuthService) generateToken(user *models.User) (string, error) {
	claims := JWTClaims{
		Roles: user.Roles,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   user.ID,
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Hour * 24 * 7)), // 7 days
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(s.jwtSecret)
}

// GetUserByID retrieves a user by ID
func (s *AuthService) GetUserByID(id string) (*models.User, error) {
	return s.userRepo.GetByID(id)
}
