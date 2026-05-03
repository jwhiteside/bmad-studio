---
stepsCompleted: ['step-01-init', 'step-02-context', 'step-03-starter', 'step-04-decisions', 'step-05-patterns', 'step-06-structure', 'step-07-validation', 'step-08-complete']
status: 'complete'
completedAt: '2026-04-29'
inputDocuments:
  - _bmad-output/planning-artifacts/prd-v65-migration.md
  - _bmad-output/planning-artifacts/research/technical-bmad-v6.5-migration-research-2026-04-28.md
  - _bmad-output/planning-artifacts/implementation-readiness-report-2026-04-29.md
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/architecture.md
  - _bmad-output/planning-artifacts/epic-numbering-map.md
  - docs/_bmad_v6.5/
  - docs/reference/llm-wiki.md
  - CLAUDE.md
workflowType: 'architecture'
mode: 'fast-path'
project_name: 'bmad-studio'
user_name: 'Jonathan'
date: '2026-04-29'
scope: 'BMAD v6.5 Migration (Cycle 5, Epics E31–E36)'
parent: '_bmad-output/planning-artifacts/architecture.md'
---

# Architecture Decision Document — bmad-studio v6.5 Migration

**Scope:** Sub-architecture document scoped to Cycle 5 (Epics E31–E36). The main bmad-studio architecture remains at [`architecture.md`](architecture.md); this document extends it with v6.5-migration-specific decisions.

**Author:** Jonathan
**Date:** 2026-04-29
**Status:** Complete (architecture workflow finished 2026-04-29; ready for `bmad-create-epics-and-stories`)
**Primary inputs:**
- [PRD](prd-v65-migration.md) — 48 FRs, 31 NFRs across 9 capability areas
- [Technical Research](research/technical-bmad-v6.5-migration-research-2026-04-28.md) — 7 pre-drafted ADRs
- [Readiness Report](implementation-readiness-report-2026-04-29.md) — ✓ READY verdict + 4 anticipatory items to resolve here

_This document builds collaboratively in fast-path mode: each section is drafted from the inputs above, presented for review, and committed on `c`._

## Change Log

| Date | Change | Source |
|---|---|---|
| 2026-04-30 | **ADR-3 detection signal refined.** Original spec said the v6/v6.5 discriminator is presence of `_bmad/_config/manifest.yaml`. Reconnaissance during Story 31.1 implementation found this is wrong — both v6 and v6.5 projects can have `manifest.yaml`. The unique-to-v6.5 marker is `_bmad/_config/skill-manifest.csv`. `core/module-loader.ts` ships using the CSV-based signal; `detectVersion` returns `'v65'` iff `_bmad/_config/skill-manifest.csv` exists. | Story 31.1 |
| 2026-04-30 | **`bmad-help.csv` parsing landed in Story 31.2 (not deferred).** `loadBmadHelp` joins `loadModules` + `loadSkillIndex` in `v65/manifest-loader.ts` so all `_config/` reads share one papaparse instance and one error path. The file is treated as **optional** — absent ⇒ `[]`, present-but-malformed ⇒ `ManifestParseError`. Downstream consumers (Stories 32.6/32.7 agent/workflow adapters) can rely on a single canonical reader. | Story 31.2 |
| 2026-04-30 | **Story 33.2: TOML grammar decision.** **Decision**: Use `@codemirror/lang-yaml` as the TOML syntax grammar for the LayerPane read-only viewer. **Rationale**: TOML and YAML share similar structure (key=value, sections, string/number/boolean literals). YAML mode provides readable syntax highlighting without adding a new dependency. A native TOML Lezer grammar (e.g. `codemirror-lang-toml`) can be substituted later by changing one line in `CodeMirrorEditor.tsx`. | Story 33.2 |

## Project Context Analysis

### Requirements Overview

**Functional Requirements (48 total, 9 capability areas):**

| Area | Count | Architectural implication |
|---|---|---|
| Format Detection & Loading | 7 | New manifest reader + version-detection facade; introduces `v65/` directory |
| Skill & Agent Rendering | 5 | TS implementation projecting `customize.toml` `[agent]`/`[workflow]` blocks into existing shared types |
| Customization Layer Resolution | 5 | Single `resolveLayered<T>` function used in both 4-layer config and 3-layer per-skill paths; property-tested vs Python |
| Customize Editor — Read | 5 | New React surface (CodeMirror 6 + `@uiw/react-codemirror`); reads-only via REST + WS |
| Customize Editor — Write | 6 | Atomic write to `_bmad/custom/`; diff confirm; post-write Python verifier; WS broadcast |
| Hooks Authoring | 8 | Hook palette UI; template registry; declarative TOML output; never executes |
| Drift Detection | 5 | SHA-256 hash scan vs `files-manifest.csv`; convert-drift-to-override flow |
| Backward Compatibility | 3 | Strangler-fig adapter; v6 path untouched; parallel cache |
| Graceful Degradation | 4 | Auto-detect Python/CLAUDE/codex/opencode; UI degrades amber-not-red |

**Non-Functional Requirements (31 total, 8 categories):**

The architecturally load-bearing NFRs:

- **NFR-PERF-1, 2, 4** — manifest read <50 ms, merge preview <200 ms p95, drift scan <200 ms. Drives caching strategy and scan algorithm choice (streaming SHA-256, in-memory parsed-manifest cache).
- **NFR-REL-1** — atomic writes via tmp-then-rename. Mandates the write path's transactional shape.
- **NFR-SEC-3** — `spawn` arg-array, never `exec`. Locks the IPC pattern for the Python verifier.
- **NFR-MAINT-1** — new code lives at `packages/server/src/v65/`. Locks directory layout.
- **NFR-INT-3** — WS events use `<noun>:<event>` pattern; JSON-serialisable. Locks the broadcast contract.
- **NFR-OBS-4** — `/api/health` reports version, Python availability, LLM-CLI availability, watcher status. Locks the observability surface.

### Scale & Complexity

| Dimension | Assessment |
|---|---|
| Project complexity | **Medium** |
| Primary domain | Internal developer tool (Fastify+TS server, React+Vite client, no DB) |
| Architectural components introduced | ~6 new modules + 5 new client surfaces |
| Cross-language IPC | Yes (Node ↔ Python 3.11+, optional) |
| Multi-tenancy | None (single-user, local-first) |
| Real-time updates | Yes (chokidar → WS broadcast → React re-render) |
| Compliance | None (no PII, local-first) |
| Integration complexity | Low (only filesystem + optional Python child_process) |

### Technical Constraints & Dependencies

**Locked from PRD § Domain-Specific Requirements:**

