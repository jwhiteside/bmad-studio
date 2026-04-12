import type { FileCategory } from './files.js'

export type FileChangedEvent = {
  type: 'file:changed'
  path: string
  category: FileCategory
}

export type FileCreatedEvent = {
  type: 'file:created'
  path: string
  category: FileCategory
}

export type FileDeletedEvent = {
  type: 'file:deleted'
  path: string
  category: FileCategory
}

export type ProjectReloadedEvent = {
  type: 'project:reloaded'
}

export type CompileNeededEvent = {
  type: 'compile:needed'
  agents: string[]
}

export type ProjectSwitchedEvent = {
  type: 'project:switched'
  projectName: string
  projectRoot: string
}

export type WebSocketEvent =
  | FileChangedEvent
  | FileCreatedEvent
  | FileDeletedEvent
  | ProjectReloadedEvent
  | CompileNeededEvent
  | ProjectSwitchedEvent
