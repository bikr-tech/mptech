import { useEffect, useState } from 'react'
import { adminPlumbers, verifyPlumber } from '../../../services/dispatchApi'
import Spinner from '../../ui/Spinner'
import { toast } from '../../ui/Toast'

const STATUS_STYLE = {
  available: 'bg-emerald-500/20 text-emerald-400',
  busy: 'bg-amber-500/20 text-amber-400',
  pending: 'bg-amber-500/20 text-amber-400',
  off_duty: 'bg-slate-500/20 text-slate-400',
  on_leave: 'bg-slate-500/20 text-slate-400',
}

const STATUS_ICON = {
  available: '🟢',
  busy: '🟡',
  pending: '⏳',
  off_duty: '⚪',
  on_leave: '🏖️',
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
      toast('Plumber verified', 'success')
      await load()
    } catch (e) {
      toast(e.message, 'error')
    }
  }

  if (loading) return <Spinner />
  if (!rows.length) return <p className="py-12 text-center text-sm text-brand-text-muted">No plumbers yet.</p>

  return (
    <div className="space-y-3">
      {rows.map((p) => (
        <div key={p.id} className="rounded-xl border border-brand-border bg-brand-surface p-4 transition hover:border-brand-accent hover:bg-brand-surface/50">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-brand-accent/10 flex items-center justify-center text-2xl">
                {STATUS_ICON[p.status] || '👷'}
              </div>
              <div>
                <p className="font-semibold text-brand-text">{p.name}</p>
                <p className="text-xs text-brand-text-muted flex items-center gap-1">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_STYLE[p.status] || 'bg-brand-surface text-brand-text-secondary'}`}>
                    {p.status}
                  </span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-brand-text-secondary flex-wrap">
              <span className="flex items-center gap-1">★ {p.rating != null ? p.rating.toFixed(1) : '—'}</span>
              <span className="flex items-center gap-1">🛠️ {p.skills?.length || 0} skills</span>
              <span className="flex items-center gap-1">📋 {p.total_jobs ?? 0} jobs</span>
            </div>
            <div className="flex items-center gap-2 ml-auto">
              {p.status === 'pending' && (
                <button onClick={() => verify(p.id)}
                  className="rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 text-xs font-semibold hover:bg-emerald-500/30 transition">
                  Verify
                </button>
              )}
            </div>
          </div>
          {(p.skills || []).length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {p.skills.map((s) => (
                <span key={s} className="rounded-full bg-brand-accent/10 px-2 py-0.5 text-xs text-brand-accent">{s}</span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
