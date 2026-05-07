import fs from 'node:fs'
import path from 'node:path'

import type { FastifyInstance } from 'fastify'

import type {
  WikiPage,
  WikiPageListItem,
  WikiIndex,
  WikiImportPreviewItem,
  WikiImportResult,
  WikiCategory,
} from '@bmad-studio/shared'
import { NotFoundError, ValidationError } from '../core/errors.js'
import { atomicWrite } from '../core/atomic-write.js'

// ---------------------------------------------------------------------------
// Slug helpers
// ---------------------------------------------------------------------------

function titleToSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80)
}

function uniqueSlug(dir: string, base: string): string {
  if (!fs.existsSync(path.join(dir, `${base}.md`))) return base
  let n = 2
  while (fs.existsSync(path.join(dir, `${base}-${n}.md`))) n++
  return `${base}-${n}`
}

// ---------------------------------------------------------------------------
// Page parser
// ---------------------------------------------------------------------------

function parsePage(filePath: string, slug: string): WikiPage {
  const body = fs.readFileSync(filePath, 'utf-8')
  const stat = fs.statSync(filePath)
  const lastModified = stat.mtime.toISOString()

  // Extract category from frontmatter
  let category: string | undefined
  const categoryMatch = /^---[\s\S]*?^category:\s*(.+?)\s*$/m.exec(body)
  if (categoryMatch) {
    category = categoryMatch[1].trim()
  }

  // Strip frontmatter for content parsing
  let content = body
  if (body.startsWith('---')) {
    const fmEnd = body.indexOf('\n---', 3)
    if (fmEnd !== -1) {
      content = body.slice(fmEnd + 4).trimStart()
    }
  }

  // Extract title from first # heading
  let title = slug
  let titleLineIndex = -1
  const lines = content.split('\n')
  for (let i = 0; i < lines.length; i++) {
    const m = /^#\s+(.+)$/.exec(lines[i])
    if (m) {
      title = m[1].trim()
      titleLineIndex = i
      break
    }
  }

  // Extract description: first non-empty paragraph after title (< 200 chars)
  let description: string | undefined
  if (titleLineIndex !== -1) {
    let i = titleLineIndex + 1
    while (i < lines.length && lines[i].trim() === '') i++
    if (i < lines.length) {
      const paraLines: string[] = []
      while (i < lines.length && lines[i].trim() !== '') {
        paraLines.push(lines[i])
        i++
      }
      const para = paraLines.join(' ').trim()
      if (para.length > 0 && para.length < 200) {
        description = para
      }
    }
  }

  return { slug, title, description, body, filePath, lastModified, category }
}

function toListItem(page: WikiPage): WikiPageListItem {
  const { body: _body, ...rest } = page
  return rest
}

// ---------------------------------------------------------------------------
// Import helpers
// ---------------------------------------------------------------------------

const BMAD_OUTPUT_SUBDIR = '_bmad-output'

function categorizeArtifact(relPath: string): { category: WikiCategory; skip: boolean } {
  const parts = relPath.split('/')
  const dir = parts[0]
  const name = parts.at(-1)!

  // Only markdown files
  if (!name.endsWith('.md')) return { category: 'Specs', skip: true }

  if (dir === 'brainstorming') return { category: 'Brainstorming', skip: false }
  if (dir === 'docs') return { category: 'Changelogs', skip: false }

  if (dir === 'planning-artifacts') {
    const subdir = parts.length > 2 ? parts[1] : null
    if (subdir === 'research') return { category: 'Research', skip: false }
    if (/^(prd|architecture)/.test(name)) return { category: 'Foundation', skip: false }
    if (name.startsWith('epics')) return { category: 'Planning', skip: false }
    if (name.startsWith('spike-')) return { category: 'Research', skip: false }
    if (name.startsWith('tech-spec-')) return { category: 'Specs', skip: false }
    if (name.startsWith('ux-')) return { category: 'Design', skip: false }
    if (name.startsWith('implementation-readiness-') || name.startsWith('sprint-change-')) {
      return { category: 'Retrospectives', skip: false }
    }
    // generic planning artifact
    return { category: 'Planning', skip: false }
  }

  if (dir === 'implementation-artifacts') {
    // skip non-markdown supplementary files
    if (name.endsWith('.yaml') || name.endsWith('.txt')) return { category: 'Stories', skip: true }
    if (/^\d/.test(name)) return { category: 'Stories', skip: false }
    if (name.includes('retro')) return { category: 'Retrospectives', skip: false }
    if (name.startsWith('tech-spec-')) return { category: 'Specs', skip: false }
    return { category: 'Specs', skip: false }
  }

  return { category: 'Specs', skip: true }
}

