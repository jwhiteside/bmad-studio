---
step: 3
name: Quality and Complexity Assessment
workflow: dept-opti-source-audit
status: pending
dependsOn: step-02-content-inventory
---

# Step 3: Quality and Complexity Scoring

## MANDATORY EXECUTION RULES

1. **Every content type** gets a quality score (1-4) and complexity score (1-5)
2. **Quality score** is based on audit of actual content samples, not assumptions
   - Take 5-10 random samples per type
   - Assess against 4-tier model
   - Average the assessments
3. **Complexity score** is calculated from six dimensions (volume, quality, languages, assets, URLs, governance)
   - Each dimension scores 1-5
   - Final score = average across all 6
4. **Effort estimates** are derived from complexity score
   - Map complexity tier to T-shirt size (XS, S, M, L, XL)
   - Consider language variants and asset volumes as multipliers
5. **Assessment must be documented** in audit table, not just stated

## EXECUTION PROTOCOLS

### Phase A: Quality Assessment Framework (10 minutes)

The 4-tier quality model:

| Tier | Label | Definition | Assessment Signals |
|------|-------|-----------|---|
| 1 | **Gold** | Well-structured, comprehensive metadata, strict governance | Consistent structure; complete metadata (title, description, keywords, alt text); asset naming conventions followed; approval workflows enforced; version history clean; no duplicates; SEO fundamentals present |
| 2 | **Silver** | Good structure, mostly consistent metadata, light governance | Generally consistent; most metadata present; some gaps in assets or naming; basic approval; some cleanup needed; SEO mostly complete |
| 3 | **Bronze** | Inconsistent structure, sparse metadata, minimal governance | Mixed formats; metadata sparse or incomplete; weak asset naming; no real workflows; cleanup is significant; many SEO issues |
| 4 | **Lead** | Unstructured, minimal/no metadata, ad-hoc governance | No consistent structure; metadata missing; asset chaos; no governance; extensive rework needed; critical SEO issues |

**Assessment methodology**:

For each content type:
1. **Sample selection**: Take 5-10 published items (random, covering date range)
2. **Evaluation checklist**:
   - Structure: Is the layout/schema consistent across samples?
   - Metadata: Are title, description, keywords, alt text populated?
   - Assets: Are images named descriptively? Are all alt texts present?
   - Governance: Is there evidence of approval? Workflows? Version control?
   - Freshness: Are items regularly updated or static/stale?
   - Duplication: Are there near-duplicate or redundant items?
3. **Scoring**: Tally signals against tiers → assign tier 1-4
4. **Note issues**: Document specific problems to address during migration

**Example assessment**:

```markdown
### Blog Post Quality Assessment

Sample 1 (2024-02-15): "10 Digital Marketing Trends"
- Title: ✓ (descriptive)
- Description: ✓ (present, ~160 chars)
- Keywords: ✓ (5 terms)
- Featured image: ✓ (descriptive filename, alt text)
- Body: ✓ (well-structured with headings)
- Author: ✓ (clear)
- Publish date: ✓ (present)
- **Tier: Gold** (all signals present)

Sample 2 (2023-09-02): "Marketing Strategies"
- Title: ✓
- Description: Missing
- Keywords: Partial (only 2)
- Featured image: ✓ (but generic alt text "image-123")
- Body: Good (some formatting inconsistent)
- Author: Missing
- Publish date: ✓
- **Tier: Silver** (good overall, gaps in metadata)

Sample 3 (2021-03-14): "Budget Tips"
- Title: Vague ("Tips")
- Description: Missing
- Keywords: Missing
- Featured image: Generic stock photo, no alt text
- Body: Minimal, sparse
- Author: Missing
- Publish date: ✓ (but old)
- **Tier: Bronze** (minimal structure, sparse metadata)

**Overall: Blog Post Quality = Silver (average of 2-3 tier scores)**
```

Document this assessment in audit report.

### Phase B: Complexity Scoring (Across 6 Dimensions) (30 minutes)

