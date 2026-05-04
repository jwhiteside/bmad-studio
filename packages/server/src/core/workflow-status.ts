import fs from 'node:fs'
import path from 'node:path'

import type { WorkflowIo, WorkflowInput, WorkflowOutput } from '@bmad-studio/shared'

export type InputStatus = 'present' | 'missing' | 'thin'

export type InputStatusDetail = {
  id: string
  description: string
  required: boolean
  status: InputStatus
  filePath?: string
  qualityNotes?: string[]
}

export type OutputStatusDetail = {
  id: string
  description: string
  files: Array<{ path: string; modifiedAt: string }>
}

export type WorkflowStatus = {
  status: 'ready' | 'blocked' | 'already-run' | 'unknown'
  inputs: InputStatusDetail[]
  outputs: OutputStatusDetail[]
  blockedReasons?: string[]
}

const MIN_FILE_BYTES = 50

const FILE_TYPE_HEADINGS: Record<string, RegExp[]> = {
  prd: [/^#\s+/m, /product\s+requirements?/i],
  architecture: [/^#\s+/m, /architecture/i],
  'project-context': [/^#\s+/m, /project/i],
  epic: [/^#\s+/m, /epic/i],
  story: [/^#\s+/m, /story/i],
}

function globToRegex(glob: string): RegExp {
  const escaped = glob
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.')
  return new RegExp(`^${escaped}$`, 'i')
}

function matchesGlob(filename: string, glob: string): boolean {
  return globToRegex(glob).test(filename)
}

// Token resolution for path patterns
function resolveToken(token: string, projectRoot: string): string {
  const map: Record<string, string> = {
    '{planning_artifacts}': path.join(projectRoot, '_bmad-output', 'planning-artifacts'),
    '{bmad_output}': path.join(projectRoot, '_bmad-output'),
    '{project_root}': projectRoot,
    '{bmad}': path.join(projectRoot, '_bmad'),
    '{bmad_config}': path.join(projectRoot, '_bmad', '_config'),
  }
  return map[token] ?? token
}

function resolvePattern(pattern: string, projectRoot: string): string {
  return pattern.replace(/\{[^}]+\}/g, (token) => resolveToken(token, projectRoot))
}

function qualityCheck(filePath: string, fileType?: string): string[] {
  const notes: string[] = []
  try {
    const stat = fs.statSync(filePath)
    if (stat.size < MIN_FILE_BYTES) {
      notes.push('File is very short — may be incomplete')
    }
    if (fileType && FILE_TYPE_HEADINGS[fileType]) {
      const content = fs.readFileSync(filePath, 'utf-8')
      const patterns = FILE_TYPE_HEADINGS[fileType]
      const allMatch = patterns.every((re) => re.test(content))
      if (!allMatch) {
        notes.push(`Content doesn't look like a ${fileType} document`)
      }
    }
  } catch {
    notes.push('Could not read file')
  }
  return notes
}

function findFileForInput(input: WorkflowInput, projectRoot: string): string | undefined {
  for (const raw of input.pathPatterns) {
    const resolved = resolvePattern(raw, projectRoot)
    const dir = path.dirname(resolved)
    const glob = path.basename(resolved)

    // No glob characters — direct path
    if (!glob.includes('*') && !glob.includes('?')) {
      if (fs.existsSync(resolved)) return resolved
      continue
    }

    // Glob match against directory listing
    try {
      const entries = fs.readdirSync(dir)
      const match = entries.find((f) => matchesGlob(f, glob))
      if (match) return path.join(dir, match)
    } catch {
      // directory doesn't exist — skip
    }
  }
  return undefined
}

function findFilesForOutput(output: WorkflowOutput, projectRoot: string): Array<{ path: string; modifiedAt: string }> {
  if (!output.pathPattern) return []
  const resolved = resolvePattern(output.pathPattern, projectRoot)
  const dir = path.dirname(resolved)
  const glob = path.basename(resolved)

  const results: Array<{ path: string; modifiedAt: string }> = []

  if (!glob.includes('*') && !glob.includes('?')) {
    if (fs.existsSync(resolved)) {
      const stat = fs.statSync(resolved)
      results.push({ path: resolved, modifiedAt: stat.mtime.toISOString() })
    }
    return results
  }

  try {
    const entries = fs.readdirSync(dir)
    for (const f of entries) {
      if (matchesGlob(f, glob)) {
        const fullPath = path.join(dir, f)
        const stat = fs.statSync(fullPath)
        results.push({ path: fullPath, modifiedAt: stat.mtime.toISOString() })
      }
    }
  } catch {
    // directory doesn't exist
  }
  return results
}

export function computeWorkflowStatus(io: WorkflowIo | undefined, projectRoot: string): WorkflowStatus {
  if (!io || (io.inputs.length === 0 && io.outputs.length === 0)) {
    return { status: 'unknown', inputs: [], outputs: [] }
  }

  const inputDetails: InputStatusDetail[] = io.inputs.map((input) => {
    if (input.pathPatterns.length === 0) {
      return { id: input.id, description: input.description, required: input.required, status: 'missing' as InputStatus }
    }

    const filePath = findFileForInput(input, projectRoot)
    if (!filePath) {
      return { id: input.id, description: input.description, required: input.required, status: 'missing' as InputStatus }
    }

    const qualityNotes = qualityCheck(filePath, input.fileType)
    const status: InputStatus = qualityNotes.length > 0 ? 'thin' : 'present'
    return {
      id: input.id,
      description: input.description,
      required: input.required,
      status,
      filePath,
      qualityNotes: qualityNotes.length > 0 ? qualityNotes : undefined,
    }
  })

  const outputDetails: OutputStatusDetail[] = io.outputs.map((output) => ({
    id: output.id,
    description: output.description,
    files: findFilesForOutput(output, projectRoot),
  }))

  // Derive overall status
  const blockedInputs = inputDetails.filter((i) => i.required && i.status === 'missing')
  const blockedReasons = blockedInputs.map((i) => `Missing required input: ${i.id}`)

  const hasAnyOutput = outputDetails.some((o) => o.files.length > 0)
  if (hasAnyOutput) {
    return { status: 'already-run', inputs: inputDetails, outputs: outputDetails, blockedReasons: blockedReasons.length > 0 ? blockedReasons : undefined }
  }

  if (blockedReasons.length > 0) {
    return { status: 'blocked', inputs: inputDetails, outputs: outputDetails, blockedReasons }
  }

  return { status: 'ready', inputs: inputDetails, outputs: outputDetails }
}
