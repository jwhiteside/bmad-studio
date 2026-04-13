import { useState, useMemo } from 'react'
import { Users, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'

import { useAgents } from './use-agents.js'
import { AgentCard } from './AgentCard.js'
import { CreateAgentDialog } from './CreateAgentDialog.js'
import { EmptyState } from '../../shared/EmptyState.js'
import { EntityPageHeader } from '../../shared/EntityPageHeader.js'
import { CardGrid } from '../../shared/EntityCard.js'
import { SkeletonCard } from '../../shared/Skeleton.js'

export function AgentsPage() {
  const { data: agents, isLoading, error, refetch } = useAgents()
  const [activeModule, setActiveModule] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)

  const modules = useMemo(() => {
    if (!agents) return []
    const moduleSet = new Set<string>()
    for (const a of agents) {
      if (a.module) moduleSet.add(a.module)
    }
    return Array.from(moduleSet).sort()
  }, [agents])

  const moduleCounts = useMemo(() => {
    if (!agents) return {}
    const counts: Record<string, number> = {}
    for (const a of agents) {
      if (a.module) counts[a.module] = (counts[a.module] ?? 0) + 1
    }
    return counts
  }, [agents])

  const filtered = useMemo(() => {
    if (!agents) return []

    let result = agents

    if (activeModule !== 'all') {
      result = result.filter((a) => a.module === activeModule)
    }

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.title.toLowerCase().includes(q) ||
          a.role.toLowerCase().includes(q),
      )
    }

    return result
  }, [agents, activeModule, search])

  if (isLoading) {
    return (
      <div>
        <h1 className="text-2xl font-extrabold mb-2">Agents</h1>
        <p className="text-sm text-[var(--color-muted)] mb-6">AI agents defined in your BMAD project — each with a role, persona, and assigned skills.</p>
        <SkeletonCard count={4} />
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <h1 className="text-2xl font-extrabold mb-2">Agents</h1>
        <p className="text-sm text-[var(--color-muted)] mb-6">AI agents defined in your BMAD project — each with a role, persona, and assigned skills.</p>
        <p className="text-[var(--color-error)]">Failed to load agents: {error.message}</p>
      </div>
    )
  }

  if (!agents || agents.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-extrabold mb-2">Agents</h1>
        <p className="text-sm text-[var(--color-muted)] mb-6">AI agents defined in your BMAD project — each with a role, persona, and assigned skills.</p>
        <EmptyState
          icon={Users}
          title="No agents found"
          description="Agents are AI personas with defined roles, skills, and communication styles. Each agent specialises in a domain — like a developer, analyst, or project manager — and is invoked by name in your IDE. Install a module to get a curated set of agents, or create a custom one."
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
                New Agent
              </button>
            </>
          }
        />
        {showCreate && (
          <CreateAgentDialog onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); void refetch() }} />
        )}
      </div>
    )
  }

  return (
    <div>
      <EntityPageHeader
        title="Agents"
        count={agents.length}
        modules={modules}
        moduleCounts={moduleCounts}
        activeModule={activeModule}
        onModuleChange={setActiveModule}
        search={search}
        onSearchChange={setSearch}
        filteredCount={activeModule !== 'all' || search ? filtered.length : undefined}
        actions={
          <button
            onClick={() => setShowCreate(true)}
            className="px-4 py-2 text-sm font-bold rounded-md bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] transition-colors flex items-center gap-1.5"
          >
            <Plus size={14} />
            New Agent
          </button>
        }
      />

      {/* Card grid */}
      <CardGrid>
        {filtered.map((agent) => (
          <AgentCard key={agent.id} agent={agent} />
        ))}
      </CardGrid>

      {filtered.length === 0 && (
        <p className="text-center text-sm text-[var(--color-muted)] py-8">
          No agents match the current filter
        </p>
      )}

      {showCreate && (
        <CreateAgentDialog
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); void refetch() }}
        />
      )}
    </div>
  )
}
