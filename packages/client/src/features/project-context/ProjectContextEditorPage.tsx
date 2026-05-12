import { useEffect, useState, useRef, useCallback } from 'react'
import {
  FileText,
  CheckCircle2,
  Circle,
  HelpCircle,
  X,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  AlertTriangle,
  Info,
  Sparkles,
} from 'lucide-react'

import type { LintFinding } from '@bmad-studio/shared'
import { runLinter, computeQualityScore, scoreLabel, PC_RULES } from '@bmad-studio/shared'
import { MarkdownEditor } from '../../shared/markdown-editor/MarkdownEditor.js'
import { EmptyState } from '../../shared/EmptyState.js'
import { Skeleton } from '../../shared/Skeleton.js'
import { useNotifications } from '../../layout/NotificationProvider.js'
import { DiffConfirmDialog } from '../customize/DiffConfirmDialog.js'

// ---------------------------------------------------------------------------
// Canonical section metadata
// ---------------------------------------------------------------------------

type SectionDef = {
  key: string
  heading: string
  aliases: string[]
  description: string
  example: string
}

const SECTION_DEFS: SectionDef[] = [
  {
    key: 'purpose',
    heading: 'Project Overview',
    aliases: ['project overview', 'purpose', 'project purpose', 'overview'],
    description: 'Describes what the project is, who owns it, and its current status. This is the first thing an AI agent reads to orient itself.',
    example: `This is a TypeScript monorepo for the BMAD Studio web app. It provides a local-first UI for managing BMAD AI agent configurations, workflows, and project context documents.\n\nOwned by the platform team. Currently in active development — Cycle 5 in progress.`,
  },
  {
    key: 'tech-stack',
    heading: 'Technology Stack',
    aliases: ['technology stack', 'tech stack', 'technologies'],
    description: 'Lists every major technology, framework, and library with version numbers. Agents use this to know which APIs and patterns are available.',
    example: `- **Runtime**: Node.js v20 LTS\n- **Backend**: Fastify 5 + TypeScript 5.8\n- **Frontend**: React 18, Vite 5, Tailwind CSS v3\n- **Monorepo**: npm workspaces\n- **Testing**: Vitest, Playwright`,
  },
  {
    key: 'architecture',
    heading: 'Architecture Overview',
    aliases: ['architecture overview', 'architecture', 'system architecture'],
    description: 'Explains the high-level structure, key subsystems, and how they communicate. Helps agents understand the blast radius of any change.',
    example: `Three-package monorepo:\n- \`packages/shared\` — Types and utilities used by both client and server\n- \`packages/server\` — Fastify REST + WebSocket API, no database (file-system only)\n- \`packages/client\` — React SPA, talks to server via fetch + WebSocket`,
  },
  {
    key: 'conventions',
    heading: 'Conventions',
    aliases: ['conventions', 'rules and conventions', 'coding conventions', 'code conventions', 'code organization', 'code org'],
    description: 'Documents naming rules, file organization, and patterns agents must follow when generating code. Use ### subsections to separate concerns.',
    example: `### Naming\n- Files: kebab-case.ts\n- React components: PascalCase.tsx\n- Types: PascalCase\n\n### File Organization\n- Features under \`src/features/<name>/\`\n- Shared UI under \`src/shared/\`\n\n### Testing\n- Integration tests hit real files, no mocks`,
  },
  {
    key: 'anti-patterns',
    heading: 'Anti-patterns',
    aliases: ['anti-patterns', 'antipatterns', 'anti patterns', 'what not to do'],
    description: 'A bulleted list of common mistakes that AI agents should never do in this codebase. Explicit prohibitions prevent repeated mistakes.',
    example: `- Never use \`any\` type — use \`unknown\` and narrow\n- Never import server-only modules in the client package\n- Never store secrets in the project context file\n- Never add a database — this project is file-system only`,
  },
  {
    key: 'known-issues',
    heading: 'Known Issues',
    aliases: ['known issues', 'known bugs', 'caveats', 'limitations'],
    description: 'Documents active bugs, technical debt, or workarounds that agents need to be aware of to avoid making things worse.',
    example: `- The TypeScript target is ES2019 — \`replaceAll\` is not available, use \`split().join()\`\n- smol-toml is parse-only; serialization must be done manually\n- \`minimatch\` is a transitive dep only — do not import it directly`,
  },
  {
    key: 'dependencies',
    heading: 'External Dependencies',
    aliases: ['external dependencies', 'dependencies', 'integrations', 'third-party'],
    description: 'Lists external services, APIs, or infrastructure that the project depends on. Helps agents understand integration boundaries.',
    example: `- GitHub registry for module distribution\n- No external databases or cloud services\n- Figma MCP server for design-to-code workflows`,
  },
  {
    key: 'operational',
    heading: 'Operational Context',
    aliases: ['operational context', 'operations', 'deployment', 'environment'],
    description: 'Covers how the project runs in production: deployment method, environment variables, monitoring, and on-call ownership.',
    example: `- Runs as a local CLI tool — no cloud hosting\n- Packaged via \`npm pack\` and distributed through the BMAD registry\n- No secrets required — all config is user-local`,
  },
  {
    key: 'adr-index',
    heading: 'ADR Index',
    aliases: ['adr index', 'adrs', 'decisions', 'architecture decision records'],
    description: 'An index of Architecture Decision Records, pointing agents to where key decisions were made and why.',
    example: `| ADR | Decision | Location |\n|-----|----------|----------|\n| ADR-001 | File-system only storage | planning-artifacts/adrs/adr-001.md |\n| ADR-002 | Strangler-fig for v6.5 migration | planning-artifacts/research/ |`,
  },
]

