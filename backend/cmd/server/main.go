package main

import (
	"os"
	"os/signal"
	"syscall"

	"github.com/cryptk/williams/internal/api"
	"github.com/cryptk/williams/internal/config"
	"github.com/cryptk/williams/internal/database"
	"github.com/cryptk/williams/pkg/logger"
	"github.com/cryptk/williams/pkg/utils"
	"github.com/rs/zerolog/log"
)

func main() {
	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to load configuration")
	}

	// Initialize logger
	logger.Init(cfg.Logging.Level, cfg.Logging.Format)
	log.Info().Str("level", cfg.Logging.Level).Str("format", cfg.Logging.Format).Msg("Logger initialized")

	// Initialize timezone
	log.Info().Str("timezone", cfg.Timezone).Msg("Initializing timezone")
	if err := utils.InitTimezone(cfg.Timezone); err != nil {
		log.Fatal().Err(err).Str("timezone", cfg.Timezone).Msg("Failed to initialize timezone")
	}

	// Initialize database
	log.Info().Str("driver", cfg.Database.Driver).Msg("Initializing database connection")
	db, err := database.New(&cfg.Database)
	if err != nil {
		log.Fatal().Err(err).Str("driver", cfg.Database.Driver).Msg("Failed to initialize database")
	}
	defer db.Close()

	// Run migrations
	log.Info().Msg("Running database migrations...")
	if err := db.RunMigrations(); err != nil {
		log.Fatal().Err(err).Msg("Failed to run migrations")
	}
	log.Info().Msg("Migrations completed successfully")

	// Initialize API server
	server := api.NewServer(cfg, db)

	// Start server in a goroutine
	go func() {
		err := server.Start()
		if err != nil && err.Error() != "http: Server closed" {
			log.Fatal().Err(err).Msg("Failed to start server")
		}
	}()

	log.Info().
		Str("host", cfg.Server.Host).
		Int("port", cfg.Server.Port).
		Msgf("Williams server started on %s:%d", cfg.Server.Host, cfg.Server.Port)

	// Wait for interrupt signal to gracefully shutdown the server
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Info().Msg("Shutting down server...")
	server.Shutdown()
	log.Info().Msg("Server stopped")
}
