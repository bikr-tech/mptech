import { useEffect, useState } from 'react'
import { adminPlumbers, verifyPlumber } from '../../../services/dispatchApi'
import Spinner from '../../ui/Spinner'
import { toast } from '../../ui/Toast'

const STATUS_STYLE = {
  available: 'bg-emerald-500/15 text-emerald-300',
  busy: 'bg-amber-500/15 text-amber-300',
  pending: 'bg-amber-500/15 text-amber-300',
  off_duty: 'bg-slate-500/15 text-slate-300',
  on_leave: 'bg-slate-500/15 text-slate-300',
}

/** Admin roster: list plumbers, verify pending ones. */
export default function PlumberRoster() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  async function load() {
    try {
      setRows(await adminPlumbers())
    } catch (e) {
      toast(e.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function verify(id) {
    try {
      await verifyPlumber(id)
      toast('Plumber verified')
      await load()
    } catch (e) {
      toast(e.message, 'error')
    }
  }

  if (loading) return <Spinner />
  if (!rows.length) return <p className="py-12 text-center text-sm text-brand-text-muted">No plumbers yet.</p>

  return (
    <div className="overflow-x-auto rounded-xl border border-brand-border">
      <table className="w-full text-left text-sm">
        <thead className="bg-brand-surface text-brand-text-muted">
          <tr>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Skills</th>
            <th className="px-4 py-3">Rating</th>
            <th className="px-4 py-3">Jobs</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.id} className="border-t border-brand-border">
              <td className="px-4 py-3 font-medium text-brand-text">{p.name}</td>
              <td className="px-4 py-3">
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLE[p.status] || 'bg-brand-surface text-brand-text-secondary'}`}>
                  {p.status}
                </span>
              </td>
              <td className="px-4 py-3 text-brand-text-secondary">{(p.skills || []).join(', ') || '—'}</td>
              <td className="px-4 py-3 text-brand-text-secondary">{p.rating != null ? p.rating.toFixed(1) : '—'}</td>
              <td className="px-4 py-3 text-brand-text-secondary">{p.total_jobs ?? 0}</td>
              <td className="px-4 py-3 text-right">
                {p.status === 'pending' && (
                  <button onClick={() => verify(p.id)}
                    className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-600">
                    Verify
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
