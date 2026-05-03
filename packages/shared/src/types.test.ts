import { describe, it, expect, expectTypeOf } from 'vitest'

import { resolveAppTitle, DEFAULT_APP_TITLE } from './config.js'
import type { Agent, AgentMenuItem } from './agents.js'
import type { Skill } from './skills.js'
import type { Workflow, WorkflowStep } from './workflows.js'
import type { DataSource, ConnectionStatus } from './connections.js'
import type { Workspace } from './workspace.js'
import type { Package, PackageManifest } from './packages.js'
import type { Output, Template } from './outputs.js'
import type { ProjectConfig, ProjectLevel, StudioSettings, AppInfo } from './config.js'
import type { FileNode, FileCategory } from './files.js'
import type { ValidationResult, ValidationIssue } from './validation.js'
import type {
  WebSocketEvent,
  FileChangedEvent,
  FileCreatedEvent,
  FileDeletedEvent,
} from './events.js'
import type { ApiError, ErrorCode, Severity } from './errors.js'

describe('shared types', () => {
  it('Agent type has flat required fields', () => {
    expectTypeOf<Agent>().toHaveProperty('id')
    expectTypeOf<Agent>().toHaveProperty('name')
    expectTypeOf<Agent>().toHaveProperty('role')
    expectTypeOf<Agent>().toHaveProperty('discussion')
    expectTypeOf<Agent>().toHaveProperty('menu')
    expectTypeOf<Agent>().toHaveProperty('skills')
    expectTypeOf<Agent>().toHaveProperty('filePath')
  })

  it('AgentMenuItem has required fields', () => {
    expectTypeOf<AgentMenuItem>().toHaveProperty('trigger')
    expectTypeOf<AgentMenuItem>().toHaveProperty('input')
    expectTypeOf<AgentMenuItem>().toHaveProperty('route')
  })

  it('Skill type has required fields', () => {
    expectTypeOf<Skill>().toHaveProperty('id')
    expectTypeOf<Skill>().toHaveProperty('name')
    expectTypeOf<Skill>().toHaveProperty('description')
    expectTypeOf<Skill>().toHaveProperty('content')
    expectTypeOf<Skill>().toHaveProperty('filePath')
  })

  it('Workflow type has required fields', () => {
    expectTypeOf<Workflow>().toHaveProperty('id')
    expectTypeOf<Workflow>().toHaveProperty('name')
    expectTypeOf<Workflow>().toHaveProperty('steps')
    expectTypeOf<Workflow>().toHaveProperty('entryPoint')
  })

  it('WorkflowStep uses filePath consistently', () => {
    expectTypeOf<WorkflowStep>().toHaveProperty('filePath')
    expectTypeOf<WorkflowStep>().toHaveProperty('title')
  })

  it('DataSource type has required fields', () => {
    expectTypeOf<DataSource>().toHaveProperty('id')
    expectTypeOf<DataSource>().toHaveProperty('status')
    expectTypeOf<DataSource>().toHaveProperty('cliTool')
    expectTypeOf<DataSource>().toHaveProperty('parameters')
    expectTypeOf<DataSource>().toHaveProperty('outputPath')
  })

  it('ConnectionStatus is a union of expected values', () => {
    expectTypeOf<ConnectionStatus>().toEqualTypeOf<'connected' | 'configured' | 'synced' | 'error' | 'not-configured'>()
  })

  it('Workspace type has required fields', () => {
    expectTypeOf<Workspace>().toHaveProperty('sections')
    expectTypeOf<Workspace>().toHaveProperty('rawContent')
  })

  it('Package extends PackageManifest', () => {
    expectTypeOf<Package>().toMatchTypeOf<PackageManifest>()
    expectTypeOf<Package>().toHaveProperty('id')
    expectTypeOf<Package>().toHaveProperty('filePath')
  })

  it('Output type has required fields', () => {
    expectTypeOf<Output>().toHaveProperty('path')
    expectTypeOf<Output>().toHaveProperty('name')
    expectTypeOf<Output>().toHaveProperty('modifiedAt')
  })

  it('Template type has required fields', () => {
    expectTypeOf<Template>().toHaveProperty('id')
    expectTypeOf<Template>().toHaveProperty('source')
    expectTypeOf<Template>().toHaveProperty('content')
  })

  it('ProjectConfig type has required fields with constrained level', () => {
    expectTypeOf<ProjectConfig>().toHaveProperty('projectName')
    expectTypeOf<ProjectConfig>().toHaveProperty('projectType')
    expectTypeOf<ProjectConfig>().toHaveProperty('modules')
    expectTypeOf<ProjectConfig>().toHaveProperty('projectLevel')
    expectTypeOf<ProjectLevel>().toEqualTypeOf<0 | 1 | 2 | 3 | 4>()
  })

  it('StudioSettings type has required fields without index signature', () => {
    expectTypeOf<StudioSettings>().toHaveProperty('port')
    expectTypeOf<StudioSettings>().toHaveProperty('theme')
    expectTypeOf<StudioSettings>().toHaveProperty('appTitle')
  })

  it('AppInfo type has name and version', () => {
    expectTypeOf<AppInfo>().toHaveProperty('name')
    expectTypeOf<AppInfo>().toHaveProperty('version')
  })

  it('FileNode type has required fields', () => {
    expectTypeOf<FileNode>().toHaveProperty('name')
    expectTypeOf<FileNode>().toHaveProperty('path')
    expectTypeOf<FileNode>().toHaveProperty('type')
  })

  it('FileCategory is a union of expected values', () => {
    expectTypeOf<FileCategory>().toEqualTypeOf<
      'agent' | 'skill' | 'workflow' | 'config' | 'connection' | 'other'
    >()
  })

  it('ValidationResult type has required fields', () => {
    expectTypeOf<ValidationResult>().toHaveProperty('valid')
    expectTypeOf<ValidationResult>().toHaveProperty('issues')
  })

  it('ValidationIssue uses shared Severity type', () => {
    expectTypeOf<ValidationIssue>().toHaveProperty('severity')
    expectTypeOf<ValidationIssue>().toHaveProperty('code')
    expectTypeOf<ValidationIssue>().toHaveProperty('message')
  })

  it('Severity is a single canonical type used by both validation and errors', () => {
    expectTypeOf<Severity>().toEqualTypeOf<'error' | 'warning'>()
  })

  it('WebSocketEvent file events have path and category fields (AC3)', () => {
    expectTypeOf<FileChangedEvent>().toHaveProperty('type')
    expectTypeOf<FileChangedEvent>().toHaveProperty('path')
    expectTypeOf<FileChangedEvent>().toHaveProperty('category')
    expectTypeOf<FileCreatedEvent>().toHaveProperty('path')
    expectTypeOf<FileCreatedEvent>().toHaveProperty('category')
    expectTypeOf<FileDeletedEvent>().toHaveProperty('path')
    expectTypeOf<FileDeletedEvent>().toHaveProperty('category')
  })

  it('WebSocketEvent is a discriminated union', () => {
    const event: WebSocketEvent = { type: 'file:changed', path: '/test', category: 'agent' }
    expectTypeOf(event).toMatchTypeOf<WebSocketEvent>()

    const reloaded: WebSocketEvent = { type: 'project:reloaded' }
    expectTypeOf(reloaded).toMatchTypeOf<WebSocketEvent>()

    const compile: WebSocketEvent = { type: 'compile:needed', agents: ['pm'] }
    expectTypeOf(compile).toMatchTypeOf<WebSocketEvent>()
  })

  it('ApiError uses ErrorCode, not bare string', () => {
    expectTypeOf<ApiError>().toHaveProperty('error')
    expectTypeOf<ErrorCode>().toEqualTypeOf<
      | 'NOT_FOUND'
      | 'VALIDATION_ERROR'
      | 'CONFLICT'
      | 'FILE_SYSTEM_ERROR'
      | 'INTERNAL_ERROR'
      | 'MANIFEST_MISSING'
      | 'MANIFEST_PARSE_ERROR'
      | 'WRITE_FAILED'
    >()
  })
})

