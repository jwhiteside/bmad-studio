import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { createApp } from '../app.js'

function makeProject(tmpDir: string) {
  return {
    projectRoot: tmpDir,
    bmadVersion: '6.2.0',
    versionSupported: true as const,
    modules: [{ name: 'bmm', version: '6.2.0', source: 'built-in' as const }],
    ideDirectories: [],
  }
}

describe('settings-plugin', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'settings-plugin-test-'))
    fs.mkdirSync(path.join(tmpDir, '_bmad', 'bmm'), { recursive: true })
    fs.writeFileSync(path.join(tmpDir, '_bmad', 'bmm', 'config.yaml'), 'project_name: test\n')
    fs.mkdirSync(path.join(tmpDir, '.bmad-studio'), { recursive: true })
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  it('GET /api/settings returns defaults when no settings file exists', async () => {
    const app = await createApp({ logger: false, serveStatic: false, project: makeProject(tmpDir) })
    const resp = await app.inject({ method: 'GET', url: '/api/settings' })
    expect(resp.statusCode).toBe(200)
    const settings = JSON.parse(resp.body)
    expect(settings.port).toBe(4040)
    expect(settings.theme).toBe('dark')
    await app.close()
  })

  it('PUT /api/settings saves settings', async () => {
    const app = await createApp({ logger: false, serveStatic: false, project: makeProject(tmpDir) })
    const resp = await app.inject({
      method: 'PUT',
      url: '/api/settings',
      payload: { port: 5050, theme: 'light' },
    })
    expect(resp.statusCode).toBe(200)
    expect(JSON.parse(resp.body).ok).toBe(true)

    // Verify the saved file
    const settingsPath = path.join(tmpDir, '.bmad-studio', 'settings.json')
    expect(fs.existsSync(settingsPath)).toBe(true)
    const saved = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'))
    expect(saved.port).toBe(5050)
    expect(saved.theme).toBe('light')
    await app.close()
  })

  it('GET /api/settings returns saved settings', async () => {
    const settingsPath = path.join(tmpDir, '.bmad-studio', 'settings.json')
    fs.writeFileSync(settingsPath, JSON.stringify({ port: 8080, theme: 'light' }))

    const app = await createApp({ logger: false, serveStatic: false, project: makeProject(tmpDir) })
    const resp = await app.inject({ method: 'GET', url: '/api/settings' })
    expect(resp.statusCode).toBe(200)
    const settings = JSON.parse(resp.body)
    expect(settings.port).toBe(8080)
    expect(settings.theme).toBe('light')
    await app.close()
  })

  it('PUT /api/settings preserves pre-existing hidden fields', async () => {
    const settingsPath = path.join(tmpDir, '.bmad-studio', 'settings.json')
    // Simulate a user manually adding a hidden field
    fs.writeFileSync(
      settingsPath,
      JSON.stringify({ port: 4040, theme: 'dark', appTitle: 'Acme Studio' }),
    )

    const app = await createApp({ logger: false, serveStatic: false, project: makeProject(tmpDir) })
    const resp = await app.inject({
      method: 'PUT',
      url: '/api/settings',
      payload: { port: 5050, theme: 'light' },
    })
    expect(resp.statusCode).toBe(200)
    expect(JSON.parse(resp.body).ok).toBe(true)

    const saved = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'))
    expect(saved.port).toBe(5050)
    expect(saved.theme).toBe('light')
    expect(saved.appTitle).toBe('Acme Studio') // Critical: hidden field preserved
    await app.close()
  })

  it('PUT /api/settings preserves corrupt existing file as a backup', async () => {
    const settingsPath = path.join(tmpDir, '.bmad-studio', 'settings.json')
    fs.writeFileSync(settingsPath, '{not valid json,,}')

    const app = await createApp({ logger: false, serveStatic: false, project: makeProject(tmpDir) })
    const resp = await app.inject({
      method: 'PUT',
      url: '/api/settings',
      payload: { port: 4040, theme: 'dark' },
    })
    expect(resp.statusCode).toBe(200)
    expect(JSON.parse(resp.body).ok).toBe(true)

    // The new file should be valid JSON with the PUT body
    const saved = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'))
    expect(saved.port).toBe(4040)
    expect(saved.theme).toBe('dark')

    // The corrupt original should be preserved as a backup
    const studioContents = fs.readdirSync(path.join(tmpDir, '.bmad-studio'))
    const backup = studioContents.find((f) => f.startsWith('settings.json.corrupt-'))
    expect(backup).toBeDefined()
    await app.close()
  })

  it('PUT /api/settings rejects non-object request bodies', async () => {
    const app = await createApp({ logger: false, serveStatic: false, project: makeProject(tmpDir) })
    const resp = await app.inject({
      method: 'PUT',
      url: '/api/settings',
      payload: [1, 2, 3] as unknown as object,
    })
    expect(resp.statusCode).toBe(200)
    const body = JSON.parse(resp.body)
    expect(body.ok).toBe(false)
    expect(body.error).toContain('Invalid request body')

    // Confirm nothing was written to disk
    const settingsPath = path.join(tmpDir, '.bmad-studio', 'settings.json')
    expect(fs.existsSync(settingsPath)).toBe(false)
    await app.close()
  })

  it('GET /api/settings returns defaults without file store', async () => {
    const app = await createApp({ logger: false, serveStatic: false, project: null })
    const resp = await app.inject({ method: 'GET', url: '/api/settings' })
    expect(resp.statusCode).toBe(200)
    const settings = JSON.parse(resp.body)
    expect(settings.port).toBe(4040)
    await app.close()
  })
})