For each content type, score complexity on 6 dimensions (each 1-5):

**Dimension 1: Volume**
- 1 = XS (<100 items) - Low
- 2 = S (100-500) - Low
- 3 = M (500-5K) - Moderate
- 4 = L (5K-50K) - High
- 5 = XL (50K+) - Very High

Example: Blog posts 8,472 = **4 (L)**

**Dimension 2: Quality**
- 1 = Gold - requires little cleanup
- 2 = Silver - requires minor cleanup
- 3 = Bronze - requires significant cleanup
- 4 = Lead - requires extensive rework
- 5 = N/A (not applicable to system content)

Example: Blog posts = Silver = **2**

**Dimension 3: Multilingual**
- 1 = Single language - Low
- 2 = 2 languages, well-structured - Low-Moderate
- 3 = 3+ languages, partial coverage - Moderate
- 4 = 4+ languages, complex variants - High
- 5 = 5+ languages, inconsistent coverage - Very High

Example: Blog posts (EN, FR, DE) = **3 (Moderate)**

**Dimension 4: Asset Dependencies**
- 1 = No assets - Low
- 2 = 1-2 assets per item, simple - Low-Moderate
- 3 = 3-5 assets per item, diverse - Moderate
- 4 = 10+ assets per item, complex - High
- 5 = 50+ assets per item, sophisticated - Very High

Example: Blog posts (2-3 images each) = **2**

**Dimension 5: URL Structure & Patterns**
- 1 = Simple, flat URLs - Low
- 2 = Hierarchical but consistent - Low-Moderate
- 3 = Multiple patterns, some exceptions - Moderate
- 4 = Complex rewrites needed - High
- 5 = Highly complex, custom patterns - Very High

Example: Blog posts (`/blog/YYYY/MM/DD/slug`) = **2 (consistent pattern)**

**Dimension 6: Governance & Permissions**
- 1 = Simple (all users same) - Low
- 2 = Role-based (author, editor, admin) - Low-Moderate
- 3 = Complex roles + custom permissions - Moderate
- 4 = Fine-grained + approval workflows - High
- 5 = Complex multi-level workflows + stage-gated approval - Very High

Example: Blog posts (author → editor → publish) = **2**

**Complexity Score Calculation**:

```
Blog Post Complexity = (4 + 2 + 3 + 2 + 2 + 2) / 6 = 2.5 (M - Medium)
```

**Effort Tier Mapping**:

| Avg Complexity | Tier | T-Shirt | Effort | Notes |
|---|---|---|---|---|
| 1.0-1.5 | XS | XS | < 1 day | Simple, small volume, clean |
| 1.5-2.5 | S | S | 1-3 days | Small/medium, good quality, light governance |
| 2.5-3.5 | M | M | 1-2 weeks | Medium complexity, mixed quality |
| 3.5-4.5 | L | L | 2-4 weeks | High complexity, significant cleanup |
| 4.5-5.0 | XL | XL | 1-2 months | Very high, extensive rework |

Example: Blog post (2.5) = **M (Medium, 1-2 weeks)**

### Phase C: Content Type by Content Type Scoring (45 minutes)

Apply both quality and complexity assessment to each content type from inventory:

**Process for each type**:
1. Take 5-10 random samples
2. Assess quality (tier 1-4)
3. Estimate quality score (1-5 normalized)
4. Score each complexity dimension (1-5)
5. Calculate average complexity score
6. Map to effort tier
7. Document in table
8. Note key issues and risks

**Example completed table**:

