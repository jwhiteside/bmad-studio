# dept-opti-headless-implementation Workflow

**Workflow Name:** Implement Headless Frontend with Content Graph Integration
**Phase:** Phase 3 — Solutioning
**Duration:** 5–10 days
**Target Audience:** Frontend engineers, full-stack developers, DevOps engineers

## Workflow Overview

This workflow guides you through building a modern, decoupled frontend application (Next.js recommended) that consumes content from Optimizely SaaS CMS via Content Graph. The workflow enforces a **query-centric architecture** where Content Graph is the single source of truth for all content.

Key outcomes:
- Next.js project scaffold with Optimizely integration
- Authenticated Content Graph client with error handling
- Visual Builder rendering system (Experience → Section → Element)
- Preview mode for editors
- Performance baseline < 1 second TTI

## Key Principle

**Query-Centric Architecture**

Content Graph is the source of truth. Co-locate queries with components. This approach ensures:
- Easy to understand data flow (component → query → Content Graph → render)
- Caching strategies are transparent (you see which queries are cached)
- Performance issues surface immediately (slow queries are visible)
- No N+1 query problems (all queries explicitly defined)

## Initialization Sequence

### Workflow Entry Point
1. Trigger with component specifications from `dept-opti-build-component`
2. Gather Content Graph credentials (SingleKey for delivery, HMAC for preview)
3. Load design system tokens and Visual Builder configuration
4. Create Next.js project scaffold
5. Configure Content Graph client and authentication

### Pre-Flight Checks
- Content Graph API endpoint is accessible
- SingleKey (delivery) and HMAC (preview) credentials are valid
- Design system assets are available
- Team has Node.js 18 LTS installed
- Deployment target is identified (Vercel, Docker, custom)

## Execution Context Boundaries

| Boundary | Scope |
|----------|-------|
| **Frontend Framework** | Next.js 14+ with App Router; TypeScript required |
| **Content Source** | Content Graph only (no CMS API fallback) |
| **Rendering** | Server-side rendering (SSR) for SEO; static generation (SSG) for performance |
| **Authentication** | SingleKey for delivery queries; HMAC for preview (editor integration) |
| **Styling** | Design system tokens; CSS modules or Tailwind; responsive design |
| **Testing** | Unit tests for components/hooks; integration tests for Content Graph queries |
| **Performance** | TTI < 1 second; LCP < 2.5 seconds; CLS < 0.1 (Lighthouse targets) |

Out of scope: CMS 12 integration (headless is SaaS only), mobile app development (web frontend only), infrastructure provisioning (assume hosting exists).

## Workflow Structure

```
step-01-init
    ↓ (project scaffold, Content Graph client)
step-02-content-graph-integration
    ↓ (queries, caching, error handling)
step-03-visual-builder-rendering
    ↓ (component rendering system, preview mode)
DECISION GATE → [Approval / Preferred / Caution]
```

## Step Details

### Step 1: Initialize Headless Project
**Goal:** Set up Next.js project with Optimizely integration.

- Create Next.js 14 project with App Router
- Install Optimizely Content Cloud SDK/client libraries
- Configure Content Graph authentication (SingleKey, HMAC)
- Set up environment variables (.env.local, .env.production)
- Create project structure (src/app, src/components, src/queries, etc.)
- Configure build and deployment pipeline (Vercel, Docker, or custom)
- Initialize Git repository with .gitignore
- Set up testing framework (Jest + React Testing Library)

**Output:** Next.js project scaffold with Content Graph client configured and tested.

### Step 2: Content Graph Integration
**Goal:** Implement authenticated Content Graph query layer.

- Implement Content Graph client class with authentication
- Design query strategy (fragments per content type)
- Build reusable GraphQL query fragments for each content type
- Implement caching strategy (Redis, in-memory, ISR)
- Add error handling and fallback strategies
- Implement pagination (cursor vs. skip/limit)
- Configure webhook handlers for content change invalidation
- Write integration tests for query layer
- Document query patterns and performance notes

**Output:** Production-ready Content Graph client with cached queries, error handling, and test coverage.

### Step 3: Visual Builder Rendering
**Goal:** Implement system to render Visual Builder experiences.

- Map content types to React components (component registry)
- Implement Experience → Section → Element rendering tree
- Implement Styles metadata → CSS class mapping
- Implement Display Template switching
- Build preview mode for editor integration
- Implement lazy-loading for components/images
- Configure Next.js ISR (Incremental Static Regeneration)
- Test with real Visual Builder content
- Measure performance baseline (TTI, LCP, CLS)
- Document accessibility compliance (WCAG 2.1 AA)

**Output:** Complete frontend system rendering Visual Builder experiences with performance baseline and accessibility compliance.

## Success Metrics

| Metric | Target | Validation |
|--------|--------|-----------|
| Build succeeds | 100% | No build errors |
| Content Graph auth | Success | Queries return data successfully |
| VB rendering | 100% accuracy | Content displays as authored in Visual Builder |
| Preview mode | Works | Editors see unpublished content in preview |
| Test coverage | >= 80% | Test coverage report shows 80%+ |
| TTI (typical page) | < 1 second | Measured with Lighthouse |
| N+1 queries | Zero | No duplicate Content Graph requests |
| Code review approval | Signed off | At least one peer reviewer approved |

## Failure Modes and Recovery

| Failure Mode | Root Cause | Recovery |
|--------------|-----------|----------|
| Content Graph auth fails | Invalid credentials or network | Verify SingleKey/HMAC; check firewall; test with curl |
| N+1 queries | Missing fragment reuse | Refactor queries to use shared fragments; add integration tests |
| TTI exceeds baseline | Large components or slow queries | Profile with Lighthouse; implement code splitting, lazy-loading |
| VB component not rendering | Component registry missing type | Add missing content type to registry; update component mapping |
| Preview mode fails | HMAC not configured | Verify HMAC credentials; test with authenticated request |
| Build fails | Missing dependency or config | Check package.json; verify environment variables; run npm ci |

## Next Step

After step-03 completes and all success metrics are met:

1. **If approved:** Proceed to dept-opti-code-review (final quality gate)
2. **If preferred:** Minor tweaks needed—update and re-test
3. **If caution:** Significant issues—return to earlier step or halt

When approved, frontend is ready for Phase 4 (Implementation): dept-opti-migration-execute.
