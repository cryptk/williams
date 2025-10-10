export default function StatCard({ title, value, highlight = false }) {
  return (
    <div class={`card transition-transform ${highlight ? 'card-highlight-warning' : ''}`}>
      <h3 class="text-gray mb-2 text-sm tracking-wide uppercase">{title}</h3>
      <p class={`text-3xl font-bold ${highlight ? 'text-warning' : 'text-primary'}`}>{value}</p>
    </div>
  )
}
