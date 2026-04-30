import type { WorkflowHookSurface } from '@bmad-studio/shared'

/**
 * v6.5 Hook Template Registry (Epic 35, Story 35.1).
 *
 * A serialisable param descriptor model — no Zod dependency. Each template
 * exposes metadata + a `render(params)` function that produces the shell
 * command string written into customize.toml.
 */

export type ParamType = 'string' | 'enum' | 'boolean'

export type ParamDescriptor = {
  name: string
  type: ParamType
  label: string
  description?: string
  required?: boolean
  default?: string | boolean
  /** options for `enum` type */
  options?: string[]
}

export type HookTemplate = {
  id: string
  label: string
  description: string
  surfaces: WorkflowHookSurface[]
  params: ParamDescriptor[]
  render: (params: Record<string, string | boolean>) => string
  /**
   * Optional: a script template bundled with the server that gets copied
   * into the project's `_bmad/custom/scripts/` directory when the template
   * is first inserted. Existing files are NEVER overwritten (FR33).
   */
  scriptTemplate?: {
    /** Source path relative to `packages/server/src/v65/templates/scripts/` */
    sourcePath: string
    /** Destination path relative to `<projectRoot>/_bmad/custom/scripts/` */
    destPath: string
  }
  docsUrl?: string
}

/** Registry singleton. Templates self-register at module import time. */
export const HOOK_TEMPLATES = new Map<string, HookTemplate>()

export function registerTemplate(template: HookTemplate): void {
  HOOK_TEMPLATES.set(template.id, template)
}

export function getTemplate(id: string): HookTemplate | undefined {
  return HOOK_TEMPLATES.get(id)
}

export function listTemplatesForSurface(surface: WorkflowHookSurface): HookTemplate[] {
  return Array.from(HOOK_TEMPLATES.values()).filter((t) => t.surfaces.includes(surface))
}

export function listAllTemplates(): HookTemplate[] {
  return Array.from(HOOK_TEMPLATES.values())
}
