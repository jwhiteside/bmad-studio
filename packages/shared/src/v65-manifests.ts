/**
 * Shared types for v6.5 manifest files under `_bmad/_config/`.
 *
 * Implements ADR-1 (Manifest-as-Index Discovery Strategy) from
 * `_bmad-output/planning-artifacts/architecture-v65-migration.md`.
 *
 * Canonical readers live in `packages/server/src/v65/manifest-loader.ts`.
 */

/** A row from `_bmad/_config/skill-manifest.csv` (v6.5). */
export type SkillManifestEntry = {
  canonicalId: string
  name: string
  description: string
  module: string
  path: string
}

/** A row from `_bmad/_config/bmad-help.csv` (v6.5). */
export type BmadHelpEntry = {
  module: string
  phase: string
  name: string
  code: string
  sequence: string
  workflowFile: string
  command: string
  required: string
  agentName: string
  agentCommand: string
  agentDisplayName: string
  agentTitle: string
  options: string
  description: string
  outputLocation: string
  outputs: string
}