1. **TOML 1.1 spec compliance** for read and write — drives parser choice (`smol-toml`, not `@iarna/toml`).
2. **Four-rule structural merge** must be byte-equivalent to BMAD's `resolve_config.py` — drives the property-based test gate (`@fast-check/vitest` ≥1000 iterations) as a CI requirement.
3. **Python 3.11+ is optional** — every read path must work without it; Python is reserved for write-time verify only. Drives runtime detection at startup, feature-flag gating, and graceful degradation UX.
4. **Atomic writes** to `_bmad/custom/` — drives the tmp-then-rename pattern.
5. **chokidar v5 with `awaitWriteFinish` + 150 ms debounce** — drives the file-watcher protocol.
6. **No outbound HTTP from studio process** — drives the threat model (hooks fire in user's IDE, not in studio).

**Inherited from main bmad-studio architecture:**

- React 18 + Vite + Tailwind + shadcn/ui frontend stack
- Fastify 5 + TypeScript ESM (Node 20+) backend
- File-system as data store (no database)
- Existing WebSocket infrastructure at `packages/server/src/core/websocket.ts`
- Existing parser layout at `packages/server/src/parsers/`
- Existing cache pattern at `_bmad-output/.cache/registry-*.json`

### Cross-Cutting Concerns

These touch multiple epics and components; the architecture must address each in one place rather than scatter:

1. **Version detection** (E31–E36 — every epic). Single facade at `ModuleLoader.load()`. ADR-3.
2. **Cache invalidation protocol** (every epic that reads). Driven by chokidar events; broadcast to client via WS. ADR-5.
3. **Python availability flag** (E32, E34, E35, hosts the verify path). Detected at startup; surfaced via `/api/health`; honoured by every UI surface that interacts with the verifier.
4. **Atomic write pattern** (E34, E35, E36 convert-flow — every write surface). One helper, shared.
5. **WebSocket event protocol** (E31, E34, E35, E36 — every state change). One namespacing convention, one type registry. NFR-INT-3.
6. **Layer-merge resolver** (E32, E33, E34, E35, E36). Single TS function, byte-equivalent to Python. ADR-2.
7. **Drift allow-list** (E36 + UX implications elsewhere). Only files in `files-manifest.csv` are tracked.

### System Boundaries

```
┌──────────────────────────────────────────────────────────────────┐
│                    User's Filesystem                              │
│                                                                   │
│   _bmad/                          _bmad-output/                  │
│   ├── _config/                    └── .cache/                    │
│   │   ├── manifest.yaml               └── v65-index.json (new)   │
│   │   ├── skill-manifest.csv                                     │
│   │   ├── files-manifest.csv      _bmad-output/                  │
│   │   └── bmad-help.csv           └── planning-artifacts/...     │
│   ├── core/<skills>/                                             │
│   ├── bmm/<phases>/<skills>/                                     │
│   ├── scripts/                                                   │
│   │   ├── resolve_config.py                                      │
│   │   └── resolve_customization.py                               │
│   └── custom/                     ← studio writes here only      │
│       ├── <skill>.toml                                           │
│       ├── <skill>.user.toml                                      │
│       └── scripts/<hook-script>.sh                               │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
                                ▲                ▲
                                │                │
                       reads (most)      writes (custom/ only)
                                │                │
┌──────────────────────────────────────────────────────────────────┐
│                  bmad-studio Server (Node 20+, Fastify 5)         │
│                                                                   │
│   packages/server/src/                                            │
│   ├── parsers/                  (existing — kept)                 │
│   ├── v65/                      (new — this cycle)                │
│   │   ├── manifest-loader       (E31)                             │
│   │   ├── customize-resolver    (E32)                             │
│   │   ├── config-resolver       (E32)                             │
│   │   ├── agent-adapter         (E32)                             │
│   │   ├── workflow-adapter      (E32)                             │
│   │   ├── python-bridge         (E34)                             │
│   │   ├── drift-detector        (E36)                             │
│   │   └── hook-template-registry (E35)                            │
│   ├── core/                                                       │
│   │   ├── module-registry       (extended)                        │
│   │   ├── module-loader         (new facade — strangler)          │
│   │   └── websocket             (extended for new events)         │
│   └── plugins/                                                    │
│       ├── modules-plugin        (uses facade)                     │
│       └── skills-plugin         (uses facade + customize)         │
│                                                                   │
│  Optional out-of-process: python3 → resolve_customization.py      │
│  Optional out-of-process: claude / codex / opencode (via hook)    │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
                                ▲
                                │
                          WebSocket + REST
                                │
┌──────────────────────────────────────────────────────────────────┐
│                  bmad-studio Client (React 18, Vite)              │
│                                                                   │
│   packages/client/src/                                            │
│   ├── components/                                                 │
│   │   ├── customize-editor/    (new — E33, E34)                   │
│   │   ├── hooks-palette/       (new — E35)                        │
│   │   └── drift-badge/         (new — E36)                        │
│   ├── hooks/                                                      │
│   │   └── use-ws-events        (extended)                         │
│   └── pages/                                                      │
│       └── ...existing (extended with new tabs)                    │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

## Starter Template Evaluation

### Primary Technology Domain

**Internal developer tool — local-first browser-based admin UI.** No new starter template applies; this cycle extends the existing bmad-studio monorepo established in Cycle 1.

### Inherited Foundation (no new starter)

This cycle is **brownfield** — it inherits the entire bmad-studio stack established across Cycles 1–4 (Epics 1–30, all shipped). The starter-template evaluation step is effectively N/A; documenting the inherited stack here for completeness.

| Layer | Inheritance | Notes |
|---|---|---|
| Runtime | Node 20+, ESM | NFR-MAINT-1 mandates ESM-only on the server |
| Server framework | Fastify 5 + TypeScript | Existing parsers, plugins, websocket infrastructure all kept |
| Server-side parsing | gray-matter (frontmatter), js-yaml (YAML) | Extended with `smol-toml` (new) and `papaparse` (verify or swap from existing `csv-parser.ts`) |
| Filesystem watching | chokidar (already a transitive dep across Vite tooling) | Direct-dep upgrade to v5 mandated by `awaitWriteFinish` requirement |
| Frontend framework | React 18 + Vite | Existing routing, layout, sidebar, context providers all kept |
| Styling | Tailwind + shadcn/ui | All new components reuse existing primitives |
| Frontend editor (new) | CodeMirror 6 + `@uiw/react-codemirror` + `@codemirror/language` | Lighter than Monaco; matches existing FE stack philosophy |
| State / data | File-system as source of truth | No database, no shared store. WS events drive React state |
| Cross-process IPC (optional) | Node `child_process.spawn` ↔ Python 3.11+ stdlib `tomllib` | Reserved for write-time verify; auto-detected; degrades gracefully |
| Testing | Vitest + `@fast-check/vitest` (new — for property-based equivalence tests vs Python resolver) | CI gate at ≥1000 iterations |
| Build & dev | Existing Vite + npm scripts | No deployment changes — local workflow |

### Initialization Command

**N/A** — no `npx create-*` scaffold is run. Cycle 5 starts with `git checkout -b feature/v65-manifest-reader` from the existing main branch.

### New Stack Additions in This Cycle

These new dependencies are introduced (NFR-MAINT-4 requires exact-pin):

| Package | Surface | Why this choice |
|---|---|---|
| `smol-toml` | Server (TOML 1.1 read/write) | Spec-current; faster parse than `@iarna/toml`; ESM-native |
| `papaparse` (verify or swap) | Server (RFC 4180 CSV parsing) | v6.5 manifests contain quoted descriptions with embedded commas |
| `@uiw/react-codemirror` + `@codemirror/language` | Client (TOML editor) | Lighter than Monaco; aligns with existing shadcn/ui philosophy |
| `@fast-check/vitest` | Server (dev) | Property-based equivalence test gate vs `resolve_config.py`; ≥1000 iterations |
| `zod` | Server | Hook template `paramSchema` (per ADR-11) |

`chokidar` is verified-and-upgraded (already transitive) to v5+ as a direct dep; `crypto` (stdlib) handles SHA-256 drift hashing; `child_process` (stdlib) handles Python IPC.

**Note:** Project initialization is therefore not a Cycle 5 story. The first story is the manifest reader (E31 Story 1) on a new feature branch.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical (block implementation — must be locked before E31 stories are written):**
- ADR-1 through ADR-7 (lock the 7 research-doc decisions)
- ADR-8 through ADR-11 (resolve the 4 readiness-report anticipatory items)
- WS Event Protocol (NFR-INT-3)
- Python IPC Contract (ADR-6, NFR-SEC-3)
- Cache Topology (ADR-5)

**Deferred (post-MVP, Phase 3 vision per PRD):**
- Bidirectional wiki access (`activation_steps_prepend` queries via `qmd` + MCP)
- Module-override layer (issue #2311)
- Hook template marketplace
- Full TOML IntelliSense

---

### ADR-1 — Manifest-as-Index (Discovery Strategy)

**Status:** Accepted (locked from research doc, 2026-04-29).

**Context.** v6.5 ships `_bmad/_config/skill-manifest.csv` as an authoritative index of every installed skill. Current bmad-studio scans the filesystem recursively — slow, non-deterministic, hides bugs.

**Decision.** When a project is detected as v6.5 (ADR-3), trust `_config/skill-manifest.csv` as the **single source of truth** for the skill list. Lazy-load each skill's `SKILL.md` and `customize.toml` only when the user opens it. Drop filesystem scanning entirely on the v6.5 read path.

**Consequences.**
- (+) Cold start time: O(1) — read one CSV (~8 KB for 40 skills) instead of N file reads × parse.
- (+) Determinism: order, presence, and identity of skills is exactly what the manifest says.
- (+) Failure mode shifts from "skill silently missing" to "skill listed in manifest but file absent → loud error".
- (−) Manifest can disagree with disk; resolved by ADR-5 drift detection.
- (−) Skills installed manually outside the installer won't appear; matches BMAD's intended workflow.

**Affects.** E31 (manifest reader), E32 (skill list rendering), `core/module-loader.ts`, `parsers/skill-parser.ts`.

---

### ADR-2 — Single TS Resolver Function

**Status:** Accepted.

**Context.** v6.5 has two layered TOML configurations: a 4-layer central config and a 3-layer per-skill config. BMAD's official Python resolvers implement the same four structural merge rules in both cases.

**Decision.** Implement **one** TypeScript function `resolveLayered<T>(layers: TomlObject[]): T` that takes an ordered array of parsed TOML objects and applies the four rules: scalar override, table deep-merge, keyed-array merge by `code`/`id`, plain-array append. Use it for both the 4-layer config path and the 3-layer per-skill path. The merge rules are field-name-agnostic — purely structural.

**Consequences.**
- (+) Single bug surface, single test surface, single mental model.
- (+) Future BMAD changes (e.g. v6.6 adds new fields) flow through unchanged.
- (+) Issue #2311 module-override layer (Phase 3) plugs in by passing more layers.
- (−) Must be byte-equivalent to BMAD's Python resolver — addressed by ADR-6 + the property-based test gate.

**Affects.** E32 (resolver primitives), `v65/customize-resolver.ts`, `v65/config-resolver.ts`.

---

### ADR-3 — Strangler-Fig Adapter at the Entry Point

**Status:** Accepted.

**Context.** bmad-studio currently parses v6 (XML-in-markdown agents, optional `module.yaml`, no `_config/`). v6.5 is a fundamentally different shape. Two adapters must coexist for at least the next 2–3 cycles.

**Decision.** Introduce a **single facade** at `core/module-loader.ts` (`ModuleLoader.load(projectRoot)`). It version-detects via `_bmad/_config/manifest.yaml` presence and routes to `v6/` or `v65/` adapters. Both adapters project into the existing shared `Skill` and `Agent` types — the frontend doesn't change.

**Detection signal:**

```ts
function detectVersion(bmadDir: string): 'v6' | 'v65' {
  return fs.existsSync(path.join(bmadDir, '_config', 'manifest.yaml'))
    ? 'v65' : 'v6'
}
```

**Consequences.**
- (+) Zero v6 regression risk.
- (+) Frontend code unchanged — both adapters produce shared types.
- (+) Removable in one cleanup epic once all DEPT projects are on v6.5.
- (−) Two parser code paths to maintain temporarily; mitigated by NFR-MAINT-3.

**Affects.** `core/module-loader.ts` (new), all `plugins/*.ts`, all existing `parsers/*.ts` (no edits).

---

### ADR-4 — Parameterised Resolver Layer Count

**Status:** Accepted (forward-compat for issue #2311).

**Context.** Issue #2311 (open upstream) proposes a fourth resolver layer for module-shipped overrides. The shape is debated; bmadcode confirmed direction-of-travel only.

**Decision.** `resolveLayered<T>` accepts `layers: TomlObject[]` — variable length, not a fixed tuple. Today the call sites pass 3 (per-skill) or 4 (config) layers; when #2311 lands, the call site adds a 5th layer with no resolver change.

**Consequences.**
- (+) Negligible cost today.
- (+) Adapt at the call site when upstream design stabilises; no resolver refactor.
- (−) Can't statically type-check arity at the call site — acceptable trade-off.

**Affects.** `v65/customize-resolver.ts`, loader call sites in `plugins/skills-plugin.ts`.

---

### ADR-5 — Cache-with-Drift-Detection (Topology)

**Status:** Accepted.

**Context.** Manifest reads happen on every navigation; full re-parse on every read defeats NFR-PERF-1 (<50 ms). chokidar watches everything in `_bmad/`; cache invalidation must be precise.

**Decision.** **Two-tier cache, hash-keyed, chokidar-invalidated.**

- **Tier 1 (in-memory):** `Map<skillId, ParsedSkill>` LRU cache for hot reads.
- **Tier 2 (on-disk):** `_bmad-output/.cache/v65-index.json` for cold-start hydration. Keyed on the SHA-256 of `_bmad/_config/files-manifest.csv`.
- **Invalidation:** chokidar event on any tracked file → invalidate the affected cache entry → emit WS event to client.

**Read path:**

1. `GET /api/skills/<id>` → check Tier 1 (in-memory): hit returns immediately.
2. Miss → check Tier 2 (disk): if hit and manifest-hash matches, hydrate Tier 1 and return.
3. Miss / hash mismatch → cold parse via `smol-toml` + `papaparse`, populate Tier 1, write Tier 2, return.

**Write path (customize editor saves):**

1. `PUT /api/customize/<skill>` → atomic write (tmp → rename).
2. chokidar fires.
3. Invalidate Tier 1 entry (Tier 2 stays valid as manifest hash unchanged).
4. Broadcast WS `customize:changed`.

**Consequences.**
- (+) Cold start <50 ms (NFR-PERF-1).
- (+) Cache hash invalidates wholesale on any installer-managed file change (matches drift semantics).
- (−) Disk cache writes incur I/O on first parse; acceptable.

**Affects.** `v65/manifest-loader.ts`, `core/file-store.ts` (extends existing pattern).

---

### ADR-6 — TS-for-Read, Python-for-Verify (Resolver Strategy)

**Status:** Accepted.

**Context.** BMAD ships `resolve_config.py` and `resolve_customization.py` (Python 3.11+ stdlib `tomllib`). bmad-studio could shell out for every read, reimplement in TS, or both.

**Decision.** **TS-native resolver for every read path.** Python is reserved for **write-time verification only**: when the user clicks Save in the customize editor (E34), studio shells to `resolve_customization.py` to confirm the merged output matches its own. Mirrors BMAD's own fallback pattern in `SKILL.md`.

If Python 3.11+ is absent or fails, the verify badge degrades to amber ("TS-merged preview"); the write still succeeds.

**Consequences.**
- (+) Read latency <10 ms (no subprocess overhead).
- (+) Studio works without Python (NFR-REL-4, FR45).
- (+) Property-based equivalence tests (`@fast-check/vitest` × ≥1000 iterations) against the Python resolver are the CI gate.
- (−) Two implementations of the same merge logic — mitigated by the test gate.

**Affects.** `v65/customize-resolver.ts` (TS impl), `v65/python-bridge.ts` (verifier shim), `tests/resolver-vs-python.ts` (property-test gate).

---

### ADR-7 — Hooks-as-TOML-Strings (Threat Model)

**Status:** Accepted.

**Context.** v6.5 hook surfaces (`on_complete`, `activation_steps_*`) hold shell command strings. Studio could execute them or just author them.

**Decision.** **bmad-studio authors and visualises hook commands; never executes them.** The shell command runs in the user's IDE on workflow completion (Claude Code, Cursor, etc.). Studio's UI surfaces the resolved command verbatim with a clear warning. No `eval`, no `Function()`, no subprocess invocation of hook commands by studio.

**Consequences.**
- (+) Studio's threat model stays strictly local (NFR-SEC-4).
- (+) Decouples studio from BMAD execution — studio remains "configures and visualises".
- (−) Studio can't preview hook side-effects. Acceptable — that's the IDE's job.

**Affects.** E35 (hooks palette UI), all hook-related FRs.

---

### ADR-8 — Resolver Provenance Output Shape (resolves Readiness Item 1)

**Status:** Accepted (new — resolves anticipatory item flagged in readiness report).

**Context.** FR20 requires the customize editor to show "which layer did this field come from?" The base resolver (ADR-2) emits a flat merged JSON; provenance is an additive output, not a replacement.

**Decision.** The resolver exposes an **opt-in second mode** that returns merged data **plus** a parallel provenance map:

```ts
type Resolved<T> = {
  merged: T
  provenance: Record<string, LayerOrigin> // dotted path → origin
}

type LayerOrigin = 'base' | 'team' | 'user' | 'merged'
```

Example for `bmad-agent-pm`:

```jsonc
{
  "merged": { "icon": "📋", "principles": ["P1", "P2", "P3"], "menu": [/* ... */] },
  "provenance": {
    "icon": "team",
    "title": "base",
    "principles": "merged",
    "menu[0].description": "user"
  }
}
```

**Why dotted-path keys?** Trivially serialisable, no recursive walk in React. The customize editor reads `provenance[fieldPath]` to color-code each row.

**Why `'merged'` for combined arrays?** Honest. Arrays can have entries from multiple layers (append rule).

**Consequences.**
- (+) UI rendering is one lookup per field; no traversal.
- (+) The `merged` object stays unchanged — backward-compatible with read-path callers.
- (+) Trivially serialisable over the WS for live updates.
- (−) Slightly larger response payload; offset by being lazy — only requested when the editor is open.

**Affects.** E32 (resolver), E33 (read-only editor UI), `v65/customize-resolver.ts`, `v65/agent-adapter.ts`, shared types.

---

### ADR-9 — Hook Disable On-Disk Representation (resolves Readiness Item 2)

**Status:** Accepted (new).

**Context.** FR34 requires the user to be able to disable an existing hook entry without deleting it. Two options were considered: TOML comment-out, or an explicit boolean field.

**Decision.** **Explicit `disabled = true` boolean field on each hook entry.** Hook entries are modelled internally as `{ command: string, disabled?: boolean }`. The resolver sees disabled entries as inert.

```toml
[workflow]
on_complete = [
  { command = "bash _bmad/custom/scripts/llm-wiki-ingest.sh prd" },
  { command = "bash _bmad/custom/scripts/jira-sync.sh", disabled = true },
]
```

**Why not TOML comment-out?** Comments aren't structured (no machine-readable disable reason), don't survive round-trips through `smol-toml`, and require text manipulation to re-enable.

**Forward-compat.** Today `on_complete` is a scalar string in BMAD's `customize.toml`; per ADR-4 + FR36, studio models it as `string[]` internally. When BMAD lands array support (issue #2311 thread, jrevillard's proposal), studio's `disabled`-flag model continues to work.

**Until BMAD supports arrays:** studio collapses enabled entries into a single `&&`-joined scalar at write time, and stores the structured array as a sidecar comment block (`# bmad-studio:hook-state` lines) that studio re-parses on next read.

