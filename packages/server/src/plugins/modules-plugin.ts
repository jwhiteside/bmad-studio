import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { execSync, spawnSync } from 'node:child_process'

import type { FastifyInstance } from 'fastify'
import yaml from 'js-yaml'

import { ValidationError, ConflictError, NotFoundError } from '../core/errors.js'
import {
  fetchAndCacheRegistryIndex,
  isRegistryCacheStale,
  readCachedRegistryIndex,
} from '../core/module-registry.js'
import {
  generateIdeSkillsForModule,
  removeIdeSkillsForModule,
  scanEntities,
  scanEntityDirs,
} from '../core/ide-skill-generator.js'
import {
  copyDirThroughWriteService,
  downloadGithubTarball,
  extractZipUpload,
  findCrossReferences,
  isPlausibleModuleDir,
  parseGithubSource,
  readManifestSafe,
  readOutputFolder,
  runVariableSubstitution,
  validateVariables,
  writeManifestThroughWriteService,
  type GithubSource,
  type SubstitutionContext,
} from '../core/module-installer.js'
import { deleteDirectory, writeFile } from '../core/write-service.js'
import { parseModuleYaml } from '../parsers/module-yaml-parser.js'

const MODULE_NAME_RE = /^[a-z][a-z0-9-]*$/

// HTTP boundary types for the polymorphic install endpoint.
// (zip is handled by a separate multipart route — POST /api/modules/install/upload — added in Story 15.4)
type InstallSource =
  | { type: 'npm'; value: string }
  | { type: 'local'; value: string }
  | { type: 'github'; value: string }

type InstallBody = {
  source?: InstallSource
  packageName?: string // legacy shape
  variables?: Record<string, string> // consumed in Story 15.5; accepted but ignored from 15.2
}

