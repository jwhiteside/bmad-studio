import { useState, useEffect, useCallback } from 'react'
import { Plus, X, Trash2, Upload, GitCommit, Bot, GitMerge, ArrowRight } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { WORKFLOW_TYPE_DEFINITIONS } from '@bmad-studio/shared'

type CreateWorkflowDialogProps = {
  onClose: () => void
  onCreated: () => void
}

type StepEntry = { title: string; agent: string }
type ModuleOption = { name: string }

const KEBAB_RE = /^[a-z][a-z0-9-]*$/

function toKebab(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const TYPE_OPTIONS = [
  {
    value: 'step-based' as const,
    label: WORKFLOW_TYPE_DEFINITIONS['step-based'].label,
    icon: GitCommit,
    color: 'text-[var(--color-accent)] bg-blue-500/10 border-blue-500/30',
    description: WORKFLOW_TYPE_DEFINITIONS['step-based'].description,
    bestFor: WORKFLOW_TYPE_DEFINITIONS['step-based'].bestFor,
    example: '/create-prd',
  },
  {
    value: 'agent-based' as const,
    label: WORKFLOW_TYPE_DEFINITIONS['agent-based'].label,
    icon: Bot,
    color: 'text-[var(--color-success)] bg-green-500/10 border-green-500/30',
    description: WORKFLOW_TYPE_DEFINITIONS['agent-based'].description,
    bestFor: WORKFLOW_TYPE_DEFINITIONS['agent-based'].bestFor,
    example: '/run-sprint',
  },
  {
    value: 'composite' as const,
    label: WORKFLOW_TYPE_DEFINITIONS.composite.label,
    icon: GitMerge,
    color: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
    description: WORKFLOW_TYPE_DEFINITIONS.composite.description,
    bestFor: WORKFLOW_TYPE_DEFINITIONS.composite.bestFor,
    example: '/plan → /sprint → /review',
  },
]

export function CreateWorkflowDialog({ onClose, onCreated }: CreateWorkflowDialogProps) {
  const queryClient = useQueryClient()

  // Wizard step: 'pick-type' is the decision tree; 'form' is the rest of the fields
  const [wizardStep, setWizardStep] = useState<'pick-type' | 'form'>('pick-type')

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<'step-based' | 'agent-based' | 'composite'>('step-based')
  const [phase, setPhase] = useState('')
  const [customPhase, setCustomPhase] = useState('')
  const [moduleName, setModuleName] = useState('')
  const [steps, setSteps] = useState<StepEntry[]>([])
  const [nameBlurred, setNameBlurred] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [tab, setTab] = useState<'create' | 'import'>('create')

  const [modules, setModules] = useState<ModuleOption[]>([])
  const [phases, setPhases] = useState<string[]>([])
  const [agents, setAgents] = useState<Array<{ id: string; name: string; title: string }>>([])
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetch('/api/modules')
      .then((r) => r.json())
      .then((data) => {
        const mods = data as Array<{ name: string }>
        setModules(mods.map((m) => ({ name: m.name })))
        if (mods.length === 1) setModuleName(mods[0].name)
      })
      .catch(() => {})

    fetch('/api/workflows')
      .then((r) => r.json())
      .then((data) => {
        const wfs = data as Array<{ phase?: string }>
        const phaseSet = new Set<string>()
        for (const wf of wfs) {
          if (wf.phase) phaseSet.add(wf.phase)
        }
        setPhases(Array.from(phaseSet).sort())
      })
      .catch(() => {})

    fetch('/api/agents')
      .then((r) => r.json())
      .then((data) => setAgents(data as Array<{ id: string; name: string; title: string }>))
      .catch(() => {})
  }, [])

  const nameValid = name.length === 0 || KEBAB_RE.test(name)
  const selectedPhase = phase === '__custom' ? customPhase.trim() : phase
  const canSubmit = name.trim().length > 0 && KEBAB_RE.test(name) && moduleName.length > 0

  const handleFileImport = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const text = reader.result as string
      const fmMatch = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
      if (fmMatch) {
        const fm = fmMatch[1]
        const nameMatch = fm.match(/^name:\s*(.+)$/m)
        const descMatch = fm.match(/^description:\s*"?(.+?)"?$/m)
        const typeMatch = fm.match(/^type:\s*(.+)$/m)
        if (nameMatch) setName(nameMatch[1].trim())
        if (descMatch) setDescription(descMatch[1].trim())
        if (typeMatch) {
          const t = typeMatch[1].trim()
          if (t === 'step-based' || t === 'agent-based' || t === 'composite') setType(t)
        }
      } else {
        // No frontmatter — use filename as name
        const fname = file.name.replace(/\.md$/i, '')
        setName(toKebab(fname))
      }
      setTab('create')
    }
    reader.readAsText(file)
  }, [])

  const addStep = () => setSteps([...steps, { title: '', agent: '' }])
  const removeStep = (i: number) => setSteps(steps.filter((_, idx) => idx !== i))
  const updateStep = (i: number, field: keyof StepEntry, value: string) => {
    setSteps(steps.map((s, idx) => (idx === i ? { ...s, [field]: value } : s)))
  }

  // Build preview tree
  const previewLines: string[] = []
  if (canSubmit) {
    const dir = selectedPhase
      ? `_bmad/${moduleName}/workflows/${selectedPhase}/${name}/`
      : `_bmad/${moduleName}/workflows/${name}/`
    previewLines.push(dir)
    previewLines.push('├── workflow.md')
    if (type === 'step-based' && steps.length > 0) {
      previewLines.push('├── steps/')
      steps.forEach((s, i) => {
        const num = String(i + 1).padStart(2, '0')
        const slug = toKebab(s.title || 'untitled')
        const prefix = i === steps.length - 1 ? '│   └──' : '│   ├──'
        previewLines.push(`${prefix} step-${num}-${slug}.md`)
      })
    }
  }

  const handleCreate = async () => {
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)
    try {
      const resp = await fetch('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          type,
          phase: selectedPhase || undefined,
          module: moduleName,
          steps: type === 'step-based' ? steps.filter((s) => s.title.trim()) : undefined,
        }),
      })
      if (!resp.ok) {
        const data = (await resp.json()) as { error?: { message?: string } }
        throw new Error(data.error?.message ?? 'Failed to create workflow')
      }
      await queryClient.invalidateQueries({ queryKey: ['workflows'] })
      onCreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create workflow')
    } finally {
      setSubmitting(false)
    }
  }

  // ---- Type picker step ----
  if (wizardStep === 'pick-type') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />
        <div className="relative bg-[var(--color-bg)] border border-[var(--color-border-subtle)] rounded-lg shadow-xl w-full max-w-2xl p-6">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-lg font-bold">New Workflow</h2>
            <button onClick={onClose} className="text-[var(--color-muted)] hover:text-[var(--color-text)]">
              <X size={18} />
            </button>
          </div>
          <p className="text-sm text-[var(--color-muted)] mb-6">What kind of workflow are you building?</p>

          <div className="space-y-3">
            {TYPE_OPTIONS.map((opt) => {
              const IconComponent = opt.icon
              const isSelected = type === opt.value
              return (
                <button
                  key={opt.value}
                  onClick={() => {
                    setType(opt.value)
                    setWizardStep('form')
                  }}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    isSelected
                      ? opt.color
                      : 'border-[var(--color-border-subtle)] hover:border-[var(--color-accent)]/50 hover:bg-[var(--color-surface-raised)]'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${isSelected ? opt.color : 'bg-[var(--color-surface-raised)]'}`}>
                      <IconComponent size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-bold">{opt.label}</p>
                        <ArrowRight size={16} className="text-[var(--color-muted)]" />
                      </div>
                      <p className="text-sm text-[var(--color-muted)] mb-2">{opt.description}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        {opt.bestFor.map((b) => (
                          <span key={b} className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-bg)] border border-[var(--color-border-subtle)]">
                            {b}
                          </span>
                        ))}
                      </div>
                      <code className="mt-2 inline-block text-xs font-[var(--font-mono)] text-[var(--color-muted)]">
                        e.g. {opt.example}
                      </code>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  // ---- Form step ----
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-[var(--color-bg)] border border-[var(--color-border-subtle)] rounded-lg shadow-xl w-full max-w-2xl p-6 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setWizardStep('pick-type')}
              className="text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors"
              title="Back to type selection"
            >
              ←
            </button>
            <h2 className="text-lg font-bold">
              New {type === 'step-based' ? 'Step-based' : type === 'agent-based' ? 'Agent-based' : 'Composite'} Workflow
            </h2>
          </div>
          <button onClick={onClose} className="text-[var(--color-muted)] hover:text-[var(--color-text)]">
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-4 bg-[var(--color-surface-raised)] rounded-md p-0.5 self-start">
          <button
            onClick={() => setTab('create')}
            className={`px-3 py-1.5 text-sm rounded min-h-[32px] transition-colors ${
              tab === 'create'
                ? 'bg-[var(--color-bg)] text-[var(--color-text)] font-bold shadow-sm'
                : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
            }`}
          >
            Create
          </button>
          <button
            onClick={() => setTab('import')}
            className={`px-3 py-1.5 text-sm rounded min-h-[32px] transition-colors ${
              tab === 'import'
                ? 'bg-[var(--color-bg)] text-[var(--color-text)] font-bold shadow-sm'
                : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
            }`}
          >
            Import
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto flex-1 pr-1">
          {tab === 'import' ? (
            <>
              <div>
                <label className="block text-sm font-bold mb-1">Upload workflow file</label>
                <label className="flex items-center justify-center gap-2 w-full px-4 py-6 border-2 border-dashed border-[var(--color-border-subtle)] rounded-lg cursor-pointer hover:border-[var(--color-accent)] transition-colors">
                  <Upload size={16} className="text-[var(--color-muted)]" />
                  <span className="text-sm text-[var(--color-muted)]">Click to upload a .md workflow file</span>
                  <input type="file" accept=".md" onChange={handleFileImport} className="hidden" />
                </label>
              </div>
              <p className="text-xs text-[var(--color-muted)]">
                Uploading will parse the file and switch to the Create tab with fields pre-populated. The workflow type is auto-detected from frontmatter.
              </p>
            </>
          ) : !showPreview ? (
            <>
              {/* Name */}
              <div>
                <label className="block text-xs font-bold mb-1">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={() => setNameBlurred(true)}
                  placeholder="e.g. create-product-brief"
                  className="w-full px-3 py-2 text-sm rounded-md bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)] focus:border-[var(--color-accent)] focus:outline-none"
                />
                {nameBlurred && !nameValid && (
                  <p className="text-xs text-[var(--color-error)] mt-1">Name must be kebab-case</p>
                )}
              </div>

              {/* Parent Module — above the fold per UX-DR4 */}
              <div>
                <label className="block text-xs font-bold mb-1">Parent Module</label>
                <select
                  value={moduleName}
                  onChange={(e) => setModuleName(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-md bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)] focus:border-[var(--color-accent)] focus:outline-none"
                >
                  <option value="">Select a module...</option>
                  {modules.map((m) => (
                    <option key={m.name} value={m.name}>{m.name}</option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What does this workflow do?"
                  rows={2}
                  className="w-full px-3 py-2 text-sm rounded-md bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)] focus:border-[var(--color-accent)] focus:outline-none resize-none"
                />
              </div>

              {/* Phase */}
              <div>
                <label className="block text-xs font-bold mb-1">Phase (optional)</label>
                <select
                  value={phase}
                  onChange={(e) => setPhase(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-md bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)] focus:border-[var(--color-accent)] focus:outline-none"
                >
                  <option value="">No phase grouping</option>
                  {phases.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                  <option value="__custom">Custom...</option>
                </select>
                {phase === '__custom' && (
                  <input
                    type="text"
                    value={customPhase}
                    onChange={(e) => setCustomPhase(e.target.value)}
                    placeholder="e.g. 5-deployment"
                    className="w-full mt-2 px-3 py-2 text-sm rounded-md bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)] focus:border-[var(--color-accent)] focus:outline-none"
                  />
                )}
              </div>

              {/* Steps (step-based only) */}
              {type === 'step-based' && (
                <div>
                  <label className="block text-sm font-bold mb-1">
                    Initial Steps ({steps.length})
                  </label>
                  <div className="space-y-2">
                    {steps.map((step, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-xs text-[var(--color-muted)] w-6 text-right shrink-0">
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <input
                          type="text"
                          value={step.title}
                          onChange={(e) => updateStep(i, 'title', e.target.value)}
                          placeholder="Step title..."
                          className="flex-1 px-3 py-1.5 text-sm rounded-md bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)] focus:border-[var(--color-accent)] focus:outline-none"
                        />
                        <select
                          value={step.agent}
                          onChange={(e) => updateStep(i, 'agent', e.target.value)}
                          className="w-36 px-2 py-1.5 text-sm rounded-md bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)] focus:border-[var(--color-accent)] focus:outline-none"
                        >
                          <option value="">Agent...</option>
                          {agents.map((a) => (
                            <option key={a.id} value={a.name}>{a.title || a.name}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => removeStep(i)}
                          className="text-[var(--color-muted)] hover:text-[var(--color-error)] shrink-0"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={addStep}
                    className="mt-2 flex items-center gap-1.5 text-sm text-[var(--color-accent)] hover:text-[var(--color-accent-hover)]"
                  >
                    <Plus size={14} /> Add step
                  </button>
                </div>
              )}
            </>
          ) : (
            /* Preview */
            <div>
              <h3 className="text-sm font-bold mb-2">Directory Structure Preview</h3>
              <pre className="p-4 text-xs font-[var(--font-mono)] bg-[var(--color-surface-raised)] rounded-lg overflow-x-auto whitespace-pre">
                {previewLines.join('\n')}
              </pre>
            </div>
          )}

          {error && <p className="text-sm text-[var(--color-error)]">{error}</p>}
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[var(--color-border-subtle)]">
          {showPreview ? (
            <>
              <button
                onClick={() => setShowPreview(false)}
                className="px-4 py-2 text-sm rounded-md border border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-raised)] transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleCreate}
                disabled={!canSubmit || submitting}
                className="px-4 py-2 text-sm font-bold rounded-md bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                <Plus size={14} />
                {submitting ? 'Creating...' : 'Create Workflow'}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm rounded-md border border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-raised)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowPreview(true)}
                disabled={!canSubmit}
                className="px-4 py-2 text-sm font-bold rounded-md bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Preview &amp; Create
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
