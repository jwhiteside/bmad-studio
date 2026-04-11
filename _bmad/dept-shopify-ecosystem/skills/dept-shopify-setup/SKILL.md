---
canonicalId: dept-shopify-setup
name: "Shopify Ecosystem Project Setup & Configuration"
description: "Guided setup framework for new Shopify ecosystem projects including context gathering, stack pattern recommendation, and initial configuration."
domain: shopify-ecosystem
category: strategy
---

# Shopify Ecosystem Project Setup & Configuration

**Entry Point**: `dept-shopify-setup`

Guided framework for establishing a new Shopify ecosystem project. Walks through context gathering, stack pattern selection, platform recommendation, integration sequencing, and project kickoff.

## What This Skill Does

Provides:
- Structured project discovery process
- Stack pattern matching based on business profile
- Platform selection confirmation
- Integration sequencing and phasing
- Reference material setup and documentation
- Project governance and team structure
- Success metrics definition

## When To Use It

- Starting new Shopify project
- Evaluating whether to migrate to Shopify
- Planning multi-year tech roadmap
- Onboarding new team to Shopify ecosystem
- Kickoff meeting preparation

## Inputs

High-level business profile (revenue, geography, team), strategic priorities, constraints (budget, timeline, technical debt).

---

## 1. Project Discovery Phase (Week 1-2)

### 1.1 Business Context

**Gather information about**:

```
Revenue & Scale:
  ├─ Current annual revenue (€)
  ├─ Projected revenue 12-month (€) and 36-month (€)
  ├─ Current order volume (orders/month)
  ├─ Projected order volume growth (%)
  ├─ Average order value (€)
  ├─ Customer acquisition cost (€)
  ├─ Customer lifetime value (€)
  └─ Gross margin (%)

Geography & Markets:
  ├─ Primary market(s) (country/region)
  ├─ International presence (% of revenue)
  ├─ Target expansion markets (next 12-36 months)
  ├─ Tax/compliance complexity (VAT, tariffs, local payment methods)
  └─ Currency strategy (single vs multi-currency)

Product Portfolio:
  ├─ Number of unique products (SKU count)
  ├─ Product categories (number of top-level categories)
  ├─ Variants per product (average and range)
  ├─ Physical vs digital products
  ├─ Inventory management complexity
  ├─ Asset needs (video, 360 views, multi-language)
  ├─ Seasonal/promotional patterns
  └─ Data quality issues (gaps, inconsistencies)

Customer Profile:
  ├─ Customer acquisition channel(s) (paid search, email, social, direct)
  ├─ Repeat purchase rate (%)
  ├─ Subscription vs one-time revenue split
  ├─ Customer support volume (tickets/month)
  ├─ Return rate (%)
  └─ NPS or customer satisfaction score

Organizational:
  ├─ Commerce team size (product, marketing, ops, tech)
  ├─ Engineering capacity (headcount, specialization)
  ├─ Budget approval process and constraints
  ├─ Timeline pressure (go-live date if exists)
  ├─ Risk tolerance (conservative vs aggressive)
  ├─ Preferred vendor type (enterprise, startup, open-source)
  └─ Existing tech debt (legacy systems, integrations to replace)
```

### 1.2 Strategic Priorities

**Rank importance (1-5 scale, 5 = critical)**:

```
Business Goals:
  ├─ Revenue growth: [1-5]
  ├─ Market expansion: [1-5]
  ├─ Customer retention: [1-5]
  ├─ Operational efficiency: [1-5]
  ├─ Data-driven decision making: [1-5]
  └─ Brand differentiation: [1-5]

Technology Goals:
  ├─ Multi-channel sales (marketplace, B2B, wholesale): [1-5]
  ├─ Composable/headless architecture: [1-5]
  ├─ Real-time personalization: [1-5]
  ├─ Advanced analytics/BI: [1-5]
  ├─ Mobile-first experience: [1-5]
  └─ API-first integration approach: [1-5]

Marketing Goals:
  ├─ Email marketing sophistication: [1-5]
  ├─ SMS/mobile messaging: [1-5]
  ├─ Customer loyalty program: [1-5]
  ├─ User-generated content/reviews: [1-5]
  ├─ Personalized product recommendations: [1-5]
  └─ Unified marketing platform: [1-5]
```

