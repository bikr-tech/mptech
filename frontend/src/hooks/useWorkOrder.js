import { useEffect, useState, useCallback } from 'react'
import { getWorkOrder } from '../services/workOrderApi'

export function useWorkOrder(id) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [version, setVersion] = useState(0)

  const refresh = useCallback(() => setVersion((v) => v + 1), [])

  useEffect(() => {
    if (!id) { setData(null); setLoading(false); return }
    let cancelled = false
    setLoading(true)
    getWorkOrder(id)
      .then((wo) => { if (!cancelled) { setData(wo); setError(null) } })
      .catch((e) => !cancelled && setError(e))
      .finally(() => !cancelled && setLoading(false))
  }, [id, version])

  return { data, loading, error, refresh }
}
