import { useState, useCallback } from 'react'
import Markdown from 'react-markdown'

import { CodeMirrorEditor, getLanguageForFile, type EditorLanguage } from './CodeMirrorEditor.js'
import { useThemeStore } from '../../stores/ui-store.js'

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
              <div className="prose prose-sm max-w-none text-[var(--color-text)] prose-headings:text-[var(--color-text)] prose-headings:font-bold prose-h1:text-2xl prose-h1:border-b prose-h1:border-[var(--color-border-subtle)] prose-h1:pb-2 prose-h2:text-xl prose-h3:text-lg prose-h4:text-base prose-p:leading-relaxed prose-a:text-[var(--color-accent)] prose-strong:text-[var(--color-text)] prose-code:font-[var(--font-mono)] prose-code:text-xs prose-code:bg-[var(--color-surface-raised)] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-pre:bg-[var(--color-surface-raised)] prose-pre:font-[var(--font-mono)] prose-li:marker:text-[var(--color-muted)] prose-blockquote:border-[var(--color-accent)] prose-blockquote:text-[var(--color-muted)] prose-hr:border-[var(--color-border-subtle)]">
                <Markdown>{content}</Markdown>
              </div>
            ) : (
              <pre className="text-sm font-[var(--font-mono)] whitespace-pre-wrap">{content}</pre>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
