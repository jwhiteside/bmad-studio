---
step: 1
name: Input Discovery and Raw Inventory
workflow: dept-opti-content-model
status: pending
---

# Step 1: Input Discovery and Raw Inventory

## MANDATORY EXECUTION RULES

1. **Input acceptance** - Handle multiple sources seamlessly:
   - URLs to live content (crawl and analyze)
   - CMS exports (XML, JSON, CSV)
   - Uploaded documents (PDFs, spreadsheets)
   - Screenshots (analyze structure visually)
   - Database dumps (parse schema)

2. **Source audit required** - Cannot proceed without audit report
   - Load source audit report (Content Inventory from step-02-content-inventory)
   - Extract list of all content types and volumes
   - Review quality and complexity assessments
   - Confirm target platform direction

3. **Target platform confirmation**:
   - If user defers choice, recommend Platform Assessment workflow first
   - If CMS 12: Load PageData/BlockData patterns
   - If SaaS CMS: Load content type model patterns
   - Document platform choice in frontmatter

4. **Output model document must exist** before proceeding to step-02
   - Create in shared location
   - Include frontmatter with all metadata
   - Include raw inventory section for reference

## EXECUTION PROTOCOLS

### Phase A: Source Content Input (20 minutes)

**Ask the user**:

> I need to understand what we're modeling. Can you provide source content samples?
>
> **Multiple options**:
> 1. **Live URLs** - I can crawl and analyze structure
>    - Example: "Our blog is at example.com/blog, products at example.com/products"
> 2. **CMS Export** - If you have an export file
>    - WordPress XML, Drupal exports, Contentful JSON, etc.
> 3. **Screenshots** - Visual samples of each content type
> 4. **Documents** - Any PDFs, specs, or data documentation
> 5. **Database schema** - SQL CREATE TABLE statements or ER diagrams
> 6. **Mix** - Some of each
>
> **What do you have available?** Can you share 2-3 examples of each major content type?

Accept and parse provided inputs:

**For URLs**:
- Crawl 5-10 pages per type
- Analyze HTML structure (headings, metadata, relationships)
- Screenshot for reference
- Identify repeating patterns

**For CMS Exports**:
- Parse XML/JSON structure
- Extract field names and data types
- Identify relationships (references, collections)
- Note any custom fields

**For Screenshots**:
- Analyze visual structure and components
- Identify content areas vs UI layout
- Note repeating patterns across types

**For Documents**:
- Extract any data model diagrams or field lists
- Note business definitions
- Identify gaps or unclear relationships

**For Database Schemas**:
- Map table/collection structure
- Identify foreign keys and relationships
- Note field types and constraints

Document all inputs in model document:

```markdown
## Input Sources

### Sources Provided

| Source Type | Examples | Notes |
|---|---|---|
| Live URLs | blog.example.com/blog, example.com/products, ... | ~15 pages crawled |
| CMS Export | WordPress XML dump (Aug 2024) | 8,472 posts exported |
| Screenshots | Product page variants, blog post layouts | 10 screenshots analyzed |
| Database | MySQL schema dump | Reviewed wp_posts, wp_postmeta tables |
| Documents | Specification doc, content audit report | Reviewed for field definitions |

### Raw Content Inventory (From Source Audit)

[Import table from step-02-content-inventory of source audit]

- **Blog Post**: 8,472 published, 342 drafts, EN/FR/DE, 2-3 images each
- **Case Study**: 156 published, 8 drafts, EN only, 5-10 images + PDFs
- **Product**: 2,341 published, 0 drafts, EN/FR, 15-20 images, variants
- **Team Member**: 87 items (auto-generated), EN only, 1 image each
- **Landing Page**: 34 published, 156 drafts (inactive), EN only
- **FAQ**: 203 items, EN only, no assets
- **Media**: 14,293 assets in DAM
- **Video Page**: 18 published, EN only, YouTube embeds
```

### Phase B: Audit Report Integration (10 minutes)

**Load and reference source audit**:

Ask the user:

> Do you have the Source Audit Report from the previous workflow (dept-opti-source-audit)?
>
> I need:
> - Content Inventory table (types, volumes, languages, assets)
> - Quality assessments (Gold/Silver/Bronze/Lead)
> - Complexity scores (6-dimensional)
> - Strategic recommendations
>
> Can you share that document link or upload it?

If audit report exists, extract:
- **Content types list** (authoritative)
- **Volume per type** (for completeness context)
- **Language patterns** (to inform type structure)
- **Quality tiers** (impacts validation rules)
- **Asset relationships** (to inform reference design)
- **Strategic notes** (cleanup, consolidation, integration decisions)

