import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { createApp } from '../app.js'

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

function makeProject(tmpDir: string) {
  return {
    projectRoot: tmpDir,
    bmadVersion: '6.2.0',
    versionSupported: true as const,
    modules: [{ name: 'core', version: '6.2.0', source: 'built-in' as const }],
    ideDirectories: [],
  }
}

/**
 * Create the minimal directory structure for a skill under _bmad/core/skills/<skillName>/.
 * Returns the path to the skill directory.
 */
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
    // Ensure module config exists so the app initialises cleanly
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
    // Team icon overrides base icon
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
    // User icon overrides base icon
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
    // The base TOML must reference at least one key
    expect(body.base).toMatch(/\w+\s*=/)
  })
})
