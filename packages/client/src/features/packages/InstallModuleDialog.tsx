import { useState, useEffect } from 'react'
import { Download, X, CheckCircle, Loader2, AlertTriangle } from 'lucide-react'

import type { ModuleYaml } from '@bmad-studio/shared'

type Tab = 'npm' | 'github' | 'local' | 'zip'

type PreviewResponse = {
  ok: true
  moduleYaml: ModuleYaml
  counts: { agents: number; workflows: number; tasks: number }
  willReplace: boolean
}

type InstallModuleDialogProps = {
  onClose: () => void
  onInstalled: () => void
}

export function InstallModuleDialog({ onClose, onInstalled }: InstallModuleDialogProps) {
  const [activeTab, setActiveTab] = useState<Tab>('npm')

  // Per-tab input state — each tab keeps its own value when switching
  const [npmValue, setNpmValue] = useState('')
  const [githubValue, setGithubValue] = useState('')
  const [localValue, setLocalValue] = useState('')
  const [zipFile, setZipFile] = useState<File | null>(null)

  const [preview, setPreview] = useState<PreviewResponse | null>(null)
  const [variables, setVariables] = useState<Record<string, string>>({})
  const [fetching, setFetching] = useState(false)
  const [installing, setInstalling] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [installed, setInstalled] = useState(false)

  // Clear preview and error when switching tabs
  useEffect(() => {
    setPreview(null)
    setError(null)
    setVariables({})
  }, [activeTab])

  const handleFetch = async () => {
    const value = activeTab === 'github' ? githubValue : localValue
    if (!value.trim()) return
    setFetching(true)
    setError(null)
    setPreview(null)
    setVariables({})
    try {
      const resp = await fetch('/api/modules/preview-source', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: { type: activeTab, value: value.trim() } }),
      })
      const data = (await resp.json()) as PreviewResponse | { error?: { message?: string } | string }
      if (!resp.ok) {
        const rawErr = (data as { error?: unknown }).error
        const msg =
          typeof rawErr === 'object' && rawErr !== null
            ? ((rawErr as { message?: string }).message ?? 'Fetch failed')
            : String(rawErr ?? 'Fetch failed')
        throw new Error(msg)
      }
      const p = data as PreviewResponse
      setPreview(p)
      // Seed variables form with defaults
      const seeded: Record<string, string> = {}
      for (const [key, def] of Object.entries(p.moduleYaml.variables ?? {})) {
        seeded[key] = def.default ?? ''
      }
      setVariables(seeded)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fetch failed')
    } finally {
      setFetching(false)
    }
  }

  const handleInstall = async () => {
    setInstalling(true)
    setError(null)
    try {
      if (activeTab === 'zip') {
        if (!zipFile) throw new Error('No zip file selected')
        const fd = new FormData()
        fd.append('file', zipFile)
        fd.append('variables', JSON.stringify(variables))
        const resp = await fetch('/api/modules/install/upload', {
          method: 'POST',
          body: fd,
        })
        const data = (await resp.json()) as { ok: boolean; error?: { message?: string } | string }
        if (!data.ok) {
          const e = data.error
          throw new Error(
            typeof e === 'object' && e !== null
              ? (e.message ?? 'Installation failed')
              : String(e ?? 'Installation failed'),
          )
        }
      } else {
        const sourceValue = activeTab === 'npm' ? npmValue : activeTab === 'github' ? githubValue : localValue
        const resp = await fetch('/api/modules/install', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            source: { type: activeTab, value: sourceValue.trim() },
            variables,
          }),
        })
        const data = (await resp.json()) as { ok: boolean; error?: { message?: string } | string }
        if (!data.ok) {
          const e = data.error
          throw new Error(
            typeof e === 'object' && e !== null
              ? (e.message ?? 'Installation failed')
              : String(e ?? 'Installation failed'),
          )
        }
      }
      setInstalled(true)
      setTimeout(() => onInstalled(), 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Installation failed')
    } finally {
      setInstalling(false)
    }
  }

  const canFetch = (activeTab === 'github' && githubValue.trim().length > 0) ||
    (activeTab === 'local' && localValue.trim().length > 0)

  const canInstall = (() => {
    if (installing || installed) return false
    if (activeTab === 'npm') return npmValue.trim().length > 0
    if (activeTab === 'zip') return zipFile !== null
    return preview !== null
  })()

  const installLabel = preview?.willReplace ? 'Replace' : 'Install'

  const TABS: { id: Tab; label: string }[] = [
    { id: 'npm', label: 'npm' },
    { id: 'github', label: 'GitHub' },
    { id: 'local', label: 'Local path' },
    { id: 'zip', label: 'Upload zip' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-[var(--color-bg)] border border-[var(--color-border-subtle)] rounded-lg shadow-xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Install Module</h2>
          <button
            onClick={onClose}
            className="text-[var(--color-muted)] hover:text-[var(--color-text)]"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex border-b border-[var(--color-border-subtle)] mb-4">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={[
                'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
                activeTab === tab.id
                  ? 'border-[var(--color-accent)] text-[var(--color-accent)]'
                  : 'border-transparent text-[var(--color-muted)] hover:text-[var(--color-text)]',
              ].join(' ')}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {/* npm tab */}
          {activeTab === 'npm' && (
            <div>
              <label className="block text-sm font-bold mb-1">npm Package Name</label>
              <input
                type="text"
                value={npmValue}
                onChange={(e) => setNpmValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && canInstall && !installing) handleInstall()
                }}
                placeholder="e.g. bmad-builder"
                disabled={installing || installed}
                className="w-full px-3 py-2 text-sm rounded-md bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)] focus:border-[var(--color-accent)] focus:outline-none disabled:opacity-50"
              />
              <p className="text-xs text-[var(--color-muted)] mt-1">
                The package must contain a <code className="font-[var(--font-mono)]">_bmad/</code> directory with module content.
              </p>
            </div>
          )}

          {/* github tab */}
          {activeTab === 'github' && (
            <div>
              <label className="block text-sm font-bold mb-1">GitHub Source</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={githubValue}
                  onChange={(e) => setGithubValue(e.target.value)}
                  placeholder="owner/repo or full GitHub URL"
                  disabled={fetching || installing || installed}
                  className="flex-1 px-3 py-2 text-sm rounded-md bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)] focus:border-[var(--color-accent)] focus:outline-none disabled:opacity-50"
                />
                <button
                  onClick={handleFetch}
                  disabled={!canFetch || fetching || installing || installed}
                  className="px-3 py-2 text-sm rounded-md border border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-raised)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  {fetching ? <Loader2 size={14} className="animate-spin" /> : null}
                  {fetching ? 'Fetching...' : 'Fetch'}
                </button>
              </div>
            </div>
          )}

          {/* local tab */}
          {activeTab === 'local' && (
            <div>
              <label className="block text-sm font-bold mb-1">Local Path</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={localValue}
                  onChange={(e) => setLocalValue(e.target.value)}
                  placeholder="/absolute/path/to/module or relative/path"
                  disabled={fetching || installing || installed}
                  className="flex-1 px-3 py-2 text-sm rounded-md bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)] focus:border-[var(--color-accent)] focus:outline-none disabled:opacity-50"
                />
                <button
                  onClick={handleFetch}
                  disabled={!canFetch || fetching || installing || installed}
                  className="px-3 py-2 text-sm rounded-md border border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-raised)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  {fetching ? <Loader2 size={14} className="animate-spin" /> : null}
                  {fetching ? 'Fetching...' : 'Fetch'}
                </button>
              </div>
            </div>
          )}

          {/* zip tab */}
          {activeTab === 'zip' && (
            <div>
              <label className="block text-sm font-bold mb-1">Module Zip File</label>
              <input
                type="file"
                accept=".zip"
                onChange={(e) => setZipFile(e.target.files?.[0] ?? null)}
                disabled={installing || installed}
                className="w-full text-sm text-[var(--color-muted)] file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border file:border-[var(--color-border-subtle)] file:text-sm file:bg-[var(--color-surface-raised)] file:text-[var(--color-text)] hover:file:bg-[var(--color-bg)] disabled:opacity-50"
              />
              {zipFile && (
                <p className="text-xs text-[var(--color-muted)] mt-1">{zipFile.name}</p>
              )}
            </div>
          )}

          {/* Preview pane */}
          {preview && (
            <div className="rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)] p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold">{preview.moduleYaml.name ?? preview.moduleYaml.code}</span>
                {preview.moduleYaml.version && (
                  <span className="text-xs text-[var(--color-muted)]">v{preview.moduleYaml.version}</span>
                )}
              </div>
              {preview.moduleYaml.description && (
                <p className="text-xs text-[var(--color-muted)]">{preview.moduleYaml.description}</p>
              )}
              <div className="flex gap-4 text-xs text-[var(--color-muted)]">
                <span>{preview.counts.agents} agent{preview.counts.agents !== 1 ? 's' : ''}</span>
                <span>{preview.counts.workflows} workflow{preview.counts.workflows !== 1 ? 's' : ''}</span>
                <span>{preview.counts.tasks} task{preview.counts.tasks !== 1 ? 's' : ''}</span>
              </div>
            </div>
          )}

          {/* Replace warning */}
          {preview?.willReplace && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-[var(--color-warning)]/10 border border-[var(--color-warning)]/30">
              <AlertTriangle size={16} className="text-[var(--color-warning)] mt-0.5 shrink-0" />
              <p className="text-xs text-[var(--color-warning)]">
                This will replace the existing installation of{' '}
                <strong>{preview.moduleYaml.name ?? preview.moduleYaml.code}</strong>
                {preview.moduleYaml.version ? ` v${preview.moduleYaml.version}` : ''}. The previous
                version will be recoverable from snapshot history.
              </p>
            </div>
          )}

          {/* Variables form */}
          {preview && Object.keys(preview.moduleYaml.variables ?? {}).length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-bold">Module Variables</p>
              {Object.entries(preview.moduleYaml.variables!).map(([key, def]) => (
                <div key={key}>
                  <label className="block text-xs font-medium mb-1 text-[var(--color-muted)]">{key}</label>
                  <input
                    type="text"
                    value={variables[key] ?? ''}
                    onChange={(e) => setVariables((v) => ({ ...v, [key]: e.target.value }))}
                    placeholder={def.prompt}
                    className="w-full px-3 py-2 text-sm rounded-md bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)] focus:border-[var(--color-accent)] focus:outline-none"
                  />
                </div>
              ))}
            </div>
          )}

          {/* In-flight status */}
          {installing && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-[var(--color-surface-raised)]">
              <Loader2 size={16} className="text-[var(--color-accent)] animate-spin" />
              <span className="text-sm">Installing module...</span>
            </div>
          )}

          {/* Success */}
          {installed && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-success)]">
              <CheckCircle size={16} className="text-[var(--color-success)]" />
              <span className="text-sm font-bold text-[var(--color-success)]">Installed successfully</span>
            </div>
          )}

          {/* Error */}
          {error && (
            <p className="text-sm text-[var(--color-error)]">{error}</p>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[var(--color-border-subtle)]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-md border border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-raised)] transition-colors"
          >
            {installed ? 'Close' : 'Cancel'}
          </button>
          {!installed && (
            <button
              onClick={handleInstall}
              disabled={!canInstall}
              className="px-4 py-2 text-sm font-bold rounded-md bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              <Download size={14} />
              {installing ? 'Installing...' : installLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
