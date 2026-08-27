import { useEffect, useState } from 'react'
import { recommendedPlumbers } from '../services/dispatchApi'

export function useRecommendedPlumbers(bookingId) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!bookingId) { setData([]); return }
    let cancelled = false
    setLoading(true)
    recommendedPlumbers(bookingId)
      .then((rows) => { if (!cancelled) { setData(rows); setError(null) } })
      .catch((e) => !cancelled && setError(e))
      .finally(() => !cancelled && setLoading(false))
  }, [bookingId])

  return { data, loading, error }
}