### 1.3 Constraints & Assumptions

**Document**:

```
Budget Constraints:
  ├─ Total capex approved (€)
  ├─ Annual opex budget (€)
  ├─ Timing (lump sum upfront vs phased)
  └─ No-go thresholds (cost ceiling)

Timeline Constraints:
  ├─ Go-live target date (if any)
  ├─ Phasing preference (big-bang vs iterative)
  ├─ Team availability (can we dedicate people?)
  └─ Critical milestones (holidays, fiscal year, campaigns)

Technical Constraints:
  ├─ Existing Shopify installation (migrating from other platform?)
  ├─ Legacy systems to integrate (inventory, ERP, accounting)
  ├─ Internal development capacity (use internal vs partner)
  ├─ Infrastructure preferences (cloud, on-premise, hybrid)
  ├─ Data residency/compliance (GDPR, CCPA, local laws)
  └─ Performance requirements (uptime SLA, latency)

Organizational Constraints:
  ├─ Preferred vendor ecosystem (focus on specific vendors?)
  ├─ Team expertise (what platforms already know-how exists?)
  ├─ Change management capability (how well does org adopt new tools?)
  ├─ Decision-making process (consensus vs top-down?)
  └─ Competing initiatives (other projects that may delay or conflict?)
```

---

## 2. Stack Pattern Recommendation Phase (Week 2-3)

### 2.1 Matching Business Profile to Stack Patterns

**Use the complexity scoring from dept-shopify-pim-strategy and cost analysis from dept-shopify-cost-analysis to match to one of six patterns**:

#### Pattern Match: Starter Plus

**Best for**: Early-stage D2C, €500K-2M revenue, simple products

**Recommendation triggers**:
- Revenue < €2M
- Product count < 500
- Single geography (no international)
- Email primary marketing channel
- Budget < €30K/year
- Team < 5 people

**Platforms**:
- Shopify Plus
- Klaviyo (email)
- Yotpo (reviews + loyalty)
- Native Shopify search

**Year 1 Cost**: €50-70K

---

#### Pattern Match: Content-Rich Brand

**Best for**: Magazine-style commerce, brand-driven, 2-10M revenue

**Recommendation triggers**:
- Revenue €2-10M
- Product count 500-5K
- Content and education critical to purchase
- Blog, guides, video important
- Personalization ROI high (luxury, high AOV)
- Team 10-15 people

**Platforms**:
- Shopify Plus
- Contentstack (CMS)
- Klaviyo (email)
- Nosto (personalization)
- Yotpo (reviews)

**Year 1 Cost**: €120-180K

---

#### Pattern Match: Global Enterprise

**Best for**: Multi-market, 10+ countries, 50M+ revenue

**Recommendation triggers**:
- Revenue > €20M
- International > 30% of sales
- Product count 5K-20K
- Strict data governance needed
- Support team needed
- Multi-channel requirements
- Team 25+ people

**Platforms**:
- Shopify Plus
- Akeneo (PIM)
- Global-e (cross-border)
- Klaviyo (email)
- Bloomreach (search + personalization)
- Gorgias (support)
- Yotpo (reviews)

**Year 1 Cost**: €600K-1M

---

#### Pattern Match: Subscription-First

**Best for**: DTC subscription, recurring revenue model, 1-5M revenue

**Recommendation triggers**:
- Subscription > 30% of revenue
- LTV important optimization metric
- Retention/churn critical KPIs
- Recurring shipments or digital subscriptions
- Premium brand positioning
- Team 8-12 people

