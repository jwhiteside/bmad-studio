import fs from 'node:fs'
import path from 'node:path'

import type { ModuleManifestFile } from '@bmad-studio/shared'

import { parseAgent } from '../parsers/agent-parser.js' // TD-18 — reuse the canonical parser
import { parseWorkflow } from '../parsers/workflow-parser.js' // TD-18

import type { FileStore } from './file-store.js'
import { writeFile, deleteDirectory } from './write-service.js'

export type SupportedIde = 'claude-code' | 'antigravity'

const IDE_OUTPUT_DIRS: Record<SupportedIde, string> = {
  'claude-code': '.claude/skills',
  antigravity: '.antigravity/skills',
}

export type GeneratedSkill = {
  skillName: string
  skillDir: string
}

export type GenerateResult =
  | { ok: true; skillsByIde: Record<string, GeneratedSkill[]> }
  | { ok: false; error: string }

/**
 * Generate launcher SKILL.md files for every agent / workflow / task in the
 * installed module. Idempotent — calling repeatedly with no source changes
 * produces byte-identical files and skips redundant writes.
 *
 * Reads `manifest.ides[]` to decide which IDEs to target. Unknown entries are
 * silently filtered. Returns `{ ok: true, skillsByIde: {} }` (no-op) if no
 * supported IDEs are configured.
 *
 * Story 15.6 ships INSTALL HALF ONLY. The matching `removeIdeSkillsForModule`
 * lands in Story 15.7 (which also adds `WriteService.deleteDirectory`, the
 * prerequisite that this story does not depend on).
 */
export function generateIdeSkillsForModule(
  projectRoot: string,
  moduleCode: string,
  manifest: ModuleManifestFile,
  studioDir: string,
  fileStore: FileStore,
): GenerateResult {
  const ides: SupportedIde[] = (manifest.ides ?? []).filter(
    (ide): ide is SupportedIde => ide === 'claude-code' || ide === 'antigravity',
  )
  if (ides.length === 0) {
    return { ok: true, skillsByIde: {} }
  }

  const moduleDir = path.join(projectRoot, '_bmad', moduleCode)
  const agents = scanEntities(path.join(moduleDir, 'agents'), '.md')
  const workflows = scanEntityDirs(path.join(moduleDir, 'workflows'))
  const tasks = scanEntityDirs(path.join(moduleDir, 'tasks'))

  const result: Record<string, GeneratedSkill[]> = {}

  for (const ide of ides) {
    const ideOutputDir = path.join(projectRoot, IDE_OUTPUT_DIRS[ide])
    fs.mkdirSync(ideOutputDir, { recursive: true })

    const generated: GeneratedSkill[] = []

    // Agents
    for (const agentFile of agents) {
      const agentName = path.basename(agentFile, '.md')
      const skillName = `bmad-agent-${moduleCode}-${agentName}`
      const skillDir = path.join(ideOutputDir, skillName)
      const description =
        readAgentDescription(agentFile) ?? `BMAD ${agentName} agent from ${moduleCode}`
      const content = renderSkillMd({
        skillName,
        description,
        targetType: 'agent',
        targetPath: agentFile,
      })
      const r = writeSkillFile(skillDir, content, studioDir, fileStore)
      if (!r.ok) return r
      generated.push({ skillName, skillDir })
    }

    // Workflows
    for (const workflowDir of workflows) {
      const workflowName = path.basename(workflowDir)
      const workflowFile = findWorkflowFile(workflowDir)
      if (!workflowFile) continue
      const skillName = `bmad-${moduleCode}-${workflowName}`
      const skillDir = path.join(ideOutputDir, skillName)
      const description =
        readWorkflowDescription(workflowFile) ?? `BMAD ${workflowName} workflow from ${moduleCode}`
      const content = renderSkillMd({
        skillName,
        description,
        targetType: 'workflow',
        targetPath: workflowFile,
      })
      const r = writeSkillFile(skillDir, content, studioDir, fileStore)
      if (!r.ok) return r
      generated.push({ skillName, skillDir })
    }

    // Tasks (each task is its own directory)
    for (const taskDir of tasks) {
      const taskName = path.basename(taskDir)
      const skillName = `bmad-${moduleCode}-${taskName}`
      const skillDir = path.join(ideOutputDir, skillName)
      // Tasks have no dedicated parser — use the directory name as the description fallback.
      const description = `BMAD ${taskName} task from ${moduleCode}`
      const content = renderSkillMd({
        skillName,
        description,
        targetType: 'task',
        targetPath: taskDir,
      })
      const r = writeSkillFile(skillDir, content, studioDir, fileStore)
      if (!r.ok) return r
      generated.push({ skillName, skillDir })
    }

    result[ide] = generated
  }

  return { ok: true, skillsByIde: result }
}

