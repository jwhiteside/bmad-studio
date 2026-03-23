import { useState, useMemo, useCallback } from 'react'
import { X, Plus, Minus, Search, GripVertical } from 'lucide-react'
import { DragDropProvider, useDraggable, useDroppable } from '@dnd-kit/react'

import { useSkills } from '../skills/use-skills.js'
import { DiffViewer } from '../../shared/diff-viewer/DiffViewer.js'

type SkillAssignmentPanelProps = {
  agentName: string
  currentSkills: string[]
  onSave: (skills: string[]) => void
  onClose: () => void
}

type SkillInfo = {
  id: string
  name: string
  description: string
  module?: string
}

// Draggable skill item for the available pool
function DraggableSkillItem({
  skill,
  onAdd,
}: {
  skill: SkillInfo
  onAdd: () => void
}) {
  const { ref, isDragging } = useDraggable({
    id: `available-${skill.id}`,
    data: { skillName: skill.name, skillId: skill.id },
  })

  return (
    <div
      ref={ref}
      className={`w-full flex items-center gap-2 px-3 py-2 text-left rounded-md hover:bg-[var(--color-surface-raised)] transition-colors group cursor-grab active:cursor-grabbing ${
        isDragging ? 'opacity-40' : ''
      }`}
    >
      <GripVertical
        size={14}
        className="text-[var(--color-muted)] shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-bold truncate">{skill.name}</p>
          {skill.module && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--color-bg)] border border-[var(--color-border-subtle)] text-[var(--color-muted)] shrink-0">
              {skill.module}
            </span>
          )}
        </div>
        {skill.description && (
          <p className="text-xs text-[var(--color-muted)] truncate">{skill.description}</p>
        )}
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation()
          onAdd()
        }}
        className="text-[var(--color-success)] shrink-0 opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
        title="Add skill"
      >
        <Plus size={14} />
      </button>
    </div>
  )
}

// Droppable area for assigned skills
function AssignedDropZone({
  children,
  isEmpty,
}: {
  children: React.ReactNode
  isEmpty: boolean
}) {
  const { ref, isDropTarget } = useDroppable({
    id: 'assigned-skills-zone',
  })

  return (
    <div
      ref={ref}
      className={`flex-1 overflow-y-auto p-2 transition-colors ${
        isDropTarget
          ? 'bg-[var(--color-accent)]/5 ring-2 ring-inset ring-[var(--color-accent)]/30 rounded-lg'
          : ''
      }`}
    >
      {children}
      {isEmpty && !isDropTarget && (
        <p className="text-sm text-[var(--color-muted)] text-center py-4">
          No skills assigned
        </p>
      )}
      {/* Drop hint at the bottom */}
      <div
        className={`mt-2 py-3 border-2 border-dashed rounded-lg text-center transition-all ${
          isDropTarget
            ? 'border-[var(--color-accent)] text-[var(--color-accent)]'
            : 'border-[var(--color-border-subtle)] text-[var(--color-muted)]'
        }`}
      >
        <p className="text-xs">Drop skills here to assign</p>
      </div>
    </div>
  )
}

export function SkillAssignmentPanel({
  agentName,
  currentSkills,
  onSave,
  onClose,
}: SkillAssignmentPanelProps) {
  const { data: allSkills } = useSkills()
  const [assignedSkills, setAssignedSkills] = useState<string[]>(currentSkills)
  const [search, setSearch] = useState('')
  const [showDiff, setShowDiff] = useState(false)

  const availableSkills = useMemo(() => {
    if (!allSkills) return []
    const assigned = new Set(assignedSkills)
    let available = allSkills.filter(
      (s) => !assigned.has(s.id) && !assigned.has(s.name),
    )
    if (search) {
      const q = search.toLowerCase()
      available = available.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q),
      )
    }
    return available
  }, [allSkills, assignedSkills, search])

  const addSkill = useCallback((skillName: string) => {
    setAssignedSkills((prev) => {
      if (prev.includes(skillName)) return prev
      return [...prev, skillName]
    })
  }, [])

  const removeSkill = useCallback((skillName: string) => {
    setAssignedSkills((prev) => prev.filter((s) => s !== skillName))
  }, [])

  const handleDragEnd = useCallback(
    (event: { operation: { source: { data: Record<string, unknown> } | null; target: { id: string | number } | null } }) => {
      const { source, target } = event.operation
      if (
        source?.data?.skillName &&
        target?.id === 'assigned-skills-zone'
      ) {
        addSkill(source.data.skillName as string)
      }
    },
    [addSkill],
  )

  const hasChanges =
    JSON.stringify(assignedSkills) !== JSON.stringify(currentSkills)

  if (showDiff) {
    const original = currentSkills.join('\n')
    const modified = assignedSkills.join('\n')
    return (
      <div className="h-full flex flex-col">
        <div className="px-6 py-4 border-b border-[var(--color-border-subtle)]">
          <h2 className="text-lg font-bold">
            Review Skill Changes: {agentName}
          </h2>
        </div>
        <div className="flex-1 overflow-hidden">
          <DiffViewer
            original={original}
            modified={modified}
            onConfirm={() => onSave(assignedSkills)}
            onCancel={() => setShowDiff(false)}
          />
        </div>
      </div>
    )
  }

  return (
    <DragDropProvider onDragEnd={handleDragEnd}>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--color-border-subtle)] flex items-center justify-between">
          <h2 className="text-lg font-bold">Assign Skills: {agentName}</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDiff(true)}
              disabled={!hasChanges}
              className="px-3 py-1.5 text-sm font-bold rounded-md bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Review Changes
            </button>
            <button
              onClick={onClose}
              className="text-[var(--color-muted)] hover:text-[var(--color-text)]"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Available skills pool */}
          <div className="w-1/2 border-r border-[var(--color-border-subtle)] flex flex-col">
            <div className="p-4 border-b border-[var(--color-border-subtle)]">
              <h3 className="text-sm font-bold mb-2">Available Skills</h3>
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-muted)]"
                />
                <input
                  type="text"
                  placeholder="Search skills..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-sm rounded-md bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)] text-[var(--color-text)] placeholder:text-[var(--color-muted)] outline-none focus:border-[var(--color-accent)]"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {availableSkills.map((skill) => (
                <DraggableSkillItem
                  key={skill.id}
                  skill={skill}
                  onAdd={() => addSkill(skill.name)}
                />
              ))}
              {availableSkills.length === 0 && (
                <p className="text-sm text-[var(--color-muted)] text-center py-4">
                  {search ? 'No matching skills' : 'All skills assigned'}
                </p>
              )}
            </div>
          </div>

          {/* Assigned skills */}
          <div className="w-1/2 flex flex-col">
            <div className="p-4 border-b border-[var(--color-border-subtle)]">
              <h3 className="text-sm font-bold">
                Assigned Skills ({assignedSkills.length})
              </h3>
            </div>
            <AssignedDropZone isEmpty={assignedSkills.length === 0}>
              {assignedSkills.map((skill) => (
                <div
                  key={skill}
                  className="flex items-center justify-between px-3 py-2 rounded-md hover:bg-[var(--color-surface-raised)] transition-colors group"
                >
                  <span className="text-sm">{skill}</span>
                  <button
                    onClick={() => removeSkill(skill)}
                    className="text-[var(--color-error)] opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove skill"
                  >
                    <Minus size={14} />
                  </button>
                </div>
              ))}
            </AssignedDropZone>
          </div>
        </div>
      </div>
    </DragDropProvider>
  )
}
