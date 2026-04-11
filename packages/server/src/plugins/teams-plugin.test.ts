import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { createApp } from '../app.js'

describe('teams-plugin', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'teams-plugin-test-'))
    const teamsDir = path.join(tmpDir, '_bmad', 'bmm', 'teams')
    fs.mkdirSync(teamsDir, { recursive: true })
    fs.mkdirSync(path.join(tmpDir, '_bmad', 'bmm'), { recursive: true })
    fs.writeFileSync(path.join(tmpDir, '_bmad', 'bmm', 'config.yaml'), 'project_name: test\n')

    fs.writeFileSync(
      path.join(teamsDir, 'team-fullstack.yaml'),
      `bundle:
  name: Team Fullstack
  icon: "🚀"
  description: Full stack dev team
agents:
  - analyst
  - dev
party: "./default-party.csv"
`,
    )

    fs.writeFileSync(
      path.join(teamsDir, 'default-party.csv'),
      `name,displayName,title,icon,role,communicationStyle,identity,principles,module,path
"analyst","Mary","BA","📊","BA","Analytical","Senior analyst","Evidence-based","bmm","agents/analyst.md"
"dev","Amelia","Dev","💻","Dev","Succinct","Senior dev","Tests first","bmm","agents/dev.md"
`,
    )
    fs.mkdirSync(path.join(tmpDir, '.bmad-studio'), { recursive: true })
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  function createTestApp() {
    return createApp({
      logger: false,
      serveStatic: false,
      project: {
        projectRoot: tmpDir,
        bmadVersion: '6.2.0',
        versionSupported: true,
        modules: [{ name: 'bmm', version: '6.2.0', source: 'built-in' }],
        ideDirectories: [],
      },
    })
  }

  it('GET /api/teams returns TeamListItem array', async () => {
    const app = await createTestApp()
    const response = await app.inject({ method: 'GET', url: '/api/teams' })
    expect(response.statusCode).toBe(200)
    const teams = JSON.parse(response.body)
    expect(teams).toHaveLength(1)
    expect(teams[0].id).toBe('team-fullstack')
    expect(teams[0].name).toBe('Team Fullstack')
    expect(teams[0].icon).toBe('🚀')
    expect(teams[0].memberCount).toBe(2)
    expect(teams[0].module).toBe('bmm')

    await app.close()
  })

  it('GET /api/teams/:id returns full Team with resolved members', async () => {
    const app = await createTestApp()
    const response = await app.inject({ method: 'GET', url: '/api/teams/team-fullstack' })
    expect(response.statusCode).toBe(200)
    const team = JSON.parse(response.body)
    expect(team.id).toBe('team-fullstack')
    expect(team.agentIds).toEqual(['analyst', 'dev'])
    expect(team.members).toHaveLength(2)
    expect(team.members[0].displayName).toBe('Mary')
    expect(team.members[1].displayName).toBe('Amelia')

    await app.close()
  })

  it('GET /api/teams/:id returns 404 for missing team', async () => {
    const app = await createTestApp()
    const response = await app.inject({ method: 'GET', url: '/api/teams/nonexistent' })
    expect(response.statusCode).toBe(404)

    await app.close()
  })

  it('GET /api/teams/:id/party returns raw CSV content', async () => {
    const app = await createTestApp()
    const response = await app.inject({ method: 'GET', url: '/api/teams/team-fullstack/party' })
    expect(response.statusCode).toBe(200)
    const data = JSON.parse(response.body)
    expect(data.content).toContain('name,displayName,title')
    expect(data.content).toContain('analyst')
    expect(data.content).toContain('Mary')
    expect(data.path).toBeUndefined()

    await app.close()
  })

  it('POST /api/teams creates a new team YAML file', async () => {
    const app = await createTestApp()
    const response = await app.inject({
      method: 'POST',
      url: '/api/teams',
      payload: {
        name: 'New Team',
        icon: '⭐',
        description: 'A new team',
        agentIds: ['analyst'],
        module: 'bmm',
      },
    })
    expect(response.statusCode).toBe(201)
    const data = JSON.parse(response.body)
    expect(data.ok).toBe(true)
    expect(data.id).toBe('team-new-team')

    // Verify file was created
    const teamFile = path.join(tmpDir, '_bmad', 'bmm', 'teams', 'team-new-team.yaml')
    expect(fs.existsSync(teamFile)).toBe(true)

    // Verify it appears in the index
    const listResponse = await app.inject({ method: 'GET', url: '/api/teams' })
    const teams = JSON.parse(listResponse.body)
    expect(teams).toHaveLength(2)

    await app.close()
  })

  it('DELETE /api/teams/:id removes YAML but preserves party CSV', async () => {
    const app = await createTestApp()
    const response = await app.inject({ method: 'DELETE', url: '/api/teams/team-fullstack' })
    expect(response.statusCode).toBe(200)

    // YAML removed
    const teamFile = path.join(tmpDir, '_bmad', 'bmm', 'teams', 'team-fullstack.yaml')
    expect(fs.existsSync(teamFile)).toBe(false)

    // Party CSV preserved
    const partyFile = path.join(tmpDir, '_bmad', 'bmm', 'teams', 'default-party.csv')
    expect(fs.existsSync(partyFile)).toBe(true)

    // No longer in index
    const listResponse = await app.inject({ method: 'GET', url: '/api/teams' })
    const teams = JSON.parse(listResponse.body)
    expect(teams).toHaveLength(0)

    await app.close()
  })

  it('PUT /api/teams/:id updates team metadata', async () => {
    const app = await createTestApp()

    const response = await app.inject({
      method: 'PUT',
      url: '/api/teams/team-fullstack',
      payload: {
        name: 'Updated Team',
        icon: '🔥',
        description: 'Updated description',
      },
    })
    expect(response.statusCode).toBe(200)
    const data = JSON.parse(response.body)
    expect(data.ok).toBe(true)

    // Verify the team list reflects the changes
    const listResponse = await app.inject({ method: 'GET', url: '/api/teams' })
    const teams = JSON.parse(listResponse.body)
    const updated = teams.find((t: { id: string }) => t.id === 'team-fullstack')
    expect(updated).toBeDefined()
    expect(updated.name).toBe('Updated Team')
    expect(updated.icon).toBe('🔥')

    await app.close()
  })

  it('PUT /api/teams/:id/party updates CSV content', async () => {
    const app = await createTestApp()

    const newCsv = 'name,displayName\n"alice","Alice"\n'
    const response = await app.inject({
      method: 'PUT',
      url: '/api/teams/team-fullstack/party',
      payload: { content: newCsv },
    })
    expect(response.statusCode).toBe(200)
    const data = JSON.parse(response.body)
    expect(data.ok).toBe(true)

    // The response must NOT expose an absolute path
    expect(data.path).toBeUndefined()

    // Verify file on disk
    const partyPath = path.join(tmpDir, '_bmad', 'bmm', 'teams', 'default-party.csv')
    expect(fs.readFileSync(partyPath, 'utf-8')).toBe(newCsv)

    await app.close()
  })
})