**Consequences.**
- (+) Disable/enable is a single boolean toggle.
- (+) Graceful degrade for current scalar `on_complete`; clean when BMAD supports arrays.
- (−) Sidecar-comment fallback is mildly hacky; lifetime is short (until #2311 lands).

**Affects.** E35 (hook authoring UI), `v65/hook-template-registry.ts`, customize-resolver hook handling.

---

### ADR-10 — Drift→Override Conversion Contract (resolves Readiness Item 3)

**Status:** Accepted (new).

**Context.** FR39 lets a user convert a drifted base file into a sanctioned customize.toml override. The drift detector and the customize editor must share a typed payload for this multi-step flow.

**Decision.** A typed `DriftConversion` payload travels via REST and is opened via a deep-link query parameter:

```ts
type DriftConversion = {
  skillName: string
  filePath: string
  expectedHash: string
  actualHash: string
  diff: {
    added: string[]
    removed: string[]
    unifiedDiff: string
  }
  proposedOverride?: {
    surface: 'agent' | 'workflow'
    field: string  // typed against the customize.toml schema
    value: unknown
  }
}
```

**Flow.**

1. User clicks **Convert to override** in the drift list view.
2. Backend computes `proposedOverride` heuristically (if the diff lands in a single field of the merged customize.toml, propose that field; otherwise leave unset).
3. Frontend navigates to `/skills/<skillName>/customize?from-drift=<token>`; the customize editor's open handler retrieves the cached `DriftConversion` payload by token, pre-populates the Team-layer pane with the proposed override, shows the diff inline.
4. User reviews, optionally edits, confirms via the standard diff-confirm dialog. Save proceeds via the normal write path (ADR-5).

**Why a token-cached payload, not URL-embedded?** Diff text exceeds query-string length limits. Token TTL: 5 minutes; cleared on save.

**Heuristic limitations.** Some drifts can't be cleanly mapped to a single override field. In that case `proposedOverride` is undefined; UI shows "couldn't auto-propose" and offers raw-edit fallback.

**Consequences.**
- (+) Typed contract — one schema, two consumers (drift list, customize editor).
- (+) Token-based payload survives navigation without URL bloat.
- (−) Heuristic propose-step doesn't always succeed — explicit graceful fallback in UX.

**Affects.** E36 (drift detector), E33/E34 (customize editor), shared types, REST API new endpoint `/api/drift/conversions/<token>`.

---

### ADR-11 — Hook Template Registry Shape (resolves Readiness Item 4)

**Status:** Accepted (new).

**Context.** FR30 + FR33 require studio to ship a small set of hook templates. Templates declare params; render produces the TOML value; some templates ship supporting scripts.

**Decision.** Templates implement a typed `HookTemplate` interface, registered in a singleton map at module load:

```ts
import { z } from 'zod'

interface HookTemplate<P = unknown> {
  id: string
  label: string
  description: string
  surfaces: HookSurface[]   // ('on_complete' | 'activation_steps_*')[]
  paramSchema: z.ZodSchema<P>
  render(params: P, context: HookContext): string
  scriptTemplate?: {
    sourcePath: string  // path inside studio's bundle
    destPath: string    // path under _bmad/custom/scripts/
  }
  docsUrl?: string
}

type HookSurface = 'on_complete' | 'activation_steps_prepend' | 'activation_steps_append'
type HookContext = { skillName: string, workflowName: string, projectRoot: string }
```

**Registry:**

```ts
const HOOK_TEMPLATES = new Map<string, HookTemplate>([
  ['raw-shell', rawShellTemplate],
  ['slack-post', slackPostTemplate],
  ['git-tag', gitTagTemplate],
  ['run-tests', runTestsTemplate],
  ['llm-agent-ingest', llmAgentIngestTemplate],
  // ['browse-external-repo', ...] — stretch, see PRD § Cuts
])
```

**Why Zod?** Schemas double as runtime validators *and* form generators. The customize editor's parameter form auto-generates from the schema.

**Why a singleton map (vs DB)?** bmad-studio is filesystem-only. Templates are bundled with the studio binary.

**Forward-compat for module-shipped templates (post-#2311).** When DEPT (or any org) ships a `bmad-method-dept-integrations` repo with module-level templates, studio loads them by scanning a known subdirectory at startup and merging into the registry. The interface stays the same; the scan is opt-in via config.

**Consequences.**
- (+) Templates are testable in isolation (one render fn, one schema, one optional script path).
- (+) Adding a new template is one file + one registry line.
- (+) Auto-detect of LLM agent (`claude` → `codex` → `opencode`) lives inside the script template, not in the studio runtime — keeps studio vendor-neutral.
- (−) Zod adds a small runtime cost; offset by reusing schemas for both validation and form generation.

**Affects.** E35 (hook palette UI), `v65/hook-template-registry.ts`, `v65/templates/*.ts`.

---

### Important Decisions (Follow from ADRs)

#### WebSocket Event Protocol (NFR-INT-3)

```ts
type WsEvent =
  | { type: 'manifest:changed', data: { modules: string[] } }
  | { type: 'skill-manifest:changed', data: { count: number } }
  | { type: 'customize:changed', data: { skillName: string, layer: 'team' | 'user' } }
  | { type: 'drift:detected', data: { count: number } }
  | { type: 'drift:cleared', data: { skillName: string } }
  | { type: 'health:python-changed', data: { available: boolean } }
```

All events are JSON-serialisable, single-line, namespaced `<noun>:<event>`. Versioning: when the protocol changes, bump a single `protocolVersion` field on the WS handshake.

#### Python IPC Contract (ADR-6, NFR-SEC-3)

```ts
async function verifyMerge(
  skillRoot: string,
  key: 'agent' | 'workflow',
): Promise<
  | { ok: true, merged: object }
  | { ok: false, reason: 'missing' | 'timeout' | 'mismatch' | 'parse-error', detail?: string }
>
```

Implementation: `child_process.spawn('python3', ['_bmad/scripts/resolve_customization.py', '--skill', skillRoot, '--key', key])` with:

- 5-second `AbortController` timeout (NFR-PERF-5).
- Both `stdout` and `stderr` piped and consumed (NFR-INT-2).
- Path arguments `path.resolve()`d and validated to stay within project root (NFR-SEC-3).
- `spawn` arg array, never `exec` with shell quoting.

#### Cache Topology (ADR-5 detail)

| Cache | Type | Key | Invalidation trigger |
|---|---|---|---|
| Module list | In-memory `Map<projectRoot, ModuleListResponse>` | `projectRoot` | `manifest.yaml` change |
| Skill index | In-memory `Map<projectRoot, SkillIndex>` | `projectRoot` | `skill-manifest.csv` change |
| Per-skill parsed | In-memory `Map<skillId, ParsedSkill>` LRU (max 100) | `skillId` | watcher event on `_bmad/<...>/<skill>/` or `_bmad/custom/<skill>.{toml,user.toml}` |
| File hash baseline | `_bmad-output/.cache/v65-index.json` | SHA-256 of `files-manifest.csv` | `files-manifest.csv` change |
| Drift state | In-memory `Set<filePath>` | `filePath` | hash recompute on watcher event |

### Decision Impact Analysis

**Implementation sequence (mirrors PRD § Project Scoping critical path):**

1. **E31:** ADR-1, ADR-3, ADR-5 (Tier 2 cache only) → `manifest-loader`, `module-loader` facade, version detection.
2. **E32:** ADR-2, ADR-4, ADR-6 (TS impl), ADR-8 → `customize-resolver`, `config-resolver`, `agent-adapter`, `workflow-adapter`, property-test gate.
3. **E33:** ADR-8 (UI consumption) → customize editor read pane.
4. **E34:** ADR-5 (Tier 1 cache + invalidation), ADR-6 (Python verify), Python IPC Contract, WS Event Protocol → customize editor write pane.
5. **E35:** ADR-7, ADR-9, ADR-11 → hooks palette + template registry.
6. **E36:** ADR-10 → drift detector + convert-to-override flow.

**Cross-component dependencies:**

- E32's resolver primitives (ADR-2) are required by E33, E34, E35, E36. **Hardest single dependency in the whole cycle.**
- E34's atomic write helper is reused by E35 and E36's convert flow.
- E34's WS broadcast mechanism is reused by E36's drift events.
- ADR-11's `HookTemplate` interface is the contract that DEPT's `bmad-method-dept-integrations` repo will conform to (post-#2311).

## Implementation Patterns & Consistency Rules

These rules guide AI agents implementing the v6.5 migration so multiple agents working in parallel produce consistent, compatible code. 11 critical conflict points have been identified and locked.

### Naming Patterns

#### TypeScript File and Module Naming

- **Files:** `kebab-case.ts` for modules, `PascalCase.tsx` for React components. Existing repo convention; no change.
- **Test co-location:** `<file>.test.ts` next to `<file>.ts`. Existing repo convention.
- **`v65/` subdirectory:** all new server-side v6.5 code lives at `packages/server/src/v65/`. NFR-MAINT-1 mandates this. Examples:
  - `v65/manifest-loader.ts` (E31)
  - `v65/customize-resolver.ts` (E32)
  - `v65/config-resolver.ts` (E32)
  - `v65/agent-adapter.ts` (E32)
  - `v65/workflow-adapter.ts` (E32)
  - `v65/python-bridge.ts` (E34)
  - `v65/drift-detector.ts` (E36)
  - `v65/hook-template-registry.ts` (E35)
  - `v65/templates/<template-id>.ts` (E35, one file per template)
  - `v65/types.ts` (shared v6.5-internal types; non-shared types stay private to each module)
- **No `v65/` on the client side.** Client code follows existing component organisation under `packages/client/src/components/<feature>/`.

#### TypeScript Identifier Naming

- **Functions:** `camelCase` (`resolveLayered`, `verifyMerge`, `detectVersion`).
- **Types/interfaces:** `PascalCase` (`HookTemplate`, `DriftConversion`, `ParsedSkill`).
- **Type union members:** `kebab-case` string literals for ids (`'slack-post'`); `snake_case` for BMAD-protocol surfaces (`'on_complete'`, `'activation_steps_prepend'`). Match the upstream BMAD spelling exactly.
- **Constants:** `UPPER_SNAKE_CASE` only for module-level frozen config (`HOOK_TEMPLATES`, `WS_PROTOCOL_VERSION`). Otherwise `camelCase`.

#### File-System Path Naming (the BMAD Side)

- **Override files:** `_bmad/custom/<skill-name>.toml` (team) or `<skill-name>.user.toml` (personal). `<skill-name>` matches the BMAD canonical id from `skill-manifest.csv` exactly.
- **Hook scripts:** `_bmad/custom/scripts/<purpose>.sh`. Example: `llm-wiki-ingest.sh`, not `llm_wiki_ingest.sh` and not `llmWikiIngest.sh`.
- **Cache files:** `_bmad-output/.cache/v65-index.json`. Single file, JSON; not a directory tree.
- **Tmp files for atomic writes:** `<destination>.<random>.tmp` (the random suffix prevents concurrent-save collisions). Cleaned up immediately on rename success.

### Format Patterns

#### REST Endpoint Conventions

bmad-studio's REST API is private to its own client. New v6.5 endpoints follow the existing convention:

| Pattern | Example | Notes |
|---|---|---|
| Plural resource | `/api/skills`, `/api/modules`, `/api/drift` | Match existing routes |
| Resource by id | `/api/skills/:id` | `:id` is the canonical skill name from `skill-manifest.csv` |
| Verb-suffix for actions | `/api/customize/:skillName/verify` | Verify is an action, not a sub-resource |
| Token-based deep payloads | `/api/drift/conversions/:token` | Per ADR-10; 5-min TTL |

New v6.5 endpoints to add:

- `GET /api/skills/:id/customize` — returns `{ base, team, user, merged, provenance }`
- `PUT /api/skills/:id/customize` — body `{ layer: 'team' | 'user', toml: string }`; atomic write
- `POST /api/skills/:id/customize/verify` — invokes Python verifier
- `GET /api/workflows/:id/hooks` — returns hook surfaces with templates resolved
- `PUT /api/workflows/:id/hooks` — atomic write
- `GET /api/drift` — list of drifted files
- `GET /api/drift/conversions/:token` — typed `DriftConversion` payload

#### JSON Field Naming

**`camelCase` for all studio-internal API fields.** This matches the existing studio convention. BMAD's TOML field names (`activation_steps_prepend`, `on_complete`, `persistent_facts`) stay verbatim *as keys* on the wire when they represent BMAD protocol fields — do not translate to camelCase. Studio's UI may display them with friendlier labels, but the underlying field name on the wire mirrors BMAD.

#### Error Envelope

Existing studio convention for error responses:

```ts
type ApiError = {
  error: {
    code: string        // 'not-found', 'parse-error', 'verifier-failed'
    message: string     // user-facing, single-line
    detail?: string     // technical detail (stack trace, stderr, etc.)
  }
}
```

New error codes introduced in this cycle: `manifest-missing`, `skill-not-customizable`, `customize-parse-error`, `verifier-unavailable`, `verifier-mismatch`, `verifier-timeout`, `drift-conversion-stale`.

#### TOML Round-Trip Convention

When studio reads a `customize.toml`, edits it, and writes it back:

- Use `smol-toml.parse()` → modify the JS object → `smol-toml.stringify()`. Never string-manipulate TOML directly.
- Comments and original whitespace **are not preserved** through the round trip. Document this in NFR-MAINT-4 deviation note: users who hand-edit `customize.toml` for specific formatting should be aware studio normalises it.
- For ADR-9 sidecar comments (`# bmad-studio:hook-state`), studio appends them post-stringify in a deterministic order. Round-trip stability test: parse → stringify → parse again must produce the same in-memory object.

### Communication Patterns

#### WebSocket Event Naming

`<noun>:<event>` lowercase kebab-case. Already established in studio; new events follow:

- `manifest:changed`
- `skill-manifest:changed`
- `customize:changed`
- `drift:detected`
- `drift:cleared`
- `health:python-changed`

**Forbidden:** PascalCase event names (`ManifestChanged`), single-word events (`update`), event names that don't include the noun being updated.

#### WebSocket Event Payloads

- **Always serialisable JSON** (no `Date` objects, no `BigInt`, no `Map`/`Set`). Dates as ISO 8601 strings; large numbers as strings if needed.
- **Single-line in-flight** (no nested newlines for human readability — the React client doesn't need them).
- **Type registry centralised** at `packages/shared/src/ws-events.ts` (new file). All event types defined here; both server and client import from here. Single source of truth.

#### State Update Patterns (React Client)

- **Immutable updates** for all React state. Use `immer` if a mutation pattern would clarify the code; otherwise prefer plain spread.
- **WS event → React Query invalidation.** New WS events trigger `queryClient.invalidateQueries(...)` rather than directly mutating local state. The query refetches; React re-renders.
- **No client-side polling** anywhere in this cycle. All change-driven UI updates go through WS events.

### Process Patterns

#### Error Handling

- **Fail loud at boundaries**, fail soft within a request. If `customize.toml` for skill A fails to parse, skill A renders with an error indicator; skills B–Z still render. NFR-REL-5.
- **Retries:** chokidar event handlers retry once with 250 ms backoff if a file is mid-write (EBUSY/EACCES); after that, log and skip.
- **Python verifier failures:** never block the write. Log the reason, surface in the verify badge, allow user to proceed.
- **Logged once at the boundary, never re-thrown to the request handler unchanged.** Wrap stdlib errors in studio's `ApiError` shape before they hit the response.

#### Loading States

- **Suspense for code-split chunks** (CodeMirror, hook templates) — already established pattern.
- **`isLoading` on every async hook return** that the UI cares about.
- **Optimistic updates only on customize editor saves** — show the new merged result immediately, roll back if the server response indicates the write failed.

### Cross-Cutting Concern Patterns

#### Atomic Write Helper

A single helper at `core/atomic-write.ts` (or under `v65/`) used by every write surface:

```ts
async function atomicWrite(destPath: string, contents: string): Promise<void> {
  const tmpPath = `${destPath}.${randomSuffix()}.tmp`
  await fs.writeFile(tmpPath, contents, 'utf-8')
  await fs.rename(tmpPath, destPath)
}
```

E34 (customize editor write), E35 (hook palette write), and E36 (drift convert-to-override) all use this helper. No copy-paste tmp-file logic anywhere else.

#### Python Detection at Startup

- One probe at server boot, result cached on the `App` instance (`app.pythonResolverAvailable: boolean`).
- Re-probe on `SIGUSR1` (or via `/api/health/recheck`) — supports the case where the user installs Python after starting studio.
- Surface via `/api/health` (NFR-OBS-4).

#### Logging Format

Existing studio convention: `pino` JSON logs with `{ level, event, ...data }`. New v6.5 events:

- `event: 'v65.manifest.loaded'` `{ projectRoot, skillCount, ms }`
- `event: 'v65.cache.invalidated'` `{ key, trigger }`
- `event: 'v65.verifier.invoked'` `{ skillName, ms, ok }`
- `event: 'v65.drift.detected'` `{ count, files }`
- `event: 'v65.hook.written'` `{ skillName, layer, templateId }`

NFR-OBS-1 mandates one structured line per event.

### Enforcement Guidelines

**All AI agents implementing v6.5 stories MUST:**

1. Place new server-side code under `packages/server/src/v65/`. Never edit `parsers/*.ts` or `core/module-registry.ts` v6 paths in this cycle.
2. Use `smol-toml` exclusively for TOML reads/writes — never `@iarna/toml`, never string manipulation.
3. Use the `atomicWrite` helper for every write to `_bmad/custom/`. Never `fs.writeFile` directly to that tree.
4. Use the centralised WS event registry (`packages/shared/src/ws-events.ts`). Never invent new event names ad-hoc.
5. Test Python-bridge code paths with both `python3` available and absent (use the no-Python CI lane).
6. Property-test resolver code against `resolve_config.py`/`resolve_customization.py` at ≥1000 fast-check iterations on every PR touching `v65/customize-resolver.ts` or `v65/config-resolver.ts`.

**Anti-patterns to reject in code review:**

- ❌ String-manipulating TOML to "preserve comments" — round-trip via `smol-toml`.
- ❌ Polling endpoints from the React client to detect changes — use WS events.
- ❌ Hardcoding `'python3'` paths or shell-quoting Python args in `exec` — use `spawn` arg array.
- ❌ Catching errors and silently returning empty objects — fail loud at boundaries.
- ❌ Adding new files to `packages/server/src/parsers/` for v6.5-specific logic — that's `v65/`.
- ❌ Treating `customize.toml` as a free-form text file — it's structured TOML 1.1.

## Project Structure & Boundaries

### Complete Project Directory Structure (Cycle 5 additions)

The full v6.5-additions tree, per epic. Existing files are unchanged unless noted.

#### Server (`packages/server/src/`)

```
packages/server/src/
├── core/
│   ├── module-loader.ts                    [NEW — E31] Strangler facade
│   ├── module-registry.ts                  [extended — E31] v65 awareness
│   ├── file-store.ts                       [extended — E31] v65-index.json cache
│   ├── websocket.ts                        [extended — E34] new event types
│   └── atomic-write.ts                     [NEW — E34] tmp-then-rename helper
├── parsers/                                (existing — kept as-is for v6 path)
├── plugins/
│   ├── modules-plugin.ts                   [extended — E31] uses ModuleLoader.load
│   ├── skills-plugin.ts                    [extended — E33] exposes /api/customize
│   └── drift-plugin.ts                     [NEW — E36]
├── v65/                                    [NEW — entire dir is this cycle]
│   ├── manifest-loader.ts                  [E31]
│   ├── customize-resolver.ts               [E32]
│   ├── config-resolver.ts                  [E32]
│   ├── agent-adapter.ts                    [E32]
│   ├── workflow-adapter.ts                 [E32]
│   ├── python-bridge.ts                    [E34]
│   ├── drift-detector.ts                   [E36]
│   ├── hook-template-registry.ts           [E35]
│   ├── templates/
│   │   ├── raw-shell.ts                    [E35]
│   │   ├── slack-post.ts                   [E35]
│   │   ├── git-tag.ts                      [E35]
│   │   ├── run-tests.ts                    [E35]
│   │   ├── llm-agent-ingest.ts             [E35]
│   │   └── scripts/                        [E35]
│   │       └── llm-wiki-ingest.sh.template
│   └── types.ts                            [E32+]
└── tests/
    ├── resolver-vs-python.ts               [E32] property-based equivalence
    ├── no-python-lane.test.ts              [E32, E34]
    └── fixtures/
        ├── v6/                             (existing)
        └── v65/                            [E31] symlink → docs/_bmad_v6.5/
```

#### Shared types (`packages/shared/src/`)

```
packages/shared/src/
├── types/
│   ├── Skill.ts                            [extended — E32]
│   ├── Agent.ts                            (existing)
│   └── Customize.ts                        [NEW — E32] CustomizeBlock, Resolved, LayerOrigin
├── ws-events.ts                            [NEW — E34] central WS event registry
└── api-shapes.ts                           [extended — E33+]
```

#### Client (`packages/client/src/`)

```
packages/client/src/
├── components/
│   ├── customize-editor/                   [NEW — E33, E34]
│   │   ├── CustomizeEditor.tsx
│   │   ├── LayerPane.tsx
│   │   ├── MergedPane.tsx
│   │   ├── DiffConfirmDialog.tsx
│   │   └── VerifyBadge.tsx
│   ├── hooks-palette/                      [NEW — E35]
│   │   ├── HooksTab.tsx
│   │   ├── TemplatePalette.tsx
│   │   ├── ParameterForm.tsx
│   │   └── HookEntryRow.tsx
│   └── drift-badge/                        [NEW — E36]
│       ├── DriftBadge.tsx
│       ├── DriftListView.tsx
│       └── DriftConvertFlow.tsx
├── hooks/
│   ├── use-ws-events.ts                    [extended — E34]
│   ├── use-customize.ts                    [NEW — E33]
│   ├── use-hooks-palette.ts                [NEW — E35]
│   └── use-drift.ts                        [NEW — E36]
└── pages/
    └── ...existing (extended with new tabs and views per epic)
```

### Sequence Diagrams

#### Read Path — Modules List (E31, happy path)

```
User opens studio
       ↓
React: GET /api/modules
       ↓
modules-plugin.ts → ModuleLoader.load(projectRoot)
       ↓
detectVersion(_bmad/) → 'v65'
       ↓
v65/manifest-loader.ts:
       check Tier 1 in-memory cache
       miss → check Tier 2 _bmad-output/.cache/v65-index.json
       verify hash matches files-manifest.csv hash
       if match: hydrate Tier 1, return
       if mismatch: read _config/manifest.yaml + skill-manifest.csv
                    parse via js-yaml + papaparse
                    populate Tier 1, write Tier 2, return
       ↓
Response: { modules: [{ name, version, source, ... }, ...] }
       ↓
React renders modules list
```

**Invariants:** cold path <50 ms (NFR-PERF-1) for a 40-skill install; hot path ~1 ms; v6 path untouched.

---

#### Write Path — Customize Editor Save (E34)

```
User edits Team layer in customize editor, clicks Save
       ↓
React shows DiffConfirmDialog → user confirms
       ↓
React: PUT /api/skills/<id>/customize  body: { layer: 'team', toml: '...' }
       ↓
skills-plugin.ts handler:
       smol-toml.parse(body.toml)              [reject on parse error → 400]
       atomic-write.ts: tmp → rename → _bmad/custom/<skill>.toml
       ↓
chokidar event fires (awaitWriteFinish + 150ms debounce)
       ↓
File watcher invalidates Tier 1 cache entry for this skillId
       ↓
WS broadcast: { type: 'customize:changed', data: { skillName, layer: 'team' } }
       ↓
Server response: 200 { ok: true }
       ↓
React: optimistic merged-pane update; confirmed by next read
       ↓
React: POST /api/skills/<id>/customize/verify   [if Python available]
       ↓
v65/python-bridge.ts: spawn('python3', [resolve_customization.py, '--skill', ..., '--key', 'agent'])
       5-second AbortController timeout
       stdout = JSON, stderr captured
       ↓
Server response: { ok: true, merged: {...} } | { ok: false, reason, detail }
       ↓
React: VerifyBadge → green (ok), amber (Python unavailable), red (mismatch)
```

**Invariants:** atomic write (NFR-REL-1); works without Python (NFR-REL-4, FR45); <2 s p95 round-trip (NFR-PERF-3).

---

#### Drift Scan (E36)

```
Server boot OR chokidar event on _bmad/_config/files-manifest.csv
       ↓
v65/drift-detector.ts:
       read files-manifest.csv via papaparse
       for each row { path, expectedHash }:
           stream file contents through crypto.createHash('sha256')
           compare with expectedHash
       collect divergent files into Set<filePath>
       ↓
If diff vs prior state:
   WS broadcast: { type: 'drift:detected', data: { count } }
                 or { type: 'drift:cleared', data: { skillName } }
       ↓
React DriftBadge updates header count
       ↓
User clicks badge → /api/drift returns Set<filePath> with per-file diff metadata
       ↓
User clicks "Convert to override" → POST /api/drift/conversions  body: { filePath }
       ↓
Backend computes DriftConversion payload (per ADR-10), caches under token, 5-min TTL
       ↓
React navigates to /skills/<skillName>/customize?from-drift=<token>
       ↓
CustomizeEditor open handler GET /api/drift/conversions/<token>
       Pre-populates Team-pane with proposedOverride; shows diff inline
       ↓
User reviews, confirms via DiffConfirmDialog → write path (above)
```

**Invariants:** full scan <200 ms (NFR-PERF-4); never modifies the drifted file (NFR-REL-3); allow-list only (FR41).

---

#### Hook Authoring (E35)

```
User opens workflow detail page → Hooks tab
       ↓
React: GET /api/workflows/<id>/hooks
       ↓
skills-plugin.ts handler:
       Read merged customize.toml via v65/customize-resolver.ts (3-layer + provenance)
       Parse [workflow] block → activation_steps_*, on_complete
       ADR-9 deserialiser: sidecar comments → structured hook entries (string[])
       ↓
Response: { activationStepsPrepend, activationStepsAppend, onComplete }
       ↓
HooksTab renders three rows; each row a list of HookEntryRow components
       User clicks "+" on on_complete → TemplatePalette opens
       User picks 'llm-agent-ingest' → ParameterForm renders from Zod schema
       User fills params (e.g., kind='prd') → confirms
       ↓
React: hookTemplate.render(params, context) → e.g.:
       "bash {project-root}/_bmad/custom/scripts/llm-wiki-ingest.sh prd"
       ↓
React: PUT /api/workflows/<id>/hooks  body: { surface: 'on_complete', entries: [...] }
       ↓
skills-plugin.ts:
       ADR-9 serialiser: collapse enabled entries to '&&'-joined scalar; emit sidecar comments
       atomic-write.ts → _bmad/custom/<workflow>.toml
       if hookTemplate.scriptTemplate: copy bundled script template → _bmad/custom/scripts/<destPath>
       chokidar event → cache invalidate → WS broadcast
       ↓
Server response: 200
```

**Invariants:** ADR-7 (studio never executes); ADR-9 (sidecar serialisation until #2311); FR33 (script templates copied automatically, never overwritten).

### Architectural Boundaries

#### REST API Boundaries (new in this cycle)

| Endpoint | Method | Owner | Cycle |
|---|---|---|---|
| `/api/skills/:id/customize` | GET | `skills-plugin.ts` → `v65/customize-resolver.ts` | E33 |
| `/api/skills/:id/customize` | PUT | `skills-plugin.ts` → `core/atomic-write.ts` | E34 |
| `/api/skills/:id/customize/verify` | POST | `skills-plugin.ts` → `v65/python-bridge.ts` | E34 |
| `/api/workflows/:id/hooks` | GET | `skills-plugin.ts` → `v65/customize-resolver.ts` + `hook-template-registry.ts` | E35 |
| `/api/workflows/:id/hooks` | PUT | `skills-plugin.ts` → `core/atomic-write.ts` | E35 |
| `/api/drift` | GET | `drift-plugin.ts` → `v65/drift-detector.ts` | E36 |
| `/api/drift/conversions/:token` | GET | `drift-plugin.ts` (token cache, 5-min TTL) | E36 |
| `/api/drift/conversions` | POST | `drift-plugin.ts` (compute payload, return token) | E36 |
| `/api/health` | GET | extended in `app.ts` to report Python/CLI/watcher status | E34 (NFR-OBS-4) |

#### Component Boundaries (Server)

- `core/module-loader.ts` is the **only** caller of `detectVersion`. Every other plugin asks `ModuleLoader.load(projectRoot)` and gets the right adapter back.
- `v65/customize-resolver.ts` is the **only** server-side place that implements the four merge rules.
- `core/atomic-write.ts` is the **only** module that performs writes to `_bmad/custom/`.
- `v65/python-bridge.ts` is the **only** module that spawns subprocesses. Hook execution remains forbidden (ADR-7).
- `core/websocket.ts` is the **only** module that emits WS events. Other modules call `ws.broadcast({ type, data })` with a typed event from the central registry.

#### Component Boundaries (Client)

- `hooks/use-customize.ts` is the **only** React hook that calls `/api/skills/:id/customize`. Components never `fetch` directly.
- `hooks/use-ws-events.ts` is the **only** hook that subscribes to the WS. Per-feature hooks (`use-customize`, `use-drift`, `use-hooks-palette`) consume the central stream and filter for their event types.
- The customize editor's three layer panes share a single `LayerPane` primitive. Base/Team/User differentiation is a prop, not a component split.

#### Data Boundaries

- **Read-only filesystem boundary:** `_bmad/<module>/` (NFR-REL-3).
- **Read-write filesystem boundary:** `_bmad/custom/` and `_bmad-output/.cache/` only.
- **Cross-process boundary:** Python (optional) gets path arguments only — never user-supplied TOML or shell strings.
- **Network boundary:** none — no outbound HTTP from the studio process.

### Requirements to Structure Mapping

| Epic | Capability area (from PRD) | Server files | Client files |
|---|---|---|---|
| **E31** | Format Detection & Loading | `core/module-loader.ts`, `core/module-registry.ts` (ext), `v65/manifest-loader.ts`, `core/file-store.ts` (ext) | (existing module list view; reuses) |
| **E32** | Skill & Agent Rendering, Layer Resolution | `v65/customize-resolver.ts`, `v65/config-resolver.ts`, `v65/agent-adapter.ts`, `v65/workflow-adapter.ts`, `v65/types.ts`, `tests/resolver-vs-python.ts`, `tests/fixtures/v65/` | (existing skill/agent views; reuses) |
| **E33** | Customize Editor — Read | `plugins/skills-plugin.ts` (ext, GET /customize) | `components/customize-editor/{CustomizeEditor,LayerPane,MergedPane}.tsx`, `hooks/use-customize.ts` |
| **E34** | Customize Editor — Write, Graceful Degradation (Python) | `plugins/skills-plugin.ts` (ext, PUT/verify), `core/atomic-write.ts`, `core/websocket.ts` (ext), `v65/python-bridge.ts`, `app.ts` (Python probe) | `components/customize-editor/{DiffConfirmDialog,VerifyBadge}.tsx`, `hooks/use-customize.ts` (ext) |
| **E35** | Hooks Authoring | `v65/hook-template-registry.ts`, `v65/templates/*.ts`, `plugins/skills-plugin.ts` (ext, GET/PUT /hooks) | `components/hooks-palette/{HooksTab,TemplatePalette,ParameterForm,HookEntryRow}.tsx`, `hooks/use-hooks-palette.ts` |
| **E36** | Drift Detection | `v65/drift-detector.ts`, `plugins/drift-plugin.ts` | `components/drift-badge/{DriftBadge,DriftListView,DriftConvertFlow}.tsx`, `hooks/use-drift.ts` |
| **All** | Backward Compat (FR42–44) | `core/module-loader.ts` (version detection at the facade) | (zero changes — shared types unchanged) |

### Integration Points

#### Internal Communication

- **Server modules → server modules:** synchronous TypeScript function calls. No internal pub/sub, no message bus.
- **Server → client:** REST for request/response; WebSocket for change events. Both flows JSON-serialised, typed via `packages/shared/`.
- **Client component → client component:** React props for parent-child; React Query cache + WS-event-driven invalidation for cross-tree sync.

#### External Integrations

- **Python 3.11+ (optional):** `child_process.spawn`, JSON over stdout, 5 s timeout. Used by `v65/python-bridge.ts` only.
- **`claude` / `codex` / `opencode` (optional, indirect):** invoked from inside hook scripts (e.g., `llm-wiki-ingest.sh`) at workflow-completion time, not from studio. Studio's role is to author the script, not invoke the CLI.
- **No third-party HTTP services.** Slack/Jira/GitHub/LLM-Wiki are reached via hook scripts running in the user's IDE.

#### Data Flow

```
                                             ┌──────────────────┐
                                             │  user's IDE      │
                                             │  (Claude Code,   │
                                             │   Cursor, etc.)  │
                                             └────────┬─────────┘
                                                      │ runs hook script on
                                                      │ workflow completion
                                                      │
                                                      ↓ (outside studio)
                                             ┌──────────────────┐
                                             │  3rd-party APIs  │
                                             │  Slack, Jira,    │
                                             │  GitHub, LLM     │
                                             │  Wiki, etc.      │
                                             └──────────────────┘
                            authors hook scripts
                                     ↑
┌─────────────┐   REST/WS    ┌───────────────┐    fs     ┌──────────────────┐
│  React      │ ←——————————→ │  Fastify      │ ←———————→ │  filesystem       │
│  client     │              │  server       │           │   _bmad/          │
└─────────────┘              └───────┬───────┘           │   _bmad-output/   │
                                     │ optional spawn    └──────────────────┘
                                     ↓
                             ┌───────────────┐
                             │  python3      │
                             │  resolve_     │
                             │  customization│
                             └───────────────┘
```

### Development Workflow Integration

- **Branch:** `feature/v65-manifest-reader` for E31; subsequent epics get their own feature branches.
- **PR sequencing:** E31 ships and merges first (P0 bug fix). E32 builds on E31's facade. Subsequent epics each their own PR.
- **CI lanes:** existing CI keeps both v6 and v6.5 fixtures green per PR. New no-Python lane added in E34 to enforce graceful degradation.
- **Manual testing:** `docs/_bmad_v6.5/` is the green-field reference fixture; symlinked into `tests/fixtures/v65/`. Smoke test: clone the v6.5 reference, point studio at it, walk through the 5 user journeys (Sarah / Aisha / Maya / Ravi / Kim from the PRD).

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility — 11 ADRs cross-checked.** All ADRs work together; no contradictions:

| Pair | Compatibility check |
|---|---|
| ADR-1 (manifest-as-index) ↔ ADR-5 (cache topology) | ✅ Manifest is the cache key; manifest change invalidates cache wholesale. Coherent. |
| ADR-2 (single TS resolver) ↔ ADR-4 (parameterised layers) | ✅ One function, variable arg count. Same call signature, different layer counts at call sites. Coherent. |
| ADR-2 ↔ ADR-6 (TS-for-read, Python-for-verify) | ✅ TS resolver is the primary; Python is the audit oracle. Property-based tests bridge them. Coherent. |
| ADR-2 ↔ ADR-8 (provenance output) | ✅ Provenance is opt-in second mode; doesn't change `merged` shape. Backward-compatible. |
| ADR-3 (strangler-fig) ↔ ADR-1 | ✅ ADR-3's `v65/` adapter is what reads the manifest per ADR-1; v6 path untouched. Coherent. |
| ADR-5 (cache) ↔ ADR-7 (hooks-as-strings) | ✅ Cache stores parsed hook entries (`{ command, disabled }`), not executed state. Coherent. |
| ADR-7 (hooks-as-strings) ↔ ADR-9 (disable representation) | ✅ Both treat hooks as authored data, not runtime callable code. Disable is a structured boolean on the same data. Coherent. |
| ADR-9 ↔ ADR-11 (template registry) | ✅ Templates produce `{ command, disabled? }` tuples. Templates own the rendering; disable is post-render state. Coherent. |
| ADR-10 (drift→override contract) ↔ ADR-5 | ✅ Drift detector reads cache; conversion flow writes via the customize editor's existing write path. Coherent. |
| ADR-11 (template registry) ↔ ADR-7 | ✅ Templates produce shell command strings; registry is studio-bundled config. Studio still doesn't execute. Coherent. |

**Pattern Consistency.** The 6 pattern groups (Naming, Format, Communication, Process, Cross-Cutting, Enforcement) align with the ADRs — no pattern contradicts a decision. The atomic-write pattern serves ADR-5 (cache invalidation) + ADR-9 (sidecar serialisation). The WS event protocol serves ADR-5 (broadcast on cache change). The Python detection pattern serves ADR-6 (verifier optionality).

**Structure Alignment.** Directory layout (`packages/server/src/v65/`) maps 1:1 to the ADRs. No orphaned ADRs; no orphaned components.

### Requirements Coverage Validation ✅

**Functional Requirements (48 total).** Every FR maps to one or more architectural elements (ADR + file):

| FR group | Coverage |
|---|---|
| FR1–FR7 (Format Detection) | ADR-1, ADR-3, ADR-5; `core/module-loader.ts`, `v65/manifest-loader.ts` |
| FR8–FR12 (Skill & Agent Rendering) | ADR-2, ADR-3; `v65/agent-adapter.ts`, `v65/workflow-adapter.ts`, existing client views |
| FR13–FR17 (Layer Resolution) | ADR-2, ADR-4, ADR-6; `v65/customize-resolver.ts`, `v65/config-resolver.ts`, `v65/python-bridge.ts` |
| FR18–FR22 (Customize Editor — Read) | ADR-8 (provenance); `components/customize-editor/{LayerPane,MergedPane}.tsx` |
| FR23–FR28 (Customize Editor — Write) | ADR-5 (invalidation), ADR-6 (verify); `core/atomic-write.ts`, `v65/python-bridge.ts`, WS protocol |
| FR29–FR36 (Hooks Authoring) | ADR-7, ADR-9, ADR-11; `v65/hook-template-registry.ts`, `v65/templates/*.ts` |
| FR37–FR41 (Drift Detection) | ADR-10; `v65/drift-detector.ts`, `plugins/drift-plugin.ts` |
| FR42–FR44 (Backward Compat) | ADR-3 (strangler-fig); `core/module-loader.ts` (version detection) |
| FR45–FR48 (Graceful Degradation) | ADR-6 (Python optional); runtime detection probe + `/api/health` |

100% coverage. Detailed FR→file mapping is in § Requirements to Structure Mapping.

**Non-Functional Requirements (31 total).** All architecturally addressed:

| NFR category | Architectural mechanism |
|---|---|
| Performance (NFR-PERF-1..6) | ADR-5 cache topology; streaming SHA-256 in `drift-detector`; 5 s `AbortController` in `python-bridge`; chokidar `awaitWriteFinish` |
| Reliability (NFR-REL-1..6) | `core/atomic-write.ts` (REL-1); fail-soft per-skill in resolver (REL-5); WS reconnect logic (REL-6); read-only `_bmad/<module>/` boundary (REL-3) |
| Security (NFR-SEC-1..7) | ADR-7 (no-execute); spawn-arg-array (SEC-3); pre-write smol-toml validation (SEC-6); localhost-bind default (SEC-5) |
| Scalability (NFR-SCALE-1..3) | ADR-1 (lazy-load); LRU cache for per-skill (SCALE-1); linear-time hash scan (SCALE-2) |
| Accessibility (NFR-A11Y-1..3) | shadcn/ui inheritance; verify-badge text labels not just colour (A11Y-3) |
| Integration (NFR-INT-1..4) | chokidar v5 + awaitWriteFinish (INT-1); both-streams-consumed (INT-2); WS protocol versioning (INT-3, INT-4) |
| Maintainability (NFR-MAINT-1..4) | `v65/` directory (MAINT-1); four named merge functions (MAINT-2); v6 frozen (MAINT-3); exact-pinned deps (MAINT-4) |
| Observability (NFR-OBS-1..4) | pino structured logs; cache-invalidate logging; `/api/health` reporting (OBS-4) |

100% NFR coverage with at least one named architectural mechanism per NFR.

### Implementation Readiness Validation ✅

- **Decision Completeness.** All 11 ADRs are accepted with context, decision, consequences, affected components. No "TBD" placeholders. The 4 readiness-report anticipatory items are resolved (ADR-8 to ADR-11).
- **Structure Completeness.** Every new file has an epic owner and a concrete filename. Server `v65/` directory and client component directories are enumerated, not abstract.
- **Pattern Completeness.** Naming, format, communication, process, and cross-cutting patterns each have explicit rules and anti-pattern callouts. Six "MUST" enforcement guidelines.
- **Sequence Diagrams.** Four key flows have explicit step-by-step diagrams (read, write, drift scan, hook authoring). Each ends with named invariants tied to NFRs.
- **Test Strategy.** Property-based equivalence test (`@fast-check/vitest` × ≥1000 iterations vs Python) is the load-bearing CI gate. No-Python lane enforces graceful degradation.

### Gap Analysis Results

🔴 **Critical Gaps:** **0**

🟠 **Important Gaps (resolved before story creation):** **0**
The four anticipatory items from the readiness report (provenance, hook disable, drift→override, template registry) are addressed by ADR-8 through ADR-11.

🟡 **Minor Refinements (deferred to story-creation time, not blocking):** **3**

1. **CodeMirror TOML mode authoring** — the architecture references `@codemirror/language` but doesn't pin which TOML grammar (`tree-sitter-toml` adapter vs hand-rolled Lezer). Decide at the first E33 story; check current npm-published options at that time.
2. **`atomicWrite` location** — Step 5 said "core/atomic-write.ts (or under v65/)". Recommend committing to `core/atomic-write.ts` so existing v6 paths can adopt the same helper if useful. Confirmed at E34's first story.
3. **`zod-to-json-schema` vs hand-rolled form generation** — ADR-11 mentions either as a path. Decide at E35's first story based on the parameter shapes the MVP templates actually need.

None of these block `bmad-create-epics-and-stories`. They're decisions made at the story-of-first-touch.

### Architecture Completeness Checklist

**✅ Requirements Analysis**
- [x] Project context analysed (Step 2)
- [x] Scale and complexity assessed (medium / Internal-dev-tool / brownfield)
- [x] Technical constraints identified (TOML 1.1, four merge rules, Python optional, atomic writes, chokidar protocol, no outbound HTTP)
- [x] Cross-cutting concerns mapped (7 named, each addressed by an ADR)

**✅ Architectural Decisions**
- [x] 7 ADRs locked from research (ADR-1 through ADR-7)
- [x] 4 ADRs added resolving anticipatory items (ADR-8 through ADR-11)
- [x] WS event protocol locked
- [x] Python IPC contract locked
- [x] Cache topology locked

**✅ Implementation Patterns**
- [x] Naming conventions (file, identifier, BMAD-side path)
- [x] REST endpoint conventions
- [x] JSON / TOML round-trip rules
- [x] WebSocket event naming + payload rules
- [x] Error handling + loading states
- [x] Cross-cutting helpers (atomic-write, Python detection, logging)
- [x] 6 enforcement MUSTs + 6 anti-patterns

**✅ Project Structure**
- [x] Server `v65/` directory enumerated (10 files)
- [x] Shared types extensions enumerated (3 files)
- [x] Client component directories enumerated (3 directories, 12 files)
- [x] REST endpoint inventory (9 endpoints)
- [x] Component boundaries (server: 5; client: 3)
- [x] Data boundaries (read-only / read-write / cross-process / network)
- [x] FR → file mapping per epic

**✅ Sequence Diagrams**
- [x] Read path (E31)
- [x] Write path (E34)
- [x] Drift scan (E36)
- [x] Hook authoring (E35)

### Architecture Readiness Assessment

**Overall Status:** ✅ **READY FOR EPIC/STORY CREATION**

**Confidence Level:** **High**

| Reason | Evidence |
|---|---|
| All ADRs grounded in PRD inputs | Each ADR references specific FRs/NFRs in PRD |
| Anticipatory items resolved | ADR-8 through ADR-11 |
| Sequence diagrams cover all critical flows | 4 diagrams; each invariant tied to NFR |
| Test strategy is load-bearing | Property-based equivalence × ≥1000 iterations is the CI gate |
| Brownfield strategy is explicit | Strangler-fig at one entry point; v6 path untouched |

**Key Strengths.**

- **One facade, one resolver, one cache, one write helper, one WS broadcaster.** Every cross-cutting concern has a single owner. AI agents implementing stories cannot duplicate the responsibility by accident.
- **Anti-patterns made explicit.** Six "must reject in code review" callouts mean reviewers don't have to re-derive them per PR.
- **Forward-compat baked in.** ADR-4 (parameterised layers), ADR-9 (disable as boolean ready for arrays), ADR-11 (registry ready for module-shipped templates) all anticipate issue #2311 without committing to its shape.

**Areas for Future Enhancement (post-MVP).**

- Module-shipped hook templates (post-#2311) — the `HookTemplate` interface is already module-loadable; just no scan path defined yet.
- Bidirectional LLM Wiki access via `qmd` + MCP — explicitly deferred per PRD § Vision.
- Full TOML IntelliSense in the customize editor — basic syntax highlighting first; richer support after usability test feedback.
- Multi-project workspace — explicitly out of scope per PRD § Cuts.

### Implementation Handoff

**AI agent guidelines for stories E31 through E36:**

1. Treat `prd-v65-migration.md` as the requirements contract and `architecture-v65-migration.md` as the implementation contract. If they disagree, raise it; don't pick one silently.
2. Follow the Enforcement Guidelines in § Implementation Patterns. Six MUSTs, six anti-patterns. Reject in code review.
3. Build in the order ADRs imply: ADR-1/3/5 first (E31), then ADR-2/4/6/8 (E32), then UI (E33–E36).
4. Property-test `customize-resolver.ts` and `config-resolver.ts` against the Python script every PR. ≥1000 iterations green is the gate.
5. Keep v6 tests green throughout. The strangler-fig design means there should never be a v6 regression, ever.

**First implementation priority:** Branch `feature/v65-manifest-reader`, begin E31 Story 1 (manifest-loader scaffold + `/api/modules` returning real data against `tests/fixtures/v65/`).
