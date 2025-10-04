import Modal from "../Modal";
import { getDaySuffix } from "../../utils/helpers";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function BillFormModal({
  isOpen,
  editingBill,
  formData,
  categories,
  error,
  submitting,
  onSubmit,
  onCancel,
  onInputChange,
  onDateChange,
}) {
  return (
    <Modal
      isOpen={isOpen}
      title={editingBill ? "Edit Bill" : "Add New Bill"}
      onClose={onCancel}
      size="lg"
      showActions={false}
    >
      <form onSubmit={onSubmit} class="p-8">
        <div class="form-group">
          <label for="name" class="form-label">
            Bill Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={onInputChange}
            class="form-input"
            required
            placeholder="e.g., Electric Bill"
          />
        </div>

        <div class="form-group">
          <label for="amount" class="form-label">
            Amount *
          </label>
          <input
            type="number"
            id="amount"
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
          <label for="recurrence_type" class="form-label">
            Recurrence *
          </label>
          <div
            class="flex items-center flex-wrap gap-2 text-base"
            role="group"
            aria-labelledby="recurrence-label"
          >
            <span id="recurrence-label" class="text-text-primary font-medium">
              Due
            </span>
            <select
              id="recurrence_type"
              name="recurrence_type"
              value={formData.recurrence_type}
              onChange={onInputChange}
              class="inline-select"
              aria-label="Recurrence type"
              required
            >
              <option value="none">once</option>
              <option value="fixed_date">monthly</option>
              <option value="interval">every</option>
            </select>

            {formData.recurrence_type === "fixed_date" && (
              <>
                <span class="text-text-primary font-medium">on the</span>
                <input
                  type="number"
                  id="recurrence_days_fixed"
                  name="recurrence_days"
                  value={formData.recurrence_days}
                  onChange={onInputChange}
                  class="inline-number"
                  aria-label="Day of month (1-31)"
                  aria-describedby="day-suffix-fixed"
                  required
                  min="1"
                  max="31"
                  placeholder="15"
                />
                <span
                  id="day-suffix-fixed"
                  class="text-text-primary font-medium"
                >
                  {formData.recurrence_days
                    ? getDaySuffix(parseInt(formData.recurrence_days))
                    : "th"}{" "}
                  of the month
                </span>
              </>
            )}

            {formData.recurrence_type === "interval" && (
              <>
                <input
                  type="number"
                  id="recurrence_days_interval"
                  name="recurrence_days"
                  value={formData.recurrence_days}
                  onChange={onInputChange}
                  class="inline-number"
                  aria-label="Recurrence interval in days (1-365)"
                  aria-describedby="interval-suffix"
                  required
                  min="1"
                  max="365"
                  placeholder="14"
                />
                <span
                  id="interval-suffix"
                  class="text-text-primary font-medium"
                >
                  day{formData.recurrence_days !== "1" ? "s" : ""} starting on
                </span>
                <DatePicker
                  selected={formData.start_date}
                  onChange={onDateChange}
                  dateFormat="MM/dd/yyyy"
                  placeholderText="Select date"
                  className="inline-date-picker"
                  ariaLabelledBy="interval-start-label"
                  id="start_date_interval"
                  required
                />
                <span id="interval-start-label" class="sr-only">
                  Start date for interval recurrence
                </span>
              </>
            )}

            {formData.recurrence_type === "none" && (
              <>
                <span class="text-text-primary font-medium">on</span>
                <DatePicker
                  selected={formData.start_date}
                  onChange={onDateChange}
                  dateFormat="MM/dd/yyyy"
                  placeholderText="Select date"
                  className="inline-date-picker"
                  ariaLabelledBy="due-date-label"
                  id="start_date_once"
                  required
                />
                <span id="due-date-label" class="sr-only">
                  Due date for one-time bill
                </span>
              </>
            )}
          </div>
        </div>

        <div class="form-group">
          <label htmlFor="category_id" class="form-label">
            Category
          </label>
          <select
            id="category_id"
            name="category_id"
            value={formData.category_id}
            onChange={onInputChange}
            class="form-select"
          >
            <option value="">Select a category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div class="form-group">
          <label for="notes" class="form-label">
            Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={onInputChange}
            class="form-textarea"
            rows="3"
            placeholder="Add any notes about this bill..."
          />
        </div>

        {error && <div class="error-message">{error}</div>}

        <div class="flex gap-4 justify-end pt-6 mt-6 border-t border-border">
          <button type="button" class="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" class="btn btn-primary" disabled={submitting}>
            {submitting
              ? editingBill
                ? "Updating..."
                : "Adding..."
              : editingBill
              ? "Update Bill"
              : "Add Bill"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
