# Step 2: Performance Analysis and Recommendations

## MANDATORY EXECUTION RULES

- All recommendations must include impact score (1-5), effort score (1-5), and ROI calculation
- Recommendations must be prioritized by ROI (impact/effort ratio), not effort alone
- Every recommendation must be Optimizely-specific and technically actionable
- All findings must be traced to baseline metrics or production observation
- Recommendations for each platform type (CMS 12, SaaS CMS, headless) must be separated
- DXP Cloud recommendations must include container/scaling implications
- Core Web Vitals impact must be estimated for every recommendation
- Present all recommendation tiers (Quick Wins, Strategic, Architectural) with A/P/C menu
- Cannot proceed to reporting without stakeholder decision on recommendation tier

## EXECUTION PROTOCOLS

1. **Platform-Specific Analysis** (varies by platform)
   - CMS 12: 45-60 minutes
   - SaaS CMS: 60-90 minutes
   - Headless: 60-90 minutes
   - DXP Cloud infrastructure: 30-45 minutes

2. **Recommendation Generation** (30 minutes)
   - Score each dimension (1-5)
   - Calculate ROI (impact/effort)
   - Prioritize by business value
   - Create recommendation tiers

3. **Stakeholder Presentation** (30 minutes)
   - Present findings by tier
   - Discuss trade-offs and dependencies
   - Obtain A/P/C decision on each tier
   - Document decisions and dependencies

## CONTEXT BOUNDARIES

- Scope: Optimizely platform and content delivery infrastructure only
- Excludes: Custom application code, third-party services, user-side optimization
- Focus: Configuration, architecture, content delivery patterns
- Baseline: Metrics from Step 1, production telemetry
- Timeframe: 30-day analysis window minimum

## YOUR TASK

Conduct detailed performance analysis across platform-specific dimensions and deliver scored, prioritized recommendations.

---

## CMS 12 PERFORMANCE ANALYSIS

### 1. Output Caching Strategy Analysis

**Current State Assessment**
- Fragment caching configuration: `_____`
- Full-page caching implementation: `_____`
- Smart caching (published content only): `_____`
- Cache invalidation strategy: `_____`
- Cache TTL settings: `_____` seconds average
- Cache hit rate: `_____` %

**Performance Impact**
- Estimated TTFB improvement with optimization: `_____` ms
- Current origin response time (without cache): `_____` ms
- Cached response time: `_____` ms
- Cache miss frequency: `_____` per hour

**Key Recommendations**

**Quick Win: Implement Fragment-Level Caching**
- *Description*: Enable fragment caching on high-traffic components (navigation, sidebars, recommendations) with 5-15 minute TTLs
- *Impact Score*: 4/5 (reduces origin load by 40-60%, improves TTFB)
- *Effort Score*: 2/5 (2-3 hours of CMS configuration, testing)
- *ROI*: 2.0 (impact/effort)
- *Core Web Vitals Impact*: LCP -200-400ms, TTFB -300-500ms
- *Implementation Checklist*:
  - Identify high-impact fragments (navigation, personalized sidebars)
  - Configure EPiServer cache settings per fragment
  - Set cache TTLs based on content change frequency
  - Implement cache invalidation triggers on content updates
  - Test with production-like load
  - Monitor cache hit rates
- *Dependencies*: None
- *Risks*: Stale content if TTL too long; over-invalidation if triggers too aggressive

**Strategic: Implement Smart Output Caching (Content-Aware)**
- *Description*: Implement caching strategy that caches published content but not draft/scheduled, reducing origin load while ensuring draft/preview accuracy
- *Impact Score*: 5/5 (reduces TTFB 50-70%, major performance gain)
- *Effort Score*: 3/5 (1-2 days of development, testing, CMS integration)
- *ROI*: 1.67 (impact/effort)
- *Core Web Vitals Impact*: TTFB -500-800ms, LCP -400-600ms
- *Implementation Checklist*:
  - Audit current VPP (Visitor Profile Provider) logic
  - Implement cache key generation based on publication state
  - Configure cache vary headers for personalization
  - Create cache warmup strategy for published content
  - Implement cache purge on publish events
  - Performance test with production traffic patterns
- *Dependencies*: Fragment caching (Step 1 recommendation) should be in place first
- *Risks*: Complex logic may increase maintenance overhead

### 2. Visitor Profile Provider (VPP) Optimization

**Current State Assessment**
- VPP implementation type: `_____`
- SQL query count per request: `_____` queries
- VPP cache status: Enabled / Disabled
- Average VPP execution time: `_____` ms
- Profile data cardinality: `_____` unique profiles

