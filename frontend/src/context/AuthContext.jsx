import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [role, setRole] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setUser(session.user)
      fetchRole(session?.user?.id)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (!session?.user) setRole(null)
      else fetchRole(session.user.id)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchRole(userId) {
    if (!userId) return
    const { data } = await supabase.from('profiles').select('role').eq('id', userId).single()
    if (data) setRole(data.role)
  }

  async function login(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  async function signUp(email, password, role = 'customer') {
    // Supabase trigger sets profiles.role='customer'; backend sets plumber
    // role + creates the plumbers row (pending) via service key.
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) {
      const msg = String(error.message || '').toLowerCase()
      if (msg.includes('rate limit') || msg.includes('too many')) {
        throw new Error('Too many signup attempts right now. Try again in a few minutes.')
      }
      if (msg.includes('already registered') || msg.includes('already been registered')) {
        throw new Error('An account with this email already exists. Sign in instead.')
      }
      if (msg.includes('invalid')) {
        throw new Error('That email address is not valid. Check for typos.')
      }
      throw error
    }
    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || '/api'}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role }),
    })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(text || 'Could not finish creating your account.')
    }
  }

  async function logout() {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, role, loading, login, signUp, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
