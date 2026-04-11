---
step: 1
name: Requirements Discovery
workflow: dept-opti-platform-assessment
status: pending
---

# Step 1: Requirements Discovery

## MANDATORY EXECUTION RULES

1. **Requirements gathering is comprehensive**:
   - Business drivers and goals
   - Technical constraints and architecture
   - Team capabilities and budget
   - Timeline and go-live date
   - Integration points (Commerce, CRM, Analytics, etc.)
   - Compliance requirements (GDPR, HIPAA, etc.)

2. **Weighted prioritization required**:
   - Not all requirements are equally important
   - Must-have vs nice-to-have distinction
   - Weights guide platform evaluation
   - Ambiguous requirements must be clarified

3. **Current state inventory**:
   - Technology stack (backend, frontend, hosting)
   - Team composition and skills
   - Development velocity and capacity
   - Current CMS or content management approach
   - Existing integrations to preserve or migrate

4. **Assessment document must be created** before proceeding to step-02

## EXECUTION PROTOCOLS

### Phase A: Business Requirements (20 minutes)

**Ask the user**:

> Let me understand your project's business requirements.
>
> **1. Strategic Goals**
> - Why are we migrating to Optimizely? (new capabilities, consolidation, modernization, cost, performance, personalization, etc.)
> - What are the top 3 business outcomes we want to achieve?
> - What's the time-to-value? (immediate, 6 months, 12 months?)
>
> **2. Timeline & Go-Live**
> - When do we need to go live? (target date)
> - How much time do we have for planning, design, build, testing?
> - Do we need a phased rollout or big-bang migration?
>
> **3. Budget Constraints**
> - What's our software licensing budget? (annual or total project?)
> - What's our infrastructure/hosting budget?
> - What's our total budget for the platform + migration?
> - Is budget fixed or flexible?
>
> **4. Scope & Scale**
> - How many websites/brands will run on this platform?
> - How many countries/languages?
> - Estimated daily/monthly visitors?
> - Content volume (pages, assets)?
>
> **5. Success Metrics**
> - What will make this project successful?
> - How will we measure success? (time-to-market, cost savings, traffic, engagement, etc.)

Document all responses in assessment document.

### Phase B: Technical Requirements (20 minutes)

**Ask the user**:

> Now let me understand the technical requirements.
>
> **1. Current Platform & Stack**
> - What backend language(s) are you using now? (.NET, Java, Node.js, Python, PHP, etc.)
> - What frontend framework(s)? (React, Vue, Angular, ASP.NET Razor, etc.)
> - Where is it hosted? (on-premises, AWS, Azure, Google Cloud, etc.)
> - What CMS or content tool are you using currently?
>
> **2. Technical Constraints**
> - Are you required to stay on-premises or in a specific cloud?
> - Do you have existing .NET infrastructure we should leverage?
> - Do you have JavaScript/Node expertise we should build on?
> - Are there security/compliance requirements? (GDPR, HIPAA, SOC 2, etc.)
> - Do you have a specific CDN or infrastructure preference?
>
> **3. Performance & Scale**
> - What's your peak traffic (concurrent users, requests/second)?
> - What page load time targets? (e.g., < 2 seconds)
> - What's your growth projection? (2x, 10x in 3 years?)
> - What's the largest content volume you need to support?
>
> **4. Integrations Needed**
> - Do you need ecommerce/Commerce integration? (Optimizely Commerce, Shopify, custom?)
> - CRM integration? (Salesforce, HubSpot, Marketo?)
> - Analytics & personalization? (Optimizely Web Experimentation, Opal AI, custom?)
> - Third-party data/feeds? (content syndication, product feeds, etc.)
> - Email marketing integration?
> - Social media or community platforms?

Document all responses.

### Phase C: Team Capabilities (15 minutes)

**Ask the user**:

> Let me understand your team's skills and capacity.
>
> **1. Current Team**
> - How many developers? What's their primary language/expertise? (.NET, JavaScript, Python, etc.)
> - Do you have content operations/management people?
> - Do you have DevOps/infrastructure expertise?
> - Do you have a digital marketing/analytics person?
> - Total FTE available for this project over next 12 months?
>
> **2. Team Preferences & Constraints**
> - Does your team have strong .NET experience? (favors CMS 12)
> - Does your team prefer JavaScript/Node? (favors SaaS CMS)
> - Do you have in-house DevOps expertise? (can manage complex deployments)
> - Do you prefer managed services? (favors SaaS CMS)
> - Will you need to hire/train? (impacts timeline and cost)
>
> **3. Organizational Capability**
> - Do you have experience with cloud platforms? (AWS, Azure, Google Cloud)
> - Do you have agile/DevOps practices in place?
> - Do you have strong requirements/governance discipline? (impacts content model complexity)
> - What's your typical project velocity? (weeks to deliver features)
>
> **4. Support & Maintenance**
> - Will Optimizely be your managed platform or self-managed?
> - Do you prefer vendor support or bring your own partner?
> - What's your SLA expectation? (99.5%, 99.9%, 99.99%?)

