import Modal from "../Modal";
import { Button } from "../../uielements";

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
      size="md"
      showActions={false}
    >
      <form onSubmit={onSubmit} class="p-8">
        <div class="form-group">
          <label for="name" class="form-label">
            Category Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={onInputChange}
            class="form-input"
            required
            placeholder="e.g., Utilities, Entertainment"
            maxLength="50"
          />
        </div>

        <div class="form-group">
          <label class="form-label">Color</label>
          <div class="grid grid-cols-6 gap-4">
            {colorPalette.map((color) => (
              <button
                type="button"
                key={color}
                class={`w-16 h-16 rounded-md border-2 cursor-pointer transition-all hover:scale-110 flex items-center justify-center ${
                  formData.color === color
                    ? "border-primary ring-2 ring-primary/30"
                    : "border-transparent"
                }`}
                style={{ backgroundColor: color }}
                onClick={() => onColorSelect(color)}
                title={color}
              >
                {formData.color === color && (
                  <span class="text-white text-2xl font-bold">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div class="form-group">
          <label for="custom-color" class="form-label">
            Or choose custom color
          </label>
          <input
            type="color"
            id="custom-color"
            name="color"
            value={formData.color}
            onChange={onInputChange}
            class="form-input h-16 cursor-pointer"
          />
        </div>

        {error && <div class="error-message">{error}</div>}

        <div class="flex gap-4 justify-end pt-6 mt-6 border-t border-secondary">
          <Button variant="secondary" type="button" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={submitting}>
            {submitting ? "Adding..." : "Add Category"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
