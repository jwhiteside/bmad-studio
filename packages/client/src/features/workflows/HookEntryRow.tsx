import type { HookEntry } from '@bmad-studio/shared'

type HookEntryRowProps = {
  entry: HookEntry
  onToggle: () => void
  /** Optional aria-label override; defaults to "Hook entry: {command}". */
  'aria-label'?: string
}

/**
 * A single row in the hooks list — shows the command text and a toggle
 * button that flips `disabled`. Disabled rows are visually greyed-out and
 * carry a "Disabled" pill.
 */
export function HookEntryRow({ entry, onToggle, ...rest }: HookEntryRowProps) {
  const ariaLabel = rest['aria-label'] ?? `Hook entry: ${entry.command}`
  const disabled = !!entry.disabled

  return (
    <div
      role="row"
      aria-label={ariaLabel}
      tabIndex={0}
      className={[
        'flex items-center justify-between gap-3 rounded-md border px-3 py-2',
        disabled
          ? 'border-zinc-200 bg-zinc-50 text-zinc-400'
          : 'border-zinc-200 bg-white text-zinc-900',
      ].join(' ')}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <code
          className={[
            'truncate font-mono text-sm',
            disabled ? 'line-through' : '',
          ].join(' ')}
          title={entry.command}
        >
          {entry.command}
        </code>
        {disabled ? (
          <span className="shrink-0 rounded-full bg-zinc-200 px-2 py-0.5 text-xs uppercase tracking-wide text-zinc-600">
            Disabled
          </span>
        ) : null}
      </div>
      <button
        type="button"
        onClick={onToggle}
        className="shrink-0 rounded-md border border-zinc-300 px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-400"
      >
        {disabled ? 'Enable' : 'Disable'}
      </button>
    </div>
  )
}
