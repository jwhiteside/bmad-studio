import { describe, it, expect, beforeEach } from 'vitest'

import {
  HOOK_TEMPLATES,
  registerTemplate,
  getTemplate,
  listTemplatesForSurface,
  type HookTemplate,
} from './hook-template-registry.js'

function makeTemplate(overrides: Partial<HookTemplate> = {}): HookTemplate {
  return {
    id: 'tmpl-' + Math.random().toString(36).slice(2, 8),
    label: 'Test',
    description: 'Test template',
    surfaces: ['onComplete'],
    params: [],
    render: () => 'echo test',
    ...overrides,
  }
}

describe('hook-template-registry', () => {
  beforeEach(() => {
    HOOK_TEMPLATES.clear()
  })

  it('registers a template into the singleton map', () => {
    const t = makeTemplate({ id: 'foo' })
    registerTemplate(t)
    expect(HOOK_TEMPLATES.size).toBe(1)
    expect(HOOK_TEMPLATES.get('foo')).toBe(t)
  })

  it('looks up a template by id', () => {
    const t = makeTemplate({ id: 'lookup-me' })
    registerTemplate(t)
    expect(getTemplate('lookup-me')).toBe(t)
    expect(getTemplate('does-not-exist')).toBeUndefined()
  })

  it('filters templates by surface', () => {
    const onlyComplete = makeTemplate({ id: 'a', surfaces: ['onComplete'] })
    const onlyPrepend = makeTemplate({ id: 'b', surfaces: ['activationStepsPrepend'] })
    const both = makeTemplate({
      id: 'c',
      surfaces: ['onComplete', 'activationStepsAppend'],
    })
    registerTemplate(onlyComplete)
    registerTemplate(onlyPrepend)
    registerTemplate(both)

    const onCompleteList = listTemplatesForSurface('onComplete')
    const prependList = listTemplatesForSurface('activationStepsPrepend')
    const appendList = listTemplatesForSurface('activationStepsAppend')

    expect(onCompleteList.map((t) => t.id).sort()).toEqual(['a', 'c'])
    expect(prependList.map((t) => t.id)).toEqual(['b'])
    expect(appendList.map((t) => t.id)).toEqual(['c'])
  })
})
