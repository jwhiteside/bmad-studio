# Workflow: Content Model Design for Optimizely

**Skill**: `dept-opti-content-model`
**Goal**: Design CMS-agnostic content model, validate against target platform
**Role**: Content Architect
**Outputs**: Content Model Document, Type Definitions, Platform Validation, Source-Target Mapping

## Workflow Overview

This workflow transforms raw content inventory into a structured, platform-agnostic content model, then validates it against your target platform's architectural patterns.

The model serves as the bridge between "what exists" (source audit) and "how to build it" (technical implementation).

## Initialization Rules

**Before starting**, ensure:
- Source audit report is complete (inventory and complexity scores)
- You have access to source content samples (URLs, exports, or screenshots)
- Target platform is roughly decided (CMS 12 or SaaS CMS, or defer decision)
- You have content stakeholder availability for review

**Model document frontmatter** must include:
```yaml
project: [project name]
status: in-progress
stepsCompleted: 0
date_created: [today]
sourcePlatform: [platform from audit]
targetPlatform: [CMS 12 or SaaS CMS]
contentArchitect: [your name]
stakeholders:
  - [content lead]
  - [technical lead]
```

## Step Sequence

1. **step-01-init.md** - Input discovery and raw inventory parsing
2. **step-02-classify.md** - Content type classification and attribute design

## State Management

The model document tracks state via frontmatter:
- `stepsCompleted` increments as you progress
- `status` changes: `in-progress` → `review` → `approved`
- `targetPlatform` is confirmed in step-01
- `typeDefinitions` and `platformValidation` are added in step-02

## Key Concepts

### Four-Question Test (Content Type Classification)

To distinguish **content types** from **UI patterns**, ask four questions:

**Question 1**: "Are humans the primary authors?"
- **Yes** → This is likely a content type (editorial content)
- **No** → This might be a UI pattern or configuration (template, layout)

**Question 2**: "Is it published and indexed?"
- **Yes** → Likely a content type (appears on website, has URLs)
- **No** → Might be internal configuration or unpublished

**Question 3**: "Is it reused across multiple contexts?"
- **Yes** → Likely a content type (appears in multiple places, high reuse potential)
- **No** → Might be a one-off UI pattern

**Question 4**: "Does the target platform have first-class support for it?"
- **Yes** → Model as native content type
- **No** → Model as custom relationship or configuration

**Example application**:

| Item | Q1: Authored? | Q2: Published? | Q3: Reused? | Q4: Native Support? | Classification |
|------|---|---|---|---|---|
| Blog Post | Yes | Yes | Yes | Yes (CMS 12: Page) | **Content Type** |
| Featured Image on Homepage | Yes (picked, not written) | Yes | No (unique) | No | **UI Component** (not a type) |
| Product | Yes | Yes | Yes | Yes (if CMS 12 + Commerce) | **Content Type** |
| Product Variant | Partial (auto-generated) | No | Yes | Maybe (CMS 12: child item) | **Content Type or Child** |
| Custom CSS | No | No | Partial (design system) | No | **Configuration** (not a type) |
| FAQ | Yes | Yes | Yes | Yes (CMS 12: Page) | **Content Type** |
| FAQ Category | No (organizing mechanism) | No | Yes | Maybe (taxonomy) | **Taxonomy** (not a type) |

### Platform-Specific Patterns

**CMS 12 (PaaS, .NET)**:
- **PageData**: Base class for all pages; inherits IContent
- **BlockData**: Reusable block components; also inherit IContent
- **ContentArea**: Container for dynamic block collections
- **ContentReference**: Links to other IContent items
- **ContentLink**: Lightweight identifier for relationships
- **MediaData**: Images, documents in DAM
- **Standard fields**: Name (ItemName), URL, Created/Modified, etc.

**SaaS CMS**:
- **Content Types**: Define via SDK/CLI or REST API; no inheritance model
- **Sections**: Grouping mechanism for related fields (similar to CMS 12 blocks)
- **Components**: Reusable field structures (similar to CMS 12 block properties)
- **References**: Link to other content entries
- **Assets**: Images, documents hosted separately or via CDN
- **Localization**: Built-in language variant support per entry

## Success Criteria

At completion:
- [ ] Content model document created with frontmatter
- [ ] All content types defined with attributes
- [ ] Attributes include validation rules and required/optional
- [ ] Relationships mapped (references, collections, parent-child)
- [ ] Separation of types from UI patterns clear
- [ ] Validated against target platform patterns
- [ ] Source-to-target mapping complete
- [ ] Open questions documented and gated
- [ ] Stakeholders review and approve model
- [ ] Status marked `review` or `approved`

## Next Steps After Modelling

The content model feeds into:

1. **Migration Planning** (`dept-opti-migration-plan`) - Use model to build source-to-target mapping
2. **Technical Architecture** (`dept-opti-architecture`) - Use model to design .NET/JS implementation
3. **Content Implementation** (custom workflow) - Build content types in target platform

## Effort Estimate

- **Total workflow time**: 4-6 hours depending on complexity
- Step 1: 1-1.5 hours (source parsing, context discovery)
- Step 2: 3-4.5 hours (classification, attribute design, platform validation)

## Decision Gates

The model may reveal **open questions** that need stakeholder or technical team decisions:
- "Should Product variants be separate entries or sub-items?"
- "How to handle legacy taxonomy migration?"
- "Custom fields without clear purpose - keep or discard?"

Document these **decisions required** and gate progress until answered.
