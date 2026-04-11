---
step: 1
name: Audit and Model Discovery
workflow: dept-opti-migration-plan
status: pending
---

# Step 1: Audit and Model Discovery

## MANDATORY EXECUTION RULES

1. **All inputs loaded and validated**:
   - Source audit report complete
   - Content model approved
   - Architecture decisions documented
   - Target platform confirmed

2. **Migration context documented**:
   - Source platform and current state
   - Target platform and deployment approach
   - Integration dependencies
   - Resource capacity

3. **Migration plan document created** before moving to step-02

## EXECUTION PROTOCOLS

### Phase A: Input Validation (20 minutes)

**Load source audit report**:
- Verify all content types catalogued
- Confirm volume counts
- Note quality assessments and complexity scores
- Identify strategic recommendations (cleanup, consolidation)

**Load approved content model**:
- Confirm all target types defined
- Verify attributes per type
- Check relationships documented
- Ensure platform validation complete

**Load architecture decisions**:
- Confirm integration architecture (APIs, webhooks)
- Verify Commerce sync pattern
- Check asset management strategy
- Note deployment environment setup

**Load technical architecture**:
- Confirm platform choice (CMS 12 or SaaS CMS)
- Verify deployment environment (Dev, Staging, Prod)
- Note CD/CI pipeline approach
- Check security/auth patterns

### Phase B: Migration Context Documentation (20 minutes)

**Current state inventory**:
```markdown
## Migration Context

### Source System
- Platform: [WordPress/Drupal/Sitecore/etc]
- Content Volume: [X types, Y total items]
- Languages: [EN, FR, DE, etc]
- Assets: [Z total, size estimate]
- Quality: [distribution across Gold/Silver/Bronze/Lead]
- Complexity: [distribution across XS/S/M/L/XL]
- Data Residency: [current hosting location]
- Access: [admin level access available?]

### Target System
- Platform: Optimizely [CMS 12 or SaaS CMS]
- Content Model: [approved model reference]
- Hosting: [DXP Cloud or other]
- Data Residency: [target region]
- Integrations: [Commerce, CRM, Analytics, etc]

### Migration Approach
- Strategy: [phased by waves vs bulk]
- Timing: [target go-live date]
- Team: [content ops lead, volume, availability]
- Tools: [migration scripts, bulk import APIs, manual]
- Validation: [approach to verify success]
```

### Phase C: Target Platform Confirmation (10 minutes)

Detect and confirm target platform (should be known from architecture):

**If target is CMS 12**:
- Document PageData/BlockData model alignment with content types
- Note ContentArea composition approach
- Confirm language variant structure

**If target is SaaS CMS**:
- Document flat content type model
- Note section organization
- Confirm language variant support

Document platform decision in migration context.

### Phase D: Migration Plan Document Initialization (15 minutes)

Create migration plan document:

```markdown
---
project: [project name]
status: in-progress
stepsCompleted: 1
date_created: [today]
sourcePlatform: [from audit]
targetPlatform: [CMS 12 or SaaS CMS]
estimatedStart: [week X of build phase, typically week 7]
estimatedGo-Live: [target date, typically week 22 of timeline]
contentOpsLead: [name]
migrationManager: [name]
---

# Migration Plan

**Project**: [project name]
**Source**: [platform]
**Target**: Optimizely [platform choice]
**Timeline**: Weeks [X] - [Y] (approximately [duration] weeks)

## Overview

Phased content migration plan from [source] to Optimizely [platform].

---

## Section 1: Migration Context (COMPLETED IN STEP-01)

[Include context from phases above]

---

## Section 2: Content Model Mapping

*To be completed in step-02*

## Section 3: Migration Wave Plan

*To be completed in step-03*

---

**Next Step**: Content Model Mapping (step-02)
```

Save and share document with stakeholders.

## CONTEXT BOUNDARIES

- **In scope**: Loading inputs, understanding context, initializing plan document
- **Out of scope**: Mapping content types (that's step-02), planning waves (that's step-03)
- **Not your task**: Executing migration; just planning it

## YOUR TASK

1. Load and validate source audit report
2. Load and validate content model
3. Load and validate architecture decisions
4. Document migration context (current state, target, approach)
5. Confirm target platform
6. Create migration plan document with frontmatter
7. Confirm step-01 complete and move to step-02

## SUCCESS METRICS

- [x] All inputs loaded and validated
- [x] Source audit verified (types, volumes, quality)
- [x] Content model approved and confirmed
- [x] Architecture decisions available and understood
- [x] Target platform confirmed
- [x] Migration context documented (source, target, approach)
- [x] Migration plan document created with frontmatter
- [x] Document shared with team
- [x] Step count incremented to 1
- [x] Next step is clearly step-02 (Content Model Mapping)

## NEXT STEP

Once step-01 complete:
- Move to **step-02-model-mapping.md**
- Map each source type to target type(s)
- Define field transformation rules
- Gate any mismatches or complex transforms
- Output: Complete source-to-target mapping table

---

**Step 1 Status**: [PENDING → IN PROGRESS → COMPLETE]

Update frontmatter `status: complete` and `stepsCompleted: 1` when done.
