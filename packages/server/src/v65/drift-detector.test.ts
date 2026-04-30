import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import crypto from 'node:crypto'

import { scanDrift } from './drift-detector.js'

function sha256(content: string): string {
  return crypto.createHash('sha256').update(content).digest('hex')
}

function writeManifest(projectRoot: string, rows: Array<{ path: string; hash: string }>) {
  const lines = ['type,name,module,path,hash']
  for (const r of rows) {
    const name = path.basename(r.path)
    lines.push(`file,${name},bmm,${r.path},${r.hash}`)
  }
  const cfgDir = path.join(projectRoot, '_bmad', '_config')
  fs.mkdirSync(cfgDir, { recursive: true })
  fs.writeFileSync(path.join(cfgDir, 'files-manifest.csv'), lines.join('\n') + '\n')
}

function writeBmadFile(projectRoot: string, relPath: string, content: string) {
  const abs = path.join(projectRoot, '_bmad', relPath)
  fs.mkdirSync(path.dirname(abs), { recursive: true })
  fs.writeFileSync(abs, content)
}

describe('scanDrift', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'drift-detector-test-')))
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  it('returns [] when files-manifest.csv is absent', async () => {
    const result = await scanDrift(tmpDir)
    expect(result).toEqual([])
  })

  it('returns [] for a clean install (file content matches manifest hash)', async () => {
    const content = 'hello = "world"\n'
    writeBmadFile(tmpDir, '_config/config.toml', content)
    writeManifest(tmpDir, [{ path: '_config/config.toml', hash: sha256(content) }])

    const result = await scanDrift(tmpDir)
    expect(result).toEqual([])
  })

  it('returns one entry when a file content differs from manifest hash', async () => {
    const expected = 'original'
    writeBmadFile(tmpDir, 'bmm/agents/test/SKILL.md', 'edited')
    writeManifest(tmpDir, [{ path: 'bmm/agents/test/SKILL.md', hash: sha256(expected) }])

    const result = await scanDrift(tmpDir)
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({
      path: 'bmm/agents/test/SKILL.md',
      expectedHash: sha256(expected),
      actualHash: sha256('edited'),
    })
  })

  it('ignores files outside the manifest', async () => {
    const content = 'a = 1\n'
    writeBmadFile(tmpDir, '_config/config.toml', content)
    // Extra file not referenced in manifest
    writeBmadFile(tmpDir, '_config/extra.toml', 'whatever')
    writeManifest(tmpDir, [{ path: '_config/config.toml', hash: sha256(content) }])

    const result = await scanDrift(tmpDir)
    expect(result).toEqual([])
  })

  it('scans 10 files in under 500 ms', async () => {
    const rows: Array<{ path: string; hash: string }> = []
    for (let i = 0; i < 10; i++) {
      const rel = `bmm/file-${i}.md`
      const content = `content ${i}\n`
      writeBmadFile(tmpDir, rel, content)
      rows.push({ path: rel, hash: sha256(content) })
    }
    writeManifest(tmpDir, rows)

    const start = Date.now()
    const result = await scanDrift(tmpDir)
    const elapsed = Date.now() - start

    expect(result).toEqual([])
    expect(elapsed).toBeLessThan(500)
  })
})
