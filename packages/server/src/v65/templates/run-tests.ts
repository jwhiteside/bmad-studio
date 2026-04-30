import { registerTemplate } from '../hook-template-registry.js'

registerTemplate({
  id: 'run-tests',
  label: 'Run tests',
  description: 'Runs the project test suite before the workflow continues',
  surfaces: ['activationStepsPrepend', 'activationStepsAppend'],
  params: [
    {
      name: 'command',
      type: 'string',
      label: 'Test command',
      default: 'npm test --silent',
    },
  ],
  render: ({ command }) => String(command ?? 'npm test --silent'),
})
