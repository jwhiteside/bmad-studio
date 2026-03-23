import fs from 'node:fs'
import path from 'node:path'

import type { FastifyInstance } from 'fastify'

import { parseCsv } from '../parsers/csv-parser.js'

export type CommandItem = {
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

function rowToCommand(row: Record<string, string>): CommandItem {
  const seq = row['sequence']?.trim()
  return {
    module: row['module'] ?? '',
    phase: row['phase'] ?? '',
    name: row['name'] ?? '',
    code: row['code'] ?? '',
    sequence: seq ? parseInt(seq, 10) : null,
    required: row['required']?.toLowerCase() === 'true',
    agentDisplayName: row['agent-display-name'] ?? '',
    agentTitle: row['agent-title'] ?? '',
    description: row['description'] ?? '',
    outputLocation: row['output-location'] ?? '',
    command: row['command'] ?? '',
  }
}

export async function commandsPlugin(app: FastifyInstance) {
  app.get('/api/commands', async () => {
    if (!('fileStore' in app)) return []

    const projectRoot = app.fileStore.projectRoot
    const csvPath = path.join(projectRoot, '_bmad', '_config', 'bmad-help.csv')

    if (!fs.existsSync(csvPath)) {
      return []
    }

    const content = fs.readFileSync(csvPath, 'utf-8')
    const result = parseCsv(csvPath, content)

    if (!result.ok) {
      app.log.warn({ error: result.error }, 'Failed to parse bmad-help.csv')
      return []
    }

    return result.data.map(rowToCommand)
  })
}
