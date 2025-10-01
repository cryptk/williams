import { useState, useEffect } from "preact/hooks";
import { getCategories, createCategory, deleteCategory } from "../services/api";
import { useToast } from "../components/Toast";

export function Categories() {
  const { showError, showSuccess } = useToast();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    color: "#4a90e2",
  });

  // Predefined color palette for categories
  const colorPalette = [
    "#4a90e2", // Blue
    "#50e3c2", // Teal
    "#f5a623", // Orange
    "#e74c3c", // Red
    "#9b59b6", // Purple
    "#2ecc71", // Green
    "#e91e63", // Pink
    "#ff9800", // Amber
    "#00bcd4", // Cyan
    "#795548", // Brown
    "#607d8b", // Blue Grey
    "#ff5722", // Deep Orange
  ];

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data.categories || []);
    } catch (error) {
      console.error("Failed to load categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleColorSelect = (color) => {
    setFormData((prev) => ({
      ...prev,
      color: color,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      // Validate form
      if (!formData.name.trim()) {
        setError("Category name is required");
        setSubmitting(false);
        return;
      }

      // Check for duplicate names
      if (
        categories.some(
          (cat) => cat.name.toLowerCase() === formData.name.trim().toLowerCase()
        )
      ) {
        setError("A category with this name already exists");
        setSubmitting(false);
        return;
      }

      // Prepare data for API
      const categoryData = {
        name: formData.name.trim(),
        color: formData.color,
      };

      await createCategory(categoryData);

      // Reset form and close modal
      setFormData({
        name: "",
        color: "#4a90e2",
      });
      setShowModal(false);

      // Reload categories
      await loadCategories();
      showSuccess("Category created successfully!");
    } catch (error) {
      setError(error.message || "Failed to create category");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    setShowModal(false);
    setError("");
    setFormData({
      name: "",
      color: "#4a90e2",
    });
  };

  const handleDeleteClick = (category) => {
    setCategoryToDelete(category);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!categoryToDelete) return;

    setDeleting(true);
    try {
      await deleteCategory(categoryToDelete.id);
      setShowDeleteConfirm(false);
      setCategoryToDelete(null);
      await loadCategories();
      showSuccess("Category deleted successfully!");
    } catch (error) {
      console.error("Failed to delete category:", error);
      showError("Failed to delete category. It may be in use by existing bills.");
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setCategoryToDelete(null);
  };

  if (loading) {
    return <div class="loading">Loading...</div>;
  }

  return (
    <div class="categories">
      <div class="page-header">
        <h2>Categories</h2>
        <button class="btn btn-primary" onClick={() => setShowModal(true)}>
          Add Category
        </button>
      </div>

      {categories.length === 0 ? (
        <div class="empty-state">
          <p>
            No categories yet. Add your first category to organize your bills!
          </p>
        </div>
      ) : (
        <div class="categories-grid">
          {categories.map((category) => (
            <div
              key={category.id}
              class="category-card"
              style={{ borderTop: `4px solid ${category.color || "#4a90e2"}` }}
            >
              <button
                class="category-delete-btn"
                onClick={() => handleDeleteClick(category)}
                title="Delete category"
              >
                ×
              </button>
              <div
                class="category-color"
                style={{ backgroundColor: category.color || "#4a90e2" }}
              ></div>
              <h3>{category.name}</h3>
              <p class="category-date">
                Created {new Date(category.created_at).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Add Category Modal */}
      {showModal && (
        <div class="modal-overlay" onClick={handleCancel}>
          <div class="modal modal-small" onClick={(e) => e.stopPropagation()}>
            <div class="modal-header">
              <h3>Add New Category</h3>
              <button class="close-btn" onClick={handleCancel}>
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div class="form-group">
                <label for="name">Category Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
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
                      onClick={() => handleColorSelect(color)}
                      title={color}
                    >
                      {formData.color === color && (
                        <span class="checkmark">✓</span>
                      )}
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
                  onChange={handleInputChange}
                />
              </div>

              {error && <div class="error-message">{error}</div>}

              <div class="modal-actions">
                <button
                  type="button"
                  class="btn btn-secondary"
                  onClick={handleCancel}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  class="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? "Adding..." : "Add Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && categoryToDelete && (
        <div class="modal-overlay" onClick={handleDeleteCancel}>
          <div
            class="modal modal-small confirm-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div class="modal-header">
              <h3>Delete Category</h3>
              <button class="close-btn" onClick={handleDeleteCancel}>
                &times;
              </button>
            </div>

            <div class="confirm-content">
              <p>
                Are you sure you want to delete the category{" "}
                <strong>{categoryToDelete.name}</strong>?
              </p>
              <p class="warning-text">This action cannot be undone.</p>
            </div>

            <div class="modal-actions">
              <button
                type="button"
                class="btn btn-secondary"
                onClick={handleDeleteCancel}
              >
                Cancel
              </button>
              <button
                type="button"
                class="btn btn-danger"
                onClick={handleDeleteConfirm}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
