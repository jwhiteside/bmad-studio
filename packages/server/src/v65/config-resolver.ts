/**
 * Four-layer central config resolver for BMAD v6.5.
 *
 * Mirrors the Python `resolve_config.py` logic by folding four TOML layers
 * (lowest → highest priority) using `resolveLayered`.
 *
 * Layer order:
 *   1. <projectRoot>/_bmad/config.toml              (team base — required)
 *   2. <projectRoot>/_bmad/config.user.toml          (user base — optional)
 *   3. <projectRoot>/_bmad/custom/config.toml        (team custom — optional)
 *   4. <projectRoot>/_bmad/custom/config.user.toml   (user custom — optional)
 */

import * as fs from 'node:fs'
import * as path from 'node:path'
import { parse } from 'smol-toml'
import { resolveLayered } from './customize-resolver.js'
import { ManifestMissingError, ManifestParseError } from '../core/errors.js'
import type { TomlObject } from './customize-resolver.js'
import type { Resolved } from '@bmad-studio/shared'

export interface CentralConfigOptions {
  provenance?: boolean
}

// ---------------------------------------------------------------------------
// Private helper
// ---------------------------------------------------------------------------

/**
 * Reads a single TOML layer from disk.
 *
 * @param filePath  - absolute path to the TOML file
 * @param required  - when true, throws `ManifestMissingError` if the file is absent;
 *                    when false, returns `{}` for absent files
 *
 * @throws ManifestMissingError  when `required` is true and the file does not exist.
 * @throws ManifestParseError    when the file exists but cannot be parsed as valid TOML.
 */
function readLayer(filePath: string, required: boolean): TomlObject {
  let raw: string
  try {
    raw = fs.readFileSync(filePath, 'utf8')
  } catch (err: unknown) {
    const nodeErr = err as NodeJS.ErrnoException
    if (nodeErr.code === 'ENOENT') {
      if (required) {
        throw new ManifestMissingError(
          `Central config not found at: ${filePath}`,
          { path: filePath },
        )
      }
      return {}
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

// ---------------------------------------------------------------------------
// resolveCentralConfig — overload signatures
// ---------------------------------------------------------------------------

export function resolveCentralConfig(
  projectRoot: string,
  options: { provenance: true },
): Resolved<TomlObject>
export function resolveCentralConfig(
  projectRoot: string,
  options?: CentralConfigOptions,
): TomlObject
export function resolveCentralConfig(
  projectRoot: string,
  options?: CentralConfigOptions,
): TomlObject | Resolved<TomlObject> {
  const bmadDir = path.join(projectRoot, '_bmad')
  const customDir = path.join(bmadDir, 'custom')

  // Layer 1: team base (required)
  const layer1 = readLayer(path.join(bmadDir, 'config.toml'), true)
  // Layer 2: user base (optional)
  const layer2 = readLayer(path.join(bmadDir, 'config.user.toml'), false)
  // Layer 3: team custom (optional)
  const layer3 = readLayer(path.join(customDir, 'config.toml'), false)
  // Layer 4: user custom (optional)
  const layer4 = readLayer(path.join(customDir, 'config.user.toml'), false)

  const layers = [layer1, layer2, layer3, layer4]

  if (options?.provenance === true) {
    return resolveLayered<TomlObject>(layers, { provenance: true })
  }
  return resolveLayered<TomlObject>(layers)
}
