import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft, GitBranch, Users, FileOutput, FileInput, FileText, FolderOpen, Layers,
  ChevronDown, ChevronRight, Pencil, ArrowRight, BookMarked, Save, Zap, Plus, Trash2,
  ChevronUp, AlertTriangle, ToggleLeft, ToggleRight, CheckCircle2, Clock, HelpCircle,
} from 'lucide-react'

import { WORKFLOW_TYPE_DEFINITIONS } from '@bmad-studio/shared'
import type { WorkflowStep, WorkflowHooks, HookEntry } from '@bmad-studio/shared'

import { useWorkflowDetail, useWorkflowStatus } from './use-workflows.js'
import type { WorkflowStatusResult } from './use-workflows.js'
import { WorkflowTypeBadge } from './WorkflowsPage.js'
import { HOOK_PRESETS, PRESET_CATEGORIES, resolvePreset } from './hook-presets.js'
import type { HookPreset } from './hook-presets.js'
import { EditWorkflowDialog } from './EditWorkflowDialog.js'
import { MarkdownEditor } from '../../shared/markdown-editor/MarkdownEditor.js'
import { CodeMirrorEditor } from '../../shared/markdown-editor/CodeMirrorEditor.js'
import { useWorkflowCustomize, useUpdateWorkflowCustomize } from './use-workflow-customize.js'
import { useNotifications } from '../../layout/NotificationProvider.js'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function extractRelativePath(filePath: string): string {
  const bmadIndex = filePath.lastIndexOf('/_bmad/')
  return bmadIndex >= 0 ? filePath.slice(bmadIndex + 7) : filePath
}

function dirName(fullPath: string): string {
  const parts = fullPath.replace(/\/$/, '').split('/')
  return parts[parts.length - 1] ?? fullPath
}

const VARIANT_TAB_LABELS: Record<string, string> = {
  'steps-c': 'Conditional',
  'steps-e': 'Editorial',
  'steps-v': 'Validation',
}

function variantTabLabel(variantSet?: string): string {
  if (!variantSet) return 'Primary'
  return (
    VARIANT_TAB_LABELS[variantSet] ??
    variantSet
      .replace(/^steps-/, '')
      .replace(/-steps$/, '')
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')
  )
}

type StepGroup = { key: string; label: string; steps: Array<WorkflowStep & { globalIndex: number }> }

function groupStepsByVariant(steps: WorkflowStep[]): StepGroup[] {
  const groups = new Map<string, StepGroup>()
  steps.forEach((step, globalIndex) => {
    const key = step.variantSet ?? '__primary'
    if (!groups.has(key)) {
      groups.set(key, { key, label: variantTabLabel(step.variantSet), steps: [] })
    }
    groups.get(key)!.steps.push({ ...step, globalIndex })
  })
  return Array.from(groups.values()).sort((a, b) => {
    if (a.key === '__primary') return -1
    if (b.key === '__primary') return 1
    return a.key.localeCompare(b.key)
  })
}

// ---------------------------------------------------------------------------
// Status chip
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<
  Exclude<WorkflowStatusResult['status'], undefined>,
  { label: string; icon: typeof CheckCircle2; color: string }
> = {
  ready: { label: 'Ready', icon: CheckCircle2, color: 'text-[var(--color-success)]' },
  blocked: { label: 'Blocked', icon: AlertTriangle, color: 'text-amber-400' },
  'already-run': { label: 'Already Run', icon: Clock, color: 'text-[var(--color-muted)]' },
  unknown: { label: 'Unknown', icon: HelpCircle, color: 'text-[var(--color-muted)]' },
}

