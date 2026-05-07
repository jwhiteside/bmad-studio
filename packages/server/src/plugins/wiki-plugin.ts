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
import { WIKI_CATEGORIES, WIKI_RESERVED_SLUGS } from '@bmad-studio/shared'
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

function parseFrontmatter(body: string): Record<string, string> {
  const result: Record<string, string> = {}
  if (!body.startsWith('---')) return result
  const end = body.indexOf('\n---', 3)
  if (end === -1) return result
  const block = body.slice(4, end)
  for (const line of block.split('\n')) {
    const colon = line.indexOf(':')
    if (colon === -1) continue
    const key = line.slice(0, colon).trim()
    const val = line.slice(colon + 1).trim()
    if (key && val) result[key] = val
  }
  return result
}

function parseTags(raw: string): string[] {
  // Handle both inline "foo, bar" and YAML array bracket "[foo, bar]" forms
  const cleaned = raw.replace(/^\[|\]$/g, '').trim()
  if (!cleaned) return []
  return cleaned
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
}

function parsePage(filePath: string, slug: string): WikiPage {
  const body = fs.readFileSync(filePath, 'utf-8')
  const stat = fs.statSync(filePath)
  const lastModified = stat.mtime.toISOString()

  const fm = parseFrontmatter(body)

  const category = fm['category']
  const status = fm['status']
  const entity_type = fm['entity_type']
  const last_reviewed = fm['last_reviewed']
  const tags = fm['tags'] ? parseTags(fm['tags']) : undefined

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

  return { slug, title, description, body, filePath, lastModified, category, status, tags, entity_type, last_reviewed }
}

function toListItem(page: WikiPage): WikiPageListItem {
  const { body: _body, ...rest } = page
  return rest
}

// ---------------------------------------------------------------------------
// Reserved slug guard
// ---------------------------------------------------------------------------

function isReservedSlug(slug: string): boolean {
  return (WIKI_RESERVED_SLUGS as readonly string[]).includes(slug)
}

// ---------------------------------------------------------------------------
// Category templates
// ---------------------------------------------------------------------------

const CATEGORY_TEMPLATES: Partial<Record<WikiCategory, string>> = {
  Foundation: `---
category: Foundation
status: current
entity_type: reference
---

# {{title}}

## Purpose

## Key Decisions

## Scope
`,
  Planning: `---
category: Planning
status: draft
entity_type: reference
---

# {{title}}

## Goal

## Epics / Stories

## Open Questions
`,
  Research: `---
category: Research
status: current
entity_type: reference
---

# {{title}}

## Question / Hypothesis

## Findings

## Decision
`,
  Design: `---
category: Design
status: draft
entity_type: reference
---

# {{title}}

## Problem

## Approach

## Components
`,
  Specs: `---
category: Specs
status: current
entity_type: reference
---

# {{title}}

## Overview

## API / Interface

## Implementation Notes
`,
  Stories: `---
category: Stories
status: current
entity_type: log
---

# {{title}}

## Implemented

## Decisions Made

## Learnings
`,
  Retrospectives: `---
category: Retrospectives
status: current
entity_type: log
---

# {{title}}

## What Went Well

## What Didn't

## Actions
`,
  Brainstorming: `---
category: Brainstorming
status: draft
entity_type: log
---

# {{title}}

## Ideas

## Themes
`,
  Changelogs: `---
category: Changelogs
status: current
entity_type: log
---

# {{title}}

## Changes

## Impact
`,
}

function buildPageBody(title: string, category?: string): string {
  if (category && category in CATEGORY_TEMPLATES) {
    const template = CATEGORY_TEMPLATES[category as WikiCategory]!
    return template.replace('{{title}}', title)
  }
  return `# ${title}\n`
}

// ---------------------------------------------------------------------------
// Index generation
// ---------------------------------------------------------------------------

