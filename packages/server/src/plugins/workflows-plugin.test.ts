import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { createApp } from '../app.js'

describe('workflows-plugin', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'workflows-plugin-test-'))
    const wfDir = path.join(tmpDir, '_bmad', 'bmm', 'workflows', '2-plan', 'test-workflow')
    fs.mkdirSync(wfDir, { recursive: true })
    fs.mkdirSync(path.join(tmpDir, '_bmad', 'bmm'), { recursive: true })
    fs.writeFileSync(path.join(tmpDir, '_bmad', 'bmm', 'config.yaml'), 'project_name: test\n')

    fs.writeFileSync(
      path.join(wfDir, 'workflow.md'),
      `---
main_config: test
---

# Test Workflow

**Goal:** A test workflow for plugin testing.
`,
    )

    const stepsDir = path.join(wfDir, 'steps')
    fs.mkdirSync(stepsDir)
    fs.writeFileSync(
      path.join(stepsDir, 'step-01-init.md'),
      `---
name: step-01-init
description: 'Initialize the test'
---

# Step 1: Init

## STEP GOAL:

Set up the testing environment and validate prerequisites.

## Instructions
`,
    )
    fs.writeFileSync(path.join(stepsDir, 'step-02-execute.md'), '# Step 2: Execute\n\nRun the tests.\n')

    // Add a template
    fs.writeFileSync(path.join(wfDir, 'output.template.md'), '# Output Template\n')
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  function createTestApp() {
    return createApp({
      logger: false,
      serveStatic: false,
      project: {
        projectRoot: tmpDir,
        bmadVersion: '6.2.0',
        versionSupported: true,
        modules: [{ name: 'bmm', version: '6.2.0', source: 'built-in' }],
        ideDirectories: [],
      },
    })
  }

  it('GET /api/workflows returns list with type and phase', async () => {
    const app = await createTestApp()

    const response = await app.inject({ method: 'GET', url: '/api/workflows' })
    expect(response.statusCode).toBe(200)
    const workflows = JSON.parse(response.body)
    expect(workflows.length).toBeGreaterThanOrEqual(1)

    const testWf = workflows.find((w: { id: string }) => w.id === 'test-workflow')
    expect(testWf).toBeDefined()
    expect(testWf.type).toBe('step-based')
    expect(testWf.phase).toBe('2-plan')
    expect(testWf.stepCount).toBe(2)

    await app.close()
  })

  it('GET /api/workflows/:id returns enriched detail with templates and step descriptions', async () => {
    const app = await createTestApp()

    const response = await app.inject({ method: 'GET', url: '/api/workflows/test-workflow' })
    expect(response.statusCode).toBe(200)
    const wf = JSON.parse(response.body)

    expect(wf.type).toBe('step-based')
    expect(wf.phase).toBe('2-plan')
    expect(wf.steps).toHaveLength(2)
    expect(wf.steps[0].description).toContain('Set up the testing environment')
    expect(wf.templates).toHaveLength(1)
    expect(wf.templates[0].name).toBe('output')
    expect(wf.supportingFiles).toBeDefined()
    expect(wf.subWorkflows).toBeDefined()

    await app.close()
  })

  it('GET /api/workflows/:id/steps/:stepIndex returns step file content', async () => {
    const app = await createTestApp()

    const response = await app.inject({
      method: 'GET',
      url: '/api/workflows/test-workflow/steps/0',
    })
    expect(response.statusCode).toBe(200)
    const data = JSON.parse(response.body)
    expect(data.content).toContain('## STEP GOAL:')
    expect(data.content).toContain('Set up the testing environment')
    expect(data.title).toBe('init')
    expect(data.filePath).toContain('step-01-init.md')

    await app.close()
  })

  it('GET /api/workflows/:id/steps/:stepIndex returns 422 for invalid index', async () => {
    const app = await createTestApp()

    const response = await app.inject({
      method: 'GET',
      url: '/api/workflows/test-workflow/steps/99',
    })
    expect(response.statusCode).toBe(422)

    await app.close()
  })

  it('GET /api/workflows/:id returns 404 for missing workflow', async () => {
    const app = await createTestApp()

    const response = await app.inject({ method: 'GET', url: '/api/workflows/nonexistent' })
    expect(response.statusCode).toBe(404)

    await app.close()
  })

  // -- Story 35.4 — GET /api/workflows/:id/hooks ----------------------------

  it('GET /api/workflows/:id/hooks returns empty arrays when no customize.toml exists', async () => {
    const app = await createTestApp()

    const response = await app.inject({
      method: 'GET',
      url: '/api/workflows/test-workflow/hooks',
    })
    expect(response.statusCode).toBe(200)
    const hooks = JSON.parse(response.body)
    expect(hooks).toEqual({
      activationStepsPrepend: [],
      activationStepsAppend: [],
      onComplete: [],
    })

    await app.close()
  })

  it('GET /api/workflows/:id/hooks parses on_complete scalar split by " && "', async () => {
    const app = await createTestApp()

    const customDir = path.join(tmpDir, '_bmad', 'custom')
    fs.mkdirSync(customDir, { recursive: true })
    fs.writeFileSync(
      path.join(customDir, 'test-workflow.toml'),
      'on_complete = "cmd1 && cmd2"\n',
    )

    const response = await app.inject({
      method: 'GET',
      url: '/api/workflows/test-workflow/hooks',
    })
    expect(response.statusCode).toBe(200)
    const hooks = JSON.parse(response.body)
    expect(hooks.onComplete).toEqual([{ command: 'cmd1' }, { command: 'cmd2' }])
    expect(hooks.activationStepsPrepend).toEqual([])
    expect(hooks.activationStepsAppend).toEqual([])

    await app.close()
  })

  it('GET /api/workflows/:id/hooks returns 404 for unknown workflow', async () => {
    const app = await createTestApp()

    const response = await app.inject({
      method: 'GET',
      url: '/api/workflows/does-not-exist/hooks',
    })
    expect(response.statusCode).toBe(404)

    await app.close()
  })

  it('GET /api/workflows/:id/hooks returns correct shape when only one surface is populated', async () => {
    const app = await createTestApp()

    const customDir = path.join(tmpDir, '_bmad', 'custom')
    fs.mkdirSync(customDir, { recursive: true })
    fs.writeFileSync(
      path.join(customDir, 'test-workflow.toml'),
      'activation_steps_prepend = "echo before"\n',
    )

    const response = await app.inject({
      method: 'GET',
      url: '/api/workflows/test-workflow/hooks',
    })
    expect(response.statusCode).toBe(200)
    const hooks = JSON.parse(response.body)
    expect(hooks.activationStepsPrepend).toEqual([{ command: 'echo before' }])
    expect(hooks.activationStepsAppend).toEqual([])
    expect(hooks.onComplete).toEqual([])

    await app.close()
  })

})
