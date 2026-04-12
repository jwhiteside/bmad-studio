import type { FastifyInstance } from 'fastify'

type SearchResult = {
  type: 'agent' | 'skill' | 'workflow' | 'team'
  id: string
  name: string
  title?: string
  icon?: string
  description: string
  module?: string
}

export async function searchPlugin(app: FastifyInstance) {
  app.get<{ Querystring: { q: string } }>('/api/search', async (request) => {
    const query = (request.query.q || '').toLowerCase().trim()
    if (!query || !('fileStore' in app)) return []

    const index = app.fileStore.getIndex()
    const results: SearchResult[] = []

    for (const agent of index.agents) {
      if (
        agent.name.toLowerCase().includes(query) ||
        (agent.title && agent.title.toLowerCase().includes(query)) ||
        agent.role.toLowerCase().includes(query)
      ) {
        results.push({
          type: 'agent',
          id: agent.id,
          name: agent.name,
          title: agent.title,
          icon: agent.icon,
          description: agent.role,
          module: agent.module,
        })
      }
    }

    for (const skill of index.skills) {
      if (
        skill.name.toLowerCase().includes(query) ||
        skill.description.toLowerCase().includes(query)
      ) {
        results.push({
          type: 'skill',
          id: skill.id,
          name: skill.name,
          description: skill.description,
          module: skill.module,
        })
      }
    }

    for (const workflow of index.workflows) {
      if (
        workflow.name.toLowerCase().includes(query) ||
        workflow.description.toLowerCase().includes(query)
      ) {
        results.push({
          type: 'workflow',
          id: workflow.id,
          name: workflow.name,
          description: workflow.description,
          module: workflow.module,
        })
      }
    }

    for (const team of index.teams) {
      if (
        team.name.toLowerCase().includes(query) ||
        (team.description && team.description.toLowerCase().includes(query))
      ) {
        results.push({
          type: 'team',
          id: team.id,
          name: team.name,
          icon: team.icon,
          description: team.description ?? '',
          module: team.module,
        })
      }
    }

    return results.slice(0, 20)
  })
}
