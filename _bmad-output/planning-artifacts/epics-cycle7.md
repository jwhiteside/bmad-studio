# Epics — Cycle 7 (E42–E48)

**Date:** 2026-05-04
**Status:** Draft — awaiting approval
**PRD reference:** `prd-cycle7-addendum.md`
**Architecture reference:** `architecture-cycle7-notes.md`

Epic numbering continues from E41 (last Cycle 6 epic).

---

## E42 — UI Tidy: Navigation and Page Audit

**Goal:** Remove dead nav items and trim every card/panel to decision-useful content only. Clean canvas before new features land.

**Estimate:** 4–5 days

### Stories

**42.1 — Remove dead nav items and routes**
Remove from navigation and routing:
- `/toolkit` (Toolkit / View All / IDE View) — all modes
- `/files` (All Files) — Settings group
- `/commands` removed from nav; page kept and reachable via Home's "View all triggers →" link
- `/workspace` nav link removed; page kept until 44.1 replaces it

Update `Sidebar.tsx` (both `toolkitGroupV6` and `toolkitGroupV65`) and `app.tsx` router. Confirm no nav link goes to a 404.

AC:
- Nav item count reduced (v6: from 8 to 5; v6.5: from 7 to 4 in Toolkit group)
- `/toolkit`, `/files`, `/commands` (nav), `/workspace` (nav) all removed
- All removed pages still render at their URL (not deleted yet)
- No broken links anywhere in the app

---

**42.2 — Home page: remove Toolkit Summary, fix Commands link**
- Remove the "Toolkit" section from OverviewPage (the 4-count tiles for Agents/Skills/Workflows/Teams). These are decorative and compete with entity pages.
- The Phase Timeline "View all triggers →" link should navigate directly to `/commands`; confirm this works without `/commands` being in the sidebar nav.
- Keep: Sprint Status panel, Output Hub panel, Phase Timeline, Project Context warning banner, v6.5 badge.

AC:
- Toolkit count tiles gone from Home
- Phase Timeline present and fully functional
- "View all triggers →" navigates to Commands page

---

**42.3 — Agents page: trim cards and detail panel**
Card elements to remove:
- Skill count badge (`skillCount`)
- Inline skill list preview (chips showing skill names)

Detail panel elements to remove:
- "Assigned skills" section

Keep on card: agent icon, name, title, role description (first sentence), module badge.
Keep in detail: everything else (role, communication style, persona, customize tab).

AC:
- Agents card shows: icon + name + title + one-line role + module badge only
- Detail panel has no "Assigned skills" section
- No data fetching changed; unused fields just not rendered

---

**42.4 — Workflows page: trim cards, add Hooks section to detail**
Card elements to remove:
- Step count badge

Keep on card: name, type badge (Step/Agent/Composite/Utility), phase label, one-line description, module badge.

Detail panel: add a compact **Hooks** section below Sub-Agents. Reads from `workflow.hooks` (already populated by `workflow-adapter.ts`). Shows each hook type (`before_story`, `after_story`, etc.) with its configured value. If no hooks, section is hidden.

AC:
- Workflow card has no step count badge
- Workflow detail panel shows Hooks section when hooks present, hidden when none
- Hooks data sourced from existing `workflow.hooks` field (no new API endpoints)

---

**42.5 — Settings: remove All Files nav item, audit IDE Connections page**
- Remove `/files` from Settings group nav (already covered in 42.1 route change; this story does the visual verification pass).
- Audit IDE Connections page (811 lines): identify and remove any UI sections unrelated to the core function of "configure a connection to an IDE". Document what was removed and why in the PR description.

Target for Connections page: under 500 lines, all remaining sections directly support connection setup or status.

AC:
- `/files` not in Settings nav
- Connections page trimmed; PR description lists what was removed
- Connections core function (add IDE, view status, copy config) fully intact

---

## E43 — Workflow Visibility

**Goal:** Engineer opens Workflows page and knows immediately which workflows are ready, which are blocked and why, and what to do about it. Live updates as files change.

