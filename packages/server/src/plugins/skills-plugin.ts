import fs from 'node:fs'

import type { FastifyInstance } from 'fastify'
import type { Skill, SkillListItem, CompiledSkillItem } from '@bmad-studio/shared'

import { NotFoundError, ValidationError } from '../core/errors.js'
import { writeFile } from '../core/write-service.js'

function skillToListItem(skill: Skill): SkillListItem {
  return {
    id: skill.id,
    name: skill.name,
    description: skill.description,
    module: skill.module,
    bestFor: skill.bestFor,
  }
}

export async function skillsPlugin(app: FastifyInstance) {
  app.get('/api/skills', async () => {
    if (!('fileStore' in app)) return []
    const index = app.fileStore.getIndex()
    return index.skills.map(skillToListItem)
  })

  app.get('/api/skills/compiled', async (): Promise<CompiledSkillItem[]> => {
    if (!('fileStore' in app)) return []
    const index = app.fileStore.getIndex()
    const agents: CompiledSkillItem[] = index.agents
      .filter((a) => a.name || a.title)
      .map((a) => ({
        id: a.id,
        name: a.name || a.title,
        description: a.role ?? '',
        module: a.module,
        type: 'agent' as const,
      }))
    const workflows: CompiledSkillItem[] = index.workflows.map((w) => ({
      id: w.id,
      name: w.name,
      description: w.description,
      module: w.module,
      type: 'workflow' as const,
    }))
    return [...agents, ...workflows]
  })

  app.get<{ Params: { id: string } }>('/api/skills/:id', async (request) => {
    if (!('fileStore' in app)) throw new NotFoundError('File store not available')
    const index = app.fileStore.getIndex()
    const skill = index.skills.find((s) => s.id === request.params.id)
    if (!skill) throw new NotFoundError(`Skill "${request.params.id}" not found`)
    return skill
  })

  // Update skill content
  app.put<{ Params: { id: string }; Body: { content: string } }>(
    '/api/skills/:id',
    async (request) => {
      if (!('fileStore' in app)) throw new NotFoundError('File store not available')

      const index = app.fileStore.getIndex()
      const skill = index.skills.find((s) => s.id === request.params.id)
      if (!skill) throw new NotFoundError(`Skill "${request.params.id}" not found`)

      const { content } = request.body as { content: string }
      if (typeof content !== 'string') {
        throw new ValidationError('Content must be a string')
      }

      if (!fs.existsSync(skill.filePath)) {
        throw new NotFoundError(`Skill file not found: ${skill.filePath}`)
      }

      app.fileStore.markPendingWrite(skill.filePath)
      const result = writeFile(skill.filePath, content, app.fileStore.studioDir)
      app.fileStore.clearPendingWrite(skill.filePath)

      if (!result.ok) {
        throw new ValidationError(result.error)
      }

      return { ok: true, filePath: result.filePath }
    },
  )

  // Delete skill
  app.delete<{ Params: { id: string } }>('/api/skills/:id', async (request) => {
    if (!('fileStore' in app)) throw new NotFoundError('File store not available')

    const index = app.fileStore.getIndex()
    const skill = index.skills.find((s) => s.id === request.params.id)
    if (!skill) throw new NotFoundError(`Skill "${request.params.id}" not found`)

    if (!fs.existsSync(skill.filePath)) {
      throw new NotFoundError(`Skill file not found: ${skill.filePath}`)
    }

    // Snapshot before delete
    const content = fs.readFileSync(skill.filePath, 'utf-8')
    writeFile(skill.filePath, content, app.fileStore.studioDir) // creates snapshot

    app.fileStore.markPendingWrite(skill.filePath)
    fs.unlinkSync(skill.filePath)
    app.fileStore.clearPendingWrite(skill.filePath)

    return { ok: true, deleted: skill.id }
  })
}
