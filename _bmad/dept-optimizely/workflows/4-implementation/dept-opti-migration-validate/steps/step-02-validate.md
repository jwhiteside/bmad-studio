# step-02-validate: Content Validation and Go-Live Prep

## YOUR TASK

### A. Validate Content Completeness

Count migrated items:

- Expected count (from migration plan): [N]
- Actual count (in target CMS): [N]
- Success rate: [N/N] = [%]
- Target: >= 99%

### B. Validate Content Quality

Spot-check sample of migrated content:

- [ ] All required fields populated
- [ ] Rich text formatting preserved
- [ ] Links and references intact (ContentReference in CMS 12, Content Graph queries in SaaS)
- [ ] Assets (images) loaded correctly
- [ ] No orphaned references

### C. Validate URL Redirects

Test legacy URL → new URL mapping:

- Sample 10–20 representative legacy URLs
- Verify redirects work (HTTP 301/302, not 404)
- Document any broken redirects
- Target: >= 99% working

### D. Validate SEO Metadata

Check SEO preservation:

- [ ] Page titles migrated and correct
- [ ] Meta descriptions present and meaningful
- [ ] Canonical URLs set
- [ ] Structured data (Schema.org) preserved
- [ ] Open Graph tags (for social sharing) intact
- [ ] Target: >= 95% validation

### E. Validate Performance Baseline

Measure:

- [ ] Page load time (target < 3s)
- [ ] Time to Interactive (TTI) (target < 1s for SaaS)
- [ ] Database performance (query times, connection pool)
- [ ] No 500 errors or timeouts

### F. Create Go-Live Checklist

```markdown
# Go-Live Checklist

## Pre-Cutover

- [ ] All content migrated and validated
- [ ] URL redirects working >= 99%
- [ ] SEO metadata verified
- [ ] Performance baseline met
- [ ] Rollback procedure tested
- [ ] Monitoring alerts configured
- [ ] Support team trained on new system
- [ ] Backup completed

## Cutover Plan

**Date/Time:** [Schedule]
**Duration:** [Est. 30 minutes - 2 hours]
**Blackout Window:** [Announce to users]

**Steps:**
1. Final backup of legacy system
2. Execute URL redirects (DNS switch or reverse proxy)
3. Monitor error rates and performance (first 30 minutes)
4. Alert on-call team if issues found
5. Document cutover results

## Post-Launch Monitoring (30 days)

- [ ] Daily error rate review (target < 0.1%)
- [ ] Weekly performance review
- [ ] Weekly content quality spot-checks
- [ ] Issue escalation process documented
- [ ] User feedback collection

## Approval

**Go-Live Approved:** ✅ Yes | ❌ No (document blockers)

Signature: _________________ Date: _______
```

## SUCCESS METRICS

- [ ] Content completeness >= 99%
- [ ] Content quality >= 99%
- [ ] URL redirects >= 99%
- [ ] SEO metadata >= 95% validated
- [ ] Performance baseline verified
- [ ] Go-live approved and scheduled

## NEXT STEP

→ If approved: Execute cutover plan; deploy to production
→ If blocked: Document issues; remediate; re-validate
