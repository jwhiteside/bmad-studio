import { useState, useEffect } from 'react'
import { AlertTriangle, Trash2, Info, X } from 'lucide-react'

type CrossReference = {
  sourceModule: string
  sourceEntity: string
  entityType: string
  fieldPath: string
}

type RemovePreview = {
  module: { name: string; version: string; source: string }
  moduleFiles: { count: number; totalBytes: number }
  ideSkills: Record<string, string[]>
  manifestEntries: Record<string, boolean>
  preservedDirectories: Array<{ path: string; declared: boolean }>
  crossReferences: CrossReference[]
  crossReferenceScopeNotice: string
  removalBlocked: { reason: string } | null
  externalInstallerWarning: string | null
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

type RemoveModuleDialogProps = {
  moduleName: string
  onClose: () => void
  onRemoved: () => void
}

export function RemoveModuleDialog({ moduleName, onClose, onRemoved }: RemoveModuleDialogProps) {
  const [preview, setPreview] = useState<RemovePreview | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [removing, setRemoving] = useState(false)
  const [removeError, setRemoveError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/modules/${encodeURIComponent(moduleName)}/remove-preview`)
      .then(async (resp) => {
        const data = await resp.json()
        if (!resp.ok) {
          const e = data?.error
          throw new Error(
            typeof e === 'object' && e !== null
              ? ((e as { message?: string }).message ?? 'Failed to load preview')
              : String(e ?? 'Failed to load preview'),
          )
        }
        setPreview(data as RemovePreview)
      })
      .catch((err) => {
        setLoadError(err instanceof Error ? err.message : 'Failed to load preview')
      })
  }, [moduleName])

  const handleRemove = async () => {
    setRemoving(true)
    setRemoveError(null)
    try {
      const resp = await fetch(`/api/modules/${encodeURIComponent(moduleName)}`, {
        method: 'DELETE',
      })
      if (!resp.ok) {
        const data = await resp.json()
        const e = data?.error
        throw new Error(
          typeof e === 'object' && e !== null
            ? ((e as { message?: string }).message ?? 'Failed to remove module')
            : String(e ?? 'Failed to remove module'),
        )
      }
      onRemoved()
    } catch (err) {
      setRemoveError(err instanceof Error ? err.message : 'Failed to remove module')
    } finally {
      setRemoving(false)
    }
  }

  const isDegenerate =
    preview !== null &&
    preview.moduleFiles.count === 0 &&
    Object.values(preview.ideSkills).every((arr) => arr.length === 0) &&
    preview.preservedDirectories.length === 0 &&
    preview.crossReferences.length === 0

  const totalIdeSkills = preview
    ? Object.values(preview.ideSkills).reduce((sum, arr) => sum + arr.length, 0)
    : 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-[var(--color-bg)] border border-[var(--color-border-subtle)] rounded-lg shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-2 p-6 pb-4 border-b border-[var(--color-border-subtle)]">
          <AlertTriangle size={20} className="text-[var(--color-error)] shrink-0" />
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold">
              Remove module &quot;{moduleName}&quot;
              {preview?.module.version ? ` v${preview.module.version}` : ''}?
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--color-muted)] hover:text-[var(--color-text)] shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loadError && (
            <p className="text-sm text-[var(--color-error)]">{loadError}</p>
          )}

          {!preview && !loadError && (
            <p className="text-sm text-[var(--color-muted)]">Loading preview...</p>
          )}

          {preview && (
            <>
              {/* External installer warning */}
              {preview.externalInstallerWarning && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)]">
                  <Info size={16} className="text-[var(--color-muted)] mt-0.5 shrink-0" />
                  <p className="text-xs text-[var(--color-muted)]">{preview.externalInstallerWarning}</p>
                </div>
              )}

              {/* Degenerate fallback */}
              {isDegenerate ? (
                <p className="text-sm text-[var(--color-muted)]">
                  No files found on disk for this module. Removing will only clear the entry from manifest.yaml.
                </p>
              ) : (
                <>
                  {/* This will be removed */}
                  <div>
                    <p className="text-sm font-bold mb-2">This will be removed:</p>
                    <ul className="space-y-1 text-sm text-[var(--color-muted)]">
                      {preview.moduleFiles.count > 0 && (
                        <li>
                          Module files: {preview.moduleFiles.count} file{preview.moduleFiles.count !== 1 ? 's' : ''}{' '}
                          ({formatBytes(preview.moduleFiles.totalBytes)})
                        </li>
                      )}
                      {totalIdeSkills > 0 && Object.entries(preview.ideSkills).map(([ide, skills]) =>
                        skills.length > 0 ? (
                          <li key={ide}>
                            IDE skills ({ide}): {skills.length} launcher{skills.length !== 1 ? 's' : ''}
                            <ul className="ml-4 mt-1 space-y-0.5">
                              {skills.map((s) => (
                                <li key={s} className="text-xs font-mono">{s}</li>
                              ))}
                            </ul>
                          </li>
                        ) : null,
                      )}
                      <li>Manifest entry</li>
                    </ul>
                  </div>

                  {/* This will be preserved */}
                  {preview.preservedDirectories.length > 0 && (
                    <div>
                      <p className="text-sm font-bold mb-2">This will be preserved:</p>
                      <ul className="space-y-1 text-sm text-[var(--color-muted)]">
                        {preview.preservedDirectories.map((d) => (
                          <li key={d.path} className="font-mono text-xs">{d.path}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Warnings */}
                  {preview.crossReferences.length > 0 && (
                    <div>
                      <p className="text-sm font-bold text-[var(--color-warning)] mb-2">Warnings:</p>
                      <ul className="space-y-1 text-sm text-[var(--color-muted)]">
                        {preview.crossReferences.map((ref, i) => (
                          <li key={i}>
                            <span className="font-medium">{ref.sourceModule}</span>
                            {' / '}
                            <span className="font-mono text-xs">{ref.sourceEntity}</span>
                            {' references this module via '}
                            <span className="font-mono text-xs">{ref.fieldPath}</span>
                          </li>
                        ))}
                      </ul>
                      <p className="text-xs text-[var(--color-muted)] mt-2 italic">
                        {preview.crossReferenceScopeNotice}
                      </p>
                    </div>
                  )}
                </>
              )}

              {/* Blocked reason */}
              {preview.removalBlocked && (
                <p className="text-sm text-[var(--color-error)]">
                  {preview.removalBlocked.reason}
                </p>
              )}

              {/* Footer */}
              <p className="text-xs text-[var(--color-muted)]">
                Recoverable from snapshot history.
              </p>
            </>
          )}

          {removeError && (
            <p className="text-sm text-[var(--color-error)]">{removeError}</p>
          )}
        </div>

        {/* Footer buttons */}
        <div className="flex justify-end gap-3 p-6 pt-4 border-t border-[var(--color-border-subtle)]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-md border border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-raised)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleRemove}
            disabled={removing || !preview || !!preview.removalBlocked || !!loadError}
            className="px-4 py-2 text-sm font-bold rounded-md bg-[var(--color-error)] text-white hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            <Trash2 size={14} />
            {removing ? 'Removing...' : 'Remove'}
          </button>
        </div>
      </div>
    </div>
  )
}