**Performance Impact**
- VPP time contribution to TTFB: `_____` ms (typical: 50-200ms)
- Database connection pool efficiency: `_____` %
- SQL query performance: `_____` ms average

**Key Recommendations**

**Quick Win: Enable VPP Output Caching**
- *Description*: Enable output caching of VPP results to reduce repeated database queries for same visitor profiles
- *Impact Score*: 4/5 (reduces VPP queries by 70-90%)
- *Effort Score*: 1/5 (30 minutes CMS configuration)
- *ROI*: 4.0 (impact/effort) - HIGHEST PRIORITY QUICK WIN
- *Core Web Vitals Impact*: TTFB -50-150ms, LCP -30-100ms
- *Implementation Checklist*:
  - Enable VPP result caching in EPiServer CMS settings
  - Set cache duration based on profile change frequency
  - Test personalization accuracy with cached profiles
  - Monitor database connection pool utilization
- *Dependencies*: None
- *Risks*: If caching too aggressive, personalization may be stale

**Strategic: Refactor Complex VPP Queries**
- *Description*: Analyze VPP implementation for N+1 query patterns, missing indexes, or inefficient joins; refactor to reduce queries-per-request
- *Impact Score*: 4/5 (reduces TTFB 100-300ms)
- *Effort Score*: 3/5 (2-3 days of SQL analysis, refactoring, testing)
- *ROI*: 1.33 (impact/effort)
- *Core Web Vitals Impact*: TTFB -100-300ms, LCP -50-200ms
- *Implementation Checklist*:
  - Profile VPP queries using SQL Server profiler
  - Identify N+1 patterns and missing indexes
  - Refactor queries to use batch operations
  - Add database indexes on frequently filtered columns
  - Implement query result caching
  - Load test refactored queries
- *Dependencies*: Database access and performance tools required
- *Risks*: Incorrect refactoring may break personalization logic

**Architectural: Implement Read Replica for VPP Queries**
- *Description*: Route read-heavy VPP queries to database read replica to reduce load on primary database
- *Impact Score*: 4/5 (reduces database contention, improves consistency)
- *Effort Score*: 4/5 (2-3 days infrastructure setup, CMS configuration, testing)
- *ROI*: 1.0 (impact/effort)
- *Core Web Vitals Impact*: TTFB -50-150ms (secondary to primary benefit of reducing contention)
- *Implementation Checklist*:
  - Configure database read replica in DXP Cloud or on-premises environment
  - Update connection strings in CMS for read operations
  - Test replication lag and failover scenarios
  - Monitor replica performance
  - Implement automatic failover to primary if replica unavailable
- *Dependencies*: DXP Cloud access or database administration privileges
- *Risks*: Replica lag may cause stale reads; additional infrastructure cost

### 3. Database Query Optimization

**Current State Assessment**
- Scheduled job count: `_____` jobs
- Heavy jobs execution window: `_____`
- Average query response time: `_____` ms
- Database CPU utilization: `_____` % during peak
- Missing indexes identified: `_____` count
- Query plan issues: Yes / No

**Performance Impact**
- Database CPU spike during peak load: `_____` % increase
- Scheduled job impact on user-facing queries: `_____` ms slowdown
- Connection pool exhaustion frequency: `_____` times per week

**Key Recommendations**

**Quick Win: Schedule Heavy Jobs Outside Peak Traffic**
- *Description*: Move expensive scheduled jobs (indexing, cleanup, cache clearing) to off-peak hours (typically 2am-5am)
- *Impact Score*: 4/5 (eliminates contention, improves peak TTFB)
- *Effort Score*: 1/5 (15 minutes CMS job scheduler configuration)
- *ROI*: 4.0 (impact/effort)
- *Core Web Vitals Impact*: TTFB -100-400ms during peak hours
- *Implementation Checklist*:
  - Identify all scheduled jobs and their execution frequency
  - Calculate total execution time and impact
  - Determine off-peak execution window
  - Reconfigure job scheduler in CMS
  - Monitor job completion and any side effects
- *Dependencies*: None
- *Risks*: Off-peak jobs may affect next-day publish performance if poor scheduling

**Strategic: Add Database Indexes on Filtered Columns**
- *Description*: Identify missing indexes on columns frequently used in WHERE clauses; create indexes to improve query performance
- *Impact Score*: 3/5 (improves query response time 200-600ms)
- *Effort Score*: 2/5 (2-3 hours database analysis and index creation)
- *ROI*: 1.5 (impact/effort)
- *Core Web Vitals Impact*: TTFB -50-200ms
- *Implementation Checklist*:
  - Run "missing indexes" query in SQL Server Management Studio
  - Analyze query execution plans for index scans
  - Create indexes on high-impact columns
  - Monitor index usage and maintenance impact
  - Test with production-like query volume
