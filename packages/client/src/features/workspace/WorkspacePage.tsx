import { useEffect, useState, useCallback } from 'react'
import { Briefcase, ChevronDown, ChevronRight, Settings, CheckCircle2, Circle, Plus, Trash2 } from 'lucide-react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

import { EmptyState } from '../../shared/EmptyState.js'
import { MarkdownEditor } from '../../shared/markdown-editor/MarkdownEditor.js'
import { useNotifications } from '../../layout/NotificationProvider.js'
import { Skeleton } from '../../shared/Skeleton.js'

type ViewTab = 'structured' | 'raw' | 'preview' | 'config'

// Canonical BMAD sections for project-context.md
const BMAD_SECTIONS = [
  { key: 'overview', heading: 'Project Overview' },
  { key: 'techStack', heading: 'Technology Stack' },
  { key: 'codeOrg', heading: 'Code Organization' },
  { key: 'planning', heading: 'Planning Artifacts' },
  { key: 'rules', heading: 'Rules and Conventions' },
  { key: 'modules', heading: 'Installed Modules' },
  { key: 'ides', heading: 'Configured IDEs' },
] as const

type SectionKey = (typeof BMAD_SECTIONS)[number]['key']

type ParsedSection = {
  key: SectionKey | 'other'
  heading: string
  content: string
  /** For rules section: parsed individual rules */
  rules?: Array<{ title: string; body: string }>
}

function matchSectionKey(heading: string): SectionKey | null {
  const lower = heading.toLowerCase()
  if (lower.includes('overview')) return 'overview'
  if (lower.includes('tech') && lower.includes('stack')) return 'techStack'
  if (lower.includes('code') && lower.includes('org')) return 'codeOrg'
  if (lower.includes('planning') && lower.includes('artifact')) return 'planning'
  if (lower.includes('rule') || lower.includes('convention')) return 'rules'
  if (lower.includes('module')) return 'modules'
  if (lower.includes('ide') || lower.includes('configured')) return 'ides'
  return null
}

