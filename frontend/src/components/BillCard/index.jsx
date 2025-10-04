import { getBillStatus, getDaySuffix } from "../../utils/helpers";
import { route } from "preact-router";

export default function BillCard({ bill, categories, onEdit, onDelete, onMarkAsPaid }) {
  const status = getBillStatus(bill);
  
  // Determine card styling based on status
  let cardStatusClasses = '';
  if (status === 'due-today') {
    cardStatusClasses = 'bg-gradient-to-br from-yellow-50 to-white border-l-4 border-warning';
  } else if (status === 'overdue') {
    cardStatusClasses = 'bg-gradient-to-br from-red-50 to-white border-l-4 border-danger';
  }
  
  return (
    <div class={`card p-6 relative transition-all duration-200 hover:-translate-y-0.5 group ${cardStatusClasses}`}>
      <div class="flex justify-between items-start mb-2">
        <h3 class="flex-1 m-0 text-lg font-semibold">{bill.name}</h3>
        <div class="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            class="bg-primary/10 hover:bg-primary/20 border-none cursor-pointer text-xl p-1 rounded transition-all hover:scale-110 leading-none"
            onClick={() => route(`/bills/${bill.id}`)}
            title="View details"
          >
            👁️
          </button>
          <button
            class="bg-primary/10 hover:bg-primary/20 border-none cursor-pointer text-xl p-1 rounded transition-all hover:scale-110 leading-none"
            onClick={() => onEdit(bill)}
            title="Edit bill"
          >
            ✏️
          </button>
          <button
            class="bg-danger/10 hover:bg-danger/20 border-none cursor-pointer text-xl p-1 rounded transition-all hover:scale-110 leading-none"
            onClick={() => onDelete(bill)}
            title="Delete bill"
          >
            🗑️
          </button>
        </div>
      </div>
      
      {/* Amount with color based on status */}
      <p class={`text-2xl font-bold my-2 ${
        status === 'overdue' ? 'text-danger' 
        : status === 'due-today' ? 'text-warning' 
        : 'text-primary'
      }`}>${bill.amount.toFixed(2)}</p>
      
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
        Last Paid: {bill.last_paid_date ? new Date(bill.last_paid_date).toLocaleDateString() : 'Never'}
      </p>
      {bill.category_id && (
        <p class="inline-block px-3 py-1 bg-bg-page rounded-full text-sm text-text-secondary mt-2">
          {categories.find((cat) => cat.id === bill.category_id)?.name || "Unknown Category"}
        </p>
      )}
      {bill.notes && <p class="text-text-muted text-sm italic mt-2 leading-snug">{bill.notes}</p>}
      <div class="flex items-center gap-2 mt-4 flex-wrap">
        <span class={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
          bill.is_paid 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {bill.is_paid ? "Paid" : "Unpaid"}
        </span>
        {bill.recurrence_type === "fixed_date" && (
          <span class="inline-block px-2 py-1 bg-secondary text-white rounded text-xs font-semibold">Monthly</span>
        )}
        {bill.recurrence_type === "interval" && (
          <span class="inline-block px-2 py-1 bg-secondary text-white rounded text-xs font-semibold">Interval</span>
        )}
        <button
          class={`px-4 py-2 rounded-md text-sm font-semibold cursor-pointer transition-all ml-auto ${
            bill.is_paid
              ? 'bg-success text-white border-2 border-success hover:bg-white hover:text-success'
              : 'bg-white text-success border-2 border-success hover:bg-success hover:text-white hover:-translate-y-px'
          }`}
          onClick={() => onMarkAsPaid(bill)}
          title="Record payment"
        >
          {bill.is_paid ? "✓ Paid" : "Record Payment"}
        </button>
      </div>
    </div>
  );
}
