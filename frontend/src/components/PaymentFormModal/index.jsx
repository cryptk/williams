import Modal from "../Modal";
import { Button } from "../../uielements";

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
      size="lg"
      showActions={false}
    >
      <form onSubmit={onSubmit} class="p-8">
        <div class="form-group">
          <label for="payment-amount" class="form-label">
            Amount *
          </label>
          <input
            type="number"
            id="payment-amount"
            name="amount"
            value={formData.amount}
            onChange={onInputChange}
            class="form-input"
            required
            min="0"
            step="0.01"
            placeholder="0.00"
          />
        </div>

        <div class="form-group">
          <label for="payment-date" class="form-label">
            Payment Date *
          </label>
          <input
            type="date"
            id="payment-date"
            name="payment_date"
            value={formData.payment_date}
            onChange={onInputChange}
            class="form-input"
            required
          />
        </div>

        <div class="form-group">
          <label for="payment-notes" class="form-label">
            Notes
          </label>
          <textarea
            id="payment-notes"
            name="notes"
            value={formData.notes}
            onChange={onInputChange}
            class="form-input"
            rows="3"
            placeholder="Add any notes about this payment..."
          />
        </div>

        {error && <div class="error-message">{error}</div>}

        <div class="flex gap-4 justify-end pt-6 mt-6 border-t border-secondary">
          <Button variant="secondary" type="button" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={submitting}>
            {submitting ? "Adding..." : "Add Payment"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
