---
canonicalId: dept-opti-headless-implementation
name: "Implement Headless Frontend (SaaS CMS)"
description: "Build Next.js/React frontend consuming Optimizely SaaS CMS via Content Graph with Visual Builder rendering, preview integration, and performance optimisation."
domain: optimizely
category: solutioning
---

# dept-opti-headless-implementation

Implement a headless frontend consuming Optimizely SaaS CMS via Content Graph and Visual Builder.

## Purpose
Build a modern, decoupled frontend application (Next.js recommended) that retrieves content from Optimizely SaaS CMS using Content Graph queries and renders Visual Builder experiences client-side.

## Phase
Phase 3: Solutioning

## Scope
- Set up Next.js or React project with Optimizely integration
- Configure Content Graph authentication (SingleKey for delivery, HMAC for preview)
- Design and implement Content Graph query layer with authentication
- Implement Visual Builder rendering (Experience → Section → Element tree)
- Configure preview mode for editors
- Test with real content
- Validate performance baselines

## Key Principle
**Query-centric architecture.** Content Graph is the single source of truth. Co-locate queries with components for maintainability and performance.

## Deliverables
- Next.js project scaffold with Optimizely integration
- Content Graph client with authentication and error handling
- Component rendering system for Visual Builder content
- Preview mode configuration for editorial team
- Query templates (cached) for production use
- Test coverage (unit + integration tests)
- Performance baseline (< 1s TTI)
- Deployment guide (vercel, Docker, or custom)

## Success Metrics
- Frontend builds without errors
- Content Graph queries authenticate successfully
- Visual Builder content renders without errors
- Preview mode works (editors see unpublished content)
- Test coverage >= 80%
- TTI < 1 second (typical page)
- No N+1 queries in Content Graph layer

## Platform
SaaS CMS only (not applicable to CMS 12)

## Duration
5–10 days (depending on complexity)

## Inputs
- Component specifications from dept-opti-build-component
- Design system (color tokens, typography, spacing)
- Content Graph API credentials
- Visual Builder configuration
- Deployment target (Vercel, Docker, custom host)

## Outputs
- dept-opti-headless-implementation workflow execution
- Git repository with Next.js project
- Approval/Preferred/Caution menu for proceed/iterate

## Related Workflows
- dept-opti-build-component (content types and components)
- dept-opti-code-review (code quality gate)
- dept-opti-migration-execute (content migration)

## Next Steps
After approval, proceed to dept-opti-code-review for final code quality gate.
