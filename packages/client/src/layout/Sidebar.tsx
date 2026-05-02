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
  Loader2,
  Layers,
} from 'lucide-react'

import type { WebSocketEvent } from '@bmad-studio/shared'
import { toggleTheme } from '../lib/theme.js'
import { useThemeStore } from '../stores/ui-store.js'
import { useWebSocket } from '../hooks/use-websocket.js'
import { useAppTitle } from '../hooks/use-app-title.js'
import { useProjectMode } from '../lib/use-project-mode.js'

type ProjectEntry = { path: string; name: string; lastOpened: string }

type NavItem = { to: string; label: string; icon: typeof Users; badgeKey?: string }
type NavGroup = { label: string; icon: typeof Users; items: NavItem[] }

const topItems: NavItem[] = [
  { to: '/', label: 'Home', icon: LayoutDashboard },
]

const outputsGroup: NavGroup = {
  label: 'Outputs',
  icon: FileOutput,
  items: [
    { to: '/outputs', label: 'Browse All', icon: FileOutput },
  ],
}

const toolkitGroupV6: NavGroup = {
  label: 'Toolkit',
  icon: Layers,
  items: [
    { to: '/toolkit', label: 'View All', icon: Layers },
    { to: '/agents', label: 'Agents', icon: Users, badgeKey: 'agents' },
    { to: '/commands', label: 'Agent Triggers', icon: BookOpen },
    { to: '/teams', label: 'Teams', icon: UsersRound, badgeKey: 'teams' },
    { to: '/skills', label: 'Skills', icon: Zap, badgeKey: 'skills' },
    { to: '/workflows', label: 'Workflows', icon: GitBranch, badgeKey: 'workflows' },
  ],
}

const toolkitGroupV65: NavGroup = {
  label: 'Toolkit',
  icon: Layers,
  items: [
    { to: '/agents', label: 'Agents', icon: Users, badgeKey: 'agents' },
    { to: '/workflows', label: 'Workflows', icon: GitBranch, badgeKey: 'workflows' },
    { to: '/teams', label: 'Teams', icon: UsersRound, badgeKey: 'teams' },
    { to: '/commands', label: 'Agent Triggers', icon: BookOpen },
    { to: '/skills', label: 'Skills (compiled)', icon: Zap, badgeKey: 'skills' },
    { to: '/toolkit', label: 'IDE View', icon: Layers },
  ],
}

const settingsGroup: NavGroup = {
  label: 'Settings',
  icon: Settings,
  items: [
    { to: '/settings', label: 'Preferences', icon: Settings },
    { to: '/modules', label: 'Modules', icon: Package, badgeKey: 'modules' },
    { to: '/connections', label: 'IDE Connections', icon: Plug, badgeKey: 'connections' },
    { to: '/files', label: 'All Files', icon: FolderTree },
  ],
}

function NavItemComponent({
  to,
  label,
  icon: Icon,
  badge,
  indent = false,
}: {
  to: string
  label: string
  icon: typeof Users
  badge?: number
  indent?: boolean
}) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        `flex items-center gap-3 ${indent ? 'pl-8 pr-3' : 'px-3'} py-2 min-h-[36px] rounded-md text-sm transition-colors ${
          isActive
            ? 'text-[var(--color-accent)] font-bold bg-[var(--color-surface-raised)]'
            : 'text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-raised)]'
        }`
      }
    >
      <Icon size={indent ? 15 : 18} />
      <span className="flex-1">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)]">
          {badge}
        </span>
      )}
    </NavLink>
  )
}

