import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

let _client = null

function getClient() {
  if (!_client) {
    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn('Supabase not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env')
      return null
    }
    _client = createClient(supabaseUrl, supabaseAnonKey)
  }
  return _client
}

function buildStub(path) {
  const msg = `Supabase not configured (VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY missing). Called: ${path}`
  console.warn(msg)
  const handler = {
    get(_, prop) { return buildStub(`${path}.${String(prop)}`) },
    apply() { throw new Error(msg) },
  }
  return new Proxy(() => {}, handler)
}

const handler = {
  get(_, prop) {
    const client = getClient()
    if (!client) return buildStub(`supabase.${String(prop)}`)
    return client[prop]
  }
}

export const supabase = new Proxy({}, handler)
