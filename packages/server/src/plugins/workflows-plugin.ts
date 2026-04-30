import fs from 'node:fs'
import path from 'node:path'

import { parse as parseToml } from 'smol-toml'
import type { FastifyInstance } from 'fastify'
import type {
  HookEntry,
  WorkflowHooks,
  WorkflowHookSurface,
  WorkflowListItem,
} from '@bmad-studio/shared'

import { NotFoundError, ValidationError } from '../core/errors.js'
import { writeFile } from '../core/write-service.js'

/**
 * Maps the camelCase WorkflowHookSurface used in the API to the snake_case
 * TOML key written into customize.toml.
 */
const SURFACE_TO_TOML_KEY: Record<WorkflowHookSurface, string> = {
  activationStepsPrepend: 'activation_steps_prepend',
  activationStepsAppend: 'activation_steps_append',
  onComplete: 'on_complete',
}

/**
 * Derives the project root from a workflow's absolute file path.
 * Workflow paths are like: /absolute/path/to/project/_bmad/<module>/workflows/<wf>/workflow.md
 * We split on '/_bmad/' and take the left part.
 */
function deriveProjectRoot(filePath: string): string {
  const idx = filePath.indexOf('/_bmad/')
  if (idx === -1) throw new Error(`Cannot derive project root from: ${filePath}`)
  return filePath.slice(0, idx)
}

function getCustomizePath(projectRoot: string, workflowId: string): string {
  return path.join(projectRoot, '_bmad', 'custom', `${workflowId}.toml`)
}

/**
 * Parses a single hook surface value from a parsed TOML object into HookEntry[].
 * Per ADR-9, the value may be:
 *  - undefined → []
 *  - a scalar string "cmd1 && cmd2" → split on ' && '
 *  - an array of strings → mapped 1:1
 * Disabled state from sidecar comments is a future enhancement; for now all
 * entries are treated as enabled.
 */
function parseSurfaceValue(value: unknown): HookEntry[] {
  if (value === undefined || value === null) return []
  if (typeof value === 'string') {
    if (value.trim() === '') return []
    return value
      .split(' && ')
      .map((cmd) => cmd.trim())
      .filter((cmd) => cmd.length > 0)
      .map((command) => ({ command }))
  }
  if (Array.isArray(value)) {
    return value
      .filter((v): v is string => typeof v === 'string')
      .map((command) => ({ command }))
  }
  return []
}


