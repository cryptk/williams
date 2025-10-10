import { useState, useEffect } from 'preact/hooks'

import { getStats } from '../services/api'
import StatCard from '../components/StatCard'

export function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const data = await getStats()
      setStats(data)
    } catch (error) {
      console.error('Failed to load stats:', error) // eslint-disable-line no-console -- We only allow console logging for debugging purposes
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div class="text-gray flex min-h-screen items-center justify-center text-xl">Loading...</div>
  }

  return (
    <div>
      <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Total Bills" value={stats?.total_bills || 0} />
        <StatCard title="Total Amount" value={`$${stats?.total_amount?.toFixed(2) || '0.00'}`} />
        <StatCard
          title="Amount Due"
          value={`$${stats?.due_amount?.toFixed(2) || '0.00'}`}
          highlight={stats?.due_amount > 0}
        />
        <StatCard title="Paid Bills" value={stats?.paid_bills || 0} />
        <StatCard title="Unpaid Bills" value={stats?.unpaid_bills || 0} />
      </div>
    </div>
  )
}
