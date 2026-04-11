# Performance Audit Workflow

## Goal

Produce a comprehensive performance audit report with prioritized recommendations for Optimizely implementations, covering all deployment patterns (CMS 12, SaaS CMS, headless) and providing a clear implementation roadmap with business-aligned prioritization.

## Role

Performance Specialist

## Output

Performance audit report with:
- Baseline metrics (Core Web Vitals, Lighthouse scores, TTFB)
- Scored recommendations (impact 1-5, effort 1-5)
- Prioritized implementation roadmap
- Operational runbook
- A/P/C decision menu for stakeholder alignment

## Coverage Areas

### CMS 12 Performance Focus
- Output caching strategy (fragment vs full-page vs smart caching)
- Visitor Profile Provider (VPP) configuration and SQL performance impact
- Database query optimization (content queries, personalization, scheduling)
- Image optimization (formats, responsive sizing, lazy loading)
- CDN strategy (origin configuration, cache headers, purge patterns)
- Scheduled job impact on performance (publishing, indexing, cleanup)
- Time to First Byte optimization

### SaaS CMS Performance Focus
- Content Graph query performance analysis
  - Cached template queries (loaded at request time)
  - Live content queries (requiring external API calls)
  - Query complexity scoring (joins, filters, aggregations)
- Content Delivery Network configuration
  - Regional routing and failover
  - Cache headers and purge strategies
  - Origin shield configuration
- Server-side template caching strategies
- Static asset delivery optimization

### Headless Performance Focus
- Server-side rendering (SSR) vs static site generation (SSG) strategy
- JavaScript bundle analysis (code splitting, lazy loading, tree-shaking)
- Content Graph API query optimization
- Image delivery and optimization (Next.js Image, Vercel Image Optimization)
- CDN configuration for API and asset delivery
- Core Web Vitals optimization (LCP, FID/INP, CLS)
- Build time and deployment optimization

### DXP Cloud Infrastructure
- Container sizing (CPU/memory allocation)
- Scaling policies (auto-scaling thresholds, min/max replicas)
- CDN configuration (Cloudflare, Fastly, Akamai)
- Database sizing and connection pooling
- Cache layer configuration (Redis, Memcached)
- Monitoring and alerting setup

### All Platforms
- Core Web Vitals metrics
  - Largest Contentful Paint (LCP) - target < 2.5s
  - First Input Delay / Interaction to Next Paint (FID/INP) - target < 100ms/200ms
  - Cumulative Layout Shift (CLS) - target < 0.1
- Lighthouse scores (Performance, Accessibility, Best Practices, SEO)
- Real User Monitoring (RUM) vs synthetic monitoring alignment
- Third-party script impact analysis
- CDN performance and cache hit rates

## Workflow Steps

### Step 1: Performance Context Discovery
- Identify platform type and topology
- Gather current metrics from monitoring dashboards
- Document SLAs and performance targets
- Create audit document with frontmatter
- Duration: 30 minutes

### Step 2: Performance Analysis and Recommendations
- Execute deep-dive analysis for identified platform(s)
- Document current state across all performance dimensions
- Identify bottlenecks and root causes
- Generate scored recommendations
- Prioritize by ROI (impact/effort ratio)
- Present findings with A/P/C menu
- Duration: 2-3 hours

### Step 3: Documentation and Handoff
- Finalize audit report
- Create implementation roadmap
- Define success metrics and monitoring strategy
- Provide operational runbook
- Obtain stakeholder sign-off
- Duration: 1 hour

## Success Criteria

- Audit covers all three deployment patterns or documents why pattern not applicable
- Minimum 10 actionable recommendations delivered
- All recommendations include impact score (1-5), effort score (1-5), and ROI calculation
- Baseline metrics documented with targets for each Core Web Vital
- Implementation roadmap prioritized by business value
- Stakeholders have clear A/P/C decision options
- All recommendations are Optimizely-specific and actionable
- Audit report is production-ready and can be shared with leadership

## Failure Recovery

If critical monitoring data is unavailable:
1. Use synthetic monitoring (Lighthouse, WebPageTest, GTmetrix)
2. Document assumptions and gaps
3. Schedule follow-up with production telemetry access
4. Escalate infrastructure gaps to platform team
5. Continue with best-practice recommendations based on platform analysis

If platform topology is unclear:
1. Request platform documentation or architecture diagrams
2. Schedule discovery call with platform team
3. Document as "Unknown - requires investigation"
4. Escalate to technical architecture review
