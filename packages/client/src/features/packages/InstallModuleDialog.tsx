import { useState } from 'react'
import { Download, X, CheckCircle, Loader2 } from 'lucide-react'

type InstallModuleDialogProps = {
  onClose: () => void
  onInstalled: () => void
}

export function InstallModuleDialog({ onClose, onInstalled }: InstallModuleDialogProps) {
  const [packageName, setPackageName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<string[] | null>(null)

  const canSubmit = packageName.trim().length > 0

  const handleInstall = async () => {
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)
    setResult(null)
    try {
      const resp = await fetch('/api/modules/install', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageName: packageName.trim() }),
      })
      const data = (await resp.json()) as { ok: boolean; modules?: string[]; error?: string }
      if (!data.ok) {
        throw new Error(data.error ?? 'Installation failed')
      }
      setResult(data.modules ?? [])
      // Close after success
      setTimeout(() => {
        onInstalled()
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Installation failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-[var(--color-bg)] border border-[var(--color-border-subtle)] rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Install Module from npm</h2>
          <button
            onClick={onClose}
            className="text-[var(--color-muted)] hover:text-[var(--color-text)]"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold mb-1">npm Package Name</label>
            <input
              type="text"
              value={packageName}
              onChange={(e) => setPackageName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && canSubmit && !submitting) handleInstall()
              }}
              placeholder="e.g. bmad-builder"
              disabled={submitting || result !== null}
              className="w-full px-3 py-2 text-sm rounded-md bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)] focus:border-[var(--color-accent)] focus:outline-none disabled:opacity-50"
            />
            <p className="text-xs text-[var(--color-muted)] mt-1">
              The package must contain a <code className="font-[var(--font-mono)]">_bmad/</code> directory with module content.
            </p>
          </div>

          {submitting && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-[var(--color-surface-raised)]">
              <Loader2 size={16} className="text-[var(--color-accent)] animate-spin" />
              <span className="text-sm">Installing package...</span>
            </div>
          )}

          {result && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-success)]">
              <CheckCircle size={16} className="text-[var(--color-success)]" />
              <div className="text-sm">
                <p className="font-bold text-[var(--color-success)]">Installed successfully</p>
                <p className="text-[var(--color-muted)]">
                  Modules: {result.join(', ')}
                </p>
              </div>
            </div>
          )}

          {error && (
            <p className="text-sm text-[var(--color-error)]">{error}</p>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[var(--color-border-subtle)]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-md border border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-raised)] transition-colors"
          >
            {result ? 'Close' : 'Cancel'}
          </button>
          {!result && (
            <button
              onClick={handleInstall}
              disabled={!canSubmit || submitting}
              className="px-4 py-2 text-sm font-bold rounded-md bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              <Download size={14} />
              {submitting ? 'Installing...' : 'Install'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
