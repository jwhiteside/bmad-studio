import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'

import type { WorkflowListItem, Workflow } from '@bmad-studio/shared'
import type { WebSocketEvent } from '@bmad-studio/shared'
import { useWebSocket } from '../../hooks/use-websocket.js'

export type WorkflowStatusResult = {
  status: 'ready' | 'blocked' | 'already-run' | 'unknown'
  inputs: Array<{
    id: string
    description: string
    required: boolean
    status: 'present' | 'missing' | 'thin'
    filePath?: string
    qualityNotes?: string[]
  }>
  outputs: Array<{
    id: string
    description: string
    files: Array<{ path: string; modifiedAt: string }>
  }>
  blockedReasons?: string[]
  downstream?: Array<{ id: string; name: string; module?: string; inputId: string }>
}

export function useWorkflows() {
  return useQuery({
    queryKey: ['workflows'],
    queryFn: async () => {
      const response = await fetch('/api/workflows')
      if (!response.ok) throw new Error('Failed to fetch workflows')
      return response.json() as Promise<WorkflowListItem[]>
    },
    staleTime: 30_000,
  })
}

export function useWorkflowDetail(id: string) {
  return useQuery({
    queryKey: ['workflows', { id }],
    queryFn: async () => {
      const response = await fetch(`/api/workflows/${id}`)
      if (!response.ok) throw new Error(`Failed to fetch workflow ${id}`)
      return response.json() as Promise<Workflow>
    },
    enabled: !!id,
  })
}

export function useWorkflowStatus(id: string) {
  return useQuery({
    queryKey: ['workflow-status', id],
    queryFn: async () => {
      const response = await fetch(`/api/workflows/${id}/status`)
      if (!response.ok) return null
      return response.json() as Promise<WorkflowStatusResult>
    },
    enabled: !!id,
    staleTime: 10_000,
  })
}

export function useWorkflowStatuses(ids: string[]) {
  return useQuery({
    queryKey: ['workflow-statuses', ids],
    queryFn: async () => {
      const results = await Promise.all(
        ids.map(async (id) => {
          try {
            const resp = await fetch(`/api/workflows/${id}/status`)
            const data = resp.ok ? (await resp.json() as WorkflowStatusResult) : null
            return [id, data] as [string, WorkflowStatusResult | null]
          } catch {
            return [id, null] as [string, null]
          }
        }),
      )
      return Object.fromEntries(results) as Record<string, WorkflowStatusResult | null>
    },
    enabled: ids.length > 0,
    staleTime: 10_000,
  })
}

export function useWorkflowStatusLiveRefresh(workflowIds: string[]) {
  const qc = useQueryClient()

  const handleEvent = useCallback((event: WebSocketEvent) => {
    if (
      event.type === 'file:changed' ||
      event.type === 'file:created' ||
      event.type === 'file:deleted' ||
      event.type === 'project:reloaded'
    ) {
      workflowIds.forEach((id) => {
        void qc.invalidateQueries({ queryKey: ['workflow-status', id] })
      })
    }
  }, [qc, workflowIds.join(',')])  // eslint-disable-line react-hooks/exhaustive-deps

  useWebSocket(handleEvent)
}
