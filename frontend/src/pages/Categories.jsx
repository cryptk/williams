import { useState, useEffect } from "preact/hooks";
import { getCategories, createCategory, deleteCategory } from "../services/api";
import CategoryCard from "../components/CategoryCard";
import ConfirmationModal from "../components/ConfirmationModal";
import EmptyState from "../components/EmptyState";
import CategoryFormModal from "../components/CategoryFormModal";
import { toast } from "../components/Toast";

export function Categories() {
  // useToast removed, use react-toastify's toast directly
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
      toast.success("Category created successfully!");
    } catch (error) {
      setError(error.message || "Failed to create category");
      toast.error(error.message || "Failed to create category");
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
      toast.success("Category deleted successfully!");
    } catch (error) {
      console.error("Failed to delete category:", error);
      toast.error(
        "Failed to delete category. It may be in use by existing bills."
      );
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
      <div class="flex justify-between items-center mb-8">
        <h2 class="text-2xl font-bold text-text-primary m-0">Categories</h2>
        <button class="btn btn-primary" onClick={() => setShowModal(true)}>
          Add Category
        </button>
      </div>

      {categories.length === 0 ? (
        <EmptyState message="No categories yet. Add your first category to organize your bills!" />
      ) : (
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {categories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              onDelete={handleDeleteClick}
            />
          ))}
        </div>
      )}

      {/* Add Category Modal */}
      <CategoryFormModal
        isOpen={showModal}
        formData={formData}
        error={error}
        submitting={submitting}
        colorPalette={colorPalette}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        onInputChange={handleInputChange}
        onColorSelect={handleColorSelect}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && categoryToDelete && (
        <ConfirmationModal
          title="Delete Category"
          message="Are you sure you want to delete the category"
          itemName={categoryToDelete.name}
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
          isDeleting={deleting}
        />
      )}
    </div>
  );
}
