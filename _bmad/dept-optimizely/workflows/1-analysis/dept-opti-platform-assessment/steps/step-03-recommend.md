---
step: 3
name: Final Recommendation and Roadmap
workflow: dept-opti-platform-assessment
status: pending
dependsOn: step-02-evaluate
---

# Step 3: Final Recommendation and Roadmap

## MANDATORY EXECUTION RULES

1. **Recommendation is based on scoring + qualitative assessment**:
   - Numeric scoring guides but doesn't determine decision
   - Qualitative factors (risks, strategic fit, team dynamics) included
   - Recommendation explicitly justified with references to step-01 and step-02

2. **Recommendation includes rationale addressing each stakeholder concern**:
   - Business drivers from step-01
   - Technical requirements from step-01
   - Team skill constraints from step-01
   - Scoring results from step-02
   - Risk mitigation strategies from step-02

3. **Commerce and AI/CMP assessment included**:
   - How well does each platform support commerce integration?
   - Where do CMP and Opal AI opportunities fit?
   - Is commerce critical to decision or secondary?

4. **Implementation roadmap sketched**:
   - High-level phases (planning, design, build, launch)
   - Key milestones
   - Critical path items
   - Resource requirements
   - Known risks and gates

5. **Document marked for stakeholder review and decision**:
   - Status updates from in-progress to recommendation
   - Once stakeholders decide, status becomes decided

## EXECUTION PROTOCOLS

### Phase A: Recommendation Synthesis (20 minutes)

Review step-02 scoring and identify recommendation:

**Decision Framework**:

1. **Numeric guidance** (step-02 scoring)
   - Which platform scored higher?
   - Is the gap significant (>10 points) or modest (<5 points)?
   - Which must-have dimensions favor each platform?

2. **Qualitative assessment** (step-02 strengths/weaknesses)
   - Which platform's weaknesses are most problematic?
   - Which platform's strengths are most valuable?
   - Which risk is hardest to mitigate?

3. **Strategic alignment** (step-01 requirements)
   - Which platform best enables business goals?
   - Which platform best fits team composition?
   - Which platform aligns with technology strategy?

4. **Break-even analysis**:
   - Are there showstopper issues for either platform?
   - Are there must-have requirements only one platform supports?
   - Is the decision genuinely close, or should one platform be recommended?

**Example Recommendation Logic**:

Assume from step-02:
- CMS 12: 77% fit (646 points)
- SaaS CMS: 73% fit (612 points)
- Gap: 4 percentage points (modest)

From step-01:
- Must-Have requirements: Content model flexibility, API capabilities, Team skills, Integration, Security, Compliance
- CMS 12 stronger in: Team skills (9/10 vs 6/10), Integration (8/10 vs 8/10)
- SaaS CMS stronger in: API capabilities (10/10 vs 7/10)
- Both strong in: Security, Compliance, Content model

From step-02 risks:
- CMS 12: GraphQL delay impacts headless modernization
- SaaS CMS: Team resistance and workflow complexity

**Recommendation**: **CMS 12**

Rationale:
1. **Team fit is critical** - Existing .NET team significantly reduces risk and cost
2. **Content model strength** - Complex products need inheritance and blocks; CMS 12 native
3. **Integration maturity** - Commerce integration is deep and proven; reduces risk
4. **Risk management** - "Skill gap" risk is larger than "headless API" risk; GraphQL is roadmapped
5. **Cost predictability** - DXP Cloud managed infrastructure reduces operational burden
6. **Time-to-value** - Shorter ramp-up with existing .NET team; can deliver faster

**Risks Acknowledged**:
- No GraphQL until Optimizely ships it (workaround: REST API for headless, migrate later)
- Team learning curve on block component model (mitigation: training, architecture guidance)
- DXP Cloud cost scaling needs monitoring (mitigation: load testing, early budget tracking)

### Phase B: Commerce Integration Assessment (15 minutes)

Assess how each platform handles ecommerce:

**CMS 12 + Commerce Integration**:

```markdown
## CMS 12 + Optimizely Commerce Integration

**Architecture**:
- CMS 12 and Commerce are sibling products (both .NET)
- Shared authentication (Optimizely Identity)
- Product types defined in CMS; synchronized to Commerce
- Catalog can be authored in CMS or Commerce (choose one master)
- Pricing and inventory managed in Commerce (read-only in CMS)

**Approach**:
1. Define product content model in CMS 12 (SKU, name, description, images)
2. Configure Commerce with catalog (pricing, inventory, promotions)
3. Sync via APIs or integration events
4. CMS displays products; Commerce handles commerce logic

**Strengths**:
- Tight integration (same platform team)
- Shared security and identity
- CMS content can trigger Commerce events
- Well-documented patterns
- Extensive ecosystem and partner support

**Weaknesses**:
- Both are .NET; less flexibility if you want non-.NET commerce
- Integration requires CMS and Commerce licensing
- Learning curve for both platforms

**Example Flow**:
```
Author Product Page (CMS 12)
  ↓
