import { describe, it, expect } from 'vitest'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'

import { adaptWorkflow } from './workflow-adapter.js'
import type { Workflow } from '@bmad-studio/shared'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTmpDir(): { dir: string; cleanup: () => void } {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bmad-workflow-adapter-test-'))
  return {
    dir,
    cleanup: () => fs.rmSync(dir, { recursive: true, force: true }),
  }
}

function writeToml(filePath: string, content: string): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, content, 'utf8')
}

/** Minimal base workflow partial for tests that don't care about base fields. */
const minBase: Partial<Workflow> = {
  id: 'test-wf',
  name: 'Test Workflow',
  description: 'A test workflow',
  entryPoint: 'step-1.md',
  steps: [],
  filePath: '/tmp/test-wf',
}

// ---------------------------------------------------------------------------
// 1. Workflow with [workflow] hooks → correct hooks shape
// ---------------------------------------------------------------------------

describe('adaptWorkflow — [workflow] block present', () => {
  it('returns correct hooks shape from customize.toml', () => {
    const { dir, cleanup } = makeTmpDir()
    try {
      const skillPath = path.join(dir, 'my-workflow')
      writeToml(
        path.join(skillPath, 'customize.toml'),
        `
[workflow]
activation_steps_prepend = ["pre-check", "load-context"]
activation_steps_append = ["post-setup"]
on_complete = ["notify-done"]
persistent_facts = ["Always follow the style guide."]
`,
      )
      const projectRoot = path.join(dir, 'project')
      fs.mkdirSync(path.join(projectRoot, '_bmad', 'custom'), { recursive: true })

      const result = adaptWorkflow(skillPath, projectRoot, minBase)

      expect(result.hooks).toBeDefined()
      expect(result.hooks!.activationStepsPrepend).toEqual([
        { command: 'pre-check' },
        { command: 'load-context' },
      ])
      expect(result.hooks!.activationStepsAppend).toEqual([{ command: 'post-setup' }])
      expect(result.hooks!.onComplete).toEqual([{ command: 'notify-done' }])
      expect(result.persistentFacts).toEqual(['Always follow the style guide.'])
    } finally {
      cleanup()
    }
  })
})

// ---------------------------------------------------------------------------
// 2. Empty hook arrays → empty HookEntry arrays
// ---------------------------------------------------------------------------

describe('adaptWorkflow — empty hook arrays', () => {
  it('returns empty arrays for all hook fields when they are []', () => {
    const { dir, cleanup } = makeTmpDir()
    try {
      const skillPath = path.join(dir, 'my-workflow')
      writeToml(
        path.join(skillPath, 'customize.toml'),
        `
[workflow]
activation_steps_prepend = []
activation_steps_append = []
on_complete = []
persistent_facts = []
`,
      )
      const projectRoot = path.join(dir, 'project')
      fs.mkdirSync(path.join(projectRoot, '_bmad', 'custom'), { recursive: true })

      const result = adaptWorkflow(skillPath, projectRoot, minBase)

      expect(result.hooks!.activationStepsPrepend).toEqual([])
      expect(result.hooks!.activationStepsAppend).toEqual([])
      expect(result.hooks!.onComplete).toEqual([])
      expect(result.persistentFacts).toEqual([])
    } finally {
      cleanup()
    }
  })
})

// ---------------------------------------------------------------------------
// 3. Scalar hook value (single string) → normalised to [{ command }]
// ---------------------------------------------------------------------------

