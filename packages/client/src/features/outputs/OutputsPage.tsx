import { useEffect, useState, useCallback, useMemo } from 'react'
import { FileOutput, ChevronDown, ChevronRight, FileText, GitBranch, Users, Zap, Briefcase, Lightbulb, Target, Cog } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

import { EmptyState } from '../../shared/EmptyState.js'
import { SlideOver } from '../../shared/SlideOver.js'
import { MarkdownEditor } from '../../shared/markdown-editor/MarkdownEditor.js'
import { CsvViewer } from '../../shared/CsvViewer.js'
import { useDetailParam } from '../../hooks/use-detail-param.js'

type OutputFile = { path: string; name: string; type: string; size: number; modifiedAt: string }

// BMAD phase grouping per workflow-map.md
type BmadPhase = 'context' | 'analysis' | 'planning' | 'solutioning' | 'implementation'

type SubTypeEntry = {
  key: string
  label: string
  phase: BmadPhase
  match: (name: string) => boolean
}

const SUB_TYPES: SubTypeEntry[] = [
  // Context
  { key: 'project-context', label: 'Project Context', phase: 'context', match: (n) => /^project.?context/i.test(n) },
  // Analysis
  { key: 'brainstorming', label: 'Brainstorming', phase: 'analysis', match: (n) => /^brainstorming/i.test(n) },
  { key: 'product-brief', label: 'Product Briefs', phase: 'analysis', match: (n) => /^product.?brief/i.test(n) },
  { key: 'research', label: 'Research', phase: 'analysis', match: (n) => /research/i.test(n) },
  // Planning
  { key: 'prd', label: 'Product Requirements', phase: 'planning', match: (n) => /^prd/i.test(n) },
  { key: 'prfaq', label: 'PRFAQ', phase: 'planning', match: (n) => /^prfaq/i.test(n) },
  // Solutioning
  { key: 'architecture', label: 'Architecture', phase: 'solutioning', match: (n) => /^architecture/i.test(n) },
  { key: 'epics', label: 'Epics', phase: 'solutioning', match: (n) => /^epic/i.test(n) },
  { key: 'spikes', label: 'Spikes', phase: 'solutioning', match: (n) => /^spike/i.test(n) },
  { key: 'ux', label: 'UX Design', phase: 'solutioning', match: (n) => /^ux.?(spec|design)/i.test(n) },
  { key: 'readiness', label: 'Readiness Reports', phase: 'solutioning', match: (n) => /readiness|implementation.?ready/i.test(n) },
  { key: 'course-correction', label: 'Sprint Change Proposals', phase: 'solutioning', match: (n) => /correct.?course|sprint.?change/i.test(n) },
  // Implementation
  { key: 'tech-spec', label: 'Tech Specs', phase: 'implementation', match: (n) => /^(tech.?spec|spec-)/i.test(n) },
  { key: 'stories', label: 'User Stories', phase: 'implementation', match: (n) => /^story-/i.test(n) },
  { key: 'sprint', label: 'Sprint Tracking', phase: 'implementation', match: (n) => /^sprint/i.test(n) },
  { key: 'reviews', label: 'Code Reviews', phase: 'implementation', match: (n) => /review/i.test(n) },
  { key: 'retros', label: 'Retrospectives', phase: 'implementation', match: (n) => /retro/i.test(n) },
]

function classifyFile(file: OutputFile): { phase: BmadPhase; subType: string } {
  for (const st of SUB_TYPES) {
    if (st.match(file.name)) return { phase: st.phase, subType: st.key }
  }
  // Fallback based on path
  if (file.path.startsWith('brainstorming/')) return { phase: 'analysis', subType: 'uncategorised' }
  if (file.path.startsWith('planning-artifacts/')) return { phase: 'planning', subType: 'uncategorised' }
  if (file.path.startsWith('implementation-artifacts/')) return { phase: 'implementation', subType: 'uncategorised' }
  return { phase: 'implementation', subType: 'uncategorised' }
}

function subTypeLabel(key: string): string {
  return SUB_TYPES.find((st) => st.key === key)?.label ?? 'Other'
}

const PHASE_META: Record<BmadPhase, { label: string; icon: typeof FileText }> = {
  context: { label: 'Project Context', icon: Briefcase },
  analysis: { label: 'Analysis', icon: Lightbulb },
  planning: { label: 'Planning', icon: FileText },
  solutioning: { label: 'Solutioning', icon: Target },
  implementation: { label: 'Implementation', icon: Cog },
}

const PHASE_ORDER: BmadPhase[] = ['context', 'analysis', 'planning', 'solutioning', 'implementation']

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

