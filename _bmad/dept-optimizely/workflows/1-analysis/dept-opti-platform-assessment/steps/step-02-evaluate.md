---
step: 2
name: Platform Evaluation and Scoring
workflow: dept-opti-platform-assessment
status: pending
dependsOn: step-01-init
---

# Step 2: Platform Evaluation and Scoring

## MANDATORY EXECUTION RULES

1. **Both platforms scored across all 10 dimensions**:
   - Each dimension independently evaluated
   - Scoring 1-10 scale (1 = poor fit, 10 = excellent fit)
   - Scoring must reference requirements from step-01
   - Rationale documented for each score

2. **Weighted scoring applied**:
   - Use weights from step-01 prioritization
   - Weighted average per platform
   - Final score guides recommendation (but not deterministic)

3. **Qualitative assessment required**:
   - Scores alone don't make the decision
   - Document strengths/weaknesses of each platform
   - Highlight risks and mitigations
   - Consider strategic fit beyond pure scoring

4. **Comparison matrix comprehensive and readable**

## EXECUTION PROTOCOLS

### Phase A: Content Model Flexibility Evaluation (15 minutes)

**Dimension**: Can the platform adapt to complex content structures?

**CMS 12 Assessment**:

For each complexity pattern from source audit, ask:
- "Can CMS 12 PageData/BlockData handle this?"
- "Would we need custom code or extensions?"
- "How maintainable is the solution?"

Example patterns:
- **Complex product variants**: PageData parent + child pages (native, excellent)
- **Dynamic block composition**: ContentArea with multiple BlockData types (native, excellent)
- **Hierarchical navigation**: Content tree structure (native, excellent)
- **Rich rich text with custom components**: ContentArea within RTE (possible, requires custom code)
- **Graph-based relationships**: ContentReference (basic, works well)
- **Versioning and scheduling**: Built-in (excellent)

**CMS 12 Score**: 9/10

Rationale:
- PageData inheritance provides structure
- BlockData enables composition
- ContentArea handles dynamic lists
- ContentReference enables relationships
- Built-in versioning and scheduling
- *Weakness*: Circular references require careful design; complex custom relationships need code

**SaaS CMS Assessment**:

For same patterns, ask:
- "Can SaaS CMS content types handle this?"
- "Are references sufficient or do we need custom logic?"
- "How clean is the data model?"

Example patterns:
- **Complex product variants**: Separate content type with parent reference (clean, requires discipline)
- **Dynamic section composition**: Sections with arrays of components (native, excellent)
- **Hierarchical navigation**: Parent reference field (clean but requires discipline)
- **Rich text with custom elements**: RichText field with custom blocks (flexible, native)
- **Graph-based relationships**: Reference fields (clean, explicit)
- **Versioning and scheduling**: REST API manages versions; scheduling external (functional but less integrated)

**SaaS CMS Score**: 8/10

Rationale:
- Flat model is more flexible than inheritance
- Sections provide clear organization
- Reference fields explicit and clean
- Content Graph enables complex queries
- *Weakness*: Versioning/scheduling less integrated; requires external workflow or API management

**Weighted to Step-01 Requirement Priority**:

From step-01, Content Model Flexibility = Must-Have, Weight 10

**Comparison**:
| Platform | Score | Weight | Weighted Score |
|---|---|---|---|
| CMS 12 | 9 | 10 | 90 |
| SaaS CMS | 8 | 10 | 80 |

Continue for all 10 dimensions...

### Phase B: Authoring Experience Evaluation (10 minutes)

**Dimension**: How intuitive and powerful is the editor for content teams?

**CMS 12 Assessment**:

- **Visual page builder**: Drag-drop component composition (strong)
- **Content tree navigation**: Familiar to CMS users (strong)
- **Preview and publishing**: Built-in preview, status tracking (strong)
- **Rich text editor**: WYSIWYG with inline media (strong)
- **Workflow integration**: Built-in approval workflows (strong)
- **Learning curve**: CMS experience translates; .NET concepts not needed (strong)
- **Mobile editor**: Limited (weakness)
- **Customization**: Extensive for developers, less for power users (moderate)

**CMS 12 Score**: 8/10

Rationale: Powerful and familiar, but mobile editing weak; developer customization needed for advanced content ops

**SaaS CMS Assessment**:

