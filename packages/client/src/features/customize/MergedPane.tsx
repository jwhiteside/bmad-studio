type ProvenanceSource = 'base' | 'team' | 'user' | 'merged'

type MergedPaneProps = {
  merged: Record<string, unknown>
  provenance: Record<string, string>
}

const CHIP_STYLES: Record<ProvenanceSource, string> = {
  base: 'bg-muted text-muted-foreground',
  team: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  user: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  merged: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
}

function formatValue(value: unknown): string {
  if (Array.isArray(value)) return `[${value.length} items]`
  if (value !== null && typeof value === 'object') return '{...}'
  return String(value)
}

function ProvenanceChip({ source }: { source: string }) {
  const key = source as ProvenanceSource
  const colorClass = CHIP_STYLES[key] ?? CHIP_STYLES.base
  const isMerged = key === 'merged'

  return (
    <span
      className={`shrink-0 text-xs px-1.5 py-0.5 rounded font-sans ${colorClass}`}
      title={isMerged ? 'This field was combined from multiple layers' : undefined}
      aria-label={`Source: ${source}`}
    >
      {source}
    </span>
  )
}

export function MergedPane({ merged, provenance }: MergedPaneProps) {
  const entries = Object.entries(merged)

  return (
    <div
      className="flex flex-col h-full border border-border rounded-lg overflow-hidden"
      tabIndex={0}
      aria-label="Merged layer"
    >
      <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground bg-muted border-b border-border">
        Merged
      </div>
      <div className="flex-1 overflow-auto p-3 space-y-1 font-mono text-sm">
        {entries.length === 0 ? (
          <span className="text-muted-foreground text-xs">No fields</span>
        ) : (
          entries.map(([key, value]) => (
            <div key={key} className="flex items-center gap-2 py-0.5">
              <span className="text-muted-foreground min-w-0 truncate">{key}:</span>
              <span className="flex-1 min-w-0 truncate">{formatValue(value)}</span>
              <ProvenanceChip source={provenance[key] ?? 'base'} />
            </div>
          ))
        )}
      </div>
    </div>
  )
}