- *Dependencies*: Database access and DBA support
- *Risks*: New indexes increase write query cost; must balance read vs write performance

### 4. Image Optimization

**Current State Assessment**
- Image format support: WebP / AVIF / JPEG only (specify)
- Responsive image implementation: Yes / No
- Lazy loading enabled: Yes / No
- Image delivery optimization: `_____`
- Average image size per page: `_____` KB
- Unoptimized images count: `_____`

**Performance Impact**
- Current image size per page: `_____` KB
- Optimized image size potential: `_____` KB
- Optimization potential: `_____` % reduction
- Core Web Vitals impact: LCP affected (images often largest element)

**Key Recommendations**

**Quick Win: Enable Lazy Loading on Below-Fold Images**
- *Description*: Implement native lazy loading (loading="lazy") on all images not in viewport, deferring image downloads until needed
- *Impact Score*: 4/5 (reduces initial load by 30-50%, improves LCP)
- *Effort Score*: 2/5 (2-3 hours template/component updates)
- *ROI*: 2.0 (impact/effort)
- *Core Web Vitals Impact*: LCP -300-600ms (by reducing initial payload)
- *Implementation Checklist*:
  - Add loading="lazy" to image tags in Optimizely templates
  - Set placeholder colors or low-quality image placeholders
  - Test on mobile and desktop
  - Verify images load on scroll
  - Monitor image loading performance
- *Dependencies*: Browser support (all modern browsers support native lazy loading)
- *Risks*: User scrolling may trigger late image loads; requires responsive image setup

**Strategic: Implement Modern Image Formats (WebP/AVIF)**
- *Description*: Configure CDN or image delivery service to serve WebP/AVIF formats to supporting browsers, with JPEG fallback for older browsers
- *Impact Score*: 4/5 (reduces image payload 30-50%, improves LCP 100-400ms)
- *Effort Score*: 2/5 (2-3 hours CDN configuration, template updates)
- *ROI*: 2.0 (impact/effort)
- *Core Web Vitals Impact*: LCP -100-400ms
- *Implementation Checklist*:
  - Enable WebP/AVIF support in CDN or image optimization service (Cloudinary, Imgix, etc.)
  - Update image tags to use <picture> element with multiple formats
  - Test browser fallback behavior
  - Monitor image format delivery and cache hits
  - Measure payload reduction
- *Dependencies*: CDN or image service that supports modern formats
- *Risks*: Old browser support may be incomplete; requires fallback strategy

**Strategic: Implement Responsive Image Sizing**
- *Description*: Generate multiple image sizes (srcset) for different device widths; browsers download appropriately-sized image for their viewport
- *Impact Score*: 4/5 (reduces mobile image payload 40-70%, improves LCP on mobile)
- *Effort Score*: 3/5 (4-6 hours template updates, CDN configuration)
- *ROI*: 1.33 (impact/effort)
- *Core Web Vitals Impact*: LCP -200-500ms (especially mobile)
- *Implementation Checklist*:
  - Generate multiple image sizes from Optimizely media library
  - Update templates to use srcset with breakpoints (320w, 640w, 1280w, etc.)
  - Define CDN image size generation rules
  - Test on various devices and viewport sizes
  - Monitor image delivery and bandwidth usage
- *Dependencies*: CDN that supports dynamic image sizing (or custom image service)
- *Risks*: Complex implementation; testing required on many device types

### 5. CDN Strategy and Configuration

**Current State Assessment**
- CDN provider: `_____` (Cloudflare / Akamai / Cloudfront / Other)
- Cache hit rate: `_____` % (target: > 90%)
- Origin shield enabled: Yes / No
- Cache purge strategy: Manual / Automatic / Hybrid
- Regional performance variance: `_____` ms difference
- Cache headers configuration: `_____`

**Performance Impact**
- Current TTFB with CDN: `_____` ms (average)
- TTFB without CDN (origin): `_____` ms
- CDN improvement: `_____` ms
- Geographic latency variance: `_____` ms

**Key Recommendations**

**Quick Win: Optimize Cache Headers for Static Assets**
- *Description*: Configure aggressive cache headers (max-age=1 year) for immutable assets (JS, CSS with content hashes); shorter TTLs for dynamic content
- *Impact Score*: 4/5 (improves repeat visit performance 50-70%, reduces origin load)
- *Effort Score*: 1/5 (30 minutes CMS/CDN configuration)
- *ROI*: 4.0 (impact/effort)
- *Core Web Vitals Impact*: FID/INP -200-400ms (via faster asset delivery), LCP -100-300ms
- *Implementation Checklist*:
  - Identify immutable assets (CSS, JS with content hashes)
  - Set cache headers via CMS configuration or CDN rules
  - Set short TTLs (5-60 minutes) for dynamic content
  - Test cache behavior with browser dev tools
  - Monitor cache hit rates by content type
