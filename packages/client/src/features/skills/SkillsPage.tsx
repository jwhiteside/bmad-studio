import { useState, useMemo } from 'react'
import { Zap, Users, GitBranch, Edit, AlertTriangle } from 'lucide-react'
import { Link } from 'react-router-dom'

import { useCompiledSkills } from './use-skills.js'
import { useDrift } from '../drift/use-drift.js'
import { EmptyState } from '../../shared/EmptyState.js'
import { EntityPageHeader } from '../../shared/EntityPageHeader.js'
import { SkeletonList } from '../../shared/Skeleton.js'

type TypeFilter = 'all' | 'agent' | 'workflow'

export function SkillsPage() {
  const { data: items, isLoading } = useCompiledSkills()
  const { count: driftCount, files: driftFiles } = useDrift()
  const [search, setSearch] = useState('')
  const [activeModule, setActiveModule] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')

  // Match drifted file paths to skill IDs by basename (e.g. "_bmad/agents/foo.md" → "foo")
  const driftedIds = useMemo(() => {
    return new Set(driftFiles.map((f) => f.path.split('/').pop()?.replace(/\.[^.]+$/, '') ?? ''))
  }, [driftFiles])

  const modules = useMemo(() => {
    if (!items) return []
    const set = new Set<string>()
    for (const item of items) {
      if (item.module) set.add(item.module)
    }
    return Array.from(set).sort()
  }, [items])

  const moduleCounts = useMemo(() => {
    if (!items) return {}
    const counts: Record<string, number> = {}
    for (const item of items) {
      if (item.module) counts[item.module] = (counts[item.module] ?? 0) + 1
    }
    return counts
  }, [items])

  const filtered = useMemo(() => {
    if (!items) return []
    let result = items

    if (typeFilter !== 'all') {
      result = result.filter((item) => item.type === typeFilter)
    }

    if (activeModule !== 'all') {
      result = result.filter((item) => item.module === activeModule)
    }

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(q) || item.description.toLowerCase().includes(q),
      )
    }
    return result
  }, [items, search, activeModule, typeFilter])

  if (isLoading) {
    return (
      <div>
        <h1 className="text-2xl font-extrabold mb-2">Skills</h1>
        <p className="text-sm text-[var(--color-muted)] mb-6">
          The compiled set of agents and workflows available to your IDE.
        </p>
        <SkeletonList count={4} />
      </div>
    )
  }

  if (!items || items.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-extrabold mb-2">Skills</h1>
        <p className="text-sm text-[var(--color-muted)] mb-6">
          The compiled set of agents and workflows available to your IDE.
        </p>
        <EmptyState
          icon={Zap}
          title="No skills compiled yet"
          description="These are the skills available to your IDE. Agents have personas and menus; Workflows guide multi-step processes. Install a module or create agents and workflows to build your skill set."
          actions={
            <>
              <Link
                to="/modules"
                className="px-4 py-2 text-sm font-bold rounded-md bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] transition-colors"
              >
                Browse Modules
              </Link>
              <Link
                to="/agents"
                className="px-4 py-2 text-sm rounded-md border border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-raised)] transition-colors"
              >
                View Agents
              </Link>
            </>
          }
        />
      </div>
    )
  }

  return (
    <div>
      <EntityPageHeader
        title="Skills"
        count={items.length}
        modules={modules}
        moduleCounts={moduleCounts}
        activeModule={activeModule}
        onModuleChange={setActiveModule}
        search={search}
        onSearchChange={setSearch}
        filteredCount={activeModule !== 'all' || search || typeFilter !== 'all' ? filtered.length : undefined}
        actions={
          <div className="flex items-center gap-1">
            {(['all', 'agent', 'workflow'] as TypeFilter[]).map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-1.5 text-sm rounded-md min-h-[36px] transition-colors capitalize ${
                  typeFilter === t
                    ? 'bg-[var(--color-surface-raised)] text-[var(--color-text)] font-bold'
                    : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
                }`}
              >
                {t === 'all' ? 'All' : t === 'agent' ? 'Agent' : 'Workflow'}
              </button>
            ))}
          </div>
        }
      />

      {driftCount > 0 && (
        <div className="mb-4 flex items-center gap-3 p-3 rounded-lg bg-[var(--color-warning)]/10 border border-[var(--color-warning)]/30">
          <AlertTriangle size={16} className="text-[var(--color-warning)] shrink-0" />
          <div>
            <p className="text-sm font-bold text-[var(--color-warning)]">
              {driftCount} file{driftCount !== 1 ? 's' : ''} drifted from installer baseline
            </p>
            <p className="text-xs text-[var(--color-muted)] mt-0.5">
              {driftFiles.map((f) => f.path.split('/').pop()).join(', ')}
            </p>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {filtered.map((item) => {
          const isDrifted = driftedIds.has(item.id)
          return (
          <div
            key={`${item.type}:${item.id}`}
            className={`w-full text-left p-4 rounded-lg flex items-center justify-between border ${
              isDrifted
                ? 'bg-[var(--color-warning)]/10 border-[var(--color-warning)]/40'
                : 'bg-[var(--color-surface-raised)] border-[var(--color-border-subtle)]'
            }`}
          >
            <div className="flex items-center gap-3">
              {item.type === 'agent' ? (
                <Users size={16} className="text-[var(--color-accent)] shrink-0" />
              ) : (
                <GitBranch size={16} className="text-emerald-500 shrink-0" />
              )}
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold">{item.name}</p>
                  {item.type === 'agent' ? (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)] uppercase tracking-wide">
                      Agent
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 uppercase tracking-wide">
                      Workflow
                    </span>
                  )}
                  {item.module && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-bg)] border border-[var(--color-border-subtle)] text-[var(--color-muted)]">
                      {item.module}
                    </span>
                  )}
                  {isDrifted && (
                    <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--color-warning)]/20 text-[var(--color-warning)] uppercase tracking-wide">
                      <AlertTriangle size={10} />
                      Drifted
                    </span>
                  )}
                </div>
                {item.description && (
                  <p className="text-xs text-[var(--color-muted)] truncate max-w-md mt-0.5">
                    {item.description}
                  </p>
                )}
              </div>
            </div>
            <Link
              to={item.type === 'agent' ? `/agents/${item.id}` : `/workflows/${item.id}`}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md border border-[var(--color-border-subtle)] hover:bg-[var(--color-bg)] hover:border-[var(--color-accent)] text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors shrink-0"
            >
              <Edit size={12} />
              Edit
            </Link>
          </div>
          )
        })}
      </div>

      {filtered.length === 0 && items.length > 0 && (
        <p className="text-center text-sm text-[var(--color-muted)] py-8">
          No skills match the current filter
        </p>
      )}
    </div>
  )
}
