import Modal from "../Modal";

export default function PaymentFormModal({
  isOpen,
  formData,
  error,
  submitting,
  onSubmit,
  onCancel,
  onInputChange,
}) {
  return (
    <Modal
      isOpen={isOpen}
      title="Add Payment"
      onClose={onCancel}
      showActions={false}
    >
      <form onSubmit={onSubmit}>
          <div class="form-group">
            <label for="payment-amount">Amount *</label>
            <input
              type="number"
              id="payment-amount"
              name="amount"
              value={formData.amount}
              onChange={onInputChange}
              required
              min="0"
              step="0.01"
              placeholder="0.00"
            />
          </div>

          <div class="form-group">
            <label for="payment-date">Payment Date *</label>
            <input
              type="date"
              id="payment-date"
              name="payment_date"
              value={formData.payment_date}
              onChange={onInputChange}
              required
            />
          </div>

          <div class="form-group">
            <label for="payment-notes">Notes</label>
            <textarea
              id="payment-notes"
              name="notes"
              value={formData.notes}
              onChange={onInputChange}
              rows="3"
              placeholder="Add any notes about this payment..."
            />
          </div>

          {error && <div class="error-message">{error}</div>}

          <div class="modal-actions">
            <button
              type="button"
              class="btn btn-secondary"
              onClick={onCancel}
            >
              Cancel
            </button>
            <button
              type="submit"
              class="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? "Adding..." : "Add Payment"}
            </button>
          </div>
        </form>
      </Modal>
    );
}
