import { IconButton } from "../../uielements";

export default function PaymentsTable({
  payments,
  formatDate,
  formatDateTime,
  onDeletePayment,
}) {
  return (
    <>
      <div class="overflow-x-auto mb-6">
        <table class="w-full border-collapse bg-bg-card rounded-lg overflow-hidden shadow-sm">
          <thead>
            <tr>
              <th class="bg-bg px-4 py-4 text-left font-semibold text-text-primary border-b-2 border-border text-sm uppercase tracking-wide">
                Payment Date
              </th>
              <th class="bg-bg px-4 py-4 text-left font-semibold text-text-primary border-b-2 border-border text-sm uppercase tracking-wide">
                Amount
              </th>
              <th class="bg-bg px-4 py-4 text-left font-semibold text-text-primary border-b-2 border-border text-sm uppercase tracking-wide">
                Notes
              </th>
              <th class="bg-bg px-4 py-4 text-left font-semibold text-text-primary border-b-2 border-border text-sm uppercase tracking-wide">
                Recorded On
              </th>
              <th class="bg-bg px-4 py-4 text-left font-semibold text-text-primary border-b-2 border-border text-sm uppercase tracking-wide">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment, index) => (
              <tr key={payment.id} class="hover:bg-primary/5 transition-colors">
                <td
                  class={`px-4 py-4 text-text-primary ${
                    index !== payments.length - 1
                      ? "border-b border-border"
                      : ""
                  }`}
                >
                  {formatDate(payment.payment_date)}
                </td>
                <td
                  class={`px-4 py-4 text-primary font-semibold ${
                    index !== payments.length - 1
                      ? "border-b border-border"
                      : ""
                  }`}
                >
                  ${payment.amount.toFixed(2)}
                </td>
                <td
                  class={`px-4 py-4 text-text-secondary italic max-w-[200px] break-words ${
                    index !== payments.length - 1
                      ? "border-b border-border"
                      : ""
                  }`}
                >
                  {payment.notes || "-"}
                </td>
                <td
                  class={`px-4 py-4 text-text-primary ${
                    index !== payments.length - 1
                      ? "border-b border-border"
                      : ""
                  }`}
                >
                  {formatDateTime(payment.created_at)}
                </td>
                <td
                  class={`px-4 py-4 ${
                    index !== payments.length - 1
                      ? "border-b border-border"
                      : ""
                  }`}
                >
                  <IconButton
                    variant="danger"
                    onClick={() => onDeletePayment(payment)}
                    title="Delete payment"
                  >
                    🗑️
                  </IconButton>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {payments.length > 0 && (
        <div class="bg-bg p-6 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="text-text-primary">
            <strong>Total Payments: </strong>$
            {payments.reduce((sum, p) => sum + p.amount, 0).toFixed(2)}
          </div>
          <div class="text-text-primary">
            <strong>Number of Payments: </strong>
            {payments.length}
          </div>
        </div>
      )}
    </>
  );
}
