---
canonicalId: dept-opti-migration-execute
name: "Execute Content Migration Waves"
description: "Migrate legacy content to Optimizely per approved migration plan with validation gates, wave tracking, and rollback procedures."
domain: optimizely
category: implementation
---

# dept-opti-migration-execute

Execute content migration waves per approved migration plan, transforming legacy content to Optimizely schema.

## Purpose
Systematically migrate content from legacy CMS or external systems to Optimizely (CMS 12 or SaaS CMS) following the migration plan and content mappings.

## Phase
Phase 4: Implementation

## Scope
- Execute Wave 0 (proof of concept) to validate migration tooling and mappings
- Execute subsequent waves per schedule with validation gates between each
- Monitor content integrity (no data loss, field mappings correct)
- Document exceptions and rework needed
- Validate migrated content in target CMS
- Prepare rollback procedures

## Key Principle
**Validate After Every Wave.** Do not proceed to next wave until current wave validates successfully against exit criteria.

## Deliverables
- Wave execution tracking (progress, exceptions, rework)
- Migrated content in target CMS (validated per wave exit criteria)
- Rollback procedures documented
- Migration completion report

## Success Metrics
- Wave completion rate >= 95%
- Content integrity validation >= 99%
- Zero unrecovered exceptions
- Rollback procedure documented

## Platform
CMS 12 and/or SaaS CMS

## Duration
Depends on wave schedule; typically 1–4 weeks for full migration

## Inputs
- Migration plan (waves, schedule, content type mappings)
- Legacy content export
- Mapping rules and transformation logic
- Target CMS environment (staging or production)

## Outputs
- Migrated content in Optimizely
- Wave execution reports
- Approval/Preferred/Caution menu for proceed/iterate

## Next Steps
After completion, proceed to dept-opti-migration-validate for go-live preparation.
