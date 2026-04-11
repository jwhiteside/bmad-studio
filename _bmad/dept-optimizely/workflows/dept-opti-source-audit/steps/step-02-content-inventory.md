---
step: 2
name: Content Inventory and Discovery
workflow: dept-opti-source-audit
status: pending
dependsOn: step-01-init
---

# Step 2: Systematic Content Discovery

## MANDATORY EXECUTION RULES

1. **Exhaustive discovery** - Identify every content type that exists in source system
   - Don't skip "minor" types - they matter for migration effort
   - Include web pages, posts, products, assets, taxonomies, configurations, anything authored

2. **Volume accuracy** - Get real counts, not estimates
   - Query database directly if possible
   - Use system admin reports (WordPress Stats, Drupal Reports, etc.)
   - Export and count if necessary
   - If exact count impossible, provide best estimate with confidence range

3. **Language variants** - Document all language codes and translation patterns
   - Single source with translations?
   - Per-language duplicates?
   - Partial translation coverage?
   - Translation workflow (manual, CAT tool, API)?

4. **Asset dependencies** - For each content type, document media relationships
   - Featured images?
   - Gallery components?
   - Document attachments?
   - Videos (embedded or uploaded)?
   - Total asset count and storage volume

5. **Inventory table must be complete before moving to step-03**

## EXECUTION PROTOCOLS

### Phase A: Content Type Enumeration (30 minutes)

Based on platform detected in step-01, enumerate all content types:

**WordPress approach**:
```sql
SELECT post_type, COUNT(*) as count, MAX(post_date) as last_modified
FROM wp_posts
WHERE post_status IN ('publish', 'draft', 'pending')
GROUP BY post_type
ORDER BY count DESC;
```

Expected types: `post`, `page`, `attachment`, plus custom post types (e.g., `product`, `case_study`)

**Drupal approach**:
```sql
SELECT type, COUNT(*) as count, MAX(created) as last_modified
FROM node
GROUP BY type
ORDER BY count DESC;
```

Expected types: `article`, `page`, `product`, plus custom node types

**Sitecore approach**:
- Use Content Editor to navigate tree
- For each branch, note item template
- Use Reporting dashboard to get counts
- Expected: Pages (site structure), Media (images, documents), Renderings (reusable components)

**AEM approach**:
- Use Sites console to explore page hierarchy
- Use Assets console for DAM
- Expected: cq:Page, cq:PageContent, dam:Asset, nt:unstructured components

**Contentful approach**:
```bash
# List all content types
contentful space export --space-id XXX --management-token XXX

# Or via API:
curl "https://api.contentful.com/spaces/XXX/content_types" \
  -H "Authorization: Bearer XXX" | jq '.items[].sys.id'
```

Expected: Content types as defined in content model

**Custom systems**:
- Inspect source code comments or data model documentation
- Query database directly for table/collection names
- Ask development team for content architecture

**For each content type discovered, record**:
- Type name
- Official display name
- Brief description of purpose
- Whether it's an editorial type (humans author it) or technical type (auto-generated)
- Example URL or reference (if editorial)

### Phase B: Volume Counting (45 minutes)

For each content type, get accurate counts:

**WordPress**:
```sql
-- For each post type:
SELECT post_type, COUNT(*) as published,
       SUM(CASE WHEN post_status='draft' THEN 1 ELSE 0 END) as drafts,
       SUM(CASE WHEN post_status='trash' THEN 1 ELSE 0 END) as trashed
FROM wp_posts
WHERE post_type = 'post'  -- replace with each type
GROUP BY post_type;
```

**Drupal**:
```sql
SELECT type,
       COUNT(CASE WHEN status=1 THEN 1 END) as published,
       COUNT(CASE WHEN status=0 THEN 1 END) as unpublished
FROM node
WHERE type = 'article'  -- for each type
GROUP BY type;
```

**Sitecore**:
- Use Reporting Dashboard > Content Audit > Item Count by Template
- Or use PowerShell: `Get-Item -Path "master:\content\..." | Get-ChildItem -Recurse | Where-Object {$_.TemplateName -eq "Page"} | Measure-Object`

**AEM**:
- Use Assets console > Collections > size filter
- Or use Oak index query to count cq:Page items
- Or use Query Builder API

