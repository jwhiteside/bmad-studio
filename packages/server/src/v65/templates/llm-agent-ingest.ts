import { registerTemplate } from '../hook-template-registry.js'

registerTemplate({
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
  scriptTemplate: {
    sourcePath: 'llm-wiki-ingest.sh.template',
    destPath: 'llm-wiki-ingest.sh',
  },
})
