/**
 * Tests for agent-adapter.ts — adapts the merged [agent] block from a v6.5
 * customize.toml into the existing Agent shape.
 *
 * Fixture: docs/_bmad_v6.5/bmm/2-plan-workflows/bmad-agent-pm/customize.toml
 * (part of the committed test fixtures in the repo).
 */

import { describe, it, expect } from 'vitest'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'

import { adaptAgent } from './agent-adapter.js'
import type { Agent } from '@bmad-studio/shared'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Create a temp dir and return its path + cleanup fn. */
function makeTmpDir(): { dir: string; cleanup: () => void } {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bmad-agent-adapter-test-'))
  return { dir, cleanup: () => fs.rmSync(dir, { recursive: true, force: true }) }
}

/** Write a file, creating intermediate dirs as needed. */
function writeFile(filePath: string, content: string): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, content, 'utf8')
}

// ---------------------------------------------------------------------------
// Fixture paths
// vitest runs from the monorepo root so process.cwd() is the repo root.
// ---------------------------------------------------------------------------

const REPO_ROOT = process.cwd()
const PM_SKILL_PATH = path.resolve(
  REPO_ROOT,
  'docs/_bmad_v6.5/bmm/2-plan-workflows/bmad-agent-pm',
)

// A minimal base Agent to pass in — structural fields only.
const BASE_AGENT: Partial<Agent> = {
  id: 'bmad-agent-pm',
  filePath: path.join(PM_SKILL_PATH, 'customize.toml'),
  discussion: false,
  webskip: false,
  hasSidecar: false,
  skills: [],
}

// ---------------------------------------------------------------------------
// Test 1 — bmad-agent-pm fixture: core field mapping
// ---------------------------------------------------------------------------

describe('adaptAgent — bmad-agent-pm fixture', () => {
  it('maps icon, title, and name from [agent] block', () => {
    const result = adaptAgent(PM_SKILL_PATH, REPO_ROOT, BASE_AGENT)
    expect(result.icon).toBe('📋')
    expect(result.title).toBe('Product Manager')
    expect(result.name).toBe('John')
  })

  it('maps role from [agent] block', () => {
    const result = adaptAgent(PM_SKILL_PATH, REPO_ROOT, BASE_AGENT)
    expect(result.role).toBe(
      'Translate product vision into a validated PRD, epics, and stories that development can execute during the BMad Method planning phase.',
    )
  })

  it('maps identity from [agent] block', () => {
    const result = adaptAgent(PM_SKILL_PATH, REPO_ROOT, BASE_AGENT)
    expect(result.identity).toBe(
      "Thinks like Marty Cagan and Teresa Torres. Writes with Bezos's six-pager discipline.",
    )
  })

  it('maps communication_style → communicationStyle (camelCase)', () => {
    const result = adaptAgent(PM_SKILL_PATH, REPO_ROOT, BASE_AGENT)
    expect(result.communicationStyle).toBe(
      "Detective's 'why?' relentless. Direct, data-sharp, cuts through fluff to what matters.",
    )
  })

  it('maps 3 principles joined as a single string', () => {
    const result = adaptAgent(PM_SKILL_PATH, REPO_ROOT, BASE_AGENT)
    const lines = (result.principles ?? '').split('\n')
    expect(lines).toHaveLength(3)
    expect(lines[0]).toBe('PRDs emerge from user interviews, not template filling.')
    expect(lines[1]).toBe('Ship the smallest thing that validates the assumption.')
    expect(lines[2]).toBe('User value first; technical feasibility is a constraint.')
  })

  it('produces 6 menu items (CP, VP, EP, CE, IR, CC)', () => {
    const result = adaptAgent(PM_SKILL_PATH, REPO_ROOT, BASE_AGENT)
    expect(result.menu).toHaveLength(6)
    const triggers = result.menu.map((m) => m.trigger)
    expect(triggers).toEqual(['CP', 'VP', 'EP', 'CE', 'IR', 'CC'])
  })
})

// ---------------------------------------------------------------------------
// Test 2 — menu item field mapping
// ---------------------------------------------------------------------------

describe('adaptAgent — menu item mapping', () => {
  it('maps code → trigger for each menu entry', () => {
    const result = adaptAgent(PM_SKILL_PATH, REPO_ROOT, BASE_AGENT)
    result.menu.forEach((item) => {
      // trigger should be a 2-letter code (CP, VP, …)
      expect(item.trigger).toMatch(/^[A-Z]{2}$/)
    })
  })

  it('maps description → input for each menu entry', () => {
    const result = adaptAgent(PM_SKILL_PATH, REPO_ROOT, BASE_AGENT)
    const cpItem = result.menu.find((m) => m.trigger === 'CP')
    expect(cpItem?.input).toBe(
      'Expert led facilitation to produce your Product Requirements Document',
    )
  })

  it('maps skill → route for skill-based menu entries', () => {
    const result = adaptAgent(PM_SKILL_PATH, REPO_ROOT, BASE_AGENT)
    const cpItem = result.menu.find((m) => m.trigger === 'CP')
    expect(cpItem?.route).toBe('bmad-create-prd')
  })

  it('preserves correct route for all menu items', () => {
    const result = adaptAgent(PM_SKILL_PATH, REPO_ROOT, BASE_AGENT)
    const expected: Record<string, string> = {
      CP: 'bmad-create-prd',
      VP: 'bmad-validate-prd',
      EP: 'bmad-edit-prd',
      CE: 'bmad-create-epics-and-stories',
      IR: 'bmad-check-implementation-readiness',
      CC: 'bmad-correct-course',
    }
    for (const item of result.menu) {
      expect(item.route).toBe(expected[item.trigger])
    }
  })
})

