import type { FastifyInstance } from 'fastify'

export async function overviewPlugin(app: FastifyInstance) {
  app.get('/api/overview', async () => {
    const hasStore = 'fileStore' in app

    if (!hasStore) {
      return { detected: false, sections: {} }
    }

    const index = app.fileStore.getIndex()

    return {
      detected: true,
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
            skillCount: a.skills.length,
            module: a.module,
          })),
          count: index.agents.filter((a) => a.name || a.title).length,
        },
        process: {
          workflows: index.workflows.map((w) => ({
            id: w.id,
            name: w.name,
            stepCount: w.steps.length,
            module: w.module,
            type: w.type,
          })),
          count: index.workflows.length,
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
