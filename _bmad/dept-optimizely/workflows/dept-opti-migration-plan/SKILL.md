---
canonicalId: dept-opti-migration-plan
name: "Migration Plan for Optimizely Content"
description: "Create phased content migration plan from source system to Optimizely. Includes content model mapping, wave planning, effort estimates, URL redirect strategy, and migration-specific risk register."
domain: optimizely
category: planning
---

# Migration Plan for Optimizely Content

**Entry Point**: `dept-opti-migration-plan`

This skill creates a comprehensive, phased content migration plan from source system to Optimizely (CMS 12 or SaaS CMS). Includes content model mapping, wave planning, effort estimation, and risk register.

## What This Skill Does

Transforms content audit and model into an actionable migration plan by:
- Mapping source content types to target types
- Defining field transformation rules
- Planning migration waves by complexity and dependency
- Estimating effort per wave
- Building URL redirect strategy
- Creating exit criteria per wave
- Building risk register specific to migration

## When To Use It

After platform is decided, architecture designed, and content model approved. Before build begins, use this skill to plan how content will actually move from source to Optimizely.

## Inputs

- Source audit report (content inventory and complexity assessment)
- Approved content model (target type definitions)
- Architecture decision records (integration patterns, sync strategy)
- Technical architecture (deployment, infrastructure)

## Outputs

- Content Model Mapping (source → target types)
- Field Transformation Rules (how to convert each field)
- Migration Wave Plan (phased approach, sequencing)
- Effort Estimates (per wave, total hours)
- URL/Redirect Mapping Strategy
- Content Freeze Schedule
- Risk Register (migration-specific risks)
- Exit Criteria per Wave (how to know wave succeeded)
- Detailed Migration Roadmap (week-by-week)

## Process

The skill delegates to `workflow.md` which guides you through three steps:

1. **Initialize** - Load audit and model; detect target platform
2. **Model Mapping** - Map source types to target, define transformations
3. **Wave Planning** - Sequence waves, estimate effort, build roadmap

Total time: 6-8 hours depending on content complexity

## Success Criteria

✓ Complete source-to-target mapping
✓ Field transformation rules documented
✓ Wave plan created and sequenced
✓ Effort estimates realistic and detailed
✓ URL/redirect strategy complete
✓ Exit criteria defined per wave
✓ Risk register with mitigations
✓ Content freeze schedule set
✓ Migration roadmap detailed (week-by-week)
✓ Stakeholders understand plan and timeline
