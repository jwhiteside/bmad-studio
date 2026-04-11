---
step: 2
name: Content Type Classification and Attribute Design
workflow: dept-opti-content-model
status: pending
dependsOn: step-01-init
---

# Step 2: Content Type Classification and Attribute Design

## MANDATORY EXECUTION RULES

1. **Four-question test required** for every content type from inventory
   - Question 1: "Are humans the primary authors?" (Y = likely type)
   - Question 2: "Is it published and indexed?" (Y = likely type)
   - Question 3: "Is it reused across contexts?" (Y = likely type)
   - Question 4: "Does target platform support it?" (Y = keep as type, N = find alternative)

2. **Separation of concerns**:
   - **Content Types**: Items that authors create (pages, posts, products, etc.)
   - **UI Patterns**: Layouts and components (hero sections, galleries, carousels)
   - **Configuration**: Technical setup (settings, taxonomies, mappings)
   - Only model content types; reference UI patterns, don't model them

3. **Attribute definition completeness**:
   - Every attribute has a name, type, validation rule, required/optional flag
   - Relationships are explicit (reference, collection, parent-child)
   - Multi-language fields are identified
   - Default values specified where applicable

4. **Platform validation mandatory**:
   - If CMS 12 target: validate against PageData/BlockData patterns
   - If SaaS CMS target: validate against content type model patterns
   - Gate any patterns not natively supported
   - Document workarounds or defer decisions

5. **Output table must be comprehensive and readable**

## EXECUTION PROTOCOLS

### Phase A: Content Type vs UI Pattern Classification (45 minutes)

For each type from source audit, apply four-question test:

**Question 1: "Are humans the primary authors?"**

| Type | Answer | Reasoning |
|------|--------|-----------|
| Blog Post | **Yes** | Journalists/writers compose content |
| Featured Image | **Partial** | Editors pick images, not write them |
| Product | **Yes** | Merchants author product info |
| Product Variant | **Partial** | Auto-generated from SKU data |
| Team Member | **No** | Auto-synced from HRIS system |
| FAQ | **Yes** | Support team authors answers |
| Navigation Menu | **No** | Automatically generated from site structure |
| Hero Section on Homepage | **No** | Designers/developers build it |
| Tag Cloud Widget | **No** | Generated from content metadata |

**Question 2: "Is it published and indexed?"**

| Type | Answer | Notes |
|------|--------|-------|
| Blog Post | **Yes** | Live on site, indexed by search |
| Product | **Yes** | Live catalog, indexed by search |
| Team Member | **Yes** | Live directory, but auto-sync |
| FAQ | **Yes** | Published knowledge base |
| Homepage Hero | **Yes** | Visible to all, but fixed content |
| Comment | **No** | Auto-generated from users, not published |
| System Log | **No** | Internal only, not indexed |
| Draft Blog Post | **Partial** | Not published yet, will be indexed later |

**Question 3: "Is it reused across contexts?"**

| Type | Answer | Context Examples |
|------|--------|------------------|
| Blog Post | **Yes** | Appears on blog, archives, search, social |
| Author Bio | **Yes** | On blog posts, author page, about page |
| Product | **Yes** | Catalog, search, recommendations, email |
| Testimonial | **Yes** | Homepage, product page, landing pages |
| Navigation Item | **Yes** | Header menu, footer menu, sitemap |
| Hero Image | **No** | Only on homepage, unique per campaign |
| Product Detail Image | **Partial** | Multiple use (catalog, product page, email) |
| Video | **Yes** | Multiple landing pages, email campaigns |

**Question 4: "Does target platform support it?"**

*For CMS 12*:

| Type | CMS 12 Support | Approach |
|------|---|---|
| Blog Post | Yes (PageData) | Native page type |
| Product | Yes (PageData) | Native page type; integrate with Commerce |
| Product Variant | Partial | Child pages or ContentArea blocks |
| Team Member | Yes (PageData) | Page type; consider integration trigger instead |
| Author Reference | Yes (ContentReference) | Link to author page |
| Navigation | Partial | Property on PageData or separate menu structure |
| Comments | Partial | Custom BlockData or external service |
| Rich Media Gallery | Yes (ContentArea) | Dynamic block collection |

