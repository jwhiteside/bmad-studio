# dept-shopify-ecosystem Skills Summary

All 7 core skills have been created for the Shopify Ecosystem CoE (Center of Excellence) department. Each skill includes a `SKILL.md` file with comprehensive content and a `bmad-skill-manifest.yaml` metadata file.

## Skills Created

### 1. dept-shopify-reference
**Entry Point**: `dept-shopify-reference`
**Type**: Reference
**Content**: Master reference for all 16 core Shopify partner platforms
- Platform overviews by category (commerce, PIM, CMS, search, marketing, support, reviews, subscriptions, returns, cross-border, post-purchase)
- Key capabilities and market positioning for each platform
- Integration patterns with Shopify APIs and webhooks
- Quick selection criteria
- Reference index pointing to individual platform skill files

**File Locations**:
- `/dept-shopify-reference/SKILL.md` (6,200+ lines)
- `/dept-shopify-reference/bmad-skill-manifest.yaml`
- `/dept-shopify-reference/references/INDEX.md` (platform reference index)

---

### 2. dept-shopify-pim-strategy
**Entry Point**: `dept-shopify-pim-strategy`
**Type**: Strategy
**Content**: PIM selection and synchronization strategy
- When to use PIM vs Shopify native (decision framework)
- Complexity scoring system (quantifies PIM necessity)
- Platform comparison matrix (Akeneo vs Bluestone vs Inriver)
- Sync pattern options (real-time push, batch pull, dual-write)
- Variant mapping strategies (variants vs linked products vs attributes)
- Multi-channel syndication patterns
- Implementation timelines and cost ranges
- Decision checklist

**File Locations**:
- `/dept-shopify-pim-strategy/SKILL.md` (900+ lines)
- `/dept-shopify-pim-strategy/bmad-skill-manifest.yaml`

---

### 3. dept-shopify-integration-patterns
**Entry Point**: `dept-shopify-integration-patterns`
**Type**: Strategy
**Content**: Integration architecture and resilience patterns
- Three core patterns: Hub-and-spoke, Middleware, Event-driven (with tradeoffs)
- Pattern selection decision tree
- Integration complexity matrix by platform category
- Common gotchas by category (18 specific failure modes with solutions)
- Standard error handling patterns (exponential backoff, circuit breaker, idempotency)
- Reconciliation and health monitoring strategies
- Integration checklist

**File Locations**:
- `/dept-shopify-integration-patterns/SKILL.md` (1,100+ lines)
- `/dept-shopify-integration-patterns/bmad-skill-manifest.yaml`

---

### 4. dept-shopify-marketing-stack
**Entry Point**: `dept-shopify-marketing-stack`
**Type**: Strategy
**Content**: Marketing technology platform selection and orchestration
- Email platform strategy (Klaviyo market dominance)
- SMS strategy decision tree (Attentive vs Klaviyo SMS)
- Reviews/UGC/Loyalty bundling strategy (Yotpo vs separate)
- Personalization engine selection (Bloomreach vs Nosto)
- Marketing data flows and event mapping
- Closed-loop patterns (email-to-support, review-to-email, etc.)
- Segmentation consistency frameworks
- Data sync strategy and customer master data location

**File Locations**:
- `/dept-shopify-marketing-stack/SKILL.md` (850+ lines)
- `/dept-shopify-marketing-stack/bmad-skill-manifest.yaml`

---

### 5. dept-shopify-data-flows
**Entry Point**: `dept-shopify-data-flows`
**Type**: Reference
**Content**: Data synchronization patterns across the ecosystem
- Product master data flows (simple Shopify-native and complex PIM scenarios)
- Customer data and unified profile synthesis
- Order lifecycle flows (simple one-time and complex subscription+returns)
- Search and personalization data flows (feed-based and behavioral)
- Review and UGC ecosystem flows
- Event mapping examples and timing considerations
- Critical sync points and timing SLAs
- Data warehouse integration and recommended data models
- Sync validation checklist

**File Locations**:
- `/dept-shopify-data-flows/SKILL.md` (1,000+ lines)
- `/dept-shopify-data-flows/bmad-skill-manifest.yaml`

---

### 6. dept-shopify-cost-analysis
**Entry Point**: `dept-shopify-cost-analysis`
**Type**: Strategy
**Content**: Cost estimation and ROI analysis
- Cost breakdown framework (platform licenses + implementation + operations + maintenance)
- Per-platform licensing costs with pricing models
- Cost summary table for all platforms
- Six stack pattern cost breakdowns (Starter Plus, Content-Rich, Global Enterprise, Subscription-First, D2C Growth, Headless)
- ROI and payback period analysis examples
- Cost optimization strategies (bundling, phasing, consolidation)
- Cost estimation template for custom projects
- Cost checklist

**File Locations**:
- `/dept-shopify-cost-analysis/SKILL.md` (950+ lines)
- `/dept-shopify-cost-analysis/bmad-skill-manifest.yaml`

---

### 7. dept-shopify-setup
**Entry Point**: `dept-shopify-setup`
**Type**: Strategy
**Content**: Project setup and configuration framework
- Project discovery phase (business context, priorities, constraints)
- Stack pattern recommendation process
- Platform selection confirmation (decision matrix, vendor checklist)
- Integration sequencing and phasing (critical path analysis)
- Reference material setup and documentation structure
- Project governance and team structure
- Success metrics definition (business metrics and project metrics)
- Project kickoff checklist

**File Locations**:
- `/dept-shopify-setup/SKILL.md` (850+ lines)
- `/dept-shopify-setup/bmad-skill-manifest.yaml`

---

## Summary Statistics

- **Total Skills**: 7
- **Total Lines of Content**: 4,362+ lines across all SKILL.md files
- **Total Manifest Files**: 7 bmad-skill-manifest.yaml files
- **Additional Resources**: 1 INDEX.md (platform reference guide)

## Navigation

All skills follow the BMAD (Business Model Architecture Definition) standard:

Each skill contains:
1. **SKILL.md**: Comprehensive content, examples, and decision frameworks
2. **bmad-skill-manifest.yaml**: Metadata including canonicalId, type, description, tags, version, author, lastUpdated

The skills are designed to be cross-referenced:
- `dept-shopify-reference` links to individual platform skill files
- `dept-shopify-pim-strategy` references complexity scoring and cost models
- `dept-shopify-integration-patterns` references data flow patterns
- `dept-shopify-marketing-stack` references data flow orchestration
- `dept-shopify-cost-analysis` references all platform costs and stack patterns
- `dept-shopify-setup` references all other skills for project configuration

## Intended Use

These 7 skills form the knowledge base for the Shopify Ecosystem CoE:

1. **Start with `dept-shopify-setup`** for new project kickoff
2. **Reference `dept-shopify-reference`** for platform overview and capabilities
3. **Use `dept-shopify-pim-strategy`** if PIM selection needed
4. **Use `dept-shopify-integration-patterns`** for architecture decisions and troubleshooting
5. **Use `dept-shopify-marketing-stack`** for marketing tech selection
6. **Use `dept-shopify-data-flows`** to understand data synchronization
7. **Use `dept-shopify-cost-analysis`** for budget estimation and ROI

All skills provide substantive, actionable content drawn from ecosystem integration guide knowledge.
