import { useQuery } from '@tanstack/react-query'

import type { TeamListItem, Team } from '@bmad-studio/shared'

export type ProjectMode = {
  version: 'v6' | 'v6.5'
  teamsReadOnly: boolean
}

export function useProjectMode() {
  return useQuery({
    queryKey: ['project', 'mode'],
    queryFn: async () => {
      const response = await fetch('/api/project/mode')
      if (!response.ok) return { version: 'v6', teamsReadOnly: false } as ProjectMode
      return response.json() as Promise<ProjectMode>
    },
    staleTime: 60_000,
  })
}

export function useTeams() {
  return useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const response = await fetch('/api/teams')
      if (!response.ok) throw new Error('Failed to fetch teams')
      return response.json() as Promise<TeamListItem[]>
    },
    staleTime: 30_000,
  })
}

export function useTeamDetail(id: string) {
  return useQuery({
    queryKey: ['teams', { id }],
    queryFn: async () => {
      const response = await fetch(`/api/teams/${id}`)
      if (!response.ok) throw new Error(`Failed to fetch team ${id}`)
      return response.json() as Promise<Team>
    },
    enabled: !!id,
  })
}

export function useTeamParty(id: string) {
  return useQuery({
    queryKey: ['teams', { id, include: 'party' }],
    queryFn: async () => {
      const response = await fetch(`/api/teams/${id}/party`)
      if (!response.ok) throw new Error(`Failed to fetch party CSV for ${id}`)
      return response.json() as Promise<{ content: string; path: string }>
    },
    enabled: !!id,
  })
}
