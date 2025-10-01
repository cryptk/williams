package utils

import (
	"fmt"
	"time"
)

var appLocation *time.Location

// InitTimezone initializes the application timezone
// This should be called once at application startup with the configured timezone string
func InitTimezone(tzString string) error {
	loc, err := time.LoadLocation(tzString)
	if err != nil {
		return fmt.Errorf("failed to load timezone %s: %w", tzString, err)
	}
	appLocation = loc
	return nil
}

// GetAppLocation returns the configured application timezone location
// Returns UTC if not initialized
func GetAppLocation() *time.Location {
	if appLocation == nil {
		return time.UTC
	}
	return appLocation
}

// ConvertToAppTimezone converts a time from any timezone to the application's configured timezone
func ConvertToAppTimezone(t time.Time) time.Time {
	return t.In(GetAppLocation())
}

// NowInAppTimezone returns the current time in the application's configured timezone
func NowInAppTimezone() time.Time {
	return time.Now().In(GetAppLocation())
}

// ParseAndConvertToAppTimezone parses an RFC3339 time string and converts it to the application timezone
func ParseAndConvertToAppTimezone(timeStr string) (time.Time, error) {
	t, err := time.Parse(time.RFC3339, timeStr)
	if err != nil {
		return time.Time{}, fmt.Errorf("failed to parse time: %w", err)
	}
	return ConvertToAppTimezone(t), nil
}
