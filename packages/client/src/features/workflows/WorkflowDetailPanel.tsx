import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { X, GitBranch, Users, FileOutput, FileInput, FileText, FolderOpen, Layers, ChevronDown, ChevronRight, Pencil, ArrowRight, BookMarked, Save, Zap, Plus, Trash2, ChevronUp, AlertTriangle, ToggleLeft, ToggleRight } from 'lucide-react'
import { Link } from 'react-router-dom'

import { CopyLinkButton } from '../../shared/CopyLinkButton.js'

import { WORKFLOW_TYPE_DEFINITIONS } from '@bmad-studio/shared'
import type { WorkflowStep, WorkflowHooks, HookEntry } from '@bmad-studio/shared'

import { useWorkflowDetail } from './use-workflows.js'
import { WorkflowTypeBadge } from './WorkflowsPage.js'
import { EditWorkflowDialog } from './EditWorkflowDialog.js'
import { MarkdownEditor } from '../../shared/markdown-editor/MarkdownEditor.js'
import { CodeMirrorEditor } from '../../shared/markdown-editor/CodeMirrorEditor.js'
import { useWorkflowCustomize, useUpdateWorkflowCustomize } from './use-workflow-customize.js'
import { useNotifications } from '../../layout/NotificationProvider.js'

type WorkflowDetailPanelProps = {
  workflowId: string
  onClose: () => void
}

type WorkflowTab = 'overview' | 'customize'

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
  return VARIANT_TAB_LABELS[variantSet] ?? variantSet
    .replace(/^steps-/, '')
    .replace(/-steps$/, '')
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
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
  // Primary first, then alphabetical
  return Array.from(groups.values()).sort((a, b) => {
    if (a.key === '__primary') return -1
    if (b.key === '__primary') return 1
    return a.key.localeCompare(b.key)
  })
}

// ---------------------------------------------------------------------------
// Hooks panel
// ---------------------------------------------------------------------------

const HOOK_SUBSECTIONS: Array<{
  key: keyof WorkflowHooks
  label: string
  when: string
}> = [
  { key: 'activationStepsPrepend', label: 'Before activation', when: 'Runs before the workflow instructions are loaded into the agent' },
  { key: 'activationStepsAppend', label: 'After activation', when: 'Runs after the workflow loads, before the first user interaction' },
  { key: 'onComplete', label: 'On complete', when: 'Runs when the workflow signals completion' },
]