- *Dependencies*: CDN or CMS-level cache header configuration
- *Risks*: Over-aggressive caching may cause stale content delivery

**Strategic: Implement Origin Shield Configuration**
- *Description*: Enable CDN origin shield to reduce origin traffic spikes and improve cache hit rates across edge locations
- *Impact Score*: 3/5 (reduces origin load 30-50%, improves resilience)
- *Effort Score*: 1/5 (15 minutes CDN configuration)
- *ROI*: 3.0 (impact/effort)
- *Core Web Vitals Impact*: TTFB -50-150ms (via reduced contention)
- *Implementation Checklist*:
  - Enable origin shield in CDN provider settings
  - Verify shield location proximity to origin
  - Test cache hit rate improvement
  - Monitor origin traffic reduction
- *Dependencies*: CDN provider must support origin shield (most modern CDNs do)
- *Risks*: Additional latency if shield location poorly chosen

**Strategic: Establish Automated Cache Purge on Publish**
- *Description*: Configure automatic CDN purge when content published in Optimizely, ensuring fresh content delivery without manual intervention
- *Impact Score*: 3/5 (improves content freshness, reduces staleness issues)
- *Effort Score*: 2/5 (2-3 hours integration development)
- *ROI*: 1.5 (impact/effort)
- *Core Web Vitals Impact*: Minimal direct impact (supports content freshness)
- *Implementation Checklist*:
  - Integrate Optimizely publish events with CDN API
  - Create webhook or API call to purge CDN on publish
  - Test purge timing and accuracy
  - Monitor cache refresh after publish
  - Implement fallback manual purge option
- *Dependencies*: Optimizely webhook support, CDN API integration
- *Risks*: Aggressive purging may reduce cache effectiveness; requires coordination with content team

### 6. Performance Monitoring and Alerting

**Current State Assessment**
- Monitoring tool: `_____` (Dynatrace / Application Insights / Other)
- Key metrics tracked: `_____`
- Alert thresholds set: Yes / No
- Performance regression detection: Manual / Automated
- RUM implementation: Yes / No
- Synthetic monitoring: Yes / No

**Key Recommendations**

**Quick Win: Set Up Core Web Vitals Alerting**
- *Description*: Configure alerts on Core Web Vitals (LCP, INP, CLS) to catch performance regressions early
- *Impact Score*: 3/5 (enables proactive problem detection)
- *Effort Score*: 1/5 (30 minutes monitoring tool configuration)
- *ROI*: 3.0 (impact/effort)
- *Implementation Checklist*:
  - Enable Core Web Vitals tracking in monitoring tool
  - Set alert thresholds (LCP > 2.5s, INP > 200ms, CLS > 0.1)
  - Configure alert notifications
  - Test alert triggering
- *Dependencies*: Monitoring tool with Core Web Vitals support
- *Risks*: Alert fatigue if thresholds set too aggressively

---

## SAAS CMS PERFORMANCE ANALYSIS

### 1. Content Graph Query Optimization

**Current State Assessment**
- Query count per page load: `_____` queries
- Average query execution time: `_____` ms
- Cached template queries: `_____` % (vs live queries)
- Query complexity (joins, filters): `_____`
- API call latency: `_____` ms average (p95: `_____` ms)
- Rate limiting incidents: `_____` per week

**Performance Impact**
- Content Graph contribution to TTFB: `_____` ms
- Live query impact: `_____` ms slower than cached queries
- Cumulative query time per page: `_____` ms

**Key Recommendations**

**Quick Win: Implement Cached Template Queries**
- *Description*: Move frequently-used queries to cached templates, loaded once at request time and reused vs making live API calls
- *Impact Score*: 5/5 (reduces API calls 60-80%, improves TTFB 200-600ms)
- *Effort Score*: 2/5 (2-3 hours query optimization and template refactoring)
- *ROI*: 2.5 (impact/effort)
- *Core Web Vitals Impact*: TTFB -200-600ms, LCP -100-400ms
- *Implementation Checklist*:
  - Identify high-frequency Content Graph queries
  - Create cached templates for common queries
  - Load cached templates at request time
  - Implement template cache invalidation on content updates
  - Test with production-like query volume
  - Monitor query reduction and latency improvement
- *Dependencies*: Content Graph and template caching capability
- *Risks*: Cached data may be stale between cache invalidation; requires cache key strategy

