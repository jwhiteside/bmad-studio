import { useNavigate } from 'react-router-dom'

import type { AgentListItem } from '@bmad-studio/shared'

import {
  EntityCard,
  CardIcon,
  CardHeader,
  CardBody,
  CardDescription,
  CardFooter,
  ModuleBadge,
  IndicatorDot,
} from '../../shared/EntityCard.js'

type AgentCardProps = {
  agent: AgentListItem
}

export function AgentCard({ agent }: AgentCardProps) {
  const navigate = useNavigate()

  const displayTitle = agent.title || agent.role || agent.name
  const subtitle = agent.title ? agent.name : undefined

  return (
    <EntityCard onClick={() => navigate(`/agents/${agent.id}`)}>
      <CardHeader
        icon={
          <CardIcon
            emoji={agent.icon}
            fallbackInitial={agent.name}
          />
        }
        title={displayTitle}
        subtitle={subtitle}
        indicator={agent.hasOverrides ? <IndicatorDot color="warning" title="Has overrides" /> : undefined}
      />
      <CardBody>
        {agent.role ? (
          <CardDescription text={agent.role} />
        ) : (
          <div className="h-4" />
        )}
      </CardBody>
      <CardFooter
        left={<span>{agent.skillCount} skills</span>}
        right={<ModuleBadge module={agent.module} />}
      />
    </EntityCard>
  )
}
