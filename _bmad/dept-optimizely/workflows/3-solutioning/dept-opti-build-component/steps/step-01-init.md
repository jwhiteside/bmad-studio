# step-01-init: Initialize and Requirements Discovery

## MANDATORY EXECUTION RULES

1. **Search Before Building:** Always check if component already exists in codebase before proceeding to implementation. Avoid duplicate efforts.
2. **Requirements Clarity:** Confirm requirements are SMART (Specific, Measurable, Agreed, Realistic, Time-bound). If vague, halt and request clarification.
3. **Platform Declaration:** Explicitly declare target platform (CMS 12 or SaaS CMS) before design phase.
4. **Environment Readiness:** Verify all development tools and access are available before proceeding to step-02.
5. **Documentation First:** Create initialization document as single source of truth for this component's development.

## EXECUTION PROTOCOLS

### Phase: Initialization
**Role:** Solution Architect or Lead Developer
**Inputs:** Component requirements document from dept-opti-requirements
**Duration:** 2–4 hours
**Output:** Initialization document with requirements summary, platform decision, dev environment checklist

### Entry Conditions
- Component requirements document is complete and signed off by stakeholders
- Development team is assembled (developer, QA, accessibility reviewer)
- CMS 12 or SaaS CMS environment is available for development
- Design system and coding standards are accessible

### Exit Conditions
- Component does not already exist in codebase (search completed)
- Requirements are clear and unambiguous
- Target platform is declared (CMS 12 or SaaS CMS)
- Development environment is ready for step-02

## CONTEXT BOUNDARIES

| Boundary | Scope |
|----------|-------|
| **Existing Search** | Search across all branches and repositories for similar components; if found, escalate decision to architect |
| **Requirements Validation** | Confirm each requirement is testable and specific; reject vague requirements like "user-friendly" without metrics |
| **Platform Decision** | Cannot proceed with mixed platform requirements; component is single-platform |
| **Dev Environment** | Minimal tooling required for step-02; can be basic IDE + CLI tools |

Out of scope: Detailed design decisions (move to step-02), stakeholder alignment on business metrics (assume requirements are pre-approved), infrastructure provisioning (assume environment exists).

## YOUR TASK

Complete the following actions in sequence. Do not skip any step, and pause before moving to step-02 if any blockers are identified.

### A. Search for Existing Implementations

**Action:** Search the codebase for existing components with similar names, purposes, or functionality.

**Search scope:**
- Component name (exact match and partial)
- Business purpose (e.g., "feature block", "hero banner", "testimonial")
- Content model patterns (e.g., "ContentArea with images")
- Related components that might conflict or duplicate

**Search methods:**
- GitHub/GitLab advanced search: repository code search by component class name
- IDE full-text search across all branches
- Documentation search (component catalogue, ADRs)
- Team knowledge base or Confluence pages

**Example search query (CMS 12):**
```
repo: cms-components path: Models
FeatureBlock OR "Feature Block"
```

**Output:** Search results document with:
- [ ] Component exists: NAME, LOCATION, LAST MODIFIED, OWNER CONTACT
- [ ] Similar component found: COMPARISON, REUSE POTENTIAL
- [ ] No existing component: Clear to proceed

**Decision gate:**
- If exact match found → Halt workflow; escalate to architect for decision (merge, refactor, or abandon)
- If similar found → Document for reuse discussion; proceed with approval
- If none found → Continue to section B

### B. Gather and Validate Requirements

**Action:** Extract requirements from the component requirements document and validate clarity.

**Required information (minimum):**
1. **Component name:** Display name, identifier (kebab-case for SaaS, PascalCase for CMS 12)
2. **Business purpose:** One sentence describing what authors use this component for
3. **Content fields:** List each field with:
   - [ ] Field name (identifier)
   - [ ] Data type (String, RichText, Image, ContentReference, etc.)
   - [ ] Required or optional
   - [ ] Validation rules (length, range, allowed values)
   - [ ] Author instructions (e.g., "max 100 characters for SEO title")