If audit report missing, get minimal info:
- "What are the main content types?"
- "Roughly how many of each?"
- "How many languages?"
- "Which types have assets?"

Document in model:

```markdown
## Source Audit Reference

**Audit Report**: [link to audit document]
**Audit Date**: [date]
**Total Content Volume**: 11,311 published items + 506 drafts
**Total Assets**: 14,293 media items (~5.5 GB)
**Languages**: EN (primary), FR (85% coverage), DE (60% coverage)

**Quality Distribution**:
- Gold: Case Studies, FAQs, Videos (well-structured)
- Silver: Blog Posts, Landing Pages, Media (good overall)
- Bronze: Products, Team Members (needs cleanup)

**Complexity Distribution**:
- XS (1-2): FAQs, Videos
- S (2-3): Case Studies, Landing Pages, Team Members, Media
- M (3-4): Blog Posts, Products
- Estimated migration effort: 4-6 weeks content time

**Key Recommendations**:
- Clean up blog drafts (200+) pre-migration
- Archive 156 inactive landing pages
- Do NOT migrate Team Members; integrate from HRIS
- Batch-rename assets for clarity
- Plan translations; defer German to wave 2
```

### Phase C: Target Platform Decision (15 minutes)

**Determine target platform**:

Ask the user:

> **Target Platform Decision**
>
> The content model will differ based on your target Optimizely platform.
>
> **Option 1: CMS 12 (PaaS, .NET)**
> - Managed by Optimizely; you don't host
> - Component-based page model (PageData + BlockData)
> - ContentArea for dynamic block collections
> - ContentReference for relationships
> - Best if: .NET team exists, complex personalization needs, deep Commerce integration
>
> **Option 2: SaaS CMS (API-first, Headless)**
> - Content hub; decoupled from presentation
> - Flexible content types defined via SDK/CLI
> - Content Graph as unified API
> - Visual Builder for composition
> - Best if: Headless/omnichannel, JavaScript team, rapid iteration preferred
>
> **Which is closer to your situation?**
> - Have you already decided?
> - Or should we defer this to the Platform Assessment workflow?

Document target platform in frontmatter:

```yaml
targetPlatform: "CMS 12"  # or "SaaS CMS" or "TBD"
platformDecisionOwner: [who decided]
platformDecisionDate: [when]
platformRationale: "[e.g., 'Existing .NET team, Commerce integration critical']"
```

If target is **TBD**, note and continue with agnostic model:

```markdown
## Target Platform

**Status**: To be determined (deferred to Platform Assessment workflow)

This model is designed to be platform-agnostic and can be validated against either CMS 12 or SaaS CMS once the platform decision is made.

**Tentative platform**: [if user has preference]
```

If target is **CMS 12**, load context:

```markdown
## Target Platform: CMS 12 (PaaS)

**Platform Model**:
- All content inherits from IContent
- Pages extend PageData
- Reusable blocks extend BlockData
- Dynamic content via ContentArea (block collections)
- Cross-item references via ContentReference
- Images/documents via MediaData

**Key Constraints for Content Modelling**:
1. All types must support IContent base (Name, URL, Publishing state, Created/Modified)
2. Relationships use ContentReference (parent-child via EPiServer API)
3. Dynamic blocks in ContentArea must be independent types
4. Multilingual support via versioning per language
5. Workflows and scheduling built-in

**Examples of CMS 12 Types from Optimizely Docs**:
- `BlogPost` (PageData) → published page with title, body, author
- `BlogAuthor` (PageData) → reusable author info
- `BlogImage` (BlockData) → reusable image block
- `BlogContent` (BlockData) → rich text block
- `BlogMetadata` (BlockData) → SEO/analytics metadata

**What this means for design**:
- Blog posts → Page type
- Reusable author cards → Block type (or content reference)
- Image gallery → Block type with asset array
- Product variants → Child pages or reference array
- Navigation taxonomy → Virtual structure or reference collection
```

If target is **SaaS CMS**, load context:

