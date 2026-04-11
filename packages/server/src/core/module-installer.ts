import { execSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import yaml from 'js-yaml'

import type { ModuleManifestFile } from '@bmad-studio/shared'

import type { EntityIndex } from '../parsers/index-builder.js'

import type { FileStore } from './file-store.js'
import { writeFile, isLikelyText } from './write-service.js'

// TEXT_FILE_EXTENSIONS and isLikelyText moved to write-service.ts in Story 15.7
// (so the new deleteFile/deleteDirectory primitives can share them without an
// import cycle). Re-exported here for any callers that imported from this file.
export { TEXT_FILE_EXTENSIONS, isLikelyText } from './write-service.js'

export type CopyDirResult =
  | { ok: true; textCount: number; binaryCount: number }
  | { ok: false; error: string }

/**
 * Walk a source directory and copy every file into a destination.
 *
 * Text files (per TEXT_FILE_EXTENSIONS) are routed through WriteService so snapshots are written.
 * Binary files are copied via fs.copyFileSync — no snapshot, no corruption (see TD-16).
 *
 * Replaces the legacy fs.copyFileSync-based copyDirRecursive helper that lived in modules-plugin.ts.
 */
export function copyDirThroughWriteService(
  src: string,
  dest: string,
  studioDir: string,
  fileStore: FileStore,
): CopyDirResult {
  if (!fs.existsSync(src)) return { ok: true, textCount: 0, binaryCount: 0 }
  fs.mkdirSync(dest, { recursive: true })

  let textCount = 0
  let binaryCount = 0

  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)

    if (entry.isDirectory()) {
      const sub = copyDirThroughWriteService(srcPath, destPath, studioDir, fileStore)
      if (!sub.ok) return sub
      textCount += sub.textCount
      binaryCount += sub.binaryCount
      continue
    }

    if (isLikelyText(srcPath)) {
      // Text path — read as utf-8 string, write via WriteService for snapshot + atomicity.
      const content = fs.readFileSync(srcPath, 'utf-8')
      fileStore.markPendingWrite(destPath)
      const result = writeFile(destPath, content, studioDir)
      fileStore.clearPendingWrite(destPath)
      if (!result.ok) return { ok: false, error: result.error }
      textCount++
    } else {
      // Binary path — straight byte copy. Never decode. Never snapshot. (TD-16)
      try {
        fs.copyFileSync(srcPath, destPath)
        binaryCount++
      } catch (err) {
        return {
          ok: false,
          error: `Binary copy failed for ${srcPath}: ${err instanceof Error ? err.message : String(err)}`,
        }
      }
    }
  }

  return { ok: true, textCount, binaryCount }
}

/**
 * Read manifest.yaml; null-safe for missing files.
 */
export function readManifestSafe(manifestPath: string): ModuleManifestFile | null {
  if (!fs.existsSync(manifestPath)) return null
  const content = fs.readFileSync(manifestPath, 'utf-8')
  return yaml.load(content) as ModuleManifestFile
}

/**
 * Write manifest.yaml through WriteService so changes are snapshot.
 */
export function writeManifestThroughWriteService(
  manifestPath: string,
  manifest: ModuleManifestFile,
  studioDir: string,
  fileStore: FileStore,
): { ok: true } | { ok: false; error: string } {
  const yamlText = yaml.dump(manifest, { lineWidth: -1 })
  fileStore.markPendingWrite(manifestPath)
  const result = writeFile(manifestPath, yamlText, studioDir)
  fileStore.clearPendingWrite(manifestPath)
  return result.ok ? { ok: true } : { ok: false, error: result.error }
}

/**
 * Verify a local path looks like a module — has a module.yaml OR contains at least
 * one of the standard entity directories.
 */
