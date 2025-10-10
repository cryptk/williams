import { IconButton } from '../../uielements'

export default function PaymentsTable({ payments, formatDate, formatDateTime, onDeletePayment }) {
  return (
    <>
      <div class="mb-6 overflow-x-auto">
        <table class="w-full border-collapse overflow-hidden shadow-sm">
          <thead>
            <tr>
              <th class="text-gray border-secondary-dark border-b-2 px-4 py-4 text-left text-sm font-semibold tracking-wide uppercase">
                Payment Date
              </th>
              <th class="text-gray border-secondary-dark border-b-2 px-4 py-4 text-left text-sm font-semibold tracking-wide uppercase">
                Amount
              </th>
              <th class="text-gray border-secondary-dark border-b-2 px-4 py-4 text-left text-sm font-semibold tracking-wide uppercase">
                Notes
              </th>
              <th class="text-gray border-secondary-dark border-b-2 px-4 py-4 text-left text-sm font-semibold tracking-wide uppercase">
                Recorded On
              </th>
              <th class="text-gray border-secondary-dark border-b-2 px-4 py-4 text-left text-sm font-semibold tracking-wide uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment, index) => (
              <tr key={payment.id} class="hover:bg-primary/5 border-secondary border-b transition-colors last:border-0">
                <td class={'text-gray px-4 py-4'}>{formatDate(payment.payment_date)}</td>
                <td class={'text-primary px-4 py-4 font-semibold'}>${payment.amount.toFixed(2)}</td>
                <td class={'text-gray max-w-[200px] px-4 py-4 break-words italic'}>{payment.notes || '-'}</td>
                <td class={'text-gray px-4 py-4'}>{formatDateTime(payment.created_at)}</td>
                <td class={`px-4 py-4 ${index !== payments.length - 1 ? 'border-secondary border-b' : ''}`}>
                  <IconButton variant="danger" onClick={() => onDeletePayment(payment)} title="Delete payment">
                    🗑️
                  </IconButton>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {payments.length > 0 && (
        <div class="flex justify-between p-6">
          <div>
            <strong>Total Payments: </strong>${payments.reduce((sum, p) => sum + p.amount, 0).toFixed(2)}
          </div>
          <div>
            <strong>Number of Payments: </strong>
            {payments.length}
          </div>
        </div>
      )}
    </>
  )
}