**Contentful**:
```bash
curl "https://api.contentful.com/spaces/XXX/entries?content_type=blog_post" \
  -H "Authorization: Bearer XXX" | jq '.total'
```

**Tips for accurate counts**:
- Include published + draft + archived (may migrate some drafts)
- Distinguish between "authored content" and "system content"
- Note if counts include deleted/trashed items (typically exclude)
- If database unavailable, sample export and extrapolate

### Phase C: Language Variant Mapping (20 minutes)

For each content type, understand translation patterns:

**Possible patterns**:

1. **Single source, translations**: One "master" item in language A, translations managed in separate fields or system
   - Example: WordPress with WPML, Drupal i18n, Sitecore language variants
   - Migration effort: Clone master for each language
   - Count: Original + (count × language count)

2. **Per-language duplicates**: Separate "Article (EN)" and "Article (FR)" versions
   - Example: Duplicate pages per language
   - Migration effort: Higher - move all copies
   - Count: Original × language count already included in volume

3. **Partial coverage**: Some content translated, some not
   - Example: Blog posts in EN only, product pages in EN+FR
   - Migration effort: Content-type specific
   - Count: Track translated vs. untranslated separately

4. **No translations**: All content in one language
   - Migration effort: Simpler
   - Count: No multiplier

For each content type, ask:
- How many languages? (e.g., EN, FR, DE, ES)
- Are translations complete, partial, or missing for some types?
- Who manages translations? (content team, translation agency, in-house?)
- What CAT tool if any? (Phrase, SDL, etc.)

Document pattern and language codes in audit document.

### Phase D: Asset Dependency Analysis (30 minutes)

For each content type, understand asset relationships:

**Key questions**:

1. **Does this type use images?**
   - Featured/hero image (1 per item)?
   - Gallery/carousel (many per item)?
   - Inline images in rich text?
   - Document attachment links?

2. **What are typical asset counts per type?**
   - Pages: 1-5 images (hero + inline)
   - Products: 5-20 images (gallery, variants)
   - Blog posts: 1-3 images (featured + inline)
   - Media library items: 1 asset each (by definition)

3. **Asset types and storage**:
   - Images: JPG, PNG, WebP, GIF - typical sizes?
   - Documents: PDF, DOCX, XLSX - sizes?
   - Videos: MP4, WebM - hosted where? (CDN, embedded YouTube, local?)
   - Total storage volume?

4. **Current asset delivery**:
   - Direct URLs to uploaded assets?
   - Image transformation/resizing via CMS? (Sitecore Image Engine, AEM Dynamic Media, etc.)
   - CDN in front?
   - Any custom image processing?

**Count total assets**:
```sql
-- WordPress:
SELECT COUNT(*) as total_assets,
       COUNT(CASE WHEN post_type='attachment' AND post_mime_type LIKE 'image%' THEN 1 END) as images,
       COUNT(CASE WHEN post_type='attachment' AND post_mime_type='application/pdf' THEN 1 END) as pdfs
FROM wp_posts
WHERE post_type='attachment';

-- Drupal:
SELECT COUNT(*) as total_assets FROM file_managed;

-- AEM DAM:
SELECT COUNT(*) FROM dam:Asset nodes in Assets console
```

Document in audit:
- Total asset count
- Breakdown by type (images, documents, videos)
- Typical asset size (storage volume / count)
- Asset-to-content ratios per type
- Whether migration will move assets or re-source from original

### Phase E: Inventory Table Construction (20 minutes)

In the audit document, create comprehensive inventory table:

