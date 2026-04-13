import { useState, useEffect, useMemo } from 'react'
import { BookOpen, Search, Monitor, AlertTriangle } from 'lucide-react'
import { Link } from 'react-router-dom'

import { EmptyState } from '../../shared/EmptyState.js'

type CommandItem = {
  module: string
  phase: string
  name: string
  code: string
  sequence: number | null
  required: boolean
  agentDisplayName: string
  agentTitle: string
  description: string
  outputLocation: string
  command: string
}

const PHASE_TABS = [
  { key: 'all', label: 'All' },
  { key: '1-analysis', label: 'Analysis' },
  { key: '2-planning', label: 'Planning' },
  { key: '3-solutioning', label: 'Solutioning' },
  { key: '4-implementation', label: 'Implementation' },
  { key: 'anytime', label: 'Anytime' },
] as const

function phaseLabel(phase: string): string {
  if (phase === 'anytime') return 'Anytime'
  if (phase === '0-learning') return 'Learning'
  const stripped = phase.replace(/^\d+-/, '')
  return stripped.charAt(0).toUpperCase() + stripped.slice(1)
}

export function CommandsPage() {
  const [commands, setCommands] = useState<CommandItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activePhase, setActivePhase] = useState<string>('all')
  const [activeModule, setActiveModule] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [ides, setIdes] = useState<string[]>([])

  useEffect(() => {
    fetch('/api/commands')
      .then((r) => r.json())
      .then((data) => {
        setCommands(data as CommandItem[])
        setLoading(false)
      })
      .catch(() => setLoading(false))

    fetch('/api/overview')
      .then((r) => r.json())
      .then((data: { sections?: { ideConfigs?: { ides: string[] } } }) => {
        setIdes(data?.sections?.ideConfigs?.ides ?? [])
      })
      .catch(() => {})
  }, [])

  const modules = useMemo(() => {
    const set = new Set<string>()
    for (const cmd of commands) {
      if (cmd.module) set.add(cmd.module)
    }
    return Array.from(set).sort()
  }, [commands])

  const filtered = useMemo(() => {
    let result = commands
    if (activePhase !== 'all') {
      result = result.filter((cmd) => cmd.phase === activePhase)
    }
    if (activeModule !== 'all') {
      result = result.filter((cmd) => cmd.module === activeModule)
    }
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (cmd) =>
          cmd.name.toLowerCase().includes(q) ||
          cmd.code.toLowerCase().includes(q) ||
          cmd.description.toLowerCase().includes(q) ||
          cmd.agentDisplayName.toLowerCase().includes(q),
      )
    }
    return result
  }, [commands, activePhase, activeModule, search])

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-extrabold mb-2">Agent Triggers</h1>
        <p className="text-sm text-[var(--color-muted)] mb-6">Short codes used within active agent sessions to invoke workflows and actions.</p>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 rounded-lg bg-[var(--color-surface-raised)] animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (commands.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-extrabold mb-2">Agent Triggers</h1>
        <p className="text-sm text-[var(--color-muted)] mb-6">Short codes used within active agent sessions to invoke workflows and actions.</p>
        <EmptyState
          icon={BookOpen}
          title="No agent triggers found"
          description="Agent triggers are short codes used within an active agent session (e.g. CP, DS, SP). They're populated from bmad-help.csv files in your installed modules. Install a module to populate this list."
          actions={
            <Link
              to="/modules"
              className="px-4 py-2 text-sm font-bold rounded-md bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] transition-colors"
            >
              Browse Modules
            </Link>
          }
        />
      </div>
    )
  }

  return (
    <div>
      {/* IDE Sync Status */}
      {ides.length > 0 ? (
        <div className="mb-6 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)] p-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">IDE Sync</span>
              {ides.map((ide) => (
                <span key={ide} className="flex items-center gap-1.5 text-xs">
                  <Monitor size={12} className="text-[var(--color-muted)]" />
                  <span className="font-bold">{ide}</span>
                  <span className="w-2 h-2 rounded-full bg-[var(--color-success)]" title="Triggers synced" />
                </span>
              ))}
            </div>
            <Link
              to="/connections"
              className="text-xs text-[var(--color-accent)] hover:underline shrink-0"
            >
              Manage IDEs →
            </Link>
          </div>
        </div>
      ) : (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-[var(--color-warning)]/30 bg-[var(--color-warning)]/5 p-4">
          <AlertTriangle size={16} className="text-[var(--color-warning)] shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-[var(--color-text)]">No IDEs configured</p>
            <p className="text-xs text-[var(--color-muted)] mt-0.5">
              Configure an IDE connection so these agent triggers are available in your editor.
            </p>
          </div>
          <Link
            to="/connections"
            className="text-xs text-[var(--color-accent)] hover:underline shrink-0"
          >
            Configure →
          </Link>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 flex-wrap mb-2">
          <h1 className="text-2xl font-extrabold shrink-0">Agent Triggers ({commands.length})</h1>

          {/* Module tabs */}
          {modules.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              <button
                onClick={() => setActiveModule('all')}
                className={`px-3 py-1.5 text-sm rounded-md min-h-[36px] transition-colors ${
                  activeModule === 'all'
                    ? 'bg-[var(--color-surface-raised)] text-[var(--color-text)] font-bold'
                    : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
                }`}
              >
                All
              </button>
              {modules.map((mod) => (
                <button
                  key={mod}
                  onClick={() => setActiveModule(mod)}
                  className={`px-3 py-1.5 text-sm rounded-md min-h-[36px] transition-colors ${
                    activeModule === mod
                      ? 'bg-[var(--color-surface-raised)] text-[var(--color-text)] font-bold'
                      : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
                  }`}
                >
                  {mod}
                </button>
              ))}
            </div>
          )}

          {/* Search */}
          <div className="flex items-center gap-3 ml-auto shrink-0">
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)]"
              />
              <input
                type="text"
                placeholder="Search triggers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-3 py-1.5 text-sm rounded-md bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)] text-[var(--color-text)] placeholder:text-[var(--color-muted)] outline-none focus:border-[var(--color-accent)] w-64"
              />
            </div>
          </div>
        </div>
        <p className="text-sm text-[var(--color-muted)] mb-6">Short codes used within active agent sessions to invoke workflows and actions.</p>

        {/* Phase tabs */}
        <div className="flex gap-1 flex-wrap mt-4">
          {PHASE_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActivePhase(tab.key)}
              className={`px-3 py-1.5 text-sm rounded-md min-h-[36px] transition-colors ${
                activePhase === tab.key
                  ? 'bg-[var(--color-accent)] text-white font-bold'
                  : 'bg-[var(--color-surface-raised)] text-[var(--color-muted)] hover:text-[var(--color-text)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {filtered.length !== commands.length && (
          <p className="text-xs text-[var(--color-muted)] mt-3">
            Showing {filtered.length} of {commands.length} triggers
          </p>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-[var(--color-border-subtle)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[var(--color-surface-raised)] border-b border-[var(--color-border-subtle)]">
              <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">Code</th>
              <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">Name</th>
              <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">Phase</th>
              <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">Agent</th>
              <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">Required</th>
              <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">Description</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((cmd) => {
              const agentEmoji = cmd.agentTitle?.match(/\p{Emoji_Presentation}/u)?.[0] ?? ''
              return (
                <tr
                  key={`${cmd.code}-${cmd.module}`}
                  className={`border-b border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-raised)] transition-colors ${
                    cmd.required ? 'bg-[var(--color-accent)]/3' : ''
                  }`}
                >
                  <td className="px-4 py-3">
                    <span className={`font-[var(--font-mono)] font-bold ${cmd.required ? 'text-[var(--color-accent)]' : ''}`}>
                      {cmd.code}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-bold">{cmd.name}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-xs bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)] text-[var(--color-muted)]">
                      {phaseLabel(cmd.phase)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {cmd.agentDisplayName && (
                      <span className="flex items-center gap-1.5">
                        {agentEmoji && <span className="text-sm leading-none" role="img">{agentEmoji}</span>}
                        <span className="text-[var(--color-text)]">{cmd.agentDisplayName}</span>
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {cmd.required ? (
                      <span className="text-xs font-bold text-[var(--color-accent)]">Required</span>
                    ) : (
                      <span className="text-xs text-[var(--color-muted)]">Optional</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-muted)] max-w-md">
                    <span className="line-clamp-2">{cmd.description}</span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-[var(--color-muted)]">
          <p className="text-sm">No triggers match your filters.</p>
        </div>
      )}
    </div>
  )
}
