---
stepsCompleted: ['step-01-init', 'step-02-discovery', 'step-02b-vision', 'step-02c-executive-summary', 'step-03-success', 'step-04-journeys', 'step-05-domain', 'step-06-innovation', 'step-07-project-type', 'step-08-scoping', 'step-09-functional', 'step-10-nonfunctional', 'step-11-polish', 'step-12-complete']
status: 'complete'
classification:
  projectType: 'internal-dev-tool / web admin app'
  domain: 'developer-tooling / AI-agent infrastructure'
  complexity: 'medium'
  projectContext: 'brownfield'
inputDocuments:
  - _bmad-output/planning-artifacts/research/technical-bmad-v6.5-migration-research-2026-04-28.md
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/epics.md
  - _bmad-output/planning-artifacts/epic-numbering-map.md
  - _bmad-output/planning-artifacts/architecture.md
  - _bmad-output/planning-artifacts/tech-spec-bmad-studio-module-manager-v1.md
  - _bmad-output/planning-artifacts/tech-spec-epic-17-reliability-ux.md
  - docs/_bmad_v6.5/
  - docs/reference/llm-wiki.md
  - CLAUDE.md
workflowType: 'prd'
mode: 'fast-path'
---

# Product Requirements Document — bmad-studio v6.5 Migration

