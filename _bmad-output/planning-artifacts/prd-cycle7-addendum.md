# PRD Addendum — Cycle 7 (E42–E48)

**Date:** 2026-05-04
**Status:** Draft — awaiting approval
**Predecessor:** `prd-v65-migration.md` (Cycles 5–6, E31–E41)
**Source briefs:** `docs/features/` — Studio Companion brief set v3

---

## Context

Cycles 1–6 delivered the core Studio infrastructure: project detection, entity browsing (agents, workflows, teams, skills), v6.5 migration (entity model, customisation layer), module management, and runtime project switching.

Cycle 7 shifts focus. The infrastructure is solid. The gap is that Studio does not yet *guide* its primary user — a mid-level engineer setting up or using a BMAD project — to do the right thing at the right time.

---

## Primary persona

**The mid-level engineer.** Uses BMAD in their day-to-day work (Claude Code, Cursor). Opens Studio to understand what's installed, check project readiness, and set up substrate files. Is technically competent but has no interest in Studio internals. Wants three things:

1. "What can I run, and is the project ready for it?"
2. "What agents and workflows are available to me?"
3. "Is my project context good enough to get useful output?"

Everything in Cycle 7 serves at least one of these.

---

## Epics

| Epic | Title | Priority | Status |
|------|-------|----------|--------|
| E42 | UI Tidy — Navigation and Page Audit | P0 | MVP, ships first |
| E43 | Workflow Hooks: Configuration and Integration | P0 | MVP, ships second |
| E44 | Workflow Visibility | P0 | MVP, ships third |
| E45 | Project Context Editor | P0 | MVP, ships fourth |
| E46 | Pattern Library Integration | P0 | MVP, ships fifth |
| E47 | Setup Wizards Phase 1 | P1 | Post-MVP |
| E48 | UI and Design System Update | P0 | Scope TBD after E47 |
| E49 | Authoring Linters | P2 | Post-MVP |
| E50 | Setup Wizards Phase 2 | — | Deferred, no timeline |

---

## E42 — UI Tidy

### Problem

Studio has accumulated pages and nav items that made sense during development but add friction for the primary user. The Toolkit/View All page, All Files browser, raw Workspace editor, and Agent Triggers top-level page are all either redundant with better alternatives or too low-value to justify a nav slot. Card and detail panel elements likewise carry fields the user never acts on.

### Goal

Remove dead weight from navigation and trim every card and detail panel to the elements that actually help the user decide what to do next.

### What changes

**Remove from navigation (pages stay in codebase until superseded):**
- `/toolkit` — Toolkit / View All / IDE View. Fully superseded by individual entity pages.
- `/files` — All Files. Engineers use their IDE file tree; this adds no value.
- `/commands` — Agent Triggers. Demote from top-level nav; keep page accessible from Home's "View all triggers" link only.
- `/workspace` — Remove nav link only. Page stays until E44's Project Context Editor replaces it in story 44.1.

**Home page:**
- Remove the Toolkit Summary section (4 count tiles: Agents, Skills, Workflows, Teams). Count tiles are decorative; the user goes to the page directly. Keep the sprint status and Output Hub panels — those are actionable.
- The Phase Timeline (BMAD process map with command pills) stays — it's the best orientation tool for new users and the natural entry point to the Commands reference. Fix its "View all triggers →" link to go directly to the commands page without requiring it to be in the nav.

**Agents page and detail:**
- Cards: remove the skill count badge and the inline skill list preview. These are internal implementation details.
- Detail panel: remove the "Assigned skills" section entirely. Skills are a BMAD internals concept; the user cares about what the agent *does*, not how it's wired.
- Keep: agent icon, name, title, role description, module badge, communication style.

**Workflows page and detail:**
- Cards: remove the step count badge. Type badge (Step/Agent/Composite/Utility) and phase are sufficient signals.
- Detail panel: keep Sub-Agents section (just shipped), Sub-Workflows, Supporting Files. The phase label and type badge are useful.
- Hooks section: add a compact Hooks section to the detail panel showing configured `before_story` / `after_story` hooks from `customize.toml`. This is already parsed server-side; just needs a UI slot.

**Settings navigation:**
- Remove `/files` (All Files) from Settings group nav items.
- IDE Connections page audit: the page is 811 lines. The core function (configure IDE connection) is right. Trim: remove any capability that isn't needed for initial connection setup. Detailed audit in story 42.5.

