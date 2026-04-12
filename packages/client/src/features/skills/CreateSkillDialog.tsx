import { useState, useEffect, useCallback } from 'react'
import { Plus, X, Upload } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'

import { MarkdownEditor } from '../../shared/markdown-editor/MarkdownEditor.js'

type CreateSkillDialogProps = {
  onClose: () => void
  onCreated: () => void
}

type ModuleOption = { name: string }

function escapeYamlStr(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

function generateSkillMarkdown(
  name: string,
  description: string,
  bestFor: string[],
  content: string,
): string {
  const lines = ['---', `name: ${name}`]
  if (description) lines.push(`description: "${escapeYamlStr(description)}"`)
  if (bestFor.length > 0) {
    lines.push('best_for:')
    for (const role of bestFor) {
      lines.push(`  - "${escapeYamlStr(role.trim())}"`)
    }
  }
  lines.push('---', '', content || '# Skill Instructions\n\n<!-- Add skill instructions here -->')
  return lines.join('\n')
}

const KEBAB_RE = /^[a-z][a-z0-9-]*$/

export function CreateSkillDialog({ onClose, onCreated }: CreateSkillDialogProps) {
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<'create' | 'import'>('create')

  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [bestForInput, setBestForInput] = useState('')
  const [moduleName, setModuleName] = useState('')
  const [skillContent, setSkillContent] = useState('')
  const [nameBlurred, setNameBlurred] = useState(false)

  // Import state
  const [importUrl, setImportUrl] = useState('')

  // Shared state
  const [modules, setModules] = useState<ModuleOption[]>([])
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetch('/api/modules')
      .then((r) => r.json())
      .then((data) => {
        const mods = data as Array<{ name: string }>
        setModules(mods.map((m) => ({ name: m.name })))
        if (mods.length === 1) setModuleName(mods[0].name)
      })
      .catch(() => {})
  }, [])

  const nameValid = name.length === 0 || KEBAB_RE.test(name)
  const bestFor = bestForInput
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  const canSubmit = name.trim().length > 0 && KEBAB_RE.test(name) && moduleName.length > 0

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = () => {
        const text = reader.result as string
        // Try to parse frontmatter
        const fmMatch = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
        if (fmMatch) {
          const fm = fmMatch[1]
          const body = fmMatch[2]
          const nameMatch = fm.match(/^name:\s*(.+)$/m)
          const descMatch = fm.match(/^description:\s*"?(.+?)"?$/m)
          const bestForMatch = fm.match(/^best_for:\s*\n((?:\s+-\s+.+\n?)*)/m)
          if (nameMatch) setName(nameMatch[1].trim())
          if (descMatch) setDescription(descMatch[1].trim())
          if (bestForMatch) {
            const roles = bestForMatch[1]
              .split('\n')
              .map((l) => l.replace(/^\s+-\s+/, '').trim())
              .filter(Boolean)
            setBestForInput(roles.join(', '))
          }
          setSkillContent(body.trim())
        } else {
          setSkillContent(text)
        }
        setTab('create')
      }
      reader.readAsText(file)
    },
    [],
  )

  const handleCreate = async () => {
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)
    try {
      const markdown = generateSkillMarkdown(name.trim(), description.trim(), bestFor, skillContent)
      const resp = await fetch(`/api/modules/${encodeURIComponent(moduleName)}/entities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'skill',
          name: name.trim(),
          content: markdown,
        }),
      })
      if (!resp.ok) {
        const data = (await resp.json()) as { error?: { message?: string } }
        throw new Error(data.error?.message ?? 'Failed to create skill')
      }
      await queryClient.invalidateQueries({ queryKey: ['skills'] })
      onCreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create skill')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-skill-title"
        className="relative bg-[var(--color-bg)] border border-[var(--color-border-subtle)] rounded-lg shadow-xl w-full max-w-2xl p-6 max-h-[85vh] flex flex-col"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 id="create-skill-title" className="text-lg font-bold">New Skill</h2>
          <button
            onClick={onClose}
            className="text-[var(--color-muted)] hover:text-[var(--color-text)]"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-4 bg-[var(--color-surface-raised)] rounded-md p-0.5 self-start">
          <button
            onClick={() => setTab('create')}
            className={`px-3 py-1.5 text-sm rounded min-h-[32px] transition-colors ${
              tab === 'create'
                ? 'bg-[var(--color-bg)] text-[var(--color-text)] font-bold shadow-sm'
                : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
            }`}
          >
            Create
          </button>
          <button
            onClick={() => setTab('import')}
            className={`px-3 py-1.5 text-sm rounded min-h-[32px] transition-colors ${
              tab === 'import'
                ? 'bg-[var(--color-bg)] text-[var(--color-text)] font-bold shadow-sm'
                : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
            }`}
          >
            Import
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto flex-1 pr-1">
          {tab === 'import' && (
            <>
              {/* File upload */}
              <div>
                <label className="block text-sm font-bold mb-1">Upload .md file</label>
                <label className="flex items-center justify-center gap-2 w-full px-4 py-6 border-2 border-dashed border-[var(--color-border-subtle)] rounded-lg cursor-pointer hover:border-[var(--color-accent)] transition-colors">
                  <Upload size={16} className="text-[var(--color-muted)]" />
                  <span className="text-sm text-[var(--color-muted)]">Click to upload or drag a .md file</span>
                  <input
                    type="file"
                    accept=".md"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* URL import */}
              <div>
                <label className="block text-sm font-bold mb-1">Or paste URL</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={importUrl}
                    onChange={(e) => setImportUrl(e.target.value)}
                    placeholder="https://raw.githubusercontent.com/..."
                    className="flex-1 px-3 py-2 text-sm rounded-md bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)] focus:border-[var(--color-accent)] focus:outline-none"
                  />
                  <button
                    onClick={async () => {
                      if (!importUrl) return
                      try {
                        const parsedUrl = new URL(importUrl)
                        if (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') {
                          setError('URL must start with http:// or https://')
                          return
                        }
                      } catch {
                        setError('Invalid URL')
                        return
                      }
                      try {
                        const resp = await fetch(importUrl)
                        if (resp.ok) {
                          const text = await resp.text()
                          const fakeEvent = { target: { files: [new File([text], 'import.md')] } } as unknown as React.ChangeEvent<HTMLInputElement>
                          handleFileUpload(fakeEvent)
                        }
                      } catch {
                        setError('Failed to fetch URL')
                      }
                    }}
                    disabled={!importUrl}
                    className="px-3 py-2 text-sm rounded-md bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)] hover:bg-[var(--color-accent)] hover:text-white transition-colors disabled:opacity-50"
                  >
                    Fetch
                  </button>
                </div>
              </div>

              <p className="text-xs text-[var(--color-muted)]">
                Uploading or fetching will parse the file and switch to the Create tab with fields pre-populated.
              </p>
            </>
          )}

          {tab === 'create' && (
            <>
              {/* Name */}
              <div>
                <label className="block text-xs font-bold mb-1">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={() => setNameBlurred(true)}
                  placeholder="e.g. advanced-elicitation"
                  className="w-full px-3 py-2 text-sm rounded-md bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)] focus:border-[var(--color-accent)] focus:outline-none"
                />
                {nameBlurred && !nameValid && (
                  <p className="text-xs text-[var(--color-error)] mt-1">
                    Name must be kebab-case (e.g., my-skill-name)
                  </p>
                )}
              </div>

              {/* Parent Module — above the fold per UX-DR4 */}
              <div>
                <label className="block text-xs font-bold mb-1">Parent Module</label>
                <select
                  value={moduleName}
                  onChange={(e) => setModuleName(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-md bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)] focus:border-[var(--color-accent)] focus:outline-none"
                >
                  <option value="">Select a module...</option>
                  {modules.map((m) => (
                    <option key={m.name} value={m.name}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What does this skill enable?"
                  rows={2}
                  className="w-full px-3 py-2 text-sm rounded-md bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)] focus:border-[var(--color-accent)] focus:outline-none resize-none"
                />
              </div>

              {/* Best for */}
              <div>
                <label className="block text-xs font-bold mb-1">Best for (optional)</label>
                <input
                  type="text"
                  value={bestForInput}
                  onChange={(e) => setBestForInput(e.target.value)}
                  placeholder="e.g. pm, analyst, architect (comma-separated)"
                  className="w-full px-3 py-2 text-sm rounded-md bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)] focus:border-[var(--color-accent)] focus:outline-none"
                />
              </div>

              {/* Skill content editor */}
              <div>
                <label className="block text-sm font-bold mb-1">Skill Content</label>
                <div className="h-48 rounded-lg overflow-hidden border border-[var(--color-border-subtle)]">
                  <MarkdownEditor
                    content={skillContent}
                    filePath="new-skill.md"
                    onChange={setSkillContent}
                    defaultMode="edit"
                  />
                </div>
              </div>
            </>
          )}

          {error && <p className="text-sm text-[var(--color-error)]">{error}</p>}
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[var(--color-border-subtle)]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-md border border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-raised)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!canSubmit || submitting}
            className="px-4 py-2 text-sm font-bold rounded-md bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            <Plus size={14} />
            {submitting ? 'Creating...' : 'Create Skill'}
          </button>
        </div>
      </div>
    </div>
  )
}
