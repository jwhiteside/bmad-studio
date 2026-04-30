/**
 * Drift detector — Story 36.1
 *
 * Scans the project's `_bmad/` tree against the SHA-256 hashes recorded in
 * `_bmad/_config/files-manifest.csv`. Returns the list of files whose actual
 * hash differs from the expected hash. Used by the drift badge / drift list
 * UI to surface user-edited files that no longer match the v6.5 baseline.
 *
 * Behavior (FR47): the manifest is optional. If `_bmad/_config/files-manifest.csv`
 * is missing the function returns `[]` and drift detection is silently disabled.
 */

import path from 'node:path'
import fs from 'node:fs'
import crypto from 'node:crypto'

import Papa from 'papaparse'

export type DriftedFile = { path: string; expectedHash: string; actualHash: string }

type ManifestRow = {
  type: string
  name: string
  module: string
  path: string
  hash: string
}

export async function scanDrift(projectRoot: string): Promise<DriftedFile[]> {
  const manifestPath = path.join(projectRoot, '_bmad', '_config', 'files-manifest.csv')

  if (!fs.existsSync(manifestPath)) {
    return [] // FR47 — silently disable when manifest absent
  }

  const csvText = fs.readFileSync(manifestPath, 'utf-8')
  const { data } = Papa.parse<ManifestRow>(csvText, {
    header: true,
    skipEmptyLines: true,
  })

  const drifted: DriftedFile[] = []

  await Promise.all(
    data.map(async (row) => {
      if (!row || !row.path || !row.hash) return
      const absolutePath = path.join(projectRoot, '_bmad', row.path)
      if (!fs.existsSync(absolutePath)) return // file removed — out of scope here

      const actualHash = await computeSha256(absolutePath)
      if (actualHash !== row.hash) {
        drifted.push({ path: row.path, expectedHash: row.hash, actualHash })
      }
    }),
  )

  // Stable ordering for deterministic UI output
  drifted.sort((a, b) => a.path.localeCompare(b.path))
  return drifted
}

async function computeSha256(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256')
    const stream = fs.createReadStream(filePath)
    stream.on('data', (chunk) => hash.update(chunk as Buffer))
    stream.on('end', () => resolve(hash.digest('hex')))
    stream.on('error', reject)
  })
}
