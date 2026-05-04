import { useEffect, useState, useCallback } from 'react'
import {
  Plug, CheckCircle, Monitor, Plus, X,
  Copy, Loader2, AlertCircle,
} from 'lucide-react'

import { EmptyState } from '../../shared/EmptyState.js'
import { SlideOver } from '../../shared/SlideOver.js'
import { SkeletonCard } from '../../shared/Skeleton.js'

type AvailableIde = { id: string; label: string; description: string }

type IdeData = {
  configured: Array<{ ide: string; configuredDate: string | null; lastUpdated: string | null }>
  available: AvailableIde[]
}

type CoverageEntry = { module: string; synced: boolean; skillCount: number }

// --- Add IDE Dialog ---

function AddIdeDialog({ available, onClose, onAdded }: {
  available: AvailableIde[]
  onClose: () => void
  onAdded: (ide: string, skillsGenerated: Record<string, number>) => void
}) {
  const [selected, setSelected] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAdd = async () => {
    if (!selected) return
    setAdding(true)
    setError(null)
    try {
      const resp = await fetch('/api/ides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ide: selected }),
      })
      const data = (await resp.json()) as { ok?: boolean; skillsGenerated?: Record<string, number>; error?: { message?: string } }
      if (!resp.ok) throw new Error(data.error?.message ?? 'Failed to add IDE')
      onAdded(selected, data.skillsGenerated ?? {})
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add IDE')
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[var(--color-bg)] rounded-xl border border-[var(--color-border-subtle)] shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border-subtle)]">
          <div className="flex items-center gap-2">
            <Monitor size={18} className="text-[var(--color-accent)]" />
            <h2 className="text-lg font-bold">Add IDE</h2>
          </div>
          <button onClick={onClose} className="text-[var(--color-muted)] hover:text-[var(--color-text)]">
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-5 space-y-3">
          <p className="text-sm text-[var(--color-muted)]">Select an IDE to configure. Skills from installed modules will be generated automatically.</p>
          {available.length === 0 ? (
            <p className="text-sm text-[var(--color-muted)] text-center py-4">All supported IDEs are already configured.</p>
          ) : (
            available.map((ide) => (
              <button
                key={ide.id}
                onClick={() => setSelected(ide.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${
                  selected === ide.id
                    ? 'border-[var(--color-accent)] bg-[var(--color-surface-raised)]'
                    : 'border-[var(--color-border-subtle)] hover:border-[var(--color-accent)] hover:bg-[var(--color-surface-raised)]'
                }`}
              >
                <div className="w-8 h-8 rounded-md bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)] flex items-center justify-center shrink-0">
                  <Monitor size={16} className="text-[var(--color-accent)]" />
                </div>
                <div>
                  <p className="text-sm font-bold">{ide.label}</p>
                  <p className="text-xs text-[var(--color-muted)]">{ide.description}</p>
                </div>
              </button>
            ))
          )}
          {error && <p className="text-sm text-[var(--color-error)]">{error}</p>}
        </div>
        <div className="px-6 py-4 border-t border-[var(--color-border-subtle)] flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-md border border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-raised)] transition-colors">Cancel</button>
          <button
            onClick={handleAdd}
            disabled={!selected || adding}
            className="px-4 py-2 text-sm font-bold rounded-md bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            {adding ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            {adding ? 'Adding...' : 'Add IDE'}
          </button>
        </div>
      </div>
    </div>
  )
}

// --- Main Page ---

export function ConnectionsPage() {
  const [loading, setLoading] = useState(true)
  const [selectedIde, setSelectedIde] = useState<string | null>(null)
  const [configContent, setConfigContent] = useState<string | null>(null)
  const [configLoading, setConfigLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [ideData, setIdeData] = useState<IdeData | null>(null)
  const [coverage, setCoverage] = useState<Record<string, CoverageEntry[]>>({})
  const [showAddIde, setShowAddIde] = useState(false)

  const loadIdeData = useCallback(async () => {
    try {
      const [idesResp, coverageResp] = await Promise.all([
        fetch('/api/ides'),
        fetch('/api/ides/coverage'),
      ])
      if (idesResp.ok) setIdeData(await idesResp.json() as IdeData)
      if (coverageResp.ok) setCoverage(await coverageResp.json() as Record<string, CoverageEntry[]>)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadIdeData()
  }, [loadIdeData])

  async function handleSelectIde(ide: string) {
    if (selectedIde === ide) {
      setSelectedIde(null)
      setConfigContent(null)
      return
    }
    setSelectedIde(ide)
    setConfigLoading(true)
    try {
      const resp = await fetch(`/api/files/_config/ides/${ide}.yaml`)
      if (resp.ok) {
        const data = (await resp.json()) as { content: string }
        setConfigContent(data.content)
      } else {
        setConfigContent(null)
      }
    } catch {
      setConfigContent(null)
    } finally {
      setConfigLoading(false)
    }
  }

  function handleCopyConfig() {
    if (!configContent) return
    navigator.clipboard.writeText(configContent).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-extrabold mb-8">IDE Connections</h1>
        <SkeletonCard count={3} />
      </div>
    )
  }

  const ides = ideData?.configured.map((c) => c.ide) ?? []

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-extrabold">IDE Connections</h1>
          <p className="text-sm text-[var(--color-muted)] mt-1">
            Configure which IDEs Studio generates skills for.
          </p>
        </div>
        {ideData && ideData.available.length > 0 && (
          <button
            onClick={() => setShowAddIde(true)}
            className="px-4 py-2 text-sm font-bold rounded-md bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] transition-colors flex items-center gap-1.5"
          >
            <Plus size={14} />
            Add IDE
          </button>
        )}
      </div>

      {/* IDE list */}
      {ides.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ides.map((ide) => (
            <button
              key={ide}
              onClick={() => handleSelectIde(ide)}
              className={`p-4 rounded-lg border text-left transition-all cursor-pointer hover:-translate-y-0.5 hover:shadow-md ${
                selectedIde === ide
                  ? 'bg-[var(--color-surface-raised)] border-[var(--color-accent)]'
                  : 'bg-[var(--color-surface-raised)] border-[var(--color-border-subtle)] hover:border-[var(--color-accent)]'
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-md bg-[var(--color-bg)] border border-[var(--color-border-subtle)] flex items-center justify-center">
                  <Monitor size={16} className="text-[var(--color-accent)]" />
                </div>
                <span className="font-bold text-sm">{ide}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[var(--color-success)]" />
                <span className="text-xs text-[var(--color-success)]">Configured</span>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Plug}
          title="No IDE connections configured"
          description="Configure IDE integrations to enable skill generation in your BMAD project."
          actions={ideData && ideData.available.length > 0 ? (
            <button
              onClick={() => setShowAddIde(true)}
              className="px-4 py-2 text-sm font-bold rounded-md bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] transition-colors flex items-center gap-1.5"
            >
              <Monitor size={14} />
              Add IDE Connection
            </button>
          ) : undefined}
        />
      )}

      {/* IDE Detail SlideOver */}
      {selectedIde && (
        <SlideOver
          open
          title={selectedIde}
          onClose={() => { setSelectedIde(null); setConfigContent(null) }}
        >
          <div>
            <h3 className="text-sm font-bold mb-2">Status</h3>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-[var(--color-surface-raised)]">
              <CheckCircle size={16} className="text-[var(--color-success)]" />
              <span className="text-sm">Connected and active</span>
            </div>
          </div>

          {/* Module skill coverage */}
          {coverage[selectedIde] && (
            <div>
              <h3 className="text-sm font-bold mb-2">Module Coverage</h3>
              <p className="text-xs text-[var(--color-muted)] mb-3">Which modules have skills synced to this IDE.</p>
              <div className="space-y-1.5">
                {coverage[selectedIde].length === 0 && (
                  <p className="text-xs text-[var(--color-muted)]">No modules installed.</p>
                )}
                {coverage[selectedIde].map((entry) => (
                  <div key={entry.module} className="flex items-center justify-between px-3 py-2 rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)]">
                    <div className="flex items-center gap-2">
                      {entry.synced
                        ? <CheckCircle size={13} className="text-[var(--color-success)] shrink-0" />
                        : <AlertCircle size={13} className="text-[var(--color-warning)] shrink-0" />}
                      <span className="text-sm font-[var(--font-mono)]">{entry.module}</span>
                    </div>
                    {entry.synced
                      ? <span className="text-xs text-[var(--color-success)]">{entry.skillCount} skill{entry.skillCount !== 1 ? 's' : ''}</span>
                      : <span className="text-xs text-[var(--color-warning)]">not synced</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {configLoading && (
            <div className="h-32 rounded-lg bg-[var(--color-surface-raised)] animate-pulse" />
          )}

          {configContent && !configLoading && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold">Configuration</h3>
                <button
                  onClick={handleCopyConfig}
                  className="flex items-center gap-1 text-xs text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors"
                >
                  {copied
                    ? <CheckCircle size={12} className="text-[var(--color-success)]" />
                    : <Copy size={12} />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <pre className="p-3 text-xs font-[var(--font-mono)] bg-[var(--color-surface-raised)] rounded-lg overflow-x-auto whitespace-pre-wrap max-h-64 overflow-y-auto">
                {configContent}
              </pre>
            </div>
          )}

          <div className="text-xs text-[var(--color-muted)]">
            <p>Config file: <code className="font-[var(--font-mono)]">_bmad/_config/ides/{selectedIde}.yaml</code></p>
          </div>
        </SlideOver>
      )}

      {showAddIde && ideData && (
        <AddIdeDialog
          available={ideData.available}
          onClose={() => setShowAddIde(false)}
          onAdded={(_ide, _skills) => {
            setShowAddIde(false)
            loadIdeData()
          }}
        />
      )}
    </div>
  )
}
