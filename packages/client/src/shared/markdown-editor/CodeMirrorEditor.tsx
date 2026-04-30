import { useEffect, useRef, useCallback } from 'react'
import { EditorView, keymap, placeholder as placeholderExt } from '@codemirror/view'
import { EditorState, type Extension } from '@codemirror/state'
import { markdown } from '@codemirror/lang-markdown'
import { yaml } from '@codemirror/lang-yaml'
import { html } from '@codemirror/lang-html'
import { javascript } from '@codemirror/lang-javascript'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { oneDark } from '@codemirror/theme-one-dark'
import { syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language'

export type EditorLanguage = 'markdown' | 'yaml' | 'html' | 'javascript' | 'plaintext' | 'toml'

type CodeMirrorEditorProps = {
  content: string
  onChange?: (value: string) => void
  onSave?: (value: string) => void
  readOnly?: boolean
  dark?: boolean
  placeholder?: string
  language?: EditorLanguage
}

function getLanguageExtension(lang: EditorLanguage): Extension | null {
  switch (lang) {
    case 'markdown':
      return markdown()
    case 'yaml':
      return yaml()
    case 'html':
      return html()
    case 'javascript':
      return javascript()
    case 'toml':
      return yaml() // uses YAML grammar as TOML fallback per arch decision (Story 33.2)
    case 'plaintext':
      return null
  }
}

export function getLanguageForFile(filePath: string): EditorLanguage {
  const ext = filePath.split('.').pop()?.toLowerCase() ?? ''
  switch (ext) {
    case 'md':
    case 'markdown':
      return 'markdown'
    case 'yaml':
    case 'yml':
      return 'yaml'
    case 'html':
    case 'htm':
      return 'html'
    case 'js':
    case 'jsx':
    case 'ts':
    case 'tsx':
    case 'json':
      return 'javascript'
    case 'toml':
      return 'toml'
    default:
      return 'plaintext'
  }
}

const lightTheme = EditorView.theme({
  '&': {
    backgroundColor: 'var(--color-bg)',
    color: 'var(--color-text)',
    height: '100%',
  },
  '.cm-content': {
    fontFamily: 'var(--font-mono)',
    fontSize: '13px',
    padding: '16px 0',
  },
  '.cm-gutters': {
    backgroundColor: 'var(--color-bg)',
    borderRight: '1px solid var(--color-border-subtle)',
    color: 'var(--color-muted)',
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'var(--color-surface-raised)',
  },
  '.cm-activeLine': {
    backgroundColor: 'var(--color-surface-raised)',
  },
  '.cm-cursor': {
    borderLeftColor: 'var(--color-accent)',
  },
  '.cm-selectionBackground': {
    backgroundColor: 'rgba(255, 74, 0, 0.15) !important',
  },
  '&.cm-focused .cm-selectionBackground': {
    backgroundColor: 'rgba(255, 74, 0, 0.2) !important',
  },
  '.cm-scroller': {
    overflow: 'auto',
  },
})

export function CodeMirrorEditor({
  content,
  onChange,
  onSave,
  readOnly = false,
  dark = false,
  placeholder,
  language = 'markdown',
}: CodeMirrorEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const onChangeRef = useRef(onChange)
  const onSaveRef = useRef(onSave)

  // Keep callback refs up to date
  onChangeRef.current = onChange
  onSaveRef.current = onSave

  const createExtensions = useCallback(() => {
    const exts: Extension[] = [
      history(),
      keymap.of([
        ...defaultKeymap,
        ...historyKeymap,
        {
          key: 'Mod-s',
          run: (view) => {
            onSaveRef.current?.(view.state.doc.toString())
            return true
          },
        },
      ]),
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          onChangeRef.current?.(update.state.doc.toString())
        }
      }),
      EditorView.lineWrapping,
    ]

    const langExt = getLanguageExtension(language)
    if (langExt) exts.push(langExt)

    if (dark) {
      exts.push(oneDark)
    } else {
      exts.push(lightTheme, syntaxHighlighting(defaultHighlightStyle))
    }

    if (readOnly) {
      exts.push(EditorState.readOnly.of(true))
    }

    if (placeholder) {
      exts.push(placeholderExt(placeholder))
    }

    return exts
  }, [dark, readOnly, placeholder, language])

  // Initialize editor
  useEffect(() => {
    if (!containerRef.current) return

    const state = EditorState.create({
      doc: content,
      extensions: createExtensions(),
    })

    const view = new EditorView({
      state,
      parent: containerRef.current,
    })

    viewRef.current = view

    return () => {
      view.destroy()
      viewRef.current = null
    }
    // Only run on mount and when extensions change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createExtensions])

  // Sync external content changes
  useEffect(() => {
    const view = viewRef.current
    if (!view) return
    const currentContent = view.state.doc.toString()
    if (currentContent !== content) {
      view.dispatch({
        changes: {
          from: 0,
          to: currentContent.length,
          insert: content,
        },
      })
    }
  }, [content])

  return <div ref={containerRef} className="h-full overflow-hidden" />
}