```markdown
## Content Inventory

| Content Type | Description | Published | Drafts | Languages | Assets per | Quality Signal | Est. Size (MB) | Notes |
|---|---|---|---|---|---|---|---|---|
| **Blog Post** | Editorial articles | 8,472 | 342 | EN, FR, DE | 2-3 images | Consistent metadata | 500 | Using Yoast SEO |
| **Case Study** | Customer stories | 156 | 8 | EN | 5-10 images + PDF | Good structure | 200 | Custom ACF fields |
| **Product Page** | E-commerce items | 2,341 | 0 | EN, FR | 15-20 images | Inconsistent variants | 1,200 | WooCommerce, needs cleanup |
| **Team Member** | Staff profiles | 87 | 0 | EN | 1 image | Sparse metadata | 50 | Auto-generated from HRIS |
| **Media Library** | Asset repository | N/A | N/A | N/A | N/A | Good naming | 3,500 | Organized in folders |
| **Landing Page** | Campaign pages | 34 | 156 | EN | 3-5 images | Variable quality | 150 | Many inactive versions |
| **FAQ Item** | Knowledge base | 203 | 0 | EN | No assets | Simple text | 2 | Could consolidate |
| **Video Page** | Video landing pages | 18 | 0 | EN | 1-2 images + video | Good | 400 | Videos hosted on YouTube |

**Summary**:
- **Total Authored Items**: 11,311 (published) + 506 (drafts)
- **Total Assets**: 14,293 images, documents, videos (~5.5 GB)
- **Languages**: 3 (EN primary, FR and DE partial)
- **Estimated Migration Volume**: 11,817 items + 14,293 assets
```

## CONTEXT BOUNDARIES

- **In scope**: Discovering what exists, counting volumes, documenting relationships
- **Out of scope**: Assessing quality (that's step-03), designing schemas, or building migration code
- **Not your task**: Deciding which content to migrate; assume all authoritative content will be migrated

## YOUR TASK

1. Enumerate all content types in source system
2. Get accurate volume counts (published, draft, archived)
3. Understand language variant patterns
4. Map asset dependencies per content type
5. Build comprehensive inventory table
6. Document findings in audit document
7. Present inventory with A/P/C menu

## INITIALIZATION SEQUENCE

```
1. Load platform-specific inventory queries → execute
2. Enumerate all content types → document each
3. Count volumes per type → confirm with reports
4. Map languages and translations → understand pattern
5. Analyze asset dependencies → count and categorize
6. Build inventory table → validate completeness
7. Present and confirm → ask for A/P/C choice
```

## SUCCESS METRICS

At the end of this step, you should have:

- [x] All content types enumerated (no surprises in step-03)
- [x] Volume counts accurate (not estimates)
- [x] Language variants documented (pattern understood)
- [x] Asset dependencies mapped (count and types)
- [x] Inventory table complete and readable
- [x] Table included in audit document
- [x] Stakeholders can review and validate
- [x] Step count incremented to 2 in frontmatter
- [x] Status updated in frontmatter

## FAILURE MODES

| Failure | Signal | Recovery |
|---------|--------|----------|
| Database query fails | Cannot access DB | Request system admin to run queries, or export data |
| Counts don't match | WordPress plugin count differs from DB | Cross-check with multiple sources, resolve discrepancies |
| Language pattern unclear | Mixed pattern detected | Document exact pattern with examples, flag for step-03 |
| Asset counts missing | Can't count images | Estimate from storage volume / typical file size |
| Content types unclear | Ambiguous naming | Get documentation from content team or code review |
| No access to system | Read-only user | Escalate to admin or request export files from IT |

## PRESENTATION (A/P/C Menu)

Once inventory is complete, present:

> **Content Inventory Complete**
>
> I've discovered **[X] content types** with **[Y] published items**, **[Z] languages**, and **[W] assets**.
>
> **Key findings**:
> - Most complex: [type] ([reason])
> - Largest volume: [type] ([count])
> - Multilingual: [pattern] ([language codes])
> - Asset-heavy: [type] ([assets per item])
>
> **Next**: In step-03, we'll apply quality scoring and complexity assessment.
>
> **What would you like to do?**
>
> - **[C]ontinue** → Move to step-03 (Quality & Complexity Assessment)
> - **[A]dvanced** → Deep dive into specific content type architecture
> - **[P]arty Mode** → Celebrate the inventory discovery! 🎉

## NEXT STEP

Once step-02 is complete:
- Move to **step-03-assessment.md**
- Apply 4-tier quality model to each content type
- Score complexity across 6 dimensions
- Generate effort estimates and strategic recommendations
- Mark workflow complete

---

**Step 2 Status**: [PENDING → IN PROGRESS → COMPLETE]

Update frontmatter `status: complete` and `stepsCompleted: 2` when done.