**Estimate:** 10–12 days

### Stories

**43.1 — Parse `io` block from workflow.md frontmatter (server)**
Extend `workflow-parser.ts` to read the proposed `io` frontmatter block:

```yaml
io:
  inputs:
    - id: prd
      description: "Product requirements document"
      path_patterns: ["{planning_artifacts}/*prd*.md"]
      required: true
      file_type: prd
  outputs:
    - id: architecture
      description: "Architecture document"
      path_pattern: "{planning_artifacts}/architecture.md"
      file_type: architecture
```

Fallback: if `io` absent, parse the markdown INITIALISATION table (best-effort). If neither, `io` is null.

Add `io` to the `Workflow` type in `@bmad-studio/shared`:
```typescript
io?: {
  inputs: WorkflowInput[]
  outputs: WorkflowOutput[]
}
```

AC:
- `io` block parsed correctly for workflows that have it
- Fallback parser extracts inputs from markdown table for workflows without it
- `io: null` for workflows with neither
- Existing workflow index and endpoints unchanged

---

**43.2 — Workflow status endpoint (server)**
New endpoint: `GET /api/workflows/:id/status`

Response:
```typescript
{
  status: 'ready' | 'blocked' | 'already-run' | 'unknown'
  inputs: Array<{
    id: string
    description: string
    required: boolean
    status: 'present' | 'missing' | 'stale' | 'thin'
    filePath?: string
    qualityNotes?: string[]
  }>
  outputs: Array<{
    id: string
    description: string
    files: Array<{ path: string; modifiedAt: string }>
  }>
  blockedReasons?: string[]
}
```

Status derivation:
- `ready`: all required inputs present and pass basic quality checks
- `blocked`: one or more required inputs missing or failing quality check
- `already-run`: at least one output file exists matching the declared pattern
- `unknown`: no `io` block and fallback parse failed

Quality checks (from brief F4): file exists, non-empty (>50 bytes), contains expected headings for known file types.

AC:
- Endpoint returns correct status for a workflow with all inputs present
- Endpoint returns `blocked` with per-input reasons when inputs missing
- Endpoint returns `already-run` when output files exist
- File system reads only; no writes

---

**43.3 — Workflow list view: phase grouping, status indicators, filter chips**
Update `WorkflowsPage.tsx`:
- Fetch status for all workflows (batch request or parallel per-workflow)
- Group cards by BMAD phase (1-Analysis, 2-Planning, 3-Solutioning, 4-Implementation, Anytime/Utility)
- Add status dot + label to each card: green/Ready, amber/Blocked, grey/Already Run, grey-?/Unknown
- Add filter chips: All, Ready, Blocked, Already Run, Unknown
- "Blocked" card: click to expand — shows each missing/incomplete input with a next-action link

AC:
- Workflows grouped by phase with collapsible phase headers
- Status dot + label on every card
- Filter chips functional
- Blocked expansion shows per-input reason and action link
- Live update when files change (WebSocket message triggers re-fetch of status)

---

**43.4 — Workflow detail panel: Inputs/Outputs tables, Downstream consumers**
Update `WorkflowDetailPanel.tsx`:
- Replace or augment existing steps list with **Inputs** table: id, description, status chip, expected path, quality notes
- Add **Outputs** table: id, description, files produced (with timestamps)
- Add **Downstream consumers** section: list of workflows that declare this workflow's outputs as their inputs (requires a server index — add to `GET /api/workflows/:id/status` response or a separate endpoint)
- Hooks section (from E42.4) already done

AC:
- Inputs table present with correct status chips
- Outputs table shows files produced (or "None yet")
- Downstream consumers list correct (empty state: "No workflows depend on this output")

---

**43.5 — Home dashboard: workflow readiness panel**
Update `OverviewPage.tsx`:
- Add a "Workflow Readiness" panel to Project Status section
- Shows: count of Ready / Blocked / Already Run workflows as clickable chips → each opens Workflows page filtered to that status
- Shows: "Next recommended workflow" — highest-priority ready workflow in the earliest unstarted phase, with name and a "View" link to its detail