```markdown
## Quality & Complexity Assessment

| Content Type | Samples | Quality | Vol | QA | Mlang | Assets | URLs | Gov | Complexity | Effort | Key Risks |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Blog Post | 10 | Silver (2) | 4 | 2 | 3 | 2 | 2 | 2 | **2.5 (M)** | M | 200 drafts to review, inconsistent authors |
| Case Study | 5 | Gold (1) | 1 | 1 | 1 | 3 | 2 | 2 | **1.7 (S)** | S | PDF attachments need cleanup |
| Product | 20 | Bronze (3) | 4 | 3 | 2 | 4 | 3 | 2 | **3.0 (M)** | M | Inventory sync issues, variant handling |
| Team Member | 5 | Bronze (3) | 1 | 3 | 1 | 2 | 2 | 1 | **1.7 (S)** | S | Auto-generated, minimal cleanup |
| Landing Page | 10 | Silver (2) | 2 | 2 | 1 | 3 | 4 | 2 | **2.3 (S)** | S | Many inactive/expired versions |
| FAQ | 5 | Gold (1) | 2 | 1 | 1 | 1 | 2 | 1 | **1.3 (XS)** | XS | Consider consolidation |
| Media | N/A | Silver (2) | 5 | 2 | 1 | N/A | 2 | 2 | **2.1 (S)** | S | Asset folder structure, naming cleanup |
| Video Page | 3 | Gold (1) | 1 | 1 | 1 | 2 | 2 | 1 | **1.3 (XS)** | XS | YouTube API integration |

**Aggregate Complexity**:
- **XS (1-2 items)**: FAQ, Video Page → 2 types, ~250 items, ~1-2 days
- **S (3-4 items)**: Case Study, Team Member, Landing Page, Media → 4 types, ~1,500 items, ~1-2 weeks
- **M (5-6 items)**: Blog Post, Product → 2 types, ~10,800 items, ~2-4 weeks
- **L/XL**: None

**Total Migration Effort**: ~4-6 weeks for content migration (not including design, development, testing)
```

### Phase D: Strategic Recommendations (20 minutes)

Based on assessment, provide strategic recommendations:

**1. Content Cleanup & Rationalization**

For each content type, recommend actions:

```markdown
## Strategic Recommendations

### 1. Content Cleanup & Rationalization

**Blog Posts (High Volume, Mixed Quality)**
- **Action**: Conduct pre-migration content audit
- **Detail**: Review 200+ drafts; consolidate near-duplicates; update stale posts (2021-2022)
- **Effort**: 2-3 weeks (content team)
- **Benefit**: Reduce migration volume from 8,472 to ~7,500; improve quality on arrival
- **Timeline**: Weeks 1-3 of migration programme

**Landing Pages (Inactive Versions)**
- **Action**: Archive expired campaigns
- **Detail**: 34 active pages + 156 draft versions; keep only active + current draft
- **Effort**: 2-3 days (marketing team)
- **Benefit**: Reduce clutter, clarify what is "production"
- **Timeline**: Week 1

**Team Member (Auto-Generated)**
- **Action**: Do not migrate; regenerate on Optimizely
- **Detail**: These are auto-synced from HRIS; set up integration instead
- **Effort**: 3-5 days (dev) + ongoing support
- **Benefit**: Eliminate manual sync, keep data fresh
- **Timeline**: Design phase (don't migrate, integrate)

### 2. Quality Baseline & Metadata

**Metadata Completeness**
- **Current state**: Blog posts average 70% metadata complete; products ~60%
- **Recommendation**: Enforce metadata on Optimizely before publish
- **Specific gaps**:
  - Alt text for images (25% missing)
  - SEO descriptions (30% missing in bronze content)
  - Author attribution (20% missing)
- **Timeline**: During content import, enforce validation

**Multilingual Content**
- **Current**: Blog posts have EN (100%), FR (85%), DE (60%) coverage
- **Recommendation**:
  - Make FR + DE optional for non-primary content
  - Set hard deadline for FR translation (EOW 3)
  - De-scope German content from wave 1; migrate in wave 2
- **Timeline**: Coordinate with translation vendor; plan 4-week buffer

### 3. Asset Management Strategy

**Current state**: 14,293 assets, ~5.5 GB, mixed quality naming
- **Recommendation**:
  - Migrate images with descriptive names only
  - Batch-rename generic assets (e.g., "image-123" → "blog-post-123-hero")
  - Extract videos from rich text; host separately on YouTube
  - Use Optimizely DAM for future assets
- **Effort**: 1 week (asset team) + automation
- **Timeline**: Pre-migration weeks 2-3

### 4. URL Strategy & Redirects

**Blog posts**: Consistent pattern `/blog/YYYY/MM/DD/slug` → migrate as-is
**Case studies**: Pattern `/case-studies/slug` → migrate as-is
**Landing pages**: Pattern `/campaigns/NAME/` → many inactive; 301 redirect archived to root
**Product pages**: Pattern `/products/CATEGORY/ITEM/` → may need restructure for Optimizely catalog

**Redirect map**: 156 inactive landing pages → `/` (root)
**Timeline**: Build redirect map in week 2; implement post-migration

### 5. Governance & Workflow Transition

**Current**:
- Blog: Author → Editor → Publish (informal)
- Products: Author → Approver → Publish + Sync to Commerce (formal)
- Landing pages: Marketing → Content Lead → Publish (ad-hoc)

**Recommended Optimizely Setup**:
- **CMS 12**: Use built-in workflows; enforce approval for Gold/Silver tier content
- **SaaS CMS**: Use scheduled publishing; allow immediate publish for low-risk content (FAQs, team bios)

**Timeline**: Configure in technical design phase (weeks 1-2 of implementation)

### 6. Platform-Specific Considerations

**If Target is CMS 12**:
- **Block model**: Blog posts → Page (with Title, Body, Author blocks); Comments component optional
- **References**: Product content may reference inventory; use ContentReference
- **Performance**: Image optimization via built-in responsive images
- **Commerce**: Tight integration if WooCommerce → Optimizely Commerce

**If Target is SaaS CMS**:
- **Content model**: Define content types via SDK/CLI; import with preview API
- **Visual Builder**: Use for landing pages and campaigns; reduce custom code
- **GraphQL**: Content Graph for fast queries; consider query caching strategy
- **Headless**: Front-end decoupled; framework flexibility (React, Next.js, etc.)

**Decision needed**: Platform choice drives architecture; recommend CMS 12 if .NET team exists, SaaS CMS if Headless/JavaScript preferred.
```

### Phase E: Audit Completion & Presentation (15 minutes)

Update audit document frontmatter:

```yaml
---
project: [project name]
status: complete  # CHANGED
stepsCompleted: 3  # CHANGED
date_created: [original date]
last_updated: [today]
sourcePlatform: [platform]
targetPlatform: "[To be determined based on assessment]"  # UPDATED
recommendedApproach: "[Cleanup first, then migrate in 2 waves]"  # NEW
estimatedEffort: "[4-6 weeks total migration time]"  # NEW
---
```

Prepare final presentation:

> **Source System Audit Complete**
>
> I've completed a comprehensive audit of your **[platform name]** system. Here's what we found:
>
> **Content Landscape**:
> - **11,311 published items** + 506 drafts across **8 content types**
> - **14,293 assets** (~5.5 GB) with mixed naming and quality
> - **3 languages** (EN primary, FR/DE partial)
>
> **Quality Assessment** (4-tier model):
> - **Gold (1)**: Case Studies, FAQs, Videos - well-structured
> - **Silver (2)**: Blog Posts, Landing Pages, Media - good overall, minor cleanup
> - **Bronze (3)**: Products, Team Members - inconsistent metadata, needs rework
> - **Lead (4)**: None critical; some legacy content in drafts
>
> **Complexity Summary**:
> - **XS (1-2)**: FAQs, Videos → ~250 items, 1-2 days
> - **S (2-3)**: Case Studies, Landing Pages, Team Members, Media → ~1,500 items, 1-2 weeks
> - **M (3-4)**: Blog Posts, Products → ~10,800 items, 2-4 weeks
> - **Total effort**: ~4-6 weeks migration time (excluding design/dev)
>
> **Strategic Recommendations**:
> 1. Clean up blog drafts (200+) and stale posts before migration
> 2. Archive 156 inactive landing pages
> 3. Do NOT migrate auto-generated team bios; integrate from HRIS instead
> 4. Batch-rename assets for clarity
> 5. Plan FR translation by EOW 3; defer German to wave 2
> 6. Build 301 redirects for archived landing pages
>
> **Next Steps**:
> 1. Review this audit with stakeholders ← You are here
> 2. Define target platform (CMS 12 vs SaaS CMS) in Platform Assessment workflow
> 3. Model content for target platform (Content Modelling workflow)
> 4. Build detailed migration plan with wave sequencing (Migration Planning workflow)
>
> **What would you like to do?**
>
> - **[C]ontinue** → Move to next workflow (Platform Assessment or Content Modelling)
> - **[A]dvanced** → Deep dive into specific content type or assessment dimension
> - **[P]arty Mode** → Audit complete! Time to celebrate the clarity! 🎉

