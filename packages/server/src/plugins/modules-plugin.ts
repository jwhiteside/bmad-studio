import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { execSync } from 'node:child_process'

import type { FastifyInstance } from 'fastify'
import yaml from 'js-yaml'

import { ValidationError, ConflictError, NotFoundError } from '../core/errors.js'

type ManifestModule = {
  name: string
  version: string
  installDate: string
  lastUpdated: string
  source: string
  npmPackage: string | null
  repoUrl: string | null
}

type ManifestFile = {
  installation: { version: string; installDate: string; lastUpdated: string }
  modules: ManifestModule[]
  ides?: string[]
}

function readManifest(manifestPath: string): ManifestFile {
  const content = fs.readFileSync(manifestPath, 'utf-8')
  return yaml.load(content) as ManifestFile
}

function writeManifest(manifestPath: string, manifest: ManifestFile) {
  fs.writeFileSync(manifestPath, yaml.dump(manifest, { lineWidth: -1 }), 'utf-8')
}

const MODULE_NAME_RE = /^[a-z][a-z0-9-]*$/

function copyDirRecursive(src: string, dest: string) {
  if (!fs.existsSync(src)) return
  fs.mkdirSync(dest, { recursive: true })
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath)
    } else {
      fs.copyFileSync(srcPath, destPath)
    }
  }
}

export async function modulesPlugin(app: FastifyInstance) {
  // Install module from npm package
  app.post('/api/modules/install', async (request, reply) => {
    if (!('fileStore' in app)) {
      throw new ValidationError('No project detected')
    }

    const body = request.body as { packageName: string }
    const packageName = body.packageName?.trim()

    if (!packageName) {
      throw new ValidationError('Package name is required')
    }

    const bmadDir = path.join(app.fileStore.projectRoot, '_bmad')
    const manifestPath = path.join(bmadDir, '_config', 'manifest.yaml')
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bmad-install-'))

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
        return reply.status(400).send({ ok: false, error: 'No tarball downloaded' })
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
        return reply.status(400).send({
          ok: false,
          error: `Package "${packageName}" does not contain a _bmad/ directory`,
        })
      }

      // 5. Copy module directories from the package's _bmad/ into the project's _bmad/
      const installedModules: string[] = []
      for (const entry of fs.readdirSync(bmadSrcDir, { withFileTypes: true })) {
        if (entry.isDirectory() && entry.name !== '_config') {
          const srcModuleDir = path.join(bmadSrcDir, entry.name)
          const destModuleDir = path.join(bmadDir, entry.name)
          copyDirRecursive(srcModuleDir, destModuleDir)
          installedModules.push(entry.name)
        }
      }

      if (installedModules.length === 0) {
        return reply.status(400).send({
          ok: false,
          error: `Package "${packageName}" has no module directories in _bmad/`,
        })
      }

      // 6. Update manifest.yaml with new module entries
      if (fs.existsSync(manifestPath)) {
        const manifest = readManifest(manifestPath)
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

        writeManifest(manifestPath, manifest)
      }

      // 7. Rebuild file store
      app.fileStore.rebuild()

      reply.status(200)
      return { ok: true, modules: installedModules }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Installation failed'
      return reply.status(400).send({ ok: false, error: message })
    } finally {
      // Cleanup temp directory
      try {
        fs.rmSync(tmpDir, { recursive: true, force: true })
      } catch {
        // ignore cleanup errors
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
    fs.writeFileSync(path.join(moduleDir, 'config.yaml'), configContent, 'utf-8')

    // Update manifest
    if (fs.existsSync(manifestPath)) {
      const manifest = readManifest(manifestPath)
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
      writeManifest(manifestPath, manifest)
    }

    // Rebuild index
    app.fileStore.rebuild()

    reply.status(201)
    return { ok: true, name, path: moduleDir }
  })

  app.delete('/api/modules/:name', async (request) => {
    if (!('fileStore' in app)) {
      throw new ValidationError('No project detected')
    }

    const { name } = request.params as { name: string }
    const bmadDir = path.join(app.fileStore.projectRoot, '_bmad')
    const moduleDir = path.join(bmadDir, name)
    const manifestPath = path.join(bmadDir, '_config', 'manifest.yaml')

    // Check manifest for source
    if (fs.existsSync(manifestPath)) {
      const manifest = readManifest(manifestPath)
      const entry = manifest.modules.find((m) => m.name === name)

      if (!entry) {
        throw new NotFoundError(`Module "${name}" not found in manifest`)
      }

      if (entry.source === 'built-in') {
        throw new ValidationError(`Cannot remove built-in module "${name}"`)
      }

      // Remove from manifest
      manifest.modules = manifest.modules.filter((m) => m.name !== name)
      writeManifest(manifestPath, manifest)
    }

    // Delete module directory
    if (fs.existsSync(moduleDir)) {
      fs.rmSync(moduleDir, { recursive: true, force: true })
    }

    // Rebuild index
    app.fileStore.rebuild()

    return { ok: true, name }
  })

  // Story 12.1 + 12.2: Add/upload entities to a module
  app.post('/api/modules/:name/entities', async (request, reply) => {
    if (!('fileStore' in app)) {
      throw new ValidationError('No project detected')
    }

    const { name } = request.params as { name: string }
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

      fs.writeFileSync(filePath, content, 'utf-8')
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

      fs.writeFileSync(filePath, content, 'utf-8')
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

      fs.writeFileSync(filePath, content, 'utf-8')
    }

    // Rebuild index
    app.fileStore.rebuild()

    reply.status(201)
    return { ok: true, type: entityType, name: entityName, path: filePath }
  })

  // Story 12.3: Export module manifest
  app.post('/api/modules/:name/export', async (request) => {
    if (!('fileStore' in app)) {
      throw new ValidationError('No project detected')
    }

    const { name } = request.params as { name: string }
    const bmadDir = path.join(app.fileStore.projectRoot, '_bmad')
    const manifestPath = path.join(bmadDir, '_config', 'manifest.yaml')

    if (!fs.existsSync(manifestPath)) {
      throw new NotFoundError('No manifest found')
    }

    const manifest = readManifest(manifestPath)
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
    const body = request.body as { version?: string; description?: string }

    const bmadDir = path.join(app.fileStore.projectRoot, '_bmad')
    const moduleDir = path.join(bmadDir, name)
    const configPath = path.join(moduleDir, 'config.yaml')

    if (!fs.existsSync(configPath)) {
      throw new NotFoundError(`Module "${name}" config not found`)
    }

    const configContent = fs.readFileSync(configPath, 'utf-8')
    const config = yaml.load(configContent) as Record<string, unknown>

    if (body.version !== undefined) config.version = body.version
    if (body.description !== undefined) config.description = body.description

    const updated = yaml.dump(config, { lineWidth: -1 })
    fs.writeFileSync(configPath, updated, 'utf-8')

    // Also update manifest.yaml
    const manifestPath = path.join(bmadDir, '_config', 'manifest.yaml')
    if (fs.existsSync(manifestPath)) {
      const manifest = readManifest(manifestPath)
      const mod = manifest.modules.find((m) => m.name === name)
      if (mod) {
        if (body.version !== undefined) mod.version = body.version
        mod.lastUpdated = new Date().toISOString().split('T')[0]
        writeManifest(manifestPath, manifest)
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

    if (!fs.existsSync(manifestPath)) {
      return []
    }

    const manifest = readManifest(manifestPath)
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
      execSync(`tar -czf "${archivePath}" -C "${tmpBase}" "${name}"`)

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
}
