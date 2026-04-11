import { useState, useMemo } from 'react'
import { Users, Plus } from 'lucide-react'

import type { TeamListItem } from '@bmad-studio/shared'

import { useTeams } from './use-teams.js'
import { TeamDetailPanel } from './TeamDetailPanel.js'
import { CreateTeamDialog } from './CreateTeamDialog.js'
import { EmptyState } from '../../shared/EmptyState.js'
import { EntityPageHeader } from '../../shared/EntityPageHeader.js'
import { SkeletonCard } from '../../shared/Skeleton.js'
import { useDetailParam } from '../../hooks/use-detail-param.js'

function TeamCard({
  team,
  isSelected,
  onClick,
}: {
  team: TeamListItem
  isSelected: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`p-4 rounded-lg border text-left transition-all cursor-pointer hover:-translate-y-0.5 hover:shadow-md ${
        isSelected
          ? 'bg-[var(--color-surface-raised)] border-[var(--color-accent)]'
          : 'bg-[var(--color-surface-raised)] border-[var(--color-border-subtle)] hover:border-[var(--color-accent)]'
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        {team.icon && <span className="text-lg leading-none">{team.icon}</span>}
        <span className="font-bold text-sm truncate">{team.name}</span>
        {team.module && (
          <span className="text-xs px-1.5 py-0.5 rounded-full bg-[var(--color-bg)] border border-[var(--color-border-subtle)] text-[var(--color-muted)] shrink-0">
            {team.module}
          </span>
        )}
      </div>
      {team.description && (
        <p className="text-xs text-[var(--color-muted)] line-clamp-2 mb-2">{team.description}</p>
      )}
      {team.agentIds && team.agentIds.length > 0 && (
        <div className="flex items-center gap-1 mb-2 flex-wrap">
          {team.agentIds.slice(0, 8).map((id) => (
            <span
              key={id}
              title={id}
              className="w-6 h-6 rounded-full bg-[var(--color-bg)] border border-[var(--color-border-subtle)] text-xs flex items-center justify-center font-bold text-[var(--color-muted)] uppercase shrink-0"
            >
              {id.charAt(0)}
            </span>
          ))}
          {team.agentIds.length > 8 && (
            <span className="text-xs text-[var(--color-muted)]">+{team.agentIds.length - 8} more</span>
          )}
        </div>
      )}
      <div className="flex items-center justify-between">
        <span className="text-xs text-[var(--color-muted)]">
          <Users size={10} className="inline mr-1" />
          {team.memberCount} members
        </span>
      </div>
    </button>
  )
}

export function TeamsPage() {
  const { data: teams, isLoading, refetch } = useTeams()
  const [selectedId, setSelectedId] = useDetailParam('detail')
  const [activeModule, setActiveModule] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)

  const modules = useMemo(() => {
    if (!teams) return []
    const set = new Set<string>()
    for (const t of teams) {
      if (t.module) set.add(t.module)
    }
    return Array.from(set).sort()
  }, [teams])

  const filtered = useMemo(() => {
    if (!teams) return []
    let result = teams

    if (activeModule !== 'all') {
      result = result.filter((t) => t.module === activeModule)
    }

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (t) => t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q),
      )
    }

    return result
  }, [teams, activeModule, search])

  const moduleCounts = useMemo(() => {
    if (!teams) return {}
    const counts: Record<string, number> = {}
    for (const t of teams) {
      if (t.module) counts[t.module] = (counts[t.module] ?? 0) + 1
    }
    return counts
  }, [teams])

  if (isLoading) {
    return (
      <div>
        <h1 className="text-2xl font-extrabold mb-8">Teams</h1>
        <SkeletonCard count={3} />
      </div>
    )
  }

  if (!teams || teams.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-extrabold mb-8">Teams</h1>
        <EmptyState
          icon={Users}
          title="No teams found"
          description="Teams group agents for collaborative workflows and Party Mode. Create a team to get started."
          actions={
            <button
              onClick={() => setShowCreate(true)}
              className="px-4 py-2 text-sm font-bold rounded-md bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] transition-colors flex items-center gap-1.5"
            >
              <Plus size={14} />
              Create Team
            </button>
          }
        />
        {showCreate && (
          <CreateTeamDialog
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

  return (
    <div>
      <EntityPageHeader
        title="Teams"
        count={teams.length}
        modules={modules}
        moduleCounts={moduleCounts}
        activeModule={activeModule}
        onModuleChange={setActiveModule}
        search={search}
        onSearchChange={setSearch}
        actions={
          <button
            onClick={() => setShowCreate(true)}
            className="px-4 py-2 text-sm font-bold rounded-md bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] transition-colors flex items-center gap-1.5"
          >
            <Plus size={14} />
            Create Team
          </button>
        }
      />

      {/* Card grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((team) => (
          <TeamCard
            key={team.id}
            team={team}
            isSelected={selectedId === team.id}
            onClick={() => setSelectedId(selectedId === team.id ? null : team.id)}
          />
        ))}
      </div>

      {filtered.length === 0 && teams.length > 0 && (
        <p className="text-sm text-[var(--color-muted)] text-center py-8">
          No teams match your search.
        </p>
      )}

      {selectedId && (
        <TeamDetailPanel
          teamId={selectedId}
          onClose={() => setSelectedId(null)}
          onTeamUpdated={() => refetch()}
        />
      )}

      {showCreate && (
        <CreateTeamDialog
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