Publish with SKU
  ↓
Sync to Optimizely Commerce API
  ↓
Commerce system updates catalog
  ↓
Storefront displays product (via Commerce API)
```

**Effort Estimate**: 3-4 weeks for integration design, implementation, testing
```

**SaaS CMS + Commerce Integration**:

```markdown
## SaaS CMS + Optimizely Commerce Integration

**Architecture**:
- SaaS CMS is content hub; Commerce is separate (can be Optimizely Commerce or 3rd party)
- API-first integration via webhooks
- Product content stored in SaaS CMS; catalog in Commerce
- Either system can be "source of truth" depending on business model

**Approach**:
1. Define product content type in SaaS CMS
2. Author products in CMS (name, description, images, SKU)
3. Webhook publishes event on product save
4. Commerce API receives event and creates/updates product
5. Storefront queries Commerce for catalog

**Strengths**:
- Language-agnostic (works with any commerce system)
- Loose coupling; each system is independent
- Can use Optimizely Commerce OR Shopify OR custom
- Flexible; can change commerce platform without CMS changes
- Webhook-based is modern and scalable

**Weaknesses**:
- More integration code required (webhooks, transformations)
- Less "out of the box" than CMS 12 + Commerce
- Requires separate Commerce licensing (same cost, less integration)
- Product metadata sync must be managed carefully

**Example Flow**:
```
Author Product (SaaS CMS)
  ↓
Publish with SKU
  ↓
Webhook triggers
  ↓
Webhook handler calls Commerce API
  ↓
Commerce creates/updates product
  ↓
Storefront displays product (via Commerce API)
```

**Effort Estimate**: 2-3 weeks for webhook architecture, API integration, testing (less ceremony than CMS 12)
```

**Recommendation on Commerce**:

If commerce integration is critical decision factor:
- **CMS 12**: Better if you want tight integration, single team, proven patterns
- **SaaS CMS**: Better if you want flexibility, modern async patterns, non-Optimizely commerce

For this project, if using Optimizely Commerce, CMS 12 integration is moderately better.
If considering Shopify or custom commerce, SaaS CMS is equally viable.

### Phase C: Opal AI and CMP Opportunities (10 minutes)

Assess where Optimizely's AI and personalization tools fit:

**Optimizely Opal AI**:
- Purpose: Auto-generate variations of content for testing
- Works with: Optimizely Web Experimentation
- Requirement: Content in CMS must have structured metadata (title, description, etc.)
- Benefit: Speed up experimentation; generate copy variants

**Platform Fit**:
- **CMS 12**: Structured metadata (PageData properties) fits Opal needs well
- **SaaS CMS**: Structured content model also fits well
- **Neither platform is limiting factor**; both work fine with Opal

**CMP (Content Management Platform)**:
- Purpose: Consolidate content from multiple sources (CMS, DAM, commerce, etc.)
- Works with: Either CMS 12 or SaaS CMS as content source
- Benefit: Single content view across organization

**Platform Fit**:
- **CMS 12**: CMP can read via REST API; works fine
- **SaaS CMS**: CMP can read via Content Graph (better performance)
- **SaaS CMS slightly favored** for CMP due to GraphQL

**Recommendation on AI/CMP**:

Neither platform limits AI/CMP opportunities. Both work well.
- CMS 12 + Opal: Good (structured metadata)
- SaaS CMS + Opal: Good (structured content types)
- CMS 12 + CMP: Good (REST API)
- SaaS CMS + CMP: Better (Content Graph)

If AI/CMP is critical, slight edge to SaaS CMS. But for this project, both platforms are fine.

### Phase D: Risk Mitigation and Roadmap (20 minutes)

For recommended platform, create detailed roadmap:

