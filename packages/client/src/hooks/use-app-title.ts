import { useEffect, useState } from 'react'

import { resolveAppTitle, DEFAULT_APP_TITLE } from '@bmad-studio/shared'
import type { StudioSettings } from '@bmad-studio/shared'

export function useAppTitle(): string {
  const [title, setTitle] = useState<string>(DEFAULT_APP_TITLE)

  useEffect(() => {
    let cancelled = false
    const controller = new AbortController()
    fetch('/api/settings', { cache: 'no-store', signal: controller.signal })
      .then((r) => (r.ok ? (r.json() as Promise<StudioSettings>) : null))
      .then((settings) => {
        if (cancelled) return
        setTitle(resolveAppTitle(settings))
      })
      .catch((err) => {
        // AbortError on unmount is intentional cleanup, not a failure.
        if (err?.name === 'AbortError') return
        // Network/parse failure — keep DEFAULT_APP_TITLE.
        // Surface to DevTools for diagnosis (the feature is silent in the UI by design).
        console.warn('[useAppTitle] failed to load /api/settings:', err)
      })
    return () => {
      cancelled = true
      controller.abort()
    }
  }, [])

  useEffect(() => {
    document.title = title
  }, [title])

  return title
}
