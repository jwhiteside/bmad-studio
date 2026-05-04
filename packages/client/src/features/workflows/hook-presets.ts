import type { WorkflowHooks } from '@bmad-studio/shared'

export type PresetVariable = {
  key: string
  label: string
  placeholder: string
  description?: string
}

export type HookPreset = {
  id: string
  label: string
  description: string
  category: 'notification' | 'logging' | 'automation' | 'custom'
  hookType: keyof WorkflowHooks
  commandTemplate: string
  variables: PresetVariable[]
}

function fill(template: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce(
    (cmd, [k, v]) => cmd.split(`{{${k}}}`).join(v),
    template,
  )
}

export function resolvePreset(preset: HookPreset, vars: Record<string, string>): string {
  return fill(preset.commandTemplate, vars)
}

export const HOOK_PRESETS: HookPreset[] = [
  // ── Notifications ───────────────────────────────────────────────────────────
  {
    id: 'slack-webhook',
    label: 'Slack notification',
    description: 'Post a message to a Slack channel via webhook.',
    category: 'notification',
    hookType: 'onComplete',
    commandTemplate: `curl -s -X POST -H 'Content-type: application/json' --data '{"text":"{{message}}"}' {{webhook_url}}`,
    variables: [
      { key: 'webhook_url', label: 'Webhook URL', placeholder: 'https://hooks.slack.com/services/…', description: 'Incoming webhook URL from Slack' },
      { key: 'message', label: 'Message', placeholder: 'Workflow complete!', description: 'Text posted to the channel' },
    ],
  },
  {
    id: 'discord-webhook',
    label: 'Discord notification',
    description: 'Post a message to a Discord channel via webhook.',
    category: 'notification',
    hookType: 'onComplete',
    commandTemplate: `curl -s -X POST -H 'Content-Type: application/json' -d '{"content":"{{message}}"}' {{webhook_url}}`,
    variables: [
      { key: 'webhook_url', label: 'Webhook URL', placeholder: 'https://discord.com/api/webhooks/…' },
      { key: 'message', label: 'Message', placeholder: 'Workflow complete!' },
    ],
  },
  {
    id: 'generic-webhook',
    label: 'HTTP webhook (POST)',
    description: 'Fire a POST request to any URL when the hook triggers.',
    category: 'notification',
    hookType: 'onComplete',
    commandTemplate: `curl -s -X POST -H 'Content-Type: application/json' -d '{"event":"{{event_name}}"}' {{url}}`,
    variables: [
      { key: 'url', label: 'URL', placeholder: 'https://example.com/webhook' },
      { key: 'event_name', label: 'Event name', placeholder: 'workflow.complete' },
    ],
  },

  // ── Logging ─────────────────────────────────────────────────────────────────
  {
    id: 'file-log',
    label: 'Append to log file',
    description: 'Append a timestamped entry to a local log file.',
    category: 'logging',
    hookType: 'onComplete',
    commandTemplate: `echo "$(date -Iseconds) {{message}}" >> {{log_path}}`,
    variables: [
      { key: 'log_path', label: 'Log file path', placeholder: '/tmp/bmad-workflow.log' },
      { key: 'message', label: 'Message', placeholder: 'Workflow finished' },
    ],
  },

  // ── Automation ───────────────────────────────────────────────────────────────
  {
    id: 'github-workflow',
    label: 'Trigger GitHub Actions workflow',
    description: 'Dispatch a GitHub Actions workflow_dispatch event.',
    category: 'automation',
    hookType: 'onComplete',
    commandTemplate: `curl -s -X POST -H 'Authorization: token {{token}}' -H 'Accept: application/vnd.github.v3+json' https://api.github.com/repos/{{owner}}/{{repo}}/actions/workflows/{{workflow_file}}/dispatches -d '{"ref":"{{branch}}"}'`,
    variables: [
      { key: 'token', label: 'GitHub token', placeholder: 'ghp_…', description: 'Personal access token with workflow scope' },
      { key: 'owner', label: 'Owner', placeholder: 'my-org' },
      { key: 'repo', label: 'Repository', placeholder: 'my-repo' },
      { key: 'workflow_file', label: 'Workflow file', placeholder: 'deploy.yml' },
      { key: 'branch', label: 'Branch', placeholder: 'main' },
    ],
  },
  {
    id: 'run-script',
    label: 'Run a shell script',
    description: 'Execute a local script file.',
    category: 'automation',
    hookType: 'onComplete',
    commandTemplate: `bash {{script_path}}`,
    variables: [
      { key: 'script_path', label: 'Script path', placeholder: './scripts/on-complete.sh' },
    ],
  },
  {
    id: 'npm-script',
    label: 'Run npm script',
    description: 'Run a package.json script in a specific directory.',
    category: 'automation',
    hookType: 'activationStepsPrepend',
    commandTemplate: `npm run {{script_name}} --prefix {{dir}}`,
    variables: [
      { key: 'script_name', label: 'Script name', placeholder: 'build' },
      { key: 'dir', label: 'Directory', placeholder: '.' },
    ],
  },

  // ── Custom ──────────────────────────────────────────────────────────────────
  {
    id: 'custom',
    label: 'Custom command',
    description: 'Enter a shell command directly.',
    category: 'custom',
    hookType: 'onComplete',
    commandTemplate: `{{command}}`,
    variables: [
      { key: 'command', label: 'Command', placeholder: 'echo "done"' },
    ],
  },
]

export const PRESET_CATEGORIES: Record<HookPreset['category'], string> = {
  notification: 'Notifications',
  logging: 'Logging',
  automation: 'Automation',
  custom: 'Custom',
}
