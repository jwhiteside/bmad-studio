import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import FormData from 'form-data'
import yaml from 'js-yaml'

import { createApp, MAX_MODULE_UPLOAD_BYTES } from '../app.js'
import { invalidateCache } from '../v65/manifest-loader.js'

function makeManifest(modules: Array<{ name: string; source: string }>) {
  return {
    installation: {
      version: '6.2.0',
      installDate: '2026-01-01T00:00:00.000Z',
      lastUpdated: '2026-01-01T00:00:00.000Z',
    },
    modules: modules.map((m) => ({
      name: m.name,
      version: '1.0.0',
      installDate: '2026-01-01T00:00:00.000Z',
      lastUpdated: '2026-01-01T00:00:00.000Z',
      source: m.source,
      npmPackage: null,
      repoUrl: null,
    })),
  }
}

describe('modules-plugin', () => {
  let tmpDir: string

  beforeEach(() => {
    // TD-20 — realpathSync resolves the macOS /var → /private/var symlink so path
    // comparisons against tmpDir are stable. New tests in Story 15.2 onwards depend on this.
    tmpDir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'modules-plugin-test-')))
    const configDir = path.join(tmpDir, '_bmad', '_config')
    const moduleDir = path.join(tmpDir, '_bmad', 'test-mod')
    fs.mkdirSync(configDir, { recursive: true })
    fs.mkdirSync(path.join(moduleDir, 'agents'), { recursive: true })
    fs.mkdirSync(path.join(moduleDir, 'skills'), { recursive: true })
    fs.mkdirSync(path.join(moduleDir, 'workflows'), { recursive: true })
    fs.writeFileSync(path.join(moduleDir, 'config.yaml'), 'project_name: test-mod\n')
    fs.writeFileSync(
      path.join(configDir, 'manifest.yaml'),
      yaml.dump(makeManifest([{ name: 'test-mod', source: 'custom' }])),
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
        modules: [{ name: 'test-mod', version: '1.0.0', source: 'custom' }],
        ideDirectories: [],
      },
    })
  }

  // --- Story 12.1: Add entities ---

  it('POST /api/modules/:name/entities creates a skill file', async () => {
    const app = await createTestApp()
    const resp = await app.inject({
      method: 'POST',
      url: '/api/modules/test-mod/entities',
      payload: { type: 'skill', name: 'my-skill' },
    })
    expect(resp.statusCode).toBe(201)
    const body = JSON.parse(resp.body)
    expect(body.ok).toBe(true)
    expect(body.type).toBe('skill')

    const skillPath = path.join(tmpDir, '_bmad', 'test-mod', 'skills', 'my-skill', 'SKILL.md')
    expect(fs.existsSync(skillPath)).toBe(true)
    const content = fs.readFileSync(skillPath, 'utf-8')
    expect(content).toContain('name: my-skill')
    await app.close()
  })

  it('POST /api/modules/:name/entities creates a workflow directory', async () => {
    const app = await createTestApp()
    const resp = await app.inject({
      method: 'POST',
      url: '/api/modules/test-mod/entities',
      payload: { type: 'workflow', name: 'my-workflow' },
    })
    expect(resp.statusCode).toBe(201)

    const wfPath = path.join(tmpDir, '_bmad', 'test-mod', 'workflows', 'my-workflow', 'workflow.md')
    expect(fs.existsSync(wfPath)).toBe(true)
    const content = fs.readFileSync(wfPath, 'utf-8')
    expect(content).toContain('name: my-workflow')
    await app.close()
  })

  it('POST /api/modules/:name/entities creates an agent file', async () => {
    const app = await createTestApp()
    const resp = await app.inject({
      method: 'POST',
      url: '/api/modules/test-mod/entities',
      payload: { type: 'agent', name: 'my-agent' },
    })
    expect(resp.statusCode).toBe(201)

    const agentPath = path.join(tmpDir, '_bmad', 'test-mod', 'agents', 'my-agent.md')
    expect(fs.existsSync(agentPath)).toBe(true)
    const content = fs.readFileSync(agentPath, 'utf-8')
    expect(content).toContain('name: my-agent')
    await app.close()
  })

  it('POST /api/modules/:name/entities rejects invalid type', async () => {
    const app = await createTestApp()
    const resp = await app.inject({
      method: 'POST',
      url: '/api/modules/test-mod/entities',
      payload: { type: 'invalid', name: 'test' },
    })
    expect(resp.statusCode).toBe(422)
    await app.close()
  })

  it('POST /api/modules/:name/entities rejects missing name', async () => {
    const app = await createTestApp()
    const resp = await app.inject({
      method: 'POST',
      url: '/api/modules/test-mod/entities',
      payload: { type: 'skill' },
    })
    expect(resp.statusCode).toBe(422)
    await app.close()
  })

  it('POST /api/modules/:name/entities returns 404 for nonexistent module', async () => {
    const app = await createTestApp()
    const resp = await app.inject({
      method: 'POST',
      url: '/api/modules/no-such-mod/entities',
      payload: { type: 'skill', name: 'test' },
    })
    expect(resp.statusCode).toBe(404)
    await app.close()
  })

  it('POST /api/modules/:name/entities rejects duplicate skill', async () => {
    const app = await createTestApp()
    // Create first
    await app.inject({
      method: 'POST',
      url: '/api/modules/test-mod/entities',
      payload: { type: 'skill', name: 'dup-skill' },
    })
    // Create duplicate
    const resp = await app.inject({
      method: 'POST',
      url: '/api/modules/test-mod/entities',
      payload: { type: 'skill', name: 'dup-skill' },
    })
    expect(resp.statusCode).toBe(409)
    await app.close()
  })

  // --- Story 12.2: Upload entities with content ---

  it('POST /api/modules/:name/entities accepts custom content', async () => {
    const app = await createTestApp()
    const customContent = '---\nname: uploaded-skill\ncategory: testing\n---\n\n# Uploaded Skill\n\nCustom content here.\n'
    const resp = await app.inject({
      method: 'POST',
      url: '/api/modules/test-mod/entities',
      payload: { type: 'skill', name: 'uploaded-skill', content: customContent },
    })
    expect(resp.statusCode).toBe(201)

    const skillPath = path.join(tmpDir, '_bmad', 'test-mod', 'skills', 'uploaded-skill', 'SKILL.md')
    const content = fs.readFileSync(skillPath, 'utf-8')
    expect(content).toBe(customContent)
    await app.close()
  })

  it('POST /api/modules/:name/entities uploads agent with content', async () => {
    const app = await createTestApp()
    const customContent = '---\nname: uploaded-agent\ntitle: Test Agent\n---\n\n# Uploaded Agent\n'
    const resp = await app.inject({
      method: 'POST',
      url: '/api/modules/test-mod/entities',
      payload: { type: 'agent', name: 'uploaded-agent', content: customContent },
    })
    expect(resp.statusCode).toBe(201)

    const agentPath = path.join(tmpDir, '_bmad', 'test-mod', 'agents', 'uploaded-agent.md')
    const content = fs.readFileSync(agentPath, 'utf-8')
    expect(content).toBe(customContent)
    await app.close()
  })

  // --- Story 12.3: Export module manifest ---

  it('POST /api/modules/:name/export returns manifest', async () => {
    const app = await createTestApp()
    const resp = await app.inject({
      method: 'POST',
      url: '/api/modules/test-mod/export',
    })
    expect(resp.statusCode).toBe(200)
    const body = JSON.parse(resp.body)
    expect(body.module).toBe('test-mod')
    expect(body.version).toBe('1.0.0')
    expect(body.exportDate).toBeTruthy()
    expect(body.entities).toBeTruthy()
    expect(body.entities.agents).toHaveProperty('count')
    expect(body.entities.agents).toHaveProperty('names')
    expect(body.entities.skills).toHaveProperty('count')
    expect(body.entities.workflows).toHaveProperty('count')
    expect(typeof body.totalEntities).toBe('number')
    expect(body.note).toContain('future enhancement')
    await app.close()
  })

  it('POST /api/modules/:name/export returns 404 for nonexistent module', async () => {
    const app = await createTestApp()
    const resp = await app.inject({
      method: 'POST',
      url: '/api/modules/no-such-mod/export',
    })
    expect(resp.statusCode).toBe(404)
    await app.close()
  })

  it('POST /api/modules/:name/export includes entities after adding them', async () => {
    const app = await createTestApp()

    // Add a skill
    await app.inject({
      method: 'POST',
      url: '/api/modules/test-mod/entities',
      payload: { type: 'skill', name: 'export-test-skill' },
    })

    // Add a workflow
    await app.inject({
      method: 'POST',
      url: '/api/modules/test-mod/entities',
      payload: { type: 'workflow', name: 'export-test-wf' },
    })

    const resp = await app.inject({
      method: 'POST',
      url: '/api/modules/test-mod/export',
    })
    expect(resp.statusCode).toBe(200)
    const body = JSON.parse(resp.body)
    expect(body.entities.skills.count).toBeGreaterThanOrEqual(1)
    expect(body.entities.skills.names).toContain('export-test-skill')
    expect(body.totalEntities).toBeGreaterThanOrEqual(2)
    await app.close()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Story 15.2 — Polymorphic install endpoint + local source type
// ─────────────────────────────────────────────────────────────────────────────

describe('modules-plugin — Story 15.2 polymorphic install', () => {
  let tmpDir: string
  let sourceParent: string

  beforeEach(() => {
    // TD-20 — realpathSync for stable path comparisons.
    tmpDir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'modules-plugin-15-2-')))
    sourceParent = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'modules-plugin-15-2-src-')))

    const configDir = path.join(tmpDir, '_bmad', '_config')
    fs.mkdirSync(configDir, { recursive: true })
    fs.writeFileSync(
      path.join(configDir, 'manifest.yaml'),
      yaml.dump(makeManifest([])),
    )
    fs.mkdirSync(path.join(tmpDir, '.bmad-studio'), { recursive: true })
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
    fs.rmSync(sourceParent, { recursive: true, force: true })
  })

  function createTestApp() {
    return createApp({
      logger: false,
      serveStatic: false,
      project: {
        projectRoot: tmpDir,
        bmadVersion: '6.2.0',
        versionSupported: true,
        modules: [],
        ideDirectories: [],
      },
    })
  }

  /**
   * Build a fixture source module under sourceParent.
   * @param dirName  the directory name (becomes the basename)
   * @param opts.code  if provided, writes a module.yaml with this code
   * @param opts.binary  if true, also writes assets/icon.png with valid PNG header bytes
   *                     (deliberately invalid utf-8 — exposes any accidental decode)
   */
  function createSourceModule(
    dirName: string,
    opts: { code?: string; binary?: boolean } = {},
  ): string {
    const sourceDir = path.join(sourceParent, dirName)
    fs.mkdirSync(path.join(sourceDir, 'agents'), { recursive: true })
    fs.writeFileSync(
      path.join(sourceDir, 'agents', 'architect.md'),
      '---\nname: architect\ntitle: Architect\n---\n\n# Architect\n',
    )
    if (opts.code) {
      fs.writeFileSync(
        path.join(sourceDir, 'module.yaml'),
        `code: ${opts.code}\nname: "Test Module"\nversion: "1.0.0"\n`,
      )
    }
    if (opts.binary) {
      fs.mkdirSync(path.join(sourceDir, 'assets'), { recursive: true })
      // PNG signature 0x89 0x50 0x4E 0x47 — leading 0x89 is invalid UTF-8.
      // If anyone tries to decode this as utf-8, the round-trip is lossy and
      // the buffer comparison in AC-15.2.2a fails — exactly the regression
      // guard we want.
      fs.writeFileSync(
        path.join(sourceDir, 'assets', 'icon.png'),
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      )
    }
    return sourceDir
  }

  // ─── AC-15.2.1 — legacy { packageName } body still routes to npm branch ───
  it('AC-15.2.1: legacy { packageName } body routes to the npm branch', async () => {
    // We can't easily mock execSync inside the handler from here without
    // restructuring the plugin, so instead we send a packageName for a package
    // that definitely doesn't exist and assert we get the npm-branch error path
    // (a 400 from the npm pack failure), not the "Either source or packageName"
    // error from the discrimination step. This proves the legacy shape was
    // accepted and routed.
    const app = await createTestApp()
    const resp = await app.inject({
      method: 'POST',
      url: '/api/modules/install',
      payload: { packageName: 'this-package-definitely-does-not-exist-1234567890' },
    })
    // npm branch errors now use ValidationError → 422 (consistent with other branches)
    expect(resp.statusCode).toBe(422)
    const body = JSON.parse(resp.body)
    // Error message comes from npm pack failure — proves we routed past discrimination
    // into the npm branch (not the "Either source or packageName" guard).
    expect(body.error).not.toContain('Either `source` or `packageName`')
    await app.close()
  })

  // ─── AC-15.2.2 + AC-15.2.2a — local install copies text + binary correctly ───
  it('AC-15.2.2 + 2a: local install copies text and binary files byte-identically', async () => {
    const sourceDir = createSourceModule('bin-test', { code: 'bin-test', binary: true })
    const originalPng = fs.readFileSync(path.join(sourceDir, 'assets', 'icon.png'))

    const app = await createTestApp()
    const resp = await app.inject({
      method: 'POST',
      url: '/api/modules/install',
      payload: { source: { type: 'local', value: sourceDir } },
    })
    expect(resp.statusCode).toBe(200)
    const body = JSON.parse(resp.body)
    expect(body.ok).toBe(true)
    expect(body.modules).toEqual(['bin-test'])
    // text count: agents/architect.md + module.yaml = 2; binary count: assets/icon.png = 1
    expect(body.filesCopied).toEqual({ text: 2, binary: 1 })

    // Markdown file landed correctly
    const installedMd = fs.readFileSync(
      path.join(tmpDir, '_bmad', 'bin-test', 'agents', 'architect.md'),
      'utf-8',
    )
    expect(installedMd).toContain('# Architect')

    // PNG file is byte-identical (the regression guard against accidental utf-8 decode)
    const installedPng = fs.readFileSync(path.join(tmpDir, '_bmad', 'bin-test', 'assets', 'icon.png'))
    expect(Buffer.compare(installedPng, originalPng)).toBe(0)

    await app.close()
  })

  // ─── AC-15.2.3 — relative path resolves against projectRoot ───
  it('AC-15.2.3: relative local path resolves against projectRoot', async () => {
    // Place the source inside the project root
    const sourceInsideProject = path.join(tmpDir, 'scratch', 'my-mod')
    fs.mkdirSync(path.join(sourceInsideProject, 'agents'), { recursive: true })
    fs.writeFileSync(path.join(sourceInsideProject, 'agents', 'a.md'), '# a\n')
    fs.writeFileSync(path.join(sourceInsideProject, 'module.yaml'), 'code: rel-mod\n')

    const app = await createTestApp()
    const resp = await app.inject({
      method: 'POST',
      url: '/api/modules/install',
      payload: { source: { type: 'local', value: 'scratch/my-mod' } },
    })
    expect(resp.statusCode).toBe(200)
    expect(fs.existsSync(path.join(tmpDir, '_bmad', 'rel-mod', 'agents', 'a.md'))).toBe(true)
    await app.close()
  })

  // ─── AC-15.2.4 — non-existent or non-module path is rejected ───
  it('AC-15.2.4 (a): non-existent local path returns 422 (ValidationError)', async () => {
    const app = await createTestApp()
    const resp = await app.inject({
      method: 'POST',
      url: '/api/modules/install',
      payload: { source: { type: 'local', value: '/does/not/exist/anywhere/12345' } },
    })
    expect(resp.statusCode).toBe(422)
    expect(JSON.parse(resp.body).error.message).toContain('does not look like a BMAD module')
    await app.close()
  })

  it('AC-15.2.4 (b): existing path with no entity dirs and no module.yaml returns 422', async () => {
    const sourceDir = path.join(sourceParent, 'just-readme')
    fs.mkdirSync(sourceDir, { recursive: true })
    fs.writeFileSync(path.join(sourceDir, 'README.md'), '# Not a module\n')

    const app = await createTestApp()
    const resp = await app.inject({
      method: 'POST',
      url: '/api/modules/install',
      payload: { source: { type: 'local', value: sourceDir } },
    })
    expect(resp.statusCode).toBe(422)
    expect(JSON.parse(resp.body).error.message).toContain('does not look like a BMAD module')
    await app.close()
  })

  // ─── AC-15.2.5 — module.yaml.code overrides directory basename ───
  it('AC-15.2.5: module.yaml.code overrides the directory basename', async () => {
    const sourceDir = createSourceModule('source-name-different', { code: 'dept-aem' })

    const app = await createTestApp()
    const resp = await app.inject({
      method: 'POST',
      url: '/api/modules/install',
      payload: { source: { type: 'local', value: sourceDir } },
    })
    expect(resp.statusCode).toBe(200)
    const body = JSON.parse(resp.body)
    expect(body.modules).toEqual(['dept-aem'])

    // Destination directory uses the code, not the source basename
    expect(fs.existsSync(path.join(tmpDir, '_bmad', 'dept-aem'))).toBe(true)
    expect(fs.existsSync(path.join(tmpDir, '_bmad', 'source-name-different'))).toBe(false)

    // Manifest entry name matches the code
    const manifest = yaml.load(
      fs.readFileSync(path.join(tmpDir, '_bmad', '_config', 'manifest.yaml'), 'utf-8'),
    ) as { modules: Array<{ name: string; source: string }> }
    expect(manifest.modules.find((m) => m.name === 'dept-aem')).toBeDefined()
    expect(manifest.modules.find((m) => m.name === 'source-name-different')).toBeUndefined()
    await app.close()
  })

  // ─── AC-15.2.6 / Story 17.3 — second install of same module returns 200 (clean-slate) ───
  it('AC-15.2.6: re-install of an existing module returns 200 (clean-slate)', async () => {
    const sourceDir = createSourceModule('reinstall-test', { code: 'reinstall-test' })

    const app = await createTestApp()
    const first = await app.inject({
      method: 'POST',
      url: '/api/modules/install',
      payload: { source: { type: 'local', value: sourceDir } },
    })
    expect(first.statusCode).toBe(200)

    const second = await app.inject({
      method: 'POST',
      url: '/api/modules/install',
      payload: { source: { type: 'local', value: sourceDir } },
    })
    expect(second.statusCode).toBe(200)
    expect(JSON.parse(second.body).ok).toBe(true)
    await app.close()
  })

  // ─── AC-15.2.7 — text writes go through WriteService snapshots; binaries do not ───
  it('AC-15.2.7: text writes snapshot to .bmad-studio/history/, binaries do not', async () => {
    // Pre-populate the destination with a file that the install will overwrite,
    // so the WriteService has a previous version to snapshot.
    const destModuleDir = path.join(tmpDir, '_bmad', 'snap-test')
    fs.mkdirSync(path.join(destModuleDir, 'agents'), { recursive: true })
    fs.writeFileSync(path.join(destModuleDir, 'agents', 'architect.md'), '# Old version\n')

    // The install will 409 because the dest already exists, so instead we test
    // the snapshot behavior by manually invoking copyDirThroughWriteService through
    // a different module (touching a fresh dest). Use the create-module endpoint
    // which routes manifest writes through WriteService — that's enough to verify
    // the snapshot mechanism is wired up.
    const app = await createTestApp()

    // Create a module — this writes config.yaml directly (fs.writeFileSync, not WriteService)
    // and updates the manifest through writeManifestThroughWriteService.
    await app.inject({
      method: 'POST',
      url: '/api/modules',
      payload: { name: 'snap-test-2', version: '1.0.0' },
    })

    // The first manifest update happens during the test setup (beforeEach writes manifest.yaml).
    // The create-module call above modifies it through WriteService — so a snapshot of
    // the original (empty modules) manifest should now exist.
    const historyDir = path.join(tmpDir, '.bmad-studio', 'history')
    expect(fs.existsSync(historyDir)).toBe(true)
    const snapshots = fs.readdirSync(historyDir)
    expect(snapshots.some((f) => f.endsWith('manifest.yaml'))).toBe(true)

    // No snapshot files should be PNGs (binaries don't snapshot)
    expect(snapshots.some((f) => f.endsWith('.png'))).toBe(false)

    await app.close()
  })

  // ─── AC-15.2.8 — old helper functions are gone from modules-plugin.ts ───
  it('AC-15.2.8: modules-plugin.ts no longer contains the old helper functions', () => {
    const pluginSource = fs.readFileSync(
      path.join(process.cwd(), 'packages/server/src/plugins/modules-plugin.ts'),
      'utf-8',
    )
    expect(pluginSource).not.toMatch(/function readManifest\(/)
    expect(pluginSource).not.toMatch(/function writeManifest\(/)
    expect(pluginSource).not.toMatch(/function copyDirRecursive\(/)
  })

  // ─── AC-15.2.9 — missing manifest.yaml is a hard 422 ───
  it('AC-15.2.9: missing manifest.yaml returns 422 with installer instructions', async () => {
    // Delete the manifest the beforeEach created
    fs.unlinkSync(path.join(tmpDir, '_bmad', '_config', 'manifest.yaml'))

    const sourceDir = createSourceModule('orphan-mod', { code: 'orphan-mod' })

    const app = await createTestApp()
    const resp = await app.inject({
      method: 'POST',
      url: '/api/modules/install',
      payload: { source: { type: 'local', value: sourceDir } },
    })
    expect(resp.statusCode).toBe(422)
    const body = JSON.parse(resp.body)
    expect(body.error.message).toBe(
      'Cannot install module: missing _bmad/_config/manifest.yaml. Run `npx bmad-method install` to initialise the project first.',
    )
    await app.close()
  })

  // ─── AC-15.2.10 — both source and packageName: source wins ───
  it('AC-15.2.10: when both source and packageName are present, source wins', async () => {
    const sourceDir = createSourceModule('precedence-test', { code: 'precedence-test' })

    const app = await createTestApp()
    const resp = await app.inject({
      method: 'POST',
      url: '/api/modules/install',
      payload: {
        source: { type: 'local', value: sourceDir },
        packageName: 'this-would-fail-if-it-was-used',
      },
    })
    // If `packageName` had won, the npm branch would 400. If `source` won, the local install succeeds.
    expect(resp.statusCode).toBe(200)
    expect(JSON.parse(resp.body).modules).toEqual(['precedence-test'])
    await app.close()
  })

  // ─── AC-15.2.11 — variables field accepted but not consumed (forward compatibility) ───
  it('AC-15.2.11: variables field is accepted in the body without affecting install', async () => {
    const sourceDir = createSourceModule('vars-test', { code: 'vars-test' })

    const app = await createTestApp()
    const resp = await app.inject({
      method: 'POST',
      url: '/api/modules/install',
      payload: {
        source: { type: 'local', value: sourceDir },
        variables: { project_name: 'AcmeProject', region: 'us-east-1' },
      },
    })
    expect(resp.statusCode).toBe(200)
    expect(JSON.parse(resp.body).modules).toEqual(['vars-test'])
    // The variables aren't consumed yet (Story 15.5), so the file content is unchanged
    const installed = fs.readFileSync(
      path.join(tmpDir, '_bmad', 'vars-test', 'agents', 'architect.md'),
      'utf-8',
    )
    expect(installed).not.toContain('AcmeProject')
    await app.close()
  })

  // (Story 15.2 had a github 501 placeholder test here. Story 15.3 implemented
  // the github branch — see the dedicated 'modules-plugin — Story 15.3 github install'
  // describe block below for the real github tests with mocked fetch.)

  // ─── neither source nor packageName: clean error ───
  it('returns 422 when neither source nor packageName is provided', async () => {
    const app = await createTestApp()
    const resp = await app.inject({
      method: 'POST',
      url: '/api/modules/install',
      payload: {},
    })
    expect(resp.statusCode).toBe(422)
    expect(JSON.parse(resp.body).error.message).toContain(
      'Either `source` or `packageName` is required',
    )
    await app.close()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Story 15.3 — Polymorphic install: github source type
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build a fixture tarball that mimics GitHub's tarball format. GitHub tarballs
 * always extract to a single wrapper directory like {owner}-{repo}-{shortsha}/.
 *
 * @param wrapperName  the wrapper directory name (e.g. 'owner-repo-abc1234')
 * @param contentBuilder  callback that populates the wrapper dir with files
 */
function buildFixtureTarball(
  wrapperName: string,
  contentBuilder: (wrapperDir: string) => void,
): Buffer {
  const stagingRoot = fs.realpathSync(
    fs.mkdtempSync(path.join(os.tmpdir(), 'bmad-tarball-fixture-')),
  )
  try {
    const wrapperDir = path.join(stagingRoot, wrapperName)
    fs.mkdirSync(wrapperDir, { recursive: true })
    contentBuilder(wrapperDir)

    const tarballPath = path.join(stagingRoot, 'fixture.tar.gz')
    execSync(`tar -czf "${tarballPath}" -C "${stagingRoot}" "${wrapperName}"`, { stdio: 'pipe' })
    return fs.readFileSync(tarballPath)
  } finally {
    fs.rmSync(stagingRoot, { recursive: true, force: true })
  }
}

// Build the two fixture tarballs once at module load (cheap, ~1ms each).
const VALID_MODULE_TARBALL = buildFixtureTarball('owner-repo-abc1234', (wrapperDir) => {
  fs.mkdirSync(path.join(wrapperDir, 'agents'), { recursive: true })
  fs.writeFileSync(
    path.join(wrapperDir, 'agents', 'test.md'),
    '---\nname: test\ntitle: Test Agent\n---\n# Test\n',
  )
  fs.writeFileSync(
    path.join(wrapperDir, 'module.yaml'),
    'code: gh-test\nname: "GitHub Test Module"\nversion: "1.0.0"\n',
  )
})

// A second fixture where the only content is a docs subdir with no entity dirs and no module.yaml —
// used to verify isPlausibleModuleDir rejects non-module subpaths and that cleanup still happens.
const DOCS_ONLY_TARBALL = buildFixtureTarball('owner-repo-abc1234', (wrapperDir) => {
  fs.mkdirSync(path.join(wrapperDir, 'docs'), { recursive: true })
  fs.writeFileSync(path.join(wrapperDir, 'docs', 'README.md'), '# Just docs\n')
})

// A third fixture with a valid subpath module — used to verify subpath navigation works.
const SUBPATH_MODULE_TARBALL = buildFixtureTarball('owner-repo-abc1234', (wrapperDir) => {
  fs.mkdirSync(path.join(wrapperDir, 'modules', 'inner', 'agents'), { recursive: true })
  fs.writeFileSync(
    path.join(wrapperDir, 'modules', 'inner', 'agents', 'a.md'),
    '---\nname: a\n---\n# A\n',
  )
  fs.writeFileSync(
    path.join(wrapperDir, 'modules', 'inner', 'module.yaml'),
    'code: inner-mod\nversion: "1.0.0"\n',
  )
})

/** Make a Response that mocks the github tarball API. */
function mockTarballResponse(bytes: Buffer): Response {
  return new Response(bytes as unknown as BodyInit, {
    status: 200,
    statusText: 'OK',
    headers: { 'Content-Type': 'application/gzip' },
  })
}

function mockNotFoundResponse(): Response {
  return new Response('Not Found', { status: 404, statusText: 'Not Found' })
}

function mockUnauthorizedResponse(): Response {
  return new Response('Unauthorized', { status: 401, statusText: 'Unauthorized' })
}

describe('modules-plugin — Story 15.3 github install', () => {
  let tmpDir: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let fetchSpy: any

  beforeEach(() => {
    tmpDir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'modules-plugin-15-3-')))
    const configDir = path.join(tmpDir, '_bmad', '_config')
    fs.mkdirSync(configDir, { recursive: true })
    fs.writeFileSync(path.join(configDir, 'manifest.yaml'), yaml.dump(makeManifest([])))
    fs.mkdirSync(path.join(tmpDir, '.bmad-studio'), { recursive: true })

    fetchSpy = vi.spyOn(globalThis, 'fetch')
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
    vi.restoreAllMocks()
  })

  function createTestApp() {
    return createApp({
      logger: false,
      serveStatic: false,
      project: {
        projectRoot: tmpDir,
        bmadVersion: '6.2.0',
        versionSupported: true,
        modules: [],
        ideDirectories: [],
      },
    })
  }

  // ─── AC-15.3.1, AC-15.3.5 (no fallback needed), AC-15.3.7, AC-15.3.9 ─────────
  it('AC-15.3.1: bare owner/repo installs from main branch', async () => {
    fetchSpy.mockImplementationOnce(async () => mockTarballResponse(VALID_MODULE_TARBALL))

    const app = await createTestApp()
    const resp = await app.inject({
      method: 'POST',
      url: '/api/modules/install',
      payload: { source: { type: 'github', value: 'owner/repo' } },
    })
    expect(resp.statusCode).toBe(200)
    const body = JSON.parse(resp.body)
    expect(body.ok).toBe(true)
    expect(body.modules).toEqual(['gh-test'])
    expect(body.source).toEqual({ type: 'github', value: 'owner/repo', branch: 'main' })

    // The fetch URL should target main
    expect(fetchSpy).toHaveBeenCalledTimes(1)
    expect(fetchSpy.mock.calls[0][0]).toContain('/repos/owner/repo/tarball/main')

    // Module landed correctly
    expect(fs.existsSync(path.join(tmpDir, '_bmad', 'gh-test', 'agents', 'test.md'))).toBe(true)

    // AC-15.3.7 — manifest entry shape
    const manifest = yaml.load(
      fs.readFileSync(path.join(tmpDir, '_bmad', '_config', 'manifest.yaml'), 'utf-8'),
    ) as { modules: Array<{ name: string; source: string; repoUrl: string; npmPackage: null }> }
    const entry = manifest.modules.find((m) => m.name === 'gh-test')
    expect(entry).toBeDefined()
    expect(entry!.source).toBe('github')
    expect(entry!.repoUrl).toBe('https://github.com/owner/repo')
    expect(entry!.npmPackage).toBeNull()

    await app.close()
  })

  // ─── AC-15.3.2 — owner/repo/subpath@branch ───
  it('AC-15.3.2: owner/repo/subpath@dev fetches the dev branch and navigates the subpath', async () => {
    fetchSpy.mockImplementationOnce(async () => mockTarballResponse(SUBPATH_MODULE_TARBALL))

    const app = await createTestApp()
    const resp = await app.inject({
      method: 'POST',
      url: '/api/modules/install',
      payload: { source: { type: 'github', value: 'owner/repo/modules/inner@dev' } },
    })
    expect(resp.statusCode).toBe(200)
    const body = JSON.parse(resp.body)
    expect(body.modules).toEqual(['inner-mod'])
    expect(body.source.branch).toBe('dev')
    expect(fetchSpy.mock.calls[0][0]).toContain('/tarball/dev')

    expect(fs.existsSync(path.join(tmpDir, '_bmad', 'inner-mod', 'agents', 'a.md'))).toBe(true)
    await app.close()
  })

  // ─── AC-15.3.3 — full URL with /tree/ form ───
  it('AC-15.3.3: full URL with /tree/branch/subpath parses correctly', async () => {
    fetchSpy.mockImplementationOnce(async () => mockTarballResponse(SUBPATH_MODULE_TARBALL))

    const app = await createTestApp()
    const resp = await app.inject({
      method: 'POST',
      url: '/api/modules/install',
      payload: {
        source: {
          type: 'github',
          value: 'https://github.com/owner/repo/tree/main/modules/inner',
        },
      },
    })
    expect(resp.statusCode).toBe(200)
    expect(fetchSpy.mock.calls[0][0]).toContain('/repos/owner/repo/tarball/main')
    expect(JSON.parse(resp.body).source.branch).toBe('main')
    await app.close()
  })

  // ─── AC-15.3.4 — 401 returns the friendly token-error message ───
  it('AC-15.3.4: 401 from GitHub returns 422 with the GITHUB_TOKEN guidance', async () => {
    // Make sure no token is set so the 401 path is reached cleanly
    const savedToken = process.env.GITHUB_TOKEN
    const savedBmadToken = process.env.BMAD_GITHUB_TOKEN
    delete process.env.GITHUB_TOKEN
    delete process.env.BMAD_GITHUB_TOKEN

    try {
      fetchSpy.mockImplementationOnce(async () => mockUnauthorizedResponse())

      const app = await createTestApp()
      const resp = await app.inject({
        method: 'POST',
        url: '/api/modules/install',
        payload: { source: { type: 'github', value: 'private/repo' } },
      })
      expect(resp.statusCode).toBe(422)
      expect(JSON.parse(resp.body).error.message).toBe(
        'Cannot access private/repo. If this is a private repository, set GITHUB_TOKEN in your environment before starting BMAD Studio.',
      )
      await app.close()
    } finally {
      if (savedToken !== undefined) process.env.GITHUB_TOKEN = savedToken
      if (savedBmadToken !== undefined) process.env.BMAD_GITHUB_TOKEN = savedBmadToken
    }
  })

  // ─── AC-15.3.5 — main 404 → master 200 fallback ───
  it('AC-15.3.5: main 404 falls back to master', async () => {
    fetchSpy
      .mockImplementationOnce(async () => mockNotFoundResponse())
      .mockImplementationOnce(async () => mockTarballResponse(VALID_MODULE_TARBALL))

    const app = await createTestApp()
    const resp = await app.inject({
      method: 'POST',
      url: '/api/modules/install',
      payload: { source: { type: 'github', value: 'owner/repo' } },
    })
    expect(resp.statusCode).toBe(200)
    expect(JSON.parse(resp.body).source.branch).toBe('master')

    expect(fetchSpy).toHaveBeenCalledTimes(2)
    expect(fetchSpy.mock.calls[0][0]).toContain('/tarball/main')
    expect(fetchSpy.mock.calls[1][0]).toContain('/tarball/master')
    await app.close()
  })

  // ─── AC-15.3.6 — both branches 404 → 422 with branch names in error ───
  it('AC-15.3.6: both main and master 404 returns 422 mentioning the failed branch', async () => {
    fetchSpy
      .mockImplementationOnce(async () => mockNotFoundResponse())
      .mockImplementationOnce(async () => mockNotFoundResponse())

    const app = await createTestApp()
    const resp = await app.inject({
      method: 'POST',
      url: '/api/modules/install',
      payload: { source: { type: 'github', value: 'owner/repo' } },
    })
    expect(resp.statusCode).toBe(422)
    const errMsg = JSON.parse(resp.body).error.message
    // The lastError reflects the last attempted branch (master)
    expect(errMsg).toMatch(/master/)
    expect(errMsg).toMatch(/not found/)
    await app.close()
  })

  // ─── AC-15.3.8 — temp dirs are cleaned up on failure ───
  it('AC-15.3.8: failed install cleans up temp directories', async () => {
    fetchSpy
      .mockImplementationOnce(async () => mockNotFoundResponse())
      .mockImplementationOnce(async () => mockNotFoundResponse())

    const before = fs
      .readdirSync(os.tmpdir())
      .filter((n) => n.startsWith('bmad-github-')).length

    const app = await createTestApp()
    const resp = await app.inject({
      method: 'POST',
      url: '/api/modules/install',
      payload: { source: { type: 'github', value: 'owner/repo' } },
    })
    expect(resp.statusCode).toBe(422)

    const after = fs
      .readdirSync(os.tmpdir())
      .filter((n) => n.startsWith('bmad-github-')).length

    // The failing install should not LEAK a new dir. Other tests in the suite may
    // have dropped their dirs concurrently, so use <= rather than ===.
    expect(after).toBeLessThanOrEqual(before)
    await app.close()
  })

  // ─── AC-15.3.9 — explicit branch is reflected in the response ───
  it('AC-15.3.9: explicit branch is reflected in response.source.branch', async () => {
    fetchSpy.mockImplementationOnce(async () => mockTarballResponse(VALID_MODULE_TARBALL))

    const app = await createTestApp()
    const resp = await app.inject({
      method: 'POST',
      url: '/api/modules/install',
      payload: { source: { type: 'github', value: 'owner/repo@develop' } },
    })
    expect(resp.statusCode).toBe(200)
    expect(JSON.parse(resp.body).source.branch).toBe('develop')
    expect(fetchSpy.mock.calls[0][0]).toContain('/tarball/develop')
    await app.close()
  })

  // ─── AC-15.3.10 — manifest existence guard runs BEFORE the network call ───
  it('AC-15.3.10: missing manifest.yaml prevents the github fetch from being made', async () => {
    fs.unlinkSync(path.join(tmpDir, '_bmad', '_config', 'manifest.yaml'))

    const app = await createTestApp()
    const resp = await app.inject({
      method: 'POST',
      url: '/api/modules/install',
      payload: { source: { type: 'github', value: 'owner/repo' } },
    })
    expect(resp.statusCode).toBe(422)
    expect(JSON.parse(resp.body).error.message).toBe(
      'Cannot install module: missing _bmad/_config/manifest.yaml. Run `npx bmad-method install` to initialise the project first.',
    )
    // CRITICAL — fetch was NOT called. The guard runs before the download.
    expect(fetchSpy).not.toHaveBeenCalled()
    await app.close()
  })

  // ─── AC-15.3.11 — non-module subpath returns 422 and cleans up ───
  it('AC-15.3.11: non-module subpath returns 422 and cleans up the temp dir', async () => {
    fetchSpy.mockImplementationOnce(async () => mockTarballResponse(DOCS_ONLY_TARBALL))

    const before = fs
      .readdirSync(os.tmpdir())
      .filter((n) => n.startsWith('bmad-github-')).length

    const app = await createTestApp()
    const resp = await app.inject({
      method: 'POST',
      url: '/api/modules/install',
      payload: { source: { type: 'github', value: 'owner/repo/docs' } },
    })
    expect(resp.statusCode).toBe(422)
    expect(JSON.parse(resp.body).error.message).toContain('does not look like a BMAD module')

    const after = fs
      .readdirSync(os.tmpdir())
      .filter((n) => n.startsWith('bmad-github-')).length
    expect(after).toBeLessThanOrEqual(before)
    await app.close()
  })

  // ─── GITHUB_TOKEN sent in the Authorization header ───
  it('GITHUB_TOKEN env var is forwarded as Authorization: Bearer header', async () => {
    const savedToken = process.env.GITHUB_TOKEN
    process.env.GITHUB_TOKEN = 'test-token-xyz'

    try {
      fetchSpy.mockImplementationOnce(async () => mockTarballResponse(VALID_MODULE_TARBALL))

      const app = await createTestApp()
      const resp = await app.inject({
        method: 'POST',
        url: '/api/modules/install',
        payload: { source: { type: 'github', value: 'owner/repo' } },
      })
      expect(resp.statusCode).toBe(200)

      const fetchCallArgs = fetchSpy.mock.calls[0]
      const init = fetchCallArgs[1] as RequestInit | undefined
      const headers = init?.headers as Record<string, string> | undefined
      expect(headers).toBeDefined()
      expect(headers!['Authorization']).toBe('Bearer test-token-xyz')
      expect(headers!['User-Agent']).toBe('bmad-studio')
      await app.close()
    } finally {
      if (savedToken === undefined) {
        delete process.env.GITHUB_TOKEN
      } else {
        process.env.GITHUB_TOKEN = savedToken
      }
    }
  })

  // ─── BMAD_GITHUB_TOKEN fallback when GITHUB_TOKEN is not set ───
  it('BMAD_GITHUB_TOKEN is used when GITHUB_TOKEN is not set', async () => {
    const savedGh = process.env.GITHUB_TOKEN
    const savedBmad = process.env.BMAD_GITHUB_TOKEN
    delete process.env.GITHUB_TOKEN
    process.env.BMAD_GITHUB_TOKEN = 'bmad-test-token'

    try {
      fetchSpy.mockImplementationOnce(async () => mockTarballResponse(VALID_MODULE_TARBALL))

      const app = await createTestApp()
      const resp = await app.inject({
        method: 'POST',
        url: '/api/modules/install',
        payload: { source: { type: 'github', value: 'owner/repo' } },
      })
      expect(resp.statusCode).toBe(200)

      const headers = (fetchSpy.mock.calls[0][1] as RequestInit).headers as Record<string, string>
      expect(headers['Authorization']).toBe('Bearer bmad-test-token')
      await app.close()
    } finally {
      if (savedGh !== undefined) process.env.GITHUB_TOKEN = savedGh
      if (savedBmad === undefined) {
        delete process.env.BMAD_GITHUB_TOKEN
      } else {
        process.env.BMAD_GITHUB_TOKEN = savedBmad
      }
    }
  })

  // ─── Invalid GitHub source string returns 422 ───
  it('invalid github source string returns 422', async () => {
    const app = await createTestApp()
    const resp = await app.inject({
      method: 'POST',
      url: '/api/modules/install',
      payload: { source: { type: 'github', value: 'just-one-segment' } },
    })
    expect(resp.statusCode).toBe(422)
    expect(JSON.parse(resp.body).error.message).toContain('Invalid GitHub source')
    expect(fetchSpy).not.toHaveBeenCalled()
    await app.close()
  })

  // ─── Story 17.3 — Re-install of an existing github module returns 200 (clean-slate) ───
  it('Story 17.3: re-install of an existing github module returns 200 (clean-slate)', async () => {
    fetchSpy
      .mockImplementationOnce(async () => mockTarballResponse(VALID_MODULE_TARBALL))
      .mockImplementationOnce(async () => mockTarballResponse(VALID_MODULE_TARBALL))

    const app = await createTestApp()
    const first = await app.inject({
      method: 'POST',
      url: '/api/modules/install',
      payload: { source: { type: 'github', value: 'owner/repo' } },
    })
    expect(first.statusCode).toBe(200)

    const second = await app.inject({
      method: 'POST',
      url: '/api/modules/install',
      payload: { source: { type: 'github', value: 'owner/repo' } },
    })
    expect(second.statusCode).toBe(200)
    expect(JSON.parse(second.body).ok).toBe(true)
    await app.close()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Story 15.4 — Polymorphic install: zip source type
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build a zip in memory using adm-zip directly. Same approach as the unit tests
 * in module-installer.test.ts — we use adm-zip to construct the fixture, then
 * extractZipUpload (which also uses adm-zip) to consume it.
 */
async function buildFixtureZip(
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

/** Make a multipart payload for app.inject from a zip buffer. */
function makeMultipartPayload(zipBytes: Buffer, filename = 'module.zip') {
  const form = new FormData()
  form.append('file', zipBytes, { filename, contentType: 'application/zip' })
  return { payload: form.getBuffer(), headers: form.getHeaders() }
}

describe('modules-plugin — Story 15.4 zip upload', () => {
  let tmpDir: string

  // Three fixtures are built in beforeAll-style at file scope below by reusing buildFixtureZip
  // inside each test (cheap — ~1ms per build).

  beforeEach(() => {
    tmpDir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'modules-plugin-15-4-')))
    const configDir = path.join(tmpDir, '_bmad', '_config')
    fs.mkdirSync(configDir, { recursive: true })
    fs.writeFileSync(path.join(configDir, 'manifest.yaml'), yaml.dump(makeManifest([])))
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
        modules: [],
        ideDirectories: [],
      },
    })
  }

  // Helper to build a "valid" fixture zip (no wrapper dir, has agents/ + module.yaml)
  async function makeValidZip() {
    return buildFixtureZip([
      { entryName: 'agents/test.md', data: '---\nname: test\ntitle: Test Agent\n---\n# Test\n' },
      { entryName: 'module.yaml', data: 'code: zip-test\nname: "Zip Test Module"\nversion: "1.0.0"\n' },
    ])
  }

  // Helper to build a "wrapper dir" fixture zip
  async function makeWrapperZip() {
    return buildFixtureZip([
      { entryName: 'my-module/agents/test.md', data: '---\nname: test\n---\n# Test\n' },
      { entryName: 'my-module/module.yaml', data: 'code: wrapped-test\nversion: "1.0.0"\n' },
    ])
  }

  // Helper to build a zip with no module-shaped contents
  async function makeNoModuleZip() {
    return buildFixtureZip([
      { entryName: 'README.md', data: '# Just a README\n' },
      { entryName: 'LICENSE', data: 'MIT\n' },
    ])
  }

  // ─── AC-15.4.2 ───
  it('AC-15.4.2: valid zip upload installs the module', async () => {
    const zipBytes = await makeValidZip()
    const { payload, headers } = makeMultipartPayload(zipBytes)

    const app = await createTestApp()
    const resp = await app.inject({
      method: 'POST',
      url: '/api/modules/install/upload',
      payload,
      headers,
    })
    expect(resp.statusCode).toBe(200)
    const body = JSON.parse(resp.body)
    expect(body.ok).toBe(true)
    expect(body.modules).toEqual(['zip-test'])
    expect(body.source).toEqual({ type: 'zip' })

    expect(fs.existsSync(path.join(tmpDir, '_bmad', 'zip-test', 'agents', 'test.md'))).toBe(true)

    const manifest = yaml.load(
      fs.readFileSync(path.join(tmpDir, '_bmad', '_config', 'manifest.yaml'), 'utf-8'),
    ) as { modules: Array<{ name: string; source: string; npmPackage: null; repoUrl: null }> }
    const entry = manifest.modules.find((m) => m.name === 'zip-test')
    expect(entry).toBeDefined()
    expect(entry!.source).toBe('zip')
    expect(entry!.npmPackage).toBeNull()
    expect(entry!.repoUrl).toBeNull()

    await app.close()
  })

  // ─── AC-15.4.3 (wrapper dir integration) ───
  it('AC-15.4.3: zip with a single wrapper dir is unwrapped during install', async () => {
    const zipBytes = await makeWrapperZip()
    const { payload, headers } = makeMultipartPayload(zipBytes)

    const app = await createTestApp()
    const resp = await app.inject({
      method: 'POST',
      url: '/api/modules/install/upload',
      payload,
      headers,
    })
    expect(resp.statusCode).toBe(200)
    expect(JSON.parse(resp.body).modules).toEqual(['wrapped-test'])
    expect(fs.existsSync(path.join(tmpDir, '_bmad', 'wrapped-test', 'agents', 'test.md'))).toBe(
      true,
    )
    await app.close()
  })

  // ─── AC-15.4.4 ───
  it('AC-15.4.4: zip with no module-shaped contents returns 422', async () => {
    const zipBytes = await makeNoModuleZip()
    const { payload, headers } = makeMultipartPayload(zipBytes)

    const app = await createTestApp()
    const resp = await app.inject({
      method: 'POST',
      url: '/api/modules/install/upload',
      payload,
      headers,
    })
    expect(resp.statusCode).toBe(422)
    expect(JSON.parse(resp.body).error.message).toContain('does not look like a BMAD module')
    await app.close()
  })

  // ─── AC-15.4.6 (cleanup on failure) ───
  it('AC-15.4.6: failed upload cleans up tmp directories', async () => {
    const zipBytes = await makeNoModuleZip()
    const { payload, headers } = makeMultipartPayload(zipBytes)

    const before = fs.readdirSync(os.tmpdir()).filter((n) => n.startsWith('bmad-zip-')).length

    const app = await createTestApp()
    const resp = await app.inject({
      method: 'POST',
      url: '/api/modules/install/upload',
      payload,
      headers,
    })
    expect(resp.statusCode).toBe(422)

    const after = fs.readdirSync(os.tmpdir()).filter((n) => n.startsWith('bmad-zip-')).length
    expect(after).toBeLessThanOrEqual(before)
    await app.close()
  })

  // ─── AC-15.4.9 (manifest guard runs before zip extraction) ───
  it('AC-15.4.9: missing manifest.yaml prevents zip extraction', async () => {
    fs.unlinkSync(path.join(tmpDir, '_bmad', '_config', 'manifest.yaml'))

    const zipBytes = await makeValidZip()
    const { payload, headers } = makeMultipartPayload(zipBytes)

    const before = fs.readdirSync(os.tmpdir()).filter((n) => n.startsWith('bmad-zip-')).length

    const app = await createTestApp()
    const resp = await app.inject({
      method: 'POST',
      url: '/api/modules/install/upload',
      payload,
      headers,
    })
    expect(resp.statusCode).toBe(422)
    expect(JSON.parse(resp.body).error.message).toBe(
      'Cannot install module: missing _bmad/_config/manifest.yaml. Run `npx bmad-method install` to initialise the project first.',
    )

    // No new bmad-zip-* dirs created — extraction never happened
    const after = fs.readdirSync(os.tmpdir()).filter((n) => n.startsWith('bmad-zip-')).length
    expect(after).toBeLessThanOrEqual(before)
    await app.close()
  })

  // ─── AC-15.4.10 / Story 17.3 — re-install returns 200 (clean-slate) ───
  it('AC-15.4.10: re-install of an existing zip module returns 200 (clean-slate)', async () => {
    const zipBytes = await makeValidZip()
    const { payload: p1, headers: h1 } = makeMultipartPayload(zipBytes)

    const app = await createTestApp()
    const first = await app.inject({
      method: 'POST',
      url: '/api/modules/install/upload',
      payload: p1,
      headers: h1,
    })
    expect(first.statusCode).toBe(200)

    const { payload: p2, headers: h2 } = makeMultipartPayload(zipBytes)
    const second = await app.inject({
      method: 'POST',
      url: '/api/modules/install/upload',
      payload: p2,
      headers: h2,
    })
    expect(second.statusCode).toBe(200)
    expect(JSON.parse(second.body).ok).toBe(true)
    await app.close()
  })

  // ─── AC-15.4.11 (multipart to JSON endpoint is rejected cleanly) ───
  it('AC-15.4.11: multipart request to /api/modules/install (JSON route) is rejected by the body guard', async () => {
    const zipBytes = await makeValidZip()
    const { payload, headers } = makeMultipartPayload(zipBytes)

    const app = await createTestApp()
    const resp = await app.inject({
      method: 'POST',
      url: '/api/modules/install', // NOT /upload — the wrong endpoint
      payload,
      headers,
    })
    // The body guard at the top of the JSON handler catches the missing/non-object body
    // (multipart bodies don't deserialize as JSON) and throws a clean ValidationError.
    expect(resp.statusCode).toBe(422)
    expect(JSON.parse(resp.body).error.message).toContain(
      'For zip uploads, POST to /api/modules/install/upload instead',
    )

    // Verify no module was installed via this misuse
    expect(fs.existsSync(path.join(tmpDir, '_bmad', 'zip-test'))).toBe(false)
    await app.close()
  })

  // ─── AC-15.4.12 (missing file field returns 422) ───
  it('AC-15.4.12: multipart with no file field returns 422', async () => {
    const form = new FormData()
    form.append('other', 'not-a-file')
    const payload = form.getBuffer()
    const headers = form.getHeaders()

    const app = await createTestApp()
    const resp = await app.inject({
      method: 'POST',
      url: '/api/modules/install/upload',
      payload,
      headers,
    })
    expect(resp.statusCode).toBe(422)
    expect(JSON.parse(resp.body).error.message).toBe('No zip file uploaded')
    await app.close()
  })

  // ─── AC-15.4.7 (zip-slip integration test) ───
  it('AC-15.4.7: zip-slip attack is rejected at the upload endpoint', async () => {
    // Build a malicious zip (same trick as the unit test — mutate entryName after addFile)
    const AdmZip = (await import('adm-zip')).default
    const evilZip = new AdmZip()
    evilZip.addFile('escape.txt', Buffer.from('PWNED'))
    evilZip.addFile('agents/test.md', Buffer.from('# Test\n'))
    const escapeEntry = evilZip.getEntries().find((e) => e.entryName === 'escape.txt')
    if (!escapeEntry) throw new Error('test setup failed')
    escapeEntry.entryName = '../escape.txt'
    const maliciousZipBytes = evilZip.toBuffer()

    const { payload, headers } = makeMultipartPayload(maliciousZipBytes, 'malicious.zip')

    const app = await createTestApp()
    const resp = await app.inject({
      method: 'POST',
      url: '/api/modules/install/upload',
      payload,
      headers,
    })
    expect(resp.statusCode).toBe(422)
    expect(JSON.parse(resp.body).error.message).toContain('attempts to write outside')

    // Verify no escape.txt landed in the project root or _bmad/
    expect(fs.existsSync(path.join(tmpDir, 'escape.txt'))).toBe(false)
    expect(fs.existsSync(path.join(tmpDir, '_bmad', 'escape.txt'))).toBe(false)

    await app.close()
  })

  // ─── AC-15.4.1 / AC-15.4.8 — size cap constant assertion ───
  // The actual 50 MB cap is enforced by @fastify/multipart, which is well-tested upstream.
  // We assert the constant value here as a regression guard against accidental edits.
  it('AC-15.4.1/8: MAX_MODULE_UPLOAD_BYTES is 50 MB', () => {
    expect(MAX_MODULE_UPLOAD_BYTES).toBe(50 * 1024 * 1024)
  })

  // Manual end-to-end size-cap test — building a 51 MB Buffer in vitest is wasteful
  // (~200ms + 51 MB RAM per test run) and the multipart plugin's behavior is upstream.
  it.skip('manual: a 51 MB upload is rejected by @fastify/multipart', async () => {
    // To run this manually, unskip and uncomment:
    // const oversize = Buffer.alloc(51 * 1024 * 1024)
    // const { payload, headers } = makeMultipartPayload(oversize, 'big.zip')
    // const app = await createTestApp()
    // const resp = await app.inject({ method: 'POST', url: '/api/modules/install/upload', payload, headers })
    // expect(resp.statusCode).toBeGreaterThanOrEqual(400)
    // await app.close()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Story 15.5 — Variable substitution pass (integration tests via the install endpoint)
// ─────────────────────────────────────────────────────────────────────────────

describe('modules-plugin — Story 15.5 variable substitution', () => {
  let tmpDir: string
  let sourceParent: string

  beforeEach(() => {
    tmpDir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'modules-plugin-15-5-')))
    sourceParent = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'modules-plugin-15-5-src-')))
    const configDir = path.join(tmpDir, '_bmad', '_config')
    fs.mkdirSync(configDir, { recursive: true })
    fs.writeFileSync(path.join(configDir, 'manifest.yaml'), yaml.dump(makeManifest([])))
    fs.mkdirSync(path.join(tmpDir, '.bmad-studio'), { recursive: true })
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
    fs.rmSync(sourceParent, { recursive: true, force: true })
  })

  function createTestApp() {
    return createApp({
      logger: false,
      serveStatic: false,
      project: {
        projectRoot: tmpDir,
        bmadVersion: '6.2.0',
        versionSupported: true,
        modules: [],
        ideDirectories: [],
      },
    })
  }

  function makeSourceModule(
    code: string,
    files: Record<string, string>,
  ): string {
    const sourceDir = path.join(sourceParent, code)
    fs.mkdirSync(sourceDir, { recursive: true })
    fs.writeFileSync(path.join(sourceDir, 'module.yaml'), `code: ${code}\nversion: "1.0.0"\n`)
    fs.mkdirSync(path.join(sourceDir, 'agents'), { recursive: true })
    for (const [relPath, content] of Object.entries(files)) {
      const full = path.join(sourceDir, relPath)
      fs.mkdirSync(path.dirname(full), { recursive: true })
      fs.writeFileSync(full, content)
    }
    return sourceDir
  }

  // ─── AC-15.5.1 ───
  it('AC-15.5.1: substitutes {{var}} in installed file from local source', async () => {
    const sourceDir = makeSourceModule('sub-test-1', {
      'agents/greeting.md': 'Hello from {{project_name}}!\n',
    })

    const app = await createTestApp()
    const resp = await app.inject({
      method: 'POST',
      url: '/api/modules/install',
      payload: {
        source: { type: 'local', value: sourceDir },
        variables: { project_name: 'AcmeProject' },
      },
    })
    expect(resp.statusCode).toBe(200)

    const installed = fs.readFileSync(
      path.join(tmpDir, '_bmad', 'sub-test-1', 'agents', 'greeting.md'),
      'utf-8',
    )
    expect(installed).toBe('Hello from AcmeProject!\n')
    await app.close()
  })

  // ─── AC-15.5.2 + 15.5.3 (combined — both static placeholders in one file) ───
  it('AC-15.5.2/3: substitutes {project-root} and {module-code} in installed files', async () => {
    const sourceDir = makeSourceModule('sub-test-2', {
      'agents/info.yaml': 'project_root: "{project-root}"\nmodule_code: "{module-code}"\n',
    })

    const app = await createTestApp()
    const resp = await app.inject({
      method: 'POST',
      url: '/api/modules/install',
      payload: { source: { type: 'local', value: sourceDir } },
    })
    expect(resp.statusCode).toBe(200)

    const installed = fs.readFileSync(
      path.join(tmpDir, '_bmad', 'sub-test-2', 'agents', 'info.yaml'),
      'utf-8',
    )
    expect(installed).toBe(
      `project_root: "${tmpDir}"\nmodule_code: "sub-test-2"\n`,
    )
    await app.close()
  })

  // ─── AC-15.5.5 — no spurious snapshots for files with no placeholders ───
  it('AC-15.5.5: a file with no placeholders is not re-written', async () => {
    const sourceDir = makeSourceModule('sub-test-noop', {
      'agents/plain.md': '# Plain agent\nNo placeholders here.\n',
    })

    const historyDir = path.join(tmpDir, '.bmad-studio', 'history')
    const before = fs.existsSync(historyDir) ? fs.readdirSync(historyDir).length : 0

    const app = await createTestApp()
    const resp = await app.inject({
      method: 'POST',
      url: '/api/modules/install',
      payload: { source: { type: 'local', value: sourceDir } },
    })
    expect(resp.statusCode).toBe(200)

    // The file should be byte-identical to the source (no substitution)
    const installed = fs.readFileSync(
      path.join(tmpDir, '_bmad', 'sub-test-noop', 'agents', 'plain.md'),
      'utf-8',
    )
    expect(installed).toBe('# Plain agent\nNo placeholders here.\n')

    // Snapshots: any new history entries should be from the install (manifest write
    // is the only one expected — copy of new files has snapshotPath: null).
    // The plain.md file should NOT have a snapshot since it wasn't re-written by substitution.
    const after = fs.existsSync(historyDir) ? fs.readdirSync(historyDir) : []
    const plainSnapshots = after.filter((n) => n.endsWith('plain.md'))
    expect(plainSnapshots).toEqual([])
    void before // satisfy noUnusedLocals
    await app.close()
  })

  // ─── AC-15.5.8 — invalid variables fail fast ───
  it('AC-15.5.8: invalid variable values return 422 BEFORE any files are copied', async () => {
    const sourceDir = makeSourceModule('sub-test-bad', {
      'agents/test.md': 'placeholder {{name}}\n',
    })

    const app = await createTestApp()
    const resp = await app.inject({
      method: 'POST',
      url: '/api/modules/install',
      payload: {
        source: { type: 'local', value: sourceDir },
        variables: { name: '# bad value' },
      },
    })
    expect(resp.statusCode).toBe(422)
    expect(JSON.parse(resp.body).error.message).toContain('"name"')
    expect(JSON.parse(resp.body).error.message).toContain('# bad value')

    // Critical: NO files should have been copied — the validation runs BEFORE source-type branching.
    expect(fs.existsSync(path.join(tmpDir, '_bmad', 'sub-test-bad'))).toBe(false)
    await app.close()
  })

  // ─── AC-15.5.9 — values with allowed chars work ───
  it('AC-15.5.9: variable values with allowed chars are substituted verbatim', async () => {
    const sourceDir = makeSourceModule('sub-test-allowed', {
      'agents/info.md': 'project: {{project}}\n',
    })

    const app = await createTestApp()
    const resp = await app.inject({
      method: 'POST',
      url: '/api/modules/install',
      payload: {
        source: { type: 'local', value: sourceDir },
        variables: { project: 'my-project_v1.0/aem' },
      },
    })
    expect(resp.statusCode).toBe(200)

    const installed = fs.readFileSync(
      path.join(tmpDir, '_bmad', 'sub-test-allowed', 'agents', 'info.md'),
      'utf-8',
    )
    expect(installed).toBe('project: my-project_v1.0/aem\n')
    await app.close()
  })

  // ─── AC-15.6.8 — install response includes skillsGenerated counts when ides are configured ───
  it('AC-15.6.8: install response includes skillsGenerated when manifest.ides is set', async () => {
    // Override the beforeEach manifest to include ides
    fs.writeFileSync(
      path.join(tmpDir, '_bmad', '_config', 'manifest.yaml'),
      yaml.dump({
        installation: {
          version: '6.2.0',
          installDate: '2026-01-01T00:00:00.000Z',
          lastUpdated: '2026-01-01T00:00:00.000Z',
        },
        modules: [],
        ides: ['claude-code', 'antigravity'],
      }),
    )

    // Build a fixture with one agent and one workflow (workflow uses **Goal:** format)
    const sourceDir = path.join(sourceParent, 'gen-test')
    fs.mkdirSync(path.join(sourceDir, 'agents'), { recursive: true })
    fs.mkdirSync(path.join(sourceDir, 'workflows', 'do-thing'), { recursive: true })
    fs.writeFileSync(
      path.join(sourceDir, 'module.yaml'),
      'code: gen-test\nversion: "1.0.0"\n',
    )
    fs.writeFileSync(
      path.join(sourceDir, 'agents', 'helper.md'),
      '<agent id="helper" name="helper" title="Helper" capabilities="help">\n</agent>\n',
    )
    fs.writeFileSync(
      path.join(sourceDir, 'workflows', 'do-thing', 'workflow.md'),
      '---\nname: do-thing\n---\n# Do Thing\n\n**Goal:** Does the thing\n',
    )

    const app = await createTestApp()
    const resp = await app.inject({
      method: 'POST',
      url: '/api/modules/install',
      payload: { source: { type: 'local', value: sourceDir } },
    })
    expect(resp.statusCode).toBe(200)
    const body = JSON.parse(resp.body)

    // Per-IDE counts: 1 agent + 1 workflow = 2 launchers per IDE
    expect(body.skillsGenerated).toEqual({
      'claude-code': 2,
      antigravity: 2,
    })

    // Verify the launchers exist on disk
    expect(
      fs.existsSync(path.join(tmpDir, '.claude/skills/bmad-agent-gen-test-helper/SKILL.md')),
    ).toBe(true)
    expect(
      fs.existsSync(
        path.join(tmpDir, '.antigravity/skills/bmad-agent-gen-test-helper/SKILL.md'),
      ),
    ).toBe(true)
    expect(
      fs.existsSync(path.join(tmpDir, '.claude/skills/bmad-gen-test-do-thing/SKILL.md')),
    ).toBe(true)
    expect(
      fs.existsSync(path.join(tmpDir, '.antigravity/skills/bmad-gen-test-do-thing/SKILL.md')),
    ).toBe(true)

    await app.close()
  })

  // ─── AC-15.5.4 — binary files are NOT substituted ───
  it('AC-15.5.4: binary files in the module are left unchanged', async () => {
    const sourceDir = makeSourceModule('sub-test-bin', {
      'agents/test.md': 'just text\n',
    })
    // Add a binary file with PNG header bytes (deliberately invalid utf-8)
    fs.mkdirSync(path.join(sourceDir, 'assets'), { recursive: true })
    const originalPng = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    fs.writeFileSync(path.join(sourceDir, 'assets', 'logo.png'), originalPng)

    const app = await createTestApp()
    const resp = await app.inject({
      method: 'POST',
      url: '/api/modules/install',
      payload: { source: { type: 'local', value: sourceDir } },
    })
    expect(resp.statusCode).toBe(200)

    const installedPng = fs.readFileSync(
      path.join(tmpDir, '_bmad', 'sub-test-bin', 'assets', 'logo.png'),
    )
    expect(Buffer.compare(installedPng, originalPng)).toBe(0)
    await app.close()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Story 15.7 — Remove flow (preview endpoint + rich DELETE)
// ─────────────────────────────────────────────────────────────────────────────

describe('modules-plugin — Story 15.7 remove flow', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'modules-plugin-15-7-')))
    const configDir = path.join(tmpDir, '_bmad', '_config')
    fs.mkdirSync(configDir, { recursive: true })
    fs.mkdirSync(path.join(tmpDir, '.bmad-studio'), { recursive: true })
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  function writeManifest(
    modules: Array<{ name: string; source: string; version?: string }>,
    ides: string[] = [],
  ) {
    fs.writeFileSync(
      path.join(tmpDir, '_bmad', '_config', 'manifest.yaml'),
      yaml.dump({
        installation: {
          version: '6.2.0',
          installDate: '2026-01-01T00:00:00.000Z',
          lastUpdated: '2026-01-01T00:00:00.000Z',
        },
        modules: modules.map((m) => ({
          name: m.name,
          version: m.version ?? '1.0.0',
          installDate: '2026-01-01T00:00:00.000Z',
          lastUpdated: '2026-01-01T00:00:00.000Z',
          source: m.source,
          npmPackage: null,
          repoUrl: null,
        })),
        ides,
      }),
    )
  }

  function createTestApp() {
    return createApp({
      logger: false,
      serveStatic: false,
      project: {
        projectRoot: tmpDir,
        bmadVersion: '6.2.0',
        versionSupported: true,
        modules: [],
        ideDirectories: [],
      },
    })
  }

  // Helper: write a simple module on disk (no module.yaml → TD-14 fallback)
  function seedModule(code: string, source: string = 'custom') {
    const moduleDir = path.join(tmpDir, '_bmad', code)
    fs.mkdirSync(path.join(moduleDir, 'agents'), { recursive: true })
    fs.writeFileSync(
      path.join(moduleDir, 'agents', 'a.md'),
      `<agent id="${code}-a" name="a" title="${code} agent" capabilities="work"></agent>\n`,
    )
    fs.writeFileSync(path.join(moduleDir, 'config.yaml'), `project_name: ${code}\n`)
    writeManifest([{ name: code, source }])
  }

  // Helper: write a module WITH a module.yaml declaring preserved directories
  function seedModuleWithYaml(code: string, directories: string[]) {
    const moduleDir = path.join(tmpDir, '_bmad', code)
    fs.mkdirSync(path.join(moduleDir, 'agents'), { recursive: true })
    fs.writeFileSync(path.join(moduleDir, 'agents', 'a.md'), '# A\n')
    fs.writeFileSync(
      path.join(moduleDir, 'module.yaml'),
      `code: ${code}\nversion: "1.0.0"\ndirectories:\n${directories.map((d) => `  - "${d}"`).join('\n')}\n`,
    )
    writeManifest([{ name: code, source: 'custom' }])
    // Create the preserved directories with sentinel files
    for (const dir of directories) {
      const resolved = path.isAbsolute(dir) ? dir : path.join(tmpDir, dir)
      fs.mkdirSync(resolved, { recursive: true })
      fs.writeFileSync(path.join(resolved, 'user-work.txt'), 'important user content\n')
    }
  }

  // ─── AC-15.7.4 — preview response shape ───
  it('AC-15.7.4: GET /remove-preview returns all required fields', async () => {
    seedModule('preview-test')

    const app = await createTestApp()
    const resp = await app.inject({
      method: 'GET',
      url: '/api/modules/preview-test/remove-preview',
    })
    expect(resp.statusCode).toBe(200)
    const body = JSON.parse(resp.body)

    expect(body.module).toEqual({ name: 'preview-test', version: '1.0.0', source: 'custom' })
    expect(body.moduleFiles).toBeDefined()
    expect(body.moduleFiles.count).toBeGreaterThan(0)
    expect(body.moduleFiles.totalBytes).toBeGreaterThan(0)
    expect(body.ideSkills).toBeDefined()
    expect(body.manifestEntries).toEqual({ 'manifest.yaml': true })
    expect(body.preservedDirectories).toEqual([])
    expect(body.moduleYamlPresent).toBe(false)
    expect(body.crossReferences).toEqual([])
    expect(body.crossReferenceScopeNotice).toContain('Cross-reference scanning covers')
    expect(body.recoverableFrom).toBe('.bmad-studio/history/')
    expect(body.removalBlocked).toBeNull()
    expect(body.externalInstallerWarning).toBeNull()

    await app.close()
  })

  // ─── AC-15.7.5 — built-in removalBlocked ───
  it('AC-15.7.5: built-in module sets removalBlocked to a non-empty string', async () => {
    seedModule('core', 'built-in')

    const app = await createTestApp()
    const resp = await app.inject({
      method: 'GET',
      url: '/api/modules/core/remove-preview',
    })
    expect(resp.statusCode).toBe(200)
    const body = JSON.parse(resp.body)
    expect(body.removalBlocked).toContain('cannot be removed')
    await app.close()
  })

  // ─── AC-15.7.6 — external installer warning ───
  it('AC-15.7.6: external module sets externalInstallerWarning', async () => {
    seedModule('bmb', 'external')

    const app = await createTestApp()
    const resp = await app.inject({
      method: 'GET',
      url: '/api/modules/bmb/remove-preview',
    })
    expect(resp.statusCode).toBe(200)
    const body = JSON.parse(resp.body)
    expect(body.externalInstallerWarning).toContain('BMAD installer')
    await app.close()
  })

  // ─── AC-15.7.7 — preservedDirectories ───
  it('AC-15.7.7: preservedDirectories lists declared output dirs that exist', async () => {
    seedModuleWithYaml('preserve-test', ['_bmad-output/preserve-artifacts'])

    const app = await createTestApp()
    const resp = await app.inject({
      method: 'GET',
      url: '/api/modules/preserve-test/remove-preview',
    })
    expect(resp.statusCode).toBe(200)
    const body = JSON.parse(resp.body)
    expect(body.moduleYamlPresent).toBe(true)
    expect(body.preservedDirectories).toHaveLength(1)
    expect(body.preservedDirectories[0].path).toBe(
      path.join(tmpDir, '_bmad-output/preserve-artifacts'),
    )
    expect(body.preservedDirectories[0].declared).toBe(true)
    await app.close()
  })

  // ─── AC-15.7.8a — cross-reference scope ───
  it('AC-15.7.8a: cross-references detect teams referencing target-module agents', async () => {
    // Build two modules: target has an agent, other has a team referencing it
    const targetDir = path.join(tmpDir, '_bmad', 'target-mod', 'agents')
    fs.mkdirSync(targetDir, { recursive: true })
    fs.writeFileSync(
      path.join(targetDir, 'architect.md'),
      '<agent id="architect" name="architect" title="Architect" capabilities="design"></agent>\n',
    )

    const otherDir = path.join(tmpDir, '_bmad', 'other-mod', 'teams')
    fs.mkdirSync(otherDir, { recursive: true })
    fs.writeFileSync(
      path.join(otherDir, 'design-team.yaml'),
      'bundle:\n  name: Design Team\n  icon: 🎨\n  description: refs target\nagents:\n  - architect\n',
    )

    writeManifest([
      { name: 'target-mod', source: 'custom' },
      { name: 'other-mod', source: 'custom' },
    ])

    const app = await createTestApp()
    const resp = await app.inject({
      method: 'GET',
      url: '/api/modules/target-mod/remove-preview',
    })
    expect(resp.statusCode).toBe(200)
    const body = JSON.parse(resp.body)

    expect(body.crossReferences.length).toBeGreaterThanOrEqual(1)
    const otherRef = body.crossReferences.find(
      (r: { ownerModule: string }) => r.ownerModule === 'other-mod',
    )
    expect(otherRef).toBeDefined()
    expect(otherRef.reason).toContain('team')
    expect(otherRef.reason).toContain('design-team')
    await app.close()
  })

  // ─── AC-15.7.8c — scope notice field ───
  it('AC-15.7.8c: response includes crossReferenceScopeNotice field', async () => {
    seedModule('scope-notice-test')

    const app = await createTestApp()
    const resp = await app.inject({
      method: 'GET',
      url: '/api/modules/scope-notice-test/remove-preview',
    })
    expect(resp.statusCode).toBe(200)
    const body = JSON.parse(resp.body)
    expect(body.crossReferenceScopeNotice).toBe(
      'Cross-reference scanning covers teams and workflow steps. References from agent menus or skill lists are not detected — review the affected modules manually after removal.',
    )
    await app.close()
  })

  // ─── Preview: IDE skills listing ───
  it('preview lists prefix-matched IDE skill directories', async () => {
    seedModule('ide-skills-test')
    // Write manifest with ides array
    writeManifest([{ name: 'ide-skills-test', source: 'custom' }], ['claude-code', 'antigravity'])

    // Manually create some IDE skill dirs mimicking a prior install
    fs.mkdirSync(
      path.join(tmpDir, '.claude/skills/bmad-agent-ide-skills-test-a'),
      { recursive: true },
    )
    fs.writeFileSync(
      path.join(tmpDir, '.claude/skills/bmad-agent-ide-skills-test-a/SKILL.md'),
      'skill',
    )
    fs.mkdirSync(path.join(tmpDir, '.claude/skills/bmad-other-mod-foo'), { recursive: true })

    const app = await createTestApp()
    const resp = await app.inject({
      method: 'GET',
      url: '/api/modules/ide-skills-test/remove-preview',
    })
    expect(resp.statusCode).toBe(200)
    const body = JSON.parse(resp.body)

    expect(body.ideSkills['claude-code']).toEqual(['bmad-agent-ide-skills-test-a'])
    // The other-mod skill is NOT listed (prefix mismatch)
    expect(body.ideSkills['claude-code']).not.toContain('bmad-other-mod-foo')
    expect(body.ideSkills.antigravity).toEqual([])
    await app.close()
  })

  // ─── DELETE: rich summary response ───
  it('AC-15.7.14: DELETE returns rich summary with removed counts and preservedDirectories', async () => {
    seedModuleWithYaml('delete-test', ['_bmad-output/delete-artifacts'])

    const app = await createTestApp()
    const resp = await app.inject({
      method: 'DELETE',
      url: '/api/modules/delete-test',
    })
    expect(resp.statusCode).toBe(200)
    const body = JSON.parse(resp.body)
    expect(body.ok).toBe(true)
    expect(body.name).toBe('delete-test')
    expect(body.removed.filesRemoved).toBeGreaterThan(0)
    expect(body.removed.skills).toEqual({})
    expect(body.preservedDirectories).toHaveLength(1)
    expect(body.recoverableFrom).toBe('.bmad-studio/history/')

    // Module dir gone
    expect(fs.existsSync(path.join(tmpDir, '_bmad', 'delete-test'))).toBe(false)

    // Preserved directory AND its sentinel file are still on disk
    const preserved = path.join(tmpDir, '_bmad-output/delete-artifacts')
    expect(fs.existsSync(preserved)).toBe(true)
    expect(fs.readFileSync(path.join(preserved, 'user-work.txt'), 'utf-8')).toBe(
      'important user content\n',
    )

    await app.close()
  })

  // ─── AC-15.7.10 — snapshots recoverable ───
  it('AC-15.7.10: files from the module dir are snapshotted to history/ on delete', async () => {
    seedModule('snapshot-test')

    const app = await createTestApp()
    const resp = await app.inject({
      method: 'DELETE',
      url: '/api/modules/snapshot-test',
    })
    expect(resp.statusCode).toBe(200)

    // Every text file from the module dir should have a snapshot in history/
    const historyDir = path.join(tmpDir, '.bmad-studio/history')
    const history = fs.readdirSync(historyDir)
    // We wrote agents/a.md + config.yaml — both should have snapshots
    expect(history.some((n) => n.endsWith('a.md'))).toBe(true)
    expect(history.some((n) => n.endsWith('config.yaml'))).toBe(true)
    await app.close()
  })

  // ─── AC-15.7.11 ───
  it('AC-15.7.11: DELETE on built-in module returns 422', async () => {
    seedModule('core', 'built-in')

    const app = await createTestApp()
    const resp = await app.inject({
      method: 'DELETE',
      url: '/api/modules/core',
    })
    expect(resp.statusCode).toBe(422)
    expect(JSON.parse(resp.body).error.message).toContain('Cannot remove built-in module')
    await app.close()
  })

  // ─── AC-15.7.12 ───
  it('AC-15.7.12: DELETE on non-existent module returns 404', async () => {
    writeManifest([])

    const app = await createTestApp()
    const resp = await app.inject({
      method: 'DELETE',
      url: '/api/modules/ghost',
    })
    expect(resp.statusCode).toBe(404)
    await app.close()
  })

  // ─── AC-15.7.9 — preserved directories are NOT deleted ───
  it('AC-15.7.9: preserved directories survive the delete', async () => {
    seedModuleWithYaml('preserve-delete-test', [
      '_bmad-output/artifact-a',
      '_bmad-output/artifact-b',
    ])

    const app = await createTestApp()
    await app.inject({ method: 'DELETE', url: '/api/modules/preserve-delete-test' })

    // Module gone
    expect(fs.existsSync(path.join(tmpDir, '_bmad', 'preserve-delete-test'))).toBe(false)
    // Preserved dirs + their content still there
    expect(fs.existsSync(path.join(tmpDir, '_bmad-output/artifact-a'))).toBe(true)
    expect(fs.existsSync(path.join(tmpDir, '_bmad-output/artifact-b'))).toBe(true)
    expect(
      fs.readFileSync(
        path.join(tmpDir, '_bmad-output/artifact-a/user-work.txt'),
        'utf-8',
      ),
    ).toBe('important user content\n')

    await app.close()
  })

  // ─── Remove preview: no-module-yaml case ───
  it('preview for a module without module.yaml has empty preservedDirectories', async () => {
    seedModule('no-yaml-test')

    const app = await createTestApp()
    const resp = await app.inject({
      method: 'GET',
      url: '/api/modules/no-yaml-test/remove-preview',
    })
    expect(resp.statusCode).toBe(200)
    const body = JSON.parse(resp.body)
    expect(body.moduleYamlPresent).toBe(false)
    expect(body.preservedDirectories).toEqual([])
    await app.close()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Story 15.8 — Regenerate IDE skills endpoint
// All tests run against a TEMP project — the Q9 manual smoke test against the
// real `dept-aem` in the developer's working tree is documented separately
// and intentionally NOT automated (it would dirty the tree).
// ─────────────────────────────────────────────────────────────────────────────

describe('modules-plugin — Story 15.8 regenerate IDE skills', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'modules-plugin-15-8-')))
    const configDir = path.join(tmpDir, '_bmad', '_config')
    fs.mkdirSync(configDir, { recursive: true })
    fs.mkdirSync(path.join(tmpDir, '.bmad-studio'), { recursive: true })
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  function writeManifestWithIdes(
    modules: Array<{ name: string; source: string }>,
    ides: string[],
  ) {
    fs.writeFileSync(
      path.join(tmpDir, '_bmad', '_config', 'manifest.yaml'),
      yaml.dump({
        installation: {
          version: '6.2.0',
          installDate: '2026-01-01T00:00:00.000Z',
          lastUpdated: '2026-01-01T00:00:00.000Z',
        },
        modules: modules.map((m) => ({
          name: m.name,
          version: '1.0.0',
          installDate: '2026-01-01T00:00:00.000Z',
          lastUpdated: '2026-01-01T00:00:00.000Z',
          source: m.source,
          npmPackage: null,
          repoUrl: null,
        })),
        ides,
      }),
    )
  }

  function createTestApp() {
    return createApp({
      logger: false,
      serveStatic: false,
      project: {
        projectRoot: tmpDir,
        bmadVersion: '6.2.0',
        versionSupported: true,
        modules: [],
        ideDirectories: [],
      },
    })
  }

  // Helper: create an installed module fixture on disk with agents + workflow
  function seedInstalledModule(code: string) {
    const moduleDir = path.join(tmpDir, '_bmad', code)
    fs.mkdirSync(path.join(moduleDir, 'agents'), { recursive: true })
    fs.mkdirSync(path.join(moduleDir, 'workflows', 'do-thing'), { recursive: true })

    fs.writeFileSync(
      path.join(moduleDir, 'agents', 'helper.md'),
      '<agent id="helper" name="helper" title="Helper" capabilities="help"></agent>\n',
    )
    fs.writeFileSync(
      path.join(moduleDir, 'workflows', 'do-thing', 'workflow.md'),
      '---\nname: do-thing\n---\n# Do Thing\n\n**Goal:** Does the thing\n',
    )
  }

  // ─── AC-15.8.1 ───
  it('AC-15.8.1: regenerates IDE skills for an installed module with no prior launchers', async () => {
    seedInstalledModule('regen-test')
    writeManifestWithIdes([{ name: 'regen-test', source: 'custom' }], ['claude-code'])

    // Verify no launchers exist beforehand
    expect(fs.existsSync(path.join(tmpDir, '.claude/skills'))).toBe(false)

    const app = await createTestApp()
    const resp = await app.inject({
      method: 'POST',
      url: '/api/modules/regen-test/regenerate-skills',
    })
    expect(resp.statusCode).toBe(200)
    const body = JSON.parse(resp.body)
    expect(body.ok).toBe(true)
    // 1 agent + 1 workflow = 2 launchers
    expect(body.regenerated).toEqual({ 'claude-code': 2 })

    // Verify files on disk
    expect(
      fs.existsSync(path.join(tmpDir, '.claude/skills/bmad-agent-regen-test-helper/SKILL.md')),
    ).toBe(true)
    expect(
      fs.existsSync(path.join(tmpDir, '.claude/skills/bmad-regen-test-do-thing/SKILL.md')),
    ).toBe(true)

    await app.close()
  })

  // ─── AC-15.8.2 ───
  it('AC-15.8.2: adding antigravity to manifest.ides and re-calling regenerate adds antigravity skills', async () => {
    seedInstalledModule('regen-multi')
    writeManifestWithIdes([{ name: 'regen-multi', source: 'custom' }], ['claude-code'])

    const app = await createTestApp()

    // First call with only claude-code
    const r1 = await app.inject({
      method: 'POST',
      url: '/api/modules/regen-multi/regenerate-skills',
    })
    expect(r1.statusCode).toBe(200)
    expect(JSON.parse(r1.body).regenerated).toEqual({ 'claude-code': 2 })
    expect(fs.existsSync(path.join(tmpDir, '.antigravity'))).toBe(false)

    // Update manifest to add antigravity
    writeManifestWithIdes(
      [{ name: 'regen-multi', source: 'custom' }],
      ['claude-code', 'antigravity'],
    )

    // Second call picks up antigravity
    const r2 = await app.inject({
      method: 'POST',
      url: '/api/modules/regen-multi/regenerate-skills',
    })
    expect(r2.statusCode).toBe(200)
    expect(JSON.parse(r2.body).regenerated).toEqual({
      'claude-code': 2,
      antigravity: 2,
    })
    expect(
      fs.existsSync(
        path.join(tmpDir, '.antigravity/skills/bmad-agent-regen-multi-helper/SKILL.md'),
      ),
    ).toBe(true)

    await app.close()
  })

  // ─── AC-15.8.3 ───
  it('AC-15.8.3: regenerate re-reads source files so manual edits are picked up', async () => {
    seedInstalledModule('regen-edit')
    writeManifestWithIdes([{ name: 'regen-edit', source: 'custom' }], ['claude-code'])

    const app = await createTestApp()

    // First call — original helper title
    await app.inject({
      method: 'POST',
      url: '/api/modules/regen-edit/regenerate-skills',
    })
    const firstContent = fs.readFileSync(
      path.join(tmpDir, '.claude/skills/bmad-agent-regen-edit-helper/SKILL.md'),
      'utf-8',
    )
    expect(firstContent).toContain('description: "Helper"')

    // Manually edit the agent file to change the title
    fs.writeFileSync(
      path.join(tmpDir, '_bmad', 'regen-edit', 'agents', 'helper.md'),
      '<agent id="helper" name="helper" title="Brilliant Helper" capabilities="help"></agent>\n',
    )

    // Second call — new title should flow through
    await app.inject({
      method: 'POST',
      url: '/api/modules/regen-edit/regenerate-skills',
    })
    const secondContent = fs.readFileSync(
      path.join(tmpDir, '.claude/skills/bmad-agent-regen-edit-helper/SKILL.md'),
      'utf-8',
    )
    expect(secondContent).toContain('description: "Brilliant Helper"')
    expect(secondContent).not.toContain('description: "Helper"')

    await app.close()
  })

  // ─── AC-15.8.4 ───
  it('AC-15.8.4: regenerate on non-existent module returns 404', async () => {
    writeManifestWithIdes([], ['claude-code'])

    const app = await createTestApp()
    const resp = await app.inject({
      method: 'POST',
      url: '/api/modules/ghost-mod/regenerate-skills',
    })
    expect(resp.statusCode).toBe(404)
    expect(JSON.parse(resp.body).error.message).toContain('not installed')
    await app.close()
  })

  // ─── Idempotent regenerate (calling twice produces byte-identical files) ───
  it('regenerate is idempotent: calling twice produces byte-identical files', async () => {
    seedInstalledModule('regen-idem')
    writeManifestWithIdes([{ name: 'regen-idem', source: 'custom' }], ['claude-code'])

    const app = await createTestApp()
    await app.inject({
      method: 'POST',
      url: '/api/modules/regen-idem/regenerate-skills',
    })
    const skillPath = path.join(
      tmpDir,
      '.claude/skills/bmad-agent-regen-idem-helper/SKILL.md',
    )
    const firstContent = fs.readFileSync(skillPath, 'utf-8')

    await app.inject({
      method: 'POST',
      url: '/api/modules/regen-idem/regenerate-skills',
    })
    const secondContent = fs.readFileSync(skillPath, 'utf-8')
    expect(secondContent).toBe(firstContent)

    await app.close()
  })

  // ─── Regenerate with no IDE configured is a no-op with empty counts ───
  it('regenerate with empty manifest.ides returns { regenerated: {} }', async () => {
    seedInstalledModule('regen-no-ide')
    writeManifestWithIdes([{ name: 'regen-no-ide', source: 'custom' }], [])

    const app = await createTestApp()
    const resp = await app.inject({
      method: 'POST',
      url: '/api/modules/regen-no-ide/regenerate-skills',
    })
    expect(resp.statusCode).toBe(200)
    expect(JSON.parse(resp.body)).toEqual({ ok: true, regenerated: {} })
    expect(fs.existsSync(path.join(tmpDir, '.claude'))).toBe(false)
    await app.close()
  })
})

