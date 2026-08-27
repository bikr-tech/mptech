import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Spinner from './ui/Spinner'

/** Gate a route by role. `roles` missing → any authenticated user passes. */
export default function ProtectedRoute({ roles, children }) {
  const { user, role, loading } = useAuth()
  const location = useLocation()

  if (loading) return <Spinner />
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />

  if (roles && !roles.includes(role)) {
    // Plumber & customer are distinct; admin may act as either.
    if (role === 'admin') return children
    return <Navigate to={role === 'plumber' ? '/plumber' : '/'} replace />
  }
  return children
}
