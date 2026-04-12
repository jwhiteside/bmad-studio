import { useState, useEffect } from 'react'
import { X, Users } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'

type CreateAgentDialogProps = {
  onClose: () => void
  onCreated: () => void
}

type ModuleOption = { name: string }
type SkillOption = { id: string; name: string; description: string }

const KEBAB_RE = /^[a-z][a-z0-9-]*$/

export function CreateAgentDialog({ onClose, onCreated }: CreateAgentDialogProps) {
  const queryClient = useQueryClient()

  const [name, setName] = useState('')
  const [title, setTitle] = useState('')
  const [icon, setIcon] = useState('')
  const [role, setRole] = useState('')
  const [persona, setPersona] = useState('')
  const [selectedSkills, setSelectedSkills] = useState<Set<string>>(new Set())
  const [skillSearch, setSkillSearch] = useState('')
  const [moduleName, setModuleName] = useState('')
  const [modules, setModules] = useState<ModuleOption[]>([])
  const [availableSkills, setAvailableSkills] = useState<SkillOption[]>([])
  const [nameBlurred, setNameBlurred] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetch('/api/modules')
      .then((r) => r.json())
      .then((data) => {
        const mods = data as Array<{ name: string }>
        setModules(mods.filter((m) => m.name !== 'bmm' && m.name !== 'core'))
        if (mods.length > 0) {
          const first = mods.find((m) => m.name !== 'bmm' && m.name !== 'core')
          if (first) setModuleName(first.name)
        }
      })
      .catch(() => {})
    fetch('/api/skills')
      .then((r) => r.json())
      .then((data) => setAvailableSkills(data as SkillOption[]))
      .catch(() => {})
  }, [])

  const nameError = nameBlurred && name && !KEBAB_RE.test(name)
    ? 'Name must be lowercase letters, numbers, and hyphens only'
    : null

  const filteredSkills = availableSkills.filter((s) => {
    if (!skillSearch) return true
    const q = skillSearch.toLowerCase()
    return s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)
  })

  const toggleSkill = (id: string) => {
    setSelectedSkills((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !KEBAB_RE.test(name) || !moduleName) return
    setSubmitting(true)
    setError(null)
    try {
      const resp = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          title: title || name,
          icon: icon || undefined,
          role,
          persona,
          skills: Array.from(selectedSkills),
          module: moduleName,
        }),
      })
      if (!resp.ok) {
        const data = (await resp.json()) as { error?: { message?: string } }
        throw new Error(data.error?.message ?? 'Failed to create agent')
      }
      await queryClient.invalidateQueries({ queryKey: ['agents'] })
      onCreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create agent')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-[var(--color-bg)] rounded-xl border border-[var(--color-border-subtle)] shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border-subtle)] shrink-0">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-[var(--color-accent)]" />
            <h2 className="text-lg font-bold">New Agent</h2>
          </div>
          <button onClick={onClose} className="text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
            {/* Name + Icon row */}
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs font-bold mb-1">
                  ID / Name <span className="text-[var(--color-error)]">*</span>
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={() => setNameBlurred(true)}
                  placeholder="my-agent"
                  className="w-full px-3 py-2 text-sm rounded-md bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)] focus:border-[var(--color-accent)] outline-none min-h-[36px]"
                />
                {nameError && <p className="text-xs text-[var(--color-error)] mt-1">{nameError}</p>}
                <p className="text-[11px] text-[var(--color-muted)] mt-1">Kebab-case ID used for invocation: /my-agent</p>
              </div>
              <div className="w-20">
                <label className="block text-xs font-bold mb-1">Icon</label>
                <input
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  placeholder="🤖"
                  className="w-full px-3 py-2 text-sm rounded-md bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)] focus:border-[var(--color-accent)] outline-none min-h-[36px] text-center"
                />
              </div>
            </div>

            {/* Display title */}
            <div>
              <label className="block text-xs font-bold mb-1">Display Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Frontend Developer"
                className="w-full px-3 py-2 text-sm rounded-md bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)] focus:border-[var(--color-accent)] outline-none min-h-[36px]"
              />
              <p className="text-[11px] text-[var(--color-muted)] mt-1">Human-readable name shown in the UI. Defaults to ID if left blank.</p>
            </div>

            {/* Role / description */}
            <div>
              <label className="block text-xs font-bold mb-1">Role / Capabilities</label>
              <input
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. React specialist, component design, accessibility"
                className="w-full px-3 py-2 text-sm rounded-md bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)] focus:border-[var(--color-accent)] outline-none min-h-[36px]"
              />
            </div>

            {/* Persona */}
            <div>
              <label className="block text-xs font-bold mb-1">Persona Instructions</label>
              <textarea
                value={persona}
                onChange={(e) => setPersona(e.target.value)}
                placeholder="Describe how this agent should behave, its communication style, and what it specialises in..."
                rows={4}
                className="w-full px-3 py-2 text-sm rounded-md bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)] focus:border-[var(--color-accent)] outline-none resize-none"
              />
            </div>

            {/* Module */}
            <div>
              <label className="block text-xs font-bold mb-1">
                Module <span className="text-[var(--color-error)]">*</span>
              </label>
              {modules.length > 0 ? (
                <select
                  value={moduleName}
                  onChange={(e) => setModuleName(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-md bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)] focus:border-[var(--color-accent)] outline-none min-h-[36px]"
                >
                  {modules.map((m) => (
                    <option key={m.name} value={m.name}>{m.name}</option>
                  ))}
                </select>
              ) : (
                <p className="text-xs text-[var(--color-muted)] py-2">No custom modules found. Create a module first.</p>
              )}
            </div>

            {/* Skills */}
            <div>
              <label className="block text-xs font-bold mb-1">Skills ({selectedSkills.size} selected)</label>
              <input
                value={skillSearch}
                onChange={(e) => setSkillSearch(e.target.value)}
                placeholder="Search skills..."
                className="w-full px-3 py-2 text-sm rounded-md bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)] focus:border-[var(--color-accent)] outline-none min-h-[36px] mb-2"
              />
              <div className="max-h-36 overflow-y-auto space-y-1 rounded-md border border-[var(--color-border-subtle)] p-1">
                {filteredSkills.length === 0 ? (
                  <p className="text-xs text-[var(--color-muted)] p-2">No skills found</p>
                ) : (
                  filteredSkills.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => toggleSkill(s.id)}
                      className={`w-full text-left px-2 py-1.5 rounded text-xs transition-colors flex items-center gap-2 ${
                        selectedSkills.has(s.id)
                          ? 'bg-[var(--color-accent)]/10 text-[var(--color-accent)]'
                          : 'hover:bg-[var(--color-surface-raised)] text-[var(--color-text)]'
                      }`}
                    >
                      <span className={`w-3.5 h-3.5 rounded border shrink-0 flex items-center justify-center text-[9px] ${
                        selectedSkills.has(s.id)
                          ? 'bg-[var(--color-accent)] border-[var(--color-accent)] text-white'
                          : 'border-[var(--color-border-subtle)]'
                      }`}>
                        {selectedSkills.has(s.id) ? '✓' : ''}
                      </span>
                      <span className="font-bold">{s.name}</span>
                      <span className="text-[var(--color-muted)] truncate">{s.description}</span>
                    </button>
                  ))
                )}
              </div>
            </div>

            {error && <p className="text-sm text-[var(--color-error)]">{error}</p>}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-[var(--color-border-subtle)] flex justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-md border border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-raised)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name || !!nameError || !moduleName || submitting}
              className="px-4 py-2 text-sm font-bold rounded-md bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Creating...' : 'Create Agent'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
