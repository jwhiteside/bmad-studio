import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, UsersRound, Zap, GitBranch, Search, Layers } from 'lucide-react'

import { useAgents } from '../agents/use-agents.js'
import { useSkills } from '../skills/use-skills.js'
import { useWorkflows } from '../workflows/use-workflows.js'
import { useTeams } from '../teams/use-teams.js'
import { SkillDetailSlideOver } from '../skills/SkillDetailSlideOver.js'
import { WorkflowDetailPanel } from '../workflows/WorkflowDetailPanel.js'
import { useDetailParam } from '../../hooks/use-detail-param.js'
import { SkeletonList } from '../../shared/Skeleton.js'

type FilterType = 'all' | 'agent' | 'skill' | 'workflow' | 'team'

type ToolkitItem = {
  kind: 'agent' | 'skill' | 'workflow' | 'team'
  id: string
  name: string
  title?: string
  icon?: string
  description: string
  module?: string
  invoke: string
}

export function ToolkitPage() {
  const navigate = useNavigate()
  const { data: agents, isLoading: loadingAgents } = useAgents()
  const { data: skills, isLoading: loadingSkills } = useSkills()
  const { data: workflows, isLoading: loadingWorkflows } = useWorkflows()
  const { data: teams, isLoading: loadingTeams } = useTeams()
  const [selectedSkillId, setSelectedSkillId] = useDetailParam('skill')
  const [selectedWorkflowId, setSelectedWorkflowId] = useDetailParam('workflow')
  const [filterType, setFilterType] = useState<FilterType>('all')
  const [filterModule, setFilterModule] = useState('all')
  const [search, setSearch] = useState('')

  const isLoading = loadingAgents || loadingSkills || loadingWorkflows || loadingTeams

  const allItems = useMemo<ToolkitItem[]>(() => {
    const items: ToolkitItem[] = []
    for (const a of agents ?? []) {
      items.push({
        kind: 'agent',
        id: a.id,
        name: a.name,
        title: a.title,
        icon: a.icon,
        description: a.role,
        module: a.module,
        invoke: `/${a.name}`,
      })
    }
    for (const s of skills ?? []) {
      items.push({
        kind: 'skill',
        id: s.id,
        name: s.name,
        description: s.description,
        module: s.module,
        invoke: `/${s.id}`,
      })
    }
    for (const w of workflows ?? []) {
      items.push({
        kind: 'workflow',
        id: w.id,
        name: w.name,
        description: w.description ?? '',
        module: w.module,
        invoke: w.id,
      })
    }
    for (const t of teams ?? []) {
      items.push({
        kind: 'team',
        id: t.id,
        name: t.name,
        icon: t.icon,
        description: t.description,
        module: t.module,
        invoke: t.name,
      })
    }
    return items
  }, [agents, skills, workflows, teams])

  const modules = useMemo(() => {
    const set = new Set<string>()
    for (const item of allItems) {
      if (item.module) set.add(item.module)
    }
    return Array.from(set).sort()
  }, [allItems])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return allItems.filter((item) => {
      if (filterType !== 'all' && item.kind !== filterType) return false
      if (filterModule !== 'all' && item.module !== filterModule) return false
      if (q) {
        return (
          item.name.toLowerCase().includes(q) ||
          (item.title ?? '').toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [allItems, filterType, filterModule, search])

  // Compute counts from items filtered by module and search (but NOT by type tab),
  // so tab counts reflect how many items are available within the current module/search scope
  const moduleAndSearchFiltered = useMemo(() => {
    const q = search.toLowerCase()
    return allItems.filter((item) => {
      if (filterModule !== 'all' && item.module !== filterModule) return false
      if (q) {
        return (
          item.name.toLowerCase().includes(q) ||
          (item.title ?? '').toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [allItems, filterModule, search])

  const counts = useMemo(() => ({
    all: moduleAndSearchFiltered.length,
    agent: moduleAndSearchFiltered.filter((i) => i.kind === 'agent').length,
    skill: moduleAndSearchFiltered.filter((i) => i.kind === 'skill').length,
    workflow: moduleAndSearchFiltered.filter((i) => i.kind === 'workflow').length,
    team: moduleAndSearchFiltered.filter((i) => i.kind === 'team').length,
  }), [moduleAndSearchFiltered])

  function handleItemClick(item: ToolkitItem) {
    if (item.kind === 'agent') {
      navigate(`/agents/${item.id}`)
    } else if (item.kind === 'skill') {
      setSelectedSkillId(item.id)
    } else if (item.kind === 'team') {
      navigate(`/teams/${item.id}`)
    } else {
      setSelectedWorkflowId(item.id)
    }
  }

  const TYPE_BADGES = {
    agent: { label: 'Agent', colorClass: 'text-[var(--color-accent)] bg-blue-500/10', Icon: Users },
    skill: { label: 'Skill', colorClass: 'text-[var(--color-success)] bg-green-500/10', Icon: Zap },
    workflow: { label: 'Workflow', colorClass: 'text-purple-400 bg-purple-500/10', Icon: GitBranch },
    team: { label: 'Team', colorClass: 'text-amber-400 bg-amber-500/10', Icon: UsersRound },
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Layers size={22} className="text-[var(--color-accent)]" />
        <div>
          <h1 className="text-2xl font-extrabold">Toolkit</h1>
          <p className="text-sm text-[var(--color-muted)]">Everything invocable — agents, skills, and workflows in one view</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter..."
            className="w-full pl-8 pr-3 py-2 text-sm rounded-md bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)] focus:border-[var(--color-accent)] focus:outline-none"
          />
        </div>

        {/* Type tabs */}
        <div className="flex gap-1 bg-[var(--color-surface-raised)] rounded-md p-0.5">
          {(['all', 'agent', 'skill', 'workflow', 'team'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 text-sm rounded transition-colors ${
                filterType === t
                  ? 'bg-[var(--color-bg)] text-[var(--color-text)] font-bold shadow-sm'
                  : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
              }`}
            >
              {t === 'all' ? `All (${counts.all})` :
               t === 'agent' ? `Agents (${counts.agent})` :
               t === 'skill' ? `Skills (${counts.skill})` :
               t === 'workflow' ? `Workflows (${counts.workflow})` :
               `Teams (${counts.team})`}
            </button>
          ))}
        </div>

        {/* Module filter */}
        {modules.length > 0 && (
          <select
            value={filterModule}
            onChange={(e) => setFilterModule(e.target.value)}
            className="px-3 py-2 text-sm rounded-md bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)] text-[var(--color-text)] focus:border-[var(--color-accent)] focus:outline-none"
          >
            <option value="all">All modules</option>
            {modules.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        )}
      </div>

      {/* Results */}
      {isLoading ? (
        <SkeletonList count={8} />
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-sm text-[var(--color-muted)]">
          No items match the current filters
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((item) => {
            const badge = TYPE_BADGES[item.kind]
            const IconComponent = badge.Icon
            return (
              <button
                key={`${item.kind}-${item.id}`}
                onClick={() => handleItemClick(item)}
                className="text-left p-4 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)] hover:border-[var(--color-accent)] transition-colors group"
              >
                <div className="flex items-start gap-3 mb-3">
                  {/* Icon */}
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${badge.colorClass}`}>
                    {item.icon ? (
                      <span className="text-lg leading-none" aria-hidden="true">{item.icon}</span>
                    ) : (
                      <IconComponent size={16} />
                    )}
                  </div>

                  {/* Name/title */}
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-sm truncate group-hover:text-[var(--color-accent)] transition-colors">
                      {item.title || item.name}
                    </p>
                    {item.title && (
                      <p className="text-xs text-[var(--color-muted)] font-[var(--font-mono)] truncate">
                        {item.name}
                      </p>
                    )}
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-[var(--color-muted)] line-clamp-2 mb-3">
                  {item.description}
                </p>

                {/* Footer: invoke hint + type badge */}
                <div className="flex items-center justify-between">
                  <code className="text-xs font-[var(--font-mono)] text-[var(--color-accent)] bg-[var(--color-bg)] border border-[var(--color-border-subtle)] px-1.5 py-0.5 rounded truncate max-w-[60%]">
                    {item.invoke}
                  </code>
                  <div className="flex items-center gap-1.5">
                    {item.module && (
                      <span className="text-xs text-[var(--color-muted)]">{item.module}</span>
                    )}
                    <span className={`text-xs px-1.5 py-0.5 rounded font-bold uppercase ${badge.colorClass}`}>
                      {badge.label}
                    </span>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Skill slide-over */}
      {selectedSkillId && (
        <SkillDetailSlideOver
          skillId={selectedSkillId}
          onClose={() => setSelectedSkillId(null)}
        />
      )}

      {/* Workflow panel */}
      {selectedWorkflowId && (
        <WorkflowDetailPanel
          workflowId={selectedWorkflowId}
          onClose={() => setSelectedWorkflowId(null)}
        />
      )}
    </div>
  )
}