- **Visual builder**: Modern, more intuitive than CMS 12 (strong)
- **Content hub model**: Less hierarchical, more flat (moderate - simpler for some, unfamiliar for others)
- **Preview and publishing**: Real-time preview, flexible publishing (strong)
- **Rich text editor**: Modern WYSIWYG (strong)
- **Workflow integration**: External or webhook-based (moderate - less integrated)
- **Learning curve**: More modern UI, less CMS-like (moderate - steeper for traditional CMS users)
- **Mobile editor**: Better than CMS 12 (strong)
- **Customization**: Visual Builder provides no-code composition (strong)

**SaaS CMS Score**: 8/10

Rationale: Modern and mobile-friendly, but less integrated workflow; flat model may confuse traditional CMS users

From step-01, Authoring Experience = Should-Have, Weight 7

| Platform | Score | Weight | Weighted Score |
|---|---|---|---|
| CMS 12 | 8 | 7 | 56 |
| SaaS CMS | 8 | 7 | 56 |

### Phase C: API Capabilities Evaluation (10 minutes)

**Dimension**: Can we build headless/omnichannel experiences?

**CMS 12 Assessment**:

- **REST API**: Full CRUD on content (strong)
- **GraphQL**: Planned, not yet available (weakness)
- **Performance**: REST queries can be complex; projection needed (moderate)
- **Rate limiting**: Reasonable for headless (strong)
- **SDKs**: .NET SDK strong, client SDKs adequate (strong)
- **Authentication**: OAuth, API keys (strong)
- **Real-time delivery**: Content Graph planned (future)
- **Current limitation**: REST-only, can require multiple requests

**CMS 12 Score**: 7/10

Rationale: Solid REST API, but no GraphQL yet limits modern headless use cases; .NET-centric SDKs

**SaaS CMS Assessment**:

- **Content Graph**: Unified GraphQL API (excellent)
- **Performance**: Built on CDN, cached queries (excellent)
- **Rate limiting**: Generous for typical headless use (strong)
- **SDKs**: JavaScript/Node SDK strong, other languages good (strong)
- **Authentication**: OAuth, webhooks (strong)
- **Real-time**: Webhooks on publish events (strong)
- **Flexibility**: GraphQL enables complex queries in single request (excellent)

**SaaS CMS Score**: 10/10

Rationale: Purpose-built for headless; Content Graph is excellent; strong for omnichannel

From step-01, API Capabilities = Must-Have, Weight 10

| Platform | Score | Weight | Weighted Score |
|---|---|---|---|
| CMS 12 | 7 | 10 | 70 |
| SaaS CMS | 10 | 10 | 100 |

### Phase D-J: Remaining Dimensions (60 minutes)

Continue evaluation for:
- **Deployment Model** (Cloud managed vs self-managed)
- **Cost Model** (Licensing vs API usage)
- **Team Skills** (Does our team fit the platform?)
- **Integration Complexity** (How many systems to integrate?)
- **Multi-Site & Multi-Language** (Can it handle our scale?)
- **Security & Compliance** (Do certifications match requirements?)
- **Performance & Scaling** (How well does it handle load?)

For each dimension:
1. Load requirement from step-01
2. Assess CMS 12 against requirement
3. Score 1-10 with rationale
4. Assess SaaS CMS against requirement
5. Score 1-10 with rationale
6. Apply weight from step-01
7. Calculate weighted score

**Deployment Model Evaluation**:

From step-01: "Prefer managed cloud (reduce ops burden)" = Should-Have, Weight 6

- **CMS 12**: DXP Cloud (managed, highly available, scaling handled) = 9/10
- **SaaS CMS**: Fully managed SaaS (no infrastructure responsibility) = 10/10

| Platform | Score | Weight | Weighted Score |
|---|---|---|---|
| CMS 12 | 9 | 6 | 54 |
| SaaS CMS | 10 | 6 | 60 |

**Cost Model Evaluation**:

From step-01: "Fixed annual budget; predictability important" = Should-Have, Weight 8

- **CMS 12**: Licensing per environment + DXP Cloud infrastructure = variable based on scaling (7/10)
- **SaaS CMS**: Predictable tier pricing + API calls (all-inclusive) = more predictable (9/10)

| Platform | Score | Weight | Weighted Score |
|---|---|---|---|
| CMS 12 | 7 | 8 | 56 |
| SaaS CMS | 9 | 8 | 72 |

**Team Skills Evaluation**:

From step-01: "Have 2 .NET devs, JavaScript developers" = Must-Have, Weight 9

