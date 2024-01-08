package models

import (
	"database/sql"
	"errors"
	"time"
)

type Bill struct {
	ID          int
	Name        string
	Description string
	Amount      float64
	DueDate     int
	Created     time.Time
	Archived    sql.NullTime
}

type BillModel struct {
	DB *sql.DB
}

func (m *BillModel) Insert(name string, description string, amount float64, due int) (int, error) {
	stmt := "INSERT INTO bills (name, description, amount, due) VALUES(?, ?, ?, ?)"

	result, err := m.DB.Exec(stmt, name, description, amount, due)
	if err != nil {
		return 0, err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return 0, err
	}

	return int(id), nil
}

func (m *BillModel) Get(id int) (Bill, error) {
	stmt := "SELECT id, name, description, amount, due FROM bills WHERE archived_at IS NULL and id = ?"

	var bill Bill

	err := m.DB.QueryRow(stmt, id).Scan(&bill.ID, &bill.Name, &bill.Description, &bill.Amount, &bill.DueDate)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return Bill{}, ErrNoRecord
		} else {
			return Bill{}, err
		}
	}

	return bill, nil
}

func (m *BillModel) List() ([]Bill, error) {
	stmt := "SELECT id, name, description, amount, due FROM bills WHERE archived_at IS NULL"

	rows, err := m.DB.Query(stmt)
	if err != nil {
		return nil, err
	}

	defer rows.Close()

	var bills []Bill

	for rows.Next() {
		var bill Bill
		err = rows.Scan(&bill.ID, &bill.Name, &bill.Description, &bill.Amount, &bill.DueDate)
		if err != nil {
			return nil, err
		}

		bills = append(bills, bill)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return bills, nil
}

func (m *BillModel) Archive(id int) error {
	// stmt := "DELETE FROM bills WHERE id = ?"
	stmt := "UPDATE bills SET archived_at = CURRENT_TIMESTAMP WHERE id = ?"

	_, err := m.DB.Exec(stmt, id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return ErrNoRecord
		} else {
			return err
		}
	}

	return nil
}
