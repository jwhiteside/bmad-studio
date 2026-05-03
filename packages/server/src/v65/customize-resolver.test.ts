import { describe, it, expect } from 'vitest'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'

import {
  mergeScalar,
  mergeTable,
  mergeKeyedArray,
  mergeArray,
  resolveLayered,
  resolveSkillCustomization,
  type TomlObject,
} from './customize-resolver.js'
import { ManifestMissingError, ManifestParseError } from '../core/errors.js'

// ---------------------------------------------------------------------------
// mergeScalar
// ---------------------------------------------------------------------------

describe('mergeScalar', () => {
  it('string overrides string', () => {
    expect(mergeScalar('base', 'override')).toBe('override')
  })

  it('number overrides number', () => {
    expect(mergeScalar(1, 99)).toBe(99)
  })

  it('boolean overrides boolean (false wins)', () => {
    expect(mergeScalar(true, false)).toBe(false)
  })

  it('boolean overrides boolean (true wins)', () => {
    expect(mergeScalar(false, true)).toBe(true)
  })

  it('empty string wins over non-empty string', () => {
    expect(mergeScalar('hello', '')).toBe('')
  })

  it('number overrides string (type changes)', () => {
    expect(mergeScalar('text', 42)).toBe(42)
  })

  it('string overrides number (type changes)', () => {
    expect(mergeScalar(42, 'text')).toBe('text')
  })

  it('boolean overrides string', () => {
    expect(mergeScalar('yes', true)).toBe(true)
  })

  it('zero overrides non-zero', () => {
    expect(mergeScalar(5, 0)).toBe(0)
  })

  it('negative number overrides positive', () => {
    expect(mergeScalar(10, -3)).toBe(-3)
  })
})

// ---------------------------------------------------------------------------
// mergeTable
// ---------------------------------------------------------------------------

describe('mergeTable', () => {
  it('top-level override wins for shared key', () => {
    const result = mergeTable({ a: 1 }, { a: 2 })
    expect(result).toEqual({ a: 2 })
  })

  it('nested deep merge — base keys preserved, override key wins', () => {
    const base = { a: { x: 1, y: 2 } }
    const override = { a: { y: 3 } }
    expect(mergeTable(base, override)).toEqual({ a: { x: 1, y: 3 } })
  })

  it('key only in base is preserved', () => {
    const result = mergeTable({ a: 1, b: 2 }, { a: 10 })
    expect(result).toEqual({ a: 10, b: 2 })
  })

  it('key only in override is added', () => {
    const result = mergeTable({ a: 1 }, { b: 2 })
    expect(result).toEqual({ a: 1, b: 2 })
  })

  it('override key to scalar replaces nested table', () => {
    const base = { a: { x: 1 } }
    const override = { a: 'flat' }
    expect(mergeTable(base, override)).toEqual({ a: 'flat' })
  })

  it('empty base — returns override copy', () => {
    expect(mergeTable({}, { a: 1, b: 'x' })).toEqual({ a: 1, b: 'x' })
  })

  it('empty override — returns base copy', () => {
    expect(mergeTable({ a: 1, b: 'x' }, {})).toEqual({ a: 1, b: 'x' })
  })

  it('both empty — returns empty object', () => {
    expect(mergeTable({}, {})).toEqual({})
  })

  it('three-level nesting merges correctly', () => {
    const base = { a: { b: { c: 1, d: 2 } } }
    const override = { a: { b: { d: 99 } } }
    expect(mergeTable(base, override)).toEqual({ a: { b: { c: 1, d: 99 } } })
  })

  it('does not mutate base or override', () => {
    const base = { a: 1 }
    const override = { a: 2 }
    mergeTable(base, override)
    expect(base).toEqual({ a: 1 })
    expect(override).toEqual({ a: 2 })
  })
})

// ---------------------------------------------------------------------------
// mergeKeyedArray
// ---------------------------------------------------------------------------

