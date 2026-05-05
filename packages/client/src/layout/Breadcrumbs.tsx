import { useLocation, Link } from 'react-router-dom'
import { Search } from 'lucide-react'

const routeLabels: Record<string, string> = {
  agents: 'Agents',
  teams: 'Teams',
  skills: 'Skills',
  workflows: 'Workflows',
  outputs: 'Outputs',
  connections: 'Connections',
  workspace: 'Project Context',
  'project-context': 'Project Context',
  modules: 'Modules',
  packages: 'Packages',
  files: 'Files',
  settings: 'Settings',
  wiki: 'Wiki',
}

function SearchButton() {
  return (
    <button
      onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }))}
      className="p-1.5 rounded-md text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-raised)] transition-colors"
      title="Search (⌘K)"
      aria-label="Search"
    >
      <Search size={16} />
    </button>
  )
}

export function Breadcrumbs() {
  const location = useLocation()
  const segments = location.pathname.split('/').filter(Boolean)

  // Always render the header bar for the search icon, even on home
  return (
    <div className="flex items-center justify-between mb-4">
      <nav aria-label="Breadcrumb" className="text-sm text-[var(--color-muted)]">
        {segments.length > 0 ? (
          <ol className="flex items-center gap-1">
            <li>
              <Link to="/" className="hover:text-[var(--color-text)] transition-colors">
                Home
              </Link>
            </li>
            {segments.map((segment, i) => {
              const path = '/' + segments.slice(0, i + 1).join('/')
              const label = routeLabels[segment] || segment
              const isLast = i === segments.length - 1

              return (
                <li key={path} className="flex items-center gap-1">
                  <span className="text-[var(--color-border-subtle)]">/</span>
                  {isLast ? (
                    <span className="text-[var(--color-text)]">{label}</span>
                  ) : (
                    <Link to={path} className="hover:text-[var(--color-text)] transition-colors">
                      {label}
                    </Link>
                  )}
                </li>
              )
            })}
          </ol>
        ) : (
          <span />
        )}
      </nav>
      <SearchButton />
    </div>
  )
}
