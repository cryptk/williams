package middleware

import (
	"net/http"
	"strings"

	"github.com/cryptk/williams/internal/services"
	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog/log"
)

// AuthMiddleware creates a middleware that validates JWT tokens and optionally checks for required roles.
// If requiredRoles is empty, only authentication is checked.
// If requiredRoles is provided, the user must have at least one of the specified roles.
func AuthMiddleware(authService *services.AuthService, requiredRoles ...string) gin.HandlerFunc {
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
		user_claims, err := authService.ValidateToken(token)
		if err != nil {
			log.Warn().Err(err).Str("path", c.Request.URL.Path).Msg("Invalid or expired token")
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid or expired token"})
			c.Abort()
			return
		}

		// Verify the user still exists in the database
		_, err = authService.GetUserByID(user_claims.Subject)
		if err != nil {
			log.Warn().Err(err).Str("user_id", user_claims.Subject).Str("path", c.Request.URL.Path).Msg("User not found for valid token")
			c.JSON(http.StatusUnauthorized, gin.H{"error": "user not found"})
			c.Abort()
			return
		}

		// Check if user has required roles (if any specified)
		// If a route uses this middleware without specifying roles, only authentication is enforced
		if len(requiredRoles) > 0 {
			hasRequiredRole := false
			for _, requiredRole := range requiredRoles {
				for _, userRole := range user_claims.Roles {
					if userRole == requiredRole {
						hasRequiredRole = true
						break
					}
				}
				if hasRequiredRole {
					break
				}
			}

			if !hasRequiredRole {
				log.Warn().
					Str("user_id", user_claims.Subject).
					Strs("user_roles", user_claims.Roles).
					Strs("required_roles", requiredRoles).
					Str("path", c.Request.URL.Path).
					Msg("User does not have required role")
				c.JSON(http.StatusForbidden, gin.H{"error": "insufficient permissions"})
				c.Abort()
				return
			}
		}

		c.Set("user_id", user_claims.Subject)
		c.Set("user_roles", user_claims.Roles)
		c.Next()
	}
}
