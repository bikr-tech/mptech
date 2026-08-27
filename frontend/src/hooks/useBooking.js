import { useEffect, useState, useCallback } from 'react'
import { getBooking, getBookingTimeline } from '../services/bookingApi'

export function useBooking(id) {
  const [data, setData] = useState(null)
  const [timeline, setTimeline] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [version, setVersion] = useState(0)

  const refresh = useCallback(() => setVersion((v) => v + 1), [])

  useEffect(() => {
    if (!id) return
    let cancelled = false
    setLoading(true)
    Promise.all([getBooking(id), getBookingTimeline(id)])
      .then(([b, tl]) => {
        if (cancelled) return
        setData(b); setTimeline(tl); setError(null)
      })
      .catch((e) => !cancelled && setError(e))
      .finally(() => !cancelled && setLoading(false))
  }, [id, version])

  return { data, timeline, loading, error, refresh }
}