export function isPlausibleModuleDir(dir: string): boolean {
  if (!fs.existsSync(dir)) return false
  if (fs.existsSync(path.join(dir, 'module.yaml'))) return true
  return ['agents', 'skills', 'workflows', 'tasks'].some((sub) =>
    fs.existsSync(path.join(dir, sub)),
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// GitHub source — Story 15.3
// ─────────────────────────────────────────────────────────────────────────────

export type GithubSource = {
  owner: string
  repo: string
  subpath: string | null
  branch: string | null
}

/**
 * Lenient parser for GitHub source strings. Accepts any of:
 *   owner/repo
 *   owner/repo/subpath
 *   owner/repo/nested/subpath
 *   owner/repo@branch
 *   owner/repo/subpath@branch
 *   https://github.com/owner/repo
 *   https://github.com/owner/repo/tree/branch
 *   https://github.com/owner/repo/tree/branch/subpath
 *
 * Throws plain Error on invalid input — the install handler is responsible for
 * catching and converting to ValidationError.
 */
export function parseGithubSource(input: string): GithubSource {
  // Strip protocol/host if a full URL was pasted
  let s = input.trim()
  const urlMatch = s.match(/^https?:\/\/github\.com\/(.+)$/i)
  if (urlMatch) s = urlMatch[1]

  // Strip trailing slashes/whitespace
  s = s.replace(/\/+$/, '')

  // Handle the /tree/{branch}/subpath form (URL or shorthand)
  const treeMatch = s.match(/^([^/]+)\/([^/]+)\/tree\/([^/]+)(?:\/(.+))?$/)
  if (treeMatch) {
    return {
      owner: treeMatch[1],
      repo: treeMatch[2],
      branch: treeMatch[3],
      subpath: treeMatch[4] ?? null,
    }
  }

  // Handle owner/repo[/subpath][@branch]
  let branch: string | null = null
  const atIdx = s.lastIndexOf('@')
  if (atIdx > 0) {
    branch = s.slice(atIdx + 1)
    s = s.slice(0, atIdx)
  }
  const parts = s.split('/').filter(Boolean)
  if (parts.length < 2) {
    throw new Error(`Invalid GitHub source "${input}" — expected owner/repo[/subpath][@branch]`)
  }
  return {
    owner: parts[0],
    repo: parts[1],
    subpath: parts.length > 2 ? parts.slice(2).join('/') : null,
    branch,
  }
}

export type DownloadedTarball = {
  extractedRoot: string
  tmpDir: string
  resolvedBranch: string
}

/**
 * Download a GitHub repo tarball into a temp dir, extract, and return the
 * extracted root path along with the branch that was actually used.
 *
 * Tries `main` first then `master` if no branch is given (per Q5). Honours
 * GITHUB_TOKEN / BMAD_GITHUB_TOKEN env vars for private repos. Throws
 * immediately on 401/403 (token errors don't fix themselves on `master`).
 *
 * The caller is responsible for cleaning up `tmpDir` after consuming
 * `extractedRoot` (typically in a `try { ... } finally { fs.rmSync(tmpDir) }`).
 */
export async function downloadGithubTarball(source: GithubSource): Promise<DownloadedTarball> {
  // TD-20 — realpathSync resolves the macOS /var → /private/var symlink so paths
  // returned from this function are stable for the caller's existsSync checks.
  const tmpDir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'bmad-github-')))
  const tarballPath = path.join(tmpDir, 'repo.tar.gz')

  const token = process.env.GITHUB_TOKEN ?? process.env.BMAD_GITHUB_TOKEN ?? null

  const branchesToTry: string[] = source.branch ? [source.branch] : ['main', 'master']
  let lastError = 'unknown error'
  let extractedRoot: string | null = null
  let resolvedBranch: string | null = null

  for (const branch of branchesToTry) {
    const url = `https://api.github.com/repos/${source.owner}/${source.repo}/tarball/${branch}`
    const headers: Record<string, string> = { 'User-Agent': 'bmad-studio' }
    if (token) headers['Authorization'] = `Bearer ${token}`

    const response = await fetch(url, { headers, redirect: 'follow' })

    if (response.status === 404) {
      lastError = `Branch "${branch}" not found in ${source.owner}/${source.repo}`
      continue
    }
    if (response.status === 401 || response.status === 403) {
      // Token errors don't fix themselves on master — bail immediately.
      try {
        fs.rmSync(tmpDir, { recursive: true, force: true })
      } catch {
        /* ignore */
      }
      throw new Error(
        `Cannot access ${source.owner}/${source.repo}. If this is a private repository, set GITHUB_TOKEN in your environment before starting BMAD Studio.`,
      )
    }
    if (!response.ok) {
      lastError = `GitHub API ${response.status}: ${response.statusText}`
      continue
    }

    const buffer = Buffer.from(await response.arrayBuffer())
    fs.writeFileSync(tarballPath, buffer)

    // Extract via execSync — TD-4, consistent with the existing npm install path.
    const extractDir = path.join(tmpDir, 'extracted')
    fs.mkdirSync(extractDir, { recursive: true })
    execSync(`tar -xzf "${tarballPath}" -C "${extractDir}"`, {
      stdio: 'pipe',
      timeout: 60000,
    })

    // GitHub tarballs always extract to a single subdir like {owner}-{repo}-{sha}/
    const entries = fs.readdirSync(extractDir, { withFileTypes: true })
    const rootEntry = entries.find((e) => e.isDirectory())
    if (!rootEntry) {
      try {
        fs.rmSync(tmpDir, { recursive: true, force: true })
      } catch {
        /* ignore */
      }
      throw new Error('GitHub tarball extracted to an empty directory')
    }
    extractedRoot = path.join(extractDir, rootEntry.name)
    resolvedBranch = branch
    break
  }

  if (!extractedRoot || !resolvedBranch) {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true })
    } catch {
      /* ignore */
    }
    throw new Error(lastError)
  }

  return { extractedRoot, tmpDir, resolvedBranch }
}

