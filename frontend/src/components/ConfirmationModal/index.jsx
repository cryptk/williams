import Modal from "../Modal";

export default function ConfirmationModal({
  title,
  message,
  itemName,
  warningText = "This action cannot be undone.",
  onConfirm,
  onCancel,
  isDeleting = false,
  confirmButtonText = "Delete",
  confirmButtonClass = "btn-danger",
  hideActions = false,
  children,
}) {
  const actions = hideActions ? null : (
    <>
      <button type="button" class="btn btn-secondary" onClick={onCancel}>
        Cancel
      </button>
      <button
        type="button"
        class={`btn ${confirmButtonClass}`}
        onClick={onConfirm}
        disabled={isDeleting}
      >
        {isDeleting ? "Deleting..." : confirmButtonText}
      </button>
    </>
  );

  return (
    <Modal
      isOpen={true}
      title={title}
      onClose={onCancel}
      size="sm"
      showActions={!hideActions}
      actions={actions}
    >
      <div class="p-6">
        {children ? (
          children
        ) : (
          <>
            <p class="mb-4">
              {message} {itemName && <strong>{itemName}</strong>}
              {message && !message.endsWith("?") ? "?" : ""}
            </p>
            {warningText && (
              <p class="text-danger font-medium">{warningText}</p>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}