const SECTION_DEF_MAP = new Map(SECTION_DEFS.map((d) => [d.key, d]))

// ---------------------------------------------------------------------------
// Local type alias matching the shared linter's ProjectContextDocLite
// ---------------------------------------------------------------------------

type SectionLite = { key: string; heading: string; body: string; present: boolean; subsections?: SectionLite[] }
type DocLite = { sections: SectionLite[]; customSections: SectionLite[]; raw: string }

// ---------------------------------------------------------------------------
// Client-side parser (mirrors server-side parseProjectContext logic)
// ---------------------------------------------------------------------------

function matchCanonicalKey(heading: string): string | null {
  const lower = heading.toLowerCase().trim()
  for (const def of SECTION_DEFS) {
    if (def.aliases.some((alias) => lower === alias || lower.startsWith(alias))) return def.key
  }
  return null
}

function parseSubsectionsLite(body: string) {
  const results: Array<{ key: string; heading: string; body: string; present: boolean }> = []
  const lines = body.split('\n')
  let current: { heading: string; lines: string[] } | null = null
  for (const line of lines) {
    const h3 = /^###\s+(.+)$/.exec(line)
    if (h3) {
      if (current)
        results.push({
          key: current.heading.toLowerCase().replace(/\s+/g, '-'),
          heading: current.heading,
          body: current.lines.join('\n').trim(),
          present: true,
        })
      current = { heading: h3[1].trim(), lines: [] }
    } else if (current) {
      current.lines.push(line)
    }
  }
  if (current)
    results.push({
      key: current.heading.toLowerCase().replace(/\s+/g, '-'),
      heading: current.heading,
      body: current.lines.join('\n').trim(),
      present: true,
    })
  return results
}

