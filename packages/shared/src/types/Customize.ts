/**
 * Shared types for BMAD v6.5 layered TOML configuration resolution.
 */

/** The name of the layer that last contributed a field's value. */
export type LayerOrigin = 'base' | 'team' | 'user' | 'merged'

/**
 * Result of `resolveLayered` when called with `{ provenance: true }`.
 *
 * - `merged`     — the fully-resolved configuration object.
 * - `provenance` — a flat map of top-level field names to the `LayerOrigin`
 *                  that last contributed to that field's value.
 */
export type Resolved<T> = {
  merged: T
  provenance: Record<string, LayerOrigin>
}

/** A single hook command with optional disabled state. */
export type HookEntry = {
  command: string
  disabled?: boolean
}

/** Resolved hook surface on a workflow. */
export type WorkflowHooks = {
  activationStepsPrepend: HookEntry[]
  activationStepsAppend: HookEntry[]
  onComplete: HookEntry[]
}
