import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  X,
  AlertTriangle,
  FileText,
  ChevronDown,
  ChevronRight,
  Pencil,
  Trash2,
  Save,
  Search,
} from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'

import type { AgentListItem } from '@bmad-studio/shared'

import { useTeamDetail, useTeamParty } from './use-teams.js'
import { CsvViewer } from '../../shared/CsvViewer.js'
import { useNotifications } from '../../layout/NotificationProvider.js'
import { CopyLinkButton } from '../../shared/CopyLinkButton.js'

type TeamDetailPanelProps = {
  teamId: string
  onClose: () => void
  onTeamUpdated?: () => void
}

function DeleteTeamDialog({
  teamId,
  teamName,
  onClose,
  onDeleted,
}: {
  teamId: string
  teamName: string
  onClose: () => void
  onDeleted: () => void
}) {
  const [confirmName, setConfirmName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const confirmed = confirmName === teamName

  const handleDelete = async () => {
    if (!confirmed) return
    setSubmitting(true)
    setError(null)
    try {
      const resp = await fetch(`/api/teams/${teamId}`, { method: 'DELETE' })
      if (!resp.ok) {
        const data = (await resp.json()) as { error?: { message?: string } }
        throw new Error(data.error?.message ?? 'Failed to delete team')
      }
      onDeleted()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete team')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-team-title"
        className="relative bg-[var(--color-bg)] border border-[var(--color-border-subtle)] rounded-lg shadow-xl w-full max-w-md p-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle size={20} className="text-[var(--color-error)]" />
          <h2 id="delete-team-title" className="text-lg font-bold">Delete Team</h2>
        </div>

        <div className="space-y-4">
          <p className="text-sm">
            This will permanently delete the <strong>{teamName}</strong> team YAML file. The party
            CSV will be preserved.
          </p>

          <div>
            <label className="block text-sm mb-1">
              Type <strong>{teamName}</strong> to confirm:
            </label>
            <input
              type="text"
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-md bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)] focus:border-[var(--color-error)] focus:outline-none"
            />
          </div>

          {error && <p className="text-sm text-[var(--color-error)]">{error}</p>}
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-md border border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-raised)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={!confirmed || submitting}
            className="px-4 py-2 text-sm font-bold rounded-md bg-[var(--color-error)] text-white hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            <Trash2 size={14} />
            {submitting ? 'Deleting...' : 'Delete Team'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function TeamDetailPanel({ teamId, onClose, onTeamUpdated }: TeamDetailPanelProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { notify } = useNotifications()
  const { data: team, isLoading } = useTeamDetail(teamId)
  const { data: partyData } = useTeamParty(teamId)
  const [showParty, setShowParty] = useState(false)
  const [showDelete, setShowDelete] = useState(false)

  // Edit mode state
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editIcon, setEditIcon] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editAgentIds, setEditAgentIds] = useState<Set<string>>(new Set())
  const [agentSearch, setAgentSearch] = useState('')
  const [allAgents, setAllAgents] = useState<AgentListItem[]>([])
  const [saving, setSaving] = useState(false)

  // Party CSV edit mode
  const [editingParty, setEditingParty] = useState(false)
  const [partyCsvContent, setPartyCsvContent] = useState('')

  // Populate edit fields when entering edit mode
  useEffect(() => {
    if (editing && team) {
      setEditName(team.name)
      setEditIcon(team.icon)
      setEditDescription(team.description)
      setEditAgentIds(new Set(team.agentIds))
      // Fetch all agents for the selection list
      fetch('/api/agents')
        .then((r) => r.json())
        .then((data) => setAllAgents(data as AgentListItem[]))
        .catch(() => {})
    }
  }, [editing, team])

  const unresolved = useMemo(() => {
    if (!team) return []
    const resolvedIds = new Set(team.members.map((m) => m.agentId))
    return team.agentIds.filter((id) => !resolvedIds.has(id))
  }, [team])

  const filteredAgents = allAgents.filter((a) => {
    if (!agentSearch) return true
    const q = agentSearch.toLowerCase()
    return (
      a.name.toLowerCase().includes(q) ||
      a.title.toLowerCase().includes(q) ||
      (a.role && a.role.toLowerCase().includes(q))
    )
  })

  const toggleAgent = (agentId: string) => {
    setEditAgentIds((prev) => {
      const next = new Set(prev)
      if (next.has(agentId)) {
        next.delete(agentId)
      } else {
        next.add(agentId)
      }
      return next
    })
  }

  const handleSave = async () => {
    if (!team) return
    setSaving(true)
    try {
      const resp = await fetch(`/api/teams/${teamId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.trim(),
          icon: editIcon.trim(),
          description: editDescription.trim(),
          agentIds: Array.from(editAgentIds),
        }),
      })
      if (!resp.ok) {
        const data = (await resp.json()) as { error?: { message?: string } }
        throw new Error(data.error?.message ?? 'Failed to update team')
      }
      notify('success', `Team "${editName}" updated`)
      setEditing(false)
      await queryClient.invalidateQueries({ queryKey: ['teams'] })
      onTeamUpdated?.()
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Failed to update team')
    } finally {
      setSaving(false)
    }
  }

  const handleGenerateFromAgents = () => {
    if (!team) return
    const headerRow =
      'name,displayName,title,icon,role,identity,communicationStyle,principles,module,path'
    const rows = team.members.map((m) => {
      const cols = [
        m.agentId,
        m.displayName || m.agentId,
        m.title || '',
        m.icon || '',
        m.role || m.title || '',
        m.identity || '',
        m.communicationStyle || 'collaborative',
        m.principles || '',
        m.module || team.module || '',
        '',
      ]
      const escape = (c: string) =>
        c.includes(',') || c.includes('"') ? `"${c.replace(/"/g, '""')}"` : c
      return cols.map(escape).join(',')
    })
    setPartyCsvContent([headerRow, ...rows].join('\n'))
  }

  const handleSaveParty = async () => {
    if (!team) return
    try {
      const resp = await fetch(`/api/teams/${teamId}/party`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: partyCsvContent }),
      })
      if (!resp.ok) {
        const data = (await resp.json()) as { error?: { message?: string } }
        throw new Error(data.error?.message ?? 'Failed to save party CSV')
      }
      notify('success', 'Party CSV updated')
      setEditingParty(false)
      await queryClient.invalidateQueries({ queryKey: ['teams'] })
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Failed to save party CSV')
    }
  }

  const handleDeleted = async () => {
    setShowDelete(false)
    await queryClient.invalidateQueries({ queryKey: ['teams'] })
    onTeamUpdated?.()
    onClose()
  }

  return (
    <div
      className="slide-over-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="slide-over-bg" onClick={onClose} />
      <aside className="slide-over-panel" style={{ width: 'max(400px, 40vw)' }}>
        <div className="px-6 py-4 border-b border-[var(--color-border-subtle)] flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            {team?.icon && (
              <span className="text-xl leading-none" role="img" aria-label={`${team.name} icon`}>
                {team.icon}
              </span>
            )}
            <h2 className="text-lg font-bold truncate">{team?.name ?? 'Loading...'}</h2>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-2">
            {team && !editing && (
              <>
                <CopyLinkButton />
                <button
                  onClick={() => setEditing(true)}
                  className="text-[var(--color-muted)] hover:text-[var(--color-accent)] transition-colors"
                  title="Edit Team"
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={() => setShowDelete(true)}
                  className="text-[var(--color-muted)] hover:text-[var(--color-error)] transition-colors"
                  title="Delete Team"
                >
                  <Trash2 size={16} />
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="text-[var(--color-muted)] hover:text-[var(--color-text)]"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {isLoading && (
          <div className="p-6 space-y-3">
            <div className="h-4 w-3/4 rounded bg-[var(--color-surface-raised)] animate-pulse" />
            <div className="h-32 rounded bg-[var(--color-surface-raised)] animate-pulse" />
          </div>
        )}

        {team && !editing && (
          <div
            className="p-6 space-y-6 overflow-y-auto"
            style={{ maxHeight: 'calc(100vh - 65px)' }}
          >
            {/* Meta */}
            <div>
              <p className="text-sm text-[var(--color-muted)]">{team.description}</p>
              {team.module && (
                <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded-full bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)]">
                  {team.module}
                </span>
              )}
            </div>

            {/* Members */}
            <div>
              <h3 className="text-sm font-bold mb-3">Members ({team.members.length})</h3>
              <div className="space-y-2">
                {team.members.map((member) => (
                  <button
                    key={member.agentId}
                    onClick={() => navigate(`/agents/${member.agentId}`)}
                    className="w-full flex items-start gap-3 p-3 rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)] hover:border-[var(--color-accent)] transition-colors cursor-pointer text-left"
                  >
                    <span className="text-lg leading-none mt-0.5" role="img" aria-label={`${member.displayName} icon`}>{member.icon}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold">{member.displayName}</span>
                        <span className="text-xs text-[var(--color-muted)]">{member.title}</span>
                      </div>
                      {member.communicationStyle && (
                        <p className="text-xs text-[var(--color-muted)] mt-1 line-clamp-2">
                          {member.communicationStyle}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Unresolved agents */}
            {unresolved.length > 0 && (
              <div>
                <h3 className="text-sm font-bold mb-2 flex items-center gap-1.5">
                  <AlertTriangle size={14} className="text-[var(--color-warning)]" />
                  Unresolved Agents ({unresolved.length})
                </h3>
                <div className="space-y-1">
                  {unresolved.map((id) => (
                    <div
                      key={id}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-warning)]/30"
                    >
                      <AlertTriangle size={12} className="text-[var(--color-warning)]" />
                      <span className="text-sm font-[var(--font-mono)]">{id}</span>
                      <span className="text-xs text-[var(--color-muted)]">
                        — not found in party CSV
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Party Mode section */}
            <div>
              <h3 className="text-sm font-bold mb-2">Party Mode</h3>
              <div className="p-3 rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText size={14} className="text-[var(--color-muted)]" />
                    <span className="text-sm">{team.partyFile || 'No party CSV'}</span>
                  </div>
                  <span className="text-xs text-[var(--color-muted)]">
                    {team.members.length} personas
                  </span>
                </div>
                {team.partyFile && (
                  <div className="flex items-center gap-3 mt-2">
                    <button
                      onClick={() => setShowParty(!showParty)}
                      className="flex items-center gap-1.5 text-xs text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] transition-colors"
                    >
                      {showParty ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                      {showParty ? 'Hide' : 'View'} Party Personas
                    </button>
                    {showParty && partyData?.content && !editingParty && (
                      <button
                        onClick={() => {
                          setPartyCsvContent(partyData.content)
                          setEditingParty(true)
                        }}
                        className="flex items-center gap-1.5 text-xs text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] transition-colors"
                      >
                        <Pencil size={10} />
                        Edit Party Personas
                      </button>
                    )}
                  </div>
                )}
              </div>

              {showParty && partyData?.content && !editingParty && (
                <div className="mt-2 rounded-lg border border-[var(--color-border-subtle)] overflow-hidden h-64">
                  <CsvViewer content={partyData.content} />
                </div>
              )}

              {showParty && editingParty && (
                <div className="mt-2 space-y-2">
                  <div
                    className="rounded-lg border border-[var(--color-border-subtle)] overflow-hidden"
                    style={{ height: 264 }}
                  >
                    <CsvViewer
                      content={partyCsvContent}
                      editable={true}
                      onChange={(v) => setPartyCsvContent(v)}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSaveParty}
                      className="px-3 py-1.5 text-xs font-bold rounded-md bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] transition-colors flex items-center gap-1.5"
                    >
                      <Save size={12} />
                      Save Party CSV
                    </button>
                    <button
                      onClick={() => setEditingParty(false)}
                      className="px-3 py-1.5 text-xs rounded-md border border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-raised)] transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleGenerateFromAgents}
                      className="px-3 py-1.5 text-xs rounded-md border border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-raised)] transition-colors"
                    >
                      Generate from Agents
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Edit mode */}
        {team && editing && (
          <div
            className="p-6 space-y-4 overflow-y-auto"
            style={{ maxHeight: 'calc(100vh - 65px)' }}
          >
            <div>
              <label className="block text-sm font-bold mb-1">Name</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-md bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)] focus:border-[var(--color-accent)] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-1">Icon</label>
              <input
                type="text"
                value={editIcon}
                onChange={(e) => setEditIcon(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-md bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)] focus:border-[var(--color-accent)] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-1">Description</label>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 text-sm rounded-md bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)] focus:border-[var(--color-accent)] focus:outline-none resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-1">
                Agents ({editAgentIds.size} selected)
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
                  <p className="text-xs text-[var(--color-muted)] p-3 text-center">
                    No agents found
                  </p>
                ) : (
                  filteredAgents.map((agent) => (
                    <label
                      key={agent.id}
                      className="flex items-center gap-3 px-3 py-2 hover:bg-[var(--color-surface-raised)] cursor-pointer text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={editAgentIds.has(agent.id)}
                        onChange={() => toggleAgent(agent.id)}
                        className="accent-[var(--color-accent)]"
                      />
                      <span className="flex items-center gap-2 min-w-0">
                        {agent.icon && (
                          <span className="text-sm leading-none" aria-hidden="true">{agent.icon}</span>
                        )}
                        <span className="truncate font-bold">{agent.title || agent.name}</span>
                      </span>
                    </label>
                  ))
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleSave}
                disabled={saving || !editName.trim()}
                className="px-4 py-2 text-sm font-bold rounded-md bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                <Save size={14} />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={() => setEditing(false)}
                className="px-4 py-2 text-sm rounded-md border border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-raised)] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </aside>

      {showDelete && team && (
        <DeleteTeamDialog
          teamId={teamId}
          teamName={team.name}
          onClose={() => setShowDelete(false)}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  )
}
