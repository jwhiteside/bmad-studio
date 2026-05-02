/**
 * customize-plugin.ts — Epic 39
 *
 * GET  /api/agents/:id/customize    — read agent customize.toml (v6.5 only)
 * PUT  /api/agents/:id/customize    — write agent customize.toml (v6.5 only)
 * GET  /api/workflows/:id/customize — read workflow customize.toml (v6.5 only)
 * PUT  /api/workflows/:id/customize — write workflow customize.toml (v6.5 only)
 */

import fs from 'node:fs'
import path from 'node:path'

import type { FastifyInstance } from 'fastify'
import { parse as parseTOML } from 'smol-toml'

import { NotFoundError, ValidationError } from '../core/errors.js'
import { writeFile } from '../core/write-service.js'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns true if the project's manifest.yaml indicates a v6.5 installation.
 */
function isV65Project(projectRoot: string): boolean {
  const manifestPath = path.join(projectRoot, '_bmad', '_config', 'manifest.yaml')
  if (!fs.existsSync(manifestPath)) return false
  try {
    const content = fs.readFileSync(manifestPath, 'utf-8')
    // Simple regex extraction — avoids pulling in js-yaml just for a version check
    const versionMatch = content.match(/version:\s*["']?([^"'\n\r]+)["']?/)
    const version = versionMatch?.[1]?.trim() ?? ''
    return version.startsWith('6.5')
  } catch {
    return false
  }
}

// ---------------------------------------------------------------------------
// Types for parsed TOML blocks
// ---------------------------------------------------------------------------

type AgentMenuEntry = {
  code: string
  description: string
  skill?: string
  prompt?: string
}

type AgentParsed = {
  name?: string
  title?: string
  icon?: string
  role?: string
  identity?: string
  communicationStyle?: string
  principles?: string
  persistentFacts?: string[]
  activationStepsPrepend?: string[]
  activationStepsAppend?: string[]
  menu?: AgentMenuEntry[]
}

type WorkflowParsed = {
  persistentFacts?: string[]
  activationStepsPrepend?: string[]
  activationStepsAppend?: string[]
  onComplete?: string
}

// ---------------------------------------------------------------------------
// TOML parsing helpers
// ---------------------------------------------------------------------------

function parseAgentCustomize(raw: string): AgentParsed {
  if (!raw.trim()) return {}
  try {
    const doc = parseTOML(raw) as Record<string, unknown>
    const agent = (doc.agent ?? {}) as Record<string, unknown>
    return {
      name: typeof agent.name === 'string' ? agent.name : undefined,
      title: typeof agent.title === 'string' ? agent.title : undefined,
      icon: typeof agent.icon === 'string' ? agent.icon : undefined,
      role: typeof agent.role === 'string' ? agent.role : undefined,
      identity: typeof agent.identity === 'string' ? agent.identity : undefined,
      communicationStyle: typeof agent.communication_style === 'string' ? agent.communication_style : undefined,
      principles: typeof agent.principles === 'string' ? agent.principles : undefined,
      persistentFacts: toStringArray(agent.persistent_facts),
      activationStepsPrepend: toStringArray(agent.activation_steps_prepend),
      activationStepsAppend: toStringArray(agent.activation_steps_append),
      menu: parseMenuEntries(agent.menu),
    }
  } catch {
    return {}
  }
}

function parseWorkflowCustomize(raw: string): WorkflowParsed {
  if (!raw.trim()) return {}
  try {
    const doc = parseTOML(raw) as Record<string, unknown>
    const workflow = (doc.workflow ?? {}) as Record<string, unknown>
    return {
      persistentFacts: toStringArray(workflow.persistent_facts),
      activationStepsPrepend: toStringArray(workflow.activation_steps_prepend),
      activationStepsAppend: toStringArray(workflow.activation_steps_append),
      onComplete: typeof workflow.on_complete === 'string' ? workflow.on_complete : undefined,
    }
  } catch {
    return {}
  }
}

function toStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined
  const arr = value.filter((v) => typeof v === 'string') as string[]
  return arr.length > 0 ? arr : undefined
}

function parseMenuEntries(value: unknown): AgentMenuEntry[] | undefined {
  if (!Array.isArray(value)) return undefined
  const result: AgentMenuEntry[] = []
  for (const item of value) {
    if (typeof item !== 'object' || item === null) continue
    const entry = item as Record<string, unknown>
    if (typeof entry.code !== 'string' || typeof entry.description !== 'string') continue
    result.push({
      code: entry.code,
      description: entry.description,
      skill: typeof entry.skill === 'string' ? entry.skill : undefined,
      prompt: typeof entry.prompt === 'string' ? entry.prompt : undefined,
    })
  }
  return result.length > 0 ? result : undefined
}

// ---------------------------------------------------------------------------
// Plugin
// ---------------------------------------------------------------------------

