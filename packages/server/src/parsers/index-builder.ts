import fs from 'node:fs'
import path from 'node:path'

import { load as loadYaml } from 'js-yaml'
import { parse as parseToml } from 'smol-toml'

import type { Agent, Skill, Workflow, Package, Team } from '@bmad-studio/shared'

import type { ParseResult, ParsedConfig } from './config-parser.js'
import { parseConfig } from './config-parser.js'
import { parseAgent, parseAgentV65 } from './agent-parser.js'
import { parseSkill } from './skill-parser.js'
import { parseWorkflow, parseWorkflowV65 } from './workflow-parser.js'
import { parsePackage } from './package-parser.js'
import { parseIdeConfig } from './ide-config-parser.js'
import { parseTeam } from './team-parser.js'
import { parseCsv } from './csv-parser.js'
import type { IdeConfig } from './ide-config-parser.js'
import type { CsvRow } from './csv-parser.js'

export type EntityIndex = {
  agents: Agent[]
  skills: Skill[]
  workflows: Workflow[]
  teams: Team[]
  configs: ParsedConfig[]
  packages: Package[]
  ideConfigs: IdeConfig[]
  manifests: CsvRow[][]
  errors: Array<{ error: string; filePath: string }>
}

function readFilesSafe(dir: string, ext: string): Array<{ path: string; content: string }> {
  const results: Array<{ path: string; content: string }> = []
  if (!fs.existsSync(dir)) return results

  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isFile() && entry.name.endsWith(ext)) {
      results.push({ path: fullPath, content: fs.readFileSync(fullPath, 'utf-8') })
    }
  }
  return results
}

function scanRecursive(
  dir: string,
  predicate: (name: string, isDir: boolean) => boolean,
): string[] {
  const results: string[] = []
  if (!fs.existsSync(dir)) return results

  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (predicate(entry.name, entry.isDirectory())) {
      results.push(fullPath)
    }
    if (entry.isDirectory() && !entry.name.startsWith('.')) {
      results.push(...scanRecursive(fullPath, predicate))
    }
  }
  return results
}

function collectResult<T>(result: ParseResult<T>, successes: T[], errors: EntityIndex['errors']) {
  if (result.ok) {
    successes.push(result.data)
  } else {
    errors.push({ error: result.error, filePath: result.filePath })
  }
}

/**
 * Title-case a string (e.g. "analysis" -> "Analysis", "my-team" -> "My-team")
 */