// File row — smaller text, indented, Files-section-like styling
function FileRow({
  file,
  isSelected,
  onSelect,
}: {
  file: OutputFile
  isSelected: boolean
  onSelect: () => void
}) {
  const date = new Date(file.modifiedAt)
  const dateStr = date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })

  return (
    <button
      onClick={onSelect}
      className={`w-full flex items-center justify-between px-4 py-2 text-left transition-colors cursor-pointer ${
        isSelected
          ? 'bg-[var(--color-surface-raised)] border-l-2 border-l-[var(--color-accent)] -ml-[2px]'
          : 'hover:bg-[var(--color-surface-raised)]'
      }`}
    >
      <span className={`text-xs truncate ${isSelected ? 'font-bold text-[var(--color-accent)]' : 'text-[var(--color-text)]'}`}>
        {cleanName(file.name)}
      </span>
      <span className="text-[10px] text-[var(--color-muted)] shrink-0 ml-4">{dateStr}</span>
    </button>
  )
}

// Sub-type group — collapsible with count
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
    <div className="ml-3 border-l border-[var(--color-border-subtle)]">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-[var(--color-surface-raised)] transition-colors cursor-pointer"
      >
        {expanded
          ? <ChevronDown size={11} className="text-[var(--color-muted)] shrink-0" />
          : <ChevronRight size={11} className="text-[var(--color-muted)] shrink-0" />}
        <span className="text-xs font-bold text-[var(--color-text)] flex-1">{subTypeLabel(subTypeKey)}</span>
        <span className="text-[10px] text-[var(--color-muted)]">{files.length}</span>
      </button>
      {expanded && (
        <div className="ml-3">
          {files
            .slice()
            .sort((a, b) => new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime())
            .map((f) => (
              <FileRow
                key={f.path}
                file={f}
                isSelected={selectedPath === f.path}
                onSelect={() => onSelect(f.path)}
              />
            ))}
        </div>
      )}
    </div>
  )
}

// BMAD phase section — top level
function PhaseSection({
  phase,
  files,
  selectedPath,
  onSelect,
  defaultOpen,
}: {
  phase: BmadPhase
  files: OutputFile[]
  selectedPath: string | null
  onSelect: (path: string) => void
  defaultOpen: boolean
}) {
  const [expanded, setExpanded] = useState(defaultOpen)
  const { label, icon: Icon } = PHASE_META[phase]

  // Group files by sub-type
  const subGroups = useMemo(() => {
    const groups = new Map<string, OutputFile[]>()
    for (const f of files) {
      const { subType } = classifyFile(f)
      if (!groups.has(subType)) groups.set(subType, [])
      groups.get(subType)!.push(f)
    }
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
        <span className="font-bold text-sm flex-1">{label}</span>
        <span className="text-xs text-[var(--color-muted)]">{files.length}</span>
      </button>

      {expanded && (
        <div className="py-1">
          {subGroups.length > 1 ? (
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
            <div className="ml-3">
              {subGroups[0][1]
                .slice()
                .sort((a, b) => new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime())
                .map((f) => (
                  <FileRow
                    key={f.path}
                    file={f}
                    isSelected={selectedPath === f.path}
                    onSelect={() => onSelect(f.path)}
                  />
                ))}
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

  // Group by BMAD phase
  const grouped = useMemo(() => {
    const result: Record<BmadPhase, OutputFile[]> = { context: [], analysis: [], planning: [], solutioning: [], implementation: [] }
    for (const f of outputs) {
      if (f.name.startsWith('.')) continue
      const { phase } = classifyFile(f)
      result[phase].push(f)
    }
    return result
  }, [outputs])

  const totalVisible = useMemo(() => Object.values(grouped).reduce((s, arr) => s + arr.length, 0), [grouped])

  const selectedFileName = selectedPath ? selectedPath.split('/').pop() ?? selectedPath : ''

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-extrabold mb-2">Outputs</h1>
        <p className="text-sm text-[var(--color-muted)] mb-6">Artifacts produced by BMAD workflows — grouped by methodology phase.</p>
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
        <h1 className="text-2xl font-extrabold mb-2">Outputs</h1>
        <p className="text-sm text-[var(--color-muted)] mb-6">Artifacts produced by BMAD workflows — grouped by methodology phase.</p>
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

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-extrabold">Outputs ({totalVisible})</h1>
      </div>
      <p className="text-sm text-[var(--color-muted)] mb-6">Artifacts produced by BMAD workflows — grouped by methodology phase.</p>

      <div className="space-y-3">
        {PHASE_ORDER
          .filter((phase) => grouped[phase].length > 0)
          .map((phase, idx) => (
            <PhaseSection
              key={phase}
              phase={phase}
              files={grouped[phase]}
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
