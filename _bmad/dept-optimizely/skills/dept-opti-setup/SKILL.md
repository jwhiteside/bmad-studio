---
canonicalId: dept-opti-setup
name: "Optimizely Project Setup"
description: "Guided setup for a new Optimizely project. Determines platform (CMS 12 or SaaS CMS), establishes project conventions, configures reference material, and produces a project context document that all other agents and workflows can reference."
domain: optimizely
category: setup
---

# Optimizely Project Setup

## Purpose

Guided setup for a new Optimizely project. Walks through platform selection, project conventions, reference material configuration, and produces a project context document that all other agents and workflows can reference.

Run this first on any new Optimizely engagement.

---

## MANDATORY EXECUTION RULES

1. READ this entire file before producing any output
2. Follow the phases in order — do not skip ahead
3. STOP and WAIT for user input at every decision point
4. Document all decisions in the project context output file
5. Do NOT assume platform choice — always ask

---

## Phase 1: Platform Discovery

Ask the user these questions (one at a time, conversationally):

### 1.1 Platform Selection

> Which Optimizely platform are you targeting?

Present these options:

- **CMS 12 (PaaS)** — .NET 6+, ASP.NET Core, SQL Server, traditional server-rendered. Best for teams with strong .NET skills, complex Commerce requirements, or existing CMS 12 codebases.
- **SaaS CMS** — Headless-first, Visual Builder, Content Graph (GraphQL API). Best for new builds, headless/decoupled architecture, multi-channel delivery.
- **Both / Migration path** — Currently on CMS 12, planning SaaS CMS migration. Need to support both during transition.
- **Not sure yet** — Need platform assessment first. → Recommend running the **Platform Assessment** workflow (`skill:dept-opti-platform-assessment`) before continuing setup.

Store the answer as `{target_platform}`.

### 1.2 Project Type

> What type of project is this?

- **Greenfield** — New build, no existing Optimizely implementation
- **Brownfield** — Extending or enhancing an existing Optimizely implementation
- **Migration** — Moving content/functionality from another platform to Optimizely
- **Replatform** — Moving from CMS 12 to SaaS CMS (or vice versa)

Store as `{project_type}`.

### 1.3 Product Scope

> Which Optimizely products are in scope?

Present as a checklist — user selects all that apply:

- [ ] **CMS** (content management — pages, blocks, media)
- [ ] **Commerce** (catalog, pricing, promotions, checkout, B2B)
- [ ] **Content Marketing Platform (CMP)** (campaigns, editorial calendars, approval workflows)
- [ ] **Opal AI** (AI agents, workflow automation, content generation)
- [ ] **Content Graph** (headless content delivery via GraphQL)
- [ ] **Experimentation / Feature Flags** (A/B testing, progressive delivery)

Store as `{products_in_scope}`.

---

## Phase 2: Project Context

### 2.1 Team & Constraints

Ask:

> Tell me about your team and constraints:
> - How many developers? What's their primary tech stack experience?
> - Are there existing CI/CD pipelines or DXP Cloud environments?
> - What's the timeline pressure? (Exploration / Active delivery / Hard deadline)
> - Any specific integration requirements? (DAM, PIM, CDP, CRM, search, analytics)

### 2.2 Content Landscape

Ask:

> Tell me about the content:
> - How many sites / brands / markets?
> - How many languages?
> - Rough content volume? (pages, products, assets)
> - Is there content to migrate? From what platform?

### 2.3 Architecture Constraints

Ask:

> Any architecture constraints I should know about?
> - Hosting: DXP Cloud, self-hosted, hybrid?
> - Front-end framework preferences? (Next.js, React, .NET MVC, other)
> - Authentication requirements? (SSO, customer login, B2B portals)
> - Performance SLAs? (page load targets, availability requirements)

---

## Phase 3: Reference Material Configuration

Based on the platform and products selected, recommend which reference documents to load for this project:

### CMS 12 Projects
- `optimizely-master-reference.md` — Platform overview and architecture
- Recommend: .NET development patterns, DXP Cloud deployment guide

### SaaS CMS Projects
- `cms-saas-reference.md` — Visual Builder, content types, REST API, Styles, Blueprints
- `graph-reference.md` — Content Graph query language, authentication, search, caching
- Recommend: Front-end framework integration patterns

### Commerce Projects
- `optimizely-master-reference.md` — Commerce sections (catalog, pricing, orders)
- Recommend: Commerce-CMS integration patterns skill

### CMP Projects
- Recommend: Content governance skill, CMP setup workflow

### Opal AI Projects
- `opal-reference.md` — Agent types, tools, instructions, RAG, evaluations, SDK
- Recommend: Opal configure workflow

Tell the user which references are available and recommend a reading order based on their project priorities.

---

## Phase 4: Project Context Document

Create a project context document at `{planning_artifacts}/project-context.md` with this structure:

```markdown
---
project: {project_name}
target_platform: {target_platform}
project_type: {project_type}
products_in_scope: {products_in_scope}
date_created: {today_iso}
status: Active
---

# {project_name} — Optimizely Project Context

## Platform
- **Target**: {target_platform}
- **Type**: {project_type}
- **Products**: {products_in_scope}

## Team & Constraints
{summarise from Phase 2.1}

## Content Landscape
{summarise from Phase 2.2}

## Architecture Constraints
{summarise from Phase 2.3}

## Reference Materials
{list recommended references from Phase 3}

## Recommended Workflow Sequence

{Based on project type, recommend the workflow sequence. Examples:}

### Greenfield Build
1. Content Model → Architecture → Build Component (repeat) → Code Review → Performance Audit

### Migration Project
1. Source Audit → Content Model → Migration Plan → Architecture → Migration Execute → Migration Validate

### CMS 12 to SaaS Replatform
1. Platform Assessment → Content Model → Architecture → Headless Implementation → Migration Plan → Migration Execute → Migration Validate

### Commerce Implementation
1. Content Model → Architecture → Build Component → Integration Patterns → Code Review → Performance Audit

## Key Decisions Log
| # | Decision | Rationale | Date | Status |
|---|----------|-----------|------|--------|
| 1 | Platform: {target_platform} | {rationale from Phase 1} | {today_iso} | Decided |

## Risks & Assumptions
{document any risks or assumptions surfaced during setup}
```

---

## Phase 5: Next Steps

Based on the project type, recommend the immediate next workflow:

| Project Type | Recommended Next Step |
|---|---|
| Greenfield | **Content Model** (`skill:dept-opti-content-model`) or **Architecture** (`skill:dept-opti-architecture`) |
| Brownfield | **Architecture** review or **Performance Audit** (`skill:dept-opti-performance-audit`) |
| Migration | **Source Audit** (`skill:dept-opti-source-audit`) |
| Replatform | **Platform Assessment** (`skill:dept-opti-platform-assessment`) |

Also recommend:
- Which **team bundle** to activate (Development, Migration, Digital Experience, AI Innovation, or Full Programme)
- Which **specialist agents** are most relevant for their first sprint

---

## Success Metrics

Setup is complete when:
- [ ] Platform selection is documented
- [ ] Project type and product scope are defined
- [ ] Team constraints and content landscape are captured
- [ ] Reference materials are identified
- [ ] Project context document is created at `{planning_artifacts}/project-context.md`
- [ ] Recommended workflow sequence is defined
- [ ] User knows their immediate next step

---

## Failure Modes

| Failure | Recovery |
|---|---|
| User unsure about platform | Recommend Platform Assessment workflow first |
| Scope too broad | Help user prioritise — suggest phased rollout |
| Missing team information | Document what's known, flag gaps for follow-up |
| No content to assess | Skip migration workflows, focus on greenfield path |