describe('mergeKeyedArray', () => {
  it('matching code replaces base item', () => {
    const base = [{ code: 'a', val: 1 }]
    const override = [{ code: 'a', val: 99 }]
    expect(mergeKeyedArray(base, override)).toEqual([{ code: 'a', val: 99 }])
  })

  it('new code in override appends to result', () => {
    const base = [{ code: 'a', val: 1 }]
    const override = [{ code: 'b', val: 2 }]
    expect(mergeKeyedArray(base, override)).toEqual([
      { code: 'a', val: 1 },
      { code: 'b', val: 2 },
    ])
  })

  it('empty base returns override items', () => {
    const override = [{ code: 'x', val: 42 }]
    expect(mergeKeyedArray([], override)).toEqual([{ code: 'x', val: 42 }])
  })

  it('empty override returns base items', () => {
    const base = [{ code: 'x', val: 42 }]
    expect(mergeKeyedArray(base, [])).toEqual([{ code: 'x', val: 42 }])
  })

  it('both empty returns empty array', () => {
    expect(mergeKeyedArray([], [])).toEqual([])
  })

  it('multiple matches and new items', () => {
    const base = [
      { code: 'a', val: 1 },
      { code: 'b', val: 2 },
      { code: 'c', val: 3 },
    ]
    const override = [
      { code: 'b', val: 20 },
      { code: 'd', val: 4 },
    ]
    expect(mergeKeyedArray(base, override)).toEqual([
      { code: 'a', val: 1 },
      { code: 'b', val: 20 },
      { code: 'c', val: 3 },
      { code: 'd', val: 4 },
    ])
  })

  it('base order preserved with new items appended at end', () => {
    const base = [
      { code: 'z', n: 1 },
      { code: 'y', n: 2 },
      { code: 'x', n: 3 },
    ]
    const override = [{ code: 'w', n: 4 }]
    const result = mergeKeyedArray(base, override)
    expect(result.map((r) => r.code)).toEqual(['z', 'y', 'x', 'w'])
  })

  it('override with only existing codes — no growth in length', () => {
    const base = [{ code: 'a', val: 1 }, { code: 'b', val: 2 }]
    const override = [{ code: 'a', val: 10 }, { code: 'b', val: 20 }]
    expect(mergeKeyedArray(base, override)).toHaveLength(2)
  })

  it('last override wins for duplicate code within override itself', () => {
    const base: { code: string; val: number }[] = []
    const override = [{ code: 'a', val: 1 }, { code: 'a', val: 2 }]
    expect(mergeKeyedArray(base, override)).toEqual([{ code: 'a', val: 2 }])
  })
})

// ---------------------------------------------------------------------------
// mergeArray
// ---------------------------------------------------------------------------

describe('mergeArray', () => {
  it('concatenates base and override', () => {
    expect(mergeArray([1, 2], [3, 4])).toEqual([1, 2, 3, 4])
  })

  it('empty base returns override only', () => {
    expect(mergeArray([], [1, 2, 3])).toEqual([1, 2, 3])
  })

  it('empty override returns base only', () => {
    expect(mergeArray([1, 2, 3], [])).toEqual([1, 2, 3])
  })

  it('both empty returns empty array', () => {
    expect(mergeArray([], [])).toEqual([])
  })

  it('duplicates are preserved', () => {
    expect(mergeArray([1, 1], [1])).toEqual([1, 1, 1])
  })

  it('string arrays concatenate', () => {
    expect(mergeArray(['a', 'b'], ['c', 'd'])).toEqual(['a', 'b', 'c', 'd'])
  })

  it('object arrays without code field concatenate (plain merge)', () => {
    const base = [{ name: 'foo' }]
    const override = [{ name: 'bar' }]
    expect(mergeArray(base, override)).toEqual([{ name: 'foo' }, { name: 'bar' }])
  })

  it('order is base-first then override', () => {
    const result = mergeArray(['x', 'y'], ['a', 'b'])
    expect(result).toEqual(['x', 'y', 'a', 'b'])
  })

  it('does not mutate base or override', () => {
    const base = [1, 2]
    const override = [3, 4]
    mergeArray(base, override)
    expect(base).toEqual([1, 2])
    expect(override).toEqual([3, 4])
  })

  it('mixed types concatenate', () => {
    expect(mergeArray([1, 'two'], [true])).toEqual([1, 'two', true])
  })
})