**Strategic: Optimize Content Graph Query Complexity**
- *Description*: Analyze queries for unnecessary joins, over-fetching fields, or inefficient filters; refactor to reduce API server processing
- *Impact Score*: 4/5 (reduces query latency 50-200ms)
- *Effort Score*: 3/5 (2-3 days query analysis and refactoring)
- *ROI*: 1.33 (impact/effort)
- *Core Web Vitals Impact*: TTFB -50-200ms
- *Implementation Checklist*:
  - Audit Content Graph queries for over-fetching
  - Implement GraphQL field selection (only request needed fields)
  - Remove unnecessary joins or relationships
  - Use Content Graph filter capabilities to reduce client-side filtering
  - Implement query result pagination for large result sets
  - Benchmark before/after query performance
- *Dependencies*: Content Graph query analysis tools
- *Risks*: Over-optimization may miss needed data; requires thorough testing

**Strategic: Implement API Response Caching Strategy**
- *Description*: Implement HTTP caching on Content Graph API responses via reverse proxy or CDN, reducing API calls
- *Impact Score*: 4/5 (reduces API load 40-70%)
- *Effort Score*: 2/5 (2-3 hours CDN/proxy configuration)
- *ROI*: 2.0 (impact/effort)
- *Core Web Vitals Impact*: TTFB -100-300ms
- *Implementation Checklist*:
  - Configure Content Graph API response caching headers
  - Set cache duration based on content change frequency
  - Implement cache purge on content updates
  - Monitor cache hit rates
- *Dependencies*: Reverse proxy or CDN with API caching capability
- *Risks*: Stale data if cache TTL too aggressive

### 2. Server-Side Template Caching

**Current State Assessment**
- Template caching enabled: Yes / No
- Cache hit rate: `_____` %
- Cache invalidation strategy: `_____`
- Template rendering time: `_____` ms average
- Template cache size: `_____` MB

**Key Recommendations**

**Quick Win: Enable Server-Side Template Caching**
- *Description*: Cache fully-rendered HTML templates for pages with low personalization variance, serving cached version to most users
- *Impact Score*: 4/5 (reduces server rendering 70-90%, improves TTFB)
- *Effort Score*: 1/5 (30 minutes CMS configuration)
- *ROI*: 4.0 (impact/effort)
- *Core Web Vitals Impact*: TTFB -300-800ms
- *Implementation Checklist*:
  - Identify cacheable templates (low personalization)
  - Enable template caching in CMS
  - Set cache duration based on content change frequency
  - Configure cache invalidation triggers
  - Monitor cache hit rates and memory usage
- *Dependencies*: SaaS CMS template caching capability
- *Risks*: Personalized content may be missed if caching too aggressive

### 3. Image Delivery Optimization for SaaS CMS

**Current State Assessment**
- Image optimization enabled: Yes / No
- CDN image delivery: `_____` (Optimizely native / Third-party)
- Image format support: WebP / AVIF / JPEG only (specify)
- Responsive image implementation: Yes / No
- Average image payload: `_____` KB

**Key Recommendations**

**Quick Win: Enable Optimizely Image Optimization Service**
- *Description*: Enable built-in Optimizely image optimization service to automatically compress, format, and deliver optimized images
- *Impact Score*: 4/5 (reduces image payload 40-60%, improves LCP)
- *Effort Score*: 1/5 (30 minutes SaaS CMS configuration)
- *ROI*: 4.0 (impact/effort)
- *Core Web Vitals Impact*: LCP -200-500ms
- *Implementation Checklist*:
  - Enable image optimization in Optimizely settings
  - Configure image format support (WebP, AVIF)
  - Set quality settings for lossy compression
  - Test image delivery and quality
  - Monitor image size reduction
- *Dependencies*: Optimizely SaaS CMS image service
- *Risks*: Aggressive compression may reduce image quality

---

## HEADLESS PERFORMANCE ANALYSIS

### 1. Server-Side Rendering (SSR) vs Static Site Generation (SSG) Strategy

**Current State Assessment**
- Current strategy: SSR / SSG / Hybrid
- Page generation time: `_____` ms average
- Build time (for SSG): `_____` minutes
- Cache hit rate: `_____` %
- Static pages count: `_____` / Total pages: `_____`

**Performance Impact**
- TTFB with current strategy: `_____` ms
- Potential TTFB with optimized strategy: `_____` ms

**Key Recommendations**

