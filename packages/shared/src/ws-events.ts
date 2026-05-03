export type ManifestChangedEvent = { type: 'manifest:changed'; projectRoot: string }
export type SkillManifestChangedEvent = { type: 'skill-manifest:changed'; projectRoot: string }
export type CustomizeChangedEvent = {
  type: 'customize:changed'
  skillId: string
  layer: 'team' | 'user'
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
