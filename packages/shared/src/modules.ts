export type ModuleVariableDefinition = {
  prompt: string
  default?: string
}

export type ModuleYaml = {
  code: string
  name?: string
  version?: string
  description?: string
  variables?: Record<string, ModuleVariableDefinition>
  directories?: string[]
}

export type ModuleSourceType =
  | 'npm'
  | 'local'
  | 'github'
  | 'zip'
  | 'custom'
  | 'built-in'
  | 'external'

export type ModuleManifestEntry = {
  name: string
  version: string
  installDate: string
  lastUpdated: string
  source: ModuleSourceType
  npmPackage: string | null
  repoUrl: string | null
}

export type ModuleManifestFile = {
  installation: {
    version: string
    installDate: string
    lastUpdated: string
  }
  modules: ModuleManifestEntry[]
  ides?: string[]
}
