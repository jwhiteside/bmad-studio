import type { FastifyInstance } from 'fastify'
import fs from 'node:fs'
import path from 'node:path'

export async function overviewPlugin(app: FastifyInstance) {
  app.get('/api/overview', async () => {
    const hasStore = 'fileStore' in app

    if (!hasStore) {
      return { detected: false, sections: {}, projectHealth: { hasProjectContext: false } }
    }

    const index = app.fileStore.getIndex()

    // Detect project-context.md and extract overview description
    const projectContextPath = path.join(app.fileStore.projectRoot, '_bmad-output', 'project-context.md')
    const hasProjectContext = fs.existsSync(projectContextPath)
    let projectDescription = ''
    if (hasProjectContext) {
      const content = fs.readFileSync(projectContextPath, 'utf-8')
      // Extract first paragraph after "## Project Overview" or "## Overview"
      const overviewMatch = content.match(/^##\s+(?:Project\s+)?Overview\s*\n+([\s\S]*?)(?=\n##|\n---|\n$)/im)
      if (overviewMatch) {
        // Take the first paragraph (non-empty lines before a blank line)
        const firstPara = overviewMatch[1].trim().split(/\n\n/)[0].trim()
        projectDescription = firstPara
      }
    }

    // Toolkit summary stats (Story 26.3)
    const assignedSkillIds = new Set<string>()
    for (const agent of index.agents) {
      for (const skillRef of agent.skills ?? []) {
        assignedSkillIds.add(skillRef)
      }
    }
    const toolkitStats = {
      totalSkills: index.skills.length,
      assignedSkills: assignedSkillIds.size,
      unassignedSkills: index.skills.length - assignedSkillIds.size,
      totalAgents: index.agents.filter((a) => a.name || a.title).length,
      totalWorkflows: index.workflows.length,
      totalTeams: index.teams.length,
    }

    return {
      detected: true,
      projectHealth: { hasProjectContext, projectDescription },
      toolkitStats,
      sections: {
        teams: {
          teams: index.teams.map((t) => ({
            id: t.id,
            name: t.name,
            icon: t.icon,
            description: t.description,
            memberCount: t.members.length,
            module: t.module,
          })),
          count: index.teams.length,
        },
        team: {
          agents: index.agents.filter((a) => a.name || a.title).map((a) => ({
            id: a.id,
            name: a.name,
            title: a.title,
            icon: a.icon,
            role: a.role,
            communicationStyle: a.communicationStyle,
            skillCount: (a.skills ?? []).length,
            module: a.module,
          })),
          count: index.agents.filter((a) => a.name || a.title).length,
        },
        process: {
          workflows: index.workflows.map((w) => {
            const hc = w.hooks
              ? (w.hooks.activationStepsPrepend?.length ?? 0) +
                (w.hooks.activationStepsAppend?.length ?? 0) +
                (w.hooks.onComplete?.length ?? 0)
              : 0
            return {
              id: w.id,
              name: w.name,
              stepCount: w.steps.length,
              module: w.module,
              type: w.type,
              hookCount: hc > 0 ? hc : undefined,
            }
          }),
          count: index.workflows.length,
          integrationCount: index.workflows.reduce((sum, w) => {
            if (!w.hooks) return sum
            return sum +
              (w.hooks.activationStepsPrepend?.length ?? 0) +
              (w.hooks.activationStepsAppend?.length ?? 0) +
              (w.hooks.onComplete?.length ?? 0)
          }, 0),
        },
        toolkit: {
          skills: index.skills.map((s) => ({
            id: s.id,
            name: s.name,
            module: s.module,
          })),
          count: index.skills.length,
        },
        packages: {
          packages: index.packages.map((p) => ({
            name: p.name,
            version: p.version,
            agentCount: p.agents.length,
            skillCount: p.skills.length,
          })),
          count: index.packages.length,
        },
        ideConfigs: {
          ides: index.ideConfigs.map((c) => c.ide),
          count: index.ideConfigs.length,
        },
      },
    }
  })
}
