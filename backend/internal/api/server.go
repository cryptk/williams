package api

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/cryptk/williams/internal/api/middleware"
	"github.com/cryptk/williams/internal/config"
	"github.com/cryptk/williams/internal/database"
	"github.com/cryptk/williams/internal/repository"
	"github.com/cryptk/williams/internal/services"
	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog/log"
)

// Server represents the API server
type Server struct {
	config          *config.Config
	router          *gin.Engine
	httpServer      *http.Server
	authService     *services.AuthService
	billService     *services.BillService
	categoryService *services.CategoryService
}

// NewServer creates a new API server
func NewServer(cfg *config.Config, db *database.DB) *Server {
	// Set gin mode based on log level
	if cfg.Logging.Level == "debug" {
		gin.SetMode(gin.DebugMode)
	} else {
		gin.SetMode(gin.ReleaseMode)
	}

	router := gin.New()

	// Add request logging middleware
	router.Use(func(c *gin.Context) {
		start := time.Now()
		path := c.Request.URL.Path
		raw := c.Request.URL.RawQuery

		c.Next()

		latency := time.Since(start)
		clientIP := c.ClientIP()
		method := c.Request.Method
		statusCode := c.Writer.Status()

		if raw != "" {
			path = path + "?" + raw
		}

		log.Info().
			Str("method", method).
			Str("path", path).
			Int("status", statusCode).
			Dur("latency", latency).
			Str("client_ip", clientIP).
			Msg("HTTP request")
	})

	// Add recovery middleware
	router.Use(gin.Recovery())

	// Enable CORS for frontend
	router.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	// Initialize repositories
	userRepo := repository.NewUserRepository(db.DB)
	billRepo := repository.NewBillRepository(db.DB)
	categoryRepo := repository.NewCategoryRepository(db.DB)
	paymentRepo := repository.NewPaymentRepository(db.DB)

	// Initialize services
	authService := services.NewAuthService(userRepo, categoryRepo, cfg.Auth.JWTSecret)
	billService := services.NewBillService(billRepo, paymentRepo, cfg)
	categoryService := services.NewCategoryService(categoryRepo)

	server := &Server{
		config:          cfg,
		router:          router,
		authService:     authService,
		billService:     billService,
		categoryService: categoryService,
	}

	server.setupRoutes()

	return server
}

// setupRoutes configures all API routes
func (s *Server) setupRoutes() {

	// Serve static frontend assets securely
	s.router.NoRoute(func(c *gin.Context) {
		if c.Request.Method != http.MethodGet && c.Request.Method != http.MethodHead {
			c.Next()
			return
		}

		staticDir := "build/dist"
		requestPath := c.Request.URL.Path

		// If requesting "/", serve index.html
		if requestPath == "/" {
			c.File(filepath.Join(staticDir, "index.html"))
			return
		}

		// Clean the path to prevent path traversal
		cleanPath := filepath.Clean(filepath.Join("/", requestPath)) // ensure leading slash
		// Remove leading slash for http.Dir
		relativePath := cleanPath[1:]

		// Ensure the resolved path stays within staticDir using filepath.Rel
		fullPath := filepath.Join(staticDir, relativePath)
		absStaticDir, err1 := filepath.Abs(staticDir)
		absFullPath, err2 := filepath.Abs(fullPath)
		if err1 != nil || err2 != nil {
			c.AbortWithStatus(http.StatusForbidden)
			return
		}
		rel, err := filepath.Rel(absStaticDir, absFullPath)
		if err != nil || strings.HasPrefix(rel, "..") || filepath.IsAbs(rel) {
			c.AbortWithStatus(http.StatusForbidden)
			return
		}

		// Check if the file exists using os.Stat (more efficient than opening twice)
		fileToServe := filepath.Join(staticDir, relativePath)
		if info, err := os.Stat(fileToServe); err == nil && !info.IsDir() {
			c.File(fileToServe)
			return
		}
		// Fallback: if not found, serve index.html for SPA routes (except for actual missing files)
		c.File(filepath.Join(staticDir, "index.html"))
	})

	// Health check
	s.router.GET("/health", s.healthCheck)

	// API v1 routes
	v1 := s.router.Group("/api/v1")
	{
		// Public auth endpoints
		auth := v1.Group("/auth")
		{
			auth.POST("/register", s.register)
			auth.POST("/login", s.login)
		}

		// Protected routes (require authentication)
		protected := v1.Group("")
		protected.Use(middleware.AuthMiddleware(s.authService))
		{
			// User endpoints
			protected.GET("/auth/me", s.getCurrentUser)

			// Bills endpoints
			bills := protected.Group("/bills")
			{
				bills.GET("", s.listBills)
				bills.GET("/:id", s.getBill)
				bills.POST("", s.createBill)
				bills.PUT("/:id", s.updateBill)
				bills.DELETE("/:id", s.deleteBill)
				bills.POST("/:id/payments", s.createPayment)
				bills.GET("/:id/payments", s.listPayments)
				bills.DELETE("/:id/payments/:payment_id", s.deletePayment)
			}

			// Categories endpoints
			categories := protected.Group("/categories")
			{
				categories.GET("", s.listCategories)
				categories.POST("", s.createCategory)
				categories.DELETE("/:id", s.deleteCategory)
			}

			// Statistics endpoints
			stats := protected.Group("/stats")
			{
				stats.GET("/summary", s.getStatsSummary)
			}
		}
	}
}

// Start starts the HTTP server
func (s *Server) Start() error {
	// If Host is empty, bind to all interfaces (equivalent to "0.0.0.0")
	host := s.config.Server.Host
	if host == "" {
		host = "0.0.0.0"
	}
	addr := fmt.Sprintf("%s:%d", host, s.config.Server.Port)

	s.httpServer = &http.Server{
		Addr:           addr,
		Handler:        s.router,
		ReadTimeout:    10 * time.Second,
		WriteTimeout:   10 * time.Second,
		MaxHeaderBytes: 1 << 20,
	}

	return s.httpServer.ListenAndServe()
}

// Shutdown gracefully shuts down the server
func (s *Server) Shutdown() error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	return s.httpServer.Shutdown(ctx)
}

// Health check handler
func (s *Server) healthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":  "ok",
		"service": "williams",
		"version": "0.1.0",
	})
}
