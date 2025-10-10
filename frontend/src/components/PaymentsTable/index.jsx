import { IconButton } from "../../uielements";

export default function PaymentsTable({
  payments,
  formatDate,
  formatDateTime,
  onDeletePayment,
}) {
  return (
    <>
      <div class="mb-6 overflow-x-auto">
        <table class="bg-bg-card w-full border-collapse overflow-hidden rounded-lg shadow-sm">
          <thead>
            <tr>
              <th class="bg-bg text-text-primary border-border border-b-2 px-4 py-4 text-left text-sm font-semibold tracking-wide uppercase">
                Payment Date
              </th>
              <th class="bg-bg text-text-primary border-border border-b-2 px-4 py-4 text-left text-sm font-semibold tracking-wide uppercase">
                Amount
              </th>
              <th class="bg-bg text-text-primary border-border border-b-2 px-4 py-4 text-left text-sm font-semibold tracking-wide uppercase">
                Notes
              </th>
              <th class="bg-bg text-text-primary border-border border-b-2 px-4 py-4 text-left text-sm font-semibold tracking-wide uppercase">
                Recorded On
              </th>
              <th class="bg-bg text-text-primary border-border border-b-2 px-4 py-4 text-left text-sm font-semibold tracking-wide uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment, index) => (
              <tr key={payment.id} class="transition-colors hover:bg-primary/5">
                <td
                  class={`text-text-primary px-4 py-4 ${
                    index !== payments.length - 1
                      ? "border-border border-b"
                      : ""
                  }`}
                >
                  {formatDate(payment.payment_date)}
                </td>
                <td
                  class={`px-4 py-4 font-semibold text-primary ${
                    index !== payments.length - 1
                      ? "border-border border-b"
                      : ""
                  }`}
                >
                  ${payment.amount.toFixed(2)}
                </td>
                <td
                  class={`text-text-secondary max-w-[200px] px-4 py-4 break-words italic ${
                    index !== payments.length - 1
                      ? "border-border border-b"
                      : ""
                  }`}
                >
                  {payment.notes || "-"}
                </td>
                <td
                  class={`text-text-primary px-4 py-4 ${
                    index !== payments.length - 1
                      ? "border-border border-b"
                      : ""
                  }`}
                >
                  {formatDateTime(payment.created_at)}
                </td>
                <td
                  class={`px-4 py-4 ${
                    index !== payments.length - 1
                      ? "border-border border-b"
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
        <div class="bg-bg grid grid-cols-1 gap-4 rounded-lg p-6 md:grid-cols-2">
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
