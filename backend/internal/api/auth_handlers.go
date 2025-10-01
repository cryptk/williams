package api

import (
	"net/http"

	"github.com/cryptk/williams/internal/models"
	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog/log"
)

// Auth handlers

func (s *Server) register(c *gin.Context) {
	var req models.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, err := s.authService.Register(&req)
	if err != nil {
		log.Warn().Err(err).Str("username", req.Username).Msg("Registration failed")
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	log.Info().Str("user_id", user.ID).Str("username", user.Username).Msg("User registered successfully")

	// Generate token for the new user
	token, _, err := s.authService.Login(&models.LoginRequest{
		Username: req.Username,
		Password: req.Password,
	})
	if err != nil {
		log.Error().Err(err).Str("user_id", user.ID).Msg("Failed to generate token after registration")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate token"})
		return
	}

	c.JSON(http.StatusCreated, models.AuthResponse{
		Token: token,
		User:  *user,
	})
}

func (s *Server) login(c *gin.Context) {
	var req models.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	token, user, err := s.authService.Login(&req)
	if err != nil {
		log.Warn().Err(err).Str("username", req.Username).Msg("Login failed")
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	log.Info().Str("user_id", user.ID).Str("username", user.Username).Msg("User logged in successfully")

	c.JSON(http.StatusOK, models.AuthResponse{
		Token: token,
		User:  *user,
	})
}

func (s *Server) getCurrentUser(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not authenticated"})
		return
	}

	user, err := s.authService.GetUserByID(userID.(string))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	c.JSON(http.StatusOK, user)
}
