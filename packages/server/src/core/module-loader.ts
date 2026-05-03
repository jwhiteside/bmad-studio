/**
 * Strangler-fig facade for BMAD module loading.
 *
 * Implements ADR-3 (Strangler-Fig Adapter at Entry Point) from
 * `_bmad-output/planning-artifacts/architecture-v65-migration.md`.
 *
 * Single entry point: detects v6 vs v6.5 once, routes to the correct adapter.
 * v6 path delegates to the existing `app.fileStore.getIndex()` flow (unchanged).
 * v6.5 path uses `loadManifestCached` to return parsed manifest data (Story 31.4).
 *
 * **Detection signal refinement (Story 31.1).** The architecture originally
 * specified `_bmad/_config/manifest.yaml` presence as the v6.5 marker, but
 * code reconnaissance found that v6 projects can also have `manifest.yaml`.
 * The unique-to-v6.5 marker is `_bmad/_config/skill-manifest.csv`. This file
 * implements that refinement; the architecture change log records the swap.
 */

import fs from 'node:fs'
import path from 'node:path'
import type { FastifyInstance } from 'fastify'

import type {
  BmadHelpEntry,
  EntityIndex,
  ModuleManifestFile,
  SkillManifestEntry,
} from '@bmad-studio/shared'

import { ManifestMissingError } from './errors.js'
import { loadManifestCached, watchManifest } from '../v65/manifest-loader.js'

export { ManifestMissingError } from './errors.js'
export { invalidateCache, watchManifest } from '../v65/manifest-loader.js'

/** Detected BMAD format version. */
export type BmadVersion = 'v6' | 'v65'

/**
 * Detect the BMAD version for a given project root.
 *
 * Returns 'v65' when `_bmad/_config/skill-manifest.csv` is present;
 * 'v6' otherwise. The skill-manifest.csv file is uniquely shipped by the
 * v6.5 installer (`_bmad/_config/manifest.yaml` is shared with v6 and is
 * NOT a reliable discriminator).
 */
export function detectVersion(projectRoot: string): BmadVersion {
  const skillManifest = path.join(projectRoot, '_bmad', '_config', 'skill-manifest.csv')
  return fs.existsSync(skillManifest) ? 'v65' : 'v6'
}

/**
 * Result of a `ModuleLoader.load()` call.
 *
 * v6 path returns the existing `EntityIndex` shape (no behavioural change).
 * v6.5 path returns the parsed manifest data from `loadManifestCached` (Story 31.4).
 */
export type LoadResult =
  | { version: 'v6'; index: EntityIndex }
  | { version: 'v65'; modules: ModuleManifestFile; skills: SkillManifestEntry[]; help: BmadHelpEntry[] }

/**
 * Single entry point for BMAD project loading. Constructed once per app
 * instance; pass `app` so `load()` can use the pino logger and access
 * `app.fileStore` for the v6 path.
 *
 * Usage:
 * ```ts
 * const loader = new ModuleLoader(app)
 * const result = await loader.load(projectRoot)
 * if (result.version === 'v6') { /* use result.index *\/ }
 * ```
 */
export class ModuleLoader {
  constructor(private app: FastifyInstance) {}

  /**
   * Load the BMAD project at `projectRoot`. Detects version, logs the
   * detection event, dispatches to the appropriate adapter.
   *
   * @throws ManifestMissingError when `_bmad/` is absent under projectRoot,
   *   or when v6 dispatch is selected but `app.fileStore` is unavailable
   *   (project not registered with the server).
   */
  async load(projectRoot: string): Promise<LoadResult> {
    const bmadDir = path.join(projectRoot, '_bmad')
    if (!fs.existsSync(bmadDir)) {
      throw new ManifestMissingError(
        `No _bmad/ directory at ${projectRoot}. Run \`npx bmad-method install\` first.`,
        { projectRoot, expectedPath: bmadDir },
      )
    }

    const version = detectVersion(projectRoot)
    this.app.log.info({ event: 'v65.version.detected', projectRoot, version })

    if (version === 'v6') {
      const fileStore = (
        this.app as FastifyInstance & { fileStore?: { getIndex: () => EntityIndex } }
      ).fileStore
      if (!fileStore) {
        throw new ManifestMissingError(
          'No project registered (fileStore unavailable on app instance).',
          { projectRoot },
        )
      }
      return { version: 'v6', index: fileStore.getIndex() }
    }

    // v6.5 — load real manifest data via the two-tier cache (Story 31.4).
    // Register the chokidar watcher the first time we see this projectRoot (Story 31.5).
    watchManifest(projectRoot)
    const { modules, skills, help } = loadManifestCached(projectRoot)
    return { version: 'v65', modules, skills, help }
  }
}
