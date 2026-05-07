export type WikiPage = {
  slug: string          // filename without .md, url-safe
  title: string         // first # heading or filename
  description?: string  // first paragraph after title, if short (<200 chars)
  body: string          // full markdown content
  filePath: string      // absolute path on disk
  lastModified: string  // ISO date string
  category?: string     // derived from frontmatter `category:`
  status?: string       // e.g. 'draft' | 'current' | 'archived'
  tags?: string[]       // frontmatter `tags:`
  entity_type?: string  // e.g. 'concept' | 'decision' | 'reference' | 'log'
  last_reviewed?: string // ISO date string from frontmatter
}

export type WikiPageListItem = Omit<WikiPage, 'body'>

export type WikiIndex = {
  pages: WikiPageListItem[]
  categories: string[]
}

export const WIKI_CATEGORIES = [
  'Foundation',
  'Planning',
  'Research',
  'Design',
  'Specs',
  'Stories',
  'Retrospectives',
  'Brainstorming',
  'Changelogs',
] as const

export type WikiCategory = (typeof WIKI_CATEGORIES)[number]

export const WIKI_RESERVED_SLUGS = ['CLAUDE', 'index'] as const
export type WikiReservedSlug = (typeof WIKI_RESERVED_SLUGS)[number]

export type WikiImportPreviewItem = {
  relPath: string          // relative to _bmad-output/, e.g. "planning-artifacts/prd.md"
  title: string            // extracted from first # heading or filename
  category: WikiCategory   // auto-assigned category
  suggestedSlug: string    // proposed wiki slug
  alreadyImported: boolean // true if a wiki page already tracks this source
}

export type WikiImportResult = {
  imported: number
  skipped: number
  pages: WikiPageListItem[]
}