### Out of scope
- Re-designing any page layout beyond the audited removals
- Changing any data fetching or server endpoints (pure client cleanup)

### Success criteria
- Nav item count reduced by at least 3 in each mode (v6, v6.5)
- No removed nav item leaves a user stranded (every demoted page is reachable via contextual link)
- Agents cards and Workflows cards each lose at least one field without losing any decision-relevant information

---

## E43 — Workflow Hooks: Configuration and Integration

### Problem

Workflow hooks are BMAD's integration layer — shell commands that run at key lifecycle moments (before activation, after activation, on completion). They let engineers connect workflows to the tools they already use: Slack notifications when a workflow completes, JIRA issues opened before sprint planning, file-based run logs, webhook calls to CI/CD pipelines.

The hooks system is fully implemented server-side (parsed from `customize.toml` per workflow via `workflow-adapter.ts`) but has zero UI presence. Engineers who know about hooks must hand-edit TOML files. Engineers who don't know about hooks miss the feature entirely.

### Goal

Hooks become a first-class, discoverable UI feature. Engineers can see, add, edit, enable/disable, and delete hook commands for any workflow without touching TOML. Common integration patterns (Slack, webhooks, file logging, GitHub) are available as one-click templates.

### Scope

Four stories covering the full hooks lifecycle:

**Discovery and read (43.1):** A dedicated Hooks section in WorkflowDetailPanel — always visible (never hidden), with human-readable lifecycle labels ("Before activation", "After activation", "On complete"), monospace command display, and enabled/disabled state chips. Empty subsections show "No commands configured" + Add CTA.

**Configuration (43.2):** Full read/write hook management. Add commands via inline form, toggle enabled/disabled state, delete commands, reorder via up/down arrows. Server endpoint `PUT /api/workflows/:id/hooks` writes changes back to `customize.toml` using the existing `atomicWrite` primitive and the existing sidecar state format.

**Integration presets (43.3):** "Add from template" action opens a preset picker with common integration patterns — Slack notification, log to file, open URL, GitHub create issue, post to webhook, run custom script. Variable form substitutes `{workflow_name}`, `{datetime}`, `{project_name}` etc. before adding the resolved command.

**List and overview (43.4):** Hooks indicator on workflow cards (icon + count when hooks configured). "Has hooks" filter chip on Workflows page. "Active integrations" count on Home overview (hidden when zero).

### Out of scope
- Executing hooks from Studio (hooks run in the LLM client, not Studio)
- Real-time hook output streaming
- Hook discovery from arbitrary shell PATH (preset commands must be installed by the engineer)

---

## E44 — Workflow Visibility

### Problem

Engineers trigger BMAD workflows without knowing whether the project is ready for them. The result is wasted runs and bad output. Studio has no way to tell an engineer "don't run the architecture workflow yet — you haven't written a PRD."

### Goal

At any moment, an engineer opens Studio's Workflows page and immediately knows: which workflows are ready, which are blocked and why, and what to do about it.

### Scope

This epic implements the feature brief `[Reference] Studio Brief - Workflow Visibility - 20260501.md` in full.

Key requirements from the brief:
- Workflow status: Ready / Blocked / Already Run / Unknown
- Status based on declared `io` block in `workflow.md` frontmatter, with fallback to parsing markdown tables
- Detail panel: Inputs table, Outputs table, Downstream consumers, Run history (file-system derived)
- Home dashboard: "Workflows ready" panel + next recommended workflow
- Live updates via existing chokidar/WebSocket

See source brief for full functional requirements (F1–F6) and UX notes.

### Out of scope
- Triggering workflows from Studio
- AI-assisted suggestions
- Cross-project workflow analysis

---

## E45 — Project Context Editor

### Problem

`project-context.md` is the most important substrate file in a BMAD project. In Studio today it opens in a generic markdown editor identical to VS Code. Engineers don't know what "good" looks like and have no feedback on quality.

### Goal

A structured, guided, linting editor for `project-context.md` that makes quality substrate the path of least resistance. This replaces the existing Workspace page.

### Scope

This epic implements `[Reference] Studio Brief - Project Context Editor - 20260501.md` in full.

Key requirements:
- Section-aware editor: renders canonical sections (Purpose, Tech Stack, Conventions, Anti-patterns, etc.) as discrete editable units
- Linter: deterministic rule-based checks (no LLM), findings inline and in sidebar
- Quality score: 0–100, live-updating, visible on Overview dashboard
- Template import: pulls from pattern library (stubbed if E46 not yet merged)
- Raw markdown toggle: CodeMirror fallback
- Diff preview on save (non-destructive principle)

