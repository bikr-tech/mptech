import { useEffect, useState, useCallback } from 'react'
import { getBookings } from '../services/bookingApi'

/** Customer's own bookings, auto-refreshed every 30s while mounted. */
export function useBookings(status) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [version, setVersion] = useState(0)

  const refresh = useCallback(() => setVersion((v) => v + 1), [])

  useEffect(() => {
    let cancelled = false
    getBookings(status)
      .then((rows) => !cancelled && setData(rows))
      .catch((e) => !cancelled && setError(e))
      .finally(() => !cancelled && setLoading(false))
    const t = setInterval(refresh, 30000)
    return () => { cancelled = true; clearInterval(t) }
  }, [status, version, refresh])

  return { data, loading, error, refresh }
}