**Strategic: Evaluate SSG for High-Traffic Static Pages**
- *Description*: Migrate high-traffic, low-personalization pages from SSR to static site generation (SSG), building pages at publish time
- *Impact Score*: 5/5 (TTFB < 50ms for static pages, major improvement)
- *Effort Score*: 3/5 (2-3 days architecture review, implementation, testing)
- *ROI*: 1.67 (impact/effort)
- *Core Web Vitals Impact*: TTFB -1000-2000ms, LCP -500-1500ms
- *Implementation Checklist*:
  - Identify candidates for SSG (content pages, landing pages, blogs)
  - Implement incremental static regeneration (ISR) for revalidation
  - Configure build and deployment pipeline
  - Test build time and page generation
  - Monitor performance improvement
- *Dependencies*: Framework support for SSG/ISR (Next.js, Gatsby, etc.)
- *Risks*: Build time may increase; requires careful dependency planning

**Strategic: Implement Incremental Static Regeneration (ISR)**
- *Description*: Use ISR to revalidate and rebuild static pages in background when content updates, avoiding full rebuild
- *Impact Score*: 4/5 (enables dynamic content with static performance)
- *Effort Score*: 3/5 (2-3 days implementation)
- *ROI*: 1.33 (impact/effort)
- *Core Web Vitals Impact*: TTFB < 50ms, LCP < 1s (for ISR pages)
- *Implementation Checklist*:
  - Implement ISR revalidation endpoints
  - Configure content update webhooks to trigger revalidation
  - Set revalidation time windows
  - Test revalidation and stale content scenarios
  - Monitor build queue and revalidation performance
- *Dependencies*: Framework with ISR support (Next.js)
- *Risks*: Complex state management; stale content between revalidations

### 2. JavaScript Bundle Analysis and Optimization

**Current State Assessment**
- Total bundle size: `_____` KB (gzipped)
- Entry point size: `_____` KB
- Code splitting implemented: Yes / No
- Lazy loading chunks: `_____` % of code
- Third-party scripts: `_____` count
- Unused code: `_____` % estimated

**Performance Impact**
- Time to Interactive (TTI): `_____` ms
- First Contentful Paint (FCP): `_____` ms
- JavaScript parsing/execution time: `_____` ms

**Key Recommendations**

**Quick Win: Implement Code Splitting**
- *Description*: Split JavaScript bundle by route/page, loading only code needed for current page
- *Impact Score*: 4/5 (reduces initial bundle 60-80%, improves FCP)
- *Effort Score*: 2/5 (2-3 hours refactoring with framework support)
- *ROI*: 2.0 (impact/effort)
- *Core Web Vitals Impact*: FCP -300-600ms, LCP -200-400ms
- *Implementation Checklist*:
  - Identify route-specific code and dependencies
  - Implement dynamic imports for route handlers
  - Configure bundler (webpack, vite) code splitting rules
  - Test chunk loading on page navigation
  - Monitor bundle size per page
- *Dependencies*: Framework and bundler code splitting support
- *Risks*: Waterfall loading may increase time to interactive if chunk loading sequential

**Strategic: Remove Unused JavaScript and Dependencies**
- *Description*: Analyze bundle for unused code and unnecessary dependencies; remove to reduce payload
- *Impact Score*: 3/5 (reduces bundle 20-40%)
- *Effort Score*: 2/5 (2-3 hours analysis and cleanup)
- *ROI*: 1.5 (impact/effort)
- *Core Web Vitals Impact*: FCP -100-300ms, LCP -50-200ms
- *Implementation Checklist*:
  - Use source map analyzers (webpack-bundle-analyzer) to identify large modules
  - Find unused npm packages and remove
  - Tree-shake unused code via bundler configuration
  - Test feature completeness
  - Benchmark before/after bundle size
- *Dependencies*: Bundler tree-shaking support
- *Risks*: May accidentally remove used code; requires thorough testing

**Strategic: Optimize Third-Party Scripts**
- *Description*: Analyze third-party scripts (analytics, ads, chat) for performance impact; defer or remove non-critical scripts
- *Impact Score*: 4/5 (reduces FCP 100-500ms, improves INP)
- *Effort Score*: 2/5 (2-3 hours analysis and configuration)
- *ROI*: 2.0 (impact/effort)
- *Core Web Vitals Impact*: FCP -100-500ms, INP -50-200ms
- *Implementation Checklist*:
  - Inventory all third-party scripts (analytics, ads, chat, tracking)
  - Load non-critical scripts with defer or async
  - Lazy load scripts on user interaction (e.g., chat on click)
  - Use Web Worker or service worker for heavy processing
  - Monitor performance impact per script
- *Dependencies*: Third-party script control/configuration
- *Risks*: Deferring scripts may impact functionality; requires testing

### 3. Content Graph API Query Optimization

