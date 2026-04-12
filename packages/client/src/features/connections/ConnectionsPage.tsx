import { useEffect, useState, useCallback } from 'react'
import {
  Plug, CheckCircle, Monitor, Plus, X, Trash2,
  Play, Copy, Database, Globe, Figma, Github, FileText,
  Loader2, AlertCircle,
} from 'lucide-react'

import { EmptyState } from '../../shared/EmptyState.js'
import { SlideOver } from '../../shared/SlideOver.js'
import { SkeletonCard } from '../../shared/Skeleton.js'

type OverviewData = {
  detected: boolean
  sections: {
    ideConfigs?: { ides: string[]; count: number }
  }
}

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

type DataSourceType = 'jira' | 'confluence' | 'figma' | 'github' | 'custom'

type DataSource = {
  id: string
  name: string
  type: DataSourceType
  cliTool: string
  parameters: Record<string, string>
  outputPath: string
  lastSync?: string
  status: string
}

const DS_TYPE_ICONS: Record<DataSourceType, typeof Database> = {
  jira: FileText,
  confluence: Globe,
  figma: Figma,
  github: Github,
  custom: Database,
}

const DS_TYPE_LABELS: Record<DataSourceType, string> = {
  jira: 'Jira',
  confluence: 'Confluence',
  figma: 'Figma',
  github: 'GitHub',
  custom: 'Custom',
}

const DS_TYPE_DEFAULTS: Record<DataSourceType, { cliTool: string; parameters: Record<string, string>; outputPath: string }> = {
  jira: { cliTool: 'jira-cli', parameters: { project: '', board: '' }, outputPath: '_bmad-output/data/jira/' },
  confluence: { cliTool: 'confluence-cli', parameters: { space: '', label: '' }, outputPath: '_bmad-output/data/confluence/' },
  figma: { cliTool: 'figma-export', parameters: { fileKey: '', nodeId: '' }, outputPath: '_bmad-output/data/figma/' },
  github: { cliTool: 'gh', parameters: { repo: '', query: '' }, outputPath: '_bmad-output/data/github/' },
  custom: { cliTool: '', parameters: {}, outputPath: '_bmad-output/data/' },
}

const STATUS_COLORS: Record<string, string> = {
  configured: 'var(--color-accent)',
  synced: 'var(--color-success)',
  error: 'var(--color-error)',
  'not-configured': 'var(--color-muted)',
}

// --- Add Data Source Dialog ---

