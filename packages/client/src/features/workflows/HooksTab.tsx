import { useState } from 'react'
import { Plus } from 'lucide-react'

import type { HookEntry, WorkflowHookSurface, WorkflowHooks } from '@bmad-studio/shared'

import { useHooksPalette } from '../../hooks/use-hooks-palette.js'
import { HookEntryRow } from './HookEntryRow.js'

type HooksTabProps = {
  workflowId: string
}

const SECTIONS: Array<{ surface: WorkflowHookSurface; title: string; description: string }> = [
  {
    surface: 'activationStepsPrepend',
    title: 'Prepend steps',
    description: 'Commands run before the workflow starts.',
  },
  {
    surface: 'activationStepsAppend',
    title: 'Append steps',
    description: 'Commands run after activation, before the first step.',
  },
  {
    surface: 'onComplete',
    title: 'On complete',
    description: 'Commands run after the workflow finishes.',
  },
]

function sectionEntries(hooks: WorkflowHooks | null, surface: WorkflowHookSurface): HookEntry[] {
  return hooks?.[surface] ?? []
}

export function HooksTab({ workflowId }: HooksTabProps) {
  const { hooks, loading, error, toggleEntry } = useHooksPalette(workflowId)
  // Story 35.3 wires the actual TemplatePalette; for now this just records
  // which surface "Add" was clicked on so the next story can render it.
  const [, setOpenPaletteSurface] = useState<WorkflowHookSurface | null>(null)

  if (loading) {
    return (
      <div className="space-y-4 p-4" aria-busy="true">
        {SECTIONS.map((s) => (
          <div key={s.surface} className="space-y-2">
            <div className="h-5 w-32 animate-pulse rounded bg-zinc-200" />
            <div className="h-12 w-full animate-pulse rounded bg-zinc-100" />
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 text-sm text-red-600" role="alert">
        Failed to load hooks: {error}
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4">
      {SECTIONS.map(({ surface, title, description }) => {
        const entries = sectionEntries(hooks, surface)
        return (
          <section key={surface} aria-label={title}>
            <header className="mb-2 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-zinc-900">{title}</h3>
                <p className="text-xs text-zinc-500">{description}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpenPaletteSurface(surface)}
                className="inline-flex items-center gap-1 rounded-md border border-zinc-300 px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-400"
                aria-label={`Add hook to ${title}`}
              >
                <Plus className="h-3 w-3" />
                Add
              </button>
            </header>
            {entries.length === 0 ? (
              <div className="rounded-md border border-dashed border-zinc-200 px-3 py-6 text-center text-xs text-zinc-500">
                No entries yet.
              </div>
            ) : (
              <div role="list" className="space-y-2">
                {entries.map((entry, i) => (
                  <HookEntryRow
                    key={`${surface}-${i}`}
                    entry={entry}
                    onToggle={() => void toggleEntry(surface, i)}
                  />
                ))}
              </div>
            )}
          </section>
        )
      })}
    </div>
  )
}
