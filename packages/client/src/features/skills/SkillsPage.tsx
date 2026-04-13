import { useState, useMemo } from 'react'
import { Zap, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'

import { useSkills } from './use-skills.js'
import { SkillDetailSlideOver } from './SkillDetailSlideOver.js'
import { CreateSkillDialog } from './CreateSkillDialog.js'
import { EmptyState } from '../../shared/EmptyState.js'
import { EntityPageHeader } from '../../shared/EntityPageHeader.js'
import { SkeletonList } from '../../shared/Skeleton.js'
import { useDetailParam } from '../../hooks/use-detail-param.js'

export function SkillsPage() {
  const { data: skills, isLoading, refetch } = useSkills()
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useDetailParam('detail')
  const [activeModule, setActiveModule] = useState<string>('all')
  const [showCreate, setShowCreate] = useState(false)

  const modules = useMemo(() => {
    if (!skills) return []
    const set = new Set<string>()
    for (const s of skills) {
      if (s.module) set.add(s.module)
    }
    return Array.from(set).sort()
  }, [skills])

  const filtered = useMemo(() => {
    if (!skills) return []
    let result = skills

    if (activeModule !== 'all') {
      result = result.filter((s) => s.module === activeModule)
    }

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (s) => s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q),
      )
    }
    return result
  }, [skills, search, activeModule])

  const moduleCounts = useMemo(() => {
    if (!skills) return {}
    const counts: Record<string, number> = {}
    for (const s of skills) {
      if (s.module) counts[s.module] = (counts[s.module] ?? 0) + 1
    }
    return counts
  }, [skills])

  if (isLoading) {
    return (
      <div>
        <h1 className="text-2xl font-extrabold mb-2">Skills</h1>
        <p className="text-sm text-[var(--color-muted)] mb-6">Standalone prompts that can be invoked directly or assigned to agents.</p>
        <SkeletonList count={4} />
      </div>
    )
  }

  if (!skills || skills.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-extrabold mb-2">Skills</h1>
        <p className="text-sm text-[var(--color-muted)] mb-6">Standalone prompts that can be invoked directly or assigned to agents.</p>
        <EmptyState
          icon={Zap}
          title="No skills found"
          description="Skills are reusable instruction sets — slash commands you invoke in your IDE like /create-prd or /sprint-planning. They can be attached to agents or called directly. Install a module to get a set of ready-made skills, or create your own."
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
                New Skill
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
          title="Skills"
          count={skills.length}
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
              New Skill
            </button>
          }
        />

        <div className="space-y-3">
          {filtered.map((skill) => (
            <button
              key={skill.id}
              onClick={() => setSelectedId(skill.id)}
              className={`w-full text-left p-4 rounded-lg flex items-center justify-between transition-colors ${
                selectedId === skill.id
                  ? 'bg-[var(--color-surface-raised)] border border-[var(--color-accent)]'
                  : 'bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)] hover:border-[var(--color-accent)]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Zap size={16} className="text-[var(--color-accent)] shrink-0" />
                <div>
                  <p className="text-sm font-bold">{skill.name}</p>
                  <p className="text-xs text-[var(--color-muted)] truncate max-w-md">
                    {skill.description}
                  </p>
                </div>
              </div>
              {skill.module && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-bg)] border border-[var(--color-border-subtle)] text-[var(--color-muted)]">
                  {skill.module}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
      {selectedId && (
        <SkillDetailSlideOver skillId={selectedId} onClose={() => setSelectedId(null)} />
      )}
      {showCreate && (
        <CreateSkillDialog
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
