# Workflow: Technical Architecture Design for Optimizely

**Skill**: `dept-opti-architecture`
**Goal**: Design complete technical architecture using ADR format; ready for build phase
**Role**: Solution Architect
**Outputs**: ADR Document, Architecture Diagram, Component Model, Security/Performance/Integration/Deployment Architecture

## Workflow Overview

This workflow documents technical architecture decisions for Optimizely implementation using Architecture Decision Records (ADR) format.

ADRs are decision records that document:
- **Context**: What circumstances led to this decision?
- **Decision**: What did we decide?
- **Rationale**: Why did we make this choice?
- **Consequences**: What are the trade-offs and implications?

Each major architecture decision gets its own ADR, creating a living record of the why behind the system design.

## Initialization Rules

**Before starting**, ensure:
- Platform decision is final (CMS 12 or SaaS CMS from platform assessment)
- Content model is approved (from content modelling workflow)
- Project requirements are documented (from platform assessment)
- Integration requirements are clear (list of systems to integrate)
- Solution architect is designated
- Decision authority identified (who approves architecture?)

**Architecture document frontmatter** must include:
```yaml
project: [project name]
status: in-progress
stepsCompleted: 0
date_created: [today]
platform: [CMS 12 or SaaS CMS]
contentModel: [link to approved model]
architects: [names]
decisionAuthority: [role/name]
lastReviewed: [date]
---
```

## Step Sequence

1. **step-01-init.md** - Architecture context discovery and drivers
2. **step-02-design.md** - Architecture design and ADR documentation

## State Management

Architecture document tracks state:
- `stepsCompleted` increments as you progress
- `status` changes: `in-progress` → `design` → `review` → `approved`
- Architecture decisions accumulate in ADRs section
- Open questions documented and gated

## Key Concepts

### Architectural Drivers

**Functional Requirements** (what the system must do):
- Support content types (pages, products, FAQs, etc.)
- Enable content composition (blocks, components)
- Deliver content to web, mobile, email channels
- Integrate with Commerce for product catalog
- Support multi-language and multi-site

**Non-Functional Requirements** (qualities the system must have):
- Performance (page load < 2 sec, API response < 500ms)
- Scalability (handle 100K concurrent users)
- Availability (99.5% uptime SLA)
- Security (GDPR, HIPAA compliance)
- Maintainability (team can manage and evolve)

**Deployment Requirements**:
- Cloud-hosted (Azure/AWS/Google Cloud)
- CI/CD pipeline for deployments
- Multiple environments (dev, staging, production)
- Blue-green or canary deployment capability

**Team Constraints**:
- .NET or JavaScript team
- DevOps expertise available?
- Content operations team
- Limited vs unlimited scalability needs

### Architecture Decision Records (ADR)

Standard ADR format:

```markdown
## ADR-N: [Brief Title]

**Status**: Proposed | Accepted | Deprecated | Superseded

**Context**
[Describe the situation that led to this decision]

**Decision**
[State what we decided to do]

**Rationale**
[Explain why we made this choice; what makes it the best option?]

**Consequences**
- Positive: [benefits, advantages]
- Negative: [downsides, trade-offs, risks]

**Alternatives Considered**
- [Alternative 1]: [why not chosen]
- [Alternative 2]: [why not chosen]

**Related Decisions**
- [ADR-X]: [how this decision relates to other decisions]
```

### CMS 12-Specific Architecture Patterns

**PageData Architecture**:
- All pages inherit from PageData (IContent)
- PageData has properties (Title, URL, Created, Modified, etc.)
- Can have child pages (content hierarchy)
- Can have blocks in ContentArea (dynamic composition)

**BlockData Architecture**:
- Reusable block components inherit from BlockData
- Can be placed in ContentArea on any PageData
- Enables composition without inheritance
- Examples: TextBlock, ImageBlock, VideoBlock, etc.

**Content Delivery**:
- Dispatcher (reverse proxy caching)
- Page output caching
- VPP (Virtual Path Provider) for asset delivery
- CDN in front of dispatcher

### SaaS CMS-Specific Architecture Patterns

**Content Types**:
- Flat model (no inheritance)
- Defined via SDK/CLI or REST API
- References link to other content
- Sections organize fields visually

**Visual Builder**:
- Composition without code
- Sections and components
- Flexible layout
- No inheritance; composition-based

**Content Graph**:
- Unified GraphQL API
- CDN-backed (fast queries)
- Includes previewing
- Webhooks on publish

## Success Criteria

At completion:
- [ ] Architectural drivers documented and prioritized
- [ ] 8-12 key architecture decisions recorded (ADR format)
- [ ] Each ADR has: Context, Decision, Rationale, Consequences
- [ ] Alternatives considered and documented per ADR
- [ ] Architecture diagram(s) produced and readable
- [ ] Component model fully specified
- [ ] Integration architecture designed (APIs, webhooks, data flows)
- [ ] Deployment architecture documented (environments, CD/CI)
- [ ] Security strategy documented (auth, authz, encryption)
- [ ] Performance strategy documented (caching, CDN, optimization)
- [ ] Open questions identified and gated
- [ ] Architecture reviewed and approved by decision authority
- [ ] Status marked `approved`
- [ ] Ready for code design and build phase

## Next Steps After Architecture

The architecture design feeds into:

1. **Migration Planning** (`dept-opti-migration-plan`) - Use architecture to plan content migration
2. **Code Design & Build** (custom workflow) - Use architecture to guide development
3. **Infrastructure Setup** (custom workflow) - Configure CMS, Commerce, integrations

## Effort Estimate

- **Total workflow time**: 6-8 hours
- Step 1: 1.5-2 hours (context discovery, drivers)
- Step 2: 4.5-6 hours (architecture design, ADR documentation)

## ADR Index (Typical Decisions)

A typical Optimizely implementation records ADRs for:

1. **Platform Choice** - CMS 12 vs SaaS CMS (already decided, ADR-0)
2. **Solution Architecture** - Monolithic vs microservices, headless vs traditional
3. **Content Model Architecture** - PageData/BlockData structure (CMS 12) or content type model (SaaS)
4. **Integration Architecture** - API patterns, webhook patterns, sync strategy
5. **Deployment Architecture** - Environment structure, CD/CI pipeline, DXP Cloud topology
6. **Security Architecture** - Auth/authz patterns, data protection, compliance
7. **Performance Architecture** - Caching strategy, CDN usage, query optimization
8. **Commerce Integration** - Deep vs loose coupling, sync direction, product catalog master
9. **Asset Management** - DAM strategy, image optimization, CDN delivery
10. **Multi-Language** - Language variants, translation workflow, content organization
11. **Search & Indexing** - Search implementation (Elasticsearch, Azure Search, etc.)
12. **Monitoring & Logging** - Observability, error tracking, performance monitoring

Typically 8-12 major decisions documented in ADRs.