function AddDataSourceDialog({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: () => void
}) {
  const [step, setStep] = useState<'type' | 'form'>('type')
  const [selectedType, setSelectedType] = useState<DataSourceType | null>(null)
  const [name, setName] = useState('')
  const [cliTool, setCliTool] = useState('')
  const [parameters, setParameters] = useState<Record<string, string>>({})
  const [newParamKey, setNewParamKey] = useState('')
  const [outputPath, setOutputPath] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function selectType(type: DataSourceType) {
    setSelectedType(type)
    const defaults = DS_TYPE_DEFAULTS[type]
    setCliTool(defaults.cliTool)
    setParameters({ ...defaults.parameters })
    setOutputPath(defaults.outputPath)
    setStep('form')
  }

  const canSubmit = name.trim().length > 0 && cliTool.trim().length > 0

  const handleCreate = async () => {
    if (!canSubmit || !selectedType) return
    setSubmitting(true)
    setError(null)
    try {
      const resp = await fetch('/api/datasources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          type: selectedType,
          cliTool: cliTool.trim(),
          parameters,
          outputPath: outputPath.trim(),
        }),
      })
      if (!resp.ok) {
        const data = (await resp.json()) as { error?: { message?: string } }
        throw new Error(data.error?.message ?? 'Failed to create data source')
      }
      onCreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create data source')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-[var(--color-bg)] border border-[var(--color-border-subtle)] rounded-lg shadow-xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">
            {step === 'type' ? 'Add Data Source' : `New ${DS_TYPE_LABELS[selectedType!]} Source`}
          </h2>
          <button
            onClick={onClose}
            className="text-[var(--color-muted)] hover:text-[var(--color-text)]"
          >
            <X size={18} />
          </button>
        </div>

        {step === 'type' && (
          <div className="space-y-2">
            <p className="text-sm text-[var(--color-muted)] mb-4">Choose a data source type:</p>
            {(Object.keys(DS_TYPE_LABELS) as DataSourceType[]).map((type) => {
              const Icon = DS_TYPE_ICONS[type]
              return (
                <button
                  key={type}
                  onClick={() => selectType(type)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border border-[var(--color-border-subtle)] hover:border-[var(--color-accent)] hover:bg-[var(--color-surface-raised)] transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-md bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)] flex items-center justify-center">
                    <Icon size={16} className="text-[var(--color-accent)]" />
                  </div>
                  <div>
                    <span className="font-bold text-sm">{DS_TYPE_LABELS[type]}</span>
                    <p className="text-xs text-[var(--color-muted)]">
                      {type === 'jira' && 'Import issues and boards from Jira'}
                      {type === 'confluence' && 'Import pages and spaces from Confluence'}
                      {type === 'figma' && 'Export designs from Figma'}
                      {type === 'github' && 'Pull data from GitHub repositories'}
                      {type === 'custom' && 'Configure a custom CLI tool'}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {step === 'form' && selectedType && (
          <div className="space-y-4">
            <button
              onClick={() => setStep('type')}
              className="text-xs text-[var(--color-accent)] hover:underline"
            >
              &larr; Change type
            </button>

            <div>
              <label className="block text-sm font-bold mb-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. My Project Board"
                className="w-full px-3 py-2 text-sm rounded-md bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)] focus:border-[var(--color-accent)] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-1">CLI Tool</label>
              <input
                type="text"
                value={cliTool}
                onChange={(e) => setCliTool(e.target.value)}
                placeholder="e.g. jira-cli"
                className="w-full px-3 py-2 text-sm rounded-md bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)] focus:border-[var(--color-accent)] focus:outline-none"
              />
            </div>

            {Object.entries(parameters).map(([key, value]) => (
              <div key={key}>
                <label className="block text-sm font-bold mb-1 capitalize">{key}</label>
                <input
                  type="text"
                  value={value}
                  onChange={(e) => setParameters({ ...parameters, [key]: e.target.value })}
                  placeholder={`Enter ${key}...`}
                  className="w-full px-3 py-2 text-sm rounded-md bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)] focus:border-[var(--color-accent)] focus:outline-none"
                />
              </div>
            ))}

            {selectedType === 'custom' && (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newParamKey}
                  onChange={(e) => setNewParamKey(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newParamKey.trim()) {
                      setParameters({ ...parameters, [newParamKey.trim()]: '' })
                      setNewParamKey('')
                    }
                  }}
                  placeholder="Parameter name"
                  className="flex-1 px-2 py-1 text-xs rounded border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)] focus:border-[var(--color-accent)] focus:outline-none"
                />
                <button
                  onClick={() => {
                    if (newParamKey.trim()) {
                      setParameters({ ...parameters, [newParamKey.trim()]: '' })
                      setNewParamKey('')
                    }
                  }}
                  className="text-xs text-[var(--color-accent)] hover:underline shrink-0"
                >
                  + Add
                </button>
              </div>
            )}

            <div>
              <label className="block text-sm font-bold mb-1">Output Path</label>
              <input
                type="text"
                value={outputPath}
                onChange={(e) => setOutputPath(e.target.value)}
                placeholder="_bmad-output/data/"
                className="w-full px-3 py-2 text-sm rounded-md bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)] focus:border-[var(--color-accent)] focus:outline-none font-[var(--font-mono)] text-xs"
              />
            </div>

            {error && <p className="text-sm text-[var(--color-error)]">{error}</p>}

            <div className="flex justify-end gap-3 pt-4 border-t border-[var(--color-border-subtle)]">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm rounded-md border border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-raised)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!canSubmit || submitting}
                className="px-4 py-2 text-sm font-bold rounded-md bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                <Plus size={14} />
                {submitting ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// --- Sync Command Dialog ---

function SyncCommandDialog({
  command,
  sourceName,
  onClose,
}: {
  command: string
  sourceName: string
  onClose: () => void
}) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(command).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-[var(--color-bg)] border border-[var(--color-border-subtle)] rounded-lg shadow-xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Sync: {sourceName}</h2>
          <button
            onClick={onClose}
            className="text-[var(--color-muted)] hover:text-[var(--color-text)]"
          >
            <X size={18} />
          </button>
        </div>

        <p className="text-sm text-[var(--color-muted)] mb-3">
          Run this command in your terminal to sync data:
        </p>

        <div className="relative">
          <pre className="p-4 text-sm font-[var(--font-mono)] bg-[var(--color-surface-raised)] rounded-lg overflow-x-auto whitespace-pre-wrap border border-[var(--color-border-subtle)]">
            {command}
          </pre>
          <button
            onClick={handleCopy}
            className="absolute top-2 right-2 p-1.5 rounded-md bg-[var(--color-bg)] border border-[var(--color-border-subtle)] hover:border-[var(--color-accent)] transition-colors"
            title="Copy to clipboard"
          >
            {copied ? (
              <CheckCircle size={14} className="text-[var(--color-success)]" />
            ) : (
              <Copy size={14} className="text-[var(--color-muted)]" />
            )}
          </button>
        </div>

        <div className="flex justify-end mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-md border border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-raised)] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

// --- Main Page ---

export function ConnectionsPage() {
  const [data, setData] = useState<OverviewData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedIde, setSelectedIde] = useState<string | null>(null)
  const [configContent, setConfigContent] = useState<string | null>(null)
  const [configLoading, setConfigLoading] = useState(false)
  const [ideData, setIdeData] = useState<IdeData | null>(null)
  const [coverage, setCoverage] = useState<Record<string, CoverageEntry[]>>({})
  const [showAddIde, setShowAddIde] = useState(false)

  // Data sources state
  const [datasources, setDatasources] = useState<DataSource[]>([])
  const [dsLoading, setDsLoading] = useState(true)
  const [showAddDs, setShowAddDs] = useState(false)
  const [syncCommand, setSyncCommand] = useState<{ command: string; name: string } | null>(null)
  const [syncingId, setSyncingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const loadDatasources = useCallback(async () => {
    try {
      const resp = await fetch('/api/datasources')
      const data = (await resp.json()) as DataSource[]
      setDatasources(data)
    } catch {
      // ignore
    } finally {
      setDsLoading(false)
    }
  }, [])

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
    }
  }, [])

  useEffect(() => {
    fetch('/api/overview')
      .then((r) => r.json())
      .then((d) => {
        setData(d as OverviewData)
        setLoading(false)
      })
      .catch(() => setLoading(false))
    loadIdeData()
  }, [loadIdeData])

  useEffect(() => {
    loadDatasources()
  }, [loadDatasources])

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

  async function handleSync(ds: DataSource) {
    setSyncingId(ds.id)
    try {
      const resp = await fetch(`/api/datasources/${encodeURIComponent(ds.id)}/sync`, {
        method: 'POST',
      })
      if (resp.ok) {
        const data = (await resp.json()) as { command: string }
        setSyncCommand({ command: data.command, name: ds.name })
      }
    } catch {
      // ignore
    } finally {
      setSyncingId(null)
    }
  }

  async function handleDelete(ds: DataSource) {
    if (!confirm(`Delete data source "${ds.name}"?`)) return
    setDeletingId(ds.id)
    try {
      const resp = await fetch(`/api/datasources/${encodeURIComponent(ds.id)}`, {
        method: 'DELETE',
      })
      if (resp.ok) {
        await loadDatasources()
      }
    } catch {
      // ignore
    } finally {
      setDeletingId(null)
    }
  }

  if (loading && dsLoading) {
    return (
      <div>
        <h1 className="text-2xl font-extrabold mb-8">Connections</h1>
        <SkeletonCard count={3} />
      </div>
    )
  }

  const ides = ideData?.configured.map((c) => c.ide) ?? data?.sections?.ideConfigs?.ides ?? []
  const totalCount = ides.length + datasources.length

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-extrabold">
          Connections ({totalCount})
        </h1>
        <div className="flex items-center gap-3">
          {ideData && ideData.available.length > 0 && (
            <button
              onClick={() => setShowAddIde(true)}
              className="px-4 py-2 text-sm rounded-md border border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-raised)] transition-colors flex items-center gap-1.5"
            >
              <Monitor size={14} />
              Add IDE
            </button>
          )}
          <button
            onClick={() => setShowAddDs(true)}
            className="px-4 py-2 text-sm font-bold rounded-md bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] transition-colors flex items-center gap-1.5"
          >
            <Plus size={14} />
            Add Data Source
          </button>
        </div>
      </div>

      {/* Data Sources Section */}
      {datasources.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-bold text-[var(--color-muted)] uppercase tracking-wider mb-4">
            Data Sources ({datasources.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {datasources.map((ds) => {
              const Icon = DS_TYPE_ICONS[ds.type] ?? Database
              const statusColor = STATUS_COLORS[ds.status] ?? STATUS_COLORS['not-configured']
              return (
                <div
                  key={ds.id}
                  className="p-4 rounded-lg border bg-[var(--color-surface-raised)] border-[var(--color-border-subtle)] hover:border-[var(--color-accent)] transition-all"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-md bg-[var(--color-bg)] border border-[var(--color-border-subtle)] flex items-center justify-center">
                      <Icon size={16} className="text-[var(--color-accent)]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="font-bold text-sm block truncate">{ds.name}</span>
                      <span className="text-xs text-[var(--color-muted)]">{DS_TYPE_LABELS[ds.type]}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 mb-3">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: statusColor }}
                    />
                    <span className="text-xs capitalize" style={{ color: statusColor }}>
                      {ds.status}
                    </span>
                    {ds.lastSync && (
                      <span className="text-xs text-[var(--color-muted)] ml-auto">
                        Last sync: {new Date(ds.lastSync).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-[var(--color-muted)] mb-3 space-y-1">
                    <p className="font-[var(--font-mono)] truncate" title={ds.cliTool}>
                      Tool: {ds.cliTool || '(not set)'}
                    </p>
                    <p className="font-[var(--font-mono)] truncate" title={ds.outputPath}>
                      Output: {ds.outputPath}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSync(ds)}
                      disabled={syncingId === ds.id}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs rounded-md border border-[var(--color-accent)] text-[var(--color-accent)] hover:bg-[var(--color-accent)] hover:text-white transition-colors disabled:opacity-50"
                    >
                      {syncingId === ds.id ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <Play size={12} />
                      )}
                      Sync
                    </button>
                    <button
                      onClick={() => handleDelete(ds)}
                      disabled={deletingId === ds.id}
                      className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs rounded-md border border-[var(--color-error)] text-[var(--color-error)] hover:bg-[var(--color-error)] hover:text-white transition-colors disabled:opacity-50"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* IDE Connections Section */}
      {ides.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-bold text-[var(--color-muted)] uppercase tracking-wider mb-4">
            IDE Connections ({ides.length})
          </h2>
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
        </div>
      )}

      {/* Empty State */}
      {totalCount === 0 && (
        <EmptyState
          icon={Plug}
          title="No connections configured"
          description="Add data sources to sync external data, or configure IDE integrations in your BMAD project."
          actions={
            <button
              onClick={() => setShowAddDs(true)}
              className="px-4 py-2 text-sm font-bold rounded-md bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] transition-colors flex items-center gap-1.5"
            >
              <Plus size={14} />
              Add Data Source
            </button>
          }
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

            {/* Module skill coverage map */}
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
                <h3 className="text-sm font-bold mb-2">Configuration</h3>
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

      {/* Add Data Source Dialog */}
      {showAddDs && (
        <AddDataSourceDialog
          onClose={() => setShowAddDs(false)}
          onCreated={() => {
            setShowAddDs(false)
            loadDatasources()
          }}
        />
      )}

      {/* Sync Command Dialog */}
      {syncCommand && (
        <SyncCommandDialog
          command={syncCommand.command}
          sourceName={syncCommand.name}
          onClose={() => setSyncCommand(null)}
        />
      )}

      {/* Add IDE Dialog */}
      {showAddIde && ideData && (
        <AddIdeDialog
          available={ideData.available}
          onClose={() => setShowAddIde(false)}
          onAdded={(_ide, _skills) => {
            setShowAddIde(false)
            loadIdeData()
            // Refresh overview so IDE count updates in sidebar
            fetch('/api/overview').then((r) => r.json()).then((d) => setData(d as OverviewData)).catch(() => {})
          }}
        />
      )}
    </div>
  )
}
