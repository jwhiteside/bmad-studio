import { useEffect, useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { GitBranch, Zap, Plug, Package, Rocket, Users, ArrowRight, CheckCircle2, Circle, Clock, FileText, Brain, Wrench } from 'lucide-react'

import { EmptyState } from '../../shared/EmptyState.js'
import { WorkflowTypeBadge } from '../workflows/WorkflowsPage.js'

type OutputCategory = 'brainstorming' | 'planning' | 'implementation' | 'other'

type ProjectHealth = {
  sprint: {
    lastUpdated: string | null
    activeEpics: string[]
    storyCounts: { inProgress: number; review: number; done: number; backlog: number; readyForDev: number; total: number }
    inProgressStories: string[]
    reviewStories: string[]
  } | null
  recentOutputs: Array<{ category: OutputCategory; name: string; path: string; modifiedAt: string }>
  outputCounts: { brainstorming: number; planning: number; implementation: number; other: number; total: number }
}

const CATEGORY_META: Record<OutputCategory, { label: string; icon: typeof Brain }> = {
  brainstorming: { label: 'Brainstorming', icon: Brain },
  planning: { label: 'Planning', icon: FileText },
  implementation: { label: 'Implementation', icon: Wrench },
  other: { label: 'Other', icon: FileText },
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

                  {sprint.inProgressStories.length > 0 && (
                    <div className="space-y-1">
                      {sprint.inProgressStories.map((s) => (
                        <div key={s} className="flex items-center gap-2 text-xs">
                          <Clock size={12} className="text-[var(--color-warning)] shrink-0" />
                          <span className="text-[var(--color-text)] truncate">{humaniseStoryId(s)}</span>
                          <span className="text-[var(--color-warning)] shrink-0">In Progress</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {sprint.reviewStories.length > 0 && (
                    <div className="space-y-1">
                      {sprint.reviewStories.map((s) => (
                        <div key={s} className="flex items-center gap-2 text-xs">
                          <Circle size={12} className="text-[var(--color-accent)] shrink-0" />
                          <span className="text-[var(--color-text)] truncate">{humaniseStoryId(s)}</span>
                          <span className="text-[var(--color-accent)] shrink-0">In Review</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {sprint.storyCounts.inProgress === 0 && sprint.storyCounts.review === 0 && sprint.storyCounts.backlog === 0 && (
                    <div className="flex items-center gap-1.5 text-xs text-[var(--color-success)]">
                      <CheckCircle2 size={14} />
                      <span>All stories complete</span>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-[var(--color-muted)]">No active epics — all epics complete or backlog.</p>
              )}
              {sprint.lastUpdated && (
                <p className="text-xs text-[var(--color-muted)]">Updated {sprint.lastUpdated}</p>
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
                {(['brainstorming', 'planning', 'implementation'] as OutputCategory[])
                  .filter((c) => outputCounts[c] > 0)
                  .map((cat) => {
                    const { label, icon: Icon } = CATEGORY_META[cat]
                    return (
                      <Link
                        key={cat}
                        to={`/outputs?category=${cat}`}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border-subtle)] hover:border-[var(--color-accent)] transition-colors text-xs"
                      >
                        <Icon size={12} className="text-[var(--color-accent)] shrink-0" />
                        <span className="font-bold">{label}</span>
                        <span className="text-[var(--color-muted)]">{outputCounts[cat]}</span>
                      </Link>
                    )
                  })}
              </div>
              {recentOutputs.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-[var(--color-muted)] mb-2">Recent</p>
                  <div className="space-y-1.5">
                    {recentOutputs.slice(0, 4).map((f) => {
                      const { icon: Icon } = CATEGORY_META[f.category]
                      const friendlyDate = new Date(f.modifiedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                      return (
                        <Link
                          key={f.path}
                          to={`/outputs?path=${encodeURIComponent(f.path)}`}
                          className="flex items-center gap-2 text-xs hover:text-[var(--color-accent)] transition-colors group"
                        >
                          <Icon size={11} className="text-[var(--color-muted)] shrink-0 group-hover:text-[var(--color-accent)]" />
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

function PhaseTimeline({ commands }: { commands: CommandItem[] }) {
  const navigate = useNavigate()

  const phaseGroups = useMemo(() => {
    const groups = new Map<string, CommandItem[]>()
    for (const cmd of commands) {
      const key = cmd.phase || 'anytime'
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(cmd)
    }
    for (const [, cmds] of groups) {
      cmds.sort((a, b) => (a.sequence ?? 999) - (b.sequence ?? 999))
    }
    return groups
  }, [commands])

  const mainPhases = PHASE_ORDER.filter((p) => phaseGroups.has(p))
  const anytimeCommands = phaseGroups.get('anytime') ?? []

  if (mainPhases.length === 0 && anytimeCommands.length === 0) return null

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
          View all commands &rarr;
        </button>
      </div>

      {/* Horizontal phase timeline */}
      <div className="flex gap-0 overflow-x-auto pb-2">
        {mainPhases.map((phase, idx) => {
          const cmds = phaseGroups.get(phase) ?? []
          return (
            <div key={phase} className="flex items-start">
              <div className="min-w-[180px] flex-1">
                <div className="text-xs font-bold uppercase tracking-wider text-[var(--color-accent)] mb-3 px-1">
                  {phaseLabel(phase)}
                </div>
                <div className="flex flex-wrap gap-1.5 px-1">
                  {cmds.map((cmd) => (
                    <div
                      key={`${cmd.code}-${cmd.module}`}
                      title={`${cmd.name}\n${cmd.description}`}
                      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs border transition-colors ${
                        cmd.required
                          ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/5'
                          : 'border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)]'
                      }`}
                    >
                      {cmd.agentTitle && (
                        <span className="text-xs leading-none" role="img">
                          {cmd.agentTitle.match(/\p{Emoji_Presentation}/u)?.[0] ?? ''}
                        </span>
                      )}
                      <span className="font-[var(--font-mono)] font-bold">{cmd.code}</span>
                      <span className="text-[var(--color-muted)] hidden sm:inline truncate max-w-[80px]">{cmd.name}</span>
                    </div>
                  ))}
                </div>
              </div>
              {idx < mainPhases.length - 1 && (
                <div className="flex items-center pt-8 px-2 text-[var(--color-muted)]">
                  <ArrowRight size={16} />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Anytime section */}
      {anytimeCommands.length > 0 && (
        <div className="mt-4 pt-4 border-t border-[var(--color-border-subtle)]">
          <div className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)] mb-2 px-1">
            Anytime
          </div>
          <div className="flex flex-wrap gap-1.5 px-1">
            {anytimeCommands.map((cmd) => (
              <div
                key={`${cmd.code}-${cmd.module}`}
                title={`${cmd.name}\n${cmd.description}`}
                className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)]"
              >
                {cmd.agentTitle && (
                  <span className="text-xs leading-none" role="img">
                    {cmd.agentTitle.match(/\p{Emoji_Presentation}/u)?.[0] ?? ''}
                  </span>
                )}
                <span className="font-[var(--font-mono)] font-bold">{cmd.code}</span>
                <span className="text-[var(--color-muted)] hidden sm:inline truncate max-w-[80px]">{cmd.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

type OverviewData = {
  detected: boolean
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

function SectionHeader({ title, count, to }: { title: string; count: number; to: string }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">{title}</h2>
      <Link
        to={to}
        className="text-sm font-bold text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] transition-colors"
      >
        View all ({count}) &rarr;
      </Link>
    </div>
  )
}

const MAX_OVERVIEW_ITEMS = 5
const MAX_OVERVIEW_AGENTS = 8

export function OverviewPage() {
  const navigate = useNavigate()
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

  const { sections } = data

  return (
    <div>
      <h1 className="text-3xl font-extrabold mb-10">Home</h1>

      <div className="space-y-0">
        {/* Project Status — shown when health data exists */}
        {health && <ProjectStatusPanel health={health} />}

        {/* Agents — first section, renamed from "The Team" */}
        {sections.team && sections.team.count > 0 && (
          <section className="border-b border-[var(--color-border-subtle)] pb-10 mb-10">
            <SectionHeader title="Agents" count={sections.team.count} to="/agents" />
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {sections.team.agents.filter((a) => a.name || a.title).slice(0, MAX_OVERVIEW_AGENTS).map((agent) => {
                const styleSnippet = agent.communicationStyle
                  ? agent.communicationStyle.length > 60
                    ? agent.communicationStyle.slice(0, 60) + '...'
                    : agent.communicationStyle
                  : undefined
                return (
                  <button
                    key={agent.id}
                    onClick={() => navigate(`/agents/${agent.id}`)}
                    className="p-4 rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)] text-left hover:border-[var(--color-accent)] hover:-translate-y-0.5 hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 mb-2">
                      {agent.icon ? (
                        <span className="text-2xl leading-none" role="img" aria-label={`${agent.name} icon`}>{agent.icon}</span>
                      ) : (
                        <span className="w-7 h-7 rounded-lg bg-[var(--color-accent)] text-white text-xs font-bold flex items-center justify-center shrink-0">
                          {agent.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                      <div className="min-w-0">
                        <span className="font-bold text-sm block truncate">{agent.name}</span>
                        {agent.title && (
                          <span className="text-xs text-[var(--color-muted)] block truncate">{agent.title}</span>
                        )}
                      </div>
                    </div>
                    {styleSnippet && (
                      <p className="text-xs italic text-[var(--color-muted)] line-clamp-1 mb-1.5">&ldquo;{styleSnippet}&rdquo;</p>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[var(--color-muted)]">{agent.skillCount} skills</span>
                      {agent.module && (
                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-[var(--color-bg)] border border-[var(--color-border-subtle)] text-[var(--color-muted)]">
                          {agent.module}
                        </span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
            {sections.team.count > MAX_OVERVIEW_AGENTS && (
              <Link
                to="/agents"
                className="block text-center text-sm text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] py-2 mt-2"
              >
                + {sections.team.count - MAX_OVERVIEW_AGENTS} more agents
              </Link>
            )}
          </section>
        )}

        {/* Teams — below Agents */}
        {sections.teams && sections.teams.count > 0 && (
          <section className="border-b border-[var(--color-border-subtle)] pb-10 mb-10">
            <SectionHeader title="Teams" count={sections.teams.count} to="/teams" />
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {sections.teams.teams.map((t) => (
                <button
                  key={t.id}
                  onClick={() => navigate('/teams')}
                  className="p-4 rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)] text-left hover:border-[var(--color-accent)] hover:-translate-y-0.5 hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2 mb-2">
                    {t.icon ? (
                      <span className="text-lg leading-none" role="img" aria-label={`${t.name} icon`}>{t.icon}</span>
                    ) : (
                      <Users size={18} className="text-[var(--color-accent)]" />
                    )}
                    <span className="font-bold text-sm truncate">{t.name}</span>
                  </div>
                  {t.description && (
                    <p className="text-xs text-[var(--color-muted)] line-clamp-2 mb-1">{t.description}</p>
                  )}
                  <p className="text-xs text-[var(--color-muted)]">{t.memberCount} members</p>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Workflows — top 5 */}
        {sections.process && sections.process.count > 0 && (
          <section className="border-b border-[var(--color-border-subtle)] pb-10 mb-10">
            <SectionHeader title="Workflows" count={sections.process.count} to="/workflows" />
            <div className="space-y-2">
              {sections.process.workflows.slice(0, MAX_OVERVIEW_ITEMS).map((wf) => (
                <button
                  key={wf.id}
                  onClick={() => navigate('/workflows')}
                  className="w-full flex items-center justify-between p-3 rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)] hover:border-[var(--color-accent)] transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <GitBranch size={16} className="text-[var(--color-muted)]" />
                    <span className="text-sm font-bold">{wf.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <WorkflowTypeBadge type={wf.type as 'step-based' | 'agent-based' | 'composite' | undefined} />
                    <span className="text-xs text-[var(--color-muted)]">{wf.stepCount} steps</span>
                    {wf.module && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-bg)] border border-[var(--color-border-subtle)] text-[var(--color-muted)]">
                        {wf.module}
                      </span>
                    )}
                  </div>
                </button>
              ))}
              {sections.process.count > MAX_OVERVIEW_ITEMS && (
                <Link
                  to="/workflows"
                  className="block text-center text-sm text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] py-2"
                >
                  + {sections.process.count - MAX_OVERVIEW_ITEMS} more workflows
                </Link>
              )}
            </div>
          </section>
        )}

        {/* Phase Timeline */}
        {commands.length > 0 && <PhaseTimeline commands={commands} />}

        {/* Skills — card-style, top items */}
        {sections.toolkit && sections.toolkit.count > 0 && (
          <section className="border-b border-[var(--color-border-subtle)] pb-10 mb-10">
            <SectionHeader title="Skills" count={sections.toolkit.count} to="/skills" />
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {sections.toolkit.skills.slice(0, 8).map((skill) => (
                <button
                  key={skill.id}
                  onClick={() => navigate('/skills')}
                  className="flex items-center gap-2 p-3 rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)] text-left hover:border-[var(--color-accent)] transition-colors cursor-pointer"
                >
                  <Zap size={14} className="text-[var(--color-accent)] shrink-0" />
                  <span className="text-sm truncate">{skill.name}</span>
                </button>
              ))}
            </div>
            {sections.toolkit.count > 8 && (
              <Link
                to="/skills"
                className="block text-center text-sm text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] py-2 mt-2"
              >
                + {sections.toolkit.count - 8} more skills
              </Link>
            )}
          </section>
        )}

        {/* Connections */}
        {sections.ideConfigs && sections.ideConfigs.count > 0 && (
          <section className="border-b border-[var(--color-border-subtle)] pb-10 mb-10">
            <SectionHeader title="Data Sources" count={sections.ideConfigs.count} to="/connections" />
            <div className="flex gap-3 flex-wrap">
              {sections.ideConfigs.ides.map((ide) => (
                <button
                  key={ide}
                  onClick={() => navigate('/connections')}
                  className="flex items-center gap-2 px-4 py-3 rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)] hover:border-[var(--color-accent)] hover:-translate-y-0.5 hover:shadow-md transition-all cursor-pointer"
                >
                  <Plug size={16} className="text-[var(--color-success)]" />
                  <span className="text-sm">{ide}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Modules */}
        {sections.packages && sections.packages.count > 0 && (
          <section>
            <SectionHeader title="Modules" count={sections.packages.count} to="/modules" />
            <div className="flex gap-4 flex-wrap">
              {sections.packages.packages.map((pkg) => (
                <button
                  key={pkg.name}
                  onClick={() => navigate('/modules')}
                  className="p-4 rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)] text-left hover:border-[var(--color-accent)] hover:-translate-y-0.5 hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Package size={16} className="text-[var(--color-muted)]" />
                    <span className="font-bold text-sm">{pkg.name}</span>
                  </div>
                  <p className="text-xs text-[var(--color-muted)] mt-1">v{pkg.version}</p>
                </button>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
