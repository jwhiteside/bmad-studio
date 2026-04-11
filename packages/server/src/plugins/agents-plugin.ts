import fs from 'node:fs'
import path from 'node:path'

import type { FastifyInstance } from 'fastify'
import type { Agent, AgentListItem } from '@bmad-studio/shared'

import { NotFoundError, ValidationError } from '../core/errors.js'
import { writeFile } from '../core/write-service.js'

function agentToListItem(agent: Agent): AgentListItem {
  return {
    id: agent.id,
    name: agent.name,
    title: agent.title,
    icon: agent.icon,
    role: agent.role,
    module: agent.module,
    communicationStyle: agent.communicationStyle,
    skillCount: agent.skills.length,
    hasOverrides:
      agent.customizations !== undefined && Object.keys(agent.customizations).length > 0,
  }
}

export async function agentsPlugin(app: FastifyInstance) {
  app.get('/api/agents', async () => {
    if (!('fileStore' in app)) return []
    const index = app.fileStore.getIndex()
    return index.agents
      .filter((a) => a.name || a.title)
      .map(agentToListItem)
  })

  app.get<{ Params: { id: string } }>('/api/agents/:id', async (request) => {
    if (!('fileStore' in app)) {
      throw new NotFoundError('File store not available')
    }
    const index = app.fileStore.getIndex()
    const agent = index.agents.find((a) => a.id === request.params.id)
    if (!agent) {
      throw new NotFoundError(`Agent "${request.params.id}" not found`)
    }
    return agent
  })

  // Update agent file content directly (for custom agents)
  app.put<{ Params: { id: string }; Body: { content: string } }>(
    '/api/agents/:id',
    async (request) => {
      if (!('fileStore' in app)) {
        throw new NotFoundError('File store not available')
      }

      const index = app.fileStore.getIndex()
      const agent = index.agents.find((a) => a.id === request.params.id)
      if (!agent) {
        throw new NotFoundError(`Agent "${request.params.id}" not found`)
      }

      const { content } = request.body as { content: string }
      if (typeof content !== 'string') {
        throw new ValidationError('Content must be a string')
      }

      if (!fs.existsSync(agent.filePath)) {
        throw new NotFoundError(`Agent file not found: ${agent.filePath}`)
      }

      app.fileStore.markPendingWrite(agent.filePath)
      const result = writeFile(agent.filePath, content, app.fileStore.studioDir)
      app.fileStore.clearPendingWrite(agent.filePath)

      if (!result.ok) {
        throw new ValidationError(result.error)
      }

      return { ok: true, filePath: result.filePath }
    },
  )

  // Write agent override file
  app.put<{ Params: { id: string }; Body: { content: string } }>(
    '/api/agents/:id/override',
    async (request) => {
      if (!('fileStore' in app)) {
        throw new NotFoundError('File store not available')
      }

      const index = app.fileStore.getIndex()
      const agent = index.agents.find((a) => a.id === request.params.id)
      if (!agent) {
        throw new NotFoundError(`Agent "${request.params.id}" not found`)
      }

      const { content } = request.body as { content: string }
      if (typeof content !== 'string') {
        throw new ValidationError('Content must be a string')
      }

      const overridePath = path.join(
        app.fileStore.projectRoot,
        '_bmad',
        '_config',
        'agents',
        `${agent.id}.customize.yaml`,
      )

      app.fileStore.markPendingWrite(overridePath)
      const result = writeFile(overridePath, content, app.fileStore.studioDir)
      app.fileStore.clearPendingWrite(overridePath)

      if (!result.ok) {
        throw new ValidationError(result.error)
      }

      return { ok: true, filePath: result.filePath }
    },
  )

  // Update agent skills
  app.put<{ Params: { id: string }; Body: { skills: string[] } }>(
    '/api/agents/:id/skills',
    async (request) => {
      if (!('fileStore' in app)) {
        throw new NotFoundError('File store not available')
      }

      const index = app.fileStore.getIndex()
      const agent = index.agents.find((a) => a.id === request.params.id)
      if (!agent) {
        throw new NotFoundError(`Agent "${request.params.id}" not found`)
      }

      const { skills } = request.body as { skills: string[] }
      if (!Array.isArray(skills)) {
        throw new ValidationError('Skills must be an array')
      }

      // Read the agent source file
      if (!fs.existsSync(agent.filePath)) {
        throw new NotFoundError(`Agent file not found: ${agent.filePath}`)
      }

      let source = fs.readFileSync(agent.filePath, 'utf-8')

      // Replace the skills section in the markdown
      // Look for a skills list pattern and replace it
      const skillsYaml = skills.map((s) => `  - ${s}`).join('\n')
      const skillsPattern = /^(skills:\s*\n)((?:\s+-\s+.+\n)*)/m
      if (skillsPattern.test(source)) {
        source = source.replace(skillsPattern, `$1${skillsYaml ? skillsYaml + '\n' : ''}`)
      } else {
        // No skills: block in frontmatter — insert before the closing ---
        const closingFm = source.indexOf('\n---')
        if (closingFm !== -1) {
          const block = skillsYaml ? `\nskills:\n${skillsYaml}` : `\nskills:`
          source = source.slice(0, closingFm) + block + source.slice(closingFm)
        }
      }

      app.fileStore.markPendingWrite(agent.filePath)
      const result = writeFile(agent.filePath, source, app.fileStore.studioDir)
      app.fileStore.clearPendingWrite(agent.filePath)

      if (!result.ok) {
        throw new ValidationError(result.error)
      }

      return { ok: true, skills }
    },
  )
}
