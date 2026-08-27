import { useEffect, useState, useCallback } from 'react'
import { plumberJobs } from '../services/plumberApi'

export function usePlumberJobs() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [version, setVersion] = useState(0)

  const refresh = useCallback(() => setVersion((v) => v + 1), [])

  useEffect(() => {
    let cancelled = false
    plumberJobs()
      .then((rows) => !cancelled && setData(rows))
      .catch((e) => !cancelled && setError(e))
      .finally(() => !cancelled && setLoading(false))
    const t = setInterval(refresh, 30000)
    return () => { cancelled = true; clearInterval(t) }
  }, [version, refresh])

  return { data, loading, error, refresh }
}
