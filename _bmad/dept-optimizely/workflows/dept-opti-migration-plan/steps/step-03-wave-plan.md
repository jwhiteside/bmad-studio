---
step: 3
name: Wave Planning and Effort Estimation
workflow: dept-opti-migration-plan
status: pending
dependsOn: step-02-model-mapping
---

# Step 3: Wave Planning and Effort Estimation

## MANDATORY EXECUTION RULES

1. **Waves sequenced by dependency**:
   - Assets (Wave 0) before content that references them
   - Simple content (Wave 1) before complex (Waves 2-3)
   - Categories/taxonomies before items that reference them

2. **Effort realistically estimated**:
   - Include extraction, transformation, import, validation, testing
   - Apply complexity multipliers from audit
   - Include quality factor (Bronze content needs cleanup)
   - Include 20% risk buffer for unknowns

3. **Exit criteria defined per wave** (how to know it succeeded)

4. **Detailed week-by-week roadmap** (who, what, when)

5. **Migration roadmap complete and ready for execution**

## EXECUTION PROTOCOLS

### Phase A: Wave Sequencing (20 minutes)

Plan waves by dependency and complexity:

```markdown
## Migration Wave Plan

### Wave 0: Assets (Foundation)

**Purpose**: Migrate all images, documents, media before content references them

**Content**:
- Images: 12,000 items
- Documents (PDFs, etc): 300 items
- Total: 12,300 assets

**Complexity**: XS (low complexity; simple batch operation)

**Sequencing Rationale**:
- Assets have no dependencies
- Must be in place before pages can reference them
- Simple bulk import via DAM API

**Timeline**: Week 13 (1 week)

**Owner**: DevOps + Content Ops (1 FTE)

### Wave 1: Foundations & Simple Content (Low Risk, Quick Win)

**Purpose**: Establish taxonomy, migrate simple content types (FAQs, Archives)

**Content**:
- Blog Categories: 30 items
- Blog Tags: 200 items
- Blog Post Drafts: 342 items (old, archival)
- FAQ Items: 203 items
- Total: 775 items

**Complexity**: S (simple; low risk; builds confidence)

**Sequencing Rationale**:
- Categories/tags needed before Blog Post migration (Wave 2)
- FAQs are standalone; no dependencies
- Old drafts are archival; safe to do early
- Quick migration builds team confidence

**Timeline**: Week 14-15 (2 weeks)

**Owner**: Content Ops Lead + 1 Developer

### Wave 2: Core Editorial Content (Main Volume)

**Purpose**: Migrate primary blog content (published posts)

**Content**:
- Blog Posts (Published): 8,472 items
- Case Studies: 156 items
- Total: 8,628 items

**Complexity**: M (medium; volume is large but transformation is simple)

**Sequencing Rationale**:
- Categories/tags done in Wave 1 (dependencies met)
- Authors established (from audit)
- FeaturedImages in Wave 0 (assets ready)
- Bulk transformation via script
- Post-migration validation is time-intensive (sample checks)

**Timeline**: Week 16-18 (3 weeks)

**Owner**: 2 Developers + QA

### Wave 3: Complex Content & Final Pieces (High Risk, Careful)

**Purpose**: Migrate complex content (Products with variants, Landing Pages)

**Content**:
- Products: 2,341 items
- Product Categories: 45 items
- Product Tags: 120 items
- Product Variants: ~3,500 (estimated 1.5x products)
- Landing Pages: 34 items
- Total: ~6,040 items

**Complexity**: L (high complexity; variants, custom blocks, relationships)

**Sequencing Rationale**:
- Product categories done in Wave 1 (ready)
- Assets in Wave 0 (product images available)
- Complex variant handling requires care
- Landing pages have custom block structure
- More manual testing required

**Timeline**: Week 19-21 (3 weeks)

**Owner**: 2 Developers + QA + Content Lead

### Wave 4: Polish & Final Validation (Pre-Launch)

**Purpose**: Redirects, validations, final testing before go-live

**Content**:
- URL Redirects: 301 mappings for all old URLs
- Final spot-checks: 10% sample of each type
- Performance validation: Load testing, page speed checks
- Final content freeze and data validation

**Timeline**: Week 22 (1 week, pre-launch)

**Owner**: QA + DevOps + Content Ops

**Total Migration Effort**: 10 weeks (parallel to build phase)
```

### Phase B: Effort Estimation Per Wave (30 minutes)

Calculate effort for each wave:

**Wave Effort Formula**:

