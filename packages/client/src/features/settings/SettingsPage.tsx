import { useEffect, useState } from 'react'
import { Zap } from 'lucide-react'

import { useThemeStore } from '../../stores/ui-store.js'
import { toggleTheme } from '../../lib/theme.js'
import { useNotifications } from '../../layout/NotificationProvider.js'
import { useProjectMode } from '../../lib/use-project-mode.js'

type Settings = {
  port: number
  theme: 'dark' | 'light'
  registry?: { repo: string; branch: string }
  logging?: { enabled: boolean; level?: string }
}

export function SettingsPage() {
  const theme = useThemeStore((s) => s.theme)
  const setThemeState = useThemeStore((s) => s.setTheme)
  const { notify } = useNotifications()
  const { isV65, isLoading: modeLoading } = useProjectMode()
  const [, setSettings] = useState<Settings>({ port: 4040, theme: 'dark' })
  const [loading, setLoading] = useState(true)
  const [port, setPort] = useState('4040')
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [registryRepo, setRegistryRepo] = useState('')
  const [registryBranch, setRegistryBranch] = useState('main')
  const [savingRegistry, setSavingRegistry] = useState(false)
  const [loggingEnabled, setLoggingEnabled] = useState(false)
  const [loggingLevel, setLoggingLevel] = useState('info')
  const [savingLogging, setSavingLogging] = useState(false)

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((d) => {
        const data = d as Settings
        setSettings(data)
        setPort(String(data.port ?? 4040))
        if (data.registry) {
          setRegistryRepo(data.registry.repo ?? '')
          setRegistryBranch(data.registry.branch ?? 'main')
        }
        if (data.logging) {
          setLoggingEnabled(data.logging.enabled ?? false)
          setLoggingLevel(data.logging.level ?? 'info')
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  function handleToggleTheme() {
    const next = toggleTheme()
    setThemeState(next)
    setDirty(true)
  }

  function handlePortChange(value: string) {
    setPort(value)
    setDirty(true)
  }

  async function handleSave() {
    setSaving(true)
    const portNum = parseInt(port, 10)
    if (isNaN(portNum) || portNum < 1024 || portNum > 65535) {
      notify('error', 'Port must be between 1024 and 65535')
      setSaving(false)
      return
    }

    try {
      const resp = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ port: portNum, theme }),
      })
      if (resp.ok) {
        setSettings({ port: portNum, theme })
        setDirty(false)
        notify('success', 'Settings saved')
      } else {
        notify('error', 'Failed to save settings')
      }
    } catch {
      notify('error', 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveRegistry() {
    setSavingRegistry(true)
    try {
      const resp = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registry: { repo: registryRepo.trim(), branch: registryBranch.trim() || 'main' },
        }),
      })
      if (resp.ok) {
        notify('success', 'Registry settings saved')
      } else {
        notify('error', 'Failed to save registry settings')
      }
    } catch {
      notify('error', 'Failed to save registry settings')
    } finally {
      setSavingRegistry(false)
    }
  }

  async function handleSaveLogging() {
    setSavingLogging(true)
    try {
      const resp = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          logging: { enabled: loggingEnabled, level: loggingLevel },
        }),
      })
      if (resp.ok) {
        notify('success', 'Logging settings saved — restart the server to apply')
      } else {
        notify('error', 'Failed to save logging settings')
      }
    } catch {
      notify('error', 'Failed to save logging settings')
    } finally {
      setSavingLogging(false)
    }
  }

  if (loading)
    return (
      <div>
        <h1 className="text-2xl font-extrabold mb-8">Project Preferences</h1>
        <div className="h-32 rounded-lg bg-[var(--color-surface-raised)] animate-pulse" />
      </div>
    )

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-extrabold">Project Preferences</h1>
        <button
          onClick={handleSave}
          disabled={!dirty || saving}
          className="px-4 py-2 text-sm font-bold rounded-md bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>

      {!modeLoading && (
        <div className="mb-6 flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 rounded-md border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/5 px-3 py-2">
            <Zap size={12} className="text-[var(--color-accent)]" />
            <span className="text-xs font-bold text-[var(--color-accent)] uppercase tracking-wider">
              {isV65 ? 'BMAD v6.5' : 'BMAD v6'}
            </span>
            <span className="text-xs text-[var(--color-muted)]">
              — {isV65 ? 'Entity-based configuration active' : 'Classic configuration'}
            </span>
          </div>
        </div>
      )}

      <section className="mb-8">
        <h2 className="text-lg font-bold mb-4">Studio</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-[var(--color-surface-raised)]">
            <div>
              <p className="text-sm font-bold">Theme</p>
              <p className="text-xs text-[var(--color-muted)]">
                Toggle between dark and light mode
              </p>
            </div>
            <button
              onClick={handleToggleTheme}
              className="px-3 py-1.5 text-sm rounded-md border border-[var(--color-border-subtle)] hover:bg-[var(--color-bg)] transition-colors"
            >
              {theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
            </button>
          </div>
          <div className="flex items-center justify-between p-4 rounded-lg bg-[var(--color-surface-raised)]">
            <div>
              <p className="text-sm font-bold">Port</p>
              <p className="text-xs text-[var(--color-muted)]">
                Server port (requires restart)
              </p>
            </div>
            <input
              type="number"
              value={port}
              onChange={(e) => handlePortChange(e.target.value)}
              min={1024}
              max={65535}
              className="w-24 px-3 py-1.5 text-sm text-right rounded-md bg-[var(--color-bg)] border border-[var(--color-border-subtle)] text-[var(--color-text)] font-[var(--font-mono)] outline-none focus:border-[var(--color-accent)]"
            />
          </div>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-bold mb-4">Module Registry</h2>
        <div className="space-y-4">
          <p className="text-sm text-[var(--color-muted)] px-4">
            Configure a GitHub repo as your team's module registry. Browse and install shared modules from the Registry tab on the Modules page.
          </p>
          <div className="flex items-center justify-between p-4 rounded-lg bg-[var(--color-surface-raised)]">
            <div>
              <p className="text-sm font-bold">Repository</p>
              <p className="text-xs text-[var(--color-muted)]">GitHub repo in owner/repo format</p>
            </div>
            <input
              type="text"
              value={registryRepo}
              onChange={(e) => setRegistryRepo(e.target.value)}
              placeholder="owner/repo"
              className="w-56 px-3 py-1.5 text-sm rounded-md bg-[var(--color-bg)] border border-[var(--color-border-subtle)] text-[var(--color-text)] font-[var(--font-mono)] outline-none focus:border-[var(--color-accent)]"
            />
          </div>
          <div className="flex items-center justify-between p-4 rounded-lg bg-[var(--color-surface-raised)]">
            <div>
              <p className="text-sm font-bold">Branch</p>
              <p className="text-xs text-[var(--color-muted)]">Default: main</p>
            </div>
            <input
              type="text"
              value={registryBranch}
              onChange={(e) => setRegistryBranch(e.target.value)}
              placeholder="main"
              className="w-32 px-3 py-1.5 text-sm rounded-md bg-[var(--color-bg)] border border-[var(--color-border-subtle)] text-[var(--color-text)] font-[var(--font-mono)] outline-none focus:border-[var(--color-accent)]"
            />
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleSaveRegistry}
              disabled={!registryRepo.trim() || savingRegistry}
              className="px-4 py-2 text-sm font-bold rounded-md bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {savingRegistry ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-bold mb-4">Logging</h2>
        <div className="space-y-4">
          <p className="text-sm text-[var(--color-muted)] px-4">
            Write server logs to <code className="font-[var(--font-mono)]">.bmad-studio/logs/studio.log</code> in your project. Useful for debugging install failures and module errors. Changes take effect after restarting the server.
          </p>
          <div className="flex items-center justify-between p-4 rounded-lg bg-[var(--color-surface-raised)]">
            <div>
              <p className="text-sm font-bold">Enable file logging</p>
              <p className="text-xs text-[var(--color-muted)]">Append all server logs to the log file</p>
            </div>
            <button
              onClick={() => setLoggingEnabled(!loggingEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                loggingEnabled ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-border-subtle)]'
              }`}
              role="switch"
              aria-checked={loggingEnabled}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  loggingEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          <div className="flex items-center justify-between p-4 rounded-lg bg-[var(--color-surface-raised)]">
            <div>
              <p className="text-sm font-bold">Log level</p>
              <p className="text-xs text-[var(--color-muted)]">Minimum severity to log</p>
            </div>
            <select
              value={loggingLevel}
              onChange={(e) => setLoggingLevel(e.target.value)}
              disabled={!loggingEnabled}
              className="px-3 py-1.5 text-sm rounded-md bg-[var(--color-bg)] border border-[var(--color-border-subtle)] text-[var(--color-text)] outline-none focus:border-[var(--color-accent)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="trace">trace (very verbose)</option>
              <option value="debug">debug</option>
              <option value="info">info (recommended)</option>
              <option value="warn">warn</option>
              <option value="error">error only</option>
            </select>
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleSaveLogging}
              disabled={savingLogging}
              className="px-4 py-2 text-sm font-bold rounded-md bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {savingLogging ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-bold mb-4">Project</h2>
        <div className="p-4 rounded-lg bg-[var(--color-surface-raised)]">
          <p className="text-sm text-[var(--color-muted)]">
            Project settings are configured via <code className="font-[var(--font-mono)]">_bmad/config.yaml</code>
          </p>
        </div>
      </section>
    </div>
  )
}
