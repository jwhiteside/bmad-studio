/**
 * Workflow adapter for BMAD v6.5.
 *
 * Maps the `[workflow]` block from a merged `customize.toml` into the
 * `Workflow` shape's `hooks` and `persistentFacts` fields.
 *
 * ADR-9: Hook fields are always returned as `HookEntry[]` regardless of
 * whether the on-disk TOML stores them as a scalar string or string array.
 */

import * as fs from 'node:fs'
import * as path from 'node:path'
import { resolveSkillCustomization } from './customize-resolver.js'
import type { TomlObject, TomlValue } from './customize-resolver.js'
import type { Workflow } from '@bmad-studio/shared'
import type { WorkflowHooks, HookEntry } from '@bmad-studio/shared'

// ---------------------------------------------------------------------------
// Sidecar comment parser
// ---------------------------------------------------------------------------

/**
 * Parses the sidecar comment block in a raw TOML string to extract
 * disabled-flag state per hook command.
 *
 * Format:
 *   # bmad-studio:hook-state
 *   # <command>=disabled
 *
 * Returns a Map of command string → true (disabled). Only commands explicitly
 * marked `=disabled` appear in the map.
 */
function parseSidecarState(rawToml: string): Map<string, boolean> {
  const result = new Map<string, boolean>()
  const lines = rawToml.split('\n')

  let inHookState = false
  for (const line of lines) {
    const trimmed = line.trim()

    if (trimmed === '# bmad-studio:hook-state') {
      inHookState = true
      continue
    }

    if (inHookState) {
      // Continue only while we see comment lines
      if (!trimmed.startsWith('#')) {
        inHookState = false
        continue
      }

      const content = trimmed.slice(1).trim() // strip leading '#'
      if (content.endsWith('=disabled')) {
        const command = content.slice(0, content.length - '=disabled'.length).trim()
        if (command.length > 0) {
          result.set(command, true)
        }
      }
    }
  }

  return result
}

// ---------------------------------------------------------------------------
// Hook field normaliser
// ---------------------------------------------------------------------------

/**
 * Normalises a TOML hook value to `HookEntry[]`.
 *
 * Handles:
 *   - null / undefined → []
 *   - scalar string    → [{ command }]
 *   - string[]         → [{ command }...]  (each string becomes one entry)
 *
 * `disabled` state is applied from `sidecar` when a command matches.
 */
function normaliseHookField(
  val: TomlValue | undefined,
  sidecar: Map<string, boolean>,
): HookEntry[] {
  if (val == null) {
    return []
  }

  if (typeof val === 'string') {
    if (val.trim() === '') {
      return []
    }
    const entry: HookEntry = { command: val }
    if (sidecar.get(val)) {
      entry.disabled = true
    }
    return [entry]
  }

  if (Array.isArray(val)) {
    const entries: HookEntry[] = []
    for (const item of val) {
      if (typeof item === 'string' && item.trim() !== '') {
        const entry: HookEntry = { command: item }
        if (sidecar.get(item)) {
          entry.disabled = true
        }
        entries.push(entry)
      }
    }
    return entries
  }

  // Non-string scalar (number, boolean, table) — ignore
  return []
}

// ---------------------------------------------------------------------------
// Empty hooks sentinel
// ---------------------------------------------------------------------------

function emptyHooks(): WorkflowHooks {
  return {
    activationStepsPrepend: [],
    activationStepsAppend: [],
    onComplete: [],
  }
}

// ---------------------------------------------------------------------------
// adaptWorkflow
// ---------------------------------------------------------------------------

/**
 * Adapts the merged `[workflow]` block from a v6.5 `customize.toml` into
 * the workflow's `hooks` and `persistentFacts` fields.
 *
 * - When no `customize.toml` exists at `<skillPath>/customize.toml`, the
 *   function returns `baseWorkflow` with empty hooks (no throw).
 * - Hook fields (`activation_steps_prepend`, `activation_steps_append`,
 *   `on_complete`) are normalised to `HookEntry[]` per ADR-9.
 * - `persistent_facts` is normalised to `string[]`.
 * - Sidecar `# bmad-studio:hook-state` blocks set `disabled: true` on
 *   matching hook entries.
 *
 * @param skillPath    Absolute path to the skill/workflow directory.
 * @param projectRoot  Absolute project root (for _bmad/custom/ overrides).
 * @param baseWorkflow Base Workflow object to merge hook data into.
 */
export function adaptWorkflow(
  skillPath: string,
  projectRoot: string,
  baseWorkflow: Partial<Workflow>,
): Workflow {
  // Attempt to resolve the layered TOML. When the base customize.toml is
  // absent, resolveSkillCustomization throws ManifestMissingError — we catch
  // that and fall back to an empty-hooks result so callers don't need to guard.
  let merged: TomlObject
  try {
    merged = resolveSkillCustomization(skillPath, projectRoot)
  } catch {
    // No customize.toml → return baseWorkflow with empty hooks
    return {
      ...baseWorkflow,
      id: baseWorkflow.id ?? '',
      name: baseWorkflow.name ?? '',
      description: baseWorkflow.description ?? '',
      entryPoint: baseWorkflow.entryPoint ?? '',
      steps: baseWorkflow.steps ?? [],
      filePath: baseWorkflow.filePath ?? skillPath,
      hooks: emptyHooks(),
      persistentFacts: [],
    } as Workflow
  }

  // Read the raw base file for sidecar comment parsing
  const basePath = path.join(skillPath, 'customize.toml')
  let sidecar = new Map<string, boolean>()
  try {
    const raw = fs.readFileSync(basePath, 'utf8')
    sidecar = parseSidecarState(raw)
  } catch {
    // Sidecar parsing is best-effort; failures are silently ignored
  }

  // Extract the [workflow] sub-table
  const workflowBlock = (merged.workflow ?? {}) as TomlObject

  // Normalise hook fields
  const hooks: WorkflowHooks = {
    activationStepsPrepend: normaliseHookField(
      workflowBlock.activation_steps_prepend,
      sidecar,
    ),
    activationStepsAppend: normaliseHookField(
      workflowBlock.activation_steps_append,
      sidecar,
    ),
    onComplete: normaliseHookField(workflowBlock.on_complete, sidecar),
  }

  // Normalise persistent_facts to string[]
  const rawFacts = workflowBlock.persistent_facts
  let persistentFacts: string[] = []
  if (Array.isArray(rawFacts)) {
    persistentFacts = rawFacts.filter((f): f is string => typeof f === 'string')
  } else if (typeof rawFacts === 'string' && rawFacts.trim() !== '') {
    persistentFacts = [rawFacts]
  }

  return {
    ...baseWorkflow,
    id: baseWorkflow.id ?? '',
    name: baseWorkflow.name ?? '',
    description: baseWorkflow.description ?? '',
    entryPoint: baseWorkflow.entryPoint ?? '',
    steps: baseWorkflow.steps ?? [],
    filePath: baseWorkflow.filePath ?? skillPath,
    hooks,
    persistentFacts,
  } as Workflow
}
