import { useEffect, useState, useCallback, useMemo } from 'react'
import { FileOutput, ChevronDown, ChevronRight, Brain, FileText, Wrench, Layers, GitBranch, Users, Zap } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

import { EmptyState } from '../../shared/EmptyState.js'
import { SlideOver } from '../../shared/SlideOver.js'
import { MarkdownEditor } from '../../shared/markdown-editor/MarkdownEditor.js'
import { CsvViewer } from '../../shared/CsvViewer.js'
import { useDetailParam } from '../../hooks/use-detail-param.js'

type OutputFile = { path: string; name: string; type: string; size: number; modifiedAt: string }

// Story 26.7: Top-level output sections
type OutputSection = 'project' | 'executional' | 'other'

function classifySection(relPath: string): OutputSection {
  if (relPath.startsWith('brainstorming/') || relPath.startsWith('planning-artifacts/')) return 'project'
  if (relPath.startsWith('implementation-artifacts/')) return 'executional'
  return 'other'
}

const SECTION_META: Record<OutputSection, { label: string; description: string; icon: typeof Brain }> = {
  project: {
    label: 'Project Outputs',
    description: 'Planning artifacts — PRDs, architecture, epics, brainstorming, UX specs',
    icon: FileText,
  },
  executional: {
    label: 'Executional Outputs',
    description: 'Sprint deliverables — stories, code reviews, retrospectives, sprint status',
    icon: Wrench,
  },
  other: {
    label: 'Other',
    description: 'Project-level files and uncategorised outputs',
    icon: Layers,
  },
}

// Story 26.6: Sub-type taxonomy from BMAD workflow-map.md output filenames
type SubType = {
  key: string
  label: string
  match: (name: string, path: string) => boolean
}

const SUB_TYPES: SubType[] = [
  { key: 'brainstorming', label: 'Brainstorming', match: (n) => /^brainstorming/i.test(n) },
  { key: 'product-brief', label: 'Product Brief', match: (n) => /^product.?brief/i.test(n) },
  { key: 'prfaq', label: 'PRFAQ', match: (n) => /^prfaq/i.test(n) },
  { key: 'research', label: 'Research', match: (n) => /research/i.test(n) },
  { key: 'prd', label: 'Product Requirements', match: (n) => /^prd/i.test(n) },
  { key: 'ux', label: 'UX Design', match: (n) => /^ux.?(spec|design)/i.test(n) },
  { key: 'architecture', label: 'Architecture', match: (n) => /^architecture/i.test(n) },
  { key: 'epics', label: 'Epics', match: (n) => /^epic/i.test(n) },
  { key: 'tech-spec', label: 'Tech Specs', match: (n) => /^(tech.?spec|spec-)/i.test(n) },
  { key: 'stories', label: 'Stories', match: (n) => /^story-/i.test(n) },
  { key: 'sprint', label: 'Sprint Tracking', match: (n) => /^sprint/i.test(n) },
  { key: 'reviews', label: 'Code Reviews', match: (n) => /review/i.test(n) },
  { key: 'retros', label: 'Retrospectives', match: (n) => /retro/i.test(n) },
  { key: 'spikes', label: 'Spikes', match: (n) => /^spike/i.test(n) },
]

function classifySubType(file: OutputFile): string {
  for (const st of SUB_TYPES) {
    if (st.match(file.name, file.path)) return st.key
  }
  return 'uncategorised'
}

function subTypeLabel(key: string): string {
  return SUB_TYPES.find((st) => st.key === key)?.label ?? 'Uncategorised'
}

