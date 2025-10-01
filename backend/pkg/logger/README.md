# Logger Package

Centralized logging configuration for Williams using [rs/zerolog](https://github.com/rs/zerolog).

## Usage

The logger is automatically initialized at application startup. To use logging in your code:

```go
import "github.com/rs/zerolog/log"

log.Info().Msg("Hello")
log.Error().Err(err).Str("user_id", userID).Msg("Operation failed")
```

## Configuration

Configured via `config.yaml` or environment variables:

```yaml
logging:
  level: info  # debug, info, warn, error, fatal, panic, disabled
  format: console  # console or json
```

```bash
export WILLIAMS_LOGGING_LEVEL=debug
export WILLIAMS_LOGGING_FORMAT=json
```

## See Also

- [Complete Logging Guide](../../docs/backend/LOGGING.md) - Detailed usage examples and best practices
- [rs/zerolog Documentation](https://github.com/rs/zerolog)
