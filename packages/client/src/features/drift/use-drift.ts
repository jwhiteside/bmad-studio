import { useState, useEffect, useCallback } from 'react'

import type { DriftDetectedEvent } from '@bmad-studio/shared'
import { useV65WsEvent } from '../../hooks/use-ws-events.js'

export type DriftedFileEntry = {
  path: string
  absolutePath: string
  expectedHash: string
  actualHash: string | null
}

export type DriftState = {
  count: number
  files: DriftedFileEntry[]
  loading: boolean
}

export function useDrift(): DriftState & { refresh: () => void } {
  const [count, setCount] = useState(0)
  const [files, setFiles] = useState<DriftedFileEntry[]>([])
  const [loading, setLoading] = useState(true)

  const fetchDrift = useCallback(() => {
    fetch('/api/drift')
      .then((r) => {
        if (!r.ok) return null
        return r.json() as Promise<{ count: number; files: DriftedFileEntry[] }>
      })
      .then((data) => {
        if (data) {
          setCount(data.count)
          setFiles(data.files)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetchDrift()
  }, [fetchDrift])

  useV65WsEvent<DriftDetectedEvent>('drift:detected', (e) => {
    setCount(e.count)
    // Re-fetch file list on count change
    fetchDrift()
  })

  return { count, files, loading, refresh: fetchDrift }
}
