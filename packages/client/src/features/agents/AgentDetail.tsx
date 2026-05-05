import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Pencil, GitBranch, Users, Save, Terminal } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'

import type { TeamListItem } from '@bmad-studio/shared'

import { useAgentDetail } from './use-agent-detail.js'
import { useWorkflows } from '../workflows/use-workflows.js'
import { useTeams } from '../teams/use-teams.js'
import { EditAgentDialog } from './EditAgentDialog.js'
import { CodeMirrorEditor } from '../../shared/markdown-editor/CodeMirrorEditor.js'
import { useNotifications } from '../../layout/NotificationProvider.js'
import { useAgentCustomize, useUpdateAgentCustomize } from './use-agent-customize.js'

type AgentTab = 'overview' | 'commands' | 'teams' | 'customize'

// ---------------------------------------------------------------------------
// Shared tab bar
// ---------------------------------------------------------------------------

function TabBar<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: Array<{ id: T; label: string; count?: number }>
  active: T
  onChange: (t: T) => void
}) {
  return (
    <div className="flex gap-1 mb-6 bg-[var(--color-surface-raised)] rounded-md p-1 border border-[var(--color-border-subtle)]">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`px-4 py-1.5 text-sm rounded transition-colors cursor-pointer ${
            active === t.id
              ? 'bg-[var(--color-bg)] text-[var(--color-text)] font-bold shadow-sm'
              : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
          }`}
        >
          {t.label}
          {t.count !== undefined && t.count > 0 && (
            <span className="ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)]">
              {t.count}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Agent detail page
// ---------------------------------------------------------------------------

export function AgentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { notify } = useNotifications()
  const { data: agent, isLoading, error } = useAgentDetail(id ?? '')
  const [activeTab, setActiveTab] = useState<AgentTab>('overview')
  const [showEdit, setShowEdit] = useState(false)
  const { data: workflows } = useWorkflows()
  const { data: allTeams } = useTeams()

  const agentId = id ?? ''
  const { data: customizeData, error: customizeError, isLoading: customizeLoading } = useAgentCustomize(agentId)
  const updateCustomize = useUpdateAgentCustomize(agentId)
  const [customizeContent, setCustomizeContent] = useState('')
  const customizeLoadedRef = useRef(false)

  useEffect(() => {
    if (customizeData && !customizeLoadedRef.current) {
      setCustomizeContent(customizeData.raw)
      customizeLoadedRef.current = true
    }
  }, [customizeData])

  useEffect(() => {
    customizeLoadedRef.current = false
    setCustomizeContent('')
  }, [agentId])

  const isNotV65 = customizeError && (customizeError as Error & { isNotV65?: boolean }).isNotV65 === true

  const agentTeams = (allTeams ?? []).filter((t: TeamListItem) =>
    t.agentIds.includes(id ?? '') || t.agentIds.includes(agent?.name ?? ''),
  )

  const relatedWorkflows = (workflows ?? []).filter((wf) => {
    const agentName = agent?.name?.toLowerCase() ?? ''
    const agentIdLower = (id ?? '').toLowerCase()
    return wf.name.toLowerCase().includes(agentIdLower) || wf.name.toLowerCase().includes(agentName)
  })

  async function handleCustomizeSave() {
    try {
      await updateCustomize.mutateAsync(customizeContent)
      notify('success', 'customize.toml saved')
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Failed to save')
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-3xl space-y-4">
        <div className="h-8 w-48 rounded bg-[var(--color-surface-raised)] animate-pulse" />
        <div className="h-40 rounded-lg bg-[var(--color-surface-raised)] animate-pulse" />
      </div>
    )
  }

  if (error || !agent) {
    return (
      <div className="max-w-3xl">
        <Link to="/agents" className="flex items-center gap-1 text-sm text-[var(--color-muted)] mb-4 hover:text-[var(--color-text)]">
          <ArrowLeft size={16} /> Back to Agents
        </Link>
        <p className="text-[var(--color-error)]">
          {error ? `Failed to load agent: ${error.message}` : 'Agent not found'}
        </p>
      </div>
    )
  }

  const tabs: Array<{ id: AgentTab; label: string; count?: number }> = [
    { id: 'overview', label: 'Overview' },
    { id: 'commands', label: 'Commands', count: agent.menu.length },
    { id: 'teams', label: 'Teams', count: agentTeams.length },
    ...(!isNotV65 ? [{ id: 'customize' as AgentTab, label: 'Customize' }] : []),
  ]

  return (
    <div className="max-w-3xl">
      <Link to="/agents" className="flex items-center gap-1 text-sm text-[var(--color-muted)] mb-6 hover:text-[var(--color-text)] transition-colors">
        <ArrowLeft size={16} /> Back to Agents
      </Link>

      {/* Header */}
      <div className="flex items-start gap-4 mb-8">
        {agent.icon ? (
          <span className="text-4xl leading-none mt-0.5 shrink-0" role="img" aria-label={agent.title || agent.name}>
            {agent.icon}
          </span>
        ) : (
          <span className="w-12 h-12 rounded-xl bg-[var(--color-accent)] text-white text-xl font-bold flex items-center justify-center shrink-0">
            {agent.name.charAt(0).toUpperCase()}
          </span>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-extrabold leading-tight">{agent.title || agent.name}</h1>
          {agent.title && (
            <p className="text-xs text-[var(--color-muted)] font-mono mt-0.5">/{agent.name}</p>
          )}
          {agent.role && (
            <p className="text-sm text-[var(--color-muted)] mt-1 leading-snug">{agent.role}</p>
          )}
        </div>
        <button
          onClick={() => setShowEdit(true)}
          className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold rounded-md border border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-raised)] hover:border-[var(--color-accent)] transition-colors cursor-pointer"
        >
          <Pencil size={13} />
          Edit
        </button>
      </div>

      <TabBar tabs={tabs} active={activeTab} onChange={setActiveTab} />

      {/* ── Overview ─────────────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Persona */}
          {(agent.identity || agent.communicationStyle || agent.principles) && (
            <section>
              <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--color-muted)] mb-3">Persona</h2>
              <div className="rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)] p-5 space-y-4">
                {agent.identity && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)] mb-1">Identity</p>
                    <p className="text-sm text-[var(--color-text)]">{agent.identity}</p>
                  </div>
                )}
                {agent.communicationStyle && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)] mb-1">Communication style</p>
                    <p className="text-sm italic text-[var(--color-text)]">&ldquo;{agent.communicationStyle}&rdquo;</p>
                  </div>
                )}
                {agent.principles && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)] mb-1">Principles</p>
                    <p className="text-sm text-[var(--color-text)] whitespace-pre-line">{agent.principles}</p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Meta */}
          <section>
            <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--color-muted)] mb-3">Details</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)]">
                <p className="text-xs text-[var(--color-muted)] mb-0.5">Module</p>
                <p className="font-bold">{agent.module ?? '—'}</p>
              </div>
              <div className="p-3 rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)]">
                <p className="text-xs text-[var(--color-muted)] mb-0.5">Discussion mode</p>
                <p className="font-bold">{agent.discussion ? 'Enabled' : 'Disabled'}</p>
              </div>
            </div>
          </section>

          {/* Invocation */}
          <section>
            <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--color-muted)] mb-3">How to invoke</h2>
            <div className="rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)] p-4">
              <div className="flex items-center gap-2">
                <Terminal size={14} className="text-[var(--color-muted)] shrink-0" />
                <code className="text-sm font-mono text-[var(--color-accent)]">/{agent.name}</code>
                <span className="text-xs text-[var(--color-muted)]">— activate this agent</span>
              </div>
            </div>
          </section>

          {/* Workflow participation */}
          {relatedWorkflows.length > 0 && (
            <section>
              <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--color-muted)] mb-3">
                Workflow participation ({relatedWorkflows.length})
              </h2>
              <div className="space-y-2">
                {relatedWorkflows.map((wf) => (
                  <button
                    key={wf.id}
                    onClick={() => navigate(`/workflows/${wf.id}`)}
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
            </section>
          )}
        </div>
      )}

      {/* ── Commands ─────────────────────────────────────────────────────── */}
      {activeTab === 'commands' && (
        <div>
          {agent.menu.length === 0 ? (
            <div className="text-center py-16">
              <Terminal size={40} className="text-[var(--color-muted)] mx-auto mb-3" strokeWidth={1.5} />
              <p className="text-sm font-bold text-[var(--color-text)]">No commands defined</p>
              <p className="text-xs text-[var(--color-muted)] mt-1">
                Commands appear when the agent has menu items in its SKILL.md definition.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {agent.menu.map((item) => (
                <div
                  key={item.trigger}
                  className="flex items-start gap-4 p-4 rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)]"
                >
                  <code className="shrink-0 text-sm font-mono font-bold text-[var(--color-accent)] bg-[var(--color-bg)] border border-[var(--color-border-subtle)] px-2 py-0.5 rounded">
                    {item.trigger}
                  </code>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-[var(--color-text)]">{item.input}</p>
                    {item.route && (
                      <p className="text-xs text-[var(--color-muted)] font-mono mt-0.5">{item.route}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Teams ────────────────────────────────────────────────────────── */}
      {activeTab === 'teams' && (
        <div>
          {agentTeams.length === 0 ? (
            <div className="text-center py-16">
              <Users size={40} className="text-[var(--color-muted)] mx-auto mb-3" strokeWidth={1.5} />
              <p className="text-sm font-bold text-[var(--color-text)]">Not a member of any team</p>
              <p className="text-xs text-[var(--color-muted)] mt-1">
                Assign this agent to a team from the Teams page.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {agentTeams.map((t) => (
                <button
                  key={t.id}
                  onClick={() => navigate('/teams')}
                  className="w-full flex items-center justify-between p-3 rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)] hover:border-[var(--color-accent)] transition-colors cursor-pointer text-left"
                >
                  <div className="flex items-center gap-2">
                    {t.icon ? (
                      <span className="text-sm leading-none">{t.icon}</span>
                    ) : (
                      <Users size={14} className="text-[var(--color-accent)]" />
                    )}
                    <span className="text-sm font-bold">{t.name}</span>
                  </div>
                  <span className="text-xs text-[var(--color-muted)]">{t.memberCount} members</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Customize (v6.5 only) ─────────────────────────────────────────── */}
      {activeTab === 'customize' && !isNotV65 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--color-muted)]">customize.toml</h2>
              <p className="text-xs text-[var(--color-muted)] mt-0.5">
                Edit the <code className="font-mono">[agent]</code> block to override persona, menu items, and activation steps.
              </p>
            </div>
            <button
              onClick={() => void handleCustomizeSave()}
              disabled={updateCustomize.isPending}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold rounded-md bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] disabled:opacity-50 transition-colors cursor-pointer"
            >
              <Save size={13} />
              {updateCustomize.isPending ? 'Saving…' : 'Save'}
            </button>
          </div>
          <div className="rounded-lg border border-[var(--color-border-subtle)] overflow-hidden" style={{ height: 500 }}>
            {customizeLoading ? (
              <div className="h-full bg-[var(--color-surface-raised)] animate-pulse" />
            ) : (
              <CodeMirrorEditor
                content={customizeContent}
                onChange={setCustomizeContent}
                onSave={() => void handleCustomizeSave()}
                language="plaintext"
                placeholder={'[agent]\nname = ""\ntitle = ""\n'}
              />
            )}
          </div>
        </section>
      )}

      {showEdit && agent && (
        <EditAgentDialog
          agent={agent}
          onClose={() => setShowEdit(false)}
          onSaved={() => setShowEdit(false)}
        />
      )}
    </div>
  )
}
