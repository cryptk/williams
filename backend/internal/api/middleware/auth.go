package middleware

import (
	"net/http"
	"strings"

	"github.com/cryptk/williams/internal/services"
	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog/log"
)

func AuthMiddleware(authService *services.AuthService) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			log.Debug().Str("path", c.Request.URL.Path).Msg("Missing authorization header")
			c.JSON(http.StatusUnauthorized, gin.H{"error": "authorization header required"})
			c.Abort()
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || parts[0] != "Bearer" {
			log.Debug().Str("path", c.Request.URL.Path).Msg("Invalid authorization header format")
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid authorization header format"})
			c.Abort()
			return
		}

		token := parts[1]
		userID, err := authService.ValidateToken(token)
		if err != nil {
			log.Warn().Err(err).Str("path", c.Request.URL.Path).Msg("Invalid or expired token")
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid or expired token"})
			c.Abort()
			return
		}

		// Verify the user still exists in the database
		_, err = authService.GetUserByID(userID)
		if err != nil {
			log.Warn().Err(err).Str("user_id", userID).Str("path", c.Request.URL.Path).Msg("User not found for valid token")
			c.JSON(http.StatusUnauthorized, gin.H{"error": "user not found"})
			c.Abort()
			return
		}

		c.Set("user_id", userID)
		c.Next()
	}
}