Document all responses.

### Phase D: Current State Inventory (15 minutes)

**Ask the user**:

> Let me document your current state.
>
> **1. Existing Technology**
> - Current CMS or content platform (from source audit)?
> - Current ecommerce platform (if any)?
> - Current hosting/infrastructure?
> - Current CDN or delivery network?
>
> **2. Compliance & Governance**
> - Are you SOC 2, ISO 27001, HIPAA, or other certified?
> - Do you have data residency requirements? (EU, US, specific country?)
> - Do you have data privacy requirements? (GDPR, CCPA, etc.)
> - Do you have content governance/approval workflows in place?
> - Do you have translation/localization vendor relationships?
>
> **3. Critical Dependencies**
> - What systems MUST integrate with new CMS? (priority list)
> - What data flows are mission-critical?
> - What's the acceptable downtime? (zero, < 4 hours, etc.)
> - Are there regulatory/contractual constraints on data location or platform?

Document all responses.

### Phase E: Requirement Prioritization & Weighting (15 minutes)

**Help stakeholders prioritize requirements**:

Create a weighting matrix. Ask:

> **Requirement Prioritization**
>
> Not all requirements are equally important. Let's prioritize:
>
> For each of these evaluation dimensions, tell me: Must-Have, Should-Have, or Nice-to-Have?
>
> **Evaluation Dimensions**:
> 1. **Content Model Flexibility** - Can the platform adapt to complex content structures?
> 2. **Authoring Experience** - How intuitive and powerful is the editor for content teams?
> 3. **API Capabilities** - Can we build headless/omnichannel experiences?
> 4. **Deployment Model** - Do we prefer managed cloud (SaaS) or self-managed (.NET)?
> 5. **Cost Model** - What cost structure fits our budget best?
> 6. **Team Skills** - What skills does our team already have?
> 7. **Integration Complexity** - How many third-party systems need to integrate?
> 8. **Multi-Site & Multi-Language** - Do we need complex multi-region/multi-language support?
> 9. **Security & Compliance** - What certifications/requirements do we need?
> 10. **Performance & Scaling** - What's our scale and performance requirement?

Document prioritization:

```markdown
## Requirement Prioritization

| Dimension | Priority | Weight | Rationale |
|---|---|---|---|
| **Content Model Flexibility** | Must-Have | 10 | Complex product pages with variants |
| **Authoring Experience** | Should-Have | 7 | Content team is non-technical |
| **API Capabilities** | Must-Have | 10 | Headless delivery to mobile app + website |
| **Deployment Model** | Should-Have | 6 | Prefer managed cloud (reduce ops burden) |
| **Cost Model** | Should-Have | 8 | Fixed annual budget; predictability important |
| **Team Skills** | Must-Have | 9 | Have 2 .NET devs, 0 dedicated .NET architects |
| **Integration Complexity** | Must-Have | 9 | Must integrate Commerce, Salesforce, Analytics |
| **Multi-Site & Multi-Language** | Should-Have | 7 | 3 brands, 5 languages (partial coverage) |
| **Security & Compliance** | Must-Have | 10 | HIPAA required for healthcare content |
| **Performance & Scaling** | Should-Have | 8 | 100K concurrent users peak; < 2sec page load |

**Total Weight**: 84 (normalized to 100 in step-02 evaluation)

**Key Constraints**:
- MUST support Commerce integration
- MUST run on .NET/Azure (existing infrastructure)
- MUST handle healthcare/HIPAA content
- SHOULD be live by Q3 2026
```

### Phase F: Integration Inventory (10 minutes)

**Ask the user**:

> **Integrations Inventory**
>
> Tell me about integrations that MUST work with the new CMS:
>
> 1. **eCommerce** - Do we need Optimizely Commerce, Shopify, SAP, custom?
> 2. **CRM** - Salesforce, HubSpot, Marketo, Dynamics?
> 3. **Analytics** - Optimizely Web Experimentation, Google Analytics, Adobe, custom?
> 4. **DAM** - Bynder, Widen, Mediabank, built-in?
> 5. **Translation** - Phrase, SDL, Transifex, manual?
> 6. **Email** - Optimizely Campaign, Eloqua, Klaviyo, mailchimp?
> 7. **External data** - Product feeds, syndication, API sources?
> 8. **Custom systems** - Internal tools, legacy systems, proprietary?

Document integration requirements:

