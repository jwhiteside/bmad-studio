import { useState } from 'react'
import { Link2, Check } from 'lucide-react'

/**
 * Copies the current URL to clipboard. Used in entity detail panels for stable deep links.
 */
export function CopyLinkButton({ title = 'Copy link to this view' }: { title?: string }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {})
  }

  return (
    <button
      onClick={handleCopy}
      title={title}
      className="text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors"
    >
      {copied ? <Check size={15} className="text-[var(--color-success)]" /> : <Link2 size={15} />}
    </button>
  )
}
