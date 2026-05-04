import fs from 'node:fs'
import path from 'node:path'

import matter from 'gray-matter'
import { parse as parseToml } from 'smol-toml'

import type {
  Workflow,
  WorkflowStep,
  WorkflowTemplate,
  WorkflowSubWorkflow,
  WorkflowType,
  WorkflowInput,
  WorkflowOutput,
  WorkflowIo,
} from '@bmad-studio/shared'

import type { ParseResult } from './config-parser.js'

const VARIANT_STEP_RE = /^step-(\d+)([a-z])-/
const PHASE_DIR_RE = /^\d+-/

type StepDiscovery = {
  filePath: string
  variantSet?: string
  isVariant: boolean
}

function isStepDirectory(name: string): boolean {
  return name === 'steps' || name.startsWith('steps-') || name.endsWith('-steps')
}

function discoverStepFiles(dirPath: string): StepDiscovery[] {
  const results: StepDiscovery[] = []

  let entries: fs.Dirent[]
  try {
    entries = fs.readdirSync(dirPath, { withFileTypes: true })
  } catch {
    return results
  }

  const stepDirs = entries
    .filter((e) => e.isDirectory() && isStepDirectory(e.name))
    .map((e) => e.name)
    .sort()

  for (const stepDir of stepDirs) {
    const fullPath = path.join(dirPath, stepDir)
    const files = fs
      .readdirSync(fullPath)
      .filter((f) => f.endsWith('.md'))
      .sort()

    const variantSet = stepDir === 'steps' ? undefined : stepDir

    for (const file of files) {
      const match = VARIANT_STEP_RE.exec(file)
      results.push({
        filePath: path.join(stepDir, file),
        variantSet,
        isVariant: match !== null && match[2] !== undefined,
      })
    }
  }

  return results
}

function hasStepDirectories(dirPath: string): boolean {
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true })
    return entries.some((e) => e.isDirectory() && isStepDirectory(e.name))
  } catch {
    return false
  }
}

function classifyWorkflowType(dirPath: string): WorkflowType {
  const hasSteps = hasStepDirectories(dirPath)

  // Precedence: step-based first
  if (hasSteps) {
    return 'step-based'
  }

  // Composite: has workflows/ subdirectory
  const hasWorkflowsSubdir = fs.existsSync(path.join(dirPath, 'workflows'))
    && fs.statSync(path.join(dirPath, 'workflows')).isDirectory()
  if (hasWorkflowsSubdir) {
    return 'composite'
  }

  // Agent-based: has agents/ + prompts/
  const hasAgentsDir = fs.existsSync(path.join(dirPath, 'agents'))
  const hasPromptsDir = fs.existsSync(path.join(dirPath, 'prompts'))
  if (hasAgentsDir && hasPromptsDir) {
    return 'agent-based'
  }

  // Default to step-based
  return 'step-based'
}

function extractPhase(dirPath: string): string | undefined {
  const parentDir = path.basename(path.dirname(dirPath))
  if (PHASE_DIR_RE.test(parentDir)) {
    return parentDir
  }
  return undefined
}

const STEP_GOAL_RE = /^## STEP GOAL:\s*\n\s*\n(.+)/m
const MAX_DESCRIPTION_LENGTH = 200
const SUPPORTING_DIR_NAMES = ['agents', 'prompts', 'resources', 'data']

function discoverTemplates(dirPath: string): WorkflowTemplate[] {
  try {
    const entries = fs.readdirSync(dirPath)
    return entries
      .filter((f) => f.endsWith('.template.md'))
      .sort()
      .map((f) => ({
        filePath: path.join(dirPath, f),
        name: f.replace('.template.md', ''),
      }))
  } catch {
    return []
  }
}

function discoverSubWorkflows(dirPath: string): WorkflowSubWorkflow[] {
  const wfDir = path.join(dirPath, 'workflows')
  if (!fs.existsSync(wfDir) || !fs.statSync(wfDir).isDirectory()) {
    return []
  }
  try {
    return fs
      .readdirSync(wfDir)
      .filter((f) => f.endsWith('.md'))
      .sort()
      .map((f) => ({
        filePath: path.join(wfDir, f),
        name: f.replace('.md', ''),
      }))
  } catch {
    return []
  }
}

