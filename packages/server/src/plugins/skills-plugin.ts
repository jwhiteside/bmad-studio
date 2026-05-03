import fs from 'node:fs'
import path from 'node:path'

import { parse as parseToml } from 'smol-toml'
import type { FastifyInstance } from 'fastify'
import type { Skill, SkillListItem } from '@bmad-studio/shared'

import { NotFoundError, ValidationError, AppError } from '../core/errors.js'
import { writeFile } from '../core/write-service.js'
import { resolveSkillCustomization } from '../v65/customize-resolver.js'
import { atomicWrite } from '../core/atomic-write.js'
import { verifyMerge, probePython } from '../v65/python-bridge.js'

function deriveProjectRoot(skillFilePath: string): string {
  const parts = skillFilePath.split('/_bmad/')
  if (parts.length >= 2) {
    return parts[0]
  }
  let dir = path.dirname(skillFilePath)
  while (true) {
    const parent = path.dirname(dir)
    if (parent === dir) break
    const bmadCandidate = path.join(parent, '_bmad')
    if (fs.existsSync(bmadCandidate) && fs.statSync(bmadCandidate).isDirectory()) {
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

  // Write customize layer (team or user TOML override)
  app.put<{ Params: { id: string }; Body: { layer: 'team' | 'user'; toml: string } }>(
    '/api/skills/:id/customize',
    async (request) => {
      if (!('fileStore' in app)) throw new NotFoundError('File store not available')

      // 1. Find skill by id
      const index = app.fileStore.getIndex()
      const skill = index.skills.find((s) => s.id === request.params.id)
      if (!skill) throw new NotFoundError(`Skill "${request.params.id}" not found`)

      const { layer, toml } = request.body as { layer: 'team' | 'user'; toml: string }

      // 2. Validate TOML — parse error → 400
      try {
        parseToml(toml)
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        throw new AppError('CUSTOMIZE_PARSE_ERROR', msg, 400, 'error', { skillId: skill.id, layer })
      }

      // 3. Derive project root
      const projectRoot = deriveProjectRoot(skill.filePath)

      // 4. Determine write path based on layer
      const fileName = layer === 'user' ? `${skill.id}.user.toml` : `${skill.id}.toml`
      const writePath = path.join(projectRoot, '_bmad', 'custom', fileName)

      // 5. Security check — path must stay within _bmad/custom/
      const resolvedWrite = path.resolve(writePath)
      const resolvedCustomDir = path.resolve(projectRoot) + '/_bmad/custom/'
      if (!resolvedWrite.startsWith(resolvedCustomDir)) {
        throw new ValidationError(`Write path "${writePath}" is outside allowed directory`)
      }

      // 6. Ensure directory exists
      await fs.promises.mkdir(path.dirname(writePath), { recursive: true })

      // 7. Write atomically
      await atomicWrite(writePath, toml)

      // 8. Broadcast WS event
      if (app.ws) {
        app.ws.broadcast({ type: 'customize:changed', skillId: request.params.id, layer })
      }

      // 9. Return ok
      return { ok: true }
    },
  )

  // Verify customize merge (Python bridge)
  app.post<{ Params: { id: string }; Body: { key: 'agent' | 'workflow' } }>(
    '/api/skills/:id/customize/verify',
    async (request) => {
      if (!('fileStore' in app)) throw new NotFoundError('File store not available')

      // 1. Find skill by id
      const index = app.fileStore.getIndex()
      const skill = index.skills.find((s) => s.id === request.params.id)
      if (!skill) throw new NotFoundError(`Skill "${request.params.id}" not found`)

      const { key } = request.body as { key: 'agent' | 'workflow' }

      // 2. Derive roots
      const projectRoot = deriveProjectRoot(skill.filePath)
      const skillRoot = path.dirname(skill.filePath)

      // 3. Determine Python availability (respect app-level flag if set, otherwise probe)
      const pythonAvail =
        'pythonResolverAvailable' in app
          ? (app as { pythonResolverAvailable: boolean }).pythonResolverAvailable
          : probePython().available

      // 4. Call verifyMerge — always return 200 with its verdict
      const result = await verifyMerge(skillRoot, projectRoot, key, { pythonAvailable: pythonAvail })

      return result
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
