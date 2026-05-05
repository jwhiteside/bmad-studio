import fs from 'node:fs'
import path from 'node:path'

import type { FastifyInstance } from 'fastify'

import type { WikiPage, WikiPageListItem, WikiIndex } from '@bmad-studio/shared'
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
    // Skip blank lines immediately after title
    while (i < lines.length && lines[i].trim() === '') i++
    if (i < lines.length) {
      // Collect paragraph (lines until blank line)
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

  // GET /api/wiki — returns WikiIndex
  app.get('/api/wiki', async (): Promise<WikiIndex> => {
    const dir = wikiDir()
    const pages = listPages(dir)
    const categorySet = new Set<string>()
    for (const p of pages) {
      if (p.category) categorySet.add(p.category)
    }
    return { pages, categories: Array.from(categorySet).sort() }
  })

  // GET /api/wiki/:slug — returns WikiPage
  app.get<{ Params: { slug: string } }>('/api/wiki/:slug', async (request): Promise<WikiPage> => {
    const { slug } = request.params
    const filePath = path.join(wikiDir(), `${slug}.md`)
    if (!fs.existsSync(filePath)) {
      throw new NotFoundError(`Wiki page not found: ${slug}`)
    }
    return parsePage(filePath, slug)
  })

  // POST /api/wiki — create a new page
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

  // PUT /api/wiki/:slug — overwrite an existing page
  app.put<{ Params: { slug: string }; Body: { title?: string; body: string } }>(
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

  // DELETE /api/wiki/:slug — delete a page
  app.delete<{ Params: { slug: string } }>('/api/wiki/:slug', async (request): Promise<{ ok: true }> => {
    const { slug } = request.params
    const filePath = path.join(wikiDir(), `${slug}.md`)
    if (!fs.existsSync(filePath)) {
      throw new NotFoundError(`Wiki page not found: ${slug}`)
    }
    fs.unlinkSync(filePath)
    return { ok: true }
  })
}