// ─────────────────────────────────────────────────────────────────────────────
// Zip upload — Story 15.4
// ─────────────────────────────────────────────────────────────────────────────

export type ExtractedZip = {
  extractedRoot: string
  tmpDir: string
}

/**
 * Extract a multipart-uploaded zip into a temp dir and return the module root.
 *
 * `adm-zip` is loaded via dynamic import (TD-5) so users who never upload a zip
 * pay zero startup cost. The first call pays the ~10ms parse, subsequent calls
 * hit the Node.js module cache for free.
 *
 * Includes inline zip-slip mitigation (finding #22): every entry in the zip is
 * checked to ensure its resolved path stays inside extractDir BEFORE extraction.
 * The entire upload is rejected on any escape attempt, and no file is written
 * to disk.
 *
 * If the zip's top-level contains exactly one directory, that directory is
 * returned as `extractedRoot` (the "wrapper dir" case — most zip exports include
 * one). Otherwise the extract dir itself is returned.
 *
 * The caller is responsible for cleaning up `tmpDir` after consuming
 * `extractedRoot` (typically in a `try { ... } finally { fs.rmSync(tmpDir) }`).
 */
export async function extractZipUpload(zipBuffer: Buffer): Promise<ExtractedZip> {
  // TD-5 — dynamic import keeps adm-zip out of the cold-start path.
  // adm-zip is a CJS module exporting its constructor as the default export.
  const AdmZip = (await import('adm-zip')).default

  // TD-20 — realpathSync resolves the macOS /var → /private/var symlink so paths
  // returned from this function are stable for the caller's existsSync checks.
  const tmpDir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'bmad-zip-')))
  const extractDir = path.join(tmpDir, 'extracted')
  fs.mkdirSync(extractDir, { recursive: true })

  try {
    const zip = new AdmZip(zipBuffer)

    // Zip-slip mitigation (AC-15.4.7). Walk every entry and validate that its
    // resolved target path stays inside extractDir BEFORE calling extractAllTo.
    // Reject the entire upload on any escape attempt — no file written to disk.
    const realExtractDir = fs.realpathSync(extractDir) + path.sep
    for (const entry of zip.getEntries()) {
      const target = path.resolve(extractDir, entry.entryName)
      // The target must either be exactly extractDir (the dir itself, no trailing sep)
      // or live inside extractDir (with trailing sep prefix match).
      if (!target.startsWith(realExtractDir) && target + path.sep !== realExtractDir) {
        throw new Error(
          `Zip entry "${entry.entryName}" attempts to write outside the extraction directory — aborting`,
        )
      }
    }

    zip.extractAllTo(extractDir, /* overwrite */ true)
  } catch (err) {
    // Clean up on any failure (malformed zip, zip-slip rejection, adm-zip exception).
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true })
    } catch {
      /* ignore cleanup errors */
    }
    throw new Error(
      `Failed to extract zip: ${err instanceof Error ? err.message : String(err)}`,
    )
  }

  // Locate the module root: either the extract dir itself, or its sole child
  // if the zip has one wrapper directory (the common GitHub-export pattern).
  const entries = fs.readdirSync(extractDir, { withFileTypes: true })
  const extractedRoot =
    entries.length === 1 && entries[0].isDirectory()
      ? path.join(extractDir, entries[0].name)
      : extractDir

  return { extractedRoot, tmpDir }
}