4. **Content relationships:** If component references other content:
   - [ ] Parent content type (which page types can contain this block?)
   - [ ] Allowed child content types (what can go inside ContentArea?)
   - [ ] Multiplicity (one-to-one, one-to-many, many-to-many)
5. **Display variations:** Does component have variants (e.g., dark theme, compact view)?
6. **Business metrics:** How will success be measured (author time saved, engagement rate, conversion)?

**Validation checklist:**
- [ ] Each requirement is specific and testable (not "user-friendly")
- [ ] All fields are named clearly (no ambiguous abbreviations)
- [ ] Validation rules are realistic (e.g., min 10 chars is better than min 1 char)
- [ ] Business owner has reviewed and approved

**Output:** Requirements validation report with:
- [ ] All required information present and clear
- [ ] Any gaps or ambiguities identified
- [ ] Signature from business stakeholder confirming sign-off

If gaps exist → **Halt here**. Return to business stakeholder and request clarification before proceeding.

### C. Determine Target Platform

**Action:** Declare the target CMS platform for this component.

**Decision tree:**

```
Q: Does the organisation run Episerver CMS 12 (traditional .NET stack)?
├─ YES → CMS 12 PATH
│        - C# PageData/BlockData class
│        - MVC controller (optional)
│        - .cshtml Razor view
│        - Server-side validation
│        └─ Move to step-02 with CMS 12 template
├─ NO
└─ Q: Does the organisation run Optimizely SaaS CMS (cloud-based, headless)?
   ├─ YES → SAAS CMS PATH
   │        - Content type (via CLI or REST API)
   │        - React functional component
   │        - Content Graph query
   │        - Client-side rendering or SSR
   │        └─ Move to step-02 with SaaS template
   └─ Q: Unsure which platform?
      └─ Halt here. Escalate to architect.
         Proceeding without platform clarity risks rework.
```

**Output:** Platform declaration in initialization document:
- [ ] **Platform:** CMS 12 | SaaS CMS
- [ ] **Reasoning:** Environment available, team skill match, business timeline
- [ ] **Key constraints:** (e.g., CMS 12: must support .NET Framework 4.7.2; SaaS: must use React 18+)

### D. Create Development Environment Checklist

**Action:** Verify the development environment is ready for step-02 (content model design).

**For CMS 12:**
- [ ] VS Code or Visual Studio 2022 installed
- [ ] C# extension (VS Code) or project loaded in Visual Studio
- [ ] NuGet packages available (Optimizely CMS, EPiServer.Core)
- [ ] Git branch for development is ready
- [ ] Team has access to target Episerver environment (dev, test, prod)
- [ ] Code review process is documented (pull request template, reviewers assigned)
- [ ] Testing framework available (MSTest or NUnit)
- [ ] Accessibility testing tools available (axe-core, NVDA/JAWS)

**For SaaS CMS:**
- [ ] Node.js 18 LTS or higher installed
- [ ] Code editor ready (VS Code recommended)
- [ ] Optimizely Content Cloud CLI installed and authenticated
- [ ] Content Graph credentials available (SingleKey for delivery, HMAC for preview)
- [ ] Git branch for development is ready
- [ ] Next.js or React framework project initialised (if headless)
- [ ] Jest and React Testing Library available
- [ ] Accessibility testing tools available (axe-core, automated + manual)

**Output:** Environment readiness checklist with:
- [ ] All tools confirmed installed
- [ ] Access credentials tested (can authenticate to CMS and Content Graph)
- [ ] Team members confirmed ready to proceed
- [ ] Any blockers identified and escalated

**Decision gate:**
- If any critical tool missing → Halt and request provisioning
- If all tools ready → Proceed to step-02

### E. Document Initialization Context

**Action:** Create the initialization document that will guide step-02 through step-04.

**Document structure (Markdown template):**

