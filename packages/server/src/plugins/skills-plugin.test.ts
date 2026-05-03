import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { createApp } from '../app.js'

// Mock the python-bridge module so verify tests don't need a real Python install
vi.mock('../v65/python-bridge.js', () => ({
  probePython: vi.fn(() => ({ available: false, version: null })),
  verifyMerge: vi.fn((_skillRoot: string, _projectRoot: string, _key: string, opts: { pythonAvailable: boolean }) => {
    if (!opts.pythonAvailable) {
      return Promise.resolve({ ok: false, reason: 'missing' })
    }
    return Promise.resolve({ ok: true, merged: { key: 'value' } })
  }),
}))

const MINIMAL_TOML = `[agent]
name = "Test"
icon = "🧪"
`

const TEAM_TOML = `[agent]
icon = "🏢"
`

const USER_TOML = `[agent]
icon = "👤"
`

const VALID_TOML = `[overrides]\ntone = "concise"\n`
const INVALID_TOML = `invalid = [\n` // unclosed bracket

function makeProject(tmpDir: string) {
  return {
    projectRoot: tmpDir,
    bmadVersion: '6.2.0',
    versionSupported: true as const,
    modules: [{ name: 'core', version: '6.2.0', source: 'built-in' as const }],
    ideDirectories: [],
  }
}

function createSkillDir(
  tmpDir: string,
  skillName: string,
  opts: { withCustomizeToml?: boolean } = {},
): string {
  const skillDir = path.join(tmpDir, '_bmad', 'core', 'skills', skillName)
  fs.mkdirSync(skillDir, { recursive: true })
  fs.writeFileSync(
    path.join(skillDir, 'SKILL.md'),
    `---\nname: ${skillName}\ndescription: Test skill\n---\nContent.\n`,
  )
  if (opts.withCustomizeToml) {
    fs.writeFileSync(path.join(skillDir, 'customize.toml'), MINIMAL_TOML)
  }
  return skillDir
}

describe('skills-plugin GET /api/skills/:id/customize', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'skills-plugin-test-')))
    const coreDir = path.join(tmpDir, '_bmad', 'core')
    fs.mkdirSync(coreDir, { recursive: true })
    fs.writeFileSync(path.join(coreDir, 'config.yaml'), 'project_name: test\n')
    fs.mkdirSync(path.join(tmpDir, '.bmad-studio'), { recursive: true })
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  it('returns base/team/user/merged/provenance when only base layer exists', async () => {
    createSkillDir(tmpDir, 'my-skill', { withCustomizeToml: true })

    const app = await createApp({ logger: false, serveStatic: false, project: makeProject(tmpDir) })
    const resp = await app.inject({ method: 'GET', url: '/api/skills/my-skill/customize' })
    await app.close()

    expect(resp.statusCode).toBe(200)
    const body = JSON.parse(resp.body)
    expect(typeof body.base).toBe('string')
    expect(body.base).toContain('[agent]')
    expect(body.team).toBeNull()
    expect(body.user).toBeNull()
    expect(body.merged).toMatchObject({ agent: { name: 'Test', icon: '🧪' } })
    expect(body.provenance).toBeDefined()
    expect(typeof body.provenance).toBe('object')
  })

  it('returns team layer raw TOML when team override is present', async () => {
    createSkillDir(tmpDir, 'my-skill', { withCustomizeToml: true })
    const customDir = path.join(tmpDir, '_bmad', 'custom')
    fs.mkdirSync(customDir, { recursive: true })
    fs.writeFileSync(path.join(customDir, 'my-skill.toml'), TEAM_TOML)

    const app = await createApp({ logger: false, serveStatic: false, project: makeProject(tmpDir) })
    const resp = await app.inject({ method: 'GET', url: '/api/skills/my-skill/customize' })
    await app.close()

    expect(resp.statusCode).toBe(200)
    const body = JSON.parse(resp.body)
    expect(body.team).toBe(TEAM_TOML)
    expect(body.user).toBeNull()
    expect(body.merged).toMatchObject({ agent: { icon: '🏢' } })
  })

  it('returns user layer raw TOML when user override is present', async () => {
    createSkillDir(tmpDir, 'my-skill', { withCustomizeToml: true })
    const customDir = path.join(tmpDir, '_bmad', 'custom')
    fs.mkdirSync(customDir, { recursive: true })
    fs.writeFileSync(path.join(customDir, 'my-skill.user.toml'), USER_TOML)

    const app = await createApp({ logger: false, serveStatic: false, project: makeProject(tmpDir) })
    const resp = await app.inject({ method: 'GET', url: '/api/skills/my-skill/customize' })
    await app.close()

    expect(resp.statusCode).toBe(200)
    const body = JSON.parse(resp.body)
    expect(body.user).toBe(USER_TOML)
    expect(body.team).toBeNull()
    expect(body.merged).toMatchObject({ agent: { icon: '👤' } })
  })

  it('returns 404 for unknown skill id', async () => {
    const app = await createApp({ logger: false, serveStatic: false, project: makeProject(tmpDir) })
    const resp = await app.inject({ method: 'GET', url: '/api/skills/nonexistent/customize' })
    await app.close()

    expect(resp.statusCode).toBe(404)
    const body = JSON.parse(resp.body)
    expect(body.error.code).toBe('NOT_FOUND')
  })

  it('returns 404 with NOT_FOUND code when skill has no customize.toml', async () => {
    createSkillDir(tmpDir, 'plain-skill', { withCustomizeToml: false })

    const app = await createApp({ logger: false, serveStatic: false, project: makeProject(tmpDir) })
    const resp = await app.inject({ method: 'GET', url: '/api/skills/plain-skill/customize' })
    await app.close()

    expect(resp.statusCode).toBe(404)
    const body = JSON.parse(resp.body)
    expect(body.error.code).toBe('NOT_FOUND')
    expect(body.error.message).toContain('not customizable')
  })

  it('base field is a non-empty string containing valid TOML key', async () => {
    createSkillDir(tmpDir, 'my-skill', { withCustomizeToml: true })

    const app = await createApp({ logger: false, serveStatic: false, project: makeProject(tmpDir) })
    const resp = await app.inject({ method: 'GET', url: '/api/skills/my-skill/customize' })
    await app.close()

    expect(resp.statusCode).toBe(200)
    const body = JSON.parse(resp.body)
    expect(body.base.length).toBeGreaterThan(0)
    expect(body.base).toMatch(/\w+\s*=/)
  })
})

