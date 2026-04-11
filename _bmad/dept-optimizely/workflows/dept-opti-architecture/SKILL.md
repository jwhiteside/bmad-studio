---
canonicalId: dept-opti-architecture
name: "Technical Architecture Design for Optimizely"
description: "Design complete technical architecture for Optimizely implementation using Architecture Decision Records (ADR) format. Covers platform architecture, component model, integration patterns, deployment, security, and performance."
domain: optimizely
category: planning
---

# Optimizely Technical Architecture Design

**Entry Point**: `dept-opti-architecture`

This skill designs the complete technical architecture for Optimizely implementation using Architecture Decision Records (ADR) format. Covers platform choice, component model, content model, integration patterns, and deployment architecture.

## What This Skill Does

Documents technical architecture decisions for building on Optimizely (CMS 12 or SaaS CMS) by:
- Recording architectural drivers (functional, non-functional, deployment, team constraints)
- Making explicit architecture decisions (ADR format per decision)
- Documenting rationale and trade-offs
- Producing architecture diagrams and component models
- Creating a blueprint for the build phase

## When To Use It

After platform is decided (from platform assessment). Before beginning development, use this skill to design the complete technical solution.

## Inputs

- Platform decision (CMS 12 or SaaS CMS)
- Content model (from content modelling workflow)
- Project requirements (from platform assessment)
- Integration requirements (from platform assessment)
- Team capabilities and constraints

## Outputs

- Architecture Decision Records (ADR) document
- Technical Architecture Diagram
- Component Model (CMS types, integrations, deployment)
- Security Architecture
- Performance & Scaling Strategy
- Integration Architecture (APIs, webhooks, data flows)
- Deployment Architecture (environments, CD/CI, DXP Cloud)
- Open Questions & Technical Decisions

## Process

The skill delegates to `workflow.md` which guides you through two steps:

1. **Initialize** - Load context, document architectural drivers
2. **Design** - Make architecture decisions, document in ADR format

Total time: 6-8 hours depending on integration complexity

## Success Criteria

✓ Architectural drivers documented
✓ Key decisions made and recorded (ADR format)
✓ Rationale and trade-offs documented per decision
✓ Architecture diagrams produced
✓ Integration architecture designed
✓ Deployment architecture documented
✓ Security and performance strategies defined
✓ Open questions gated and documented
✓ Architecture ready for code design and build phase
