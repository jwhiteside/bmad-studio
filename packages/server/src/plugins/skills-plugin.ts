import fs from 'node:fs'
import path from 'node:path'

import type { FastifyInstance } from 'fastify'
import type { Skill, SkillListItem } from '@bmad-studio/shared'

import { NotFoundError, ValidationError } from '../core/errors.js'
import { writeFile } from '../core/write-service.js'
import { resolveSkillCustomization } from '../v65/customize-resolver.js'

/**
 * Derive the project root from a skill's filePath by finding the first segment
 * whose parent is `_bmad`. E.g.:
 *   /home/user/project/_bmad/core/skills/bmad-agent-pm/SKILL.md
 *   → /home/user/project
 */
function deriveProjectRoot(skillFilePath: string): string {
  const parts = skillFilePath.split('/_bmad/')
  if (parts.length >= 2) {
    return parts[0]
  }
  // Fallback: walk up until we find _bmad as a direct child
  let dir = path.dirname(skillFilePath)
  while (true) {
    const parent = path.dirname(dir)
    if (parent === dir) break // reached filesystem root
    const bmadCandidate = path.join(parent, '_bmad')
    if (fs.existsSync(bmadCandidate) && fs.statSync(bmadCandidate).isDirectory()) {
      // Check that dir is actually inside _bmad
      const relative = path.relative(bmadCandidate, dir)
      if (!relative.startsWith('..')) {
        return parent
      }
    }
    dir = parent
  }
  return path.dirname(skillFilePath)
}

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

  // Read layered customize.toml for a skill
  app.get<{ Params: { id: string } }>('/api/skills/:id/customize', async (request) => {
    if (!('fileStore' in app)) throw new NotFoundError('File store not available')

    const index = app.fileStore.getIndex()
    const skill = index.skills.find((s) => s.id === request.params.id)
    if (!skill) throw new NotFoundError(`Skill "${request.params.id}" not found`)

    const skillPath = path.dirname(skill.filePath)
    const skillName = path.basename(skillPath)
    const projectRoot = deriveProjectRoot(skill.filePath)

    const basePath = path.join(skillPath, 'customize.toml')
    if (!fs.existsSync(basePath)) {
      throw new NotFoundError(
        `Skill "${request.params.id}" has no customize.toml — not customizable`,
      )
    }

    // Read raw TOML strings for each layer
    const base = fs.readFileSync(basePath, 'utf-8')

    const teamPath = path.join(projectRoot, '_bmad', 'custom', `${skillName}.toml`)
    const team = fs.existsSync(teamPath) ? fs.readFileSync(teamPath, 'utf-8') : null

    const userPath = path.join(projectRoot, '_bmad', 'custom', `${skillName}.user.toml`)
    const user = fs.existsSync(userPath) ? fs.readFileSync(userPath, 'utf-8') : null

    // Resolve merged + provenance via resolveSkillCustomization.
    // ManifestParseError (422) propagates naturally if a layer contains invalid TOML.
    const resolved = resolveSkillCustomization(skillPath, projectRoot, { provenance: true })
    const { merged, provenance } = resolved

    return { base, team, user, merged, provenance }
  })
}