**Platforms**:
- Shopify Plus
- Recharge (subscriptions)
- Klaviyo (email + retention)
- Yotpo (reviews + loyalty)
- Attentive (SMS for engagement)

**Year 1 Cost**: €150-250K

---

#### Pattern Match: D2C Growth Brand

**Best for**: Scaling DTC, email + SMS both critical, 3-10M revenue

**Recommendation triggers**:
- Revenue €3-10M, growing 50%+ YoY
- Email + SMS each > 10% of revenue
- Conversion optimization critical (AOV growth)
- Personalization ROI clear (proven via experiments)
- Influencer/affiliate channels
- Team 12-15 people

**Platforms**:
- Shopify Plus
- Klaviyo (email)
- Attentive (SMS primary)
- Nosto (personalization)
- Yotpo (reviews + UGC)
- Rebuy (post-purchase upsells)

**Year 1 Cost**: €200-350K

---

#### Pattern Match: Headless Commerce

**Best for**: Custom storefront, technical team, 10M+ revenue, high performance need

**Recommendation triggers**:
- Revenue > €10M
- Custom storefront needed (Shopify default insufficient)
- High performance critical (mobile speed important)
- Complex user interactions (filtering, real-time data)
- Engineering team 10+ people
- Budget for custom development

**Platforms**:
- Shopify Plus (Admin API only, no storefront)
- Contentstack (CMS)
- Custom frontend (Next.js, React, etc.)
- Bloomreach (search)
- Klaviyo (email)

**Year 1 Cost**: €500K-1M

---

### 2.2 Stack Pattern Recommendation Template

```
RECOMMENDATION: [Pattern Name]
Confidence Level: [High/Medium/Low]

Matching Factors:
  ├─ Revenue scale: €[X]M → [Pattern Name] recommended
  ├─ Product complexity: [SKU count] → PIM [needed/not needed]
  ├─ Geography: [Single/Multi-country] → [Global-e needed/not needed]
  ├─ Team maturity: [Size/skills] → [Pattern matches expertise]
  └─ Budget: €[X]K available → [Pattern is within budget]

Alternative Patterns Considered:
  ├─ [Pattern A]: Why not selected (too expensive/too simple)
  ├─ [Pattern B]: Why not selected (doesn't match maturity)
  └─ [Pattern C]: Why not selected (timeline doesn't fit)

Risks & Mitigations:
  ├─ Risk: [Team capacity too small]
    └─ Mitigation: [Hire contractor, use agency]
  ├─ Risk: [Budget uncertainty]
    └─ Mitigation: [Phase implementation, delay non-critical platforms]
  └─ Risk: [Technology debt]
    └─ Mitigation: [Address in parallel workstream]

Recommended Timeline:
  ├─ Month 1-2: Phase [A] (core platforms)
  ├─ Month 3-4: Phase [B] (supporting)
  └─ Month 5-6: Phase [C] (nice-to-have)

Next Steps:
  ├─ Platform selection confirmation meeting
  ├─ Detailed cost estimation
  ├─ Vendor RFP/demo process
  ├─ Team structure planning
  └─ Project charter and governance
```

---

## 3. Platform Selection Confirmation (Week 3-4)

### 3.1 Decision Matrix

**For each critical platform category, create decision matrix**:

```
Email Platform Decision:

Criteria (weight)        | Klaviyo | Mailchimp | Custom
─────────────────────────┼─────────┼───────────┼────────
Feature sophistication   | 5 (35%) | 2 (35%)   | 5 (35%)
Shopify integration      | 5 (20%) | 3 (20%)   | 3 (20%)
Cost at 10K contacts     | 3 (20%) | 5 (20%)   | 3 (20%)
Team expertise           | 3 (15%) | 5 (15%)   | 2 (15%)
Speed to value           | 4 (10%) | 5 (10%)   | 2 (10%)
─────────────────────────┴─────────┴───────────┴────────
Weighted Score:          | 4.1     | 3.5       | 3.2
─────────────────────────┴─────────┴───────────┴────────
Recommendation:          KLAVIYO (best match)
```

