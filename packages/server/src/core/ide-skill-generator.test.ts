import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import type { ModuleManifestFile } from '@bmad-studio/shared'

import type { FileStore } from './file-store.js'
import {
  generateIdeSkillsForModule,
  removeIdeSkillsForModule,
} from './ide-skill-generator.js'

// Minimal FileStore stub — the generator only uses studioDir + the watcher hooks.
function makeStubFileStore(studioDir: string): FileStore {
  return {
    studioDir,
    markPendingWrite: () => {},
    clearPendingWrite: () => {},
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any as FileStore
}

function makeManifest(ides: string[]): ModuleManifestFile {
  return {
    installation: {
      version: '6.2.0',
      installDate: '2026-01-01T00:00:00.000Z',
      lastUpdated: '2026-01-01T00:00:00.000Z',
    },
    modules: [],
    ides,
  }
}

describe('generateIdeSkillsForModule', () => {
  let tmpDir: string
  let studioDir: string
  let fileStore: FileStore

  beforeEach(() => {
    tmpDir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'ide-skill-gen-')))
    studioDir = path.join(tmpDir, '.bmad-studio')
    fs.mkdirSync(studioDir, { recursive: true })
    fileStore = makeStubFileStore(studioDir)

    // Build a fixture module with one agent + one workflow + one task
    const moduleDir = path.join(tmpDir, '_bmad', 'test-mod')
    fs.mkdirSync(path.join(moduleDir, 'agents'), { recursive: true })
    fs.mkdirSync(path.join(moduleDir, 'workflows', 'create-foo'), { recursive: true })
    fs.mkdirSync(path.join(moduleDir, 'tasks', 'preflight'), { recursive: true })

    fs.writeFileSync(
      path.join(moduleDir, 'agents', 'architect.md'),
      [
        '<agent id="architect" name="architect" title="Test Architect" capabilities="design">',
        '  <persona>',
        '    <identity>I design systems</identity>',
        '  </persona>',
        '</agent>',
      ].join('\n'),
    )

    fs.writeFileSync(
      path.join(moduleDir, 'workflows', 'create-foo', 'workflow.md'),
      '---\nname: create-foo\n---\n# Create Foo\n\n**Goal:** Creates a foo\n',
    )

    fs.writeFileSync(
      path.join(moduleDir, 'tasks', 'preflight', 'task.md'),
      '---\nname: preflight\n---\n# Preflight\n',
    )
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  // ─── AC-15.6.1 ───
  it('AC-15.6.1: generates SKILL.md files for agents and workflows under .claude/skills/', () => {
    const result = generateIdeSkillsForModule(
      tmpDir,
      'test-mod',
      makeManifest(['claude-code']),
      studioDir,
      fileStore,
    )
    expect(result.ok).toBe(true)
    if (!result.ok) return

    const agentSkill = path.join(
      tmpDir,
      '.claude/skills/bmad-agent-test-mod-architect/SKILL.md',
    )
    const workflowSkill = path.join(
      tmpDir,
      '.claude/skills/bmad-test-mod-create-foo/SKILL.md',
    )
    const taskSkill = path.join(tmpDir, '.claude/skills/bmad-test-mod-preflight/SKILL.md')

    expect(fs.existsSync(agentSkill)).toBe(true)
    expect(fs.existsSync(workflowSkill)).toBe(true)
    expect(fs.existsSync(taskSkill)).toBe(true)

    // Per-IDE counts
    expect(result.skillsByIde['claude-code']).toHaveLength(3)
  })

  // ─── AC-15.6.2 ───
  it('AC-15.6.2: generates files under both .claude/skills/ and .antigravity/skills/', () => {
    const result = generateIdeSkillsForModule(
      tmpDir,
      'test-mod',
      makeManifest(['claude-code', 'antigravity']),
      studioDir,
      fileStore,
    )
    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(
      fs.existsSync(path.join(tmpDir, '.claude/skills/bmad-agent-test-mod-architect/SKILL.md')),
    ).toBe(true)
    expect(
      fs.existsSync(
        path.join(tmpDir, '.antigravity/skills/bmad-agent-test-mod-architect/SKILL.md'),
      ),
    ).toBe(true)

    expect(result.skillsByIde['claude-code']).toHaveLength(3)
    expect(result.skillsByIde.antigravity).toHaveLength(3)
  })

  // ─── AC-15.6.3 ───
  it('AC-15.6.3: agent description is extracted via parseAgent (XML title)', () => {
    const result = generateIdeSkillsForModule(
      tmpDir,
      'test-mod',
      makeManifest(['claude-code']),
      studioDir,
      fileStore,
    )
    expect(result.ok).toBe(true)

    const skillContent = fs.readFileSync(
      path.join(tmpDir, '.claude/skills/bmad-agent-test-mod-architect/SKILL.md'),
      'utf-8',
    )
    expect(skillContent).toContain('description: "Test Architect"')
  })

  // ─── AC-15.6.4 ───
  it('AC-15.6.4: agent without a description falls back to "BMAD <name> agent from <module>"', () => {
    // Replace the architect file with one that has no <agent> block
    fs.writeFileSync(
      path.join(tmpDir, '_bmad', 'test-mod', 'agents', 'plain.md'),
      '# Just a plain agent\n',
    )
    // Remove the original architect to keep things clean
    fs.unlinkSync(path.join(tmpDir, '_bmad', 'test-mod', 'agents', 'architect.md'))

    const result = generateIdeSkillsForModule(
      tmpDir,
      'test-mod',
      makeManifest(['claude-code']),
      studioDir,
      fileStore,
    )
    expect(result.ok).toBe(true)

    const skillContent = fs.readFileSync(
      path.join(tmpDir, '.claude/skills/bmad-agent-test-mod-plain/SKILL.md'),
      'utf-8',
    )
    expect(skillContent).toContain('description: "BMAD plain agent from test-mod"')
  })

  // ─── AC-15.6.5 ───
  it('AC-15.6.5: SKILL.md body contains an absolute path to the source file', () => {
    generateIdeSkillsForModule(
      tmpDir,
      'test-mod',
      makeManifest(['claude-code']),
      studioDir,
      fileStore,
    )

    const skillContent = fs.readFileSync(
      path.join(tmpDir, '.claude/skills/bmad-agent-test-mod-architect/SKILL.md'),
      'utf-8',
    )
    // The body should contain an absolute path (starts with / on Unix)
    expect(skillContent).toContain(
      path.join(tmpDir, '_bmad', 'test-mod', 'agents', 'architect.md'),
    )
    // And the path is absolute
    expect(skillContent).toMatch(/^\/.*architect\.md$/m)
  })

  // ─── AC-15.6.6 ───
  it('AC-15.6.6: calling generator twice produces byte-identical files', () => {
    const result1 = generateIdeSkillsForModule(
      tmpDir,
      'test-mod',
      makeManifest(['claude-code']),
      studioDir,
      fileStore,
    )
    expect(result1.ok).toBe(true)

    const skillPath = path.join(
      tmpDir,
      '.claude/skills/bmad-agent-test-mod-architect/SKILL.md',
    )
    const firstContent = fs.readFileSync(skillPath, 'utf-8')

    // Snapshot history count BEFORE the second call
    const historyDir = path.join(studioDir, 'history')
    const historyBefore = fs.existsSync(historyDir) ? fs.readdirSync(historyDir).length : 0

    const result2 = generateIdeSkillsForModule(
      tmpDir,
      'test-mod',
      makeManifest(['claude-code']),
      studioDir,
      fileStore,
    )
    expect(result2.ok).toBe(true)

    const secondContent = fs.readFileSync(skillPath, 'utf-8')
    expect(secondContent).toBe(firstContent)

    // The idempotent early-exit means no new history entries on the second call
    const historyAfter = fs.existsSync(historyDir) ? fs.readdirSync(historyDir).length : 0
    expect(historyAfter).toBe(historyBefore)
  })

  // ─── AC-15.6.7 ───
  it('AC-15.6.7: unknown IDEs are silently filtered (cursor)', () => {
    const result = generateIdeSkillsForModule(
      tmpDir,
      'test-mod',
      makeManifest(['claude-code', 'cursor', 'antigravity']),
      studioDir,
      fileStore,
    )
    expect(result.ok).toBe(true)
    if (!result.ok) return

    // Both supported IDEs got launchers
    expect(result.skillsByIde['claude-code']).toHaveLength(3)
    expect(result.skillsByIde.antigravity).toHaveLength(3)

    // The unknown IDE was silently dropped
    expect(result.skillsByIde.cursor).toBeUndefined()
    expect(fs.existsSync(path.join(tmpDir, '.cursor', 'skills'))).toBe(false)
  })

  // ─── AC-15.6.9 ───
  it('AC-15.6.9: empty manifest.ides[] is a no-op', () => {
    const result = generateIdeSkillsForModule(
      tmpDir,
      'test-mod',
      makeManifest([]),
      studioDir,
      fileStore,
    )
    expect(result).toEqual({ ok: true, skillsByIde: {} })
    expect(fs.existsSync(path.join(tmpDir, '.claude'))).toBe(false)
    expect(fs.existsSync(path.join(tmpDir, '.antigravity'))).toBe(false)
  })

  // ─── AC-15.6.9 (b) ───
  it('AC-15.6.9 (b): missing manifest.ides field is a no-op', () => {
    const manifestNoIdes: ModuleManifestFile = {
      installation: {
        version: '6.2.0',
        installDate: '2026-01-01',
        lastUpdated: '2026-01-01',
      },
      modules: [],
      // ides field intentionally omitted
    }
    const result = generateIdeSkillsForModule(
      tmpDir,
      'test-mod',
      manifestNoIdes,
      studioDir,
      fileStore,
    )
    expect(result).toEqual({ ok: true, skillsByIde: {} })
  })

  // ─── workflow description extraction (AC-15.6.3 supporting case) ───
  it('extracts workflow description via parseWorkflow', () => {
    generateIdeSkillsForModule(
      tmpDir,
      'test-mod',
      makeManifest(['claude-code']),
      studioDir,
      fileStore,
    )

    const skillContent = fs.readFileSync(
      path.join(tmpDir, '.claude/skills/bmad-test-mod-create-foo/SKILL.md'),
      'utf-8',
    )
    // The fixture workflow has `description: Creates a foo` in the frontmatter
    expect(skillContent).toContain('Creates a foo')
  })

  // ─── module with no entities is a no-op for that IDE ───
  it('module with no agents/workflows/tasks generates an empty list per IDE', () => {
    // Create an empty module
    const emptyModuleDir = path.join(tmpDir, '_bmad', 'empty-mod')
    fs.mkdirSync(emptyModuleDir, { recursive: true })

    const result = generateIdeSkillsForModule(
      tmpDir,
      'empty-mod',
      makeManifest(['claude-code']),
      studioDir,
      fileStore,
    )
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.skillsByIde['claude-code']).toEqual([])
    // The output dir is created but is empty (no SKILL.md files written)
    expect(fs.existsSync(path.join(tmpDir, '.claude/skills'))).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// removeIdeSkillsForModule — Story 15.7
// ─────────────────────────────────────────────────────────────────────────────

describe('removeIdeSkillsForModule', () => {
  let tmpDir: string
  let studioDir: string
  let fileStore: FileStore

  beforeEach(() => {
    tmpDir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'ide-skill-remove-')))
    studioDir = path.join(tmpDir, '.bmad-studio')
    fs.mkdirSync(studioDir, { recursive: true })
    fileStore = makeStubFileStore(studioDir)
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  // ─── AC-15.7.3a ───
  it('AC-15.7.3a: removes only prefix-matched directories, leaves others alone', () => {
    // First, generate skills for two modules using generateIdeSkillsForModule so the
    // fixture matches real usage.
    const setupModule = (code: string) => {
      const moduleDir = path.join(tmpDir, '_bmad', code)
      fs.mkdirSync(path.join(moduleDir, 'agents'), { recursive: true })
      fs.writeFileSync(
        path.join(moduleDir, 'agents', 'a.md'),
        `<agent id="a" name="a" title="${code} agent" capabilities="work"></agent>\n`,
      )
    }
    setupModule('foo')
    setupModule('bar')

    generateIdeSkillsForModule(
      tmpDir,
      'foo',
      makeManifest(['claude-code']),
      studioDir,
      fileStore,
    )
    generateIdeSkillsForModule(
      tmpDir,
      'bar',
      makeManifest(['claude-code']),
      studioDir,
      fileStore,
    )

    // Both dirs exist before removal
    expect(
      fs.existsSync(path.join(tmpDir, '.claude/skills/bmad-agent-foo-a')),
    ).toBe(true)
    expect(
      fs.existsSync(path.join(tmpDir, '.claude/skills/bmad-agent-bar-a')),
    ).toBe(true)

    // Remove foo — only foo's dirs should go
    const result = removeIdeSkillsForModule(
      tmpDir,
      'foo',
      makeManifest(['claude-code']),
      studioDir,
    )
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.removedByIde['claude-code']).toEqual(['bmad-agent-foo-a'])

    // foo removed, bar untouched
    expect(
      fs.existsSync(path.join(tmpDir, '.claude/skills/bmad-agent-foo-a')),
    ).toBe(false)
    expect(
      fs.existsSync(path.join(tmpDir, '.claude/skills/bmad-agent-bar-a')),
    ).toBe(true)
  })

  // ─── AC-15.7.3b ───
  it('AC-15.7.3b: missing IDE dir returns empty list, no error', () => {
    const result = removeIdeSkillsForModule(
      tmpDir,
      'never-installed',
      makeManifest(['claude-code', 'antigravity']),
      studioDir,
    )
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.removedByIde).toEqual({
      'claude-code': [],
      antigravity: [],
    })
  })

  // ─── AC-15.7.3c ───
  it('AC-15.7.3c: removed files are recoverable from .bmad-studio/history/', () => {
    // Install a module
    const moduleDir = path.join(tmpDir, '_bmad', 'recover-test')
    fs.mkdirSync(path.join(moduleDir, 'agents'), { recursive: true })
    fs.writeFileSync(
      path.join(moduleDir, 'agents', 'helper.md'),
      '<agent id="helper" name="helper" title="Helper" capabilities="help"></agent>\n',
    )

    generateIdeSkillsForModule(
      tmpDir,
      'recover-test',
      makeManifest(['claude-code']),
      studioDir,
      fileStore,
    )

    // Remove
    const result = removeIdeSkillsForModule(
      tmpDir,
      'recover-test',
      makeManifest(['claude-code']),
      studioDir,
    )
    expect(result.ok).toBe(true)

    // SKILL.md from the removed dir should have a snapshot in .bmad-studio/history/
    const historyDir = path.join(studioDir, 'history')
    expect(fs.existsSync(historyDir)).toBe(true)
    const history = fs.readdirSync(historyDir)
    expect(history.some((n) => n.endsWith('SKILL.md'))).toBe(true)
  })

  // Ignores unknown IDEs (parallel to AC-15.6.7)
  it('ignores unknown IDE entries when scanning for removal', () => {
    const result = removeIdeSkillsForModule(
      tmpDir,
      'whatever',
      makeManifest(['claude-code', 'cursor']),
      studioDir,
    )
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.removedByIde['claude-code']).toEqual([])
    expect(result.removedByIde.cursor).toBeUndefined()
  })
})
