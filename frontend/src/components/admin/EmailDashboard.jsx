import { useState, useEffect, useCallback } from 'react'
import { api } from '../../lib/api'
import Spinner from '../ui/Spinner'

const STATUS_COLORS = {
  queued: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
  sent: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
  failed: 'bg-red-500/10 border-red-500/20 text-red-400',
  skipped: 'bg-slate-500/10 border-slate-500/20 text-slate-400',
}

const QUEUE_STATUS_COLORS = {
  pending: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
  processing: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
  completed: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
  failed: 'bg-red-500/10 border-red-500/20 text-red-400',
  dead_letter: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
}

const NOTIFICATION_TYPES = [
  'booking_created',
  'booking_assigned',
  'plumber_job_assigned',
  'booking_scheduled',
  'booking_rescheduled',
  'plumber_accepted',
  'plumber_en_route',
  'plumber_arrived',
  'booking_completed',
  'additional_work_requested',
  'additional_work_approved',
  'additional_work_rejected',
]

const RECIPIENT_TYPES = ['customer', 'plumber', 'admin']
const STATUSES = ['queued', 'sent', 'failed', 'skipped']

function formatNumber(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
  return n.toString()
}

function formatDate(iso) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function EmailDashboard() {
  const [stats, setStats] = useState(null)
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Filters
  const [filters, setFilters] = useState({
    status: '',
    notification_type: '',
    recipient_type: '',
    search: '',
  })
  const [pagination, setPagination] = useState({ page: 0, limit: 50, total: 0 })

  // Actions
  const [actionLoading, setActionLoading] = useState({})

  const fetchStats = useCallback(async () => {
    try {
      const data = await api('/admin/email-notifications/stats')
      setStats(data)
    } catch (e) {
      console.error('Failed to fetch email stats:', e)
    }
  }, [])

  const fetchNotifications = useCallback(async (page = 0) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('limit', pagination.limit)
      params.set('offset', page * pagination.limit)
      if (filters.status) params.set('status', filters.status)
      if (filters.notification_type) params.set('notification_type', filters.notification_type)
      if (filters.recipient_type) params.set('recipient_type', filters.recipient_type)

      const data = await api(`/admin/email-notifications?${params.toString()}`)
      setNotifications(data || [])
      // Note: we don't have total count from API, would need separate count endpoint
    } catch (e) {
      setError(e.message || 'Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }, [filters, pagination.limit])

  const handleRequeueDeadLetter = async () => {
    setActionLoading(prev => ({ ...prev, requeue: true }))
    try {
      const result = await api('/admin/email-jobs/requeue-dead-letter', {
        method: 'POST',
        body: JSON.stringify({ max_jobs: 100 })
      })
      alert(`Requeued ${result.requeued} dead letter jobs`)
      fetchStats()
    } catch (e) {
      alert('Failed to requeue: ' + e.message)
    } finally {
      setActionLoading(prev => ({ ...prev, requeue: false }))
    }
  }

  const handleCleanup = async () => {
    setActionLoading(prev => ({ ...prev, cleanup: true }))
    try {
      const result = await api('/admin/email-jobs/cleanup', {
        method: 'POST',
        body: JSON.stringify({ retention_days: 30 })
      })
      alert(`Cleaned up ${result.deleted} old jobs`)
      fetchStats()
    } catch (e) {
      alert('Failed to cleanup: ' + e.message)
    } finally {
      setActionLoading(prev => ({ ...prev, cleanup: false }))
    }
  }

  useEffect(() => {
    fetchStats()
    fetchNotifications(0)
  }, [fetchStats, fetchNotifications])

  useEffect(() => {
    fetchNotifications(0)
  }, [filters, fetchNotifications])

  if (loading && !stats) return <Spinner className="mx-auto mt-8" />

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Email Notifications</h2>
          <p className="text-slate-400 text-sm">Monitor delivery, debug failures, manage queue</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRequeueDeadLetter}
            disabled={actionLoading.requeue}
            className="bg-amber-600 hover:bg-amber-500 text-white text-sm px-4 py-2 rounded-lg transition disabled:opacity-50"
          >
            {actionLoading.requeue ? 'Requeuing...' : '↻ Requeue Dead Letters'}
          </button>
          <button
            onClick={handleCleanup}
            disabled={actionLoading.cleanup}
            className="bg-slate-700 hover:bg-slate-600 text-white text-sm px-4 py-2 rounded-lg transition disabled:opacity-50"
          >
            {actionLoading.cleanup ? 'Cleaning...' : '🗑 Cleanup Old Jobs'}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        {/* Status Stats */}
        {['queued', 'sent', 'failed', 'skipped'].map(status => (
          <div key={status} className="rounded-xl border bg-brand-surface p-4 transition hover:border-brand-accent/30">
            <div className="flex items-center justify-between">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${STATUS_COLORS[status]}`}>
                {status === 'queued' && '⏳'}
                {status === 'sent' && '✓'}
                {status === 'failed' && '✗'}
                {status === 'skipped' && '⊘'}
              </div>
              <p className="text-3xl font-bold text-brand-text">{formatNumber(stats?.by_status?.[status] ?? 0)}</p>
            </div>
            <p className="mt-2 text-xs text-brand-text-muted capitalize">{status}</p>
          </div>
        ))}

        {/* Queue Stats */}
        {['pending', 'dead_letter'].map(qStatus => (
          <div key={qStatus} className="rounded-xl border bg-brand-surface p-4 transition hover:border-brand-accent/30">
            <div className="flex items-center justify-between">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${QUEUE_STATUS_COLORS[qStatus]}`}>
                {qStatus === 'pending' && '⏱'}
                {qStatus === 'dead_letter' && '☠'}
              </div>
              <p className="text-3xl font-bold text-brand-text">{formatNumber(stats?.queue?.[qStatus] ?? 0)}</p>
            </div>
            <p className="mt-2 text-xs text-brand-text-muted capitalize">{qStatus.replace('_', ' ')}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="rounded-xl border bg-brand-surface p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <select
            value={filters.status}
            onChange={e => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-brand-accent"
          >
            <option value="">All Statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>

          <select
            value={filters.notification_type}
            onChange={e => setFilters(prev => ({ ...prev, notification_type: e.target.value }))}
            className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-brand-accent"
          >
            <option value="">All Types</option>
            {NOTIFICATION_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
          </select>

          <select
            value={filters.recipient_type}
            onChange={e => setFilters(prev => ({ ...prev, recipient_type: e.target.value }))}
            className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-brand-accent"
          >
            <option value="">All Recipients</option>
            {RECIPIENT_TYPES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
          </select>

          <input
            type="text"
            placeholder="Search booking #, email..."
            value={filters.search}
            onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
            className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-brand-accent"
          />

          <div className="flex items-center gap-2 text-sm text-slate-400">
            <span>Page {pagination.page + 1}</span>
            <button
              onClick={() => setPagination(p => ({ ...p, page: Math.max(0, p.page - 1) }))}
              disabled={pagination.page === 0}
              className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded disabled:opacity-50"
            >
              Prev
            </button>
            <button
              onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
              disabled={notifications.length < pagination.limit}
              className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Notifications Table */}
      <div className="rounded-xl border bg-brand-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-800/50">
              <tr className="text-left text-xs text-slate-400 uppercase tracking-wider">
                <th className="p-3 font-medium">Booking</th>
                <th className="p-3 font-medium">Type</th>
                <th className="p-3 font-medium">Recipient</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium">Subject</th>
                <th className="p-3 font-medium">Created</th>
                <th className="p-3 font-medium">Provider</th>
                <th className="p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {notifications.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                    {loading ? 'Loading...' : 'No notifications found'}
                  </td>
                </tr>
              ) : (
                notifications.map(n => (
                  <tr key={n.id} className="hover:bg-slate-800/50">
                    <td className="p-3 font-mono text-brand-text-muted">
                      {n.booking_id?.slice(0, 8)}...
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-1 bg-slate-700 rounded text-xs text-slate-300">
                        {n.notification_type.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-brand-accent"></span>
                        <span className="capitalize">{n.recipient_type}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${STATUS_COLORS[n.status]}`}>
                        {n.status}
                      </span>
                    </td>
                    <td className="p-3 text-slate-300 max-w-xs truncate block" title={n.subject}>
                      {n.subject}
                    </td>
                    <td className="p-3 text-slate-400 font-mono text-xs">
                      {formatDate(n.created_at)}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-1 bg-slate-700 rounded text-xs text-slate-300 capitalize">
                        {n.provider}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        {n.status === 'failed' && (
                          <button
                            className="px-2 py-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded text-xs transition"
                            onClick={() => alert(`Error: ${n.error_message || 'Unknown error'}`)}
                          >
                            View Error
                          </button>
                        )}
                        {n.provider_message_id && (
                          <span className="px-2 py-1 bg-emerald-600/20 text-emerald-400 rounded text-xs">
                            ✓ {n.provider_message_id.slice(0, 12)}...
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Type Breakdown */}
      {stats?.by_type && (
        <details className="rounded-xl border bg-brand-surface p-4 group">
          <summary className="flex items-center justify-between cursor-pointer select-none">
            <span className="font-medium text-white">Notification Type Breakdown</span>
            <span className="text-slate-400 text-sm">▼</span>
          </summary>
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {Object.entries(stats.by_type)
              .filter(([, count]) => count > 0)
              .map(([type, count]) => (
                <div key={type} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                  <span className="text-sm text-slate-300">{type.replace(/_/g, ' ')}</span>
                  <span className="font-mono text-brand-text">{formatNumber(count)}</span>
                </div>
              ))}
          </div>
        </details>
      )}
    </div>
  )
}