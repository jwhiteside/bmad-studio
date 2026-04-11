---
step: 1
name: Architecture Context Discovery
workflow: dept-opti-architecture
status: pending
---

# Step 1: Architecture Context Discovery

## MANDATORY EXECUTION RULES

1. **Architectural drivers captured completely**:
   - Functional requirements (what system must do)
   - Non-functional requirements (qualities it must have)
   - Deployment constraints (cloud, environments, CI/CD)
   - Team constraints (skills, capacity, organizational structure)

2. **Context discovery is thorough**:
   - Review platform decision from step-03 of platform assessment
   - Load approved content model from content modelling workflow
   - Understand all integrations that must be designed
   - Document current state and target state

3. **ADR index planned** - Identify major decisions to be made in step-02

4. **Architecture document created** before proceeding to step-02

## EXECUTION PROTOCOLS

### Phase A: Platform & Context Review (15 minutes)

**Load platform decision** from previous workflow:
- Which platform was decided? (CMS 12 or SaaS CMS)
- What was the primary rationale?
- What risks were identified?
- What constraints emerged from platform assessment?

**Load content model** from previous workflow:
- What content types must be supported?
- What relationships between types?
- Multi-language requirements?
- Asset requirements?

**Confirm integration requirements**:
- Commerce integration (critical or secondary?)
- CRM integration?
- Analytics integration?
- DAM, email, other systems?

**Document in architecture context section**:

```markdown
## Architecture Context

### Platform Decision

**Platform**: CMS 12 (PaaS, .NET)

**Rationale** (from platform assessment):
- Existing .NET team (2 developers) provides rapid productivity
- Content model complexity (products with variants) native to PageData/BlockData
- Commerce integration is tight and proven
- Risk profile favors team skill fit over headless API modernization

**Key Constraints**:
- Must support .NET/Azure infrastructure
- Team has limited headless experience (website-first approach)
- GraphQL not yet available (REST API interim solution)

### Approved Content Model

[Import type list from content modelling]

**Types to Support**:
- Blog Post (PageData) - 8,472 published + 342 drafts
- Case Study (PageData) - 156 published
- Product (PageData with variants) - 2,341 published
- FAQ (PageData) - 203 items
- Landing Page (PageData) - 34 published + 156 drafts
- Media (Assets) - 14,293 items
- Other: Author, Category, etc.

### Integration Landscape

| System | Type | Priority | Pattern |
|---|---|---|---|
| Optimizely Commerce | eCommerce | Critical | Deep integration (same .NET) |
| Salesforce CRM | CRM | Critical | API webhooks |
| Google Analytics 4 | Analytics | Medium | JavaScript tracking |
| Azure Search | Search | Medium | Index sync from CMS |
| Bynder DAM | Asset Management | Medium | API integration |
| Phrase Translation | Localization | Medium | Webhook-based workflow |

### Current State

- Source CMS: [WordPress / Drupal / Sitecore / etc.]
- Hosting: [Current infrastructure]
- Team: 2 .NET devs, 1 DevOps, 2 content ops
- Performance baseline: [current metrics]

### Target State

- CMS: Optimizely CMS 12 (managed on DXP Cloud)
- Hosting: Azure, managed by Optimizely
- Team: Same 4 people + potential 1 architecture hire
- Performance targets: < 2 sec page load, 99.5% uptime
```

### Phase B: Architectural Drivers (20 minutes)

Identify and prioritize functional and non-functional requirements:

**Functional Drivers** (what must the system do):

```markdown
## Functional Drivers

| Driver | Requirement | Impact | Priority |
|---|---|---|---|
| **Content Types** | Support 8 primary types (pages, products, FAQs) | Architecture must include all types | Must-Have |
| **Composition** | Dynamic block composition for landing pages | ContentArea architecture | Must-Have |
| **Multilingual** | EN/FR/DE language variants | Language architecture, translation workflow | Must-Have |
| **Commerce Integration** | Products must sync to Optimizely Commerce | Integration architecture, sync patterns | Critical |
| **Search** | Site search across all content | Search indexing strategy | Must-Have |
| **Personalization** | Content personalization via Opal AI (future) | Content structure supports metadata | Should-Have |
| **Omnichannel** | Content delivery to web + mobile app | API architecture, data structures | Should-Have |
| **Versioning** | Content versioning, scheduled publishing | Publishing workflows | Must-Have |
| **Approval Workflow** | Editorial approval for sensitive content | Workflow architecture | Should-Have |
| **Compliance** | GDPR, HIPAA (healthcare content) | Security, data residency architecture | Must-Have |
```

**Non-Functional Drivers** (qualities system must have):

