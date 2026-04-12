import { NavLink } from 'react-router-dom'
import { useEffect, useState, useCallback, useRef } from 'react'
import {
  LayoutDashboard,
  Users,
  UsersRound,
  Zap,
  GitBranch,
  FileOutput,
  Plug,
  Package,
  FolderTree,
  BookOpen,
  Settings,
  Moon,
  Sun,
  Info,
  FolderOpen,
  ChevronDown,
  Terminal,
  Layers,
} from 'lucide-react'

import { toggleTheme } from '../lib/theme.js'
import { useThemeStore } from '../stores/ui-store.js'
import { useWebSocket } from '../hooks/use-websocket.js'
import { useAppTitle } from '../hooks/use-app-title.js'

type ProjectEntry = { path: string; name: string; lastOpened: string }

const navItems: Array<{
  to: string
  label: string
  icon: typeof Users
  badgeKey?: string
}> = [
  { to: '/', label: 'Home', icon: LayoutDashboard },
  { to: '/outputs', label: 'Outputs', icon: FileOutput },
  { to: '/agents', label: 'Agents', icon: Users, badgeKey: 'agents' },
  { to: '/teams', label: 'Teams', icon: UsersRound, badgeKey: 'teams' },
  { to: '/skills', label: 'Skills', icon: Zap, badgeKey: 'skills' },
  { to: '/workflows', label: 'Workflows', icon: GitBranch, badgeKey: 'workflows' },
  { to: '/toolkit', label: 'Toolkit', icon: Layers },
  { to: '/connections', label: 'Data Sources', icon: Plug, badgeKey: 'connections' },
  { to: '/modules', label: 'Modules', icon: Package, badgeKey: 'modules' },
]

const utilityItems: Array<{
  to: string
  label: string
  icon: typeof Users
  badgeKey?: string
}> = [
  { to: '/commands', label: 'Commands', icon: BookOpen },
  { to: '/files', label: 'Files', icon: FolderTree },
  { to: '/settings', label: 'Settings', icon: Settings },
]