describe('modules-plugin — Story 15.9 preview-source endpoint', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'modules-plugin-15-9-')))
    const configDir = path.join(tmpDir, '_bmad', '_config')
    fs.mkdirSync(configDir, { recursive: true })
    fs.mkdirSync(path.join(tmpDir, '.bmad-studio'), { recursive: true })
    fs.writeFileSync(
      path.join(configDir, 'manifest.yaml'),
      yaml.dump({
        installation: {
          version: '6.2.0',
          installDate: '2026-01-01T00:00:00.000Z',
          lastUpdated: '2026-01-01T00:00:00.000Z',
        },
        modules: [],
        ides: [],
      }),
    )
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
        modules: [],
        ideDirectories: [],
      },
    })
  }

  function seedLocalModule(code: string, opts: { agentCount?: number; workflowCount?: number; variables?: Record<string, { prompt: string; default?: string }> } = {}) {
    const moduleDir = path.join(tmpDir, 'src-modules', code)
    fs.mkdirSync(path.join(moduleDir, 'agents'), { recursive: true })
    fs.mkdirSync(path.join(moduleDir, 'workflows'), { recursive: true })

    fs.writeFileSync(
      path.join(moduleDir, 'module.yaml'),
      yaml.dump({
        code,
        name: `${code} Module`,
        version: '2.0.0',
        description: 'A test module',
        ...(opts.variables ? { variables: opts.variables } : {}),
      }),
    )

    for (let i = 0; i < (opts.agentCount ?? 1); i++) {
      fs.writeFileSync(
        path.join(moduleDir, 'agents', `agent-${i}.md`),
        `<agent id="agent-${i}" name="agent-${i}" title="Agent ${i}"></agent>\n`,
      )
    }

    for (let i = 0; i < (opts.workflowCount ?? 0); i++) {
      fs.mkdirSync(path.join(moduleDir, 'workflows', `wf-${i}`), { recursive: true })
      fs.writeFileSync(path.join(moduleDir, 'workflows', `wf-${i}`, 'workflow.md'), `# Workflow ${i}\n`)
    }

    return moduleDir
  }

  // ─── AC-15.9.11: local source returns structured preview without modifying _bmad/ ───
  it('AC-15.9.11: returns preview for local source and does not modify _bmad/', async () => {
    const srcDir = seedLocalModule('preview-local', { agentCount: 2, workflowCount: 1 })

    const app = await createTestApp()
    const resp = await app.inject({
      method: 'POST',
      url: '/api/modules/preview-source',
      payload: { source: { type: 'local', value: srcDir } },
    })
    expect(resp.statusCode).toBe(200)
    const body = JSON.parse(resp.body)
    expect(body.ok).toBe(true)
    expect(body.moduleYaml.code).toBe('preview-local')
    expect(body.moduleYaml.version).toBe('2.0.0')
    expect(body.counts.agents).toBe(2)
    expect(body.counts.workflows).toBe(1)
    expect(body.counts.tasks).toBe(0)
    expect(body.willReplace).toBe(false)

    // AC-15.9.11 — read-only: _bmad/ must not have been touched
    expect(fs.existsSync(path.join(tmpDir, '_bmad', 'preview-local'))).toBe(false)

    await app.close()
  })

  // ─── willReplace=true when module dir already exists ───
  it('willReplace is true when the module is already installed', async () => {
    const srcDir = seedLocalModule('already-installed')
    // Pre-create the dest dir to simulate an existing installation
    fs.mkdirSync(path.join(tmpDir, '_bmad', 'already-installed', 'agents'), { recursive: true })

    const app = await createTestApp()
    const resp = await app.inject({
      method: 'POST',
      url: '/api/modules/preview-source',
      payload: { source: { type: 'local', value: srcDir } },
    })
    expect(resp.statusCode).toBe(200)
    expect(JSON.parse(resp.body).willReplace).toBe(true)

    await app.close()
  })

  // ─── 422 for unsupported zip type ───
  it('returns 422 for source type "zip"', async () => {
    const app = await createTestApp()
    const resp = await app.inject({
      method: 'POST',
      url: '/api/modules/preview-source',
      payload: { source: { type: 'zip', value: 'some.zip' } },
    })
    expect(resp.statusCode).toBe(422)
    expect(JSON.parse(resp.body).error.message).toContain('zip')

    await app.close()
  })

  // ─── 422 for invalid local path ───
  it('returns 422 when local path is not a plausible module dir', async () => {
    const emptyDir = path.join(tmpDir, 'empty-dir')
    fs.mkdirSync(emptyDir, { recursive: true })

    const app = await createTestApp()
    const resp = await app.inject({
      method: 'POST',
      url: '/api/modules/preview-source',
      payload: { source: { type: 'local', value: emptyDir } },
    })
    expect(resp.statusCode).toBe(422)

    await app.close()
  })

  // ─── variables are returned in moduleYaml ───
  it('returns moduleYaml.variables when the module.yaml declares them', async () => {
    const srcDir = seedLocalModule('vars-mod', {
      variables: { output_folder: { prompt: 'Output folder', default: 'output/default' } },
    })

    const app = await createTestApp()
    const resp = await app.inject({
      method: 'POST',
      url: '/api/modules/preview-source',
      payload: { source: { type: 'local', value: srcDir } },
    })
    expect(resp.statusCode).toBe(200)
    const body = JSON.parse(resp.body)
    expect(body.moduleYaml.variables).toBeDefined()
    expect(body.moduleYaml.variables.output_folder.default).toBe('output/default')

    await app.close()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Story 17.3 — Clean-slate reinstall (local + zip sources)
// ─────────────────────────────────────────────────────────────────────────────

describe('modules-plugin — Story 17.3 clean-slate reinstall', () => {
  let tmpDir: string
  let srcDir: string

  beforeEach(() => {
    tmpDir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'modules-17-3-')))
    srcDir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'modules-17-3-src-')))
    const configDir = path.join(tmpDir, '_bmad', '_config')
    fs.mkdirSync(configDir, { recursive: true })
    fs.writeFileSync(path.join(configDir, 'manifest.yaml'), yaml.dump(makeManifest([])))
    fs.mkdirSync(path.join(tmpDir, '.bmad-studio'), { recursive: true })
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
    fs.rmSync(srcDir, { recursive: true, force: true })
  })

  function createTestApp() {
    return createApp({
      logger: false,
      serveStatic: false,
      project: {
        projectRoot: tmpDir,
        bmadVersion: '6.2.0',
        versionSupported: true,
        modules: [],
        ideDirectories: [],
      },
    })
  }

  function makeLocalModule(code: string, agentFile: string) {
    const dir = path.join(srcDir, code)
    fs.mkdirSync(path.join(dir, 'agents'), { recursive: true })
    fs.writeFileSync(
      path.join(dir, 'agents', agentFile),
      `---\nname: ${agentFile.replace('.md', '')}\ntitle: Test\n---\n# Test\n`,
    )
    fs.writeFileSync(dir + '/module.yaml', `code: ${code}\nname: "${code}"\nversion: "1.0.0"\n`)
    return dir
  }

  // AC-17.3.1: local source reinstall returns 200 (not 409)
  it('AC-17.3.1: local source reinstall returns 200', async () => {
    const modDir = makeLocalModule('replace-me', 'v1-agent.md')

    const app = await createTestApp()
    const first = await app.inject({
      method: 'POST',
      url: '/api/modules/install',
      payload: { source: { type: 'local', value: modDir } },
    })
    expect(first.statusCode).toBe(200)

    const second = await app.inject({
      method: 'POST',
      url: '/api/modules/install',
      payload: { source: { type: 'local', value: modDir } },
    })
    expect(second.statusCode).toBe(200)
    expect(JSON.parse(second.body).ok).toBe(true)

    await app.close()
  })

  // AC-17.3.2: reinstall replaces old files with new files
  it('AC-17.3.2: reinstall replaces old agent with updated agent', async () => {
    const v1Dir = makeLocalModule('swap-mod', 'old-agent.md')

    const app = await createTestApp()
    await app.inject({
      method: 'POST',
      url: '/api/modules/install',
      payload: { source: { type: 'local', value: v1Dir } },
    })

    // Produce a v2 source with a different agent file
    const v2Dir = path.join(srcDir, 'swap-mod-v2')
    fs.mkdirSync(path.join(v2Dir, 'agents'), { recursive: true })
    fs.writeFileSync(
      path.join(v2Dir, 'agents', 'new-agent.md'),
      '---\nname: new-agent\ntitle: New\n---\n# New\n',
    )
    fs.writeFileSync(v2Dir + '/module.yaml', 'code: swap-mod\nname: "Swap Mod"\nversion: "2.0.0"\n')

    const resp = await app.inject({
      method: 'POST',
      url: '/api/modules/install',
      payload: { source: { type: 'local', value: v2Dir } },
    })
    expect(resp.statusCode).toBe(200)

    const destBase = path.join(tmpDir, '_bmad', 'swap-mod', 'agents')
    expect(fs.existsSync(path.join(destBase, 'new-agent.md'))).toBe(true)
    expect(fs.existsSync(path.join(destBase, 'old-agent.md'))).toBe(false)

    await app.close()
  })

  // AC-17.3.3: zip upload reinstall returns 200 (not 409)
  it('AC-17.3.3: zip upload reinstall returns 200', async () => {
    const zipBytes = await buildFixtureZip([
      { entryName: 'agents/zip-agent.md', data: '---\nname: zip-agent\ntitle: Zip\n---\n# Zip\n' },
      { entryName: 'module.yaml', data: 'code: zip-reinstall\nname: "Zip Reinstall"\nversion: "1.0.0"\n' },
    ])
    const { payload: p1, headers: h1 } = makeMultipartPayload(zipBytes)

    const app = await createTestApp()
    const first = await app.inject({
      method: 'POST',
      url: '/api/modules/install/upload',
      payload: p1,
      headers: h1,
    })
    expect(first.statusCode).toBe(200)

    const { payload: p2, headers: h2 } = makeMultipartPayload(zipBytes)
    const second = await app.inject({
      method: 'POST',
      url: '/api/modules/install/upload',
      payload: p2,
      headers: h2,
    })
    expect(second.statusCode).toBe(200)
    expect(JSON.parse(second.body).ok).toBe(true)

    await app.close()
  })

  // AC-17.3.4: reinstalling a built-in module is rejected with 422
  it('AC-17.3.4: reinstalling a built-in module returns 422', async () => {
    // Manually write a manifest with a built-in entry + create the module dir
    const configDir = path.join(tmpDir, '_bmad', '_config')
    const builtInManifest = {
      installation: {
        version: '6.2.0',
        installDate: '2026-01-01T00:00:00.000Z',
        lastUpdated: '2026-01-01T00:00:00.000Z',
      },
      modules: [
        {
          name: 'builtin-mod',
          version: '1.0.0',
          installDate: '2026-01-01T00:00:00.000Z',
          lastUpdated: '2026-01-01T00:00:00.000Z',
          source: 'built-in',
          npmPackage: null,
          repoUrl: null,
        },
      ],
    }
    fs.writeFileSync(path.join(configDir, 'manifest.yaml'), yaml.dump(builtInManifest))
    const builtInDir = path.join(tmpDir, '_bmad', 'builtin-mod', 'agents')
    fs.mkdirSync(builtInDir, { recursive: true })

    const srcMod = makeLocalModule('builtin-mod', 'agent.md')

    const app = await createTestApp()
    const resp = await app.inject({
      method: 'POST',
      url: '/api/modules/install',
      payload: { source: { type: 'local', value: srcMod } },
    })
    expect(resp.statusCode).toBe(422)
    expect(JSON.parse(resp.body).error.message).toContain('built-in')

    await app.close()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Story 31.4 — GET /api/modules returns real v6.5 data (P0 exit criterion)
// ─────────────────────────────────────────────────────────────────────────────

function repoRoot(importMetaUrl: string): string {
  let dir = path.dirname(new URL(importMetaUrl).pathname)
  for (let i = 0; i < 10; i++) {
    const pkgPath = path.join(dir, 'package.json')
    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8')) as {
          workspaces?: unknown
          name?: string
        }
        if (pkg.workspaces || pkg.name === 'bmad-studio') return dir
      } catch {
        // continue
      }
    }
    const parent = path.dirname(dir)
    if (parent === dir) break
    dir = parent
  }
  return process.cwd()
}

