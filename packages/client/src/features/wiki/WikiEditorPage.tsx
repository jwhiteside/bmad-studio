import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, Trash2, Save, BookOpen, Tag, ChevronDown, ChevronRight, FileText, Download, FileCode } from 'lucide-react'

import { WIKI_CATEGORIES } from '@bmad-studio/shared'
import type { WikiPageListItem } from './use-wiki.js'
import {
  useWikiIndex,
  useWikiPage,
  useCreateWikiPage,
  useUpdateWikiPage,
  useDeleteWikiPage,
  useGenerateClaudeMd,
} from './use-wiki.js'
import { WikiImportDialog } from './WikiImportDialog.js'
import { MarkdownEditor } from '../../shared/markdown-editor/MarkdownEditor.js'
import { useNotifications } from '../../layout/NotificationProvider.js'

// ---------------------------------------------------------------------------
// Category badge colours (shared with import dialog)
// ---------------------------------------------------------------------------

const CATEGORY_COLORS: Record<string, string> = {
  Foundation: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  Planning: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  Research: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  Design: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  Specs: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  Stories: 'bg-green-500/10 text-green-400 border-green-500/20',
  Retrospectives: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  Brainstorming: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  Changelogs: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
}

export function CategoryBadge({ category }: { category: string }) {
  const cls = CATEGORY_COLORS[category] ?? 'bg-[var(--color-accent)]/10 text-[var(--color-accent)] border-transparent'
  return (
    <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-bold rounded border ${cls}`}>
      <Tag size={8} />
      {category}
    </span>
  )
}

// ---------------------------------------------------------------------------
// New page dialog
// ---------------------------------------------------------------------------

function NewPageDialog({
  onClose,
  onCreate,
}: {
  onClose: () => void
  onCreate: (title: string, category: string) => Promise<string | null>
}) {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<string>('Foundation')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setBusy(true)
    const slug = await onCreate(title.trim(), category)
    setBusy(false)
    if (slug) onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <form
        className="bg-[var(--color-bg)] border border-[var(--color-border-subtle)] rounded-xl shadow-2xl p-6 w-96 space-y-4"
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => void handleSubmit(e)}
      >
        <h2 className="text-base font-extrabold">New Wiki Page</h2>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-muted)] mb-1">
            Title
          </label>
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)] rounded-md focus:outline-none focus:border-[var(--color-accent)]"
            placeholder="e.g. Architecture Decisions"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-muted)] mb-1">
            Category
          </label>
          <div className="relative">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 pr-8 text-sm bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)] rounded-md focus:outline-none focus:border-[var(--color-accent)] appearance-none cursor-pointer"
            >
              {WIKI_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <ChevronDown size={13} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-muted)]" />
          </div>
          <p className="text-[10px] text-[var(--color-muted)] mt-1.5">
            {category === 'Foundation' && 'PRD, Architecture — timeless reference docs'}
            {category === 'Planning' && 'Epics, roadmaps, and backlog planning'}
            {category === 'Research' && 'Spikes, investigations, and technical research'}
            {category === 'Design' && 'UX specs and design directions'}
            {category === 'Specs' && 'Per-feature tech specs and implementation notes'}
            {category === 'Stories' && 'Per-story implementation artifacts'}
            {category === 'Retrospectives' && 'Retros, readiness reports, and change proposals'}
            {category === 'Brainstorming' && 'Brainstorming sessions and free-form notes'}
            {category === 'Changelogs' && 'Cycle changelogs and release notes'}
          </p>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-sm rounded-md border border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-raised)] transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!title.trim() || busy}
            className="px-3 py-1.5 text-sm font-bold rounded-md bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] disabled:opacity-50 transition-colors"
          >
            {busy ? 'Creating…' : 'Create'}
          </button>
        </div>
      </form>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Pages sidebar
// ---------------------------------------------------------------------------

function PageSidebar({
  pages,
  categories,
  selectedSlug,
  onSelect,
  onNew,
  onImport,
}: {
  pages: WikiPageListItem[]
  categories: string[]
  selectedSlug: string | null
  onSelect: (slug: string) => void
  onNew: () => void
  onImport: () => void
}) {
  const { notify } = useNotifications()
  const generateSchema = useGenerateClaudeMd()
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())

  async function handleGenerateSchema() {
    try {
      await generateSchema.mutateAsync()
      notify('success', 'CLAUDE.md generated in _bmad-output/wiki/')
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Failed to generate schema')
    }
  }

  function toggleCategory(cat: string) {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })
  }

  // Order categories by the canonical list; any extra categories go at the end
  const orderedCategories = [
    ...WIKI_CATEGORIES.filter((c) => categories.includes(c)),
    ...categories.filter((c) => !WIKI_CATEGORIES.includes(c as never)),
  ]
  const uncategorised = pages.filter((p) => !p.category)
  const grouped = orderedCategories.map((cat) => ({
    cat,
    items: pages.filter((p) => p.category === cat),
  }))

  function PageItem({ page }: { page: WikiPageListItem }) {
    const isActive = page.slug === selectedSlug
    return (
      <button
        onClick={() => onSelect(page.slug)}
        className={`w-full text-left flex items-start gap-2 pl-6 pr-3 py-1.5 rounded-md text-sm transition-colors ${
          isActive
            ? 'bg-[var(--color-accent)]/10 text-[var(--color-accent)] font-bold'
            : 'text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-raised)]'
        }`}
      >
        <FileText size={13} className="shrink-0 mt-0.5" />
        <span className="truncate text-xs">{page.title}</span>
      </button>
    )
  }

  return (
    <div className="w-56 shrink-0 flex flex-col border-r border-[var(--color-border-subtle)] h-full overflow-hidden">
      <div className="px-3 py-3 border-b border-[var(--color-border-subtle)] space-y-2">
        <button
          onClick={onNew}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm font-bold rounded-md border border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-raised)] hover:border-[var(--color-accent)] transition-colors"
        >
          <Plus size={14} />
          New Page
        </button>
        <button
          onClick={onImport}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs rounded-md text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-raised)] transition-colors border border-dashed border-[var(--color-border-subtle)] hover:border-[var(--color-accent)]"
        >
          <Download size={12} />
          Import from outputs
        </button>
        <button
          onClick={() => void handleGenerateSchema()}
          disabled={generateSchema.isPending}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs rounded-md text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-raised)] transition-colors border border-dashed border-[var(--color-border-subtle)] hover:border-[var(--color-accent)] disabled:opacity-50"
        >
          <FileCode size={12} />
          {generateSchema.isPending ? 'Generating…' : 'Generate Schema'}
        </button>
      </div>

      <div className="flex-1 px-2 py-2 space-y-0.5 overflow-y-auto">
        {pages.length === 0 && (
          <p className="px-3 py-8 text-xs text-[var(--color-muted)] text-center leading-relaxed">
            No pages yet.<br />Create one or import from _bmad-output.
          </p>
        )}

        {grouped.map(({ cat, items }) =>
          items.length === 0 ? null : (
            <div key={cat}>
              <button
                onClick={() => toggleCategory(cat)}
                className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-bold text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors"
              >
                {collapsed.has(cat) ? <ChevronRight size={10} /> : <ChevronDown size={10} />}
                <CategoryBadge category={cat} />
                <span className="ml-auto text-[10px] opacity-60">{items.length}</span>
              </button>
              {!collapsed.has(cat) && items.map((p) => <PageItem key={p.slug} page={p} />)}
            </div>
          ),
        )}

        {uncategorised.length > 0 && (
          <div>
            {categories.length > 0 && (
              <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
                Uncategorised
              </p>
            )}
            {uncategorised.map((p) => <PageItem key={p.slug} page={p} />)}
          </div>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Editor panel
// ---------------------------------------------------------------------------

function EditorPanel({
  slug,
  onDeleted,
}: {
  slug: string
  onDeleted: () => void
}) {
  const { notify } = useNotifications()
  const { data: page, isLoading } = useWikiPage(slug)
  const updatePage = useUpdateWikiPage(slug)
  const deletePage = useDeleteWikiPage()

  const [content, setContent] = useState('')
  const loadedRef = useRef(false)

  useEffect(() => {
    loadedRef.current = false
    setContent('')
  }, [slug])

  useEffect(() => {
    if (page && !loadedRef.current) {
      setContent(page.body)
      loadedRef.current = true
    }
  }, [page])

  async function handleSave() {
    try {
      await updatePage.mutateAsync(content)
      notify('success', 'Page saved')
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Failed to save')
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete "${page?.title ?? slug}"? This cannot be undone.`)) return
    try {
      await deletePage.mutateAsync(slug)
      notify('success', 'Page deleted')
      onDeleted()
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Failed to delete')
    }
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="h-8 w-32 rounded bg-[var(--color-surface-raised)] animate-pulse" />
      </div>
    )
  }

  if (!page) return null

  return (
    <div className="flex-1 flex flex-col min-h-0 p-6">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h1 className="text-xl font-extrabold leading-tight">{page.title}</h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {page.category && <CategoryBadge category={page.category} />}
            {page.status && (
              <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-bold rounded border bg-[var(--color-surface-raised)] border-[var(--color-border-subtle)] text-[var(--color-muted)]">
                {page.status}
              </span>
            )}
            {page.entity_type && (
              <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-bold rounded border bg-[var(--color-surface-raised)] border-[var(--color-border-subtle)] text-[var(--color-muted)]">
                {page.entity_type}
              </span>
            )}
            <p className="text-[10px] text-[var(--color-muted)] font-mono">
              {page.filePath.split('/').slice(-3).join('/')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => void handleDelete()}
            disabled={deletePage.isPending}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border border-[var(--color-border-subtle)] text-[var(--color-muted)] hover:text-red-400 hover:border-red-400/50 disabled:opacity-50 transition-colors"
          >
            <Trash2 size={13} />
            Delete
          </button>
          <button
            onClick={() => void handleSave()}
            disabled={updatePage.isPending}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold rounded-md bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] disabled:opacity-50 transition-colors"
          >
            <Save size={13} />
            {updatePage.isPending ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
      <div className="flex-1 rounded-lg border border-[var(--color-border-subtle)] overflow-hidden">
        <MarkdownEditor
          content={content}
          filePath={`${page.slug}.md`}
          onChange={setContent}
          onSave={() => void handleSave()}
          defaultMode="preview"
          modes={['preview', 'edit']}
        />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyState({ onNew, onImport }: { onNew: () => void; onImport: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-16 gap-4">
      <BookOpen size={48} className="text-[var(--color-muted)]" strokeWidth={1.5} />
      <div className="text-center">
        <p className="font-bold text-[var(--color-text)]">Your wiki is empty</p>
        <p className="text-sm text-[var(--color-muted)] mt-1 max-w-xs">
          Consolidate BMAD planning artifacts and project notes into organised wiki pages.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={onImport}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-md border border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-raised)] hover:border-[var(--color-accent)] transition-colors"
        >
          <Download size={14} />
          Import from _bmad-output
        </button>
        <button
          onClick={onNew}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-md bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] transition-colors"
        >
          <Plus size={14} />
          New Page
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export function WikiEditorPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { notify } = useNotifications()
  const { data: index, isLoading } = useWikiIndex()
  const createPage = useCreateWikiPage()

  const [showNew, setShowNew] = useState(false)
  const [showImport, setShowImport] = useState(false)

  const selectedSlug = searchParams.get('slug')
  const pages = index?.pages ?? []
  const categories = index?.categories ?? []

  function selectSlug(slug: string) {
    setSearchParams({ slug }, { replace: true })
  }

  function clearSlug() {
    setSearchParams({}, { replace: true })
  }

  async function handleCreate(title: string, category: string): Promise<string | null> {
    try {
      const page = await createPage.mutateAsync({ title, category })
      selectSlug(page.slug)
      notify('success', `Created "${page.title}"`)
      return page.slug
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Failed to create page')
      return null
    }
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="h-8 w-32 rounded bg-[var(--color-surface-raised)] animate-pulse" />
      </div>
    )
  }

  return (
    <div className="h-full flex overflow-hidden -mx-6 -mt-4">
      <PageSidebar
        pages={pages}
        categories={categories}
        selectedSlug={selectedSlug}
        onSelect={selectSlug}
        onNew={() => setShowNew(true)}
        onImport={() => setShowImport(true)}
      />

      {selectedSlug ? (
        <EditorPanel slug={selectedSlug} onDeleted={clearSlug} />
      ) : (
        <EmptyState onNew={() => setShowNew(true)} onImport={() => setShowImport(true)} />
      )}

      {showNew && (
        <NewPageDialog onClose={() => setShowNew(false)} onCreate={handleCreate} />
      )}

      {showImport && (
        <WikiImportDialog
          onClose={() => setShowImport(false)}
          onImported={() => {
            // Select the first newly imported page if nothing is selected
            if (!selectedSlug) {
              void index // pages will refresh via invalidation
            }
          }}
        />
      )}
    </div>
  )
}