describe('adaptWorkflow — scalar hook value', () => {
  it('normalises a scalar string on_complete to [{ command }]', () => {
    const { dir, cleanup } = makeTmpDir()
    try {
      const skillPath = path.join(dir, 'my-workflow')
      writeToml(
        path.join(skillPath, 'customize.toml'),
        `
[workflow]
activation_steps_prepend = []
activation_steps_append = []
on_complete = "run-post-script"
persistent_facts = []
`,
      )
      const projectRoot = path.join(dir, 'project')
      fs.mkdirSync(path.join(projectRoot, '_bmad', 'custom'), { recursive: true })

      const result = adaptWorkflow(skillPath, projectRoot, minBase)

      expect(result.hooks!.onComplete).toEqual([{ command: 'run-post-script' }])
    } finally {
      cleanup()
    }
  })

  it('normalises a scalar string activation_steps_prepend to [{ command }]', () => {
    const { dir, cleanup } = makeTmpDir()
    try {
      const skillPath = path.join(dir, 'my-workflow')
      writeToml(
        path.join(skillPath, 'customize.toml'),
        `
[workflow]
activation_steps_prepend = "single-pre-step"
activation_steps_append = []
on_complete = ""
persistent_facts = []
`,
      )
      const projectRoot = path.join(dir, 'project')
      fs.mkdirSync(path.join(projectRoot, '_bmad', 'custom'), { recursive: true })

      const result = adaptWorkflow(skillPath, projectRoot, minBase)

      expect(result.hooks!.activationStepsPrepend).toEqual([{ command: 'single-pre-step' }])
      expect(result.hooks!.onComplete).toEqual([]) // empty string → []
    } finally {
      cleanup()
    }
  })
})

// ---------------------------------------------------------------------------
// 4. String array hook → each entry becomes { command }
// ---------------------------------------------------------------------------

describe('adaptWorkflow — string array hooks', () => {
  it('maps each string in the array to a HookEntry', () => {
    const { dir, cleanup } = makeTmpDir()
    try {
      const skillPath = path.join(dir, 'my-workflow')
      writeToml(
        path.join(skillPath, 'customize.toml'),
        `
[workflow]
activation_steps_prepend = ["step-a", "step-b", "step-c"]
activation_steps_append = []
on_complete = []
persistent_facts = []
`,
      )
      const projectRoot = path.join(dir, 'project')
      fs.mkdirSync(path.join(projectRoot, '_bmad', 'custom'), { recursive: true })

      const result = adaptWorkflow(skillPath, projectRoot, minBase)

      expect(result.hooks!.activationStepsPrepend).toEqual([
        { command: 'step-a' },
        { command: 'step-b' },
        { command: 'step-c' },
      ])
    } finally {
      cleanup()
    }
  })
})

// ---------------------------------------------------------------------------
// 5. Sidecar disabled block → disabled: true on matching entry
// ---------------------------------------------------------------------------

describe('adaptWorkflow — sidecar disabled state', () => {
  it('marks entry as disabled: true when sidecar block matches', () => {
    const { dir, cleanup } = makeTmpDir()
    try {
      const skillPath = path.join(dir, 'my-workflow')
      writeToml(
        path.join(skillPath, 'customize.toml'),
        `
[workflow]
activation_steps_prepend = ["enabled-step", "disabled-step"]
activation_steps_append = []
on_complete = []
persistent_facts = []

# bmad-studio:hook-state
# disabled-step=disabled
`,
      )
      const projectRoot = path.join(dir, 'project')
      fs.mkdirSync(path.join(projectRoot, '_bmad', 'custom'), { recursive: true })

      const result = adaptWorkflow(skillPath, projectRoot, minBase)

      expect(result.hooks!.activationStepsPrepend).toEqual([
        { command: 'enabled-step' },
        { command: 'disabled-step', disabled: true },
      ])
    } finally {
      cleanup()
    }
  })

  it('does not set disabled on entries not in sidecar block', () => {
    const { dir, cleanup } = makeTmpDir()
    try {
      const skillPath = path.join(dir, 'my-workflow')
      writeToml(
        path.join(skillPath, 'customize.toml'),
        `
[workflow]
activation_steps_prepend = ["step-x", "step-y"]
activation_steps_append = []
on_complete = []
persistent_facts = []

# bmad-studio:hook-state
# step-x=disabled
`,
      )
      const projectRoot = path.join(dir, 'project')
      fs.mkdirSync(path.join(projectRoot, '_bmad', 'custom'), { recursive: true })

      const result = adaptWorkflow(skillPath, projectRoot, minBase)

      expect(result.hooks!.activationStepsPrepend[0]).toEqual({ command: 'step-x', disabled: true })
      expect(result.hooks!.activationStepsPrepend[1]).toEqual({ command: 'step-y' })
      // step-y should NOT have disabled property set
      expect(result.hooks!.activationStepsPrepend[1].disabled).toBeUndefined()
    } finally {
      cleanup()
    }
  })
})