```
Effort (hours) =
  Volume × (Extraction Hours + Transformation Hours + Import Hours + Validation Hours)
  × Complexity Multiplier
  × Quality Factor
  × 1.2 (20% risk buffer)
```

**Example Calculation: Blog Posts (Wave 2)**

```markdown
## Wave 2: Blog Posts - Effort Estimation

### Input Data
- Volume: 8,472 published blog posts
- Complexity Multiplier (from audit): 2.5 (Medium)
- Quality Factor (Silver content): 1.2x (light cleanup needed)
- Risk Buffer: 1.2x (unknowns)

### Per-Item Effort Breakdown

| Task | Hours per 100 items | Notes |
|---|---|---|
| Extraction | 0.1 | Database query; assume 0.1 hr per 100 |
| Transformation | 0.3 | Script converts HTML → RichText blocks |
| Import | 0.1 | Bulk API call per 100 items |
| Validation | 0.5 | Spot checks, verify images loaded, links work |
| **Subtotal** | **1.0** | 1 hour per 100 items |

### Wave Effort Calculation

```
Total Hours = (8,472 / 100) × 1.0 hours
            × 2.5 complexity
            × 1.2 quality
            × 1.2 risk buffer
            = 84.72 × 1.0 × 2.5 × 1.2 × 1.2
            = 306 hours
            ≈ 8 weeks @ 1 FTE or 4 weeks @ 2 FTE
```

### Resource Allocation

- 2 Developers: 1 for transformation scripting, 1 for import/validation
- 1 QA Engineer: Spot checks, final validation
- Content Ops: Coordination, cleanup flagged items
- **Recommended Staffing**: 2 FTE for 3 weeks (wave duration)
```

Continue for Waves 1, 3, 4 with similar effort calculations.

**Wave Effort Summary**:

```markdown
| Wave | Content Type | Volume | Complexity | Estimated Effort | Duration | Resource |
|---|---|---|---|---|---|---|
| **Wave 0** | Assets | 12,300 | Low | 40 hours | 1 week | 1 FTE |
| **Wave 1** | Categories, Tags, FAQs, Drafts | 775 | Low | 80 hours | 2 weeks | 1 FTE |
| **Wave 2** | Blog Posts | 8,628 | Medium | 306 hours | 3 weeks | 2 FTE |
| **Wave 3** | Products, Landing Pages | 6,040 | High | 500+ hours | 3 weeks | 2 FTE |
| **Wave 4** | Redirects, Final Validation | N/A | Medium | 200 hours | 1 week | 2 FTE |
| **TOTAL** | | 27,743 items | | **1,126+ hours** | **10 weeks** | ~2 FTE avg |

**Total Effort**: ~1,100 hours = ~28 weeks @ 1 FTE or ~5 weeks @ 5 FTE (compressed)
```

### Phase C: URL Redirect Strategy (15 minutes)

Create mapping for old URLs to new URLs:

```markdown
## URL Redirect Map

### Redirect Strategy

All old URLs → New URLs via 301 (permanent) redirects

**Pattern Examples**:

| Source Pattern | Target Pattern | Rule | Volume |
|---|---|---|---|
| `/blog/YYYY/MM/DD/slug` | `/blog-slug` | Flatten date structure | 8,472 |
| `/post/ID` | `/blog-slug` | Use slug instead of ID | 342 |
| `/product/slug` | `/products/slug` | Rename section | 2,341 |
| `/products/category/name` | `/catalog/name` | Rename and restructure | 45 |
| `/old-landing-page` | `/` (root) | Archive old campaigns | 156 |
| `/faq/slug` | `/help/faq/slug` | Move to help section | 203 |

### 301 Redirect Execution

**Implementation**:
- CMS 12: Redirect rules in PageData properties or URL handler
- Execution: Build redirect table in database; configure web.config
- Validation: Test all redirects; verify 301 status code

**Effort**: 1-2 days to build table and configure
```

### Phase D: Content Freeze Schedule (10 minutes)

Define when changes stop in source system:

```markdown
## Content Freeze Schedule

**Content Freeze Timeline**:

| Date | Phase | Actions |
|---|---|---|
| **Week 12 End** | Pre-Migration Freeze Starts | No new content in source; only bug fixes allowed |
| **Waves 0-3** | Selective Freezes | Specific content types frozen as waves start |
| **Week 21 End** | Complete Freeze | All content frozen; no changes to source or target |
| **Week 22 (Go-Live)** | Cutover Day | Final content validation; switch DNS to production |
| **Post-Go-Live** | Unfrozen | Authoring resumes in CMS 12 only; source is archived |

**Content Team Impact**:
- Stop publishing new content after Week 12
- Current drafts/pending content may be lost if not migrated first
- Final 2-week freeze (Week 21-22) is busy period; coordinate with team
```