function parseRules(content: string): Array<{ title: string; body: string }> {
  const rules: Array<{ title: string; body: string }> = []
  const lines = content.split('\n')
  let currentTitle = ''
  let currentLines: string[] = []

  for (const line of lines) {
    const ruleMatch = line.match(/^###\s+(?:RULE:\s*)?(.+)/)
    if (ruleMatch) {
      if (currentTitle) {
        rules.push({ title: currentTitle, body: currentLines.join('\n').trim() })
      }
      currentTitle = ruleMatch[1]
      currentLines = []
    } else if (currentTitle) {
      currentLines.push(line)
    }
  }
  if (currentTitle) {
    rules.push({ title: currentTitle, body: currentLines.join('\n').trim() })
  }
  return rules
}

function rulesToMarkdown(rules: Array<{ title: string; body: string }>): string {
  return rules.map((r) => `### RULE: ${r.title}\n\n${r.body}`).join('\n\n')
}

function parseSections(content: string): ParsedSection[] {
  const raw: Array<{ heading: string; content: string }> = []
  const lines = content.split('\n')
  let currentHeading = ''
  let currentLines: string[] = []

  for (const line of lines) {
    const h2Match = line.match(/^##\s+(.+)/)
    if (h2Match) {
      if (currentHeading || currentLines.length > 0) {
        raw.push({ heading: currentHeading, content: currentLines.join('\n').trim() })
      }
      currentHeading = h2Match[1]
      currentLines = []
    } else if (currentHeading) {
      currentLines.push(line)
    } else {
      // Lines before first heading — skip title line
      if (!line.match(/^#\s+/)) currentLines.push(line)
    }
  }
  if (currentHeading || currentLines.length > 0) {
    raw.push({ heading: currentHeading, content: currentLines.join('\n').trim() })
  }

  const seen = new Set<SectionKey>()
  const sections: ParsedSection[] = []

  for (const s of raw) {
    const key = matchSectionKey(s.heading)
    if (key && !seen.has(key)) {
      seen.add(key)
      const section: ParsedSection = { key, heading: s.heading, content: s.content }
      if (key === 'rules') section.rules = parseRules(s.content)
      sections.push(section)
    } else {
      sections.push({ key: 'other', heading: s.heading, content: s.content })
    }
  }

  // Add missing BMAD sections as empty
  for (const def of BMAD_SECTIONS) {
    if (!seen.has(def.key)) {
      const section: ParsedSection = { key: def.key, heading: def.heading, content: '' }
      if (def.key === 'rules') section.rules = []
      sections.push(section)
    }
  }

  return sections
}

function sectionsToMarkdown(title: string, sections: ParsedSection[]): string {
  const parts: string[] = [`# ${title}`, '']
  for (const s of sections) {
    if (!s.heading) continue
    parts.push(`## ${s.heading}`)
    parts.push('')
    if (s.key === 'rules' && s.rules) {
      parts.push(rulesToMarkdown(s.rules))
    } else {
      parts.push(s.content)
    }
    parts.push('')
    parts.push('---')
    parts.push('')
  }
  return parts.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd() + '\n'
}

function extractTitle(content: string): string {
  const match = content.match(/^#\s+(.+)/m)
  return match?.[1] ?? 'Project Context'
}

function StatusDot({ configured }: { configured: boolean }) {
  return configured ? (
    <CheckCircle2 size={14} className="text-[var(--color-success)] shrink-0" />
  ) : (
    <Circle size={14} className="text-[var(--color-muted)] shrink-0" />
  )
}

function EditableSection({
  section,
  onChange,
}: {
  section: ParsedSection
  onChange: (updated: ParsedSection) => void
}) {
  const [expanded, setExpanded] = useState(section.content.length > 0 || (section.rules?.length ?? 0) > 0)
  const hasContent = section.content.trim().length > 0 || (section.rules?.length ?? 0) > 0

  return (
    <div className="border border-[var(--color-border-subtle)] rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-4 py-3 bg-[var(--color-surface-raised)] hover:bg-[var(--color-bg)] text-left transition-colors cursor-pointer"
      >
        {expanded ? <ChevronDown size={16} className="text-[var(--color-muted)]" /> : <ChevronRight size={16} className="text-[var(--color-muted)]" />}
        <span className="font-bold text-sm flex-1">{section.heading}</span>
        <StatusDot configured={hasContent} />
        <span className="text-xs text-[var(--color-muted)]">{hasContent ? 'Configured' : 'Empty'}</span>
      </button>
      {expanded && (
        <div className="px-4 py-3 border-t border-[var(--color-border-subtle)]">
          {section.key === 'rules' ? (
            <RulesEditor
              rules={section.rules ?? []}
              onChange={(rules) => onChange({ ...section, rules, content: rulesToMarkdown(rules) })}
            />
          ) : (
            <textarea
              value={section.content}
              onChange={(e) => onChange({ ...section, content: e.target.value })}
              placeholder={`Add content for ${section.heading}...`}
              className="w-full min-h-[120px] p-3 text-sm font-[var(--font-mono)] bg-[var(--color-bg)] border border-[var(--color-border-subtle)] rounded-md text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus:outline-none focus:border-[var(--color-accent)] resize-y"
              rows={Math.max(4, section.content.split('\n').length + 1)}
            />
          )}
        </div>
      )}
    </div>
  )
}

function RulesEditor({
  rules,
  onChange,
}: {
  rules: Array<{ title: string; body: string }>
  onChange: (rules: Array<{ title: string; body: string }>) => void
}) {
  const updateRule = (idx: number, field: 'title' | 'body', value: string) => {
    const updated = [...rules]
    updated[idx] = { ...updated[idx], [field]: value }
    onChange(updated)
  }
  const removeRule = (idx: number) => onChange(rules.filter((_, i) => i !== idx))
  const addRule = () => onChange([...rules, { title: '', body: '' }])

  return (
    <div className="space-y-3">
      {rules.map((rule, idx) => (
        <div key={idx} className="border border-[var(--color-border-subtle)] rounded-md p-3 space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={rule.title}
              onChange={(e) => updateRule(idx, 'title', e.target.value)}
              placeholder="Rule title"
              className="flex-1 px-2 py-1.5 text-sm font-bold bg-[var(--color-bg)] border border-[var(--color-border-subtle)] rounded text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus:outline-none focus:border-[var(--color-accent)]"
            />
            <button
              onClick={() => removeRule(idx)}
              className="p-1.5 text-[var(--color-muted)] hover:text-[var(--color-error)] transition-colors cursor-pointer"
              title="Remove rule"
            >
              <Trash2 size={14} />
            </button>
          </div>
          <textarea
            value={rule.body}
            onChange={(e) => updateRule(idx, 'body', e.target.value)}
            placeholder="Rule description and details..."
            className="w-full min-h-[80px] p-2 text-sm font-[var(--font-mono)] bg-[var(--color-bg)] border border-[var(--color-border-subtle)] rounded text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus:outline-none focus:border-[var(--color-accent)] resize-y"
            rows={Math.max(3, rule.body.split('\n').length + 1)}
          />
        </div>
      ))}
      <button
        onClick={addRule}
        className="flex items-center gap-1.5 px-3 py-2 text-sm text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] transition-colors cursor-pointer"
      >
        <Plus size={14} />
        Add Rule
      </button>
    </div>
  )
}

const TEMPLATE = `# Project Context

## Project Overview

Describe your project here.

## Technology Stack

List your technologies.

## Code Organization

\`\`\`
Describe your code structure here.
\`\`\`

## Rules and Conventions

### RULE: Example Rule

Describe the rule and its rationale.

## Installed Modules

| Module | Version | Source |
|---|---|---|
| core | — | built-in |

## Configured IDEs

- (add your IDE here)
`

export function WorkspacePage() {
  const [content, setContent] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<ViewTab>('structured')
  const [sections, setSections] = useState<ParsedSection[]>([])
  const [docTitle, setDocTitle] = useState('Project Context')
  const [rawEdit, setRawEdit] = useState('')
  const [dirty, setDirty] = useState(false)
  const [configContent, setConfigContent] = useState<string | null>(null)
  const [configEditContent, setConfigEditContent] = useState('')
  const { notify } = useNotifications()

  // Parse content into sections when loaded or when switching from raw
  const syncFromContent = useCallback((text: string) => {
    setDocTitle(extractTitle(text))
    setSections(parseSections(text))
    setRawEdit(text)
  }, [])

  useEffect(() => {
    Promise.allSettled([
      fetch('/api/outputs/project-context.md')
        .then((r) => {
          if (!r.ok) throw new Error('Not found')
          return r.json()
        })
        .then((d) => {
          const data = d as { content: string }
          setContent(data.content)
          syncFromContent(data.content)
        }),
      fetch('/api/files/core/config.yaml')
        .then((r) => {
          if (!r.ok) return fetch('/api/files/config.yaml').then((r2) => { if (!r2.ok) throw new Error('Not found'); return r2.json() })
          return r.json()
        })
        .then((d) => {
          const data = d as { content: string }
          setConfigContent(data.content)
          setConfigEditContent(data.content)
        })
        .catch(() => {}),
    ]).finally(() => setLoading(false))
  }, [syncFromContent])

  function updateSection(idx: number, updated: ParsedSection) {
    const next = [...sections]
    next[idx] = updated
    setSections(next)
    setRawEdit(sectionsToMarkdown(docTitle, next))
    setDirty(true)
  }

  function handleRawChange(text: string) {
    setRawEdit(text)
    setDirty(true)
  }

  // Sync raw edits back to structured sections when switching tabs
  function handleTabChange(tab: ViewTab) {
    if (activeTab === 'raw' && tab !== 'raw') {
      syncFromContent(rawEdit)
    }
    if (activeTab === 'structured' && tab !== 'structured') {
      setRawEdit(sectionsToMarkdown(docTitle, sections))
    }
    setActiveTab(tab)
  }

  async function handleSave() {
    const markdown = activeTab === 'raw' ? rawEdit : sectionsToMarkdown(docTitle, sections)
    try {
      const resp = await fetch('/api/outputs/project-context.md', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: markdown }),
      })
      if (resp.ok) {
        setContent(markdown)
        syncFromContent(markdown)
        setDirty(false)
        notify('success', 'Project context saved')
      } else {
        notify('error', 'Failed to save project context')
      }
    } catch {
      notify('error', 'Failed to save project context')
    }
  }

  function handleDiscard() {
    if (content) {
      syncFromContent(content)
    }
    setDirty(false)
  }

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-extrabold mb-8">Project Settings</h1>
        <Skeleton className="h-64" />
      </div>
    )
  }

  if (content === null && !dirty) {
    return (
      <div>
        <h1 className="text-2xl font-extrabold mb-8">Project Settings</h1>
        <EmptyState
          icon={Briefcase}
          title="No project context found"
          description="Create a project-context.md file to help AI agents understand your project's conventions, tech stack, and rules."
          actions={
            <button
              onClick={() => {
                setContent('')
                syncFromContent(TEMPLATE)
                setDirty(true)
              }}
              className="px-4 py-2 text-sm font-bold rounded-md bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] transition-colors"
            >
              Create Project Context
            </button>
          }
        />
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-extrabold">Project Settings</h1>
        <div className="flex items-center gap-3">
          <div className="flex gap-1 bg-[var(--color-surface-raised)] rounded-md p-0.5">
            {(['structured', 'raw', 'preview', 'config'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                className={`px-3 py-1.5 text-sm rounded min-h-[36px] transition-colors cursor-pointer ${
                  activeTab === tab
                    ? 'bg-[var(--color-bg)] text-[var(--color-text)] font-bold shadow-sm'
                    : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
          {dirty && (
            <div className="flex gap-2">
              <button
                onClick={handleDiscard}
                className="px-4 py-2 text-sm rounded-md border border-[var(--color-border-subtle)] text-[var(--color-text)] hover:bg-[var(--color-surface-raised)] transition-colors cursor-pointer"
              >
                Discard
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 text-sm font-bold rounded-md bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] transition-colors cursor-pointer"
              >
                Save
              </button>
            </div>
          )}
        </div>
      </div>

      {activeTab === 'structured' && (
        <div className="space-y-3">
          {sections.map((section, i) => (
            <EditableSection
              key={`${section.key}-${section.heading}`}
              section={section}
              onChange={(updated) => updateSection(i, updated)}
            />
          ))}
        </div>
      )}

      {activeTab === 'raw' && (
        <div className="rounded-lg border border-[var(--color-border-subtle)] overflow-hidden h-[calc(100vh-12rem)]">
          <MarkdownEditor
            content={rawEdit}
            filePath="_bmad/project-context.md"
            onChange={handleRawChange}
            onSave={handleSave}
          />
        </div>
      )}

      {activeTab === 'preview' && (
        <div className="rounded-lg border border-[var(--color-border-subtle)] p-6">
          <div className="prose prose-sm max-w-none text-[var(--color-text)] prose-headings:text-[var(--color-text)] prose-headings:font-bold prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-a:text-[var(--color-accent)] prose-strong:text-[var(--color-text)]">
            <Markdown remarkPlugins={[remarkGfm]}>{activeTab === 'preview' ? (rawEdit || '') : ''}</Markdown>
          </div>
        </div>
      )}

      {activeTab === 'config' && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Settings size={16} className="text-[var(--color-accent)]" />
            <h2 className="text-sm font-bold">BMAD Configuration</h2>
            <span className="text-xs text-[var(--color-muted)] font-[var(--font-mono)]">_bmad/config.yaml</span>
          </div>
          {configContent !== null ? (
            <div className="rounded-lg border border-[var(--color-border-subtle)] overflow-hidden h-[500px]">
              <MarkdownEditor
                content={configEditContent}
                filePath="_bmad/config.yaml"
                onChange={setConfigEditContent}
                onSave={async () => {
                  try {
                    let resp = await fetch('/api/files/core/config.yaml', {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ content: configEditContent }),
                    })
                    if (!resp.ok) {
                      resp = await fetch('/api/files/config.yaml', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ content: configEditContent }),
                      })
                    }
                    if (resp.ok) {
                      setConfigContent(configEditContent)
                      notify('success', 'Configuration saved')
                    } else {
                      notify('error', 'Failed to save configuration')
                    }
                  } catch {
                    notify('error', 'Failed to save configuration')
                  }
                }}
              />
            </div>
          ) : (
            <div className="p-4 rounded-lg bg-[var(--color-surface-raised)] text-sm text-[var(--color-muted)]">
              No config.yaml found in the _bmad/ directory.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