*For SaaS CMS*:

| Type | SaaS Support | Approach |
|------|---|---|
| Blog Post | Yes (content type) | Native type with text, date, author reference |
| Product | Yes (content type) | Native type with fields, asset references |
| Product Variant | Yes (content type or reference array) | Separate type or array field |
| Team Member | Yes (content type) | Type with basic fields; integrate from HRIS |
| Author Reference | Yes (reference field) | Link to author content entry |
| Navigation | Partial | Separate content type or external structure |
| Comments | Partial | Content type or external service |
| Rich Media Gallery | Yes (asset array) | Reference multiple assets |

**Classification Result**:

```markdown
## Content Type Classification (Four-Question Test)

| Type | Q1: Author | Q2: Published | Q3: Reused | Q4: Platform Support | Classification | Notes |
|------|---|---|---|---|---|---|
| Blog Post | Yes | Yes | Yes | Yes | **Content Type** | Primary editorial content |
| Case Study | Yes | Yes | Yes | Yes | **Content Type** | Similar to Blog Post |
| Product | Yes | Yes | Yes | Yes (CMS 12: Commerce) | **Content Type** | Catalog item, integrates Commerce |
| Product Variant | Partial | No | Yes | Partial (child item) | **Sub-Type** | Gate: Decision needed on structure |
| Team Member | No | Yes | Yes | Yes (but integrate) | **Content Type (with note)** | Auto-synced; model but integrate from HRIS |
| Landing Page | Yes | Yes | No | Yes | **Content Type** | Campaign-specific page |
| FAQ | Yes | Yes | Partial | Yes | **Content Type** | Knowledge base item |
| Author | Yes | Partial | Yes | Yes | **Content Type** (or reuse from Blog) | Consider single author profile |
| Video Page | Yes | Yes | No | Yes | **Content Type** | Page with video embed |
| Navigation Menu | No | Yes | Partial | Partial | **UI Pattern** (not a type) | Derive from site structure |
| Hero Section | No | Yes | No | No (layout) | **UI Pattern** (not a type) | Part of page composition |
| Comment | No | No | Partial | Partial | **External Service** (not a type) | Don't model; use Disqus/similar |
| Media (Asset) | No | No | Yes | Yes (MediaData / Asset) | **Content Type** (Asset type) | Images, documents in DAM |
| Tag | No | Yes | Yes | Partial (taxonomy) | **Taxonomy** (not a type) | Organize content, don't model separately |

**Separation Summary**:
- **Content Types** (8): Blog Post, Case Study, Product, Landing Page, FAQ, Author, Video Page, Media
- **UI Patterns** (2): Navigation Menu, Hero Section (handle in design, not model)
- **External** (1): Comments (Disqus or similar service)
- **Taxonomy** (1): Tags (metadata, not separate type)

**Decisions Required**:
- [ ] Product Variants: Separate entries or child items or reference array?
- [ ] Team Members: Integrate from HRIS or model in CMS?
- [ ] Authors: Shared across all types or type-specific?
```

### Phase B: Attribute Design Per Content Type (60 minutes)

For each **Content Type** (not UI patterns), define attributes:

**Attribute Definition Template**:

| Attribute | Type | Required | Multi-Language | Validation | Default | Notes |
|---|---|---|---|---|---|---|
| [name] | string, integer, text, date, reference, asset, etc. | Yes/No | Yes/No | [rules] | [value] | [notes] |

**CMS 12 Validation Types**:
- String length limits
- Regex patterns
- Required/optional
- Single reference vs ContentArea (collection)
- Asset type constraints (image only, PDF only, etc.)
- Date range constraints

**SaaS CMS Validation Types**:
- String length limits
- Enum/select constraints
- Required/optional
- Reference cardinality (1-to-1 or 1-to-many)
- Asset type constraints
- Custom validation rules

**Example: Blog Post Type**