AC:
- Panel appears on Home when at least one workflow exists
- Counts are correct and link to filtered Workflows page
- Next recommended workflow displays correctly
- Panel absent when no workflows installed (not an error)

---

## E44 — Project Context Editor

**Goal:** Replace the generic Workspace editor with a structured, guided, linting editor for `project-context.md`. Quality score visible at a glance.

**Estimate:** 14–16 days

### Stories

**44.1 — Editor shell: section navigator, raw toggle, route redirect**
- Create new page `ProjectContextEditorPage.tsx` at `/project-context`
- Two-column layout: left section navigator (list of canonical sections with status dots), right editor pane
- Raw markdown toggle (CodeMirror, existing component) in the editor pane header
- Redirect `/workspace` → `/project-context`
- Delete `WorkspacePage.tsx`
- Add `/project-context` to nav as "Project Context" (replaces where Workspace was, if it was in nav)

AC:
- New page renders at `/project-context`
- `/workspace` redirects to `/project-context`
- Section navigator shows canonical sections
- Raw toggle switches to CodeMirror and back without data loss
- WorkspacePage.tsx deleted

---

**44.2 — Section parser (server)**
New endpoint: `GET /api/project-context`

Server reads `{planning_artifacts}/project-context.md`, splits into canonical sections:

```typescript
type ParsedSection = {
  key: string           // canonical key (e.g. 'purpose', 'tech-stack')
  heading: string       // heading text as found in file
  body: string          // raw markdown body
  present: boolean
  subsections?: ParsedSection[]
}
type ProjectContextDocument = {
  sections: ParsedSection[]
  customSections: ParsedSection[]  // sections not in canonical list
  raw: string
}
```

Canonical sections (from brief): Title/metadata, Purpose, Tech Stack, Architecture Overview, Conventions (with subsections), Anti-patterns, Known Issues, External Dependencies, Operational Context, ADR Index.

AC:
- Parses a real `project-context.md` correctly
- Missing canonical sections returned with `present: false`
- Custom sections preserved in `customSections`
- Raw markdown preserved exactly

---

**44.3 — Linter engine (shared package)**
Create `packages/shared/src/linter/`:
- `engine.ts` — `runLinter(doc: ProjectContextDocument, rules: LintRule[]): LintFinding[]`
- `types.ts` — `LintRule`, `LintFinding`, `Severity` ('error' | 'warning' | 'info')
- `rules/pc-rules.ts` — all PC- rules as data objects

`LintRule` shape:
```typescript
type LintRule = {
  id: string                    // 'PC-001'
  severity: Severity
  section?: string              // which section it applies to (null = whole doc)
  check: (doc: ProjectContextDocument) => boolean  // true = finding triggered
  message: string
  fixGuidance?: string
}
```

Export from `@bmad-studio/shared` index.

AC:
- `runLinter` returns correct findings for a document with known issues
- All PC- rules from `[Reference] Studio Content - Linter Rules` implemented
- Engine is pure (no I/O, no side effects)
- Exported from shared package

---

**44.4 — Quality score and live linting UI**
- Quality score: `score = max(0, 100 - (errors × 10) - (warnings × 3) - (info × 1))`
- Display score prominently in editor header: number + label (Weak / Acceptable / Good / Strong)
- Score updates on every keystroke (debounced 300ms)
- Sidebar panel: list of all findings grouped by section, colour-coded by severity
- Inline findings: small card under each section heading in the editor

AC:
- Score visible in editor header
- Score updates live as user edits
- Sidebar lists all findings with section, rule ID, message
- Inline findings appear under correct sections

---

**44.5 — Inline guidance: "What is this for?" and section examples**
- Each canonical section heading has a `?` icon → opens a slide-over with:
  - "What is this for?" — one paragraph explanation
  - "See an example" — a strong example from the content file
