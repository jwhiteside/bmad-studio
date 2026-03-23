export type ConnectionStatus = 'connected' | 'configured' | 'synced' | 'error' | 'not-configured'

export type DataSourceType = 'jira' | 'confluence' | 'figma' | 'github' | 'custom'

export type DataSource = {
  id: string
  name: string
  type: DataSourceType
  cliTool: string
  parameters: Record<string, string>
  outputPath: string
  lastSync?: string
  status: ConnectionStatus
}

export type DataSourceListItem = {
  id: string
  name: string
  type: DataSourceType
  status: ConnectionStatus
  lastSync?: string
}

export type DataSourceTemplate = {
  id: string
  name: string
  type: DataSourceType
  description: string
  requiredTool: string
  configSchema: Record<string, unknown>
}