async function generateIndex(dir: string): Promise<void> {
  const pages = listPages(dir)
  const grouped = new Map<string, WikiPageListItem[]>()

  for (const cat of WIKI_CATEGORIES) {
    const items = pages.filter((p) => p.category === cat)
    if (items.length > 0) grouped.set(cat, items)
  }
  // Unknown / no category
  const uncategorised = pages.filter((p) => !p.category || !WIKI_CATEGORIES.includes(p.category as WikiCategory))
  if (uncategorised.length > 0) grouped.set('Uncategorised', uncategorised)

  const timestamp = new Date().toISOString()
  const lines: string[] = [
    '---',
    'title: Wiki Index',
    `generated: ${timestamp}`,
    '---',
    '',
    '# Wiki Index',
    '',
    '_Auto-generated. Do not edit directly — regenerate via Studio._',
    '',
  ]

  for (const [cat, items] of grouped) {
    lines.push(`## ${cat}`, '')
    for (const p of items) {
      const desc = p.description ? ` — ${p.description}` : ''
      lines.push(`- [${p.title}](./${p.slug}.md)${desc}`)
    }
    lines.push('')
  }

  await atomicWrite(path.join(dir, 'index.md'), lines.join('\n'))
}

// ---------------------------------------------------------------------------
// CLAUDE.md generation
// ---------------------------------------------------------------------------

async function generateClaudeMd(dir: string): Promise<string> {
  const filePath = path.join(dir, 'CLAUDE.md')
  const timestamp = new Date().toISOString()

  const content = `---
title: Wiki Schema — LLM Maintenance Instructions
generated: ${timestamp}
---

# LLM Wiki — Schema & Maintenance Instructions

This file defines the schema, conventions, and maintenance procedures for this wiki.
An LLM agent reading this file can ingest sources, create pages, cross-reference entities,
and keep the index current.

## Frontmatter Schema

Every wiki page must begin with YAML frontmatter:

\`\`\`yaml
---
category: <required — one of: ${WIKI_CATEGORIES.join(' | ')}>
status: <draft | current | archived>
entity_type: <concept | decision | reference | log>
tags: [optional, list, of, tags]
last_reviewed: <YYYY-MM-DD>
source: <optional — relative path in _bmad-output/ if this page was imported>
---
\`\`\`

## Category Taxonomy

| Category | Purpose | Typical entity_type |
|---|---|---|
| Foundation | PRD, Architecture — timeless reference docs | reference |
| Planning | Epics, roadmaps, and backlog planning | reference |
| Research | Spikes, investigations, and technical research | reference |
| Design | UX specs and design directions | reference |
| Specs | Per-feature tech specs and implementation notes | reference |
| Stories | Per-story implementation artifacts | log |
| Retrospectives | Retros, readiness reports, and change proposals | log |
| Brainstorming | Brainstorming sessions and free-form notes | log |
| Changelogs | Cycle changelogs and release notes | log |

## Page Structure Conventions

1. First heading (\`#\`) is the page title.
2. First paragraph after the title is the description (used in \`index.md\`).
3. Use \`##\` for major sections, \`###\` for sub-sections.
4. Cross-reference related pages with relative links: \`[Page Title](./page-slug.md)\`.
5. Mark deprecated content with a \`> **Archived:** reason\` blockquote.

## Reserved Files

The following filenames are reserved and managed by Studio — do not create or delete them manually:

- \`CLAUDE.md\` — this schema file (regenerate via Studio)
- \`index.md\` — auto-maintained navigation index (regenerated on every page write/delete)

## LLM Agent Maintenance Procedures

### Ingest

When a new source file arrives in \`raw/\`:

1. Read the source, strip BMAD workflow frontmatter.
2. Determine category from file path or content.
3. Create or update the corresponding wiki page with correct frontmatter.
4. Add a \`source:\` field referencing the original path.
5. \`index.md\` updates automatically via Studio after every write.

### Update

When a source page changes:

1. Locate the wiki page with the matching \`source:\` field.
2. Merge new content, preserving any manual annotations.
3. Update \`last_reviewed\` to today's date.

### Cross-Reference

When writing a new page:

1. Search existing pages for related entities.
2. Add relative markdown links in a \`## Related\` section at the bottom.

### index.md

\`index.md\` is auto-maintained by Studio on every write/delete.
Do not hand-edit it. To force regeneration: \`POST /api/wiki/generate-index\`.

### log.md

Append one line per ingest or update operation:

\`\`\`
YYYY-MM-DD HH:MM — <action>: <page-slug> (source: <relPath>)
\`\`\`

## Studio API Reference

| Method | Path | Description |
|---|---|---|
| GET | /api/wiki | List all pages with metadata |
| GET | /api/wiki/:slug | Get a single page with body |
| POST | /api/wiki | Create a new page |
| PUT | /api/wiki/:slug | Update a page body |
| DELETE | /api/wiki/:slug | Delete a page |
| POST | /api/wiki/generate-claude-md | Regenerate this file |
| POST | /api/wiki/generate-index | Regenerate index.md |
| GET | /api/wiki/import/preview | Preview importable artifacts |
| POST | /api/wiki/import | Import selected artifacts |
`

  await atomicWrite(filePath, content)
  return filePath
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
    return { category: 'Planning', skip: false }
  }

  if (dir === 'implementation-artifacts') {
    if (name.endsWith('.yaml') || name.endsWith('.txt')) return { category: 'Stories', skip: true }
    if (/^\d/.test(name)) return { category: 'Stories', skip: false }
    if (name.includes('retro')) return { category: 'Retrospectives', skip: false }
    if (name.startsWith('tech-spec-')) return { category: 'Specs', skip: false }
    return { category: 'Specs', skip: false }
  }

  return { category: 'Specs', skip: true }
}