- Required subsections (e.g. Conventions > Naming) show a one-line hint under their heading
- Copy sourced from `[Reference] Studio Content - Glossary and Help Text`

AC:
- Every canonical section has a working `?` link
- Slide-over shows explanation + example for each section
- Subsection hints display correctly
- No hard-coded copy (all from content file constants)

---

**44.6 — Empty state, template stub, and save with diff**
- Empty state (no `project-context.md`): three actions — "Start from template" (stubbed: opens a picker with hardcoded placeholder until E45), "Start from blank" (opens editor with empty canonical sections), "Import existing" (file picker to migrate an existing md file)
- Save: `PUT /api/project-context` on server writes the file
- Diff preview before save: show diff modal (reuse existing DiffConfirmDialog component), user confirms or cancels

AC:
- Empty state renders when file absent
- "Start from blank" creates file with empty canonical sections
- Save shows diff and requires confirmation
- File written correctly, no destructive overwrites without confirmation

---

## E45 — Pattern Library Integration

**Goal:** Studio reads external pattern libraries by URL, discovers templates, surfaces them in editors.

**Estimate:** 10–12 days

### Stories

**45.1 — Library config UI in Settings**
New section in Settings page: "Pattern Libraries"
- List of configured libraries with: name, URL, status chip (healthy/cached/broken), last fetch time, template count, Enable toggle, Remove button
- "Add library" button → modal: Name, URL (git or local path), Branch (default: main), Test connection button
- On add: attempt fetch, report success or failure before saving
- Manual "Refresh" action per library

AC:
- Can add a library by URL
- Can remove a library
- Status chip reflects real fetch state
- Test connection reports outcome before save

---

**45.2 — Library fetch layer (server)**
New `libraryPlugin` in `packages/server/src/plugins/library-plugin.ts`:
- `POST /api/library` — add library config
- `DELETE /api/library/:name` — remove
- `POST /api/library/:name/refresh` — trigger fetch
- `GET /api/library` — list configs with status

Fetch implementation:
- On add or refresh: `git clone --depth 1 <url> .bmad-studio/library-cache/<name>` (or `git pull` if cached)
- Uses `spawn` (not `exec`) for security
- 30s timeout on fetch operations
- Status stored in memory (reset on server restart)
- If fetch fails: status = `cached` (if cache exists) or `broken` (if no cache)

AC:
- Library cloned to correct cache path on add
- Refresh updates cache
- Fetch failure sets status to cached/broken appropriately
- No credentials stored in server state

---

**45.3 — Manifest parser (server)**
`GET /api/library/templates?type=project-context` (and other types)

Reads `manifest.yaml` from each enabled, healthy/cached library. Discovers templates per type. Returns merged list with library source as disambiguator.

If manifest malformed: library marked broken with error message.

Template metadata returned:
```typescript
type TemplateListItem = {
  id: string
  library: string
  name: string
  description: string
  intendedUse: string
  tags: string[]
  lastUpdated: string
  variables: TemplateVariable[]
}
```

AC:
- Returns templates correctly for a valid library
- Filters by type query param
- Malformed manifest → library broken status, not a 500

---

**45.4 — Template picker component (client)**
Reusable `<TemplatePicker type="project-context" onSelect={...} />` component.
- Search box + tag filter chips
- Cards: name, library source, intended use
- Right pane: preview of template content on hover/select
- "Import" primary action, "Cancel" secondary

Used in: Project Context Editor (E44 story 44.6 empty state + "Import from library" button), Setup Wizards (E46).

AC:
- Picker renders templates from all enabled libraries for the given type
- Search filters correctly
- Preview shows template markdown
- onSelect called with template ID on Import

---

**45.5 — Variable form and import flow**
On selecting a template:
- Fetch full template content: `GET /api/library/templates/:id`
- If template has variables: render variable form (field per variable, required indicator, default pre-filled)
- Required variables block import; optional don't
- On confirm: render template with variable substitutions, replace/merge editor content
- Diff preview before final save