function parseDocLite(raw: string): DocLite {
  const sectionMap = new Map<string, SectionLite>(
    SECTION_DEFS.map((d) => [d.key, { key: d.key, heading: d.heading, body: '', present: false }]),
  )
  const customSections: Array<{ key: string; heading: string; body: string; present: boolean }> = []

  const lines = raw.split('\n')
  let currentKey: string | null = null
  let currentHeading = ''
  let currentLines: string[] = []
  let isCustom = false

  function flush() {
    if (!currentHeading) return
    const body = currentLines.join('\n').trimEnd()
    if (isCustom) {
      customSections.push({
        key: currentHeading.toLowerCase().replace(/\s+/g, '-'),
        heading: currentHeading,
        body,
        present: true,
      })
    } else if (currentKey) {
      const existing = sectionMap.get(currentKey)!
      const subsections = currentKey === 'conventions' ? parseSubsectionsLite(body) : undefined
      sectionMap.set(currentKey, { ...existing, heading: currentHeading, body, present: true, subsections })
    }
    currentKey = null
    currentHeading = ''
    currentLines = []
    isCustom = false
  }

  for (const line of lines) {
    const h2 = /^##\s+(.+)$/.exec(line)
    if (h2) {
      flush()
      const heading = h2[1].trim()
      const key = matchCanonicalKey(heading)
      if (key) {
        currentKey = key
        currentHeading = heading
        isCustom = false
      } else {
        currentHeading = heading
        isCustom = true
      }
    } else if (currentHeading) {
      currentLines.push(line)
    }
  }
  flush()

  return {
    sections: Array.from(sectionMap.values()),
    customSections,
    raw,
  }
}

// ---------------------------------------------------------------------------
// Template
// ---------------------------------------------------------------------------

const STARTER_TEMPLATE = `## Project Overview

Describe what this project does, who owns it, and its current status.

## Technology Stack

- **Language**: TypeScript / JavaScript
- **Framework**: (e.g. React 18, Fastify 5)
- **Runtime**: Node.js v20+

## Architecture Overview

Briefly describe the major subsystems and how they communicate.

## Conventions

### Naming

- Files: kebab-case
- Components: PascalCase

### File Organization

- Describe where different file types live

## Anti-patterns

- List things AI agents should never do in this codebase

## Known Issues

- Document any active bugs, workarounds, or technical debt
`

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

type ScoreBadgeProps = { score: number; label: string }