function StatusChip({ status }: { status: WorkflowStatusResult['status'] | undefined }) {
  if (!status) return null
  const cfg = STATUS_CONFIG[status]
  const Icon = cfg.icon
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border shrink-0 ${cfg.color} border-current/20 bg-current/5`}
    >
      <Icon size={11} />
      {cfg.label}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Preset picker
// ---------------------------------------------------------------------------

function PresetPicker({
  hookKey: _hookKey,
  onAdd,
  onClose,
}: {
  hookKey: keyof WorkflowHooks
  onAdd: (command: string) => void
  onClose: () => void
}) {
  const [selected, setSelected] = useState<HookPreset | null>(null)
  const [vars, setVars] = useState<Record<string, string>>({})

  const presets = HOOK_PRESETS.slice().sort((a, b) => {
    if (a.category === 'custom') return 1
    if (b.category === 'custom') return -1
    return 0
  })

  const categories = Array.from(new Set(presets.map((p) => p.category)))

  function selectPreset(preset: HookPreset) {
    setSelected(preset)
    const initial: Record<string, string> = {}
    preset.variables.forEach((v) => { initial[v.key] = '' })
    setVars(initial)
  }

  function handleConfirm() {
    if (!selected) return
    onAdd(resolvePreset(selected, vars))
    onClose()
  }

  const allFilled = selected ? selected.variables.every((v) => vars[v.key]?.trim()) : false

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-[var(--color-bg)] rounded-xl border border-[var(--color-border-subtle)] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--color-border-subtle)]">
          <div className="flex items-center gap-2">
            <Zap size={14} className="text-[var(--color-accent)]" />
            <span className="text-sm font-bold">Add from template</span>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="flex" style={{ minHeight: 300 }}>
          {/* Preset list */}
          <div
            className="w-56 shrink-0 border-r border-[var(--color-border-subtle)] overflow-y-auto"
            style={{ maxHeight: 420 }}
          >
            {categories.map((cat) => (
              <div key={cat}>
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)] bg-[var(--color-surface-raised)] sticky top-0">
                  {PRESET_CATEGORIES[cat]}
                </div>
                {presets
                  .filter((p) => p.category === cat)
                  .map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => selectPreset(preset)}
                      className={`w-full text-left px-3 py-2.5 transition-colors border-b border-[var(--color-border-subtle)]/50 ${
                        selected?.id === preset.id
                          ? 'bg-[var(--color-accent)]/10 text-[var(--color-accent)]'
                          : 'hover:bg-[var(--color-surface-raised)] text-[var(--color-text)]'
                      }`}
                    >
                      <p className="text-xs font-bold">{preset.label}</p>
                      <p className="text-[10px] text-[var(--color-muted)] mt-0.5 leading-tight">
                        {preset.description}
                      </p>
                    </button>
                  ))}
              </div>
            ))}
          </div>

          {/* Variable form */}
          <div className="flex-1 p-5 overflow-y-auto" style={{ maxHeight: 420 }}>
            {!selected ? (
              <p className="text-sm text-[var(--color-muted)] text-center mt-8">
                Select a template to configure it.
              </p>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-bold mb-0.5">{selected.label}</p>
                  <p className="text-[10px] text-[var(--color-muted)]">{selected.description}</p>
                  <p className="text-[10px] text-[var(--color-muted)] mt-1">
                    Adds to:{' '}
                    <span className="font-bold">
                      {selected.label}
                    </span>
                  </p>
                </div>

                {selected.variables.map((v) => (
                  <div key={v.key}>
                    <label className="text-[11px] font-bold block mb-1">{v.label}</label>
                    {v.description && (
                      <p className="text-[10px] text-[var(--color-muted)] mb-1">{v.description}</p>
                    )}
                    <input
                      value={vars[v.key] ?? ''}
                      onChange={(e) => setVars((prev) => ({ ...prev, [v.key]: e.target.value }))}
                      placeholder={v.placeholder}
                      className="w-full text-xs font-[var(--font-mono)] bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)] rounded px-2.5 py-1.5 focus:outline-none focus:border-[var(--color-accent)]"
                    />
                  </div>
                ))}

                {selected.variables.length > 0 && (
                  <div>
                    <p className="text-[10px] text-[var(--color-muted)] mb-1">Preview</p>
                    <code className="block text-[10px] font-[var(--font-mono)] bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)] rounded p-2 text-[var(--color-accent)] break-all whitespace-pre-wrap">
                      {resolvePreset(selected, vars) || '…'}
                    </code>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 px-5 py-3.5 border-t border-[var(--color-border-subtle)]">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs rounded-md border border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-raised)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selected || !allFilled}
            className="px-3 py-1.5 text-xs font-bold rounded-md bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Add command
          </button>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Hooks panel
// ---------------------------------------------------------------------------

const HOOK_SUBSECTIONS: Array<{
  key: keyof WorkflowHooks
  label: string
  when: string
}> = [
  {
    key: 'activationStepsPrepend',
    label: 'Before activation',
    when: 'Runs before the workflow instructions are loaded into the agent',
  },
  {
    key: 'activationStepsAppend',
    label: 'After activation',
    when: 'Runs after the workflow loads, before the first user interaction',
  },
  {
    key: 'onComplete',
    label: 'On complete',
    when: 'Runs when the workflow signals completion',
  },
]

const SHELL_META_RE = /(?<!['""])([&|;`]|\$\()/

