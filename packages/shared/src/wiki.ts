export type WikiPage = {
  slug: string          // filename without .md, url-safe
  title: string         // first # heading or filename
  description?: string  // first paragraph after title, if short (<200 chars)
  body: string          // full markdown content
  filePath: string      // absolute path on disk
  lastModified: string  // ISO date string
  category?: string     // derived from frontmatter `category:` or directory
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
