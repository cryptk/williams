# Services

This directory contains the business logic layer for the Williams application.

Services handle:
- Complex business rules and validation
- Orchestration between repositories
- Data transformation
- Application-specific logic

## Structure

Each service should:
- Have a clear, single responsibility
- Use dependency injection for repositories
- Return domain errors, not repository errors
- Be unit testable

## Example

```go
package services

type BillService struct {
    repo repository.BillRepository
}

func NewBillService(repo repository.BillRepository) *BillService {
    return &BillService{repo: repo}
}

func (s *BillService) CreateBill(bill *models.Bill) error {
    // Business logic here
    return s.repo.Create(bill)
}
```