// ─────────────────────────────────────────────────────────────────────────────
// Removal — Story 15.7
// ─────────────────────────────────────────────────────────────────────────────

export type RemoveResult =
  | { ok: true; removedByIde: Record<string, string[]> }
  | { ok: false; error: string }

/**
 * Remove IDE skill directories for a module across every IDE configured in
 * `manifest.ides[]`. Uses a two-pass strategy to avoid cross-module collisions:
 *
 * Pass 1 — exact match: scan the live module dir to build the set of skill names
 * that `generateIdeSkillsForModule` would produce. These are deleted unconditionally.
 *
 * Pass 2 — orphan cleanup: also remove prefix-matched dirs that were generated for
 * this module but whose source entity no longer exists (e.g. an agent was manually
 * deleted). A prefix match is only acted on when no OTHER installed module claims the
 * same skill name — this prevents removing `bmad-agent-foo-bar-*` when the caller
 * is removing module `foo` (which is a prefix of `foo-bar`).
 *
 * Every removed directory goes through `WriteService.deleteDirectory` so text files
 * inside are snapshotted to `.bmad-studio/history/` before unlink.
 *
 * Returns `{ ok: true, removedByIde: { <ide>: [] } }` for any IDE whose skills
 * directory does not exist (no-op, not an error).
 */
export function removeIdeSkillsForModule(
  projectRoot: string,
  moduleCode: string,
  manifest: ModuleManifestFile,
  studioDir: string,
): RemoveResult {
  const ides: SupportedIde[] = (manifest.ides ?? []).filter(
    (ide): ide is SupportedIde => ide === 'claude-code' || ide === 'antigravity',
  )

  // Pass 1: build the exact set of skill names this module generated by scanning
  // its live directory. The module dir is guaranteed to exist when called from the
  // DELETE handler (removal happens after this) and from regenerate-skills.
  const moduleDir = path.join(projectRoot, '_bmad', moduleCode)
  const exactNames = new Set<string>()
  for (const agentFile of scanEntities(path.join(moduleDir, 'agents'), '.md')) {
    exactNames.add(`bmad-agent-${moduleCode}-${path.basename(agentFile, '.md')}`)
  }
  for (const workflowDir of scanEntityDirs(path.join(moduleDir, 'workflows'))) {
    exactNames.add(`bmad-${moduleCode}-${path.basename(workflowDir)}`)
  }
  for (const taskDir of scanEntityDirs(path.join(moduleDir, 'tasks'))) {
    exactNames.add(`bmad-${moduleCode}-${path.basename(taskDir)}`)
  }

  // Pass 2: for orphan cleanup, collect other installed module codes so we can
  // skip skill dirs that belong to a module whose code starts with our prefix
  // (e.g. don't delete 'bmad-agent-foo-bar-*' when removing module 'foo').
  const otherModuleCodes = manifest.modules
    .map((m) => m.name)
    .filter((n) => n !== moduleCode)

  const agentPrefix = `bmad-agent-${moduleCode}-`
  const otherPrefix = `bmad-${moduleCode}-`

  const removedByIde: Record<string, string[]> = {}

  for (const ide of ides) {
    const ideOutputDir = path.join(projectRoot, IDE_OUTPUT_DIRS[ide])
    if (!fs.existsSync(ideOutputDir)) {
      removedByIde[ide] = []
      continue
    }

    const removed: string[] = []

    for (const entry of fs.readdirSync(ideOutputDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue
      const name = entry.name

      const isExact = exactNames.has(name)
      const isPrefixMatch = name.startsWith(agentPrefix) || name.startsWith(otherPrefix)

      if (!isExact && !isPrefixMatch) continue

      // For orphaned skills (prefix match but not in exact set), skip if another
      // installed module also claims this skill name via its own prefixes.
      if (!isExact) {
        const claimedByOther = otherModuleCodes.some(
          (other) =>
            name.startsWith(`bmad-agent-${other}-`) || name.startsWith(`bmad-${other}-`),
        )
        if (claimedByOther) continue
      }

      const skillDir = path.join(ideOutputDir, name)
      const r = deleteDirectory(skillDir, studioDir)
      if (!r.ok) return { ok: false, error: r.error }
      removed.push(name)
    }

    removedByIde[ide] = removed
  }

  return { ok: true, removedByIde }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers (private)
// ─────────────────────────────────────────────────────────────────────────────

export function scanEntities(dir: string, ext: string): string[] {
  if (!fs.existsSync(dir)) return []
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith(ext))
    .map((e) => path.join(dir, e.name))
}

export function scanEntityDirs(dir: string): string[] {
  if (!fs.existsSync(dir)) return []
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => path.join(dir, e.name))
}