```markdown
### Blog Post

**Description**: Editorial article with rich content, author info, publication date, and media.

**Source Examples**: 8,472 published blog posts, EN/FR/DE, 2-3 images per post

**Attributes**:

| Attribute | Type | Required | Multi-Lang | Validation | Default | Notes |
|---|---|---|---|---|---|---|
| **Title** | String | Yes | Yes | 20-200 chars; no HTML | N/A | SEO critical; in URL |
| **Slug** | String | Yes | No | Lowercase, hyphens only, 20-100 chars | Auto-gen from title | URL path; unique per lang |
| **Summary** | Text | Yes | Yes | 100-300 chars; plain text | N/A | SEO meta description |
| **Body** | RichText | Yes | Yes | Max 50,000 chars; allowed HTML: p, h2-h3, strong, em, ul, ol, li, a, img, blockquote | N/A | Main content; images embedded |
| **Author** | Reference | Yes | No | Must reference Author type | N/A | CMS 12: ContentReference; SaaS: author reference |
| **PublishDate** | Date | Yes | No | Today or past | N/A | Sorting and archive queries |
| **Featured Image** | Asset | Yes | Yes | JPG or PNG; 1200x600px min; 5MB max | N/A | Hero image on blog page |
| **Hero Caption** | String | No | Yes | 50-150 chars | N/A | Caption overlay on hero |
| **Keywords** | Tags | No | No | Pre-defined tags OR free text | N/A | SEO keywords; max 10 |
| **Category** | Reference | Yes | No | Must reference BlogCategory | N/A | Organize blog posts |
| **IsSticky** | Boolean | No | No | True/False | False | Pin to top of category |
| **Comments Enabled** | Boolean | No | No | True/False | True | Allow user comments (external service) |
| **ReadTime** | Integer | No | No | Auto-calculated; 1-30 minutes | Auto-calculated | For UX (e.g., "5 min read") |
| **Related Posts** | References | No | No | Array of Blog Post refs; max 5 | N/A | Manual editorial picks |
| **SEO Title** | String | No | Yes | 30-60 chars; if blank use Title | N/A | Override Title in search results |
| **SEO Meta** | String | No | Yes | HTML meta tags | N/A | Custom meta (e.g., og: tags) |
| **Status** | Select | Yes | No | Published, Draft, Archived | Draft | Publishing state |

**CMS 12 Notes**:
- PageData inheritance (IContent)
- Title = Name property (auto-indexed)
- Author = ContentReference to AuthorPage
- Featured Image = ContentReference to MediaData
- Category = ContentReference to BlogCategoryPage
- Related Posts = ContentArea of BlogPost blocks OR collection of references

**SaaS CMS Notes**:
- Flat type (no inheritance)
- Author = author reference (1-to-1)
- Featured Image = asset reference
- Category = category reference
- Related Posts = array of blog post references
- Tags = reference array or select array
```

**Example: Product Type**