function extractTitleFromContent(content: string, fallback: string): string {
  // Strip BMAD frontmatter before looking for heading
  let body = content
  if (content.startsWith('---')) {
    const end = content.indexOf('\n---', 3)
    if (end !== -1) body = content.slice(end + 4).trimStart()
  }
  const m = /^#\s+(.+)$/m.exec(body)
  return m ? m[1].trim() : fallback
}

function cleanFilename(name: string): string {
  return name
    .replace(/\.md$/, '')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function stripBmadFrontmatter(content: string): string {
  if (!content.startsWith('---')) return content
  const end = content.indexOf('\n---', 3)
  if (end === -1) return content
  return content.slice(end + 4).trimStart()
}

function buildImportedSourceSet(wikiDir: string): Set<string> {
  // Find all wiki pages that have a `source:` frontmatter field — these are already imported
  const sources = new Set<string>()
  if (!fs.existsSync(wikiDir)) return sources
  for (const file of fs.readdirSync(wikiDir)) {
    if (!file.endsWith('.md')) continue
    const body = fs.readFileSync(path.join(wikiDir, file), 'utf-8')
    const m = /^---[\s\S]*?^source:\s*(.+?)\s*$/m.exec(body)
    if (m) sources.add(m[1].trim())
  }
  return sources
}

function scanBmadOutput(outputDir: string, importedSources: Set<string>): WikiImportPreviewItem[] {
  const items: WikiImportPreviewItem[] = []

  function walk(dir: string, relBase: string) {
    if (!fs.existsSync(dir)) return
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith('.')) continue
      const entryRel = relBase ? `${relBase}/${entry.name}` : entry.name
      if (entry.isDirectory()) {
        walk(path.join(dir, entry.name), entryRel)
      } else {
        const { category, skip } = categorizeArtifact(entryRel)
        if (skip) continue
        const filePath = path.join(dir, entry.name)
        const content = fs.readFileSync(filePath, 'utf-8')
        const fallback = cleanFilename(entry.name)
        const title = extractTitleFromContent(content, fallback)
        const suggestedSlug = titleToSlug(title) || titleToSlug(fallback) || 'untitled'
        items.push({
          relPath: entryRel,
          title,
          category,
          suggestedSlug,
          alreadyImported: importedSources.has(entryRel),
        })
      }
    }
  }

  walk(outputDir, '')
  return items
}

// ---------------------------------------------------------------------------
// Plugin
// ---------------------------------------------------------------------------

