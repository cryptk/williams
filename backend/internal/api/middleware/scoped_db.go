package middleware

import (
	"net/http"

	"github.com/cryptk/williams/internal/database"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// Context key for the scoped DB
const ScopedDBKey = "scoped_db"

// TenantScoped is a GORM scope that restricts queries to the current user/tenant.
func TenantScoped(userID string) func(*gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		return db.Where("user_id = ?", userID)
	}
}

// ScopedDBMiddleware attaches a tenant-scoped DB to the context for each request.
func ScopedDBMiddleware(db *database.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := c.Get("user_id")
		if !exists {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "user_id not found in context"})
			return
		}

		userIDStr, ok := userID.(string)
		if !ok {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "invalid user_id type"})
			return
		}

		scopedDB := db.Scopes(TenantScoped(userIDStr))
		c.Set("scoped_db", scopedDB)

		c.Next()
	}
}

// GetScopedDB retrieves the tenant-scoped DB from the context.
func GetScopedDB(c *gin.Context) *gorm.DB {
	if db, exists := c.Get("scoped_db"); exists {
		if gdb, ok := db.(*gorm.DB); ok {
			return gdb
		}
	}
	return nil
}
