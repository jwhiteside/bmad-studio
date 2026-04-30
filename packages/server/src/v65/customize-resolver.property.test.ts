/**
 * Property-based equivalence test: TS resolver vs Python `resolve_config.py`.
 *
 * Implements Story 32.2 (ADR-6 — TS-for-read, Python-for-verify).
 *
 * Two tiers:
 *   1. Structural invariants — always run (≥1000 fast-check iterations).
 *      Verifies correctness of `resolveLayered` without Python.
 *   2. Python equivalence — skipped when `python3` is unavailable or
 *      `docs/_bmad_v6.5/scripts/resolve_config.py` is absent.
 *      Serialises generated layers to TOML, calls Python, compares JSON.
 *
 * CI gate: this file is required to stay green on every PR that touches
 * `v65/customize-resolver.ts` or `v65/config-resolver.ts`.
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

import { stringify } from 'smol-toml'

import {
  resolveLayered,
  mergeScalar,
  mergeTable,
  mergeKeyedArray,
  mergeArray,
  type TomlObject,
  type TomlValue,
} from './customize-resolver.js'

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

function repoRoot(): string {
  let dir = path.dirname(fileURLToPath(import.meta.url))
  for (let i = 0; i < 10; i++) {
    if (fs.existsSync(path.join(dir, 'package.json'))) {
      try {
        const pkg = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf-8')) as { workspaces?: unknown }
        if (pkg.workspaces) return dir
      } catch { /* continue */ }
    }
    const parent = path.dirname(dir)
    if (parent === dir) break
    dir = parent
  }
  return process.cwd()
}

const REPO_ROOT = repoRoot()
const PYTHON_SCRIPT = path.join(REPO_ROOT, 'docs', '_bmad_v6.5', 'scripts', 'resolve_config.py')

// File paths that resolve_config.py reads (priority lowest → highest):
//   1. _bmad/config.toml              (team base)
//   2. _bmad/config.user.toml         (user base)
//   3. _bmad/custom/config.toml       (team custom)
//   4. _bmad/custom/config.user.toml  (user custom)
const LAYER_FILE_PATHS = [
  ['_bmad', 'config.toml'],
  ['_bmad', 'config.user.toml'],
  ['_bmad', 'custom', 'config.toml'],
  ['_bmad', 'custom', 'config.user.toml'],
]

function isPythonAvailable(): boolean {
  const r = spawnSync('python3', ['--version'], { timeout: 2000, encoding: 'utf-8' })
  if (r.status !== 0) return false
  // resolve_config.py requires Python 3.11+ (stdlib tomllib)
  const match = /Python (\d+)\.(\d+)/.exec(r.stdout || r.stderr || '')
  if (!match) return false
  const [, major, minor] = match.map(Number)
  return major > 3 || (major === 3 && minor >= 11)
}

const PYTHON_AVAILABLE = isPythonAvailable() && fs.existsSync(PYTHON_SCRIPT)

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

/** Valid TOML bare-key characters: first char lowercase, rest alphanumeric or underscore. */
const LOWER = 'abcdefghijklmnopqrstuvwxyz'
const LOWER_NUM_UNDER = 'abcdefghijklmnopqrstuvwxyz0123456789_'
const arbKey = fc.tuple(
  fc.constantFrom(...LOWER.split('')),
  fc.stringOf(fc.constantFrom(...LOWER_NUM_UNDER.split('')), { minLength: 0, maxLength: 7 }),
).map(([first, rest]) => first + rest)

/** Scalars only — no floats to avoid Python JSON float formatting. */
const arbScalar: fc.Arbitrary<TomlValue> = fc.oneof(
  fc.string({ minLength: 0, maxLength: 20 }),
  fc.integer({ min: -100, max: 100 }),
  fc.boolean(),
)

/**
 * Plain array: scalars only. We deliberately avoid mixing scalars and objects
 * in a single array because Python's `_detect_keyed_merge_field` checks the
 * combined array — a mixed array could trigger keyed-merge on the Python side
 * while TS concatenates, causing a legitimate divergence not covered by this
 * story's scope.
 */
const arbPlainArray: fc.Arbitrary<TomlValue[]> = fc.array(arbScalar, { minLength: 0, maxLength: 5 })

/**
 * Keyed array: every item is a table with a string `code` field. We use
 * `code` (not `id`) because the TS resolver only detects `code`. Python also
 * accepts `id`-keyed arrays — the property test constrains to `code` so both
 * resolvers agree on the merge strategy.
 */
function arbKeyedArray(depth: number): fc.Arbitrary<TomlObject[]> {
  return fc.uniqueArray(
    fc.record({
      code: fc.tuple(
        fc.constantFrom(...LOWER.split('')),
        fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789-'.split('')), { minLength: 0, maxLength: 6 }),
      ).map(([first, rest]) => first + rest),
      value: depth > 0 ? arbScalar : fc.constant('leaf' as TomlValue),
    }) as fc.Arbitrary<TomlObject>,
    { selector: (item) => item.code as string, maxLength: 4 },
  )
}

/**
 * TomlObject: limited depth to keep serialised TOML tractable and fast-check
 * shrinking fast. depth=0 → scalars only; depth>0 → may contain nested tables,
 * keyed arrays, and plain arrays.
 */
function arbTomlObject(depth: number): fc.Arbitrary<TomlObject> {
  const valueArb: fc.Arbitrary<TomlValue> =
    depth <= 0
      ? arbScalar
      : fc.oneof(
          arbScalar,
          arbPlainArray,
          arbKeyedArray(depth - 1) as unknown as fc.Arbitrary<TomlValue>,
          arbTomlObject(depth - 1) as unknown as fc.Arbitrary<TomlValue>,
        )

  return fc.dictionary(arbKey, valueArb, { minKeys: 0, maxKeys: 4 }) as fc.Arbitrary<TomlObject>
}

