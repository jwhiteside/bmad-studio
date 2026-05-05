import path from 'node:path'

import multipart from '@fastify/multipart'
import Fastify from 'fastify'

import type { AppInfo, ProjectStatus } from '@bmad-studio/shared'
import type { FastifyServerOptions } from 'fastify'

import { registerStatic } from './static.js'
import { isNewEntityModel } from './parsers/index-builder.js'
import { registerFileStore, createFileStore } from './core/file-store.js'
import { registerWebSocket } from './core/websocket.js'
import { AppError } from './core/errors.js'
import { overviewPlugin } from './plugins/overview-plugin.js'
import { agentsPlugin } from './plugins/agents-plugin.js'
import { validationPlugin } from './plugins/validation-plugin.js'
import { searchPlugin } from './plugins/search-plugin.js'
import { skillsPlugin } from './plugins/skills-plugin.js'
import { workflowsPlugin } from './plugins/workflows-plugin.js'
import { outputsPlugin } from './plugins/outputs-plugin.js'
import { filesPlugin } from './plugins/files-plugin.js'
import { settingsPlugin } from './plugins/settings-plugin.js'
import { modulesPlugin } from './plugins/modules-plugin.js'
import { teamsPlugin } from './plugins/teams-plugin.js'
import { commandsPlugin } from './plugins/commands-plugin.js'
import { datasourcesPlugin } from './plugins/datasources-plugin.js'
import { customizePlugin } from './plugins/customize-plugin.js'
import { projectContextPlugin } from './plugins/project-context-plugin.js'
import { driftPlugin } from './plugins/drift-plugin.js'
import { wikiPlugin } from './plugins/wiki-plugin.js'
import { detectProject, type ProjectDetectionResult } from './core/project-detector.js'
import { probePython } from './v65/python-bridge.js'

// Story 32.8: Augment FastifyInstance with Python probe fields.
declare module 'fastify' {
  interface FastifyInstance {
    pythonResolverAvailable: boolean
    pythonVersion: string | null
  }
}

// Bump this constant if a real registry module exceeds the limit. Local-tool default —
// not security-critical. See finding #17 / spec §6.1 for the rationale.
export const MAX_MODULE_UPLOAD_BYTES = 50 * 1024 * 1024 // 50 MB

type CreateAppOptions = {
  logger?: FastifyServerOptions['logger']
  serveStatic?: boolean
  project?: ProjectDetectionResult | null
}