```markdown
### Product

**Description**: E-commerce catalog item with SKU, pricing, inventory, images, variants, and rich description.

**Source Examples**: 2,341 products, EN/FR, 15-20 images per product, variants exist

**Attributes**:

| Attribute | Type | Required | Multi-Lang | Validation | Default | Notes |
|---|---|---|---|---|---|---|
| **Name** | String | Yes | Yes | 20-150 chars; no HTML | N/A | Product title; in URL |
| **SKU** | String | Yes | No | Alphanumeric; unique; 5-20 chars | N/A | Sync to Commerce system |
| **Description** | RichText | Yes | Yes | Max 5,000 chars; allowed: p, h2-h3, strong, em, ul, ol, li, a | N/A | Product overview |
| **LongDescription** | RichText | No | Yes | Max 20,000 chars; full HTML | N/A | Extended product info |
| **Price** | Decimal | Yes | No | > 0; 2 decimal places | N/A | List price; overridden in Commerce |
| **Currency** | String | Yes | No | ISO 4217 (USD, EUR, etc.) | USD | Paired with Price |
| **HeroImage** | Asset | Yes | Yes | JPG or PNG; 1200x800px min; 5MB max | N/A | Primary product image |
| **Gallery Images** | Assets | No | No | Array of images; 3-20 images; same specs as Hero | N/A | Alternative views |
| **Inventory Level** | Integer | Yes | No | >= 0 | Sync from Commerce | Stock count |
| **IsInStock** | Boolean | Computed | No | Auto-calculated from Inventory | N/A | For filtering |
| **Category** | Reference | Yes | No | Must reference ProductCategory | N/A | Navigate product tree |
| **ParentProduct** | Reference | No | No | Reference to parent for variants | N/A | Gate: Variants design needed |
| **Variants** | References or Sub-Items | No | No | Array of child products OR variants array | N/A | Size, color, etc. |
| **Attributes** | Array | No | No | Key-value pairs; predefined keys | N/A | Size, color, material |
| **Tags** | Tags | No | No | Pre-defined; max 5 | N/A | Brand, material, use case |
| **SEO Title** | String | No | Yes | 30-60 chars | N/A | Override in search |
| **SEO Description** | String | No | Yes | 100-160 chars | N/A | Meta description |
| **Status** | Select | Yes | No | Active, Inactive, Draft, Coming Soon | Draft | Publishing state |

**CMS 12 Notes**:
- PageData inheritance
- SKU triggers Commerce sync
- Variants: Sub-pages (children) or BlockData items in ContentArea
- Gallery: ContentArea of image blocks
- Price: Read-only (source of truth in Commerce)
- Inventory: Read-only (source of truth in Commerce)

**SaaS CMS Notes**:
- Flat type (no inheritance)
- Variants: Separate content type with parent reference OR array field
- Gallery: Asset reference array
- Price/Inventory: Sync from Commerce system (read-only on CMS side)
- All prices in single currency or multiple? (Design decision)

**Decisions Required**:
- [ ] Variant structure: Separate entries (simple) or sub-items (CMS 12) or reference array (SaaS)?
- [ ] Multi-currency support: Single currency per site OR multiple?
- [ ] Inventory sync: Real-time from Commerce OR batch nightly?
```

**Example: FAQ Type**

```markdown
### FAQ Item

**Description**: Question and answer pair for knowledge base.

**Source Examples**: 203 FAQs, single language, no assets

**Attributes**:

| Attribute | Type | Required | Multi-Lang | Validation | Default | Notes |
|---|---|---|---|---|---|---|
| **Question** | String | Yes | Yes | 20-200 chars | N/A | Searchable; main heading |
| **Answer** | RichText | Yes | Yes | 100-5,000 chars; allowed HTML as Blog Post | N/A | Main content |
| **Category** | Reference | Yes | No | Must reference FAQCategory | N/A | Organize FAQs |
| **Order** | Integer | No | No | >= 0; used for sorting | N/A | Display order within category |
| **IsVisible** | Boolean | No | No | True/False | True | Hide without deleting |
| **Keywords** | Tags | No | No | Free text; max 5 | N/A | Search optimization |
| **Status** | Select | Yes | No | Published, Draft, Archived | Draft | Publishing state |

**CMS 12 Notes**:
- PageData or BlockData?
- If Page: Structured taxonomy for browsing
- If Block: Dynamic blocks in ContentArea; less suitable
- Recommendation: PageData (standalone searchable pages)

**SaaS CMS Notes**:
- Content type with simple fields
- Category: Reference field
- Suitable for headless delivery (API + custom UI)
```

Continue this process for **all content types** identified as types (not patterns).

### Phase C: Relationship Mapping (30 minutes)

Map all relationships between content types:

**Relationship Types**:
- **Parent-Child**: Content hierarchy (Pages → Blog Posts, Categories → Products)
- **Many-to-Many**: Crosslinks (Products ↔ Categories, Posts ↔ Tags)
- **One-to-One**: Single reference (BlogPost → Author)
- **One-to-Many**: Collections (Category ⊃ Products, Author ⊃ BlogPosts)

**CMS 12 Relationship Design**:
- Parent-child: Use content hierarchy (ContentLink parent)
- References: ContentReference (1-to-1) or ContentArea (1-to-many)
- Collections: ContentArea for dynamic blocks

**SaaS CMS Relationship Design**:
- Parent-child: Parent reference field
- References: Single reference field (1-to-1) or array reference field (1-to-many)
- No true "hierarchy"; flat model with references

**Relationship Table**:

```markdown
## Relationships

| From Type | Relationship | To Type | Cardinality | Mutuality | Implementation (CMS 12) | Implementation (SaaS) |
|---|---|---|---|---|---|---|
| **BlogPost** | written by | Author | 1-to-1 | One (post has one author) | ContentReference | reference field |
| **BlogPost** | belongs to | BlogCategory | 1-to-many | One (post in one category) | ContentReference | reference field |
| **BlogPost** | related to | BlogPost | Many-to-many | Editorial picks | ContentArea or ref array | reference array |
| **BlogPost** | features | Image | 1-to-many | Hero + gallery | MediaData + ContentArea | asset + asset array |
| **Author** | wrote | BlogPost | One-to-many | Reverse lookup | IContent hierarchy | virtual relationship |
| **BlogCategory** | contains | BlogPost | One-to-many | Reverse lookup | IContent hierarchy | virtual relationship |
| **Product** | belongs to | ProductCategory | 1-to-many | Primary category | ContentReference | reference field |
| **Product** | tagged with | Tag | Many-to-many | Editorial | Tag property | reference array |
| **Product** | has variant of | Product | 1-to-many | Parent→child | Child pages OR ref array | child reference array |
| **ProductVariant** | is variant of | Product | 1-to-1 | Inverse parent | Parent reference | parent reference |
| **FAQ** | belongs to | FAQCategory | 1-to-many | Primary category | ContentReference | reference field |
| **LandingPage** | features | Product | Many-to-many | Editorial curated list | ContentArea of product refs | reference array |
| **LandingPage** | has hero | Image | 1-to-1 | One hero per page | MediaData reference | asset reference |

**Cardinality Legend**:
- **1-to-1**: Single instance (e.g., post has one author)
- **1-to-many**: Multiple instances (e.g., category has many products)
- **Many-to-many**: Both sides multiple (e.g., products ↔ categories, tags)

**CMS 12 Implementation Notes**:
- Use ContentReference for single targets
- Use ContentArea for collections (dynamic blocks)
- Use content hierarchy for parent-child
- Avoid circular references; design for one-directional flow

**SaaS CMS Implementation Notes**:
- Use reference fields (1-to-1)
- Use reference array fields (1-to-many)
- No "containment"; all references are pointers
- Many-to-many requires reference array on one side
```

### Phase D: Platform Validation (30 minutes)

**For CMS 12 target**, validate all types against PageData/BlockData patterns:

```markdown
## CMS 12 Platform Validation

### PageData Types (Full Pages)

| Type | Base Class | Parent Type | Custom Fields | ContentArea | Allowed Blocks | Valid |
|---|---|---|---|---|---|---|
| BlogPost | PageData | BlogFolder | Title, Body, Author, Date, Featured Image | Yes | TextBlock, ImageBlock, QuoteBlock, VideoBlock | ✓ |
| BlogCategory | PageData | BlogFolder | Name, Description | Yes | BlogPost refs (link) | ✓ |
| Product | PageData | ProductCatalog | SKU, Price, Images, Category, Variants | Yes | ProductVariant refs | ✓ (with note on Commerce sync) |
| FAQ | PageData | FAQFolder | Question, Answer, Category | No | N/A | ✓ |
| LandingPage | PageData | Root or Campaigns folder | Title, Hero, Sections, CTAs | Yes | ContentArea blocks | ✓ |
| Author | PageData | AuthorFolder | Name, Bio, Photo, Social | No | N/A | ✓ |

**Decision Gates**:
- [ ] Product Variants: CMS 12 sub-pages (EPiServer native) or ContentArea blocks? (Recommend: sub-pages for full SEO)
- [ ] Commerce Integration: Sync prices/inventory from Commerce system? (Recommend: Yes, read-only fields)
- [ ] Blog Comments: Use Disqus/external? (Recommend: External service, not model)

### BlockData Types (Reusable Blocks)

| Type | Parent ContentArea | Reusable | Fields | Valid |
|---|---|---|---|---|
| AuthorCard | Blog ContentArea | Yes | Name, Photo, Bio, Link | ✓ |
| ImageBlock | Any ContentArea | Yes | Image, Caption, Alt Text | ✓ |
| VideoBlock | Any ContentArea | Yes | Video URL/Embed, Title, Caption | ✓ |
| TestimonialBlock | LandingPage ContentArea | Yes | Quote, Author, Photo, Source | ✓ |
| CTABlock | LandingPage ContentArea | Yes | Heading, Copy, Button, Link | ✓ |

**Recommendation**: Keep BlockData minimal; prefer embedded rich text or asset references for flexibility.

### Summary

✓ All content types map cleanly to CMS 12 PageData
✓ Block model suitable for dynamic composition (landing pages, product galleries)
✓ Commerce integration viable (read-only sync)
✗ Multi-language: Confirm DXP Cloud language setup
✗ Variant handling: Decision needed (recommend sub-pages)
```