**Current State Assessment**
- Content Graph query count per page: `_____` queries
- Average query latency: `_____` ms
- Query complexity: `_____` (joins, filters)
- Cache hit rate: `_____` %
- Rate limiting incidents: `_____` per week

**Key Recommendations**

**Quick Win: Batch Content Graph Queries**
- *Description*: Combine multiple Content Graph queries into single GraphQL query to reduce API calls
- *Impact Score*: 4/5 (reduces API calls 50-70%, improves TTFB)
- *Effort Score*: 2/5 (2-3 hours query refactoring)
- *ROI*: 2.0 (impact/effort)
- *Core Web Vitals Impact*: TTFB -100-300ms, LCP -50-200ms
- *Implementation Checklist*:
  - Identify separate Content Graph queries on same page
  - Combine into single GraphQL query
  - Test combined query performance
  - Monitor API call reduction
- *Dependencies*: GraphQL batching capability
- *Risks*: Large combined queries may timeout; requires payload sizing

### 4. Image Delivery Optimization for Headless

**Current State Assessment**
- Image optimization service: `_____` (Vercel, Cloudinary, native, etc.)
- Image format support: WebP / AVIF / JPEG only (specify)
- Responsive images: Yes / No
- Average image size: `_____` KB
- Lazy loading: Yes / No

**Key Recommendations**

**Quick Win: Implement Image Component with Optimization**
- *Description*: Use framework image component (Next.js Image) that automatically optimizes, resizes, and lazily loads images
- *Impact Score*: 4/5 (reduces image payload 40-60%, improves LCP)
- *Effort Score*: 2/5 (2-3 hours component implementation)
- *ROI*: 2.0 (impact/effort)
- *Core Web Vitals Impact*: LCP -300-700ms
- *Implementation Checklist*:
  - Replace <img> tags with framework image component
  - Configure image sizing and breakpoints
  - Test responsive behavior on multiple devices
  - Monitor image optimization and delivery
- *Dependencies*: Framework with image component (Next.js Image)
- *Risks*: Legacy images may not optimize well; requires content migration

---

## DXP CLOUD INFRASTRUCTURE ANALYSIS

### 1. Container Sizing and Scaling

**Current State Assessment**
- Current container size: `_____` CPU / `_____` GB RAM
- Auto-scaling enabled: Yes / No
- Scale-up threshold: `_____` % CPU / `_____` % memory
- Scale-down threshold: `_____` % CPU / `_____` % memory
- Current replica count: `_____` (min: `_____`, max: `_____`)
- Peak load handling: `_____` requests/second

**Performance Impact**
- Current response time at peak: `_____` ms
- Container CPU usage: `_____` % average / `_____` % peak
- Memory utilization: `_____` % average / `_____` % peak
- Throttling incidents: `_____` per week

**Key Recommendations**

**Quick Win: Optimize Auto-Scaling Thresholds**
- *Description*: Tune auto-scaling thresholds to scale up earlier (before performance degrades) and scale down faster (reducing costs)
- *Impact Score*: 3/5 (improves peak performance reliability)
- *Effort Score*: 1/5 (30 minutes DXP Cloud configuration)
- *ROI*: 3.0 (impact/effort)
- *Implementation Checklist*:
  - Analyze historical CPU/memory usage patterns
  - Set scale-up threshold to 60% (earlier scale-up for buffer)
  - Set scale-down threshold to 30% (faster scale-down)
  - Test auto-scaling behavior under load
  - Monitor scaling responsiveness
- *Dependencies*: DXP Cloud auto-scaling configuration access
- *Risks*: Aggressive scaling may increase costs; requires load testing

**Strategic: Right-Size Container Resources**
- *Description*: Analyze actual resource usage and resize containers (CPU/RAM) to match workload, avoiding over/under-provisioning
- *Impact Score*: 3/5 (improves cost-efficiency and performance)
- *Effort Score*: 2/5 (2-3 hours analysis and testing)
- *ROI*: 1.5 (impact/effort)
- *Core Web Vitals Impact*: Minimal direct impact (secondary to reliability)
- *Implementation Checklist*:
  - Collect resource usage metrics over 2+ weeks
  - Analyze CPU and memory patterns
  - Calculate right-sized resource allocation
  - Update container resources in DXP Cloud
  - Monitor performance and adjust as needed
- *Dependencies*: DXP Cloud container management access
- *Risks*: Under-sized containers may cause performance issues; requires careful monitoring

### 2. Cache Layer Configuration

**Current State Assessment**
- Cache layer: Redis / Memcached / None
- Cache hit rate: `_____` %
- Cache size: `_____` GB
- Eviction policy: `_____`
- Memory pressure: `_____` %

