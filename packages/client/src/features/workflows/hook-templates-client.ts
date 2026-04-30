import type { WorkflowHookSurface } from '@bmad-studio/shared'

/**
 * Client-side mirror of the server's hook template metadata + render functions.
 *
 * Templates are static compile-time data; mirroring the metadata here avoids
 * a network round-trip for the palette UI. The server remains the source of
 * truth for the registry — the client list MUST stay in sync with the server
 * templates in `packages/server/src/v65/templates/*.ts`.
 */

export type ParamType = 'string' | 'enum' | 'boolean'

export type ClientParamDescriptor = {
  name: string
  type: ParamType
  label: string
  description?: string
  required?: boolean
  default?: string | boolean
  options?: string[]
}

export type ClientHookTemplate = {
  id: string
  label: string
  description: string
  surfaces: WorkflowHookSurface[]
  params: ClientParamDescriptor[]
  /** Pure function — must match the server-side render() output. */
  render: (params: Record<string, string | boolean>) => string
  hasScriptTemplate?: boolean
}

export const CLIENT_HOOK_TEMPLATES: ClientHookTemplate[] = [
  {
    id: 'raw-shell',
    label: 'Raw shell command',
    description: 'Runs an arbitrary shell command',
    surfaces: ['activationStepsPrepend', 'activationStepsAppend', 'onComplete'],
    params: [
      { name: 'command', type: 'string', label: 'Command', required: true },
    ],
    render: ({ command }) => String(command ?? ''),
  },
  {
    id: 'slack-post',
    label: 'Slack post',
    description: 'Posts a message to Slack via incoming webhook',
    surfaces: ['onComplete'],
    params: [
      {
        name: 'webhookEnvVar',
        type: 'string',
        label: 'Webhook env var',
        default: 'SLACK_WEBHOOK',
      },
      { name: 'message', type: 'string', label: 'Message', required: true },
    ],
    render: ({ webhookEnvVar, message }) => {
      const env = String(webhookEnvVar ?? 'SLACK_WEBHOOK')
      const escaped = String(message ?? '').replace(/'/g, "\\'")
      return `curl -s -X POST $${env} -H 'Content-type: application/json' -d '{"text":"${escaped}"}'`
    },
  },
  {
    id: 'git-tag',
    label: 'Git tag',
    description: 'Creates a timestamped git tag and pushes it',
    surfaces: ['onComplete'],
    params: [
      { name: 'tagPrefix', type: 'string', label: 'Tag prefix', default: 'bmad' },
    ],
    render: ({ tagPrefix }) =>
      `git tag ${String(tagPrefix ?? 'bmad')}-$(date +%s) && git push --tags`,
  },
  {
    id: 'run-tests',
    label: 'Run tests',
    description: 'Runs the project test suite before the workflow continues',
    surfaces: ['activationStepsPrepend', 'activationStepsAppend'],
    params: [
      { name: 'command', type: 'string', label: 'Test command', default: 'npm test --silent' },
    ],
    render: ({ command }) => String(command ?? 'npm test --silent'),
  },
  {
    id: 'llm-agent-ingest',
    label: 'LLM agent ingest',
    description: 'Stages an artefact for the LLM Wiki integration',
    surfaces: ['onComplete'],
    params: [
      {
        name: 'kind',
        type: 'enum',
        label: 'Artefact kind',
        options: ['prd', 'architecture', 'story', 'retro'],
        required: true,
      },
    ],
    render: ({ kind }) =>
      `bash {project-root}/_bmad/custom/scripts/llm-wiki-ingest.sh ${String(kind ?? 'prd')}`,
    hasScriptTemplate: true,
  },
]

export function templatesForSurface(surface: WorkflowHookSurface): ClientHookTemplate[] {
  return CLIENT_HOOK_TEMPLATES.filter((t) => t.surfaces.includes(surface))
}

export function getClientTemplate(id: string): ClientHookTemplate | undefined {
  return CLIENT_HOOK_TEMPLATES.find((t) => t.id === id)
}
