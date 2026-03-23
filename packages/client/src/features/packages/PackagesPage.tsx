import { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Package, X, Users, UsersRound, Zap, GitBranch, Plus, Trash2, AlertTriangle,
  Upload, Download, FileText, Pencil, ChevronDown, ChevronRight,
} from 'lucide-react'

import type { TeamListItem } from '@bmad-studio/shared'

import { EmptyState } from '../../shared/EmptyState.js'
import { EditModuleDialog } from './EditModuleDialog.js'
import { ExportPackageDialog } from './ExportPackageDialog.js'
import { InstallModuleDialog } from './InstallModuleDialog.js'
import { useDetailParam } from '../../hooks/use-detail-param.js'
import { SkeletonCard } from '../../shared/Skeleton.js'

type ModuleInfo = {
  name: string
  version: string
  source: string
  npmPackage: string | null
  repoUrl: string | null
  agentCount: number
  skillCount: number
  workflowCount: number
  agents?: Array<{ id: string; name: string; title?: string }>
  skills?: Array<{ id: string; name: string }>
  workflows?: Array<{ id: string; name: string }>
}

type ExportManifest = {
  module: string
  version: string
  source: string
  exportDate: string
  entities: {
    agents: { count: number; names: string[] }
    skills: { count: number; names: string[] }
    workflows: { count: number; names: string[] }
  }
  totalEntities: number
  note: string
}

// --- Create Module Dialog ---