function discoverSupportingFiles(dirPath: string): string[] {
  return SUPPORTING_DIR_NAMES.filter((name) => {
    const fullPath = path.join(dirPath, name)
    return fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()
  }).map((name) => path.join(dirPath, name))
}

function extractStepDescription(stepFilePath: string): string {
  try {
    const content = fs.readFileSync(stepFilePath, 'utf-8')
    const { data: frontmatter, content: body } = matter(content)

    // Priority 1: ## STEP GOAL: section
    const goalMatch = STEP_GOAL_RE.exec(body)
    if (goalMatch) {
      const desc = goalMatch[1].trim()
      return desc.length > MAX_DESCRIPTION_LENGTH
        ? desc.slice(0, MAX_DESCRIPTION_LENGTH) + '...'
        : desc
    }

    // Priority 2: frontmatter description field
    if (frontmatter.description && typeof frontmatter.description === 'string') {
      const desc = frontmatter.description.trim()
      return desc.length > MAX_DESCRIPTION_LENGTH
        ? desc.slice(0, MAX_DESCRIPTION_LENGTH) + '...'
        : desc
    }

    // Priority 3: first non-heading paragraph
    const lines = body.split('\n')
    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('---') && !trimmed.startsWith('**')) {
        return trimmed.length > MAX_DESCRIPTION_LENGTH
          ? trimmed.slice(0, MAX_DESCRIPTION_LENGTH) + '...'
          : trimmed
      }
    }

    return ''
  } catch {
    return ''
  }
}

function parseAgentBasedWorkflow(dirPath: string): ParseResult<Workflow> {
  const manifestPath = path.join(dirPath, 'bmad-manifest.json')
  const skillPath = path.join(dirPath, 'SKILL.md')

  let name = path.basename(dirPath)
  let description = ''

  // Try bmad-manifest.json for metadata
  if (fs.existsSync(manifestPath)) {
    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'))
      if (manifest.name) name = manifest.name
      if (manifest.description) description = manifest.description
    } catch {
      // Fall through to SKILL.md
    }
  }

  // Try SKILL.md for name/description if not found in manifest
  if (description === '' && fs.existsSync(skillPath)) {
    try {
      const content = fs.readFileSync(skillPath, 'utf-8')
      const { data: frontmatter, content: body } = matter(content)
      if (frontmatter.name) name = frontmatter.name as string
      if (frontmatter.description) description = frontmatter.description as string
      if (!description) {
        const titleMatch = body.match(/^#\s+(.+)$/m)
        if (titleMatch) name = titleMatch[1].trim()
        const goalMatch = body.match(/^\*\*Goal:\*\*\s*(.+)$/m)
        if (goalMatch) description = goalMatch[1].trim()
      }
    } catch {
      // Use defaults
    }
  }

  const workflow: Workflow = {
    id: path.basename(dirPath),
    name,
    description,
    entryPoint: fs.existsSync(manifestPath) ? manifestPath : dirPath,
    steps: [],
    filePath: fs.existsSync(manifestPath) ? manifestPath : dirPath,
    module: undefined,
    type: 'agent-based',
    phase: extractPhase(dirPath),
    templates: discoverTemplates(dirPath),
    subWorkflows: discoverSubWorkflows(dirPath),
    supportingFiles: discoverSupportingFiles(dirPath),
  }

  return { ok: true, data: workflow }
}

// ---------------------------------------------------------------------------
// io block parsing
// ---------------------------------------------------------------------------

type RawIoInput = {
  id?: unknown
  description?: unknown
  path_patterns?: unknown
  required?: unknown
  file_type?: unknown
}

type RawIoOutput = {
  id?: unknown
  description?: unknown
  path_pattern?: unknown
  file_type?: unknown
}

