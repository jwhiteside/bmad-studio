import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { X } from 'lucide-react'

import type { WorkflowHookSurface } from '@bmad-studio/shared'

import {
  templatesForSurface,
  type ClientHookTemplate,
  type ClientParamDescriptor,
} from './hook-templates-client.js'
import { ParameterForm } from './ParameterForm.js'

type TemplatePaletteProps = {
  surface: WorkflowHookSurface
  onInsert: (entry: { templateId: string; command: string }) => void
  onClose: () => void
}

function defaultValuesFor(params: ClientParamDescriptor[]): Record<string, string | boolean> {
  const v: Record<string, string | boolean> = {}
  for (const p of params) {
    if (p.default !== undefined) v[p.name] = p.default
    else if (p.type === 'enum') v[p.name] = p.options?.[0] ?? ''
    else if (p.type === 'boolean') v[p.name] = false
    else v[p.name] = ''
  }
  return v
}

function validate(
  params: ClientParamDescriptor[],
  values: Record<string, string | boolean>,
): Record<string, string> {
  const errs: Record<string, string> = {}
  for (const p of params) {
    if (p.required) {
      const v = values[p.name]
      if (typeof v === 'string' && v.trim() === '') {
        errs[p.name] = 'Required'
      }
    }
  }
  return errs
}

export function TemplatePalette({ surface, onInsert, onClose }: TemplatePaletteProps) {
  const templates = useMemo(() => templatesForSurface(surface), [surface])
  const [selectedId, setSelectedId] = useState<string | null>(templates[0]?.id ?? null)
  const selected: ClientHookTemplate | undefined = useMemo(
    () => templates.find((t) => t.id === selectedId),
    [templates, selectedId],
  )

  const [values, setValues] = useState<Record<string, string | boolean>>(() =>
    selected ? defaultValuesFor(selected.params) : {},
  )
  const [errors, setErrors] = useState<Record<string, string>>({})

  const dialogRef = useRef<HTMLDivElement>(null)

  // Reset form values when selection changes
  useEffect(() => {
    if (selected) setValues(defaultValuesFor(selected.params))
    else setValues({})
    setErrors({})
  }, [selected])

  // Focus management — autofocus dialog on open, ESC to close
  useEffect(() => {
    dialogRef.current?.focus()
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  const handleChange = useCallback((name: string, value: string | boolean) => {
    setValues((prev) => ({ ...prev, [name]: value }))
  }, [])

  const handleInsert = useCallback(() => {
    if (!selected) return
    const errs = validate(selected.params, values)
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    const command = selected.render(values)
    onInsert({ templateId: selected.id, command })
    onClose()
  }, [selected, values, onInsert, onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Hook template palette"
        tabIndex={-1}
        className="flex max-h-[80vh] w-[640px] max-w-[90vw] flex-col overflow-hidden rounded-lg bg-white shadow-xl focus:outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900">Insert hook</h2>
            <p className="text-xs text-zinc-500">Choose a template, fill in parameters, then Insert.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close palette"
            className="rounded-md p-1 text-zinc-500 hover:bg-zinc-100"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="grid flex-1 grid-cols-[200px_1fr] gap-0 overflow-hidden">
          <nav
            aria-label="Templates"
            className="overflow-y-auto border-r border-zinc-200 bg-zinc-50 py-2"
          >
            {templates.length === 0 ? (
              <p className="px-3 py-2 text-xs text-zinc-500">
                No templates for this surface.
              </p>
            ) : (
              templates.map((t) => {
                const active = t.id === selectedId
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedId(t.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        setSelectedId(t.id)
                      }
                    }}
                    className={[
                      'block w-full px-3 py-2 text-left text-sm focus:outline-none focus:bg-zinc-100',
                      active ? 'bg-white font-medium text-zinc-900' : 'text-zinc-700 hover:bg-zinc-100',
                    ].join(' ')}
                    aria-current={active ? 'true' : undefined}
                  >
                    {t.label}
                  </button>
                )
              })
            )}
          </nav>

          <div className="overflow-y-auto px-4 py-3">
            {selected ? (
              <>
                <p className="mb-3 text-xs text-zinc-600">{selected.description}</p>
                <ParameterForm
                  params={selected.params}
                  values={values}
                  onChange={handleChange}
                  errors={errors}
                />
                {selected.hasScriptTemplate ? (
                  <p className="mt-3 rounded-md bg-amber-50 p-2 text-[11px] text-amber-800">
                    This template installs a helper script in
                    <code className="mx-1">_bmad/custom/scripts/</code>
                    (existing scripts are never overwritten).
                  </p>
                ) : null}
              </>
            ) : null}
          </div>
        </div>

        <footer className="flex items-center justify-end gap-2 border-t border-zinc-200 px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-zinc-300 px-3 py-1 text-sm text-zinc-700 hover:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-400"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleInsert}
            disabled={!selected}
            className="rounded-md bg-zinc-900 px-3 py-1 text-sm font-medium text-white hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Insert
          </button>
        </footer>
      </div>
    </div>
  )
}