// ─────────────────────────────────────────────────────────────────────────────
// Variable substitution — Story 15.5
// ─────────────────────────────────────────────────────────────────────────────

// Files with these extensions are scanned for placeholder substitution after install.
// NARROWER than TEXT_FILE_EXTENSIONS — only user-readable template formats where
// substitution makes semantic sense. Substituting inside a .ts source file would
// break syntax if the value lands inside an identifier.
export const SUBSTITUTABLE_EXTENSIONS: ReadonlySet<string> = new Set([
  '.md',
  '.markdown',
  '.yaml',
  '.yml',
  '.csv',
  '.txt',
])

export type SubstitutionContext = {
  moduleCode: string
  projectRoot: string
  outputFolder: string
  variables: Record<string, string>
}

// Variable values must be plain text — no YAML/CSV/JSON special characters that would
// break the surrounding file format. Allowed: Unicode letters, digits, marks, single
// spaces (NOT tabs/newlines — those break YAML), and . _ - / : characters.
// Empty strings are valid.
const SAFE_VAR_VALUE = /^[\p{L}\p{N}\p{M} ._\-/:]*$/u

/**
 * Validate that all variable values are safe to substitute into text/yaml/csv files.
 * Returns the FIRST violation as an error message naming the offending variable.
 */
export function validateVariables(
  variables: Record<string, string>,
): { ok: true } | { ok: false; error: string } {
  for (const [key, value] of Object.entries(variables)) {
    if (!SAFE_VAR_VALUE.test(value)) {
      return {
        ok: false,
        error: `Variable "${key}" contains characters that could break installed files. Allowed: letters, digits, spaces, and . _ - / : characters. Got: ${JSON.stringify(value)}`,
      }
    }
  }
  return { ok: true }
}

function applySubstitutions(content: string, ctx: SubstitutionContext): string {
  let out = content
  // Static placeholders (single braces)
  out = out.replaceAll('{project-root}', ctx.projectRoot)
  out = out.replaceAll('{module-code}', ctx.moduleCode)
  out = out.replaceAll('{output_folder}', ctx.outputFolder)
  // {{var}} placeholders (double braces) — values pre-validated by validateVariables
  for (const [key, value] of Object.entries(ctx.variables)) {
    out = out.replaceAll(`{{${key}}}`, value)
  }
  return out
}

/**
 * Walk a destination directory and substitute placeholders in files matching
 * SUBSTITUTABLE_EXTENSIONS. Files without any matching placeholder are left
 * untouched (no spurious snapshots). Substitution writes go through WriteService.
 *
 * Returns the count of files actually patched (a no-placeholder file does not count).
 */
export function runVariableSubstitution(
  destDir: string,
  ctx: SubstitutionContext,
  studioDir: string,
  fileStore: FileStore,
): { ok: true; filesPatched: number } | { ok: false; error: string } {
  let filesPatched = 0

  const walk = (dir: string): { ok: true } | { ok: false; error: string } => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        const sub = walk(full)
        if (!sub.ok) return sub
        continue
      }
      const ext = path.extname(entry.name).toLowerCase()
      if (!SUBSTITUTABLE_EXTENSIONS.has(ext)) continue

      const content = fs.readFileSync(full, 'utf-8')
      const patched = applySubstitutions(content, ctx)
      if (patched === content) continue // AC-15.5.5 — no spurious snapshot

      fileStore.markPendingWrite(full)
      const result = writeFile(full, patched, studioDir)
      fileStore.clearPendingWrite(full)
      if (!result.ok) return { ok: false, error: result.error }
      filesPatched++
    }
    return { ok: true }
  }

  const r = walk(destDir)
  if (!r.ok) return r
  return { ok: true, filesPatched }
}

