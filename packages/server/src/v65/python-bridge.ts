/**
 * Python subprocess bridge for BMAD v6.5 customization resolution.
 *
 * Provides two exports:
 *   - `probePython()` — sync probe: detects Python ≥ 3.11 (needed for stdlib tomllib)
 *   - `verifyMerge()` — async: shells out to `resolve_customization.py` via spawn (no shell)
 *
 * Security: uses `spawn` (not `exec`) per NFR-SEC-3 to avoid shell injection.
 * Performance: AbortController 5s timeout per NFR-PERF-5.
 * Correctness: reads both stdout and stderr throughout per NFR-INT-2 to prevent
 * pipe-buffer deadlock.
 */

import path from 'node:path'
import fs from 'node:fs'
import { spawnSync, spawn } from 'node:child_process'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PythonProbeResult = { available: boolean; version: string | null }

export type VerifyMergeResult =
  | { ok: true; merged: Record<string, unknown> }
  | { ok: false; reason: 'missing' | 'timeout' | 'parse-error'; detail?: string }

// ---------------------------------------------------------------------------
// probePython — synchronous
// ---------------------------------------------------------------------------

/**
 * Synchronously probe for Python ≥ 3.11.
 *
 * Python 3 (older versions) prints the version to stderr; newer versions print
 * to stdout — we check both.
 */
export function probePython(): PythonProbeResult {
  const result = spawnSync('python3', ['--version'], { timeout: 1000, encoding: 'utf-8' })

  if (result.status !== 0 || result.error) {
    return { available: false, version: null }
  }

  const stdout = result.stdout ?? ''
  const stderr = result.stderr ?? ''
  const match = /Python (\d+)\.(\d+)/.exec(stdout || stderr || '')

  if (!match) {
    return { available: false, version: null }
  }

  const major = parseInt(match[1], 10)
  const minor = parseInt(match[2], 10)
  const available = major > 3 || (major === 3 && minor >= 11)

  return { available, version: match[0] }
}

// ---------------------------------------------------------------------------
// verifyMerge — async
// ---------------------------------------------------------------------------

/**
 * Shell out to `resolve_customization.py` and parse the JSON result.
 *
 * @param skillRoot    Absolute path to the skill directory (must be inside projectRoot)
 * @param projectRoot  Absolute path to the project root
 * @param key          Key passed to the Python script as `--key`
 * @param opts         `{ pythonAvailable }` — if false, short-circuits immediately
 */
export function verifyMerge(
  skillRoot: string,
  projectRoot: string,
  key: string,
  opts: { pythonAvailable: boolean },
): Promise<VerifyMergeResult> {
  // Short-circuit when Python is not available
  if (!opts.pythonAvailable) {
    return Promise.resolve({ ok: false, reason: 'missing' })
  }

  // Security: ensure skillRoot is inside projectRoot (prevent path traversal)
  const resolvedSkillRoot = path.resolve(skillRoot)
  const resolvedProjectRoot = path.resolve(projectRoot)

  if (!resolvedSkillRoot.startsWith(resolvedProjectRoot + path.sep) && resolvedSkillRoot !== resolvedProjectRoot) {
    throw new Error(
      `Security violation: skillRoot "${resolvedSkillRoot}" is not inside projectRoot "${resolvedProjectRoot}"`,
    )
  }

  const scriptPath = path.join(projectRoot, '_bmad', 'scripts', 'resolve_customization.py')

  // Check script exists before spawning
  if (!fs.existsSync(scriptPath)) {
    return Promise.resolve({ ok: false, reason: 'missing' })
  }

  return new Promise<VerifyMergeResult>((resolve) => {
    const ac = new AbortController()
    const timer = setTimeout(() => ac.abort(), 5000)

    const proc = spawn(
      'python3',
      [scriptPath, '--skill', resolvedSkillRoot, '--key', key],
      { signal: ac.signal },
    )

    const stdoutChunks: Buffer[] = []
    const stderrChunks: Buffer[] = []

    // NFR-INT-2: read both streams throughout to prevent pipe-buffer deadlock
    proc.stdout.on('data', (chunk: Buffer) => stdoutChunks.push(chunk))
    proc.stderr.on('data', (chunk: Buffer) => stderrChunks.push(chunk))

    proc.on('error', (err: NodeJS.ErrnoException) => {
      clearTimeout(timer)
      const stderrSoFar = Buffer.concat(stderrChunks).toString('utf-8')

      // AbortError means we hit the 5s timeout
      if (err.name === 'AbortError') {
        resolve({ ok: false, reason: 'timeout', detail: stderrSoFar })
      } else {
        resolve({ ok: false, reason: 'parse-error', detail: err.message })
      }
    })

    proc.on('close', (code: number | null) => {
      clearTimeout(timer)
      const stdoutBuffer = Buffer.concat(stdoutChunks).toString('utf-8')
      const stderrBuffer = Buffer.concat(stderrChunks).toString('utf-8')

      if (code !== 0) {
        resolve({ ok: false, reason: 'parse-error', detail: stderrBuffer })
        return
      }

      let parsed: unknown
      try {
        parsed = JSON.parse(stdoutBuffer)
      } catch {
        resolve({ ok: false, reason: 'parse-error', detail: stderrBuffer })
        return
      }

      resolve({ ok: true, merged: parsed as Record<string, unknown> })
    })
  })
}
