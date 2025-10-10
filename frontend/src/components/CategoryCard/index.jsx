export default function CategoryCard({ category, onDelete }) {
  return (
    <div class="group card relative text-center" style={{ borderTop: `4px solid ${category.color || '#4a90e2'}` }}>
      <button
        class="bg-danger-light text-danger hover:bg-danger absolute top-2 right-2 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border-none p-0 text-2xl leading-none opacity-0 transition-all group-hover:opacity-100 hover:scale-110 hover:text-white"
        onClick={() => onDelete(category)}
        title="Delete category"
      >
        &times;
      </button>
      <div
        class="mx-auto mb-4 h-12 w-12 rounded-full shadow-sm"
        style={{ backgroundColor: category.color || '#4a90e2' }}
      />
      <h3 class="mb-2 text-lg font-semibold">{category.name}</h3>
      <p class="text-muted m-0 text-xs">Created {new Date(category.created_at).toLocaleDateString()}</p>
    </div>
  )
}
