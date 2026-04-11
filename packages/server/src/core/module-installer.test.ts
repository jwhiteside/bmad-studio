import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import type { FileStore } from './file-store.js'
import {
  extractZipUpload,
  parseGithubSource,
  readOutputFolder,
  runVariableSubstitution,
  validateVariables,
} from './module-installer.js'

// Minimal FileStore stub for substitution tests — we don't care about the watcher
// feedback hooks during tests, just the studioDir.
function makeStubFileStore(studioDir: string): FileStore {
  return {
    studioDir,
    markPendingWrite: () => {},
    clearPendingWrite: () => {},
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any as FileStore
}

describe('parseGithubSource', () => {
  // ─── shorthand owner/repo forms ─────────────────────────────────────────────

  it('parses bare owner/repo', () => {
    expect(parseGithubSource('owner/repo')).toEqual({
      owner: 'owner',
      repo: 'repo',
      subpath: null,
      branch: null,
    })
  })

  it('parses owner/repo/subpath', () => {
    expect(parseGithubSource('owner/repo/subpath')).toEqual({
      owner: 'owner',
      repo: 'repo',
      subpath: 'subpath',
      branch: null,
    })
  })

  it('parses owner/repo with nested subpath', () => {
    expect(parseGithubSource('owner/repo/nested/deep/subpath')).toEqual({
      owner: 'owner',
      repo: 'repo',
      subpath: 'nested/deep/subpath',
      branch: null,
    })
  })

  it('parses owner/repo@branch', () => {
    expect(parseGithubSource('owner/repo@dev')).toEqual({
      owner: 'owner',
      repo: 'repo',
      subpath: null,
      branch: 'dev',
    })
  })

  it('parses owner/repo/subpath@branch', () => {
    expect(parseGithubSource('owner/repo/subpath@dev')).toEqual({
      owner: 'owner',
      repo: 'repo',
      subpath: 'subpath',
      branch: 'dev',
    })
  })

  it('parses owner/repo/nested/subpath@feature-branch', () => {
    expect(parseGithubSource('owner/repo/nested/subpath@feature-branch')).toEqual({
      owner: 'owner',
      repo: 'repo',
      subpath: 'nested/subpath',
      branch: 'feature-branch',
    })
  })

  // ─── full URL forms ─────────────────────────────────────────────────────────

  it('parses https://github.com/owner/repo', () => {
    expect(parseGithubSource('https://github.com/owner/repo')).toEqual({
      owner: 'owner',
      repo: 'repo',
      subpath: null,
      branch: null,
    })
  })

  it('parses https://github.com/owner/repo/tree/branch', () => {
    expect(parseGithubSource('https://github.com/owner/repo/tree/feature-branch')).toEqual({
      owner: 'owner',
      repo: 'repo',
      subpath: null,
      branch: 'feature-branch',
    })
  })

  it('parses https://github.com/owner/repo/tree/main/modules/foo', () => {
    expect(parseGithubSource('https://github.com/owner/repo/tree/main/modules/foo')).toEqual({
      owner: 'owner',
      repo: 'repo',
      subpath: 'modules/foo',
      branch: 'main',
    })
  })

  it('parses http:// (not just https://) URLs', () => {
    expect(parseGithubSource('http://github.com/owner/repo')).toEqual({
      owner: 'owner',
      repo: 'repo',
      subpath: null,
      branch: null,
    })
  })

  it('parses URLs with trailing slash', () => {
    expect(parseGithubSource('https://github.com/owner/repo/')).toEqual({
      owner: 'owner',
      repo: 'repo',
      subpath: null,
      branch: null,
    })
  })

  // ─── invalid input ──────────────────────────────────────────────────────────

  it('throws on a single segment with no slash', () => {
    expect(() => parseGithubSource('just-one-segment')).toThrow(/Invalid GitHub source/)
  })

  it('throws on an empty string', () => {
    expect(() => parseGithubSource('')).toThrow(/Invalid GitHub source/)
  })

  it('throws on whitespace only', () => {
    expect(() => parseGithubSource('   ')).toThrow(/Invalid GitHub source/)
  })

  // ─── edge cases ─────────────────────────────────────────────────────────────

  it('trims leading/trailing whitespace', () => {
    expect(parseGithubSource('  owner/repo  ')).toEqual({
      owner: 'owner',
      repo: 'repo',
      subpath: null,
      branch: null,
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// extractZipUpload — Story 15.4
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build a zip in memory using adm-zip directly. Used for test fixtures.
 *
 * Note: this test imports adm-zip eagerly via top-level await, which is fine
 * in test code — the TD-5 dynamic-import constraint applies only to the production
 * `extractZipUpload` function, not its tests.
 */
async function buildZip(
  contents: Array<{ entryName: string; data: Buffer | string }>,
): Promise<Buffer> {
  const AdmZip = (await import('adm-zip')).default
  const zip = new AdmZip()
  for (const { entryName, data } of contents) {
    const buf = typeof data === 'string' ? Buffer.from(data) : data
    zip.addFile(entryName, buf)
  }
  return zip.toBuffer()
}

describe('extractZipUpload', () => {
  let tmpDirsCreatedBefore: number

  beforeEach(() => {
    // Snapshot the count of bmad-zip-* dirs in os.tmpdir() so each test can verify cleanup.
    tmpDirsCreatedBefore = fs
      .readdirSync(os.tmpdir())
      .filter((n) => n.startsWith('bmad-zip-')).length
  })

  afterEach(() => {
    // Best-effort cleanup of any leaked test dirs (the production code should clean up,
    // but if a test fails mid-flow we don't want pollution to bleed into the next test).
    for (const name of fs.readdirSync(os.tmpdir())) {
      if (name.startsWith('bmad-zip-')) {
        try {
          fs.rmSync(path.join(os.tmpdir(), name), { recursive: true, force: true })
        } catch {
          /* ignore */
        }
      }
    }
  })

  // ─── AC-15.4.3 (wrapper dir) ───
  it('navigates into a single wrapper directory at the zip root', async () => {
    const zipBytes = await buildZip([
      { entryName: 'my-module/agents/test.md', data: '---\nname: test\n---\n# Test\n' },
      { entryName: 'my-module/module.yaml', data: 'code: my-module\nversion: "1.0.0"\n' },
    ])

    const { extractedRoot, tmpDir } = await extractZipUpload(zipBytes)
    try {
      // The wrapper dir was navigated into — extractedRoot should end with my-module
      expect(path.basename(extractedRoot)).toBe('my-module')
      // The agent file should exist at the wrapper-relative path
      expect(fs.existsSync(path.join(extractedRoot, 'agents', 'test.md'))).toBe(true)
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true })
    }
  })

  // ─── AC-15.4.3 (no wrapper dir) ───
  it('returns extractDir directly when there is no wrapper dir', async () => {
    const zipBytes = await buildZip([
      { entryName: 'agents/test.md', data: '---\nname: test\n---\n# Test\n' },
      { entryName: 'module.yaml', data: 'code: flat-module\n' },
    ])

    const { extractedRoot, tmpDir } = await extractZipUpload(zipBytes)
    try {
      // No wrapper dir — extractedRoot should be the extract dir itself, not a child
      expect(path.basename(extractedRoot)).toBe('extracted')
      expect(fs.existsSync(path.join(extractedRoot, 'agents', 'test.md'))).toBe(true)
      expect(fs.existsSync(path.join(extractedRoot, 'module.yaml'))).toBe(true)
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true })
    }
  })

  // ─── AC-15.4.6 (success cleanup — caller responsible) ───
  it('caller can clean up tmpDir after successful extraction', async () => {
    const zipBytes = await buildZip([
      { entryName: 'agents/test.md', data: '# Test\n' },
      { entryName: 'module.yaml', data: 'code: cleanup-test\n' },
    ])

    const { tmpDir } = await extractZipUpload(zipBytes)
    expect(fs.existsSync(tmpDir)).toBe(true)
    fs.rmSync(tmpDir, { recursive: true, force: true })
    expect(fs.existsSync(tmpDir)).toBe(false)

    // After cleanup, the count of bmad-zip-* dirs should be back to baseline.
    const after = fs.readdirSync(os.tmpdir()).filter((n) => n.startsWith('bmad-zip-')).length
    expect(after).toBeLessThanOrEqual(tmpDirsCreatedBefore)
  })

  // ─── AC-15.4.6 (failure cleanup — internal) ───
  it('cleans up tmpDir on extraction failure (malformed zip)', async () => {
    // A buffer that is definitely not a valid zip
    const badZipBytes = Buffer.from('this is not a zip file at all')

    let threw = false
    try {
      await extractZipUpload(badZipBytes)
    } catch (err) {
      threw = true
      expect(err).toBeInstanceOf(Error)
      expect((err as Error).message).toContain('Failed to extract zip')
    }
    expect(threw).toBe(true)

    // The function should have cleaned up its own tmpDir on the throw path.
    const after = fs.readdirSync(os.tmpdir()).filter((n) => n.startsWith('bmad-zip-')).length
    expect(after).toBeLessThanOrEqual(tmpDirsCreatedBefore)
  })

  // ─── AC-15.4.7 (zip-slip mitigation) ───
  it('rejects zip entries that try to escape the extraction root', async () => {
    // Build a malicious zip with an entry whose name traverses outside extractDir.
    //
    // Gotcha: adm-zip's `addFile('../escape.txt', ...)` SANITIZES the entry name and
    // strips the leading `../`, so the obvious approach doesn't work. To inject a real
    // traversal we add the file with a normal name, then mutate the entry's `entryName`
    // property AFTER addFile but BEFORE toBuffer(). This bypasses adm-zip's input
    // sanitization and writes the traversal verbatim into the zip's central directory.
    const AdmZip = (await import('adm-zip')).default
    const evilZip = new AdmZip()
    evilZip.addFile('escape.txt', Buffer.from('PWNED'))
    evilZip.addFile('agents/test.md', Buffer.from('# Test\n'))
    const escapeEntry = evilZip.getEntries().find((e) => e.entryName === 'escape.txt')
    if (!escapeEntry) throw new Error('test setup failed: could not find escape.txt entry')
    escapeEntry.entryName = '../escape.txt'
    const maliciousZipBytes = evilZip.toBuffer()

    let threw = false
    let errMsg = ''
    try {
      await extractZipUpload(maliciousZipBytes)
    } catch (err) {
      threw = true
      errMsg = (err as Error).message
    }
    expect(threw).toBe(true)
    expect(errMsg).toContain('attempts to write outside')
    expect(errMsg).toContain('../escape.txt')

    // Verify NO escape.txt file landed anywhere in os.tmpdir() — the validation
    // happened BEFORE extractAllTo was called.
    const tmpEntries = fs.readdirSync(os.tmpdir())
    for (const name of tmpEntries) {
      if (name === 'escape.txt') {
        throw new Error('escape.txt landed in os.tmpdir() — zip-slip mitigation failed!')
      }
    }
    // Also walk any leaked bmad-zip-* dirs to make sure escape.txt isn't inside them
    for (const name of tmpEntries) {
      if (name.startsWith('bmad-zip-')) {
        const dir = path.join(os.tmpdir(), name)
        // Recursive walk
        const walk = (d: string) => {
          for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
            if (entry.name === 'escape.txt') {
              throw new Error(`escape.txt found inside ${d} — zip-slip mitigation failed!`)
            }
            if (entry.isDirectory()) walk(path.join(d, entry.name))
          }
        }
        try {
          walk(dir)
        } catch (e) {
          if ((e as Error).message.includes('zip-slip')) throw e
          /* ignore other walk errors */
        }
      }
    }

    // Also verify the tmp dir was cleaned up on the throw path
    const after = fs.readdirSync(os.tmpdir()).filter((n) => n.startsWith('bmad-zip-')).length
    expect(after).toBeLessThanOrEqual(tmpDirsCreatedBefore)
  })

  // ─── AC-15.4.5 (dynamic import — source check) ───
  it('AC-15.4.5: adm-zip is dynamically imported, not statically imported', () => {
    // Read the production source and verify it does NOT have a top-level adm-zip import.
    const sourcePath = path.resolve(
      process.cwd(),
      'packages/server/src/core/module-installer.ts',
    )
    const source = fs.readFileSync(sourcePath, 'utf-8')

    // No top-level static import of adm-zip
    expect(source).not.toMatch(/^import .* from ['"]adm-zip['"]/m)
    expect(source).not.toMatch(/^import\s+AdmZip\s+from/m)

    // But it DOES use the dynamic form somewhere
    expect(source).toMatch(/await import\(['"]adm-zip['"]\)/)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// validateVariables — Story 15.5
// ─────────────────────────────────────────────────────────────────────────────

describe('validateVariables', () => {
  it('accepts an empty record', () => {
    expect(validateVariables({})).toEqual({ ok: true })
  })

  it('accepts alphanumeric values', () => {
    expect(validateVariables({ name: 'AcmeProject', version: '123' })).toEqual({ ok: true })
  })

  it('accepts the AC-15.5.9 example: my-project_v1.0/aem', () => {
    expect(validateVariables({ project: 'my-project_v1.0/aem' })).toEqual({ ok: true })
  })

  it('accepts values with paths and colons', () => {
    expect(validateVariables({ url: 'localhost:4040/api' })).toEqual({ ok: true })
  })

  it('accepts an empty string value', () => {
    expect(validateVariables({ optional: '' })).toEqual({ ok: true })
  })

  it('accepts whitespace and Unicode letters', () => {
    expect(validateVariables({ name: 'Renée Müller' })).toEqual({ ok: true })
  })

  it('rejects values with YAML-breaking characters (#)', () => {
    const result = validateVariables({ bad: '# injection' })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toContain('"bad"')
    expect(result.error).toContain('# injection')
  })

  it('rejects values with newlines', () => {
    const result = validateVariables({ multiline: 'line1\nline2' })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toContain('"multiline"')
  })

  it('rejects values with double quotes', () => {
    const result = validateVariables({ quoted: 'has "quotes"' })
    expect(result.ok).toBe(false)
  })

  it('rejects on the FIRST violation (does not enumerate all)', () => {
    const result = validateVariables({ first: '# bad', second: '" bad' })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toContain('"first"')
    expect(result.error).not.toContain('"second"')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// readOutputFolder — Story 15.5
// ─────────────────────────────────────────────────────────────────────────────

describe('readOutputFolder', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'read-output-folder-')))
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  it('returns the default when no config.yaml exists', () => {
    expect(readOutputFolder(tmpDir)).toBe(path.join(tmpDir, '_bmad-output'))
  })

  it('returns the substituted output_folder when config.yaml declares it', () => {
    const configDir = path.join(tmpDir, '_bmad', '_config')
    fs.mkdirSync(configDir, { recursive: true })
    fs.writeFileSync(
      path.join(configDir, 'config.yaml'),
      'output_folder: "{project-root}/custom-out"\n',
    )
    expect(readOutputFolder(tmpDir)).toBe(path.join(tmpDir, 'custom-out'))
  })

  it('returns the default when config.yaml exists but has no output_folder field', () => {
    const configDir = path.join(tmpDir, '_bmad', '_config')
    fs.mkdirSync(configDir, { recursive: true })
    fs.writeFileSync(path.join(configDir, 'config.yaml'), 'project_name: foo\n')
    expect(readOutputFolder(tmpDir)).toBe(path.join(tmpDir, '_bmad-output'))
  })

  it('returns the default when config.yaml is malformed', () => {
    const configDir = path.join(tmpDir, '_bmad', '_config')
    fs.mkdirSync(configDir, { recursive: true })
    fs.writeFileSync(path.join(configDir, 'config.yaml'), 'output_folder: [unclosed\n')
    expect(readOutputFolder(tmpDir)).toBe(path.join(tmpDir, '_bmad-output'))
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// runVariableSubstitution — Story 15.5
// ─────────────────────────────────────────────────────────────────────────────

describe('runVariableSubstitution', () => {
  let tmpDir: string
  let studioDir: string
  let destDir: string
  let fileStore: FileStore

  beforeEach(() => {
    tmpDir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'run-var-sub-')))
    studioDir = path.join(tmpDir, '.bmad-studio')
    fs.mkdirSync(studioDir, { recursive: true })
    destDir = path.join(tmpDir, 'module-dest')
    fs.mkdirSync(destDir, { recursive: true })
    fileStore = makeStubFileStore(studioDir)
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  function ctx(overrides: Partial<{ moduleCode: string; variables: Record<string, string> }> = {}) {
    return {
      moduleCode: overrides.moduleCode ?? 'test-mod',
      projectRoot: tmpDir,
      outputFolder: path.join(tmpDir, '_bmad-output'),
      variables: overrides.variables ?? {},
    }
  }

  it('AC-15.5.1: substitutes {{var}} in a .md file', () => {
    fs.mkdirSync(path.join(destDir, 'agents'), { recursive: true })
    const file = path.join(destDir, 'agents', 'a.md')
    fs.writeFileSync(file, 'Hello {{name}}\n')

    const result = runVariableSubstitution(
      destDir,
      ctx({ variables: { name: 'World' } }),
      studioDir,
      fileStore,
    )

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.filesPatched).toBe(1)
    expect(fs.readFileSync(file, 'utf-8')).toBe('Hello World\n')
  })

  it('AC-15.5.2: substitutes {project-root} in a .yaml file', () => {
    const file = path.join(destDir, 'config.yaml')
    fs.writeFileSync(file, 'root: {project-root}\n')

    const result = runVariableSubstitution(destDir, ctx(), studioDir, fileStore)
    expect(result.ok).toBe(true)
    expect(fs.readFileSync(file, 'utf-8')).toBe(`root: ${tmpDir}\n`)
  })

  it('AC-15.5.3: substitutes {module-code} in a .csv file', () => {
    const file = path.join(destDir, 'manifest.csv')
    fs.writeFileSync(file, 'name,code\nfoo,{module-code}\n')

    const result = runVariableSubstitution(
      destDir,
      ctx({ moduleCode: 'dept-aem' }),
      studioDir,
      fileStore,
    )
    expect(result.ok).toBe(true)
    expect(fs.readFileSync(file, 'utf-8')).toBe('name,code\nfoo,dept-aem\n')
  })

  it('substitutes {output_folder} in a .txt file', () => {
    const file = path.join(destDir, 'notes.txt')
    fs.writeFileSync(file, 'output goes to {output_folder}\n')

    const result = runVariableSubstitution(destDir, ctx(), studioDir, fileStore)
    expect(result.ok).toBe(true)
    expect(fs.readFileSync(file, 'utf-8')).toBe(
      `output goes to ${path.join(tmpDir, '_bmad-output')}\n`,
    )
  })

  it('AC-15.5.4: leaves a .png file untouched (extension not in allowlist)', () => {
    const file = path.join(destDir, 'logo.png')
    // PNG-ish bytes (not actually a valid png, but the function should not even read it)
    const original = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    fs.writeFileSync(file, original)

    const result = runVariableSubstitution(destDir, ctx(), studioDir, fileStore)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.filesPatched).toBe(0)

    const after = fs.readFileSync(file)
    expect(Buffer.compare(after, original)).toBe(0)
  })

  it('AC-15.5.5: leaves a .md file with no placeholders untouched (filesPatched = 0)', () => {
    const file = path.join(destDir, 'readme.md')
    const original = '# Just a README\n\nNo placeholders here.\n'
    fs.writeFileSync(file, original)
    const mtimeBefore = fs.statSync(file).mtimeMs

    const result = runVariableSubstitution(destDir, ctx(), studioDir, fileStore)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.filesPatched).toBe(0)

    // The file should not have been re-written
    const mtimeAfter = fs.statSync(file).mtimeMs
    expect(mtimeAfter).toBe(mtimeBefore)
  })

  it('walks nested directories recursively', () => {
    fs.mkdirSync(path.join(destDir, 'agents'), { recursive: true })
    fs.mkdirSync(path.join(destDir, 'workflows', 'create'), { recursive: true })

    fs.writeFileSync(path.join(destDir, 'agents', 'a.md'), 'a={{x}}\n')
    fs.writeFileSync(path.join(destDir, 'workflows', 'create', 'workflow.md'), 'b={{x}}\n')
    fs.writeFileSync(path.join(destDir, 'noplace.md'), 'no placeholders\n')

    const result = runVariableSubstitution(
      destDir,
      ctx({ variables: { x: 'OK' } }),
      studioDir,
      fileStore,
    )
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.filesPatched).toBe(2)

    expect(fs.readFileSync(path.join(destDir, 'agents', 'a.md'), 'utf-8')).toBe('a=OK\n')
    expect(
      fs.readFileSync(path.join(destDir, 'workflows', 'create', 'workflow.md'), 'utf-8'),
    ).toBe('b=OK\n')
    // The no-placeholder file is unchanged
    expect(fs.readFileSync(path.join(destDir, 'noplace.md'), 'utf-8')).toBe('no placeholders\n')
  })

  it('returns the correct filesPatched count for mixed-result walks', () => {
    fs.writeFileSync(path.join(destDir, 'a.md'), 'a={{x}}\n')
    fs.writeFileSync(path.join(destDir, 'b.md'), 'b={{x}}\n')
    fs.writeFileSync(path.join(destDir, 'c.md'), 'c=plain\n') // no placeholder
    fs.writeFileSync(path.join(destDir, 'd.png'), Buffer.from([0x89, 0x50])) // skipped extension

    const result = runVariableSubstitution(
      destDir,
      ctx({ variables: { x: 'X' } }),
      studioDir,
      fileStore,
    )
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.filesPatched).toBe(2)
  })
})