```markdown
## Implementation Roadmap: CMS 12

**Overall Timeline**: 24 weeks to go-live

### Phase 1: Planning & Design (Weeks 1-6)

**Goals**:
- Finalize content model (design by week 2)
- Architect CMS 12 solution (.NET, blocks, integrations)
- Design Commerce integration
- Plan team and staffing
- Identify risks and mitigations

**Deliverables**:
- [ ] Content model approved (week 2)
- [ ] Technical architecture (week 3)
- [ ] Detailed project plan (week 4)
- [ ] Team staffing plan (week 5)
- [ ] Risk register with owners (week 6)

**Resources**:
- 1 CMS 12 architect (0.5 FTE)
- 1 Commerce architect (0.25 FTE)
- Content lead (0.5 FTE)
- Project manager (1.0 FTE)

**Critical Path**:
- Finalize content model early (gates architecture)
- Identify integration points early (gates build effort estimates)
- Secure .NET developer resources (potential hiring)

**Risks in This Phase**:
- Content model design delayed → mitigation: allocate 3 days max for decisions
- Platform training delays team → mitigation: start training week 1
- Architect unavailable → mitigation: identify backup architect

### Phase 2: Setup & Configuration (Weeks 7-12)

**Goals**:
- Set up CMS 12 instances (dev, staging, production)
- Configure content model in CMS 12 PageData
- Set up Commerce integration
- Configure Optimizely CDN and caching
- Deploy initial content types

**Deliverables**:
- [ ] Development environment operational (week 7)
- [ ] Content types defined in CMS 12 (week 8)
- [ ] Commerce integration tested (week 10)
- [ ] Staging environment operational (week 12)

**Resources**:
- 2 .NET developers (1.5 FTE each)
- 1 DevOps engineer (1.0 FTE)
- 1 CMS architect (0.25 FTE - oversight)
- Content ops (0.5 FTE - testing)

**Critical Path**:
- Development environment ready by week 7 (gates all build work)
- Commerce integration proven by week 10 (gates migration planning)
- Staging ready by week 12 (gates content migration)

**Risks in This Phase**:
- DXP Cloud provisioning delayed → mitigation: submit request week 5; follow up weekly
- Commerce API complexity higher than expected → mitigation: 1-week integration spike week 6
- Block component model requires rework → mitigation: prototype week 6 before production design

### Phase 3: Content Migration & Testing (Weeks 13-20)

**Goals**:
- Migrate content from source system to CMS 12
- Test all content types and relationships
- Validate Commerce sync
- Performance testing and optimization
- User acceptance testing (content team)

**Deliverables**:
- [ ] Migration scripts ready (week 13)
- [ ] Wave 1 content migrated (week 14)
- [ ] Wave 2 content migrated (week 17)
- [ ] All content validated (week 19)
- [ ] Performance testing passed (week 20)

**Resources**:
- 2 .NET developers (1.0 FTE each - migration scripting)
- 1 QA engineer (1.0 FTE - content validation)
- 2 Content ops (1.0 FTE each - manual migration, validation)
- 1 Performance engineer (0.25 FTE - load testing)

**Critical Path**:
- Migration scripts ready by week 13 (gates content migration)
- Wave 1 content signed off by week 15 (gates wave 2)
- Performance validated by week 20 (gates launch approval)

**Risks in This Phase**:
- Content quality issues discovered in migration → mitigation: run content audit week 11 to clean up
- Performance bottlenecks → mitigation: load testing week 14 (early warning)
- Data transformation complexities → mitigation: sample migration week 9 to validate approach

### Phase 4: Launch & Stabilization (Weeks 21-24)

**Goals**:
- Final testing and go-live preparation
- Cutover day activities
- Monitor and stabilize in production
- Handle go-live issues
- Post-launch support

**Deliverables**:
- [ ] Launch checklist completed (week 21)
- [ ] Go-live successful (week 22)
- [ ] Production issues resolved (week 24)
- [ ] Team trained on operations (week 23)

**Resources**:
- 2 .NET developers (1.0 FTE each - on-call for go-live)
- 1 QA engineer (1.0 FTE - final testing, go-live support)
- 1 DevOps engineer (1.0 FTE - infrastructure monitoring)
- 1 Support engineer (1.0 FTE - customer issue triage)

**Critical Path**:
- Final testing completed by week 21 (gates go-live)
- Cutover executed week 22 (go-live day)
- Issues resolved within 48 hours (production stability)

**Risks in This Phase**:
- Last-minute content changes delay go-live → mitigation: content freeze week 20
- Production performance issues discovered → mitigation: performance testing week 20 catches most
- Unexpected integrations fail → mitigation: full integration testing week 20

### Key Milestones

| Week | Milestone | Gate |
|---|---|---|
| Week 2 | Content model approved | gates all design work |
| Week 6 | Planning complete, team staffed | gates execution phases |
| Week 7 | Dev environment ready | gates build work |
| Week 12 | Staging operational | gates content migration |
| Week 14 | Wave 1 content migrated | gates wave 2 |
| Week 20 | All testing passed | gates launch approval |
| Week 22 | Production go-live | success = system stable 48 hours |

### Staffing Plan

**Phases 1-2 (Planning & Setup)**: 6 FTE total
**Phase 3 (Migration & Testing)**: 8 FTE total
**Phase 4 (Launch)**: 6 FTE total

**Key Roles**:
- CMS 12 Architect: Start week 1, continuous
- .NET Developers: 2 needed; may need 1 hire
- DevOps Engineer: Start week 7, continuous
- QA Engineer: Start week 7, continuous
- Content Operations: 2 needed for migration support

**Training & Ramp-up**:
- CMS 12 platform training: 3 days for all team (week 2)
- Commerce integration training: 2 days for integrations team (week 7)
- Content modeling training: 2 days for content team (week 5)

### Budget & Cost Estimate

| Category | Est. Cost | Notes |
|---|---|---|
| CMS 12 Licensing | $80K-150K/year | Per environment licensing |
| DXP Cloud Infrastructure | $2K-5K/month | Managed hosting, scales with traffic |
| Optimizely Commerce License | $50K-100K/year | If not already owned |
| Professional Services (4-month) | $400K-600K | Estimated 30-40 weeks consulting |
| Internal Team (24 weeks) | $600K-900K | 6-8 FTE average; varies by region |
| Testing & Performance Tools | $50K | Load testing, CDN, monitoring |
| **TOTAL PROJECT COST** | **$1.2M - 1.9M** | 24-week engagement |

### Risk Register (Platform-Specific)

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| .NET developer availability | Medium | High | Start recruiting week 1; offer training to junior devs |
| GraphQL roadmap delayed | Low | Medium | Use REST API for headless; re-evaluate quarterly |
| DXP Cloud provisioning delays | Medium | Medium | Submit request week 5; escalate if delayed |
| Commerce integration complexity | Medium | Medium | 1-week spike week 6; prototype before production build |
| Content model changes late | High | High | Content freeze week 20; lock model week 15 |
| Performance bottlenecks discovered | Medium | Medium | Load testing week 14 and week 20 |
| Team learning curve steep | Medium | Medium | CMS 12 training week 2; hands-on coaching weeks 7-12 |
| Data migration script failures | Medium | High | Sample migration week 9; validate approach early |

### Success Criteria

- [ ] Project completed on time and within budget (week 24)
- [ ] All content migrated and validated (week 20)
- [ ] System stable in production for 48 hours post-launch (week 22)
- [ ] Content team can author/publish independently (week 23)
- [ ] Performance SLAs met (< 2 sec page load, 99.5% uptime)
- [ ] All integrations working (Commerce, Analytics, etc.)
- [ ] Team trained and empowered to maintain system
```