### Phase E: Exit Criteria Per Wave (10 minutes)

Define success metrics for each wave:

```markdown
## Exit Criteria

### Wave 0: Assets
- [ ] All 12,300 assets uploaded to CMS DAM
- [ ] Image URLs resolve (no 404s)
- [ ] Alt text populated for all images
- [ ] Random sample: 100 images verified in DAM

### Wave 1: Categories & FAQs
- [ ] Categories and tags visible in CMS
- [ ] FAQ items searchable and visible on website
- [ ] 100% of items have required fields (no validation errors)
- [ ] Sample: 5 FAQs verified end-to-end

### Wave 2: Blog Posts
- [ ] 8,628 blog posts published in CMS
- [ ] Random sample: 100 posts verified (content, images, links intact)
- [ ] Full-text search working (Azure Search indexed)
- [ ] Category/tag filtering works
- [ ] Old URLs redirect to new (spot check 10 URLs)
- [ ] Performance: Page load < 2 sec (sample pages)

### Wave 3: Products & Landing Pages
- [ ] 6,040 products + variants published
- [ ] Products sync to Commerce system verified
- [ ] 34 landing pages with custom blocks rendering correctly
- [ ] Sample: 10 products verified with variants
- [ ] Commerce API integration tested (product catalog sync)

### Wave 4: Polish
- [ ] All 301 redirects tested and working
- [ ] Final spot-check: 100 items across all types
- [ ] Performance testing passed (Lighthouse >80)
- [ ] Security scan passed (no XSS, CSRF vulnerabilities)
- [ ] Content team sign-off: "Ready to go live"
```

### Phase F: Detailed Week-by-Week Roadmap (20 minutes)

Create hour-by-hour or day-by-day plan:

```markdown
## Detailed Migration Roadmap

### Week 13: Wave 0 - Asset Migration

**Mon**: Asset extraction (pull 12,300 from source DAM)
- [ ] Database export: 12,300 image URLs + metadata
- [ ] Effort: 2 hours

**Tue**: Upload to CMS DAM
- [ ] Batch upload via API (automated script)
- [ ] Verify all images in DAM
- [ ] Effort: 4 hours

**Wed-Thu**: Validation
- [ ] Spot-check 100 random images
- [ ] Verify alt text populated
- [ ] Test image CDN delivery
- [ ] Effort: 8 hours

**Fri**: Buffer & documentation
- [ ] Document any issues
- [ ] Create 301 redirect table for image URLs
- [ ] Effort: 4 hours (18 hours total)

**Owner**: DevOps + Content Ops
**Resource**: 1 FTE

---

### Week 14-15: Wave 1 - Categories & FAQs

**Week 14 (Mon-Wed)**:
- Extract categories, tags, FAQs from source
- Transform and validate data
- Import into CMS
- Effort: 40 hours

**Week 14-15 (Thu-Fri)**:
- Spot-check FAQs on website
- Verify categorization and tagging
- Test search functionality
- Effort: 20 hours

**Owner**: Content Ops Lead + 1 Developer
**Resource**: 1 FTE

**Exit Criteria**:
- [ ] 775 items published in CMS
- [ ] No validation errors
- [ ] Sample verification passed

---

### Week 16-18: Wave 2 - Blog Posts

**Week 16 (Mon-Fri)**:
- Build transformation script (HTML → RichText)
- Test on sample of 100 posts
- Fix issues
- Effort: 40 hours

**Week 17 (Mon-Wed)**:
- Run transformation script on full 8,472 posts
- Monitor for errors; fix issues in real-time
- Import into CMS
- Effort: 30 hours

**Week 17-18 (Thu-Fri)**:
- Spot-check 100 random posts (2 posts/hour × 50 = 100 hours)
- Verify images loaded, links work, formatting preserved
- Sample redirect testing (10 old URLs)
- Effort: 100 hours (split across 2 engineers)

**Week 18 (Fri)**:
- Final validation, documentation
- Effort: 20 hours

**Owner**: 2 Developers + QA
**Resource**: 2 FTE for 3 weeks

---

### Week 19-21: Wave 3 - Products & Landing Pages

[Similar detail for each day...]

**Total**: 200+ hours over 3 weeks

---

### Week 22: Wave 4 - Final Polish

**Mon**: Redirect testing, final validations
**Tue-Wed**: Performance testing, security scan
**Thu**: Content team final sign-off
**Fri**: Go-live day!

---

## Overall Migration Timeline

| Week | Wave | Focus | Status | Owner |
|---|---|---|---|---|
| Week 13 | Wave 0 | Assets | ▶️ In Progress | DevOps |
| Week 14-15 | Wave 1 | Categories, FAQs | ⏸️ Pending | Content Ops |
| Week 16-18 | Wave 2 | Blog Posts | ⏸️ Pending | Development |
| Week 19-21 | Wave 3 | Products, Landing Pages | ⏸️ Pending | Development |
| Week 22 | Wave 4 | Polish, Go-Live | ⏸️ Pending | QA |

**Total Duration**: 10 weeks parallel to build phase
**Key Dependency**: Build phase must have CMS 12 configured by week 13
**Go-Live**: Week 22 (end of build phase)
```

