# Step 3: Anti-Pattern Analysis

## Objective

Systematically evaluate the current ecosystem for the 6 common anti-patterns that create technical debt, operational friction, and cost burden.

## Instructions

This step mirrors the anti-pattern analysis from the Ecosystem Assessment workflow, but applied to existing ecosystem with actual data and observations.

### Anti-Pattern Assessment

For each of the 6 anti-patterns, document:

**Anti-Pattern 1: Over-Tooling**
- Are there redundant platforms with overlapping functionality?
- Examples: Multiple analytics tools, multiple email marketing platforms, etc.
- Estimated cost impact: $X/year
- Complexity impact: Maintain X additional platforms
- Recommendation: Consolidate to [primary platform] and retire [platforms to eliminate]

**Anti-Pattern 2: Data Silos**
- Which critical data is not being synced between systems?
- Examples: Customer data, product data, order data that exists in multiple systems
- Business impact: Team A uses data from System 1, Team B uses System 2; conflicts cause
- Data discrepancy frequency: X times per month teams discover conflicts
- Recommendation: Implement integration between [systems] to [outcome]

**Anti-Pattern 3: Personalization Conflicts**
- Are there multiple personalization engines active simultaneously?
- Are channel-specific personalization rules conflicting?
- Customer experience impact: [Description of conflict]
- Recommendation: Standardize on [platform] for all personalization

**Anti-Pattern 4: Integration Debt**
- How many integrations have not been reviewed in 2+ years?
- Which integrations have custom code that original developer no longer maintains?
- Integration failure frequency: X failures per month
- How much manual intervention is required? X hours/week
- Recommendation: Migrate to [new integration approach] to [outcome]

**Anti-Pattern 5: Conflicting Segmentation**
- Are there multiple customer segmentation tools defining different segments?
- Segment naming conflicts: [Examples]
- Impact on marketing campaigns: [Description]
- Recommendation: Adopt [primary segmentation platform] as system of record

**Anti-Pattern 6: Unmanaged Proliferation**
- Are new platforms being added without governance?
- Are there "shadow IT" tools being used without formal approval?
- Platforms added in last 12 months: X (with governance? Yes/No for each)
- Unused/dark platforms that could be retired: [List]
- Recommendation: Implement [governance process] to control future additions

### Anti-Pattern Severity Matrix

| Anti-Pattern | Present? | Severity (1-5) | Cost Impact | Operational Impact | Business Impact |
|---|---|---|---|---|---|---|
| Over-Tooling | Yes/No | N | $X/yr | X hrs/week maint | Increased costs, complexity |

### Anti-Pattern Health Score

Calculate ecosystem anti-pattern health:
- Anti-pattern health score = 30 - (sum of severity scores across all 6 patterns)
- Score 25-30: Healthy (minimal anti-patterns)
- Score 18-24: Requires attention (multiple anti-patterns present)
- Score <18: Critical (severe anti-pattern issues)

## Inputs

- Platform inventory and satisfaction data (from Step 1)
- Integration health assessment (from Step 2)
- Team feedback on pain points and operational friction
- Cost documentation

## Outputs

- Anti-pattern assessment document with each pattern evaluated
- Anti-pattern severity matrix
- Anti-pattern health score
- Anti-pattern remediation recommendations (priorities to fix first)

## Completion Criteria

- All 6 anti-patterns evaluated against actual current state
- Specific examples and impact quantified
- Severity scored with justification
- Anti-pattern health score calculated
- Remediation priorities identified
- Team validates assessment
