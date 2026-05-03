---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
inputDocuments:
  - docs/prd.md
  - docs/project-brief.md
  - docs/reference/bmad-studio-spec.md
  - docs/reference/bmad-studio-ia.md
  - docs/design/overview_screen.png
  - docs/design/overview_screen_light_mode.png
  - docs/design/screen.png
  - docs/design/screen_light_mode.png
workflowType: 'architecture'
project_name: 'BMAD Studio'
user_name: 'Jonathan'
date: '2026-03-17'
lastStep: 8
status: 'complete'
completedAt: '2026-03-18'
lastUpdated: '2026-05-02'
updateNotes: 'Added Teams entity (P18), enhanced Workflow model (3 types), CsvViewer shared component, Module CRUD (create/populate/export/remove), team-parser, modules-plugin, teams-plugin. v6.5 entity classification section added 2026-05-02 (E37).'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**

18 feature areas organized by build priority, decomposing into ~70+ discrete requirements:

- **Foundation layer (P1-P3):** Project detection, overview dashboard, markdown editor component, validation engine — these are prerequisites for everything else
- **Entity management (P4-P7):** Agents CRUD + detail + import, skills CRUD + detail + slide-over, skill install/import from multiple sources, skill assignment with drag-and-drop — the core configuration loop
- **Visualization & browsing (P8-P9):** Workflow node graph renderer (react-flow), outputs file browser — comprehension tools for PMs
- **External integration (P10-P11):** Data source CLI orchestration with template-driven setup, workspace structured editor writing to `project-context.md`
- **Distribution & sharing (P12-P14):** Package export/import with conflict resolution, module create/populate/export/remove with manifest management, shared repository browser (reusable component)
- **Creation & utility (P15-P17):** Agent creation wizard, file explorer with inline editing, settings (project + Studio)
- **Teams (P18):** Team definitions (YAML + party CSV), team CRUD, cross-entity references in Overview/Agents/Modules
- **Cross-cutting (7 areas):** Global search (Cmd+K), diff preview on all writes, WebSocket live updates, empty states, notifications, breadcrumbs, keyboard shortcuts

**Non-Functional Requirements:**

| NFR | Target | Architectural Impact |
|---|---|---|
| Startup time | < 2 seconds | Requires cached index with fallback to full scan |
| File tree scan | < 1 second (100-500 files) | In-memory index, incremental updates via watcher |
| UI interactions | Optimistic updates | Client-side state management with server confirmation |
| Validation | < 3 seconds (50+ entities) | Cross-entity reference graph, probably pre-computed |
| Atomic writes | Every write operation | Write pipeline: read → snapshot → tmp → rename → verify |
| File integrity | Never corrupt files | Temp file + atomic rename pattern, history snapshots |
| External change handling | Graceful re-read | Chokidar watching with debounce, full re-parse on change |
| Browser support | Chrome, Firefox, Safari, Edge (latest 2) | Standard React/Vite build target |
| OS support | macOS, Linux, Windows (WSL) | Node.js cross-platform file handling, path normalization |

**Scale & Complexity:**

- Primary domain: Full-stack web application (Node.js + React SPA)
- Complexity level: High
- Estimated architectural components: ~25-30 (server services, API route groups, React page components, shared UI components, core infrastructure)

### Technical Constraints & Dependencies

- **No database** — file system is the only persistent store. All indexes/caches are derived and disposable.
- **BMAD v6 file format** — Studio must parse the current stable BMAD spec. Parsing behind adapters for forward compatibility.
- **Node.js v20+** — enables native fetch, stable test runner, and performance improvements
- **Pre-decided stack:** Express or Fastify, React 18+, Vite, Tailwind CSS, @dnd-kit, react-flow, chokidar, js-yaml, gray-matter
- **Distribution via npx** — must be a self-contained npm package with pre-built client assets bundled alongside the server. The dev experience (Vite HMR + server) and production runtime (server serves static `dist/`) are architecturally different — this split must be designed from day one using a monorepo structure (`server/` + `client/`).
- **External CLI tools for data sync** — not bundled, must be pre-installed by user. Studio checks PATH availability.
- **IDE config format variance** — each IDE (Claude Code, Cursor, Windsurf, GitHub Copilot, VS Code, JetBrains) has different config file paths and formats for MCP/connections
- **`.bmad-studio/` isolation** — all Studio state lives here; no BMAD file modifications for Studio purposes
- **Incremental delivery** — the architecture must support delivering the 17 features in build-priority order as independently deployable vertical slices. Features 1-3 (detection + editor + validation) must stand alone as a usable product. Feature 8 (workflow renderer with react-flow) is the highest-risk UI component.
- **UX specification** — `docs/reference/bmad-studio-ia.md` is the authoritative UX spec, defining all screen layouts, navigation, interaction patterns, and flows. Design mockups in `docs/design/` establish the visual direction.

### Cross-Cutting Concerns Identified

#### Tier 1 — Foundational Infrastructure (build first, everything depends on these)

**1. Reactive File Store**

The defining architectural abstraction. The file-system-as-database paradigm means every service is fundamentally a file I/O service with parsing. This single system unifies:
- **File watching** (chokidar) with aggressive ignore patterns (`.bmad-studio/`, `node_modules/`, `.git/`, build output) and event batching (a `git pull` touching 50 files must not trigger 50 separate WebSocket events)
- **In-memory parsed index** rebuilt from files on startup, updated incrementally on change
- **Write safety pipeline** — read → snapshot to history → apply in memory → diff preview → write `.tmp` → atomic rename → verify
- **WebSocket push** of categorized change events to connected clients
- **Write concurrency handling** — deduplication when Studio's own writes trigger watcher events (feedback loop suppression), and conflict detection when external changes arrive during active Studio editing
- **State ownership model** — the file on disk is always authoritative. The server's in-memory index is a derived cache. The client's local state uses optimistic updates confirmed by server/file state. The synchronization strategy between these three layers must be explicit, especially for the "Open in IDE" escape hatch where users frequently bounce between Studio and their editor.
- **Draft-vs-external conflict resolution** — when a file changes externally while Studio has unsaved draft state in `.bmad-studio/drafts/`, the system must detect the conflict and surface it to the user rather than silently losing either change.

