---
canonicalId: dept-opti-build-component
name: "Build Optimizely Component"
description: "Design and implement production-ready CMS components with full test coverage and accessibility compliance. CMS 12 (C# BlockData/PageData + MVC views) or SaaS CMS (content type + React component)."
domain: optimizely
category: solutioning
---

# dept-opti-build-component

Build production-ready Optimizely components that serve as the foundation for content modelling and frontend rendering.

## Purpose
Architect and implement CMS components that balance content author requirements with technical constraints. Components bridge the gap between content model and user interface—defining what content is stored and how it is presented.

## Phase
Phase 3: Solutioning

## Scope
- Analyse component requirements from business stakeholders
- Search for existing implementations to avoid duplication
- Design content models (C# classes for CMS 12, content types for SaaS CMS)
- Implement components with full test coverage
- Ensure WCAG 2.1 AA accessibility compliance
- Provide production-ready code patterns

## Key Principle
**Content model first, then code.** Define what content is stored before writing views, controllers, or front-end rendering logic. This ensures components remain flexible and maintainable across team changes.

## Deliverables
- Content model specification (PageData/BlockData class or SaaS CMS content type definition)
- Implementation code (C# class + MVC view for CMS 12; content type + React component for SaaS)
- Accessibility compliance report (WCAG 2.1 AA)
- Unit test suite (minimum 80% coverage)
- Example content and authoring guide
- Code review checklist signed off

## Success Metrics
- Component available in CMS without errors
- Authors can create and publish test content successfully
- All accessibility tests pass (axe-core, NVDA/JAWS)
- Test coverage >= 80%
- Performance baseline < 200ms render time (CMS 12 controller + view)
- No security vulnerabilities in code review

## Platform Paths
- **CMS 12**: C# BlockData/PageData class → MVC controller + .cshtml view → CSS/JS → unit tests
- **SaaS CMS**: Content type (CLI definition or REST API) → React/headless component → Content Graph query → styling → unit tests

## Duration
Per component: 1–3 days (depending on complexity)

## Inputs
- Component requirements (from dept-opti-requirements)
- Existing component catalogue (internal search)
- Coding standards and accessibility guidelines
- Design system assets

## Outputs
- dept-opti-build-component workflow execution
- Approval/Preferred/Caution menu for proceed/iterate

## Related Workflows
- dept-opti-requirements (prerequisites)
- dept-opti-headless-implementation (if SaaS CMS with Next.js)
- dept-opti-code-review (final gate)

## Next Steps
After approval, proceed to dept-opti-headless-implementation (if applicable) or dept-opti-code-review for final gate.
