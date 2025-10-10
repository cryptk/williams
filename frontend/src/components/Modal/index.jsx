export default function Modal({
  isOpen,
  title,
  onClose,
  children,
  size = "lg", // "sm", "md", "lg", "xl"
  showActions = true,
  actions,
}) {
  if (!isOpen) return null;

  // Determine max-width based on size
  const sizeClasses = {
    sm: "max-w-md", // 448px
    md: "max-w-xl", // 576px
    lg: "max-w-2xl", // 672px
    xl: "max-w-4xl", // 896px
  };

  return (
    <div
      class="fixed inset-0 z-[1000] flex animate-[fadeIn_0.2s_ease-out] items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        class={`w-full rounded-lg bg-white shadow-lg ${sizeClasses[size]} max-h-[90vh] animate-[slideUp_0.3s_ease-out] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div class="flex items-center justify-between rounded-t-lg border-b border-secondary bg-white p-6">
          <h3 class="m-0 text-xl font-semibold text-primary">{title}</h3>
          <button
            class="text-text-muted hover:text-text-primary flex h-8 w-8 cursor-pointer items-center justify-center rounded border-none bg-transparent p-0 text-2xl transition-all hover:bg-black/5"
            onClick={onClose}
          >
            &times;
          </button>
        </div>

        {/* Modal Body */}
        <div>{children}</div>

        {/* Modal Actions */}
        {showActions && actions && (
          <div class="flex justify-end gap-4 border-t border-secondary p-6 pt-4">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
