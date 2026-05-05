import { X, AlertTriangle, CheckCircle2, RefreshCw, FileWarning } from 'lucide-react'

import type { DriftedFileEntry } from './use-drift.js'

type DriftPanelProps = {
  files: DriftedFileEntry[]
  onClose: () => void
  onRefresh: () => void
}

function hashShort(hash: string | null): string {
  if (!hash) return '(missing)'
  return hash.slice(0, 10) + '…'
}

export function DriftPanel({ files, onClose, onRefresh }: DriftPanelProps) {
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <aside className="fixed right-0 top-0 h-full w-[480px] z-50 bg-[var(--color-bg)] border-l border-[var(--color-border-subtle)] shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--color-border-subtle)] shrink-0">
          <AlertTriangle size={18} className="text-[var(--color-warning)] shrink-0" />
          <div className="flex-1">
            <h2 className="text-sm font-bold">File Drift Detected</h2>
            <p className="text-xs text-[var(--color-muted)] mt-0.5">
              {files.length} file{files.length !== 1 ? 's' : ''} differ from installer baseline
            </p>
          </div>
          <button
            onClick={onRefresh}
            className="p-1.5 text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors cursor-pointer"
            title="Refresh"
          >
            <RefreshCw size={14} />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Explanation */}
        <div className="px-5 py-3 bg-[var(--color-warning)]/5 border-b border-[var(--color-border-subtle)] shrink-0">
          <p className="text-xs text-[var(--color-text)] leading-relaxed">
            These installed BMAD files have been modified since installation. Manual edits to installed
            skill files can be overwritten on next update. Consider converting changes to overrides
            in the Customize editor instead.
          </p>
        </div>

        {/* File list */}
        <div className="flex-1 overflow-y-auto">
          {files.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-6">
              <CheckCircle2 size={40} className="text-[var(--color-success)] mb-3" strokeWidth={1.5} />
              <p className="text-sm font-bold text-[var(--color-text)]">All files match baseline</p>
              <p className="text-xs text-[var(--color-muted)] mt-1">No drift detected</p>
            </div>
          ) : (
            <ul className="divide-y divide-[var(--color-border-subtle)]">
              {files.map((f) => (
                <li key={f.path} className="px-5 py-4">
                  <div className="flex items-start gap-3">
                    <FileWarning size={15} className="text-[var(--color-warning)] shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold font-mono text-[var(--color-text)] truncate" title={f.path}>
                        _bmad/{f.path}
                      </p>
                      <div className="mt-1.5 space-y-0.5">
                        <div className="flex items-center gap-2 text-[11px] text-[var(--color-muted)]">
                          <span className="w-20 shrink-0">Expected</span>
                          <code className="font-mono text-[var(--color-text)]">{hashShort(f.expectedHash)}</code>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-[var(--color-muted)]">
                          <span className="w-20 shrink-0">On disk</span>
                          <code className={`font-mono ${f.actualHash ? 'text-[var(--color-warning)]' : 'text-[var(--color-error)]'}`}>
                            {hashShort(f.actualHash)}
                          </code>
                          {!f.actualHash && (
                            <span className="text-[var(--color-error)] font-bold">(file missing)</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)] shrink-0">
          <p className="text-[11px] text-[var(--color-muted)]">
            To resolve drift: open the Customize editor for the affected skill and move your changes to a team or user override layer.
          </p>
        </div>
      </aside>
    </>
  )
}