function ScoreBadge({ score, label }: ScoreBadgeProps) {
  const color =
    score >= 85
      ? 'text-[var(--color-success)] bg-[var(--color-success)]/10'
      : score >= 65
        ? 'text-[var(--color-accent)] bg-[var(--color-accent)]/10'
        : score >= 40
          ? 'text-[var(--color-warning)] bg-[var(--color-warning)]/10'
          : 'text-[var(--color-error)] bg-[var(--color-error)]/10'

  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${color}`}>
      <Sparkles size={12} />
      {score} · {label}
    </div>
  )
}

function FindingIcon({ severity }: { severity: LintFinding['severity'] }) {
  if (severity === 'error') return <AlertCircle size={14} className="text-[var(--color-error)] shrink-0" />
  if (severity === 'warning') return <AlertTriangle size={14} className="text-[var(--color-warning)] shrink-0" />
  return <Info size={14} className="text-[var(--color-muted)] shrink-0" />
}

function FindingsPanel({ findings }: { findings: LintFinding[] }) {
  const [collapsed, setCollapsed] = useState(false)
  const errors = findings.filter((f) => f.severity === 'error').length
  const warnings = findings.filter((f) => f.severity === 'warning').length

  const grouped = findings.reduce<Record<string, LintFinding[]>>((acc, f) => {
    const k = f.section ?? '__global'
    ;(acc[k] ??= []).push(f)
    return acc
  }, {})

  return (
    <div className="border-t border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)]">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center gap-3 px-4 py-2 text-xs font-bold text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors cursor-pointer"
      >
        <span className="flex-1 text-left">
          Findings — {errors > 0 && <span className="text-[var(--color-error)]">{errors} error{errors !== 1 ? 's' : ''}</span>}
          {errors > 0 && warnings > 0 && ', '}
          {warnings > 0 && <span className="text-[var(--color-warning)]">{warnings} warning{warnings !== 1 ? 's' : ''}</span>}
          {findings.filter((f) => f.severity === 'info').length > 0 &&
            (errors > 0 || warnings > 0 ? ', ' : '') +
              findings.filter((f) => f.severity === 'info').length + ' suggestion' +
              (findings.filter((f) => f.severity === 'info').length !== 1 ? 's' : '')}
        </span>
        {collapsed ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {!collapsed && (
        <div className="px-4 pb-3 space-y-2 max-h-48 overflow-y-auto">
          {Object.entries(grouped).map(([sectionKey, group]) => {
            const def = sectionKey !== '__global' ? SECTION_DEF_MAP.get(sectionKey) : null
            return (
              <div key={sectionKey}>
                {def && (
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)] mb-1">
                    {def.heading}
                  </p>
                )}
                {group.map((f) => (
                  <div key={f.ruleId} className="flex gap-2 py-1">
                    <FindingIcon severity={f.severity} />
                    <div className="min-w-0">
                      <p className="text-xs text-[var(--color-text)]">{f.message}</p>
                      {f.fixGuidance && (
                        <p className="text-[11px] text-[var(--color-muted)] mt-0.5">{f.fixGuidance}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

type HelpSlideOverProps = {
  sectionKey: string
  onClose: () => void
}

function HelpSlideOver({ sectionKey, onClose }: HelpSlideOverProps) {
  const def = SECTION_DEF_MAP.get(sectionKey)
  if (!def) return null

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <aside className="fixed right-0 top-0 h-full w-96 z-50 bg-[var(--color-bg)] border-l border-[var(--color-border-subtle)] shadow-xl flex flex-col">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--color-border-subtle)]">
          <HelpCircle size={18} className="text-[var(--color-accent)] shrink-0" />
          <h2 className="text-sm font-bold flex-1">{def.heading}</h2>
          <button
            onClick={onClose}
            className="p-1 text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)] mb-2">What is this for?</h3>
            <p className="text-sm text-[var(--color-text)] leading-relaxed">{def.description}</p>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)] mb-2">Example</h3>
            <pre className="text-xs bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)] rounded-md p-3 whitespace-pre-wrap font-mono text-[var(--color-text)] leading-relaxed">
              {def.example}
            </pre>
          </div>
        </div>
      </aside>
    </>
  )
}

// ---------------------------------------------------------------------------
// API types
// ---------------------------------------------------------------------------

type ServerSection = {
  key: string
  heading: string
  body: string
  present: boolean
  subsections?: ServerSection[]
}

type ServerDoc = {
  sections: ServerSection[]
  customSections: ServerSection[]
  raw: string
  filePath: string | null
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

type ViewMode = 'raw' | 'structured'

export function ProjectContextEditorPage() {
  const [loading, setLoading] = useState(true)
  const [serverDoc, setServerDoc] = useState<ServerDoc | null>(null)
  const [raw, setRaw] = useState('')
  const [savedRaw, setSavedRaw] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('raw')
  const [activeSectionKey, setActiveSectionKey] = useState<string>('purpose')
  const [findings, setFindings] = useState<LintFinding[]>([])
  const [score, setScore] = useState(100)
  const [helpFor, setHelpFor] = useState<string | null>(null)
  const [showDiff, setShowDiff] = useState(false)
  const [saving, setSaving] = useState(false)
  // Structured mode: section bodies keyed by section key
  const [structuredBodies, setStructuredBodies] = useState<Map<string, { heading: string; body: string }>>(new Map())
  const [customSectionBodies, setCustomSectionBodies] = useState<Array<{ heading: string; body: string }>>([])

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { notify } = useNotifications()

  const dirty = raw !== savedRaw

  // ---------------------------------------------------------------------------
  // Linting
  // ---------------------------------------------------------------------------

  const runLint = useCallback((rawText: string) => {
    const doc = parseDocLite(rawText)
    const found = runLinter(doc, PC_RULES)
    setFindings(found)
    setScore(computeQualityScore(found))
  }, [])

  // ---------------------------------------------------------------------------
  // Structured ↔ raw sync
  // ---------------------------------------------------------------------------

  function initStructuredFromRaw(rawText: string) {
    const doc = parseDocLite(rawText)
    const bodies = new Map<string, { heading: string; body: string }>()
    for (const s of doc.sections) {
      bodies.set(s.key, { heading: s.heading || SECTION_DEF_MAP.get(s.key)?.heading || s.key, body: s.body })
    }
    setStructuredBodies(bodies)
    setCustomSectionBodies(doc.customSections.map((cs) => ({ heading: cs.heading, body: cs.body })))
  }

  function buildRawFromStructured(
    bodies: Map<string, { heading: string; body: string }>,
    customBodies: Array<{ heading: string; body: string }>,
  ): string {
    const parts: string[] = []
    for (const def of SECTION_DEFS) {
      const s = bodies.get(def.key)
      if (s) {
        parts.push(`## ${s.heading || def.heading}`)
        parts.push('')
        if (s.body.trim()) {
          parts.push(s.body)
          parts.push('')
        }
      }
    }
    for (const cs of customBodies) {
      if (cs.heading) {
        parts.push(`## ${cs.heading}`)
        parts.push('')
        if (cs.body.trim()) {
          parts.push(cs.body)
          parts.push('')
        }
      }
    }
    return parts.join('\n')
  }

  // ---------------------------------------------------------------------------
  // Load
  // ---------------------------------------------------------------------------

  useEffect(() => {
    fetch('/api/project-context')
      .then((r) => r.json())
      .then((data: ServerDoc) => {
        setServerDoc(data)
        setRaw(data.raw)
        setSavedRaw(data.raw)
        runLint(data.raw)
        initStructuredFromRaw(data.raw)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [runLint])

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  function handleRawChange(text: string) {
    setRaw(text)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => runLint(text), 300)
  }

  function handleSectionBodyChange(key: string, body: string) {
    const next = new Map(structuredBodies)
    const existing = next.get(key) ?? { heading: SECTION_DEF_MAP.get(key)?.heading ?? key, body: '' }
    next.set(key, { ...existing, body })
    setStructuredBodies(next)
    const newRaw = buildRawFromStructured(next, customSectionBodies)
    setRaw(newRaw)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => runLint(newRaw), 300)
  }

  function handleCustomSectionBodyChange(key: string, body: string) {
    const next = customSectionBodies.map((cs) =>
      cs.heading.toLowerCase().replace(/\s+/g, '-') === key ? { ...cs, body } : cs,
    )
    setCustomSectionBodies(next)
    const newRaw = buildRawFromStructured(structuredBodies, next)
    setRaw(newRaw)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => runLint(newRaw), 300)
  }

  function handleViewModeChange(mode: ViewMode) {
    if (viewMode === 'structured' && mode === 'raw') {
      // structured → raw: raw is already synced
    } else if (viewMode === 'raw' && mode === 'structured') {
      // raw → structured: re-parse structured from current raw
      initStructuredFromRaw(raw)
    }
    setViewMode(mode)
  }

  function handleSaveClick() {
    if (savedRaw === '') {
      // No previous content — save directly
      doSave()
    } else {
      setShowDiff(true)
    }
  }

  async function doSave() {
    setSaving(true)
    setShowDiff(false)
    try {
      const resp = await fetch('/api/project-context', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: raw }),
      })
      if (resp.ok) {
        setSavedRaw(raw)
        notify('success', 'Project context saved')
      } else {
        notify('error', 'Failed to save project context')
      }
    } catch {
      notify('error', 'Failed to save project context')
    } finally {
      setSaving(false)
    }
  }

  function handleDiscard() {
    setRaw(savedRaw)
    runLint(savedRaw)
    initStructuredFromRaw(savedRaw)
  }

  function handleUseTemplate() {
    setRaw(STARTER_TEMPLATE)
    runLint(STARTER_TEMPLATE)
    initStructuredFromRaw(STARTER_TEMPLATE)
  }

  function handleStartBlank() {
    setRaw('')
    runLint('')
    initStructuredFromRaw('')
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-extrabold mb-8">Project Context</h1>
        <Skeleton className="h-96" />
      </div>
    )
  }

  // Empty state: no file exists and no pending edits
  if (serverDoc?.raw === '' && serverDoc?.filePath === null && !dirty) {
    return (
      <div>
        <h1 className="text-2xl font-extrabold mb-8">Project Context</h1>
        <EmptyState
          icon={FileText}
          title="No project-context.md found"
          description="A project context document helps AI agents understand your project's tech stack, conventions, and architecture so they make better decisions."
          actions={
            <>
              <button
                onClick={handleUseTemplate}
                className="px-4 py-2 text-sm font-bold rounded-md bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] transition-colors cursor-pointer"
              >
                Start from template
              </button>
              <button
                onClick={handleStartBlank}
                className="px-4 py-2 text-sm font-bold rounded-md border border-[var(--color-border-subtle)] text-[var(--color-text)] hover:bg-[var(--color-surface-raised)] transition-colors cursor-pointer"
              >
                Start blank
              </button>
            </>
          }
        />
      </div>
    )
  }

  const parsedDoc = parseDocLite(raw)
  const label = scoreLabel(score)
  const presentCount = parsedDoc.sections.filter((s) => s.present).length + parsedDoc.customSections.length

  const activeSection = parsedDoc.sections.find((s) => s.key === activeSectionKey)
  const activeDef = SECTION_DEF_MAP.get(activeSectionKey)
  const activeBody = structuredBodies.get(activeSectionKey)?.body ?? ''
  const activeCustomSection = parsedDoc.customSections.find((cs) => cs.key === activeSectionKey)
  const isCustomSection = !activeSection && !!activeCustomSection
  const activeCustomBody =
    customSectionBodies.find((cs) => cs.heading.toLowerCase().replace(/\s+/g, '-') === activeSectionKey)?.body ?? ''

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 shrink-0">
        <h1 className="text-2xl font-extrabold flex-1">Project Context</h1>
        <ScoreBadge score={score} label={label} />
        <div className="flex gap-1 bg-[var(--color-surface-raised)] rounded-md p-0.5">
          {(['raw', 'structured'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => handleViewModeChange(mode)}
              className={`px-3 py-1.5 text-sm rounded min-h-[32px] transition-colors cursor-pointer ${
                viewMode === mode
                  ? 'bg-[var(--color-bg)] text-[var(--color-text)] font-bold shadow-sm'
                  : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
              }`}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
        {dirty && (
          <div className="flex gap-2">
            <button
              onClick={handleDiscard}
              className="px-3 py-1.5 text-sm rounded-md border border-[var(--color-border-subtle)] text-[var(--color-text)] hover:bg-[var(--color-surface-raised)] transition-colors cursor-pointer"
            >
              Discard
            </button>
            <button
              onClick={handleSaveClick}
              disabled={saving}
              className="px-3 py-1.5 text-sm font-bold rounded-md bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] disabled:opacity-50 transition-colors cursor-pointer"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 gap-4 min-h-0">
        {/* Left: Section navigator */}
        <aside className="w-52 shrink-0 flex flex-col border border-[var(--color-border-subtle)] rounded-lg overflow-hidden">
          <div className="px-3 py-2 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)]">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
              Sections · {presentCount} / {SECTION_DEFS.length}
            </p>
          </div>
          <nav className="flex-1 overflow-y-auto py-1">
            {SECTION_DEFS.map((def) => {
              const section = parsedDoc.sections.find((s) => s.key === def.key)
              const present = section?.present ?? false
              const sectionFindings = findings.filter((f) => f.section === def.key)
              const hasError = sectionFindings.some((f) => f.severity === 'error')
              const hasWarning = sectionFindings.some((f) => f.severity === 'warning')
              const isActive = activeSectionKey === def.key

              return (
                <div key={def.key} className="flex items-center group">
                  <button
                    onClick={() => setActiveSectionKey(def.key)}
                    className={`flex-1 flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-[var(--color-surface-raised)] text-[var(--color-text)] font-bold'
                        : 'text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-raised)]/50'
                    }`}
                  >
                    {present ? (
                      <CheckCircle2
                        size={13}
                        className={hasError ? 'text-[var(--color-error)]' : hasWarning ? 'text-[var(--color-warning)]' : 'text-[var(--color-success)]'}
                      />
                    ) : (
                      <Circle size={13} className="text-[var(--color-border-subtle)]" />
                    )}
                    <span className="truncate">{def.heading}</span>
                  </button>
                  <button
                    onClick={() => setHelpFor(def.key)}
                    className="px-1.5 py-2 text-[var(--color-border-subtle)] hover:text-[var(--color-muted)] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    title={`About ${def.heading}`}
                  >
                    <HelpCircle size={12} />
                  </button>
                </div>
              )
            })}
            {parsedDoc.customSections.length > 0 && (
              <>
                <div className="mx-3 my-1 border-t border-[var(--color-border-subtle)]" />
                <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]">Custom</p>
                {parsedDoc.customSections.map((cs) => (
                  <button
                    key={cs.key}
                    onClick={() => setActiveSectionKey(cs.key)}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors cursor-pointer ${
                      activeSectionKey === cs.key
                        ? 'bg-[var(--color-surface-raised)] text-[var(--color-text)] font-bold'
                        : 'text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-raised)]/50'
                    }`}
                  >
                    <CheckCircle2 size={13} className="text-[var(--color-success)]" />
                    <span className="truncate">{cs.heading}</span>
                  </button>
                ))}
              </>
            )}
          </nav>
        </aside>

        {/* Right: Editor */}
        <div className="flex-1 flex flex-col min-w-0 border border-[var(--color-border-subtle)] rounded-lg overflow-hidden">
          {viewMode === 'raw' ? (
            <div className="flex-1 min-h-0">
              <MarkdownEditor
                content={raw}
                filePath="project-context.md"
                onChange={handleRawChange}
                onSave={handleSaveClick}
                defaultMode="preview"
                modes={['preview', 'edit']}
              />
            </div>
          ) : (
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              {/* Section heading + help */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)] shrink-0">
                {isCustomSection ? (
                  <CheckCircle2 size={15} className="text-[var(--color-success)]" />
                ) : activeSection?.present ? (
                  <CheckCircle2 size={15} className="text-[var(--color-success)]" />
                ) : (
                  <Circle size={15} className="text-[var(--color-border-subtle)]" />
                )}
                <h2 className="text-sm font-bold flex-1">
                  {isCustomSection ? activeCustomSection?.heading : (activeDef?.heading ?? activeSectionKey)}
                </h2>
                {!isCustomSection && (
                  <button
                    onClick={() => setHelpFor(activeSectionKey)}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors cursor-pointer"
                    title="What is this section for?"
                  >
                    <HelpCircle size={13} />
                    What is this?
                  </button>
                )}
              </div>
              <div className="flex-1 p-4 overflow-y-auto">
                <textarea
                  value={isCustomSection ? activeCustomBody : activeBody}
                  onChange={(e) =>
                    isCustomSection
                      ? handleCustomSectionBodyChange(activeSectionKey, e.target.value)
                      : handleSectionBodyChange(activeSectionKey, e.target.value)
                  }
                  placeholder={`Write the ${isCustomSection ? activeCustomSection?.heading : (activeDef?.heading ?? activeSectionKey)} content here using Markdown…`}
                  className="w-full min-h-full p-3 text-sm font-mono bg-[var(--color-bg)] border border-[var(--color-border-subtle)] rounded-md text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus:outline-none focus:border-[var(--color-accent)] resize-none"
                  style={{ minHeight: '300px' }}
                />
                {!isCustomSection && activeDef && !activeSection?.present && (
                  <div className="mt-3 p-3 rounded-md bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)]">
                    <p className="text-xs text-[var(--color-muted)] mb-2">{activeDef.description}</p>
                    <button
                      onClick={() => handleSectionBodyChange(activeSectionKey, activeDef.example)}
                      className="text-xs text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] font-bold transition-colors cursor-pointer"
                    >
                      Insert example →
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Findings panel */}
          {findings.length > 0 && <FindingsPanel findings={findings} />}
        </div>
      </div>

      {/* Help slide-over */}
      {helpFor && <HelpSlideOver sectionKey={helpFor} onClose={() => setHelpFor(null)} />}

      {/* Diff confirm dialog */}
      <DiffConfirmDialog
        open={showDiff}
        original={savedRaw}
        modified={raw}
        title="Save project-context.md"
        onConfirm={doSave}
        onCancel={() => setShowDiff(false)}
      />
    </div>
  )
}