function cleanName(name: string): string {
  return name
    .replace(/\.(md|yaml|yml|txt)$/i, '')
    .replace(/-(\d{4}-\d{2}-\d{2})(-\d{4})?$/, '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

type FrontmatterRefs = {
  workflow?: string
  agent?: string
  skill?: string
  story?: string | number
  epic?: string | number
  sprint?: string | number
  status?: string
}

function parseFrontmatterRefs(content: string): FrontmatterRefs {
  const match = content.match(/^---\n([\s\S]*?)\n---/)
  if (!match) return {}
  const fm = match[1]
  const refs: FrontmatterRefs = {}
  const extract = (key: string): string | undefined => {
    const m = fm.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'))
    return m ? m[1].trim().replace(/^["']|["']$/g, '') : undefined
  }
  const w = extract('workflow'); if (w) refs.workflow = w
  const a = extract('agent'); if (a) refs.agent = a
  const s = extract('skill'); if (s) refs.skill = s
  const st = extract('story'); if (st) refs.story = st
  const ep = extract('epic'); if (ep) refs.epic = ep
  const sp = extract('sprint'); if (sp) refs.sprint = sp
  const status = extract('status'); if (status) refs.status = status
  return refs
}

function ArtifactCrossLinks({ refs }: { refs: FrontmatterRefs }) {
  const navigate = useNavigate()
  const links: Array<{ label: string; route: string; icon: typeof GitBranch; color: string }> = []

  if (refs.workflow) {
    links.push({ label: `Workflow: ${refs.workflow}`, route: `/workflows?detail=${refs.workflow}`, icon: GitBranch, color: 'text-purple-400' })
  }
  if (refs.agent) {
    links.push({ label: `Agent: ${refs.agent}`, route: `/agents/${refs.agent}`, icon: Users, color: 'text-[var(--color-accent)]' })
  }
  if (refs.skill) {
    links.push({ label: `Skill: ${refs.skill}`, route: `/skills?detail=${refs.skill}`, icon: Zap, color: 'text-[var(--color-success)]' })
  }

  const tags: string[] = []
  if (refs.status) tags.push(`status: ${refs.status}`)
  if (refs.epic !== undefined) tags.push(`epic ${refs.epic}`)
  if (refs.sprint !== undefined) tags.push(`sprint ${refs.sprint}`)
  if (refs.story !== undefined) tags.push(`story ${refs.story}`)

  if (links.length === 0 && tags.length === 0) return null

  return (
    <div className="mb-4 p-3 rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border-subtle)]">
      <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)] mb-2">From this artifact</p>
      <div className="flex flex-wrap gap-2">
        {links.map((l) => {
          const IconComponent = l.icon
          return (
            <button
              key={l.route}
              onClick={() => navigate(l.route)}
              className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-md border border-[var(--color-border-subtle)] hover:border-[var(--color-accent)] hover:bg-[var(--color-bg)] transition-colors cursor-pointer ${l.color}`}
            >
              <IconComponent size={11} />
              {l.label}
            </button>
          )
        })}
        {tags.map((tag) => (
          <span
            key={tag}
            className="text-xs px-2 py-1 rounded-md bg-[var(--color-bg)] border border-[var(--color-border-subtle)] text-[var(--color-muted)]"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  )
}

// Story 26.6: Collapsible sub-type group within a section
function SubTypeGroup({
  subTypeKey,
  files,
  selectedPath,
  onSelect,
  defaultOpen,
}: {
  subTypeKey: string
  files: OutputFile[]
  selectedPath: string | null
  onSelect: (path: string) => void
  defaultOpen: boolean
}) {
  const [expanded, setExpanded] = useState(defaultOpen)

  return (
    <div className="border-l-2 border-[var(--color-border-subtle)] ml-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-[var(--color-surface-raised)] transition-colors cursor-pointer"
      >
        {expanded
          ? <ChevronDown size={12} className="text-[var(--color-muted)] shrink-0" />
          : <ChevronRight size={12} className="text-[var(--color-muted)] shrink-0" />}
        <span className="text-xs font-bold flex-1">{subTypeLabel(subTypeKey)}</span>
        <span className="text-xs text-[var(--color-muted)]">{files.length}</span>
      </button>
      {expanded && (
        <div className="ml-2">
          {files
            .slice()
            .sort((a, b) => new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime())
            .map((f) => {
              const isSelected = selectedPath === f.path
              const date = new Date(f.modifiedAt)
              const dateStr = date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })

              return (
                <button
                  key={f.path}
                  onClick={() => onSelect(f.path)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-left transition-colors ${
                    isSelected
                      ? 'bg-[var(--color-surface-raised)] border-l-2 border-l-[var(--color-accent)] -ml-[2px]'
                      : 'hover:bg-[var(--color-surface-raised)]'
                  } cursor-pointer`}
                >
                  <p className={`text-sm truncate ${isSelected ? 'font-bold text-[var(--color-accent)]' : ''}`}>
                    {cleanName(f.name)}
                  </p>
                  <div className="flex items-center gap-3 shrink-0 ml-4">
                    <span className="text-xs text-[var(--color-muted)]">{dateStr}</span>
                    {f.size > 0 && (
                      <span className="text-xs text-[var(--color-muted)] hidden sm:inline">
                        {f.size > 1024 ? `${(f.size / 1024).toFixed(0)}K` : `${f.size}B`}
                      </span>
                    )}
                  </div>
                </button>
              )
            })}
        </div>
      )}
    </div>
  )
}

