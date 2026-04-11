---
canonicalId: dept-opti-code-review
name: "Code Review and Quality Gate"
description: "Review Optimizely code for quality, security, performance, and accessibility compliance across CMS 12 .NET patterns and SaaS CMS headless patterns."
domain: optimizely
category: implementation
---

# dept-opti-code-review

Review Optimizely code for quality, performance, and standards compliance before deployment to production.

## Purpose
Conduct comprehensive code review of all Optimizely implementation code (CMS 12 .NET, SaaS CMS headless, integrations, customizations) to ensure quality, security, and performance standards.

## Phase
Phase 4: Implementation

## Scope
- Review code quality (naming, formatting, patterns)
- Review Optimizely API usage (ContentReference, ContentArea, Commerce patterns for CMS 12; Content Graph queries for SaaS)
- Review security (no hardcoded secrets, parameterised queries, OWASP)
- Review performance (query efficiency, caching strategies, lazy-loading)
- Review accessibility (WCAG 2.1 AA compliance)
- Document findings and recommendations
- Obtain sign-off from solution architect

## Key Principle
**Quality Gates Matter.** Code review is the final technical gate before production deployment. Issues found here prevent production incidents.

## Deliverables
- Code review findings document (severity levels: critical, major, minor, suggestion)
- Performance profile report
- Security vulnerability assessment
- Accessibility compliance report
- Sign-off document

## Success Metrics
- Zero critical findings
- All major findings remediated
- Code follows team conventions
- Performance baseline verified
- Security review passed
- Accessibility compliant

## Duration
1–2 days (review + remediation feedback)

## Inputs
- Complete implementation code (from dept-opti-build-component, dept-opti-headless-implementation, integrations)
- Team coding standards
- OWASP Top 10 checklist
- Performance targets

## Outputs
- Code review approval (signed)
- Remediation tracking
- Approval/Preferred/Caution menu

## Next Steps
After approval, code is ready for deployment (Phase 4 migration/go-live).
