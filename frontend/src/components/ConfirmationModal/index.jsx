import Modal from "../Modal";
import Button from "../../uielements/Button";

export default function ConfirmationModal({
  title,
  message,
  itemName,
  warningText = "This action cannot be undone.",
  onConfirm,
  onCancel,
  isDeleting = false,
  confirmButtonText = "Delete",
  hideActions = false,
  children,
}) {
  const actions = hideActions ? null : (
    <>
      <Button variant="secondary" onClick={onCancel}>
        Cancel
      </Button>
      <Button variant="danger" onClick={onConfirm} disabled={isDeleting}>
        {isDeleting ? "Deleting..." : confirmButtonText}
      </Button>
    </>
  );

  return (
    <Modal isOpen={true} title={title} onClose={onCancel} size="sm" showActions={!hideActions} actions={actions}>
      <div class="p-6">
        {children ? (
          children
        ) : (
          <>
            <p class="mb-4">
              {message} {itemName && <strong>{itemName}</strong>}
              {message && !message.endsWith("?") ? "?" : ""}
            </p>
            {warningText && <p class="font-medium text-danger">{warningText}</p>}
          </>
        )}
      </div>
    </Modal>
  );
}