describe('skills-plugin — PUT /api/skills/:id/customize', () => {
  let tmpDir: string
  let skillId: string

  beforeEach(() => {
    tmpDir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'skills-plugin-test-')))

    const moduleDir = path.join(tmpDir, '_bmad', 'test-mod')
    const skillDir = path.join(moduleDir, 'skills', 'market-research')
    fs.mkdirSync(skillDir, { recursive: true })
    fs.mkdirSync(path.join(tmpDir, '.bmad-studio'), { recursive: true })

    skillId = 'market-research'
    fs.writeFileSync(
      path.join(skillDir, 'SKILL.md'),
      `---\nname: "${skillId}"\ndescription: "Market research skill"\n---\n\nSkill content.\n`,
    )

    fs.writeFileSync(path.join(moduleDir, 'config.yaml'), 'project_name: test-mod\n')
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  async function makeApp() {
    return createApp({
      logger: false,
      serveStatic: false,
      project: {
        projectRoot: tmpDir,
        bmadVersion: '6.2.0',
        versionSupported: true,
        modules: [{ name: 'test-mod', version: '6.2.0', source: 'built-in' }],
        ideDirectories: [],
      },
    })
  }

  it('returns 200 { ok: true } when TOML is valid and layer is team', async () => {
    const app = await makeApp()

    const response = await app.inject({
      method: 'PUT',
      url: `/api/skills/${skillId}/customize`,
      payload: { layer: 'team', toml: VALID_TOML },
    })

    expect(response.statusCode).toBe(200)
    expect(JSON.parse(response.body)).toEqual({ ok: true })

    const expectedPath = path.join(tmpDir, '_bmad', 'custom', `${skillId}.toml`)
    expect(fs.existsSync(expectedPath)).toBe(true)
    expect(fs.readFileSync(expectedPath, 'utf-8')).toBe(VALID_TOML)

    await app.close()
  })

  it('returns 200 { ok: true } when layer is user and writes .user.toml file', async () => {
    const app = await makeApp()

    const response = await app.inject({
      method: 'PUT',
      url: `/api/skills/${skillId}/customize`,
      payload: { layer: 'user', toml: VALID_TOML },
    })

    expect(response.statusCode).toBe(200)
    expect(JSON.parse(response.body)).toEqual({ ok: true })

    const expectedPath = path.join(tmpDir, '_bmad', 'custom', `${skillId}.user.toml`)
    expect(fs.existsSync(expectedPath)).toBe(true)
    expect(fs.readFileSync(expectedPath, 'utf-8')).toBe(VALID_TOML)

    await app.close()
  })

  it('returns 400 CUSTOMIZE_PARSE_ERROR when TOML is invalid', async () => {
    const app = await makeApp()

    const response = await app.inject({
      method: 'PUT',
      url: `/api/skills/${skillId}/customize`,
      payload: { layer: 'team', toml: INVALID_TOML },
    })

    expect(response.statusCode).toBe(400)
    const body = JSON.parse(response.body)
    expect(body.error.code).toBe('CUSTOMIZE_PARSE_ERROR')
    expect(body.error.message).toBeTruthy()

    await app.close()
  })

  it('returns 404 when skill id does not exist', async () => {
    const app = await makeApp()

    const response = await app.inject({
      method: 'PUT',
      url: '/api/skills/nonexistent-skill/customize',
      payload: { layer: 'team', toml: VALID_TOML },
    })

    expect(response.statusCode).toBe(404)

    await app.close()
  })

  it('broadcasts customize:changed WS event on success', async () => {
    const app = await makeApp()

    const broadcastSpy = vi.spyOn(app.ws, 'broadcast')

    await app.inject({
      method: 'PUT',
      url: `/api/skills/${skillId}/customize`,
      payload: { layer: 'team', toml: VALID_TOML },
    })

    expect(broadcastSpy).toHaveBeenCalledWith({
      type: 'customize:changed',
      skillId,
      layer: 'team',
    })

    await app.close()
  })

  it('creates the _bmad/custom/ directory if it does not exist', async () => {
    const app = await makeApp()
    const customDir = path.join(tmpDir, '_bmad', 'custom')

    expect(fs.existsSync(customDir)).toBe(false)

    const response = await app.inject({
      method: 'PUT',
      url: `/api/skills/${skillId}/customize`,
      payload: { layer: 'team', toml: VALID_TOML },
    })

    expect(response.statusCode).toBe(200)
    expect(fs.existsSync(customDir)).toBe(true)

    await app.close()
  })
})

