import { useState, useCallback, useMemo } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

import { CodeMirrorEditor, getLanguageForFile, type EditorLanguage } from './CodeMirrorEditor.js'
import { useThemeStore } from '../../stores/ui-store.js'

/** Strip frontmatter and return it separately for styled rendering */
function splitFrontmatter(text: string): { frontmatter: string | null; body: string } {
  const match = text.match(/^---\n([\s\S]*?)\n---\n?/)
  if (!match) return { frontmatter: null, body: text }
  return { frontmatter: match[1], body: text.slice(match[0].length) }
}

type EditorMode = 'edit' | 'preview' | 'split'

type MarkdownEditorProps = {
  content: string
  filePath: string
  onChange: (content: string) => void
  onSave?: (content: string) => void
  readOnly?: boolean
  defaultMode?: EditorMode
  hideModeTabs?: boolean
}

function MarkdownPreview({ content }: { content: string }) {
  const { frontmatter, body } = useMemo(() => splitFrontmatter(content), [content])

  return (
    <div className="prose prose-sm max-w-none text-[var(--color-text)] prose-headings:text-[var(--color-text)] prose-headings:font-bold prose-h1:text-2xl prose-h1:border-b prose-h1:border-[var(--color-border-subtle)] prose-h1:pb-2 prose-h2:text-xl prose-h3:text-lg prose-h4:text-base prose-p:leading-relaxed prose-a:text-[var(--color-accent)] prose-strong:text-[var(--color-text)] prose-code:font-[var(--font-mono)] prose-code:text-xs prose-code:bg-[var(--color-surface-raised)] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-pre:bg-[var(--color-surface-raised)] prose-pre:font-[var(--font-mono)] prose-li:marker:text-[var(--color-muted)] prose-blockquote:border-[var(--color-accent)] prose-blockquote:text-[var(--color-muted)] prose-hr:border-[var(--color-border-subtle)] prose-table:border-collapse prose-th:border prose-th:border-[var(--color-border-subtle)] prose-th:px-3 prose-th:py-2 prose-th:bg-[var(--color-surface-raised)] prose-td:border prose-td:border-[var(--color-border-subtle)] prose-td:px-3 prose-td:py-2">
      {frontmatter && (
        <div className="not-prose mb-6 rounded-lg border border-[var(--color-border-subtle)] overflow-hidden">
          <div className="px-3 py-1.5 bg-[var(--color-surface-raised)] border-b border-[var(--color-border-subtle)]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]">Frontmatter</span>
          </div>
          <pre className="p-3 text-xs font-[var(--font-mono)] text-[var(--color-text)] whitespace-pre-wrap">{frontmatter}</pre>
        </div>
      )}
      <Markdown remarkPlugins={[remarkGfm]}>{body}</Markdown>
    </div>
  )
}

export function MarkdownEditor({
  content,
  filePath,
  onChange,
  onSave,
  readOnly = false,
  defaultMode,
  hideModeTabs = false,
}: MarkdownEditorProps) {
  const [mode, setMode] = useState<EditorMode>(defaultMode ?? 'edit')
  const theme = useThemeStore((s) => s.theme)
  const language: EditorLanguage = getLanguageForFile(filePath)
  const isMarkdown = language === 'markdown'

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        onSave?.(content)
      }
    },
    [content, onSave],
  )

  return (
    <div className="flex flex-col h-full" onKeyDown={handleKeyDown}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--color-border-subtle)] shrink-0">
        <span className="text-xs font-[var(--font-mono)] text-[var(--color-muted)] truncate mr-4">
          {filePath}
        </span>
        {!hideModeTabs && (
          <div className="flex gap-0.5 shrink-0">
            {(['edit', 'preview', 'split'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-2.5 py-1 text-xs rounded transition-colors ${
                  mode === m
                    ? 'bg-[var(--color-surface-raised)] text-[var(--color-text)] font-bold'
                    : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
                }`}
              >
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Editor body */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {(mode === 'edit' || mode === 'split') && (
          <div className={`${mode === 'split' ? 'w-1/2' : 'w-full'} overflow-hidden`}>
            <CodeMirrorEditor
              content={content}
              onChange={onChange}
              onSave={onSave}
              readOnly={readOnly}
              dark={theme === 'dark'}
              language={language}
            />
          </div>
        )}
        {(mode === 'preview' || mode === 'split') && (
          <div
            className={`${mode === 'split' ? 'w-1/2 border-l border-[var(--color-border-subtle)]' : 'w-full'} overflow-auto p-6`}
          >
            {isMarkdown ? (
              <MarkdownPreview content={content} />
            ) : (
              <pre className="text-sm font-[var(--font-mono)] whitespace-pre-wrap">{content}</pre>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
