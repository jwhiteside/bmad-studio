export type AgentMenuItem = {
  trigger: string
  input: string
  route: string
  action?: string
}

export type Agent = {
  id: string
  name: string
  title: string
  icon?: string
  role: string
  module?: string
  team?: string
  description?: string
  discussion: boolean
  webskip: boolean
  hasSidecar: boolean
  menu: AgentMenuItem[]
  skills: string[]
  identity?: string
  communicationStyle?: string
  principles?: string
  conversationalKnowledge?: Record<string, unknown>[]
  customizations?: Record<string, unknown>
  filePath: string
}

export type AgentListItem = {
  id: string
  name: string
  title: string
  icon?: string
  role: string
  module?: string
  communicationStyle?: string
  skillCount: number
  hasOverrides: boolean
}

export type AgentDetail = Agent & {
  overrides?: Record<string, unknown>
  resolvedSkills?: string[]
}