AC:
- Variable form renders for parameterised templates
- Required variable validation works
- Template renders with substitutions correct
- Import goes through diff preview before writing

---

## E46 — Setup Wizards Phase 1

**Goal:** Guided wizard takes a new or brownfield project from zero to working `project-context.md`.

**Estimate:** 12–14 days

### Stories

**46.1 — Wizard shell and routing**
New route `/setup-wizard` with step navigation component:
- Progress bar / step indicator
- Back / Next / Finish actions
- Step validation (can't advance past required fields)
- Wizard type selection on entry: Greenfield or Brownfield

AC:
- Shell renders and navigation works
- Back/Next work correctly
- Can select wizard type on entry screen

---

**46.2 — Greenfield wizard: steps 1–5**
Step 1: Project name, client name, one-sentence purpose
Step 2: Tech stack table (layer, technology, version — add rows dynamically)
Step 3: Team context (size, working patterns, preferences)
Step 4: Template selection (pattern library picker from E45, type = `project-context`)
Step 5: Conventions scaffold (naming, code style, test approach — guided prompts)

AC:
- All 5 steps render with correct fields per copy file
- Template picker integrated (falls back to blank if E45 not merged)
- Validation prevents advancing with empty required fields

---

**46.3 — Greenfield wizard: steps 6–10 and generation**
Step 6: Anti-patterns (guided list — "things AI agents should never suggest")
Step 7: Known issues / tech debt (optional)
Step 8: ADR stub (optional first ADR to document a key existing decision)
Step 9: Review — shows assembled document preview
Step 10: Generate — writes `project-context.md` to configured path

AC:
- Steps 6–10 render correctly
- Review step shows accurate preview of final document
- Generate writes file and navigates to Project Context Editor page

---

**46.4 — Brownfield wizard: manual mode**
10-step structured flow for existing projects. Same shell as Greenfield, different steps:
- Steps 1–3: existing tech stack (user fills in manually)
- Steps 4–6: conventions and patterns (guided questions, user describes existing patterns)
- Steps 7–8: candidate ADRs (user identifies key existing decisions)
- Step 9: anti-patterns discovered during convention capture
- Step 10: generate

No automatic inference of any kind. User fills everything in.

AC:
- All 10 steps render for brownfield path
- Fields match the copy file (`[Reference] Studio Content - Wizard Copy`)
- Generate produces valid `project-context.md`

---

## E47 — Authoring Linters

**Goal:** Extend linting to agent personas, workflows, and modules. Show findings in existing detail panels.

**Estimate:** 8–10 days

### Stories

**47.1 — Agent persona linter**
Implement AG- rules from `[Reference] Studio Content - Linter Rules` using the engine from E44.

Add lint findings to `AgentDetail.tsx`: new "Quality" tab or inline sidebar panel with findings list. Show aggregate severity badge on the Agents list card (red dot if errors, amber if warnings).

AC:
- All AG- rules implemented
- Findings visible in Agent detail
- Severity badge on Agents list cards

---

**47.2 — Workflow linter**
Implement WF- rules. Show findings in `WorkflowDetailPanel.tsx` (new "Quality" section).

AC:
- All WF- rules implemented
- Findings visible in Workflow detail panel

---

**47.3 — Module linter**
Implement MD- rules. Surface findings in Modules settings page for each installed module.

AC:
- All MD- rules implemented
- Findings visible per module in Settings > Modules

---

**47.4 — Lint score on Overview dashboard**
Add a small "Authoring quality" panel to Home showing: count of errors and warnings across all agents/workflows, with link to the worst offender.

AC:
- Panel appears on Home when any lint findings exist
- Counts correct
- Link navigates to correct entity detail

---

## E48 — Setup Wizards Phase 2 (Deferred)

Brownfield automatic inference. No stories. Revisit after real usage data exists.

---

## Sprint-status entries

These follow the existing format in `_bmad-output/implementation-artifacts/sprint-status.yaml`. Update that file when this epic doc is approved.
