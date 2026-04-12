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
import {
  EntityCard,
  CardIcon,
  CardHeader,
  CardBody,
  CardDescription,
  CardFooter,
  ModuleBadge,
  CardGrid,
} from '../../shared/EntityCard.js'

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
    <EntityCard onClick={onClick} selected={isSelected}>
      <CardHeader
        icon={
          <CardIcon
            emoji={team.icon}
            fallbackIcon={<Users size={16} />}
          />
        }
        title={team.name}
        subtitle={`${team.memberCount} members`}
      />
      <CardBody>
        {team.description ? (
          <CardDescription text={team.description} />
        ) : (
          <div className="h-4" />
        )}
        {team.agentIds && team.agentIds.length > 0 && (
          <div className="flex items-center gap-1 mt-2 flex-wrap">
            {team.agentIds.slice(0, 6).map((id) => (
              <span
                key={id}
                title={id}
                className="w-6 h-6 rounded-full bg-[var(--color-bg)] border border-[var(--color-border-subtle)] text-xs flex items-center justify-center font-bold text-[var(--color-muted)] uppercase shrink-0"
              >
                {id.charAt(0)}
              </span>
            ))}
            {team.agentIds.length > 6 && (
              <span className="text-xs text-[var(--color-muted)]">+{team.agentIds.length - 6}</span>
            )}
          </div>
        )}
      </CardBody>
      <CardFooter right={<ModuleBadge module={team.module} />} />
    </EntityCard>
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
              New Team
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
            New Team
          </button>
        }
      />

      {/* Card grid */}
      <CardGrid>
        {filtered.map((team) => (
          <TeamCard
            key={team.id}
            team={team}
            isSelected={selectedId === team.id}
            onClick={() => setSelectedId(selectedId === team.id ? null : team.id)}
          />
        ))}
      </CardGrid>

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