- **CMS 12**: Requires .NET developers; existing team fits = 9/10
- **SaaS CMS**: JavaScript/Node preferred; team mixed = 6/10

| Platform | Score | Weight | Weighted Score |
|---|---|---|---|
| CMS 12 | 9 | 9 | 81 |
| SaaS CMS | 6 | 9 | 54 |

Continue for remaining dimensions (Integration, Multi-Site, Security, Performance)...

### Phase K: Scoring Summary Table (15 minutes)

Compile all dimension scores into summary table:

```markdown
## Platform Evaluation Summary

| Dimension | Priority | Weight | CMS 12 Score | CMS 12 Weighted | SaaS Score | SaaS Weighted |
|---|---|---|---|---|---|---|
| **Content Model Flexibility** | Must | 10 | 9 | 90 | 8 | 80 |
| **Authoring Experience** | Should | 7 | 8 | 56 | 8 | 56 |
| **API Capabilities** | Must | 10 | 7 | 70 | 10 | 100 |
| **Deployment Model** | Should | 6 | 9 | 54 | 10 | 60 |
| **Cost Model** | Should | 8 | 7 | 56 | 9 | 72 |
| **Team Skills** | Must | 9 | 9 | 81 | 6 | 54 |
| **Integration Complexity** | Must | 9 | 8 | 72 | 8 | 72 |
| **Multi-Site & Multi-Language** | Should | 7 | 9 | 63 | 8 | 56 |
| **Security & Compliance** | Must | 10 | 9 | 90 | 9 | 90 |
| **Performance & Scaling** | Should | 8 | 8 | 64 | 9 | 72 |
| **TOTAL** | | **84** | | **646** | | **612** |
| **Normalized Score** | | | | **77%** | | **73%** |

**Overall Scores**:
- **CMS 12**: 646 / 84 = 7.7/10 (77%)
- **SaaS CMS**: 612 / 84 = 7.3/10 (73%)

**Analysis**:
- CMS 12 leads by 4 percentage points
- CMS 12 stronger in: Team Skills fit, Integration complexity, Content model
- SaaS CMS stronger in: API capabilities, Deployment model, Cost predictability
- Gap is modest; both platforms are viable
```

### Phase L: Detailed Strengths & Weaknesses Analysis (15 minutes)

Beyond scoring, document qualitative strengths and weaknesses:

**CMS 12 Strengths**:
- Excellent for content model complexity (inheritance, blocks, relationships)
- Team has existing .NET skills; reduces learning curve
- Deep Commerce integration (same .NET platform)
- Mature platform with extensive Optimizely ecosystem
- Strong version control and scheduling built-in
- Excellent for .NET-centric organizations

**CMS 12 Weaknesses**:
- REST API only (no GraphQL yet) limits headless modernization
- Requires .NET developers; less flexible team composition
- DXP Cloud infrastructure adds operational complexity
- Cost scaling less predictable than SaaS
- Older UI/UX compared to modern CMSs

**SaaS CMS Strengths**:
- Purpose-built for headless; Content Graph is excellent
- Fully managed SaaS (minimal operations burden)
- Predictable, all-inclusive cost model
- Modern UI/UX; better mobile editing
- Language-agnostic (works with any front-end framework)
- Flexible team requirements (.NET not required)
- Native multi-language support with variants

**SaaS CMS Weaknesses**:
- Flat content model less powerful than inheritance
- Team less experienced with this platform type
- Commerce integration requires API bridging (not native)
- Lacks integrated workflow system (requires external)
- Newer platform (less mature ecosystem)
- GraphQL requires learning new query language for some teams

### Phase M: Risk Assessment Per Platform (10 minutes)

Identify risks and mitigation for each platform choice:

```markdown
## Platform-Specific Risks

### CMS 12 Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| GraphQL availability delayed | Medium | Medium | Use REST API for headless; plan migration when available |
| Skill requirements too high | Low | High | Hire .NET architect; front-load training in planning phase |
| DXP Cloud scaling costs exceed budget | Low | High | Load test early; monitor cloud spend; consider on-premises alternative |
| Team turnover on .NET specialists | Medium | High | Document architecture; cross-train JavaScript team on APIs |
| Commerce integration complexity | Low | Medium | Start integration early in build phase; plan 4-week spike |

### SaaS CMS Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Team resistance to new platform | Medium | Medium | Early training; migration champion; proof-of-concept |
| Content model too flat for future complexity | Low | Medium | Upfront design discipline; reference validation; early architecture review |
| Workflow/approval management external | Low | Medium | Evaluate and select workflow solution early; integrate in design phase |
| Vendor lock-in (SaaS platform) | Low | Medium | Ensure data export capability; document API contracts; avoid custom extensions |
| Commerce integration less mature | Low | Medium | Early integration spike; plan webhook architecture; thorough testing |
```

