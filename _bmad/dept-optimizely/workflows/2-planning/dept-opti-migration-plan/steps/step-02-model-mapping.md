---
step: 2
name: Content Model Mapping and Transformation Rules
workflow: dept-opti-migration-plan
status: pending
dependsOn: step-01-init
---

# Step 2: Content Model Mapping and Transformation Rules

## MANDATORY EXECUTION RULES

1. **Every source type mapped** to one or more target types
2. **Every field transformation documented** with rules and examples
3. **Mismatches identified and gated** (no TBD items)
4. **Transformation rules are executable** (scripts, lookups, manual rules)
5. **Mapping is validated** against target platform patterns

## EXECUTION PROTOCOLS

### Phase A: Source-to-Target Type Mapping (40 minutes)

For each source content type, map to target:

**Example: Blog Post Mapping**

```markdown
## Source Type: WordPress Post (Blog)

### Target Type Mapping

**Source → Target**: WordPress Post → Optimizely BlogPost (PageData)

**Mapping Details**:

| Source Field | Source Type | Target Field | Target Type | Transformation Rule |
|---|---|---|---|---|
| post_title | string | Title | string | Direct copy; trim whitespace |
| post_content | HTML | Body | RichText (ContentArea blocks) | Parse HTML; convert to TextBlock + ImageBlock |
| post_excerpt | string | Summary | string | Use if present; otherwise truncate first 150 chars of content |
| post_date | datetime | PublishDate | date | Direct copy |
| post_author | user_id | Author | ContentReference (AuthorPage) | Lookup author by email; create if missing |
| featured_image | image_url | FeaturedImage | MediaData | Download image; upload to CMS DAM; set reference |
| post_name | slug | Slug | string | Use existing slug; validate uniqueness per language |
| post_category | array | Category | ContentReference | Map source categories to target BlogCategory pages |
| post_tag | array | Keywords | TagArray | Preserve tags; create if missing |
| meta_description | string | SEO/MetaDescription | string | Direct copy; truncate to 160 chars |
| post_status | enum | Status | Select | Published → Published; Draft → Draft; Trash → Archived |
| [custom field: reading_time] | integer | ReadTime | Integer | Auto-calculate from word count; formula: wordCount / 200 |

**Special Handling**:
- Images embedded in HTML content: Extract; upload to DAM; replace with ImageBlock
- Internal links: Update to target system URLs (e.g., /blog/post → /blog-post)
- Incoming redirects from old URLs: Map in 301 redirect table
- Missing authors: Create placeholder author; flag for cleanup

**Validation Rules**:
- Title required; must be 20-200 chars
- Body required; must be 100+ chars
- FeaturedImage required; must be JPG/PNG 1200x600px min
- PublishDate required; can't be in future
- Status must be one of: Published, Draft, Archived

**Gate**: All blog posts mapped successfully; sample validation passed
```

Continue for all source types (Product, Case Study, FAQ, Landing Page, etc.)

### Phase B: Field Transformation Scripts (30 minutes)

For complex transformations, specify actual transformation logic:

**Example: Product Variant Handling**

```markdown
## Source Type: WooCommerce Product

### Challenge: Product Variants

Source has products with variants (size, color) stored as WooCommerce "variable products"
Target (CMS 12) requires either:
- Option A: Child pages (Product parent page with size-specific child pages)
- Option B: Property arrays (single Product page with attributes array)

**Decision**: Use Option A (child pages) for better SEO and URLs

### Transformation Script

```javascript
// Pseudo-code for variant transformation

source_products.forEach(product => {
  if (product.type === 'variable') {
    // Create parent page
    target_parent = createProduct({
      sku: product.sku_base,
      name: product.name,
      price: product.base_price,
      description: product.description,
      category: mapCategory(product.category),
      isParent: true
    });

    // Create child pages for each variant
    product.variants.forEach(variant => {
      target_child = createProduct({
        sku: variant.sku,
        name: `${product.name} - ${variant.attributes}`,
        price: variant.price,
        description: product.description, // Same as parent
        parentPage: target_parent,
        attributes: variant.attributes, // Size, color, etc
        inventory: variant.stock,
        isVariant: true
      });

      // Create 301 redirects
      createRedirect({
        from: variant.old_url,
        to: target_child.url,
        status: 301
      });
    });
  } else {
    // Simple product (no variants)
    target = createProduct({
      sku: product.sku,
      name: product.name,
      ...otherFields
    });
  }
});
```

**Effort Estimate**:
- Extraction: 1 hour (database query)
- Transformation: 4 hours (script writing, testing)
- Import: 1 hour (bulk API call)
- Validation: 2 hours (spot checks, verify variant URLs work)
- **Total per wave**: 8 hours
```

### Phase C: Complete Mapping Table (20 minutes)

Create comprehensive source-to-target mapping:

```markdown
## Complete Content Model Mapping

| Source Type | Volume | Target Type | Volume Change | Complexity | Transformation Effort | Gated? |
|---|---|---|---|---|---|---|
| **WordPress Post** | 8,472 | BlogPost | Same | Low | 1 week (scripts exist) | ✓ |
| **WordPress Draft Post** | 342 | BlogPost (Draft) | Same | Low | 2 days | ✓ |
| **WooCommerce Product** | 2,341 | Product + ProductVariant | 2,341 + variants (est 1.5x = 3,500) | High | 2 weeks (variant handling) | ✓ |
| **WooCommerce Category** | 45 | ProductCategory | Same | Low | 2 days | ✓ |
| **WooCommerce Tag** | 120 | ProductTag | Same | Low | 1 day | ✓ |
| **Page (Case Study)** | 156 | BlogPost (variant) OR CaseStudy | Same | Medium | 3 days | ⚠ GATE: New type? |
| **Page (FAQ)** | 203 | FAQ | Same | Low | 2 days | ✓ |
| **Post Category** | 30 | BlogCategory | Same | Low | 1 day | ✓ |
| **Post Tag** | 200 | BlogTag | Same | Low | 1 day | ✓ |
| **Team Member** | 87 | DO NOT MIGRATE; integrate from HRIS | 0 | N/A | 0 (integration only) | ✓ |
| **Media (Images)** | 12,000 | MediaData (Assets) | Same | Low | 3 days (batch upload) | ✓ |
| **Media (Documents)** | 300 | MediaData (Assets) | Same | Low | 1 day (batch upload) | ✓ |
| **Landing Page** | 34 | LandingPage | Same | High | 1 week (custom blocks) | ✓ |
| **Old Landing Page Drafts** | 156 | DO NOT MIGRATE; archive | 0 | N/A | 0 | ✓ |
| **Navigation Menu** | 5 | Virtual structure; derive from pages | 0 | N/A | 0 | ✓ |

**Summary**:
- Total source items: ~24,400
- Total target items (estimated): ~26,000
- Migrations to execute: 12 primary content migrations
- Major complexities: Product variants, Case Study typing, Landing Page blocks
- Items to NOT migrate: 243 (old drafts, Team Members, Navigation)

**Gating Items**:
- [ ] Confirm Case Studies are separate BlogPost type or new CaseStudy type (impacts schema)
- [ ] Confirm Product variants should be child pages (impacts URLs, SEO, data structure)
- [ ] Confirm old landing page drafts should be archived (not deleted; preserves history)
```

### Phase D: Transformation Rules Summary (15 minutes)

Summarize all transformation rules in reference table:

```markdown
## Transformation Rules Reference

### Text Fields
- **Trim whitespace**: All text fields (title, description)
- **HTML encoding**: Escape HTML entities where needed
- **Length validation**: Check min/max lengths per target field
- **Character set**: UTF-8 for all text; handle special chars

### Date Fields
- **Format conversion**: Source datetime → Target date (truncate time)
- **Timezone handling**: All dates in UTC; no timezone conversions needed
- **Future dates**: Reject future publish dates; flag for review

### References (Content Links)
- **ID mapping**: Map source user_id to target AuthorPageID via email lookup
- **Missing targets**: Create placeholder if target doesn't exist; flag for cleanup
- **Circular references**: Detect cycles; document limitations

### Media/Assets
- **Download & upload**: For all image/document references
- **Naming**: Batch-rename generic names (image-123 → blog-post-123-hero)
- **Alt text**: Preserve alt text; default to filename if missing
- **Format conversion**: Convert WEBP to JPG if platform doesn't support WEBP

### Taxonomies
- **Category mapping**: Create missing categories in target
- **Tag preservation**: Keep tags; create if missing
- **Hierarchy**: Flatten hierarchical categories OR preserve parent-child per platform

### Custom Fields
- **Custom field mapping**: Document each custom field transformation
- **Fields without target**: Either store as JSON or discard (with approval)
- **New fields in target**: Default values (e.g., Status = Draft)

### Validation Rules
- **Required fields**: Title, Summary, Body, PublishDate, Status
- **Unique constraints**: Slug must be unique per language
- **Range constraints**: Date must not be in future; Price must be > 0
- **Length constraints**: Title 20-200 chars; Description 100-300 chars
```

## CONTEXT BOUNDARIES

- **In scope**: Mapping all content types, defining transformations, documenting rules
- **Out of scope**: Executing transformations (that's migration build phase)
- **Not your task**: Building transformation scripts yet; just specifying what they should do

## YOUR TASK

1. Map each source type to target type(s)
2. Define field transformations for all fields
3. Create source-to-target mapping table
4. Specify transformation scripts/rules for complex transforms
5. Document special handling (variants, assets, links)
6. Identify and gate any mismatches
7. Create validation rules per type
8. Present mapping with A/P/C menu

## SUCCESS METRICS

- [x] All source types mapped to target (no TBD mappings)
- [x] All fields have transformation rules
- [x] Complex transforms specified (variants, assets, links)
- [x] Mapping table complete and readable
- [x] Transformation rules documented and executable
- [x] Special cases handled (missing authors, circular refs)
- [x] Validation rules defined per type
- [x] Gating items identified and documented
- [x] Mapping ready for wave planning (step-03)

## NEXT STEP

Once step-02 complete:
- Move to **step-03-wave-plan.md**
- Sequence content into migration waves
- Estimate effort per wave
- Build URL redirect map
- Create week-by-week roadmap
- Output: Complete migration roadmap ready for execution

---

**Step 2 Status**: [PENDING → IN PROGRESS → COMPLETE]

Update frontmatter `status: complete` and `stepsCompleted: 2` when done.