**For SaaS CMS target**, validate against content type model:

```markdown
## SaaS CMS Platform Validation

### Content Types

| Type | Fields | References | Assets | Sections | Valid |
|---|---|---|---|---|---|
| BlogPost | title, slug, summary, body, date, keywords | author, category, related_posts | featured_image, gallery | content, seo | ✓ |
| BlogCategory | name, description, order | parent | hero_image | N/A | ✓ |
| BlogAuthor | name, email, bio, website | N/A | photo | profile | ✓ |
| Product | name, sku, description, price, currency | category, variants, tags | hero_image, gallery | details, pricing | ✓ (gate: variants) |
| ProductCategory | name, description, order | parent | hero_image | N/A | ✓ |
| FAQ | question, answer, order | category | N/A | content | ✓ |
| FAQCategory | name, description, order | N/A | N/A | N/A | ✓ |
| LandingPage | title, hero, sections | featured_product_refs, internal_links | hero_image | hero, content, cta | ✓ |

**Constraints**:
- ✓ All types fit SaaS content model (flat, no inheritance)
- ✓ References work well (author_id, category_id, etc.)
- ✓ Asset management straightforward
- ✗ Variants: Reference array or separate type? (Decision needed)
- ✓ Multi-language: Native per-entry support (lang variant)
- ✓ Visual Builder: Can compose landing pages from section types

### Summary

✓ All content types map cleanly to SaaS content model
✓ Flat structure simpler than inheritance (CMS 12)
✓ Multi-language native (no extra setup)
✗ Variants: Recommend separate ProductVariant type (or array field)
✗ Asset delivery: Confirm CDN strategy and image optimization
```

### Phase E: Source-to-Target Mapping (20 minutes)

Map each source type to target type(s):

```markdown
## Source-to-Target Content Model Mapping

| Source Type | Source Example Fields | Target Type (CMS 12) | Target Type (SaaS CMS) | Transformation Notes |
|---|---|---|---|---|
| **WordPress Post (blog)** | title, content, categories, tags, featured_image, author_id | BlogPost (PageData) | BlogPost (content type) | Direct mapping; category → BlogCategory; tags preserved |
| **WordPress Page (case study)** | title, content, featured_image, [custom_logo], [custom_results] | BlogPost variant or CaseStudy (PageData) | CaseStudy (content type) | Create dedicated type for case studies; logo → asset ref |
| **WooCommerce Product** | name, description, price, sku, gallery, attributes, parent_id | Product (PageData) with variants; sync SKU/price to Commerce | Product (content type) with variant array | Gate: Sync strategy (CMS or Commerce source of truth?) |
| **Team Member (HRIS sync)** | name, email, phone, department, photo, bio | Do NOT migrate; integrate from HRIS | Do NOT migrate; integrate from HRIS | Decision: CMS as source or integration point? |
| **Category (taxonomy)** | name, description, parent | BlogCategory or ProductCategory (PageData) | BlogCategory or ProductCategory (content type) | Hierarchical mapping; parent field |
| **Asset (image/document)** | filename, alt_text, size, dimensions | MediaData in DAM | Asset via asset reference | Batch rename for clarity; preserve alt text |
| **Navigation Item** | name, link, order, parent | Virtual structure (don't model) | Virtual structure (don't model) | Derive from page hierarchy, not separate type |
| **Landing Page** | title, content, hero_image, sections, cta | LandingPage (PageData) with ContentArea | LandingPage (content type) | Map section structure to blocks (CMS 12) or content sections (SaaS) |

**Transformation Rules**:
- **1-to-1 mapping**: WordPress Post → BlogPost (simplest)
- **Consolidation**: Multiple WP post types → Single CMS 12 PageData (add field for type)
- **Expansion**: Single WP type → Multiple CMS types (e.g., Product → Product + ProductVariant)
- **Rejection**: Type excluded from migration (e.g., Team Members, Comments)
- **Integration**: Type integrated from external system (HRIS, Commerce, Disqus)

**Decisions Required**:
- [ ] Are we migrating historic post types or consolidating?
- [ ] How to handle product variants: sub-pages or separate entries?
- [ ] Commerce sync direction: CMS → Commerce or Commerce → CMS?
```

