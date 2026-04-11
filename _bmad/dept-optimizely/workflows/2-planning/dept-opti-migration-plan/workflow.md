# Workflow: Migration Plan for Optimizely Content

**Skill**: `dept-opti-migration-plan`
**Goal**: Create phased migration plan; ready to execute content migration
**Role**: Migration Manager
**Outputs**: Mapping, Waves, Effort Estimates, URL Strategy, Risk Register, Roadmap

## Workflow Overview

This workflow produces a detailed, actionable content migration plan based on:
- Source audit (what content exists, complexity, quality)
- Content model (how content will be structured in target)
- Architecture decisions (how systems will be integrated)
- Team capacity (resource availability for migration)

The plan sequences content migration into waves by dependency and complexity, estimates effort, and identifies risks.

## Initialization Rules

**Before starting**, ensure:
- Source audit report complete (inventory, complexity, quality scores)
- Content model approved (all types, attributes, relationships defined)
- Architecture decisions final (integration patterns, sync strategy documented)
- Platform decided (CMS 12 or SaaS CMS - informs technical approach)
- Target platform detected (automated or from architecture)
- Migration manager designated
- Resource capacity known (content ops team availability)

**Migration plan document frontmatter** must include:
```yaml
project: [project name]
status: in-progress
stepsCompleted: 0
date_created: [today]
sourcePlatform: [from audit]
targetPlatform: [CMS 12 or SaaS CMS]
estimatedStart: [week X of implementation timeline]
estimatedGo-Live: [target date, typically end of build phase]
contentOpsTeam: [names and capacity]
migrationManager: [name]
---
```

## Step Sequence

1. **step-01-init.md** - Audit/model discovery; detect target platform
2. **step-02-model-mapping.md** - Source-to-target type mapping; transformation rules
3. **step-03-wave-plan.md** - Wave sequencing, effort estimation, roadmap

## State Management

Migration plan tracks state:
- `stepsCompleted` increments as progress
- `status` changes: `in-progress` → `mapped` → `planned` → `approved`
- Mapping and wave plan are major artifacts
- Risk register accumulates across steps

## Key Concepts

### Content Model Mapping

Maps how source content transforms to target:

```
Source Type → Target Type(s)
│            │
├─ Fields    ├─ Target fields (with transformation rules)
├─ Assets    ├─ Asset references (with migration strategy)
└─ Taxonomy  └─ Categories/tags (with lookup/mapping)
```

### Wave Planning

Groups content into migration waves by:
- **Dependency**: Assets before pages (pages reference assets)
- **Complexity**: Simple types first (FAQs, Archives), complex later (Products)
- **Volume**: Smaller waves early (confidence building), larger later
- **Business priority**: Critical content (products) before nice-to-have (old blog posts)

Typical wave structure:
- **Wave 0**: Assets (images, documents) - foundation for all content
- **Wave 1**: Simple types (FAQs, Categories, Archives) - low risk, high confidence
- **Wave 2**: Medium types (Blog Posts, Case Studies) - main volume
- **Wave 3**: Complex types (Products with variants, Landing Pages) - high risk
- **Wave 4**: Polish (redirects, validation, optimization) - pre-launch

### Effort Estimation

Effort per wave includes:
- **Extraction**: Pull content from source (database query or export)
- **Transformation**: Apply rules to convert to target format (scripts, manual work)
- **Import**: Load into target CMS (bulk import API or manual creation)
- **Validation**: Verify content integrity (spot checks, automated checks)
- **Testing**: Functional testing, regression testing, performance testing
- **Cleanup**: Fix issues discovered in testing

Formula: Effort (hours) = Volume × Complexity × Quality Factor × Risk Buffer

## Success Criteria

At completion:
- [ ] Source-to-target mapping complete for all types
- [ ] Field transformation rules documented for all fields
- [ ] Mapping gated (all decisions resolved; no TBD items)
- [ ] Waves sequenced by dependency and complexity
- [ ] Effort estimated per wave (hours, resources, duration)
- [ ] Total effort reasonable (typically 4-8 weeks content work)
- [ ] URL redirect strategy complete and executable
- [ ] Content freeze schedule defined
- [ ] Exit criteria defined per wave (quality gates)
- [ ] Migration-specific risk register built
- [ ] Week-by-week roadmap detailed
- [ ] Stakeholders understand plan and commit to timeline
- [ ] Status marked `approved`
- [ ] Ready for migration execution (step 3 of build phase)

## Next Steps After Planning

Migration plan feeds into:

1. **Build Phase** - CMS setup, integration work, migration scripting
2. **Migration Execution** - Execute waves per plan, validate results
3. **Go-Live** - Final content validation, cutover, launch

## Effort Estimate

- **Total workflow time**: 6-8 hours
- Step 1: 1-2 hours (audit/model discovery)
- Step 2: 2-3 hours (content mapping, transformation rules)
- Step 3: 3-4 hours (wave planning, effort estimation, roadmap)

## Decision Gates in Plan

Migration plan may surface decisions:
- "How to handle product variants?" (source has variants, target may not)
- "Bulk migration or phased?" (all at once vs incremental)
- "Content freeze timing?" (when to stop accepting changes in source?)
- "Validation approach?" (sample checks vs 100% audit vs automated checks?)

Document these and gate progress until resolved by stakeholders.
