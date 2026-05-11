import fs from 'node:fs'
import path from 'node:path'

import { watch } from 'chokidar'

import type { FastifyInstance } from 'fastify'
import type { FileCategory } from '@bmad-studio/shared'

import { buildIndex } from '../parsers/index-builder.js'
import type { EntityIndex } from '../parsers/index-builder.js'

const BATCH_DELAY_MS = 100
const SUPPRESSION_TIMEOUT_MS = 5000

function categorizeFile(filePath: string): FileCategory {
  if (filePath.includes('/agents/')) return 'agent'
  if (filePath.includes('/skills/') || filePath.endsWith('SKILL.md')) return 'skill'
  if (filePath.includes('/workflows/') || filePath.includes('/tasks/')) return 'workflow'
  if (filePath.endsWith('config.yaml') || filePath.endsWith('manifest.yaml')) return 'config'
  if (filePath.includes('/ides/') || filePath.includes('/connections/')) return 'connection'
  return 'other'
}

export type FileChangeEvent = {
  type: 'created' | 'modified' | 'deleted'
  path: string
  category: FileCategory
}

export type FileStoreOptions = {
  projectRoot: string
  studioDir: string
  onBatchUpdate?: (events: FileChangeEvent[]) => void
}

export class FileStore {
  private index: EntityIndex
  readonly pendingWrites = new Set<string>()
  private batchedEvents: FileChangeEvent[] = []
  private batchTimer: ReturnType<typeof setTimeout> | null = null
  private watcher: ReturnType<typeof watch> | null = null
  readonly projectRoot: string
  readonly studioDir: string
  private onBatchUpdate?: (events: FileChangeEvent[]) => void

  constructor(options: FileStoreOptions) {
    this.projectRoot = options.projectRoot
    this.studioDir = options.studioDir
    this.onBatchUpdate = options.onBatchUpdate
    this.index = {
      agents: [],
      skills: [],
      workflows: [],
      teams: [],
      configs: [],
      packages: [],
      ideConfigs: [],
      manifests: [],
      errors: [],
    }
  }

  async initialize() {
    const cacheFile = path.join(this.studioDir, 'cache', 'entities.json')

    // Try loading from cache — but only if it was built for this exact projectRoot.
    // A stale cache (different projectRoot, or structure change) causes dead filePaths
    // which silently produce "Could not load step instructions" errors.
    if (fs.existsSync(cacheFile)) {
      try {
        const raw = JSON.parse(fs.readFileSync(cacheFile, 'utf-8')) as EntityIndex & { _projectRoot?: string }
        if (raw._projectRoot === this.projectRoot) {
          const { _projectRoot: _, ...rest } = raw
          this.index = rest as EntityIndex
        } else {
          // Different project root — rebuild from scratch
          this.index = buildIndex(this.projectRoot)
        }
      } catch {
        // Cache corrupt — rebuild
        this.index = buildIndex(this.projectRoot)
      }
    } else {
      this.index = buildIndex(this.projectRoot)
    }

    this.saveCache()
    this.startWatching()
  }

  private saveCache() {
    const cacheDir = path.join(this.studioDir, 'cache')
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true })
    }
    fs.writeFileSync(
      path.join(cacheDir, 'entities.json'),
      JSON.stringify({ _projectRoot: this.projectRoot, ...this.index }, null, 2),
      'utf-8',
    )
  }

  private startWatching() {
    const bmadDir = path.join(this.projectRoot, '_bmad')
    if (!fs.existsSync(bmadDir)) return

    this.watcher = watch(bmadDir, {
      ignored: ['**/node_modules/**', '**/.git/**', '**/.bmad-studio/**', '**/dist/**'],
      persistent: true,
      ignoreInitial: true,
    })

    const handleChange = (eventType: 'created' | 'modified' | 'deleted', filePath: string) => {
      // Feedback loop suppression
      if (this.pendingWrites.has(filePath)) {
        return
      }

      const category = categorizeFile(filePath)
      this.batchedEvents.push({ type: eventType, path: filePath, category })

      if (!this.batchTimer) {
        this.batchTimer = setTimeout(() => {
          this.processBatch()
        }, BATCH_DELAY_MS)
      }
    }

    this.watcher
      .on('add', (p) => handleChange('created', p))
      .on('change', (p) => handleChange('modified', p))
      .on('unlink', (p) => handleChange('deleted', p))
  }

  private processBatch() {
    const events = [...this.batchedEvents]
    this.batchedEvents = []
    this.batchTimer = null

    // Rebuild index (incremental would be better, but full rebuild is simpler and fast enough for v1)
    this.index = buildIndex(this.projectRoot)
    this.saveCache()

    if (this.onBatchUpdate && events.length > 0) {
      this.onBatchUpdate(events)
    }
  }

  markPendingWrite(filePath: string) {
    this.pendingWrites.add(filePath)
    setTimeout(() => {
      this.pendingWrites.delete(filePath)
    }, SUPPRESSION_TIMEOUT_MS)
  }

  clearPendingWrite(filePath: string) {
    this.pendingWrites.delete(filePath)
  }

  getIndex(): EntityIndex {
    return this.index
  }

  rebuild() {
    this.index = buildIndex(this.projectRoot)
    this.saveCache()
  }

  async close() {
    if (this.watcher) {
      await this.watcher.close()
      this.watcher = null
    }
    if (this.batchTimer) {
      clearTimeout(this.batchTimer)
      this.batchTimer = null
    }
  }
}

export type FileStoreHolder = { current: FileStore | null }

export async function createFileStore(app: FastifyInstance, projectRoot: string): Promise<FileStore> {
  const studioDir = path.join(projectRoot, '.bmad-studio')

  const store = new FileStore({
    projectRoot,
    studioDir,
    onBatchUpdate: (events) => {
      app.log.info({ eventCount: events.length }, 'File store batch update')
      if (app.ws) {
        for (const event of events) {
          app.ws.broadcast({
            type: `file:${event.type === 'modified' ? 'changed' : event.type}` as
              | 'file:changed'
              | 'file:created'
              | 'file:deleted',
            path: event.path,
            category: event.category,
          })
        }
      }
    },
  })

  await store.initialize()
  return store
}

export async function registerFileStore(app: FastifyInstance, projectRoot: string) {
  const store = await createFileStore(app, projectRoot)
  const holder: FileStoreHolder = { current: store }

  app.decorate('fileStoreHolder', holder)
  // Backwards-compat getter so 'fileStore' in app and app.fileStore still work
  app.decorate('fileStore', {
    getter(): FileStore {
      if (!holder.current) throw Object.assign(new Error('No project loaded'), { statusCode: 503 })
      return holder.current
    },
  })

  app.addHook('onClose', async () => {
    if (holder.current) {
      await holder.current.close()
      holder.current = null
    }
  })
}

/** Get the active FileStore or throw 503 if unavailable (switching/no project) */
export function getFileStore(app: FastifyInstance): FileStore {
  const store = app.fileStoreHolder?.current
  if (!store) throw Object.assign(new Error('No project loaded'), { statusCode: 503 })
  return store
}

declare module 'fastify' {
  interface FastifyInstance {
    fileStoreHolder: FileStoreHolder
    fileStore: FileStore
  }
}
