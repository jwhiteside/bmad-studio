---
step: 1
name: Platform Detection and Audit Initialization
workflow: dept-opti-source-audit
status: pending
---

# Step 1: Platform Detection and Audit Initialization

## MANDATORY EXECUTION RULES

1. **Before any detection**, gather and document:
   - Current system name and version
   - Project/client name and business context
   - Current content volume (rough estimates acceptable)
   - Known pain points and drivers for migration

2. **Platform detection** is authoritative. If uncertain:
   - Check system logos, admin panel branding
   - Query database system tables or config files
   - Review API documentation
   - Inspect markup/source patterns
   - Ask stakeholders

3. **Output document must exist** before proceeding to step-02
   - Create in Google Docs, Markdown, or user's preferred format
   - Must include frontmatter
   - Must be readable and editable by stakeholders

## EXECUTION PROTOCOLS

### Phase A: Context Gathering (5 minutes)

**Ask the user**:

> I'll help you audit your current system for migration to Optimizely. First, let me gather some context.
>
> **1. Project name and business goal**
> - What are we calling this project?
> - Why are we migrating? (new capabilities, consolidation, cost, platform EOL, performance, etc.)
>
> **2. Current system**
> - What CMS do you currently use? (e.g., WordPress, Drupal, Sitecore, AEM, Contentful, custom)
> - What version? (e.g., WordPress 6.4, AEM 6.5, Drupal 10)
> - When was it implemented?
>
> **3. Content landscape (rough estimates)**
> - How many content pieces/pages roughly? (100s, 1000s, 10,000s, 100,000s?)
> - How many languages?
> - Is content mostly pages/posts, or mix of types?
> - How many assets (images, PDFs, videos)?
>
> **4. Access and constraints**
> - Do we have admin access to the source system?
> - Are there any compliance/data residency constraints?
> - What's the rough timeline for migration?

Document all responses in a shared doc or email.

### Phase B: Platform Detection (10 minutes)

Based on responses, detect the source platform with high confidence:

**WordPress signals**:
- Admin URL pattern: `/wp-admin`
- Database: `wp_posts`, `wp_postmeta`, `wp_terms` tables
- Plugins: Yoast, Elementor, WooCommerce common
- Content: Posts and custom post types
- Media: `/wp-content/uploads` structure

**Drupal signals**:
- Admin URL: `/admin`
- Database: `nodes`, `node_field_data`, `users` tables
- Modules: Views, Paragraphs, Migrate common
- Content: Nodes with fields
- Media: `/sites/default/files` or `/public` storage

**Sitecore signals**:
- Admin URL: `/sitecore`
- Content Tree structure with versioning
- Language variants per item
- Workflows and publishing pipelines
- Commerce integration common
- Database: Master and Web databases

**AEM signals**:
- Admin URL: `/aem`
- Component-based content model
- DAM for assets
- .NET or Java backend
- Content hierarchy (sites → pages → components)
- Workflows and launch calendars

**Contentful signals**:
- API-first, no visual admin
- Content types defined via CLI/API
- Preview API and Delivery API
- Webhook-based publishing
- No native media storage (uses CDN)

**Custom signals**:
- Proprietary naming and structure
- No standard CMS indicators
- Likely requires deeper investigation

**If platform is unclear**:
- Check system About page or admin help
- Review configuration files (web.config, config.php, settings.py, etc.)
- Query database `information_schema`
- Search recent git commits for clues
- Ask infrastructure team

Document detected platform in shared doc.

### Phase C: Platform-Specific Knowledge Load (5 minutes)

Once platform is confirmed, I will mentally load platform-specific knowledge:

**WordPress context**:
- Post types, custom fields (ACF), taxonomies common
- Theme and plugin architecture
- Import/export via XML
- REST API available (WP REST API)
- Typical scaling: 10K - 1M posts

**Drupal context**:
- Node and field architecture
- Paragraph bundles (nested content)
- Views for dynamic content
- Module ecosystem
- Migration framework
- Typical scaling: 10K - 100K nodes

**Sitecore context**:
- Item architecture, templates, layouts
- Media Library organization
- Publishing targets (staging, live, preview)
- Personalization rules
- Analytics integration
- Typical scaling: 1K - 50K items

**AEM context**:
- Pages, components, assets separation
- Experience Fragments for reuse
- Launch calendars and rollout
- Dispatcher caching
- Targeting and personalization
- Typical scaling: 1K - 50K pages

**Contentful context**:
- Content models and entries
- Assets and binary files
- Content references and relationships
- Webhooks for publishing
- API rate limits (20 req/sec Delivery API)
- Typical scaling: 5K - 100K entries

Record platform knowledge in audit document.

### Phase D: Audit Document Initialization (10 minutes)

Create the audit document with frontmatter:

```markdown
---
project: [project name]
client: [if applicable]
status: in-progress
stepsCompleted: 1
date_created: [today]
last_updated: [today]
sourcePlatform: [detected platform]
sourcePlatformVersion: [version if known]
targetPlatform: "[CMS 12 or SaaS CMS - TBD]"
auditedBy: [your name]
stakeholders:
  - [stakeholder name/role]
accessLevel: admin
dataRefreshDate: [today]
---

# Source System Audit Report

**Project**: [project name]
**Source System**: [platform name and version]
**Audit Date**: [today]
**Auditor**: [your name]

## Executive Summary

[1-2 sentence business context for this audit]

## Current System Overview

| Attribute | Value |
|-----------|-------|
| Platform | [platform name] |
| Version | [version] |
| Implemented | [year] |
| Admin Access | Yes / No |
| Content Volume | [estimate] |
| Languages | [count] |
| Content Types | [estimate] |
| Assets | [rough count] |

## Audit Scope

This audit will:
- [ ] Discover all content types and volumes
- [ ] Apply quality assessment (4-tier model)
- [ ] Score complexity across 6 dimensions
- [ ] Estimate migration effort
- [ ] Recommend migration approach

---

## Section 1: Content Inventory

*To be populated in step-02*

## Section 2: Quality Assessment

*To be populated in step-03*

## Section 3: Complexity Scoring

*To be populated in step-03*

## Section 4: Strategic Recommendations

*To be populated in step-03*

---

**Next Step**: Content Inventory (step-02)
```

Save this document in shared location (Google Docs, GitHub, Confluence, etc.) where all stakeholders can access it.

### Phase E: Target Platform Discovery (5 minutes)

**Ask the user about target platform**:

> Before we dive into inventory, let me understand your target platform preference.
>
> **Optimizely has two main CMS platforms**:
>
> **1. CMS 12 (PaaS)**
> - .NET-based, managed platform
> - PageData and BlockData content models
> - Visual editing with component model
> - DXP Cloud deployment (Optimizely hosts)
> - ContentReference and ContentArea for relationships
> - Best for: .NET shops, complex personalization, large teams, on-premises integration
>
> **2. SaaS CMS**
> - API-first, content hub model
> - Content types via SDK/CLI or REST API
> - Visual Builder for composition
> - Experiences and Sections architecture
> - Content Graph as unified API layer
> - Best for: Headless/omnichannel, rapid iteration, JavaScript/modern frameworks, distributed teams
>
> **3. Commerce**
> - Either platform can integrate Optimizely Commerce
> - CMS 12: Deep integration, shared .NET codebase
> - SaaS CMS: API integration via webhooks
>
> **Which sounds closer to your needs?** Or shall we defer this choice until we assess in step-03 (Platform Assessment)?

Document target direction in audit frontmatter. If deferred, note it.

## CONTEXT BOUNDARIES

- **In scope**: Gathering project context, platform detection, initializing audit document
- **Out of scope**: Running the actual audit (that's step-02 and step-03)
- **Not your task**: Building migration code or content schemas yet

## YOUR TASK

1. Gather project context and business drivers
2. Detect source platform with confidence
3. Load platform-specific knowledge
4. Create and share audit document with frontmatter
5. Understand target platform options (CMS 12 vs SaaS CMS)
6. Confirm step-01 complete and move to step-02

## INITIALIZATION SEQUENCE

```
1. Ask context questions → document responses
2. Detect platform → confirm with user
3. Load platform knowledge → note in audit doc
4. Create audit document → share with stakeholders
5. Discuss target platform options → update frontmatter
6. Confirm step-01 complete → move to step-02
```

## SUCCESS METRICS

At the end of this step, you should have:

- [x] Project context documented (name, goals, timeline, constraints)
- [x] Source platform detected and confirmed
- [x] Platform-specific knowledge loaded and noted
- [x] Audit document created with frontmatter
- [x] Document shared with stakeholders
- [x] Target platform direction understood (defer or preliminary choice)
- [x] Step count incremented to 1 in frontmatter
- [x] Next step is clearly step-02 (Content Inventory)

## FAILURE MODES

| Failure | Signal | Recovery |
|---------|--------|----------|
| Platform unclear | User can't name CMS | Investigate system signals, check database, ask IT |
| No admin access | User has read-only | Arrange for admin credentials or request system export |
| Project context vague | User unsure of goals | Schedule stakeholder alignment meeting before proceeding |
| No shared doc tool available | Can't save audit | Use plain text email threads, create local Markdown file |
| Target platform unknown | User defers decision | Note as TBD, continue audit, decide in Platform Assessment |

## NEXT STEP

Once step-01 is complete:
- Move to **step-02-content-inventory.md**
- User will systematically discover all content types and volumes
- Input: Platform knowledge + access to source system
- Output: Content inventory table (type, volume, languages, assets)

---

**Step 1 Status**: [PENDING → IN PROGRESS → COMPLETE]

Update frontmatter `status: complete` and `stepsCompleted: 1` when done.
