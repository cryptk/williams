# Architectural References

This directory contains documentation about architectural decisions, migrations, and implementation details. These documents are primarily for Copilot's reference and provide historical context about why and how certain features were implemented.

## Documents

### Backend

#### ZEROLOG_MIGRATION.md
Details about the migration from standard library logging (`log`, `fmt.Print*`) to structured logging with rs/zerolog. Includes before/after comparisons and implementation details.

#### GORM_LOGGER_RECORD_NOT_FOUND.md
Documents the implementation of `IgnoreRecordNotFoundError` functionality in the custom GORM logger to reduce log noise from expected "record not found" errors.

#### TIMEZONE_IMPLEMENTATION.md
Complete implementation details of the timezone system including:
- How timezone conversion works throughout the stack
- Database storage considerations
- Date calculation internals
- Integration between frontend and backend
- Migration notes for existing data

### Frontend

#### TOAST_NOTIFICATIONS.md
Implementation details of the toast notification system including:
- Component architecture
- ToastProvider context implementation
- Styling details
- Integration points throughout the application

## Purpose

These documents help maintain context about:
- **Why** certain architectural decisions were made
- **How** features were implemented
- **What** changed during migrations or refactors
- **Trade-offs** considered during implementation

## For User-Facing Documentation

See the `docs/` directory for practical guides on:
- How to use features
- Configuration options
- API documentation
- Troubleshooting guides
