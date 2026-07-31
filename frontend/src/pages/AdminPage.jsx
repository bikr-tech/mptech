import { useAuth } from '../context/AuthContext'
import AdminPanel from '../components/admin/AdminPanel'
import LoginForm from '../components/ui/LoginForm'

export default function AdminPage() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-slate-400">Loading...</div>
      </div>
    )
  }

  if (!user) return <LoginForm />

  return <AdminPanel />
}
