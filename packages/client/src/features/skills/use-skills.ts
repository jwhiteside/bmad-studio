import { useQuery } from '@tanstack/react-query'

import type { SkillListItem, Skill, CompiledSkillItem } from '@bmad-studio/shared'

export function useSkills() {
  return useQuery({
    queryKey: ['skills'],
    queryFn: async () => {
      const response = await fetch('/api/skills')
      if (!response.ok) throw new Error('Failed to fetch skills')
      return response.json() as Promise<SkillListItem[]>
    },
    staleTime: 30_000,
  })
}

export function useCompiledSkills() {
  return useQuery({
    queryKey: ['skills', 'compiled'],
    queryFn: async () => {
      const response = await fetch('/api/skills/compiled')
      if (!response.ok) throw new Error('Failed to fetch compiled skills')
      return response.json() as Promise<CompiledSkillItem[]>
    },
    staleTime: 30_000,
  })
}

export function useSkillDetail(id: string) {
  return useQuery({
    queryKey: ['skills', { id }],
    queryFn: async () => {
      const response = await fetch(`/api/skills/${id}`)
      if (!response.ok) throw new Error(`Failed to fetch skill ${id}`)
      return response.json() as Promise<Skill>
    },
    enabled: !!id,
  })
}
