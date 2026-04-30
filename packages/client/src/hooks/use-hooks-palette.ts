import { useCallback, useEffect, useRef, useState } from 'react'

import type { HookEntry, WorkflowHookSurface, WorkflowHooks } from '@bmad-studio/shared'

export type HooksPaletteState = {
  hooks: WorkflowHooks | null
  loading: boolean
  error: string | null
  toggleEntry: (surface: WorkflowHookSurface, index: number) => Promise<void>
  refetch: () => Promise<void>
}

const EMPTY_HOOKS: WorkflowHooks = {
  activationStepsPrepend: [],
  activationStepsAppend: [],
  onComplete: [],
}

/**
 * Hooks palette state for a single workflow.
 *
 * - Fetches GET /api/workflows/:id/hooks on mount and when workflowId changes.
 * - `toggleEntry` flips the `disabled` flag on a specific surface index and
 *   PUTs the updated entries array.
 * - Cancels in-flight requests via AbortController on unmount / id change.
 */
export function useHooksPalette(workflowId: string | null): HooksPaletteState {
  const [hooks, setHooks] = useState<WorkflowHooks | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const abortRef = useRef<AbortController | null>(null)

  const refetch = useCallback(async () => {
    if (!workflowId) {
      setHooks(null)
      setError(null)
      return
    }
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/workflows/${encodeURIComponent(workflowId)}/hooks`, {
        signal: ctrl.signal,
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = (await res.json()) as WorkflowHooks
      setHooks(json)
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
      setError(err instanceof Error ? err.message : 'Failed to load hooks')
      setHooks(null)
    } finally {
      if (!ctrl.signal.aborted) setLoading(false)
    }
  }, [workflowId])

  useEffect(() => {
    void refetch()
    return () => {
      abortRef.current?.abort()
    }
  }, [refetch])

  const toggleEntry = useCallback(
    async (surface: WorkflowHookSurface, index: number) => {
      if (!workflowId) return
      const current = hooks ?? EMPTY_HOOKS
      const surfaceEntries = current[surface] ?? []
      const updatedEntries: HookEntry[] = surfaceEntries.map((e, i) =>
        i === index ? { ...e, disabled: !e.disabled } : e,
      )

      // Optimistic update
      const optimistic: WorkflowHooks = { ...current, [surface]: updatedEntries }
      setHooks(optimistic)

      try {
        const res = await fetch(`/api/workflows/${encodeURIComponent(workflowId)}/hooks`, {
          method: 'PUT',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ surface, entries: updatedEntries }),
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        // Re-fetch authoritative state
        await refetch()
      } catch (err) {
        // Roll back on failure
        setHooks(current)
        setError(err instanceof Error ? err.message : 'Failed to update hook')
      }
    },
    [hooks, workflowId, refetch],
  )

  return { hooks, loading, error, toggleEntry, refetch }
}