function HooksPanel({
  workflowId,
  initialHooks,
  isV65,
}: {
  workflowId: string
  initialHooks: WorkflowHooks | undefined
  isV65: boolean
}) {
  const emptyHooks = (): WorkflowHooks => ({
    activationStepsPrepend: [],
    activationStepsAppend: [],
    onComplete: [],
  })

  const [hooks, setHooks] = useState<WorkflowHooks>(initialHooks ?? emptyHooks())
  const [addingTo, setAddingTo] = useState<keyof WorkflowHooks | null>(null)
  const [newCmd, setNewCmd] = useState('')
  const [cmdError, setCmdError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [presetKey, setPresetKey] = useState<keyof WorkflowHooks | null>(null)
  const addInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setHooks(initialHooks ?? emptyHooks())
  }, [workflowId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (addingTo) setTimeout(() => addInputRef.current?.focus(), 50)
  }, [addingTo])

  async function save(updated: WorkflowHooks) {
    setSaving(true)
    setSaveError(null)
    try {
      const resp = await fetch(`/api/workflows/${workflowId}/hooks`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      })
      if (!resp.ok) {
        const data = (await resp.json()) as { error?: { message?: string } }
        throw new Error(data.error?.message ?? 'Failed to save hooks')
      }
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save')
      setHooks(hooks) // revert optimistic update
    } finally {
      setSaving(false)
    }
  }

  function update(key: keyof WorkflowHooks, entries: HookEntry[]) {
    const updated = { ...hooks, [key]: entries }
    setHooks(updated)
    void save(updated)
  }

  function handleAdd(key: keyof WorkflowHooks) {
    const cmd = newCmd.trim()
    if (!cmd) { setCmdError('Command cannot be empty'); return }
    setNewCmd('')
    setCmdError(null)
    setAddingTo(null)
    update(key, [...hooks[key], { command: cmd }])
  }

  function handleToggle(key: keyof WorkflowHooks, idx: number) {
    const entries = hooks[key].map((e, i) =>
      i === idx ? { ...e, disabled: !e.disabled } : e,
    )
    update(key, entries)
  }

  function handleDelete(key: keyof WorkflowHooks, idx: number) {
    update(key, hooks[key].filter((_, i) => i !== idx))
  }

  function handleMove(key: keyof WorkflowHooks, idx: number, dir: -1 | 1) {
    const entries = [...hooks[key]]
    const target = idx + dir
    if (target < 0 || target >= entries.length) return
    ;[entries[idx], entries[target]] = [entries[target], entries[idx]]
    update(key, entries)
  }

  if (!isV65) return null

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Zap size={16} className="text-[var(--color-accent)]" />
        <h2 className="text-lg font-bold">Workflow Hooks</h2>
        {saving && <span className="text-xs text-[var(--color-muted)] ml-auto">Saving…</span>}
      </div>
      <p className="text-sm text-[var(--color-muted)] mb-4">
        Shell commands Studio runs automatically at key moments in this workflow's lifecycle.
      </p>

      {saveError && (
        <div className="mb-3 flex items-center gap-2 text-xs text-[var(--color-error)] bg-[var(--color-error)]/10 rounded-md px-3 py-2">
          <AlertTriangle size={12} />
          {saveError}
        </div>
      )}

      {presetKey && (
        <PresetPicker
          hookKey={presetKey}
          onAdd={(cmd) => update(presetKey, [...hooks[presetKey], { command: cmd }])}
          onClose={() => setPresetKey(null)}
        />
      )}

      <div className="space-y-4">
        {HOOK_SUBSECTIONS.map(({ key, label, when }) => {
          const entries = hooks[key]
          const isAdding = addingTo === key

          return (
            <div
              key={key}
              className="rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)] overflow-hidden"
            >
              <div className="px-3 py-2.5 border-b border-[var(--color-border-subtle)] bg-[var(--color-bg)]">
                <p className="text-xs font-bold text-[var(--color-text)]">{label}</p>
                <p className="text-[10px] text-[var(--color-muted)] mt-0.5">{when}</p>
              </div>

              <div className="p-2 space-y-1.5">
                {entries.length === 0 && !isAdding && (
                  <p className="text-xs text-[var(--color-muted)] px-2 py-1">No commands configured</p>
                )}

                {entries.map((entry, idx) => {
                  const hasMetaChars = SHELL_META_RE.test(entry.command)
                  return (
                    <div
                      key={idx}
                      className={`flex items-center gap-2 px-2.5 py-2 rounded-md border ${
                        entry.disabled
                          ? 'opacity-50 border-[var(--color-border-subtle)]'
                          : 'border-[var(--color-border-subtle)]'
                      } bg-[var(--color-bg)]`}
                    >
                      <code
                        className="flex-1 text-xs font-[var(--font-mono)] text-[var(--color-accent)] truncate"
                        title={entry.command}
                      >
                        $ {entry.command}
                      </code>
                      {hasMetaChars && (
                        <span
                          title="Command contains shell metacharacters — ensure this is intentional"
                          className="shrink-0"
                        >
                          <AlertTriangle size={11} className="text-amber-400" />
                        </span>
                      )}
                      <button
                        onClick={() => handleToggle(key, idx)}
                        title={entry.disabled ? 'Enable' : 'Disable'}
                        className="text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors shrink-0"
                      >
                        {entry.disabled ? (
                          <ToggleLeft size={14} />
                        ) : (
                          <ToggleRight size={14} className="text-[var(--color-accent)]" />
                        )}
                      </button>
                      <div className="flex flex-col shrink-0">
                        <button
                          onClick={() => handleMove(key, idx, -1)}
                          disabled={idx === 0}
                          className="text-[var(--color-muted)] hover:text-[var(--color-text)] disabled:opacity-20 transition-colors"
                        >
                          <ChevronUp size={11} />
                        </button>
                        <button
                          onClick={() => handleMove(key, idx, 1)}
                          disabled={idx === entries.length - 1}
                          className="text-[var(--color-muted)] hover:text-[var(--color-text)] disabled:opacity-20 transition-colors"
                        >
                          <ChevronDown size={11} />
                        </button>
                      </div>
                      <button
                        onClick={() => handleDelete(key, idx)}
                        title="Remove"
                        className="text-[var(--color-muted)] hover:text-[var(--color-error)] transition-colors shrink-0"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )
                })}

                {isAdding ? (
                  <div className="flex items-center gap-2 px-2 py-1">
                    <code className="text-xs text-[var(--color-muted)] font-[var(--font-mono)]">$</code>
                    <input
                      ref={addInputRef}
                      value={newCmd}
                      onChange={(e) => {
                        setNewCmd(e.target.value)
                        setCmdError(null)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAdd(key)
                        if (e.key === 'Escape') {
                          setAddingTo(null)
                          setNewCmd('')
                          setCmdError(null)
                        }
                      }}
                      placeholder="shell command…"
                      className="flex-1 text-xs font-[var(--font-mono)] bg-[var(--color-surface-raised)] border border-[var(--color-accent)] rounded px-2 py-1 focus:outline-none"
                    />
                    <button
                      onClick={() => handleAdd(key)}
                      className="text-xs font-bold text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] shrink-0"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => {
                        setAddingTo(null)
                        setNewCmd('')
                        setCmdError(null)
                      }}
                      className="text-xs text-[var(--color-muted)] shrink-0"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setAddingTo(key)}
                      className="flex items-center gap-1.5 text-xs text-[var(--color-muted)] hover:text-[var(--color-accent)] transition-colors px-2 py-1"
                    >
                      <Plus size={11} />
                      Add command
                    </button>
                    <span className="text-[var(--color-border-subtle)]">·</span>
                    <button
                      onClick={() => setPresetKey(key)}
                      className="flex items-center gap-1.5 text-xs text-[var(--color-muted)] hover:text-[var(--color-accent)] transition-colors px-2 py-1"
                    >
                      <Zap size={11} />
                      Use template
                    </button>
                  </div>
                )}

                {cmdError && addingTo === key && (
                  <p className="text-[10px] text-[var(--color-error)] px-2">{cmdError}</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tab type
// ---------------------------------------------------------------------------

type WorkflowPageTab = 'overview' | 'sub-agents' | 'steps' | 'hooks' | 'customize'

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------

export function WorkflowDetailPage() {
  const { id } = useParams<{ id: string }>()
  const workflowId = id ?? ''
  const { notify } = useNotifications()

  const { data: workflow, isLoading, error } = useWorkflowDetail(workflowId)
  const { data: workflowStatus } = useWorkflowStatus(workflowId)

  const [activeTab, setActiveTab] = useState<WorkflowPageTab>('overview')
  const [showEdit, setShowEdit] = useState(false)

  // Step expansion state
  const [expandedStep, setExpandedStep] = useState<number | null>(null)
  const [stepContent, setStepContent] = useState<string | null>(null)
  const [stepLoading, setStepLoading] = useState(false)
  const [activeVariantTab, setActiveVariantTab] = useState<string>('__primary')
  const stepAbortRef = useRef<AbortController | null>(null)

  // Template expansion state
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null)
  const [templateContent, setTemplateContent] = useState<string | null>(null)
  const [templateLoading, setTemplateLoading] = useState(false)
  const templateAbortRef = useRef<AbortController | null>(null)

  // Supporting files state
  const [supportingFileGroups, setSupportingFileGroups] = useState<
    Array<{ name: string; files: Array<{ name: string; relativePath: string }> }>
  >([])
  const [expandedSupportingFile, setExpandedSupportingFile] = useState<string | null>(null)
  const [supportingFileContent, setSupportingFileContent] = useState<string | null>(null)
  const [supportingFileLoading, setSupportingFileLoading] = useState(false)
  const supportingFileAbortRef = useRef<AbortController | null>(null)

  // Customize TOML state
  const { data: customizeData, error: customizeError, isLoading: customizeLoading } =
    useWorkflowCustomize(workflowId)
  const updateCustomize = useUpdateWorkflowCustomize(workflowId)
  const [customizeContent, setCustomizeContent] = useState<string>('')
  const customizeLoadedRef = useRef(false)

  const isNotV65 =
    customizeError && (customizeError as Error & { isNotV65?: boolean }).isNotV65 === true

  // Sync editor content when customize data first loads
  useEffect(() => {
    if (customizeData && !customizeLoadedRef.current) {
      setCustomizeContent(customizeData.raw)
      customizeLoadedRef.current = true
    }
  }, [customizeData])

  // Reset when workflowId changes
  useEffect(() => {
    customizeLoadedRef.current = false
    setCustomizeContent('')
    setActiveTab('overview')
    setExpandedStep(null)
    setStepContent(null)
    setExpandedTemplate(null)
    setTemplateContent(null)
    setActiveVariantTab('__primary')
  }, [workflowId])

  // Fetch supporting files for agent-based workflows
  useEffect(() => {
    if (!workflow || workflow.type !== 'agent-based') {
      setSupportingFileGroups([])
      return
    }
    fetch(`/api/workflows/${workflowId}/supporting-files`)
      .then((r) => r.json())
      .then((data: { groups: typeof supportingFileGroups }) => setSupportingFileGroups(data.groups))
      .catch(() => setSupportingFileGroups([]))
  }, [workflow, workflowId])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stepAbortRef.current?.abort()
      templateAbortRef.current?.abort()
      supportingFileAbortRef.current?.abort()
    }
  }, [])

  async function handleCustomizeSave() {
    try {
      await updateCustomize.mutateAsync(customizeContent)
      notify('success', 'customize.toml saved')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save'
      notify('error', msg)
    }
  }

  const stepGroups = useMemo(() => {
    if (!workflow) return []
    return groupStepsByVariant(workflow.steps)
  }, [workflow])

  const activeGroup = useMemo(() => {
    return stepGroups.find((g) => g.key === activeVariantTab) ?? stepGroups[0]
  }, [stepGroups, activeVariantTab])

  // Agent sequence (unique agents in order of first appearance)
  const agentSequence = useMemo(() => {
    if (!workflow) return []
    const seen = new Set<string>()
    const agents: string[] = []
    for (const step of workflow.steps) {
      if (step.agent && !seen.has(step.agent)) {
        seen.add(step.agent)
        agents.push(step.agent)
      }
    }
    return agents
  }, [workflow])

  // Aggregated inputs/outputs from steps (fallback)
  const { allInputs, allOutputs } = useMemo(() => {
    if (!workflow) return { allInputs: [], allOutputs: [] }
    const inputs = new Set<string>()
    const outputs = new Set<string>()
    for (const step of workflow.steps) {
      step.inputs?.forEach((i) => inputs.add(i))
      step.outputs?.forEach((o) => outputs.add(o))
    }
    return { allInputs: Array.from(inputs), allOutputs: Array.from(outputs) }
  }, [workflow])

  const isReference = workflow?.module === 'bmm' || workflow?.module === 'bmb'

  const handleStepClick = useCallback(
    async (globalIndex: number) => {
      if (expandedStep === globalIndex) {
        setExpandedStep(null)
        setStepContent(null)
        return
      }
      stepAbortRef.current?.abort()
      const controller = new AbortController()
      stepAbortRef.current = controller

      setExpandedStep(globalIndex)
      setStepContent(null)
      setStepLoading(true)
      try {
        const resp = await fetch(`/api/workflows/${workflowId}/steps/${globalIndex}`, {
          signal: controller.signal,
        })
        if (resp.ok) {
          const data = (await resp.json()) as { content: string }
          setStepContent(data.content)
        } else {
          setStepContent('Could not load step instructions.')
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return
        setStepContent('Failed to load step instructions.')
      } finally {
        if (!controller.signal.aborted) setStepLoading(false)
      }
    },
    [expandedStep, workflowId],
  )

  const handleTemplateClick = useCallback(
    async (filePath: string) => {
      if (expandedTemplate === filePath) {
        setExpandedTemplate(null)
        setTemplateContent(null)
        return
      }
      templateAbortRef.current?.abort()
      const controller = new AbortController()
      templateAbortRef.current = controller

      setExpandedTemplate(filePath)
      setTemplateContent(null)
      setTemplateLoading(true)
      try {
        const relativePath = extractRelativePath(filePath)
        const resp = await fetch(`/api/files/${relativePath}`, { signal: controller.signal })
        if (resp.ok) {
          const data = (await resp.json()) as { content: string }
          setTemplateContent(data.content)
        } else {
          setTemplateContent('Could not load template.')
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return
        setTemplateContent('Failed to load template.')
      } finally {
        if (!controller.signal.aborted) setTemplateLoading(false)
      }
    },
    [expandedTemplate],
  )

  const handleSupportingFileClick = useCallback(
    async (relativePath: string) => {
      if (expandedSupportingFile === relativePath) {
        setExpandedSupportingFile(null)
        setSupportingFileContent(null)
        return
      }
      supportingFileAbortRef.current?.abort()
      const controller = new AbortController()
      supportingFileAbortRef.current = controller

      setExpandedSupportingFile(relativePath)
      setSupportingFileContent(null)
      if (relativePath.endsWith('.md')) {
        setSupportingFileLoading(true)
        try {
          const resp = await fetch(`/api/files/${relativePath}`, { signal: controller.signal })
          if (resp.ok) {
            const data = (await resp.json()) as { content: string }
            setSupportingFileContent(data.content)
          } else {
            setSupportingFileContent('Could not load file.')
          }
        } catch (err) {
          if (err instanceof Error && err.name === 'AbortError') return
          setSupportingFileContent('Failed to load file.')
        } finally {
          if (!controller.signal.aborted) setSupportingFileLoading(false)
        }
      }
    },
    [expandedSupportingFile],
  )

  // ---------------------------------------------------------------------------
  // Loading / error states
  // ---------------------------------------------------------------------------

  if (isLoading) {
    return (
      <div className="max-w-4xl space-y-4">
        <div className="h-5 w-32 rounded bg-[var(--color-surface-raised)] animate-pulse" />
        <div className="h-10 w-2/3 rounded bg-[var(--color-surface-raised)] animate-pulse" />
        <div className="h-40 rounded-lg bg-[var(--color-surface-raised)] animate-pulse" />
      </div>
    )
  }

  if (error || !workflow) {
    return (
      <div className="max-w-4xl">
        <Link
          to="/workflows"
          className="flex items-center gap-1 text-sm text-[var(--color-muted)] mb-4 hover:text-[var(--color-text)]"
        >
          <ArrowLeft size={16} /> Back to Workflows
        </Link>
        <p className="text-[var(--color-error)]">
          {error ? `Failed to load workflow: ${(error as Error).message}` : 'Workflow not found'}
        </p>
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // Tabs to render
  // ---------------------------------------------------------------------------

  const tabs: Array<{ key: WorkflowPageTab; label: string }> = [
    { key: 'overview', label: 'Overview' },
    { key: 'sub-agents', label: 'Sub-Agents' },
    { key: 'steps', label: 'Steps' },
    { key: 'hooks', label: 'Hooks' },
    ...(!isNotV65 ? [{ key: 'customize' as WorkflowPageTab, label: 'Customize' }] : []),
  ]

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="max-w-4xl">
      {/* Back link */}
      <Link
        to="/workflows"
        className="flex items-center gap-1 text-sm text-[var(--color-muted)] mb-4 hover:text-[var(--color-text)]"
      >
        <ArrowLeft size={16} /> Back to Workflows
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start gap-4 mb-3">
          {/* Icon / fallback */}
          <span className="w-12 h-12 rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)] flex items-center justify-center shrink-0">
            <GitBranch size={22} className="text-[var(--color-muted)]" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3 flex-wrap mb-1">
              <h1 className="text-2xl font-extrabold truncate">{workflow.name}</h1>
              <WorkflowTypeBadge type={workflow.type} />
            </div>
            {workflow.description && (
              <p className="text-sm text-[var(--color-muted)]">{workflow.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <StatusChip status={workflowStatus?.status} />
          <button
            onClick={() => setShowEdit(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold rounded-md border border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-raised)] hover:border-[var(--color-accent)] transition-colors"
          >
            <Pencil size={13} />
            Edit
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-8 bg-[var(--color-surface-raised)] rounded-md p-1 border border-[var(--color-border-subtle)]">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-1.5 text-sm rounded transition-colors ${
              activeTab === tab.key
                ? 'bg-[var(--color-bg)] text-[var(--color-text)] font-bold shadow-sm'
                : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* OVERVIEW TAB                                                        */}
      {/* ------------------------------------------------------------------ */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Module / phase / identity chips */}
          {(workflow.module || workflow.phase) && (
            <div className="flex items-center gap-2 flex-wrap">
              {workflow.module && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)]">
                  {workflow.module}
                </span>
              )}
              {workflow.phase && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)] text-[var(--color-muted)]">
                  {workflow.phase}
                </span>
              )}
              {workflow.module && (
                <code
                  className="text-[10px] font-[var(--font-mono)] text-[var(--color-muted)]"
                  title="Namespaced identity"
                >
                  {workflow.module}/{workflow.id}
                </code>
              )}
            </div>
          )}

          {/* Reference implementation callout */}
          {isReference && (
            <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-4">
              <div className="flex items-center gap-2 mb-1">
                <BookMarked size={14} className="text-amber-400 shrink-0" />
                <span className="text-xs font-bold text-amber-400">BMAD Reference Implementation</span>
              </div>
              <p className="text-xs text-[var(--color-muted)]">
                This workflow is part of the canonical BMAD methodology (
                {workflow.module?.toUpperCase()}). It&rsquo;s a production-quality reference — read it
                to understand how BMAD structures complex workflows before building your own.
              </p>
            </div>
          )}

          {/* Agent sequence */}
          {agentSequence.length > 1 && (
            <section>
              <h2 className="text-lg font-bold mb-3">Agent Sequence</h2>
              <div className="bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)] rounded-lg p-4">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {agentSequence.map((agent, i) => (
                    <div key={agent} className="flex items-center gap-1.5">
                      {i > 0 && <ArrowRight size={11} className="text-[var(--color-muted)] shrink-0" />}
                      <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-[var(--color-bg)] border border-[var(--color-border-subtle)] text-[var(--color-accent)]">
                        <Users size={10} />
                        {agent}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* I/O table */}
          {workflowStatus && (workflowStatus.inputs.length > 0 || workflowStatus.outputs.length > 0) ? (
            <section>
              <h2 className="text-lg font-bold mb-3">Inputs / Outputs</h2>
              <div className="bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)] rounded-lg p-4 space-y-4">
                {workflowStatus.inputs.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)] mb-2 flex items-center gap-1">
                      <FileInput size={10} /> Required inputs
                    </p>
                    <div className="space-y-2">
                      {(workflowStatus.inputs as WorkflowStatusResult['inputs']).map((inp) => {
                        const statusColor =
                          inp.status === 'present'
                            ? 'text-[var(--color-success)]'
                            : inp.status === 'thin'
                            ? 'text-amber-400'
                            : 'text-[var(--color-error)]'
                        const statusLabel =
                          inp.status === 'present'
                            ? 'Present'
                            : inp.status === 'thin'
                            ? 'Thin'
                            : 'Missing'
                        return (
                          <div
                            key={inp.id}
                            className="flex items-start gap-2 px-2 py-2 rounded-md bg-[var(--color-bg)] border border-[var(--color-border-subtle)]"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <code className="text-xs font-[var(--font-mono)] text-[var(--color-accent)]">
                                  {inp.id}
                                </code>
                                <span className={`text-[10px] font-bold ${statusColor}`}>
                                  {statusLabel}
                                </span>
                                {!inp.required && (
                                  <span className="text-[10px] text-[var(--color-muted)]">optional</span>
                                )}
                              </div>
                              {inp.description && (
                                <p className="text-[10px] text-[var(--color-muted)] mt-0.5">
                                  {inp.description}
                                </p>
                              )}
                              {inp.qualityNotes?.map((n) => (
                                <p key={n} className="text-[10px] text-amber-400 mt-0.5">
                                  {n}
                                </p>
                              ))}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {workflowStatus.outputs.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)] mb-2 flex items-center gap-1">
                      <FileOutput size={10} /> Outputs
                    </p>
                    <div className="space-y-2">
                      {(workflowStatus.outputs as WorkflowStatusResult['outputs']).map((out) => (
                        <div
                          key={out.id}
                          className="flex items-start gap-2 px-2 py-2 rounded-md bg-[var(--color-bg)] border border-[var(--color-border-subtle)]"
                        >
                          <div className="flex-1 min-w-0">
                            <code className="text-xs font-[var(--font-mono)] text-[var(--color-accent)]">
                              {out.id}
                            </code>
                            {out.description && (
                              <p className="text-[10px] text-[var(--color-muted)] mt-0.5">
                                {out.description}
                              </p>
                            )}
                            {out.files.length > 0 ? (
                              <div className="mt-1 space-y-0.5">
                                {out.files.map((f) => (
                                  <p
                                    key={f.path}
                                    className="text-[10px] text-[var(--color-success)] font-[var(--font-mono)] truncate"
                                  >
                                    {f.path.split('/').slice(-2).join('/')}
                                  </p>
                                ))}
                              </div>
                            ) : (
                              <p className="text-[10px] text-[var(--color-muted)] mt-0.5">None yet</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>
          ) : (allInputs.length > 0 || allOutputs.length > 0) ? (
            <section>
              <h2 className="text-lg font-bold mb-3">Inputs / Outputs</h2>
              <div className="bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)] rounded-lg p-4 space-y-2">
                {allInputs.length > 0 && (
                  <div className="flex items-start gap-2">
                    <FileInput size={13} className="text-[var(--color-muted)] mt-0.5 shrink-0" />
                    <div className="flex flex-wrap gap-1">
                      {allInputs.map((item) => (
                        <span
                          key={item}
                          className="text-[11px] px-1.5 py-0.5 rounded bg-[var(--color-bg)] border border-[var(--color-border-subtle)] text-[var(--color-muted)]"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {allOutputs.length > 0 && (
                  <div className="flex items-start gap-2">
                    <FileOutput size={13} className="text-[var(--color-success)] mt-0.5 shrink-0" />
                    <div className="flex flex-wrap gap-1">
                      {allOutputs.map((item) => (
                        <span
                          key={item}
                          className="text-[11px] px-1.5 py-0.5 rounded bg-[var(--color-bg)] border border-[var(--color-border-subtle)] text-[var(--color-success)]"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>
          ) : null}

          {/* Workflow type */}
          {workflow.type && (
            <section>
              <h2 className="text-lg font-bold mb-3">Workflow Type</h2>
              <div className="bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)] rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <WorkflowTypeBadge type={workflow.type} />
                </div>
                <p className="text-sm text-[var(--color-muted)]">
                  {WORKFLOW_TYPE_DEFINITIONS[workflow.type].description}
                </p>
              </div>
            </section>
          )}

          {/* How to invoke */}
          <section>
            <h2 className="text-lg font-bold mb-3">How to Invoke</h2>
            <div className="bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)] rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <code className="text-sm font-[var(--font-mono)] bg-[var(--color-bg)] border border-[var(--color-border-subtle)] px-2 py-1 rounded text-[var(--color-accent)]">
                  /{workflow.entryPoint ?? workflow.id}
                </code>
                <span className="text-xs text-[var(--color-muted)]">
                  in Claude Code or your configured IDE
                </span>
              </div>
              <p className="text-xs text-[var(--color-muted)]">
                Run this command in your IDE to start the workflow. The agent will guide you through each
                step.
              </p>
            </div>
          </section>

          {/* Sub-Workflows */}
          {workflow.subWorkflows && workflow.subWorkflows.length > 0 && (
            <section>
              <h2 className="text-lg font-bold mb-3">
                Sub-Workflows ({workflow.subWorkflows.length})
              </h2>
              <div className="space-y-1">
                {workflow.subWorkflows.map((sw) => (
                  <div
                    key={sw.filePath}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)]"
                  >
                    <Layers size={14} className="text-[var(--color-muted)]" />
                    <span className="text-sm">{sw.name}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Supporting files (non-agent-based) */}
          {workflow.type !== 'agent-based' &&
            workflow.supportingFiles &&
            workflow.supportingFiles.length > 0 && (
              <section>
                <h2 className="text-lg font-bold mb-3">Supporting Files</h2>
                <div className="space-y-1">
                  {workflow.supportingFiles.map((dir) => (
                    <div
                      key={dir}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)]"
                    >
                      <FolderOpen size={14} className="text-[var(--color-muted)]" />
                      <span className="text-sm">{dirName(dir)}/</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

          {/* Downstream consumers */}
          {workflowStatus?.downstream && workflowStatus.downstream.length > 0 && (
            <section>
              <h2 className="text-lg font-bold mb-3">
                Downstream Consumers ({workflowStatus.downstream.length})
              </h2>
              <p className="text-sm text-[var(--color-muted)] mb-2">
                Workflows that use this workflow&rsquo;s outputs as inputs.
              </p>
              <div className="space-y-1">
                {(workflowStatus.downstream as WorkflowStatusResult['downstream'])!.map((d) => (
                  <div
                    key={d.id}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)]"
                  >
                    <GitBranch size={13} className="text-[var(--color-muted)] shrink-0" />
                    <span className="text-sm flex-1">{d.name}</span>
                    {d.module && (
                      <span className="text-[10px] text-[var(--color-muted)] px-1.5 py-0.5 rounded-full bg-[var(--color-bg)] border border-[var(--color-border-subtle)]">
                        {d.module}
                      </span>
                    )}
                    <span className="text-[10px] text-[var(--color-muted)] font-[var(--font-mono)]">
                      via {d.inputId}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* File path */}
          <div className="flex items-center gap-2 text-xs text-[var(--color-muted)]">
            <GitBranch size={12} />
            <span className="font-[var(--font-mono)]">{workflow.filePath}</span>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* SUB-AGENTS TAB                                                      */}
      {/* ------------------------------------------------------------------ */}
      {activeTab === 'sub-agents' && (
        <div>
          <h2 className="text-lg font-bold mb-3">
            Sub-Agents
            {workflow.subAgents && workflow.subAgents.length > 0
              ? ` (${workflow.subAgents.length})`
              : ''}
          </h2>
          {workflow.subAgents && workflow.subAgents.length > 0 ? (
            <div className="space-y-3">
              {workflow.subAgents.map((sa) => (
                <div
                  key={sa.id}
                  className="bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)] rounded-lg p-4"
                  title={sa.filePath}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Users size={16} className="text-purple-400 shrink-0" />
                    <span className="text-sm font-bold">{sa.name}</span>
                    <span className="ml-auto text-[10px] text-[var(--color-muted)] font-[var(--font-mono)]">
                      {sa.id}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--color-muted)] mt-1 ml-6 font-mono truncate">{sa.filePath.split('/').pop()}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Users size={40} className="text-[var(--color-muted)] mb-4" />
              <p className="text-sm font-bold mb-1">No sub-agents</p>
              <p className="text-sm text-[var(--color-muted)]">
                This workflow doesn&rsquo;t define any sub-agents.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* STEPS TAB                                                           */}
      {/* ------------------------------------------------------------------ */}
      {activeTab === 'steps' && (
        <div>
          <h2 className="text-lg font-bold mb-3">Steps ({workflow.steps.length})</h2>

          {workflow.steps.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <GitBranch size={40} className="text-[var(--color-muted)] mb-4" />
              <p className="text-sm font-bold mb-1">No steps defined</p>
              <p className="text-sm text-[var(--color-muted)]">This workflow has no steps.</p>
            </div>
          ) : (
            <>
              {/* Variant tabs */}
              {stepGroups.length > 1 && (
                <div className="flex gap-1 mb-3 flex-wrap bg-[var(--color-surface-raised)] rounded-md p-1 border border-[var(--color-border-subtle)]">
                  {stepGroups.map((group) => (
                    <button
                      key={group.key}
                      onClick={() => setActiveVariantTab(group.key)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded transition-colors ${
                        activeVariantTab === group.key
                          ? 'bg-[var(--color-bg)] text-[var(--color-text)] font-bold shadow-sm'
                          : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
                      }`}
                    >
                      {group.label}
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)] font-bold">
                        {group.steps.length}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              <p className="text-xs text-[var(--color-muted)] mb-3">
                Click a step to view its instructions
              </p>
              <div className="space-y-1.5">
                {activeGroup?.steps.map((step, localIndex) => {
                  const stepNum = String(localIndex + 1).padStart(2, '0')
                  const truncatedDesc = step.description
                    ? step.description.split('\n')[0].slice(0, 120) +
                      (step.description.length > 120 ? '…' : '')
                    : null
                  return (
                    <div
                      key={step.globalIndex}
                      className={step.isVariant ? 'ml-6 pl-4 border-l-2 border-[var(--color-border-subtle)]' : ''}
                    >
                      <button
                        onClick={() => step.filePath && handleStepClick(step.globalIndex)}
                        className={`w-full text-left px-3 py-2.5 rounded-lg border transition-colors ${
                          expandedStep === step.globalIndex
                            ? 'bg-[var(--color-surface-raised)] border-[var(--color-accent)]'
                            : 'bg-[var(--color-surface-raised)] border-[var(--color-border-subtle)] hover:border-[var(--color-accent)]'
                        } ${step.filePath ? 'cursor-pointer' : ''}`}
                      >
                        <div className="flex items-center gap-2.5">
                          {step.filePath ? (
                            expandedStep === step.globalIndex ? (
                              <ChevronDown size={12} className="text-[var(--color-accent)] shrink-0" />
                            ) : (
                              <ChevronRight size={12} className="text-[var(--color-muted)] shrink-0" />
                            )
                          ) : null}
                          {step.isVariant ? (
                            <span className="text-xs text-[var(--color-muted)] shrink-0">↳</span>
                          ) : (
                            <span className="text-xs font-bold text-[var(--color-accent)] font-[var(--font-mono)] w-5 shrink-0 text-right">
                              {stepNum}
                            </span>
                          )}
                          <span
                            className={`text-sm font-bold truncate ${step.isVariant ? 'text-[var(--color-muted)]' : ''}`}
                          >
                            {step.title}
                          </span>
                          {step.agent && (
                            <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--color-bg)] border border-[var(--color-border-subtle)] text-[var(--color-accent)] font-bold shrink-0">
                              <Users size={9} />
                              {step.agent}
                            </span>
                          )}
                        </div>
                        {truncatedDesc && (
                          <p
                            className={`text-xs mt-1 ml-[calc(12px+0.625rem+1.25rem)] truncate ${
                              step.isVariant ? 'text-[var(--color-muted)]/60' : 'text-[var(--color-muted)]'
                            }`}
                          >
                            {truncatedDesc}
                          </p>
                        )}
                        {(step.inputs?.length || step.outputs?.length) && (
                          <div className="flex flex-wrap gap-1.5 mt-1.5 ml-[calc(12px+0.625rem+1.25rem)]">
                            {step.inputs?.map((input) => (
                              <span
                                key={input}
                                className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--color-bg)] border border-[var(--color-border-subtle)] text-[var(--color-muted)]"
                              >
                                <FileInput size={9} />
                                {input}
                              </span>
                            ))}
                            {step.outputs?.map((output) => (
                              <span
                                key={output}
                                className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--color-bg)] border border-[var(--color-border-subtle)] text-[var(--color-success)]"
                              >
                                <FileOutput size={9} />
                                {output}
                              </span>
                            ))}
                          </div>
                        )}
                      </button>

                      {expandedStep === step.globalIndex && (
                        <div className="mt-2 rounded-lg border border-[var(--color-border-subtle)] overflow-hidden h-72">
                          {stepLoading ? (
                            <div className="h-full bg-[var(--color-surface-raised)] animate-pulse" />
                          ) : (
                            <MarkdownEditor
                              content={stepContent ?? ''}
                              filePath={step.filePath}
                              onChange={() => {}}
                              readOnly
                            />
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Templates section within Steps tab */}
              {workflow.templates && workflow.templates.length > 0 && (
                <div className="mt-8">
                  <h2 className="text-lg font-bold mb-3">Templates ({workflow.templates.length})</h2>
                  <div className="space-y-2">
                    {workflow.templates.map((tpl) => (
                      <div key={tpl.filePath}>
                        <button
                          onClick={() => handleTemplateClick(tpl.filePath)}
                          className={`w-full flex items-center gap-2 p-3 rounded-lg border transition-colors cursor-pointer text-left ${
                            expandedTemplate === tpl.filePath
                              ? 'bg-[var(--color-surface-raised)] border-[var(--color-accent)]'
                              : 'bg-[var(--color-surface-raised)] border-[var(--color-border-subtle)] hover:border-[var(--color-accent)]'
                          }`}
                        >
                          {expandedTemplate === tpl.filePath ? (
                            <ChevronDown size={12} className="text-[var(--color-accent)]" />
                          ) : (
                            <ChevronRight size={12} className="text-[var(--color-muted)]" />
                          )}
                          <FileText size={14} className="text-[var(--color-muted)]" />
                          <span className="text-sm">{tpl.name}.template.md</span>
                        </button>
                        {expandedTemplate === tpl.filePath && (
                          <div className="mt-2 rounded-lg border border-[var(--color-border-subtle)] overflow-hidden h-48">
                            {templateLoading ? (
                              <div className="h-full bg-[var(--color-surface-raised)] animate-pulse" />
                            ) : (
                              <MarkdownEditor
                                content={templateContent ?? ''}
                                filePath={tpl.filePath}
                                onChange={() => {}}
                                readOnly
                              />
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Agent-based: supporting file groups */}
              {workflow.type === 'agent-based' && supportingFileGroups.length > 0 && (
                <div className="mt-8">
                  <h2 className="text-lg font-bold mb-3">Agents &amp; Resources</h2>
                  <div className="space-y-4">
                    {supportingFileGroups.map((group) => (
                      <div key={group.name}>
                        <div className="flex items-center gap-2 mb-2">
                          <FolderOpen size={12} className="text-[var(--color-muted)]" />
                          <span className="text-xs font-bold uppercase tracking-wide text-[var(--color-muted)]">
                            {group.name}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)] font-bold">
                            {group.files.length}
                          </span>
                        </div>
                        <div className="space-y-1">
                          {group.files.map((file) => (
                            <div key={file.relativePath}>
                              {file.name.endsWith('.md') ? (
                                <button
                                  onClick={() => handleSupportingFileClick(file.relativePath)}
                                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors cursor-pointer text-left ${
                                    expandedSupportingFile === file.relativePath
                                      ? 'bg-[var(--color-surface-raised)] border-[var(--color-accent)]'
                                      : 'bg-[var(--color-surface-raised)] border-[var(--color-border-subtle)] hover:border-[var(--color-accent)]'
                                  }`}
                                >
                                  {expandedSupportingFile === file.relativePath ? (
                                    <ChevronDown size={12} className="text-[var(--color-accent)]" />
                                  ) : (
                                    <ChevronRight size={12} className="text-[var(--color-muted)]" />
                                  )}
                                  <FileText size={14} className="text-[var(--color-muted)]" />
                                  <span className="text-sm">{file.name}</span>
                                </button>
                              ) : (
                                <Link
                                  to={`/files?path=${encodeURIComponent(file.relativePath)}`}
                                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)] hover:border-[var(--color-accent)] transition-colors"
                                >
                                  <FileText size={14} className="text-[var(--color-muted)]" />
                                  <span className="text-sm text-[var(--color-accent)] hover:underline">
                                    {file.name}
                                  </span>
                                </Link>
                              )}
                              {expandedSupportingFile === file.relativePath &&
                                file.name.endsWith('.md') && (
                                  <div className="mt-2 rounded-lg border border-[var(--color-border-subtle)] overflow-hidden h-48">
                                    {supportingFileLoading ? (
                                      <div className="h-full bg-[var(--color-surface-raised)] animate-pulse" />
                                    ) : (
                                      <MarkdownEditor
                                        content={supportingFileContent ?? ''}
                                        filePath={file.relativePath}
                                        onChange={() => {}}
                                        readOnly
                                      />
                                    )}
                                  </div>
                                )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* HOOKS TAB                                                           */}
      {/* ------------------------------------------------------------------ */}
      {activeTab === 'hooks' && (
        <div>
          {!isNotV65 ? (
            <HooksPanel
              workflowId={workflowId}
              initialHooks={workflow.hooks}
              isV65={true}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Zap size={40} className="text-[var(--color-muted)] mb-4" />
              <p className="text-sm font-bold mb-1">Hooks require v6.5</p>
              <p className="text-sm text-[var(--color-muted)]">
                Workflow hooks are a v6.5 feature. Upgrade your BMAD installation to use them.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* CUSTOMIZE TAB (v6.5 only)                                           */}
      {/* ------------------------------------------------------------------ */}
      {activeTab === 'customize' && !isNotV65 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-lg font-bold">customize.toml</h2>
              <p className="text-xs text-[var(--color-muted)] mt-0.5">
                Override <code className="font-[var(--font-mono)]">[workflow]</code> behaviour for this
                project.
              </p>
            </div>
            <button
              onClick={() => void handleCustomizeSave()}
              disabled={updateCustomize.isPending}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold rounded-md bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] disabled:opacity-50 transition-colors"
            >
              <Save size={13} />
              {updateCustomize.isPending ? 'Saving…' : 'Save'}
            </button>
          </div>
          <div
            className="rounded-lg border border-[var(--color-border-subtle)] overflow-hidden"
            style={{ height: '500px' }}
          >
            {customizeLoading ? (
              <div className="h-full bg-[var(--color-surface-raised)] animate-pulse" />
            ) : (
              <CodeMirrorEditor
                content={customizeContent}
                onChange={setCustomizeContent}
                onSave={() => void handleCustomizeSave()}
                language="plaintext"
                placeholder={'[workflow]\non_complete = ""\n'}
              />
            )}
          </div>
        </div>
      )}

      {/* Edit dialog */}
      {showEdit && (
        <EditWorkflowDialog
          workflow={workflow}
          onClose={() => setShowEdit(false)}
          onSaved={() => setShowEdit(false)}
        />
      )}
    </div>
  )
}
