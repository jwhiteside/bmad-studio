import Fastify from 'fastify'

import type { AppInfo, ProjectStatus } from '@bmad-studio/shared'
import type { FastifyServerOptions } from 'fastify'

import { registerStatic } from './static.js'
import { registerFileStore } from './core/file-store.js'
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
import type { ProjectDetectionResult } from './core/project-detector.js'

type CreateAppOptions = {
  logger?: FastifyServerOptions['logger']
  serveStatic?: boolean
  project?: ProjectDetectionResult | null
}

export async function createApp(options: CreateAppOptions = {}) {
  const app = Fastify({
    logger: options.logger ?? true,
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
    return { status: 'ok', ...info }
  })

  // Project status endpoint
  const project = options.project
  const projectStatus: ProjectStatus = project
    ? {
        detected: true,
        bmadVersion: project.bmadVersion ?? undefined,
        projectRoot: project.projectRoot,
        modules: project.modules.map((m) => m.name),
        ideDirectories: project.ideDirectories,
      }
    : {
        detected: false,
        modules: [],
        ideDirectories: [],
      }

  app.get('/api/project', async () => projectStatus)

  // Register WebSocket support
  await registerWebSocket(app)

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

  if (options.serveStatic !== false) {
    await registerStatic(app)
  }

  return app
}