### 3.2 Vendor Selection Checklist

**For each selected platform, confirm**:

```
Platform: [Name]

Evaluation:
  ├─ Feature checklist: [All required features present? Y/N]
  ├─ Shopify integration: [Native app? API? Custom? Reviewed docs? Y/N]
  ├─ Scalability: [Handles projected volume? Y/N]
  ├─ Pricing: [Reviewed model? Negotiated discount attempted? Y/N]
  ├─ References: [Talked to 2-3 existing customers? Y/N]
  ├─ Support: [SLA reviewed? Support tier confirmed? Y/N]
  └─ Contract: [Legal reviewed? Data privacy clauses OK? Y/N]

Integration Feasibility:
  ├─ API documentation reviewed: Y/N
  ├─ Authentication method (OAuth, API key) acceptable: Y/N
  ├─ Webhook capability (if needed) present: Y/N
  ├─ Rate limits (if any) acceptable: Y/N
  ├─ Sample payloads obtained and reviewed: Y/N
  └─ Integration dev time estimated: [X hours]

Approval:
  ├─ Product lead signed off: Y/N
  ├─ Engineering signed off: Y/N
  ├─ Finance approved cost: Y/N
  └─ Executive sponsor approved: Y/N

Red Flags:
  ├─ [Any concerns found? List them]
  └─ [Mitigations for each?]
```

---

## 4. Integration Sequencing (Week 4)

### 4.1 Critical Path Analysis

**Identify platforms with dependencies**:

```
Graph of Integration Dependencies:

Shopify (must be first)
  ├─ Klaviyo (email) ← depends on: Shopify customer + order data
  │  ├─ Attentive (SMS) ← depends on: Customer data from Shopify/Klaviyo
  │  └─ Rebuy (post-purchase) ← depends on: Order webhook from Shopify
  │
  ├─ Akeneo (PIM) ← depends on: Shopify product schema design
  │  ├─ Bloomreach (search) ← depends on: Products in Shopify
  │  └─ Nosto (personalization) ← depends on: Products in Shopify
  │
  ├─ Yotpo (reviews) ← depends on: Orders in Shopify
  │
  ├─ Gorgias (support) ← depends on: Customers + orders in Shopify
  │
  ├─ Recharge (subscriptions) ← depends on: Shopify product setup complete
  │
  └─ Global-e (cross-border) ← depends on: Shopify inventory + orders

Critical path: Shopify → PIM → Shopify products → downstream
```

### 4.2 Recommended Sequencing

**Phase 1 (Weeks 1-6): Core Commerce**
```
├─ Shopify Plus provisioning
├─ Product data setup (manual or import)
├─ Customer data import (from legacy system or manual)
├─ Order fulfillment workflow configured
├─ Payment gateway tested
└─ Go-live: Core commerce operational
```

**Phase 2 (Weeks 7-12): Email Marketing**
```
├─ Klaviyo instance configured
├─ Customer sync from Shopify automated
├─ Order event webhooks firing
├─ Welcome email sequence live
├─ Abandoned cart campaign live
└─ Measurement: Email revenue baseline established
```

**Phase 3 (Weeks 13-18): Product Data & Search**
```
├─ PIM (Akeneo/Bluestone) instance configured
├─ Product data migrated to PIM (if new)
├─ PIM → Shopify sync automated
├─ Bloomreach/Nosto product feed imported
├─ Search index built
└─ Measurement: Search conversion lift tracked
```

**Phase 4 (Weeks 19-24): SMS & SMS Channels**
```
├─ Attentive SMS configured
├─ SMS list built (customer opt-ins)
├─ SMS campaigns (recovery, VIP, SMS-exclusive)
├─ Attentive ↔ Klaviyo coordination
└─ Measurement: SMS revenue and engagement tracked
```

