/**
 * Canonical reader for BMAD v6.5 manifest files under `_bmad/_config/`.
 *
 * Implements ADR-1 (Manifest-as-Index Discovery Strategy) from
 * `_bmad-output/planning-artifacts/architecture-v65-migration.md`.
 *
 * Three readers:
 *   - `loadModules` — `_bmad/_config/manifest.yaml` (required on v6.5)
 *   - `loadSkillIndex` — `_bmad/_config/skill-manifest.csv` (required on v6.5)
 *   - `loadBmadHelp` — `_bmad/_config/bmad-help.csv` (optional; returns `[]` if absent)
 *
 * All three throw `ManifestParseError` (422) when a present file is malformed,
 * and `loadModules`/`loadSkillIndex` throw `ManifestMissingError` (422) when
 * their required file is absent.
 *
 * Story 31.3 adds a two-tier cache (in-memory + on-disk) keyed on the SHA-256
 * of `files-manifest.csv`. Use `loadManifestCached` as the entry point.
 */

import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import yaml from 'js-yaml'
import Papa from 'papaparse'

import type {
  BmadHelpEntry,
  ModuleManifestEntry,
  ModuleManifestFile,
  SkillManifestEntry,
} from '@bmad-studio/shared'

import { ManifestMissingError, ManifestParseError } from '../core/errors.js'

const CONFIG_DIR = ['_bmad', '_config'] as const

const MANIFEST_YAML = 'manifest.yaml'
const SKILL_MANIFEST_CSV = 'skill-manifest.csv'
const BMAD_HELP_CSV = 'bmad-help.csv'

function configPath(projectRoot: string, file: string): string {
  return path.join(projectRoot, ...CONFIG_DIR, file)
}

function readRequired(filePath: string, fileLabel: string): string {
  if (!fs.existsSync(filePath)) {
    throw new ManifestMissingError(
      `Required v6.5 manifest file is missing: ${fileLabel} at ${filePath}`,
      { expectedPath: filePath, file: fileLabel },
    )
  }
  return fs.readFileSync(filePath, 'utf-8')
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Read and parse `_bmad/_config/manifest.yaml`. Returns the typed
 * `ModuleManifestFile` from `@bmad-studio/shared`.
 *
 * @throws {ManifestMissingError} when the file is absent.
 * @throws {ManifestParseError} when YAML is malformed or the parsed shape
 *   doesn't satisfy `ModuleManifestFile` (missing `installation` object or
 *   `modules` array).
 */
export function loadModules(projectRoot: string): ModuleManifestFile {
  const filePath = configPath(projectRoot, MANIFEST_YAML)
  const raw = readRequired(filePath, MANIFEST_YAML)

  let parsed: unknown
  try {
    parsed = yaml.load(raw)
  } catch (err) {
    throw new ManifestParseError(
      `Failed to parse ${MANIFEST_YAML}: ${(err as Error).message}`,
      { filePath, cause: (err as Error).message },
    )
  }

  if (!isPlainObject(parsed)) {
    throw new ManifestParseError(
      `${MANIFEST_YAML} did not parse to an object`,
      { filePath, parsedType: typeof parsed },
    )
  }

  const installation = parsed.installation
  const modules = parsed.modules
  if (!isPlainObject(installation)) {
    throw new ManifestParseError(
      `${MANIFEST_YAML} is missing required \`installation\` object`,
      { filePath },
    )
  }
  if (!Array.isArray(modules)) {
    throw new ManifestParseError(
      `${MANIFEST_YAML} is missing required \`modules\` array`,
      { filePath },
    )
  }

  return {
    installation: installation as ModuleManifestFile['installation'],
    modules: modules as ModuleManifestEntry[],
    ...(Array.isArray(parsed.ides) ? { ides: parsed.ides as string[] } : {}),
  }
}

type CsvParseSuccess<T> = { data: T[] }

