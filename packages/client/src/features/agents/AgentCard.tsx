import { useNavigate } from 'react-router-dom'

import type { AgentListItem } from '@bmad-studio/shared'

type AgentCardProps = {
  agent: AgentListItem
}

export function AgentCard({ agent }: AgentCardProps) {
  const navigate = useNavigate()

  const displayTitle = agent.title || agent.role || agent.name
  const displayName = agent.title ? agent.name : undefined

  return (
    <div
      onClick={() => navigate(`/agents/${agent.id}`)}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/agents/${agent.id}`)}
      role="button"
      tabIndex={0}
      className="p-4 rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)] hover:-translate-y-0.5 hover:shadow-md transition-all cursor-pointer"
    >
      <div className="flex items-center gap-2 mb-2">
        {agent.icon ? (
          <span className="text-lg leading-none" role="img">{agent.icon}</span>
        ) : (
          <span className="w-5 h-5 rounded bg-[var(--color-accent)] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
            {agent.name.charAt(0).toUpperCase()}
          </span>
        )}
        <span className="font-bold text-sm truncate">{displayTitle}</span>
        {agent.hasOverrides && (
          <span
            className="w-2 h-2 rounded-full bg-[var(--color-warning)] shrink-0"
            title="Has overrides"
          />
        )}
      </div>
      {displayName && (
        <p className="text-xs text-[var(--color-muted)] truncate">({displayName})</p>
      )}
      {agent.role && (
        <p className="text-xs text-[var(--color-muted)] line-clamp-2 mt-1 mb-2">{agent.role}</p>
      )}
      {!agent.role && <div className="mb-2" />}
      <div className="flex items-center justify-between text-xs text-[var(--color-muted)]">
        <span>{agent.skillCount} skills</span>
        {agent.module && (
          <span className="px-2 py-0.5 rounded-full bg-[var(--color-bg)] border border-[var(--color-border-subtle)]">
            {agent.module}
          </span>
        )}
      </div>
    </div>
  )
}