**Phase 5 (Weeks 25-30): Support & Reviews**
```
├─ Gorgias instance configured
├─ Support channels integrated (email, chat, Shopify)
├─ Yotpo instance configured
├─ Review request email/SMS workflow
├─ Review display on product pages
└─ Measurement: NPS and review rate tracked
```

**Phase 6 (Weeks 31-36): Advanced Features**
```
├─ Recharge subscriptions (if needed)
├─ Loyalty program (Yotpo)
├─ Global-e cross-border (if international)
├─ Custom analytics (data warehouse)
└─ Optimization ongoing
```

**Parallel Workstreams**:
```
├─ Data warehouse setup (can happen in parallel)
├─ Analytics & reporting (build dashboards as data available)
├─ Training & documentation (ongoing)
└─ Team hiring (as needs identified)
```

---

## 5. Reference Material Configuration

### 5.1 Repository Setup

**Create skill references**:

```
//Users/jwhiteside/Code/bmad-studio/skills/
├─ dept-shopify-reference/
├─ dept-shopify-pim-strategy/
├─ dept-shopify-integration-patterns/
├─ dept-shopify-marketing-stack/
├─ dept-shopify-data-flows/
├─ dept-shopify-cost-analysis/
└─ [platform-specific skills]/
   ├─ akeneo/
   ├─ klaviyo/
   ├─ gorgias/
   ├─ recharge/
   └─ ... (one per platform)
```

### 5.2 Documentation Structure

**Create project documentation**:

```
//Users/jwhiteside/Code/bmad-studio/docs/
├─ PROJECT_CHARTER.md
│  ├─ Vision, scope, constraints
│  ├─ Success metrics
│  ├─ Team & roles
│  └─ Governance
│
├─ ARCHITECTURE.md
│  ├─ System architecture diagram
│  ├─ Data flows
│  ├─ Integration patterns
│  └─ Technology stack rationale
│
├─ IMPLEMENTATION_PLAN.md
│  ├─ Phase breakdown
│  ├─ Timeline (Gantt chart)
│  ├─ Resource allocation
│  ├─ Risk register
│  └─ Success criteria per phase
│
├─ DATA_MODEL.md
│  ├─ Product data model
│  ├─ Customer data model
│  ├─ Order data model
│  ├─ Platform-specific mappings
│  └─ Data quality rules
│
├─ OPERATIONS_RUNBOOK.md
│  ├─ Daily operations checklist
│  ├─ Weekly reviews
│  ├─ Monthly metrics review
│  ├─ Escalation procedures
│  └─ Disaster recovery
│
├─ PLATFORM_CONFIGS/
│  ├─ shopify.yml
│  ├─ klaviyo.yml
│  ├─ akeneo.yml (if PIM used)
│  ├─ integration-webhooks.yml
│  └─ ... (per platform)
│
└─ VENDOR_CONTACTS.md
   ├─ Primary contact per vendor
   ├─ Support plan details
   ├─ Escalation paths
   ├─ Renewal dates
   └─ Contract terms
```

---

## 6. Project Governance & Team Structure

### 6.1 Steering Committee

```
Role: Oversee project, remove blockers, drive decisions

Typical Members:
├─ CFO or Finance Director (budget authority)
├─ CMO or Head of Marketing (marketing priorities)
├─ COO or VP Operations (execution lead)
├─ CTO or Engineering Lead (technical feasibility)
└─ CEO or Board Sponsor (executive champion)

Cadence: Monthly steering meetings

Responsibilities:
├─ Approve budget releases per phase
├─ Unblock org/vendor issues
├─ Review phase gates and go/no-go decisions
└─ Escalate risks
```

### 6.2 Project Team Structure