export async function createApp(options: CreateAppOptions = {}) {
  const app = Fastify({
    logger: options.logger ?? true,
  })

  // Story 32.8: Probe for Python 3.11+ once at startup (synchronous, 1 s timeout).
  const pythonProbe = probePython()
  app.decorate('pythonResolverAvailable', pythonProbe.available)
  app.decorate('pythonVersion', pythonProbe.version)
  app.log.info({
    event: 'v65.python.probe',
    available: pythonProbe.available,
    version: pythonProbe.version,
  })

  // Global error handler
  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send(error.toJSON())
    }
    app.log.error(error)
    return reply.status(500).send({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
        severity: 'error',
      },
    })
  })

  app.get('/api/health', async () => {
    const info: AppInfo = {
      name: 'bmad-studio',
      version: '0.1.0',
    }
    return {
      status: 'ok',
      ...info,
      pythonResolverAvailable: app.pythonResolverAvailable,
      pythonVersion: app.pythonVersion,
    }
  })

  // Story 32.8: Re-run the Python probe on demand (e.g. after the user installs Python).
  app.post('/api/health/recheck', async () => {
    const result = probePython()
    app.pythonResolverAvailable = result.available
    app.pythonVersion = result.version
    return { pythonResolverAvailable: result.available, pythonVersion: result.version }
  })

  // Project status endpoint
  const project = options.project
  const projectRoot = project?.projectRoot ?? undefined
  const projectStatus: ProjectStatus = project
    ? {
        detected: true,
        bmadVersion: project.bmadVersion ?? undefined,
        projectRoot,
        modules: project.modules.map((m) => m.name),
        ideDirectories: project.ideDirectories,
      }
    : {
        detected: false,
        modules: [],
        ideDirectories: [],
      }

  // Mutable project status — updated on switch
  let currentProjectStatus = { ...projectStatus }
  let currentProjectRoot = projectRoot

  // Expose name/path fields alongside the full project status for the Sidebar project switcher
  app.get('/api/project', async () => ({
    ...currentProjectStatus,
    name: currentProjectRoot ? path.basename(currentProjectRoot) : null,
    path: currentProjectRoot ?? null,
  }))

  // GET /api/project/mode — v6 vs v6.5+ detection for UI mode switching (Epic 41)
  app.get('/api/project/mode', async () => {
    const bmadVersion = currentProjectStatus.bmadVersion
    const isV65 = typeof bmadVersion === 'string' && isNewEntityModel(bmadVersion)
    const version: 'v6' | 'v6.5' = isV65 ? 'v6.5' : 'v6'
    // teamsReadOnly: in v6.5 teams come from manifest, not writable via Studio UI
    const teamsReadOnly = isV65
    return { version, teamsReadOnly }
  })

  // Story 28.1: Project switch endpoint
  app.post<{ Body: { path: string } }>('/api/project/switch', async (request) => {
    const targetPath = request.body?.path
    if (!targetPath) throw Object.assign(new Error('Missing project path'), { statusCode: 400 })

    // Validate the target is a BMAD project
    const detected = detectProject(targetPath)
    if (!detected) throw Object.assign(new Error(`No BMAD project found at: ${targetPath}`), { statusCode: 404 })

    // Check no writes in progress
    const holder = app.fileStoreHolder
    if (holder?.current && holder.current.pendingWrites.size > 0) {
      throw Object.assign(new Error('Cannot switch while file writes are in progress'), { statusCode: 409 })
    }

    // Teardown old store
    if (holder?.current) {
      await holder.current.close()
      holder.current = null
    }

    // Initialize new store
    const newStore = await createFileStore(app, detected.projectRoot)
    holder.current = newStore

    // Update mutable project status
    currentProjectRoot = detected.projectRoot
    currentProjectStatus = {
      detected: true,
      bmadVersion: detected.bmadVersion ?? undefined,
      projectRoot: detected.projectRoot,
      modules: detected.modules.map((m) => m.name),
      ideDirectories: detected.ideDirectories,
    }

    // Story 28.2: Broadcast switch event
    if (app.ws) {
      app.ws.broadcast({
        type: 'project:switched',
        projectName: path.basename(detected.projectRoot),
        projectRoot: detected.projectRoot,
      })
    }

    return {
      ...currentProjectStatus,
      name: path.basename(detected.projectRoot),
      path: detected.projectRoot,
    }
  })

  // Register WebSocket support
  await registerWebSocket(app)

  // Register multipart support BEFORE any plugin that uses request.file()
  // (modulesPlugin's POST /api/modules/install/upload route — Story 15.4).
  await app.register(multipart, {
    limits: { fileSize: MAX_MODULE_UPLOAD_BYTES },
  })

  // Register file store if project detected
  if (project) {
    await registerFileStore(app, project.projectRoot)
  }

  // Register API plugins
  await app.register(overviewPlugin)
  await app.register(agentsPlugin)
  await app.register(validationPlugin)
  await app.register(searchPlugin)
  await app.register(skillsPlugin)
  await app.register(workflowsPlugin)
  await app.register(outputsPlugin)
  await app.register(filesPlugin)
  await app.register(settingsPlugin)
  await app.register(modulesPlugin)
  await app.register(teamsPlugin)
  await app.register(commandsPlugin)
  await app.register(datasourcesPlugin)
  await app.register(customizePlugin)
  await app.register(projectContextPlugin)
  await app.register(driftPlugin)
  await app.register(wikiPlugin)

  if (options.serveStatic !== false) {
    await registerStatic(app)
  }

  return app
}
