import { useState, useEffect } from 'preact/hooks';
import { getStats } from '../services/api';

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
      console.error('Failed to load stats:', error);
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
        <div class="stat-card">
          <h3>Total Bills</h3>
          <p class="stat-value">{stats?.total_bills || 0}</p>
        </div>
        <div class="stat-card">
          <h3>Total Amount</h3>
          <p class="stat-value">${stats?.total_amount?.toFixed(2) || '0.00'}</p>
        </div>
        <div class={`stat-card ${stats?.due_amount > 0 ? 'highlight' : ''}`}>
          <h3>Amount Due</h3>
          <p class="stat-value">${stats?.due_amount?.toFixed(2) || '0.00'}</p>
        </div>
        <div class="stat-card">
          <h3>Paid Bills</h3>
          <p class="stat-value">{stats?.paid_bills || 0}</p>
        </div>
        <div class="stat-card">
          <h3>Unpaid Bills</h3>
          <p class="stat-value">{stats?.unpaid_bills || 0}</p>
        </div>
      </div>
    </div>
  );
}
