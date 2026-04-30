/**
 * VerifyBadge — purely presentational component that renders the current
 * verification status of a skill's customization merge.
 *
 * NFR-A11Y-3: every colour state is paired with a visible text label so
 * colour alone is never the sole indicator of meaning.
 */

export type VerifyStatus = 'idle' | 'loading' | 'verified' | 'ts-only' | 'mismatch'

export type VerifyBadgeProps = {
  status: VerifyStatus
  detail?: string
  onViewDetails?: () => void
}

export function VerifyBadge({ status, detail, onViewDetails }: VerifyBadgeProps) {
  if (status === 'idle') return null

  if (status === 'loading') {
    return (
      <span
        className="inline-flex items-center gap-1.5 text-xs text-[var(--color-muted)]"
        aria-label="Verifying…"
        role="status"
      >
        <span
          className="w-3 h-3 rounded-full border-2 border-current border-t-transparent animate-spin"
          aria-hidden="true"
        />
        Verifying…
      </span>
    )
  }

  if (status === 'verified') {
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-green-700 bg-green-50 border border-green-200"
        aria-label="Verification status: verified"
        role="status"
      >
        <span aria-hidden="true">✓</span>
        verified
      </span>
    )
  }

  if (status === 'ts-only') {
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 cursor-help"
        aria-label="Verification status: TypeScript preview only"
        title="Python verifier unavailable. Preview uses TypeScript resolver only."
        role="status"
      >
        TS-merged preview
      </span>
    )
  }

  // mismatch
  return (
    <span
      className="inline-flex items-center gap-2"
      aria-label="Verification status: mismatch detected"
      role="status"
    >
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-red-700 bg-red-50 border border-red-200">
        Mismatch detected
      </span>
      {onViewDetails && (
        <button
          type="button"
          onClick={onViewDetails}
          className="text-xs text-[var(--color-accent)] hover:underline focus:outline-none focus:underline"
          title={detail}
        >
          View details
        </button>
      )}
    </span>
  )
}
