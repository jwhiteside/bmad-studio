import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import type { WikiPage, WikiPageListItem, WikiIndex } from '@bmad-studio/shared'

// ---------------------------------------------------------------------------
// Fetchers
// ---------------------------------------------------------------------------

async function fetchWikiIndex(): Promise<WikiIndex> {
  const res = await fetch('/api/wiki')
  if (!res.ok) throw new Error('Failed to fetch wiki index')
  return res.json() as Promise<WikiIndex>
}

async function fetchWikiPage(slug: string): Promise<WikiPage> {
  const res = await fetch(`/api/wiki/${encodeURIComponent(slug)}`)
  if (!res.ok) throw new Error(`Failed to fetch wiki page: ${slug}`)
  return res.json() as Promise<WikiPage>
}

async function createWikiPage(params: { title: string; body?: string }): Promise<WikiPage> {
  const res = await fetch('/api/wiki', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: { message?: string } }
    throw new Error(data.error?.message ?? 'Failed to create wiki page')
  }
  return res.json() as Promise<WikiPage>
}

async function updateWikiPage(slug: string, body: string): Promise<WikiPage> {
  const res = await fetch(`/api/wiki/${encodeURIComponent(slug)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ body }),
  })
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: { message?: string } }
    throw new Error(data.error?.message ?? 'Failed to save wiki page')
  }
  return res.json() as Promise<WikiPage>
}

async function deleteWikiPage(slug: string): Promise<void> {
  const res = await fetch(`/api/wiki/${encodeURIComponent(slug)}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`Failed to delete wiki page: ${slug}`)
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export function useWikiIndex() {
  return useQuery({
    queryKey: ['wiki'],
    queryFn: fetchWikiIndex,
    staleTime: 15_000,
  })
}

export function useWikiPage(slug: string | null) {
  return useQuery({
    queryKey: ['wiki', slug],
    queryFn: () => fetchWikiPage(slug!),
    enabled: !!slug,
  })
}

export function useCreateWikiPage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createWikiPage,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['wiki'] }),
  })
}

export function useUpdateWikiPage(slug: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: string) => updateWikiPage(slug, body),
    onSuccess: (page) => {
      qc.setQueryData(['wiki', slug], page)
      void qc.invalidateQueries({ queryKey: ['wiki'] })
    },
  })
}

export function useDeleteWikiPage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteWikiPage,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['wiki'] }),
  })
}

// Re-export types so callers don't need to import from shared
export type { WikiPage, WikiPageListItem, WikiIndex }