function parseCsvOrThrow<T extends Record<string, string>>(
  raw: string,
  filePath: string,
  fileLabel: string,
): CsvParseSuccess<T> {
  const result = Papa.parse<T>(raw, {
    header: true,
    skipEmptyLines: true,
    transform: (value) => value, // identity — preserve embedded commas/whitespace as-is
  })

  if (result.errors.length > 0) {
    const first = result.errors[0]
    throw new ManifestParseError(
      `Failed to parse ${fileLabel}: ${first.message} (row ${first.row ?? '?'})`,
      { filePath, errors: result.errors },
    )
  }

  return { data: result.data }
}

/**
 * Read and parse `_bmad/_config/skill-manifest.csv`. Returns one
 * `SkillManifestEntry` per CSV row.
 *
 * The fixture's header is already camelCase (`canonicalId`, `name`, …) so no
 * key remapping is needed.
 *
 * @throws {ManifestMissingError} when the file is absent.
 * @throws {ManifestParseError} when the CSV is malformed.
 */
export function loadSkillIndex(projectRoot: string): SkillManifestEntry[] {
  const filePath = configPath(projectRoot, SKILL_MANIFEST_CSV)
  const raw = readRequired(filePath, SKILL_MANIFEST_CSV)
  const { data } = parseCsvOrThrow<Record<string, string>>(raw, filePath, SKILL_MANIFEST_CSV)

  return data.map((row) => ({
    canonicalId: row.canonicalId ?? '',
    name: row.name ?? '',
    description: row.description ?? '',
    module: row.module ?? '',
    path: row.path ?? '',
  }))
}

/**
 * Mapping from `bmad-help.csv` kebab-case column names to camelCase TS
 * field names. Columns already in camelCase pass through unchanged.
 *
 * Keep in sync with the table in
 * `_bmad-output/implementation-artifacts/31-2-manifest-reader.md` § Naming Conventions.
 */
const HELP_HEADER_MAP: Readonly<Record<string, keyof BmadHelpEntry>> = {
  module: 'module',
  phase: 'phase',
  name: 'name',
  code: 'code',
  sequence: 'sequence',
  'workflow-file': 'workflowFile',
  command: 'command',
  required: 'required',
  'agent-name': 'agentName',
  'agent-command': 'agentCommand',
  'agent-display-name': 'agentDisplayName',
  'agent-title': 'agentTitle',
  options: 'options',
  description: 'description',
  'output-location': 'outputLocation',
  outputs: 'outputs',
}

function emptyHelpEntry(): BmadHelpEntry {
  return {
    module: '',
    phase: '',
    name: '',
    code: '',
    sequence: '',
    workflowFile: '',
    command: '',
    required: '',
    agentName: '',
    agentCommand: '',
    agentDisplayName: '',
    agentTitle: '',
    options: '',
    description: '',
    outputLocation: '',
    outputs: '',
  }
}

/**
 * Read and parse `_bmad/_config/bmad-help.csv` if present.
 *
 * Maps kebab-case CSV columns (e.g. `workflow-file`, `agent-name`) to
 * camelCase TypeScript fields per `HELP_HEADER_MAP`.
 *
 * Returns `[]` when the file is absent — `bmad-help.csv` is optional on
 * v6.5 (graceful path; see Story 31.2 Decision Required: land vs defer).
 *
 * @throws {ManifestParseError} when an existing file fails to parse.
 */
