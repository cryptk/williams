import "./style.css";

export default function PaymentsTable({
  payments,
  formatDate,
  formatDateTime,
  onDeletePayment,
}) {
  return (
    <>
      <div class="payments-table-container">
        <table class="payments-table">
          <thead>
            <tr>
              <th>Payment Date</th>
              <th>Amount</th>
              <th>Notes</th>
              <th>Recorded On</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => (
              <tr key={payment.id}>
                <td>{formatDate(payment.payment_date)}</td>
                <td class="amount-cell">${payment.amount.toFixed(2)}</td>
                <td class="notes-cell">{payment.notes || "-"}</td>
                <td>{formatDateTime(payment.created_at)}</td>
                <td>
                  <button
                    class="action-btn delete-btn"
                    onClick={() => onDeletePayment(payment)}
                    title="Delete payment"
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {payments.length > 0 && (
        <div class="payments-summary">
          <div class="summary-item">
            <strong>Total Payments: </strong>$
            {payments.reduce((sum, p) => sum + p.amount, 0).toFixed(2)}
          </div>
          <div class="summary-item">
            <strong>Number of Payments: </strong>
            {payments.length}
          </div>
        </div>
      )}
    </>
  );
}
