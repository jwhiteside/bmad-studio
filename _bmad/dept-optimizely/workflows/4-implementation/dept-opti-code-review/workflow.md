# dept-opti-code-review Workflow

**Workflow Name:** Code Review and Quality Gate
**Phase:** Phase 4 — Implementation
**Duration:** 1–2 days

## Workflow Overview

This workflow guides you through comprehensive code review of all Optimizely implementation code to ensure quality, security, performance, and accessibility standards are met before production deployment.

## Key Principle

**Quality Gates Matter.** Code review is the final technical gate before production deployment. Issues found here prevent production incidents.

## Workflow Structure

```
step-01-init
    ↓ (scope defined, standards loaded)
step-02-review
    ↓ (code reviewed, findings documented)
DECISION GATE → [Approve / Remediate / Hold]
```

## Step Overview

- **Step 1:** Identify code scope (PRs, components, full codebase), load platform-specific standards (CMS 12 .NET or SaaS headless), create review document
- **Step 2:** Review code for quality (patterns, naming), security (no secrets, parameterised queries), performance (queries, caching, lazy-loading), accessibility (WCAG 2.1 AA), document findings with severity levels, obtain approval

## Success Metrics

- Zero critical findings
- All major findings remediated
- Code follows team conventions
- Security review passed
- Performance baseline verified
- Accessibility compliant
- Code review signed off

## Next Step

After approval, code is ready for deployment.
