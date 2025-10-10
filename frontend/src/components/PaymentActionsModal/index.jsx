import ConfirmationModal from '../ConfirmationModal'
import { Button } from '../../uielements'

export default function PaymentActionsModal({
  isOpen,
  billName,
  submitting,
  deleting,
  onRecordNextPayment,
  onDeleteLastPayment,
  onCancel,
}) {
  if (!isOpen) return null

  return (
    <ConfirmationModal title="Payment Actions" onCancel={onCancel} hideActions={true}>
      <p class="mb-6">
        What would you like to do for <strong>{billName}</strong>?
      </p>
      <div class="flex flex-col gap-3">
        <Button variant="primary" extraClasses="w-full" onClick={onRecordNextPayment} disabled={submitting || deleting}>
          {submitting ? 'Recording...' : 'Record Next Payment'}
        </Button>
        <Button variant="danger" extraClasses="w-full" onClick={onDeleteLastPayment} disabled={submitting || deleting}>
          {deleting ? 'Deleting...' : 'Delete Last Payment'}
        </Button>
      </div>
    </ConfirmationModal>
  )
}
