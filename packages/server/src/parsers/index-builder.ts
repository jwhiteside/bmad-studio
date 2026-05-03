import fs from 'node:fs'
import path from 'node:path'

import { load as loadYaml } from 'js-yaml'
import { parse as parseToml } from 'smol-toml'

import type { Agent, Skill, Workflow, Package, Team } from '@bmad-studio/shared'

import type { ParseResult, ParsedConfig } from './config-parser.js'
import { parseConfig } from './config-parser.js'
import { parseAgent } from './agent-parser.js'
import { parseSkill } from './skill-parser.js'
import { parseWorkflow } from './workflow-parser.js'
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

/**
 * Returns true for v6.5 and above (the new entity model introduced in v6.5).
 * v7, v8, etc. also use this model; v6.0–v6.4 use the legacy md-file scanner.
 */
export function isNewEntityModel(version: string): boolean {
  const parts = version.split('.')
  const major = parseInt(parts[0] ?? '0', 10)
  const minor = parseInt(parts[1] ?? '0', 10)
  if (isNaN(major) || isNaN(minor)) return false
  return major > 6 || (major === 6 && minor >= 5)
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
      isV65 = isNewEntityModel(version)
    } catch {
      // If we can't parse the manifest, assume v6
    }
  }

  if (isV65) {
    // v6.5: canonical skill list comes from _config/skill-manifest.csv.
    // Entity type: skills listed in config.toml [agents.*] are Agents; everything else is a Workflow.

    const mainConfigTomlPath = path.join(bmadDir, 'config.toml')
    let agentLookup: Record<string, Record<string, unknown>> = {}
    if (fs.existsSync(mainConfigTomlPath)) {
      try {
        const configToml = parseToml(fs.readFileSync(mainConfigTomlPath, 'utf-8')) as Record<string, unknown>
        agentLookup = (configToml.agents || {}) as Record<string, Record<string, unknown>>
      } catch {
        // best-effort
      }
    }

    const skillManifestPath = path.join(bmadDir, '_config', 'skill-manifest.csv')
    if (fs.existsSync(skillManifestPath)) {
      const csvResult = parseCsv(skillManifestPath, fs.readFileSync(skillManifestPath, 'utf-8'))
      if (csvResult.ok) {
        for (const row of csvResult.data) {
          const id = row['canonicalId'] || row['id'] || ''
          const name = row['name'] || id
          const description = row['description'] || ''
          const module_ = row['module'] || ''
          const skillPath = row['path'] || ''
          const filePath = skillPath ? path.join(projectRoot, skillPath) : ''

          if (id in agentLookup) {
            const meta = agentLookup[id]
            index.agents.push({
              id,
              name: String(meta.name || name),
              title: String(meta.title || ''),
              icon: meta.icon ? String(meta.icon) : undefined,
              role: String(meta.description || description),
              module: String(meta.module || module_),
              team: meta.team ? String(meta.team) : undefined,
              description: String(meta.description || description),
              discussion: false,
              webskip: false,
              hasSidecar: false,
              menu: [],
              skills: [],
              filePath,
            })
          } else {
            // Determine if utility (no customize.toml) or proper workflow
            const skillDir = skillPath ? path.dirname(path.join(projectRoot, skillPath)) : ''
            let workflowType: import('@bmad-studio/shared').WorkflowType =
              module_ === 'core' ? 'utility' : 'step-based'
            const subAgents: import('@bmad-studio/shared').WorkflowSubAgent[] = []

            if (skillDir && fs.existsSync(skillDir)) {
              // If no customize.toml exists in this skill dir it's a utility skill
              if (!fs.existsSync(path.join(skillDir, 'customize.toml'))) {
                workflowType = 'utility'
              }

              // Collect sub-agents from agents/ subdirectory
              const agentsDir = path.join(skillDir, 'agents')
              if (fs.existsSync(agentsDir)) {
                for (const entry of fs.readdirSync(agentsDir)) {
                  if (!entry.endsWith('.md')) continue
                  const agentFilePath = path.join(agentsDir, entry)
                  const content = fs.readFileSync(agentFilePath, 'utf-8')
                  const h1Match = content.match(/^#\s+(.+)$/m)
                  const agentName = h1Match
                    ? h1Match[1].trim()
                    : entry.replace(/\.md$/, '').replace(/-/g, ' ')
                  subAgents.push({
                    id: entry.replace(/\.md$/, ''),
                    name: agentName,
                    filePath: agentFilePath,
                  })
                }
              }
            }

            index.workflows.push({
              id,
              name,
              description,
              entryPoint: filePath,
              steps: [],
              filePath,
              module: module_,
              type: workflowType,
              subAgents: subAgents.length > 0 ? subAgents : undefined,
            })
          }
        }
      } else {
        index.errors.push({ error: skillManifestPath, filePath: skillManifestPath })
      }
    }

    // Derive teams from config.toml [agents.*] team fields
    const teamMap = new Map<string, string[]>()
    for (const agent of index.agents) {
      if (agent.team) {
        const members = teamMap.get(agent.team) ?? []
        members.push(agent.id)
        teamMap.set(agent.team, members)
      }
    }

    for (const [teamId, agentIds] of teamMap) {
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
