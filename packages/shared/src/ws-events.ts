export type ManifestChangedEvent = { type: 'manifest:changed'; projectRoot: string }
export type SkillManifestChangedEvent = { type: 'skill-manifest:changed'; projectRoot: string }
export type CustomizeChangedEvent = {
  type: 'customize:changed'
  /** Skill id, when the change targets a skill customize layer. */
  skillId?: string
  /** Workflow id, when the change targets a workflow's hooks. */
  workflowId?: string
  /** Layer (skill customize) — omitted for workflow hook changes. */
  layer?: 'team' | 'user'
}
export type DriftDetectedEvent = { type: 'drift:detected'; count: number }
export type DriftClearedEvent = { type: 'drift:cleared'; skillName: string }
export type HealthPythonChangedEvent = {
  type: 'health:python-changed'
  pythonResolverAvailable: boolean
}

export type V65WsEvent =
  | ManifestChangedEvent
  | SkillManifestChangedEvent
  | CustomizeChangedEvent
  | DriftDetectedEvent
  | DriftClearedEvent
  | HealthPythonChangedEvent