function findWorkflowFile(workflowDir: string): string | null {
  for (const candidate of ['workflow.md', 'workflow.yaml']) {
    const p = path.join(workflowDir, candidate)
    if (fs.existsSync(p)) return p
  }
  return null
}

function readAgentDescription(agentFile: string): string | null {
  try {
    // TD-18 — reuse parseAgent (handles XML <agent title=...> AND frontmatter description).
    const raw = fs.readFileSync(agentFile, 'utf-8')
    const result = parseAgent(agentFile, raw)
    if (!result.ok) return null
    return result.data.title || result.data.role || null
  } catch {
    return null
  }
}

function readWorkflowDescription(workflowFile: string): string | null {
  try {
    // TD-18 — reuse parseWorkflow. It expects a workflow DIR, not a file.
    const wfDir = path.dirname(workflowFile)
    const result = parseWorkflow(wfDir)
    if (!result.ok) return null
    return result.data.description || null
  } catch {
    return null
  }
}

function renderSkillMd(args: {
  skillName: string
  description: string
  targetType: 'agent' | 'workflow' | 'task'
  targetPath: string
}): string {
  const verbByType = {
    agent: 'Load and activate the agent defined at',
    workflow: 'Load and execute the workflow defined at',
    task: 'Load and execute the task defined at',
  }
  return [
    '---',
    `name: ${args.skillName}`,
    `description: "${args.description.replaceAll('\r', '').replaceAll('\n', ' ').replaceAll('"', '\\"')}"`,
    '---',
    '',
    `${verbByType[args.targetType]}:`,
    args.targetPath, // absolute path — see Q8 / TD
    '',
    'Follow all activation / step instructions defined in the file above.',
    '',
    '<!-- Generated by BMAD Studio. Do not edit manually — re-run "Regenerate IDE skills" instead. -->',
    '<!-- Note: this skill uses an absolute path. Moving the project will break the link; click "Regenerate IDE skills" on the module row to re-create the launchers in the new location. -->',
    '',
  ].join('\n')
}

function writeSkillFile(
  skillDir: string,
  content: string,
  studioDir: string,
  fileStore: FileStore,
): { ok: true } | { ok: false; error: string } {
  fs.mkdirSync(skillDir, { recursive: true })
  const filePath = path.join(skillDir, 'SKILL.md')

  // Idempotent early-exit (per Story 15.6 Dev Notes): if the file already exists
  // with byte-identical content, skip the write so re-runs don't pollute history.
  if (fs.existsSync(filePath)) {
    try {
      const existing = fs.readFileSync(filePath, 'utf-8')
      if (existing === content) return { ok: true }
    } catch (err) {
      return {
        ok: false,
        error: `Failed to read existing skill file for idempotency check: ${err instanceof Error ? err.message : String(err)}`,
      }
    }
  }

  fileStore.markPendingWrite(filePath)
  const result = writeFile(filePath, content, studioDir)
  fileStore.clearPendingWrite(filePath)
  return result.ok ? { ok: true } : { ok: false, error: result.error }
}