// ---------------------------------------------------------------------------
// Test 3 — skill with no customize.toml falls back gracefully
// ---------------------------------------------------------------------------

describe('adaptAgent — missing customize.toml', () => {
  it('returns baseAgent without throwing when no customize.toml exists', () => {
    const { dir, cleanup } = makeTmpDir()
    try {
      const skillPath = path.join(dir, 'no-toml-agent')
      fs.mkdirSync(skillPath, { recursive: true })
      const projectRoot = dir

      const base: Partial<Agent> = {
        id: 'no-toml-agent',
        name: 'Fallback Agent',
        title: 'Fallback',
        role: 'Does nothing',
        filePath: skillPath,
        discussion: true,
        webskip: false,
        hasSidecar: false,
        skills: ['skill-a'],
        menu: [],
      }

      let result!: Agent
      expect(() => {
        result = adaptAgent(skillPath, projectRoot, base)
      }).not.toThrow()

      expect(result.name).toBe('Fallback Agent')
      expect(result.id).toBe('no-toml-agent')
      expect(result.title).toBe('Fallback')
      expect(result.discussion).toBe(true)
      expect(result.skills).toEqual(['skill-a'])
    } finally {
      cleanup()
    }
  })

  it('uses skill directory basename as name when baseAgent has no name', () => {
    const { dir, cleanup } = makeTmpDir()
    try {
      const skillPath = path.join(dir, 'my-special-agent')
      fs.mkdirSync(skillPath, { recursive: true })

      const result = adaptAgent(skillPath, dir, {})
      expect(result.name).toBe('my-special-agent')
      expect(result.id).toBe('my-special-agent')
    } finally {
      cleanup()
    }
  })
})

// ---------------------------------------------------------------------------
// Test 4 — team override applied
// ---------------------------------------------------------------------------

describe('adaptAgent — team override', () => {
  it('team override icon wins over base icon', () => {
    const { dir, cleanup } = makeTmpDir()
    try {
      // Create a base skill with customize.toml
      const skillPath = path.join(dir, 'my-agent')
      writeFile(
        path.join(skillPath, 'customize.toml'),
        `
[agent]
name = "Alice"
title = "Senior Dev"
icon = "🤖"
role = "Code reviewer"
`,
      )

      // Create a team override in _bmad/custom/
      const projectRoot = path.join(dir, 'project')
      writeFile(
        path.join(projectRoot, '_bmad', 'custom', 'my-agent.toml'),
        `
[agent]
icon = "⚙️"
`,
      )

      const result = adaptAgent(skillPath, projectRoot, { id: 'my-agent', filePath: skillPath })

      // Team icon wins
      expect(result.icon).toBe('⚙️')
      // Base values preserved
      expect(result.name).toBe('Alice')
      expect(result.title).toBe('Senior Dev')
      expect(result.role).toBe('Code reviewer')
    } finally {
      cleanup()
    }
  })

  it('user override beats team override (scalar field)', () => {
    const { dir, cleanup } = makeTmpDir()
    try {
      const skillPath = path.join(dir, 'my-agent')
      writeFile(
        path.join(skillPath, 'customize.toml'),
        `
[agent]
name = "Alice"
icon = "🤖"
role = "Reviewer"
`,
      )

      const projectRoot = path.join(dir, 'project')
      // Team sets icon to gear
      writeFile(
        path.join(projectRoot, '_bmad', 'custom', 'my-agent.toml'),
        `
[agent]
icon = "⚙️"
`,
      )
      // User overrides icon to star
      writeFile(
        path.join(projectRoot, '_bmad', 'custom', 'my-agent.user.toml'),
        `
[agent]
icon = "🌟"
`,
      )

      const result = adaptAgent(skillPath, projectRoot, { id: 'my-agent', filePath: skillPath })
      expect(result.icon).toBe('🌟')
    } finally {
      cleanup()
    }
  })
})

// ---------------------------------------------------------------------------
// Snapshot test — full adapted bmad-agent-pm result
// ---------------------------------------------------------------------------

describe('adaptAgent — snapshot', () => {
  it('bmad-agent-pm adapter output matches snapshot', () => {
    const result = adaptAgent(PM_SKILL_PATH, REPO_ROOT, BASE_AGENT)
    expect(result).toMatchSnapshot()
  })
})
