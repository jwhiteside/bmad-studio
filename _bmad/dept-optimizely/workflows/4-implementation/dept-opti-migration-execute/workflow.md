# dept-opti-migration-execute Workflow

**Workflow Name:** Execute Content Migration Waves
**Phase:** Phase 4 — Implementation
**Duration:** 1–4 weeks (depends on wave schedule)

## Workflow Overview

This workflow guides you through executing content migration from legacy CMS or external systems to Optimizely. Migration is executed in waves with validation gates between each wave to ensure data integrity.

## Key Principle

**Validate After Every Wave.** Do not proceed to next wave until current wave validates successfully against exit criteria (completeness, integrity, no unrecovered exceptions).

## Workflow Structure

```
step-01-init
    ↓ (environment setup, plan loaded)
step-02-execute-wave
    ↓ (transform → load → validate)
DECISION GATE (per wave) → [Proceed / Hold]
    ↓ (repeat for next wave)
FINAL GATE → [All Waves Complete]
```

## Step Overview

- **Step 1:** Load migration plan, verify environment readiness, prepare tracking document, confirm Wave 0 plan
- **Step 2 (per wave):** Transform legacy content per mapping rules, load to target CMS, validate wave exit criteria, document exceptions, proceed to next wave

## Success Metrics

- Wave completion rate >= 95%
- Content integrity validation >= 99%
- Zero unrecovered exceptions
- Rollback procedures documented
- Wave execution times tracked

## Next Step

After all waves complete, proceed to dept-opti-migration-validate for go-live preparation.
