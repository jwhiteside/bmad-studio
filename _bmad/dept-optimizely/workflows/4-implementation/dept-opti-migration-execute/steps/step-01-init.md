# step-01-init: Wave Execution Setup

## MANDATORY EXECUTION RULES

1. **Plan Verified First:** Load approved migration plan before starting any wave.
2. **Environment Ready:** Verify target CMS environment (staging or production) is accessible.
3. **Rollback Plan Required:** Document rollback procedure for each wave before executing.
4. **Wave 0 First:** Execute proof-of-concept wave to validate tooling before full waves.

## YOUR TASK

### A. Load and Verify Migration Plan

- Load approved migration plan (waves, schedule, content type mappings)
- Verify Wave 0 (PoC) is clearly defined
- Confirm exit criteria for each wave
- Validate content type mappings are complete

### B. Verify Target Environment

- For CMS 12: Verify SQL Server, DXP Cloud environment accessible, import API working
- For SaaS CMS: Verify REST API endpoint, authentication tokens valid, Content Graph sync enabled
- Test connection (small API request)
- Confirm backup/rollback capabilities available

### C. Create Execution Tracking Document

Document template:

```markdown
# Migration Execution Tracking

**Plan:** [Name]
**Wave 0 Start Date:** [Date]
**Full Migration Start:** [Date]

## Wave Execution Status

| Wave | Content Type | Count | Start | End | Status | Issues | Rework |
|------|--------------|-------|-------|-----|--------|--------|--------|
| 0 | Feature Block | 5 | [date] | [date] | ✅ Complete | None | None |
| 1 | All Pages | 100 | [date] | TBD | ⏳ In Progress | – | – |
```

### D. Confirm Wave 0 (PoC) Plan

Verify Wave 0 is executable:

- [ ] Wave 0 content type and count defined
- [ ] Wave 0 success criteria explicit (completeness, integrity)
- [ ] Rollback procedure documented
- [ ] Team trained on execution process

## SUCCESS METRICS

- [ ] Migration plan loaded and verified
- [ ] Target environment tested and ready
- [ ] Rollback procedure documented
- [ ] Wave 0 plan confirmed

## NEXT STEP

→ Proceed to step-02-execute-wave: Execute Wave 0 migration
