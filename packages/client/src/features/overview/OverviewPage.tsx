import { useEffect, useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Rocket, ArrowRight, CheckCircle2, FileText, Wrench, AlertTriangle, ShieldCheck, BarChart3, ChevronDown, RefreshCw, SkipForward } from 'lucide-react'

import { EmptyState } from '../../shared/EmptyState.js'

function formatRelativeDate(input: string): string {
  const date = new Date(input)
  if (isNaN(date.getTime())) return input
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffDays < 0) return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
  if (diffDays === 0) {
    if (diffHours === 0) return diffMins <= 1 ? 'just now' : `${diffMins}m ago`
    return `${diffHours}h ago`
  }
  if (diffDays === 1) return 'yesterday'
  if (diffDays <= 7) return `${diffDays} days ago`
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

type EpicDetail = {
  id: string
  status: string
  storyCount: number
  stories: Array<{ id: string; status: string }>
}

type ProjectHealth = {
  sprint: {
    lastUpdated: string | null
    activeEpics: string[]
    storyCounts: { inProgress: number; review: number; done: number; backlog: number; readyForDev: number; total: number }
    inProgressStories: string[]
    reviewStories: string[]
    epicDetails?: EpicDetail[]
  } | null
  recentOutputs: Array<{ category: string; name: string; path: string; modifiedAt: string }>
  outputCounts: { brainstorming: number; planning: number; implementation: number; other: number; total: number }
}

function humaniseStoryId(id: string): string {
  // "16-3-registry-browse-ui-and-installed-status" → "16.3 Registry Browse UI"
  const parts = id.split('-')
  const epicNum = parts[0]
  const storyNum = parts[1]
  const title = parts.slice(2).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  return title ? `${epicNum}.${storyNum} ${title}` : id
}

function humaniseEpicId(id: string): string {
  // "epic-16" → "Epic 16"
  return id.replace('epic-', 'Epic ')
}

const STORY_STATUS_STYLE: Record<string, { color: string; label: string }> = {
  done: { color: 'var(--color-success)', label: 'Done' },
  'in-progress': { color: 'var(--color-warning)', label: 'In Progress' },
  review: { color: 'var(--color-accent)', label: 'Review' },
  'ready-for-dev': { color: 'var(--color-info, var(--color-accent))', label: 'Ready' },
  backlog: { color: 'var(--color-muted)', label: 'Backlog' },
}