function toTitleCase(str: string): string {
  if (!str) return str
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export function buildIndex(projectRoot: string): EntityIndex {
  const bmadDir = path.join(projectRoot, '_bmad')
  const index: EntityIndex = {
    agents: [],
    skills: [],
    workflows: [],
    teams: [],
    configs: [],
    packages: [],
    ideConfigs: [],
    manifests: [],
    errors: [],
  }

  if (!fs.existsSync(bmadDir)) {
    return index
  }

  // Parse configs from each module (common to v6 and v6.5)
  const configFiles = scanRecursive(bmadDir, (name) => name === 'config.yaml')
  for (const configPath of configFiles) {
    const content = fs.readFileSync(configPath, 'utf-8')
    collectResult(parseConfig(configPath, content, projectRoot), index.configs, index.errors)
  }

  // Detect v6.5 by presence of _bmad/_config/manifest.yaml with installation.version starting with "6.5"
  const manifestYamlPath = path.join(bmadDir, '_config', 'manifest.yaml')
  let isV65 = false
  if (fs.existsSync(manifestYamlPath)) {
    try {
      const manifestContent = loadYaml(
        fs.readFileSync(manifestYamlPath, 'utf-8'),
      ) as Record<string, unknown>
      const installation = manifestContent?.installation as Record<string, unknown> | undefined
      const version = String(installation?.version ?? '')
      isV65 = version.startsWith('6.5')
    } catch {
      // If we can't parse the manifest, assume v6
    }
  }

  if (isV65) {
    // v6.5: Classify entities via customize.toml block type
    const customizeFiles = scanRecursive(bmadDir, (name) => name === 'customize.toml').filter(
      (f) => !f.includes(`${path.sep}_config${path.sep}`),
    )

    for (const customizePath of customizeFiles) {
      const dirPath = path.dirname(customizePath)
      const relPath = path.relative(bmadDir, dirPath)
      const moduleName = relPath.split(path.sep)[0]

      if (moduleName === '_config') continue

      const content = fs.readFileSync(customizePath, 'utf-8')
      let parsed: Record<string, unknown>
      try {
        parsed = parseToml(content) as Record<string, unknown>
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        index.errors.push({ error: `TOML parse error: ${message}`, filePath: customizePath })
        continue
      }

      if ('agent' in parsed) {
        const result = parseAgentV65(dirPath, content)
        if (result.ok) {
          result.data.module = moduleName
        }
        collectResult(result, index.agents, index.errors)
      } else if ('workflow' in parsed) {
        const result = parseWorkflowV65(dirPath, content)
        if (result.ok) {
          result.data.module = moduleName
        }
        collectResult(result, index.workflows, index.errors)
      } else {
        index.errors.push({
          error: 'customize.toml has neither [agent] nor [workflow] block',
          filePath: customizePath,
        })
      }
    }

    // Story 37.2: Enrich agent data from _bmad/config.toml [agents.*] tables
    const mainConfigTomlPath = path.join(bmadDir, 'config.toml')
    if (fs.existsSync(mainConfigTomlPath)) {
      try {
        const configToml = parseToml(fs.readFileSync(mainConfigTomlPath, 'utf-8')) as Record<
          string,
          unknown
        >
        const agentLookup = (configToml.agents || {}) as Record<
          string,
          Record<string, unknown>
        >

        for (const agent of index.agents) {
          const entry = agentLookup[agent.id]
          if (entry) {
            if (!agent.name && entry.name) agent.name = String(entry.name)
            if (!agent.title && entry.title) agent.title = String(entry.title)
            if (!agent.icon && entry.icon) agent.icon = String(entry.icon)
            if (!agent.team && entry.team) agent.team = String(entry.team)
            if (!agent.description && entry.description)
              agent.description = String(entry.description)
            if (!agent.module && entry.module) agent.module = String(entry.module)
          }
        }

        // Story 40.1: Derive teams from config.toml [agents.*] team fields
        // Group agents by their team field value
        const teamMap = new Map<string, string[]>()
        for (const agent of index.agents) {
          if (agent.team) {
            const members = teamMap.get(agent.team) ?? []
            members.push(agent.id)
            teamMap.set(agent.team, members)
          }
        }

        for (const [teamId, agentIds] of teamMap) {
          // Build members from agent data
          const members = agentIds.flatMap((agentId) => {
            const agent = index.agents.find((a) => a.id === agentId)
            if (!agent) return []
            return [{
              agentId,
              displayName: agent.title || agent.name || agentId,
              title: agent.title || '',
              icon: agent.icon || '',
              role: agent.role || '',
              communicationStyle: agent.communicationStyle || '',
              identity: agent.identity || '',
              principles: agent.principles || '',
              module: agent.module || '',
            }]
          })

          index.teams.push({
            id: teamId,
            name: toTitleCase(teamId),
            icon: '',
            description: '',
            agentIds,
            members,
            partyFile: '',
            filePath: mainConfigTomlPath,
          })
        }
      } catch {
        // config.toml enrichment is best-effort — skip on parse failure
      }
    }
  } else {
    // v6: Use legacy agent and workflow scan heuristics

    // Parse agent files (*.md in agents/ directories)
    const agentFiles = scanRecursive(
      bmadDir,
      (name, isDir) => !isDir && name.endsWith('.md'),
    ).filter((f) => f.includes('/agents/') && !f.includes('bmad-skill-manifest'))
    for (const agentPath of agentFiles) {
      const content = fs.readFileSync(agentPath, 'utf-8')
      const result = parseAgent(agentPath, content)
      if (result.ok) {
        // Derive module from path
        const relPath = path.relative(bmadDir, agentPath)
        const moduleName = relPath.split(path.sep)[0]
        if (moduleName !== '_config') {
          result.data.module = moduleName
        }
      }
      collectResult(result, index.agents, index.errors)
    }

    // Parse workflows (directories containing workflow.md or bmad-manifest.json)
    const workflowEntryFiles = scanRecursive(
      bmadDir,
      (name) => name === 'workflow.md' || name === 'bmad-manifest.json',
    )
    // Deduplicate by directory (a dir may have both workflow.md and bmad-manifest.json)
    const workflowDirs = new Set<string>()
    for (const entryPath of workflowEntryFiles) {
      workflowDirs.add(path.dirname(entryPath))
    }
    for (const wfDir of workflowDirs) {
      const result = parseWorkflow(wfDir)
      if (result.ok) {
        const relPath = path.relative(bmadDir, wfDir)
        const moduleName = relPath.split(path.sep)[0]
        if (moduleName !== '_config') {
          result.data.module = moduleName
        }
      }
      collectResult(result, index.workflows, index.errors)
    }

    // Parse team files (*.yaml in teams/ directories) — v6 only
    const teamFiles = scanRecursive(
      bmadDir,
      (name, isDir) => !isDir && name.endsWith('.yaml'),
    ).filter((f) => f.includes('/teams/') && !f.includes('manifest'))
    for (const teamPath of teamFiles) {
      const result = parseTeam(teamPath)
      if (result.ok) {
        const relPath = path.relative(bmadDir, teamPath)
        const moduleName = relPath.split(path.sep)[0]
        if (moduleName !== '_config') {
          result.data.module = moduleName
        }
      }
      collectResult(result, index.teams, index.errors)
    }
  }

  // Parse skill files (SKILL.md) — common to v6 and v6.5
  const skillFiles = scanRecursive(bmadDir, (name) => name === 'SKILL.md')
  for (const skillPath of skillFiles) {
    const content = fs.readFileSync(skillPath, 'utf-8')
    const result = parseSkill(skillPath, content)
    if (result.ok) {
      const relPath = path.relative(bmadDir, skillPath)
      const moduleName = relPath.split(path.sep)[0]
      if (moduleName !== '_config') {
        result.data.module = moduleName
      }
    }
    collectResult(result, index.skills, index.errors)
  }

  // Parse package files
  const packageFiles = scanRecursive(bmadDir, (name) => name === 'package.yaml')
  for (const pkgPath of packageFiles) {
    const content = fs.readFileSync(pkgPath, 'utf-8')
    collectResult(parsePackage(pkgPath, content), index.packages, index.errors)
  }

  // Parse IDE configs
  const ideDir = path.join(bmadDir, '_config', 'ides')
  const ideFiles = readFilesSafe(ideDir, '.yaml')
  for (const file of ideFiles) {
    collectResult(parseIdeConfig(file.path, file.content), index.ideConfigs, index.errors)
  }

  // Parse CSV manifests
  const csvFiles = readFilesSafe(path.join(bmadDir, '_config'), '.csv')
  for (const file of csvFiles) {
    const result = parseCsv(file.path, file.content)
    if (result.ok) {
      index.manifests.push(result.data)
    } else {
      index.errors.push({ error: result.error, filePath: result.filePath })
    }
  }

  return index
}
