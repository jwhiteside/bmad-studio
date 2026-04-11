import { useState, useEffect } from 'react'
import { X, Save, Search } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'

import type { Agent, SkillListItem } from '@bmad-studio/shared'

type EditAgentDialogProps = {
  agent: Agent
  onClose: () => void
  onSaved: () => void
}

export function EditAgentDialog({ agent, onClose, onSaved }: EditAgentDialogProps) {
  const queryClient = useQueryClient()

  // Determine if this is a built-in agent (override-only editing)
  const isBuiltIn = agent.module === 'bmm' || agent.module === 'core'

  // Form state — pre-populated from agent
  const [title, setTitle] = useState(agent.title || '')
  const [role, setRole] = useState(agent.role || '')
  const [icon, setIcon] = useState(agent.icon || '')
  const [discussion, setDiscussion] = useState(agent.discussion)

  // Skills
  const [skills, setSkills] = useState<Set<string>>(new Set(agent.skills))
  const [availableSkills, setAvailableSkills] = useState<SkillListItem[]>([])
  const [skillSearch, setSkillSearch] = useState('')

  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetch('/api/skills')
      .then((r) => r.json())
      .then((data) => setAvailableSkills(data as SkillListItem[]))
      .catch(() => {})
  }, [])

  const filteredSkills = availableSkills.filter((s) => {
    if (!skillSearch) return true
    const q = skillSearch.toLowerCase()
    return s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)
  })

  const toggleSkill = (skillId: string) => {
    setSkills((prev) => {
      const next = new Set(prev)
      if (next.has(skillId)) next.delete(skillId)
      else next.add(skillId)
      return next
    })
  }

  const handleSave = async () => {
    setSubmitting(true)
    setError(null)
    try {
      // Update skills if changed
      const newSkills = Array.from(skills)
      const skillsChanged =
        newSkills.length !== agent.skills.length ||
        newSkills.some((s) => !agent.skills.includes(s))

      if (skillsChanged) {
        const skillResp = await fetch(`/api/agents/${encodeURIComponent(agent.id)}/skills`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ skills: newSkills }),
        })
        if (!skillResp.ok) {
          const data = (await skillResp.json()) as { error?: { message?: string } }
          throw new Error(data.error?.message ?? 'Failed to update skills')
        }
      }

      // Write override content for all agents
      const escapeYaml = (s: string) => s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
      const overrideContent = [
        `title: "${escapeYaml(title)}"`,
        `role: "${escapeYaml(role)}"`,
        icon ? `icon: "${escapeYaml(icon)}"` : null,
        `discussion: ${discussion}`,
      ]
        .filter((line): line is string => line !== null)
        .join('\n') + '\n'

      const resp = await fetch(`/api/agents/${encodeURIComponent(agent.id)}/override`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: overrideContent }),
      })
      if (!resp.ok) {
        const data = (await resp.json()) as { error?: { message?: string } }
        throw new Error(data.error?.message ?? 'Failed to save override')
      }

      await queryClient.invalidateQueries({ queryKey: ['agents'] })
      await queryClient.invalidateQueries({ queryKey: ['agent', agent.id] })
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save agent')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-[var(--color-bg)] border border-[var(--color-border-subtle)] rounded-lg shadow-xl w-full max-w-2xl p-6 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold">Edit Agent</h2>
            {isBuiltIn && (
              <p className="text-xs text-[var(--color-warning)] mt-1">
                Override mode — base file will not be modified
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-[var(--color-muted)] hover:text-[var(--color-text)]"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto flex-1 pr-1">
          {/* Title */}
          <div>
            <label className="block text-sm font-bold mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Project Manager"
              className="w-full px-3 py-2 text-sm rounded-md bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)] focus:border-[var(--color-accent)] focus:outline-none"
            />
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-bold mb-1">Role</label>
            <textarea
              value={role}
              onChange={(e) => setRole(e.target.value)}
              rows={2}
              placeholder="Describe the agent's role..."
              className="w-full px-3 py-2 text-sm rounded-md bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)] focus:border-[var(--color-accent)] focus:outline-none resize-none"
            />
          </div>

          {/* Icon */}
          <div>
            <label className="block text-sm font-bold mb-1">Icon</label>
            <input
              type="text"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              placeholder="e.g. a single emoji"
              className="w-full px-3 py-2 text-sm rounded-md bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)] focus:border-[var(--color-accent)] focus:outline-none"
            />
          </div>

          {/* Discussion mode */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-bold">Discussion mode</label>
            <button
              onClick={() => setDiscussion(!discussion)}
              className={`relative w-10 h-5 rounded-full transition-colors ${
                discussion ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)]'
              }`}
            >
              <span
                className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                  discussion ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {/* Skills */}
          <div>
            <label className="block text-sm font-bold mb-1">
              Skills ({skills.size} assigned)
            </label>
            <div className="relative mb-2">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)]"
              />
              <input
                type="text"
                value={skillSearch}
                onChange={(e) => setSkillSearch(e.target.value)}
                placeholder="Search skills..."
                className="w-full pl-9 pr-3 py-2 text-sm rounded-md bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)] focus:border-[var(--color-accent)] focus:outline-none"
              />
            </div>
            <div className="max-h-48 overflow-y-auto border border-[var(--color-border-subtle)] rounded-md">
              {filteredSkills.length === 0 ? (
                <p className="text-xs text-[var(--color-muted)] p-3 text-center">No skills found</p>
              ) : (
                filteredSkills.map((skill) => (
                  <label
                    key={skill.id}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-[var(--color-surface-raised)] cursor-pointer text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={skills.has(skill.id)}
                      onChange={() => toggleSkill(skill.id)}
                      className="accent-[var(--color-accent)]"
                    />
                    <span className="truncate font-bold">{skill.name}</span>
                    <span className="text-xs text-[var(--color-muted)] truncate ml-auto">
                      {skill.description}
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>

          {/* Agent ID and module (read-only info) */}
          <div className="text-xs text-[var(--color-muted)] space-y-1 pt-2 border-t border-[var(--color-border-subtle)]">
            <p>ID: <code className="font-[var(--font-mono)]">{agent.id}</code></p>
            <p>Module: <code className="font-[var(--font-mono)]">{agent.module ?? 'custom'}</code></p>
            <p>File: <code className="font-[var(--font-mono)] break-all">{agent.filePath}</code></p>
          </div>

          {error && <p className="text-sm text-[var(--color-error)]">{error}</p>}
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[var(--color-border-subtle)]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-md border border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-raised)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={submitting}
            className="px-4 py-2 text-sm font-bold rounded-md bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            <Save size={14} />
            {submitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