function parseIoFromFrontmatter(fm: Record<string, unknown>): WorkflowIo | undefined {
  const raw = fm['io']
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined

  const rawIo = raw as Record<string, unknown>
  const rawInputs = Array.isArray(rawIo['inputs']) ? rawIo['inputs'] as RawIoInput[] : []
  const rawOutputs = Array.isArray(rawIo['outputs']) ? rawIo['outputs'] as RawIoOutput[] : []

  const inputs: WorkflowInput[] = rawInputs
    .filter((r) => typeof r['id'] === 'string')
    .map((r) => ({
      id: String(r['id']),
      description: typeof r['description'] === 'string' ? r['description'] : '',
      pathPatterns: Array.isArray(r['path_patterns'])
        ? (r['path_patterns'] as unknown[]).filter((p) => typeof p === 'string').map(String)
        : typeof r['path_patterns'] === 'string' ? [r['path_patterns']] : [],
      required: r['required'] !== false,
      fileType: typeof r['file_type'] === 'string' ? r['file_type'] : undefined,
    }))

  const outputs: WorkflowOutput[] = rawOutputs
    .filter((r) => typeof r['id'] === 'string')
    .map((r) => ({
      id: String(r['id']),
      description: typeof r['description'] === 'string' ? r['description'] : '',
      pathPattern: typeof r['path_pattern'] === 'string' ? r['path_pattern'] : '',
      fileType: typeof r['file_type'] === 'string' ? r['file_type'] : undefined,
    }))

  if (inputs.length === 0 && outputs.length === 0) return undefined
  return { inputs, outputs }
}

// Parses an INITIALISATION / INITIALIZATION markdown table as a fallback for io.
// Expects columns: Input | Description | Required (any order).
const INIT_HEADING_RE = /^##\s+INITIALI[SZ]ATION/im
const TABLE_ROW_RE = /^\|(.+)\|$/

function parseIoFromMarkdown(body: string): WorkflowIo | undefined {
  const headingMatch = INIT_HEADING_RE.exec(body)
  if (!headingMatch) return undefined

  const afterHeading = body.slice(headingMatch.index + headingMatch[0].length)
  const lines = afterHeading.split('\n')

  // Find the table: look for a pipe-delimited header row
  let headerIdx = -1
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (TABLE_ROW_RE.test(line) && line.toLowerCase().includes('input')) {
      headerIdx = i
      break
    }
    // Stop if we hit another heading
    if (/^#/.test(line) && i > 0) break
  }

  if (headerIdx < 0) return undefined

  const headerRow = lines[headerIdx].trim()
  const cols = headerRow.split('|').slice(1, -1).map((c) => c.trim().toLowerCase())
  const inputIdx = cols.findIndex((c) => c.includes('input') || c.includes('artifact') || c.includes('file'))
  const descIdx = cols.findIndex((c) => c.includes('desc') || c.includes('detail'))
  const reqIdx = cols.findIndex((c) => c.includes('req') || c.includes('required'))

  if (inputIdx < 0) return undefined

  const inputs: WorkflowInput[] = []
  // Skip separator row (idx + 1) and read data rows
  for (let i = headerIdx + 2; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!TABLE_ROW_RE.test(line)) break
    const cells = line.split('|').slice(1, -1).map((c) => c.trim())
    const id = cells[inputIdx]?.replace(/\*\*/g, '').trim()
    if (!id || id === '---') continue
    const description = descIdx >= 0 ? (cells[descIdx] ?? '') : ''
    const reqCell = reqIdx >= 0 ? (cells[reqIdx] ?? '') : ''
    const required = !reqCell || !/optional|no/i.test(reqCell)
    inputs.push({
      id: id.toLowerCase().replace(/\s+/g, '-'),
      description,
      pathPatterns: [],
      required,
    })
  }

  if (inputs.length === 0) return undefined
  return { inputs, outputs: [] }
}