function EpicAccordion({ epic }: { epic: EpicDetail }) {
  const [open, setOpen] = useState(epic.status === 'in-progress')
  const doneCount = epic.stories.filter((s) => s.status === 'done').length
  const isComplete = epic.status === 'done'

  return (
    <div className="border border-[var(--color-border-subtle)] rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-[var(--color-bg)] transition-colors cursor-pointer"
      >
        <ChevronDown size={14} className={`text-[var(--color-muted)] transition-transform ${open ? '' : '-rotate-90'}`} />
        <span className="text-xs font-bold flex-1">{humaniseEpicId(epic.id)}</span>
        <span className="text-xs text-[var(--color-muted)]">{doneCount}/{epic.storyCount}</span>
        {isComplete ? (
          <CheckCircle2 size={12} className="text-[var(--color-success)]" />
        ) : (
          <span className="w-2 h-2 rounded-full bg-[var(--color-warning)]" />
        )}
      </button>
      {open && (
        <div className="border-t border-[var(--color-border-subtle)] px-3 py-2 space-y-1">
          {epic.stories.map((s) => {
            const style = STORY_STATUS_STYLE[s.status] ?? { color: 'var(--color-muted)', label: s.status }
            return (
              <div key={s.id} className="flex items-center gap-2 text-xs">
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: style.color }} />
                <span className="text-[var(--color-text)] truncate flex-1">{humaniseStoryId(s.id)}</span>
                <span className="shrink-0 text-[var(--color-muted)]">{style.label}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function ProjectStatusPanel({ health }: { health: ProjectHealth }) {
  const { sprint, recentOutputs, outputCounts } = health

  return (
    <section className="mb-10 border-b border-[var(--color-border-subtle)] pb-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">Project Status</h2>
        <Link to="/outputs" className="text-sm font-bold text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] transition-colors">
          View all outputs &rarr;
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Sprint Status */}
        <div className="rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)] p-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)] mb-3">Sprint Status</h3>
          {sprint ? (
            <div className="space-y-3">
              {sprint.activeEpics.length > 0 ? (
                <>
                  <div className="flex items-center gap-2 flex-wrap">
                    {sprint.activeEpics.map((e) => (
                      <span key={e} className="px-2 py-0.5 text-xs font-bold rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)]">
                        {humaniseEpicId(e)}
                      </span>
                    ))}
                    <span className="text-xs text-[var(--color-muted)]">active</span>
                  </div>

                  {/* Progress bar */}
                  {sprint.storyCounts.total > 0 && (
                    <div>
                      <div className="flex items-center justify-between text-xs text-[var(--color-muted)] mb-1.5">
                        <span>{sprint.storyCounts.done} / {sprint.storyCounts.total} stories done</span>
                        <span>{Math.round((sprint.storyCounts.done / sprint.storyCounts.total) * 100)}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-[var(--color-bg)] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[var(--color-accent)] transition-all"
                          style={{ width: `${(sprint.storyCounts.done / sprint.storyCounts.total) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-[var(--color-muted)]">No active epics — all epics complete or backlog.</p>
              )}

              {/* Story 26.1: Expandable epics list */}
              {sprint.epicDetails && sprint.epicDetails.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  {sprint.epicDetails.slice(0, 5).map((epic) => (
                    <EpicAccordion key={epic.id} epic={epic} />
                  ))}
                </div>
              )}

              {!sprint.epicDetails?.length && sprint.activeEpics.length === 0 && (
                <p className="text-sm text-[var(--color-muted)]">No epics defined yet.</p>
              )}

              {sprint.lastUpdated && (
                <p className="text-xs text-[var(--color-muted)] pt-1">Updated {formatRelativeDate(sprint.lastUpdated)}</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-[var(--color-muted)]">No sprint-status.yaml found in _bmad-output.</p>
          )}
        </div>

        {/* Output Hub summary + recent */}
        <div className="rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)] p-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)] mb-3">Output Hub</h3>
          {outputCounts.total > 0 ? (
            <div className="space-y-3">
              <div className="flex gap-3 flex-wrap">
                {outputCounts.brainstorming + outputCounts.planning > 0 && (
                  <Link
                    to="/outputs"
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border-subtle)] hover:border-[var(--color-accent)] transition-colors text-xs"
                  >
                    <FileText size={12} className="text-[var(--color-accent)] shrink-0" />
                    <span className="font-bold">Project</span>
                    <span className="text-[var(--color-muted)]">{outputCounts.brainstorming + outputCounts.planning}</span>
                  </Link>
                )}
                {outputCounts.implementation > 0 && (
                  <Link
                    to="/outputs"
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border-subtle)] hover:border-[var(--color-accent)] transition-colors text-xs"
                  >
                    <Wrench size={12} className="text-[var(--color-accent)] shrink-0" />
                    <span className="font-bold">Executional</span>
                    <span className="text-[var(--color-muted)]">{outputCounts.implementation}</span>
                  </Link>
                )}
              </div>
              {recentOutputs.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-[var(--color-muted)] mb-2">Recent</p>
                  <div className="space-y-1.5">
                    {recentOutputs.slice(0, 5).map((f) => {
                      const friendlyDate = formatRelativeDate(f.modifiedAt)
                      return (
                        <Link
                          key={f.path}
                          to={`/outputs?path=${encodeURIComponent(f.path)}`}
                          className="flex items-center gap-2 text-xs hover:text-[var(--color-accent)] transition-colors group"
                        >
                          <FileText size={11} className="text-[var(--color-muted)] shrink-0 group-hover:text-[var(--color-accent)]" />
                          <span className="truncate text-[var(--color-text)] group-hover:text-[var(--color-accent)]">{f.name.replace(/\.(md|yaml|yml)$/, '')}</span>
                          <span className="text-[var(--color-muted)] shrink-0 ml-auto">{friendlyDate}</span>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-[var(--color-muted)]">No outputs yet. Run BMAD workflows to generate artifacts.</p>
          )}
        </div>
      </div>
    </section>
  )
}

type CommandItem = {
  module: string
  phase: string
  name: string
  code: string
  sequence: number | null
  required: boolean
  agentDisplayName: string
  agentTitle: string
  description: string
  outputLocation: string
  command: string
}

const PHASE_ORDER = ['1-analysis', '2-planning', '3-solutioning', '4-implementation'] as const

function phaseLabel(phase: string): string {
  const stripped = phase.replace(/^\d+-/, '')
  return stripped.charAt(0).toUpperCase() + stripped.slice(1)
}

const QUICK_FLOW_CODES = new Set(['QS', 'QD', 'QQ'])
const BUILD_CYCLE_CODES = ['SP', 'CS', 'DS', 'CR', 'ER']

function CommandPill({ cmd, variant = 'default' }: { cmd: CommandItem; variant?: 'default' | 'required' | 'dim' | 'cycle' }) {
  const styles = {
    required: 'border-[var(--color-accent)] bg-[var(--color-accent)]/5',
    cycle: 'border-[var(--color-accent)]/40 bg-[var(--color-accent)]/5',
    default: 'border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)]',
    dim: 'border-[var(--color-border-subtle)]/50 bg-[var(--color-surface-raised)]/50 opacity-60',
  }
  const resolvedVariant = variant === 'default' && cmd.required ? 'required' : variant
  return (
    <div
      title={`${cmd.name}\n${cmd.description}`}
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs border transition-colors ${styles[resolvedVariant]}`}
    >
      {cmd.agentTitle && (
        <span className="text-xs leading-none" role="img">
          {cmd.agentTitle.match(/\p{Emoji_Presentation}/u)?.[0] ?? ''}
        </span>
      )}
      <span className="font-[var(--font-mono)] font-bold">{cmd.code}</span>
      <span className="text-[var(--color-muted)] hidden sm:inline truncate max-w-[80px]">{cmd.name}</span>
    </div>
  )
}

function PhaseTimeline({ commands }: { commands: CommandItem[] }) {
  const navigate = useNavigate()

  const { phaseGroups, quickFlowCmds, anytimeCmds, buildCycleCmds, implSupportCmds } = useMemo(() => {
    const groups = new Map<string, CommandItem[]>()
    const quick: CommandItem[] = []
    const anytime: CommandItem[] = []

    for (const cmd of commands) {
      if (QUICK_FLOW_CODES.has(cmd.code)) {
        quick.push(cmd)
        continue
      }
      const key = cmd.phase || 'anytime'
      if (key === 'anytime') {
        anytime.push(cmd)
      } else {
        if (!groups.has(key)) groups.set(key, [])
        groups.get(key)!.push(cmd)
      }
    }
    for (const [, cmds] of groups) {
      cmds.sort((a, b) => (a.sequence ?? 999) - (b.sequence ?? 999))
    }

    // Split implementation into Build Cycle + support
    const implCmds = groups.get('4-implementation') ?? []
    const cycleSet = new Set(BUILD_CYCLE_CODES)
    const cycle = BUILD_CYCLE_CODES.map((code) => implCmds.find((c) => c.code === code)).filter(Boolean) as CommandItem[]
    const support = implCmds.filter((c) => !cycleSet.has(c.code))

    return { phaseGroups: groups, quickFlowCmds: quick, anytimeCmds: anytime, buildCycleCmds: cycle, implSupportCmds: support }
  }, [commands])

  if (phaseGroups.size === 0 && anytimeCmds.length === 0) return null

  return (
    <section className="border-b border-[var(--color-border-subtle)] pb-10 mb-10">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">The BMAD Process</h2>
          <p className="text-xs text-[var(--color-muted)] mt-1">Workflow lifecycle from analysis to implementation</p>
        </div>
        <button
          onClick={() => navigate('/commands')}
          className="text-sm font-bold text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] transition-colors cursor-pointer"
        >
          View all triggers &rarr;
        </button>
      </div>

      {/* Horizontal phase timeline — all 4 phases always shown */}
      <div className="flex gap-0 overflow-x-auto pb-2">
        {PHASE_ORDER.map((phase, idx) => {
          const cmds = phaseGroups.get(phase) ?? []
          const isEmpty = cmds.length === 0
          const isImpl = phase === '4-implementation'
          // For implementation, show Build Cycle + support instead of flat list
          const displayCmds = isImpl ? [] : cmds

          return (
            <div key={phase} className="flex items-start">
              <div className={`min-w-[180px] flex-1 ${isEmpty ? 'opacity-40' : ''}`}>
                <div className="flex items-center gap-1.5 mb-3 px-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-accent)]">
                    {phaseLabel(phase)}
                  </span>
                  <span className="text-xs text-[var(--color-muted)]">({cmds.length})</span>
                </div>

                {isImpl ? (
                  <div className="px-1 space-y-2">
                    {/* Build Cycle */}
                    {buildCycleCmds.length > 0 && (
                      <div className="rounded-md border border-[var(--color-accent)]/20 bg-[var(--color-accent)]/[0.03] p-2">
                        <div className="flex items-center gap-1.5 mb-2">
                          <RefreshCw size={11} className="text-[var(--color-accent)]" />
                          <span className="text-xs font-bold text-[var(--color-accent)]">Build Cycle</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-1">
                          {buildCycleCmds.map((cmd, ci) => (
                            <span key={cmd.code} className="contents">
                              <CommandPill cmd={cmd} variant="cycle" />
                              {ci < buildCycleCmds.length - 1 && (
                                <ArrowRight size={10} className="text-[var(--color-muted)] shrink-0" />
                              )}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* Support commands */}
                    {implSupportCmds.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {implSupportCmds.map((cmd) => (
                          <CommandPill key={`${cmd.code}-${cmd.module}`} cmd={cmd} />
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1.5 px-1">
                    {displayCmds.map((cmd) => (
                      <CommandPill key={`${cmd.code}-${cmd.module}`} cmd={cmd} />
                    ))}
                    {isEmpty && (
                      <span className="text-xs text-[var(--color-muted)] italic">No commands</span>
                    )}
                  </div>
                )}
              </div>
              {idx < PHASE_ORDER.length - 1 && (
                <div className="flex items-center pt-8 px-2 text-[var(--color-muted)]">
                  <ArrowRight size={16} />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Quick Flow bypass lane */}
      {quickFlowCmds.length > 0 && (
        <div className="mt-3 pt-3 border-t border-dashed border-[var(--color-border-subtle)]">
          <div className="flex items-center gap-2 px-1">
            <SkipForward size={14} className="text-[var(--color-accent)] shrink-0" />
            <span className="text-xs font-bold text-[var(--color-accent)]">Quick Flow</span>
            <span className="text-xs text-[var(--color-muted)]">Skip phases 1–3 for small changes</span>
            <div className="flex-1 border-t border-dashed border-[var(--color-accent)]/30 mx-2" />
            <ArrowRight size={12} className="text-[var(--color-accent)]/50 shrink-0" />
          </div>
          <div className="flex flex-wrap gap-1.5 px-1 mt-2 ml-6">
            {quickFlowCmds.map((cmd) => (
              <CommandPill key={`${cmd.code}-${cmd.module}`} cmd={cmd} />
            ))}
          </div>
        </div>
      )}

      {/* Anytime section */}
      {anytimeCmds.length > 0 && (
        <div className="mt-3 pt-3 border-t border-[var(--color-border-subtle)]">
          <div className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)] mb-2 px-1">
            Anytime ({anytimeCmds.length})
          </div>
          <div className="flex flex-wrap gap-1.5 px-1">
            {anytimeCmds.map((cmd) => (
              <CommandPill key={`${cmd.code}-${cmd.module}`} cmd={cmd} />
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

type OverviewData = {
  detected: boolean
  projectHealth?: { hasProjectContext: boolean; projectDescription?: string }
  toolkitStats?: {
    totalSkills: number
    assignedSkills: number
    unassignedSkills: number
    totalAgents: number
    totalWorkflows: number
    totalTeams: number
  }
  sections: {
    teams?: {
      teams: Array<{
        id: string
        name: string
        icon: string
        description: string
        memberCount: number
        module?: string
      }>
      count: number
    }
    team?: {
      agents: Array<{
        id: string
        name: string
        title: string
        icon?: string
        role: string
        communicationStyle?: string
        skillCount: number
        module?: string
      }>
      count: number
    }
    process?: {
      workflows: Array<{ id: string; name: string; stepCount: number; module?: string; type?: string }>
      count: number
    }
    toolkit?: { skills: Array<{ id: string; name: string; module?: string }>; count: number }
    packages?: { packages: Array<{ name: string; version: string }>; count: number }
    ideConfigs?: { ides: string[]; count: number }
  }
}

export function OverviewPage() {
  const [data, setData] = useState<OverviewData | null>(null)
  const [commands, setCommands] = useState<CommandItem[]>([])
  const [health, setHealth] = useState<ProjectHealth | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/overview').then((r) => r.json()),
      fetch('/api/commands').then((r) => r.json()).catch(() => []),
      fetch('/api/project-health').then((r) => r.json()).catch(() => null),
    ])
      .then(([overview, cmds, healthData]) => {
        setData(overview as OverviewData)
        setCommands(cmds as CommandItem[])
        if (healthData) setHealth(healthData as ProjectHealth)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 rounded-lg bg-[var(--color-surface-raised)] animate-pulse" />
        ))}
      </div>
    )
  }

  if (!data?.detected) {
    return (
      <EmptyState
        icon={Rocket}
        title="Welcome to BMAD Studio"
        description="No BMAD project detected. Start by creating a BMAD project or point Studio to an existing one with --dir."
      />
    )
  }

  return (
    <div>
      <h1 className="text-3xl font-extrabold mb-6">Home</h1>

      {/* Product description from project-context.md */}
      {data.projectHealth?.projectDescription && (
        <p className="text-sm text-[var(--color-muted)] mb-8 max-w-3xl leading-relaxed">
          {data.projectHealth.projectDescription}
        </p>
      )}

      {/* Project Context warning banner */}
      {data.projectHealth && !data.projectHealth.hasProjectContext && (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-[var(--color-warning)]/40 bg-[var(--color-warning)]/5 px-4 py-3">
          <AlertTriangle size={18} className="text-[var(--color-warning)] shrink-0" />
          <p className="text-sm text-[var(--color-text)] flex-1">
            <span className="font-bold">Project context not configured</span> — AI agents won't know your conventions.
          </p>
          <Link
            to="/workspace"
            className="shrink-0 text-sm font-bold text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] transition-colors"
          >
            Create Project Context &rarr;
          </Link>
        </div>
      )}

      <div className="space-y-0">
        {/* Project Status — shown when health data exists */}
        {health && <ProjectStatusPanel health={health} />}

        {/* Story 26.3: Toolkit Summary */}
        {data.toolkitStats && (
          <section className="mb-10 border-b border-[var(--color-border-subtle)] pb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">Toolkit</h2>
              <Link
                to="/toolkit"
                className="text-sm font-bold text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] transition-colors"
              >
                View Toolkit &rarr;
              </Link>
            </div>
            <div className="rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)] p-5">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 size={16} className="text-[var(--color-accent)]" />
                <span className="text-sm font-bold">
                  {data.toolkitStats.totalSkills} skills loaded
                  <span className="font-normal text-[var(--color-muted)]">
                    {' · '}{data.toolkitStats.assignedSkills} assigned{' · '}{data.toolkitStats.unassignedSkills} unassigned
                  </span>
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Link to="/agents" className="flex flex-col items-center gap-1 p-3 rounded-lg bg-[var(--color-bg)] hover:border-[var(--color-accent)] border border-[var(--color-border-subtle)] transition-colors">
                  <span className="text-2xl font-extrabold text-[var(--color-text)]">{data.toolkitStats.totalAgents}</span>
                  <span className="text-xs text-[var(--color-muted)]">Agents</span>
                </Link>
                <Link to="/skills" className="flex flex-col items-center gap-1 p-3 rounded-lg bg-[var(--color-bg)] hover:border-[var(--color-accent)] border border-[var(--color-border-subtle)] transition-colors">
                  <span className="text-2xl font-extrabold text-[var(--color-text)]">{data.toolkitStats.totalSkills}</span>
                  <span className="text-xs text-[var(--color-muted)]">Skills</span>
                </Link>
                <Link to="/workflows" className="flex flex-col items-center gap-1 p-3 rounded-lg bg-[var(--color-bg)] hover:border-[var(--color-accent)] border border-[var(--color-border-subtle)] transition-colors">
                  <span className="text-2xl font-extrabold text-[var(--color-text)]">{data.toolkitStats.totalWorkflows}</span>
                  <span className="text-xs text-[var(--color-muted)]">Workflows</span>
                </Link>
                <Link to="/teams" className="flex flex-col items-center gap-1 p-3 rounded-lg bg-[var(--color-bg)] hover:border-[var(--color-accent)] border border-[var(--color-border-subtle)] transition-colors">
                  <span className="text-2xl font-extrabold text-[var(--color-text)]">{data.toolkitStats.totalTeams}</span>
                  <span className="text-xs text-[var(--color-muted)]">Teams</span>
                </Link>
              </div>

              {/* Story 26.8: Project Context configured indicator */}
              {data.projectHealth?.hasProjectContext && (
                <div className="mt-4 pt-3 border-t border-[var(--color-border-subtle)] flex items-center gap-2 text-xs text-[var(--color-success)]">
                  <ShieldCheck size={14} />
                  <span>Project Context: Configured</span>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Phase Timeline */}
        {commands.length > 0 && <PhaseTimeline commands={commands} />}
      </div>
    </div>
  )
}
