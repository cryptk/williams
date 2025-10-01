import { createContext } from "preact";
import { useContext, useState, useCallback } from "preact/hooks";

// Create Toast Context
const ToastContext = createContext();

// Toast types
export const TOAST_TYPES = {
  ERROR: "error",
  SUCCESS: "success",
  INFO: "info",
};

// Toast Provider Component
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = TOAST_TYPES.INFO, duration = 5000) => {
    const id = Date.now() + Math.random(); // Unique ID for each toast
    const toast = { id, message, type, duration };

    setToasts((prev) => [...prev, toast]);

    // Auto-remove toast after duration
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  // Helper methods for different toast types
  const showError = useCallback(
    (message, duration) => addToast(message, TOAST_TYPES.ERROR, duration),
    [addToast]
  );

  const showSuccess = useCallback(
    (message, duration) => addToast(message, TOAST_TYPES.SUCCESS, duration),
    [addToast]
  );

  const showInfo = useCallback(
    (message, duration) => addToast(message, TOAST_TYPES.INFO, duration),
    [addToast]
  );

  const value = {
    toasts,
    addToast,
    removeToast,
    showError,
    showSuccess,
    showInfo,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

// Hook to use toast
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

// Toast Container Component
function ToastContainer({ toasts, onRemove }) {
  return (
    <div class="toast-container">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => onRemove(toast.id)}
        />
      ))}
    </div>
  );
}

// Individual Toast Component
function Toast({ message, type, onClose }) {
  return (
    <div class={`toast toast-${type}`}>
      <div class="toast-icon">
        {type === TOAST_TYPES.ERROR && "❌"}
        {type === TOAST_TYPES.SUCCESS && "✅"}
        {type === TOAST_TYPES.INFO && "ℹ️"}
      </div>
      <div class="toast-message">{message}</div>
      <button class="toast-close" onClick={onClose} aria-label="Close">
        ×
      </button>
    </div>
  );
}
