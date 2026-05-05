import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'

import { useDrift } from './use-drift.js'
import { DriftPanel } from './DriftPanel.js'

export function DriftBadge() {
  const { count, files, loading, refresh } = useDrift()
  const [open, setOpen] = useState(false)

  if (loading || count === 0) return null

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-bold bg-[var(--color-warning)]/10 text-[var(--color-warning)] hover:bg-[var(--color-warning)]/20 transition-colors cursor-pointer"
        title={`${count} file${count !== 1 ? 's' : ''} differ from installer baseline`}
      >
        <AlertTriangle size={12} />
        {count} drift{count !== 1 ? 's' : ''}
      </button>

      {open && (
        <DriftPanel
          files={files}
          onClose={() => setOpen(false)}
          onRefresh={() => {
            refresh()
          }}
        />
      )}
    </>
  )
}
