# Shopify Ecosystem Center of Excellence (CoE) - BMAD Skills

This directory contains the complete skill set for the Shopify Ecosystem CoE, based on the BMAD (Business Model Architecture Definition) framework.

## Overview

The `dept-shopify-ecosystem` module provides comprehensive guidance for:
- Evaluating and selecting Shopify partner platforms
- Architecting multi-platform ecosystem integrations
- Planning cost-effective technology stacks
- Managing data flows across the ecosystem
- Setting up and executing Shopify projects

## The 7 Core Skills

### 1. dept-shopify-reference
Master reference for all 16 core Shopify partner platforms organized by functional category. Start here to understand platform capabilities and positioning.

**Use when**: Learning about platforms in the Shopify ecosystem, quick platform lookup, training stakeholders.

### 2. dept-shopify-pim-strategy
Decision frameworks for PIM platform selection and data synchronization. Includes complexity scoring and platform comparison.

**Use when**: Evaluating whether you need a PIM, choosing between Akeneo/Bluestone/Inriver, or designing PIM-Shopify sync.

### 3. dept-shopify-integration-patterns
Integration architecture patterns, common failure modes, and resilience strategies for connecting multiple platforms.

**Use when**: Designing integration architecture, troubleshooting sync failures, choosing between hub-and-spoke vs event-driven, building error handling.

### 4. dept-shopify-marketing-stack
Marketing technology selection and orchestration covering email, SMS, personalization, and reviews.

**Use when**: Selecting email/SMS platforms, designing closed-loop marketing flows, choosing between bundled vs separate tools.

### 5. dept-shopify-data-flows
Data synchronization patterns for products, customers, orders, events, and analytics across the ecosystem.

**Use when**: Understanding data flows, mapping event schemas, setting up data warehouse integration, troubleshooting sync timing issues.

### 6. dept-shopify-cost-analysis
Cost estimation, ROI analysis, and optimization strategies for Shopify ecosystem implementations.

**Use when**: Budgeting for platforms, justifying tech spend to executives, optimizing costs through bundling or consolidation.

### 7. dept-shopify-setup
Project setup framework for new Shopify ecosystem projects, from discovery through kickoff.

**Use when**: Starting a new Shopify project, planning stack selection, organizing project governance.

## File Structure

```
dept-shopify-ecosystem/
├── README.md (this file)
├── SKILLS_SUMMARY.md (detailed overview of all skills)
└── skills/
    ├── dept-shopify-reference/
    │   ├── SKILL.md
    │   ├── bmad-skill-manifest.yaml
    │   └── references/
    │       └── INDEX.md (platform reference index)
    ├── dept-shopify-pim-strategy/
    │   ├── SKILL.md
    │   └── bmad-skill-manifest.yaml
    ├── dept-shopify-integration-patterns/
    │   ├── SKILL.md
    │   └── bmad-skill-manifest.yaml
    ├── dept-shopify-marketing-stack/
    │   ├── SKILL.md
    │   └── bmad-skill-manifest.yaml
    ├── dept-shopify-data-flows/
    │   ├── SKILL.md
    │   └── bmad-skill-manifest.yaml
    ├── dept-shopify-cost-analysis/
    │   ├── SKILL.md
    │   └── bmad-skill-manifest.yaml
    └── dept-shopify-setup/
        ├── SKILL.md
        └── bmad-skill-manifest.yaml
```

## How to Use These Skills

### For a New Project
1. Start with `dept-shopify-setup` for project discovery and planning
2. Use `dept-shopify-reference` to understand platform options
3. Reference `dept-shopify-cost-analysis` for budget estimation
4. Use skill recommendations to select additional skills based on your stack

### For Architecture Decisions
1. Review `dept-shopify-integration-patterns` for pattern selection
2. Reference `dept-shopify-data-flows` to understand data synchronization
3. Use `dept-shopify-pim-strategy` if PIM selection is needed

### For Platform Selection
1. Start with `dept-shopify-reference` for platform overview
2. Use `dept-shopify-marketing-stack` for marketing tech stack
3. Use `dept-shopify-pim-strategy` for PIM decisions
4. Reference `dept-shopify-cost-analysis` for cost comparison

## Key Concepts Across Skills

### The 16 Core Platforms
1. Shopify Plus (commerce core)
2. Akeneo (PIM - enterprise)
3. Bluestone (PIM - mid-market)
4. Inriver (PIM - growth-focused)
5. Contentstack (headless CMS)
6. Bloomreach (search + personalization - enterprise)
7. Nosto (personalization - mid-market)
8. Klaviyo (email)
9. Attentive (SMS)
10. Yotpo SMS (bundled)
11. Gorgias (support)
12. Yotpo (reviews + UGC + loyalty)
13. Recharge (subscriptions)
14. Loop (returns)
15. Swap (returns)
16. Global-e (cross-border)
17. Rebuy (post-purchase optimization)

### Six Common Stack Patterns
1. **Starter Plus**: Simple D2C (Shopify + Klaviyo + Yotpo)
2. **Content-Rich Brand**: Magazine-style commerce (adds Contentstack + Nosto)
3. **Global Enterprise**: Multi-market at scale (adds Akeneo + Global-e + Bloomreach + Gorgias)
4. **Subscription-First**: Recurring revenue model (adds Recharge)
5. **D2C Growth**: Email + SMS both critical (adds Attentive + Rebuy)
6. **Headless Commerce**: Custom storefront (custom frontend + API-first architecture)

### Integration Patterns
- **Hub-and-Spoke**: Shopify as central hub, platforms as spokes (simple, < 100K orders/month)
- **Middleware**: Zapier/Workato/custom brokers data flows (100K-500K orders/month)
- **Event-Driven**: Kafka/RabbitMQ event bus (> 500K orders/month, high complexity)

## Content Statistics
- Total SKILL.md content: 4,362+ lines
- 7 complete skills with full decision frameworks
- 1 reference index with platform cross-linking
- Coverage: 16 platforms, 6 stack patterns, 3 integration patterns, 18 common gotchas

## Standards
All skills follow BMAD (Business Model Architecture Definition) standards:
- **SKILL.md**: Comprehensive content with examples, decision frameworks, and checklists
- **bmad-skill-manifest.yaml**: Metadata for cataloging, discovery, and governance
- **canonicalId**: Machine-readable skill identifier
- **tags**: For search and discovery
- **version**: Semantic versioning

## Contact
BMAD Shopify Ecosystem CoE
Last Updated: 2026-04-02
