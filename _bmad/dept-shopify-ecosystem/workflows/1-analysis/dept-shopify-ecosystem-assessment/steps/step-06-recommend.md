# Step 6: Recommendations & Assessment Report

## Objective

Synthesize all analysis from previous steps into a comprehensive ecosystem assessment report with clear, prioritized recommendations and action plan.

## Instructions

Create a structured assessment report following the outline below. The report should be suitable for executive review and implementation planning.

### Report Structure

#### Executive Summary (½ page)

- Current business stage and key characteristics (revenue, scale, stage)
- Current ecosystem assessment (if applicable): health score (1-10), key pain points
- Recommended pattern and primary rationale (1-2 sentences)
- Key recommendations (top 3 bullet points)
- Expected outcomes of recommendations (business impact)

#### Section 1: Business Profile Analysis (1 page)

- Current revenue and growth trajectory
- Product portfolio characteristics (SKU count, complexity, variants)
- Sales channels and revenue distribution
- Geographic scope and localization requirements
- Organizational structure and technical capability
- Key business priorities and strategic initiatives

#### Section 2: Current State Assessment (1 page, if applicable)

- Platform inventory summary table (platform, role, tenure, satisfaction 1-5)
- Integration map visualization or description
- Data flow overview
- Integration health assessment (% of integrations rated "healthy")
- Identified integration debt items (count and severity)

#### Section 3: Anti-Pattern Analysis (1 page, if applicable)

Summary table with severity scoring:

| Anti-Pattern | Present? | Severity (1-5) | Examples | Impact |
|---|---|---|---|---|
| Over-Tooling | Yes/No | N | Platform names | Business impact |
| Data Silos | Yes/No | N | Silo description | Business impact |
| Personalization Conflicts | Yes/No | N | Examples | Business impact |
| Integration Debt | Yes/No | N | Fragile integrations | Business impact |
| Conflicting Segmentation | Yes/No | N | Segment conflicts | Business impact |
| Unmanaged Proliferation | Yes/No | N | Governance gaps | Business impact |

**Anti-Pattern Health Score** = 30 - (sum of severity scores)
- 25-30: Healthy
- 18-24: Requires attention
- <18: Critical issues

#### Section 4: Pattern Recommendation (½ page)

- Recommended pattern: [Starter Plus | Content-Rich | Global Enterprise | Subscription-First | D2C Growth | Headless Commerce]
- Primary fit rationale (2-3 sentences explaining why this pattern matches business)
- Secondary patterns to consider (if any)
- Expected pattern evolution (how will pattern change in 3-5 years as business grows)

#### Section 5: Target Ecosystem Architecture (1 page)

List all platforms in recommended target pattern, organized by category:

**Core Platform**:
- [Platform name]: [Role in ecosystem]

**Product Management**:
- [Platform name]: [Role in ecosystem]

**Customer Data**:
- [Platform name]: [Role in ecosystem]

**Marketing & Engagement**:
- [Platform name]: [Role in ecosystem]

**Operations & Fulfillment**:
- [Platform name]: [Role in ecosystem]

**Data & Integration**:
- [Platform name]: [Role in ecosystem]

**Analytics & Reporting**:
- [Platform name]: [Role in ecosystem]

Create a visual network diagram or ASCII diagram showing platform connections and primary data flows.

#### Section 6: Gap Analysis Summary (1 page)

Table of all gaps, prioritized:

| Gap | Category | Type (Missing/Replace/Enhance/Redundant) | Phase | Urgency | Est. Effort | Business Impact |
|---|---|---|---|---|---|---|
| Gap description | Product/Customer/Marketing/etc. | Type | 1/2/3 | High/Medium/Low | Low/Med/High | Impact description |

**Phase 1: Critical Path** (X gaps)
- Brief summary of critical items that must be done before go-live

**Phase 2: Core Build** (X gaps)
- Brief summary of important capabilities to build post-launch

**Phase 3+: Enhancement** (X gaps)
- Brief summary of optimizations and nice-to-haves

#### Section 7: Key Recommendations (2 pages)

**Recommendation 1**: [Title]
- Rationale: Why this matters
- Action: Specific steps to take
- Timeline: When to do this
- Owner: Who is responsible
- Business Impact: Expected outcome
- Success Metrics: How to measure success

[Repeat for 5-7 top recommendations, prioritized by business impact]

#### Section 8: Implementation Roadmap (½ page)

High-level timeline:

**Month 1-2: Discovery & Planning**
- Finalize platform selections
- Secure executive sponsorship and budget
- Plan detailed implementation sequence

**Month 3+: Platform Implementation**
- [Phase 1 platform implementations]
- [Phase 2 platform implementations]

**Month X: Go-Live**
- All critical path items complete
- Integration testing complete
- Team trained and ready

**Month X+: Post-Launch Optimization**
- Phase 3 enhancements
- Optimization and tuning
- Anti-pattern remediation

#### Section 9: Risks & Mitigations (½ page)

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Risk description | H/M/L | H/M/L | Mitigation strategy |

[List top 3-5 risks]

#### Section 10: Success Criteria & Metrics (½ page)

**Business Outcomes**:
- Metric 1: Target value
- Metric 2: Target value

**Technical Health**:
- Integration reliability: >99% healthy
- Data sync latency: <1 hour
- Platform uptime: >99.9%

**Organizational**:
- Team trained and proficient
- Documented runbooks and procedures
- No critical integration debt

### Report Quality Standards

- Clear, executive-readable language
- Specific examples and data points
- Justified recommendations (reasoning shown)
- No jargon without explanation
- Visual diagrams where appropriate
- Actionable next steps clear

## Inputs

- Business profile (Step 1)
- Current stack inventory and integration map (Step 2, if applicable)
- Anti-pattern assessment (Step 3, if applicable)
- Pattern matching analysis (Step 4)
- Gap analysis (Step 5)

## Outputs

- Comprehensive assessment report (markdown, 8-12 pages typical)
- Executive summary (1 page, suitable for email forwarding)
- Implementation roadmap (visual timeline)
- Risk register
- Success metrics dashboard template

## Completion Criteria

- Report signed off by Strategy Lead and Technical Architect
- Recommended pattern clearly justified
- All major gaps and recommendations documented
- Business impact of recommendations quantified where possible
- Implementation roadmap achievable and realistic
- Risks identified and mitigations proposed
- Report suitable for executive review and board presentation
- Clear next steps and owners for Phase 1 implementation
