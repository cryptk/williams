import { getBillStatus, getDaySuffix } from '../../utils/helpers'
import { route } from 'preact-router'
import { IconButton, Button, Pill } from '../../uielements'

export default function BillCard({ bill, categories, onEdit, onDelete, onMarkAsPaid }) {
  const status = getBillStatus(bill)

  // Determine card styling based on status
  let cardStatusClasses = ''
  if (status === 'due-today') {
    cardStatusClasses = 'card-highlight-warning'
  } else if (status === 'overdue') {
    cardStatusClasses = 'card-highlight-danger'
  }

  return (
    <div class={`group card relative flex flex-col ${cardStatusClasses}`}>
      <div class="mb-2 flex items-start justify-between">
        <h3 class="m-0 flex-1 text-lg font-semibold">{bill.name}</h3>
        <div class="flex gap-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <IconButton variant="secondary" onClick={() => route(`/bills/${bill.id}`)} title="View details">
            👁️
          </IconButton>
          <IconButton variant="secondary" onClick={() => onEdit(bill)} title="Edit bill">
            ✏️
          </IconButton>
          <IconButton variant="danger" onClick={() => onDelete(bill)} title="Delete bill">
            🗑️
          </IconButton>
        </div>
      </div>

      {/* Amount with color based on status */}
      <p
        class={`mb-2 text-2xl font-bold ${
          status === 'overdue' ? 'text-danger' : status === 'due-today' ? 'text-warning' : 'text-primary'
        }`}
      >
        ${bill.amount.toFixed(2)}
      </p>

      {bill.recurrence_type === 'fixed_date' && (
        <p class="text-sm">
          Due Day: {bill.recurrence_days}
          {getDaySuffix(bill.recurrence_days)} of each month
        </p>
      )}
      {bill.recurrence_type === 'interval' && (
        <p class="text-sm">
          Due every: {bill.recurrence_days} day
          {bill.recurrence_days !== 1 ? 's' : ''}
        </p>
      )}
      {bill.recurrence_type === 'none' && <p class="text-sm">One-time bill</p>}
      {bill.next_due_date && <p class="text-sm">Next Due: {new Date(bill.next_due_date).toLocaleDateString()}</p>}
      <p class="text-sm">
        Last Paid: {bill.last_paid_date ? new Date(bill.last_paid_date).toLocaleDateString() : 'Never'}
      </p>
      {bill.category_id && (
        <p class="bg-secondary-light text-gray mt-2 inline-block w-auto max-w-max rounded-full px-3 py-1 text-sm">
          {categories.find((cat) => cat.id === bill.category_id)?.name || 'Unknown Category'}
        </p>
      )}
      <p class="text-muted mt-2 mb-2 flex-grow text-sm leading-snug italic">{bill.notes}</p>
      <div class="mt-auto flex flex-wrap items-center gap-2">
        <Pill variant={bill.is_paid ? 'success' : 'danger'} size="md">
          {bill.is_paid ? 'Paid' : 'Unpaid'}
        </Pill>
        <span class="bg-success inline-block rounded px-2 py-1 text-xs font-semibold text-white">
          {bill.recurrence_type === 'fixed_date'
            ? 'Monthly'
            : bill.recurrence_type === 'interval'
              ? 'Interval'
              : 'One-time'}
        </span>
        <Button
          variant={bill.is_paid ? 'success' : 'successHollow'}
          extraClasses="ml-auto"
          onClick={() => onMarkAsPaid(bill)}
          title="Record payment"
        >
          {bill.is_paid ? '✓ Paid' : 'Record Payment'}
        </Button>
      </div>
    </div>
  )
}