### Phase F: Decisions & Gating (15 minutes)

Document **decisions required** before proceeding to next phase:

```markdown
## Decisions Required

**Must Resolve Before Technical Design**:

### 1. Product Variants Structure

**Question**: How should product variants be modeled?

**Options**:
- **A: Sub-pages** (CMS 12 only)
  - Parent: Product page
  - Children: ProductVariant pages (one per size/color)
  - Pros: Full SEO, navigable hierarchy, separate URLs
  - Cons: Complex to manage, requires parent-child display logic

- **B: Reference Array** (SaaS CMS or CMS 12 with custom logic)
  - Parent Product has variants[] field (array of Product refs)
  - Pros: Simpler management, flexible
  - Cons: Variants share parent URL, SEO impact

- **C: Properties/Attributes**
  - Product has attributes[] (size, color as properties, not separate items)
  - Pros: Simplest, single page per base product
  - Cons: Limited scalability, complex attribute management

**Recommendation**: Sub-pages (if CMS 12) for SEO; reference array (if SaaS) for simplicity
**Owner**: [technical lead name]
**Timeline**: Decide by Week 1
**Impact**: High (affects URL structure, site architecture, filtering/search)

### 2. Team Member Data Source

**Question**: Should Team Members be modeled in CMS or integrated from HRIS?

**Options**:
- **A: Migrate to CMS**
  - Pros: Centralized management, content team owns profiles
  - Cons: Duplication risk (HRIS is source of truth)

- **B: Integrate from HRIS**
  - Pros: Single source of truth, auto-sync, no duplication
  - Cons: Development overhead, requires API integration

- **C: Dual-write** (migrate now, integrate later)
  - Pros: Migration doesn't block launch
  - Cons: Technical debt (eventual consolidation)

**Recommendation**: Integrate from HRIS (option B); skip migration
**Owner**: [IT/HRIS owner name]
**Timeline**: Decide by Week 1
**Impact**: Medium (affects data management, governance)

### 3. Multi-Currency Support

**Question**: Should we support multiple currencies (USD, EUR, GBP)?

**Options**:
- **A: Single currency per site**
  - Pros: Simple implementation, clean data
  - Cons: Limits expansion to new markets

- **B: Multiple currencies, same product**
  - Pros: Global site possible, flexible pricing
  - Cons: Complex attribute design, sync challenges

- **C: Multiple sites, one currency each**
  - Pros: Clean separation, site-specific pricing
  - Cons: Content duplication, complex management

**Recommendation**: Single currency per site; multi-site for multi-currency (option C)
**Owner**: [business/product owner]
**Timeline**: Decide by Week 2
**Impact**: High (affects Commerce integration, site architecture)

### 4. Comments/Social Features

**Question**: Should we migrate/support user comments on blog posts?

**Options**:
- **A: Don't support** (simplest)
  - Pros: No moderation burden, clean data migration
  - Cons: Loss of user engagement

- **B: External service** (Disqus, Commento, etc.)
  - Pros: Managed service, moderation tools, no CMS overhead
  - Cons: External dependency, user experience separation

- **C: Custom in CMS**
  - Pros: Full control, integrated experience
  - Cons: Moderation, spam management, development effort

**Recommendation**: External service (option B) for comments
**Owner**: [content/product owner]
**Timeline**: Decide by Week 2
**Impact**: Medium (affects content modelling, UX)

---

**All Decisions Must Be Resolved By**: [date, typically end of Week 2 of planning]
**Stakeholder Review Meeting**: [date/time]
**Decision Log**: [link to decisions document]
```

