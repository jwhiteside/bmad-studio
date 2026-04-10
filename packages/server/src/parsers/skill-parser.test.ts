import { describe, it, expect } from 'vitest'

import { parseSkill } from './skill-parser.js'

describe('skill-parser', () => {
  it('extracts frontmatter and body', () => {
    const content = `---
name: bmad-create-prd
description: 'Create a PRD from scratch.'
---

Follow the instructions in ./workflow.md.
`
    const result = parseSkill('SKILL.md', content)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.id).toBe('bmad-create-prd')
      expect(result.data.name).toBe('bmad-create-prd')
      expect(result.data.description).toBe('Create a PRD from scratch.')
      expect(result.data.content).toBe('Follow the instructions in ./workflow.md.')
      expect(result.data.filePath).toBe('SKILL.md')
    }
  })

  it('handles best_for array', () => {
    const content = `---
name: test-skill
description: A test skill
best_for:
  - pm
  - analyst
---

Content here.
`
    const result = parseSkill('test.md', content)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.bestFor).toEqual(['pm', 'analyst'])
    }
  })

  it('handles missing frontmatter by falling back to directory name', () => {
    const result = parseSkill('/projects/test/_bmad/core/skills/my-skill/SKILL.md', 'Just plain markdown without frontmatter.')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.id).toBe('my-skill')
      expect(result.data.name).toBe('my-skill')
      expect(result.data.content).toBe('Just plain markdown without frontmatter.')
    }
  })
})
