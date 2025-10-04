import "./style.css";

export default function CategoryCard({ category, onDelete }) {
  return (
    <div
      class="category-card"
      style={{ borderTop: `4px solid ${category.color || "#4a90e2"}` }}
    >
      <button
        class="category-delete-btn"
        onClick={() => onDelete(category)}
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
  );
}
