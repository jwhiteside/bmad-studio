import { useState, useCallback } from 'react'

type CustomizeData = {
  base: string
  team: string | null
  user: string | null
  merged: Record<string, unknown>
  provenance: Record<string, string>
}

type UseCustomizeResult = {
  data: CustomizeData | null
  loading: boolean
  error: string | null
  revert: () => Promise<void>
}

export function useCustomize(skillId: string | null): UseCustomizeResult {
  const [data, setData] = useState<CustomizeData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const revert = useCallback(async () => {
    if (!skillId) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/skills/${skillId}/customize`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = (await res.json()) as CustomizeData
      setData(json)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Revert failed')
    } finally {
      setLoading(false)
    }
  }, [skillId])

  return { data, loading, error, revert }
}
