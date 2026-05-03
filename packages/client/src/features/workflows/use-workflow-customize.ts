import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export type WorkflowCustomizeParsed = {
  persistentFacts?: string[]
  activationStepsPrepend?: string[]
  activationStepsAppend?: string[]
  onComplete?: string
}

export type WorkflowCustomizeResponse = {
  raw: string
  parsed: WorkflowCustomizeParsed
}

async function fetchWorkflowCustomize(id: string): Promise<WorkflowCustomizeResponse> {
  const response = await fetch(`/api/workflows/${id}/customize`)
  if (response.status === 404) {
    // Not a v6.5 project — treat as unavailable (not an error)
    throw Object.assign(new Error('not-v65'), { isNotV65: true })
  }
  if (!response.ok) throw new Error(`Failed to fetch workflow customize for ${id}`)
  return response.json() as Promise<WorkflowCustomizeResponse>
}

async function putWorkflowCustomize(id: string, raw: string): Promise<{ ok: boolean }> {
  const response = await fetch(`/api/workflows/${id}/customize`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ raw }),
  })
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string }
    throw new Error(body.error ?? 'Failed to save customize.toml')
  }
  return response.json() as Promise<{ ok: boolean }>
}

export function useWorkflowCustomize(id: string) {
  return useQuery({
    queryKey: ['workflows', id, 'customize'],
    queryFn: () => fetchWorkflowCustomize(id),
    enabled: !!id,
    retry: (failureCount, error) => {
      // Don't retry for "not v6.5" errors
      if ((error as Error & { isNotV65?: boolean }).isNotV65) return false
      return failureCount < 2
    },
  })
}

export function useUpdateWorkflowCustomize(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (raw: string) => putWorkflowCustomize(id, raw),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['workflows', id, 'customize'] })
    },
  })
}