// ---------------------------------------------------------------------------
// 6. No customize.toml → returns baseWorkflow with empty hooks (no throw)
// ---------------------------------------------------------------------------

describe('adaptWorkflow — no customize.toml', () => {
  it('returns baseWorkflow with empty hooks when no customize.toml exists', () => {
    const { dir, cleanup } = makeTmpDir()
    try {
      const skillPath = path.join(dir, 'no-toml-workflow')
      // Do NOT create a customize.toml
      fs.mkdirSync(skillPath, { recursive: true })
      const projectRoot = path.join(dir, 'project')
      fs.mkdirSync(path.join(projectRoot, '_bmad', 'custom'), { recursive: true })

      expect(() => adaptWorkflow(skillPath, projectRoot, minBase)).not.toThrow()

      const result = adaptWorkflow(skillPath, projectRoot, minBase)
      expect(result.id).toBe('test-wf')
      expect(result.name).toBe('Test Workflow')
      expect(result.hooks).toBeDefined()
      expect(result.hooks!.activationStepsPrepend).toEqual([])
      expect(result.hooks!.activationStepsAppend).toEqual([])
      expect(result.hooks!.onComplete).toEqual([])
      expect(result.persistentFacts).toEqual([])
    } finally {
      cleanup()
    }
  })
})

// ---------------------------------------------------------------------------
// 7. Snapshot test: bmad-create-prd real fixture
// ---------------------------------------------------------------------------

describe('adaptWorkflow — bmad-create-prd fixture snapshot', () => {
  it('matches expected merged [workflow] block from real fixture', () => {
    // Path to the real fixture checked in under docs/
    const fixtureDir = path.resolve(
      import.meta.dirname,
      '../../../../docs/_bmad_v6.5/bmm/2-plan-workflows/bmad-create-prd',
    )

    // If the fixture doesn't exist in this environment, skip gracefully
    if (!fs.existsSync(path.join(fixtureDir, 'customize.toml'))) {
      console.warn('bmad-create-prd fixture not found — skipping snapshot test')
      return
    }

    // Use an empty project root so no team/user overrides are applied
    const { dir, cleanup } = makeTmpDir()
    try {
      const projectRoot = path.join(dir, 'project')
      fs.mkdirSync(path.join(projectRoot, '_bmad', 'custom'), { recursive: true })

      const result = adaptWorkflow(fixtureDir, projectRoot, {
        id: 'bmad-create-prd',
        name: 'Create PRD',
        description: 'Creates a PRD',
        entryPoint: 'workflow.md',
        steps: [],
        filePath: fixtureDir,
      })

      // The fixture has empty activation_steps_* and a scalar on_complete = ""
      expect(result.hooks).toBeDefined()
      expect(result.hooks!.activationStepsPrepend).toEqual([])
      expect(result.hooks!.activationStepsAppend).toEqual([])
      expect(result.hooks!.onComplete).toEqual([]) // scalar "" → normalised to []

      // persistent_facts has one entry from the fixture
      expect(result.persistentFacts).toEqual([
        'file:{project-root}/**/project-context.md',
      ])

      // Snapshot the full hooks+persistentFacts shape
      expect({
        hooks: result.hooks,
        persistentFacts: result.persistentFacts,
      }).toMatchSnapshot()
    } finally {
      cleanup()
    }
  })
})
