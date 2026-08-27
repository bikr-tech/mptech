import { useRecommendedPlumbers } from '../../../hooks/useRecommendedPlumbers'
import Spinner from '../../ui/Spinner'

/** Ranked plumber suggestions (smart match). Admin picks one to assign. */
export default function PlumberRecommendationList({ bookingId, onPick }) {
  const { data, loading, error } = useRecommendedPlumbers(bookingId)

  if (loading) return <Spinner className="py-4" />
  if (error) return <p className="text-sm text-red-400">Could not load recommendations.</p>
  if (!data.length) return <p className="text-sm text-brand-text-muted">No available plumbers within reach.</p>

  return (
    <div className="space-y-2">
      {data.map((p) => (
        <button key={p.plumber_id} onClick={() => onPick?.(p)}
          className="w-full rounded-xl border border-brand-border bg-brand-surface p-3 text-left transition hover:border-brand-accent">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-brand-text">{p.name}</p>
            <p className="text-sm font-bold text-brand-accent">{p.score}<span className="text-xs text-brand-text-muted">/100</span></p>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-brand-text-muted">
            {p.distance_km != null && <span>{p.distance_km} km</span>}
            <span>★ {p.rating}</span>
            <span>skill {Math.round(p.skill_match * 100)}%</span>
            <span>{p.workload} active</span>
          </div>
          {p.reasons?.length > 0 && (
            <ul className="mt-1 flex flex-wrap gap-1">
              {p.reasons.map((r) => (
                <li key={r} className="rounded-full bg-brand-accent/10 px-2 py-0.5 text-[11px] text-brand-accent">✓ {r}</li>
              ))}
            </ul>
          )}
        </button>
      ))}
    </div>
  )
}
