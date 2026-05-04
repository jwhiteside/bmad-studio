# Architecture Notes — Cycle 7 (E42–E48)

**Date:** 2026-05-04
**Status:** Draft — awaiting approval
**Context:** Supplements `architecture.md` and `architecture-v65-migration.md` for new features.

---

## Overview

Cycle 7 is predominantly client-side. The monorepo architecture (client / server / shared) is stable and does not change. Three architectural decisions are recorded here.

---

## ADR-7.1 — Linter engine lives in `@bmad-studio/shared`

**Context:** The project-context linter (E44) runs rules against markdown content. The same engine must be reused by the authoring linters (E47) for agent personas, workflows, and modules. The linter could live in the client, the server, or the shared package.

**Decision:** The linter engine (`packages/shared/src/linter/`) is pure TypeScript with no I/O. It receives a parsed document and returns `LintFinding[]`. It lives in `@bmad-studio/shared` so both client (live inline feedback) and server (future API-based validation) can import it without duplication.

**Consequences:**
- Client runs the linter directly on each edit — no round-trip to server needed.
- Server can expose a `/api/lint` endpoint in a future epic without reimplementing logic.
- Shared package gets a new `linter/` subdirectory. No existing exports are changed.
- All linter rules are declared as data (object array), not functions, so the rule set can be iterated and documented without running them.

---

## ADR-7.2 — Pattern library fetch is a server responsibility

**Context:** Fetching an external git repo (for the pattern library, E45) requires spawning a child process. This is a server-side concern. The client should never spawn processes or manage file system caches.

**Decision:** A new `libraryPlugin` in `packages/server/src/plugins/` handles all fetch, cache, and manifest operations. The client reads templates via REST endpoints (`GET /api/library/templates`, `GET /api/library/templates/:id`).

**Cache location:** `.bmad-studio/library-cache/{library-name}/` — inside the project's Studio config directory, not tracked by git, cleaned on uninstall.

**Auth:** Relies on the system's git environment (SSH agent, `~/.gitconfig` credential helpers). Studio never stores tokens or passwords.

**Consequences:**
- Library state (healthy/cached/broken, last fetch time) is server-managed state, not file-system-derived.
- Server needs a lightweight in-memory store for library status — not persisted, reset on restart.
- Fetch failures degrade gracefully to cached content; the client shows a warning banner only.

---

## ADR-7.3 — Workflow io block: server parses, shared types, client consumes

**Context:** Workflow Visibility (E43) requires knowing each workflow's declared inputs and outputs. This needs a machine-readable `io` block in `workflow.md` frontmatter (plus a markdown-table fallback).

**Decision:**
- The `io` block is parsed by the server's existing `workflow-parser.ts` (extended).
- Parsed inputs/outputs are added to the `Workflow` type in `@bmad-studio/shared`.
- The server adds a `/api/workflows/:id/status` endpoint returning computed readiness (Ready/Blocked/Unknown/Already Run) by resolving declared inputs against the file system.
- The client reads status from the API; it never does file-system checks itself.

**Fallback:** If `io` block is absent, the parser attempts to read the INITIALISATION table from the workflow.md body (best-effort regex). If neither succeeds, status is `unknown`.

**Consequences:**
- `Workflow` type gains `io?: { inputs: WorkflowInput[]; outputs: WorkflowOutput[] }`.
- A new server endpoint computes status on demand (not pre-computed in index) — keeps index-builder simple.
- Status endpoint is file-system read-only; it writes nothing.

---

## What does NOT change

- **Monorepo structure** — packages/client, packages/server, packages/shared unchanged.
- **Fastify plugin architecture** — new features add plugins, none removed.
- **Entity model** — v6 and v6.5 index-builder unchanged.
- **WebSocket / chokidar** — existing real-time infrastructure reused for workflow status live updates.
- **Design system** — existing Tailwind tokens and shadcn/ui components. No new design primitives needed.
- **Project context editor routing** — `/workspace` route redirected to new editor in E44 story 44.1; old WorkspacePage component deleted at that point.
