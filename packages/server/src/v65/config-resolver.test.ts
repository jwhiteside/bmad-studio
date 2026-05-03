import { describe, it, expect } from 'vitest'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'

import { resolveCentralConfig } from './config-resolver.js'
import { resolveLayered, type TomlObject } from './customize-resolver.js'
import { ManifestMissingError, ManifestParseError } from '../core/errors.js'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Create a temp directory and return its path plus a cleanup function. */
function makeTmpDir(): { dir: string; cleanup: () => void } {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bmad-config-test-'))
  return {
    dir,
    cleanup: () => fs.rmSync(dir, { recursive: true, force: true }),
  }
}

/** Write content to filePath, creating intermediate dirs as needed. */
function writeFile(filePath: string, content: string): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, content, 'utf8')
}

/**
 * Build a standard projectRoot scaffold with `_bmad/` and `_bmad/custom/`
 * directories. Returns helpers for writing the four config layers.
 */
function makeProject(baseDir: string): {
  projectRoot: string
  writeLayer1: (content: string) => void
  writeLayer2: (content: string) => void
  writeLayer3: (content: string) => void
  writeLayer4: (content: string) => void
} {
  const projectRoot = path.join(baseDir, 'project')
  const bmadDir = path.join(projectRoot, '_bmad')
  const customDir = path.join(bmadDir, 'custom')

  fs.mkdirSync(customDir, { recursive: true })

  return {
    projectRoot,
    writeLayer1: (c) => writeFile(path.join(bmadDir, 'config.toml'), c),
    writeLayer2: (c) => writeFile(path.join(bmadDir, 'config.user.toml'), c),
    writeLayer3: (c) => writeFile(path.join(customDir, 'config.toml'), c),
    writeLayer4: (c) => writeFile(path.join(customDir, 'config.user.toml'), c),
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('resolveCentralConfig', () => {
  // 1. Layer 1 only → result equals parsed base
  it('layer 1 only — result equals parsed base', () => {
    const { dir, cleanup } = makeTmpDir()
    try {
      const { projectRoot, writeLayer1 } = makeProject(dir)
      writeLayer1(`
[core]
document_output_language = "English"
output_folder = "{project-root}/_bmad-output"

[modules.bmm]
project_name = "bmad-new"
`)
      const result = resolveCentralConfig(projectRoot)
      const core = result.core as TomlObject
      expect(core.document_output_language).toBe('English')
      expect(core.output_folder).toBe('{project-root}/_bmad-output')
      const modules = result.modules as TomlObject
      const bmm = modules.bmm as TomlObject
      expect(bmm.project_name).toBe('bmad-new')
    } finally {
      cleanup()
    }
  })

  // 2. Layers 1 + 3 (team custom) → team scalar wins
  it('layers 1 + 3 (team custom) — team scalar overrides base scalar', () => {
    const { dir, cleanup } = makeTmpDir()
    try {
      const { projectRoot, writeLayer1, writeLayer3 } = makeProject(dir)
      writeLayer1(`
[core]
document_output_language = "English"

[agents.bmad-agent-pm]
name = "John"
title = "Product Manager"
`)
      writeLayer3(`
[agents.bmad-agent-pm]
title = "Senior Product Manager"
`)
      const result = resolveCentralConfig(projectRoot)
      const agents = result.agents as TomlObject
      const pm = agents['bmad-agent-pm'] as TomlObject
      expect(pm.name).toBe('John')           // preserved from base
      expect(pm.title).toBe('Senior Product Manager')  // overridden by team custom
    } finally {
      cleanup()
    }
  })

  // 3. All 4 layers → user custom (layer 4) wins for scalars
  it('all 4 layers — user custom (layer 4) wins for scalars', () => {
    const { dir, cleanup } = makeTmpDir()
    try {
      const { projectRoot, writeLayer1, writeLayer2, writeLayer3, writeLayer4 } = makeProject(dir)
      writeLayer1(`
[core]
document_output_language = "English"

[agents.bmad-agent-dev]
name = "Amelia"
icon = "💻"
`)
      writeLayer2(`
[agents.bmad-agent-dev]
icon = "🛠️"
`)
      writeLayer3(`
[agents.bmad-agent-dev]
icon = "⚙️"
`)
      writeLayer4(`
[agents.bmad-agent-dev]
icon = "🚀"
`)
      const result = resolveCentralConfig(projectRoot)
      const agents = result.agents as TomlObject
      const dev = agents['bmad-agent-dev'] as TomlObject
      expect(dev.icon).toBe('🚀')   // user custom (layer 4) wins
      expect(dev.name).toBe('Amelia')  // preserved from base
    } finally {
      cleanup()
    }
  })

  // 4. Missing layer 1 → throws ManifestMissingError
  it('missing layer 1 (config.toml) throws ManifestMissingError', () => {
    const { dir, cleanup } = makeTmpDir()
    try {
      const { projectRoot } = makeProject(dir)
      // Do NOT write layer 1
      expect(() => resolveCentralConfig(projectRoot)).toThrow(ManifestMissingError)
    } finally {
      cleanup()
    }
  })

  it('ManifestMissingError message includes the expected file path', () => {
    const { dir, cleanup } = makeTmpDir()
    try {
      const { projectRoot } = makeProject(dir)
      expect(() => resolveCentralConfig(projectRoot)).toThrow(/config\.toml/)
    } finally {
      cleanup()
    }
  })

  // 5. Present but malformed layer → throws ManifestParseError with path
  it('malformed layer 1 throws ManifestParseError', () => {
    const { dir, cleanup } = makeTmpDir()
    try {
      const { projectRoot, writeLayer1 } = makeProject(dir)
      writeLayer1(`
[core
broken = "unclosed bracket
`)
      expect(() => resolveCentralConfig(projectRoot)).toThrow(ManifestParseError)
    } finally {
      cleanup()
    }
  })

  it('malformed optional layer 2 throws ManifestParseError with path in message', () => {
    const { dir, cleanup } = makeTmpDir()
    try {
      const { projectRoot, writeLayer1, writeLayer2 } = makeProject(dir)
      writeLayer1(`
[core]
document_output_language = "English"
`)
      writeLayer2(`
[core
broken = "bad toml
`)
      let caughtError: unknown
      try {
        resolveCentralConfig(projectRoot)
      } catch (e) {
        caughtError = e
      }
      expect(caughtError).toBeInstanceOf(ManifestParseError)
      const err = caughtError as ManifestParseError
      expect(err.message).toContain('config.user.toml')
    } finally {
      cleanup()
    }
  })

  it('malformed optional layer 3 throws ManifestParseError with path in message', () => {
    const { dir, cleanup } = makeTmpDir()
    try {
      const { projectRoot, writeLayer1, writeLayer3 } = makeProject(dir)
      writeLayer1(`
[core]
document_output_language = "English"
`)
      writeLayer3(`
[agents
bad = "layer3
`)
      let caughtError: unknown
      try {
        resolveCentralConfig(projectRoot)
      } catch (e) {
        caughtError = e
      }
      expect(caughtError).toBeInstanceOf(ManifestParseError)
      const err = caughtError as ManifestParseError
      expect(err.message).toContain('custom/config.toml')
    } finally {
      cleanup()
    }
  })

  it('malformed optional layer 4 throws ManifestParseError with path in message', () => {
    const { dir, cleanup } = makeTmpDir()
    try {
      const { projectRoot, writeLayer1, writeLayer4 } = makeProject(dir)
      writeLayer1(`
[core]
document_output_language = "English"
`)
      writeLayer4(`
[core
broken = "layer4
`)
      let caughtError: unknown
      try {
        resolveCentralConfig(projectRoot)
      } catch (e) {
        caughtError = e
      }
      expect(caughtError).toBeInstanceOf(ManifestParseError)
      const err = caughtError as ManifestParseError
      expect(err.message).toContain('custom/config.user.toml')
    } finally {
      cleanup()
    }
  })

  // 6. { provenance: true } → returns Resolved<TomlObject>
  it('{ provenance: true } returns Resolved<T> shape', () => {
    const { dir, cleanup } = makeTmpDir()
    try {
      const { projectRoot, writeLayer1, writeLayer3 } = makeProject(dir)
      writeLayer1(`
[core]
document_output_language = "English"

[agents.bmad-agent-pm]
name = "John"
title = "Product Manager"
`)
      writeLayer3(`
[agents.bmad-agent-pm]
title = "Senior Product Manager"
`)
      const result = resolveCentralConfig(projectRoot, { provenance: true })
      expect(result).toHaveProperty('merged')
      expect(result).toHaveProperty('provenance')

      const core = (result.merged as TomlObject).core as TomlObject
      expect(core.document_output_language).toBe('English')

      // 'agents' table was deep-merged → provenance is 'merged'
      expect(result.provenance.agents).toBe('merged')
      // 'core' was only in base → provenance is 'base'
      expect(result.provenance.core).toBe('base')
    } finally {
      cleanup()
    }
  })

  it('{ provenance: true } tracks user_base (layer 2) origin', () => {
    const { dir, cleanup } = makeTmpDir()
    try {
      const { projectRoot, writeLayer1, writeLayer2 } = makeProject(dir)
      writeLayer1(`
[core]
document_output_language = "English"
`)
      writeLayer2(`
[user_prefs]
theme = "dark"
`)
      const result = resolveCentralConfig(projectRoot, { provenance: true })
      // 'user_prefs' was introduced in layer 2 (user_base)
      expect(result.provenance['user_prefs']).toBe('user_base' as never)
    } finally {
      cleanup()
    }
  })

  // 7. Each optional layer path: each can be individually absent without error
  it('layer 2 absent — no error, base values preserved', () => {
    const { dir, cleanup } = makeTmpDir()
    try {
      const { projectRoot, writeLayer1 } = makeProject(dir)
      writeLayer1(`
[core]
document_output_language = "French"
`)
      // only layer 1 present
      expect(() => resolveCentralConfig(projectRoot)).not.toThrow()
      const result = resolveCentralConfig(projectRoot)
      const core = result.core as TomlObject
      expect(core.document_output_language).toBe('French')
    } finally {
      cleanup()
    }
  })

  it('layer 3 absent — no error, layers 1+2 merged correctly', () => {
    const { dir, cleanup } = makeTmpDir()
    try {
      const { projectRoot, writeLayer1, writeLayer2 } = makeProject(dir)
      writeLayer1(`
[core]
document_output_language = "English"
`)
      writeLayer2(`
[core]
document_output_language = "German"
`)
      // layer 3 missing, layer 4 missing
      expect(() => resolveCentralConfig(projectRoot)).not.toThrow()
      const result = resolveCentralConfig(projectRoot)
      const core = result.core as TomlObject
      expect(core.document_output_language).toBe('German')
    } finally {
      cleanup()
    }
  })

  it('layer 4 absent — no error, layers 1+2+3 merged correctly', () => {
    const { dir, cleanup } = makeTmpDir()
    try {
      const { projectRoot, writeLayer1, writeLayer2, writeLayer3 } = makeProject(dir)
      writeLayer1(`
[core]
document_output_language = "English"
`)
      writeLayer2(`
[core]
document_output_language = "German"
`)
      writeLayer3(`
[core]
document_output_language = "Japanese"
`)
      // layer 4 missing
      expect(() => resolveCentralConfig(projectRoot)).not.toThrow()
      const result = resolveCentralConfig(projectRoot)
      const core = result.core as TomlObject
      expect(core.document_output_language).toBe('Japanese')
    } finally {
      cleanup()
    }
  })

  it('all optional layers absent — only base returned', () => {
    const { dir, cleanup } = makeTmpDir()
    try {
      const { projectRoot, writeLayer1 } = makeProject(dir)
      writeLayer1(`
[core]
document_output_language = "Spanish"
`)
      const result = resolveCentralConfig(projectRoot)
      const core = result.core as TomlObject
      expect(core.document_output_language).toBe('Spanish')
    } finally {
      cleanup()
    }
  })
})

// ---------------------------------------------------------------------------
// ADR-4: resolveLayered with 5 explicit layers (forward-compat)
// ---------------------------------------------------------------------------

describe('resolveLayered — 5-layer forward-compat (ADR-4)', () => {
  it('accepts 5 explicit layers and applies them lowest → highest priority', () => {
    const l1: TomlObject = { tier: 'base', value: 1 }
    const l2: TomlObject = { tier: 'user_base', value: 2 }
    const l3: TomlObject = { tier: 'team', value: 3 }
    const l4: TomlObject = { tier: 'user', value: 4 }
    const l5: TomlObject = { tier: 'extra', value: 5 }

    const result = resolveLayered([l1, l2, l3, l4, l5])
    expect(result.tier).toBe('extra')
    expect(result.value).toBe(5)
  })

  it('5-layer provenance mode — merge values are correct; layers 1-4 provenance tracked', () => {
    const l1: TomlObject = { a: 'base-value' }
    const l2: TomlObject = { b: 'l2-value' }
    const l3: TomlObject = { c: 'l3-value' }
    const l4: TomlObject = { d: 'l4-value' }
    const l5: TomlObject = { a: 'l5-override', e: 'l5-new' }

    const { merged, provenance } = resolveLayered([l1, l2, l3, l4, l5], { provenance: true })

    // All merge values are correct regardless of layer count
    expect(merged.a).toBe('l5-override')
    expect(merged.b).toBe('l2-value')
    expect(merged.c).toBe('l3-value')
    expect(merged.d).toBe('l4-value')
    expect(merged.e).toBe('l5-new')

    // Provenance is tracked for keys set in layers 1-4 (named layers)
    // 'b' was introduced in layer 2 (index 1 = 'user_base')
    expect(provenance.b).toBe('user_base' as never)
    // 'c' was introduced in layer 3 (index 2 = 'team')
    expect(provenance.c).toBe('team')
    // 'd' was introduced in layer 4 (index 3 = 'user')
    expect(provenance.d).toBe('user')
    // 'a' was in layer 1 ('base'); layer 5 has no defined name so provenance stays 'base'
    expect(provenance.a).toBe('base')
  })

  it('5-layer deep merge of tables — all layers contribute', () => {
    const l1: TomlObject = { config: { a: 1, b: 2, c: 3 } }
    const l2: TomlObject = { config: { b: 20 } }
    const l3: TomlObject = { config: { c: 30 } }
    const l4: TomlObject = { config: { d: 40 } }
    const l5: TomlObject = { config: { e: 50 } }

    const result = resolveLayered([l1, l2, l3, l4, l5])
    const config = result.config as TomlObject
    expect(config.a).toBe(1)
    expect(config.b).toBe(20)
    expect(config.c).toBe(30)
    expect(config.d).toBe(40)
    expect(config.e).toBe(50)
  })
})
