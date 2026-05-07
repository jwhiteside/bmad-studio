import { useState, useMemo } from 'react'
import { GitBranch, Plus, HelpCircle, X, Users, Layers, BookMarked, Zap, CheckCircle2, AlertTriangle, Clock, HelpCircle as HelpIcon, ChevronDown, ChevronRight } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

import { WORKFLOW_TYPE_DEFINITIONS } from '@bmad-studio/shared'
import type { WorkflowListItem, WorkflowType } from '@bmad-studio/shared'

import { useWorkflows, useWorkflowStatuses, useWorkflowStatusLiveRefresh } from './use-workflows.js'
import type { WorkflowStatusResult } from './use-workflows.js'
import { EmptyState } from '../../shared/EmptyState.js'
import { EntityPageHeader } from '../../shared/EntityPageHeader.js'
import { CreateWorkflowDialog } from './CreateWorkflowDialog.js'

const TYPE_BADGE_STYLES: Record<string, string> = {
  'step-based': 'border-[var(--color-border-subtle)] text-[var(--color-muted)]',
  'agent-based': 'border-purple-400/50 text-purple-400',
  composite: 'border-blue-400/50 text-blue-400',
  utility: 'border-amber-400/50 text-amber-400',
}

const TYPE_BADGE_LABELS: Record<string, string> = {
  'step-based': 'Step',
  'agent-based': 'Agent',
  composite: 'Composite',
  utility: 'Utility',
}

const TYPE_TOOLTIPS: Record<string, string> = {
  'step-based': `${WORKFLOW_TYPE_DEFINITIONS['step-based'].label}: ${WORKFLOW_TYPE_DEFINITIONS['step-based'].description}`,
  'agent-based': `${WORKFLOW_TYPE_DEFINITIONS['agent-based'].label}: ${WORKFLOW_TYPE_DEFINITIONS['agent-based'].description}`,
  composite: `${WORKFLOW_TYPE_DEFINITIONS.composite.label}: ${WORKFLOW_TYPE_DEFINITIONS.composite.description}`,
  utility: `${WORKFLOW_TYPE_DEFINITIONS.utility.label}: ${WORKFLOW_TYPE_DEFINITIONS.utility.description}`,
}

export function WorkflowTypeBadge({ type }: { type?: WorkflowType }) {
  if (!type) return null
  return (
    <span
      title={TYPE_TOOLTIPS[type]}
      className={`px-2 py-0.5 rounded-full text-xs border cursor-help ${TYPE_BADGE_STYLES[type] ?? TYPE_BADGE_STYLES['step-based']}`}
    >
      {TYPE_BADGE_LABELS[type] ?? type}
    </span>
  )
}

