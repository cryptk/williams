import { useState, useEffect } from "preact/hooks";

import { getStats } from "../services/api";
import StatCard from "../components/StatCard";
import "./Dashboard.css";

export function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await getStats();
      setStats(data);
    } catch (error) {
      console.error("Failed to load stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div class="loading">Loading...</div>;
  }

  return (
    <div class="dashboard">
      <h2>Dashboard</h2>
      <div class="stats-grid">
        <StatCard title="Total Bills" value={stats?.total_bills || 0} />
        <StatCard
          title="Total Amount"
          value={`$${stats?.total_amount?.toFixed(2) || "0.00"}`}
        />
        <StatCard
          title="Amount Due"
          value={`$${stats?.due_amount?.toFixed(2) || "0.00"}`}
          highlight={stats?.due_amount > 0}
        />
        <StatCard title="Paid Bills" value={stats?.paid_bills || 0} />
        <StatCard title="Unpaid Bills" value={stats?.unpaid_bills || 0} />
      </div>
    </div>
  );
}
