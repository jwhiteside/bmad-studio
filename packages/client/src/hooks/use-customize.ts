import { useState, useEffect } from 'react'

export type CustomizeData = {
  base: string
  team: string | null
  user: string | null
  merged: Record<string, unknown>
  provenance: Record<string, string>
}

export type UseCustomizeResult =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'not-customizable' }
  | { status: 'ok'; data: CustomizeData }

export function useCustomize(skillId: string | null): UseCustomizeResult {
  const [result, setResult] = useState<UseCustomizeResult>({ status: 'loading' })

  useEffect(() => {
    if (skillId === null) {
      setResult({ status: 'loading' })
      return
    }

    const controller = new AbortController()

    setResult({ status: 'loading' })

    fetch(`/api/skills/${skillId}/customize`, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) {
          if (res.status === 404) {
            const body = await res.json().catch(() => ({}))
            const code = (body as { error?: { code?: string } })?.error?.code
            if (code === 'NOT_FOUND' || code === 'skill-not-customizable') {
              setResult({ status: 'not-customizable' })
              return
            }
          }
          const body = await res.json().catch(() => ({}))
          const message =
            (body as { error?: { message?: string } })?.error?.message ??
            `Request failed with status ${res.status}`
          setResult({ status: 'error', message })
          return
        }

        const data = (await res.json()) as CustomizeData
        setResult({ status: 'ok', data })
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') return
        const message = err instanceof Error ? err.message : 'Unknown error'
        setResult({ status: 'error', message })
      })

    return () => {
      controller.abort()
    }
  }, [skillId])

  return result
}