// Story 26.7: Top-level section (Project Outputs / Executional Outputs)
function OutputSectionPanel({
  section,
  files,
  selectedPath,
  onSelect,
  defaultOpen,
}: {
  section: OutputSection
  files: OutputFile[]
  selectedPath: string | null
  onSelect: (path: string) => void
  defaultOpen: boolean
}) {
  const [expanded, setExpanded] = useState(defaultOpen)
  const { label, description, icon: Icon } = SECTION_META[section]

  // Group files by sub-type
  const subGroups = useMemo(() => {
    const groups = new Map<string, OutputFile[]>()
    for (const f of files) {
      const st = classifySubType(f)
      if (!groups.has(st)) groups.set(st, [])
      groups.get(st)!.push(f)
    }
    // Sort sub-type groups: defined types first (by SUB_TYPES order), then uncategorised
    const order = SUB_TYPES.map((st) => st.key)
    return [...groups.entries()].sort((a, b) => {
      const ai = order.indexOf(a[0])
      const bi = order.indexOf(b[0])
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi)
    })
  }, [files])

  return (
    <div className="rounded-lg border border-[var(--color-border-subtle)] overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-[var(--color-surface-raised)] hover:bg-[var(--color-bg)] transition-colors text-left cursor-pointer"
      >
        {expanded
          ? <ChevronDown size={16} className="text-[var(--color-muted)] shrink-0" />
          : <ChevronRight size={16} className="text-[var(--color-muted)] shrink-0" />}
        <Icon size={16} className="text-[var(--color-accent)] shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm">{label}</span>
            <span className="text-xs text-[var(--color-muted)]">({files.length})</span>
          </div>
          {!expanded && (
            <p className="text-xs text-[var(--color-muted)] truncate">{description}</p>
          )}
        </div>
      </button>

      {expanded && (
        <div className="py-1">
          {subGroups.length > 1 ? (
            // Multiple sub-types: show collapsible groups
            subGroups.map(([stKey, stFiles], idx) => (
              <SubTypeGroup
                key={stKey}
                subTypeKey={stKey}
                files={stFiles}
                selectedPath={selectedPath}
                onSelect={onSelect}
                defaultOpen={idx === 0}
              />
            ))
          ) : subGroups.length === 1 ? (
            // Single sub-type: show files directly without extra nesting
            <div className="px-1">
              {subGroups[0][1]
                .slice()
                .sort((a, b) => new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime())
                .map((f) => {
                  const isSelected = selectedPath === f.path
                  const date = new Date(f.modifiedAt)
                  const dateStr = date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
                  return (
                    <button
                      key={f.path}
                      onClick={() => onSelect(f.path)}
                      className={`w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors ${
                        isSelected
                          ? 'bg-[var(--color-surface-raised)] border-l-2 border-l-[var(--color-accent)]'
                          : 'hover:bg-[var(--color-surface-raised)]'
                      } cursor-pointer`}
                    >
                      <p className={`text-sm truncate ${isSelected ? 'font-bold text-[var(--color-accent)]' : ''}`}>
                        {cleanName(f.name)}
                      </p>
                      <span className="text-xs text-[var(--color-muted)] shrink-0 ml-4">{dateStr}</span>
                    </button>
                  )
                })}
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}

export function OutputsPage() {
  const [outputs, setOutputs] = useState<OutputFile[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPath, setSelectedPath] = useDetailParam('path')
  const [selectedContent, setSelectedContent] = useState('')
  const [contentLoading, setContentLoading] = useState(false)

  const artifactRefs = useMemo(() => parseFrontmatterRefs(selectedContent), [selectedContent])

  // ?category= param for jumping to a section from the Home page
  const [, setCategoryParam] = useDetailParam('category')
  void setCategoryParam

  useEffect(() => {
    fetch('/api/outputs')
      .then((r) => r.json())
      .then((d) => {
        setOutputs(d as OutputFile[])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!selectedPath) {
      setSelectedContent('')
      return
    }
    setContentLoading(true)
    fetch(`/api/outputs/${selectedPath}`)
      .then((r) => {
        if (!r.ok) throw new Error('Not found')
        return r.json()
      })
      .then((data: { content: string }) => setSelectedContent(data.content))
      .catch(() => setSelectedContent('Failed to load file content.'))
      .finally(() => setContentLoading(false))
  }, [selectedPath])

  const handleSelect = useCallback(
    (filePath: string) => {
      setSelectedPath(selectedPath === filePath ? null : filePath)
    },
    [selectedPath, setSelectedPath],
  )

  // Story 26.7: Group by section, then 26.6 sub-types happen inside each section
  const grouped = useMemo(() => {
    const result: Record<OutputSection, OutputFile[]> = { project: [], executional: [], other: [] }
    for (const f of outputs) {
      if (f.name.startsWith('.')) continue
      result[classifySection(f.path)].push(f)
    }
    return result
  }, [outputs])

  const totalVisible = useMemo(() => Object.values(grouped).reduce((s, arr) => s + arr.length, 0), [grouped])

  const selectedFileName = selectedPath ? selectedPath.split('/').pop() ?? selectedPath : ''

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-extrabold mb-8">Outputs</h1>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-lg bg-[var(--color-surface-raised)] animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (totalVisible === 0) {
    return (
      <div>
        <h1 className="text-2xl font-extrabold mb-8">Outputs</h1>
        <EmptyState
          icon={FileOutput}
          title="No outputs yet"
          description="BMAD outputs are artifacts produced by running workflows — brainstorming sessions, PRDs, architecture docs, sprint plans, and story files. Run a BMAD workflow in your IDE to generate your first output."
          actions={
            <Link to="/workflows" className="px-4 py-2 text-sm font-bold rounded-md bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] transition-colors">
              Browse Workflows
            </Link>
          }
        />
      </div>
    )
  }

  const sectionOrder: OutputSection[] = ['project', 'executional', 'other']

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-extrabold">Outputs ({totalVisible})</h1>
      </div>

      <div className="space-y-3">
        {sectionOrder
          .filter((sec) => grouped[sec].length > 0)
          .map((sec, idx) => (
            <OutputSectionPanel
              key={sec}
              section={sec}
              files={grouped[sec]}
              selectedPath={selectedPath}
              onSelect={handleSelect}
              defaultOpen={idx === 0}
            />
          ))}
      </div>

      <SlideOver
        open={!!selectedPath}
        title={cleanName(selectedFileName)}
        onClose={() => setSelectedPath(null)}
        width="max(480px, 50vw)"
      >
        {contentLoading ? (
          <div className="h-64 rounded bg-[var(--color-surface-raised)] animate-pulse" />
        ) : selectedPath?.endsWith('.csv') ? (
          <CsvViewer content={selectedContent} />
        ) : (
          <>
            <ArtifactCrossLinks refs={artifactRefs} />
            <div className="rounded-lg overflow-hidden border border-[var(--color-border-subtle)]" style={{ height: 'calc(100vh - 200px)' }}>
              <MarkdownEditor
                content={selectedContent}
                filePath={selectedPath ?? ''}
                onChange={() => {}}
                readOnly
              />
            </div>
          </>
        )}
      </SlideOver>
    </div>
  )
}