**2. BMAD Parser/Adapter Layer**

A data normalization layer that is effectively Studio's "ORM" in a database-free world. Raw files in 7+ distinct formats → normalized in-memory entities with resolved references:

| Format | Files | Parsing Complexity |
|---|---|---|
| Agent YAML | `*.agent.yaml` | Nested menu items, skill references as file paths, override merging |
| Config YAML | `config.yaml` per module | Variable interpolation (`{project-root}`), module-specific keys |
| Skill MD | `*.md` with frontmatter | Frontmatter extraction, freeform body, suitability hints |
| Workflow directory | `workflow.md` + `steps/`, `*-steps/`, `workflows/` | Three workflow types (step-based, agent-based, composite) with classification precedence. Step variants (`steps-c/`, `steps-e/`, custom `*-steps/`), sub-workflows, templates (`*.template.md`), supporting files. Phase grouping from parent dir `{N}-{name}/` pattern. |
| Team YAML | `*.yaml` in `{module}/teams/` | Bundle metadata (name, icon, description), agent ID list, party CSV resolution. Cross-module party CSV references. |
| Package YAML | `package.yaml` | File path lists, manifest validation, dependency resolution |
| IDE configs | `.claude/settings.json`, etc. | Different JSON schemas per IDE, multi-IDE write support |
| CSV manifests | `*-manifest.csv` | Agent roster, skill listings, file mappings |

