---
canonicalId: dept-opti-migration-validate
name: "Validate Migration and Prepare Go-Live"
description: "Verify migrated content, validate SEO, test redirects, and prepare go-live cutover plan with completeness and quality gates."
domain: optimizely
category: implementation
---

# dept-opti-migration-validate

Validate migrated content and prepare for go-live cutover.

## Purpose
Verify all content is accurately migrated, URLs redirect correctly, SEO is preserved, and system performs at baseline before go-live.

## Phase
Phase 4: Implementation

## Scope
- Validate content completeness (all expected items present)
- Validate content quality (field mapping, rich text integrity, asset links)
- Validate URL redirects (legacy URLs → new URLs)
- Validate SEO metadata (titles, descriptions, structured data)
- Validate performance (page load times, database performance)
- Prepare cutover plan and monitoring strategy
- Document go-live checklist

## Key Principle
**Go-Live Readiness Verified.** Validation gates ensure production is stable before cutover; post-launch monitoring catches issues quickly.

## Deliverables
- Validation report (completeness, quality, redirects, SEO, performance)
- URL redirect mapping
- Go-live checklist (signed off)
- Cutover plan (schedule, rollback procedure)
- Post-launch monitoring plan (30-day period)

## Success Metrics
- Content completeness >= 99%
- Content quality validation >= 99%
- URL redirects working >= 99%
- SEO metadata validated
- Performance baseline >= target
- Zero critical issues blocking go-live

## Duration
3–5 days (validation + sign-off)

## Inputs
- Migration execution reports
- Content inventory (legacy and target)
- SEO requirements
- Performance targets
- Cutover timeline

## Outputs
- Validation report (signed)
- Go-live decision (proceed/hold)
- Approval/Preferred/Caution menu

## Next Steps
After validation approval, execute cutover plan and deploy to production.
