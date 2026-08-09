import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import AdminPanel from '../components/admin/AdminPanel'
import DispatchPanel from '../components/admin/dispatch/DispatchPanel'
import LoginForm from '../components/ui/LoginForm'
export default function AdminPage() {
  const { user, loading } = useAuth()
  const [area, setArea] = useState('dispatch')

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-slate-400">Loading...</div>
      </div>
    )
  }

  if (!user) return <LoginForm />

  const tabs = [
    { key: 'dispatch', label: 'Dispatch' },
    { key: 'cms', label: 'Site content' },
  ]

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text">
      <div className="sticky top-0 z-30 border-b border-brand-border bg-brand-surface/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-2">
          <div className="flex gap-1">
            {tabs.map((t) => (
              <button key={t.key} onClick={() => setArea(t.key)}
                className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${area === t.key ? 'bg-brand-accent text-brand-bg' : 'text-brand-text-secondary hover:bg-brand-surface-hover'}`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 py-6">
        {area === 'dispatch' ? <DispatchPanel /> : <AdminPanel />}
      </div>
    </div>
  )
}
