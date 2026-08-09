import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LoginForm from '../components/ui/LoginForm'

/** Shared login/signup for all roles. After auth resolves, redirect by role. */
export default function LoginPage() {
  const { user, role, loading } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const initialMode = params.get('mode') === 'signup' ? 'signup' : 'signin'

  useEffect(() => {
    // Wait for role to resolve — redirecting while role is null bounces
    // plumbers through /account (customer-only) back to the landing page.
    if (!loading && user && role) {
      const next = params.get('next')
      if (next) return navigate(next, { replace: true })
      const dest = role === 'admin' ? '/admin' : role === 'plumber' ? '/plumber' : '/account'
      navigate(dest, { replace: true })
    }
  }, [user, role, loading, navigate, params])

  return <LoginForm title="Sign in" initialMode={initialMode} />
}