```markdown
## Non-Functional Drivers

| Driver | Requirement | Impact | Priority |
|---|---|---|---|
| **Performance** | Page load < 2 sec; API response < 500ms | Caching, CDN, query optimization strategy | Critical |
| **Scalability** | Handle 100K concurrent users | DXP Cloud sizing, auto-scaling | Must-Have |
| **Availability** | 99.5% uptime SLA | Deployment architecture, monitoring | Must-Have |
| **Security** | GDPR, HIPAA compliance; SOC 2 | Auth, encryption, data residency | Critical |
| **Maintainability** | Team can manage platform independently | Documentation, training, simplicity | Must-Have |
| **Developer Experience** | .NET developers can be productive quickly | Patterns, frameworks, training | Must-Have |
| **Content Team UX** | Non-technical content team can author | CMS UI, training, governance | Should-Have |
| **Cost Efficiency** | Predictable, scalable cost model | Licensing, infrastructure choices | Should-Have |
| **Time-to-Value** | Go-live in 24 weeks | Reduce complexity, phased delivery | Must-Have |
```

**Deployment Drivers** (where and how):

```markdown
## Deployment Drivers

| Driver | Requirement | Impact | Priority |
|---|---|---|---|
| **Cloud Platform** | Azure (existing infrastructure) | DXP Cloud on Azure | Must-Have |
| **Environments** | Dev, Staging, Production | Multi-environment architecture | Must-Have |
| **CI/CD** | Automated deployments | Pipeline architecture, code structure | Must-Have |
| **Disaster Recovery** | RTO: 4 hours, RPO: 1 hour | Backup, replication strategy | Must-Have |
| **Monitoring** | Observability, error tracking | Logging, APM strategy | Must-Have |
| **Compliance** | GDPR data residency (EU) | Infrastructure region, data handling | Critical |
```

**Team Drivers** (capabilities and constraints):

```markdown
## Team Drivers

| Driver | Constraint | Impact | Mitigation |
|---|---|---|---|
| **Team Composition** | 2 .NET developers, 1 DevOps, 2 content ops | Constrained resources | May need to hire .NET architect |
| **.NET Expertise** | Team is strong in .NET | Can leverage for CMS 12 | Choose patterns familiar to team |
| **Headless Experience** | Limited | Website-first approach vs omnichannel | Defer complex omnichannel to phase 2 |
| **DevOps Maturity** | Basic CI/CD, learning cloud | Needs support for DXP Cloud | Partner with Optimizely services |
| **Content Operations** | Familiar with current CMS | Will need retraining on CMS 12 | Plan 1-week training early |
```

### Phase C: ADR Index (15 minutes)

Identify major architecture decisions that will be made in step-02:

```markdown
## Architecture Decision Records (ADR) Index

**Planning Phase Decisions** (to be made in step-02):

1. **ADR-0: Platform Choice** (already decided in platform assessment)
   - Decision: Optimizely CMS 12
   - Status: Accepted
   - (Skip documenting; platform is final)

2. **ADR-1: Solution Architecture Pattern**
   - Should we build monolithic or modular solution?
   - Headless vs traditional web delivery?
   - When: Step-02, phase 1

3. **ADR-2: PageData vs BlockData Model**
   - How to structure content hierarchy (PageData) vs composition (BlockData)?
   - When: Step-02, phase 1

4. **ADR-3: Integration Architecture**
   - How do we integrate Commerce, CRM, Analytics, DAM?
   - Sync patterns: Real-time vs batch vs webhooks?
   - When: Step-02, phase 1

5. **ADR-4: Asset Management Strategy**
   - Use CMS 12 built-in DAM or external (Bynder)?
   - Image optimization and delivery strategy?
   - When: Step-02, phase 1

6. **ADR-5: Multilingual Content Architecture**
   - Language variants structure?
   - Translation workflow integration (Phrase)?
   - When: Step-02, phase 2

7. **ADR-6: Caching & CDN Strategy**
   - Dispatcher caching configuration?
   - Page output caching rules?
   - CDN provider and configuration?
   - When: Step-02, phase 2

8. **ADR-7: Search Implementation**
   - Azure Search, Elasticsearch, or built-in?
   - Index refresh pattern (real-time, scheduled)?
   - When: Step-02, phase 2

9. **ADR-8: Security & Auth Architecture**
   - Identity provider (Optimizely Identity, Azure AD, etc.)?
   - Role-based access control design?
   - Data encryption strategy?
   - When: Step-02, phase 2

10. **ADR-9: Deployment Architecture**
    - Multi-environment setup (dev, staging, prod)?
    - CI/CD pipeline (Azure DevOps, GitHub Actions)?
    - Blue-green or canary deployment?
    - When: Step-02, phase 2

11. **ADR-10: Monitoring & Observability**
    - Logging (Application Insights, ELK, etc.)?
    - Error tracking (Sentry, DataDog, etc.)?
    - Performance monitoring (New Relic, AppDynamics)?
    - When: Step-02, phase 2

12. **ADR-11: Commerce Product Sync**
    - One-way or two-way sync?
    - Source of truth (CMS or Commerce)?
    - Variant handling (separate pages or properties)?
    - When: Step-02, phase 1

**Additional Decisions** (as needed in step-02):
- Personalization architecture (Opal AI, visitor targeting)
- Email integration and marketing automation
- Social media integration and syndication
- Analytics and reporting strategy
- Content governance and approval workflows
```

