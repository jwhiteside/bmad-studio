import fs from 'node:fs'
import path from 'node:path'

import type { FastifyInstance } from 'fastify'

import { writeFile } from '../core/write-service.js'

export async function settingsPlugin(app: FastifyInstance) {
  app.get('/api/settings', async () => {
    if (!('fileStore' in app)) {
      return { port: 4040, theme: 'dark' }
    }

    const settingsPath = path.join(app.fileStore.studioDir, 'settings.json')
    if (fs.existsSync(settingsPath)) {
      try {
        return JSON.parse(fs.readFileSync(settingsPath, 'utf-8'))
      } catch {
        return { port: 4040, theme: 'dark' }
      }
    }

    return { port: 4040, theme: 'dark' }
  })

  app.put('/api/settings', async (request) => {
    if (!('fileStore' in app)) {
      return { ok: true }
    }

    const body = request.body
    if (typeof body !== 'object' || body === null || Array.isArray(body)) {
      return { ok: false, error: 'Invalid request body: expected JSON object' }
    }

    const studioDir = app.fileStore.studioDir
    if (!fs.existsSync(studioDir)) {
      fs.mkdirSync(studioDir, { recursive: true })
    }

    const settingsPath = path.join(studioDir, 'settings.json')

    // Read existing settings (if any) so unknown/hidden fields like `appTitle`
    // are preserved across saves from the Settings UI.
    let existing: Record<string, unknown> = {}
    if (fs.existsSync(settingsPath)) {
      try {
        existing = JSON.parse(fs.readFileSync(settingsPath, 'utf-8')) as Record<string, unknown>
      } catch {
        // Preserve the corrupt file so the user can rescue any hand-edits
        // before we clobber it with the merged result.
        try {
          fs.renameSync(settingsPath, `${settingsPath}.corrupt-${Date.now()}`)
        } catch {
          // best-effort backup; don't block the save
        }
        existing = {}
      }
    }

    const merged = { ...existing, ...(body as Record<string, unknown>) }
    const content = JSON.stringify(merged, null, 2)
    const result = writeFile(settingsPath, content, studioDir)

    if (!result.ok) {
      return { ok: false, error: result.error }
    }

    return { ok: true }
  })

  // GET /api/projects — return global project registry
  app.get('/api/projects', async () => {
    const home = process.env.HOME ?? process.env.USERPROFILE ?? process.cwd()
    const registryPath = path.join(home, '.bmad-studio', 'projects.json')
    if (!fs.existsSync(registryPath)) return []
    try {
      return JSON.parse(fs.readFileSync(registryPath, 'utf-8'))
    } catch {
      return []
    }
  })
}
