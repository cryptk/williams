package main

import (
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/cryptk/williams/internal/api"
	"github.com/cryptk/williams/internal/config"
	"github.com/cryptk/williams/internal/database"
	"github.com/cryptk/williams/pkg/utils"
)

func main() {
	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load configuration: %v", err)
	}

	// Initialize timezone
	log.Printf("Initializing timezone: %s", cfg.Timezone)
	if err := utils.InitTimezone(cfg.Timezone); err != nil {
		log.Fatalf("Failed to initialize timezone: %v", err)
	}

	// Initialize database
	db, err := database.New(&cfg.Database)
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	defer db.Close()

	// Run migrations
	log.Println("Running database migrations...")
	if err := db.RunMigrations(); err != nil {
		log.Fatalf("Failed to run migrations: %v", err)
	}
	log.Println("Migrations completed successfully")

	// Initialize API server
	server := api.NewServer(cfg, db)

	// Start server in a goroutine
	go func() {
		if err := server.Start(); err != nil {
			log.Fatalf("Failed to start server: %v", err)
		}
	}()

	log.Printf("Williams server started on %s:%d", cfg.Server.Host, cfg.Server.Port)

	// Wait for interrupt signal to gracefully shutdown the server
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("Shutting down server...")
	server.Shutdown()
	log.Println("Server stopped")
}
