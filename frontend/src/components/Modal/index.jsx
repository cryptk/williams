import "./style.css";

export default function Modal({
  isOpen,
  title,
  onClose,
  children,
  size = "medium", // "small", "medium", "large"
  showActions = true,
  actions,
}) {
  if (!isOpen) return null;

  return (
    <div class="modal-overlay" onClick={onClose}>
      <div
        class={`modal ${size === "small" ? "modal-small" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div class="modal-header">
          <h3>{title}</h3>
          <button class="close-btn" onClick={onClose}>
            &times;
          </button>
        </div>

        <div class="modal-body">{children}</div>

        {showActions && actions && <div class="modal-actions">{actions}</div>}
      </div>
    </div>
  );
}