function extractTitleFromContent(content: string, fallback: string): string {
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
// List pages (excludes reserved slugs)
// ---------------------------------------------------------------------------

function listPages(dir: string): WikiPageListItem[] {
  if (!fs.existsSync(dir)) return []
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.md') && !isReservedSlug(f.slice(0, -3)))
    .sort()
    .map((f) => {
      const slug = f.slice(0, -3)
      const filePath = path.join(dir, f)
      return toListItem(parsePage(filePath, slug))
    })
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

  // ---------------------------------------------------------------------------
  // Core CRUD routes — non-parameterised first, then :slug
  // ---------------------------------------------------------------------------

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

  // POST /api/wiki
  app.post<{ Body: { title: string; body?: string; category?: string } }>('/api/wiki', async (request): Promise<WikiPage> => {
    const { title, body, category } = request.body ?? {}
    if (typeof title !== 'string' || title.trim() === '') {
      throw new ValidationError('title is required')
    }

    const dir = ensureWikiDir()
    const base = titleToSlug(title.trim()) || 'untitled'
    const slug = uniqueSlug(dir, base)
    const filePath = path.join(dir, `${slug}.md`)

    const content = body ?? buildPageBody(title.trim(), category)
    await atomicWrite(filePath, content)

    generateIndex(dir).catch((err) => app.log.error(err, 'index generation failed'))
    return parsePage(filePath, slug)
  })

  // ---------------------------------------------------------------------------
  // Generate routes — must be before /:slug to avoid slug capture
  // ---------------------------------------------------------------------------

  // POST /api/wiki/generate-claude-md
  app.post('/api/wiki/generate-claude-md', async (): Promise<{ ok: true; filePath: string }> => {
    const dir = ensureWikiDir()
    const filePath = await generateClaudeMd(dir)
    return { ok: true, filePath }
  })

  // POST /api/wiki/generate-index
  app.post('/api/wiki/generate-index', async (): Promise<{ ok: true; filePath: string; pageCount: number }> => {
    const dir = ensureWikiDir()
    await generateIndex(dir)
    const pageCount = listPages(dir).length
    return { ok: true, filePath: path.join(dir, 'index.md'), pageCount }
  })

  // ---------------------------------------------------------------------------
  // Import routes — also before /:slug
  // ---------------------------------------------------------------------------

  // GET /api/wiki/import/preview
  app.get('/api/wiki/import/preview', async (): Promise<{ items: WikiImportPreviewItem[] }> => {
    const dir = ensureWikiDir()
    const importedSources = buildImportedSourceSet(dir)
    const items = scanBmadOutput(outputDir(), importedSources)
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

  // POST /api/wiki/import
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
        if (importedSources.has(relPath)) { skipped++; continue }
        const { category, skip } = categorizeArtifact(relPath)
        if (skip) { skipped++; continue }
        const srcPath = path.join(outputDir(), relPath)
        if (!fs.existsSync(srcPath)) { skipped++; continue }

        const rawContent = fs.readFileSync(srcPath, 'utf-8')
        const fallback = cleanFilename(path.basename(relPath))
        const title = extractTitleFromContent(rawContent, fallback)
        const strippedBody = stripBmadFrontmatter(rawContent)

        const wikiBody = `---\ncategory: ${category}\nsource: ${relPath}\n---\n\n${strippedBody}`

        const base = titleToSlug(title) || titleToSlug(fallback) || 'untitled'
        const slug = uniqueSlug(dir, base)
        const filePath = path.join(dir, `${slug}.md`)

        await atomicWrite(filePath, wikiBody)
        pages.push(toListItem(parsePage(filePath, slug)))
        importedSources.add(relPath)
        imported++
      }

      if (imported > 0) {
        generateIndex(dir).catch((err) => app.log.error(err, 'index generation failed'))
      }

      return { imported, skipped, pages }
    },
  )

  // ---------------------------------------------------------------------------
  // Parameterised :slug routes — last
  // ---------------------------------------------------------------------------

  // GET /api/wiki/:slug
  app.get<{ Params: { slug: string } }>('/api/wiki/:slug', async (request): Promise<WikiPage> => {
    const { slug } = request.params
    if (isReservedSlug(slug)) {
      throw new ValidationError(`'${slug}' is a reserved wiki slug`)
    }
    const filePath = path.join(wikiDir(), `${slug}.md`)
    if (!fs.existsSync(filePath)) {
      throw new NotFoundError(`Wiki page not found: ${slug}`)
    }
    return parsePage(filePath, slug)
  })

  // PUT /api/wiki/:slug
  app.put<{ Params: { slug: string }; Body: { body: string } }>(
    '/api/wiki/:slug',
    async (request): Promise<WikiPage> => {
      const { slug } = request.params
      const { body } = request.body ?? {}
      if (isReservedSlug(slug)) {
        throw new ValidationError(`'${slug}' is a reserved wiki slug`)
      }
      if (typeof body !== 'string') {
        throw new ValidationError('body must be a string')
      }

      const dir = ensureWikiDir()
      const filePath = path.join(dir, `${slug}.md`)
      if (!fs.existsSync(filePath)) {
        throw new NotFoundError(`Wiki page not found: ${slug}`)
      }

      await atomicWrite(filePath, body)
      const page = parsePage(filePath, slug)

      generateIndex(dir).catch((err) => app.log.error(err, 'index generation failed'))
      return page
    },
  )

  // DELETE /api/wiki/:slug
  app.delete<{ Params: { slug: string } }>('/api/wiki/:slug', async (request): Promise<{ ok: true }> => {
    const { slug } = request.params
    if (isReservedSlug(slug)) {
      throw new ValidationError(`'${slug}' is a reserved wiki slug`)
    }
    const dir = wikiDir()
    const filePath = path.join(dir, `${slug}.md`)
    if (!fs.existsSync(filePath)) {
      throw new NotFoundError(`Wiki page not found: ${slug}`)
    }
    fs.unlinkSync(filePath)

    generateIndex(dir).catch((err) => app.log.error(err, 'index generation failed'))
    return { ok: true }
  })
}