export async function modulesPlugin(app: FastifyInstance) {
  // ─────────────────────────────────────────────────────────────────────────────
  // Story 15.9 — preview-source cache
  // Scoped inside the plugin closure so test instances don't share state.
  // Keyed by "{owner}/{repo}@{branch}[/{subpath}]" for github sources.
  // ─────────────────────────────────────────────────────────────────────────────
  type PreviewCacheEntry = {
    extractedRoot: string
    tmpDir: string
    resolvedBranch: string
    fetchedAt: number
  }
  const PREVIEW_CACHE_TTL_MS = 5 * 60 * 1000
  const previewCache = new Map<string, PreviewCacheEntry>()

  function previewCacheKey(ghSource: GithubSource): string {
    return `${ghSource.owner}/${ghSource.repo}@${ghSource.branch ?? 'main'}${ghSource.subpath ? `/${ghSource.subpath}` : ''}`
  }

  function getPreviewCacheEntry(key: string): PreviewCacheEntry | null {
    const entry = previewCache.get(key)
    if (!entry) return null
    if (Date.now() - entry.fetchedAt > PREVIEW_CACHE_TTL_MS) {
      try {
        fs.rmSync(entry.tmpDir, { recursive: true, force: true })
      } catch {
        /* ignore cleanup errors */
      }
      previewCache.delete(key)
      return null
    }
    return entry
  }

  // Story 17.3 — Clean-slate remove helper. Called by each install branch when
  // the destination directory already exists so the install can proceed as a
  // silent upgrade rather than throwing 409.
  // Throws ValidationError if the module is built-in (cannot be replaced) or
  // if any I/O step fails. Safe to call when the module dir doesn't exist yet
  // (all steps guard with existsSync / nullish checks).
  function cleanRemoveModule(moduleCode: string, bmadDir: string, manifestPath: string): void {
    const moduleDir = path.join(bmadDir, moduleCode)
    const manifest = readManifestSafe(manifestPath)
    const entry = manifest?.modules.find((m) => m.name === moduleCode)

    if (entry?.source === 'built-in') {
      throw new ValidationError(`Cannot reinstall built-in module "${moduleCode}"`)
    }

    // 1. Remove IDE skill launchers
    if (manifest) {
      const r = removeIdeSkillsForModule(
        app.fileStore.projectRoot,
        moduleCode,
        manifest,
        app.fileStore.studioDir,
      )
      if (!r.ok) throw new ValidationError(r.error)
    }

    // 2. Delete the module directory
    if (fs.existsSync(moduleDir)) {
      const r = deleteDirectory(moduleDir, app.fileStore.studioDir)
      if (!r.ok) throw new ValidationError(r.error)
    }

    // 3. Remove the manifest entry so the incoming install writes a fresh one
    if (manifest) {
      manifest.modules = manifest.modules.filter((m) => m.name !== moduleCode)
      const wrote = writeManifestThroughWriteService(
        manifestPath,
        manifest,
        app.fileStore.studioDir,
        app.fileStore,
      )
      if (!wrote.ok) throw new ValidationError(wrote.error)
    }
  }

  // Story 15.9 — Read-only preview endpoint. Fetches a source (local or github)
  // and returns the parsed module.yaml + entity counts WITHOUT installing anything.
  // For github sources, the downloaded tarball is cached for 5 minutes so the
  // subsequent install call can reuse it without re-downloading.
  app.post('/api/modules/preview-source', async (request) => {
    if (!('fileStore' in app)) {
      throw new ValidationError('No project detected')
    }

    const body = request.body as {
      source?: { type: string; value: string }
    } | null

    const source = body?.source
    if (!source || !source.type || !source.value) {
      throw new ValidationError('Request body must include { source: { type, value } }')
    }

    let stagedRoot: string

    if (source.type === 'local') {
      stagedRoot = path.isAbsolute(source.value)
        ? source.value
        : path.join(app.fileStore.projectRoot, source.value)
    } else if (source.type === 'github') {
      let ghSource: GithubSource
      try {
        ghSource = parseGithubSource(source.value)
      } catch (err) {
        throw new ValidationError(err instanceof Error ? err.message : String(err))
      }

      const cacheKey = previewCacheKey(ghSource)
      let entry = getPreviewCacheEntry(cacheKey)
      if (!entry) {
        let downloaded
        try {
          downloaded = await downloadGithubTarball(ghSource)
        } catch (err) {
          throw new ValidationError(err instanceof Error ? err.message : String(err))
        }
        entry = {
          extractedRoot: downloaded.extractedRoot,
          tmpDir: downloaded.tmpDir,
          resolvedBranch: downloaded.resolvedBranch,
          fetchedAt: Date.now(),
        }
        previewCache.set(cacheKey, entry)
      }
      stagedRoot = ghSource.subpath
        ? path.join(entry.extractedRoot, ghSource.subpath)
        : entry.extractedRoot
      // Note: no try/finally cleanup here — the tmpDir lives in previewCache and is
      // cleaned up on TTL expiry or when the install endpoint consumes it.
    } else {
      throw new ValidationError(
        `preview-source does not support source type "${source.type}". Use "local" or "github".`,
      )
    }

    if (!isPlausibleModuleDir(stagedRoot)) {
      throw new ValidationError(
        'Source does not look like a BMAD module — expected module.yaml or one of agents/skills/workflows/tasks',
      )
    }

    const parsed = parseModuleYaml(stagedRoot)
    if (!parsed.ok) throw new ValidationError(parsed.error)

    const counts = {
      agents: scanEntities(path.join(stagedRoot, 'agents'), '.md').length,
      workflows: scanEntityDirs(path.join(stagedRoot, 'workflows')).length,
      tasks: scanEntityDirs(path.join(stagedRoot, 'tasks')).length,
    }

    const bmadDir = path.join(app.fileStore.projectRoot, '_bmad')
    const existingDir = path.join(bmadDir, parsed.data.code)
    const willReplace = fs.existsSync(existingDir)

    // Entity collision detection: compare incoming names against existing index
    type Collision = { type: 'agent' | 'skill' | 'workflow'; name: string; existingModule: string }
    const collisions: Collision[] = []
    const incomingModuleCode = parsed.data.code
    const index = app.fileStore.getIndex()

    // Incoming agent names (from agents/*.md filenames)
    const agentFiles = scanEntities(path.join(stagedRoot, 'agents'), '.md')
    for (const agentFile of agentFiles) {
      const name = path.basename(agentFile, path.extname(agentFile)).replace(/\.agent$/, '')
      const existing = index.agents.find((a) => (a.name === name || a.id === name) && a.module && a.module !== incomingModuleCode)
      if (existing) collisions.push({ type: 'agent', name, existingModule: existing.module! })
    }

    // Incoming skill names (from skills dir)
    const skillsDir = path.join(stagedRoot, 'skills')
    if (fs.existsSync(skillsDir)) {
      const skillNames = fs.readdirSync(skillsDir, { withFileTypes: true })
        .filter((e) => e.isDirectory() || (e.isFile() && e.name.endsWith('.md')))
        .map((e) => e.isDirectory() ? e.name : path.basename(e.name, '.md'))
      for (const name of skillNames) {
        const existing = index.skills.find((s) => s.id === name && s.module && s.module !== incomingModuleCode)
        if (existing) collisions.push({ type: 'skill', name, existingModule: existing.module! })
      }
    }

    return { ok: true, moduleYaml: parsed.data, counts, willReplace, collisions }
  })

  // Polymorphic install endpoint — accepts npm | local | github source types via
  // { source: { type, value }, variables? }, plus the legacy { packageName } shape.
  // Zip uploads go to a separate multipart route POST /api/modules/install/upload (Story 15.4).
  app.post('/api/modules/install', async (request, reply) => {
    if (!('fileStore' in app)) {
      throw new ValidationError('No project detected')
    }

    const body = request.body as InstallBody | null

    // Defensive guard: if the request body is missing (e.g. a multipart upload sent
    // to this JSON-only route — multipart goes to /upload), fail loudly with a 422
    // instead of an unhandled TypeError. AC-15.4.11.
    if (!body || typeof body !== 'object') {
      throw new ValidationError(
        'Request body must be JSON. For zip uploads, POST to /api/modules/install/upload instead.',
      )
    }

    // TD-22 — discriminate source vs legacy. Prefer `source` if both are present.
    let source: InstallSource
    if (body.source) {
      source = body.source
      if (body.packageName) {
        request.log.warn(
          { packageName: body.packageName },
          'Both `source` and `packageName` provided to /api/modules/install — using `source`',
        )
      }
    } else if (body.packageName) {
      const pkg = body.packageName.trim()
      if (!pkg) {
        throw new ValidationError('Package name is required')
      }
      source = { type: 'npm', value: pkg }
    } else {
      throw new ValidationError('Either `source` or `packageName` is required')
    }

    // Story 15.5 — variables are now consumed (not just threaded through).
    const variables = body.variables ?? {}

    const bmadDir = path.join(app.fileStore.projectRoot, '_bmad')
    const manifestPath = path.join(bmadDir, '_config', 'manifest.yaml')

    // Hard requirement (AC-15.2.9 / finding #8): every install branch needs an existing manifest.
    // Without it, the installed module would be invisible to GET /api/modules.
    if (!fs.existsSync(manifestPath)) {
      throw new ValidationError(
        'Cannot install module: missing _bmad/_config/manifest.yaml. Run `npx bmad-method install` to initialise the project first.',
      )
    }

    // Story 15.5 — validate variables BEFORE any source-type branching so bad input
    // fails fast without wasting CPU on a download/extraction.
    const varValidation = validateVariables(variables)
    if (!varValidation.ok) throw new ValidationError(varValidation.error)

    // Helper to build the substitution context for a given module code. Used by every branch.
    const makeSubContext = (moduleCode: string): SubstitutionContext => ({
      moduleCode,
      projectRoot: app.fileStore.projectRoot,
      outputFolder: readOutputFolder(app.fileStore.projectRoot),
      variables,
    })

    // Helper to run the IDE skill generator for a freshly-installed module and
    // return per-IDE counts for the response shape (Story 15.6 / AC-15.6.8).
    // Re-reads the manifest to get the latest `ides[]` after the manifest update.
    const runGenerator = (moduleCode: string): Record<string, number> => {
      const updatedManifest = readManifestSafe(manifestPath)
      if (!updatedManifest) return {}
      const genResult = generateIdeSkillsForModule(
        app.fileStore.projectRoot,
        moduleCode,
        updatedManifest,
        app.fileStore.studioDir,
        app.fileStore,
      )
      if (!genResult.ok) throw new ValidationError(genResult.error)
      const counts: Record<string, number> = {}
      for (const [ide, skills] of Object.entries(genResult.skillsByIde)) {
        counts[ide] = skills.length
      }
      return counts
    }

    // ─────────────────────────────────────────────────────────────────────────
    // local source
    // ─────────────────────────────────────────────────────────────────────────
    if (source.type === 'local') {
      const sourcePath = path.isAbsolute(source.value)
        ? source.value
        : path.join(app.fileStore.projectRoot, source.value)

      if (!isPlausibleModuleDir(sourcePath)) {
        throw new ValidationError(
          `Path "${sourcePath}" does not look like a BMAD module — expected module.yaml or one of agents/skills/workflows/tasks`,
        )
      }

      const parsed = parseModuleYaml(sourcePath)
      if (!parsed.ok) throw new ValidationError(parsed.error)
      const moduleCode = parsed.data.code

      const destDir = path.join(bmadDir, moduleCode)

      // Story 17.3 — clean-slate re-install: silently remove any existing copy before writing.
      if (fs.existsSync(destDir)) {
        cleanRemoveModule(moduleCode, bmadDir, manifestPath)
      }

      const copyResult = copyDirThroughWriteService(
        sourcePath,
        destDir,
        app.fileStore.studioDir,
        app.fileStore,
      )
      if (!copyResult.ok) throw new ValidationError(copyResult.error)

      // Story 15.5 — substitute placeholders in installed text files BEFORE updating the manifest.
      const subResult = runVariableSubstitution(
        destDir,
        makeSubContext(moduleCode),
        app.fileStore.studioDir,
        app.fileStore,
      )
      if (!subResult.ok) throw new ValidationError(subResult.error)

      // Update manifest (guaranteed to exist by the check above)
      const manifest = readManifestSafe(manifestPath)!
      const now = new Date().toISOString()
      const existing = manifest.modules.find((m) => m.name === moduleCode)
      if (existing) {
        existing.lastUpdated = now
        existing.source = 'local'
        existing.npmPackage = null
        existing.repoUrl = sourcePath
      } else {
        manifest.modules.push({
          name: moduleCode,
          version: parsed.data.version ?? '1.0.0',
          installDate: now,
          lastUpdated: now,
          source: 'local',
          npmPackage: null,
          repoUrl: sourcePath,
        })
      }
      const wrote = writeManifestThroughWriteService(
        manifestPath,
        manifest,
        app.fileStore.studioDir,
        app.fileStore,
      )
      if (!wrote.ok) throw new ValidationError(wrote.error)

      // Story 15.6 — generate IDE launchers AFTER the manifest is committed.
      // A failure here leaves the user with an installed module + no launchers;
      // recovery is the "Regenerate IDE skills" button (Story 15.8).
      const skillsGenerated = runGenerator(moduleCode)

      app.fileStore.rebuild()
      reply.status(200)
      return {
        ok: true,
        modules: [moduleCode],
        filesCopied: { text: copyResult.textCount, binary: copyResult.binaryCount },
        skillsGenerated,
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // github source
    // ─────────────────────────────────────────────────────────────────────────
    if (source.type === 'github') {
      // parseGithubSource throws plain Error on invalid input — convert to ValidationError.
      let ghSource: GithubSource
      try {
        ghSource = parseGithubSource(source.value)
      } catch (err) {
        throw new ValidationError(err instanceof Error ? err.message : String(err))
      }

      // Story 15.9 — check previewCache before downloading. If the user clicked
      // "Fetch" then "Install" in quick succession the tarball is already on disk;
      // reuse it and skip the second download. Consume the cache entry (delete it)
      // so a future preview call re-downloads fresh content.
      const cacheKey = previewCacheKey(ghSource)
      const cachedEntry = getPreviewCacheEntry(cacheKey)

      let extractedRoot: string
      let tmpDir: string
      let resolvedBranch: string

      if (cachedEntry) {
        previewCache.delete(cacheKey) // consumed — install now owns cleanup
        extractedRoot = cachedEntry.extractedRoot
        tmpDir = cachedEntry.tmpDir
        resolvedBranch = cachedEntry.resolvedBranch
      } else {
        // No cache hit — download fresh.
        let downloaded
        try {
          downloaded = await downloadGithubTarball(ghSource)
        } catch (err) {
          throw new ValidationError(err instanceof Error ? err.message : String(err))
        }
        extractedRoot = downloaded.extractedRoot
        tmpDir = downloaded.tmpDir
        resolvedBranch = downloaded.resolvedBranch
      }

      try {
        // Navigate to the optional subpath
        const moduleSrc = ghSource.subpath
          ? path.join(extractedRoot, ghSource.subpath)
          : extractedRoot

        if (!isPlausibleModuleDir(moduleSrc)) {
          throw new ValidationError(
            `${ghSource.owner}/${ghSource.repo}${ghSource.subpath ? `/${ghSource.subpath}` : ''} does not look like a BMAD module`,
          )
        }

        const parsed = parseModuleYaml(moduleSrc)
        if (!parsed.ok) throw new ValidationError(parsed.error)
        const moduleCode = parsed.data.code

        const destDir = path.join(bmadDir, moduleCode)

        // Story 17.3 — clean-slate re-install.
        if (fs.existsSync(destDir)) {
          cleanRemoveModule(moduleCode, bmadDir, manifestPath)
        }

        const copyResult = copyDirThroughWriteService(
          moduleSrc,
          destDir,
          app.fileStore.studioDir,
          app.fileStore,
        )
        if (!copyResult.ok) throw new ValidationError(copyResult.error)

        // Story 15.5 — substitute placeholders before manifest update
        const subResult = runVariableSubstitution(
          destDir,
          makeSubContext(moduleCode),
          app.fileStore.studioDir,
          app.fileStore,
        )
        if (!subResult.ok) throw new ValidationError(subResult.error)

        // Update manifest (guaranteed to exist by the check at the top of the handler)
        const manifest = readManifestSafe(manifestPath)!
        const now = new Date().toISOString()
        const repoUrl = `https://github.com/${ghSource.owner}/${ghSource.repo}`
        const existing = manifest.modules.find((m) => m.name === moduleCode)
        if (existing) {
          existing.lastUpdated = now
          existing.source = 'github'
          existing.repoUrl = repoUrl
          existing.npmPackage = null
        } else {
          manifest.modules.push({
            name: moduleCode,
            version: parsed.data.version ?? '1.0.0',
            installDate: now,
            lastUpdated: now,
            source: 'github',
            npmPackage: null,
            repoUrl,
          })
        }
        const wrote = writeManifestThroughWriteService(
          manifestPath,
          manifest,
          app.fileStore.studioDir,
          app.fileStore,
        )
        if (!wrote.ok) throw new ValidationError(wrote.error)

        // Story 15.6 — generate IDE launchers after manifest commit
        const skillsGenerated = runGenerator(moduleCode)

        app.fileStore.rebuild()
        reply.status(200)
        return {
          ok: true,
          modules: [moduleCode],
          filesCopied: { text: copyResult.textCount, binary: copyResult.binaryCount },
          source: { type: 'github' as const, value: source.value, branch: resolvedBranch },
          skillsGenerated,
        }
      } finally {
        try {
          fs.rmSync(tmpDir, { recursive: true, force: true })
        } catch {
          /* ignore cleanup errors */
        }
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Guard: reject unknown source types before falling through to npm.
    // The InstallSource union only allows 'npm'|'local'|'github', but the body
    // is untyped at the HTTP boundary — 'zip' or any other string would silently
    // run `npm pack <value>` without this check.
    // Cast to string to sidestep TS control-flow narrowing (source is already
    // narrowed to the npm variant by this point, so source.type === 'npm' always,
    // but this guard provides a runtime safety net for unexpected payloads).
    // ─────────────────────────────────────────────────────────────────────────
    const sourceTypeStr = (source as { type: string }).type
    if (sourceTypeStr !== 'npm') {
      throw new ValidationError(
        `Unknown source type "${sourceTypeStr}". Valid types: local, github, npm. For zip uploads use POST /api/modules/install/upload.`,
      )
    }

    // ─────────────────────────────────────────────────────────────────────────
    // npm source — refactored to route writes through WriteService
    // ─────────────────────────────────────────────────────────────────────────
    const packageName = source.value
    // TD-20 — realpathSync resolves the macOS /var → /private/var symlink so
    // path comparisons inside the install loop are stable.
    const tmpDir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'bmad-install-')))

    try {
      // 1. Download the package tarball via npm pack
      execSync(`npm pack ${packageName} --pack-destination ${tmpDir}`, {
        cwd: tmpDir,
        stdio: 'pipe',
        timeout: 60000,
      })

      // 2. Find the tarball file
      const tarballs = fs.readdirSync(tmpDir).filter((f) => f.endsWith('.tgz'))
      if (tarballs.length === 0) {
        throw new ValidationError('No tarball downloaded')
      }

      const tarballPath = path.join(tmpDir, tarballs[0])

      // 3. Extract the tarball
      const extractDir = path.join(tmpDir, 'extracted')
      fs.mkdirSync(extractDir, { recursive: true })
      execSync(`tar -xzf "${tarballPath}" -C "${extractDir}"`, {
        cwd: tmpDir,
        stdio: 'pipe',
        timeout: 30000,
      })

      // 4. Look for _bmad/ directory inside the extracted package
      // npm pack extracts to a 'package/' directory
      const packageDir = path.join(extractDir, 'package')
      const bmadSrcDir = path.join(packageDir, '_bmad')

      if (!fs.existsSync(bmadSrcDir)) {
        throw new ValidationError(
          `Package "${packageName}" does not contain a _bmad/ directory`,
        )
      }

      // 5. Copy module directories from the package's _bmad/ into the project's _bmad/
      // Routes through WriteService for text files, byte-copies binaries (TD-16).
      const installedModules: string[] = []
      let totalText = 0
      let totalBinary = 0
      for (const entry of fs.readdirSync(bmadSrcDir, { withFileTypes: true })) {
        if (entry.isDirectory() && entry.name !== '_config') {
          const srcModuleDir = path.join(bmadSrcDir, entry.name)

          // Read module.yaml for the authoritative module code (AC-15.2.8).
          // Falls back to the directory name if module.yaml is absent or doesn't
          // declare a code field — consistent with local/github/zip branches.
          const parsedMod = parseModuleYaml(srcModuleDir)
          if (!parsedMod.ok) throw new ValidationError(parsedMod.error)
          const moduleCode = parsedMod.data.code

          const destModuleDir = path.join(bmadDir, moduleCode)

          // Story 17.3 — clean-slate re-install.
          if (fs.existsSync(destModuleDir)) {
            cleanRemoveModule(moduleCode, bmadDir, manifestPath)
          }

          const copyResult = copyDirThroughWriteService(
            srcModuleDir,
            destModuleDir,
            app.fileStore.studioDir,
            app.fileStore,
          )
          if (!copyResult.ok) throw new ValidationError(copyResult.error)
          totalText += copyResult.textCount
          totalBinary += copyResult.binaryCount

          // Story 15.5 — substitute placeholders in each installed module dir.
          const subResult = runVariableSubstitution(
            destModuleDir,
            makeSubContext(moduleCode),
            app.fileStore.studioDir,
            app.fileStore,
          )
          if (!subResult.ok) throw new ValidationError(subResult.error)

          installedModules.push(moduleCode)
        }
      }

      if (installedModules.length === 0) {
        throw new ValidationError(
          `Package "${packageName}" has no module directories in _bmad/`,
        )
      }

      // 6. Update manifest.yaml with new module entries (snapshot via WriteService)
      const manifest = readManifestSafe(manifestPath)!
      const now = new Date().toISOString()

      for (const moduleName of installedModules) {
        const existing = manifest.modules.find((m) => m.name === moduleName)
        if (existing) {
          existing.lastUpdated = now
          existing.npmPackage = packageName
          existing.source = 'npm'
        } else {
          manifest.modules.push({
            name: moduleName,
            version: '1.0.0',
            installDate: now,
            lastUpdated: now,
            source: 'npm',
            npmPackage: packageName,
            repoUrl: null,
          })
        }
      }

      const wrote = writeManifestThroughWriteService(
        manifestPath,
        manifest,
        app.fileStore.studioDir,
        app.fileStore,
      )
      if (!wrote.ok) throw new ValidationError(wrote.error)

      // Story 15.6 — generate IDE launchers for each installed module.
      // The npm branch installs MULTIPLE modules; sum the per-IDE counts.
      const skillsGenerated: Record<string, number> = {}
      for (const moduleName of installedModules) {
        const counts = runGenerator(moduleName)
        for (const [ide, count] of Object.entries(counts)) {
          skillsGenerated[ide] = (skillsGenerated[ide] ?? 0) + count
        }
      }

      // 7. Rebuild file store
      app.fileStore.rebuild()

      reply.status(200)
      return {
        ok: true,
        modules: installedModules,
        filesCopied: { text: totalText, binary: totalBinary },
        skillsGenerated,
      }
    } catch (err) {
      // Rethrow known error types so the global handler produces the correct
      // status (422 for ValidationError, 409 for ConflictError). Wrap any
      // unexpected error (e.g. execSync failure) as a ValidationError.
      if (err instanceof ValidationError || err instanceof ConflictError || err instanceof NotFoundError) {
        throw err
      }
      throw new ValidationError(err instanceof Error ? err.message : 'Installation failed')
    } finally {
      // Cleanup temp directory
      try {
        fs.rmSync(tmpDir, { recursive: true, force: true })
      } catch {
        // ignore cleanup errors
      }
    }
  })

  // Multipart zip upload route — Story 15.4. Separate from POST /api/modules/install
  // because multipart bodies and JSON bodies have different shapes inside Fastify;
  // splitting the routes is cleaner than content-type discrimination inside one handler.
  app.post('/api/modules/install/upload', async (request, reply) => {
    if (!('fileStore' in app)) {
      throw new ValidationError('No project detected')
    }

    // Iterate all multipart parts in stream order so the `variables` field is
    // captured regardless of whether it arrives before or after the file part.
    // Using request.parts() instead of request.file() avoids the ordering bug
    // where data.fields is only populated for fields that precede the file.
    let zipBuffer: Buffer | null = null
    let uploadVariables: Record<string, string> = {}

    for await (const part of request.parts()) {
      if (part.type === 'file') {
        zipBuffer = await part.toBuffer()
      } else if (part.type === 'field' && part.fieldname === 'variables') {
        const raw = part.value as string
        if (typeof raw === 'string') {
          try {
            const parsed = JSON.parse(raw)
            if (parsed && typeof parsed === 'object') {
              uploadVariables = parsed as Record<string, string>
            }
          } catch {
            throw new ValidationError('Invalid `variables` field — expected JSON object')
          }
        }
      }
    }

    if (!zipBuffer) {
      throw new ValidationError('No zip file uploaded')
    }

    const buffer = zipBuffer
    const varValidation = validateVariables(uploadVariables)
    if (!varValidation.ok) throw new ValidationError(varValidation.error)

    const bmadDir = path.join(app.fileStore.projectRoot, '_bmad')
    const manifestPath = path.join(bmadDir, '_config', 'manifest.yaml')

    // Manifest existence guard (AC-15.4.9). Runs BEFORE extractZipUpload so a
    // misconfigured project doesn't waste CPU on adm-zip extraction.
    if (!fs.existsSync(manifestPath)) {
      throw new ValidationError(
        'Cannot install module: missing _bmad/_config/manifest.yaml. Run `npx bmad-method install` to initialise the project first.',
      )
    }

    // extractZipUpload throws plain Error on failure (malformed zip, zip-slip, etc.)
    // Convert to ValidationError so the user sees a 422 with a clean message.
    let extracted
    try {
      extracted = await extractZipUpload(buffer)
    } catch (err) {
      throw new ValidationError(err instanceof Error ? err.message : String(err))
    }

    const { extractedRoot, tmpDir } = extracted

    try {
      if (!isPlausibleModuleDir(extractedRoot)) {
        throw new ValidationError('Uploaded zip does not look like a BMAD module')
      }

      const parsed = parseModuleYaml(extractedRoot)
      if (!parsed.ok) throw new ValidationError(parsed.error)
      const moduleCode = parsed.data.code

      const destDir = path.join(bmadDir, moduleCode)

      // Story 17.3 — clean-slate re-install.
      if (fs.existsSync(destDir)) {
        cleanRemoveModule(moduleCode, bmadDir, manifestPath)
      }

      const copyResult = copyDirThroughWriteService(
        extractedRoot,
        destDir,
        app.fileStore.studioDir,
        app.fileStore,
      )
      if (!copyResult.ok) throw new ValidationError(copyResult.error)

      // Story 15.5 — substitute placeholders before manifest update
      const subResult = runVariableSubstitution(
        destDir,
        {
          moduleCode,
          projectRoot: app.fileStore.projectRoot,
          outputFolder: readOutputFolder(app.fileStore.projectRoot),
          variables: uploadVariables,
        },
        app.fileStore.studioDir,
        app.fileStore,
      )
      if (!subResult.ok) throw new ValidationError(subResult.error)

      // Update manifest (guaranteed to exist by the check at the top of the handler)
      const manifest = readManifestSafe(manifestPath)!
      const now = new Date().toISOString()
      const existing = manifest.modules.find((m) => m.name === moduleCode)
      if (existing) {
        existing.lastUpdated = now
        existing.source = 'zip'
        existing.npmPackage = null
        existing.repoUrl = null
      } else {
        manifest.modules.push({
          name: moduleCode,
          version: parsed.data.version ?? '1.0.0',
          installDate: now,
          lastUpdated: now,
          source: 'zip',
          npmPackage: null,
          repoUrl: null,
        })
      }
      const wrote = writeManifestThroughWriteService(
        manifestPath,
        manifest,
        app.fileStore.studioDir,
        app.fileStore,
      )
      if (!wrote.ok) throw new ValidationError(wrote.error)

      // Story 15.6 — generate IDE launchers after manifest commit
      const updatedManifest = readManifestSafe(manifestPath)
      const skillsGenerated: Record<string, number> = {}
      if (updatedManifest) {
        const genResult = generateIdeSkillsForModule(
          app.fileStore.projectRoot,
          moduleCode,
          updatedManifest,
          app.fileStore.studioDir,
          app.fileStore,
        )
        if (!genResult.ok) throw new ValidationError(genResult.error)
        for (const [ide, skills] of Object.entries(genResult.skillsByIde)) {
          skillsGenerated[ide] = skills.length
        }
      }

      app.fileStore.rebuild()
      reply.status(200)
      return {
        ok: true,
        modules: [moduleCode],
        filesCopied: { text: copyResult.textCount, binary: copyResult.binaryCount },
        source: { type: 'zip' as const },
        skillsGenerated,
      }
    } finally {
      try {
        fs.rmSync(tmpDir, { recursive: true, force: true })
      } catch {
        /* ignore cleanup errors */
      }
    }
  })

  app.post('/api/modules', async (request, reply) => {
    if (!('fileStore' in app)) {
      throw new ValidationError('No project detected')
    }

    const body = request.body as { name?: string; description?: string; version?: string }
    const name = body.name?.trim()

    if (!name) {
      throw new ValidationError('Module name is required')
    }
    if (!MODULE_NAME_RE.test(name)) {
      throw new ValidationError(
        'Module name must be lowercase alphanumeric with hyphens (e.g., my-module)',
      )
    }

    const bmadDir = path.join(app.fileStore.projectRoot, '_bmad')
    const moduleDir = path.join(bmadDir, name)
    const manifestPath = path.join(bmadDir, '_config', 'manifest.yaml')

    if (fs.existsSync(moduleDir)) {
      throw new ConflictError(`Module "${name}" already exists`)
    }

    // Create module directory structure
    const subdirs = ['agents', 'skills', 'workflows']
    for (const sub of subdirs) {
      fs.mkdirSync(path.join(moduleDir, sub), { recursive: true })
    }

    // Create module config.yaml
    const version = body.version?.trim() || '1.0.0'
    const configContent = [
      `# ${name} Module Configuration`,
      `# Created by BMAD Studio`,
      `# Date: ${new Date().toISOString()}`,
      '',
      `project_name: ${name}`,
    ].join('\n')
    const wResult = writeFile(path.join(moduleDir, 'config.yaml'), configContent, app.fileStore.studioDir)
    if (!wResult.ok) throw new ValidationError(wResult.error)

    // Update manifest
    const manifest = readManifestSafe(manifestPath)
    if (manifest) {
      const now = new Date().toISOString()
      manifest.modules.push({
        name,
        version,
        installDate: now,
        lastUpdated: now,
        source: 'custom',
        npmPackage: null,
        repoUrl: null,
      })
      const wrote = writeManifestThroughWriteService(
        manifestPath,
        manifest,
        app.fileStore.studioDir,
        app.fileStore,
      )
      if (!wrote.ok) throw new ValidationError(wrote.error)
    }

    // Rebuild index
    app.fileStore.rebuild()

    reply.status(201)
    return { ok: true, name }
  })

  // Story 15.8 — Regenerate IDE skills for an installed module. Removes all
  // prefix-matched launcher dirs and re-runs the generator against the current
  // module contents. Used by the "Regenerate IDE skills" button on PackagesPage
  // and as the Q9 smoke test for dept-aem.
  app.post('/api/modules/:name/regenerate-skills', async (request) => {
    if (!('fileStore' in app)) {
      throw new ValidationError('No project detected')
    }
    const { name } = request.params as { name: string }
    const bmadDir = path.join(app.fileStore.projectRoot, '_bmad')
    const moduleDir = path.join(bmadDir, name)
    const manifestPath = path.join(bmadDir, '_config', 'manifest.yaml')

    if (!fs.existsSync(moduleDir)) {
      throw new NotFoundError(`Module "${name}" is not installed`)
    }
    const manifest = readManifestSafe(manifestPath)
    if (!manifest) throw new ValidationError('No manifest.yaml found')

    // Remove existing launcher files first (snapshots text content via WriteService)
    const removeResult = removeIdeSkillsForModule(
      app.fileStore.projectRoot,
      name,
      manifest,
      app.fileStore.studioDir,
    )
    if (!removeResult.ok) throw new ValidationError(removeResult.error)

    // Regenerate from the current module contents — picks up any manual edits.
    const genResult = generateIdeSkillsForModule(
      app.fileStore.projectRoot,
      name,
      manifest,
      app.fileStore.studioDir,
      app.fileStore,
    )
    if (!genResult.ok) throw new ValidationError(genResult.error)

    const regenerated: Record<string, number> = {}
    for (const [ide, skills] of Object.entries(genResult.skillsByIde)) {
      regenerated[ide] = skills.length
    }

    app.fileStore.rebuild()
    return { ok: true, regenerated }
  })

  // Story 15.7 — Remove preview. Returns a structured pre-flight summary so the
  // remove dialog (Story 15.9) can render an informed confirmation screen.
  app.get('/api/modules/:name/remove-preview', async (request) => {
    if (!('fileStore' in app)) {
      throw new ValidationError('No project detected')
    }

    const { name } = request.params as { name: string }
    const bmadDir = path.join(app.fileStore.projectRoot, '_bmad')
    const moduleDir = path.join(bmadDir, name)
    const manifestPath = path.join(bmadDir, '_config', 'manifest.yaml')

    const manifest = readManifestSafe(manifestPath)
    const entry = manifest?.modules.find((m) => m.name === name)
    if (!entry) throw new NotFoundError(`Module "${name}" not found in manifest`)

    // Built-in modules: blocked
    const removalBlocked =
      entry.source === 'built-in'
        ? `Module "${name}" is built-in and cannot be removed via Studio.`
        : null

    // Module file count + size
    let fileCount = 0
    let totalBytes = 0
    if (fs.existsSync(moduleDir)) {
      const walk = (dir: string) => {
        for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
          const full = path.join(dir, e.name)
          if (e.isDirectory()) walk(full)
          else {
            fileCount++
            totalBytes += fs.statSync(full).size
          }
        }
      }
      walk(moduleDir)
    }

    // IDE skills (prefix-matched dirs under each configured IDE output dir)
    const ideSkills: Record<string, string[]> = {}
    if (manifest?.ides) {
      for (const ide of manifest.ides) {
        if (ide !== 'claude-code' && ide !== 'antigravity') continue
        const dir = path.join(
          app.fileStore.projectRoot,
          ide === 'claude-code' ? '.claude/skills' : '.antigravity/skills',
        )
        if (!fs.existsSync(dir)) {
          ideSkills[ide] = []
          continue
        }
        const agentPrefix = `bmad-agent-${name}-`
        const otherPrefix = `bmad-${name}-`
        ideSkills[ide] = fs
          .readdirSync(dir, { withFileTypes: true })
          .filter(
            (e) =>
              e.isDirectory() &&
              (e.name.startsWith(agentPrefix) || e.name.startsWith(otherPrefix)),
          )
          .map((e) => e.name)
      }
    }

    // Preserved directories from module.yaml (declared output dirs)
    const parsed = parseModuleYaml(moduleDir)
    const preservedDirectories: { path: string; declared: boolean }[] = []
    let moduleYamlPresent = false
    if (parsed.ok && fs.existsSync(path.join(moduleDir, 'module.yaml'))) {
      moduleYamlPresent = true
      for (const declared of parsed.data.directories ?? []) {
        const resolved = path.isAbsolute(declared)
          ? declared
          : path.join(app.fileStore.projectRoot, declared)
        if (fs.existsSync(resolved)) {
          preservedDirectories.push({ path: resolved, declared: true })
        }
      }
    }

    // Cross-references (TD-19 scope)
    const crossReferences = findCrossReferences(app.fileStore.getIndex(), name)

    // External-installer warning
    const externalInstallerWarning =
      entry.source === 'external'
        ? `Module "${name}" was installed by the BMAD installer. Removing it via Studio will not update the upstream installation — re-running the installer will reinstall it.`
        : null

    return {
      module: { name: entry.name, version: entry.version, source: entry.source },
      moduleFiles: { count: fileCount, totalBytes },
      ideSkills,
      manifestEntries: { 'manifest.yaml': true },
      preservedDirectories,
      moduleYamlPresent,
      crossReferences,
      crossReferenceScopeNotice:
        'Cross-reference scanning covers teams and workflow steps. References from agent menus or skill lists are not detected — review the affected modules manually after removal.',
      recoverableFrom: '.bmad-studio/history/',
      removalBlocked,
      externalInstallerWarning,
    }
  })

  // Story 15.7 — Rich remove handler. Replaces the thin DELETE. Removes IDE
  // launcher files, then deletes the module dir through WriteService (text
  // files snapshot to history/ before unlink), then removes the manifest entry.
  // Preserves directories declared in module.yaml.directories[].
  app.delete('/api/modules/:name', async (request) => {
    if (!('fileStore' in app)) {
      throw new ValidationError('No project detected')
    }

    const { name } = request.params as { name: string }
    const bmadDir = path.join(app.fileStore.projectRoot, '_bmad')
    const moduleDir = path.join(bmadDir, name)
    const manifestPath = path.join(bmadDir, '_config', 'manifest.yaml')

    const manifest = readManifestSafe(manifestPath)
    const entry = manifest?.modules.find((m) => m.name === name)
    if (!entry) throw new NotFoundError(`Module "${name}" not found in manifest`)
    if (entry.source === 'built-in') {
      throw new ValidationError(`Cannot remove built-in module "${name}"`)
    }

    // Read module.yaml BEFORE deletion so we can capture directories: to preserve.
    const parsed = parseModuleYaml(moduleDir)
    const preserved: string[] =
      parsed.ok
        ? (parsed.data.directories ?? []).map((d) =>
            path.isAbsolute(d) ? d : path.join(app.fileStore.projectRoot, d),
          )
        : []

    // 1. Remove prefix-matched IDE skill directories (each deletion snapshots through WriteService)
    let removedSkills: Record<string, string[]> = {}
    if (manifest) {
      const r = removeIdeSkillsForModule(
        app.fileStore.projectRoot,
        name,
        manifest,
        app.fileStore.studioDir,
      )
      if (!r.ok) throw new ValidationError(r.error)
      removedSkills = r.removedByIde
    }

    // 2. Delete the module directory through WriteService (text files snapshot first).
    //    Count files before delete so the response summary is accurate.
    let filesRemoved = 0
    if (fs.existsSync(moduleDir)) {
      const walk = (dir: string) => {
        for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
          const full = path.join(dir, e.name)
          if (e.isDirectory()) walk(full)
          else filesRemoved++
        }
      }
      walk(moduleDir)
      const r = deleteDirectory(moduleDir, app.fileStore.studioDir)
      if (!r.ok) throw new ValidationError(r.error)
    }

    // 3. Update the manifest (snapshot via WriteService)
    if (manifest) {
      manifest.modules = manifest.modules.filter((m) => m.name !== name)
      const wrote = writeManifestThroughWriteService(
        manifestPath,
        manifest,
        app.fileStore.studioDir,
        app.fileStore,
      )
      if (!wrote.ok) throw new ValidationError(wrote.error)
    }

    // 4. Rebuild index and broadcast the change
    app.fileStore.rebuild()
    if ('ws' in app) {
      try {
        ;(app as unknown as { ws: { broadcast: (event: unknown) => void } }).ws.broadcast({
          type: 'file:deleted',
          path: moduleDir,
          category: 'config',
        })
      } catch {
        /* ignore — broadcast is best-effort */
      }
    }

    return {
      ok: true,
      name,
      removed: {
        filesRemoved,
        skills: removedSkills,
      },
      preservedDirectories: preserved,
      recoverableFrom: '.bmad-studio/history/',
    }
  })

  // Story 12.1 + 12.2: Add/upload entities to a module
  app.post('/api/modules/:name/entities', async (request, reply) => {
    if (!('fileStore' in app)) {
      throw new ValidationError('No project detected')
    }

    const { name } = request.params as { name: string }
    if (!MODULE_NAME_RE.test(name)) {
      throw new ValidationError('Module name must be lowercase alphanumeric with hyphens')
    }
    const body = request.body as {
      type?: string
      name?: string
      content?: string
    }

    const entityType = body.type
    const entityName = body.name?.trim()
    const entityContent = body.content

    if (!entityType || !['agent', 'skill', 'workflow'].includes(entityType)) {
      throw new ValidationError('Entity type must be one of: agent, skill, workflow')
    }
    if (!entityName) {
      throw new ValidationError('Entity name is required')
    }

    const bmadDir = path.join(app.fileStore.projectRoot, '_bmad')
    const moduleDir = path.join(bmadDir, name)

    if (!fs.existsSync(moduleDir)) {
      throw new NotFoundError(`Module "${name}" not found`)
    }

    let filePath: string

    if (entityType === 'skill') {
      // Skills get their own directory with a SKILL.md file (matches index-builder convention)
      const sanitized = entityName.replace(/\.md$/i, '')
      const skillDir = path.join(moduleDir, 'skills', sanitized)
      fs.mkdirSync(skillDir, { recursive: true })
      filePath = path.join(skillDir, 'SKILL.md')

      if (fs.existsSync(filePath)) {
        throw new ConflictError(`Skill "${sanitized}" already exists in module "${name}"`)
      }

      const content = entityContent ?? [
        '---',
        `name: ${sanitized}`,
        'category: custom',
        'description: ""',
        '---',
        '',
        `# ${sanitized}`,
        '',
        '<!-- Add skill instructions here -->',
        '',
      ].join('\n')

      const wResult = writeFile(filePath, content, app.fileStore.studioDir)
      if (!wResult.ok) throw new ValidationError(wResult.error)
    } else if (entityType === 'workflow') {
      // Workflows get their own directory with a workflow.md file
      const sanitized = entityName.replace(/\.md$/i, '')
      const wfDir = path.join(moduleDir, 'workflows', sanitized)
      fs.mkdirSync(wfDir, { recursive: true })
      filePath = path.join(wfDir, 'workflow.md')

      if (fs.existsSync(filePath)) {
        throw new ConflictError(`Workflow "${sanitized}" already exists in module "${name}"`)
      }

      const content = entityContent ?? [
        '---',
        `name: ${sanitized}`,
        'description: ""',
        '---',
        '',
        `# ${sanitized} Workflow`,
        '',
        '## Step 1: Start',
        '',
        '<!-- Add workflow steps here -->',
        '',
      ].join('\n')

      const wResult = writeFile(filePath, content, app.fileStore.studioDir)
      if (!wResult.ok) throw new ValidationError(wResult.error)
    } else {
      // Agent: .md file in agents/ directory
      const sanitized = entityName.replace(/\.md$/i, '')
      const agentDir = path.join(moduleDir, 'agents')
      fs.mkdirSync(agentDir, { recursive: true })
      filePath = path.join(agentDir, `${sanitized}.md`)

      if (fs.existsSync(filePath)) {
        throw new ConflictError(`Agent "${sanitized}" already exists in module "${name}"`)
      }

      const content = entityContent ?? [
        '---',
        `name: ${sanitized}`,
        'title: ""',
        'description: ""',
        '---',
        '',
        `# ${sanitized}`,
        '',
        '<!-- Add agent definition here -->',
        '',
      ].join('\n')

      const wResult = writeFile(filePath, content, app.fileStore.studioDir)
      if (!wResult.ok) throw new ValidationError(wResult.error)
    }

    // Rebuild index
    app.fileStore.rebuild()

    reply.status(201)
    return { ok: true, type: entityType, name: entityName }
  })

  // Story 12.3: Export module manifest
  app.post('/api/modules/:name/export', async (request) => {
    if (!('fileStore' in app)) {
      throw new ValidationError('No project detected')
    }

    const { name } = request.params as { name: string }
    const bmadDir = path.join(app.fileStore.projectRoot, '_bmad')
    const manifestPath = path.join(bmadDir, '_config', 'manifest.yaml')

    const manifest = readManifestSafe(manifestPath)
    if (!manifest) {
      throw new NotFoundError('No manifest found')
    }

    const entry = manifest.modules.find((m) => m.name === name)
    if (!entry) {
      throw new NotFoundError(`Module "${name}" not found in manifest`)
    }

    const moduleDir = path.join(bmadDir, name)
    if (!fs.existsSync(moduleDir)) {
      throw new NotFoundError(`Module directory "${name}" not found`)
    }

    const index = app.fileStore.getIndex()
    const agentCount = index.agents.filter((a) => a.module === name).length
    const skillCount = index.skills.filter((s) => s.module === name).length
    const workflowCount = index.workflows.filter((w) => w.module === name).length

    // List entity names
    const agentNames = index.agents.filter((a) => a.module === name).map((a) => a.name)
    const skillNames = index.skills.filter((s) => s.module === name).map((s) => s.name)
    const workflowNames = index.workflows.filter((w) => w.module === name).map((w) => w.name)

    const exportManifest = {
      module: name,
      version: entry.version,
      source: entry.source,
      exportDate: new Date().toISOString(),
      entities: {
        agents: { count: agentCount, names: agentNames },
        skills: { count: skillCount, names: skillNames },
        workflows: { count: workflowCount, names: workflowNames },
      },
      totalEntities: agentCount + skillCount + workflowCount,
      note: 'This is a module manifest preview. Full file bundling/archiving is a future enhancement.',
    }

    return exportManifest
  })

  // Update module metadata (version, description)
  app.put<{ Params: { name: string } }>('/api/modules/:name', async (request) => {
    if (!('fileStore' in app)) {
      throw new ValidationError('No project detected')
    }

    const { name } = request.params as { name: string }
    if (!MODULE_NAME_RE.test(name)) {
      throw new ValidationError('Module name must be lowercase alphanumeric with hyphens')
    }
    const body = request.body as { version?: string; description?: string }

    const bmadDir = path.join(app.fileStore.projectRoot, '_bmad')
    const moduleDir = path.join(bmadDir, name)
    const configPath = path.join(moduleDir, 'config.yaml')

    if (!fs.existsSync(configPath)) {
      throw new NotFoundError(`Module "${name}" config not found`)
    }

    const configContent = fs.readFileSync(configPath, 'utf-8')
    const config: Record<string, unknown> = (yaml.load(configContent) as Record<string, unknown> | null) ?? {}

    if (body.version !== undefined) config.version = body.version
    if (body.description !== undefined) config.description = body.description

    const updated = yaml.dump(config, { lineWidth: -1 })
    const wResult = writeFile(configPath, updated, app.fileStore.studioDir)
    if (!wResult.ok) throw new ValidationError(wResult.error)

    // Also update manifest.yaml
    const manifestPath = path.join(bmadDir, '_config', 'manifest.yaml')
    const manifest = readManifestSafe(manifestPath)
    if (manifest) {
      const mod = manifest.modules.find((m) => m.name === name)
      if (mod) {
        if (body.version !== undefined) mod.version = body.version
        mod.lastUpdated = new Date().toISOString()
        const wrote = writeManifestThroughWriteService(
          manifestPath,
          manifest,
          app.fileStore.studioDir,
          app.fileStore,
        )
        if (!wrote.ok) throw new ValidationError(wrote.error)
      }
    }

    app.fileStore.rebuild()
    return { ok: true, name }
  })

  app.get('/api/modules', async () => {
    if (!('fileStore' in app)) {
      return []
    }

    const bmadDir = path.join(app.fileStore.projectRoot, '_bmad')
    const manifestPath = path.join(bmadDir, '_config', 'manifest.yaml')

    const manifest = readManifestSafe(manifestPath)
    if (!manifest) {
      return []
    }

    const index = app.fileStore.getIndex()

    return manifest.modules.map((m) => {
      const moduleAgents = index.agents.filter((a) => a.module === m.name)
      const moduleSkills = index.skills.filter((s) => s.module === m.name)
      const moduleWorkflows = index.workflows.filter((w) => w.module === m.name)
      const moduleTeams = index.teams.filter((t) => t.module === m.name)
      return {
        ...m,
        agentCount: moduleAgents.length,
        skillCount: moduleSkills.length,
        workflowCount: moduleWorkflows.length,
        teamCount: moduleTeams.length,
        agents: moduleAgents.map((a) => ({ id: a.id, name: a.name, title: a.title })),
        skills: moduleSkills.map((s) => ({ id: s.id, name: s.name })),
        workflows: moduleWorkflows.map((w) => ({ id: w.id, name: w.name })),
        teams: moduleTeams.map((t) => ({ id: t.id, name: t.name })),
      }
    })
  })

  // Package export: create a curated .tar.gz of selected entities
  app.post('/api/packages/export', async (request, reply) => {
    if (!('fileStore' in app)) {
      throw new ValidationError('No project detected')
    }

    const body = request.body as {
      name?: string
      description?: string
      version?: string
      agents?: string[]
      skills?: string[]
      workflows?: string[]
    }

    const name = body.name?.trim()
    if (!name) {
      throw new ValidationError('Package name is required')
    }
    if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(name)) {
      throw new ValidationError('Package name must start with a letter or digit and contain only alphanumeric characters, hyphens, or underscores')
    }

    const description = body.description?.trim() || ''
    const version = body.version?.trim() || '1.0.0'
    const agentIds = body.agents ?? []
    const skillIds = body.skills ?? []
    const workflowIds = body.workflows ?? []

    if (agentIds.length === 0 && skillIds.length === 0 && workflowIds.length === 0) {
      throw new ValidationError('At least one entity must be selected for export')
    }

    const index = app.fileStore.getIndex()

    // Create temp directory
    const tmpBase = fs.mkdtempSync(path.join(os.tmpdir(), 'bmad-export-'))
    const packageDir = path.join(tmpBase, name)
    fs.mkdirSync(path.join(packageDir, 'agents'), { recursive: true })
    fs.mkdirSync(path.join(packageDir, 'skills'), { recursive: true })
    fs.mkdirSync(path.join(packageDir, 'workflows'), { recursive: true })

    const includedAgents: Array<{ id: string; name: string }> = []
    const includedSkills: Array<{ id: string; name: string }> = []
    const includedWorkflows: Array<{ id: string; name: string }> = []

    try {
      // Copy agents
      for (const agentId of agentIds) {
        const agent = index.agents.find((a) => a.id === agentId)
        if (agent && fs.existsSync(agent.filePath)) {
          const destFile = path.join(packageDir, 'agents', path.basename(agent.filePath))
          fs.copyFileSync(agent.filePath, destFile)
          includedAgents.push({ id: agent.id, name: agent.name })
        }
      }

      // Copy skills (entire directory)
      for (const skillId of skillIds) {
        const skill = index.skills.find((s) => s.id === skillId)
        if (skill && fs.existsSync(skill.filePath)) {
          const skillSourceDir = path.dirname(skill.filePath)
          const destDir = path.join(packageDir, 'skills', path.basename(skillSourceDir))
          fs.cpSync(skillSourceDir, destDir, { recursive: true })
          includedSkills.push({ id: skill.id, name: skill.name })
        }
      }

      // Copy workflows (entire directory)
      for (const wfId of workflowIds) {
        const wf = index.workflows.find((w) => w.id === wfId)
        if (wf && fs.existsSync(wf.filePath)) {
          const wfSourceDir = path.dirname(wf.filePath)
          const destDir = path.join(packageDir, 'workflows', path.basename(wfSourceDir))
          fs.cpSync(wfSourceDir, destDir, { recursive: true })
          includedWorkflows.push({ id: wf.id, name: wf.name })
        }
      }

      // Generate package.yaml manifest
      const packageManifest = {
        name,
        description,
        version,
        created: new Date().toISOString(),
        platform: 'bmad-v6',
        agents: includedAgents,
        skills: includedSkills,
        workflows: includedWorkflows,
      }

      fs.writeFileSync(
        path.join(packageDir, 'package.yaml'),
        yaml.dump(packageManifest, { lineWidth: -1 }),
        'utf-8',
      )

      // Create tar.gz archive
      const archivePath = path.join(tmpBase, `${name}.tar.gz`)
      const tarResult = spawnSync('tar', ['-czf', archivePath, '-C', tmpBase, name], { stdio: 'pipe' })
      if (tarResult.status !== 0) {
        throw new ValidationError('Failed to create package archive')
      }

      // Send as downloadable file
      reply.header('Content-Disposition', `attachment; filename="${name}.tar.gz"`)
      reply.type('application/gzip')

      const stream = fs.createReadStream(archivePath)

      // Clean up temp files after stream is consumed
      stream.on('end', () => {
        try {
          fs.rmSync(tmpBase, { recursive: true, force: true })
        } catch {
          // ignore cleanup errors
        }
      })
      stream.on('error', () => {
        try {
          fs.rmSync(tmpBase, { recursive: true, force: true })
        } catch {
          // ignore cleanup errors
        }
      })

      return reply.send(stream)
    } catch (err) {
      // Clean up on error
      try {
        fs.rmSync(tmpBase, { recursive: true, force: true })
      } catch {
        // ignore cleanup errors
      }
      throw new ValidationError(
        `Export failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
      )
    }
  })

  // ─────────────────────────────────────────────────────────────────────────────
  // Story 16.2 — Registry index endpoints
  // ─────────────────────────────────────────────────────────────────────────────

  app.get('/api/registry', async (_request, reply) => {
    if (!('fileStore' in app)) {
      return reply.send({ ok: false, configured: false, error: 'No project detected' })
    }
    const settingsPath = path.join(app.fileStore.studioDir, 'settings.json')
    if (!fs.existsSync(settingsPath)) {
      return reply.send({ ok: false, configured: false, error: 'No registry configured' })
    }
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8')) as {
      registry?: { repo: string; branch: string }
    }
    if (!settings.registry?.repo) {
      return reply.send({ ok: false, configured: false, error: 'No registry configured' })
    }

    let ghSource
    try {
      ghSource = parseGithubSource(settings.registry.repo)
    } catch (err) {
      throw new ValidationError(err instanceof Error ? err.message : String(err))
    }
    let cached = readCachedRegistryIndex(app.fileStore.studioDir, ghSource.owner, ghSource.repo)
    if (!cached || isRegistryCacheStale(cached)) {
      try {
        cached = await fetchAndCacheRegistryIndex(
          app.fileStore.studioDir,
          settings.registry.repo,
          settings.registry.branch ?? 'main',
        )
      } catch (err) {
        throw new ValidationError(err instanceof Error ? err.message : String(err))
      }
    }
    return reply.send({ ok: true, configured: true, index: cached })
  })

  app.post('/api/registry/refresh', async (_request, reply) => {
    if (!('fileStore' in app)) {
      throw new ValidationError('No project detected')
    }
    const settingsPath = path.join(app.fileStore.studioDir, 'settings.json')
    if (!fs.existsSync(settingsPath)) {
      throw new ValidationError('No registry configured')
    }
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8')) as {
      registry?: { repo: string; branch: string }
    }
    if (!settings.registry?.repo) {
      throw new ValidationError('No registry configured')
    }

    let index
    try {
      index = await fetchAndCacheRegistryIndex(
        app.fileStore.studioDir,
        settings.registry.repo,
        settings.registry.branch ?? 'main',
      )
    } catch (err) {
      throw new ValidationError(err instanceof Error ? err.message : String(err))
    }
    return reply.send({ ok: true, index })
  })
}
