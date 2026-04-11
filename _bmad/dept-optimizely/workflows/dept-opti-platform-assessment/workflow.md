# Workflow: Platform Assessment - CMS 12 vs SaaS CMS

**Skill**: `dept-opti-platform-assessment`
**Goal**: Assess which Optimizely platform (CMS 12 or SaaS CMS) is right for your project
**Role**: Platform Decision Maker
**Outputs**: Platform Comparison Matrix, Scoring & Recommendation, Commerce Assessment, AI/CMP Opportunities, Risk Register, Roadmap

## Workflow Overview

This workflow evaluates both Optimizely platforms against your specific project requirements, producing a scored comparison and final recommendation.

The assessment covers 10+ dimensions: content model flexibility, authoring experience, API capabilities, deployment model, cost, team skills, integrations, multi-site/multi-language, security, and performance.

## Initialization Rules

**Before starting**, ensure:
- Source audit is complete (content complexity understood)
- Project requirements documented (business goals, timeline, budget)
- Current technology stack understood
- Team skills and capacity known
- Decision authority identified (who will decide?)

**Assessment document frontmatter** must include:
```yaml
project: [project name]
status: in-progress
stepsCompleted: 0
date_created: [today]
sourcePlatform: [platform from audit]
currentStack: [.NET, Java, Node.js, etc.]
teamSkills: [.NET, JavaScript, DevOps, etc.]
timeline: [weeks to go-live]
budget: [range if known]
decisionOwner: [name/role]
```

## Step Sequence

1. **step-01-init.md** - Requirements discovery
2. **step-02-evaluate.md** - Platform comparison and scoring
3. **step-03-recommend.md** - Final recommendation with roadmap

## State Management

Assessment document tracks state:
- `stepsCompleted` increments as you progress
- `status` changes: `in-progress` → `evaluation` → `recommendation` → `decided`
- `recommendedPlatform` added in step-03
- `decisionDate` recorded when stakeholders decide

## Key Concepts

### Evaluation Dimensions

**1. Content Model Flexibility** (10-point scale)
- How well does the platform adapt to complex content structures?
- CMS 12: Strong (inheritance, blocks, custom relationships)
- SaaS CMS: Good (flat but flexible, references, custom fields)

**2. Authoring Experience** (10-point scale)
- How intuitive and powerful is the content editor?
- CMS 12: Visual page builder with components
- SaaS CMS: Visual Builder, more modern UX

**3. API Capabilities** (10-point scale)
- How comprehensive and performant are APIs for headless delivery?
- CMS 12: REST API, GraphQL planned
- SaaS CMS: Content Graph (unified GraphQL), excellent

**4. Deployment Model** (categorical: cloud vs self-hosted)
- CMS 12: DXP Cloud (Optimizely managed, highly available)
- SaaS CMS: SaaS only (Optimizely managed)

**5. Cost Model** (comparative: setup, recurring, scaling)
- CMS 12: Licensing per environment, infrastructure costs
- SaaS CMS: Content storage + API calls, more predictable

**6. Team Skills Required** (categorical: .NET, JavaScript, DevOps)
- CMS 12: .NET developers essential, learning curve for .NET shops
- SaaS CMS: JavaScript/Node teams preferred, lower .NET dependency

**7. Integration Complexity** (10-point scale)
- How easy to integrate with existing systems (Commerce, CRM, etc.)?
- CMS 12: Tight Commerce integration, .NET ecosystem
- SaaS CMS: API-first, webhook-based, language-agnostic

**8. Multi-Site & Multi-Language** (10-point scale)
- How well does it handle multiple sites and language variants?
- CMS 12: Strong, native language versioning
- SaaS CMS: Strong, native language variants

**9. Security & Compliance** (categorical)
- What are the security capabilities and compliance certifications?
- CMS 12: SOC 2, ISO 27001, HIPAA-ready
- SaaS CMS: SOC 2, ISO 27001, HIPAA-ready

**10. Performance & Scaling** (10-point scale)
- How well does it handle traffic and content scale?
- CMS 12: Caching strategies, dispatcher, good for 100K+ pages
- SaaS CMS: Content Graph (CDN-backed), good for API-first

### Scoring Methodology

1. **Gather requirements** → Establish must-have vs nice-to-have
2. **Weight each dimension** → Not all equally important to your project
3. **Score each platform** → 1-10 per dimension
4. **Apply weights** → Weighted average per platform
5. **Compare scores** → Platform with highest score wins
6. **Qualitative assessment** → Review risks and strategic fit

### Commerce Integration Patterns

**CMS 12 + Commerce**:
- Deep integration (same .NET platform)
- Product types defined in CMS
- Pricing and inventory sync to Commerce
- Single admin interface

**SaaS CMS + Commerce**:
- API integration (content hub + commerce hub)
- Webhook-based sync (content published → sync to Commerce)
- Flexible (either can be source of truth)

## Success Criteria

At completion:
- [ ] All project requirements documented and weighted
- [ ] Both platforms scored across all dimensions
- [ ] Comparison matrix complete and readable
- [ ] Weighted scoring calculated
- [ ] Commerce fit analysis complete
- [ ] AI/CMP opportunities identified
- [ ] Risk register with mitigations built
- [ ] Implementation roadmap sketched
- [ ] Final recommendation clear with rationale
- [ ] Stakeholders review and decide
- [ ] Decision documented with date and owner
- [ ] Status marked `decided`

## Next Steps After Assessment

The platform decision drives:

1. **Architecture** (`dept-opti-architecture`) - Design technical stack and solution architecture
2. **Migration Planning** (`dept-opti-migration-plan`) - Build migration wave plan and effort estimates
3. **Content Implementation** (custom) - Stand up CMS, configure content types, content migration

## Effort Estimate

- **Total workflow time**: 4-6 hours
- Step 1: 1-1.5 hours (requirements discovery)
- Step 2: 2-3 hours (platform evaluation and scoring)
- Step 3: 1-1.5 hours (recommendation and roadmap)

## Decision Gate

The final recommendation is a **major decision gate**. Once platform is chosen, major changes are very expensive:
- Changing platforms later = code rework, migration restart
- Recommend making decision early (end of planning phase)
- Avoid deferring platform choice past architecture design
