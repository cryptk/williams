export default function CategoryCard({ category, onDelete }) {
  return (
    <div
      class="card text-center relative"
      style={{ borderTop: `4px solid ${category.color || "#4a90e2"}` }}
    >
      <button
        class="absolute top-2 right-2 bg-danger-light hover:bg-danger hover:text-white border-none w-7 h-7 rounded-full text-2xl text-danger cursor-pointer flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all p-0 leading-none hover:scale-110"
        onClick={() => onDelete(category)}
        title="Delete category"
      >
        ×
      </button>
      <div
        class="w-12 h-12 rounded-full mx-auto mb-4 shadow-sm"
        style={{ backgroundColor: category.color || "#4a90e2" }}
      ></div>
      <h3 class="mb-2 text-lg font-semibold">{category.name}</h3>
      <p class="text-xs text-muted m-0">
        Created {new Date(category.created_at).toLocaleDateString()}
      </p>
    </div>
  );
}
