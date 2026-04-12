import fs from 'node:fs'
import path from 'node:path'

import yaml from 'js-yaml'
import type { FastifyInstance } from 'fastify'

import type { DataSource, DataSourceType } from '@bmad-studio/shared'

import { ValidationError, NotFoundError } from '../core/errors.js'
import { generateIdeSkillsForModule } from '../core/ide-skill-generator.js'
import { readManifestSafe } from '../core/module-installer.js'
import { writeFile } from '../core/write-service.js'

const TEMPLATES: Record<string, Partial<DataSource>> = {
  jira: {
    cliTool: 'jira-cli',
    parameters: { project: '', board: '' },
    outputPath: '_bmad-output/data/jira/',
  },
  confluence: {
    cliTool: 'confluence-cli',
    parameters: { space: '', label: '' },
    outputPath: '_bmad-output/data/confluence/',
  },
  figma: {
    cliTool: 'figma-export',
    parameters: { fileKey: '', nodeId: '' },
    outputPath: '_bmad-output/data/figma/',
  },
  github: {
    cliTool: 'gh',
    parameters: { repo: '', query: '' },
    outputPath: '_bmad-output/data/github/',
  },
  custom: {
    cliTool: '',
    parameters: {},
    outputPath: '_bmad-output/data/',
  },
}

function toKebabCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function getDatasourcesPath(studioDir: string): string {
  return path.join(studioDir, 'sync', 'datasources.json')
}

function readDatasources(filePath: string): DataSource[] {
  if (!fs.existsSync(filePath)) {
    return []
  }
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    return JSON.parse(content) as DataSource[]
  } catch {
    return []
  }
}

