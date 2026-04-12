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

function loadCsvCommands(csvPath: string, fallbackModule: string, log: FastifyInstance['log']): CommandItem[] {
  if (!fs.existsSync(csvPath)) return []
  const content = fs.readFileSync(csvPath, 'utf-8')
  const result = parseCsv(csvPath, content)
  if (!result.ok) {
    log.warn({ error: result.error, path: csvPath }, 'Failed to parse bmad-help.csv')
    return []
  }
  return result.data.map((row) => {
    const cmd = rowToCommand(row)
    if (!cmd.module) cmd.module = fallbackModule
    return cmd
  })
}

export async function commandsPlugin(app: FastifyInstance) {
  app.get('/api/commands', async () => {
    if (!('fileStore' in app)) return []

    const projectRoot = app.fileStore.projectRoot
    const bmadDir = path.join(projectRoot, '_bmad')
    const commands: CommandItem[] = []

    // Global bmad-help.csv
    commands.push(...loadCsvCommands(path.join(bmadDir, '_config', 'bmad-help.csv'), '', app.log))

    // Per-module bmad-help.csv (e.g. _bmad/dept-optimizely/_config/bmad-help.csv)
    if (fs.existsSync(bmadDir)) {
      for (const entry of fs.readdirSync(bmadDir, { withFileTypes: true })) {
        if (!entry.isDirectory() || entry.name.startsWith('_') || entry.name.startsWith('.')) continue
        const moduleCsv = path.join(bmadDir, entry.name, '_config', 'bmad-help.csv')
        commands.push(...loadCsvCommands(moduleCsv, entry.name, app.log))
      }
    }

    // Deduplicate by code+module (global CSV may already include module commands)
    const seen = new Set<string>()
    return commands.filter((cmd) => {
      const key = `${cmd.code}::${cmd.module}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  })
}
