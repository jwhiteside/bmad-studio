import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, it, expect } from 'vitest'

import { parseAgent, parseAgentV65 } from './agent-parser.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const FIXTURE_BMAD = path.resolve(__dirname, '../../../../docs/_bmad_v6.5')

const sampleAgent = `---
name: "analyst"
description: "Business Analyst"
---

You must fully embody this agent.

\`\`\`xml
<agent id="analyst.agent.yaml" name="Mary" title="Business Analyst" icon="📊" capabilities="market research, competitive analysis">
<menu>
  <item cmd="BP or fuzzy match on brainstorm" exec="skill:bmad-brainstorming">[BP] Brainstorm Project</item>
  <item cmd="MR or fuzzy match on market-research" exec="skill:bmad-market-research">[MR] Market Research</item>
</menu>
</agent>
\`\`\`
`

describe('agent-parser', () => {
  it('extracts agent attributes from XML', () => {
    const result = parseAgent('_bmad/bmm/agents/analyst.md', sampleAgent)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.id).toBe('analyst')
      expect(result.data.name).toBe('Mary')
      expect(result.data.filePath).toBe('_bmad/bmm/agents/analyst.md')
    }
  })

  it('extracts menu items from XML', () => {
    const result = parseAgent('analyst.md', sampleAgent)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.menu).toHaveLength(2)
      expect(result.data.menu[0].trigger).toBe('bp')
      expect(result.data.menu[0].route).toBe('skill:bmad-brainstorming')
      expect(result.data.menu[0].input).toBe('Brainstorm Project')
      expect(result.data.menu[1].trigger).toBe('mr')
      expect(result.data.menu[1].route).toBe('skill:bmad-market-research')
    }
  })

  it('falls back to frontmatter when XML is missing', () => {
    const simple = `---
name: "test-agent"
description: "A test agent"
---
Just a simple agent with no XML.
`
    const result = parseAgent('test.md', simple)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.id).toBe('test-agent')
      expect(result.data.name).toBe('test-agent')
      expect(result.data.role).toBe('A test agent')
      expect(result.data.menu).toHaveLength(0)
    }
  })

  it('handles malformed content gracefully', () => {
    const result = parseAgent('bad.md', '')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.id).toBe('')
      expect(result.data.menu).toHaveLength(0)
    }
  })
})

describe('parseAgentV65', () => {
  it('parses bmad-agent-analyst customize.toml correctly', () => {
    const analystDir = path.join(FIXTURE_BMAD, 'bmm', '1-analysis', 'bmad-agent-analyst')
    const tomlContent = fs.readFileSync(path.join(analystDir, 'customize.toml'), 'utf-8')

    const result = parseAgentV65(analystDir, tomlContent)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.id).toBe('bmad-agent-analyst')
      expect(result.data.name).toBe('Mary')
      expect(result.data.icon).toBe('📊')
      expect(result.data.menu).toHaveLength(7)
    }
  })

  it('returns agent id from directory basename', () => {
    const analystDir = path.join(FIXTURE_BMAD, 'bmm', '1-analysis', 'bmad-agent-analyst')
    const tomlContent = fs.readFileSync(path.join(analystDir, 'customize.toml'), 'utf-8')

    const result = parseAgentV65(analystDir, tomlContent)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.id).toBe('bmad-agent-analyst')
    }
  })

  it('maps menu items to trigger/route format', () => {
    const analystDir = path.join(FIXTURE_BMAD, 'bmm', '1-analysis', 'bmad-agent-analyst')
    const tomlContent = fs.readFileSync(path.join(analystDir, 'customize.toml'), 'utf-8')

    const result = parseAgentV65(analystDir, tomlContent)
    expect(result.ok).toBe(true)
    if (result.ok) {
      const bpItem = result.data.menu.find((m) => m.trigger === 'bp')
      expect(bpItem).toBeDefined()
      expect(bpItem!.route).toBe('skill:bmad-brainstorming')
    }
  })

  it('returns error on invalid TOML', () => {
    const result = parseAgentV65('/fake/path/bmad-agent-test', 'not valid [[ toml')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toContain('Agent v65 parse error')
    }
  })
})
