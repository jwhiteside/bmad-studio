import fs from 'node:fs'
import path from 'node:path'

// Sized for module-scale operations (one install can write 60+ files).
// Average snapshot ~5KB → ~2.5MB max disk budget. Raised from 50 in Story 15.7
// (TD-17) so module installs/removes don't prune themselves mid-operation.
const HISTORY_CAP = 500

// Files with these extensions are routed through WriteService snapshots
// (text content). Binary files bypass snapshots — recovery for binaries is
// "re-install the module" per TD-16.
//
// CONSERVATIVE list — false positives (treating binary as text) corrupt the
// file via utf-8 round-trip; false negatives (text as binary) just skip the
// snapshot. When in doubt, leave OFF the list.
export const TEXT_FILE_EXTENSIONS: ReadonlySet<string> = new Set([
  '.md',
  '.markdown',
  '.yaml',
  '.yml',
  '.json',
  '.csv',
  '.txt',
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.html',
  '.htm',
  '.css',
  '.scss',
  '.toml',
  '.xml',
  '.svg',
  '.sh',
  '.bash',
  '.zsh',
  '.fish',
])

export function isLikelyText(filePath: string): boolean {
  return TEXT_FILE_EXTENSIONS.has(path.extname(filePath).toLowerCase())
}

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

function pruneHistory(historyDir: string) {
  if (!fs.existsSync(historyDir)) return

  const files = fs.readdirSync(historyDir).sort()

  while (files.length > HISTORY_CAP) {
    const oldest = files.shift()!
    fs.unlinkSync(path.join(historyDir, oldest))
  }
}

export type WriteResult =
  | { ok: true; filePath: string; snapshotPath: string | null }
  | { ok: false; error: string; filePath: string }

export function writeFile(filePath: string, content: string, studioDir: string): WriteResult {
  const historyDir = path.join(studioDir, 'history')
  let snapshotPath: string | null = null

  try {
    // Step 1: Read current file for snapshot (if exists)
    let previousContent: string | null = null
    if (fs.existsSync(filePath)) {
      previousContent = fs.readFileSync(filePath, 'utf-8')
    }

    // Step 2: Snapshot to history
    if (previousContent !== null) {
      ensureDir(historyDir)
      const timestamp = Date.now()
      const basename = path.basename(filePath)
      snapshotPath = path.join(historyDir, `${timestamp}-${basename}`)
      fs.writeFileSync(snapshotPath, previousContent, 'utf-8')
    }

    // Step 3: Write to temp file
    const tmpPath = `${filePath}.tmp`
    ensureDir(path.dirname(filePath))
    fs.writeFileSync(tmpPath, content, 'utf-8')

    // Step 4: Atomic rename
    fs.renameSync(tmpPath, filePath)

    // Step 5: Verify
    const written = fs.readFileSync(filePath, 'utf-8')
    if (written !== content) {
      return { ok: false, error: 'Write verification failed: content mismatch', filePath }
    }

    // Step 6: Prune history
    pruneHistory(historyDir)

    return { ok: true, filePath, snapshotPath }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { ok: false, error: `Write failed: ${message}`, filePath }
  }
}

/**
 * Delete a single file. Snapshots TEXT content to history/ before unlink.
 * Binary files (per `isLikelyText`) are unlinked directly without a snapshot —
 * recovery for binary content is "re-install the module" per TD-16.
 *
 * Returns `{ ok: false }` (does NOT throw) on missing paths so callers can
 * handle absence gracefully.
 */
export function deleteFile(filePath: string, studioDir: string): WriteResult {
  const historyDir = path.join(studioDir, 'history')
  try {
    if (!fs.existsSync(filePath)) {
      return { ok: false, error: 'File does not exist', filePath }
    }

    let snapshotPath: string | null = null
    if (isLikelyText(filePath)) {
      const previousContent = fs.readFileSync(filePath, 'utf-8')
      ensureDir(historyDir)
      const timestamp = Date.now()
      const basename = path.basename(filePath)
      snapshotPath = path.join(historyDir, `${timestamp}-${basename}`)
      fs.writeFileSync(snapshotPath, previousContent, 'utf-8')
    }

    fs.unlinkSync(filePath)
    pruneHistory(historyDir)
    return { ok: true, filePath, snapshotPath }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { ok: false, error: `Delete failed: ${message}`, filePath }
  }
}

/**
 * Recursively delete a directory. Walks the tree, deletes each file via
 * `deleteFile` (which snapshots text files), then unlinks the (now-empty)
 * directory tree.
 *
 * On partial failure mid-walk, the directory is left in its current state —
 * some files deleted, some not. The caller decides whether to retry.
 */
export function deleteDirectory(dirPath: string, studioDir: string): WriteResult {
  try {
    if (!fs.existsSync(dirPath)) {
      return { ok: false, error: 'Directory does not exist', filePath: dirPath }
    }

    const walk = (dir: string) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name)
        if (entry.isDirectory()) {
          walk(full)
        } else if (entry.isSymbolicLink()) {
          // Symlinks (dangling or otherwise) are unlinked directly — no content to snapshot.
          // fs.existsSync follows symlinks, so a dangling symlink would fool deleteFile into
          // returning { ok: false, 'File does not exist' } and aborting the entire walk.
          fs.unlinkSync(full)
        } else {
          const result = deleteFile(full, studioDir)
          if (!result.ok) throw new Error(result.error)
        }
      }
    }

    walk(dirPath)
    fs.rmSync(dirPath, { recursive: true, force: true })
    return { ok: true, filePath: dirPath, snapshotPath: null }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { ok: false, error: `Directory delete failed: ${message}`, filePath: dirPath }
  }
}

export function getHistory(studioDir: string): string[] {
  const historyDir = path.join(studioDir, 'history')
  if (!fs.existsSync(historyDir)) return []
  return fs.readdirSync(historyDir).sort().reverse()
}
