import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { buildIndex } from './index-builder.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
// docs/_bmad_v6.5 is the fixture representing a real _bmad/ directory
const FIXTURE_BMAD_DIR = path.resolve(__dirname, '../../../../docs/_bmad_v6.5')

describe('index-builder', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'index-test-'))
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  it('returns empty index when _bmad/ does not exist', () => {
    const index = buildIndex(tmpDir)
    expect(index.agents).toHaveLength(0)
    expect(index.skills).toHaveLength(0)
    expect(index.workflows).toHaveLength(0)
    expect(index.configs).toHaveLength(0)
    expect(index.errors).toHaveLength(0)
  })

  it('parses config files from modules', () => {
    const moduleDir = path.join(tmpDir, '_bmad', 'bmm')
    fs.mkdirSync(moduleDir, { recursive: true })
    fs.writeFileSync(
      path.join(moduleDir, 'config.yaml'),
      `project_name: test\noutput_folder: "{project-root}/output"\n`,
    )

    const index = buildIndex(tmpDir)
    expect(index.configs).toHaveLength(1)
    expect(index.configs[0].project_name).toBe('test')
    expect(index.configs[0].output_folder).toBe(`${tmpDir}/output`)
  })

  it('parses skill files', () => {
    const skillDir = path.join(tmpDir, '_bmad', 'core', 'skills', 'test-skill')
    fs.mkdirSync(skillDir, { recursive: true })
    fs.writeFileSync(
      path.join(skillDir, 'SKILL.md'),
      `---\nname: test-skill\ndescription: A test\n---\nContent here.\n`,
    )

    const index = buildIndex(tmpDir)
    expect(index.skills).toHaveLength(1)
    expect(index.skills[0].name).toBe('test-skill')
    expect(index.skills[0].module).toBe('core')
  })

  it('parses IDE configs', () => {
    const ideDir = path.join(tmpDir, '_bmad', '_config', 'ides')
    fs.mkdirSync(ideDir, { recursive: true })
    fs.writeFileSync(
      path.join(ideDir, 'claude-code.yaml'),
      `ide: claude-code\nconfigured_date: 2026-01-01\n`,
    )

    const index = buildIndex(tmpDir)
    expect(index.ideConfigs).toHaveLength(1)
    expect(index.ideConfigs[0].ide).toBe('claude-code')
  })

  it('collects parse errors without crashing', () => {
    const moduleDir = path.join(tmpDir, '_bmad', 'broken')
    fs.mkdirSync(moduleDir, { recursive: true })
    fs.writeFileSync(path.join(moduleDir, 'config.yaml'), 'bad: yaml: [invalid')

    const index = buildIndex(tmpDir)
    expect(index.errors.length).toBeGreaterThan(0)
    expect(index.errors[0].error).toContain('YAML parse error')
  })
})

describe('index-builder v6.5', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'index-v65-test-'))
    // Create a project structure where _bmad points to the fixture
    // by symlinking _bmad_v6.5 as _bmad under our temp project root
    fs.symlinkSync(FIXTURE_BMAD_DIR, path.join(tmpDir, '_bmad'), 'dir')
  })

  afterEach(() => {
    // Remove symlink safely before recursive cleanup
    const symlink = path.join(tmpDir, '_bmad')
    if (fs.existsSync(symlink)) {
      fs.unlinkSync(symlink)
    }
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  it('detects v6.5 and classifies 6 agents via customize.toml [agent] blocks', () => {
    const index = buildIndex(tmpDir)
    expect(index.agents).toHaveLength(6)
    const agentIds = index.agents.map((a) => a.id).sort()
    expect(agentIds).toEqual([
      'bmad-agent-analyst',
      'bmad-agent-architect',
      'bmad-agent-dev',
      'bmad-agent-pm',
      'bmad-agent-tech-writer',
      'bmad-agent-ux-designer',
    ])
  })

  it('classifies 24 workflows via customize.toml [workflow] blocks', () => {
    const index = buildIndex(tmpDir)
    expect(index.workflows).toHaveLength(24)
  })

  it('enriches agent name and icon from config.toml [agents.*] tables', () => {
    const index = buildIndex(tmpDir)
    const analyst = index.agents.find((a) => a.id === 'bmad-agent-analyst')
    expect(analyst).toBeDefined()
    expect(analyst!.name).toBe('Mary')
    expect(analyst!.icon).toBe('📊')
    expect(analyst!.title).toBe('Business Analyst')
    expect(analyst!.team).toBe('software-development')
  })

  it('sets module from first path segment', () => {
    const index = buildIndex(tmpDir)
    for (const agent of index.agents) {
      expect(agent.module).toBe('bmm')
    }
    for (const workflow of index.workflows) {
      expect(workflow.module).toBe('bmm')
    }
  })

  it('does not include errors for valid customize.toml files', () => {
    const index = buildIndex(tmpDir)
    const customizeErrors = index.errors.filter(
      (e) => e.filePath.includes('customize.toml') || e.error.includes('customize.toml'),
    )
    expect(customizeErrors).toHaveLength(0)
  })
})
