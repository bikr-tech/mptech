import { useEffect, useState } from 'react'

let _push = null

/** Push a toast from anywhere: toast('Saved') or toast({ message, tone:'error' }). */
export function toast(message, tone = 'info') {
  if (_push) _push(typeof message === 'string' ? { message, tone } : message)
}

export function ToastHost() {
  const [items, setItems] = useState([])

  useEffect(() => {
    _push = (item) => {
      const id = Math.random().toString(36).slice(2)
      setItems((prev) => [...prev, { id, ...item }])
      setTimeout(() => setItems((prev) => prev.filter((x) => x.id !== id)), 4000)
    }
    return () => { _push = null }
  }, [])

  const tones = {
    info: 'border-brand-accent text-brand-text',
    success: 'border-emerald-500/50 text-emerald-400',
    error: 'border-red-500/50 text-red-400',
  }

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-72 flex-col gap-2">
      {items.map((t) => (
        <div key={t.id} className={`pointer-events-auto rounded-xl border bg-brand-surface px-4 py-3 text-sm shadow-xl ${tones[t.tone] || tones.info}`}>
          {t.message}
        </div>
      ))}
    </div>
  )
}
