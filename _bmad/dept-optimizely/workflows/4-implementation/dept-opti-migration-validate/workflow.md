# dept-opti-migration-validate Workflow

**Workflow Name:** Validate Migration and Prepare Go-Live
**Phase:** Phase 4 — Implementation
**Duration:** 3–5 days

## Workflow Overview

This workflow guides you through validating migrated content and preparing the go-live cutover plan. Validation ensures no data loss, URLs redirect correctly, SEO is preserved, and performance meets targets.

## Key Principle

**Go-Live Readiness Verified.** Validation gates ensure production is stable before cutover; post-launch monitoring catches issues quickly.

## Workflow Structure

```
step-01-init
    ↓ (validation criteria defined)
step-02-validate
    ↓ (completeness, quality, URLs, SEO, performance validation)
DECISION GATE → [Go-Live Approved / Hold]
```

## Step Overview

- **Step 1:** Load migration reports, define validation criteria (completeness, quality, redirects, SEO, performance), set up tracking document
- **Step 2:** Validate content completeness (all expected items present), quality (field mapping, integrity), URLs (redirects working), SEO (meta tags, structured data), performance (baseline measured), prepare go-live checklist and cutover plan

## Success Metrics

- Content completeness >= 99%
- Content quality >= 99%
- URL redirects working >= 99%
- SEO metadata validated
- Performance baseline verified
- Zero critical blockers to go-live
- Cutover plan approved

## Next Step

After validation approval, execute cutover plan and deploy to production.
