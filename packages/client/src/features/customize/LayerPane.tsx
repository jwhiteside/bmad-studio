import { CodeMirrorEditor } from '../../shared/markdown-editor/CodeMirrorEditor.js'

type LayerPaneProps = {
  label: string
  content: string | null
  placeholder?: string
  readOnly?: boolean
}

export function LayerPane({ label, content, placeholder, readOnly = true }: LayerPaneProps) {
  return (
    <div
      className="flex flex-col h-full border border-border rounded-lg overflow-hidden"
      tabIndex={0}
      aria-label={label + ' layer'}
    >
      <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground bg-muted border-b border-border">
        {label}
      </div>
      <div className="flex-1 overflow-hidden">
        {content === null ? (
          <div className="flex items-center justify-center h-full p-4">
            <p className="text-sm text-muted-foreground">
              {placeholder ?? 'No override file — changes will create it'}
            </p>
          </div>
        ) : (
          <CodeMirrorEditor
            content={content}
            language="toml"
            readOnly={readOnly}
          />
        )}
      </div>
    </div>
  )
}
