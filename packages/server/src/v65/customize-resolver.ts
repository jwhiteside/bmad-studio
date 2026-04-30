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

import * as fs from 'node:fs'
import * as path from 'node:path'
import { parse } from 'smol-toml'
import type { LayerOrigin, Resolved } from '@bmad-studio/shared'
import { ManifestMissingError, ManifestParseError } from '../core/errors.js'

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
 * Maps a layers-array length to the canonical layer name sequence used for
 * provenance tracking.
 *
 *   1 layer  → ['base']
 *   2 layers → ['base', 'user']
 *   3 layers → ['base', 'team', 'user']
 *   4 layers → ['base', 'user_base', 'team', 'user']
 */
function layerNames(count: number): LayerOrigin[] {
  switch (count) {
    case 0:
      return []
    case 1:
      return ['base']
    case 2:
      return ['base', 'user']
    case 3:
      return ['base', 'team', 'user']
    default:
      // 4+ layers: first is 'base', second is 'user_base', second-to-last is
      // 'team', last is 'user'. Extra middle layers fall back to 'merged'.
      return ['base', 'user_base', 'team', 'user'].slice(0, count) as LayerOrigin[]
  }
}

/**
 * Classify how a key changed when a new layer is applied.
 * Returns the LayerOrigin to assign to `key` after merging `baseVal` with `overrideVal`.
 *
 * @param baseVal       - accumulated value before this layer (undefined = new key)
 * @param overrideVal   - value from the current layer
 * @param currentLayerName - canonical name for this layer index
 * @param existingOrigin   - the provenance recorded for this key so far (used when
 *                           a no-op override should leave the origin unchanged)
 */
function provenanceForKey(
  baseVal: TomlValue | undefined,
  overrideVal: TomlValue,
  currentLayerName: LayerOrigin,
  existingOrigin: LayerOrigin | undefined,
): LayerOrigin {
  if (baseVal === undefined) {
    // Brand-new key introduced by this layer.
    return currentLayerName
  }
  if (isTomlObject(baseVal) && isTomlObject(overrideVal)) {
    // Table merge — sub-keys may come from different layers → 'merged'.
    return 'merged'
  }
  if (Array.isArray(baseVal) && Array.isArray(overrideVal)) {
    if (overrideVal.length === 0) {
      // Override contributes nothing — preserve existing origin.
      return existingOrigin ?? currentLayerName
    }
    // Any non-empty array modification (append or keyed-replace) → 'merged'.
    return 'merged'
  }
  // Scalar: the current layer wins.
  return currentLayerName
}

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
 *
 * When called with `{ provenance: true }`, returns `Resolved<T>` — the merged
 * object plus a top-level provenance map recording which layer last contributed
 * each field. The non-provenance path has zero overhead.
 */
export function resolveLayered<T extends TomlObject>(
  layers: TomlObject[],
  options?: { provenance?: false },
): T
export function resolveLayered<T extends TomlObject>(
  layers: TomlObject[],
  options: { provenance: true },
): Resolved<T>
export function resolveLayered<T extends TomlObject>(
  layers: TomlObject[],
  options?: { provenance?: boolean },
): T | Resolved<T> {
  const trackProvenance = options?.provenance === true
  const names = trackProvenance ? layerNames(layers.length) : []

  let result: TomlObject = {}
  let prov: Record<string, LayerOrigin> = {}

  for (let i = 0; i < layers.length; i++) {
    const layer = layers[i]
    const layerName = names[i] as LayerOrigin | undefined
    const merged: TomlObject = { ...result }
    const nextProv: Record<string, LayerOrigin> = trackProvenance ? { ...prov } : prov

    for (const [key, overrideVal] of Object.entries(layer)) {
      const baseVal = merged[key]

      if (baseVal === undefined) {
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

      if (trackProvenance && layerName !== undefined) {
        nextProv[key] = provenanceForKey(baseVal, overrideVal, layerName, prov[key])
      }
    }

    result = merged
    if (trackProvenance) {
      prov = nextProv
    }
  }

  if (trackProvenance) {
    return { merged: result as T, provenance: prov }
  }
  return result as T
}

// ---------------------------------------------------------------------------
// resolveSkillCustomization
// ---------------------------------------------------------------------------

export interface SkillCustomizationOptions {
  provenance?: boolean
}

/**
 * Reads a single TOML layer file from disk. Returns parsed object, or `{}`
 * if the file does not exist (for optional layers).
 *
 * @throws ManifestParseError when the file exists but cannot be parsed.
 */
function readTomlLayer(filePath: string, required: boolean): TomlObject {
  let raw: string
  try {
    raw = fs.readFileSync(filePath, 'utf8')
  } catch (err: unknown) {
    if (!required && (err as NodeJS.ErrnoException).code === 'ENOENT') {
      return {}
    }
    if (required && (err as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new ManifestMissingError(
        `Base customize.toml not found at: ${filePath}`,
        { path: filePath },
      )
    }
    throw err
  }

  try {
    return parse(raw) as TomlObject
  } catch (cause: unknown) {
    const msg = cause instanceof Error ? cause.message : String(cause)
    throw new ManifestParseError(`Failed to parse TOML at ${filePath}: ${msg}`, {
      path: filePath,
      cause,
    })
  }
}

/**
 * Reads the three per-skill TOML layers for `skillPath` and folds them
 * using `resolveLayered`. Returns the merged object, or `Resolved<T>` when
 * `options.provenance` is true.
 *
 * Layer order (lowest → highest priority):
 *   1. <skillPath>/customize.toml    — base (required)
 *   2. <projectRoot>/_bmad/custom/<skillName>.toml  — team (optional)
 *   3. <projectRoot>/_bmad/custom/<skillName>.user.toml — user (optional)
 *
 * @throws ManifestParseError when a present layer file cannot be parsed as TOML.
 * @throws ManifestMissingError when <skillPath>/customize.toml is absent.
 */
export function resolveSkillCustomization(
  skillPath: string,
  projectRoot: string,
  options: { provenance: true },
): Resolved<TomlObject>
export function resolveSkillCustomization(
  skillPath: string,
  projectRoot: string,
  options?: SkillCustomizationOptions,
): TomlObject
export function resolveSkillCustomization(
  skillPath: string,
  projectRoot: string,
  options?: SkillCustomizationOptions,
): TomlObject | Resolved<TomlObject> {
  const skillName = path.basename(skillPath)

  const basePath = path.join(skillPath, 'customize.toml')
  const teamPath = path.join(projectRoot, '_bmad', 'custom', `${skillName}.toml`)
  const userPath = path.join(projectRoot, '_bmad', 'custom', `${skillName}.user.toml`)

  const baseLayer = readTomlLayer(basePath, true)
  const teamLayer = readTomlLayer(teamPath, false)
  const userLayer = readTomlLayer(userPath, false)

  const layers = [baseLayer, teamLayer, userLayer]

  if (options?.provenance === true) {
    return resolveLayered<TomlObject>(layers, { provenance: true })
  }
  return resolveLayered<TomlObject>(layers)
}