export function loadBmadHelp(projectRoot: string): BmadHelpEntry[] {
  const filePath = configPath(projectRoot, BMAD_HELP_CSV)
  if (!fs.existsSync(filePath)) {
    return []
  }
  const raw = fs.readFileSync(filePath, 'utf-8')
  const { data } = parseCsvOrThrow<Record<string, string>>(raw, filePath, BMAD_HELP_CSV)

  return data.map((row) => {
    const entry = emptyHelpEntry()
    for (const [csvKey, tsKey] of Object.entries(HELP_HEADER_MAP)) {
      const value = row[csvKey]
      if (typeof value === 'string') {
        entry[tsKey] = value
      }
    }
    return entry
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// Story 31.3 — Two-tier cache keyed on SHA-256 of `files-manifest.csv`
// ─────────────────────────────────────────────────────────────────────────────

const FILES_MANIFEST_CSV = 'files-manifest.csv'
const CACHE_REL_PATH = path.join('_bmad-output', '.cache', 'v65-index.json')

/**
 * Fully-parsed v6.5 manifest data for a project. Serves as the in-memory and
 * on-disk cache payload (Story 31.3).
 */
export type CacheEntry = {
  /** SHA-256 hex digest of `_bmad/_config/files-manifest.csv` when the cache was built. */
  key: string
  modules: ModuleManifestFile
  skills: SkillManifestEntry[]
  help: BmadHelpEntry[]
}

/** Module-level in-memory cache: one entry per projectRoot. */
const memoryCache = new Map<string, CacheEntry>()

/**
 * Compute SHA-256 hex digest of `files-manifest.csv` content.
 * Sync is fine — called only on the cold path.
 * Returns `null` when the file is absent (caching skipped in that case).
 */
function computeFilesManifestHash(projectRoot: string): string | null {
  const filePath = configPath(projectRoot, FILES_MANIFEST_CSV)
  if (!fs.existsSync(filePath)) return null
  const content = fs.readFileSync(filePath)
  return crypto.createHash('sha256').update(content).digest('hex')
}

/** Path to the on-disk JSON cache file for a given project root. */
function diskCachePath(projectRoot: string): string {
  return path.join(projectRoot, CACHE_REL_PATH)
}

/** Try to read and parse the on-disk cache. Returns null on any error. */
function readDiskCache(projectRoot: string): CacheEntry | null {
  try {
    const raw = fs.readFileSync(diskCachePath(projectRoot), 'utf-8')
    return JSON.parse(raw) as CacheEntry
  } catch {
    return null
  }
}

/** Persist a cache entry to disk, creating parent directories as needed. */
function writeDiskCache(projectRoot: string, entry: CacheEntry): void {
  try {
    const cachePath = diskCachePath(projectRoot)
    fs.mkdirSync(path.dirname(cachePath), { recursive: true })
    fs.writeFileSync(cachePath, JSON.stringify(entry), 'utf-8')
  } catch {
    // Non-fatal: disk write failure just means cold parse next restart.
  }
}

/**
 * Load all three v6.5 manifests with a two-tier cache.
 *
 * Cache key = SHA-256 hex of `_bmad/_config/files-manifest.csv`.
 *
 * Tiers:
 *  1. In-memory `Map<projectRoot, CacheEntry>` — serves subsequent requests
 *     in the same process in <5 ms.
 *  2. On-disk `_bmad-output/.cache/v65-index.json` — hydrates the in-memory
 *     cache on server restart when the hash matches (target <50 ms).
 *
 * When `files-manifest.csv` is absent the cache is bypassed and a fresh parse
 * is returned every time (graceful degradation).
 *
 * Called by `ModuleLoader.load()` for v6.5 (Story 31.4) and by the chokidar
 * watcher (Story 31.5) via `invalidateCache`.
 */
export function loadManifestCached(projectRoot: string): CacheEntry {
  const hash = computeFilesManifestHash(projectRoot)

  // 1. In-memory hit — fastest path.
  if (hash !== null) {
    const mem = memoryCache.get(projectRoot)
    if (mem && mem.key === hash) {
      return mem
    }
  }

  // 2. Disk hydration — check after a server restart.
  if (hash !== null) {
    const disk = readDiskCache(projectRoot)
    if (disk && disk.key === hash) {
      memoryCache.set(projectRoot, disk)
      return disk
    }
  }

  // 3. Cold parse — compute everything from scratch.
  const modules = loadModules(projectRoot)
  const skills = loadSkillIndex(projectRoot)
  const help = loadBmadHelp(projectRoot)

  const entry: CacheEntry = {
    key: hash ?? '',
    modules,
    skills,
    help,
  }

  if (hash !== null) {
    memoryCache.set(projectRoot, entry)
    writeDiskCache(projectRoot, entry)
  }

  return entry
}

/**
 * Evict the in-memory cache entry for `projectRoot`.
 *
 * Called by the chokidar watcher (Story 31.5) when any `_bmad/_config`
 * manifest file changes. The next `loadManifestCached` call will re-read
 * from disk or do a cold parse.
 */
export function invalidateCache(projectRoot: string): void {
  memoryCache.delete(projectRoot)
}
