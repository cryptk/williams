import "./style.css";

export default function StatCard({ title, value, highlight = false }) {
  return (
    <div className={`stat-card${highlight ? " highlight" : ""}`}>
      <h3>{title}</h3>
      <p className="stat-value">{value}</p>
    </div>
  );
}