## CONTEXT BOUNDARIES

- **In scope**: Scoring both platforms, analyzing strengths/weaknesses, identifying risks
- **Out of scope**: Making the final decision (that's step-03)
- **Not your task**: Resolving all risks now; just documenting them

## YOUR TASK

1. Score CMS 12 across 10 dimensions (with rationales)
2. Score SaaS CMS across 10 dimensions (with rationales)
3. Apply weights from step-01
4. Calculate weighted scores and normalize
5. Document strengths and weaknesses of each
6. Identify platform-specific risks
7. Create comprehensive comparison table
8. Present findings with A/P/C menu

## INITIALIZATION SEQUENCE

```
1. Load step-01 requirements and weights → establish evaluation framework
2. For each dimension: assess CMS 12 → score 1-10 with rationale
3. For each dimension: assess SaaS CMS → score 1-10 with rationale
4. Apply weights → calculate weighted scores
5. Normalize scores → percent fit
6. Document strengths/weaknesses per platform → qualitative assessment
7. Identify platform-specific risks → document mitigations
8. Create comparison table → present findings
9. Present with A/P/C menu → move to step-03
```

## SUCCESS METRICS

At the end of this step, you should have:

- [x] Both platforms scored across all 10 dimensions
- [x] Scoring rationales documented
- [x] Weighted scores calculated per dimension
- [x] Total weighted score calculated and normalized
- [x] Comparison table complete and readable
- [x] Strengths and weaknesses documented per platform
- [x] Platform-specific risks identified with mitigations
- [x] Qualitative assessment balances numeric scoring
- [x] Findings presented clearly
- [x] Ready for step-03 (recommendation and roadmap)

## FAILURE MODES

| Failure | Signal | Recovery |
|---------|--------|----------|
| Scores wildly favor one platform | All dimensions > 8 for one platform | Review scoring; ensure objective assessment; challenge assumptions |
| Scores are identical | Both platforms same total | Likely requirements not distinctive enough; revisit priorities |
| Team disagrees with scoring | Stakeholders push back | Review rationales; conduct collaborative scoring session |
| Scoring doesn't match intuition | Numeric suggests platform A, but team prefers B | Document the gap; include qualitative reasoning in step-03 |
| Risks underestimated | Major risk category missing | Conduct risk brainstorm; add missing categories |

## PRESENTATION (A/P/C Menu)

Once evaluation complete, present:

> **Platform Evaluation Complete**
>
> I've scored both Optimizely platforms across 10 dimensions, weighted against your specific requirements.
>
> **Scoring Summary**:
> - **CMS 12**: 77% fit (646/84 weighted points)
> - **SaaS CMS**: 73% fit (612/84 weighted points)
>
> **Key Findings**:
> - CMS 12 stronger in: Team skills fit, Content model, Integration complexity
> - SaaS CMS stronger in: API capabilities, Deployment model, Cost predictability
> - Both platforms are viable; difference is 4 percentage points
>
> **Dimension Breakdown**:
> - Must-Have (Critical): Both strong on most critical dimensions
> - Should-Have (Preferred): CMS 12 leads slightly
>
> **Risks Identified**:
> - CMS 12: GraphQL delay, skill requirements, cost scaling
> - SaaS CMS: Team resistance, workflow complexity, vendor lock-in
>
> **Next**: Step-03 will synthesize this data into a final recommendation, considering strategic fit beyond scoring.
>
> **What would you like to do?**
>
> - **[C]ontinue** → Move to step-03 (Final Recommendation)
> - **[A]dvanced** → Deep dive into specific dimension or risk
> - **[P]arty Mode** → Evaluation done! Time to decide! 🎉

## NEXT STEP

Once step-02 is complete:
- Move to **step-03-recommend.md**
- Synthesize scores and qualitative assessment
- Make final platform recommendation with rationale
- Outline implementation roadmap
- Present recommendation for stakeholder decision

---

**Step 2 Status**: [PENDING → IN PROGRESS → COMPLETE]

Update frontmatter `status: complete` and `stepsCompleted: 2` when done.