The linter engine is the architectural centrepiece of this epic. It is built in `@bmad-studio/shared` as a pure function (no I/O) so it can be reused by E48 without duplication.

Story 45.1 removes the `/workspace` route and redirects to the new editor.

---

## E46 — Pattern Library Integration

### Problem

DEPT®'s reusable project templates are the IP that makes BMAD projects start well. They are in a separate git repository, disconnected from Studio. Engineers copy files manually.

### Goal

Studio reads one or more external pattern libraries by URL, discovers available templates, and lets engineers import them directly into editors (project-context, ADR, etc.) without file copying.

### Scope

This epic implements `[Reference] Studio Brief - Pattern Library Integration - 20260501.md` in full.

Key requirements:
- Settings UI: add/remove/enable libraries by git URL or local path
- Library fetch: git shallow clone → `.bmad-studio/library-cache/`, refreshed on configurable interval
- Manifest reader: parses `manifest.yaml` per library (spec in `[Reference] Studio Content - Pattern Library Manifest Spec`)
- Template picker: reusable component, appears in any editor with an "Import from library" action
- Variable form: renders template variable fields before import
- Non-destructive: diff preview before applying

No credentials stored. Uses system git config / SSH keys.

---

## E47 — Setup Wizards Phase 1

### Problem

Starting a BMAD project from scratch requires an engineer to know what files to create and what goes in them. There is no guided path. Brownfield onboarding is even harder: conventions, tech stack, and decisions need capturing from an existing codebase.

### Goal

A wizard that takes a new or existing project from zero to a usable `project-context.md` and minimal skeleton in a single guided session.

### Scope

Phase 1 only:
- **Greenfield wizard**: 10-step guided flow producing `project-context.md` from scratch. Uses pattern library templates as starting points.
- **Brownfield wizard (manual)**: Structured prompts for the engineer to fill in tech stack, conventions, and candidate ADRs themselves. No automatic inference.

Phase 2 (automatic brownfield inference) is deferred to E49.

Source: `[Reference] Studio Brief - Setup Wizards - 20260501.md`. Copy from `[Reference] Studio Content - Wizard Copy - 20260501.md`.

### Dependency
Requires E46 (Pattern Library) to be merged first. Can be stubbed against a hardcoded template set if E46 slips.

---

## E48 — UI and Design System Update

### Problem

New design system available. Studio's current Tailwind + shadcn/ui implementation needs to be updated to align with it.

### Goal

Migrate Studio's UI to the new design system. Scope and details to be provided by the owner after E47 (Setup Wizards Phase 1) ships.

### Status

**Placeholder — no stories defined.** Design system details will be shared after E47 is complete. This epic will be fully specced at that point before implementation begins.

---

## E49 — Authoring Linters

### Problem

Quality checks exist only for `project-context.md` (E45). Agent personas, workflow definitions, and module configs have no inline validation. Module authors get no feedback when writing BMAD content.

### Goal

Extend the linter primitive (from E45) to cover agent persona files, workflow definitions, and module configs. Show findings inline in the relevant detail panels.

### Scope

Reuses the linter engine built in E45 (`@bmad-studio/shared`). Adds:
- Agent persona linter (AG- rules from `[Reference] Studio Content - Linter Rules`)
- Workflow linter (WF- rules)
- Module linter (MD- rules)
- Lint findings surface in Agent detail panel and Workflow detail panel

### Dependency
Requires E45 linter engine.

---

## E50 — Setup Wizards Phase 2 (Deferred)

Automatic brownfield inference: manifest scanning, convention detection, ADR candidate identification. No stories defined. Revisit when real usage data exists to tune heuristics.

---

## Operating principles (all epics)

From the brief set — apply to every decision:

1. **Local-only.** No accounts, no servers beyond the local Fastify process, no shared state.
2. **Deterministic.** No LLM calls inside Studio. Rule-based throughout.
3. **Configure, don't execute.** Studio sets up substrate; the IDE runs agents.
4. **Non-destructive.** Always diff preview before write.
5. **Open core.** Pattern library is a separate closed repo; Studio itself remains open.

---

## Out of scope (all Cycle 7)

- Visual designs / wireframes (these briefs have no wire-frames; implement with existing design system)
- Multi-user editing or collaboration
- Telemetry
- AI-assisted content suggestions
- Marketplace or template discovery features