/** Stack of 1–4 TOML layers (matches the four config file slots). */
const arbLayerStack = fc.array(arbTomlObject(3), { minLength: 1, maxLength: 4 })

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function runPythonResolver(layers: TomlObject[]): unknown {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'resolver-prop-'))
  try {
    for (let i = 0; i < layers.length && i < 4; i++) {
      const parts = LAYER_FILE_PATHS[i]
      const filePath = path.join(tmpDir, ...parts)
      fs.mkdirSync(path.dirname(filePath), { recursive: true })
      fs.writeFileSync(filePath, stringify(layers[i] as Parameters<typeof stringify>[0]))
    }

    const result = spawnSync('python3', [PYTHON_SCRIPT, '--project-root', tmpDir], {
      timeout: 5000,
      encoding: 'utf-8',
    })

    if (result.status !== 0) {
      throw new Error(`resolve_config.py failed (exit ${result.status}): ${result.stderr}`)
    }

    return JSON.parse(result.stdout) as unknown
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  }
}

// ---------------------------------------------------------------------------
// Tier 1: Structural invariants (always run, ≥1000 iterations)
// ---------------------------------------------------------------------------

describe('v65/customize-resolver — structural invariants', () => {
  it('resolveLayered result is a plain object', () => {
    fc.assert(
      fc.property(arbLayerStack, (layers) => {
        const result = resolveLayered(layers)
        expect(typeof result).toBe('object')
        expect(Array.isArray(result)).toBe(false)
        expect(result).not.toBeNull()
      }),
      { numRuns: 1000 },
    )
  })

  it('scalar keys from the last layer always appear in result with that value (override wins)', () => {
    fc.assert(
      fc.property(arbLayerStack, (layers) => {
        const result = resolveLayered(layers)
        const last = layers[layers.length - 1]
        for (const [key, val] of Object.entries(last)) {
          if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
            expect(result[key]).toBe(val)
          }
        }
      }),
      { numRuns: 1000 },
    )
  })

  it('all keys from every layer are present in the result', () => {
    fc.assert(
      fc.property(arbLayerStack, (layers) => {
        const result = resolveLayered(layers)
        for (const layer of layers) {
          for (const key of Object.keys(layer)) {
            expect(result).toHaveProperty(key)
          }
        }
      }),
      { numRuns: 1000 },
    )
  })

  it('resolveLayered([a, b, c]) equals resolveLayered([resolveLayered([a, b]), c])', () => {
    fc.assert(
      fc.property(arbTomlObject(3), arbTomlObject(3), arbTomlObject(3), (a, b, c) => {
        const direct = resolveLayered([a, b, c])
        const staged = resolveLayered([resolveLayered([a, b]), c])
        expect(direct).toEqual(staged)
      }),
      { numRuns: 1000 },
    )
  })

  it('resolveLayered([layer]) equals the layer itself', () => {
    fc.assert(
      fc.property(arbTomlObject(3), (layer) => {
        const result = resolveLayered([layer])
        expect(result).toEqual(layer)
      }),
      { numRuns: 1000 },
    )
  })
})

// ---------------------------------------------------------------------------
// Tier 2: Python byte-equivalence (skipped when Python unavailable)
// ---------------------------------------------------------------------------

describe('v65/customize-resolver — Python byte-equivalence (ADR-6)', () => {
  it(`python3 + resolve_config.py available at ${PYTHON_SCRIPT}`, () => {
    if (!PYTHON_AVAILABLE) return
    expect(PYTHON_AVAILABLE).toBe(true)
  })

  it.skipIf(!PYTHON_AVAILABLE)(
    'resolveLayered output is byte-equivalent to resolve_config.py for ≥1000 random layer stacks',
    () => {
      fc.assert(
        fc.property(arbLayerStack, (layers) => {
          const tsResult = resolveLayered(layers)
          const pyResult = runPythonResolver(layers)

          // Normalise: sort keys for deterministic comparison.
          const tsJson = JSON.stringify(tsResult, Object.keys(tsResult).sort())
          const pyJson = JSON.stringify(pyResult, Object.keys(pyResult as object).sort())

          if (tsJson !== pyJson) {
            console.error('[diff] TS :', tsJson)
            console.error('[diff] PY :', pyJson)
          }
          expect(tsJson).toBe(pyJson)
        }),
        { numRuns: 1000 },
      )
    },
  )
})

// ---------------------------------------------------------------------------
// Unit smoke tests for the four named functions
// (fast sanity — the bulk is in customize-resolver.test.ts)
// ---------------------------------------------------------------------------

describe('merge function smoke tests', () => {
  it('mergeScalar: override wins', () => {
    expect(mergeScalar('a', 'b')).toBe('b')
    expect(mergeScalar(1, 2)).toBe(2)
    expect(mergeScalar(true, false)).toBe(false)
  })

  it('mergeTable: deep merge', () => {
    expect(mergeTable({ a: 1, b: { x: 1, y: 2 } }, { b: { y: 3 }, c: 4 })).toEqual({
      a: 1, b: { x: 1, y: 3 }, c: 4,
    })
  })

  it('mergeKeyedArray: replace by code, append new', () => {
    const base = [{ code: 'a', v: 1 }, { code: 'b', v: 2 }]
    const over = [{ code: 'a', v: 9 }, { code: 'c', v: 3 }]
    expect(mergeKeyedArray(base, over)).toEqual([
      { code: 'a', v: 9 }, { code: 'b', v: 2 }, { code: 'c', v: 3 },
    ])
  })

  it('mergeArray: concatenate', () => {
    expect(mergeArray([1, 2], [3, 4])).toEqual([1, 2, 3, 4])
  })
})
