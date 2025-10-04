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
      <p class="mb-6">
        What would you like to do for <strong>{billName}</strong>?
      </p>
      <div class="flex flex-col gap-3">
        <button
          class="btn btn-primary w-full"
          onClick={onRecordNextPayment}
          disabled={submitting || deleting}
        >
          {submitting ? "Recording..." : "Record Next Payment"}
        </button>
        <button
          class="btn btn-danger w-full"
          onClick={onDeleteLastPayment}
          disabled={submitting || deleting}
        >
          {deleting ? "Deleting..." : "Delete Last Payment"}
        </button>
      </div>
    </ConfirmationModal>
  );
}
