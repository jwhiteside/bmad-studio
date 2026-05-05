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
