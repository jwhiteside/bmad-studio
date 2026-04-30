/**
 * Drift plugin — Story 36.2
 *
 * Exposes:
 *   - `GET /api/drift` — re-scans the project on every call and returns
 *     `{ count, files }`. Broadcasts `drift:detected` / `drift:cleared`
 *     WebSocket events when the count transitions across zero.
 *
 * If `_bmad/_config/files-manifest.csv` is absent, the endpoint returns
 * `{ count: 0, files: [] }` along with a `Warning` response header
 * indicating that drift detection is silently disabled (FR47).
 */

import path from 'node:path'
import fs from 'node:fs'

import type { FastifyInstance } from 'fastify'

import { scanDrift, type DriftedFile } from '../v65/drift-detector.js'

function getProjectRoot(app: FastifyInstance): string | null {
  if (!('fileStore' in app)) return null
  const store = app.fileStore as { projectRoot?: string }
  return store?.projectRoot ?? null
}

function manifestExists(projectRoot: string): boolean {
  return fs.existsSync(path.join(projectRoot, '_bmad', '_config', 'files-manifest.csv'))
}

export async function driftPlugin(app: FastifyInstance) {
  // Most-recent drift state, used to detect transitions for WS broadcasting.
  let lastDriftCount = 0

  app.get('/api/drift', async (_request, reply) => {
    const projectRoot = getProjectRoot(app)
    if (!projectRoot) {
      return { count: 0, files: [] as DriftedFile[] }
    }

    if (!manifestExists(projectRoot)) {
      reply.header(
        'Warning',
        '199 - "files-manifest.csv absent, drift detection disabled"',
      )
      // Reset transition tracking so we don't broadcast a stale "cleared".
      lastDriftCount = 0
      return { count: 0, files: [] as DriftedFile[] }
    }

    const files = await scanDrift(projectRoot)
    const count = files.length

    // Transition broadcasting: only emit on cross-zero changes.
    if (app.ws) {
      if (count > 0 && count !== lastDriftCount) {
        app.ws.broadcast({ type: 'drift:detected', count })
      } else if (count === 0 && lastDriftCount > 0) {
        app.ws.broadcast({ type: 'drift:cleared', skillName: '' })
      }
    }
    lastDriftCount = count

    return { count, files }
  })
}
