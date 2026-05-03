export type Skill = {
  id: string
  name: string
  description: string
  bestFor?: string[]
  content: string
  filePath: string
  module?: string
  customize?: {
    hasCustomizeToml: boolean
    layers?: { team: boolean; user: boolean }
  }
}

export type SkillListItem = {
  id: string
  name: string
  description: string
  module?: string
  bestFor?: string[]
}

export type CompiledSkillItem = {
  id: string
  name: string
  description: string
  module?: string
  type: 'agent' | 'workflow'
}
