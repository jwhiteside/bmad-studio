# Workflow: Source System Audit for Optimizely Migration

**Skill**: `dept-opti-source-audit`
**Goal**: Audit source system to establish content baseline for migration to Optimizely
**Role**: Migration Analyst
**Outputs**: Content Inventory, Quality Scores, Complexity Tiers, Effort Estimates, Strategic Recommendations

## Workflow Overview

This workflow guides a systematic audit of a source CMS to answer four critical questions:

1. **What content exists?** - Types, volumes, languages, assets
2. **How good is it?** - Quality metrics and governance
3. **How complex is it to migrate?** - Scoring across volume, quality, languages, assets, URLs, governance
4. **What effort will it take?** - Rough T-shirt estimates

The audit produces a living document that feeds into content modelling, platform assessment, and migration planning.

## Initialization Rules

**Before starting**, ensure:
- You have access to the source system (admin panel, exports, or database)
- You know the source platform (WordPress, Drupal, Sitecore, AEM, Contentful, etc.)
- You have context on project goals and constraints
- You have authority to document findings

**Workflow frontmatter** must include:
```yaml
project: [project name]
status: in-progress
stepsCompleted: 0
date_created: [today]
sourcePlatform: [detected platform]
targetPlatform: [CMS 12 or SaaS CMS - to be determined]
```

## Step Sequence

1. **step-01-init.md** - Platform detection and audit initialization
2. **step-02-content-inventory.md** - Systematic content discovery
3. **step-03-assessment.md** - Quality and complexity scoring

## State Management

The audit document tracks state via frontmatter:
- `stepsCompleted` increments as you progress
- `status` changes: `in-progress` → `awaiting-review` → `complete`
- `sourcePlatform` is detected in step-01
- `qualityScores` and `complexityTiers` are added in step-03

## Key Concepts

### Four-Tier Quality Model

| Tier | Definition | Audit Signals |
|------|-----------|---|
| **Gold** | Well-structured, metadata-rich, governance enforced | Consistent naming, asset management, version control, approval workflows |
| **Silver** | Good structure, mostly consistent, light governance | Minor inconsistencies, basic asset tracking, occasional gaps |
| **Bronze** | Inconsistent structure, minimal metadata, ad-hoc governance | Mixed formats, missing metadata, incomplete asset docs |
| **Lead** | Unstructured, sparse metadata, no governance | Freeform content, missing assets, dangling references |

### Six-Dimension Complexity Scoring

Each content type is scored (1-5) on:

1. **Volume** - Absolute count and growth rate
2. **Quality** - Quality tier (Gold=1, Silver=2, Bronze=3, Lead=4)
3. **Multilingual** - Number of language variants and translation patterns
4. **Assets** - Count and complexity of dependent media
5. **URLs** - Depth, patterns, URL structures to preserve/migrate
6. **Governance** - Complexity of permissions, workflows, approval rules

**Complexity Score** = Average across all 6 dimensions

**Effort Tier**:
- 1.0-1.5: XS (< 1 day)
- 1.5-2.5: S (1-3 days)
- 2.5-3.5: M (1-2 weeks)
- 3.5-4.5: L (2-4 weeks)
- 4.5-5.0: XL (1-2 months)

## Success Criteria

At completion:
- [ ] Audit document created with all frontmatter
- [ ] All content types discovered and catalogued
- [ ] Content inventory table complete (type, volume, languages, assets)
- [ ] Quality scores assigned per type using 4-tier model
- [ ] Complexity scores calculated per type (6 dimensions)
- [ ] Effort estimates generated (T-shirt sizing)
- [ ] Strategic recommendations documented
- [ ] Findings reviewed with stakeholders
- [ ] Status marked `complete`

## Next Steps After Audit

The audit output feeds into:

1. **Content Modelling** (`dept-opti-content-model`) - Define CMS-agnostic model, validate against target
2. **Platform Assessment** (`dept-opti-platform-assessment`) - Use complexity/effort to guide CMS 12 vs SaaS CMS decision
3. **Migration Planning** (`dept-opti-migration-plan`) - Use inventory and complexity to build wave plan and effort estimates

## Effort Estimate

- **Total workflow time**: 2-4 hours depending on system size
- Step 1: 30 minutes (platform detection, context setup)
- Step 2: 1-2 hours (content discovery - varies widely)
- Step 3: 45-60 minutes (scoring and recommendations)
