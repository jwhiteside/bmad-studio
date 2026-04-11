---
canonicalId: dept-opti-performance-audit
name: "Performance Audit for Optimizely"
description: "Audit Optimizely implementation for performance issues across CMS 12, SaaS CMS, and headless front-ends. Covers CDN, caching, Content Graph queries, SSR/SSG, image delivery, and DXP Cloud configuration."
domain: optimizely
category: planning
---

# Optimizely Performance Audit Workflow

## MANDATORY EXECUTION RULES

- Performance audit must cover ALL three deployment patterns: CMS 12, SaaS CMS, and headless architectures
- All metrics must be traced to Core Web Vitals (LCP, FID/INP, CLS) and Lighthouse scores
- Every recommendation must include impact score (1-5), effort score (1-5), and business priority
- Audit findings MUST be validated against actual production telemetry, not assumptions
- DXP Cloud configuration must be assessed for container sizing, scaling policies, and CDN integration
- Content Graph queries in SaaS CMS must differentiate between cached template queries vs live content queries
- Output must always include A/P/C decision menu for stakeholder buy-in

## EXECUTION PROTOCOLS

1. **Discovery Phase**: Identify platform topology and gather baseline metrics (30 mins)
2. **Analysis Phase**: Execute deep-dive audit across all performance dimensions (2-3 hours)
3. **Recommendation Phase**: Score, prioritize, and present findings with decision menu (1 hour)
4. **Documentation Phase**: Generate audit report with operational runbook (1 hour)

## CONTEXT BOUNDARIES

- Scope: Optimizely CMS implementations only (CMS 12, SaaS CMS, headless front-ends)
- Excludes: Custom application code outside CMS scope, third-party SaaS performance, user network conditions
- Focus areas: CMS-driven performance bottlenecks, content delivery patterns, DXP Cloud infrastructure
- Assumes: Production traffic patterns available, access to monitoring dashboards (Dynatrace, Application Insights)

## YOUR TASK

Conduct a comprehensive performance audit of the Optimizely implementation, identifying bottlenecks and delivering prioritized recommendations across:
- Content caching strategies (output caching, VPP, CDN)
- Content Graph query optimization (SaaS CMS)
- Image delivery and optimization (responsive, format negotiation, lazy loading)
- Server-side rendering strategy and bundle optimization (headless)
- DXP Cloud infrastructure sizing and scaling configuration
- Time to First Byte and Core Web Vitals metrics

Produce a detailed audit report with scored recommendations and implementation roadmap.

## INITIALIZATION SEQUENCE

1. Trigger: User initiates performance audit workflow
2. Load: Retrieve existing Optimizely implementation context (platform, topology, metrics)
3. Validate: Confirm access to production monitoring (Dynatrace, Application Insights, Google Analytics)
4. Create: Initialize audit document with frontmatter and discovery template
5. Navigate: Proceed to Step 1 (Performance Context Discovery)

## SUCCESS METRICS

- Audit covers all three deployment patterns (CMS 12, SaaS CMS, headless)
- Minimum 10 actionable recommendations delivered
- All recommendations scored on impact (1-5) and effort (1-5)
- Recommendations prioritized by ROI (impact/effort ratio)
- Report includes baseline metrics and success criteria for each recommendation
- Stakeholders have A/P/C decision menu for each recommendation tier

## FAILURE MODES

- Missing production telemetry data → Use synthetic benchmarks (Lighthouse, WebPageTest) as interim metrics
- Incomplete topology understanding → Require platform documentation or escalate to platform team
- Insufficient DXP Cloud access → Recommend engaging Episerver/Optimizely support for infrastructure audit
- Conflicting recommendations → Document trade-offs and require business decision on prioritization

## NEXT STEP

Execute Step 1 (Performance Context Discovery) to gather baseline metrics and document audit scope.
