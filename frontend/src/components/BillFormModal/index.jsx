import "./style.css";
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
      showActions={false}
    >
      <form onSubmit={onSubmit}>
          <div class="form-group">
            <label for="name">Bill Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={onInputChange}
              required
              placeholder="e.g., Electric Bill"
            />
          </div>

          <div class="form-group">
            <label for="amount">Amount *</label>
            <input
              type="number"
              id="amount"
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
            <label for="recurrence_type">Recurrence *</label>
            <div
              class="recurrence-sentence"
              role="group"
              aria-labelledby="recurrence-label"
            >
              <span id="recurrence-label" class="sentence-text">
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
                  <span class="sentence-text">on the</span>
                  <input
                    type="number"
                    id="recurrence_days_fixed"
                    name="recurrence_days"
                    value={formData.recurrence_days}
                    onChange={onInputChange}
                    class="inline-number-input"
                    aria-label="Day of month (1-31)"
                    aria-describedby="day-suffix-fixed"
                    required
                    min="1"
                    max="31"
                    placeholder="15"
                  />
                  <span id="day-suffix-fixed" class="sentence-text">
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
                    class="inline-number-input"
                    aria-label="Recurrence interval in days (1-365)"
                    aria-describedby="interval-suffix"
                    required
                    min="1"
                    max="365"
                    placeholder="14"
                  />
                  <span id="interval-suffix" class="sentence-text">
                    day{formData.recurrence_days !== "1" ? "s" : ""} starting
                    on
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
                  <span id="interval-start-label" class="visually-hidden">
                    Start date for interval recurrence
                  </span>
                </>
              )}

              {formData.recurrence_type === "none" && (
                <>
                  <span class="sentence-text">on</span>
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
                  <span id="due-date-label" class="visually-hidden">
                    Due date for one-time bill
                  </span>
                </>
              )}
            </div>
          </div>

          <div class="form-group">
            <label htmlFor="category_id">Category</label>
            <select
              id="category_id"
              name="category_id"
              value={formData.category_id}
              onChange={onInputChange}
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
            <label for="notes">Notes</label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={onInputChange}
              rows="3"
              placeholder="Add any notes about this bill..."
            />
          </div>

          {error && <div class="error-message">{error}</div>}

          <div class="modal-actions">
            <button type="button" class="btn btn-secondary" onClick={onCancel}>
              Cancel
            </button>
            <button
              type="submit"
              class="btn btn-primary"
              disabled={submitting}
            >
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
