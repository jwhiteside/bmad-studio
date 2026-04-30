import { describe, it, expect, afterEach } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { probePython, verifyMerge } from './python-bridge.js'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let tmpDirs: string[] = []

function makeTmpDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'python-bridge-test-'))
  tmpDirs.push(dir)
  return dir
}

afterEach(() => {
  for (const dir of tmpDirs) {
    try {
      fs.rmSync(dir, { recursive: true, force: true })
    } catch {
      // best effort
    }
  }
  tmpDirs = []
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('probePython()', () => {
  it('returns an object with the correct shape regardless of Python installation', () => {
    const result = probePython()

    // Shape must always be correct
    expect(typeof result.available).toBe('boolean')
    // version is either a string starting with "Python" or null
    if (result.available) {
      expect(result.version).not.toBeNull()
      expect(result.version).toMatch(/^Python \d+\.\d+/)
    } else {
      // version may be null (not found) or a string (found but too old)
      expect(result.version === null || typeof result.version === 'string').toBe(true)
    }
  })
})

describe('verifyMerge()', () => {
  it('returns { ok: false, reason: "missing" } when pythonAvailable is false (no subprocess spawned)', async () => {
    const projectRoot = makeTmpDir()
    const skillRoot = path.join(projectRoot, 'skill')
    fs.mkdirSync(skillRoot)

    const result = await verifyMerge(skillRoot, projectRoot, 'some-key', { pythonAvailable: false })

    expect(result).toEqual({ ok: false, reason: 'missing' })
  })

  it('returns { ok: false, reason: "missing" } when script file does not exist', async () => {
    const projectRoot = makeTmpDir()
    const skillRoot = path.join(projectRoot, 'skill')
    fs.mkdirSync(skillRoot)
    // Note: we do NOT create the script at _bmad/scripts/resolve_customization.py

    const result = await verifyMerge(skillRoot, projectRoot, 'some-key', { pythonAvailable: true })

    expect(result).toEqual({ ok: false, reason: 'missing' })
  })

  it('returns { ok: false, reason: "parse-error" } when subprocess exits non-zero', async () => {
    const projectRoot = makeTmpDir()
    const skillRoot = path.join(projectRoot, 'skill')
    fs.mkdirSync(skillRoot)

    // Create a script that exits with code 1
    const scriptDir = path.join(projectRoot, '_bmad', 'scripts')
    fs.mkdirSync(scriptDir, { recursive: true })
    const scriptPath = path.join(scriptDir, 'resolve_customization.py')
    fs.writeFileSync(
      scriptPath,
      'import sys\nsys.stderr.write("deliberate failure\\n")\nsys.exit(1)\n',
    )

    const result = await verifyMerge(skillRoot, projectRoot, 'some-key', { pythonAvailable: true })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.reason).toBe('parse-error')
    }
  })

  it('throws when skillRoot is outside projectRoot (path traversal guard)', () => {
    const projectRoot = makeTmpDir()
    // skillRoot is a completely different temp dir — outside projectRoot
    const outsideRoot = makeTmpDir()

    // verifyMerge throws synchronously before returning a Promise when the
    // path validation fails (this is intentional — fail fast, no I/O needed)
    expect(() =>
      verifyMerge(outsideRoot, projectRoot, 'some-key', { pythonAvailable: true }),
    ).toThrow(/Security violation/)
  })

  it('returns { ok: true, merged: {...} } when script succeeds and emits valid JSON', async () => {
    const projectRoot = makeTmpDir()
    const skillRoot = path.join(projectRoot, 'skill')
    fs.mkdirSync(skillRoot)

    // Create a script that prints valid JSON and exits 0
    const scriptDir = path.join(projectRoot, '_bmad', 'scripts')
    fs.mkdirSync(scriptDir, { recursive: true })
    const scriptPath = path.join(scriptDir, 'resolve_customization.py')
    fs.writeFileSync(
      scriptPath,
      'import json, sys\nprint(json.dumps({"hello": "world", "key": sys.argv[sys.argv.index("--key") + 1]}))\n',
    )

    const result = await verifyMerge(skillRoot, projectRoot, 'my-key', { pythonAvailable: true })

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.merged).toMatchObject({ hello: 'world', key: 'my-key' })
    }
  })
})