function CreateModuleDialog({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: () => void
}) {
  const [name, setName] = useState('')
  const [version, setVersion] = useState('1.0.0')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const nameValid = /^[a-z][a-z0-9-]*$/.test(name)

  const handleCreate = async () => {
    if (!nameValid) return
    setSubmitting(true)
    setError(null)
    try {
      const resp = await fetch('/api/modules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, version }),
      })
      if (!resp.ok) {
        const data = (await resp.json()) as { error?: { message?: string } }
        throw new Error(data.error?.message ?? 'Failed to create module')
      }
      onCreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create module')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-[var(--color-bg)] border border-[var(--color-border-subtle)] rounded-lg shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-bold mb-4">Create Module</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="my-module"
              className="w-full px-3 py-2 text-sm rounded-md bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)] focus:border-[var(--color-accent)] focus:outline-none"
            />
            {name && !nameValid && (
              <p className="text-xs text-[var(--color-error)] mt-1">
                Lowercase alphanumeric and hyphens only, must start with a letter
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-bold mb-1">Version</label>
            <input
              type="text"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-md bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)] focus:border-[var(--color-accent)] focus:outline-none"
            />
          </div>

          {name && nameValid && (
            <div className="text-xs text-[var(--color-muted)] p-3 rounded-md bg-[var(--color-surface-raised)]">
              <p className="font-bold mb-1">Will create:</p>
              <pre className="font-[var(--font-mono)]">
{`_bmad/${name}/
├── config.yaml
├── agents/
├── skills/
└── workflows/`}
              </pre>
            </div>
          )}

          {error && (
            <p className="text-sm text-[var(--color-error)]">{error}</p>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-md border border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-raised)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!nameValid || submitting}
            className="px-4 py-2 text-sm font-bold rounded-md bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            <Plus size={14} />
            {submitting ? 'Creating...' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  )
}

// --- Remove Module Dialog ---

function RemoveModuleDialog({
  module,
  onClose,
  onRemoved,
}: {
  module: ModuleInfo
  onClose: () => void
  onRemoved: () => void
}) {
  const [confirmName, setConfirmName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const confirmed = confirmName === module.name

  const handleRemove = async () => {
    if (!confirmed) return
    setSubmitting(true)
    setError(null)
    try {
      const resp = await fetch(`/api/modules/${encodeURIComponent(module.name)}`, {
        method: 'DELETE',
      })
      if (!resp.ok) {
        const data = (await resp.json()) as { error?: { message?: string } }
        throw new Error(data.error?.message ?? 'Failed to remove module')
      }
      onRemoved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove module')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-[var(--color-bg)] border border-[var(--color-border-subtle)] rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle size={20} className="text-[var(--color-error)]" />
          <h2 className="text-lg font-bold">Remove Module</h2>
        </div>

        <div className="space-y-4">
          <p className="text-sm">
            This will permanently delete the <strong>{module.name}</strong> module and all its contents:
          </p>

          <div className="text-sm text-[var(--color-muted)] p-3 rounded-md bg-[var(--color-surface-raised)] space-y-1">
            <p>{module.agentCount} agent(s)</p>
            <p>{module.skillCount} skill(s)</p>
            <p>{module.workflowCount} workflow(s)</p>
          </div>

          {module.source === 'custom' && (
            <p className="text-sm text-[var(--color-warning)] flex items-center gap-1.5">
              <AlertTriangle size={14} />
              Custom modules cannot be recovered unless tracked by git.
            </p>
          )}

          <div>
            <label className="block text-sm mb-1">
              Type <strong>{module.name}</strong> to confirm:
            </label>
            <input
              type="text"
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-md bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)] focus:border-[var(--color-error)] focus:outline-none"
            />
          </div>

          {error && (
            <p className="text-sm text-[var(--color-error)]">{error}</p>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-md border border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-raised)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleRemove}
            disabled={!confirmed || submitting}
            className="px-4 py-2 text-sm font-bold rounded-md bg-[var(--color-error)] text-white hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            <Trash2 size={14} />
            {submitting ? 'Removing...' : 'Remove Module'}
          </button>
        </div>
      </div>
    </div>
  )
}

// --- Story 12.1: Add Entity Dialog ---

function AddEntityDialog({
  moduleName,
  entityType,
  onClose,
  onCreated,
}: {
  moduleName: string
  entityType: 'skill' | 'workflow'
  onClose: () => void
  onCreated: () => void
}) {
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const nameValid = /^[a-z][a-z0-9-]*$/.test(name)
  const label = entityType === 'skill' ? 'Skill' : 'Workflow'

  const handleCreate = async () => {
    if (!nameValid) return
    setSubmitting(true)
    setError(null)
    try {
      const resp = await fetch(`/api/modules/${encodeURIComponent(moduleName)}/entities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: entityType, name }),
      })
      if (!resp.ok) {
        const data = (await resp.json()) as { error?: { message?: string } }
        throw new Error(data.error?.message ?? `Failed to create ${entityType}`)
      }
      onCreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to create ${entityType}`)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-[var(--color-bg)] border border-[var(--color-border-subtle)] rounded-lg shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-bold mb-4">Create {label}</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold mb-1">{label} Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={`my-${entityType}`}
              className="w-full px-3 py-2 text-sm rounded-md bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)] focus:border-[var(--color-accent)] focus:outline-none"
            />
            {name && !nameValid && (
              <p className="text-xs text-[var(--color-error)] mt-1">
                Lowercase alphanumeric and hyphens only, must start with a letter
              </p>
            )}
          </div>

          {name && nameValid && (
            <div className="text-xs text-[var(--color-muted)] p-3 rounded-md bg-[var(--color-surface-raised)]">
              <p className="font-bold mb-1">Will create:</p>
              <code className="font-[var(--font-mono)]">
                {entityType === 'skill'
                  ? `_bmad/${moduleName}/skills/${name}/SKILL.md`
                  : `_bmad/${moduleName}/workflows/${name}/workflow.md`}
              </code>
            </div>
          )}

          {error && (
            <p className="text-sm text-[var(--color-error)]">{error}</p>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-md border border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-raised)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!nameValid || submitting}
            className="px-4 py-2 text-sm font-bold rounded-md bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            <Plus size={14} />
            {submitting ? 'Creating...' : `Create ${label}`}
          </button>
        </div>
      </div>
    </div>
  )
}

// --- Story 12.3: Export Manifest Preview Dialog ---

function ExportManifestDialog({
  manifest,
  onClose,
}: {
  manifest: ExportManifest
  onClose: () => void
}) {
  const yamlContent = [
    `# Module Export Manifest`,
    `module: ${manifest.module}`,
    `version: ${manifest.version}`,
    `source: ${manifest.source}`,
    `exportDate: ${manifest.exportDate}`,
    `totalEntities: ${manifest.totalEntities}`,
    `entities:`,
    `  agents:`,
    `    count: ${manifest.entities.agents.count}`,
    `    names:`,
    ...manifest.entities.agents.names.map((n) => `      - ${n}`),
    `  skills:`,
    `    count: ${manifest.entities.skills.count}`,
    `    names:`,
    ...manifest.entities.skills.names.map((n) => `      - ${n}`),
    `  workflows:`,
    `    count: ${manifest.entities.workflows.count}`,
    `    names:`,
    ...manifest.entities.workflows.names.map((n) => `      - ${n}`),
    ``,
    `# ${manifest.note}`,
  ].join('\n')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-[var(--color-bg)] border border-[var(--color-border-subtle)] rounded-lg shadow-xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Export Manifest: {manifest.module}</h2>
          <button
            onClick={onClose}
            className="text-[var(--color-muted)] hover:text-[var(--color-text)]"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[var(--color-surface-raised)]">
              <Users size={14} className="text-[var(--color-accent)]" />
              <span>{manifest.entities.agents.count} agents</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[var(--color-surface-raised)]">
              <Zap size={14} className="text-[var(--color-accent)]" />
              <span>{manifest.entities.skills.count} skills</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[var(--color-surface-raised)]">
              <GitBranch size={14} className="text-[var(--color-accent)]" />
              <span>{manifest.entities.workflows.count} workflows</span>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold mb-2">module-manifest.yaml</h3>
            <pre className="p-4 text-xs font-[var(--font-mono)] bg-[var(--color-surface-raised)] rounded-lg overflow-x-auto whitespace-pre-wrap max-h-72 overflow-y-auto border border-[var(--color-border-subtle)]">
              {yamlContent}
            </pre>
          </div>

          <p className="text-xs text-[var(--color-muted)]">
            Full file bundling and archive download is a future enhancement. This manifest provides a summary of module contents.
          </p>
        </div>

        <div className="flex justify-end gap-3 mt-6">
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

// --- Story 12.2: Detect entity type from file ---

function detectEntityType(file: File): 'agent' | 'skill' | 'workflow' {
  const name = file.name.toLowerCase()
  if (name === 'skill.md' || name.endsWith('-skill.md') || name.endsWith('_skill.md')) {
    return 'skill'
  }
  if (name === 'workflow.md') {
    return 'workflow'
  }
  // Default to agent for other .md files
  return 'agent'
}

async function detectEntityTypeFromContent(file: File): Promise<'agent' | 'skill' | 'workflow'> {
  const text = await file.text()
  // Check frontmatter for skill indicators
  const frontmatterMatch = text.match(/^---\n([\s\S]*?)\n---/)
  if (frontmatterMatch) {
    const fm = frontmatterMatch[1].toLowerCase()
    if (fm.includes('category:') && (fm.includes('skill') || fm.includes('best_for:'))) {
      return 'skill'
    }
  }
  // Fall back to filename detection
  return detectEntityType(file)
}

// --- Entity Section for Module Detail ---

function EntitySection({
  icon: Icon,
  label,
  items,
}: {
  icon: typeof Users
  label: string
  items: Array<{ id: string; name: string; to: string }>
}) {
  const [expanded, setExpanded] = useState(false)
  if (items.length === 0) return null

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 w-full text-left py-2"
      >
        {expanded ? (
          <ChevronDown size={14} className="text-[var(--color-muted)]" />
        ) : (
          <ChevronRight size={14} className="text-[var(--color-muted)]" />
        )}
        <Icon size={14} className="text-[var(--color-accent)]" />
        <span className="text-sm font-bold">{label}</span>
        <span className="text-xs text-[var(--color-muted)]">({items.length})</span>
      </button>
      {expanded && (
        <div className="ml-7 space-y-1 mb-2">
          {items.map((item) => (
            <Link
              key={item.id}
              to={item.to}
              className="block text-sm text-[var(--color-accent)] hover:underline py-0.5"
            >
              {item.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

// --- Main Page ---

export function ModulesPage() {
  const navigate = useNavigate()
  const [modules, setModules] = useState<ModuleInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedModule, setSelectedModule] = useDetailParam('detail')
  const [showCreate, setShowCreate] = useState(false)
  const [showInstall, setShowInstall] = useState(false)
  const [showExport, setShowExport] = useState(false)
  const [removeTarget, setRemoveTarget] = useState<ModuleInfo | null>(null)
  const [showEdit, setShowEdit] = useState<string | null>(null)
  const [teams, setTeams] = useState<TeamListItem[]>([])

  // Story 12.1: Add entity state
  const [addEntityType, setAddEntityType] = useState<'skill' | 'workflow' | null>(null)

  // Story 12.2: Drag-and-drop state
  const [dragOver, setDragOver] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Story 12.3: Export state
  const [exportManifest, setExportManifest] = useState<ExportManifest | null>(null)
  const [exporting, setExporting] = useState(false)

  const loadModules = useCallback(async () => {
    try {
      const resp = await fetch('/api/modules')
      const data = (await resp.json()) as ModuleInfo[]
      setModules(data)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetch('/api/teams')
      .then((r) => r.json())
      .then((data) => setTeams(data as TeamListItem[]))
      .catch(() => {})
  }, [])

  useEffect(() => {
    loadModules()
  }, [loadModules])

  // Story 12.2: Handle file upload
  const handleFileUpload = useCallback(async (files: FileList, moduleName: string) => {
    setUploadStatus(null)
    let successCount = 0
    let errorCount = 0

    for (const file of Array.from(files)) {
      if (!file.name.endsWith('.md')) {
        errorCount++
        continue
      }

      try {
        const content = await file.text()
        const entityType = await detectEntityTypeFromContent(file)
        const entityName = file.name.replace(/\.md$/i, '')

        const resp = await fetch(`/api/modules/${encodeURIComponent(moduleName)}/entities`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: entityType, name: entityName, content }),
        })

        if (resp.ok) {
          successCount++
        } else {
          errorCount++
        }
      } catch {
        errorCount++
      }
    }

    if (successCount > 0) {
      await loadModules()
    }

    if (errorCount > 0) {
      setUploadStatus(`Uploaded ${successCount} file(s), ${errorCount} failed`)
    } else {
      setUploadStatus(`Uploaded ${successCount} file(s) successfully`)
    }

    setTimeout(() => setUploadStatus(null), 4000)
  }, [loadModules])

  // Story 12.3: Handle export
  const handleExport = useCallback(async (moduleName: string) => {
    setExporting(true)
    try {
      const resp = await fetch(`/api/modules/${encodeURIComponent(moduleName)}/export`, {
        method: 'POST',
      })
      if (!resp.ok) {
        throw new Error('Export failed')
      }
      const data = (await resp.json()) as ExportManifest
      setExportManifest(data)
    } catch {
      setUploadStatus('Export failed')
      setTimeout(() => setUploadStatus(null), 3000)
    } finally {
      setExporting(false)
    }
  }, [])

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-extrabold mb-8">Modules</h1>
        <SkeletonCard count={3} />
      </div>
    )
  }

  if (modules.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-extrabold mb-8">Modules</h1>
        <EmptyState
          icon={Package}
          title="No modules installed"
          description="Modules contain agents, skills, and workflows. Install a module or create a new one to get started."
          actions={
            <button
              onClick={() => setShowCreate(true)}
              className="px-4 py-2 text-sm font-bold rounded-md bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] transition-colors flex items-center gap-1.5"
            >
              <Plus size={14} />
              Create Module
            </button>
          }
        />
        {showCreate && (
          <CreateModuleDialog
            onClose={() => setShowCreate(false)}
            onCreated={() => {
              setShowCreate(false)
              loadModules()
            }}
          />
        )}
      </div>
    )
  }

  const selected = selectedModule ? modules.find((m) => m.name === selectedModule) : null

  return (
    <div>
      <div>
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-extrabold">Modules ({modules.length})</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowExport(true)}
              className="px-4 py-2 text-sm rounded-md border border-[var(--color-border-subtle)] hover:border-[var(--color-accent)] hover:bg-[var(--color-surface-raised)] transition-colors flex items-center gap-1.5"
            >
              <Upload size={14} />
              Export Package
            </button>
            <button
              onClick={() => setShowInstall(true)}
              className="px-4 py-2 text-sm rounded-md border border-[var(--color-border-subtle)] hover:border-[var(--color-accent)] hover:bg-[var(--color-surface-raised)] transition-colors flex items-center gap-1.5"
            >
              <Download size={14} />
              Install Module
            </button>
            <button
              onClick={() => setShowCreate(true)}
              className="px-4 py-2 text-sm font-bold rounded-md bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] transition-colors flex items-center gap-1.5"
            >
              <Plus size={14} />
              Create Module
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map((mod) => (
            <button
              key={mod.name}
              onClick={() => setSelectedModule(selectedModule === mod.name ? null : mod.name)}
              className={`p-4 rounded-lg border text-left transition-all cursor-pointer hover:-translate-y-0.5 hover:shadow-md ${
                selectedModule === mod.name
                  ? 'bg-[var(--color-surface-raised)] border-[var(--color-accent)]'
                  : 'bg-[var(--color-surface-raised)] border-[var(--color-border-subtle)] hover:border-[var(--color-accent)]'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Package size={18} className="text-[var(--color-accent)]" />
                <span className="font-bold text-sm">{mod.name}</span>
                <span className="text-xs px-1.5 py-0.5 rounded-full bg-[var(--color-bg)] border border-[var(--color-border-subtle)] text-[var(--color-muted)]">
                  {mod.source}
                </span>
              </div>
              <p className="text-xs text-[var(--color-muted)] mb-2 ml-7">v{mod.version}</p>
              <div className="flex gap-4 text-xs text-[var(--color-muted)]">
                <span className="flex items-center gap-1">
                  <Users size={10} />
                  {mod.agentCount} agents
                </span>
                <span className="flex items-center gap-1">
                  <Zap size={10} />
                  {mod.skillCount} skills
                </span>
                <span className="flex items-center gap-1">
                  <GitBranch size={10} />
                  {mod.workflowCount} workflows
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {selected && (
        <div className="slide-over-backdrop">
          <div className="slide-over-bg" onClick={() => setSelectedModule(null)} />
          <aside className="slide-over-panel" style={{ width: 'max(400px, 40vw)' }}>
          <div className="px-6 py-4 border-b border-[var(--color-border-subtle)] flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">{selected.name}</h2>
              <p className="text-xs text-[var(--color-muted)]">{selected.source} · v{selected.version}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setShowEdit(selected.name)}
                className="text-[var(--color-muted)] hover:text-[var(--color-accent)] transition-colors"
                title="Edit Module"
              >
                <Pencil size={16} />
              </button>
              <button
                onClick={() => setSelectedModule(null)}
                className="text-[var(--color-muted)] hover:text-[var(--color-text)]"
              >
                <X size={18} />
              </button>
            </div>
          </div>
          <div className="p-6 space-y-6 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 80px)' }}>
            <EntitySection
              icon={Users}
              label="Agents"
              items={(selected.agents ?? []).map((a: { id: string; name: string; title?: string }) => ({
                id: a.id,
                name: a.title || a.name,
                to: `/agents/${a.id}`,
              }))}
            />
            <EntitySection
              icon={Zap}
              label="Skills"
              items={(selected.skills ?? []).map((s: { id: string; name: string }) => ({
                id: s.id,
                name: s.name,
                to: `/skills?detail=${s.id}`,
              }))}
            />
            <EntitySection
              icon={GitBranch}
              label="Workflows"
              items={(selected.workflows ?? []).map((w: { id: string; name: string }) => ({
                id: w.id,
                name: w.name,
                to: `/workflows?detail=${w.id}`,
              }))}
            />

            {/* Story 12.1: Add Entity Buttons */}
            <div>
              <h3 className="text-sm font-bold mb-3">Add Entities</h3>
              <div className="space-y-2">
                <button
                  onClick={() => navigate('/agents')}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md border border-[var(--color-border-subtle)] hover:border-[var(--color-accent)] hover:bg-[var(--color-surface-raised)] transition-colors text-left"
                >
                  <Plus size={14} className="text-[var(--color-accent)]" />
                  <Users size={14} />
                  Add Agent
                  <span className="ml-auto text-xs text-[var(--color-muted)]">via Agents page</span>
                </button>
                <button
                  onClick={() => setAddEntityType('skill')}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md border border-[var(--color-border-subtle)] hover:border-[var(--color-accent)] hover:bg-[var(--color-surface-raised)] transition-colors text-left"
                >
                  <Plus size={14} className="text-[var(--color-accent)]" />
                  <Zap size={14} />
                  Add Skill
                </button>
                <button
                  onClick={() => setAddEntityType('workflow')}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md border border-[var(--color-border-subtle)] hover:border-[var(--color-accent)] hover:bg-[var(--color-surface-raised)] transition-colors text-left"
                >
                  <Plus size={14} className="text-[var(--color-accent)]" />
                  <GitBranch size={14} />
                  Add Workflow
                </button>
              </div>
            </div>

            {/* Story 12.2: Drag-and-Drop Upload Zone */}
            <div>
              <h3 className="text-sm font-bold mb-3">Upload Entities</h3>
              <div
                className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  dragOver
                    ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10'
                    : 'border-[var(--color-border-subtle)] hover:border-[var(--color-accent)]'
                }`}
                onDragOver={(e) => {
                  e.preventDefault()
                  setDragOver(true)
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault()
                  setDragOver(false)
                  if (e.dataTransfer.files.length > 0) {
                    handleFileUpload(e.dataTransfer.files, selected.name)
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".md"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleFileUpload(e.target.files, selected.name)
                      e.target.value = ''
                    }
                  }}
                />
                <Upload size={24} className={`mx-auto mb-2 ${dragOver ? 'text-[var(--color-accent)]' : 'text-[var(--color-muted)]'}`} />
                <p className="text-sm text-[var(--color-muted)]">
                  Drop .md files here or click to upload
                </p>
                <p className="text-xs text-[var(--color-muted)] mt-1">
                  Auto-detects: SKILL.md → skills, workflow.md → workflows, others → agents
                </p>
              </div>
              {uploadStatus && (
                <p className="text-xs mt-2 text-[var(--color-accent)]">
                  <FileText size={12} className="inline mr-1" />
                  {uploadStatus}
                </p>
              )}
            </div>

            {/* Teams in this module */}
            {(() => {
              const moduleTeams = teams.filter((t) => t.module === selected.name)
              if (moduleTeams.length === 0) return null
              return (
                <div>
                  <h3 className="text-sm font-bold mb-3">Teams ({moduleTeams.length})</h3>
                  <div className="space-y-2">
                    {moduleTeams.map((t) => (
                      <div
                        key={t.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-surface-raised)]"
                      >
                        <span className="flex items-center gap-2 text-sm">
                          {t.icon ? (
                            <span className="text-sm leading-none">{t.icon}</span>
                          ) : (
                            <UsersRound size={14} className="text-[var(--color-accent)]" />
                          )}
                          {t.name}
                        </span>
                        <span className="text-xs text-[var(--color-muted)]">
                          {t.memberCount} members
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })()}

            <div className="text-xs text-[var(--color-muted)]">
              <p>Module directory: <code className="font-[var(--font-mono)]">_bmad/{selected.name}/</code></p>
              {selected.npmPackage && (
                <p className="mt-1">npm: <code className="font-[var(--font-mono)]">{selected.npmPackage}</code></p>
              )}
            </div>

            {/* Story 12.3: Export Module Button */}
            <button
              onClick={() => handleExport(selected.name)}
              disabled={exporting}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm rounded-md border border-[var(--color-accent)] text-[var(--color-accent)] hover:bg-[var(--color-accent)] hover:text-white transition-colors disabled:opacity-50"
            >
              <Download size={14} />
              {exporting ? 'Exporting...' : 'Export Module'}
            </button>

            {selected.source !== 'built-in' && (
              <button
                onClick={() => setRemoveTarget(selected)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm rounded-md border border-[var(--color-error)] text-[var(--color-error)] hover:bg-[var(--color-error)] hover:text-white transition-colors"
              >
                <Trash2 size={14} />
                Remove Module
              </button>
            )}
          </div>
        </aside>
        </div>
      )}

      {showCreate && (
        <CreateModuleDialog
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false)
            loadModules()
          }}
        />
      )}

      {removeTarget && (
        <RemoveModuleDialog
          module={removeTarget}
          onClose={() => setRemoveTarget(null)}
          onRemoved={() => {
            setRemoveTarget(null)
            setSelectedModule(null)
            loadModules()
          }}
        />
      )}

      {/* Story 12.1: Add Entity Dialog */}
      {addEntityType && selected && (
        <AddEntityDialog
          moduleName={selected.name}
          entityType={addEntityType}
          onClose={() => setAddEntityType(null)}
          onCreated={() => {
            setAddEntityType(null)
            loadModules()
          }}
        />
      )}

      {/* Story 12.3: Export Manifest Preview */}
      {exportManifest && (
        <ExportManifestDialog
          manifest={exportManifest}
          onClose={() => setExportManifest(null)}
        />
      )}

      {showEdit && selected && (
        <EditModuleDialog
          moduleName={selected.name}
          currentVersion={selected.version}
          onClose={() => setShowEdit(null)}
          onSaved={() => {
            setShowEdit(null)
            loadModules()
          }}
        />
      )}

      {showInstall && (
        <InstallModuleDialog
          onClose={() => setShowInstall(false)}
          onInstalled={() => {
            setShowInstall(false)
            loadModules()
          }}
        />
      )}

      {showExport && (
        <ExportPackageDialog
          onClose={() => setShowExport(false)}
        />
      )}
    </div>
  )
}