export async function customizePlugin(app: FastifyInstance) {
  // -------------------------------------------------------------------------
  // GET /api/agents/:id/customize
  // -------------------------------------------------------------------------
  app.get<{ Params: { id: string } }>('/api/agents/:id/customize', async (request) => {
    if (!('fileStore' in app)) throw new NotFoundError('File store not available')

    if (!isV65Project(app.fileStore.projectRoot)) {
      throw new NotFoundError('Customization TOML is only available for v6.5 projects')
    }

    const index = app.fileStore.getIndex()
    const agent = index.agents.find((a) => a.id === request.params.id)
    if (!agent) throw new NotFoundError(`Agent "${request.params.id}" not found`)

    // The agent's directory is derived from its module and id
    const agentDir = path.dirname(agent.filePath)
    const customizePath = path.join(agentDir, 'customize.toml')

    const raw = fs.existsSync(customizePath)
      ? fs.readFileSync(customizePath, 'utf-8')
      : ''

    return { raw, parsed: parseAgentCustomize(raw) }
  })

  // -------------------------------------------------------------------------
  // PUT /api/agents/:id/customize
  // -------------------------------------------------------------------------
  app.put<{ Params: { id: string }; Body: { raw: string } }>(
    '/api/agents/:id/customize',
    async (request) => {
      if (!('fileStore' in app)) throw new NotFoundError('File store not available')

      if (!isV65Project(app.fileStore.projectRoot)) {
        throw new NotFoundError('Customization TOML is only available for v6.5 projects')
      }

      const index = app.fileStore.getIndex()
      const agent = index.agents.find((a) => a.id === request.params.id)
      if (!agent) throw new NotFoundError(`Agent "${request.params.id}" not found`)

      const { raw } = request.body as { raw: string }
      if (typeof raw !== 'string') throw new ValidationError('Body must include a "raw" string field')

      // Validate TOML syntax
      let doc: Record<string, unknown>
      try {
        doc = parseTOML(raw) as Record<string, unknown>
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        throw new ValidationError(`Invalid TOML: ${msg}`)
      }

      // Validate [agent] block exists
      if (typeof doc.agent !== 'object' || doc.agent === null || Array.isArray(doc.agent)) {
        throw new ValidationError('TOML must contain an [agent] table')
      }

      const agentDir = path.dirname(agent.filePath)
      const customizePath = path.join(agentDir, 'customize.toml')

      app.fileStore.markPendingWrite(customizePath)
      const result = writeFile(customizePath, raw, app.fileStore.studioDir)
      app.fileStore.clearPendingWrite(customizePath)

      if (!result.ok) throw new ValidationError(result.error)

      return { ok: true }
    },
  )

  // -------------------------------------------------------------------------
  // GET /api/workflows/:id/customize
  // -------------------------------------------------------------------------
  app.get<{ Params: { id: string } }>('/api/workflows/:id/customize', async (request) => {
    if (!('fileStore' in app)) throw new NotFoundError('File store not available')

    if (!isV65Project(app.fileStore.projectRoot)) {
      throw new NotFoundError('Customization TOML is only available for v6.5 projects')
    }

    const index = app.fileStore.getIndex()
    const workflow = index.workflows.find((w) => w.id === request.params.id)
    if (!workflow) throw new NotFoundError(`Workflow "${request.params.id}" not found`)

    // Workflow files live in a directory; use the directory of entryPoint
    const workflowDir = path.dirname(workflow.entryPoint)
    const customizePath = path.join(workflowDir, 'customize.toml')

    const raw = fs.existsSync(customizePath)
      ? fs.readFileSync(customizePath, 'utf-8')
      : ''

    return { raw, parsed: parseWorkflowCustomize(raw) }
  })

  // -------------------------------------------------------------------------
  // PUT /api/workflows/:id/customize
  // -------------------------------------------------------------------------
  app.put<{ Params: { id: string }; Body: { raw: string } }>(
    '/api/workflows/:id/customize',
    async (request) => {
      if (!('fileStore' in app)) throw new NotFoundError('File store not available')

      if (!isV65Project(app.fileStore.projectRoot)) {
        throw new NotFoundError('Customization TOML is only available for v6.5 projects')
      }

      const index = app.fileStore.getIndex()
      const workflow = index.workflows.find((w) => w.id === request.params.id)
      if (!workflow) throw new NotFoundError(`Workflow "${request.params.id}" not found`)

      const { raw } = request.body as { raw: string }
      if (typeof raw !== 'string') throw new ValidationError('Body must include a "raw" string field')

      // Validate TOML syntax
      let doc: Record<string, unknown>
      try {
        doc = parseTOML(raw) as Record<string, unknown>
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        throw new ValidationError(`Invalid TOML: ${msg}`)
      }

      // Validate [workflow] block exists
      if (typeof doc.workflow !== 'object' || doc.workflow === null || Array.isArray(doc.workflow)) {
        throw new ValidationError('TOML must contain a [workflow] table')
      }

      const workflowDir = path.dirname(workflow.entryPoint)
      const customizePath = path.join(workflowDir, 'customize.toml')

      app.fileStore.markPendingWrite(customizePath)
      const result = writeFile(customizePath, raw, app.fileStore.studioDir)
      app.fileStore.clearPendingWrite(customizePath)

      if (!result.ok) throw new ValidationError(result.error)

      return { ok: true }
    },
  )
}
