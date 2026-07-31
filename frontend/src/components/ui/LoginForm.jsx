import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'

export default function LoginForm() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="bg-slate-800 border border-slate-700 rounded-2xl p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-white mb-6 text-center">Admin Login</h1>
        {error && <p className="text-red-400 text-sm mb-4 text-center">{error}</p>}
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
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-brand-accent hover:bg-blue-600 text-white font-bold py-3 rounded-lg transition disabled:opacity-50"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </div>
  )
}
