# Step 5: Gap Analysis

## Objective

Identify gaps between current state (if assessing existing ecosystem) and recommended target pattern. Produce a prioritized list of what needs to be added, removed, or changed.

## Instructions

For greenfield assessments (new ecosystem), focus on identifying all platforms needed for the recommended pattern.

For existing ecosystem assessments, identify deltas between current state and target pattern.

### Current State vs. Target State Comparison

#### Platforms Required by Target Pattern

List all platforms required by the recommended pattern across these categories:

**Core Platform**:
- Ecommerce platform (Shopify Plus, headless variation, etc.)

**Product Management**:
- PIM system (if needed by pattern)
- Digital asset management
- Product content platform

**Customer Data**:
- CDP or customer data platform
- CRM system
- Analytics/BI platform

**Marketing & Engagement**:
- Email marketing (Klaviyo, Iterable, etc.)
- Marketing automation
- Personalization engine (if needed)
- SMS platform
- Loyalty program platform

**Operations & Fulfillment**:
- Order management system
- Inventory management
- Fulfillment platform
- Returns management
- Subscription management (if applicable)

**Data & Integration**:
- API gateway or middleware
- ETL/data pipeline platform
- Event streaming (if applicable)

**Analytics & Reporting**:
- Analytics platform (GA4, etc.)
- BI/reporting tool
- Custom dashboard solution

#### For Each Platform Category

1. **Target platform** (what the pattern recommends)
2. **Current platform** (what you have, if any)
3. **Gap type**:
   - MISSING: No platform in place
   - REPLACE: Current platform doesn't fit pattern
   - ENHANCE: Current platform suitable but needs optimization/integration
   - REDUNDANT: Current platform should be removed
4. **Urgency** (Phase 1, Phase 2, or Phase 3+)
5. **Business impact** of gap (revenue risk, operational friction, capability gap)
6. **Implementation effort** (low, medium, high)

### Prioritization Framework

For each gap, assess:

**Business Criticality** (1-5):
- Does this gap block core business process?
- Is there a revenue or compliance impact?
- Is customer experience affected?

**Implementation Complexity** (1-5):
- How complex is the platform implementation?
- How deep are integrations required?
- How much data migration is required?

**Dependencies** (1-5):
- How many other platforms depend on this?
- Must this be done before other work?
- Does this unblock other initiatives?

**Priority Score** = (Business Criticality × 3) + (Dependencies × 2) - (Complexity × 1)

Rank all gaps by priority score.

### Gap Categories

**Phase 1: Critical Path** (Priority Score 12+)
- Gaps that must be addressed before go-live
- Gaps that unblock other work
- Gaps with high business criticality

**Phase 2: Core Build** (Priority Score 8-11)
- Important capabilities needed shortly after go-live
- Medium complexity, can be phased
- Support key business processes

**Phase 3: Enhancement** (Priority Score 0-7)
- Nice-to-have or nice-to-optimize
- Lower urgency
- Can be deferred post-launch

### Anti-Pattern Remediation

For each anti-pattern identified in Step 3 (if conducting existing stack assessment):
1. Does the target pattern eliminate this anti-pattern?
2. If not, what specific platform changes are required?
3. Add remediation gaps to prioritized list

## Inputs

- Business profile and recommended pattern (from Steps 1 and 4)
- Current stack inventory (from Step 2, if applicable)
- Anti-pattern assessment (from Step 3, if applicable)

## Outputs

- Gap analysis document with:
  - Current vs. target platform comparison table
  - Detailed gap descriptions (50-100 words each)
  - Priority scores for each gap
  - Phase assignment (1, 2, 3+)
  - Estimated implementation timeline per phase

## Completion Criteria

- All platform categories covered (product, customer data, marketing, operations, data/integration, analytics)
- Each gap assigned urgency/phase
- Gaps prioritized by business impact + dependencies - complexity
- Phase 1 items clearly identified as critical path
- Estimated timelines realistic and validated with technical team