```markdown
## Target Platform: SaaS CMS

**Platform Model**:
- Flexible content types (defined via SDK/CLI or REST API)
- No inheritance; each type is independent
- Sections group related fields (visual grouping)
- References link to other content entries
- Localization per entry (native language variants)
- Visual Builder for composition (no code required)

**Key Constraints for Content Modelling**:
1. Content types are flat; no inheritance hierarchy
2. References can be 1-to-1 or 1-to-many arrays
3. Asset references via Asset type
4. Sections optional but recommended for organization
5. No built-in workflow; typically external

**Examples of SaaS CMS Types from Optimizely Docs**:
- `BlogPost` → type with fields: title, body, author (reference), date, image (asset)
- `BlogAuthor` → type with fields: name, email, bio, photo (asset)
- `Product` → type with fields: name, description, price, images (asset array), variants (reference array)
- `FAQItem` → type with fields: question, answer, category (reference)
- `LandingPage` → type with fields: title, sections (block array), hero (asset)

**What this means for design**:
- Simpler types (fewer fields each)
- Content references instead of containment
- Asset management separate but integrated
- Sections for visual organization
- No inheritance; focus on composition
```

### Phase D: Model Document Initialization (10 minutes)

Create the content model document:

```markdown
---
project: [project name]
status: in-progress
stepsCompleted: 1
date_created: [today]
last_updated: [today]
sourcePlatform: [from audit]
targetPlatform: [CMS 12 or SaaS CMS or TBD]
contentArchitect: [your name]
stakeholders:
  - [content lead]
  - [technical lead]
  - [business owner]
modelApproach: "CMS-agnostic first, then validate against [target]"
---

# Content Model Design

**Project**: [project name]
**Source Platform**: [platform from audit]
**Target Platform**: [CMS 12 or SaaS CMS]
**Content Architect**: [your name]
**Model Date**: [today]

## Executive Summary

This document defines the content model for migration from [source] to Optimizely [target].

The model is based on the Source Audit Report which identified [X] content types and [Y] total items.

This model will:
- Define each content type with attributes and validation rules
- Separate content types from UI/layout patterns
- Map source types to target types
- Validate against [target platform] constraints
- Gate decisions requiring stakeholder input

## Input Sources

[Include table from Phase A above]

## Source Audit Reference

[Include reference from Phase B above]

## Target Platform

[Include platform context from Phase C above]

---

## Section 1: Raw Content Inventory

*To be populated in step-02*

## Section 2: Content Type Definitions

*To be populated in step-02*

## Section 3: Platform Validation

*To be populated in step-02*

## Section 4: Source-to-Target Mapping

*To be populated in step-02*

## Section 5: Decisions Required

*To be populated in step-02*

---

**Next Step**: Content Type Classification (step-02)
```

Save and share this document with stakeholders.

## CONTEXT BOUNDARIES

- **In scope**: Understanding inputs, loading source audit, confirming platform
- **Out of scope**: Designing content types (that's step-02)
- **Not your task**: Building implementation code or migration scripts yet

## YOUR TASK

1. Gather and parse source content inputs (URLs, exports, screenshots)
2. Load source audit report and extract content inventory
3. Understand and confirm target platform (CMS 12 or SaaS CMS)
4. Create and share model document with frontmatter
5. Document all inputs and source data
6. Confirm step-01 complete and move to step-02

## INITIALIZATION SEQUENCE

```
1. Ask for source content inputs → parse all sources
2. Request source audit report → integrate findings
3. Confirm target platform → load platform patterns
4. Create model document → share with stakeholders
5. Confirm step-01 complete → ready for step-02
```

## SUCCESS METRICS

At the end of this step, you should have:

- [x] Multiple source inputs accepted and documented
- [x] Source audit report loaded and integrated
- [x] Target platform decided (or deferred with rationale)
- [x] Content model document created with frontmatter
- [x] Document shared with stakeholders
- [x] All input sources documented
- [x] Raw inventory imported
- [x] Target platform context loaded
- [x] Step count incremented to 1
- [x] Next step is clearly step-02 (Content Type Classification)

## FAILURE MODES

| Failure | Signal | Recovery |
|---------|--------|----------|
| No source content available | User has no examples | Request exports or arrange demo access |
| Audit report missing | Can't find inventory | Run source audit first or get manual list |
| Target platform unclear | User unsure of CMS 12 vs SaaS CMS | Recommend Platform Assessment workflow; proceed with agnostic model |
| Conflicting information | Sources disagree on types | Resolve with stakeholders; document discrepancy |
| No shared document tool | Can't save model | Use email threads, local Markdown, or Google Docs |

## NEXT STEP

Once step-01 is complete:
- Move to **step-02-classify.md**
- Apply four-question test to classify types vs patterns
- Design attributes, validation, relationships
- Output: Complete content model ready for review and platform validation

---

**Step 1 Status**: [PENDING → IN PROGRESS → COMPLETE]

Update frontmatter `status: complete` and `stepsCompleted: 1` when done.
