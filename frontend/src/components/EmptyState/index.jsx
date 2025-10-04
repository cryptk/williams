export default function EmptyState({ message, children }) {
  return (
    <div class="text-center py-16 px-8 text-text-secondary">
      {children || <p>{message}</p>}
    </div>
  );
}
