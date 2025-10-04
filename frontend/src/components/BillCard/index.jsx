import "./style.css";
import { getBillStatus, getDaySuffix } from "../../utils/helpers";
import { route } from "preact-router";

export default function BillCard({ bill, categories, onEdit, onDelete, onMarkAsPaid }) {
  return (
    <div class={`bill-card ${getBillStatus(bill)}`}>
      <div class="bill-header">
        <h3>{bill.name}</h3>
        <div class="bill-actions">
          <button
            class="action-btn view-btn"
            onClick={() => route(`/bills/${bill.id}`)}
            title="View details"
          >
            👁️
          </button>
          <button
            class="action-btn edit-btn"
            onClick={() => onEdit(bill)}
            title="Edit bill"
          >
            ✏️
          </button>
          <button
            class="action-btn delete-btn"
            onClick={() => onDelete(bill)}
            title="Delete bill"
          >
            🗑️
          </button>
        </div>
      </div>
      <p class="amount">${bill.amount.toFixed(2)}</p>
      {bill.recurrence_type === "fixed_date" && (
        <p class="due-date">
          Due Day: {bill.recurrence_days}
          {getDaySuffix(bill.recurrence_days)} of each month
        </p>
      )}
      {bill.recurrence_type === "interval" && (
        <p class="due-date">
          Due every: {bill.recurrence_days} day
          {bill.recurrence_days !== 1 ? "s" : ""}
        </p>
      )}
      {bill.recurrence_type === "none" && (
        <p class="due-date">One-time bill</p>
      )}
      {bill.next_due_date && (
        <p class="due-date">
          Next Due: {new Date(bill.next_due_date).toLocaleDateString()}
        </p>
      )}
      {bill.last_paid_date && (
        <p class="due-date">
          Last Paid: {new Date(bill.last_paid_date).toLocaleDateString()}
        </p>
      )}
      {bill.category_id && (
        <p class="category">
          {categories.find((cat) => cat.id === bill.category_id)?.name || "Unknown Category"}
        </p>
      )}
      {bill.notes && <p class="notes">{bill.notes}</p>}
      <div class="bill-footer">
        <span class={`status ${bill.is_paid ? "paid" : "unpaid"}`}>
          {bill.is_paid ? "Paid" : "Unpaid"}
        </span>
        {bill.recurrence_type === "fixed_date" && (
          <span class="badge">Monthly</span>
        )}
        {bill.recurrence_type === "interval" && (
          <span class="badge">Interval</span>
        )}
        <button
          class={`btn-mark-paid ${bill.is_paid ? "paid" : ""}`}
          onClick={() => onMarkAsPaid(bill)}
          title="Record payment"
        >
          {bill.is_paid ? "✓ Paid" : "Record Payment"}
        </button>
      </div>
    </div>
  );
}