## CONTEXT BOUNDARIES

- **In scope**: Assessing quality and complexity based on samples and inventory
- **Out of scope**: Building migration code, designing content schemas, or making platform decisions yet
- **Not your task**: Executing cleanup; just recommending it

## YOUR TASK

1. Assess quality of each content type (sample 5-10 items)
2. Score complexity across 6 dimensions
3. Map complexity scores to effort tiers
4. Document all findings in audit table
5. Provide strategic recommendations
6. Present final assessment with next steps

## INITIALIZATION SEQUENCE

```
1. Load quality tier definitions → begin sampling
2. For each type: assess 5-10 samples → assign quality tier
3. For each type: score 6 complexity dimensions → calculate average
4. Map complexity to effort tier → document in table
5. Provide strategic recommendations → address key risks
6. Update audit frontmatter → status: complete
7. Present findings → ask for A/P/C choice
```

## SUCCESS METRICS

At the end of this step, you should have:

- [x] Quality tier assigned to each content type (based on samples)
- [x] Complexity score calculated for each type (6 dimensions)
- [x] Effort tier mapped (XS, S, M, L, XL)
- [x] Strategic recommendations documented
- [x] Quality & Complexity table complete and presented
- [x] Audit document marked status: complete
- [x] stepsCompleted: 3
- [x] Stakeholders can review and decide next steps

## FAILURE MODES

| Failure | Signal | Recovery |
|---------|--------|----------|
| Quality assessment inconsistent | Tiers vary widely | Tighten criteria, re-sample, align on definitions |
| Complexity score too high | Everything scores 4-5 | Review scoring logic, may indicate system is in poor state |
| Effort estimates unrealistic | Stakeholders push back | Recalibrate against historical migration data |
| Recommendations too aggressive | Team resists cleanup | Adjust scope; prioritize highest-ROI items only |
| Platform decision unclear | Can't choose CMS 12 vs SaaS CMS | Document both scenarios; recommend Platform Assessment workflow |

## NEXT STEPS

After audit completion, three paths forward:

**Path 1**: Content Modelling (`dept-opti-content-model`)
- Model source content types into CMS-agnostic schema
- Validate against target platform patterns (CMS 12 or SaaS CMS)

**Path 2**: Platform Assessment (`dept-opti-platform-assessment`)
- Use complexity and effort data to decide CMS 12 vs SaaS CMS
- Assess Commerce and Opal AI fit
- Build platform comparison

**Path 3**: Migration Planning (`dept-opti-migration-plan`)
- Map source content model to target
- Build phased migration wave plan
- Estimate detailed effort per wave

**Recommended sequence**: Audit (complete!) → Platform Assessment → Content Modelling → Migration Planning

---

**Step 3 Status**: [PENDING → IN PROGRESS → COMPLETE]

Update frontmatter `status: complete` and `stepsCompleted: 3` when done.

**Workflow Status**: COMPLETE ✓

Mark audit document `status: complete` at top level.
