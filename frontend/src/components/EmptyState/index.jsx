export default function EmptyState({ message, children }) {
  return <div class="text-secondary-dark px-8 py-16 text-center">{children || <p>{message}</p>}</div>
}
