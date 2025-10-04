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
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-4 animate-[fadeIn_0.2s_ease-out]"
      onClick={onClose}
    >
      <div
        class={`bg-white rounded-lg shadow-lg w-full ${sizeClasses[size]} max-h-[90vh] overflow-y-auto animate-[slideUp_0.3s_ease-out]`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div class="flex justify-between items-center p-6 border-b border-border bg-bg rounded-t-lg">
          <h3 class="m-0 text-text-primary text-xl font-semibold">{title}</h3>
          <button
            class="bg-transparent border-none text-2xl cursor-pointer text-text-muted p-0 w-8 h-8 flex items-center justify-center rounded hover:bg-black/5 hover:text-text-primary transition-all"
            onClick={onClose}
          >
            &times;
          </button>
        </div>

        {/* Modal Body */}
        <div>{children}</div>

        {/* Modal Actions */}
        {showActions && actions && (
          <div class="flex gap-4 justify-end p-6 pt-4 border-t border-border">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
