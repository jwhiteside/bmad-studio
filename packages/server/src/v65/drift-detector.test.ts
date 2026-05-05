import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import crypto from 'node:crypto'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { scanDrift } from './drift-detector.js'

const BMAD_DIR = '_bmad'
const CONFIG_DIR = path.join(BMAD_DIR, '_config')
const FILES_MANIFEST_CSV = 'files-manifest.csv'

function sha256(content: Buffer | string): string {
  return crypto.createHash('sha256').update(content).digest('hex')
}

function setupProject(tmpDir: string) {
  fs.mkdirSync(path.join(tmpDir, CONFIG_DIR), { recursive: true })
}

function writeManifestRow(tmpDir: string, rows: Array<{ type?: string; name?: string; module?: string; path: string; hash: string }>) {
  const header = 'type,name,module,path,hash\n'
  const body = rows.map((r) => `"${r.type ?? 'md'}","${r.name ?? 'skill'}","${r.module ?? 'core'}","${r.path}","${r.hash}"`).join('\n')
  fs.writeFileSync(path.join(tmpDir, CONFIG_DIR, FILES_MANIFEST_CSV), header + body)
}

function writeFile(tmpDir: string, relPath: string, content: string) {
  const abs = path.join(tmpDir, BMAD_DIR, relPath)
  fs.mkdirSync(path.dirname(abs), { recursive: true })
  fs.writeFileSync(abs, content, 'utf-8')
}

describe('scanDrift', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'drift-test-'))
    setupProject(tmpDir)
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  it('returns null when files-manifest.csv is absent', () => {
    expect(scanDrift(tmpDir)).toBeNull()
  })

  it('returns empty array when all files match baseline', () => {
    const content = 'hello world'
    writeFile(tmpDir, 'core/skill.md', content)
    writeManifestRow(tmpDir, [{ path: 'core/skill.md', hash: sha256(content) }])

    const result = scanDrift(tmpDir)
    expect(result).toEqual([])
  })

  it('detects a file whose hash differs', () => {
    writeFile(tmpDir, 'core/skill.md', 'modified content')
    writeManifestRow(tmpDir, [{ path: 'core/skill.md', hash: sha256('original content') }])

    const result = scanDrift(tmpDir)
    expect(result).toHaveLength(1)
    expect(result![0].relativePath).toBe('core/skill.md')
    expect(result![0].actualHash).toBe(sha256('modified content'))
    expect(result![0].expectedHash).toBe(sha256('original content'))
  })

  it('flags a missing file (listed in manifest but not on disk) as drifted', () => {
    writeManifestRow(tmpDir, [{ path: 'core/missing.md', hash: sha256('baseline') }])

    const result = scanDrift(tmpDir)
    expect(result).toHaveLength(1)
    expect(result![0].actualHash).toBeNull()
  })

  it('ignores files not listed in the manifest', () => {
    writeFile(tmpDir, 'extra/unlisted.md', 'not tracked')
    writeManifestRow(tmpDir, [{ path: 'core/skill.md', hash: sha256('content') }])
    writeFile(tmpDir, 'core/skill.md', 'content')

    const result = scanDrift(tmpDir)
    expect(result).toEqual([])
  })

  it('handles multiple rows — reports only drifted ones', () => {
    writeFile(tmpDir, 'a/clean.md', 'clean')
    writeFile(tmpDir, 'b/dirty.md', 'dirty now')
    writeManifestRow(tmpDir, [
      { path: 'a/clean.md', hash: sha256('clean') },
      { path: 'b/dirty.md', hash: sha256('original') },
    ])

    const result = scanDrift(tmpDir)
    expect(result).toHaveLength(1)
    expect(result![0].relativePath).toBe('b/dirty.md')
  })
})
