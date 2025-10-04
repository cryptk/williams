import "./style.css";

export default function EmptyState({ message, children }) {
  return (
    <div class="empty-state">
      {children || <p>{message}</p>}
    </div>
  );
}
