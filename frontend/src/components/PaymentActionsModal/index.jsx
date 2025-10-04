import "./style.css";
import ConfirmationModal from "../ConfirmationModal";

export default function PaymentActionsModal({
  isOpen,
  billName,
  submitting,
  deleting,
  onRecordNextPayment,
  onDeleteLastPayment,
  onCancel,
}) {
  if (!isOpen) return null;

  return (
    <ConfirmationModal
      title="Payment Actions"
      onCancel={onCancel}
      hideActions={true}
    >
      <p>
        What would you like to do for <strong>{billName}</strong>?
      </p>
      <div class="payment-actions-buttons">
        <button
          class="btn btn-primary"
          onClick={onRecordNextPayment}
          disabled={submitting || deleting}
        >
          {submitting ? "Recording..." : "Record Next Payment"}
        </button>
        <button
          class="btn btn-danger"
          onClick={onDeleteLastPayment}
          disabled={submitting || deleting}
        >
          {deleting ? "Deleting..." : "Delete Last Payment"}
        </button>
      </div>
    </ConfirmationModal>
  );
}
