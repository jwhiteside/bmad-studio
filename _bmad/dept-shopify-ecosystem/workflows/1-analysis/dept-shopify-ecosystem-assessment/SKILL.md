---
canonicalId: dept-shopify-ecosystem-assessment
name: "Shopify Ecosystem Assessment"
description: "Assess current or desired Shopify ecosystem composition, identify anti-patterns, and recommend appropriate stack patterns"
domain: shopify-ecosystem
category: analysis
---

# Shopify Ecosystem Assessment

**Entry Point**: `dept-shopify-ecosystem-assessment`

Comprehensive assessment of a Shopify ecosystem or proposed ecosystem. Evaluates business profile against ecosystem patterns, documents current platform stack (if any), identifies anti-patterns that create technical debt, and recommends appropriate stack patterns based on business characteristics.

## What This Skill Does

- Gathers business context (revenue, SKUs, channels, geography, team size)
- Documents existing platform stack and integration landscape (if applicable)
- Systematically checks for 6 common anti-patterns: over-tooling, data silos, personalization conflicts, integration debt, conflicting segmentation, and unmanaged proliferation
- Matches business profile to 6 ecosystem patterns: Starter Plus, Content-Rich, Global Enterprise, Subscription-First, D2C Growth, Headless Commerce
- Identifies gaps between current state (if any) and recommended stack
- Produces structured assessment report with specific recommendations

## When To Use It

- Starting a new Shopify implementation
- Planning an ecosystem expansion
- Auditing a struggling or inefficient ecosystem
- Evaluating whether the current stack still fits the business
- Making platform investment decisions

## Inputs

- Business profile documentation (revenue, growth rate, SKU count, channels, geographies, team size)
- Current platform inventory (if assessing existing ecosystem)
- Business strategic priorities and constraints

## Outputs

- Ecosystem assessment report (markdown) with:
  - Business profile analysis
  - Current state documentation
  - Anti-pattern findings
  - Pattern recommendation with rationale
  - Gap analysis
  - Prioritized improvement recommendations