function NavGroupComponent({
  group,
  badgeCounts,
}: {
  group: NavGroup
  badgeCounts: Record<string, number>
}) {
  const [expanded, setExpanded] = useState(true)
  const Icon = group.icon

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-3 py-2 min-h-[36px] rounded-md text-xs font-bold uppercase tracking-wider text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors cursor-pointer"
      >
        <Icon size={16} />
        <span className="flex-1 text-left">{group.label}</span>
        <ChevronDown size={12} className={`transition-transform ${expanded ? '' : '-rotate-90'}`} />
      </button>
      {expanded && (
        <div className="space-y-0.5">
          {group.items.map((item) => (
            <NavItemComponent
              key={item.to}
              to={item.to}
              label={item.label}
              icon={item.icon}
              badge={item.badgeKey ? badgeCounts[item.badgeKey] : undefined}
              indent
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function Sidebar() {
  const theme = useThemeStore((s) => s.theme)
  const setTheme = useThemeStore((s) => s.setTheme)
  const [badgeCounts, setBadgeCounts] = useState<Record<string, number>>({})
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { isV65 } = useProjectMode()
  const toolkitGroup = isV65 ? toolkitGroupV65 : toolkitGroupV6
  const [currentProject, setCurrentProject] = useState<{ name: string | null; path: string | null } | null>(null)
  const [allProjects, setAllProjects] = useState<ProjectEntry[]>([])
  const [showProjectMenu, setShowProjectMenu] = useState(false)
  const [switching, setSwitching] = useState(false)
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
    useCallback((event: WebSocketEvent) => {
      if (event.type === 'project:switched') {
        // Refresh everything after a project switch
        setCurrentProject({ name: event.projectName, path: event.projectRoot })
        setSwitching(false)
        fetchBadgeCounts()
        // Reload the page to clear all component state
        window.location.href = '/'
        return
      }
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(fetchBadgeCounts, 200)
    }, [fetchBadgeCounts]),
  )

  async function handleSwitchProject(projectPath: string) {
    if (!confirm('Switch project? Any unsaved changes will be lost.')) return
    setSwitching(true)
    setShowProjectMenu(false)
    try {
      const resp = await fetch('/api/project/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: projectPath }),
      })
      if (!resp.ok) {
        const data = await resp.json().catch(() => ({})) as { message?: string }
        alert(data.message ?? 'Failed to switch project')
        setSwitching(false)
      }
      // Success handled by WebSocket project:switched event
    } catch {
      alert('Failed to switch project')
      setSwitching(false)
    }
  }

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
              disabled={switching}
              className="flex items-center gap-1.5 text-xs text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors max-w-full"
              title={currentProject.path ?? undefined}
            >
              {switching ? (
                <Loader2 size={12} className="shrink-0 animate-spin" />
              ) : (
                <FolderOpen size={12} className="shrink-0" />
              )}
              <span className="truncate">{switching ? 'Switching...' : currentProject.name}</span>
              {!switching && otherProjects.length > 0 && <ChevronDown size={11} className="shrink-0" />}
            </button>

            {showProjectMenu && !switching && otherProjects.length > 0 && (
              <div className="absolute left-0 top-full mt-1 w-56 bg-[var(--color-bg)] border border-[var(--color-border-subtle)] rounded-lg shadow-xl z-50 overflow-hidden">
                <div className="px-3 py-2 border-b border-[var(--color-border-subtle)]">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]">Switch Project</p>
                </div>
                {otherProjects.slice(0, 5).map((p) => (
                  <button
                    key={p.path}
                    onClick={() => handleSwitchProject(p.path)}
                    className="w-full text-left px-3 py-2.5 hover:bg-[var(--color-surface-raised)] transition-colors cursor-pointer"
                  >
                    <p className="text-xs font-bold text-[var(--color-text)] truncate">{p.name}</p>
                    <p className="text-[10px] text-[var(--color-muted)] truncate mt-0.5" title={p.path}>{p.path}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto pt-1" aria-label="Main navigation">
        {topItems.map((item) => (
          <NavItemComponent
            key={item.to}
            to={item.to}
            label={item.label}
            icon={item.icon}
            badge={item.badgeKey ? badgeCounts[item.badgeKey] : undefined}
          />
        ))}

        <div className="my-2 border-t border-[var(--color-border-subtle)]" />
        <NavGroupComponent group={outputsGroup} badgeCounts={badgeCounts} />

        <div className="my-2 border-t border-[var(--color-border-subtle)]" />
        <NavGroupComponent group={toolkitGroup} badgeCounts={badgeCounts} />

        <div className="my-2 border-t border-[var(--color-border-subtle)]" />
        <NavGroupComponent group={settingsGroup} badgeCounts={badgeCounts} />
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
