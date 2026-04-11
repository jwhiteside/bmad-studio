---
canonicalId: dept-opti-source-audit
name: "Source System Audit for Optimizely Migration"
description: "Systematically audit a source content management system to establish baseline inventory, quality metrics, and complexity tiers for migration to Optimizely (CMS 12 or SaaS CMS)."
domain: optimizely
category: analysis
---

# Source System Audit for Optimizely Migration

**Entry Point**: `dept-opti-source-audit`

This skill audits a source content system to establish a baseline for migration to Optimizely. It produces a comprehensive content inventory, quality scores, and complexity tiers that inform all downstream migration decisions.

## What This Skill Does

Systematically analyzes a source system to answer:
- What content exists? (types, volumes, languages, assets)
- How good is it? (quality metrics across four tiers)
- How complex is it to migrate? (scoring across six dimensions)
- What effort will migration require? (rough estimates)

## When To Use It

Start a migration programme by auditing the source system. This skill is the foundation for content modelling, platform assessment, and migration planning.

## Inputs

- Access to source system (CMS admin, exports, database)
- User knowledge of current platform and content structure

## Outputs

- Source Audit Report (markdown with YAML frontmatter)
- Content Inventory table (types, volumes, languages, assets)
- Quality Scores (4-tier model per content type)
- Complexity Tiers (6-dimensional scoring)
- Effort Estimates (rough T-shirt sizing)
- Strategic Recommendations

## Process

The skill delegates to `workflow.md` which guides you through three steps:

1. **Initialize** - Detect platform, set up audit document
2. **Content Inventory** - Discover all content types and volumes
3. **Assessment** - Apply quality and complexity scoring

Total time: 2-4 hours depending on system size

## Success Criteria

✓ Audit document complete with frontmatter
✓ All content types catalogued with volumes
✓ Quality scores assigned
✓ Complexity tiers calculated
✓ Effort estimates provided
✓ Strategic recommendations documented
