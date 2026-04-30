import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import crypto from 'node:crypto'

import { createApp } from '../app.js'

function sha256(content: string): string {
  return crypto.createHash('sha256').update(content).digest('hex')
}

function writeFile(p: string, content: string) {
  fs.mkdirSync(path.dirname(p), { recursive: true })
  fs.writeFileSync(p, content)
}

describe('drift-plugin — GET /api/drift', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'drift-plugin-test-')))
    fs.mkdirSync(path.join(tmpDir, '.bmad-studio'), { recursive: true })
    // Minimal module so file-store can initialize successfully
    writeFile(path.join(tmpDir, '_bmad', 'test-mod', 'config.yaml'), 'project_name: test-mod\n')
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  it('returns { count: 0, files: [] } when no project/fileStore is registered', async () => {
    const app = await createApp({ logger: false, serveStatic: false })
    const res = await app.inject({ method: 'GET', url: '/api/drift' })
    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.body)).toEqual({ count: 0, files: [] })
    await app.close()
  })

  it('returns drift entries when files differ from manifest hashes', async () => {
    // manifest declares hash for one tracked file
    const trackedPath = '_config/config.toml'
    writeFile(path.join(tmpDir, '_bmad', trackedPath), 'edited = true\n')
    const expectedHash = sha256('original = true\n')
    writeFile(
      path.join(tmpDir, '_bmad', '_config', 'files-manifest.csv'),
      `type,name,module,path,hash\nfile,config.toml,bmm,${trackedPath},${expectedHash}\n`,
    )

    const app = await createApp({
      logger: false,
      serveStatic: false,
      project: {
        projectRoot: tmpDir,
        bmadVersion: '6.5.0',
        versionSupported: true,
        modules: [{ name: 'test-mod', version: '6.5.0', source: 'built-in' }],
        ideDirectories: [],
      },
    })

    const res = await app.inject({ method: 'GET', url: '/api/drift' })
    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body) as { count: number; files: Array<{ path: string }> }
    expect(body.count).toBe(1)
    expect(body.files[0].path).toBe(trackedPath)

    await app.close()
  })

  it('returns Warning header when manifest is absent', async () => {
    const app = await createApp({
      logger: false,
      serveStatic: false,
      project: {
        projectRoot: tmpDir,
        bmadVersion: '6.5.0',
        versionSupported: true,
        modules: [{ name: 'test-mod', version: '6.5.0', source: 'built-in' }],
        ideDirectories: [],
      },
    })

    const res = await app.inject({ method: 'GET', url: '/api/drift' })
    expect(res.statusCode).toBe(200)
    expect(res.headers.warning).toContain('files-manifest.csv absent')
    expect(JSON.parse(res.body)).toEqual({ count: 0, files: [] })

    await app.close()
  })
})