### Phase G: Content Model Presentation (15 minutes)

Once all sections complete, present:

> **Content Model Complete**
>
> I've designed a comprehensive content model with [X] content types, [Y] attributes, and [Z] relationships.
>
> **Key Findings**:
> - **Content Types Identified**: Blog Post, Case Study, Product, FAQ, Landing Page, Author, Category, Media
> - **UI Patterns Separated**: Navigation, Hero Sections (not modeled as types)
> - **Relationships**: [X] one-to-many, [Y] many-to-many, [Z] references
> - **Multi-Language**: Blog, Case Studies, Products (EN/FR); FAQs (EN only)
> - **Assets**: Featured images, galleries, documents
>
> **Target Platform Validation**:
> - **CMS 12**: All types map to PageData; blocks for dynamic composition; variants need decision
> - **SaaS CMS**: All types fit; flat model simpler; variants need decision
>
> **Decisions Pending**:
> 1. Product Variants: Sub-pages (CMS 12) or reference array (SaaS)?
> 2. Team Members: Integrate from HRIS or migrate?
> 3. Multi-Currency: Single per site or multiple?
> 4. Comments: External service (Disqus) or custom?
>
> **Next Steps**:
> 1. Stakeholder review of model (this week)
> 2. Resolve 4 pending decisions (by end of week 2)
> 3. Technical design phase (week 3+)
>
> **What would you like to do?**
>
> - **[C]ontinue** → Stakeholder review and decision resolution
> - **[A]dvanced** → Deep dive into specific type or relationship
> - **[P]arty Mode** → Model design complete! 🎉

## CONTEXT BOUNDARIES

- **In scope**: Classifying types, designing attributes, mapping relationships, validating against platform
- **Out of scope**: Building implementation code or migration scripts
- **Not your task**: Resolving all decisions; just documenting them

## YOUR TASK

1. Apply four-question test to all inventory types
2. Classify types vs patterns vs configuration
3. Design attributes for each content type
4. Map relationships between types
5. Validate against target platform patterns
6. Create source-to-target mapping
7. Document decisions required
8. Present complete model with A/P/C menu

## INITIALIZATION SEQUENCE

```
1. Load inventory from step-01 → enumerate all types
2. Apply four-question test → classify each type
3. For each type: design attributes → document fully
4. Map all relationships → create relationship table
5. Validate against platform → gate unsupported patterns
6. Create source-to-target mapping → document transformations
7. Document decisions required → identify gates
8. Present model → ask for A/P/C choice
```

## SUCCESS METRICS

At the end of this step, you should have:

- [x] Four-question test applied to all inventory types
- [x] Content types separated from UI patterns and configuration
- [x] All content types fully defined with attributes
- [x] Attributes include validation rules, required/optional, multi-language flags
- [x] All relationships documented in relationship table
- [x] Model validated against target platform constraints
- [x] Source-to-target mapping complete
- [x] Decisions required documented and gated
- [x] Model document marked for review
- [x] Stakeholders can review and make decisions

## FAILURE MODES

| Failure | Signal | Recovery |
|---------|--------|----------|
| Too many UI patterns | Page structure seems like a type | Re-ask question 1-4; distinguish content from layout |
| Relationships circular | Type A refs B, B refs A | Document as many-to-many; design for one-directional flow |
| Platform validation fails | Feature not supported natively | Gate decision; document workaround or defer to technical design |
| Attributes incomplete | Gaps when reviewing model | Interview content owners; review source samples; fill gaps |
| Decisions too many | Stakeholders overwhelmed | Prioritize; defer non-critical decisions; focus on path-blocking items |

## NEXT STEPS

After content model is approved:

1. **Platform Assessment** (`dept-opti-platform-assessment`) - Confirm CMS 12 vs SaaS CMS choice
2. **Migration Planning** (`dept-opti-migration-plan`) - Map model to migration waves
3. **Technical Architecture** (`dept-opti-architecture`) - Design .NET/JS implementation

---

**Step 2 Status**: [PENDING → IN PROGRESS → COMPLETE]

Update frontmatter `status: review` and `stepsCompleted: 2` when done (move to `approved` once stakeholders sign off).