### Phase E: Final Recommendation Presentation (15 minutes)

Synthesize all findings into clear recommendation:

```markdown
## FINAL PLATFORM RECOMMENDATION

### Recommended Platform: **Optimizely CMS 12 (PaaS)**

**Overall Assessment**:
- **Fit Score**: 77% (646/84 weighted points) - best match for your project
- **Primary Decision Drivers**: Team skills fit, content model strength, Commerce integration maturity
- **Risk Level**: Low to Medium (risks are manageable with proper planning)
- **Timeline**: 24 weeks to go-live (realistic for this scope)
- **Budget**: $1.2M - 1.9M total project cost

### Key Reasons for CMS 12 Recommendation

**1. Team Skills Alignment** (Score 9/10 vs 6/10 for SaaS CMS)
- You have 2 existing .NET developers
- CMS 12 is built on .NET/.NET Framework
- Existing team can rapidly get productive
- Reduces hiring needs and ramp-up time
- Rationale: Hiring/training costs favor existing skill set

**2. Content Model Strength** (Score 9/10 vs 8/10)
- Your content is moderately complex (products with variants, hierarchies)
- CMS 12 PageData/BlockData handles this natively
- Inheritance model provides flexibility
- ContentArea enables dynamic composition
- Rationale: Native support reduces custom code and risks

**3. Commerce Integration** (Score 8/10)
- Optimizely Commerce is your chosen platform
- CMS 12 + Commerce are sibling products (same team, same .NET platform)
- Proven patterns and tight integration
- Shared authentication and identity
- Rationale: Reduces integration complexity and risk

**4. Risk Management**
- Biggest risk with SaaS CMS would be team learning curve and unknown platform
- Biggest risk with CMS 12 would be GraphQL absence (but workaround exists)
- GraphQL absence is lower-risk than team skill gap
- Rationale: Choose manageable risks over fundamental misalignment

**5. Time-to-Value**
- Existing .NET team can contribute immediately
- Faster ramp-up = faster go-live
- Better for your Q3 2026 target timeline
- Rationale: Team productivity drives timeline success

### Acknowledged Weaknesses & Mitigations

**CMS 12 Weakness 1: No GraphQL (yet)**
- Current state: REST API only for headless delivery
- Optimizely roadmap: GraphQL planned (ETA: TBD)
- Mitigation: Use REST API for headless until GraphQL available; migrate later if needed
- Impact: Low (you don't need headless immediately; website-first approach viable)
- Risk: If headless becomes critical before GraphQL ships, evaluate SaaS CMS transition

**CMS 12 Weakness 2: Older UI/UX**
- Current state: Page builder is functional but not as modern as SaaS CMS Visual Builder
- Impact: Moderate (content team will adapt quickly)
- Mitigation: Training and hands-on coaching in build phase
- Risk: Low (content team learning curve, not platform limitation)

**CMS 12 Weakness 3: .NET-Only Ecosystem**
- Current state: Requires .NET developers for customization
- Impact: Moderate (limits front-end flexibility)
- Mitigation: Choose headless delivery pattern; front-end is JavaScript/React (decoupled)
- Risk: Low (architecture decouples front-end from platform)

### Why Not SaaS CMS?

**SaaS CMS Strengths**:
- Modern UI/UX for content teams
- Purpose-built Content Graph (excellent for headless)
- Fully managed SaaS (minimal operations)
- More predictable cost model

**Why CMS 12 Wins**:
- Your team has existing .NET skills (SaaS CMS would require training)
- Content model complexity better supported (inheritance vs flat)
- Commerce integration is tighter (CMS 12 + Optimizely Commerce)
- Lower overall risk due to team alignment

**Cost Comparison**:
- CMS 12 licensing: $80-150K/year + $2-5K/month DXP Cloud
- SaaS CMS pricing: Similar licensing + lower infrastructure
- **Winner**: SaaS CMS is 10-15% cheaper on licensing; CMS 12 is 15-20% cheaper on team time (existing .NET expertise)
- **Net**: CMS 12 slightly cheaper overall when factoring team productivity

### Implementation Approach

**Next Steps**:
1. **Approve this recommendation** with stakeholder sign-off
2. **Move to Architecture Design** (dept-opti-architecture workflow)
3. **Begin team staffing** (identify .NET architect, potential hire)
4. **Finalize content model** (building on dept-opti-content-model work)
5. **Start CMS 12 platform training** (week 1 of execution)

**24-Week Roadmap**:
- Weeks 1-6: Planning & Design (finalize content model, architecture)
- Weeks 7-12: Setup & Configuration (build CMS 12 instances, integrate Commerce)
- Weeks 13-20: Content Migration & Testing (migrate content from source system)
- Weeks 21-24: Launch & Stabilization (go-live and production support)

**Expected Outcomes**:
- [ ] Optimizely CMS 12 fully operational by week 22
- [ ] All legacy content migrated and validated
- [ ] Commerce integration tested and working
- [ ] Content team trained and independent
- [ ] System meeting performance SLAs
- [ ] Team empowered to maintain and evolve platform

### What This Means for Your Project

**Positive Impacts**:
- Faster go-live (your existing .NET team ramps quickly)
- Lower hiring needs (leverage existing expertise)
- Proven platform (mature ecosystem, community support)
- Strong vendor support (Optimizely is committed to CMS 12)
- Commerce integration reduces build effort

**Planning Adjustments**:
- Allocate training budget for platform (week 2)
- Plan integration spike for Commerce (week 6)
- Ensure architecture review early (week 3, gates all build work)
- Front-load risk mitigation (content audit pre-migration, load testing weeks 14 & 20)

---

## Commerce & AI/CMP Assessment

### Commerce Integration

**CMS 12 + Optimizely Commerce**: Recommended approach
- Pros: Native integration, shared platform, proven patterns
- Integration effort: 3-4 weeks (design, build, test)
- Effort estimate is in roadmap above

### Opal AI & CMP Opportunities

**Opal AI**: Available for both platforms
- Structured metadata in CMS 12 PageData works well
- Opportunity: Use Opal to generate product descriptions, variation copy
- Timeline: Post-launch (week 25+)
- Effort: 1-2 weeks integration

**CMP (Content Management Platform)**: Available for both
- CMS 12 Content Graph (REST API) integrates with CMP
- Opportunity: Consolidate content view across organization (CMS 12, Commerce, DAM)
- Timeline: Post-launch (week 26+)
- Effort: 2-3 weeks integration

**Recommendation**: Plan Opal AI and CMP as Phase 2 initiatives (post-launch). Focus on core migration in phase 1.

---

## Stakeholder Decision Point

**This is a major decision gate**. Once platform is chosen:
- Architecture design will be platform-specific
- Code patterns will be locked in
- Changing platforms later is extremely expensive

**Recommendation Request**:
- Review this assessment with executive team
- Validate CMS 12 choice against business goals
- Confirm timeline and budget alignment
- Authorize architecture design phase (next workflow)

**Decision Timeline**:
- [ ] Stakeholder review: This week
- [ ] Questions/clarifications: Next 2-3 days
- [ ] Final approval: By EOW
- [ ] Begin architecture design: Week after approval
```