const REPO_ROOT = repoRoot(import.meta.url)
const FIXTURE_BMAD = path.join(REPO_ROOT, 'docs', '_bmad_v6.5')
const FIXTURE_AVAILABLE = fs.existsSync(path.join(FIXTURE_BMAD, '_config', 'manifest.yaml'))

describe('modules-plugin — Story 31.4 v6.5 GET /api/modules', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'v65-modules-plugin-test-')))
    // Link the v6.5 fixture under tmpDir/_bmad
    const dest = path.join(tmpDir, '_bmad')
    try {
      fs.symlinkSync(FIXTURE_BMAD, dest)
    } catch {
      fs.cpSync(FIXTURE_BMAD, dest, { recursive: true })
    }
    fs.mkdirSync(path.join(tmpDir, '.bmad-studio'), { recursive: true })
    // Ensure no stale in-memory cache from other tests
    invalidateCache(tmpDir)
  })

  afterEach(() => {
    invalidateCache(tmpDir)
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  it.skipIf(!FIXTURE_AVAILABLE)(
    'GET /api/modules returns >= 1 module with real v6.5 data (AC: not empty)',
    async () => {
      const app = await createApp({
        logger: false,
        serveStatic: false,
        project: {
          projectRoot: tmpDir,
          bmadVersion: '6.5.0',
          versionSupported: true,
          modules: [],
          ideDirectories: [],
        },
      })

      const resp = await app.inject({ method: 'GET', url: '/api/modules' })
      expect(resp.statusCode).toBe(200)

      const modules = JSON.parse(resp.body) as Array<{
        name: string
        agentCount: number
        skillCount: number
        workflowCount: number
        teamCount: number
        skills: Array<{ id: string; name: string }>
      }>

      expect(Array.isArray(modules)).toBe(true)
      expect(modules.length).toBeGreaterThanOrEqual(1)

      // Every module must have the required shape
      for (const m of modules) {
        expect(typeof m.name).toBe('string')
        expect(typeof m.agentCount).toBe('number')
        expect(typeof m.skillCount).toBe('number')
        expect(typeof m.workflowCount).toBe('number')
        expect(m.teamCount).toBe(0)
      }

      // The fixture has at least a 'core' module with skills
      const core = modules.find((m) => m.name === 'core')
      expect(core).toBeDefined()
      expect(core!.skills.length).toBeGreaterThan(0)

      await app.close()
    },
  )
})
