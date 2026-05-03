/**
 * Adapts the merged [agent] block from a v6.5 customize.toml into the
 * existing Agent shape used by the rest of BMAD Studio.
 *
 * The v6.5 customize.toml uses snake_case field names and a slightly
 * different menu structure than the existing Agent type — this module
 * bridges the gap.
 */

import * as path from 'node:path'
import { resolveSkillCustomization } from './customize-resolver.js'
import type { TomlObject } from './customize-resolver.js'
import type { Agent, AgentMenuItem } from '@bmad-studio/shared'
import { ManifestMissingError } from '../core/errors.js'

/** The raw [[agent.menu]] item shape from a v6.5 customize.toml. */
interface TomlMenuEntry {
  code: string
  description: string
  skill?: string
  prompt?: string
}

/**
 * Map a single `[[agent.menu]]` entry to an `AgentMenuItem`.
 *
 * v6.5 uses  { code, description, skill?, prompt? }
 * Agent uses { trigger, input, route, action? }
 */
function adaptMenuItem(entry: TomlMenuEntry): AgentMenuItem {
  return {
    trigger: entry.code,
    input: entry.description,
    route: entry.skill ?? entry.prompt ?? '',
  }
}

/**
 * Returns a sensible default Agent skeleton for cases where no
 * customize.toml is present (ManifestMissingError falls through to this).
 */
function applyDefaults(partial: Partial<Agent>, skillPath: string): Agent {
  return {
    id: partial.id ?? path.basename(skillPath),
    name: partial.name ?? path.basename(skillPath),
    title: partial.title ?? '',
    icon: partial.icon,
    role: partial.role ?? '',
    module: partial.module,
    discussion: partial.discussion ?? false,
    webskip: partial.webskip ?? false,
    hasSidecar: partial.hasSidecar ?? false,
    menu: partial.menu ?? [],
    skills: partial.skills ?? [],
    identity: partial.identity,
    communicationStyle: partial.communicationStyle,
    principles: partial.principles,
    conversationalKnowledge: partial.conversationalKnowledge,
    customizations: partial.customizations,
    filePath: partial.filePath ?? skillPath,
  }
}

/**
 * Adapts the merged `[agent]` block from a v6.5 `customize.toml` into the
 * existing `Agent` shape.
 *
 * @param skillPath   Absolute path to the skill directory (must contain
 *                    `customize.toml` for field overrides to apply).
 * @param projectRoot Absolute project root (used to locate optional
 *                    `_bmad/custom/<skillName>.toml` team/user overrides).
 * @param baseAgent   Base Agent object — merged with [agent] overrides.
 *                    All fields not present in customize.toml are preserved.
 * @returns           Fully populated Agent (never throws for missing toml).
 */
export function adaptAgent(
  skillPath: string,
  projectRoot: string,
  baseAgent: Partial<Agent>,
): Agent {
  let merged: TomlObject

  try {
    merged = resolveSkillCustomization(skillPath, projectRoot)
  } catch (err) {
    if (err instanceof ManifestMissingError) {
      // No customize.toml — return baseAgent with defaults filled in.
      return applyDefaults(baseAgent, skillPath)
    }
    throw err
  }

  const agentBlock = (merged.agent ?? {}) as TomlObject
  const rawMenu = (agentBlock.menu ?? []) as unknown as TomlMenuEntry[]

  // Map principles (string[] in TOML) to Agent.principles (string).
  // Join with newline so the full list is preserved as a single string.
  const principlesArr = agentBlock.principles as string[] | undefined
  const principles =
    principlesArr && principlesArr.length > 0
      ? principlesArr.join('\n')
      : (baseAgent.principles ?? undefined)

  const menu: AgentMenuItem[] = rawMenu.map(adaptMenuItem)

  return {
    // Structural fields preserved from baseAgent (not in customize.toml)
    id: baseAgent.id ?? path.basename(skillPath),
    module: baseAgent.module,
    discussion: baseAgent.discussion ?? false,
    webskip: baseAgent.webskip ?? false,
    hasSidecar: baseAgent.hasSidecar ?? false,
    skills: baseAgent.skills ?? [],
    conversationalKnowledge: baseAgent.conversationalKnowledge,
    customizations: baseAgent.customizations,
    filePath: baseAgent.filePath ?? skillPath,

    // Fields from [agent] block, falling back to baseAgent values
    name: (agentBlock.name as string | undefined) ?? baseAgent.name ?? path.basename(skillPath),
    title: (agentBlock.title as string | undefined) ?? baseAgent.title ?? '',
    icon: (agentBlock.icon as string | undefined) ?? baseAgent.icon,
    role: (agentBlock.role as string | undefined) ?? baseAgent.role ?? '',
    identity: (agentBlock.identity as string | undefined) ?? baseAgent.identity,
    communicationStyle:
      (agentBlock.communication_style as string | undefined) ?? baseAgent.communicationStyle,
    principles,
    menu: menu.length > 0 ? menu : (baseAgent.menu ?? []),
  }
}