function writeDatasources(filePath: string, datasources: DataSource[]) {
  const dir = path.dirname(filePath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  fs.writeFileSync(filePath, JSON.stringify(datasources, null, 2), 'utf-8')
}

function buildSyncCommand(ds: DataSource): string {
  const parts = [ds.cliTool]

  switch (ds.type) {
    case 'jira':
      parts.push('export')
      if (ds.parameters.project) parts.push('--project', ds.parameters.project)
      if (ds.parameters.board) parts.push('--board', ds.parameters.board)
      parts.push('--output', ds.outputPath)
      break
    case 'confluence':
      parts.push('export')
      if (ds.parameters.space) parts.push('--space', ds.parameters.space)
      if (ds.parameters.label) parts.push('--label', ds.parameters.label)
      parts.push('--output', ds.outputPath)
      break
    case 'figma':
      if (ds.parameters.fileKey) parts.push('--file-key', ds.parameters.fileKey)
      if (ds.parameters.nodeId) parts.push('--node-id', ds.parameters.nodeId)
      parts.push('--output', ds.outputPath)
      break
    case 'github':
      parts.push('api')
      if (ds.parameters.repo) parts.push(`repos/${ds.parameters.repo}/issues`)
      if (ds.parameters.query) parts.push('--jq', ds.parameters.query)
      parts.push('>', `${ds.outputPath}github-export.json`)
      break
    case 'custom':
    default:
      // For custom, just assemble tool + all parameters
      for (const [key, value] of Object.entries(ds.parameters)) {
        if (value) parts.push(`--${key}`, value)
      }
      if (ds.outputPath) parts.push('--output', ds.outputPath)
      break
  }

  return parts.join(' ')
}

export async function datasourcesPlugin(app: FastifyInstance) {
  // GET /api/datasources — list all datasources
  app.get('/api/datasources', async () => {
    if (!('fileStore' in app)) {
      return []
    }

    const filePath = getDatasourcesPath(app.fileStore.studioDir)
    return readDatasources(filePath)
  })

  // GET /api/datasources/templates — return available templates
  app.get('/api/datasources/templates', async () => {
    return Object.entries(TEMPLATES).map(([type, template]) => ({
      type,
      ...template,
    }))
  })

  // POST /api/datasources — create a new datasource
  app.post('/api/datasources', async (request, reply) => {
    if (!('fileStore' in app)) {
      throw new ValidationError('No project detected')
    }

    const body = request.body as {
      name?: string
      type?: DataSourceType
      cliTool?: string
      parameters?: Record<string, string>
      outputPath?: string
    }

    const name = body.name?.trim()
    if (!name) {
      throw new ValidationError('Data source name is required')
    }

    const type = body.type ?? 'custom'
    const template = TEMPLATES[type] ?? TEMPLATES.custom

    const id = toKebabCase(name)
    const filePath = getDatasourcesPath(app.fileStore.studioDir)
    const datasources = readDatasources(filePath)

    if (datasources.some((ds) => ds.id === id)) {
      throw new ValidationError(`Data source "${name}" already exists`)
    }

    const newDs: DataSource = {
      id,
      name,
      type: type as DataSourceType,
      cliTool: body.cliTool ?? template.cliTool ?? '',
      parameters: body.parameters ?? { ...(template.parameters as Record<string, string>) },
      outputPath: body.outputPath ?? template.outputPath ?? '_bmad-output/data/',
      status: 'configured',
    }

    datasources.push(newDs)
    writeDatasources(filePath, datasources)

    reply.status(201)
    return newDs
  })

  // PUT /api/datasources/:id — update a datasource
  app.put('/api/datasources/:id', async (request) => {
    if (!('fileStore' in app)) {
      throw new ValidationError('No project detected')
    }

    const { id } = request.params as { id: string }
    const body = request.body as Partial<DataSource>

    const filePath = getDatasourcesPath(app.fileStore.studioDir)
    const datasources = readDatasources(filePath)
    const index = datasources.findIndex((ds) => ds.id === id)

    if (index === -1) {
      throw new NotFoundError(`Data source "${id}" not found`)
    }

    const existing = datasources[index]
    datasources[index] = {
      ...existing,
      name: body.name ?? existing.name,
      cliTool: body.cliTool ?? existing.cliTool,
      parameters: body.parameters ?? existing.parameters,
      outputPath: body.outputPath ?? existing.outputPath,
      status: body.status ?? existing.status,
    }

    writeDatasources(filePath, datasources)
    return datasources[index]
  })

  // DELETE /api/datasources/:id — remove a datasource
  app.delete('/api/datasources/:id', async (request) => {
    if (!('fileStore' in app)) {
      throw new ValidationError('No project detected')
    }

    const { id } = request.params as { id: string }
    const filePath = getDatasourcesPath(app.fileStore.studioDir)
    const datasources = readDatasources(filePath)

    const index = datasources.findIndex((ds) => ds.id === id)
    if (index === -1) {
      throw new NotFoundError(`Data source "${id}" not found`)
    }

    datasources.splice(index, 1)
    writeDatasources(filePath, datasources)

    return { ok: true, id }
  })

  // POST /api/datasources/:id/sync — generate CLI command
  app.post('/api/datasources/:id/sync', async (request) => {
    if (!('fileStore' in app)) {
      throw new ValidationError('No project detected')
    }

    const { id } = request.params as { id: string }
    const filePath = getDatasourcesPath(app.fileStore.studioDir)
    const datasources = readDatasources(filePath)

    const ds = datasources.find((d) => d.id === id)
    if (!ds) {
      throw new NotFoundError(`Data source "${id}" not found`)
    }

    const command = buildSyncCommand(ds)
    return { command }
  })

  // ---- IDE management ----

  // Full list of IDEs supported by the BMAD method installer (hardcoded snapshot — update when BMAD adds new IDEs)
  const KNOWN_IDES = [
    { id: 'claude-code', label: 'Claude Code', description: 'Anthropic Claude Code CLI — skills become /slash-commands' },
    { id: 'cursor', label: 'Cursor', description: 'Cursor AI IDE — skills sync to .cursor/skills/' },
    { id: 'windsurf', label: 'Windsurf', description: 'Windsurf IDE — skills sync to .windsurf/skills/' },
    { id: 'github-copilot', label: 'GitHub Copilot', description: 'GitHub Copilot — skills sync to .github/chatmodes/' },
    { id: 'vscode', label: 'VS Code', description: 'Visual Studio Code — skills sync via extension settings' },
    { id: 'jetbrains', label: 'JetBrains', description: 'JetBrains IDEs (IntelliJ, WebStorm, etc.) — skills sync to .idea/' },
    { id: 'antigravity', label: 'Antigravity', description: 'Antigravity IDE — skills sync to .antigravity/skills/' },
  ]

  // GET /api/ides — list configured + available IDEs
  app.get('/api/ides', async () => {
    if (!('fileStore' in app)) return { configured: [], available: KNOWN_IDES }
    const configuredIds = new Set(app.fileStore.getIndex().ideConfigs.map((c) => c.ide))
    return {
      configured: app.fileStore.getIndex().ideConfigs,
      available: KNOWN_IDES.filter((ide) => !configuredIds.has(ide.id)),
    }
  })

  // POST /api/ides — add and configure a new IDE, then generate skills
  app.post('/api/ides', async (request, reply) => {
    if (!('fileStore' in app)) throw new ValidationError('No project detected')

    const body = request.body as { ide?: string }
    const ideId = body.ide?.trim()
    if (!ideId) throw new ValidationError('ide is required')
    if (!KNOWN_IDES.some((k) => k.id === ideId)) throw new ValidationError(`Unknown IDE: "${ideId}"`)

    const idesDir = path.join(app.fileStore.projectRoot, '_bmad', '_config', 'ides')
    const idePath = path.join(idesDir, `${ideId}.yaml`)
    if (fs.existsSync(idePath)) throw new ValidationError(`IDE "${ideId}" is already configured`)

    const content = yaml.dump({
      ide: ideId,
      configured_date: new Date().toISOString(),
      last_updated: new Date().toISOString(),
      configuration: { _noConfigNeeded: true },
    })

    const writeResult = writeFile(idePath, content, app.fileStore.studioDir)
    if (!writeResult.ok) throw new ValidationError(writeResult.error)

    // Regenerate skills for all modules that declare this IDE
    const manifestPath = path.join(app.fileStore.projectRoot, '_bmad', '_config', 'manifest.yaml')
    const manifest = readManifestSafe(manifestPath)
    const skillsGenerated: Record<string, number> = {}

    if (manifest?.modules) {
      for (const [modName] of Object.entries(manifest.modules)) {
        const modManifest = readManifestSafe(manifestPath)
        if (!modManifest?.ides?.includes(ideId)) continue
        const genResult = generateIdeSkillsForModule(
          app.fileStore.projectRoot, modName, modManifest, app.fileStore.studioDir, app.fileStore,
        )
        if (genResult.ok && genResult.skillsByIde[ideId]) {
          skillsGenerated[modName] = genResult.skillsByIde[ideId].length
        }
      }
    }

    app.fileStore.rebuild()
    reply.code(201)
    return { ok: true, ide: ideId, skillsGenerated }
  })

  // GET /api/ides/coverage — per-IDE module coverage map
  app.get('/api/ides/coverage', async () => {
    if (!('fileStore' in app)) return {}

    const projectRoot = app.fileStore.projectRoot
    const manifestPath = path.join(projectRoot, '_bmad', '_config', 'manifest.yaml')
    const manifest = readManifestSafe(manifestPath)
    const configuredIdes = app.fileStore.getIndex().ideConfigs.map((c) => c.ide)
    const IDE_DIRS: Record<string, string> = {
      'claude-code': '.claude/skills',
      antigravity: '.antigravity/skills',
    }

    const coverage: Record<string, Array<{ module: string; synced: boolean; skillCount: number }>> = {}

    for (const ide of configuredIdes) {
      const skillDir = IDE_DIRS[ide]
      if (!skillDir) continue
      const fullSkillDir = path.join(projectRoot, skillDir)
      const existing = fs.existsSync(fullSkillDir)
        ? fs.readdirSync(fullSkillDir, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name)
        : []

      const modules: Array<{ module: string; synced: boolean; skillCount: number }> = []
      if (manifest?.modules) {
        for (const [modName] of Object.entries(manifest.modules)) {
          const agentPrefix = `bmad-agent-${modName}-`
          const otherPrefix = `bmad-${modName}-`
          const matched = existing.filter((d) => d.startsWith(agentPrefix) || d.startsWith(otherPrefix))
          modules.push({ module: modName, synced: matched.length > 0, skillCount: matched.length })
        }
      }
      coverage[ide] = modules
    }

    return coverage
  })
}
