import fs from 'node:fs'
import path from 'node:path'

import type { FastifyInstance } from 'fastify'
import type { WorkflowListItem } from '@bmad-studio/shared'

import { NotFoundError, ValidationError } from '../core/errors.js'
import { writeFile } from '../core/write-service.js'

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
