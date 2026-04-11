import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { parseModuleYaml } from './module-yaml-parser.js'

describe('parseModuleYaml', () => {
  let tmpDir: string

  beforeEach(() => {
    // TD-20: realpathSync resolves the macOS /var → /private/var symlink so
    // path comparisons against tmpDir are stable.
    tmpDir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'module-yaml-parser-test-')))
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  // AC-15.1.1
  it('returns the fallback when module.yaml is absent', () => {
    const moduleDir = path.join(tmpDir, 'dept-aem')
    fs.mkdirSync(moduleDir)

    const result = parseModuleYaml(moduleDir)

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data).toEqual({
      code: 'dept-aem',
      version: '1.0.0',
      variables: {},
      directories: [],
    })
  })

  // AC-15.1.2
  it('parses a module.yaml with all fields populated, with no field loss', () => {
    const moduleDir = path.join(tmpDir, 'full-module')
    fs.mkdirSync(moduleDir)
    fs.writeFileSync(
      path.join(moduleDir, 'module.yaml'),
      [
        'code: full-module',
        'name: "Full Featured Module"',
        'version: "2.1.0"',
        'description: "A module that exercises every field"',
        'variables:',
        '  project_name:',
        '    prompt: "What is the project name?"',
        '    default: "my-project"',
        '  region:',
        '    prompt: "Deployment region?"',
        '    default: "us-east-1"',
        'directories:',
        '  - "_bmad-output/full-module-artifacts"',
        '  - "_bmad-output/full-module-cache"',
      ].join('\n'),
    )

    const result = parseModuleYaml(moduleDir)

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data).toEqual({
      code: 'full-module',
      name: 'Full Featured Module',
      version: '2.1.0',
      description: 'A module that exercises every field',
      variables: {
        project_name: { prompt: 'What is the project name?', default: 'my-project' },
        region: { prompt: 'Deployment region?', default: 'us-east-1' },
      },
      directories: [
        '_bmad-output/full-module-artifacts',
        '_bmad-output/full-module-cache',
      ],
    })
  })

  // AC-15.1.3
  it('applies defaults when module.yaml only contains code', () => {
    const moduleDir = path.join(tmpDir, 'minimal')
    fs.mkdirSync(moduleDir)
    fs.writeFileSync(path.join(moduleDir, 'module.yaml'), 'code: dept-aem\n')

    const result = parseModuleYaml(moduleDir)

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.code).toBe('dept-aem')
    expect(result.data.version).toBe('1.0.0')
    expect(result.data.variables).toEqual({})
    expect(result.data.directories).toEqual([])
    expect(result.data.name).toBeUndefined()
    expect(result.data.description).toBeUndefined()
  })

  // AC-15.1.3 supporting case — variables block parses correctly
  it('parses a variables block with one entry', () => {
    const moduleDir = path.join(tmpDir, 'with-vars')
    fs.mkdirSync(moduleDir)
    fs.writeFileSync(
      path.join(moduleDir, 'module.yaml'),
      [
        'code: with-vars',
        'variables:',
        '  aem_project_name:',
        '    prompt: "What is the AEM project name?"',
        '    default: "my-aem-project"',
      ].join('\n'),
    )

    const result = parseModuleYaml(moduleDir)

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.variables).toEqual({
      aem_project_name: { prompt: 'What is the AEM project name?', default: 'my-aem-project' },
    })
  })

  // AC-15.1.3 supporting case — directories array parses correctly
  it('parses a directories array', () => {
    const moduleDir = path.join(tmpDir, 'with-dirs')
    fs.mkdirSync(moduleDir)
    fs.writeFileSync(
      path.join(moduleDir, 'module.yaml'),
      [
        'code: with-dirs',
        'directories:',
        '  - "_bmad-output/aem-artifacts"',
      ].join('\n'),
    )

    const result = parseModuleYaml(moduleDir)

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.directories).toEqual(['_bmad-output/aem-artifacts'])
  })

  // AC-15.1.4
  it('returns ok:false when module.yaml is empty', () => {
    const moduleDir = path.join(tmpDir, 'empty-yaml')
    fs.mkdirSync(moduleDir)
    fs.writeFileSync(path.join(moduleDir, 'module.yaml'), '')

    const result = parseModuleYaml(moduleDir)

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toBe('module.yaml is empty or not an object')
    expect(result.filePath).toBe(path.join(moduleDir, 'module.yaml'))
  })

  // AC-15.1.4 supporting case — whitespace-only file
  it('returns ok:false when module.yaml contains only whitespace', () => {
    const moduleDir = path.join(tmpDir, 'whitespace-yaml')
    fs.mkdirSync(moduleDir)
    fs.writeFileSync(path.join(moduleDir, 'module.yaml'), '   \n  \n')

    const result = parseModuleYaml(moduleDir)

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toBe('module.yaml is empty or not an object')
  })

  // AC-15.1.5
  it('returns ok:false with a parse error message when YAML is malformed', () => {
    const moduleDir = path.join(tmpDir, 'broken-yaml')
    fs.mkdirSync(moduleDir)
    fs.writeFileSync(path.join(moduleDir, 'module.yaml'), 'code: [unclosed\n')

    const result = parseModuleYaml(moduleDir)

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error.startsWith('module.yaml parse error')).toBe(true)
    expect(result.filePath).toBe(path.join(moduleDir, 'module.yaml'))
  })
})