**Key Recommendations**

**Strategic: Implement Distributed Caching (Redis)**
- *Description*: Deploy distributed cache (Redis) for session data, query results, and rendered templates across multiple container instances
- *Impact Score*: 4/5 (improves scalability, enables session persistence)
- *Effort Score*: 3/5 (2-3 days infrastructure setup, CMS integration, testing)
- *ROI*: 1.33 (impact/effort)
- *Core Web Vitals Impact*: TTFB -50-200ms (via faster cache retrieval)
- *Implementation Checklist*:
  - Deploy Redis cluster in DXP Cloud
  - Configure connection pooling from CMS
  - Migrate session storage to distributed cache
  - Test cache performance and failover
  - Monitor cache hit rates and memory usage
- *Dependencies*: DXP Cloud Redis support
- *Risks*: Network latency to cache; requires cache eviction strategy

---

## SCORING FRAMEWORK

### Impact Score (1-5)
- **1**: Minimal impact on Core Web Vitals or user experience
- **2**: Minor improvement, affects one metric or specific use case
- **3**: Moderate improvement, affects multiple users or metrics
- **4**: Significant improvement, major metric improvement (100-500ms)
- **5**: Transformative improvement, major metric improvement (500ms+)

### Effort Score (1-5)
- **1**: Quick configuration change, < 1 hour
- **2**: Configuration + testing, 1-3 hours
- **3**: Development + testing, 2-3 days
- **4**: Architecture change + development, 3-5 days
- **5**: Major architectural redesign, 5+ days

### ROI Calculation
ROI = Impact Score / Effort Score

---

## RECOMMENDATION PRESENTATION

### Quick Wins (ROI >= 2.0)
Recommendations that deliver high impact with minimal effort, ideal for immediate implementation.

**Quick Win Summary**
| Recommendation | Impact | Effort | ROI | TTFB Impact | Timeline |
|---|---|---|---|---|---|
| VPP Output Caching | 4 | 1 | 4.0 | -50-150ms | 30 mins |
| Fragment-Level Caching | 4 | 2 | 2.0 | -200-400ms | 2-3 hours |
| Lazy Loading Images | 4 | 2 | 2.0 | -300-600ms | 2-3 hours |
| ... | | | | | |

### Strategic Recommendations (ROI 1.0-2.0)
Recommendations requiring moderate effort with significant performance gains, suitable for sprint planning.

**Strategic Summary**
| Recommendation | Impact | Effort | ROI | TTFB Impact | Timeline |
|---|---|---|---|---|---|
| Smart Output Caching | 5 | 3 | 1.67 | -500-800ms | 1-2 days |
| VPP Query Refactoring | 4 | 3 | 1.33 | -100-300ms | 2-3 days |
| ... | | | | | |

### Architectural Recommendations (ROI < 1.0)
High-impact recommendations requiring significant architectural changes, suitable for future roadmap planning.

**Architectural Summary**
| Recommendation | Impact | Effort | ROI | TTFB Impact | Timeline |
|---|---|---|---|---|---|
| Implement Read Replica | 4 | 4 | 1.0 | -50-150ms | 2-3 days |
| SSG for Static Pages | 5 | 3 | 1.67 | -1000-2000ms | 2-3 days |
| ... | | | | | |

---

## INITIALIZATION SEQUENCE

1. Load baseline metrics from Step 1
2. Identify platform type (CMS 12, SaaS CMS, Headless)
3. Execute platform-specific deep-dive analysis
4. Generate scored recommendations for each dimension
5. Prioritize by ROI (impact/effort)
6. Create recommendation tiers
7. Prepare stakeholder presentation with A/P/C menu

## SUCCESS METRICS

- Analysis covers all applicable platform dimensions
- Minimum 10 actionable recommendations delivered
- All recommendations scored on impact and effort
- ROI calculated and prioritized
- Core Web Vitals impact estimated for all recommendations
- Quick Wins, Strategic, and Architectural tiers clearly separated
- Stakeholders have A/P/C decision menu for each tier
- Recommendations are production-ready and immediately actionable
- Implementation roadmap defined with dependencies

## FAILURE MODES

- Insufficient production data → Use synthetic benchmarks, escalate for monitoring setup
- Unclear recommendation prioritization → Require business value input from stakeholders
- Missing platform context → Escalate to technical team, document assumptions
- Conflicting recommendations → Present trade-offs, require business decision

## NEXT STEP

Present findings to stakeholders with A/P/C decision menu for each recommendation tier, then proceed to Step 3 (Documentation and Handoff) based on approved recommendations.
