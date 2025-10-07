import { getBillStatus, getDaySuffix } from "../../utils/helpers";
import { route } from "preact-router";
import { IconButton, Button, Pill } from "../../uielements";

export default function BillCard({
  bill,
  categories,
  onEdit,
  onDelete,
  onMarkAsPaid,
}) {
  const status = getBillStatus(bill);

  // Determine card styling based on status
  let cardStatusClasses = "";
  if (status === "due-today") {
    cardStatusClasses = "card-highlight-warning";
  } else if (status === "overdue") {
    cardStatusClasses = "card-highlight-danger";
  }

  return (
    <div class={`card flex flex-col relative group ${cardStatusClasses}`}>
      <div class="flex justify-between items-start mb-2">
        <h3 class="flex-1 m-0 text-lg font-semibold">{bill.name}</h3>
        <div class="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <IconButton
            variant="secondary"
            onClick={() => route(`/bills/${bill.id}`)}
            title="View details"
          >
            👁️
          </IconButton>
          <IconButton
            variant="secondary"
            onClick={() => onEdit(bill)}
            title="Edit bill"
          >
            ✏️
          </IconButton>
          <IconButton
            variant="danger"
            onClick={() => onDelete(bill)}
            title="Delete bill"
          >
            🗑️
          </IconButton>
        </div>
      </div>

      {/* Amount with color based on status */}
      <p
        class={`text-2xl font-bold mb-2 ${
          status === "overdue"
            ? "text-danger"
            : status === "due-today"
            ? "text-warning"
            : "text-primary"
        }`}
      >
        ${bill.amount.toFixed(2)}
      </p>

      {bill.recurrence_type === "fixed_date" && (
        <p class="text-text-secondary text-sm">
          Due Day: {bill.recurrence_days}
          {getDaySuffix(bill.recurrence_days)} of each month
        </p>
      )}
      {bill.recurrence_type === "interval" && (
        <p class="text-text-secondary text-sm">
          Due every: {bill.recurrence_days} day
          {bill.recurrence_days !== 1 ? "s" : ""}
        </p>
      )}
      {bill.recurrence_type === "none" && (
        <p class="text-text-secondary text-sm">One-time bill</p>
      )}
      {bill.next_due_date && (
        <p class="text-text-secondary text-sm">
          Next Due: {new Date(bill.next_due_date).toLocaleDateString()}
        </p>
      )}
      <p class="text-text-secondary text-sm">
        Last Paid:{" "}
        {bill.last_paid_date
          ? new Date(bill.last_paid_date).toLocaleDateString()
          : "Never"}
      </p>
      {bill.category_id && (
        <p class="inline-block px-3 py-1 w-auto max-w-max bg-secondary-light rounded-full text-sm text-gray mt-2">
          {categories.find((cat) => cat.id === bill.category_id)?.name ||
            "Unknown Category"}
        </p>
      )}
      <p class="text-muted text-sm italic mt-2 leading-snug flex-grow mb-2">
        {bill.notes}
      </p>
      <div class="flex items-center gap-2 mt-auto flex-wrap">
        <Pill variant={bill.is_paid ? "success" : "danger"} size="md">
          {bill.is_paid ? "Paid" : "Unpaid"}
        </Pill>
        <span class="inline-block px-2 py-1 bg-success text-white rounded text-xs font-semibold">
          {bill.recurrence_type === "fixed_date"
            ? "Monthly"
            : bill.recurrence_type === "interval"
            ? "Interval"
            : "One-time"}
        </span>
        <Button
          variant={bill.is_paid ? "success" : "successHollow"}
          extraClasses="ml-auto"
          onClick={() => onMarkAsPaid(bill)}
          title="Record payment"
        >
          {bill.is_paid ? "✓ Paid" : "Record Payment"}
        </Button>
      </div>
    </div>
  );
}