## CONTEXT BOUNDARIES

- **In scope**: Making the final recommendation based on data and qualitative assessment, outlining roadmap
- **Out of scope**: Executing the roadmap or beginning implementation
- **Not your task**: Resolving all implementation details; roadmap is high-level

## YOUR TASK

1. Synthesize step-02 scoring and qualitative assessment
2. Make final platform recommendation with clear rationale
3. Address Commerce integration for recommended platform
4. Assess Opal AI and CMP opportunities
5. Create detailed implementation roadmap (24 weeks)
6. Identify platform-specific risks and mitigations
7. Present recommendation for stakeholder decision
8. Document decision once approved

## INITIALIZATION SEQUENCE

```
1. Load step-02 evaluation results → review scoring and strengths/weaknesses
2. Assess qualification logic → which platform should win?
3. Synthesize reasoning → document decision factors
4. Assess Commerce integration → for recommended platform
5. Assess AI/CMP opportunities → both platforms
6. Create implementation roadmap → 24-week high-level plan
7. Identify platform-specific risks → with mitigations
8. Prepare recommendation presentation → stakeholder ready
9. Present and seek approval → move forward with architecture design
```

## SUCCESS METRICS

At the end of this step, you should have:

- [x] Clear platform recommendation with rationale
- [x] Recommendation justified against step-01 requirements
- [x] Recommendation justified against step-02 scoring
- [x] Weaknesses acknowledged with mitigations
- [x] Alternative platform assessed (why not the other one?)
- [x] Commerce integration strategy documented
- [x] Opal AI and CMP opportunities identified
- [x] Implementation roadmap detailed (24 weeks, phases, milestones)
- [x] Budget and resource estimates provided
- [x] Risk register specific to recommended platform
- [x] Recommendation presented clearly to stakeholders
- [x] Decision documented and approved