```
Project Manager (1 FTE)
├─ Owns timeline, deliverables, risks
├─ Manages vendor relationships
└─ Runs weekly standups

Technical Lead (1 FTE)
├─ Owns integration architecture
├─ Manages API integration work
├─ Reviews code/configuration
└─ Troubleshoots integration issues

Product Manager (0.5-1 FTE)
├─ Defines data models
├─ Platform configuration priorities
├─ Test case design
└─ Go-live readiness

Operations Lead (0.5 FTE)
├─ Data migration planning
├─ Quality assurance
├─ Runbook documentation
└─ Vendor onboarding

Engineers (1-3 FTE, depending on pattern)
├─ Custom integration development
├─ Data pipeline building
├─ Infrastructure setup
└─ Testing and troubleshooting

External Resources (as needed):
├─ Agency partners (if needed for dev work)
├─ Vendor implementation specialists
└─ Specialized consultants (PIM, analytics, etc.)
```

### 6.3 Governance Cadence

```
Daily:
├─ Standups (15 min, team)
├─ Slack updates (async)
└─ Escalation alerts (real-time)

Weekly:
├─ Project sync (1 hour, full team)
├─ Vendor check-ins (30 min each, as needed)
├─ Integration status review (30 min)
└─ Risk review and mitigation planning

Monthly:
├─ Steering committee meeting (1 hour)
├─ Phase gate review (2 hours)
├─ Metrics & health dashboard review
└─ Budget reconciliation

Quarterly:
├─ Executive stakeholder reviews
├─ Roadmap adjustment (if needed)
└─ Retrospective & lessons learned
```

---

## 7. Success Metrics Definition

### 7.1 Business Metrics

**Define targets before launch**:

```
Commerce:
├─ Revenue growth: [X]% YoY (vs baseline)
├─ AOV: €[X] (vs current €[Y])
├─ Conversion rate: [X]% (vs current [Y]%)
├─ Cart abandonment rate: [X]% (vs current [Y]%)
└─ Customer acquisition cost: €[X] (vs current €[Y])

Customer:
├─ Email engagement (open rate): [X]% (vs [Y]%)
├─ Email revenue attribution: [X]% of revenue
├─ SMS engagement (click rate): [X]% (vs [Y]%)
├─ Customer retention (repeat purchase rate): [X]% (vs [Y]%)
├─ Customer satisfaction (NPS): [X] (vs [Y])
└─ Support resolution time: [X] hours (vs [Y])

Operational:
├─ Order fulfillment time: [X] hours (vs [Y])
├─ Data accuracy (product data): [X]% (target 99%+)
├─ Integration sync success rate: [X]% (target 99.9%+)
├─ System uptime: [X]% (target 99.9%+)
└─ Time to market for new products: [X] days
```

### 7.2 Project Metrics

**Track implementation health**:

```
Per Phase:
├─ % of planned deliverables on time
├─ % of planned deliverables passing QA first time
├─ Critical bugs found and fixed before go-live
├─ Team capacity allocation (vs plan)
├─ Vendor SLA adherence
└─ Budget variance (actual vs projected)

Overall:
├─ Project completion date (vs target)
├─ Final cost (vs approved budget)
├─ Data migration accuracy (% of records successfully migrated)
├─ Integration reliability (uptime during pilot, ramp-up)
└─ Team readiness (% of team trained and certified)
```

---

## 8. Project Kickoff Checklist

Before declaring kickoff:

- [ ] Executive sponsor identified and committed (10+ hours/month)
- [ ] Steering committee confirmed (meet monthly)
- [ ] Project manager assigned (100% FTE)
- [ ] Budget approved and allocated
- [ ] Vendor contracts signed (all platforms)
- [ ] Team structure finalized
- [ ] Roles and responsibilities documented
- [ ] Communication cadence established
- [ ] Risk register created (top 10 risks identified)
- [ ] Success metrics defined and baseline measured
- [ ] Data governance policy established
- [ ] Compliance & security review passed (GDPR, PCI, etc.)
- [ ] Architecture design reviewed and approved
- [ ] Implementation plan approved (timeline realistic)
- [ ] Vendor support plans activated
- [ ] Kickoff meeting held with full stakeholders
- [ ] First phase deliverables clearly scoped
