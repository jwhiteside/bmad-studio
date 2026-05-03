import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export type AgentMenuEntry = {
  code: string
  description: string
  skill?: string
  prompt?: string
}

export type AgentCustomizeParsed = {
  name?: string
  title?: string
  icon?: string
  role?: string
  identity?: string
  communicationStyle?: string
  principles?: string
  persistentFacts?: string[]
  activationStepsPrepend?: string[]
  activationStepsAppend?: string[]
  menu?: AgentMenuEntry[]
}

export type AgentCustomizeResponse = {
  raw: string
  parsed: AgentCustomizeParsed
}

async function fetchAgentCustomize(id: string): Promise<AgentCustomizeResponse> {
  const response = await fetch(`/api/agents/${id}/customize`)
  if (response.status === 404) {
    // Not a v6.5 project — treat as unavailable (not an error)
    throw Object.assign(new Error('not-v65'), { isNotV65: true })
  }
  if (!response.ok) throw new Error(`Failed to fetch agent customize for ${id}`)
  return response.json() as Promise<AgentCustomizeResponse>
}

async function putAgentCustomize(id: string, raw: string): Promise<{ ok: boolean }> {
  const response = await fetch(`/api/agents/${id}/customize`, {
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

export function useAgentCustomize(id: string) {
  return useQuery({
    queryKey: ['agents', id, 'customize'],
    queryFn: () => fetchAgentCustomize(id),
    enabled: !!id,
    retry: (failureCount, error) => {
      // Don't retry for "not v6.5" errors
      if ((error as Error & { isNotV65?: boolean }).isNotV65) return false
      return failureCount < 2
    },
  })
}

export function useUpdateAgentCustomize(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (raw: string) => putAgentCustomize(id, raw),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['agents', id, 'customize'] })
    },
  })
}