```markdown
## Integration Requirements

| System | Type | Must-Have | Integration Pattern | Priority |
|---|---|---|---|---|
| Optimizely Commerce | eCommerce | Yes | Deep (.NET native) | Critical |
| Salesforce | CRM | Yes | API/webhook | Critical |
| Google Analytics 4 | Analytics | Yes | JavaScript tracking | Medium |
| Bynder | DAM | Yes | API integration | Medium |
| Phrase | Translation | Yes | Webhook-based workflow | Medium |
| Klaviyo | Email | No | Basic webhook | Low |
| SAP | ERP (inventory) | No | Nightly feed sync | Low |
| Okta | SSO | Yes | SAML integration | Critical |
```

### Phase G: Assessment Document Initialization (10 minutes)

Create the assessment document:

```markdown
---
project: [project name]
status: in-progress
stepsCompleted: 1
date_created: [today]
last_updated: [today]
sourcePlatform: [from audit]
currentStack: [.NET, React, Azure]
teamSkills: [.NET, JavaScript, SQL Server]
timeline: [target go-live date]
budget: [range if known]
decisionOwner: [name/role]
---

# Platform Assessment: CMS 12 vs SaaS CMS

**Project**: [project name]
**Assessment Date**: [today]
**Decision Owner**: [name/role]
**Target Go-Live**: [date]

## Executive Summary

This assessment evaluates Optimizely CMS 12 (PaaS, .NET) vs SaaS CMS (API-first, headless) against specific project requirements.

Based on comprehensive evaluation across 10 dimensions, the recommendation will be [TBD - to be completed in step-03].

---

## Section 1: Project Requirements (COMPLETED IN STEP 1)

### Business Goals

[Document from Phase A]

### Technical Requirements

[Document from Phase B]

### Team Capabilities

[Document from Phase C]

### Current State Inventory

[Document from Phase D]

### Requirement Weighting

[Document from Phase E]

### Integration Requirements

[Document from Phase F]

---

## Section 2: Platform Evaluation

*To be completed in step-02*

## Section 3: Recommendation & Roadmap

*To be completed in step-03*

---

**Next Step**: Platform Evaluation (step-02)
```

Save and share this document with stakeholders.

## CONTEXT BOUNDARIES

- **In scope**: Gathering requirements, understanding current state, prioritizing dimensions
- **Out of scope**: Evaluating platforms (that's step-02)
- **Not your task**: Making the platform decision yet

## YOUR TASK

1. Gather business requirements (goals, timeline, budget)
2. Understand technical requirements and constraints
3. Assess team capabilities and skills
4. Document current state and integrations
5. Prioritize and weight evaluation dimensions
6. Create and share assessment document
7. Confirm step-01 complete and move to step-02

## INITIALIZATION SEQUENCE

```
1. Ask business requirements → document responses
2. Ask technical requirements → document responses
3. Ask team capabilities → document responses
4. Document current state inventory → complete picture
5. Prioritize dimensions and weight → establish evaluation framework
6. Document integration requirements → understand dependencies
7. Create assessment document → share with stakeholders
8. Confirm step-01 complete → ready for step-02
```

## SUCCESS METRICS

At the end of this step, you should have:

- [x] Business goals and timeline documented
- [x] Technical requirements and constraints understood
- [x] Team capabilities and skills inventoried
- [x] Current technology stack documented
- [x] Compliance and governance requirements identified
- [x] Integration requirements listed and prioritized
- [x] Evaluation dimensions weighted (must-have vs should-have)
- [x] Assessment document created with frontmatter
- [x] Document shared with stakeholders
- [x] Step count incremented to 1
- [x] Next step is clearly step-02 (Platform Evaluation)

## FAILURE MODES

| Failure | Signal | Recovery |
|---------|--------|----------|
| Requirements conflicting | Different stakeholders want opposite things | Schedule alignment workshop; use weighted voting |
| Team skills misunderstood | Documentation doesn't match reality | Conduct skills inventory/assessment; review team composition |
| Timeline unrealistic | Requirements too large for timeline | Prioritize; consider phased rollout; adjust scope |
| Budget insufficient | No platform fits budget | Revisit scope, timeline, or budget with leadership |
| Integration constraints unclear | Key dependencies unknown | Schedule technical deep-dive with integration owners |

## NEXT STEP

Once step-01 is complete:
- Move to **step-02-evaluate.md**
- Score both platforms across all dimensions
- Apply weights and calculate scores
- Output: Platform Comparison Matrix with scoring
- Input to step-03: Recommendation and roadmap

---

**Step 1 Status**: [PENDING → IN PROGRESS → COMPLETE]

Update frontmatter `status: complete` and `stepsCompleted: 1` when done.