function humanizePhase(phase: string): string {
  // "2-plan-workflows" → "Plan Workflows"
  return phase
    .replace(/^\d+-/, '')
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

type PhaseGroup = [phase: string, workflows: WorkflowListItem[]]

function groupByPhase(workflows: WorkflowListItem[]): PhaseGroup[] {
  const groups = new Map<string, WorkflowListItem[]>()
  for (const wf of workflows) {
    const key = wf.phase ?? '__ungrouped'
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(wf)
  }
  return Array.from(groups.entries()).sort(([a], [b]) => {
    if (a === '__ungrouped') return 1
    if (b === '__ungrouped') return -1
    const numA = parseInt(a) || 999
    const numB = parseInt(b) || 999
    return numA - numB
  })
}

function TypeGuide({ onClose }: { onClose: () => void }) {
  const types = [
    {
      label: WORKFLOW_TYPE_DEFINITIONS['step-based'].label,
      badge: <WorkflowTypeBadge type="step-based" />,
      icon: <GitBranch size={20} className="text-[var(--color-muted)]" />,
      description: WORKFLOW_TYPE_DEFINITIONS['step-based'].description,
      bestFor: WORKFLOW_TYPE_DEFINITIONS['step-based'].bestFor,
      example: '/create-prd',
    },
    {
      label: WORKFLOW_TYPE_DEFINITIONS['agent-based'].label,
      badge: <WorkflowTypeBadge type="agent-based" />,
      icon: <Users size={20} className="text-purple-400" />,
      description: WORKFLOW_TYPE_DEFINITIONS['agent-based'].description,
      bestFor: WORKFLOW_TYPE_DEFINITIONS['agent-based'].bestFor,
      example: '/run-sprint',
    },
    {
      label: WORKFLOW_TYPE_DEFINITIONS.composite.label,
      badge: <WorkflowTypeBadge type="composite" />,
      icon: <Layers size={20} className="text-blue-400" />,
      description: WORKFLOW_TYPE_DEFINITIONS.composite.description,
      bestFor: WORKFLOW_TYPE_DEFINITIONS.composite.bestFor,
      example: '/bmad-full-pipeline',
    },
  ]

  return (
    <div className="mb-6 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border-subtle)]">
        <h3 className="text-sm font-bold">Understanding Workflow Types</h3>
        <button onClick={onClose} className="text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors">
          <X size={16} />
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[var(--color-border-subtle)]">
        {types.map((t) => (
          <div key={t.label} className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              {t.icon}
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold">{t.label}</span>
                {t.badge}
              </div>
            </div>
            <p className="text-xs text-[var(--color-muted)] leading-relaxed">{t.description}</p>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)] mb-1">Best for</p>
              <ul className="space-y-0.5">
                {t.bestFor.map((bf) => (
                  <li key={bf} className="text-xs text-[var(--color-muted)] flex items-start gap-1.5">
                    <span className="text-[var(--color-accent)] mt-0.5 shrink-0">›</span>
                    {bf}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)] mb-1">Example invocation</p>
              <code className="text-xs font-[var(--font-mono)] text-[var(--color-accent)] bg-[var(--color-bg)] border border-[var(--color-border-subtle)] px-1.5 py-0.5 rounded">{t.example}</code>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

type StatusFilter = 'all' | 'ready' | 'blocked' | 'already-run' | 'unknown'

const STATUS_CONFIG: Record<Exclude<StatusFilter, 'all'>, { label: string; icon: typeof CheckCircle2; color: string }> = {
  ready: { label: 'Ready', icon: CheckCircle2, color: 'text-[var(--color-success)]' },
  blocked: { label: 'Blocked', icon: AlertTriangle, color: 'text-amber-400' },
  'already-run': { label: 'Already Run', icon: Clock, color: 'text-[var(--color-muted)]' },
  unknown: { label: 'Unknown', icon: HelpIcon, color: 'text-[var(--color-muted)]' },
}

function StatusDot({ status }: { status: WorkflowStatusResult['status'] | undefined }) {
  if (!status || status === 'unknown') return null
  const cfg = STATUS_CONFIG[status]
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full border shrink-0 ${cfg.color} border-current/20 bg-current/5`}>
      <Icon size={9} />
      {cfg.label}
    </span>
  )
}

export function WorkflowsPage() {
  const navigate = useNavigate()
  const { data: workflows, isLoading, refetch } = useWorkflows()
  const [showCreate, setShowCreate] = useState(false)
  const [showTypeGuide, setShowTypeGuide] = useState(false)
  const [activeModule, setActiveModule] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [hooksOnly, setHooksOnly] = useState(false)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [expandedBlockedId, setExpandedBlockedId] = useState<string | null>(null)

  const workflowIds = useMemo(() => workflows?.map((w) => w.id) ?? [], [workflows])
  const { data: statusMap = {} } = useWorkflowStatuses(workflowIds)
  useWorkflowStatusLiveRefresh(workflowIds)

  const modules = useMemo(() => {
    if (!workflows) return []
    const set = new Set<string>()
    for (const wf of workflows) {
      if (wf.module) set.add(wf.module)
    }
    return Array.from(set).sort()
  }, [workflows])

  const moduleCounts = useMemo(() => {
    if (!workflows) return {}
    const counts: Record<string, number> = {}
    for (const wf of workflows) {
      if (wf.module) counts[wf.module] = (counts[wf.module] ?? 0) + 1
    }
    return counts
  }, [workflows])

  const hasAnyHooks = useMemo(() => workflows?.some((wf) => (wf.hookCount ?? 0) > 0) ?? false, [workflows])

  const filtered = useMemo(() => {
    if (!workflows) return []
    let result = workflows
    if (activeModule !== 'all') {
      result = result.filter((wf) => wf.module === activeModule)
    }
    if (hooksOnly) {
      result = result.filter((wf) => (wf.hookCount ?? 0) > 0)
    }
    if (statusFilter !== 'all') {
      result = result.filter((wf) => (statusMap[wf.id]?.status ?? 'unknown') === statusFilter)
    }
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (wf) =>
          wf.name.toLowerCase().includes(q) ||
          (wf.description && wf.description.toLowerCase().includes(q)),
      )
    }
    return result
  }, [workflows, activeModule, hooksOnly, statusFilter, statusMap, search])

  const phaseGroups = useMemo(() => groupByPhase(filtered), [filtered])

  if (isLoading) {
    return (
      <div>
        <h1 className="text-2xl font-extrabold mb-2">Workflows</h1>
        <p className="text-sm text-[var(--color-muted)] mb-6">Structured sequences of steps that define how agents deliver work across BMAD phases.</p>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 rounded-lg bg-[var(--color-surface-raised)] animate-pulse"
            />
          ))}
        </div>
      </div>
    )
  }

  if (!workflows || workflows.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-extrabold mb-2">Workflows</h1>
        <p className="text-sm text-[var(--color-muted)] mb-6">Structured sequences of steps that define how agents deliver work across BMAD phases.</p>
        <EmptyState
          icon={GitBranch}
          title="No workflows found"
          description="Workflows are structured processes you run in your IDE — like sprint planning, architecture design, or code review. A Step Workflow guides a single agent through phases. An Agent Workflow hands off between multiple specialised agents. Install a module to get pre-built workflows, or create your own."
          actions={
            <>
              <Link
                to="/modules"
                className="px-4 py-2 text-sm font-bold rounded-md bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] transition-colors"
              >
                Browse Modules
              </Link>
              <button
                onClick={() => setShowCreate(true)}
                className="px-4 py-2 text-sm rounded-md border border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-raised)] transition-colors"
              >
                New Workflow
              </button>
            </>
          }
        />
      </div>
    )
  }

  return (
    <div>
      <div>
        <EntityPageHeader
          title="Workflows"
          count={workflows.length}
          modules={modules}
          moduleCounts={moduleCounts}
          activeModule={activeModule}
          onModuleChange={setActiveModule}
          search={search}
          onSearchChange={setSearch}
          actions={
            <div className="flex items-center gap-3">
            <button
              onClick={() => setShowTypeGuide((v) => !v)}
              title="About workflow types"
              className={`p-2 rounded-md transition-colors ${showTypeGuide ? 'text-[var(--color-accent)] bg-[var(--color-surface-raised)]' : 'text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-raised)]'}`}
            >
              <HelpCircle size={16} />
            </button>
            <button
              onClick={() => setShowCreate(true)}
              className="px-4 py-2 text-sm font-bold rounded-md bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] transition-colors flex items-center gap-1.5"
            >
              <Plus size={14} />
              New Workflow
            </button>
            </div>
          }
        />

        {showTypeGuide && <TypeGuide onClose={() => setShowTypeGuide(false)} />}

        {(hasAnyHooks || Object.keys(statusMap).length > 0) && (
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            {/* Status filter chips */}
            {(['all', 'ready', 'blocked', 'already-run', 'unknown'] as StatusFilter[]).map((s) => {
              const cfg = s !== 'all' ? STATUS_CONFIG[s] : null
              const Icon = cfg?.icon
              return (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-colors font-bold ${
                    statusFilter === s
                      ? 'bg-[var(--color-accent)]/10 border-[var(--color-accent)]/40 text-[var(--color-accent)]'
                      : 'border-[var(--color-border-subtle)] text-[var(--color-muted)] hover:text-[var(--color-text)] hover:border-[var(--color-accent)]/40'
                  }`}
                >
                  {Icon && <Icon size={10} />}
                  {s === 'all' ? 'All' : cfg?.label}
                </button>
              )
            })}
            {hasAnyHooks && (
              <button
                onClick={() => setHooksOnly((v) => !v)}
                className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-colors font-bold ${
                  hooksOnly
                    ? 'bg-[var(--color-accent)]/10 border-[var(--color-accent)]/40 text-[var(--color-accent)]'
                    : 'border-[var(--color-border-subtle)] text-[var(--color-muted)] hover:text-[var(--color-text)] hover:border-[var(--color-accent)]/40'
                }`}
              >
                <Zap size={10} />
                Has hooks
              </button>
            )}
          </div>
        )}

        <div className="space-y-6">
            {phaseGroups.map(([phase, wfs]) => (
              <div key={phase}>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)] mb-2 px-1">
                  {phase === '__ungrouped' ? 'Ungrouped' : humanizePhase(phase)}
                  <span className="ml-2 font-normal">({wfs.length})</span>
                </h3>
                <div className="space-y-2">
                  {wfs.map((wf) => {
                    const wfStatus = statusMap[wf.id] ?? null
                    const isBlocked = wfStatus?.status === 'blocked'
                    const isBlockedExpanded = expandedBlockedId === wf.id
                    const blockedInputs = wfStatus?.inputs.filter((i: WorkflowStatusResult['inputs'][number]) => i.required && i.status === 'missing') ?? []

                    return (
                    <div key={wf.id}>
                      <div className="rounded-lg border transition-colors bg-[var(--color-surface-raised)] border-[var(--color-border-subtle)] hover:border-[var(--color-accent)]">
                        <button
                          onClick={() => navigate(`/workflows/${wf.id}`)}
                          className="w-full flex items-center justify-between p-4 cursor-pointer text-left"
                        >
                          <div className="flex items-center gap-3">
                            <GitBranch size={18} className="text-[var(--color-muted)]" />
                            <div>
                              <p className="text-sm font-bold">{wf.name}</p>
                              <p className="text-xs text-[var(--color-muted)] truncate max-w-md">
                                {wf.description}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-[var(--color-muted)]">
                            <StatusDot status={wfStatus?.status} />
                            {(wf.hookCount ?? 0) > 0 && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/30 text-[var(--color-accent)] text-[10px] font-bold shrink-0" title={`${wf.hookCount} hook${wf.hookCount !== 1 ? 's' : ''} configured`}>
                                <Zap size={9} />
                                {wf.hookCount}
                              </span>
                            )}
                            {(wf.module === 'bmm' || wf.module === 'bmb') && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-bold shrink-0">
                                <BookMarked size={9} />
                                Reference
                              </span>
                            )}
                            <WorkflowTypeBadge type={wf.type} />
                            {wf.module && (
                              <span className="px-2 py-0.5 rounded-full bg-[var(--color-bg)] border border-[var(--color-border-subtle)]">
                                {wf.module}
                              </span>
                            )}
                          </div>
                        </button>

                        {/* Blocked expansion toggle */}
                        {isBlocked && blockedInputs.length > 0 && (
                          <button
                            onClick={() => setExpandedBlockedId(isBlockedExpanded ? null : wf.id)}
                            className="w-full flex items-center gap-2 px-4 py-2 border-t border-amber-400/20 text-xs text-amber-400 hover:bg-amber-400/5 transition-colors"
                          >
                            {isBlockedExpanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                            <AlertTriangle size={11} />
                            {blockedInputs.length} missing input{blockedInputs.length !== 1 ? 's' : ''} — click to see details
                          </button>
                        )}

                        {/* Blocked inputs detail */}
                        {isBlockedExpanded && blockedInputs.length > 0 && (
                          <div className="border-t border-amber-400/20 px-4 py-3 space-y-2">
                            {blockedInputs.map((inp: WorkflowStatusResult['inputs'][number]) => (
                              <div key={inp.id} className="flex items-start gap-2 text-xs">
                                <AlertTriangle size={11} className="text-amber-400 mt-0.5 shrink-0" />
                                <div>
                                  <p className="font-bold text-[var(--color-text)]">{inp.id}</p>
                                  {inp.description && <p className="text-[var(--color-muted)]">{inp.description}</p>}
                                  <Link
                                    to="/outputs"
                                    className="text-[var(--color-accent)] hover:underline mt-0.5 inline-block"
                                  >
                                    Check Outputs →
                                  </Link>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
      </div>

      {showCreate && (
        <CreateWorkflowDialog
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false)
            refetch()
          }}
        />
      )}
    </div>
  )
}