const SHELL_META_RE = /(?<!['""])([&|;`]|\$\()/

function HooksPanel({ workflowId, initialHooks, isV65 }: {
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
    if (target < 0 || target >= entries.length) return;
    [entries[idx], entries[target]] = [entries[target], entries[idx]]
    update(key, entries)
  }

  if (!isV65) return null

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Zap size={14} className="text-[var(--color-accent)]" />
        <h3 className="text-sm font-bold">Workflow Hooks</h3>
        {saving && <span className="text-xs text-[var(--color-muted)] ml-auto">Saving…</span>}
      </div>
      <p className="text-xs text-[var(--color-muted)] mb-4">
        Shell commands Studio runs automatically at key moments in this workflow's lifecycle.
      </p>

      {saveError && (
        <div className="mb-3 flex items-center gap-2 text-xs text-[var(--color-error)] bg-[var(--color-error)]/10 rounded-md px-3 py-2">
          <AlertTriangle size={12} />
          {saveError}
        </div>
      )}

      <div className="space-y-4">
        {HOOK_SUBSECTIONS.map(({ key, label, when }) => {
          const entries = hooks[key]
          const isAdding = addingTo === key

          return (
            <div key={key} className="rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)] overflow-hidden">
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
                      className={`flex items-center gap-2 px-2.5 py-2 rounded-md border ${entry.disabled ? 'opacity-50 border-[var(--color-border-subtle)]' : 'border-[var(--color-border-subtle)]'} bg-[var(--color-bg)]`}
                    >
                      <code className="flex-1 text-xs font-[var(--font-mono)] text-[var(--color-accent)] truncate" title={entry.command}>
                        $ {entry.command}
                      </code>
                      {hasMetaChars && (
                        <span title="Command contains shell metacharacters — ensure this is intentional" className="shrink-0">
                          <AlertTriangle size={11} className="text-amber-400" />
                        </span>
                      )}
                      <button
                        onClick={() => handleToggle(key, idx)}
                        title={entry.disabled ? 'Enable' : 'Disable'}
                        className="text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors shrink-0"
                      >
                        {entry.disabled
                          ? <ToggleLeft size={14} />
                          : <ToggleRight size={14} className="text-[var(--color-accent)]" />}
                      </button>
                      <div className="flex flex-col shrink-0">
                        <button onClick={() => handleMove(key, idx, -1)} disabled={idx === 0} className="text-[var(--color-muted)] hover:text-[var(--color-text)] disabled:opacity-20 transition-colors">
                          <ChevronUp size={11} />
                        </button>
                        <button onClick={() => handleMove(key, idx, 1)} disabled={idx === entries.length - 1} className="text-[var(--color-muted)] hover:text-[var(--color-text)] disabled:opacity-20 transition-colors">
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
                      onChange={(e) => { setNewCmd(e.target.value); setCmdError(null) }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAdd(key)
                        if (e.key === 'Escape') { setAddingTo(null); setNewCmd(''); setCmdError(null) }
                      }}
                      placeholder="shell command…"
                      className="flex-1 text-xs font-[var(--font-mono)] bg-[var(--color-surface-raised)] border border-[var(--color-accent)] rounded px-2 py-1 focus:outline-none"
                    />
                    <button onClick={() => handleAdd(key)} className="text-xs font-bold text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] shrink-0">Add</button>
                    <button onClick={() => { setAddingTo(null); setNewCmd(''); setCmdError(null) }} className="text-xs text-[var(--color-muted)] shrink-0">Cancel</button>
                  </div>
                ) : (
                  <button
                    onClick={() => setAddingTo(key)}
                    className="flex items-center gap-1.5 text-xs text-[var(--color-muted)] hover:text-[var(--color-accent)] transition-colors px-2 py-1"
                  >
                    <Plus size={11} />
                    Add command
                  </button>
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

export function WorkflowDetailPanel({ workflowId, onClose }: WorkflowDetailPanelProps) {
  const { data: workflow, isLoading } = useWorkflowDetail(workflowId)
  const { notify } = useNotifications()
  const [activeTab, setActiveTab] = useState<WorkflowTab>('overview')
  const [showEdit, setShowEdit] = useState(false)
  const [expandedStep, setExpandedStep] = useState<number | null>(null)
  const [stepContent, setStepContent] = useState<string | null>(null)
  const [stepLoading, setStepLoading] = useState(false)
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null)
  const [templateContent, setTemplateContent] = useState<string | null>(null)
  const [templateLoading, setTemplateLoading] = useState(false)
  const [activeVariantTab, setActiveVariantTab] = useState<string>('__primary')
  const [supportingFileGroups, setSupportingFileGroups] = useState<Array<{ name: string; files: Array<{ name: string; relativePath: string }> }>>([])
  const [expandedSupportingFile, setExpandedSupportingFile] = useState<string | null>(null)
  const [supportingFileContent, setSupportingFileContent] = useState<string | null>(null)
  const [supportingFileLoading, setSupportingFileLoading] = useState(false)
  const stepAbortRef = useRef<AbortController | null>(null)
  const templateAbortRef = useRef<AbortController | null>(null)
  const supportingFileAbortRef = useRef<AbortController | null>(null)

  // Customize TOML state
  const { data: customizeData, error: customizeError, isLoading: customizeLoading } = useWorkflowCustomize(workflowId)
  const updateCustomize = useUpdateWorkflowCustomize(workflowId)
  const [customizeContent, setCustomizeContent] = useState<string>('')
  const customizeLoadedRef = useRef(false)

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
  }, [workflowId])

  const isNotV65 = customizeError && (customizeError as Error & { isNotV65?: boolean }).isNotV65 === true

  async function handleCustomizeSave() {
    try {
      await updateCustomize.mutateAsync(customizeContent)
      notify('success', 'customize.toml saved')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save'
      notify('error', msg)
    }
  }

  // Cancel in-flight fetches on unmount
  useEffect(() => {
    return () => {
      stepAbortRef.current?.abort()
      templateAbortRef.current?.abort()
      supportingFileAbortRef.current?.abort()
    }
  }, [])

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

  const stepGroups = useMemo(() => {
    if (!workflow) return []
    return groupStepsByVariant(workflow.steps)
  }, [workflow])

  const activeGroup = useMemo(() => {
    return stepGroups.find((g) => g.key === activeVariantTab) ?? stepGroups[0]
  }, [stepGroups, activeVariantTab])

  // Anatomy: unique agents in order of first appearance
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

  // Anatomy: aggregated unique inputs/outputs
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

  return (
    <div className="slide-over-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="slide-over-bg" onClick={onClose} />
      <aside className="slide-over-panel" style={{ width: 'max(400px, 40vw)' }}>
      <div className="px-6 py-4 border-b border-[var(--color-border-subtle)] flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <h2 className="text-lg font-bold truncate">{workflow?.name ?? 'Loading...'}</h2>
          {workflow && <WorkflowTypeBadge type={workflow.type} />}
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          <CopyLinkButton />
          {workflow && (
            <button
              onClick={() => setShowEdit(true)}
              className="text-[var(--color-muted)] hover:text-[var(--color-accent)] transition-colors"
              title="Edit Workflow"
            >
              <Pencil size={16} />
            </button>
          )}
          <button
            onClick={onClose}
            className="text-[var(--color-muted)] hover:text-[var(--color-text)]"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="p-6 space-y-3">
          <div className="h-4 w-3/4 rounded bg-[var(--color-surface-raised)] animate-pulse" />
          <div className="h-32 rounded bg-[var(--color-surface-raised)] animate-pulse" />
        </div>
      )}

      {workflow && (
        <div className="p-6 space-y-6 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 65px)' }}>

          {/* Tab bar — only show Customize tab for v6.5 projects */}
          {!isNotV65 && (
            <div className="flex gap-1 bg-[var(--color-surface-raised)] rounded-md p-1 border border-[var(--color-border-subtle)]">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-3 py-1 text-xs rounded transition-colors ${
                  activeTab === 'overview'
                    ? 'bg-[var(--color-bg)] text-[var(--color-text)] font-bold shadow-sm'
                    : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('customize')}
                className={`px-3 py-1 text-xs rounded transition-colors ${
                  activeTab === 'customize'
                    ? 'bg-[var(--color-bg)] text-[var(--color-text)] font-bold shadow-sm'
                    : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
                }`}
              >
                Customize
              </button>
            </div>
          )}

          {/* Customize tab content */}
          {activeTab === 'customize' && !isNotV65 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-bold">customize.toml</h3>
                  <p className="text-xs text-[var(--color-muted)] mt-0.5">
                    Override <code className="font-[var(--font-mono)]">[workflow]</code> behaviour for this project.
                  </p>
                </div>
                <button
                  onClick={() => void handleCustomizeSave()}
                  disabled={updateCustomize.isPending}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] disabled:opacity-50 transition-colors"
                >
                  <Save size={11} />
                  {updateCustomize.isPending ? 'Saving…' : 'Save'}
                </button>
              </div>
              <div className="rounded-lg border border-[var(--color-border-subtle)] overflow-hidden" style={{ height: '400px' }}>
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

          {/* Overview tab content */}
          {activeTab === 'overview' && (
            <>

          {workflow.description && (
            <div>
              <p className="text-sm text-[var(--color-muted)]">{workflow.description}</p>
            </div>
          )}

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
              <code className="text-[10px] font-[var(--font-mono)] text-[var(--color-muted)]" title="Namespaced identity">
                {workflow.module}/{workflow.id}
              </code>
            )}
          </div>

          {/* Reference implementation callout (bmm/bmb) */}
          {isReference && (
            <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-4">
              <div className="flex items-center gap-2 mb-1">
                <BookMarked size={14} className="text-amber-400 shrink-0" />
                <span className="text-xs font-bold text-amber-400">BMAD Reference Implementation</span>
              </div>
              <p className="text-xs text-[var(--color-muted)]">
                This workflow is part of the canonical BMAD methodology ({workflow.module?.toUpperCase()}). It&rsquo;s a production-quality reference — read it to understand how BMAD structures complex workflows before building your own.
              </p>
            </div>
          )}

          {/* Anatomy: agent sequence (agent-based) */}
          {agentSequence.length > 1 && (
            <div className="rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)] p-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)] mb-3">Agent Sequence</h3>
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
          )}

          {/* Anatomy: I/O summary */}
          {(allInputs.length > 0 || allOutputs.length > 0) && (
            <div className="rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)] p-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)] mb-3">Inputs / Outputs</h3>
              <div className="space-y-2">
                {allInputs.length > 0 && (
                  <div className="flex items-start gap-2">
                    <FileInput size={13} className="text-[var(--color-muted)] mt-0.5 shrink-0" />
                    <div className="flex flex-wrap gap-1">
                      {allInputs.map((item) => (
                        <span key={item} className="text-[11px] px-1.5 py-0.5 rounded bg-[var(--color-bg)] border border-[var(--color-border-subtle)] text-[var(--color-muted)]">{item}</span>
                      ))}
                    </div>
                  </div>
                )}
                {allOutputs.length > 0 && (
                  <div className="flex items-start gap-2">
                    <FileOutput size={13} className="text-[var(--color-success)] mt-0.5 shrink-0" />
                    <div className="flex flex-wrap gap-1">
                      {allOutputs.map((item) => (
                        <span key={item} className="text-[11px] px-1.5 py-0.5 rounded bg-[var(--color-bg)] border border-[var(--color-border-subtle)] text-[var(--color-success)]">{item}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Workflow type explanation */}
          {workflow.type && (
            <div className="rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)] p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">Workflow Type</span>
                <WorkflowTypeBadge type={workflow.type} />
              </div>
              <p className="text-xs text-[var(--color-muted)]">
                {WORKFLOW_TYPE_DEFINITIONS[workflow.type].description}
              </p>
            </div>
          )}

          {/* How to invoke */}
          <div className="rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)] p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)] mb-2">How to Invoke</h3>
            <div className="space-y-2">
              {workflow.entryPoint ? (
                <div className="flex items-center gap-2 flex-wrap">
                  <code className="text-sm font-[var(--font-mono)] bg-[var(--color-bg)] border border-[var(--color-border-subtle)] px-2 py-1 rounded text-[var(--color-accent)]">
                    /{workflow.entryPoint}
                  </code>
                  <span className="text-xs text-[var(--color-muted)]">in Claude Code or your configured IDE</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 flex-wrap">
                  <code className="text-sm font-[var(--font-mono)] bg-[var(--color-bg)] border border-[var(--color-border-subtle)] px-2 py-1 rounded text-[var(--color-accent)]">
                    /{workflow.id}
                  </code>
                  <span className="text-xs text-[var(--color-muted)]">in Claude Code or your configured IDE</span>
                </div>
              )}
              <p className="text-xs text-[var(--color-muted)]">
                Run this command in your IDE to start the workflow. The agent will guide you through each step.
              </p>
            </div>
          </div>

          {/* Steps with variant tabs */}
          {workflow.steps.length > 0 && (
            <div>
              <h3 className="text-sm font-bold mb-3">Steps ({workflow.steps.length})</h3>

              {/* Variant tabs — only show if multiple groups */}
              {stepGroups.length > 1 && (
                <div className="flex gap-1 mb-3 flex-wrap bg-[var(--color-surface-raised)] rounded-md p-1">
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

              <p className="text-xs text-[var(--color-muted)] mb-3">Click a step to view its instructions</p>
              <div className="space-y-1.5">
                {activeGroup?.steps.map((step, localIndex) => {
                  const stepNum = String(localIndex + 1).padStart(2, '0')
                  const truncatedDesc = step.description
                    ? step.description.split('\n')[0].slice(0, 80) + (step.description.length > 80 ? '…' : '')
                    : null
                  return (
                  <div key={step.globalIndex} className={step.isVariant ? 'ml-6 pl-4 border-l-2 border-[var(--color-border-subtle)]' : ''}>
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
                          expandedStep === step.globalIndex ? <ChevronDown size={12} className="text-[var(--color-accent)] shrink-0" /> : <ChevronRight size={12} className="text-[var(--color-muted)] shrink-0" />
                        ) : null}
                        {step.isVariant ? (
                          <span className="text-xs text-[var(--color-muted)] shrink-0">↳</span>
                        ) : (
                          <span className="text-xs font-bold text-[var(--color-accent)] font-[var(--font-mono)] w-5 shrink-0 text-right">
                            {stepNum}
                          </span>
                        )}
                        <span className={`text-sm font-bold truncate ${step.isVariant ? 'text-[var(--color-muted)]' : ''}`}>{step.title}</span>
                        {step.agent && (
                          <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--color-bg)] border border-[var(--color-border-subtle)] text-[var(--color-accent)] font-bold shrink-0">
                            <Users size={9} />
                            {step.agent}
                          </span>
                        )}
                      </div>
                      {truncatedDesc && (
                        <p className={`text-xs mt-1 ml-[calc(12px+0.625rem+1.25rem)] truncate ${step.isVariant ? 'text-[var(--color-muted)]/60' : 'text-[var(--color-muted)]'}`}>{truncatedDesc}</p>
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
                      <div className="mt-2 rounded-lg border border-[var(--color-border-subtle)] overflow-hidden h-64">
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
            </div>
          )}

          {/* Templates */}
          {workflow.templates && workflow.templates.length > 0 && (
            <div>
              <h3 className="text-sm font-bold mb-3">Templates ({workflow.templates.length})</h3>
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
                      {expandedTemplate === tpl.filePath
                        ? <ChevronDown size={12} className="text-[var(--color-accent)]" />
                        : <ChevronRight size={12} className="text-[var(--color-muted)]" />}
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

          {/* Sub-Workflows */}
          {workflow.subWorkflows && workflow.subWorkflows.length > 0 && (
            <div>
              <h3 className="text-sm font-bold mb-3">Sub-Workflows ({workflow.subWorkflows.length})</h3>
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
            </div>
          )}

          {/* Sub-Agents — workflow-scoped LLM instruction files */}
          {workflow.subAgents && workflow.subAgents.length > 0 && (
            <div>
              <h3 className="text-sm font-bold mb-3">Sub-Agents ({workflow.subAgents.length})</h3>
              <div className="space-y-1">
                {workflow.subAgents.map((sa) => (
                  <div
                    key={sa.id}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)]"
                    title={sa.filePath}
                  >
                    <Users size={14} className="text-purple-400" />
                    <span className="text-sm">{sa.name}</span>
                    <span className="ml-auto text-[10px] text-[var(--color-muted)]">{sa.id}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Workflow Hooks — v6.5 only */}
          <HooksPanel workflowId={workflowId} initialHooks={workflow.hooks} isV65={!isNotV65} />

          {/* Agent-based: Agents & Resources with clickable files */}
          {workflow.type === 'agent-based' && supportingFileGroups.length > 0 && (
            <div>
              <h3 className="text-sm font-bold mb-3">Agents & Resources</h3>
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
                              {expandedSupportingFile === file.relativePath
                                ? <ChevronDown size={12} className="text-[var(--color-accent)]" />
                                : <ChevronRight size={12} className="text-[var(--color-muted)]" />}
                              <FileText size={14} className="text-[var(--color-muted)]" />
                              <span className="text-sm">{file.name}</span>
                            </button>
                          ) : (
                            <Link
                              to={`/files?path=${encodeURIComponent(file.relativePath)}`}
                              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)] hover:border-[var(--color-accent)] transition-colors"
                            >
                              <FileText size={14} className="text-[var(--color-muted)]" />
                              <span className="text-sm text-[var(--color-accent)] hover:underline">{file.name}</span>
                            </Link>
                          )}
                          {expandedSupportingFile === file.relativePath && file.name.endsWith('.md') && (
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

          {/* Supporting Files (non-agent-based fallback) */}
          {workflow.type !== 'agent-based' && workflow.supportingFiles && workflow.supportingFiles.length > 0 && (
            <div>
              <h3 className="text-sm font-bold mb-3">Supporting Files</h3>
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
            </div>
          )}

          <div className="flex items-center gap-2 text-xs text-[var(--color-muted)]">
            <GitBranch size={12} />
            <span className="font-[var(--font-mono)]">{workflow.filePath}</span>
          </div>

            </>
          )}
        </div>
      )}
    </aside>

      {showEdit && workflow && (
        <EditWorkflowDialog
          workflow={workflow}
          onClose={() => setShowEdit(false)}
          onSaved={() => setShowEdit(false)}
        />
      )}
    </div>
  )
}
