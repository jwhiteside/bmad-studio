import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import type {
  WikiPage,
  WikiPageListItem,
  WikiIndex,
  WikiImportPreviewItem,
  WikiImportResult,
} from '@bmad-studio/shared'

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

async function createWikiPage(params: { title: string; body?: string; category?: string }): Promise<WikiPage> {
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

async function fetchImportPreview(): Promise<{ items: WikiImportPreviewItem[] }> {
  const res = await fetch('/api/wiki/import/preview')
  if (!res.ok) throw new Error('Failed to fetch import preview')
  return res.json() as Promise<{ items: WikiImportPreviewItem[] }>
}

async function runImport(relPaths: string[]): Promise<WikiImportResult> {
  const res = await fetch('/api/wiki/import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ relPaths }),
  })
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: { message?: string } }
    throw new Error(data.error?.message ?? 'Import failed')
  }
  return res.json() as Promise<WikiImportResult>
}

async function generateClaudeMd(): Promise<{ ok: true; filePath: string }> {
  const res = await fetch('/api/wiki/generate-claude-md', { method: 'POST' })
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: { message?: string } }
    throw new Error(data.error?.message ?? 'Failed to generate CLAUDE.md')
  }
  return res.json() as Promise<{ ok: true; filePath: string }>
}

async function generateIndex(): Promise<{ ok: true; filePath: string; pageCount: number }> {
  const res = await fetch('/api/wiki/generate-index', { method: 'POST' })
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: { message?: string } }
    throw new Error(data.error?.message ?? 'Failed to generate index')
  }
  return res.json() as Promise<{ ok: true; filePath: string; pageCount: number }>
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

export function useWikiImportPreview() {
  return useQuery({
    queryKey: ['wiki', 'import', 'preview'],
    queryFn: fetchImportPreview,
    staleTime: 0,
  })
}

export function useWikiImport() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: runImport,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['wiki'] })
      void qc.invalidateQueries({ queryKey: ['wiki', 'import', 'preview'] })
    },
  })
}

export function useGenerateClaudeMd() {
  return useMutation({ mutationFn: generateClaudeMd })
}

export function useGenerateIndex() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: generateIndex,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['wiki'] }),
  })
}

// Re-export types for convenience
export type { WikiPage, WikiPageListItem, WikiIndex, WikiImportPreviewItem, WikiImportResult }
