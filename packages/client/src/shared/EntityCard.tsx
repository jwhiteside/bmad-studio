import type { ReactNode } from 'react'

// ── Base Card ──────────────────────────────────────────────────

type EntityCardProps = {
  onClick?: () => void
  selected?: boolean
  children: ReactNode
}

export function EntityCard({ onClick, selected, children }: EntityCardProps) {
  return (
    <div
      onClick={onClick}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={`p-4 rounded-lg bg-[var(--color-surface-raised)] border transition-colors cursor-pointer ${
        selected
          ? 'border-[var(--color-accent)]'
          : 'border-[var(--color-border-subtle)] hover:border-[var(--color-accent)]'
      }`}
    >
      {children}
    </div>
  )
}

// ── Icon ───────────────────────────────────────────────────────

type CardIconProps = {
  emoji?: string
  fallbackIcon?: ReactNode
  fallbackInitial?: string
}

export function CardIcon({ emoji, fallbackIcon, fallbackInitial }: CardIconProps) {
  if (emoji) {
    return (
      <span className="w-9 h-9 rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)] flex items-center justify-center shrink-0 text-lg leading-none" role="img">
        {emoji}
      </span>
    )
  }
  if (fallbackIcon) {
    return (
      <span className="w-9 h-9 rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)] flex items-center justify-center shrink-0 text-[var(--color-muted)]">
        {fallbackIcon}
      </span>
    )
  }
  if (fallbackInitial) {
    return (
      <span className="w-9 h-9 rounded-lg bg-[var(--color-accent)] text-white text-sm font-bold flex items-center justify-center shrink-0">
        {fallbackInitial.charAt(0).toUpperCase()}
      </span>
    )
  }
  return null
}

// ── Header ─────────────────────────────────────────────────────

type CardHeaderProps = {
  icon: ReactNode
  title: string
  subtitle?: string
  indicator?: ReactNode
}

export function CardHeader({ icon, title, subtitle, indicator }: CardHeaderProps) {
  return (
    <div className="flex items-center gap-3 mb-2">
      {icon}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm truncate">{title}</span>
          {indicator}
        </div>
        {subtitle && (
          <p className="text-xs text-[var(--color-muted)] truncate">{subtitle}</p>
        )}
      </div>
    </div>
  )
}

// ── Body ───────────────────────────────────────────────────────

type CardBodyProps = {
  children: ReactNode
}

export function CardBody({ children }: CardBodyProps) {
  return <div className="mb-3">{children}</div>
}

export function CardDescription({ text, lines = 2 }: { text: string; lines?: 1 | 2 | 3 }) {
  const clamp = lines === 1 ? 'line-clamp-1' : lines === 3 ? 'line-clamp-3' : 'line-clamp-2'
  return <p className={`text-xs text-[var(--color-muted)] ${clamp}`}>{text}</p>
}

// ── Footer ─────────────────────────────────────────────────────

type CardFooterProps = {
  left?: ReactNode
  right?: ReactNode
}

export function CardFooter({ left, right }: CardFooterProps) {
  return (
    <div className="flex items-center justify-between text-xs text-[var(--color-muted)]">
      <div className="flex items-center gap-2">{left}</div>
      <div className="flex items-center gap-2">{right}</div>
    </div>
  )
}

// ── Module Badge ───────────────────────────────────────────────

export function ModuleBadge({ module }: { module?: string }) {
  if (!module) return null
  return (
    <span className="px-2 py-0.5 rounded-full text-xs bg-[var(--color-bg)] border border-[var(--color-border-subtle)] text-[var(--color-muted)] shrink-0">
      {module}
    </span>
  )
}

// ── Indicator Dot ──────────────────────────────────────────────

export function IndicatorDot({ color, title }: { color: 'warning' | 'success' | 'error'; title: string }) {
  const colorClass =
    color === 'warning' ? 'bg-[var(--color-warning)]' :
    color === 'success' ? 'bg-[var(--color-success)]' :
    'bg-[var(--color-error)]'
  return <span className={`w-2 h-2 rounded-full ${colorClass} shrink-0`} title={title} />
}

// ── Card Grid ──────────────────────────────────────────────────

export function CardGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {children}
    </div>
  )
}
