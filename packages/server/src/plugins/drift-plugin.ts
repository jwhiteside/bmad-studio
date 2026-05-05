/**
 * E46 Story 46.2 — GET /api/drift endpoint + chokidar-driven WS drift events.
 *
 * On plugin registration:
 *   1. Runs an initial drift scan (if v6.5 project detected).
 *   2. Watches `_bmad/` via chokidar; debounces re-scans on any file change.
 *   3. Broadcasts `drift:detected` or `drift:cleared` on state transitions.
 *
 * `GET /api/drift` returns `{ count, files }` (or `{ count: 0, files: [] }`
 * when files-manifest.csv is absent — silently disabled).
 */

import path from 'node:path'

import { watch } from 'chokidar'
import type { FastifyInstance } from 'fastify'

import type { DriftedFile } from '../v65/drift-detector.js'
import { scanDrift } from '../v65/drift-detector.js'

const DEBOUNCE_MS = 300

// ---------------------------------------------------------------------------
// Plugin
// ---------------------------------------------------------------------------

export async function driftPlugin(app: FastifyInstance) {
  // Requires a file store
  const store = 'fileStore' in app ? app.fileStore : null
  if (!store) return

  const projectRoot = store.projectRoot

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  let currentDrift: DriftedFile[] = []
  let prevCount = 0
  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  // ---------------------------------------------------------------------------
  // Scan + broadcast
  // ---------------------------------------------------------------------------

  function runScan() {
    const result = scanDrift(projectRoot)
    if (result === null) {
      // files-manifest.csv absent — drift detection disabled
      currentDrift = []
      return
    }

    currentDrift = result
    const nextCount = result.length

    if (nextCount > 0 && (prevCount === 0 || nextCount !== prevCount)) {
      app.ws?.broadcast({ type: 'drift:detected', count: nextCount })
    } else if (nextCount === 0 && prevCount > 0) {
      // All drift cleared — we don't have a single skillName for bulk clear, so broadcast count=0
      app.ws?.broadcast({ type: 'drift:detected', count: 0 })
    }

    prevCount = nextCount
  }

  function scheduleRescan() {
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      debounceTimer = null
      runScan()
    }, DEBOUNCE_MS)
  }

  // Initial scan
  runScan()

  // ---------------------------------------------------------------------------
  // Chokidar watcher on the entire _bmad/ directory
  // ---------------------------------------------------------------------------

  const bmadDir = path.join(projectRoot, '_bmad')
  const watcher = watch(bmadDir, {
    ignored: /[/\\]\./,
    persistent: false,
    awaitWriteFinish: { stabilityThreshold: 150 },
  })

  watcher.on('change', scheduleRescan)
  watcher.on('add', scheduleRescan)
  watcher.on('unlink', scheduleRescan)

  // Close watcher on server shutdown
  app.addHook('onClose', async () => {
    if (debounceTimer) clearTimeout(debounceTimer)
    await watcher.close()
  })

  // ---------------------------------------------------------------------------
  // GET /api/drift
  // ---------------------------------------------------------------------------

  app.get('/api/drift', async (_req, reply) => {
    const disabled = scanDrift(projectRoot) === null
    if (disabled) {
      reply.header('Notice', 'files-manifest.csv absent — drift detection disabled')
      return { count: 0, files: [] }
    }
    return {
      count: currentDrift.length,
      files: currentDrift.map((f) => ({
        path: f.relativePath,
        absolutePath: f.absolutePath,
        expectedHash: f.expectedHash,
        actualHash: f.actualHash,
      })),
    }
  })
}