/**
 * Read the project's `output_folder` setting from `_bmad/_config/config.yaml`.
 * Returns `<projectRoot>/_bmad-output` as the default if the file is missing,
 * malformed, or doesn't declare the field.
 */
export function readOutputFolder(projectRoot: string): string {
  const configPath = path.join(projectRoot, '_bmad', '_config', 'config.yaml')
  if (!fs.existsSync(configPath)) {
    return path.join(projectRoot, '_bmad-output')
  }
  try {
    const config = yaml.load(fs.readFileSync(configPath, 'utf-8')) as { output_folder?: string }
    const raw = config?.output_folder ?? '{project-root}/_bmad-output'
    return raw.replaceAll('{project-root}', projectRoot)
  } catch {
    return path.join(projectRoot, '_bmad-output')
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Cross-reference detection — Story 15.7
// ─────────────────────────────────────────────────────────────────────────────

export type CrossReference = {
  ownerModule: string
  reason: string
}

/**
 * Scan the FileStore entity index for cross-module references to a target
 * module's agents. Used by the remove preview endpoint to warn users about
 * broken references after removal.
 *
 * **TD-19 scope (v1):** only scans two signals:
 *   1. Teams whose `agentIds[]` contains any target-module agent ID
 *   2. Workflow steps whose `step.agent` matches a target-module agent ID
 *
 * **Explicitly NOT scanned in v1:**
 *   - `agent.menu[].route` — holds a relative file path from the XML `exec=`
 *     attribute, not a workflow ID. `Set<workflowId>.has(filepath)` always
 *     returns false, so the check would be dead code.
 *   - `agent.skills[]` — hardcoded to `[]` in `agent-parser.ts:93`. Dead field.
 *
 * Both will be revisited in v2 with proper graph extraction.
 *
 * Returns an array of `{ ownerModule, reason }` entries, deduplicated by
 * owner+reason. The target module itself is never included. Unattributed
 * entities (edge case) are reported under `"(unattributed)"`.
 */
export function findCrossReferences(index: EntityIndex, targetModule: string): CrossReference[] {
  const targetAgentIds = new Set(
    index.agents.filter((a) => a.module === targetModule).map((a) => a.id),
  )

  const refs: Map<string, Set<string>> = new Map()
  const add = (owner: string | undefined, reason: string) => {
    // Unattributed entities (rare — index-builder.ts:107-110 attributes everything
    // inside _bmad/) are reported under a placeholder owner so the user knows to
    // investigate manually. We do NOT silently drop them.
    const ownerKey = owner ?? '(unattributed)'
    if (ownerKey === targetModule) return
    if (!refs.has(ownerKey)) refs.set(ownerKey, new Set())
    refs.get(ownerKey)!.add(reason)
  }

  // Signal 1: teams whose agentIds[] includes any target-module agent
  for (const team of index.teams) {
    if (team.module === targetModule) continue
    const hits = team.agentIds.filter((id) => targetAgentIds.has(id))
    if (hits.length > 0) {
      add(team.module, `team "${team.id}" references ${hits.length} agent(s)`)
    }
  }

  // Signal 2: workflow steps whose step.agent matches a target-module agent
  for (const wf of index.workflows) {
    if (wf.module === targetModule) continue
    const hits = wf.steps.filter((s) => s.agent && targetAgentIds.has(s.agent))
    if (hits.length > 0) {
      add(wf.module, `workflow "${wf.id}" references ${hits.length} agent(s)`)
    }
  }

  return Array.from(refs.entries()).flatMap(([owner, reasons]) =>
    Array.from(reasons).map((reason) => ({ ownerModule: owner, reason })),
  )
}
