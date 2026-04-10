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
  Briefcase,
  Package,
  FolderTree,
  BookOpen,
  Settings,
  Moon,
  Sun,
  Info,
} from 'lucide-react'

import { toggleTheme } from '../lib/theme.js'
import { useThemeStore } from '../stores/ui-store.js'
import { useWebSocket } from '../hooks/use-websocket.js'
import { useAppTitle } from '../hooks/use-app-title.js'

const navItems: Array<{
  to: string
  label: string
  icon: typeof Users
  badgeKey?: string
}> = [
  { to: '/', label: 'Overview', icon: LayoutDashboard },
  { to: '/agents', label: 'Agents', icon: Users, badgeKey: 'agents' },
  { to: '/teams', label: 'Teams', icon: UsersRound, badgeKey: 'teams' },
  { to: '/skills', label: 'Skills', icon: Zap, badgeKey: 'skills' },
  { to: '/workflows', label: 'Workflows', icon: GitBranch, badgeKey: 'workflows' },
  { to: '/connections', label: 'Data Sources', icon: Plug, badgeKey: 'connections' },
  { to: '/workspace', label: 'Workspace', icon: Briefcase },
  { to: '/modules', label: 'Modules', icon: Package, badgeKey: 'modules' },
]

const utilityItems: Array<{
  to: string
  label: string
  icon: typeof Users
  badgeKey?: string
}> = [
  { to: '/outputs', label: 'Outputs', icon: FileOutput },
  { to: '/commands', label: 'Commands', icon: BookOpen },
  { to: '/settings', label: 'Settings', icon: Settings },
  { to: '/files', label: 'Files', icon: FolderTree },
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
  }, [fetchBadgeCounts])

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

  return (
    <aside className="w-60 h-screen flex flex-col border-r border-[var(--color-border-subtle)] bg-[var(--color-bg)]">
      <div className="px-4 py-5">
        <h1 className="text-lg font-extrabold text-[var(--color-text)]">{appTitle}</h1>
      </div>

      <nav className="flex-1 px-2 space-y-1">
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
