# Architectural References

This directory contains documentation about architectural decisions and implementation details. These documents are primarily for Copilot's reference and provide context about why and how certain features were implemented.

## Documents

### Backend

#### BILL_RECURRENCE.md
Comprehensive documentation of the bill recurrence system including:
- Multiple recurrence types (fixed_date, interval, none)
- Date calculation logic for each type
- Data model and validation rules
- Service layer implementation
- Frontend integration
- Common use cases and examples

#### ZEROLOG_LOGGING.md
Details about structured logging with rs/zerolog including implementation patterns and best practices.

#### GORM_LOGGER_RECORD_NOT_FOUND.md
Documents the implementation of `IgnoreRecordNotFoundError` functionality in the custom GORM logger to reduce log noise from expected "record not found" errors.

#### TIMEZONE_IMPLEMENTATION.md
Complete implementation details of the timezone system including:
- How timezone conversion works throughout the stack
- Database storage considerations
- Date calculation internals
- Integration between frontend and backend

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
- **How** features are implemented
- **Trade-offs** considered during implementation
- **Best practices** for working with the codebase

## For User-Facing Documentation

See the `docs/` directory for practical guides on:
- How to use features
- Configuration options
- API documentation
- Troubleshooting guides
