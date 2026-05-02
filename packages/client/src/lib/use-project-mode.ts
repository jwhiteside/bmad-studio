import { useQuery } from '@tanstack/react-query'

type ProjectModeResponse = {
  version: 'v6' | 'v6.5'
  teamsReadOnly: boolean
}

export type ProjectMode = {
  version: 'v6' | 'v6.5'
  teamsReadOnly: boolean
  isV65: boolean
  isLoading: boolean
}

export function useProjectMode(): ProjectMode {
  const { data, isLoading } = useQuery<ProjectModeResponse>({
    queryKey: ['project-mode'],
    queryFn: async () => {
      const response = await fetch('/api/project/mode')
      if (!response.ok) throw new Error('Failed to fetch project mode')
      return response.json() as Promise<ProjectModeResponse>
    },
    staleTime: 60_000,
  })

  return {
    version: data?.version ?? 'v6',
    teamsReadOnly: data?.teamsReadOnly ?? false,
    isV65: data?.version === 'v6.5',
    isLoading,
  }
}