// ---------------------------------------------------------------------------
// resolveLayered
// ---------------------------------------------------------------------------

describe('resolveLayered', () => {
  it('empty layers returns empty object', () => {
    expect(resolveLayered([])).toEqual({})
  })

  it('single layer returns its own content', () => {
    const layer = { name: 'test', version: 1 }
    expect(resolveLayered([layer])).toEqual({ name: 'test', version: 1 })
  })

  it('two layers merges with last-wins for scalars', () => {
    const base = { a: 1, b: 'x' }
    const override = { b: 'y', c: true }
    expect(resolveLayered([base, override])).toEqual({ a: 1, b: 'y', c: true })
  })

  it('three layers applies in order — last wins for scalars', () => {
    const layers = [
      { val: 'first' },
      { val: 'second' },
      { val: 'third' },
    ]
    expect(resolveLayered(layers)).toEqual({ val: 'third' })
  })

  it('keyed array is merged across layers by code', () => {
    const base = { items: [{ code: 'a', label: 'Alpha' }] }
    const override = { items: [{ code: 'a', label: 'ALPHA' }, { code: 'b', label: 'Beta' }] }
    expect(resolveLayered([base, override])).toEqual({
      items: [
        { code: 'a', label: 'ALPHA' },
        { code: 'b', label: 'Beta' },
      ],
    })
  })

  it('plain array is concatenated across layers', () => {
    const base = { tags: ['one', 'two'] }
    const override = { tags: ['three'] }
    expect(resolveLayered([base, override])).toEqual({ tags: ['one', 'two', 'three'] })
  })

  it('table keys deep merged across layers', () => {
    const l1 = { settings: { theme: 'light', lang: 'en' } }
    const l2 = { settings: { theme: 'dark' } }
    expect(resolveLayered([l1, l2])).toEqual({ settings: { theme: 'dark', lang: 'en' } })
  })

  it('mixed keys (table + array + scalar) all handled correctly', () => {
    const l1 = {
      name: 'base',
      meta: { version: 1, stable: true },
      plugins: [{ code: 'foo', active: true }],
      tags: ['alpha'],
    }
    const l2 = {
      name: 'overlay',
      meta: { version: 2 },
      plugins: [{ code: 'bar', active: false }],
      tags: ['beta'],
    }
    expect(resolveLayered([l1, l2])).toEqual({
      name: 'overlay',
      meta: { version: 2, stable: true },
      plugins: [
        { code: 'foo', active: true },
        { code: 'bar', active: false },
      ],
      tags: ['alpha', 'beta'],
    })
  })

  it('key present only in later layer is included', () => {
    const l1 = { a: 1 }
    const l2 = { b: 2 }
    expect(resolveLayered([l1, l2])).toEqual({ a: 1, b: 2 })
  })

  it('three layers with keyed array — final replace wins', () => {
    const l1 = { items: [{ code: 'x', v: 1 }] }
    const l2 = { items: [{ code: 'x', v: 2 }] }
    const l3 = { items: [{ code: 'x', v: 3 }, { code: 'y', v: 10 }] }
    expect(resolveLayered([l1, l2, l3])).toEqual({
      items: [
        { code: 'x', v: 3 },
        { code: 'y', v: 10 },
      ],
    })
  })

  it('does not mutate input layer objects', () => {
    const l1 = { a: 1 }
    const l2 = { a: 2 }
    resolveLayered([l1, l2])
    expect(l1).toEqual({ a: 1 })
    expect(l2).toEqual({ a: 2 })
  })
})

// ---------------------------------------------------------------------------
// resolveLayered — provenance mode
// ---------------------------------------------------------------------------

