import "./style.css";
import Modal from "../Modal";

export default function CategoryFormModal({
  isOpen,
  formData,
  error,
  submitting,
  colorPalette,
  onSubmit,
  onCancel,
  onInputChange,
  onColorSelect,
}) {
  return (
    <Modal
      isOpen={isOpen}
      title="Add New Category"
      onClose={onCancel}
      size="small"
      showActions={false}
    >
      <form onSubmit={onSubmit}>
        <div class="form-group">
          <label for="name">Category Name *</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={onInputChange}
            required
            placeholder="e.g., Utilities, Entertainment"
            maxLength="50"
          />
        </div>

        <div class="form-group">
          <label>Color</label>
          <div class="color-palette">
            {colorPalette.map((color) => (
              <button
                type="button"
                key={color}
                class={`color-option ${
                  formData.color === color ? "selected" : ""
                }`}
                style={{ backgroundColor: color }}
                onClick={() => onColorSelect(color)}
                title={color}
              >
                {formData.color === color && <span class="checkmark">✓</span>}
              </button>
            ))}
          </div>
        </div>

        <div class="form-group">
          <label for="custom-color">Or choose custom color</label>
          <input
            type="color"
            id="custom-color"
            name="color"
            value={formData.color}
            onChange={onInputChange}
          />
        </div>

        {error && <div class="error-message">{error}</div>}

        <div class="modal-actions">
          <button type="button" class="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" class="btn btn-primary" disabled={submitting}>
            {submitting ? "Adding..." : "Add Category"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
