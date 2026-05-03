import { useEffect, useRef } from 'react'

import { DiffViewer } from '../../shared/diff-viewer/DiffViewer.js'

type DiffConfirmDialogProps = {
  open: boolean
  onConfirm: () => void
  onCancel: () => void
  original: string
  modified: string
  title?: string
}

export function DiffConfirmDialog({
  open,
  onConfirm,
  onCancel,
  original,
  modified,
  title,
}: DiffConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null)
  const confirmRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    // Focus cancel button on open
    cancelRef.current?.focus()

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onCancel()
        return
      }

      if (e.key === 'Enter') {
        e.preventDefault()
        onConfirm()
        return
      }

      // Focus trap: cycle Tab / Shift+Tab within the dialog
      if (e.key === 'Tab') {
        const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        )
        if (!focusable || focusable.length === 0) return

        const first = focusable[0]
        const last = focusable[focusable.length - 1]

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault()
            last.focus()
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault()
            first.focus()
          }
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onConfirm, onCancel])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} aria-hidden="true" />

      {/* Dialog */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="diff-confirm-title"
        className="relative bg-[var(--color-bg)] border border-[var(--color-border-subtle)] rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center px-6 py-4 border-b border-[var(--color-border-subtle)]">
          <h2 id="diff-confirm-title" className="text-lg font-bold flex-1">
            Confirm save{title ? ` — ${title}` : ''}
          </h2>
        </div>

        {/* Diff body */}
        <div className="flex-1 overflow-y-auto max-h-96 bg-[var(--color-surface-raised)] border-b border-[var(--color-border-subtle)]">
          <DiffViewer original={original} modified={modified} />
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4">
          <button
            ref={cancelRef}
            onClick={onCancel}
            className="px-4 py-2 text-sm rounded-md border border-[var(--color-border-subtle)] text-[var(--color-text)] hover:bg-[var(--color-surface-raised)] transition-colors"
          >
            Cancel
          </button>
          <button
            ref={confirmRef}
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-bold rounded-md bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] transition-colors"
          >
            Confirm save
          </button>
        </div>
      </div>
    </div>
  )
}
