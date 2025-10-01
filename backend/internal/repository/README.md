# Repository

This directory contains the data access layer for the Williams application.

Repositories handle:
- Database operations (CRUD)
- Query construction
- Data persistence
- Transaction management

## Structure

Each repository should:
- Define an interface for testability
- Implement database-specific logic
- Return domain models
- Handle database errors appropriately

## Example

```go
package repository

import "github.com/cryptk/williams/internal/models"

type BillRepository interface {
    Create(bill *models.Bill) error
    GetByID(id string) (*models.Bill, error)
    List() ([]*models.Bill, error)
    Update(bill *models.Bill) error
    Delete(id string) error
}
```