export async function wikiPlugin(app: FastifyInstance) {
  if (!('fileStore' in app)) return

  function wikiDir(): string {
    return path.join(app.fileStore.projectRoot, '_bmad-output', 'wiki')
  }

  function ensureWikiDir(): string {
    const dir = wikiDir()
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    return dir
  }

  function outputDir(): string {
    return path.join(app.fileStore.projectRoot, BMAD_OUTPUT_SUBDIR)
  }

  function listPages(dir: string): WikiPageListItem[] {
    if (!fs.existsSync(dir)) return []
    return fs
      .readdirSync(dir)
      .filter((f) => f.endsWith('.md'))
      .sort()
      .map((f) => {
        const slug = f.slice(0, -3)
        const filePath = path.join(dir, f)
        return toListItem(parsePage(filePath, slug))
      })
  }

  // GET /api/wiki
  app.get('/api/wiki', async (): Promise<WikiIndex> => {
    const dir = wikiDir()
    const pages = listPages(dir)
    const categorySet = new Set<string>()
    for (const p of pages) {
      if (p.category) categorySet.add(p.category)
    }
    return { pages, categories: Array.from(categorySet).sort() }
  })

  // GET /api/wiki/:slug
  app.get<{ Params: { slug: string } }>('/api/wiki/:slug', async (request): Promise<WikiPage> => {
    const { slug } = request.params
    const filePath = path.join(wikiDir(), `${slug}.md`)
    if (!fs.existsSync(filePath)) {
      throw new NotFoundError(`Wiki page not found: ${slug}`)
    }
    return parsePage(filePath, slug)
  })

  // POST /api/wiki
  app.post<{ Body: { title: string; body?: string } }>('/api/wiki', async (request): Promise<WikiPage> => {
    const { title, body } = request.body ?? {}
    if (typeof title !== 'string' || title.trim() === '') {
      throw new ValidationError('title is required')
    }

    const dir = ensureWikiDir()
    const base = titleToSlug(title.trim()) || 'untitled'
    const slug = uniqueSlug(dir, base)
    const filePath = path.join(dir, `${slug}.md`)

    const content = body ?? `# ${title}\n`
    await atomicWrite(filePath, content)

    return parsePage(filePath, slug)
  })

  // PUT /api/wiki/:slug
  app.put<{ Params: { slug: string }; Body: { body: string } }>(
    '/api/wiki/:slug',
    async (request): Promise<WikiPage> => {
      const { slug } = request.params
      const { body } = request.body ?? {}
      if (typeof body !== 'string') {
        throw new ValidationError('body must be a string')
      }

      const dir = ensureWikiDir()
      const filePath = path.join(dir, `${slug}.md`)
      if (!fs.existsSync(filePath)) {
        throw new NotFoundError(`Wiki page not found: ${slug}`)
      }

      await atomicWrite(filePath, body)
      return parsePage(filePath, slug)
    },
  )

  // DELETE /api/wiki/:slug
  app.delete<{ Params: { slug: string } }>('/api/wiki/:slug', async (request): Promise<{ ok: true }> => {
    const { slug } = request.params
    const filePath = path.join(wikiDir(), `${slug}.md`)
    if (!fs.existsSync(filePath)) {
      throw new NotFoundError(`Wiki page not found: ${slug}`)
    }
    fs.unlinkSync(filePath)
    return { ok: true }
  })

  // ---------------------------------------------------------------------------
  // Import routes
  // ---------------------------------------------------------------------------

  // GET /api/wiki/import/preview — scan _bmad-output and return candidate files
  app.get('/api/wiki/import/preview', async (): Promise<{ items: WikiImportPreviewItem[] }> => {
    const dir = ensureWikiDir()
    const importedSources = buildImportedSourceSet(dir)
    const items = scanBmadOutput(outputDir(), importedSources)
    // Sort: Foundation first, then by category alpha, then by relPath
    const ORDER: Record<string, number> = {
      Foundation: 0, Planning: 1, Research: 2, Design: 3,
      Specs: 4, Stories: 5, Retrospectives: 6, Brainstorming: 7, Changelogs: 8,
    }
    items.sort((a, b) => {
      const oa = ORDER[a.category] ?? 99
      const ob = ORDER[b.category] ?? 99
      if (oa !== ob) return oa - ob
      return a.relPath.localeCompare(b.relPath)
    })
    return { items }
  })

  // POST /api/wiki/import — import selected files by relPath
  app.post<{ Body: { relPaths: string[] } }>(
    '/api/wiki/import',
    async (request): Promise<WikiImportResult> => {
      const { relPaths } = request.body ?? {}
      if (!Array.isArray(relPaths) || relPaths.length === 0) {
        throw new ValidationError('relPaths must be a non-empty array')
      }

      const dir = ensureWikiDir()
      const importedSources = buildImportedSourceSet(dir)
      const pages: WikiPageListItem[] = []
      let imported = 0
      let skipped = 0

      for (const relPath of relPaths) {
        // Skip already imported
        if (importedSources.has(relPath)) {
          skipped++
          continue
        }

        const { category, skip } = categorizeArtifact(relPath)
        if (skip) {
          skipped++
          continue
        }

        const srcPath = path.join(outputDir(), relPath)
        if (!fs.existsSync(srcPath)) {
          skipped++
          continue
        }

        const rawContent = fs.readFileSync(srcPath, 'utf-8')
        const fallback = cleanFilename(path.basename(relPath))
        const title = extractTitleFromContent(rawContent, fallback)
        const strippedBody = stripBmadFrontmatter(rawContent)

        // Build wiki page body with metadata frontmatter
        const wikiBody = `---\ncategory: ${category}\nsource: ${relPath}\n---\n\n${strippedBody}`

        const base = titleToSlug(title) || titleToSlug(fallback) || 'untitled'
        const slug = uniqueSlug(dir, base)
        const filePath = path.join(dir, `${slug}.md`)

        await atomicWrite(filePath, wikiBody)
        pages.push(toListItem(parsePage(filePath, slug)))
        importedSources.add(relPath)
        imported++
      }

      return { imported, skipped, pages }
    },
  )
}
