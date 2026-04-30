import { describe, it, expect, beforeAll } from 'vitest'

import { getTemplate } from '../hook-template-registry.js'

import './run-tests.js'
import './llm-agent-ingest.js'

describe('hook templates 4-5 (Story 35.7)', () => {
  beforeAll(() => {
    expect(getTemplate('run-tests')).toBeDefined()
    expect(getTemplate('llm-agent-ingest')).toBeDefined()
  })

  it('run-tests renders with default command', () => {
    const t = getTemplate('run-tests')!
    expect(t.surfaces).toEqual(['activationStepsPrepend', 'activationStepsAppend'])
    expect(t.render({ command: 'npm test --silent' })).toBe('npm test --silent')
    // Falls back to the param default when omitted
    expect(t.render({})).toBe('npm test --silent')
  })

  it('llm-agent-ingest renders with kind=prd and exposes scriptTemplate', () => {
    const t = getTemplate('llm-agent-ingest')!
    expect(t.surfaces).toEqual(['onComplete'])
    expect(t.render({ kind: 'prd' })).toBe(
      'bash {project-root}/_bmad/custom/scripts/llm-wiki-ingest.sh prd',
    )
    expect(t.scriptTemplate).toEqual({
      sourcePath: 'llm-wiki-ingest.sh.template',
      destPath: 'llm-wiki-ingest.sh',
    })
  })
})