describe('resolveLayered (provenance mode)', () => {
  // --- Default call returns T directly (not Resolved<T>) ---

  it('default call (no options) returns merged object directly', () => {
    const result = resolveLayered([{ a: 1, b: 'x' }])
    // result should be a plain TomlObject, not { merged, provenance }
    expect(result).toEqual({ a: 1, b: 'x' })
    expect((result as { merged?: unknown }).merged).toBeUndefined()
  })

  it('{ provenance: false } returns merged object directly', () => {
    const result = resolveLayered([{ a: 1 }], { provenance: false })
    expect(result).toEqual({ a: 1 })
    expect((result as { merged?: unknown }).merged).toBeUndefined()
  })

  // --- Single base layer: all keys have origin 'base' ---

  it('single layer — all keys have "base" origin', () => {
    const base: TomlObject = {
      icon: 'robot',
      name: 'Agent X',
      principles: ['think', 'act'],
    }
    const { merged, provenance } = resolveLayered([base], { provenance: true })

    expect(merged).toEqual(base)
    expect(provenance.icon).toBe('base')
    expect(provenance.name).toBe('base')
    expect(provenance.principles).toBe('base')
  })

  // --- Scalar overridden in layer 2 (user) → 'user' ---

  it('scalar overridden in layer 2 → origin is "user"', () => {
    const base: TomlObject = { icon: 'robot', name: 'Agent X' }
    const user: TomlObject = { icon: 'star' }

    const { merged, provenance } = resolveLayered([base, user], { provenance: true })

    expect(merged.icon).toBe('star')
    expect(provenance.icon).toBe('user')
    // name not overridden — still from base
    expect(provenance.name).toBe('base')
  })

  // --- Three layers: icon overridden in team → 'team' (AC: provenance.icon === 'team') ---

  it('three layers: icon overridden in team layer → provenance.icon === "team"', () => {
    const base: TomlObject = { icon: 'robot', version: 1 }
    const team: TomlObject = { icon: 'gear' }
    const user: TomlObject = { version: 2 }

    const { merged, provenance } = resolveLayered([base, team, user], { provenance: true })

    expect(merged.icon).toBe('gear')
    expect(provenance.icon).toBe('team')
    // version overridden in user
    expect(provenance.version).toBe('user')
  })

  // --- Three layers: user overrides scalar that team also touched → 'user' ---

  it('three layers: user overrides scalar last → provenance is "user"', () => {
    const base: TomlObject = { name: 'base-name' }
    const team: TomlObject = { name: 'team-name' }
    const user: TomlObject = { name: 'user-name' }

    const { provenance } = resolveLayered([base, team, user], { provenance: true })

    expect(provenance.name).toBe('user')
  })

  // --- Table with sub-key overridden → table key has 'merged' ---

  it('table with sub-key overridden → provenance for that key is "merged"', () => {
    const base: TomlObject = { meta: { version: 1, stable: true } }
    const user: TomlObject = { meta: { version: 2 } }

    const { merged, provenance } = resolveLayered([base, user], { provenance: true })

    expect((merged.meta as TomlObject).version).toBe(2)
    expect((merged.meta as TomlObject).stable).toBe(true)
    expect(provenance.meta).toBe('merged')
  })

  // --- Plain array appended → 'merged' (AC: provenance.principles === 'merged') ---

  it('plain array appended across layers → provenance.principles === "merged"', () => {
    const base: TomlObject = { principles: ['think'] }
    const team: TomlObject = { principles: ['plan'] }
    const user: TomlObject = { principles: ['act'] }

    const { merged, provenance } = resolveLayered([base, team, user], { provenance: true })

    expect(merged.principles).toEqual(['think', 'plan', 'act'])
    expect(provenance.principles).toBe('merged')
  })

  // --- Keyed array replaced/extended → 'merged' ---

  it('keyed array with override items → provenance is "merged"', () => {
    const base: TomlObject = { steps: [{ code: 'a', label: 'Alpha' }] }
    const user: TomlObject = { steps: [{ code: 'a', label: 'ALPHA' }, { code: 'b', label: 'Beta' }] }

    const { merged, provenance } = resolveLayered([base, user], { provenance: true })

    expect((merged.steps as TomlObject[])).toHaveLength(2)
    expect(provenance.steps).toBe('merged')
  })

  // --- Key only in one layer preserves correct origin ---

  it('key only in base — not touched by later layers — keeps "base" origin', () => {
    const base: TomlObject = { icon: 'robot', stable: true }
    const team: TomlObject = { icon: 'gear' }
    const user: TomlObject = {}

    const { provenance } = resolveLayered([base, team, user], { provenance: true })

    expect(provenance.stable).toBe('base')
  })

  it('key introduced only in team layer — origin is "team"', () => {
    const base: TomlObject = { name: 'x' }
    const team: TomlObject = { icon: 'gear' }
    const user: TomlObject = {}

    const { provenance } = resolveLayered([base, team, user], { provenance: true })

    expect(provenance.icon).toBe('team')
  })

  // --- Empty layers with provenance ---

  it('empty layers with provenance returns empty merged + empty provenance', () => {
    const { merged, provenance } = resolveLayered([], { provenance: true })
    expect(merged).toEqual({})
    expect(provenance).toEqual({})
  })

  // --- Four-layer name mapping ---

  it('four layers: scalar set in layer 2 (user_base) — origin is "user_base" (type-safe cast)', () => {
    const l1: TomlObject = { a: 1 }
    const l2: TomlObject = { b: 2 }    // user_base
    const l3: TomlObject = { c: 3 }    // team
    const l4: TomlObject = { d: 4 }    // user

    const { provenance } = resolveLayered([l1, l2, l3, l4], { provenance: true })

    expect(provenance.a).toBe('base')
    expect(provenance.b).toBe('user_base' as never)
    expect(provenance.c).toBe('team')
    expect(provenance.d).toBe('user')
  })
})

