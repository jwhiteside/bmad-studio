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

const VALID_TOML = `[overrides]\ntone = "concise"\n`
const INVALID_TOML = `invalid = [\n` // unclosed bracket

describe('skills-plugin — PUT /api/skills/:id/customize', () => {
  let tmpDir: string
  let skillId: string

  beforeEach(() => {
    // realpathSync resolves macOS /var → /private/var so path comparisons are stable
    tmpDir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'skills-plugin-test-')))

    // Build a minimal bmad project layout with one skill
    const moduleDir = path.join(tmpDir, '_bmad', 'test-mod')
    const skillDir = path.join(moduleDir, 'skills', 'market-research')
    fs.mkdirSync(skillDir, { recursive: true })
    fs.mkdirSync(path.join(tmpDir, '.bmad-studio'), { recursive: true })

    // Skill file: id is derived from `name` frontmatter
    skillId = 'market-research'
    fs.writeFileSync(
      path.join(skillDir, 'SKILL.md'),
      `---\nname: "${skillId}"\ndescription: "Market research skill"\n---\n\nSkill content.\n`,
    )

    // Module config so index-builder can find the module
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

    // Verify the team file was written
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

    // Verify the user file was written with .user.toml suffix
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
    // smol-toml includes line/col info in the error message
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

    // Ensure the directory does not exist before the request
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
    // The mock has probePython returning available: false and verifyMerge short-circuiting
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
    // With Python unavailable the mock returns { ok: false, reason: 'missing' }
    // which is a valid VerifyMergeResult — confirms the endpoint returns the bridge's verdict
    const app = await makeApp()

    const response = await app.inject({
      method: 'POST',
      url: `/api/skills/${skillId}/customize/verify`,
      payload: { key: 'workflow' },
    })

    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.body)
    // Must have 'ok' field (VerifyMergeResult shape)
    expect(body).toHaveProperty('ok')
    expect(typeof body.ok).toBe('boolean')

    await app.close()
  })
})