```markdown
# Component Initialization Document

**Component Name:** [Display name]
**Identifier:** [kebab-case or PascalCase]
**Platform:** CMS 12 | SaaS CMS
**Created:** [Date]
**Owner:** [Name, email]

## Requirements Summary
[1–2 paragraphs describing component purpose and business value]

### Fields
| Field Name | Type | Required | Validation | Notes |
|------------|------|----------|------------|-------|
| [name] | String/RichText/Image/Ref | Yes/No | Min 10 chars | Author instructions |

### Content Relationships
- Parent: [Which page types can contain this?]
- Children: [What content types can go inside?]
- Multiplicity: [1-1, 1-N, etc.]

### Display Variations
- [ ] Variant 1: [Name, description]
- [ ] Variant 2: [Name, description]

### Business Metrics
- Success measure: [How will we know this component is working?]
- Target: [Quantifiable target, e.g., "50% reduction in author time for hero section"]

## Platform Decision

**Target Platform:** CMS 12 | SaaS CMS

**Reasoning:** [1–2 sentences explaining why this platform is chosen]

**Key Constraints:** [List any environment or tooling constraints]

## Existing Components Search

**Search completed:** [Date]

**Results:**
- [ ] No existing component with this name found
- [ ] Similar components identified:
  - Component A: [Comparison, reuse potential]
  - Component B: [Comparison, reuse potential]
- [ ] Exact match found: [NAME, LOCATION, ESCALATION PENDING]

## Development Environment Checklist

**CMS 12:**
- [ ] VS Code / Visual Studio 2022
- [ ] Episerver CMS 12 NuGet packages
- [ ] Git branch ready
- [ ] MSTest or NUnit framework
- [ ] axe-core + NVDA/JAWS

**SaaS CMS:**
- [ ] Node.js 18 LTS
- [ ] Optimizely CLI installed and authenticated
- [ ] Content Graph credentials (SingleKey + HMAC)
- [ ] Jest + React Testing Library
- [ ] axe-core + manual testing setup

**Status:** Ready | Blocked [describe blocker]

## Next Step

→ Proceed to step-02-content-model: Design content model

**Approval Required:** Solution Architect signature [     ]
**Date Approved:** [Date]
```

**Output:** Completed initialization document saved to project repository with approval signature.

## INITIALIZATION SEQUENCE

1. Start: Receive component requirements document
2. Search existing implementations (section A)
   - If found: escalate and halt
   - If not found: continue
3. Validate requirements (section B)
   - If unclear: request clarification and halt
   - If clear: continue
4. Determine platform (section C)
   - If unclear: escalate to architect and halt
   - If clear: continue
5. Create dev environment checklist (section D)
   - If blockers: request provisioning and halt
   - If ready: continue
6. Document initialization context (section E)
   - Obtain architect signature
7. Proceed to step-02: **Content Model Design**

## SUCCESS METRICS

| Metric | Pass Criteria | Validation |
|--------|--------------|-----------|
| No duplicate component | Search completed with no exact match | Search results document shows clear |
| Requirements clear | All SMART criteria met, business sign-off | Requirements validation report approved |
| Platform declared | CMS 12 or SaaS CMS chosen | Platform decision section completed |
| Environment ready | All dev tools available and tested | Environment checklist shows all items checked |
| Context documented | Initialization document complete and signed | Document saved to repository with approval |

## FAILURE MODES

| Failure | Cause | Recovery |
|---------|-------|----------|
| Component already exists | Duplicate effort starting | Escalate to architect; discuss reuse, refactoring, or abandonment |
| Requirements vague (e.g., "user-friendly") | Business did not provide specifics | Halt; schedule discovery session with business stakeholder |
| Platform unclear (mixed requirements) | Stakeholders expect CMS 12 AND SaaS support | Halt; explain single-platform boundary; choose primary platform and defer secondary to future |
| Dev environment blocked | Missing tools or access | Halt; request IT provisioning; include in step-02 blockers list |
| Initialization document unsigned | Architect not engaged | Halt; escalate to architect for review and sign-off before step-02 |

## NEXT STEP

Once all items in "Initialization Sequence" are complete and success metrics are met:

→ **Proceed to step-02-content-model: Design the component's content model**

In step-02, you will:
- For CMS 12: Design the C# PageData/BlockData class with properties, validation, and editor descriptors
- For SaaS CMS: Design the content type definition with properties, validation, and Visual Builder mapping

The initialization document created here will guide step-02 decisions.
