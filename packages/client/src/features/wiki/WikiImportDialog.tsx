import { useState, useMemo } from 'react'
import { CheckCircle2, Circle, Download, ChevronDown, ChevronRight, Loader2 } from 'lucide-react'

import { WIKI_CATEGORIES } from '@bmad-studio/shared'
import type { WikiImportPreviewItem, WikiCategory } from '@bmad-studio/shared'
import { useWikiImportPreview, useWikiImport } from './use-wiki.js'
import { useNotifications } from '../../layout/NotificationProvider.js'

// ---------------------------------------------------------------------------
// Category label colours
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

function CategoryBadge({ category }: { category: string }) {
  const cls = CATEGORY_COLORS[category] ?? 'bg-[var(--color-accent)]/10 text-[var(--color-accent)]'
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-bold rounded border ${cls}`}>
      {category}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Category group
// ---------------------------------------------------------------------------

function CategoryGroup({
  category,
  items,
  selected,
  onToggle,
  defaultExpanded,
}: {
  category: WikiCategory
  items: WikiImportPreviewItem[]
  selected: Set<string>
  onToggle: (relPath: string) => void
  defaultExpanded: boolean
}) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const newCount = items.filter((i) => !i.alreadyImported).length
  const selectedCount = items.filter((i) => selected.has(i.relPath)).length

  function toggleAll() {
    const eligible = items.filter((i) => !i.alreadyImported)
    const allSelected = eligible.every((i) => selected.has(i.relPath))
    for (const item of eligible) onToggle(item.relPath)
    // if all selected, we need to deselect — but onToggle toggles, so this works
    void allSelected
  }

  return (
    <div className="border border-[var(--color-border-subtle)] rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-2 px-3 py-2.5 bg-[var(--color-surface-raised)] hover:bg-[var(--color-surface-raised)]/80 transition-colors text-left"
      >
        {expanded ? (
          <ChevronDown size={13} className="text-[var(--color-muted)] shrink-0" />
        ) : (
          <ChevronRight size={13} className="text-[var(--color-muted)] shrink-0" />
        )}
        <CategoryBadge category={category} />
        <span className="text-sm font-bold flex-1">{category}</span>
        <span className="text-xs text-[var(--color-muted)]">
          {selectedCount > 0 ? `${selectedCount}/` : ''}{newCount} new · {items.length} total
        </span>
        {newCount > 0 && (
          <button
            onClick={(e) => { e.stopPropagation(); toggleAll() }}
            className="text-[10px] font-bold px-2 py-0.5 rounded border border-[var(--color-border-subtle)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors ml-1"
          >
            {selectedCount === newCount ? 'Deselect' : 'Select all'}
          </button>
        )}
      </button>

      {expanded && (
        <div className="divide-y divide-[var(--color-border-subtle)]">
          {items.map((item) => {
            const isSelected = selected.has(item.relPath)
            return (
              <button
                key={item.relPath}
                onClick={() => !item.alreadyImported && onToggle(item.relPath)}
                disabled={item.alreadyImported}
                className={`w-full flex items-start gap-3 px-3 py-2.5 text-left transition-colors ${
                  item.alreadyImported
                    ? 'opacity-50 cursor-default'
                    : isSelected
                    ? 'bg-[var(--color-accent)]/5 hover:bg-[var(--color-accent)]/10'
                    : 'hover:bg-[var(--color-surface-raised)]'
                }`}
              >
                {item.alreadyImported ? (
                  <CheckCircle2 size={15} className="text-[var(--color-accent)] shrink-0 mt-0.5" />
                ) : isSelected ? (
                  <CheckCircle2 size={15} className="text-[var(--color-accent)] shrink-0 mt-0.5" />
                ) : (
                  <Circle size={15} className="text-[var(--color-muted)] shrink-0 mt-0.5" />
                )}
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-bold truncate ${item.alreadyImported ? 'line-through' : ''}`}>
                    {item.title}
                  </p>
                  <p className="text-[10px] text-[var(--color-muted)] font-mono truncate mt-0.5">
                    {item.relPath}
                  </p>
                </div>
                {item.alreadyImported && (
                  <span className="text-[10px] text-[var(--color-muted)] shrink-0 mt-0.5">imported</span>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main dialog
// ---------------------------------------------------------------------------

export function WikiImportDialog({ onClose, onImported }: { onClose: () => void; onImported: () => void }) {
  const { notify } = useNotifications()
  const { data, isLoading } = useWikiImportPreview()
  const runImport = useWikiImport()
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const items = data?.items ?? []

  // Auto-select Foundation + Planning files that aren't already imported
  const hasAutoSelected = useState(false)
  useMemo(() => {
    if (items.length > 0 && !hasAutoSelected[0]) {
      hasAutoSelected[1](true)
      const autoSelect = items.filter(
        (i) => !i.alreadyImported && (i.category === 'Foundation' || i.category === 'Planning'),
      )
      setSelected(new Set(autoSelect.map((i) => i.relPath)))
    }
  }, [items, hasAutoSelected])

  // Group by category in defined order
  const grouped = useMemo(() => {
    const map = new Map<WikiCategory, WikiImportPreviewItem[]>()
    for (const cat of WIKI_CATEGORIES) map.set(cat, [])
    for (const item of items) {
      const arr = map.get(item.category as WikiCategory)
      if (arr) arr.push(item)
    }
    // Remove empty categories
    return Array.from(map.entries()).filter(([, arr]) => arr.length > 0)
  }, [items])

  function toggleItem(relPath: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(relPath)) next.delete(relPath)
      else next.add(relPath)
      return next
    })
  }

  async function handleImport() {
    if (selected.size === 0) return
    try {
      const result = await runImport.mutateAsync(Array.from(selected))
      notify('success', `Imported ${result.imported} page${result.imported !== 1 ? 's' : ''}${result.skipped > 0 ? ` (${result.skipped} skipped)` : ''}`)
      onImported()
      onClose()
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Import failed')
    }
  }

  const totalNew = items.filter((i) => !i.alreadyImported).length
  const totalImported = items.filter((i) => i.alreadyImported).length

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-[var(--color-bg)] border border-[var(--color-border-subtle)] rounded-xl shadow-2xl w-full max-w-2xl flex flex-col"
        style={{ maxHeight: '80vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-[var(--color-border-subtle)] shrink-0">
          <div className="flex items-center gap-2">
            <Download size={16} className="text-[var(--color-accent)]" />
            <h2 className="text-base font-extrabold">Import from _bmad-output</h2>
          </div>
          {!isLoading && (
            <p className="text-xs text-[var(--color-muted)] mt-1">
              {totalNew} new file{totalNew !== 1 ? 's' : ''} available
              {totalImported > 0 ? ` · ${totalImported} already imported` : ''}
              {' · '}{selected.size} selected
            </p>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 gap-2 text-[var(--color-muted)]">
              <Loader2 size={18} className="animate-spin" />
              <span className="text-sm">Scanning _bmad-output…</span>
            </div>
          ) : items.length === 0 ? (
            <p className="text-sm text-[var(--color-muted)] text-center py-12">
              No importable files found in _bmad-output.
            </p>
          ) : (
            grouped.map(([category, catItems]) => (
              <CategoryGroup
                key={category}
                category={category}
                items={catItems}
                selected={selected}
                onToggle={toggleItem}
                defaultExpanded={category === 'Foundation' || category === 'Planning'}
              />
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[var(--color-border-subtle)] flex items-center justify-between shrink-0">
          <button
            onClick={() => {
              const all = items.filter((i) => !i.alreadyImported).map((i) => i.relPath)
              setSelected(new Set(all))
            }}
            className="text-xs text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors"
          >
            Select all ({totalNew})
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-sm rounded-md border border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-raised)] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => void handleImport()}
              disabled={selected.size === 0 || runImport.isPending}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold rounded-md bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] disabled:opacity-50 transition-colors"
            >
              {runImport.isPending ? (
                <><Loader2 size={13} className="animate-spin" /> Importing…</>
              ) : (
                <><Download size={13} /> Import {selected.size} page{selected.size !== 1 ? 's' : ''}</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
