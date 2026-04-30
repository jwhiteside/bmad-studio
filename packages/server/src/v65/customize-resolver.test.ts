import { describe, it, expect } from 'vitest'

import {
  mergeScalar,
  mergeTable,
  mergeKeyedArray,
  mergeArray,
  resolveLayered,
} from './customize-resolver.js'

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