describe('skills-plugin — POST /api/skills/:id/customize/verify', () => {
  let tmpDir: string
  let skillId: string

  beforeEach(() => {
    tmpDir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'skills-verify-test-')))

    const moduleDir = path.join(tmpDir, '_bmad', 'test-mod')
    const skillDir = path.join(moduleDir, 'skills', 'market-research')
    fs.mkdirSync(skillDir, { recursive: true })
    fs.mkdirSync(path.join(tmpDir, '.bmad-studio'), { recursive: true })

    skillId = 'market-research'
    fs.writeFileSync(
      path.join(skillDir, 'SKILL.md'),
      `---\nname: "${skillId}"\ndescription: "Market research skill"\n---\n\nSkill content.\n`,
    )

    fs.writeFileSync(path.join(moduleDir, 'config.yaml'), 'project_name: test-mod\n')
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  async function makeApp() {
    return createApp({
      logger: false,
      serveStatic: false,
      project: {
        projectRoot: tmpDir,
        bmadVersion: '6.2.0',
        versionSupported: true,
        modules: [{ name: 'test-mod', version: '6.2.0', source: 'built-in' }],
        ideDirectories: [],
      },
    })
  }

  it('returns 200 { ok: false, reason: "missing" } when Python is unavailable', async () => {
    const app = await makeApp()

    const response = await app.inject({
      method: 'POST',
      url: `/api/skills/${skillId}/customize/verify`,
      payload: { key: 'agent' },
    })

    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.body)
    expect(body).toEqual({ ok: false, reason: 'missing' })

    await app.close()
  })

  it('returns 404 when skill does not exist', async () => {
    const app = await makeApp()

    const response = await app.inject({
      method: 'POST',
      url: '/api/skills/nonexistent-skill/customize/verify',
      payload: { key: 'agent' },
    })

    expect(response.statusCode).toBe(404)

    await app.close()
  })

  it('returns 200 with a result object (shape check)', async () => {
    const app = await makeApp()

    const response = await app.inject({
      method: 'POST',
      url: `/api/skills/${skillId}/customize/verify`,
      payload: { key: 'workflow' },
    })

    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.body)
    expect(body).toHaveProperty('ok')
    expect(typeof body.ok).toBe('boolean')

    await app.close()
  })
})