function NavItem({
  to,
  label,
  icon: Icon,
  badge,
}: {
  to: string
  label: string
  icon: typeof Users
  badge?: number
}) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2 min-h-[44px] rounded-md text-sm transition-colors ${
          isActive
            ? 'text-[var(--color-accent)] font-bold bg-[var(--color-surface-raised)]'
            : 'text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-raised)]'
        }`
      }
    >
      <Icon size={18} />
      <span className="flex-1">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)]">
          {badge}
        </span>
      )}
    </NavLink>
  )
}

export function Sidebar() {
  const theme = useThemeStore((s) => s.theme)
  const setTheme = useThemeStore((s) => s.setTheme)
  const [badgeCounts, setBadgeCounts] = useState<Record<string, number>>({})
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [currentProject, setCurrentProject] = useState<{ name: string | null; path: string | null } | null>(null)
  const [allProjects, setAllProjects] = useState<ProjectEntry[]>([])
  const [showProjectMenu, setShowProjectMenu] = useState(false)
  const projectMenuRef = useRef<HTMLDivElement>(null)

  const fetchBadgeCounts = useCallback(() => {
    Promise.all([
      fetch('/api/overview').then((r) => r.json()).catch(() => null),
      fetch('/api/modules').then((r) => r.json()).catch(() => null),
    ]).then(([overview, modules]) => {
      const counts: Record<string, number> = {}
      if (overview?.sections) {
        counts.agents = overview.sections.team?.count ?? 0
        counts.teams = overview.sections.teams?.count ?? 0
        counts.skills = overview.sections.toolkit?.count ?? 0
        counts.workflows = overview.sections.process?.count ?? 0
        counts.connections = overview.sections.ideConfigs?.count ?? 0
      }
      if (Array.isArray(modules)) {
        counts.modules = modules.length
      }
      setBadgeCounts(counts)
    })
  }, [])

  useEffect(() => {
    fetchBadgeCounts()
    Promise.all([
      fetch('/api/project').then((r) => r.json()).catch(() => null),
      fetch('/api/projects').then((r) => r.json()).catch(() => []),
    ]).then(([proj, projects]) => {
      if (proj) setCurrentProject(proj as { name: string | null; path: string | null })
      if (Array.isArray(projects)) setAllProjects(projects as ProjectEntry[])
    })
  }, [fetchBadgeCounts])

  // Close project menu on outside click
  useEffect(() => {
    if (!showProjectMenu) return
    function handleClick(e: MouseEvent) {
      if (projectMenuRef.current && !projectMenuRef.current.contains(e.target as Node)) {
        setShowProjectMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showProjectMenu])

  useWebSocket(
    useCallback(() => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(fetchBadgeCounts, 200)
    }, [fetchBadgeCounts]),
  )

  const appTitle = useAppTitle()

  function handleToggleTheme() {
    const next = toggleTheme()
    setTheme(next)
  }

  const otherProjects = allProjects.filter((p) => p.path !== currentProject?.path)

  return (
    <aside className="w-60 h-screen flex flex-col border-r border-[var(--color-border-subtle)] bg-[var(--color-bg)]">
      <div className="px-4 py-4 border-b border-[var(--color-border-subtle)]">
        <h1 className="text-base font-extrabold text-[var(--color-text)] mb-1">{appTitle}</h1>
        {currentProject?.name && (
          <div className="relative" ref={projectMenuRef}>
            <button
              onClick={() => setShowProjectMenu((v) => !v)}
              className="flex items-center gap-1.5 text-xs text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors max-w-full"
              title={currentProject.path ?? undefined}
            >
              <FolderOpen size={12} className="shrink-0" />
              <span className="truncate">{currentProject.name}</span>
              {otherProjects.length > 0 && <ChevronDown size={11} className="shrink-0" />}
            </button>

            {showProjectMenu && otherProjects.length > 0 && (
              <div className="absolute left-0 top-full mt-1 w-56 bg-[var(--color-bg)] border border-[var(--color-border-subtle)] rounded-lg shadow-xl z-50 overflow-hidden">
                <div className="px-3 py-2 border-b border-[var(--color-border-subtle)]">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]">Switch Project</p>
                </div>
                {otherProjects.slice(0, 5).map((p) => (
                  <div key={p.path} className="px-3 py-2 hover:bg-[var(--color-surface-raised)] transition-colors">
                    <p className="text-xs font-bold text-[var(--color-text)] truncate">{p.name}</p>
                    <p className="text-[10px] text-[var(--color-muted)] truncate mt-0.5" title={p.path}>{p.path}</p>
                    <div className="flex items-center gap-1 mt-1.5">
                      <Terminal size={10} className="text-[var(--color-muted)] shrink-0" />
                      <code className="text-[10px] font-[var(--font-mono)] text-[var(--color-muted)] truncate">
                        cd {p.path} &amp;&amp; npx bmad-studio
                      </code>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <nav className="flex-1 px-2 space-y-1 overflow-y-auto" aria-label="Main navigation">
        {navItems.map((item) => (
          <NavItem
            key={item.to}
            to={item.to}
            label={item.label}
            icon={item.icon}
            badge={item.badgeKey ? badgeCounts[item.badgeKey] : undefined}
          />
        ))}

        <div className="my-3 border-t border-[var(--color-border-subtle)]" />

        {utilityItems.map((item) => (
          <NavItem key={item.to} {...item} />
        ))}
      </nav>

      <div className="px-3 py-3 border-t border-[var(--color-border-subtle)] space-y-1">
        <NavLink
          to="/about"
          className={({ isActive }) =>
            `flex items-center gap-2 px-3 py-2 min-h-[44px] w-full rounded-md text-sm transition-colors ${
              isActive
                ? 'text-[var(--color-accent)] font-bold bg-[var(--color-surface-raised)]'
                : 'text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-raised)]'
            }`
          }
        >
          <Info size={18} />
          <span>About</span>
        </NavLink>
        <button
          onClick={handleToggleTheme}
          className="flex items-center gap-2 px-3 py-2 min-h-[44px] w-full rounded-md text-sm text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-raised)] transition-colors"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
        </button>
      </div>
    </aside>
  )
}
