import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ChevronDown, ChevronRight, Pencil, Plus, GitBranch, Users, GitMerge, AlertCircle } from 'lucide-react'
import { useState } from 'react'

import type { TeamListItem } from '@bmad-studio/shared'

import { useAgentDetail } from './use-agent-detail.js'
import { useWorkflows } from '../workflows/use-workflows.js'
import { useTeams } from '../teams/use-teams.js'
import { SkillAssignmentPanel } from './SkillAssignmentPanel.js'
import { EditAgentDialog } from './EditAgentDialog.js'
import { MarkdownEditor } from '../../shared/markdown-editor/MarkdownEditor.js'
import { useNotifications } from '../../layout/NotificationProvider.js'
import { CopyLinkButton } from '../../shared/CopyLinkButton.js'

export function AgentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { notify } = useNotifications()
  const { data: agent, isLoading, error } = useAgentDetail(id ?? '')
  const [sourceExpanded, setSourceExpanded] = useState(false)
  const [sourceContent, setSourceContent] = useState<string | null>(null)
  const [sourceLoading, setSourceLoading] = useState(false)
  const [showSkillAssignment, setShowSkillAssignment] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const { data: workflows } = useWorkflows()
  const { data: allTeams } = useTeams()

  // Find teams this agent belongs to
  const agentTeams = (allTeams ?? []).filter((t: TeamListItem) =>
    t.agentIds.includes(id ?? '') || t.agentIds.includes(agent?.name ?? ''),
  )

  function handleExpandSource() {
    const willExpand = !sourceExpanded
    setSourceExpanded(willExpand)
    if (willExpand && agent && sourceContent === null) {
      setSourceLoading(true)
      const bmadIndex = agent.filePath.lastIndexOf('/_bmad/')
      const relativePath = bmadIndex >= 0 ? agent.filePath.slice(bmadIndex + 7) : agent.filePath
      fetch(`/api/files/${relativePath}`)
        .then((r) => {
          if (!r.ok) throw new Error('Not found')
          return r.json()
        })
        .then((d) => {
          setSourceContent((d as { content: string }).content)
        })
        .catch(() => setSourceContent('Failed to load source file.'))
        .finally(() => setSourceLoading(false))
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 rounded bg-[var(--color-surface-raised)] animate-pulse" />
        <div className="h-40 rounded-lg bg-[var(--color-surface-raised)] animate-pulse" />
      </div>
    )
  }

  if (error || !agent) {
    return (
      <div>
        <Link
          to="/agents"
          className="flex items-center gap-1 text-sm text-[var(--color-muted)] mb-4 hover:text-[var(--color-text)]"
        >
          <ArrowLeft size={16} /> Back to Agents
        </Link>
        <p className="text-[var(--color-error)]">
          {error ? `Failed to load agent: ${error.message}` : 'Agent not found'}
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl">
      <Link
        to="/agents"
        className="flex items-center gap-1 text-sm text-[var(--color-muted)] mb-4 hover:text-[var(--color-text)]"
      >
        <ArrowLeft size={16} /> Back to Agents
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          {agent.icon ? (
            <span className="text-3xl leading-none" role="img" aria-label={`${agent.title || agent.name} icon`}>{agent.icon}</span>
          ) : (
            <span className="w-10 h-10 rounded-lg bg-[var(--color-accent)] text-white text-lg font-bold flex items-center justify-center shrink-0">
              {agent.name.charAt(0).toUpperCase()}
            </span>
          )}
          <div className="min-w-0">
            <h1 className="text-2xl font-extrabold truncate">
              {agent.title || agent.name}
            </h1>
            {agent.title && (
              <p className="text-sm text-[var(--color-muted)]">({agent.name})</p>
            )}
          </div>
        </div>
        <p className="text-[var(--color-muted)] text-sm mb-4">{agent.role}</p>
        <div className="flex items-center gap-3">
          <CopyLinkButton title="Copy link to this agent" />
          <button
            onClick={() => setShowEdit(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-md bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] transition-colors"
          >
            <Pencil size={14} />
            Edit Agent
          </button>
        </div>
      </div>

      {/* Persona */}
      {(agent.identity || agent.communicationStyle || agent.principles) && (
        <section className="mb-8">
          <h2 className="text-lg font-bold mb-3">Persona</h2>
          <div className="rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)] p-5 space-y-4">
            {agent.identity && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)] mb-1">Identity</h3>
                <p className="text-sm text-[var(--color-text)]">{agent.identity}</p>
              </div>
            )}
            {agent.communicationStyle && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)] mb-1">Communication Style</h3>
                <p className="text-sm italic text-[var(--color-text)]">&ldquo;{agent.communicationStyle}&rdquo;</p>
              </div>
            )}
            {agent.principles && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)] mb-1">Principles</h3>
                <div className="text-sm text-[var(--color-text)] whitespace-pre-line">{agent.principles}</div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Metadata */}
      <section className="mb-8">
        <h2 className="text-lg font-bold mb-3">Details</h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="p-3 rounded-lg bg-[var(--color-surface-raised)]">
            <span className="text-[var(--color-muted)]">Module</span>
            <p className="font-bold">{agent.module ?? 'Unknown'}</p>
          </div>
          <div className="p-3 rounded-lg bg-[var(--color-surface-raised)]">
            <span className="text-[var(--color-muted)]">Discussion Mode</span>
            <p className="font-bold">{agent.discussion ? 'Enabled' : 'Disabled'}</p>
          </div>
        </div>
      </section>

      {/* How to invoke */}
      <section className="mb-8">
        <h2 className="text-lg font-bold mb-3">How to Invoke</h2>
        <div className="rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)] p-5 space-y-4">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)] mb-2">In Claude Code</h3>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <code className="text-sm font-[var(--font-mono)] bg-[var(--color-bg)] border border-[var(--color-border-subtle)] px-2 py-1 rounded text-[var(--color-accent)]">
                  /{agent.name}
                </code>
                <span className="text-xs text-[var(--color-muted)]">activate this agent</span>
              </div>
            </div>
          </div>
          {agent.menu.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)] mb-2">Available Commands</h3>
              <div className="space-y-1">
                {agent.menu.slice(0, 6).map((item) => (
                  <div key={item.trigger} className="flex items-center gap-2">
                    <code className="text-xs font-[var(--font-mono)] bg-[var(--color-bg)] border border-[var(--color-border-subtle)] px-2 py-0.5 rounded text-[var(--color-accent)]">
                      {item.trigger}
                    </code>
                    <span className="text-xs text-[var(--color-muted)] truncate">{item.input}</span>
                  </div>
                ))}
                {agent.menu.length > 6 && (
                  <p className="text-xs text-[var(--color-muted)] mt-1">+{agent.menu.length - 6} more — scroll down to Commands</p>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Skills */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold">Skills ({agent.skills.length})</h2>
          <button
            onClick={() => setShowSkillAssignment(true)}
            className="flex items-center gap-1 text-sm text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] transition-colors"
          >
            <Plus size={14} />
            Assign
          </button>
        </div>
        {agent.skills.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {agent.skills.map((skill) => (
              <button
                key={skill}
                onClick={() => navigate('/skills')}
                className="px-3 py-1 text-xs rounded-full bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors cursor-pointer"
              >
                {skill}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[var(--color-muted)]">No skills assigned</p>
        )}
      </section>

      {/* Skill Assignment Panel with Drag-and-Drop */}
      {showSkillAssignment && (
        <div className="fixed inset-0 z-40 flex">
          <div className="flex-1 bg-black/40" onClick={() => setShowSkillAssignment(false)} />
          <div className="w-[700px] bg-[var(--color-bg)] border-l border-[var(--color-border-subtle)] shadow-xl">
            <SkillAssignmentPanel
              agentName={agent.name}
              currentSkills={agent.skills}
              onSave={async (skills) => {
                try {
                  const resp = await fetch(`/api/agents/${id}/skills`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ skills }),
                  })
                  if (resp.ok) {
                    notify('success', `Updated skills for ${agent.name}`)
                    setShowSkillAssignment(false)
                  } else {
                    notify('error', 'Failed to update skills')
                  }
                } catch {
                  notify('error', 'Failed to update skills')
                }
              }}
              onClose={() => setShowSkillAssignment(false)}
            />
          </div>
        </div>
      )}

      {/* Menu Items / Commands */}
      {agent.menu.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-bold mb-3">Commands ({agent.menu.length})</h2>
          <div className="space-y-2">
            {agent.menu.map((item) => (
              <div
                key={item.trigger}
                className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)]"
              >
                <div>
                  <span className="font-bold text-sm font-[var(--font-mono)]">{item.trigger}</span>
                  <p className="text-xs text-[var(--color-muted)] mt-0.5">{item.input}</p>
                </div>
                {item.route && (
                  <span className="text-xs text-[var(--color-muted)] font-[var(--font-mono)]">
                    {item.route}
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Teams */}
      <section className="mb-8">
        <h2 className="text-lg font-bold mb-3">Teams ({agentTeams.length})</h2>
        {agentTeams.length > 0 ? (
          <div className="space-y-2">
            {agentTeams.map((t) => (
              <button
                key={t.id}
                onClick={() => navigate('/teams')}
                className="w-full flex items-center justify-between p-3 rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)] hover:border-[var(--color-accent)] transition-colors cursor-pointer text-left"
              >
                <div className="flex items-center gap-2">
                  {t.icon ? (
                    <span className="text-sm leading-none" role="img" aria-label={`${t.name} icon`}>{t.icon}</span>
                  ) : (
                    <Users size={14} className="text-[var(--color-accent)]" />
                  )}
                  <span className="text-sm font-bold">{t.name}</span>
                </div>
                <span className="text-xs text-[var(--color-muted)]">{t.memberCount} members</span>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[var(--color-muted)]">This agent is not part of any team</p>
        )}
      </section>

      {/* Workflow Context */}
      {workflows && workflows.length > 0 && agent && (
        <section className="mb-8">
          <h2 className="text-lg font-bold mb-3">Workflow Participation</h2>
          {(() => {
            // Find workflows that reference this agent
            const agentName = agent.name.toLowerCase()
            const agentId = agent.id.toLowerCase()
            const relatedWorkflows = workflows.filter((wf) => {
              const nameMatch = wf.name.toLowerCase()
              return nameMatch.includes(agentId) || nameMatch.includes(agentName)
            })

            if (relatedWorkflows.length === 0) {
              return (
                <p className="text-sm text-[var(--color-muted)]">
                  This agent is not directly referenced in any workflow names. Agents may still be invoked via workflow steps.
                </p>
              )
            }

            return (
              <div className="space-y-2">
                {relatedWorkflows.map((wf) => (
                  <button
                    key={wf.id}
                    onClick={() => navigate('/workflows')}
                    className="w-full flex items-center justify-between p-3 rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)] hover:border-[var(--color-accent)] transition-colors cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-2">
                      <GitBranch size={14} className="text-[var(--color-muted)]" />
                      <span className="text-sm font-bold">{wf.name}</span>
                    </div>
                    <span className="text-xs text-[var(--color-muted)]">{wf.stepCount} steps</span>
                  </button>
                ))}
              </div>
            )
          })()}
        </section>
      )}

      {/* Override */}
      <section className="mb-8">
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
          <GitMerge size={18} className="text-[var(--color-muted)]" />
          Override
        </h2>
        <div className="rounded-lg border border-[var(--color-border-subtle)] p-5">
          {agent.customizations && Object.keys(agent.customizations).length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <AlertCircle size={14} className="text-[var(--color-warning)] mt-0.5 shrink-0" />
                <p className="text-sm text-[var(--color-text)]">
                  This agent has project-level customizations that extend the module's default behaviour.
                  Overrides let you adjust an agent's persona, instructions, or skills without modifying
                  the original module file — changes here survive module updates.
                </p>
              </div>
              <button
                onClick={() => navigate(`/agents/${id}/override`)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-raised)] hover:border-[var(--color-accent)] transition-colors"
              >
                <Pencil size={13} />
                Edit Override
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-[var(--color-muted)]">
                No overrides yet. An <strong className="text-[var(--color-text)]">override</strong> lets
                you customise this agent's behaviour for your project — adjusting its persona, adding
                project-specific instructions, or changing its skills — without touching the original
                module file. Your changes persist across module updates.
              </p>
              <button
                onClick={() => navigate(`/agents/${id}/override`)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-raised)] hover:border-[var(--color-accent)] transition-colors"
              >
                <Pencil size={13} />
                Create Override
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Source (collapsed by default) */}
      <section>
        <button
          onClick={handleExpandSource}
          className="flex items-center gap-2 text-lg font-bold mb-3 hover:text-[var(--color-accent)] transition-colors"
        >
          {sourceExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          Source
        </button>
        {sourceExpanded && (
          <div className="rounded-lg border border-[var(--color-border-subtle)] overflow-hidden h-96">
            {sourceLoading ? (
              <div className="h-full bg-[var(--color-surface-raised)] animate-pulse" />
            ) : (
              <MarkdownEditor
                content={sourceContent ?? ''}
                filePath={agent.filePath}
                onChange={() => {}}
                readOnly
              />
            )}
          </div>
        )}
      </section>

      {showEdit && agent && (
        <EditAgentDialog
          agent={agent}
          onClose={() => setShowEdit(false)}
          onSaved={() => {
            setShowEdit(false)
          }}
        />
      )}
    </div>
  )
}
