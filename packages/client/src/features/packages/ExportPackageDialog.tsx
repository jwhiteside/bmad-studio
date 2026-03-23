import { useState, useEffect, useMemo } from 'react'
import { X, Download, Package, Users, Zap, GitBranch, Check, Loader2 } from 'lucide-react'

type AgentItem = { id: string; name: string; title: string; module?: string }
type SkillItem = { id: string; name: string; module?: string; description?: string }
type WorkflowItem = { id: string; name: string; module?: string; description?: string }

type ExportPackageDialogProps = {
  onClose: () => void
}

export function ExportPackageDialog({ onClose }: ExportPackageDialogProps) {
  // Step: 'info' | 'select' | 'exporting'
  const [step, setStep] = useState<'info' | 'select'>('info')

  // Package info
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [version, setVersion] = useState('1.0.0')

  // Entity data
  const [agents, setAgents] = useState<AgentItem[]>([])
  const [skills, setSkills] = useState<SkillItem[]>([])
  const [workflows, setWorkflows] = useState<WorkflowItem[]>([])
  const [loadingEntities, setLoadingEntities] = useState(false)

  // Selections
  const [selectedAgents, setSelectedAgents] = useState<Set<string>>(new Set())
  const [selectedSkills, setSelectedSkills] = useState<Set<string>>(new Set())
  const [selectedWorkflows, setSelectedWorkflows] = useState<Set<string>>(new Set())

  // Export state
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const nameValid = name.trim().length > 0

  // Fetch entities when entering the selection step
  useEffect(() => {
    if (step === 'select' && agents.length === 0 && skills.length === 0 && workflows.length === 0) {
      setLoadingEntities(true)
      Promise.all([
        fetch('/api/agents').then((r) => r.json()) as Promise<AgentItem[]>,
        fetch('/api/skills').then((r) => r.json()) as Promise<SkillItem[]>,
        fetch('/api/workflows').then((r) => r.json()) as Promise<WorkflowItem[]>,
      ])
        .then(([a, s, w]) => {
          setAgents(a)
          setSkills(s)
          setWorkflows(w)
        })
        .catch(() => setError('Failed to load entities'))
        .finally(() => setLoadingEntities(false))
    }
  }, [step, agents.length, skills.length, workflows.length])

  const totalSelected = selectedAgents.size + selectedSkills.size + selectedWorkflows.size

  // Module grouping for display
  const groupedAgents = useMemo(() => groupByModule(agents), [agents])
  const groupedSkills = useMemo(() => groupByModule(skills), [skills])
  const groupedWorkflows = useMemo(() => groupByModule(workflows), [workflows])

  function toggleSelection(
    set: Set<string>,
    setter: (s: Set<string>) => void,
    id: string,
  ) {
    const next = new Set(set)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    setter(next)
  }

  function selectAll(items: Array<{ id: string }>, setter: (s: Set<string>) => void) {
    setter(new Set(items.map((i) => i.id)))
  }

  function deselectAll(setter: (s: Set<string>) => void) {
    setter(new Set())
  }

  async function handleExport() {
    setExporting(true)
    setError(null)

    try {
      const resp = await fetch('/api/packages/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          version: version.trim(),
          agents: Array.from(selectedAgents),
          skills: Array.from(selectedSkills),
          workflows: Array.from(selectedWorkflows),
        }),
      })

      if (!resp.ok) {
        const data = (await resp.json()) as { error?: { message?: string } }
        throw new Error(data.error?.message ?? 'Export failed')
      }

      // Download the file
      const blob = await resp.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${name.trim()}.tar.gz`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-[var(--color-bg)] border border-[var(--color-border-subtle)] rounded-lg shadow-xl w-full max-w-3xl p-6 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Package size={20} className="text-[var(--color-accent)]" />
            <h2 className="text-lg font-bold">Export Package</h2>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--color-muted)] hover:text-[var(--color-text)]"
          >
            <X size={18} />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-3 mb-6">
          <div
            className={`flex items-center gap-1.5 text-sm ${
              step === 'info'
                ? 'text-[var(--color-accent)] font-bold'
                : 'text-[var(--color-muted)]'
            }`}
          >
            <span className="w-5 h-5 rounded-full border flex items-center justify-center text-xs border-current">
              {step === 'select' ? <Check size={12} /> : '1'}
            </span>
            Package Info
          </div>
          <div className="w-8 h-px bg-[var(--color-border-subtle)]" />
          <div
            className={`flex items-center gap-1.5 text-sm ${
              step === 'select'
                ? 'text-[var(--color-accent)] font-bold'
                : 'text-[var(--color-muted)]'
            }`}
          >
            <span className="w-5 h-5 rounded-full border flex items-center justify-center text-xs border-current">
              2
            </span>
            Select Entities
          </div>
        </div>

        {/* Step content */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {step === 'info' && (
            <div className="space-y-4 max-w-md">
              <div>
                <label className="block text-sm font-bold mb-1">Package Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="my-package"
                  className="w-full px-3 py-2 text-sm rounded-md bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)] focus:border-[var(--color-accent)] focus:outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="What does this package contain?"
                  className="w-full px-3 py-2 text-sm rounded-md bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)] focus:border-[var(--color-accent)] focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-1">Version</label>
                <input
                  type="text"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  placeholder="1.0.0"
                  className="w-full px-3 py-2 text-sm rounded-md bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)] focus:border-[var(--color-accent)] focus:outline-none"
                />
              </div>
            </div>
          )}

          {step === 'select' && (
            <>
              {loadingEntities ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 size={24} className="animate-spin text-[var(--color-muted)]" />
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-4">
                  {/* Agents column */}
                  <EntityColumn
                    icon={Users}
                    label="Agents"
                    items={agents}
                    grouped={groupedAgents}
                    selected={selectedAgents}
                    onToggle={(id) => toggleSelection(selectedAgents, setSelectedAgents, id)}
                    onSelectAll={() => selectAll(agents, setSelectedAgents)}
                    onDeselectAll={() => deselectAll(setSelectedAgents)}
                    getLabel={(item) => (item as AgentItem).title || (item as AgentItem).name}
                  />

                  {/* Skills column */}
                  <EntityColumn
                    icon={Zap}
                    label="Skills"
                    items={skills}
                    grouped={groupedSkills}
                    selected={selectedSkills}
                    onToggle={(id) => toggleSelection(selectedSkills, setSelectedSkills, id)}
                    onSelectAll={() => selectAll(skills, setSelectedSkills)}
                    onDeselectAll={() => deselectAll(setSelectedSkills)}
                    getLabel={(item) => item.name}
                  />

                  {/* Workflows column */}
                  <EntityColumn
                    icon={GitBranch}
                    label="Workflows"
                    items={workflows}
                    grouped={groupedWorkflows}
                    selected={selectedWorkflows}
                    onToggle={(id) => toggleSelection(selectedWorkflows, setSelectedWorkflows, id)}
                    onSelectAll={() => selectAll(workflows, setSelectedWorkflows)}
                    onDeselectAll={() => deselectAll(setSelectedWorkflows)}
                    getLabel={(item) => item.name}
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* Error */}
        {error && (
          <p className="text-sm text-[var(--color-error)] mt-4">{error}</p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-[var(--color-border-subtle)]">
          <div className="text-sm text-[var(--color-muted)]">
            {step === 'select' && `${totalSelected} entit${totalSelected === 1 ? 'y' : 'ies'} selected`}
          </div>
          <div className="flex gap-3">
            {step === 'info' && (
              <>
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm rounded-md border border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-raised)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setStep('select')}
                  disabled={!nameValid}
                  className="px-4 py-2 text-sm font-bold rounded-md bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </>
            )}
            {step === 'select' && (
              <>
                <button
                  onClick={() => setStep('info')}
                  className="px-4 py-2 text-sm rounded-md border border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-raised)] transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleExport}
                  disabled={totalSelected === 0 || exporting}
                  className="px-4 py-2 text-sm font-bold rounded-md bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  {exporting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download size={14} />
                      Export Package
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Helper to group items by module
function groupByModule<T extends { module?: string }>(items: T[]): Map<string, T[]> {
  const map = new Map<string, T[]>()
  for (const item of items) {
    const mod = item.module ?? 'unknown'
    if (!map.has(mod)) map.set(mod, [])
    map.get(mod)!.push(item)
  }
  return map
}

// Reusable entity column component
function EntityColumn({
  icon: Icon,
  label,
  items,
  grouped,
  selected,
  onToggle,
  onSelectAll,
  onDeselectAll,
  getLabel,
}: {
  icon: typeof Users
  label: string
  items: Array<{ id: string; name: string; module?: string }>
  grouped: Map<string, Array<{ id: string; name: string; module?: string }>>
  selected: Set<string>
  onToggle: (id: string) => void
  onSelectAll: () => void
  onDeselectAll: () => void
  getLabel: (item: { id: string; name: string; module?: string }) => string
}) {
  const allSelected = items.length > 0 && selected.size === items.length

  return (
    <div className="flex flex-col rounded-lg border border-[var(--color-border-subtle)] overflow-hidden">
      {/* Column header */}
      <div className="px-3 py-2 bg-[var(--color-surface-raised)] border-b border-[var(--color-border-subtle)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Icon size={14} className="text-[var(--color-accent)]" />
            <span className="text-sm font-bold">{label}</span>
            <span className="text-xs text-[var(--color-muted)]">({items.length})</span>
          </div>
          <button
            onClick={allSelected ? onDeselectAll : onSelectAll}
            className="text-xs text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] transition-colors"
          >
            {allSelected ? 'Deselect All' : 'Select All'}
          </button>
        </div>
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto max-h-72 p-1">
        {items.length === 0 && (
          <p className="text-xs text-[var(--color-muted)] text-center py-4">None available</p>
        )}
        {Array.from(grouped.entries()).map(([mod, modItems]) => (
          <div key={mod}>
            {grouped.size > 1 && (
              <p className="text-[10px] uppercase font-bold text-[var(--color-muted)] px-2 pt-2 pb-1">
                {mod}
              </p>
            )}
            {modItems.map((item) => (
              <label
                key={item.id}
                className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-[var(--color-surface-raised)] cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selected.has(item.id)}
                  onChange={() => onToggle(item.id)}
                  className="rounded border-[var(--color-border-subtle)] text-[var(--color-accent)] focus:ring-[var(--color-accent)]"
                />
                <span className="text-sm truncate">{getLabel(item)}</span>
                {grouped.size <= 1 && item.module && (
                  <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)] text-[var(--color-muted)] shrink-0">
                    {item.module}
                  </span>
                )}
              </label>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