// ---------------------------------------------------------------------------
// resolveSkillCustomization
// ---------------------------------------------------------------------------

/** Helper: create a temp dir and return its path. Cleaned up after test. */
function makeTmpDir(): { dir: string; cleanup: () => void } {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bmad-skill-test-'))
  return {
    dir,
    cleanup: () => fs.rmSync(dir, { recursive: true, force: true }),
  }
}

/** Write a TOML file at `filePath`, creating intermediate dirs as needed. */
function writeToml(filePath: string, content: string): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, content, 'utf8')
}

describe('resolveSkillCustomization', () => {
  // 1. Base-only: only customize.toml present → result equals parsed base
  it('base-only: result equals parsed base when no overrides exist', () => {
    const { dir, cleanup } = makeTmpDir()
    try {
      const skillPath = path.join(dir, 'my-agent')
      writeToml(path.join(skillPath, 'customize.toml'), `
[agent]
name = "Alice"
icon = "🤖"
principles = ["Think first"]
`)
      const projectRoot = path.join(dir, 'project')
      fs.mkdirSync(path.join(projectRoot, '_bmad', 'custom'), { recursive: true })

      const result = resolveSkillCustomization(skillPath, projectRoot)
      const agent = result.agent as TomlObject
      expect(agent.name).toBe('Alice')
      expect(agent.icon).toBe('🤖')
      expect(agent.principles).toEqual(['Think first'])
    } finally {
      cleanup()
    }
  })

  // 2. Base + team override: team scalar overrides base scalar
  it('base + team: team scalar overrides base scalar', () => {
    const { dir, cleanup } = makeTmpDir()
    try {
      const skillPath = path.join(dir, 'my-agent')
      writeToml(path.join(skillPath, 'customize.toml'), `
[agent]
name = "Alice"
icon = "🤖"
`)
      const projectRoot = path.join(dir, 'project')
      writeToml(path.join(projectRoot, '_bmad', 'custom', 'my-agent.toml'), `
[agent]
icon = "⚙️"
`)

      const result = resolveSkillCustomization(skillPath, projectRoot)
      const agent = result.agent as TomlObject
      expect(agent.name).toBe('Alice')    // preserved from base
      expect(agent.icon).toBe('⚙️')      // overridden by team
    } finally {
      cleanup()
    }
  })

  // 3. Base + team + user override: user wins over team
  it('base + team + user: user wins over team', () => {
    const { dir, cleanup } = makeTmpDir()
    try {
      const skillPath = path.join(dir, 'my-agent')
      writeToml(path.join(skillPath, 'customize.toml'), `
[agent]
icon = "🤖"
name = "Alice"
`)
      const projectRoot = path.join(dir, 'project')
      writeToml(path.join(projectRoot, '_bmad', 'custom', 'my-agent.toml'), `
[agent]
icon = "⚙️"
`)
      writeToml(path.join(projectRoot, '_bmad', 'custom', 'my-agent.user.toml'), `
[agent]
icon = "🌟"
`)

      const result = resolveSkillCustomization(skillPath, projectRoot)
      const agent = result.agent as TomlObject
      expect(agent.icon).toBe('🌟')      // user wins
      expect(agent.name).toBe('Alice')   // preserved from base
    } finally {
      cleanup()
    }
  })

  // 4. Missing base: throws ManifestMissingError
  it('missing base customize.toml throws ManifestMissingError', () => {
    const { dir, cleanup } = makeTmpDir()
    try {
      const skillPath = path.join(dir, 'no-such-agent')
      const projectRoot = path.join(dir, 'project')
      fs.mkdirSync(path.join(projectRoot, '_bmad', 'custom'), { recursive: true })

      expect(() => resolveSkillCustomization(skillPath, projectRoot)).toThrow(ManifestMissingError)
    } finally {
      cleanup()
    }
  })

  // 5. Present but malformed layer: throws with path in message
  it('malformed base TOML throws ManifestParseError with path in message', () => {
    const { dir, cleanup } = makeTmpDir()
    try {
      const skillPath = path.join(dir, 'bad-agent')
      writeToml(path.join(skillPath, 'customize.toml'), `
[agent
name = "broken
`)
      const projectRoot = path.join(dir, 'project')
      fs.mkdirSync(path.join(projectRoot, '_bmad', 'custom'), { recursive: true })

      expect(() => resolveSkillCustomization(skillPath, projectRoot)).toThrow(ManifestParseError)
    } finally {
      cleanup()
    }
  })

  it('malformed optional team TOML throws ManifestParseError with path in message', () => {
    const { dir, cleanup } = makeTmpDir()
    try {
      const skillPath = path.join(dir, 'my-agent')
      writeToml(path.join(skillPath, 'customize.toml'), `
[agent]
name = "Alice"
`)
      const projectRoot = path.join(dir, 'project')
      writeToml(path.join(projectRoot, '_bmad', 'custom', 'my-agent.toml'), `
[agent
broken = "yes
`)

      expect(() => resolveSkillCustomization(skillPath, projectRoot)).toThrow(ManifestParseError)
    } finally {
      cleanup()
    }
  })

  // 6. options.provenance: true returns { merged, provenance } shape
  it('options.provenance: true returns Resolved<T> shape', () => {
    const { dir, cleanup } = makeTmpDir()
    try {
      const skillPath = path.join(dir, 'my-agent')
      writeToml(path.join(skillPath, 'customize.toml'), `
[agent]
name = "Alice"
icon = "🤖"
`)
      const projectRoot = path.join(dir, 'project')
      writeToml(path.join(projectRoot, '_bmad', 'custom', 'my-agent.toml'), `
[agent]
icon = "⚙️"
`)

      const result = resolveSkillCustomization(skillPath, projectRoot, { provenance: true })
      expect(result).toHaveProperty('merged')
      expect(result).toHaveProperty('provenance')
      const agent = (result.merged as TomlObject).agent as TomlObject
      expect(agent.name).toBe('Alice')
      expect(agent.icon).toBe('⚙️')
      // Top-level provenance key 'agent' should exist (table deep-merged)
      expect(result.provenance.agent).toBe('merged')
    } finally {
      cleanup()
    }
  })

  // 7. Missing optional layers treated as {}: no error thrown
  it('missing optional team and user layers are treated as {} — no error', () => {
    const { dir, cleanup } = makeTmpDir()
    try {
      const skillPath = path.join(dir, 'my-agent')
      writeToml(path.join(skillPath, 'customize.toml'), `
[agent]
name = "Alice"
`)
      // projectRoot exists but has no _bmad/custom/ directory at all
      const projectRoot = path.join(dir, 'project')
      fs.mkdirSync(projectRoot, { recursive: true })

      // Should not throw even though team/user files don't exist
      expect(() => resolveSkillCustomization(skillPath, projectRoot)).not.toThrow()
      const result = resolveSkillCustomization(skillPath, projectRoot)
      const agent = result.agent as TomlObject
      expect(agent.name).toBe('Alice')
    } finally {
      cleanup()
    }
  })
})
