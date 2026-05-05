/**
 * E46 Story 46.1 — Drift detector: SHA-256 scan vs `files-manifest.csv`.
 *
 * Reads `_bmad/_config/files-manifest.csv` and compares the expected hash in
 * each row to the actual SHA-256 of the corresponding file on disk.
 * Returns a list of `DriftedFile` records for files that differ.
 *
 * - Files listed in the manifest but absent on disk are treated as drifted.
 * - Files NOT listed in the manifest are ignored.
 * - `files-manifest.csv` absent → returns `[]` (drift detection disabled).
 */

import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

import Papa from 'papaparse'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DriftedFile = {
  /** Path relative to `_bmad/` as stored in the manifest. */
  relativePath: string
  /** Absolute path on disk. */
  absolutePath: string
  /** SHA-256 hex from the manifest. */
  expectedHash: string
  /** SHA-256 hex of the file as found on disk, or `null` if missing. */
  actualHash: string | null
}

// ---------------------------------------------------------------------------
// Internal CSV row shape
// ---------------------------------------------------------------------------

type FilesManifestRow = {
  type: string
  name: string
  module: string
  path: string
  hash: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const BMAD_DIR = '_bmad'
const CONFIG_DIR = path.join(BMAD_DIR, '_config')
const FILES_MANIFEST_CSV = 'files-manifest.csv'

function filesManifestPath(projectRoot: string): string {
  return path.join(projectRoot, CONFIG_DIR, FILES_MANIFEST_CSV)
}

function hashFile(filePath: string): string | null {
  try {
    const content = fs.readFileSync(filePath)
    return crypto.createHash('sha256').update(content).digest('hex')
  } catch {
    return null
  }
}

function parseFilesManifest(projectRoot: string): FilesManifestRow[] | null {
  const csvPath = filesManifestPath(projectRoot)
  if (!fs.existsSync(csvPath)) return null

  const raw = fs.readFileSync(csvPath, 'utf-8')
  const result = Papa.parse<FilesManifestRow>(raw, {
    header: true,
    skipEmptyLines: true,
    transform: (v) => v,
  })
  if (result.errors.length > 0 || !result.data.length) return null
  return result.data
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Run a drift scan for a v6.5 project root.
 *
 * @returns `null` when `files-manifest.csv` is absent (detection disabled).
 * @returns Array of `DriftedFile` records (may be empty if no drift).
 */
export function scanDrift(projectRoot: string): DriftedFile[] | null {
  const rows = parseFilesManifest(projectRoot)
  if (rows === null) return null

  const drifted: DriftedFile[] = []

  for (const row of rows) {
    const { path: relPath, hash: expectedHash } = row
    if (!relPath || !expectedHash) continue

    // paths in the manifest are relative to _bmad/ e.g. "bmm/skill.md" or "_config/manifest.yaml"
    const absolutePath = path.join(projectRoot, BMAD_DIR, relPath)
    const actualHash = hashFile(absolutePath)

    if (actualHash !== expectedHash) {
      drifted.push({ relativePath: relPath, absolutePath, expectedHash, actualHash })
    }
  }

  return drifted
}
