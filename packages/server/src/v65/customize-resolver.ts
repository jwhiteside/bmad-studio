/**
 * Resolver primitives for BMAD v6.5 layered TOML configuration.
 *
 * Implements the four structural merge rules that mirror the Python
 * `resolve_config.py` logic from the BMAD v6.5 reference implementation.
 *
 * Rule summary:
 *   - Scalar  — last layer wins
 *   - Table   — deep merge, later keys win
 *   - Keyed array — items matched by `code` field replace base; new codes append
 *   - Plain array — concatenate: [...base, ...override]
 */

export type TomlValue = string | number | boolean | TomlValue[] | TomlObject
export type TomlObject = { [key: string]: TomlValue }

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Returns true when `v` is a plain object (not an array, not null). */
function isTomlObject(v: unknown): v is TomlObject {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

/**
 * Returns true when every element of `arr` is a `TomlObject` that has a
 * string `code` property — i.e. the array qualifies for keyed-array merge.
 */
function isKeyedArray(arr: TomlValue[]): arr is TomlObject[] {
  return arr.every(
    (item) => isTomlObject(item) && typeof (item as TomlObject).code === 'string',
  )
}

// ---------------------------------------------------------------------------
// Four named merge functions
// ---------------------------------------------------------------------------

/**
 * Override wins. Corresponds to scalar-field assignment in resolve_config.py.
 */
export function mergeScalar(base: TomlValue, override: TomlValue): TomlValue {
  void base
  return override
}

/**
 * Deep merge for TOML tables. Corresponds to dict merge logic in resolve_config.py.
 *
 * Starts with a shallow copy of `base`, then for each key in `override`:
 * - If both sides are `TomlObject` (not arrays) → recurse with `mergeTable`.
 * - Otherwise → `mergeScalar` (override wins).
 */
export function mergeTable(base: TomlObject, override: TomlObject): TomlObject {
  const result: TomlObject = { ...base }
  for (const [key, overrideVal] of Object.entries(override)) {
    const baseVal = result[key]
    if (isTomlObject(baseVal) && isTomlObject(overrideVal)) {
      result[key] = mergeTable(baseVal, overrideVal)
    } else {
      result[key] = mergeScalar(baseVal as TomlValue, overrideVal)
    }
  }
  return result
}

/**
 * Keyed-array merge: items matched by `code` field replace base; new codes
 * append. Corresponds to keyed-list merge in resolve_config.py.
 *
 * Base items are indexed by `code`. Each override item calls `Map.set`, so an
 * existing code is replaced in place and a new code is appended. The final
 * order is: all base codes (replaced or unchanged) followed by new codes from
 * override, in the order they first appeared.
 */
export function mergeKeyedArray(base: TomlObject[], override: TomlObject[]): TomlObject[] {
  const map = new Map<string, TomlObject>()
  for (const item of base) {
    map.set(item.code as string, item)
  }
  for (const item of override) {
    map.set(item.code as string, item)
  }
  return [...map.values()]
}

/**
 * Plain array merge: concatenate base then override. Corresponds to list
 * append in resolve_config.py.
 */
export function mergeArray(base: TomlValue[], override: TomlValue[]): TomlValue[] {
  return [...base, ...override]
}

// ---------------------------------------------------------------------------
// resolveLayered
// ---------------------------------------------------------------------------

/**
 * Fold a stack of TOML layers left-to-right starting with `{}`.
 *
 * For each pair of values sharing a key, the merge strategy is:
 * - Both `TomlObject` (not arrays) → `mergeTable` (deep merge)
 * - Both arrays, every element has a string `code` → `mergeKeyedArray`
 * - Both arrays (plain) → `mergeArray` (concatenate)
 * - Otherwise → `mergeScalar` (override wins)
 *
 * An empty `layers` array returns `{} as T`.
 */
export function resolveLayered<T extends TomlObject>(layers: TomlObject[]): T {
  let result: TomlObject = {}

  for (const layer of layers) {
    const merged: TomlObject = { ...result }
    for (const [key, overrideVal] of Object.entries(layer)) {
      const baseVal = merged[key]

      if (baseVal === undefined) {
        // Key only in this layer — take it as-is.
        merged[key] = overrideVal
      } else if (isTomlObject(baseVal) && isTomlObject(overrideVal)) {
        merged[key] = mergeTable(baseVal, overrideVal)
      } else if (Array.isArray(baseVal) && Array.isArray(overrideVal)) {
        if (isKeyedArray(baseVal) && isKeyedArray(overrideVal)) {
          merged[key] = mergeKeyedArray(baseVal, overrideVal)
        } else {
          merged[key] = mergeArray(baseVal, overrideVal)
        }
      } else {
        merged[key] = mergeScalar(baseVal, overrideVal)
      }
    }
    result = merged
  }

  return result as T
}