describe('resolveAppTitle', () => {
  it('returns DEFAULT_APP_TITLE when settings is null', () => {
    expect(resolveAppTitle(null)).toBe(DEFAULT_APP_TITLE)
  })
  it('returns DEFAULT_APP_TITLE when settings is undefined', () => {
    expect(resolveAppTitle(undefined)).toBe(DEFAULT_APP_TITLE)
  })
  it('returns DEFAULT_APP_TITLE when appTitle field is missing', () => {
    expect(resolveAppTitle({})).toBe(DEFAULT_APP_TITLE)
  })
  it('returns DEFAULT_APP_TITLE when appTitle is an empty string', () => {
    expect(resolveAppTitle({ appTitle: '' })).toBe(DEFAULT_APP_TITLE)
  })
  it('returns DEFAULT_APP_TITLE when appTitle is whitespace-only', () => {
    expect(resolveAppTitle({ appTitle: '   ' })).toBe(DEFAULT_APP_TITLE)
  })
  it('returns the trimmed value when appTitle has surrounding whitespace', () => {
    expect(resolveAppTitle({ appTitle: '  Acme Studio  ' })).toBe('Acme Studio')
  })
  it('returns the value verbatim when appTitle is set normally', () => {
    expect(resolveAppTitle({ appTitle: 'Acme Studio' })).toBe('Acme Studio')
  })
  it('returns DEFAULT_APP_TITLE when appTitle is a non-string (number)', () => {
    expect(resolveAppTitle({ appTitle: 42 } as unknown as { appTitle?: unknown })).toBe(
      DEFAULT_APP_TITLE,
    )
  })
  it('returns DEFAULT_APP_TITLE when appTitle is null', () => {
    expect(resolveAppTitle({ appTitle: null } as unknown as { appTitle?: unknown })).toBe(
      DEFAULT_APP_TITLE,
    )
  })
})
