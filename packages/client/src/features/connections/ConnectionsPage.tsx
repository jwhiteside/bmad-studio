import { useEffect, useState, useCallback } from 'react'
import {
  Plug, CheckCircle, Monitor, Settings, Plus, X, Trash2,
  Play, Copy, Database, Globe, Figma, Github, FileText,
  Loader2,
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
              <div>
                <button
                  onClick={() => {
                    const key = prompt('Parameter name:')
                    if (key && key.trim()) {
                      setParameters({ ...parameters, [key.trim()]: '' })
                    }
                  }}
                  className="text-xs text-[var(--color-accent)] hover:underline"
                >
                  + Add parameter
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

  useEffect(() => {
    fetch('/api/overview')
      .then((r) => r.json())
      .then((d) => {
        setData(d as OverviewData)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

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

  const ides = data?.sections?.ideConfigs?.ides ?? []
  const totalCount = ides.length + datasources.length

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-extrabold">
          Connections ({totalCount})
        </h1>
        <button
          onClick={() => setShowAddDs(true)}
          className="px-4 py-2 text-sm font-bold rounded-md bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] transition-colors flex items-center gap-1.5"
        >
          <Plus size={14} />
          Add Data Source
        </button>
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

            <div>
              <h3 className="text-sm font-bold mb-2">Integration</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 p-2 rounded bg-[var(--color-surface-raised)] text-sm">
                  <Settings size={14} className="text-[var(--color-muted)]" />
                  <span>Agent commands</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded bg-[var(--color-surface-raised)] text-sm">
                  <Settings size={14} className="text-[var(--color-muted)]" />
                  <span>Skill shortcuts</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded bg-[var(--color-surface-raised)] text-sm">
                  <Settings size={14} className="text-[var(--color-muted)]" />
                  <span>Workflow triggers</span>
                </div>
              </div>
            </div>

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
    </div>
  )
}
