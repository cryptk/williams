package config

import (
	"fmt"
	"strings"

	"github.com/spf13/viper"
)

// Config represents the application configuration
type Config struct {
	Server   ServerConfig   `mapstructure:"server"`
	Database DatabaseConfig `mapstructure:"database"`
	Auth     AuthConfig     `mapstructure:"auth"`
	Bills    BillsConfig    `mapstructure:"bills"`
	Logging  LoggingConfig  `mapstructure:"logging"`
	Timezone string         `mapstructure:"timezone"` // IANA timezone (e.g., "America/New_York", "UTC")
}

// ServerConfig represents server configuration
type ServerConfig struct {
	Host             string `mapstructure:"host"`
	Port             int    `mapstructure:"port"`
	StaticAssetsPath string `mapstructure:"static_assets_path"`
}

// DatabaseConfig represents database configuration
type DatabaseConfig struct {
	Driver string `mapstructure:"driver"` // sqlite, mysql, postgres
	DSN    string `mapstructure:"dsn"`    // Data source name / connection string
}

// AuthConfig represents authentication configuration
type AuthConfig struct {
	JWTSecret string `mapstructure:"jwt_secret"`
}

// BillsConfig represents bills configuration
type BillsConfig struct {
	PaymentGraceDays       int `mapstructure:"payment_grace_days"`
	MaximumBillingInterval int `mapstructure:"maximum_billing_interval"`
}

// LoggingConfig represents logging configuration
type LoggingConfig struct {
	Level  string `mapstructure:"level"`
	Format string `mapstructure:"format"`
}

// Load reads configuration from file and environment variables
func Load() (*Config, error) {
	v := viper.New()

	// Set default values
	v.SetDefault("server.host", "localhost")
	v.SetDefault("server.port", 8080)
	v.SetDefault("server.static_assets_path", "./dist")
	v.SetDefault("database.driver", "sqlite")
	v.SetDefault("database.dsn", "./williams.db")
	v.SetDefault("auth.jwt_secret", "change-this-secret-in-production")
	v.SetDefault("bills.payment_grace_days", 7)
	v.SetDefault("bills.maximum_billing_interval", 365)
	v.SetDefault("logging.level", "info")
	v.SetDefault("logging.format", "json")
	v.SetDefault("timezone", "UTC")

	// Set config file name and paths
	v.SetConfigName("config")
	v.SetConfigType("yaml")
	v.AddConfigPath("./configs")
	v.AddConfigPath("./backend/configs")
	v.AddConfigPath(".")

	// Read config file (optional)
	if err := v.ReadInConfig(); err != nil {
		if _, ok := err.(viper.ConfigFileNotFoundError); !ok {
			return nil, fmt.Errorf("failed to read config file: %w", err)
		}
		// Config file not found; use defaults
	}

	// Environment variables
	v.SetEnvPrefix("WILLIAMS")
	v.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))
	v.AutomaticEnv()

	// Unmarshal config
	var config Config
	if err := v.Unmarshal(&config); err != nil {
		return nil, fmt.Errorf("failed to unmarshal config: %w", err)
	}

	return &config, nil
}