### Phase D: Architecture Document Initialization (10 minutes)

Create architecture document:

```markdown
---
project: [project name]
status: in-progress
stepsCompleted: 1
date_created: [today]
last_updated: [today]
platform: CMS 12
contentModel: [link to approved model]
architects:
  - [name and role]
decisionAuthority: [title, name]
lastReviewed: [date]
---

# Technical Architecture Design

**Project**: [project name]
**Platform**: Optimizely CMS 12 (PaaS)
**Architecture Version**: 1.0
**Created**: [today]
**Last Updated**: [today]

## Overview

Technical architecture for [project name] migrating from [source] to Optimizely CMS 12 on DXP Cloud.

This document records architectural decisions in Architecture Decision Record (ADR) format.

---

## Section 1: Architecture Context (COMPLETED IN STEP-01)

[Include context from Phase A above]

### Architectural Drivers

[Include drivers from Phase B above]

---

## Section 2: Architecture Decisions

*To be completed in step-02*

### ADR Index

[Include ADR index from Phase C above]

---

## Section 3: Component Model & Diagrams

*To be completed in step-02*

---

## Section 4: Integration Architecture

*To be completed in step-02*

---

## Section 5: Deployment Architecture

*To be completed in step-02*

---

## Section 6: Security & Performance Architecture

*To be completed in step-02*

---

**Next Step**: Architecture Design (step-02)
```

Save and share with stakeholders and technical team.

## CONTEXT BOUNDARIES

- **In scope**: Gathering architecture context, documenting drivers, planning decisions
- **Out of scope**: Making architecture decisions (that's step-02)
- **Not your task**: Designing solution yet; just understanding what needs to be designed

## YOUR TASK

1. Load and review platform decision and content model
2. Confirm integration requirements
3. Document functional, non-functional, deployment, team drivers
4. Identify and prioritize architectural drivers
5. Create ADR index (list of decisions to be made)
6. Create architecture document with frontmatter
7. Confirm step-01 complete and move to step-02

## INITIALIZATION SEQUENCE

```
1. Load platform decision from previous workflow → confirm final choice
2. Load content model from previous workflow → understand types and relationships
3. Confirm integration requirements → document all dependencies
4. Document functional drivers → what must system do?
5. Document non-functional drivers → what qualities must it have?
6. Document deployment drivers → where and how will it run?
7. Document team drivers → what are our constraints?
8. Create ADR index → what decisions must we make?
9. Create architecture document → initialize with context
10. Confirm step-01 complete → ready for step-02
```

## SUCCESS METRICS

At the end of this step, you should have:

- [x] Platform decision confirmed and understood
- [x] Content model loaded and documented
- [x] Integration requirements clear and listed
- [x] Functional drivers documented (8-10 drivers)
- [x] Non-functional drivers documented (8-10 drivers)
- [x] Deployment drivers documented (5-7 drivers)
- [x] Team drivers documented (5-6 constraints)
- [x] ADR index created (11-12 decisions identified)
- [x] Architecture document created with frontmatter
- [x] Document shared with team
- [x] Step count incremented to 1
- [x] Next step is clearly step-02 (Architecture Design)

## FAILURE MODES

| Failure | Signal | Recovery |
|---------|--------|----------|
| Drivers incomplete | Missing critical requirement | Conduct requirements review; interview stakeholders |
| ADR index too large | More than 15 decisions | Defer non-critical decisions; focus on path-blockers |
| Platform constraints unclear | Don't understand CMS 12 capabilities | Review Optimizely docs; consult solution architect |
| Integration complexity underestimated | Unknown systems discovered | Conduct integration inventory; plan spikes |

## NEXT STEP

Once step-01 is complete:
- Move to **step-02-design.md**
- Make 10-12 architecture decisions (ADR format)
- Document rationale and trade-offs per decision
- Output: Complete ADRs, diagrams, component models
- Ready for build phase

---

**Step 1 Status**: [PENDING → IN PROGRESS → COMPLETE]

Update frontmatter `status: complete` and `stepsCompleted: 1` when done.
