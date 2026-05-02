import fs from 'node:fs'
import path from 'node:path'

import type { FastifyInstance } from 'fastify'
import yaml, { load as loadYaml } from 'js-yaml'

import type { TeamListItem } from '@bmad-studio/shared'

import { NotFoundError, ValidationError } from '../core/errors.js'
import { writeFile } from '../core/write-service.js'

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9-\s]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function isV65Project(projectRoot: string): boolean {
  const manifestPath = path.join(projectRoot, '_bmad', '_config', 'manifest.yaml')
  if (!fs.existsSync(manifestPath)) return false
  try {
    const manifest = loadYaml(fs.readFileSync(manifestPath, 'utf-8')) as Record<string, unknown>
    const installation = manifest?.installation as Record<string, unknown> | undefined
    const version = String(installation?.version ?? '')
    return version.startsWith('6.5')
  } catch {
    return false
  }
}

export async function teamsPlugin(app: FastifyInstance) {
  // List all teams
  app.get('/api/teams', async () => {
    if (!('fileStore' in app)) return []
    const index = app.fileStore.getIndex()
    return index.teams.map(
      (t): TeamListItem => ({
        id: t.id,
        name: t.name,
        icon: t.icon,
        description: t.description,
        memberCount: t.members.length,
        agentIds: t.agentIds,
        module: t.module,
      }),
    )
  })

  // Get team detail
  app.get<{ Params: { id: string } }>('/api/teams/:id', async (request) => {
    if (!('fileStore' in app)) throw new NotFoundError('File store not available')
    const index = app.fileStore.getIndex()
    const team = index.teams.find((t) => t.id === request.params.id)
    if (!team) throw new NotFoundError(`Team "${request.params.id}" not found`)
    return team
  })

  // Get party CSV content
  app.get<{ Params: { id: string } }>('/api/teams/:id/party', async (request) => {
    if (!('fileStore' in app)) throw new NotFoundError('File store not available')
    const index = app.fileStore.getIndex()
    const team = index.teams.find((t) => t.id === request.params.id)
    if (!team) throw new NotFoundError(`Team "${request.params.id}" not found`)

    if (!team.partyFile) {
      throw new NotFoundError('Team has no party CSV file')
    }

    const absPath = path.resolve(path.dirname(team.filePath), team.partyFile)
    if (!fs.existsSync(absPath)) {
      throw new NotFoundError(`Party CSV file not found: ${team.partyFile}`)
    }

    const content = fs.readFileSync(absPath, 'utf-8')
    return { content }
  })

  // Create team (v6 only — not supported in v6.5)
  app.post('/api/teams', async (request, reply) => {
    if (!('fileStore' in app)) throw new ValidationError('No project detected')

    if (isV65Project(app.fileStore.projectRoot)) {
      throw new ValidationError('Teams are derived from agent configuration in v6.5 projects and cannot be created manually')
    }

    const body = request.body as {
      name?: string
      icon?: string
      description?: string
      agentIds?: string[]
      module?: string
    }

    const name = body.name?.trim()
    if (!name) throw new ValidationError('Team name is required')

    const moduleName = body.module?.trim()
    if (!moduleName) throw new ValidationError('Module is required')

    const slug = slugify(name)
    if (!slug) throw new ValidationError('Team name must contain alphanumeric characters')

    const bmadDir = path.join(app.fileStore.projectRoot, '_bmad')
    const teamsDir = path.join(bmadDir, moduleName, 'teams')
    const teamFile = path.join(teamsDir, `team-${slug}.yaml`)

    if (fs.existsSync(teamFile)) {
      throw new ValidationError(`Team file already exists: team-${slug}.yaml`)
    }

    // Ensure teams directory exists
    if (!fs.existsSync(teamsDir)) {
      fs.mkdirSync(teamsDir, { recursive: true })
    }

    const teamYaml: Record<string, unknown> = {
      bundle: {
        name,
        icon: body.icon ?? '',
        description: body.description ?? '',
      },
      agents: body.agentIds ?? [],
    }

    const content = yaml.dump(teamYaml, { lineWidth: -1 })
    const wResult = writeFile(teamFile, content, app.fileStore.studioDir)
    if (!wResult.ok) throw new ValidationError(wResult.error)

    app.fileStore.rebuild()

    reply.status(201)
    return { ok: true, id: `team-${slug}`, path: teamFile }
  })

  // Update team (v6 only — not supported in v6.5)
  app.put<{ Params: { id: string } }>('/api/teams/:id', async (request) => {
    if (!('fileStore' in app)) throw new NotFoundError('File store not available')

    if (isV65Project(app.fileStore.projectRoot)) {
      throw new ValidationError('Teams are derived from agent configuration in v6.5 projects and cannot be edited manually')
    }

    const index = app.fileStore.getIndex()
    const team = index.teams.find((t) => t.id === request.params.id)
    if (!team) throw new NotFoundError(`Team "${request.params.id}" not found`)

    const body = request.body as {
      name?: string
      icon?: string
      description?: string
      agentIds?: string[]
    }

    // Read existing YAML, merge updates
    type TeamYaml = { bundle?: { name?: string; icon?: string; description?: string }; agents?: string[]; party?: string }
    const existing: TeamYaml = (yaml.load(fs.readFileSync(team.filePath, 'utf-8')) as TeamYaml | null) ?? {}

    if (body.name !== undefined) existing.bundle = { ...existing.bundle, name: body.name }
    if (body.icon !== undefined) existing.bundle = { ...existing.bundle, icon: body.icon }
    if (body.description !== undefined)
      existing.bundle = { ...existing.bundle, description: body.description }
    if (body.agentIds !== undefined) existing.agents = body.agentIds

    const content = yaml.dump(existing, { lineWidth: -1 })

    app.fileStore.markPendingWrite(team.filePath)
    const result = writeFile(team.filePath, content, app.fileStore.studioDir)
    app.fileStore.clearPendingWrite(team.filePath)

    if (!result.ok) throw new ValidationError(result.error)

    app.fileStore.rebuild()
    return { ok: true }
  })

  // Delete team (v6 only — YAML only, preserve party CSV)
  app.delete<{ Params: { id: string } }>('/api/teams/:id', async (request) => {
    if (!('fileStore' in app)) throw new NotFoundError('File store not available')

    if (isV65Project(app.fileStore.projectRoot)) {
      throw new ValidationError('Teams are derived from agent configuration in v6.5 projects and cannot be deleted manually')
    }

    const index = app.fileStore.getIndex()
    const team = index.teams.find((t) => t.id === request.params.id)
    if (!team) throw new NotFoundError(`Team "${request.params.id}" not found`)

    if (fs.existsSync(team.filePath)) {
      fs.unlinkSync(team.filePath)
    }

    app.fileStore.rebuild()
    return { ok: true, id: request.params.id }
  })

  // Update party CSV content (v6 only — not supported in v6.5)
  app.put<{ Params: { id: string } }>('/api/teams/:id/party', async (request) => {
    if (!('fileStore' in app)) throw new NotFoundError('File store not available')

    if (isV65Project(app.fileStore.projectRoot)) {
      throw new ValidationError('Party files are not supported in v6.5 projects')
    }

    const index = app.fileStore.getIndex()
    const team = index.teams.find((t) => t.id === request.params.id)
    if (!team) throw new NotFoundError(`Team "${request.params.id}" not found`)

    if (!team.partyFile) throw new ValidationError('Team has no party CSV file configured')

    const body = request.body as { content?: string }
    if (typeof body.content !== 'string') throw new ValidationError('Content must be a string')

    const absPath = path.resolve(path.dirname(team.filePath), team.partyFile)

    app.fileStore.markPendingWrite(absPath)
    const result = writeFile(absPath, body.content, app.fileStore.studioDir)
    app.fileStore.clearPendingWrite(absPath)

    if (!result.ok) throw new ValidationError(result.error)

    app.fileStore.rebuild()
    return { ok: true }
  })
}
