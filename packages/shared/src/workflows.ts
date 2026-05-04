import type { WorkflowHooks } from './types/Customize.js'

export type { WorkflowHooks }

export type WorkflowType = 'step-based' | 'agent-based' | 'composite' | 'utility'

/**
 * Canonical workflow type definitions — single source of truth.
 * D1 decision: step-based = single agent, structured steps.
 * All UI surfaces must import descriptions from here.
 */
export const WORKFLOW_TYPE_DEFINITIONS: Record<WorkflowType, {
  label: string
  description: string
  bestFor: string[]
}> = {
  'step-based': {
    label: 'Step Workflow',
    description: 'A single agent follows a structured sequence of numbered steps — like a recipe. The workflow gives one agent clear, ordered instructions to follow.',
    bestFor: ['Creating a single document', 'Running a focused analysis', 'Guided single-session tasks'],
  },
  'agent-based': {
    label: 'Agent Workflow',
    description: 'Multiple specialist agents in sequence. Each phase is handed to a different agent — like a relay race where the baton passes between experts.',
    bestFor: ['Sprint planning', 'Architecture design', 'Multi-phase deliverables needing different expertise'],
  },
  composite: {
    label: 'Composite Workflow',
    description: 'Combines step-based and agent-based sections. Some phases are handled by a single agent following steps, others hand off to specialist agents.',
    bestFor: ['Complex processes needing both structured steps and agent handoffs', 'Workflows with parallel tracks'],
  },
  utility: {
    label: 'Utility Skill',
    description: 'A reusable tool or technique that can be invoked from any context — not a structured workflow, but a capability the LLM applies on demand.',
    bestFor: ['Brainstorming', 'Document review', 'Editorial tasks', 'General-purpose operations'],
  },
}

export type WorkflowSubAgent = {
  id: string
  name: string
  filePath: string
}

export type WorkflowTemplate = {
  filePath: string
  name: string
}

export type WorkflowSubWorkflow = {
  filePath: string
  name: string
}

export type WorkflowStep = {
  filePath: string
  title: string
  description: string
  agent?: string
  inputs?: string[]
  outputs?: string[]
  isVariant?: boolean
  variantSet?: string
}

export type WorkflowInput = {
  id: string
  description: string
  pathPatterns: string[]
  required: boolean
  fileType?: string
}

export type WorkflowOutput = {
  id: string
  description: string
  pathPattern: string
  fileType?: string
}

export type WorkflowIo = {
  inputs: WorkflowInput[]
  outputs: WorkflowOutput[]
}

export type Workflow = {
  id: string
  name: string
  description: string
  entryPoint: string
  steps: WorkflowStep[]
  filePath: string
  module?: string
  type?: WorkflowType
  phase?: string
  templates?: WorkflowTemplate[]
  subWorkflows?: WorkflowSubWorkflow[]
  supportingFiles?: string[]
  subAgents?: WorkflowSubAgent[]
  hooks?: WorkflowHooks
  persistentFacts?: string[]
  io?: WorkflowIo
}

export type WorkflowListItem = {
  id: string
  name: string
  description: string
  module?: string
  stepCount: number
  type?: WorkflowType
  phase?: string
  hookCount?: number
}