Each parser needs: error handling for malformed files, graceful degradation (don't crash on one bad file), incremental re-parse on file change, and resolved cross-entity references (workflows → agents → skills). This layer should be its own module with a stable API and comprehensive test coverage before feature work begins.

#### Tier 2 — Shared UI Infrastructure (build alongside first features)

**3. Markdown Editor Sub-Application**

Not merely a component — a sub-application with its own architecture. Three modes (edit/preview/side-by-side), syntax highlighting with YAML frontmatter awareness, diff generation against last-saved state, draft auto-save, and appearance in 7+ contexts with different surrounding chrome. Key architectural decisions: editor engine choice (CodeMirror vs Monaco), state management (own state vs parent-provided), save communication pattern, and how it integrates with the write safety pipeline.

**4. Layout System**

Slide-over panels (skills detail, workflow step detail, and others), breadcrumb navigation with browser-back support, stacked panel handling, command palette overlay (Cmd+K), and notification system (auto-dismiss success, persistent warnings, expandable errors). The slide-over pattern in particular needs architectural support: coexistence with breadcrumbs, deep navigation within panels, and potential stacking.

**5. Shared Repository Browser**

Reusable import component across Agents, Skills, Workflows, Templates, and Packages screens. Supports git repos (clone/fetch), URLs, local directories, and direct file upload. Must handle preview, search, and one-click import with post-import validation.

**6. CSV Viewer**

Shared component (`CsvViewer.tsx`) for rendering CSV content as an interactive HTML table. Supports two modes: read-only (Outputs browser, team party CSV viewing) and editable (team party CSV editing with inline cell editing). Features: styled header row, alternating row colours, sortable columns, horizontal scroll, sticky header, graceful fallback to raw text on parse failure. Client-side CSV parsing with quoted-field support — no external library needed.

**7. Validation Graph**

Cross-entity reference checking (workflows → agents → skills, teams → agents, data sources → workflow steps). Must be fast enough for on-demand full-project validation (< 3 seconds for 50+ entities) and automatic post-import runs. Includes duplicate step number detection within workflow step directories. Likely requires a pre-computed dependency graph updated incrementally as the file index changes.

## Starter Template Evaluation

### Primary Technology Domain

Full-stack web application: Node.js API server + React single-page application, distributed as a single npm package via `npx bmad-studio`.

### Starter Options Considered

| Option | Approach | Verdict |
|---|---|---|
| Community monorepo templates (fuelstack, etc.) | Pre-built Turborepo + Fastify + Vite React | Rejected — bundles unwanted assumptions (ORMs, tRPC, SSR) |
| Turborepo + Vite scaffolding | Monorepo tooling with build caching | Rejected — overhead not justified for 2-3 package monorepo |
| **npm workspaces + Vite template + manual Fastify** | Lightweight built-in monorepo | **Selected** — minimal tooling, maximum control |

### Selected Approach: npm Workspaces Monorepo

**Rationale:** The project has unique distribution requirements (`npx bmad-studio`) that don't match any existing starter well. A lightweight monorepo with npm workspaces gives us the cross-package linking we need without extra build tooling. The client scaffolds from Vite's official template; the server is clean enough to set up manually.

**Initialization Commands:**

```bash
# Create project root
mkdir bmad-studio && cd bmad-studio
npm init -y

# Scaffold client from Vite's official React + TypeScript template
npm create vite@latest packages/client -- --template react-ts

# Create server and shared packages manually
mkdir -p packages/server/src packages/shared/src
```

**Architectural Decisions Provided by This Approach:**

**Language & Runtime:**
- TypeScript 5.x across all packages (strict mode)
- Node.js v20+ (required by Fastify 5, Vite 8)
- ES Modules (`"type": "module"`) throughout

**Monorepo Structure:**
```
bmad-studio/
  packages/
    client/          # React SPA (Vite 8 + React 18+)
    server/          # Fastify 5 API + WebSocket + file watcher
    shared/          # Shared TypeScript types (API contracts, BMAD entity types)
  package.json       # npm workspaces root
```

**Frontend Stack (client/):**
- Vite 8.0 with Rolldown-based bundler (React plugin v6, Oxc-based React Refresh)
- React 18+ with TypeScript
- Tailwind CSS 4.2 via `@tailwindcss/vite` plugin (no PostCSS config needed)
- @xyflow/react 12.10 for workflow node graph
- @dnd-kit/react 0.3 for drag-and-drop interactions
- CodeMirror 6 for the markdown editor sub-application (modular ~300KB core vs Monaco's 5-10MB, mobile-friendly, tree-shakeable)

**Backend Stack (server/):**
- Fastify 5.8 with TypeScript (types-first, plugin architecture, Node 20+ target)
- @fastify/websocket for live update push
- chokidar for file system watching
- js-yaml for YAML parsing
- gray-matter for markdown frontmatter extraction

**Testing:**
- Vitest 3.1 (native Vite integration, ESM support, Jest-compatible API)
- Fastify's built-in `inject()` for API tests
- Playwright for visual regression testing (on-demand, major releases only)

**Code Quality:**
- ESLint with TypeScript parser
- Prettier for formatting

**Development Experience:**
- Client: Vite 8 dev server with HMR
- Server: tsx watch mode for hot-reload during development
- Production: server serves pre-built client from `packages/client/dist/`

**Distribution Build:**
- Build script compiles server TypeScript + builds client static assets
- Published npm package includes compiled server + client dist
- `npx bmad-studio` entry point starts the Fastify server which serves the SPA

**Note:** Project initialization and monorepo setup should be the first implementation story.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
All made — state management, routing, component architecture, server architecture, error handling, environment configuration.

**Important Decisions (Shape Architecture):**
All made — logging, CSS architecture/design system.

**Deferred Decisions (Post-MVP):**
- CI/CD pipeline — decide at first npm publish
- Performance monitoring — not needed for local single-user tool

### Data Architecture

| Decision | Choice | Rationale |
|---|---|---|
| Database | None — file system only | Core design principle. All state derived from BMAD files on disk. |
| In-memory index | Fastify file-store plugin maintains parsed entity index | Rebuilt from files on startup, updated incrementally via chokidar. Disposable — cached to `.bmad-studio/cache/*.json` for faster startup. |
| Caching | JSON index files in `.bmad-studio/cache/` | Speeds up startup. Fully disposable — regenerated from files if missing or corrupt. |
| Write safety | Atomic pipeline: read → snapshot → tmp → rename → verify | History snapshots capped at 50 in `.bmad-studio/history/`. Every write path uses this service. |
| File change detection | chokidar with aggressive ignore + event batching | Ignore: `.bmad-studio/`, `node_modules/`, `.git/`, build output. Batch rapid changes (git pull) into single index update. Suppress feedback loops from Studio's own writes. |

### Authentication & Security

| Decision | Choice | Rationale |
|---|---|---|
| Authentication | None in v1 | Local-only tool, single user. No network exposure beyond localhost. |
| CLI tool execution | Validate tool exists on PATH before invocation. No shell injection — use `child_process.execFile` not `exec`. | Data source sync invokes external tools. Must be safe. |
| File system boundaries | Restrict all reads/writes to project root and `.bmad-studio/` | Prevent path traversal. Validate all user-provided paths resolve within project root. |

### API & Communication Patterns

| Decision | Choice | Rationale |
|---|---|---|
| API style | REST (defined in PRD sections 9.1-9.14) | Simple, well-understood, matches the CRUD-heavy nature of entity management. |
| Response format | JSON with consistent error shape: `{ error: { code, message, details?, severity } }` | Enables client-side notification mapping. Validation errors include full issues array. |
| WebSocket protocol | Server → client push only (PRD event types: file:changed, file:created, file:deleted, project:reloaded, compile:needed) | Client uses events as TanStack Query cache invalidation triggers, not as a state channel. |
| API documentation | None in v1 — TypeScript types in `packages/shared/` are the contract | Shared types enforce client-server agreement at compile time. |

### Frontend Architecture

| Decision | Choice | Version | Rationale |
|---|---|---|---|
| State management | TanStack Query + Zustand | TQ for server state, Zustand for UI state | TQ handles fetch/cache/invalidate/optimistic updates. Zustand handles panels, editor mode, form drafts. WebSocket events invalidate TQ cache keys. |
| Routing | React Router | v7 | ~12 routes with nested detail views, URL-addressable slide-overs, breadcrumb integration, browser-back support. Industry standard. |
| Component architecture | Feature-based + shared layer | — | Feature folders per screen, `shared/` for cross-cutting components (editor, repo browser, diff viewer, slide-over, command palette), `layout/` for shell. |
| CSS framework | Tailwind CSS 4.2 + shadcn/ui | Tailwind 4.2, shadcn/ui (Radix primitives) | Dark-first theme with CSS variable color system. shadcn/ui provides accessible command palette, slide-overs, dropdowns, tabs, toasts, dialogs. Owned code, no runtime dependency. |
| Editor engine | CodeMirror 6 | CM6 | Modular ~300KB core. Markdown + YAML frontmatter highlighting. Three modes, diff generation, draft auto-save. Appears in 7+ contexts. |

### Infrastructure & Deployment

| Decision | Choice | Rationale |
|---|---|---|
| Distribution | `npx bmad-studio` — single npm package with compiled server + built client | Entry point starts Fastify, serves SPA from bundled `dist/`. |
| Dev mode | Vite dev server (port 5173) + Fastify (port 4040) with API proxy | Client HMR via Vite, server hot-reload via tsx watch. |
| Production mode | Fastify serves static client assets, single port (default 4040) | Single process, zero config for end users. |
| Configuration | CLI args → `.bmad-studio/settings.json` → defaults | No `.env`, no config libraries. `--port`, `--dir` flags. |
| Logging | Pino via Fastify built-in, stdout only | Default `info`, `--verbose` for debug. No log files in v1. |
| Project detection | Scan upward from CWD for `_bmad/` directory | `--dir` flag overrides. Show setup wizard if not found. |

### Decision Impact Analysis

**Implementation Sequence:**
1. Monorepo setup + dev/prod mode architecture (foundation)
2. File store plugin + parsers + write safety service (Tier 1 infrastructure)
3. WebSocket plugin + basic REST routes (API backbone)
4. React shell + routing + layout system + Tailwind/shadcn theme (frontend foundation)
5. TanStack Query integration + WebSocket cache invalidation (state sync)
6. Feature screens in build-priority order (P1-P18)

**Cross-Component Dependencies:**
- File store plugin → parsers (file store calls parsers on change)
- Routes → file store (routes read from index) → write safety (routes write through pipeline)
- WebSocket → file store (file store emits change events) → TanStack Query (client invalidates cache)
- All UI features → shared components (editor, slide-over, diff viewer)
- Validation graph → parsers (validation reads parsed entities) → file store (validation triggered by index changes)

## Implementation Patterns & Consistency Rules

### Naming Patterns

**File & Directory Naming:**
- All files and directories use `kebab-case`: `file-store.ts`, `agent-parser.ts`, `use-agent-list.ts`
- Exception: React component files use `PascalCase`: `AgentCard.tsx`, `SkillDetail.tsx` — but only `.tsx` files that export a component

**TypeScript Naming:**
- Types over interfaces (use `interface` only for Fastify declaration merging)
- No `I` prefix: `Agent`, not `IAgent`
- PascalCase for types, interfaces, enums, and enum members: `enum FileChangeType { Created, Modified, Deleted }`
- camelCase for functions, variables, parameters: `parseAgent()`, `fileStore`, `agentId`
- PascalCase for React components: `AgentCard`, `SkillDetail`
- `SCREAMING_SNAKE_CASE` only for true compile-time constants, otherwise camelCase

**API & JSON Naming:**
- Plural nouns for REST endpoints: `/api/agents`, `/api/skills`, `/api/workflows`
- camelCase for all JSON fields in requests and responses — no transform layer between client and server
- WebSocket events use `namespace:action` format: `file:changed`, `file:created`, `file:deleted`, `project:reloaded`

### Structure Patterns

**Test Location:**
- Co-located with source: `file-store.ts` and `file-store.test.ts` in the same directory
- Test files named `*.test.ts` / `*.test.tsx`

**Feature Folder Organization:**
- Flat files within each feature folder — no `components/`, `hooks/`, `utils/` subdirectories until a folder grows unwieldy
- No barrel exports (`index.ts`) — always use direct imports: `import { AgentCard } from '../agents/agent-card'`

**Hook Location:**
- Feature-specific hooks co-located in the feature folder: `agents/use-agent-list.ts`
- Shared hooks in a top-level `hooks/` directory: `hooks/use-debounce.ts`

**Import Organization:**
- Three groups separated by blank lines:
  1. External dependencies (`import { useQuery } from '@tanstack/react-query'`)
  2. Shared package imports (`import type { Agent } from '@bmad-studio/shared'`)
  3. Relative imports (`import { AgentCard } from './agent-card'`)

### Format Patterns

**API Response Format:**
- Success: Direct JSON response body (no wrapper)
- Error: `{ error: { code: string, message: string, details?: unknown, severity: 'error' | 'warning' } }`
- Validation errors include full `issues` array in `details`

**Data Exchange:**
- camelCase JSON fields throughout — no snake_case anywhere in the API
- Dates as ISO 8601 strings in JSON
- Nulls used explicitly (not `undefined`) in API responses

### Communication Patterns

**WebSocket Events:**
- Format: `namespace:action` — `file:changed`, `file:created`, `file:deleted`, `project:reloaded`
- Server → client push only; client never sends messages over WebSocket
- Events used as TanStack Query cache invalidation triggers, not as a state channel

**TanStack Query Keys:**
- Object-style keys: `['agents']`, `['agents', { id: agentId }]`, `['agents', { id: agentId, include: 'skills' }]`
- Enables granular invalidation with query key matching

**Zustand Stores:**
- Multiple independent stores by concern: `useUiStore()`, `useEditorStore()`, `useDraftStore()`
- No single monolithic store — each store is self-contained and independently testable

### Process Patterns

**Server Error Handling:**
- Typed error classes: `NotFoundError`, `ValidationError`, `ConflictError`, `FileSystemError`
- All extend a base `AppError` class with `code`, `message`, `statusCode`, `severity`
- Single global Fastify `setErrorHandler` maps `AppError` subclasses to HTTP responses
- Unexpected errors logged at `error` level, returned as generic 500

**Client Error Handling:**
- Global React error boundary at app root (catches catastrophic render errors)
- Per-route error boundaries for graceful degradation (one broken feature doesn't crash the app)
- TanStack Query `onError` callbacks handle data-fetching errors → notification toasts

**File Operation Errors:**
- Surface failures as notification toasts (auto-dismiss success, persistent errors)
- Keep last-good state in memory — don't yank content away from the user mid-edit
- Disk remains authoritative; next successful read reconciles

**Loading States:**
- Skeleton placeholders for initial data loads (prevents layout shift)
- Subtle inline indicators for background refetches (doesn't distract when data is already displayed)

**Optimistic Updates:**
- Apply only to fast, low-risk operations: drag-and-drop reorders, toggles, UI state changes
- Server-confirm for writes, deletes, and file operations — these can fail meaningfully (conflicts, permissions)

### Backend Patterns

**Fastify Plugin Organization:**
- One plugin per domain: `agents-plugin.ts` registers all agent routes, services, and schemas
- Plugin encapsulates the full vertical slice for its domain
- Plugins register with Fastify's plugin system for proper encapsulation and lifecycle

**React Component Pattern:**
- Named function exports: `export function AgentCard() {}` — not arrow consts, not default exports
- One component per file as the primary export; small helper components co-located in the same file are acceptable

### Type Sharing

**Shared Package Organization (`packages/shared/`):**
- Organized by domain: `agents.ts`, `skills.ts`, `workflows.ts`, `config.ts`, `events.ts`
- Each domain file exports types for API request/response shapes and entity definitions
- Shared types are the compile-time contract between client and server — no separate API documentation

### Enforcement Guidelines

**All AI Agents MUST:**
- Follow naming patterns exactly — kebab-case files, camelCase code, PascalCase components/types
- Use the import ordering convention (external → shared → relative) with blank-line separation
- Place tests co-located with source files, never in a separate test directory tree
- Use typed error classes on the server, never throw raw strings or plain Error objects
- Use named function exports for React components, never default exports
- Organize shared types by domain, not by kind

## Project Structure & Boundaries

### Complete Project Directory Structure

```
bmad-studio/
├── package.json                          # npm workspaces root
├── tsconfig.base.json                    # Shared TS config, extended by packages
├── .gitignore
├── .prettierrc
├── eslint.config.js                      # Flat config, shared across packages
├── vitest.workspace.ts                   # Vitest workspace for all packages
│
├── packages/
│   ├── shared/                           # @bmad-studio/shared
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── agents.ts                 # Agent entity types + API shapes
│   │       ├── skills.ts                 # Skill entity types + API shapes
│   │       ├── workflows.ts              # Workflow entity types + API shapes
│   │       ├── connections.ts            # Connection/MCP types + API shapes
│   │       ├── workspace.ts              # Workspace/project-context types
│   │       ├── packages.ts               # Package export/import types
│   │       ├── outputs.ts                # Output + template types
│   │       ├── config.ts                 # Project config + settings types
│   │       ├── files.ts                  # File browser types + API shapes
│   │       ├── validation.ts             # Validation result types
│   │       ├── teams.ts                  # Team, TeamMember, TeamListItem types
│   │       ├── events.ts                 # WebSocket event type definitions
│   │       └── errors.ts                 # Shared error codes + severity enum
│   │
│   ├── server/                           # @bmad-studio/server
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts                  # Entry point: CLI arg parsing → start server
│   │       ├── app.ts                    # Fastify app factory, plugin registration
│   │       │
│   │       ├── core/                     # Tier 1 — foundational infrastructure
│   │       │   ├── file-store.ts         # Reactive file store plugin (chokidar + in-memory index)
│   │       │   ├── file-store.test.ts
│   │       │   ├── write-service.ts      # Atomic write pipeline (read→snapshot→tmp→rename→verify)
│   │       │   ├── write-service.test.ts
│   │       │   ├── websocket.ts          # WebSocket plugin (server→client push, event batching)
│   │       │   ├── websocket.test.ts
│   │       │   ├── project-detector.ts   # Scan upward for _bmad/, resolve project root
│   │       │   ├── project-detector.test.ts
│   │       │   ├── errors.ts             # AppError base + typed subclasses (NotFoundError, etc.)
│   │       │   └── errors.test.ts
│   │       │
│   │       ├── parsers/                  # BMAD parser/adapter layer
│   │       │   ├── agent-parser.ts       # *.agent.yaml → Agent entity
│   │       │   ├── agent-parser.test.ts
│   │       │   ├── skill-parser.ts       # *.md with frontmatter → Skill entity
│   │       │   ├── skill-parser.test.ts
│   │       │   ├── workflow-parser.ts    # workflow.yaml + steps/*.md → Workflow entity
│   │       │   ├── workflow-parser.test.ts
│   │       │   ├── config-parser.ts      # config.yaml with variable interpolation
│   │       │   ├── config-parser.test.ts
│   │       │   ├── package-parser.ts     # package.yaml → Package entity
│   │       │   ├── package-parser.test.ts
│   │       │   ├── ide-config-parser.ts  # IDE-specific config files (Claude, Cursor, etc.)
│   │       │   ├── ide-config-parser.test.ts
│   │       │   ├── csv-parser.ts         # *-manifest.csv files
│   │       │   ├── csv-parser.test.ts
│   │       │   ├── team-parser.ts       # *.yaml in teams/ → Team entity (with party CSV resolution)
│   │       │   ├── team-parser.test.ts
│   │       │   └── index-builder.ts      # Orchestrates all parsers → unified entity index
│   │       │
│   │       ├── plugins/                  # Feature plugins (one per domain)
│   │       │   ├── overview-plugin.ts    # P1: Dashboard aggregation routes
│   │       │   ├── agents-plugin.ts      # P4-P5: Agent CRUD + detail + import
│   │       │   ├── skills-plugin.ts      # P6-P7: Skill CRUD + detail + assignment
│   │       │   ├── workflows-plugin.ts   # P8: Workflow graph data + step CRUD
│   │       │   ├── outputs-plugin.ts     # P9: Output file listing + template management
│   │       │   ├── connections-plugin.ts # P10: MCP/IDE connection management
│   │       │   ├── workspace-plugin.ts   # P11: Workspace editor → project-context.md
│   │       │   ├── packages-plugin.ts    # P12-P14: Package export/import/browse
│   │       │   ├── files-plugin.ts       # P16: File tree + read/write
│   │       │   ├── settings-plugin.ts    # P17: Project + Studio settings
│   │       │   ├── modules-plugin.ts    # P13: Module create/remove/export + entity upload
│   │       │   ├── teams-plugin.ts      # P18: Team CRUD + party CSV management
│   │       │   ├── validation-plugin.ts  # P3: Cross-entity validation engine
│   │       │   └── search-plugin.ts      # Cross-cutting: global search endpoint
│   │       │
│   │       └── static.ts                # Production: serve client dist/ as static assets
│   │
│   └── client/                           # @bmad-studio/client (Vite React SPA)
│       ├── package.json
│       ├── tsconfig.json
│       ├── vite.config.ts
│       ├── index.html
│       └── src/
│           ├── main.tsx                  # React root, router mount
│           ├── app.tsx                   # Router definition, layout wrapper
│           ├── globals.css               # Tailwind directives, CSS variable theme
│           │
│           ├── layout/                   # App shell
│           │   ├── Sidebar.tsx           # Primary navigation
│           │   ├── Breadcrumbs.tsx       # Breadcrumb trail with browser-back
│           │   ├── AppShell.tsx          # Sidebar + content area + notification layer
│           │   └── NotificationProvider.tsx  # Toast system
│           │
│           ├── shared/                   # Shared UI components (Tier 2)
│           │   ├── markdown-editor/      # P2: CodeMirror 6 sub-application
│           │   │   ├── MarkdownEditor.tsx
│           │   │   ├── use-editor-state.ts
│           │   │   ├── editor-extensions.ts
│           │   │   └── MarkdownEditor.test.tsx
│           │   ├── diff-viewer/
│           │   │   └── DiffViewer.tsx
│           │   ├── repo-browser/         # P13: Shared repository browser
│           │   │   ├── RepoBrowser.tsx
│           │   │   └── use-repo-search.ts
│           │   ├── slide-over/
│           │   │   └── SlideOver.tsx
│           │   ├── command-palette/      # Cmd+K global search
│           │   │   └── CommandPalette.tsx
│           │   ├── csv-viewer/           # Shared CSV table (read-only + editable modes)
│           │   │   └── CsvViewer.tsx
│           │   └── empty-state/
│           │       └── EmptyState.tsx
│           │
│           ├── hooks/                    # Shared hooks
│           │   ├── use-websocket.ts
│           │   ├── use-debounce.ts
│           │   └── use-keyboard-shortcut.ts
│           │
│           ├── lib/                      # Client utilities
│           │   ├── api-client.ts         # Fetch wrapper, error handling
│           │   ├── query-keys.ts         # TanStack Query key factory
│           │   └── websocket-client.ts   # WebSocket connection manager
│           │
│           ├── stores/                   # Zustand stores
│           │   ├── ui-store.ts
│           │   ├── editor-store.ts
│           │   └── draft-store.ts
│           │
│           └── features/                 # One folder per screen
│               ├── overview/
│               │   ├── OverviewPage.tsx
│               │   ├── TeamSection.tsx
│               │   ├── ProcessSection.tsx
│               │   ├── ToolkitSection.tsx
│               │   ├── ConnectionsSection.tsx
│               │   ├── WorkspaceSection.tsx
│               │   └── use-overview-data.ts
│               ├── agents/
│               │   ├── AgentsPage.tsx
│               │   ├── AgentCard.tsx
│               │   ├── AgentDetail.tsx
│               │   ├── AgentSkillAssignment.tsx
│               │   ├── use-agents.ts
│               │   └── use-agent-detail.ts
│               ├── teams/
│               │   ├── TeamsPage.tsx
│               │   ├── TeamDetailPanel.tsx
│               │   ├── CreateTeamDialog.tsx
│               │   └── use-teams.ts
│               ├── skills/
│               │   ├── SkillsPage.tsx
│               │   ├── SkillRow.tsx
│               │   ├── SkillDetail.tsx
│               │   ├── use-skills.ts
│               │   └── use-skill-detail.ts
│               ├── workflows/
│               │   ├── WorkflowsPage.tsx
│               │   ├── WorkflowCanvas.tsx
│               │   ├── WorkflowNode.tsx
│               │   ├── StepDetail.tsx
│               │   ├── use-workflows.ts
│               │   └── use-workflow-graph.ts
│               ├── outputs/
│               │   ├── OutputsPage.tsx
│               │   ├── OutputFileRow.tsx
│               │   ├── TemplatesTab.tsx
│               │   └── use-outputs.ts
│               ├── connections/
│               │   ├── ConnectionsPage.tsx
│               │   ├── ConnectionCard.tsx
│               │   ├── ConnectionEditor.tsx
│               │   └── use-connections.ts
│               ├── workspace/
│               │   ├── WorkspacePage.tsx
│               │   ├── WorkspaceFormView.tsx
│               │   ├── WorkspaceSection.tsx
│               │   └── use-workspace.ts
│               ├── packages/               # Modules page (renamed from Packages)
│               │   ├── PackagesPage.tsx    # ModulesPage — module list with cards
│               │   ├── CreateModuleDialog.tsx
│               │   ├── RemoveModuleDialog.tsx
│               │   └── use-modules.ts
│               ├── files/
│               │   ├── FilesPage.tsx
│               │   ├── FileTree.tsx
│               │   ├── FilePreview.tsx
│               │   └── use-file-tree.ts
│               └── settings/
│                   ├── SettingsPage.tsx
│                   └── use-settings.ts
```

### Architectural Boundaries

**Server → Client:** REST API + WebSocket. Shared types in `packages/shared/` are the compile-time contract. No direct imports across packages except through shared types.

**Plugin → Plugin:** Plugins never import each other directly. Cross-domain data flows through the file store's in-memory index via Fastify decorators.

**Core → Plugin:** Core infrastructure (file-store, write-service, websocket) registers as Fastify decorators. Plugins depend on core decorators but core has no knowledge of plugins.

**Client Feature → Feature:** Features are independent folders. Cross-feature communication goes through shared hooks, Zustand stores, or the URL (React Router). Features never import from each other directly.

### Requirements to Structure Mapping

| PRD Feature | Server Plugin | Client Feature | Shared Types |
|---|---|---|---|
| P1: Overview | `overview-plugin.ts` | `features/overview/` | `config.ts` |
| P2: Markdown Editor | (writes via `files-plugin`) | `shared/markdown-editor/` | `files.ts` |
| P3: Validation | `validation-plugin.ts` | (integrated in features) | `validation.ts` |
| P4-P5: Agents | `agents-plugin.ts` | `features/agents/` | `agents.ts` |
| P6-P7: Skills | `skills-plugin.ts` | `features/skills/` | `skills.ts` |
| P8: Workflows | `workflows-plugin.ts` | `features/workflows/` | `workflows.ts` |
| P9: Outputs | `outputs-plugin.ts` | `features/outputs/` | `outputs.ts` |
| P10: Connections | `connections-plugin.ts` | `features/connections/` | `connections.ts` |
| P11: Workspace | `workspace-plugin.ts` | `features/workspace/` | `workspace.ts` |
| P12: Packages | `packages-plugin.ts` | `features/packages/` | `packages.ts` |
| P13: Modules | `modules-plugin.ts` | `features/packages/` | `config.ts` |
| P14: Shared Repo | (via entity plugins) | `shared/repo-browser/` | — |
| P15: Agent Wizard | (via `agents-plugin`) | (in `features/agents/`) | `agents.ts` |
| P16: Files | `files-plugin.ts` | `features/files/` | `files.ts` |
| P17: Settings | `settings-plugin.ts` | `features/settings/` | `config.ts` |
| P18: Teams | `teams-plugin.ts` | `features/teams/` | `teams.ts` |

### Cross-Cutting Concerns Mapping

| Concern | Server Location | Client Location |
|---|---|---|
| Global search (Cmd+K) | `search-plugin.ts` | `shared/command-palette/` |
| Diff preview | (built into write-service response) | `shared/diff-viewer/` |
| WebSocket live updates | `core/websocket.ts` | `hooks/use-websocket.ts` + `lib/websocket-client.ts` |
| CSV viewer | — | `shared/csv-viewer/` (read-only in Outputs, editable in Teams) |
| Empty states | — | `shared/empty-state/` |
| Notifications | (error responses trigger toasts) | `layout/NotificationProvider.tsx` |
| Breadcrumbs | — | `layout/Breadcrumbs.tsx` |
| Keyboard shortcuts | — | `hooks/use-keyboard-shortcut.ts` |

### Data Flow

```
Files on disk
  → chokidar (file-store.ts) detects change
  → parser layer re-parses affected file
  → in-memory index updated
  → WebSocket event pushed to client
  → TanStack Query cache invalidated
  → UI re-renders with fresh data

User edits in UI
  → TanStack Query mutation (optimistic for fast ops)
  → REST API call to plugin route
  → write-service.ts: read → snapshot → tmp → rename → verify
  → file-store detects own write (feedback suppressed)
  → success response → mutation settled
```

### Runtime State (.bmad-studio/)

```
.bmad-studio/                             # Gitignored, zero-footprint removal
├── cache/                                # Parsed entity index (disposable, rebuilt from files)
│   ├── agents.json
│   ├── skills.json
│   ├── workflows.json
│   └── connections.json
├── history/                              # Write snapshots (capped at 50, FIFO)
│   └── {timestamp}-{filename}.md
├── drafts/                               # Unsaved editor drafts (conflict detection source)
│   └── {entity-type}-{entity-id}.draft.md
└── settings.json                         # Studio preferences (port, theme, etc.)

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:**
All technology choices are version-compatible and conflict-free. Fastify 5.8 + @fastify/websocket, Vite 8 + React 18+ + Tailwind 4.2, CodeMirror 6 (ESM-native), @xyflow/react 12.10, @dnd-kit/react 0.3, shadcn/ui (Radix primitives) — all target ES Modules and Node 20+. TanStack Query and Zustand are complementary (server state vs. UI state) with no overlap. Vitest 4.1 integrates natively with Vite 8.

**Pattern Consistency:**
Naming conventions (kebab-case files, camelCase code/JSON, PascalCase types/components) are internally consistent and align with ecosystem conventions. The "one plugin per domain" server pattern and "one folder per screen" client pattern mirror each other. Import ordering, test co-location, and component export patterns are unambiguous.

**Structure Alignment:**
The three-package monorepo (shared → server, shared → client) enforces compile-time contract boundaries. Core → plugin dependency direction prevents circular dependencies. Feature folders are isolated with no cross-feature imports. The `.bmad-studio/` runtime state directory is cleanly separated from source code.

### Requirements Coverage Validation ✅

**Feature Coverage (P1-P18):**
All 18 PRD features have explicit server plugin, client feature folder, and shared type file. P15 Agent Creation Wizard is housed within the agents feature (domain affinity). P18 Teams follows the established entity pattern (parser → plugin → shared types → feature page). Modules plugin (P13) handles create/remove/populate/export. No feature is orphaned or unmapped.

**Cross-Cutting Coverage (7 areas):**
Global search (Cmd+K), diff preview, WebSocket live updates, empty states, notifications, breadcrumbs, and keyboard shortcuts all have explicit file locations in the project structure. Each is mapped to both server and client components where applicable.

**Non-Functional Requirements Coverage (9 NFRs):**

| NFR | Architectural Support |
|---|---|
| Startup < 2s | Cached index in `.bmad-studio/cache/`, fallback to full parse |
| File scan < 1s | In-memory index, incremental chokidar updates |
| Optimistic updates | TanStack Query mutations for fast ops, server-confirm for writes |
| Validation < 3s | Pre-computed dependency graph, incremental updates |
| Atomic writes | Write-service pipeline: read → snapshot → tmp → rename → verify |
| File integrity | Temp file + atomic rename, history snapshots capped at 50 |
| External changes | Chokidar watching with debounce, draft-vs-external conflict detection |
| Browser support | Standard Vite build targets (Chrome, Firefox, Safari, Edge latest 2) |
| OS support | Node.js cross-platform file handling, path normalization |

### Implementation Readiness Validation ✅

**Decision Completeness:**
All critical decisions are documented with specific library versions. Implementation patterns cover naming, structure, format, communication, and process categories. Enforcement guidelines provide clear rules for AI agents. The data flow diagram makes the reactive pipeline explicit.

**Structure Completeness:**
Project tree is specified to the individual file level for all packages. Every PRD feature maps to specific directories. Integration boundaries (server → client, core → plugin, feature → feature) are explicitly defined with communication rules.

**Pattern Completeness:**
All five conflict categories (naming, structural, format, communication, process) are addressed. Import ordering, error handling, loading states, optimistic updates, and component export patterns are all specified with concrete rules.

### Gap Analysis Results

**Critical Gaps:** None found.

**Minor Gaps (non-blocking, resolve during implementation stories):**

1. **Vite dev proxy config** — Dev mode API proxy (5173 → 4040) implied but not explicitly specified. Add to `vite.config.ts` during monorepo setup story.
2. **Draft auto-save strategy** — `.bmad-studio/drafts/` exists but save interval/mechanism (debounced vs. periodic) not specified. Decide during editor implementation.
3. **External change conflict UI** — Architecture requires conflict surfacing but specific UI pattern (modal, banner, toast) deferred to UX layer. Existing notification patterns should handle this.
4. **shadcn/ui component selection** — Which primitives to install (Command, Sheet, Dialog, Tabs, Toast, DropdownMenu) best decided per-feature during implementation.

### Architecture Completeness Checklist

**✅ Requirements Analysis**

- [x] Project context thoroughly analyzed
- [x] Scale and complexity assessed
- [x] Technical constraints identified
- [x] Cross-cutting concerns mapped (Tier 1 + Tier 2)

**✅ Architectural Decisions**

- [x] Critical decisions documented with versions
- [x] Technology stack fully specified (frontend, backend, testing, tooling)
- [x] Integration patterns defined (REST, WebSocket, file store)
- [x] Performance considerations addressed (caching, indexing, batching)

**✅ Implementation Patterns**

- [x] Naming conventions established (files, code, API, JSON, events)
- [x] Structure patterns defined (tests, features, hooks, imports)
- [x] Communication patterns specified (WebSocket events, query keys, stores)
- [x] Process patterns documented (error handling, loading, optimistic updates)

**✅ Project Structure**

- [x] Complete directory structure defined to file level
- [x] Component boundaries established (server/client/shared, core/plugins, features)
- [x] Integration points mapped (data flow, event flow)
- [x] Requirements to structure mapping complete (all 18 features + 7 cross-cutting + CSV viewer)

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION

**Confidence Level:** High

**Key Strengths:**
- File-system-as-database paradigm is consistently applied across all layers
- Clean separation between core infrastructure and feature plugins enables incremental delivery
- Shared types package enforces client-server contract at compile time
- Implementation patterns are specific enough to prevent AI agent conflicts while leaving room for feature-level design decisions
- The reactive data flow (files → chokidar → index → WebSocket → TanStack Query) is a single coherent pipeline

**Areas for Future Enhancement:**
- CI/CD pipeline — define at first npm publish
- Performance monitoring — not needed for single-user local tool but may be useful for large projects
- Plugin-level test fixtures — may want shared BMAD test data as the parser test suite grows

### Implementation Handoff

**AI Agent Guidelines:**
- Follow all architectural decisions exactly as documented
- Use implementation patterns consistently across all components
- Respect project structure and boundaries — features never import from each other
- Refer to this document for all architectural questions
- When in doubt about a pattern, check the Enforcement Guidelines section

**Implementation Sequence:**
1. Monorepo setup + dev/prod mode architecture (foundation)
2. File store plugin + parsers + write safety service (Tier 1 infrastructure)
3. WebSocket plugin + basic REST routes (API backbone)
4. React shell + routing + layout system + Tailwind/shadcn theme (frontend foundation)
5. TanStack Query integration + WebSocket cache invalidation (state sync)
6. Feature screens in build-priority order (P1-P18)

---

## v6.5 Entity Classification Architecture (E37–E41, added 2026-05-02)

### Context

BMAD v6.5 changes the entity model: every installed skill is a directory containing `SKILL.md` + `customize.toml`. The entity type (Agent or Workflow) is no longer determined by filesystem structure (`agents/*.md`, `workflow.md`, `bmad-manifest.json`) but by the top-level TOML block header in `customize.toml`.

### Key Files in v6.5 Structure

```
_bmad/
  config.toml                    ← installer-managed central config; [agents.*] tables
  custom/
    config.toml                  ← team overrides
    config.user.toml             ← personal overrides
    {skill-name}.toml            ← team override for a specific skill
    {skill-name}.user.toml       ← personal override for a specific skill
  _config/
    manifest.yaml                ← installed modules list (presence = v6.5 detected)
    skill-manifest.csv           ← authoritative skill inventory
    files-manifest.csv           ← SHA-256 baseline for drift detection
  {module}/
    {skill-name}/
      SKILL.md                   ← human-readable skill definition; frontmatter: name, description
      customize.toml             ← entity type + customizable fields
      agents/                    ← (optional) sub-agent instruction files; NOT top-level entities
      steps/                     ← (optional) step markdown files for workflows
```

### Entity Classification Decision

```
For every customize.toml found under _bmad/:
  parsed = parseToml(content)
  if 'agent' in parsed  → parseAgent(dir) → Agent
  if 'workflow' in parsed → parseWorkflow(dir) → Workflow
  else → log warning to index.errors, skip
```

### ADR: customize.toml as single source of entity type (E37)

**Decision:** Entity classification is driven exclusively by the top-level TOML block in `customize.toml`. Legacy heuristics (directory names, presence of `workflow.md`, `bmad-manifest.json`, files in `agents/` subdirs) are removed from the v6.5 code path.

**Rationale:** v6.5 ships `customize.toml` for every skill directory; the block type IS the canonical declaration. The legacy heuristics were only needed because v6 had no such file.

**Backward compatibility:** `buildIndex()` detects v6 vs v6.5 by checking for `_config/manifest.yaml`. v6 projects use the legacy scan; v6.5 projects use the customize.toml scan. Both code paths produce the same `EntityIndex` shape.

### ADR: config.toml as agent metadata enrichment source (E37.2)

**Decision:** After classifying agents via `customize.toml`, `buildIndex()` reads `_bmad/config.toml` and merges matching `[agents.*]` entries into agent records. Fields from `config.toml` (name, title, icon, description, team, module) supplement fields already parsed from `customize.toml [agent]`.

**Rationale:** `config.toml` is the installer-managed central config that aggregates agent descriptors. It's the authoritative source for `team` and `description` fields that don't appear in per-skill `customize.toml`.

**Merge precedence:** `customize.toml [agent]` fields take priority (parsed first); `config.toml` fills in fields that are empty/missing after the per-skill parse.

### Updated Agent Type Fields

```ts
// packages/shared/src/types.ts (additions)
interface Agent {
  // existing fields...
  team?: string        // from config.toml [agents.*].team
  description?: string // from config.toml [agents.*].description
}
```

### Skills Page as Compiled View (E38)

The Skills page becomes the IDE-facing "what will be available to Claude" view:
- Endpoint: `GET /api/skills` returns `[...agents, ...workflows]` each with a `type: 'agent' | 'workflow'` discriminator
- Edit button routes to `/agents/:id` or `/workflows/:id` by type
- Sidebar badge = agents.length + workflows.length

### Teams Derivation (E40)

Teams are no longer first-class YAML entities. They are derived by grouping `index.agents` by `agent.team`:
- `GET /api/teams` → `{ name: string, agents: AgentSummary[] }[]`
- Agents with no team → grouped under `"ungrouped"`
- Team names formatted: `"software-development"` → `"Software Development"`

### BMAD Mode Detection (E41)

```ts
function detectBmadMode(moduleNames: string[]): 'quick-flow' | 'bmad-method' | 'enterprise' {
  if (!moduleNames.includes('bmm')) return 'quick-flow'
  const domainModules = moduleNames.filter(m => m !== 'core' && m !== 'bmm')
  return domainModules.length > 0 ? 'enterprise' : 'bmad-method'
}
```

Exposed on `GET /api/overview` as `bmadMode`.
