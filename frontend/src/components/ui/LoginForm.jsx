import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function LoginForm({ title = 'Admin Login', initialMode = 'signin' }) {
  const { login, signUp } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState(initialMode)
  const [role, setRole] = useState('customer')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)

  const isSignin = mode === 'signin'

  async function handleSubmit(e) {
    e.preventDefault()
    setError(''); setInfo('')
    setLoading(true)
    try {
      if (isSignin) {
        await login(email, password)
      } else {
        await signUp(email, password, role)
        setInfo(role === 'plumber'
          ? 'Plumber account created. Wait for admin verification before you can take jobs.'
          : 'Account created. You can sign in now.')
      }
    } catch (err) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="bg-slate-800 border border-slate-700 rounded-2xl p-8 w-full max-w-md">
        <Link
          to="/"
          onClick={(e) => { e.preventDefault(); navigate('/', { replace: true }); }}
          className="flex items-center gap-2 mb-6 text-brand-accent hover:text-blue-400 transition"
          aria-label="Go to homepage"
        >
          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <span className="text-xl font-bold text-white">MP Tech</span>
        </Link>
        <h1 className="text-2xl font-bold text-white mb-6 text-center">{title}</h1>
        {error && <p className="text-red-400 text-sm mb-4 text-center">{error}</p>}
        {info && <p className="text-emerald-400 text-sm mb-4 text-center">{info}</p>}

        {!isSignin && (
          <div className="mb-4 flex gap-2">
            {['customer', 'plumber'].map((r) => (
              <button key={r} type="button" onClick={() => setRole(r)}
                className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold capitalize ${role === r ? 'bg-brand-accent text-white' : 'bg-slate-700 text-slate-300'}`}>
                {r}
              </button>
            ))}
          </div>
        )}

        <div className="mb-4">
          <label className="block text-slate-300 text-sm mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-brand-accent"
            required
          />
        </div>
        <div className="mb-6">
          <label className="block text-slate-300 text-sm mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-brand-accent"
            required
            minLength={6}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-brand-accent hover:bg-blue-600 text-white font-bold py-3 rounded-lg transition disabled:opacity-50"
        >
          {loading ? (isSignin ? 'Signing in...' : 'Creating account...') : (isSignin ? 'Sign In' : 'Create account')}
        </button>

        <p className="text-center text-slate-400 text-sm mt-4">
          {isSignin ? (
            <>New here?{' '}
              <button type="button" onClick={() => setMode('signup')} className="text-brand-accent underline">Create an account</button>
            </>
          ) : (
            <>Already have an account?{' '}
              <button type="button" onClick={() => setMode('signin')} className="text-brand-accent underline">Sign in</button>
            </>
          )}
        </p>
      </form>
    </div>
  )
}
