export default function StatCard({ title, value, highlight = false }) {
  return (
    <div className={`card p-8 transition-transform ${
      highlight 
        ? "bg-gradient-to-br from-yellow-50 to-white border-l-4 border-primary" 
        : ""
    }`}>
      <h3 class="text-sm text-text-secondary uppercase tracking-wide mb-2">{title}</h3>
      <p className={`text-3xl font-bold ${
        highlight ? "text-warning" : "text-primary"
      }`}>{value}</p>
    </div>
  );
}
