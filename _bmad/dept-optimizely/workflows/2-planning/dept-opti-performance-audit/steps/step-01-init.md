# Step 1: Performance Context Discovery

## MANDATORY EXECUTION RULES

- Must verify access to production monitoring (Dynatrace, Application Insights, Google Analytics) before proceeding
- Platform type identification is MANDATORY - cannot proceed without confirmed platform (CMS 12, SaaS CMS, or headless)
- Current metrics must be sourced from production telemetry, not assumed
- SLAs and performance targets must be explicitly documented from business stakeholders
- Audit document frontmatter must include all required metadata for report generation
- If monitoring access is unavailable, document as constraint and escalate

## EXECUTION PROTOCOLS

1. **Platform Identification** (10 mins)
   - Confirm Optimizely platform version (CMS 12, SaaS CMS)
   - Identify front-end topology (traditional render, headless, hybrid)
   - Map hosting environment (DXP Cloud, on-premises, hybrid cloud)
   - Document deployment patterns

2. **Metrics Gathering** (10 mins)
   - Query production monitoring for last 30 days of Core Web Vitals
   - Capture Lighthouse scores from recent audits
   - Document Time to First Byte patterns
   - Retrieve traffic volume and peak load data
   - Note any known performance issues or customer complaints

3. **SLA and Target Documentation** (5 mins)
   - Interview business stakeholders for performance targets
   - Document existing SLAs (uptime, response time, availability)
   - Establish Core Web Vitals targets
   - Record business-critical performance thresholds

4. **Audit Document Creation** (5 mins)
   - Create audit document with discovery data
   - Populate frontmatter with context
   - Set up sections for detailed findings
   - Establish baseline for comparative analysis

## CONTEXT BOUNDARIES

- Scope: Optimizely CMS implementation and associated delivery infrastructure
- Excludes: Third-party services, user network conditions, browser capabilities
- Focus: Platform-driven performance bottlenecks that can be addressed through configuration or architecture changes
- Timeframe: Last 30 days of production metrics (or available data if shorter history)

## YOUR TASK

Gather baseline performance context for the Optimizely implementation by:

1. **Identifying Platform Configuration**
   - Document Optimizely version: `_____`
   - Confirm deployment pattern: CMS 12 / SaaS CMS / Headless (circle one)
   - Record hosting: DXP Cloud / On-Premises / Hybrid (specify)
   - Note multi-site/multi-language configuration if applicable
   - Document front-end framework (ASP.NET, Node.js, Next.js, etc.)

2. **Gathering Baseline Metrics**
   - **Core Web Vitals (30-day average from RUM)**
     - Largest Contentful Paint (LCP): `_____` ms (target: < 2500ms)
     - First Input Delay / Interaction to Next Paint (FID/INP): `_____` ms (target: < 200ms)
     - Cumulative Layout Shift (CLS): `_____` (target: < 0.1)
   - **Lighthouse Scores (from recent audit)**
     - Performance: `_____` / 100
     - Accessibility: `_____` / 100
     - Best Practices: `_____` / 100
     - SEO: `_____` / 100
   - **Server Performance**
     - Time to First Byte (TTFB): `_____` ms (30-day average)
     - 95th percentile TTFB: `_____` ms
     - Peak request load: `_____` requests/second
   - **Content Delivery**
     - CDN cache hit rate: `_____` %
     - Origin response time (p95): `_____` ms
     - Image delivery optimization status: Optimized / Partially / Not optimized

3. **Documenting SLAs and Targets**
   - Existing uptime SLA: `_____` %
   - Response time target: `_____` ms
   - Core Web Vitals targets:
     - LCP target: `_____` ms
     - INP/FID target: `_____` ms
     - CLS target: `_____`
   - Business-critical pages or experiences: `_____`
   - Peak traffic pattern: `_____` (e.g., daily peak at 9am EST)

4. **Understanding Current Issues**
   - Known performance bottlenecks: `_____`
   - Customer complaints about speed: Yes / No
   - Recent performance degradation: Yes / No (if yes, when: `_____`)
   - Traffic seasonality: `_____`

5. **Creating Audit Document Frontmatter**
   ```
   ---
   auditType: Performance Audit
   platform: [CMS 12 / SaaS CMS / Headless]
   auditDate: YYYY-MM-DD
   auditPeriod: Last 30 days
   auditScope: Optimizely implementation and content delivery
   baselineMetrics:
     lcp: {value} ms
     inp: {value} ms
     cls: {value}
     lighthouse: {value}/100
     ttfb: {value} ms
   targets:
     lcpTarget: {value} ms
     inpTarget: {value} ms
     clsTarget: {value}
   stakeholders:
     - name: {Name}
       role: {Role}
       email: {Email}
   hostingEnvironment: [DXP Cloud / On-Premises / Hybrid]
   monitoringTools: [Dynatrace / Application Insights / Google Analytics]
   nextReview: {Date 30 days from now}
   ---
   ```

## INITIALIZATION SEQUENCE

1. User provides Optimizely instance URL and contact information
2. Verify access to production monitoring dashboards
3. Confirm platform type with technical stakeholder
4. Query monitoring systems for baseline metrics
5. Interview business stakeholders for SLAs and targets
6. Create audit document with populated frontmatter
7. Transition to Step 2 (Performance Analysis)

## SUCCESS METRICS

- Platform type confirmed and documented
- Baseline Core Web Vitals captured from production telemetry
- Lighthouse scores documented from recent audit
- SLAs and performance targets explicitly captured from stakeholders
- Time to First Byte baseline established
- Audit document created with complete frontmatter
- All critical gaps or unknowns documented for escalation
- Ready to proceed to Step 2 analysis phase

## FAILURE MODES

- **Missing monitoring access**: Document limitation, use synthetic monitoring (Lighthouse, WebPageTest), escalate for production access
- **Platform type unclear**: Schedule architecture review call, document assumptions, mark for follow-up
- **No baseline metrics available**: Use synthetic benchmarks, note as interim metrics, request RUM setup
- **Stakeholders unavailable**: Proceed with best-practice targets, schedule follow-up for SLA confirmation
- **Incomplete topology**: Document unknown elements, escalate to platform team, continue with known components

## NEXT STEP

Proceed to Step 2 (Performance Analysis and Recommendations) where you will conduct detailed analysis of identified performance dimensions and generate scored, prioritized recommendations based on the baseline context gathered in this step.

---

## Discovery Template

Use this template to organize discovered information:

### Platform Context
- **Optimizely Version**:
- **Deployment Model**:
- **Hosting**:
- **Front-end Framework**:
- **Multi-site Configuration**:

### Baseline Metrics
| Metric | Current | Target | Gap | Priority |
|--------|---------|--------|-----|----------|
| LCP | | | | |
| INP/FID | | | | |
| CLS | | | | |
| Lighthouse Score | | | | |
| TTFB | | | | |
| CDN Hit Rate | | | | |

### Known Issues
- Issue 1: `_____`
- Issue 2: `_____`
- Issue 3: `_____`

### Stakeholders
| Name | Role | Email | Availability |
|------|------|-------|--------------|
| | | | |

### Monitoring Dashboard Access
- Dynatrace: [URL or N/A]
- Application Insights: [URL or N/A]
- Google Analytics: [URL or N/A]
- Other: [URL or N/A]

### Next Steps
1. Confirm SLAs with business stakeholders
2. Verify monitoring dashboard access
3. Schedule Step 2 analysis (2-3 hour block)
4. Identify performance specialist contacts for deep dives
