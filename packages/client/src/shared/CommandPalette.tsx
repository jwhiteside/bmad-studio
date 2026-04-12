import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Users, Zap, GitBranch, UsersRound } from 'lucide-react'

type SearchResult = {
  type: 'agent' | 'skill' | 'workflow' | 'team'
  id: string
  name: string
  title?: string
  icon?: string
  description: string
  module?: string
}

const TYPE_CONFIG = {
  agent: { label: 'Agent', color: 'text-[var(--color-accent)]', bg: 'bg-blue-500/10', Icon: Users },
  skill: { label: 'Skill', color: 'text-[var(--color-success)]', bg: 'bg-green-500/10', Icon: Zap },
  workflow: { label: 'Workflow', color: 'text-purple-400', bg: 'bg-purple-500/10', Icon: GitBranch },
  team: { label: 'Team', color: 'text-orange-400', bg: 'bg-orange-500/10', Icon: UsersRound },
}

function resultRoute(result: SearchResult): string {
  switch (result.type) {
    case 'agent': return `/agents/${result.id}`
    case 'skill': return `/skills?detail=${result.id}`
    case 'workflow': return `/workflows?detail=${result.id}`
    case 'team': return `/teams?detail=${result.id}`
  }
}

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  const openPalette = useCallback(() => {
    setQuery('')
    setResults([])
    setSelectedIndex(0)
    setOpen(true)
  }, [])

  const closePalette = useCallback(() => {
    setOpen(false)
  }, [])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        if (open) {
          closePalette()
        } else {
          openPalette()
        }
      }
      if (e.key === 'Escape' && open) {
        closePalette()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, openPalette, closePalette])

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 10)
    }
  }, [open])

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }

    const controller = new AbortController()
    fetch(`/api/search?q=${encodeURIComponent(query)}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => {
        setResults(data as SearchResult[])
        setSelectedIndex(0)
      })
      .catch(() => {})

    return () => controller.abort()
  }, [query])

  function navigateToResult(result: SearchResult) {
    navigate(resultRoute(result))
    closePalette()
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      navigateToResult(results[selectedIndex])
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[18vh] bg-black/40 backdrop-blur-sm"
      onClick={closePalette}
    >
      <div
        className="w-full max-w-lg bg-[var(--color-bg)] border border-[var(--color-border-subtle)] rounded-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--color-border-subtle)]">
          <Search size={18} className="text-[var(--color-muted)] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search agents, skills, workflows, teams..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-muted)]"
          />
          <kbd className="text-xs text-[var(--color-muted)] px-1.5 py-0.5 rounded border border-[var(--color-border-subtle)] shrink-0">
            esc
          </kbd>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="max-h-72 overflow-y-auto py-1.5">
            {results.map((result, i) => {
              const cfg = TYPE_CONFIG[result.type]
              const IconComponent = cfg.Icon
              return (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={() => navigateToResult(result)}
                  className={`w-full px-4 py-2.5 text-left flex items-center gap-3 text-sm transition-colors ${
                    i === selectedIndex
                      ? 'bg-[var(--color-surface-raised)]'
                      : 'hover:bg-[var(--color-surface-raised)]/60'
                  }`}
                >
                  {/* Entity icon */}
                  <div className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${cfg.bg}`}>
                    {result.icon ? (
                      <span className="text-base leading-none" aria-hidden="true">{result.icon}</span>
                    ) : (
                      <IconComponent size={15} className={cfg.color} />
                    )}
                  </div>

                  {/* Name + description */}
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-[var(--color-text)] truncate">
                      {result.title || result.name}
                    </p>
                    <p className="text-xs text-[var(--color-muted)] truncate">{result.description}</p>
                  </div>

                  {/* Type + module badges */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {result.module && (
                      <span className="text-xs text-[var(--color-muted)] font-[var(--font-mono)]">
                        {result.module}
                      </span>
                    )}
                    <span className={`text-xs px-1.5 py-0.5 rounded font-bold uppercase ${cfg.color} ${cfg.bg}`}>
                      {cfg.label}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {/* Empty state */}
        {query.trim() && results.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-[var(--color-muted)]">
            No results for <strong className="text-[var(--color-text)]">"{query}"</strong>
          </div>
        )}

        {/* Idle hint */}
        {!query && (
          <div className="px-4 py-4 flex items-center justify-between text-xs text-[var(--color-muted)]">
            <span>Search across agents, skills, workflows, and teams</span>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded border border-[var(--color-border-subtle)]">↑↓</kbd>
                navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded border border-[var(--color-border-subtle)]">↵</kbd>
                open
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
