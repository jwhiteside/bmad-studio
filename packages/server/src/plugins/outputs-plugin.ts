import fs from 'node:fs'
import path from 'node:path'

import yaml from 'js-yaml'
import type { FastifyInstance } from 'fastify'
import type { Output } from '@bmad-studio/shared'

import { NotFoundError, ValidationError } from '../core/errors.js'
import { writeFile } from '../core/write-service.js'

type OutputCategory = 'brainstorming' | 'planning' | 'implementation' | 'other'

function categoriseOutput(relPath: string): OutputCategory {
  if (relPath.startsWith('brainstorming/')) return 'brainstorming'
  if (relPath.startsWith('planning-artifacts/')) return 'planning'
  if (relPath.startsWith('implementation-artifacts/')) return 'implementation'
  return 'other'
}

function parseSprintStatus(sprintStatusPath: string) {
  if (!fs.existsSync(sprintStatusPath)) return null
  try {
    const raw = fs.readFileSync(sprintStatusPath, 'utf-8')
    // Strip lines starting with # (YAML comments) to avoid parse errors
    const cleaned = raw.split('\n').filter((l) => !l.trimStart().startsWith('#')).join('\n')
    const doc = yaml.load(cleaned) as Record<string, unknown>

    const devStatus = doc?.development_status as Record<string, string> | undefined
    if (!devStatus) return null

    const lastUpdated = (doc?.last_updated as string | undefined) ?? null

    // Active epics: `epic-N` keys with status 'in-progress'
    const activeEpics = Object.entries(devStatus)
      .filter(([k, v]) => /^epic-\d+$/.test(k) && v === 'in-progress')
      .map(([k]) => k)

    const storyCounts = { inProgress: 0, review: 0, done: 0, backlog: 0, readyForDev: 0, total: 0 }
    const inProgressStories: string[] = []
    const reviewStories: string[] = []

    for (const epic of activeEpics) {
      const epicNum = epic.replace('epic-', '')
      for (const [key, status] of Object.entries(devStatus)) {
        // Story keys match `<epicNum>-<digit>` prefix, exclude the epic key itself and retrospectives
        if (!key.startsWith(`${epicNum}-`) || key.includes('retrospective')) continue
        storyCounts.total++
        if (status === 'in-progress') { storyCounts.inProgress++; inProgressStories.push(key) }
        else if (status === 'review') { storyCounts.review++; reviewStories.push(key) }
        else if (status === 'done') storyCounts.done++
        else if (status === 'backlog') storyCounts.backlog++
        else if (status === 'ready-for-dev') storyCounts.readyForDev++
      }
    }

    return { lastUpdated, activeEpics, storyCounts, inProgressStories, reviewStories }
  } catch {
    return null
  }
}

function summariseOutputDir(outputDir: string) {
  if (!fs.existsSync(outputDir)) {
    return { counts: { brainstorming: 0, planning: 0, implementation: 0, other: 0, total: 0 }, recent: [] as Array<{ category: OutputCategory; name: string; path: string; modifiedAt: string }> }
  }

  const counts = { brainstorming: 0, planning: 0, implementation: 0, other: 0, total: 0 }
  const recent: Array<{ category: OutputCategory; name: string; path: string; modifiedAt: string }> = []

  const entries = fs.readdirSync(outputDir, { withFileTypes: true, recursive: true })
  for (const entry of entries) {
    if (!entry.isFile() || entry.name.startsWith('.')) continue
    const fullPath = path.join(entry.parentPath ?? outputDir, entry.name)
    const relPath = path.relative(outputDir, fullPath)
    const cat = categoriseOutput(relPath)
    const stats = fs.statSync(fullPath)
    counts[cat]++
    counts.total++
    recent.push({ category: cat, name: entry.name, path: relPath, modifiedAt: stats.mtime.toISOString() })
  }

  // Return 5 most recently modified
  recent.sort((a, b) => new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime())

  return { counts, recent: recent.slice(0, 5) }
}

function scanOutputs(outputDir: string): Output[] {
  if (!fs.existsSync(outputDir)) return []

  const outputs: Output[] = []
  const entries = fs.readdirSync(outputDir, { withFileTypes: true, recursive: true })

  for (const entry of entries) {
    if (entry.isFile() && !entry.name.startsWith('.')) {
      const fullPath = path.join(entry.parentPath ?? outputDir, entry.name)
      const stats = fs.statSync(fullPath)
      const relPath = path.relative(outputDir, fullPath)
      outputs.push({
        path: relPath,
        name: entry.name,
        type: path.extname(entry.name).slice(1),
        size: stats.size,
        modifiedAt: stats.mtime.toISOString(),
      })
    }
  }

  return outputs
}

export async function outputsPlugin(app: FastifyInstance) {
  app.get('/api/project-health', async () => {
    if (!('fileStore' in app)) return { sprint: null, recentOutputs: [], outputCounts: { brainstorming: 0, planning: 0, implementation: 0, other: 0, total: 0 } }
    const projectRoot = app.fileStore.projectRoot
    const outputDir = path.join(projectRoot, '_bmad-output')
    const sprintStatusPath = path.join(outputDir, 'implementation-artifacts', 'sprint-status.yaml')
    const sprint = parseSprintStatus(sprintStatusPath)
    const { counts, recent } = summariseOutputDir(outputDir)
    return { sprint, recentOutputs: recent, outputCounts: counts }
  })

  app.get('/api/outputs', async () => {
    if (!('fileStore' in app)) return []
    const projectRoot = app.fileStore.projectRoot
    const outputDir = path.join(projectRoot, '_bmad-output')
    return scanOutputs(outputDir)
  })

  app.get<{ Params: { '*': string } }>('/api/outputs/*', async (request) => {
    if (!('fileStore' in app)) throw new NotFoundError('File store not available')
    const projectRoot = app.fileStore.projectRoot
    const filePath = path.join(projectRoot, '_bmad-output', request.params['*'])

    // Path traversal protection
    const outputRoot = path.join(projectRoot, '_bmad-output')
    const resolved = path.resolve(filePath)
    if (!resolved.startsWith(path.resolve(outputRoot))) {
      throw new ValidationError('Path traversal not allowed')
    }

    if (!fs.existsSync(filePath)) {
      throw new NotFoundError(`Output file not found: ${request.params['*']}`)
    }

    return { content: fs.readFileSync(filePath, 'utf-8'), path: request.params['*'] }
  })

  // Write output file
  app.put<{ Params: { '*': string }; Body: { content: string } }>(
    '/api/outputs/*',
    async (request) => {
      if (!('fileStore' in app)) throw new NotFoundError('File store not available')

      const projectRoot = app.fileStore.projectRoot
      const filePath = path.join(projectRoot, '_bmad-output', request.params['*'])

      // Path traversal protection
      const outputRoot = path.join(projectRoot, '_bmad-output')
      const resolved = path.resolve(filePath)
      if (!resolved.startsWith(path.resolve(outputRoot))) {
        throw new ValidationError('Path traversal not allowed')
      }

      const { content } = request.body as { content: string }
      if (typeof content !== 'string') {
        throw new ValidationError('Content must be a string')
      }

      app.fileStore.markPendingWrite(resolved)
      const result = writeFile(resolved, content, app.fileStore.studioDir)
      app.fileStore.clearPendingWrite(resolved)

      if (!result.ok) {
        throw new ValidationError(result.error)
      }

      return { ok: true, filePath: result.filePath }
    },
  )
}