function toKebab(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export async function workflowsPlugin(app: FastifyInstance) {
  // Create a new workflow
  app.post('/api/workflows', async (request, reply) => {
    if (!('fileStore' in app)) {
      throw new ValidationError('No project detected')
    }

    const body = request.body as {
      name?: string
      description?: string
      type?: string
      phase?: string
      module?: string
      steps?: Array<{ title: string; agent?: string }>
    }

    const name = body.name?.trim()
    const description = body.description?.trim() ?? ''
    const type = body.type ?? 'step-based'
    const phase = body.phase?.trim()
    const moduleName = body.module?.trim()
    const steps = body.steps ?? []

    if (!name) throw new ValidationError('Workflow name is required')
    if (!moduleName) throw new ValidationError('Module is required')

    const bmadDir = path.join(app.fileStore.projectRoot, '_bmad')
    const moduleDir = path.join(bmadDir, moduleName)

    if (!fs.existsSync(moduleDir)) {
      throw new NotFoundError(`Module "${moduleName}" not found`)
    }

    // Build workflow directory path
    let workflowDir: string
    if (phase) {
      workflowDir = path.join(moduleDir, 'workflows', phase, name)
    } else {
      workflowDir = path.join(moduleDir, 'workflows', name)
    }

    if (fs.existsSync(workflowDir)) {
      throw new ValidationError(`Workflow "${name}" already exists in module "${moduleName}"`)
    }

    // Create directory structure
    fs.mkdirSync(workflowDir, { recursive: true })

    // Create workflow.md
    const workflowMd = [
      '---',
      `name: ${name}`,
      `description: "${description}"`,
      `type: ${type}`,
      '---',
      '',
      `# ${name}`,
      '',
      description || '<!-- Add workflow description here -->',
      '',
    ].join('\n')

    const wfResult = writeFile(path.join(workflowDir, 'workflow.md'), workflowMd, app.fileStore.studioDir)
    if (!wfResult.ok) throw new ValidationError(wfResult.error)

    // Create steps directory and step files (step-based only)
    if (type === 'step-based' && steps.length > 0) {
      const stepsDir = path.join(workflowDir, 'steps')
      fs.mkdirSync(stepsDir, { recursive: true })

      steps.forEach((step, i) => {
        const num = String(i + 1).padStart(2, '0')
        const slug = toKebab(step.title)
        const stepContent = [
          '---',
          `title: "${step.title}"`,
          step.agent ? `agent: ${step.agent}` : '',
          '---',
          '',
          `# Step ${num}: ${step.title}`,
          '',
          '## Instructions',
          '',
          '<!-- Add step instructions here -->',
          '',
        ]
          .filter(Boolean)
          .join('\n')

        const stepResult = writeFile(path.join(stepsDir, `step-${num}-${slug}.md`), stepContent, app.fileStore.studioDir)
        if (!stepResult.ok) throw new ValidationError(stepResult.error)
      })
    }

    app.fileStore.rebuild()

    reply.code(201)
    return { ok: true, name, path: workflowDir }
  })

  app.get('/api/workflows', async () => {
    if (!('fileStore' in app)) return []
    const index = app.fileStore.getIndex()
    return index.workflows.map(
      (w): WorkflowListItem => ({
        id: w.id,
        name: w.name,
        description: w.description,
        module: w.module,
        stepCount: w.steps.length,
        type: w.type,
        phase: w.phase,
      }),
    )
  })

  app.get<{ Params: { id: string } }>('/api/workflows/:id', async (request) => {
    if (!('fileStore' in app)) throw new NotFoundError('File store not available')
    const index = app.fileStore.getIndex()
    const workflow = index.workflows.find((w) => w.id === request.params.id)
    if (!workflow) throw new NotFoundError(`Workflow "${request.params.id}" not found`)
    return workflow
  })

  // Update workflow metadata
  app.put<{ Params: { id: string } }>('/api/workflows/:id', async (request) => {
    if (!('fileStore' in app)) throw new NotFoundError('File store not available')
    const index = app.fileStore.getIndex()
    const workflow = index.workflows.find((w) => w.id === request.params.id)
    if (!workflow) throw new NotFoundError(`Workflow "${request.params.id}" not found`)

    const body = request.body as { description?: string }

    if (!fs.existsSync(workflow.entryPoint)) {
      throw new NotFoundError(`Workflow file not found: ${workflow.entryPoint}`)
    }

    let content = fs.readFileSync(workflow.entryPoint, 'utf-8')

    if (body.description !== undefined) {
      const escaped = body.description.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
      const descPattern = /^(description:\s*)"?.*?"?\s*$/m
      if (descPattern.test(content)) {
        content = content.replace(descPattern, `$1"${escaped}"`)
      } else {
        // description: key absent — insert before the closing frontmatter ---
        content = content.replace(/(\n---\n)/, `\ndescription: "${escaped}"$1`)
      }
    }

    app.fileStore.markPendingWrite(workflow.entryPoint)
    const result = writeFile(workflow.entryPoint, content, app.fileStore.studioDir)
    app.fileStore.clearPendingWrite(workflow.entryPoint)

    if (!result.ok) {
      throw new ValidationError(result.error)
    }

    return { ok: true, filePath: result.filePath }
  })

  // Get step content
  app.get<{ Params: { id: string; stepIndex: string } }>(
    '/api/workflows/:id/steps/:stepIndex',
    async (request) => {
      if (!('fileStore' in app)) throw new NotFoundError('File store not available')

      const index = app.fileStore.getIndex()
      const workflow = index.workflows.find((w) => w.id === request.params.id)
      if (!workflow) throw new NotFoundError(`Workflow "${request.params.id}" not found`)

      const stepIndex = parseInt(request.params.stepIndex, 10)
      if (isNaN(stepIndex) || stepIndex < 0 || stepIndex >= workflow.steps.length) {
        throw new ValidationError(`Invalid step index: ${request.params.stepIndex}`)
      }

      const step = workflow.steps[stepIndex]
      if (!step.filePath || !fs.existsSync(step.filePath)) {
        throw new NotFoundError(`Step file not found: ${step.filePath}`)
      }

      const content = fs.readFileSync(step.filePath, 'utf-8')
      return { content, filePath: step.filePath, title: step.title }
    },
  )

  // Update a workflow step
  app.put<{ Params: { id: string; stepIndex: string }; Body: { content: string } }>(
    '/api/workflows/:id/steps/:stepIndex',
    async (request) => {
      if (!('fileStore' in app)) throw new NotFoundError('File store not available')

      const index = app.fileStore.getIndex()
      const workflow = index.workflows.find((w) => w.id === request.params.id)
      if (!workflow) throw new NotFoundError(`Workflow "${request.params.id}" not found`)

      const stepIndex = parseInt(request.params.stepIndex, 10)
      if (isNaN(stepIndex) || stepIndex < 0 || stepIndex >= workflow.steps.length) {
        throw new ValidationError(`Invalid step index: ${request.params.stepIndex}`)
      }

      const step = workflow.steps[stepIndex]
      if (!step.filePath) {
        throw new ValidationError('Step has no associated file')
      }

      const { content } = request.body as { content: string }
      if (typeof content !== 'string') {
        throw new ValidationError('Content must be a string')
      }

      if (!fs.existsSync(step.filePath)) {
        throw new NotFoundError(`Step file not found: ${step.filePath}`)
      }

      app.fileStore.markPendingWrite(step.filePath)
      const result = writeFile(step.filePath, content, app.fileStore.studioDir)
      app.fileStore.clearPendingWrite(step.filePath)

      if (!result.ok) {
        throw new ValidationError(result.error)
      }

      return { ok: true, filePath: result.filePath }
    },
  )

  // Get workflow hooks (Story 35.4)
  app.get<{ Params: { id: string } }>(
    '/api/workflows/:id/hooks',
    async (request): Promise<WorkflowHooks> => {
      if (!('fileStore' in app)) throw new NotFoundError('File store not available')
      const index = app.fileStore.getIndex()
      const workflow = index.workflows.find((w) => w.id === request.params.id)
      if (!workflow) throw new NotFoundError(`Workflow "${request.params.id}" not found`)

      const projectRoot = deriveProjectRoot(workflow.filePath)
      const customizePath = getCustomizePath(projectRoot, workflow.id)

      // Empty surfaces are addressable even without a customize.toml file
      const empty: WorkflowHooks = {
        activationStepsPrepend: [],
        activationStepsAppend: [],
        onComplete: [],
      }

      if (!fs.existsSync(customizePath)) return empty

      const raw = fs.readFileSync(customizePath, 'utf-8')
      let parsed: Record<string, unknown>
      try {
        parsed = parseToml(raw) as Record<string, unknown>
      } catch {
        // Malformed TOML — return empty rather than 500ing.
        return empty
      }

      return {
        activationStepsPrepend: parseSurfaceValue(parsed[SURFACE_TO_TOML_KEY.activationStepsPrepend]),
        activationStepsAppend: parseSurfaceValue(parsed[SURFACE_TO_TOML_KEY.activationStepsAppend]),
        onComplete: parseSurfaceValue(parsed[SURFACE_TO_TOML_KEY.onComplete]),
      }
    },
  )

  // List files within a workflow's supporting directories
  app.get<{ Params: { id: string } }>(
    '/api/workflows/:id/supporting-files',
    async (request) => {
      if (!('fileStore' in app)) throw new NotFoundError('File store not available')
      const index = app.fileStore.getIndex()
      const workflow = index.workflows.find((w) => w.id === request.params.id)
      if (!workflow) throw new NotFoundError(`Workflow "${request.params.id}" not found`)

      const groups: Array<{ name: string; files: Array<{ name: string; relativePath: string }> }> = []

      for (const dirPath of workflow.supportingFiles ?? []) {
        if (!fs.existsSync(dirPath) || !fs.statSync(dirPath).isDirectory()) continue
        const dirName = path.basename(dirPath)
        const files = fs.readdirSync(dirPath)
          .filter((f) => !f.startsWith('.'))
          .sort()
          .map((f) => {
            const fullPath = path.join(dirPath, f)
            const bmadIndex = fullPath.lastIndexOf('/_bmad/')
            const relativePath = bmadIndex >= 0 ? fullPath.slice(bmadIndex + 7) : f
            return { name: f, relativePath }
          })
        if (files.length > 0) {
          groups.push({ name: dirName, files })
        }
      }

      return { groups }
    },
  )
}