export function parseWorkflow(dirPath: string): ParseResult<Workflow> {
  try {
    const type = classifyWorkflowType(dirPath)

    // Agent-based workflows have no workflow.md
    if (type === 'agent-based') {
      return parseAgentBasedWorkflow(dirPath)
    }

    const workflowFile = path.join(dirPath, 'workflow.md')

    if (!fs.existsSync(workflowFile)) {
      // Check for bmad-manifest.json as fallback
      if (fs.existsSync(path.join(dirPath, 'bmad-manifest.json'))) {
        return parseAgentBasedWorkflow(dirPath)
      }
      return { ok: false, error: 'workflow.md not found in directory', filePath: dirPath }
    }

    const content = fs.readFileSync(workflowFile, 'utf-8')
    const { data: frontmatter, content: body } = matter(content)

    const titleMatch = body.match(/^#\s+(.+)$/m)
    const name = titleMatch ? titleMatch[1].trim() : path.basename(dirPath)

    // Accept both `**Goal:**` and `**Goal**:` variants; fall back to workflow.md
    // frontmatter, then to sibling SKILL.md frontmatter (the convention used by
    // dept-* modules).
    const descMatch = body.match(/^\*\*Goal\*?\*?:\*?\*?\s*(.+)$/m)
    let description = descMatch ? descMatch[1].trim() : ''
    if (!description && typeof frontmatter.description === 'string') {
      description = frontmatter.description.trim()
    }
    if (!description) {
      const skillPath = path.join(dirPath, 'SKILL.md')
      if (fs.existsSync(skillPath)) {
        try {
          const { data: skillFm } = matter(fs.readFileSync(skillPath, 'utf-8'))
          if (typeof skillFm.description === 'string') {
            description = skillFm.description.trim()
          }
        } catch {
          // fall through with empty description
        }
      }
    }

    const discovered = discoverStepFiles(dirPath)

    const steps: WorkflowStep[] = discovered.map((d) => {
      const fullStepPath = path.join(dirPath, d.filePath)
      return {
        filePath: fullStepPath,
        title: path.basename(d.filePath, '.md').replace(/^step-\d+[a-z]?-/, ''),
        description: extractStepDescription(fullStepPath),
        variantSet: d.variantSet,
        isVariant: d.isVariant,
      }
    })

    const entryPoint = (frontmatter.entry_point as string) || steps[0]?.filePath || ''
    const phase = extractPhase(dirPath)

    const io = parseIoFromFrontmatter(frontmatter as Record<string, unknown>)
      ?? parseIoFromMarkdown(body)

    const workflow: Workflow = {
      id: path.basename(dirPath),
      name,
      description,
      entryPoint,
      steps,
      filePath: workflowFile,
      module: undefined,
      type,
      phase,
      templates: discoverTemplates(dirPath),
      subWorkflows: discoverSubWorkflows(dirPath),
      supportingFiles: discoverSupportingFiles(dirPath),
      io: io ?? undefined,
    }

    return { ok: true, data: workflow }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { ok: false, error: `Workflow parse error: ${message}`, filePath: dirPath }
  }
}

export function parseWorkflowV65(dirPath: string, tomlContent: string): ParseResult<Workflow> {
  try {
    // Parse the TOML to validate it has a [workflow] block (content already confirmed by caller)
    parseToml(tomlContent)

    const skillId = path.basename(dirPath)
    const skillMdPath = path.join(dirPath, 'SKILL.md')

    // Get name and description from SKILL.md frontmatter
    let name = skillId
    let description = ''
    if (fs.existsSync(skillMdPath)) {
      try {
        const { data: fm } = matter(fs.readFileSync(skillMdPath, 'utf-8'))
        if (fm.name) name = String(fm.name)
        if (fm.description) description = String(fm.description)
      } catch {
        // Use defaults
      }
    }

    const phase = extractPhase(dirPath)

    return {
      ok: true,
      data: {
        id: skillId,
        name,
        description,
        entryPoint: skillMdPath,
        steps: [],
        filePath: skillMdPath,
        module: undefined,
        type: 'step-based',
        phase,
        templates: [],
        subWorkflows: [],
        supportingFiles: [],
      },
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { ok: false, error: `Workflow v65 parse error: ${message}`, filePath: dirPath }
  }
}
