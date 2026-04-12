import { useState, useEffect } from 'react'
import { Plus, Search, X } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'

import type { AgentListItem } from '@bmad-studio/shared'

type ModuleOption = {
  name: string
}

type CreateTeamDialogProps = {
  onClose: () => void
  onCreated: () => void
}

export function CreateTeamDialog({ onClose, onCreated }: CreateTeamDialogProps) {
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('')
  const [description, setDescription] = useState('')
  const [moduleName, setModuleName] = useState('')
  const [selectedAgents, setSelectedAgents] = useState<Set<string>>(new Set())
  const [agentSearch, setAgentSearch] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [modules, setModules] = useState<ModuleOption[]>([])
  const [agents, setAgents] = useState<AgentListItem[]>([])

  useEffect(() => {
    fetch('/api/modules')
      .then((r) => r.json())
      .then((data) => {
        const mods = data as Array<{ name: string }>
        setModules(mods.map((m) => ({ name: m.name })))
        if (mods.length === 1) setModuleName(mods[0].name)
      })
      .catch(() => {})

    fetch('/api/agents')
      .then((r) => r.json())
      .then((data) => setAgents(data as AgentListItem[]))
      .catch(() => {})
  }, [])

  const filteredAgents = agents.filter((a) => {
    if (!agentSearch) return true
    const q = agentSearch.toLowerCase()
    return (
      a.name.toLowerCase().includes(q) ||
      a.title.toLowerCase().includes(q) ||
      (a.role && a.role.toLowerCase().includes(q))
    )
  })

  const canSubmit = name.trim().length > 0 && moduleName.length > 0

  const handleCreate = async () => {
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)
    try {
      const resp = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          icon: icon.trim(),
          description: description.trim(),
          agentIds: Array.from(selectedAgents),
          module: moduleName,
        }),
      })
      if (!resp.ok) {
        const data = (await resp.json()) as { error?: { message?: string } }
        throw new Error(data.error?.message ?? 'Failed to create team')
      }
      await queryClient.invalidateQueries({ queryKey: ['teams'] })
      onCreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create team')
    } finally {
      setSubmitting(false)
    }
  }

  const toggleAgent = (agentId: string) => {
    setSelectedAgents((prev) => {
      const next = new Set(prev)
      if (next.has(agentId)) {
        next.delete(agentId)
      } else {
        next.add(agentId)
      }
      return next
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-team-title"
        className="relative bg-[var(--color-bg)] border border-[var(--color-border-subtle)] rounded-lg shadow-xl w-full max-w-lg p-6 max-h-[85vh] flex flex-col"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 id="create-team-title" className="text-lg font-bold">New Team</h2>
          <button
            onClick={onClose}
            className="text-[var(--color-muted)] hover:text-[var(--color-text)]"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto flex-1 pr-1">
          {/* Name + Icon row (matches Agent dialog pattern) */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-bold mb-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Frontend Squad"
                className="w-full px-3 py-2 text-sm rounded-md bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)] focus:border-[var(--color-accent)] focus:outline-none"
              />
            </div>
            <div className="w-20">
              <label className="block text-xs font-bold mb-1">Icon</label>
              <input
                type="text"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                placeholder="🚀"
                className="w-full px-3 py-2 text-sm rounded-md bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)] focus:border-[var(--color-accent)] outline-none min-h-[36px] text-center"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-bold mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this team do?"
              rows={3}
              className="w-full px-3 py-2 text-sm rounded-md bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)] focus:border-[var(--color-accent)] focus:outline-none resize-none"
            />
          </div>

          {/* Module */}
          <div>
            <label className="block text-sm font-bold mb-1">Module</label>
            <select
              value={moduleName}
              onChange={(e) => setModuleName(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-md bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)] focus:border-[var(--color-accent)] focus:outline-none"
            >
              <option value="">Select a module...</option>
              {modules.map((m) => (
                <option key={m.name} value={m.name}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* Agent selection */}
          <div>
            <label className="block text-sm font-bold mb-1">
              Agents ({selectedAgents.size} selected)
            </label>
            <div className="relative mb-2">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)]"
              />
              <input
                type="text"
                value={agentSearch}
                onChange={(e) => setAgentSearch(e.target.value)}
                placeholder="Search agents..."
                className="w-full pl-9 pr-3 py-2 text-sm rounded-md bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)] focus:border-[var(--color-accent)] focus:outline-none"
              />
            </div>
            <div className="max-h-48 overflow-y-auto border border-[var(--color-border-subtle)] rounded-md">
              {filteredAgents.length === 0 ? (
                <p className="text-xs text-[var(--color-muted)] p-3 text-center">No agents found</p>
              ) : (
                filteredAgents.map((agent) => (
                  <label
                    key={agent.id}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-[var(--color-surface-raised)] cursor-pointer text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={selectedAgents.has(agent.id)}
                      onChange={() => toggleAgent(agent.id)}
                      className="accent-[var(--color-accent)]"
                    />
                    <span className="flex items-center gap-2 min-w-0">
                      {agent.icon && (
                        <span className="text-sm leading-none">{agent.icon}</span>
                      )}
                      <span className="truncate font-bold">{agent.title || agent.name}</span>
                      {agent.title && (
                        <span className="text-xs text-[var(--color-muted)] truncate">
                          ({agent.name})
                        </span>
                      )}
                    </span>
                  </label>
                ))
              )}
            </div>
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
            onClick={handleCreate}
            disabled={!canSubmit || submitting}
            className="px-4 py-2 text-sm font-bold rounded-md bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            <Plus size={14} />
            {submitting ? 'Creating...' : 'Create Team'}
          </button>
        </div>
      </div>
    </div>
  )
}
