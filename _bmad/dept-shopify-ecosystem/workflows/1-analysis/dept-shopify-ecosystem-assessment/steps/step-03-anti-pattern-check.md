# Step 3: Anti-Pattern Analysis

## Objective

Systematically evaluate the current stack (or proposed stack) against 6 common anti-patterns that create technical debt, operational friction, and scalability issues. Identify which anti-patterns are present and their severity.

## Instructions

For each of the 6 anti-patterns below, perform a structured evaluation:

### Anti-Pattern 1: Over-Tooling

**Definition**: Adding platforms or tools when existing platforms could handle the requirement, creating unnecessary complexity, cost, and maintenance burden.

**Evaluation Questions**:
- Are there redundant platforms serving similar functions (e.g., multiple analytics tools, multiple PIM-like systems)?
- Are there platforms being used for only 1-2 features that could be handled by an existing platform?
- Is there unnecessary data duplication across multiple platforms?
- Has the cost of managing tool sprawl become prohibitive?

**Severity Scoring** (1-5, where 5 is critical):
- Document each redundant platform and estimated cost/complexity impact
- Identify which redundant platforms could be consolidated

### Anti-Pattern 2: Data Silos

**Definition**: Platforms that don't communicate, creating disconnected data sources, manual workarounds, and single source of truth conflicts.

**Evaluation Questions**:
- Are there platforms that operate in isolation with no integrations?
- Is critical business data maintained in multiple places without sync (e.g., customer data in CRM AND spreadsheet)?
- Are manual exports/imports used to move data between systems?
- Do different departments maintain conflicting versions of truth (product data, customer data, etc.)?

**Severity Scoring** (1-5):
- Identify specific data silos and business impact (missed insights, operational friction, compliance risk)

### Anti-Pattern 3: Personalization Conflicts

**Definition**: Multiple personalization engines or targeting systems competing, overriding, or conflicting with each other.

**Evaluation Questions**:
- Are there multiple personalization/segmentation tools active simultaneously?
- Do different channels use conflicting personalization rules?
- Is there customer tracking fragmentation (different IDs across systems)?
- Are A/B test results contradicted by different testing platforms?

**Severity Scoring** (1-5):
- Document conflicting personalization systems and business impact

### Anti-Pattern 4: Integration Debt

**Definition**: Integrations that are fragile, unmaintained, or held together by workarounds, creating brittleness and operational toil.

**Evaluation Questions**:
- Are there integrations that regularly fail and require manual intervention?
- Is there custom code maintaining integrations that the original developer has left?
- Are there integrations that haven't been reviewed or updated in 2+ years?
- Is integration monitoring inadequate (failures go unnoticed until business impact)?
- Are there undocumented integrations?

**Severity Scoring** (1-5):
- Identify fragile integrations, failure frequency, and business impact
- Estimate remediation effort

### Anti-Pattern 5: Conflicting Segmentation

**Definition**: Multiple customer segmentation schemes (in different platforms) that conflict and create customer targeting confusion.

**Evaluation Questions**:
- Are there multiple segmentation tools or platforms?
- Do segments defined in one system conflict with segments in another?
- Is there segment naming confusion (same name, different definition)?
- Are there customer groups that can't be aligned across platforms?

**Severity Scoring** (1-5):
- Document conflicting segmentation approaches and impact on marketing/operations

### Anti-Pattern 6: Unmanaged Proliferation

**Definition**: New platforms, tools, and integrations being added without governance, creating sprawl and configuration chaos.

**Evaluation Questions**:
- Are there new tools being added without IT/architecture review?
- Is there a formal change control process for platform changes?
- Are unused or "dark" platforms (installed but forgotten) in the stack?
- Is the total platform count growing unchecked?

**Severity Scoring** (1-5):
- Document governance gaps and platform sprawl momentum

## Inputs

- Current stack inventory (from Step 2)
- Integration map and data flows
- Team feedback on pain points
- Cost documentation

## Outputs

- Anti-pattern assessment document with:
  - Each anti-pattern evaluated (1-3 sentences)
  - Severity score (1-5)
  - Specific examples from current stack
  - Estimated business impact
  - Remediation recommendations (high-level)

## Completion Criteria

- All 6 anti-patterns evaluated
- Severity scoring completed with justification
- Specific examples cited from current stack
- Team validates assessment accuracy
- Business impact articulated for each significant anti-pattern