**Author:** Jonathan
**Date:** 2026-04-28
**Status:** Complete (PRD workflow finished 2026-04-28; ready for architecture + readiness check)
**Scope:** Sub-PRD scoped to Epics E31–E36. The main bmad-studio PRD remains at `prd.md`; this document is referenced from the main PRD and `epics.md`.
**Primary input:** [Technical Research Report 2026-04-28](research/technical-bmad-v6.5-migration-research-2026-04-28.md)

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Project Classification](#project-classification)
3. [Success Criteria](#success-criteria)
4. [Product Scope](#product-scope)
5. [User Journeys](#user-journeys)
6. [Domain-Specific Requirements](#domain-specific-requirements)
7. [Innovation & Novel Patterns](#innovation--novel-patterns)
8. [Project-Type Specific Requirements (Internal Developer Tool)](#project-type-specific-requirements-internal-developer-tool)
9. [Project Scoping & Phased Development](#project-scoping--phased-development)
10. [Functional Requirements](#functional-requirements) — the binding capability contract
11. [Non-Functional Requirements](#non-functional-requirements)
12. [Related Documents & Cross-References](#related-documents--cross-references)
13. [Change Log](#change-log)

## Executive Summary

BMAD v6.5 (released 2026-04-28) restructures BMAD's on-disk format around three shifts: (1) agents and workflows unify under a single skill shape with metadata in TOML `customize.toml`, (2) discovery is manifest-driven via `_config/skill-manifest.csv` + `files-manifest.csv` + `manifest.yaml`, (3) customization is a four-layer cascade resolved by official Python scripts. Three merged upstream PRs land this — #2284, #2287, #2308 — and one open issue (#2311) extends it. bmad-studio's current parsers cannot read this format; the modules endpoint already returns `[]` against v6.5 installs.

This sub-PRD scopes Epics E31–E36 (~6–8 engineer-weeks total): a strangler-fig adapter routing on `_config/manifest.yaml` presence, a TS-native four-rule resolver verified against BMAD's Python reference at ≥1000 property-based iterations, a customize editor (read then write) with live merge preview, an MVP hooks palette, and SHA-256 drift detection. Shared `Skill`/`Agent` types stay unchanged; both adapters project into them. Python 3.11+ stays optional — runtime-detected with TS-only fallback.

The hooks palette is the integration channel for DEPT-specific tooling. Worked examples for **LLM Wiki ingest** (the next deliverable after this PRD — a green-field LLM-maintained markdown wiki for cross-project knowledge) and **Jira issue sync** (one project per client product, repo-local `$JIRA_PROJECT_KEY`) ship as DEPT-owned config in a separate `bmad-method-dept-integrations` repo. bmad-studio stays vendor-neutral.

### What Makes This Special

**v6.5 is a format change, not a feature pivot.** bmad-studio's product premise is unchanged: file-system-as-source-of-truth, configures-not-executes, no database, local-first. The migration adds parser/loader changes plus new UI surfaces *enabled by* the new format — not a redesign.

Four user-visible wins:

1. **The empty-modules-list bug disappears** — the very thing v6.5's manifest fixes (E31, P0). The bug was surfaced during Cycle 2 Epic 16 (Home Page & Output Hub) work but couldn't be closed there because the v6.5 manifest didn't yet exist. Closing it now unblocks every subsequent v6.5-aware studio feature.
2. **Customize editor with live merge preview** — base / team / user layers visible side-by-side with the merged result; atomic write with diff confirm; verified by BMAD's own `resolve_customization.py`.
3. **Hooks palette** — declarative TOML hook authoring (raw shell + small template set). bmad-studio authors and visualises hooks; never executes them. Threat model stays strictly local.
4. **Drift detection** — SHA-256 scan against `_config/files-manifest.csv` flags locally-mutated base files. New territory for the studio; precedent for any "managed by installer" UX.

**Core insight:** the dominant 2026 monorepo / framework pattern (manifest-driven indexing, layered config with explicit precedence) has converged. v6.5 applies it to BMAD's skill ecosystem; bmad-studio adopts it as the read protocol. Stop scanning, start indexing.

## Project Classification

| Attribute | Value |
|---|---|
| Project Type | Internal developer tool — browser-based admin/config UI |
| Stack | Fastify 5 + TypeScript (server), React 18 + Vite + Tailwind + shadcn/ui (client), no database |
| Domain | Developer tooling / AI-agent infrastructure |
| Complexity | Medium — manifest-driven indexing, four-rule TOML resolver byte-equivalent to a Python reference, cross-language IPC, in-app TOML editor with live merge preview |
| Project Context | Brownfield — bmad-studio has 30 shipped epics across 4 cycles; v6.5 migration is Cycle 5, Epics E31–E36 |
| Compliance | None (local-first, no PII, no regulated data) |

## Success Criteria

### User Success

| Outcome | Metric | Target |
|---|---|---|
| Studio renders v6.5 installs correctly | Modules endpoint returns ≥1 entry on every project that has `_bmad/_config/manifest.yaml` | 100% (was: 0% — empty list bug) |
| Agents render with full v6.5 metadata | Icon, identity, principles, communication style, and menu items match the merged `customize.toml` `[agent]` block | 100% snapshot match against the v6.5 reference install |
| Customize editor lets users edit overrides without leaving studio | Round-trip time for "open skill → change override → save → see merged result reflect" | <2 seconds end-to-end |
| Hooks palette lets users wire `on_complete` from a template in <60 seconds | Time-on-task in usability test | p95 <60s for "add Slack post on PRD completion" |
| v6 installs continue to work during the migration window | Existing v6 test suite | 100% green throughout E31–E35 |

### Business Success

This is internal tooling — no revenue/user-growth metrics. "Business" success here = adoption inside DEPT and unblocking dependent work.

| Outcome | Metric | Target |
|---|---|---|
| E31 ships and closes the empty-modules-list P0 | `modules-plugin.test.ts` returns ≥1 module against the v6.5 fixture; bug-tracking note `project_skills_parser_fix.md` updated | within 1 week of v6.5 PRD approval |
| DEPT-internal adoption | Number of DEPT BMAD projects with a working customize editor session in studio | ≥3 within 2 weeks of E34 ship |
| `bmad-method-dept-integrations` repo lands LLM Wiki + Jira hooks | First DEPT project produces a wiki entry via the hook palette | within 4 weeks of E35 ship |

### Technical Success

| Outcome | Metric | Target |
|---|---|---|
| TS resolver matches BMAD's Python resolver exactly | `@fast-check/vitest` property-based equivalence test | ≥1000 generated fixtures, 0 divergences |
| No regressions on v6 | Existing test suite green throughout the migration | 100% on every PR |
| Cold-start read of a 40-skill v6.5 install | Time from manifest read to full skill list available | <50 ms |
| Live merge preview latency in customize editor | p95 from edit keystroke to rendered merged output | <200 ms |
| Drift detector false-positive rate against pristine install | Files flagged as drifted when none have changed | 0 |
| Studio works without Python 3.11+ installed | All read paths function; verify button degrades gracefully | 100% of read paths green in no-python CI lane |

### Measurable Outcomes

- **Modules endpoint bug closed:** integration test in `modules-plugin.test.ts` against `docs/_bmad_v6.5/` returns the bmm + core modules.
- **Agent metadata fidelity:** snapshot test against `bmad-agent-pm` (icon `📋`, title `Product Manager`, identity Marty-Cagan-leaning, three principles, six menu items CP/VP/EP/CE/IR/CC).
- **Resolver equivalence:** CI gate runs `tsx tests/resolver-vs-python.ts` with `@fast-check/vitest` × 1000 iterations; PR blocked on divergence.
- **Drift detector accuracy:** integration test stages a known mod and asserts exactly one file flagged.

## Product Scope

### MVP — Minimum Viable Product (E31–E34)

| Epic | Outcome |
|---|---|
| **E31** — v6.5 detection + manifest reader | Modules endpoint enumerates v6.5 installs; v6 still works |
| **E32** — Skill/agent adapter | Agents and skills render from `customize.toml`; resolver passes ≥1000 property-based equivalence iterations vs Python |
| **E33** — Customize editor (read-only) | Three-layer view per skill (base / team / user) + merged preview reflecting `resolve_customization.py` semantics |
| **E34** — Customize editor (write) | Atomic write of team or user override with diff confirm; post-write verify; WS broadcast |

### Growth Features (E35–E36)

| Epic | Outcome |
|---|---|
| **E35** — Hooks palette MVP | Author `on_complete` from a small template set (raw shell, Slack, git tag, run-tests, LLM-agent-ingest); written to `_bmad/custom/<workflow>.toml` |
| **E36** — Drift detector | SHA-256 scan vs `files-manifest.csv` on startup + on manifest change; UI flag on locally-modified base files |

### Vision (Post-MVP)

- **Bidirectional LLM Wiki access** — `activation_steps_prepend` queries the wiki via `qmd` + MCP for prior DEPT art before planning workflows. Cross-project memory channel.
- **Module-shipped overrides** — once BMAD issue #2311 lands, support `_bmad/custom/modules/<module>/<skill>.toml` as a fourth resolver layer.
- **Hook template marketplace** — community-shipped hook templates importable into the palette.
- **Full TOML IntelliSense** — schema-aware autocomplete in the customize editor (vs the basic syntax highlighting MVP ships).

## User Journeys

### Journey 1 — PM opens a v6.5 project for the first time (E31 happy path)

**Persona:** Sarah, Delivery Manager. Just inherited a fresh BMAD project from a teammate. Needs to understand what's installed and explain the setup to the client this afternoon.

- **Opening scene.** Sarah `cd`s into the project, runs `bmad-studio`, opens the browser. Today: the modules list is empty — bug. New: she sees `bmm` and `core` modules immediately, with the right skill counts and version numbers.
- **Rising action.** She drills into `bmm`, sees the four phase folders (1-analysis → 2-plan-workflows → 3-solutioning → 4-implementation) and the agents/workflows under each. Studio uses the `_config/skill-manifest.csv` index — no waiting on a filesystem scan.
- **Climax.** She clicks `bmad-agent-pm`, sees John the PM with his icon (📋), title, principles, and menu items rendered exactly as they appear in BMAD itself. She doesn't have to ask the engineer "what does this agent do?" — the metadata is right there.
- **Resolution.** Sarah builds the client-deck-ready summary in 10 minutes instead of 45.

**Capabilities revealed:** v6.5 detection, manifest reader, agent metadata projection from `customize.toml` `[agent]` block, phase-folder navigation in the UI.

---

### Journey 2 — Engineer customizes an agent for their team (E33 + E34)

**Persona:** Aisha, Senior Engineer at DEPT. Wants John (the PM agent) to always remind devs that "all PRDs link to LLM Wiki" — a DEPT-wide rule. Currently has to write the override TOML by hand and pray she got the merge semantics right.

- **Opening scene.** She opens `bmad-agent-pm` in studio. New: a Customize tab is visible alongside the existing detail view.
- **Rising action.** Three side-by-side panes: **Base** (`customize.toml` from the install — read-only), **Team** (`_bmad/custom/bmad-agent-pm.toml` — empty), **User** (`bmad-agent-pm.user.toml` — empty). A fourth pane shows the **Merged** result, currently identical to base.
- **Climax.** Aisha types a new entry into the Team pane's `persistent_facts` array: `"All PRDs link to LLM Wiki on completion."`. The Merged pane updates within 200 ms — she sees her addition appended to the base array. She clicks **Save** → studio shows a diff confirm dialog → she confirms → file is written atomically → `resolve_customization.py` runs as verifier → studio reports "✓ verified" with the merged JSON visible.
- **Resolution.** She commits `_bmad/custom/bmad-agent-pm.toml` and pushes. Every dev on the team now gets that rule when they activate John, without changing how BMAD itself works.

**Capabilities revealed:** customize editor read pane (E33), live merge preview, customize editor write pane (E34) with atomic write + diff confirm, post-write verify via Python bridge, file-watcher-driven WS broadcast.

---

### Journey 3 — DEPT Integrator wires LLM Wiki ingest on PRD completion (E35)

**Persona:** Maya, DEPT Solutions Architect. Setting up a new client engagement. DEPT has just standardised on the LLM Wiki pattern (per the `bmad-method-dept-integrations` repo published last week). She wants every PRD this project produces to flow into the wiki.

- **Opening scene.** Maya opens `bmad-create-prd` in studio's skills view, switches to the new **Hooks** tab.
- **Rising action.** Hooks tab shows three rows: `activation_steps_prepend` (empty), `activation_steps_append` (empty), `on_complete` (empty). Next to each, a `+` button opens a template palette.
- **Climax.** She clicks `+` on `on_complete`. The palette lists six options: Raw shell, Slack post, Git tag, Run tests, **LLM agent ingest**, and "Browse `bmad-method-dept-integrations` templates". She picks **LLM agent ingest**. A small form prompts for `<kind>` (preset to `prd`). She accepts. Studio writes `on_complete = "bash {project-root}/_bmad/custom/scripts/llm-wiki-ingest.sh prd"` to `_bmad/custom/bmad-create-prd.toml` and copies the script template into `_bmad/custom/scripts/` if missing.
- **Resolution.** Maya commits the change. Next time anyone runs `bmad-create-prd` on this project, the resulting PRD is staged into `$LLM_WIKI_ROOT/raw/bmad/<project>/` and the wiki agent ingests it per its `CLAUDE.md` schema. Maya never wrote a TOML file or a shell script by hand.

**Capabilities revealed:** hook surface enumeration per workflow, template palette (E35 MVP set), template parameter form, atomic write with script template copy, link to external integrations repo.

---

### Journey 4 — Engineer discovers drift after editing a base file directly (E36)

**Persona:** Ravi, Engineer who hot-fixed a typo in `bmad-create-story`'s `SKILL.md` last week — directly in the installed file, not via a customize override. He's forgotten he did this; today studio surfaces it.

- **Opening scene.** Ravi opens studio. A small badge appears in the header: "1 file diverged from installer manifest."
- **Rising action.** He clicks the badge. Drift view lists exactly one file: `_bmad/bmm/4-implementation/bmad-create-story/SKILL.md`, with its expected hash (from `_config/files-manifest.csv`) and actual hash side-by-side.
- **Climax.** Studio offers two paths: **Move to override** (extract the diff and propose a `_bmad/custom/bmad-create-story.toml` override that reproduces the change cleanly) or **Reset to installer baseline** (revert the file, with a confirm dialog because this is destructive). He picks Move to override; studio guides him through the customize editor flow with the diff pre-populated.
- **Resolution.** Ravi's hot-fix becomes a proper team override, surviving future BMAD updates. The drift badge clears.

**Capabilities revealed:** SHA-256 drift detector (E36), drift UI affordance, "managed by installer" hint in the file tree, optional flow to convert drift into a sanctioned override.

---

### Journey 5 — Engineer without Python 3.11+ (graceful degradation edge case)

**Persona:** Kim, Engineer on a fresh laptop with no Python environment configured. Doesn't want to install Python just to use studio.

- **Opening scene.** Kim opens studio. Everything reads correctly — modules, skills, agents, customize tab. No banner about missing dependencies.
- **Rising action.** She opens the customize editor for `bmad-agent-architect` and adds an override. The merged preview updates in real time (TS resolver, no Python needed).
- **Climax.** She clicks **Save**. Studio writes the override atomically. The post-write verify panel shows: "TS-merged preview (Python verifier unavailable — install Python 3.11+ for cryptographic byte-equivalence check)" with a help link. The merged output displays correctly; the verify badge is amber, not green.
- **Resolution.** Kim's override works in production. She's mildly informed about the missing audit oracle but not blocked. She can install Python later if she wants the green verify badge.

**Capabilities revealed:** Python runtime detection at startup, TS-only fallback for read + write paths, verifier UX that degrades gracefully (amber vs green) without blocking.

### Journey Requirements Summary

| Journey | Drives epic | Key capabilities |
|---|---|---|
| 1. PM opens v6.5 project | E31 | Manifest reader, modules endpoint fix, phase-folder UI |
| 2. Engineer customizes agent | E32, E33, E34 | TS resolver, three-layer view, live merge preview, atomic write, verify |
| 3. DEPT Integrator wires LLM Wiki | E35 | Hooks tab, template palette, parameter form, script-template copy |
| 4. Engineer discovers drift | E36 | SHA-256 drift detector, drift UI, drift→override conversion flow |
| 5. No-Python user | (cross-cuts E32–E34) | Runtime detection, TS-only fallback, graceful verify-UX degradation |

## Domain-Specific Requirements

bmad-studio operates in a single domain: **BMAD's on-disk format**. There is no regulatory compliance, no PII, no payment data, no audit-of-record obligation. The "domain rules" are BMAD's spec-compliance requirements and the conventions of the surrounding tooling ecosystem.

### BMAD Protocol Conformance

- **TOML 1.1 spec compliance** for every TOML read/written. Use `smol-toml` (TOML 1.1.0 spec-current) — not `@iarna/toml` (frozen on TOML 1.0 pre-2022 dotted-key fixes).
- **Four-rule structural merge** must match `resolve_config.py` and `resolve_customization.py` byte-for-byte:
  1. Scalars → override wins
  2. Tables → deep merge
  3. Arrays of tables where every item has `code` or `id` → merge by key (replace matching, append new)
  4. All other arrays → append
- **Frontmatter conventions** in `SKILL.md` files (only `name` + `description` are normative; everything else lives in `customize.toml`).
- **Path placeholders:** `{project-root}`, `{skill-root}`, `{skill-name}` — must be resolved consistently with how BMAD's own `SKILL.md` files use them.

### Cross-Process / Cross-Language Constraints

- **Python 3.11+ is optional.** All read paths must work without it. Detection at startup; UI degrades gracefully (amber verify badge, not error). The "no Python" CI lane is a release gate.
- **stdout pipe discipline** when shelling to Python: always read both stdout and stderr (or use `stdio: 'ignore'`) — pipe-buffer fills cause deadlocks on large outputs (resolved manifests can hit 100 KB+).
- **5-second hard timeout** on every Python invocation (`AbortController`). Resolver should complete in <50 ms; longer means something's wrong.
- **Argument passing:** use `spawn` arg array, never `exec` with shell-quoted strings. Path arguments validated to stay within the project root.

### Filesystem Constraints

- **Writes are atomic** — write to `<file>.tmp`, then `rename()`. No partial-write state visible to chokidar or to a concurrent reader.
- **Watcher debounce:** `awaitWriteFinish` + 150 ms — atomic-save editors trigger `add` + `change` back-to-back without it.
- **Drift scanner ignores everything not in `files-manifest.csv`.** No false positives on `.DS_Store`, editor backups, or new user-authored files.

### UX Conventions (Mirror BMAD's own surface)

- **Visual continuity for agents** — the agent's `icon` field must prefix the agent's name everywhere it appears in studio (per BMAD PR #2284's "agent.icon wired into greeting and per-message prefix" decision).
- **Layer naming** — `Base` / `Team` / `User` (matching BMAD's documentation: defaults / committed override / personal override). Don't invent new terms.
- **Diff-confirm on every write** — never silently overwrite. Mirrors `bmad-customize`'s Step 6 "Show, confirm, write, verify" sequence.

### Risk Mitigations (domain-specific)

| Risk | Mitigation |
|---|---|
| TS resolver diverges from Python on TOML 1.1 edge cases | `@fast-check/vitest` property-based equivalence at ≥1000 iterations; CI gate. |
| BMAD ships a v6.6 with new `customize.toml` fields | Resolver is field-name-agnostic (four structural rules); new fields flow through unchanged. |
| Issue #2311 lands with different shape than predicted | ADR-4: resolver takes a layer list (parameterised). Adapt at the call site, no resolver refactor. |
| `customize.toml` contains shell-quoted hook commands | Surface verbatim with a "runs in your shell on workflow completion" warning. Never `eval`/`Function()`. |
| BMAD upstream stops shipping `files-manifest.csv` | Drift detection becomes opt-in best-effort; not a release blocker. |

## Innovation & Novel Patterns

The underlying *architectural* pattern (manifest-driven indexing, layered config) is now industry-standard. The **product surfaces** that v6.5 enables in bmad-studio, however, are genuinely novel — there's no equivalent UI in any other AI-agent tooling we're aware of.

### Detected Innovation Areas

#### 1. In-app live merge preview for structural TOML overrides

Closest analogue: ESLint flat-config viewers, Prettier config explorers. None model structural merges across keyed arrays of tables. bmad-studio's customize editor renders all three layers (Base / Team / User) side-by-side with the merged result updating within 200 ms of a keystroke — driven by a TS resolver byte-equivalent to BMAD's Python script. **No prior art in the AI-agent tooling space.** This is the difference between "BMAD power-users hand-edit TOML" and "any team member can compose overrides safely."

#### 2. Hooks palette as a declarative UX surface

The `on_complete` / `activation_steps_*` extension points are TOML strings. Closest analogue: GitHub Actions `run:` steps + Marketplace. bmad-studio's palette is smaller and closer to the user — six MVP templates (raw shell, Slack, git tag, run-tests, **LLM agent ingest**, "browse external integrations repo"), each rendering a parameterised TOML value. **Novel decision: bmad-studio authors hooks but never executes them** — keeps the threat model strictly local while opening the integration surface.

#### 3. Drift detection with "convert drift to override" flow

`git status`-style integrity check against `files-manifest.csv` SHA-256 hashes. The novel piece is the **conversion flow**: when studio detects a locally-modified base file, it offers to extract the diff and propose a sanctioned `customize.toml` override that reproduces the change cleanly. This turns an anti-pattern (editing managed files) into a path back to the sanctioned customization layer. **No prior art** for "managed-by-installer + sanctioned-override conversion" in this ecosystem.

#### 4. Vendor-neutral palette + externalised org-specific templates

bmad-studio ships only generic hook templates (raw, Slack, git tag, tests). DEPT-specific templates (LLM Wiki, Jira) live in a separate `bmad-method-dept-integrations` repo. This is a deliberate **architectural separation** that lets bmad-studio stay generic while any organisation extends it through BMAD's own customization mechanism — anticipating BMAD issue #2311's module-shipped overrides as the long-term distribution channel. **Pattern is novel for AI-agent tooling**; mirrors how Backstage handles plugin distribution but at a much lighter weight.

#### 5. Spawn-LLM-agent-as-hook integration paradigm

The LLM Wiki integration spawns Claude Code / Codex / OpenCode (auto-detected) inside the wiki repo, where the wiki's own `CLAUDE.md` schema drives ingestion. This is a **novel integration shape**: instead of a thin wrapper script calling a vendor API, the hook hands off control to another LLM agent with its own instructions. The wiki ingests the BMAD output autonomously; idempotence comes from `log.md`, not idempotency keys. The LLM Wiki reference doc describes this pattern; bmad-studio surfacing it as a one-click hook template is the productisation step.

### Market Context & Competitive Landscape

| Existing tool | Has manifest-aware admin UI? | Live merge preview? | Hooks palette? | Drift detection? | LLM-agent integration shape? |
|---|---|---|---|---|---|
| BMAD CLI itself | Partial (manifests exist) | No | No (TOML hand-edit) | No | No |
| Backstage / similar dev portals | Yes (different domain) | No | Limited | No | No |
| ESLint flat-config explorers | n/a | Partial (no keyed-array merge) | n/a | n/a | n/a |
| GitHub Actions UI | n/a | Partial (env evaluation) | Yes (Marketplace) | n/a | No |
| Standard wiki tools (Confluence/GitBook) | n/a | n/a | n/a | n/a | No |

**Conclusion:** the *combination* of manifest-aware reading, live four-rule merge preview, hooks palette, drift detection, and LLM-agent-spawning hook templates is, to our knowledge, unique to bmad-studio post-migration.

### Validation Approach

Innovations need empirical validation, not just claims:

| Innovation | How we know it works |
|---|---|
| Live merge preview | Property-based equivalence test vs `resolve_customization.py` × 1000 iterations; latency target <200 ms p95 |
| Hooks palette | Usability test: time-on-task for "wire Slack post on PRD completion" — target <60s p95 |
| Drift detector + convert flow | Integration test: stage known mod → assert exactly one file flagged → assert convert flow produces correct override TOML |
| Vendor-neutral palette + external templates | Demo: install `bmad-method-dept-integrations` repo as a custom source, confirm DEPT templates appear in palette without core changes |
| LLM-agent hook integration | End-to-end: trigger `bmad-create-prd` `on_complete` → assert PRD lands at `$LLM_WIKI_ROOT/raw/bmad/<project>/` AND `log.md` gains an entry |

### Risk Mitigation

| Innovation risk | Mitigation |
|---|---|
| Live merge preview drifts from BMAD's own resolver semantics | CI gate on Python equivalence; if upstream changes the rules, the test suite catches it before users do |
| Hooks palette templates rot as integration targets evolve (Slack API changes, LLM CLIs change flags) | Templates ship as plain shell scripts the user can edit; not opaque studio internals |
| Drift detector becomes noisy (every editor swap file flagged) | Strict allow-list — only files in `files-manifest.csv` are tracked; everything else ignored |
| External integrations repo (`bmad-method-dept-integrations`) becomes orphaned | DEPT-owned, DEPT-maintained; not bmad-studio's responsibility. Studio degrades gracefully if repo absent (palette shows only generic templates) |
| LLM-agent spawn pattern doesn't work without a configured agent on PATH | Script handles missing agent gracefully (stages file, logs warning, exits 0). User's BMAD output is never lost; only the wiki update is deferred |

## Project-Type Specific Requirements (Internal Developer Tool)

### Project-Type Overview

bmad-studio is a **local-first, browser-based admin/config UI** for BMAD project configurations. The Fastify+TS server runs on the developer's machine; the React+Vite client is served from it. There is no SaaS deployment, no shared database, no multi-tenant model, no auth/authz layer — every user runs their own studio against their own filesystem. The product premise (per the existing main PRD) is "configure and visualise; the IDE is the execution environment." The v6.5 migration preserves this premise entirely.

For an internal dev tool migrating to a new format, the project-type-specific concerns are: **backend parser/loader architecture**, **frontend editor surfaces**, **file-system as the data store**, and **cross-process integration (Node ↔ Python)**.

### Technical Architecture Considerations

#### Backend (Fastify 5 + TypeScript, ESM, Node 20+)

- **Strangler-fig adapter at the entry point** (`ModuleLoader.load()`): version-detect via `_bmad/_config/manifest.yaml` presence; route to `v6/` or `v65/` adapter; both project into the existing shared `Skill`/`Agent` types. (ADR-3 in the research doc.)
- **Manifest-as-index** (ADR-1): trust `_config/skill-manifest.csv` as the authoritative skill list; lazy-load `SKILL.md` + `customize.toml` on demand. Stops scanning, starts indexing.
- **Single TS resolver** (ADR-2): `resolveLayered<T>(layers: TomlObject[]): T` used by both the four-layer central config path and the three-layer per-skill path. Same code, two call sites. Property-tested vs `resolve_config.py` at ≥1000 fast-check iterations.
- **In-memory + on-disk parsed-manifest cache** (ADR-5): keyed on the SHA-256 of `_config/files-manifest.csv`. Invalidate on hash change. Reuse the existing pattern in `core/file-store.ts` and `_bmad-output/.cache/registry-*.json` (per `module-registry.ts`).
- **chokidar v5** (already a transitive dep): watch `_bmad/_config/manifest.yaml`, `_bmad/_config/skill-manifest.csv`, and `_bmad/custom/**/*.toml`. `awaitWriteFinish` + 150 ms debounce for editor atomic-saves.
- **Python child_process for write-time verify only** (ADR-6): single-shot `spawn` with 5-second `AbortController` timeout. Detect Python 3.11+ at startup; flag-gate the Python verifier; never block read paths on Python.

#### Frontend (React 18 + Vite + Tailwind + shadcn/ui)

- **Customize editor** (E33, E34): three-pane view (Base / Team / User) + merged preview pane. Powered by `@uiw/react-codemirror` (CodeMirror 6) with a custom TOML mode — lighter than Monaco, matches the existing FE stack philosophy. No Monaco worker setup overhead.
- **Hooks tab on every workflow detail page** (E35): three rows (`activation_steps_prepend`, `activation_steps_append`, `on_complete`) with `+` buttons opening a small template palette. Each template renders a parameterised TOML value via a tiny form.
- **Drift badge in the global header** (E36): clickable; opens a drift list with per-file expected-vs-actual hashes and two action buttons (Move to override / Reset to baseline).
- **WebSocket-driven live refresh**: backend chokidar events → backend cache invalidation → WS broadcast → React component re-render. No client-side polling.

#### File-System Conventions

- **Atomic writes** to `_bmad/custom/`: write to `<file>.tmp`, then `rename()`. No partial-write state visible to chokidar or to a concurrent reader.
- **Read paths never write**: only the customize editor and hooks palette write, and only to `_bmad/custom/`. `_bmad/<module>/` is never modified by studio.
- **Drift scanner respects `files-manifest.csv` allow-list**: nothing outside the manifest is tracked; no `.DS_Store`, no editor backups, no user-authored files.
- **Cache directory** at `_bmad-output/.cache/v65-index.json` (extends the existing `registry-*.json` cache pattern).

#### Cross-Process Integration

- **Auto-detect external tools**: `python3` (resolver verifier), `claude` / `codex` / `opencode` (LLM agent for Wiki ingest hook templates). All optional; all gracefully degrade. Studio never hard-fails on a missing optional tool.
- **No outbound HTTP from the studio process**. Hooks fire in the user's IDE, not in studio. Studio's threat model stays local.

### Implementation Considerations

#### Dependencies (new)

| Package | Surface | Where |
|---|---|---|
| `smol-toml` | TOML 1.1 reader/writer | server |
| `papaparse` | RFC 4180 CSV parser | server (verify if `csv-parser.ts` already uses it; swap if not) |
| `@types/papaparse` | TS types | server (dev) |
| `@uiw/react-codemirror` | CodeMirror 6 React wrapper | client |
| `@codemirror/language` | TOML language adapter | client |
| `@fast-check/vitest` | property-based testing | server (dev) |

`chokidar` is likely already present transitively; verify v5+ on the server and add to direct deps.

#### Runtime Detection

```ts
// On server boot:
const pythonVersion = await probe('python3', ['--version']) // best-effort, 1s timeout
const pythonResolverAvailable = pythonVersion?.major === 3 && pythonVersion?.minor >= 11
// Surface as a feature flag via /api/health
```

The customize editor's verify badge reads this flag: green when Python is available and the verify call succeeded; amber otherwise.

#### Test Strategy

- **Unit tests** for each new module (`v65/manifest-loader`, `v65/customize-resolver`, `v65/agent-adapter`, `v65/python-bridge`, `v65/drift-detector`).
- **Property-based equivalence tests** (`@fast-check/vitest`) between TS resolver and `resolve_config.py` — generate random nested TOML structures, run merge through both, assert byte-equivalent JSON. ≥1000 iterations green is a CI gate.
- **Snapshot tests** against `docs/_bmad_v6.5/` as the green-field reference fixture.
- **No-Python CI lane**: a separate CI job that runs every test with `python3` removed from the image. All read-path tests must stay green.
- **Integration tests** end-to-end: load all 40 skills from the v6.5 fixture, render the agent menu, modify a customize.toml via the editor, verify the merge updates and the WS event fires.

#### Build & Deployment

- ESM-only on the server (Node 20, `"type": "module"` already in place).
- No deployment changes — studio remains a `npm install` + `npm run dev` local tool.
- README updates: add "Python 3.11+ optional but recommended for cryptographic verify" and link to issue #2311 watch (so users know module-overrides are coming).

### Skip Sections (Not Applicable)

- ❌ **Multi-tenancy / RBAC** — single-user, local-first, no auth layer.
- ❌ **API endpoints / OpenAPI spec** — internal tool; studio's API is private to its own React client.
- ❌ **Mobile / device permissions** — desktop browser only.
- ❌ **Cloud infrastructure** — runs locally; no deployment concerns.
- ❌ **Compliance / audit** — no regulated data, no PII.
- ❌ **Internationalisation** — English-only; matches BMAD upstream.

## Project Scoping & Phased Development

### MVP Strategy & Philosophy

**MVP Approach: read-path-first, write-surfaces-second, nice-to-haves last.**

The MVP test for v6.5 isn't "all features work" — it's "**a fresh DEPT engineer can `cd` into a v6.5 project, open studio, and navigate it**." Everything else is graded on whether it passes that test.

This translates to three concrete priorities:

1. **Correctness before features.** E31 (manifest-aware modules endpoint) ships standalone in the first week. It's a P0 bug fix masquerading as a migration epic — the modules endpoint already returns `[]` against v6.5 installs, blocking *any* v6.5-aware feature from working. Shipping E31 alone is a measurable win even if the rest of the migration is delayed.
2. **Resolver equivalence is load-bearing.** E32 isn't done until the property-based test suite hits ≥1000 fast-check iterations green vs `resolve_config.py`. Without that gate, the TS resolver is just a guess; with it, every downstream feature (customize editor, hooks palette, drift detector) inherits that correctness for free.
3. **Editor read before editor write.** E33 (customize editor read-only) is its own milestone before E34 (write). Read-only validates the merge UX with low blast radius — bugs in read are visual; bugs in write corrupt user files. Shipping read first lets us catch the merge-rendering bugs before the atomic-write code path is even live.

**MVP boundary: E31–E34.** Four epics, ~4–5 engineer-weeks. Studio is fully usable by a DEPT team on a v6.5 project at this point. E35 (hooks palette) and E36 (drift detector) are growth — valuable, but the studio works without them.

### MVP Feature Set (Phase 1) — E31 through E34

Phase 1 detail is already enumerated in **Success Criteria → Product Scope → MVP**. Sequencing rationale below.

| # | Epic | Why it's first | Exit criterion |
|---|---|---|---|
| 1 | **E31 — manifest reader** | Fixes P0 bug; unblocks *every* downstream v6.5 feature | `modules-plugin.test.ts` returns ≥1 module against the v6.5 fixture |
| 2 | **E32 — skill/agent adapter + TS resolver** | Load-bearing for everything else | Property test ≥1000 iterations vs Python — 0 divergences |
| 3 | **E33 — customize editor (read)** | Validates merge UX before high-stakes write code | Three-pane view + merged preview matches `resolve_customization.py` output for every skill in the v6.5 fixture |
| 4 | **E34 — customize editor (write)** | Headline user feature | Atomic write + diff confirm + post-write verify works for every customizable skill; WS broadcast updates the UI |

**Critical path: E31 → E32 → E33 → E34 (sequential; no parallelism).** Each epic depends on the contract established by the prior one.

### Post-MVP Features

**Phase 2 (Growth) — E35 + E36**, detailed in Success Criteria → Product Scope → Growth.

E35 and E36 can be parallelised. Both depend on E34 having shipped (E35 reuses the customize editor's write path; E36 reuses its WS event channel). Estimated combined: ~1.5 engineer-weeks.

**Phase 3 (Vision)**, detailed in Success Criteria → Product Scope → Vision. Items there are explicitly **deferred**, not just "later":

- **Bidirectional wiki access** — deferred until `qmd` and an MCP wrapper are stable; until DEPT's wiki has accumulated enough content to be worth querying; and until the wiki schema is mature.
- **Module-override layer** — deferred until BMAD issue #2311 lands upstream. ADR-4 keeps the resolver layer-count parameterised so this is a call-site change, not a refactor.
- **Hook template marketplace** — deferred until DEPT-internal `bmad-method-dept-integrations` repo proves the externalised-templates pattern at small scale.
- **Full TOML IntelliSense** — deferred until the basic syntax-highlighting MVP shows real friction in usability tests. May never be needed.

### Cuts (Explicitly Out of Scope)

These are *not* "later" — they are deliberate non-goals for the v6.5 migration:

| Cut | Why |
|---|---|
| Studio executes hooks itself | Threat-model decision; hooks fire in the user's IDE, not in studio |
| Studio writes outside `_bmad/custom/` | Read-only on installer-managed files; preserves `bmad-method update` semantics |
| Studio modifies `customize.toml` formatting | Round-trip through `smol-toml` will reformat; users hand-edit if they want specific whitespace |
| Multi-project workspace | Studio is one-project-at-a-time; current behaviour preserved |
| Cloud sync of overrides | `_bmad/custom/` is git-tracked; that's the sync mechanism |
| Replacing `bmad-customize` with studio | The skill keeps its CLI flow; studio is an alternative surface, not a replacement |

### Risk Mitigation Strategy (Scope-Specific)

Distinct from the Domain Requirements risk table; these are about **scope cohesion and delivery sequencing**, not technical correctness.

| Risk | Likelihood | Mitigation |
|---|---|---|
| E31 ships alone, then v6.5 migration deprioritised mid-stream | Medium | E31 is designed to be valuable standalone (closes the [] bug). If migration pauses, no rollback needed. |
| Property-based equivalence tests reveal too many divergences late in E32 | Medium | Run the test suite incrementally as the resolver is built; don't gate on full pass until end-of-epic. Surface divergences early as concrete fixture failures. |
| BMAD upstream releases v6.6 mid-migration | Medium | Strangler-fig adapter (ADR-3) localises the version dependency. v6.6 = third adapter, not a redesign. |
| Issue #2311 lands during E35 with a different shape | Low | E35 hook palette doesn't yet model module overrides; defer integration until E35 ships. |
| Customize editor UX bigger than expected (more interaction patterns to handle than initial sketch) | Medium | E33 (read-only) is the natural cut point — if write is bigger than estimated, ship E33 standalone and revisit E34 scope. |
| Existing shipped UI surfaces regress on E31 changes | Low | E31 is purely additive (manifest reader is a new code path); v6 path untouched. CI keeps both green. |
| Dev velocity slows because property-based tests are unfamiliar | Low | Pair on the first `@fast-check/vitest` integration; document the pattern in a short ADR. Familiarity ramps in <1 week. |

### Resource Requirements

- **Solo engineer or pair:** the 6–8 engineer-week estimate assumes one engineer with TS+React experience, comfortable with `child_process` and basic TOML semantics. Property-based testing is the only unfamiliar tool — manageable ramp.
- **No design dependency:** existing shadcn/ui patterns cover everything in E31–E36. The customize editor's three-pane layout, hooks palette, and drift badge are all standard primitives (table + tabs + accordion + dialog).
- **No infra dependency:** local-first; no DevOps work needed.
- **DEPT-side dependency for Phase 3 follow-ons:** `bmad-method-dept-integrations` repo and the LLM Wiki `CLAUDE.md` schema are DEPT-owned, sequenced after this PRD.

## Functional Requirements

> **Capability contract.** Every FR below is a testable, implementation-agnostic capability that must exist in studio post-migration. UX, architecture, and epic breakdown will refer back to this list as the source of truth. Anything not here will not exist unless explicitly added.

### Format Detection & Loading

- **FR1:** Studio can detect whether a project uses BMAD v6 or v6.5 by checking for the presence of `_bmad/_config/manifest.yaml`.
- **FR2:** Studio can route file reads to the correct adapter (v6 or v6.5) based on the detected version, with no behaviour change for v6 projects.
- **FR3:** Studio can read the `_bmad/_config/manifest.yaml` to enumerate installed modules, including module name, version, source (built-in / npm / repo), and install date.
- **FR4:** Studio can read `_bmad/_config/skill-manifest.csv` to enumerate every installed skill, including canonical ID, name, description, owning module, and SKILL.md path.
- **FR5:** Studio can lazy-load each skill's `SKILL.md` and `customize.toml` only when that skill is opened in the UI, not at startup.
- **FR6:** Studio can read `_bmad/_config/files-manifest.csv` to obtain the SHA-256 hash baseline for every installer-managed file.
- **FR7:** Studio can read `_bmad/_config/bmad-help.csv` to obtain workflow sequencing and agent-skill ownership relationships.

### Skill & Agent Rendering

- **FR8:** Studio can render a skill's frontmatter metadata (name, description) from its `SKILL.md`.
- **FR9:** Studio can render an agent's customizable metadata (icon, title, role, identity, communication style, principles, persistent_facts, menu items) from the merged `[agent]` block of its `customize.toml`.
- **FR10:** Studio can render a workflow's customizable metadata (`activation_steps_prepend`, `activation_steps_append`, `persistent_facts`, `on_complete`) from the merged `[workflow]` block of its `customize.toml`.
- **FR11:** Studio can group skills by their owning module and by their phase folder (1-analysis / 2-plan-workflows / 3-solutioning / 4-implementation) when displaying lists.
- **FR12:** Studio can prefix every reference to an agent (in lists, headers, detail views) with that agent's `icon` field.

### Customization Layer Resolution

- **FR13:** Studio can resolve the merged value of any skill's `customize.toml` by applying the four structural merge rules (scalar override, table deep-merge, keyed-array merge by `code` or `id`, plain-array append) across base / team / user layers in that order.
- **FR14:** Studio can resolve the merged value of the central config by applying the same four rules across the four layers (`_bmad/config.toml` → `_bmad/config.user.toml` → `_bmad/custom/config.toml` → `_bmad/custom/config.user.toml`).
- **FR15:** Studio can perform layered TOML merges using only TypeScript on the read path; it must not depend on Python being available to render skills, agents, or workflows.
- **FR16:** Studio can optionally invoke `_bmad/scripts/resolve_customization.py` as an out-of-process verifier when Python 3.11+ is available.
- **FR17:** Studio can detect at startup whether `python3` is available and ≥3.11, and surface this as a feature flag the customize editor reads.

### Customize Editor — Read

- **FR18:** A user can open any customizable skill in studio and view its three customization layers (Base / Team / User) side-by-side.
- **FR19:** A user can view the merged result of the three layers as a fourth pane, updated live as any layer's content changes.
- **FR20:** A user can see which fields in the merged result came from which layer (visual provenance hint).
- **FR21:** A user can read but not edit the Base layer (it represents installer-shipped defaults).
- **FR22:** Studio can display a clear notice when a skill exposes no `customize.toml` (i.e. is not customizable).

### Customize Editor — Write

- **FR23:** A user can edit the Team layer or the User layer of a customizable skill via an in-app editor with TOML syntax highlighting.
- **FR24:** A user can save edits to the Team layer (`_bmad/custom/<skill>.toml`) or User layer (`_bmad/custom/<skill>.user.toml`) atomically (write-tmp-then-rename).
- **FR25:** A user must see a diff confirmation dialog before any write commits; never silent overwrite.
- **FR26:** Studio can run a post-write verification of the merged result and surface the verifier outcome to the user (green when Python verify succeeded; amber when only the TS resolver was used).
- **FR27:** Studio can broadcast a `customize:changed` event over WebSocket after a successful write so other open tabs/views refresh without polling.
- **FR28:** A user can revert their unsaved edits in the Team or User layer back to the on-disk content.

### Hooks Authoring

- **FR29:** A user can view, on any workflow's detail page, the three hook surfaces (`activation_steps_prepend`, `activation_steps_append`, `on_complete`) as a list of currently-configured entries.
- **FR30:** A user can add a new entry to any hook surface by selecting from a small palette of templates (raw shell, Slack post, git tag, run-tests, LLM-agent-ingest, "browse external integrations repo").
- **FR31:** A user can fill template parameters via a short form before studio writes the resulting TOML.
- **FR32:** Studio can write the user's chosen hook to `_bmad/custom/<workflow>.toml` (or `<workflow>.user.toml`) using the same atomic-write + diff-confirm flow as the customize editor.
- **FR33:** Studio can copy a hook's supporting script template (e.g. `llm-wiki-ingest.sh`) into `_bmad/custom/scripts/` if the user picks a template that requires one and the script doesn't already exist.
- **FR34:** A user can disable an existing hook entry without deleting it (toggle off → studio comments out the line in the override file).
- **FR35:** Studio must never execute hook commands itself; the hook value is a string that the user's IDE runs on workflow completion.
- **FR36:** Studio can model multi-entry hooks internally as `string[]` (forward-compat for issue #2311's scalar→array change), serialising as a single `&&`-chained scalar today.

### Drift Detection

- **FR37:** Studio can compute the SHA-256 hash of every file listed in `_bmad/_config/files-manifest.csv` and compare it against the manifest's expected hash, on startup and on manifest change.
- **FR38:** Studio can display a header badge with the count of drifted files; clicking opens a list view with per-file expected-vs-actual hashes.
- **FR39:** A user can convert a drifted base file into a sanctioned `customize.toml` override by opening the customize editor pre-populated with a diff that reproduces the change.
- **FR40:** A user can reset a drifted base file to its installer-baseline contents (with explicit destructive-action confirmation).
- **FR41:** Studio's drift scanner ignores any file not listed in `files-manifest.csv` (no false positives on user-authored files, editor backups, `.DS_Store`, etc).

### Backward Compatibility

- **FR42:** Studio continues to render v6 projects (those without `_bmad/_config/manifest.yaml`) with no behavioural regression compared to its current production state.
- **FR43:** Studio's existing UI surfaces (modules list, skill detail, workflow detail) work identically against both v6 and v6.5 projects from the user's perspective.
- **FR44:** Studio's existing `_bmad-output/.cache/registry-*.json` cache pattern continues to function for v6 projects; v6.5 projects use a parallel `v65-index.json` cache.

### Graceful Degradation

- **FR45:** Studio operates fully on the read path without Python 3.11+ installed; the customize editor's verify badge degrades to amber (TS-merged preview) without blocking the user.
- **FR46:** Studio's hook palette degrades when `claude` / `codex` / `opencode` are absent — the LLM-agent-ingest template can still be authored; the script handles missing agents at runtime.
- **FR47:** Studio's drift detector degrades when `files-manifest.csv` is absent (older v6.5 installs or upstream removes the file) — the badge simply doesn't appear; no error.
- **FR48:** Studio shows clear, single-line warnings (not modal errors) for any optional capability that's unavailable, with a link to the relevant install instructions.

## Non-Functional Requirements

> NFRs below are only the categories that materially apply. Skipping irrelevant categories (multi-tenancy, large-scale concurrency, regulatory compliance) is intentional — see Project-Type Specific Requirements → Skip Sections.

### Performance

Targets reflect a local-first tool serving a single user. Latency budgets matter because users perceive everything happening on "their machine" — slow = broken.

- **NFR-PERF-1:** Cold start time from invoking studio to the modules list rendering against a 40-skill v6.5 install must be <50 ms (server-side parse) plus standard React hydration. (FR3, FR4.)
- **NFR-PERF-2:** Live merge preview latency in the customize editor must be <200 ms p95 from the editor's input event to the merged-pane re-render. (FR19.)
- **NFR-PERF-3:** Customize editor save round-trip (Save click → atomic write → post-write verify → WS broadcast → UI reflects merged result) must complete in <2 s p95. (Journey 2.)
- **NFR-PERF-4:** Drift detection full-scan over the entire `files-manifest.csv` (~250 files × <50 KB) must complete in <200 ms on a modern laptop. (FR37.)
- **NFR-PERF-5:** Python verifier invocation must have a 5-second hard timeout via `AbortController`; the typical resolver call should complete in <50 ms.
- **NFR-PERF-6:** Studio must not perform synchronous filesystem scans on the request hot path; manifest reads use the cached parsed index, with cache invalidation driven by file-watcher events.

### Reliability

Studio sits between the user and their config files. Reliability is mostly about not corrupting state.

- **NFR-REL-1:** All file writes to `_bmad/custom/` must be atomic — write to `<file>.tmp`, then `rename()`. No partial-write state visible to chokidar or to a concurrent reader. (FR24.)
- **NFR-REL-2:** A failed write (disk full, permission denied) must leave the on-disk override file unchanged and surface a clear error in the UI; the in-memory edit state must not be lost.
- **NFR-REL-3:** Studio must never modify files outside `_bmad/custom/` and `_bmad-output/.cache/`. Installer-managed files in `_bmad/<module>/` are read-only from studio's perspective. (FR42, scope cuts.)
- **NFR-REL-4:** Optional external tools (`python3`, `claude`, `codex`, `opencode`) being absent or failing must never crash studio. Read paths and core write paths must function regardless. (FR45–48.)
- **NFR-REL-5:** A malformed `customize.toml` (parse error) on a single skill must not break loading of other skills; the broken skill is surfaced with an error indicator while the rest of the studio remains functional.
- **NFR-REL-6:** WebSocket reconnection must be automatic; if the WS drops, the React client falls back to a single REST refetch on reconnect (no message-queue replay needed).

### Security

Local-first means most security NFRs (auth, encryption-in-transit, OAuth) are not relevant. The ones that *are*:

- **NFR-SEC-1:** Studio must never `eval()` or `Function()` any string read from `customize.toml` or any user-authored TOML. Hook command strings are stored, displayed, and written verbatim — never executed by studio.
- **NFR-SEC-2:** Hook command authoring UI must surface the resolved command verbatim with a clear warning ("runs in your shell on workflow completion"); never hide or obfuscate the literal command.
- **NFR-SEC-3:** Python child_process invocations must use the `spawn` arg array (not `exec` with a shell-quoted string). Path arguments must be `path.resolve`d and validated to stay within the project root before passing.
- **NFR-SEC-4:** No outbound network requests originate from the studio process itself. (Hooks are run by the IDE, not studio. The user's IDE is responsible for any outbound HTTP its hooks perform.)
- **NFR-SEC-5:** Studio's HTTP/WS listeners bind to localhost (`127.0.0.1`) only by default; remote-bind is opt-in and must require an explicit flag.
- **NFR-SEC-6:** TOML written to `_bmad/custom/` must be parsed by `smol-toml` before writing. Reject malformed input; never persist a file the resolver can't read.
- **NFR-SEC-7:** Drift detection compares SHA-256 hashes from `files-manifest.csv` to file contents. The manifest itself is not signed; drift detection is a *consistency* check, not a *trust* check. UX language must reflect this (e.g., "diverged from installer baseline", not "tampered").

### Scalability

Single-user, single-machine, local-first. The relevant scale axis is **size of the installed BMAD ecosystem**, not concurrent users.

- **NFR-SCALE-1:** Studio must render correctly with up to 200 installed skills (current v6.5 reference install ships ~40; allow 5× headroom for module growth).
- **NFR-SCALE-2:** `files-manifest.csv` parse + hash scan must scale linearly with file count; no quadratic behaviour. Target: <500 ms for 1000 tracked files.
- **NFR-SCALE-3:** Customize editor must remain responsive when a skill's `customize.toml` reaches 500 lines (heavy team override scenario).

### Accessibility

Studio is an internal tool used by DEPT staff with varying needs. Targets are pragmatic, not WCAG-AAA.

- **NFR-A11Y-1:** All interactive controls (buttons, menu items, form inputs) must be keyboard-navigable and have ARIA roles via the existing shadcn/ui primitives.
- **NFR-A11Y-2:** Color contrast for text and UI elements must meet WCAG 2.1 AA (≥4.5:1 for body text, ≥3:1 for large text and UI components). Existing Tailwind theme already meets this; new components must inherit the same tokens.
- **NFR-A11Y-3:** Drift, verify-status, and error indicators must not rely on color alone — pair every color signal with an icon or text label (e.g., the verify badge says "✓ verified" / "⚠ TS-only"; not just green/amber).

### Integration

How studio talks to the things outside its own process.

- **NFR-INT-1:** Filesystem watching via chokidar v5 with `awaitWriteFinish` + 150 ms debounce. (Domain Requirements covers this verbatim.)
- **NFR-INT-2:** Python child_process invocations must read both stdout and stderr to completion (or use `stdio: 'ignore'`) — never leave pipe buffers unread. Manifest outputs can hit 100 KB+.
- **NFR-INT-3:** WebSocket events broadcast to the React client must be JSON-serialisable, single-line, and named with a `<noun>:<event>` pattern (`manifest:changed`, `customize:changed`, `drift:detected`).
- **NFR-INT-4:** All cross-process protocols (file format, IPC argument shape, WS event names) must be versionable — include a `version` field where future upstream changes are likely.

### Maintainability

A v6.5 migration that doubles the parser/loader codebase needs explicit maintainability targets to avoid technical debt.

- **NFR-MAINT-1:** New v6.5 code must live under `packages/server/src/v65/` (parallel to existing parsers). v6 code stays in place during the strangler-fig coexistence period; no in-place rewrites.
- **NFR-MAINT-2:** The four structural merge rules in the TS resolver must be implemented as four named functions (`mergeScalar`, `mergeTable`, `mergeKeyedArray`, `mergeArray`) with one-paragraph doc comments referencing the corresponding logic in `resolve_config.py`. Future readers must be able to map each rule to its Python counterpart at a glance.
- **NFR-MAINT-3:** v6 adapter code is allowed to remain effectively frozen; once all known v6 projects in DEPT have migrated, v6 adapter and parsers may be removed in a single follow-up cleanup epic.
- **NFR-MAINT-4:** Any new dependency added (`smol-toml`, `papaparse`, `@uiw/react-codemirror`, `@codemirror/language`, `@fast-check/vitest`) must be exact-pinned in `package.json`, not range-pinned, and each must be listed in this PRD's Implementation Considerations table.

### Observability

Studio is a debug-by-developer tool, but the developer is often a Solutions Architect or PM, not a backend engineer. Logs must be readable.

- **NFR-OBS-1:** Server-side logs use one structured line per event with `level`, `event`, and a flat `data` object. No multi-line stack traces in normal operation; stack traces only on uncaught errors.
- **NFR-OBS-2:** Every file-watcher-driven cache invalidation must log which file triggered it and which cache key was invalidated — debugging "why didn't my edit show up?" should not require source-diving.
- **NFR-OBS-3:** Python verifier failures must surface both the user-facing reason ("verifier unavailable", "verifier disagreed") and the technical detail (exit code, stderr) in the response payload, so the customize editor can show a "view details" link without round-tripping a second request.
- **NFR-OBS-4:** Studio's `/api/health` endpoint must report version (v6 / v6.5 / both detected), Python availability, LLM-CLI availability (claude / codex / opencode found), and watcher status (active / not-watching). One-stop shop for "is studio configured correctly?".

### Out of Scope (Explicit Skips)

Categories deliberately not covered, with rationale:

| Category | Why skipped |
|---|---|
| Multi-tenancy | Single-user, local-first |
| Authentication / authorization | No multi-user concept |
| Encryption at rest | No persistent secrets stored by studio |
| TLS / encryption in transit | Localhost-bound by default |
| GDPR / regulatory compliance | No PII handled |
| Disaster recovery / backup | User's git repo is the recovery mechanism |
| Internationalization | English-only, matches BMAD upstream |
| Mobile / responsive design | Desktop browser only |
| High availability / SLA | Single-user local tool — no SLA concept |

## Related Documents & Cross-References

This sub-PRD lives within the wider bmad-studio planning artefact set. Linked artefacts (all in `_bmad-output/planning-artifacts/`):

### Direct dependencies (this PRD reads from these)

| Document | Path | Purpose |
|---|---|---|
| Technical Research Report (primary input) | [`research/technical-bmad-v6.5-migration-research-2026-04-28.md`](research/technical-bmad-v6.5-migration-research-2026-04-28.md) | 7 ADRs, file-by-file change list, six-epic plan, hook integration appendix (LLM Wiki + Jira) |
| Main bmad-studio PRD | [`prd.md`](prd.md) | Wider product premise, target users, design principles. This sub-PRD inherits all of them. |
| Existing epics list | [`epics.md`](epics.md) | Epic 1–30 historical record (Cycles 1–4). E31–E36 will be added as a Cycle 5 entry as part of the doc-discipline pass. |
| Epic numbering map | [`epic-numbering-map.md`](epic-numbering-map.md) | Confirms continue-from-29 numbering convention. |
| Architecture doc (existing) | [`architecture.md`](architecture.md) | Will be extended with a v6.5 architecture section once `bmad-create-architecture` runs against this PRD. |
| Tech-spec precedents | [`tech-spec-bmad-studio-module-manager-v1.md`](tech-spec-bmad-studio-module-manager-v1.md), [`tech-spec-epic-17-reliability-ux.md`](tech-spec-epic-17-reliability-ux.md) | Format reference for scoped sub-PRDs. |

### External references (read-only; not under bmad-studio's control)

| Reference | Path / URL | Purpose |
|---|---|---|
| BMAD v6.5 reference install | `docs/_bmad_v6.5/` (in this repo) | Green-field reference for the new format. Used as test fixture. |
| LLM Wiki pattern doc | `docs/reference/llm-wiki.md` | Drives Appendix A.3 of the research doc; shapes the LLM-agent-ingest hook template. |
| BMAD PR #2284 | https://github.com/bmad-code-org/BMAD-METHOD/pull/2284 | TOML agent customization (merged) |
| BMAD PR #2287 | https://github.com/bmad-code-org/BMAD-METHOD/pull/2287 | TOML workflow customization for 17 workflows (merged) |
| BMAD PR #2308 | https://github.com/bmad-code-org/BMAD-METHOD/pull/2308 | Uniform `customize.toml` for final 6 workflows (merged) |
| BMAD Issue #2311 | https://github.com/bmad-code-org/BMAD-METHOD/issues/2311 | Module-shipped overrides (open; relevant to Phase 3) |

### Downstream documents (this PRD feeds into these)

| Document | Status | Sequencing |
|---|---|---|
| v6.5 architecture document | Not yet produced | Next deliverable: `bmad-create-architecture` against this PRD. Will lock the 7 ADRs from the research doc into a formal architecture spec with sequence diagrams. |
| Epics & stories list (E31–E36) | Not yet produced | After architecture: `bmad-create-epics-and-stories`. |
| Implementation readiness check | Not yet produced | Before story creation: `bmad-check-implementation-readiness` to verify PRD + architecture + epics are aligned. |
| Updates to main `prd.md` and `epics.md` | Not yet performed | Doc-discipline pass: link this sub-PRD from main PRD; add E31–E36 entries to `epics.md`. |
| DEPT LLM Wiki `CLAUDE.md` schema | Not yet produced | The next concrete deliverable **after** the v6.5 PRD/architecture sequence completes. Owned by DEPT, not bmad-studio. |
| `bmad-method-dept-integrations` repo | Not yet produced | Green-field repo; seeded from research doc Appendix A. Sequenced after the wiki schema. |

### Doc-discipline checklist

Completed during PRD finalisation (2026-04-29):
- [x] Add a "Sub-PRDs and tech specs" section to main `prd.md` linking to this document
- [x] Add E31–E36 entries to `epics.md` Epic List with `→ See prd-v65-migration.md` cross-reference
- [x] Add Cycle 5 section to `epic-numbering-map.md` with E31–E36 listing
- [x] Replace stale memory note `project_epic1_status.md` with `project_cycle_status.md` reflecting Cycles 1–4 shipped + Cycle 5 planned

Pending (sequenced after architecture and implementation):
- [ ] Update `epic-numbering-map.md` Cycle 5 entries from "Planned" → "Shipped" as each epic lands; record git hashes
- [ ] After `bmad-create-architecture` runs: link the new architecture sections from this PRD's "Project-Type Specific Requirements" section
- [ ] Update memory note `project_skills_parser_fix.md` once E31 lands (the empty-modules-list bug is closed)

---

## Addendum: Epics E37–E41 (Cycle 6 — v6.5 Skills & UI)

**Date:** 2026-05-02  
**Epics file:** [`epics-v65-skills.md`](epics-v65-skills.md)

### Why these epics extend this PRD

After Cycle 5 (E31–E36) shipped the v6.5 infrastructure — manifest reader, TS resolver, customize editor, hooks palette, drift detector — real-world testing against v6.5 projects surfaced that the entity model itself was misaligned. The index builder was classifying agents and workflows via legacy filesystem heuristics (`agents/*.md`, `workflow.md`, `bmad-manifest.json`). In v6.5, entity type is determined by the TOML block header in `customize.toml` (`[agent]` or `[workflow]`). This blocks every downstream UI surface (Skills page, agent editors, teams redesign) from working correctly.

E37–E41 close this gap and build the UI surfaces that v6.5 enables.

### New Functional Requirements (FR49–FR62)

#### Entity Classification (E37)

- **FR49:** Studio determines whether a skill directory is an Agent or Workflow by inspecting the top-level TOML block in its `customize.toml` — `[agent]` → Agent, `[workflow]` → Workflow.
- **FR50:** Studio reads `_bmad/config.toml` `[agents.*]` table entries and merges them into each agent record post-classification: `name`, `title`, `icon`, `description`, `team`, `module`.
- **FR51:** Agent records from `customize.toml [agent]` include: `name`, `title`, `icon`, `role`, `identity`, `communication_style`, `principles`, `persistent_facts`, `activation_steps_prepend`, `activation_steps_append`, and `[[agent.menu]]` items.
- **FR52:** Workflow records from `customize.toml [workflow]` include: `persistent_facts`, `activation_steps_prepend`, `activation_steps_append`, `on_complete`. Phase is derived from parent directory name.
- **FR53:** The `Agent` shared type gains optional `team` and `description` fields.
- **FR54:** Legacy entity detection (`agents/*.md` file scanning, `workflow.md`/`bmad-manifest.json` detection) is replaced by `customize.toml`-first detection for v6.5 projects. v6 projects (no `_config/manifest.yaml`) continue to use legacy detection unchanged.

#### Skills Page as Compiled View (E38)

- **FR55:** The Skills page presents a merged list of all Agents and Workflows in the project, each labeled with a type badge (Agent / Workflow).
- **FR56:** Each entry shows: skill name, type badge, description, module source, and an Edit button routing to the entity's detail page.
- **FR57:** The sidebar badge count for Skills reflects the combined total (agents + workflows).

#### TOML Customization Editors (E39)

- **FR58:** `GET /api/agents/:id` returns both the parsed base config (from `customize.toml [agent]`) and the on-disk override file content (from `_bmad/custom/{skill-name}.toml`), or null if no override exists.
- **FR59:** The agent detail page renders a base/override split: Base Config (read-only, muted) and My Overrides (editable, highlighted), with a clear explanatory banner.
- **FR60:** A user can edit persona fields (icon, role, identity, communication_style, principles), menu items, persistent facts, and activation steps via form UI; save writes only changed fields to `_bmad/custom/{skill-name}.toml` under `[agent]`.
- **FR61:** `GET /api/workflows/:id` returns base + override. `PUT /api/workflows/:id/override` writes override. Workflow editor exposes persistent_facts, activation_steps_prepend, activation_steps_append.

#### Teams Page Redesign (E40)

- **FR62:** `GET /api/teams` derives teams by grouping agents by their `team` field from `config.toml`. Agents without a team are grouped under `"ungrouped"`. Team names are human-formatted.
- **FR63:** The Teams page renders a section per team with agent cards (icon, name, title, description, module badge). Clicking navigates to agent detail.

#### BMAD Mode + Navigation (E41)

- **FR64:** Studio detects the active BMAD mode from installed modules: `quick-flow` (core only), `bmad-method` (bmm present), `enterprise` (bmm + domain modules). Exposed on `GET /api/overview` as `bmadMode`.
- **FR65:** The home page shows a mode badge and, for bmad-method/enterprise, a phase timeline (Analysis → Planning → Solutioning → Implementation).
- **FR66:** Navigation removes the Toolkit intermediary layer; Agents, Workflows, Skills, and Teams appear as direct nav items. A Method nav item is added.

### Implementation Sequencing

```
E37 (backend foundation — sequential: 37.1 → 37.2 → 37.3 → 37.4)
  ├─ E38 (Skills page)       ← unblocked after E37
  ├─ E39 (TOML editors)      ← unblocked after E37
  └─ E40 (Teams redesign)    ← unblocked after E37.2 (team field on Agent)

E41 (mode + nav)             ← after E37–E40 complete
```

E38, E39, E40 can run in parallel after E37 completes.

---

## Change Log

| Date | Change | Author |
|---|---|---|
| 2026-04-28 | Initial draft via `bmad-create-prd` (fast-path mode) — 11 sections, 48 FRs, 31 NFRs, 5 user journeys, 4-epic MVP + 2-epic growth scope. Grounded in the 2026-04-28 research report. | Jonathan |
| 2026-04-29 | Renumbered E29–E34 → E31–E36 to align with unified sequential numbering (Cycle 4 shipped Epics 29–30 per `epic-numbering-map.md`). Reframed stale "Epic 2 in flight" language. Doc-discipline pass: added "Sub-PRDs and tech specs" section to main `prd.md`; added E31–E36 entries to `epics.md` Epic List; added Cycle 5 entry to `epic-numbering-map.md`; replaced stale memory note. Readiness check passed (✓ READY). | Jonathan |
| 2026-05-02 | Added E37–E41 addendum (Cycle 6 — v6.5 Skills & UI). Closes entity-classification gap discovered in real-world v6.5 testing. FR49–FR66 added. Epics file: `epics-v65-skills.md`. | Jonathan |
