import { useEffect, useState } from 'react'
import { getWorkOrder } from '../services/workOrderApi'

/** Tasks of a work order, sorted by position. */
export function useTasks(workOrderId) {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    if (!workOrderId) { setTasks([]); setLoading(false); return }
    let cancelled = false
    getWorkOrder(workOrderId)
      .then((wo) => !cancelled && setTasks((wo?.tasks || []).slice().sort((a, b) => a.position - b.position)))
      .catch((e) => !cancelled && setError(e))
      .finally(() => !cancelled && setLoading(false))
  }, [workOrderId, version])

  return { tasks, setTasks, loading, error, refresh: () => setVersion((v) => v + 1) }
}