## FAILURE MODES

| Failure | Signal | Recovery |
|---------|--------|----------|
| Stakeholders disagree with recommendation | Team prefers other platform | Review data; conduct collaborative discussion; document dissent |
| Recommendation appears biased | One platform scored unfairly | Review scoring methodology; re-score disputed dimensions |
| Roadmap too aggressive | Stakeholders doubt timeline | Extend to 28-32 weeks; reduce scope; phase rollout |
| Budget too high | Exceeds available funding | Reduce scope (defer content types, phase migration) |
| Risks underestimated | Major risk category missing | Conduct risk workshop; update register; adjust timeline buffer |

## NEXT STEP

Once step-03 recommendation is approved:
- Move to **dept-opti-architecture** workflow
- Design technical solution for recommended platform (CMS 12 or SaaS CMS)
- Build architecture decision records (ADRs)
- Design for integration, deployment, security, performance
- Output: Technical architecture ready for build phase

---

**Step 3 Status**: [PENDING → IN PROGRESS → COMPLETE → DECIDED]

Update frontmatter:
- `status: recommendation` → present to stakeholders
- `status: decided` → after stakeholders approve
- `stepsCompleted: 3`
- `recommendedPlatform: [CMS 12 or SaaS CMS]`
- `decisionDate: [when approved]`
- `decisionOwner: [who approved]`

**Workflow Status**: COMPLETE ✓

Mark assessment document `status: decided` at top level once stakeholders approve.
