# Pkg

This directory contains public packages that can be imported by external projects.

These packages should:
- Be stable and well-documented
- Have minimal dependencies
- Provide reusable utilities
- Not depend on internal packages

## Packages

### logger
Centralized logging configuration using rs/zerolog. Provides:
- Structured logging with key-value pairs
- Multiple output formats (console, JSON)
- Configurable log levels
- Zero-allocation performance

See [logger/README.md](logger/README.md) for usage details.

### utils
General utility functions including:
- Date manipulation helpers
- Timezone conversion utilities

See [utils/README.md](utils/README.md) for more information.

## Examples of what might go here:

- Shared utilities
- Custom error types
- Common validators
- Helper functions
- Constants that external consumers need

Only add packages here if they are meant to be used outside this project.
