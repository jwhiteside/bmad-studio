import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, Trash2, Save, BookOpen, Tag, ChevronDown, ChevronRight, FileText } from 'lucide-react'

import type { WikiPageListItem } from './use-wiki.js'
import {
  useWikiIndex,
  useWikiPage,
  useCreateWikiPage,
  useUpdateWikiPage,
  useDeleteWikiPage,
} from './use-wiki.js'
import { CodeMirrorEditor } from '../../shared/markdown-editor/CodeMirrorEditor.js'
import { useNotifications } from '../../layout/NotificationProvider.js'

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
  const [category, setCategory] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setBusy(true)
    const slug = await onCreate(title.trim(), category.trim())
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
            Category <span className="font-normal normal-case">(optional)</span>
          </label>
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)] rounded-md focus:outline-none focus:border-[var(--color-accent)]"
            placeholder="e.g. Planning, Implementation"
          />
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
}: {
  pages: WikiPageListItem[]
  categories: string[]
  selectedSlug: string | null
  onSelect: (slug: string) => void
  onNew: () => void
}) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())

  function toggleCategory(cat: string) {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })
  }

  const uncategorised = pages.filter((p) => !p.category)
  const grouped = categories.map((cat) => ({
    cat,
    items: pages.filter((p) => p.category === cat),
  }))

  function PageItem({ page }: { page: WikiPageListItem }) {
    const isActive = page.slug === selectedSlug
    return (
      <button
        onClick={() => onSelect(page.slug)}
        className={`w-full text-left flex items-start gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
          isActive
            ? 'bg-[var(--color-accent)]/10 text-[var(--color-accent)] font-bold'
            : 'text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-raised)]'
        }`}
      >
        <FileText size={14} className="shrink-0 mt-0.5" />
        <span className="truncate">{page.title}</span>
      </button>
    )
  }

  return (
    <div className="w-56 shrink-0 flex flex-col border-r border-[var(--color-border-subtle)] h-full overflow-y-auto">
      <div className="px-3 py-3 border-b border-[var(--color-border-subtle)]">
        <button
          onClick={onNew}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm font-bold rounded-md border border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-raised)] hover:border-[var(--color-accent)] transition-colors"
        >
          <Plus size={14} />
          New Page
        </button>
      </div>

      <div className="flex-1 px-2 py-2 space-y-0.5">
        {pages.length === 0 && (
          <p className="px-3 py-8 text-xs text-[var(--color-muted)] text-center">No pages yet</p>
        )}

        {/* Categorised groups */}
        {grouped.map(({ cat, items }) => (
          <div key={cat}>
            <button
              onClick={() => toggleCategory(cat)}
              className="w-full flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors"
            >
              {collapsed.has(cat) ? <ChevronRight size={11} /> : <ChevronDown size={11} />}
              <Tag size={11} />
              {cat}
            </button>
            {!collapsed.has(cat) && items.map((p) => <PageItem key={p.slug} page={p} />)}
          </div>
        ))}

        {/* Uncategorised */}
        {uncategorised.length > 0 && (
          <div>
            {categories.length > 0 && (
              <p className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
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
          {page.category && (
            <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)]">
              <Tag size={9} />
              {page.category}
            </span>
          )}
          <p className="text-xs text-[var(--color-muted)] mt-1 font-mono">
            {page.filePath.split('/').slice(-3).join('/')}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => void handleDelete()}
            disabled={deletePage.isPending}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border border-[var(--color-border-subtle)] text-[var(--color-muted)] hover:text-[var(--color-error)] hover:border-[var(--color-error)] disabled:opacity-50 transition-colors"
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
        <CodeMirrorEditor
          content={content}
          onChange={setContent}
          onSave={() => void handleSave()}
          language="markdown"
        />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-16 gap-4">
      <BookOpen size={48} className="text-[var(--color-muted)]" strokeWidth={1.5} />
      <div className="text-center">
        <p className="font-bold text-[var(--color-text)]">Your wiki is empty</p>
        <p className="text-sm text-[var(--color-muted)] mt-1">
          Consolidate planning artifacts and notes into wiki pages.
        </p>
      </div>
      <button
        onClick={onNew}
        className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-md bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] transition-colors"
      >
        <Plus size={14} />
        Create First Page
      </button>
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
      const categoryFrontmatter = category
        ? `---\ncategory: ${category}\n---\n\n`
        : ''
      const body = `${categoryFrontmatter}# ${title}\n`
      const page = await createPage.mutateAsync({ title, body })
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
      />

      {selectedSlug ? (
        <EditorPanel
          slug={selectedSlug}
          onDeleted={clearSlug}
        />
      ) : (
        <EmptyState onNew={() => setShowNew(true)} />
      )}

      {showNew && (
        <NewPageDialog
          onClose={() => setShowNew(false)}
          onCreate={handleCreate}
        />
      )}
    </div>
  )
}