### Phase G: Risk Register (Migration-Specific) (15 minutes)

Document migration risks:

```markdown
## Migration Risk Register

| Risk | Likelihood | Impact | Mitigation | Owner |
|---|---|---|---|---|
| **Source data quality worse than expected** | High | High | Pre-migration audit (week 12); cleanup most critical issues before migration | Content Lead |
| **Transformation script failures** | Medium | High | Test script on sample (week 16); built-in error handling; retry logic | Developer |
| **Image links broken after migration** | Medium | Medium | Verify image URLs post-upload; test CDN delivery | DevOps |
| **Redirect 301s not working** | Low | High | Test all redirects (wave 4); monitor 404s post-launch | DevOps |
| **Content not migrating due to validation errors** | Medium | Medium | Clear validation rules upfront; pre-validate sample data | Developer |
| **Commerce product sync fails silently** | Medium | High | Monitor sync logs; reconciliation report post-wave-3 | Integration Lead |
| **Performance issues discovered post-go-live** | Medium | High | Load testing (week 20); optimize before go-live | DevOps |
| **Team burnout due to migration intensity** | High | Medium | Sufficient staffing (2+ FTE); pace waves realistically; buffer time | PM |
| **Last-minute content changes by business** | High | Medium | Content freeze weeks 12-22; communicate clearly; escalate changes | PM |
| **Resource availability changes mid-migration** | Medium | High | Cross-train backup resources; document processes | PM |

**Top 3 Risks to Mitigate**:
1. Content quality issues → Pre-migration audit + cleanup
2. Performance after go-live → Load testing + monitoring
3. Scope creep (last-minute changes) → Strict content freeze + governance
```

## CONTEXT BOUNDARIES

- **In scope**: Wave planning, effort estimation, roadmap design, risk assessment
- **Out of scope**: Executing migration; that's build phase
- **Not your task**: Managing detailed day-to-day schedules; high-level roadmap sufficient

## YOUR TASK

1. Sequence content into waves (by dependency, complexity)
2. Estimate effort per wave (including quality & complexity factors)
3. Create URL redirect strategy and mapping
4. Define content freeze schedule
5. Create exit criteria per wave (success gates)
6. Build detailed week-by-week roadmap
7. Document migration-specific risks
8. Present complete plan with A/P/C menu

## SUCCESS METRICS

- [x] Waves sequenced logically (dependencies respected)
- [x] Effort estimated realistically (20% buffer included)
- [x] URL redirects mapped and actionable
- [x] Content freeze schedule communicated
- [x] Exit criteria defined per wave
- [x] Week-by-week roadmap detailed and assigned
- [x] Migration risks identified with mitigations
- [x] Total effort realistic (~1,000-1,200 hours over 10 weeks)
- [x] Stakeholders understand timeline and resource needs

## NEXT STEP

After step-03 complete:
- Migration plan is APPROVED and READY FOR EXECUTION
- Build phase (weeks 7-22) uses this plan to execute content migration
- Waves execute per schedule; validate per exit criteria
- Go-live week 22 with fully migrated content

---

**Step 3 Status**: [PENDING → IN PROGRESS → COMPLETE → APPROVED]

Update frontmatter `status: complete` and `stepsCompleted: 3` when done.

Update to `status: approved` once stakeholders review and sign off.

**Workflow Status**: COMPLETE ✓

Mark migration plan document `status: approved` at top level once stakeholders approve.
