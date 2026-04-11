# step-02-review: Code Review Execution

## MANDATORY EXECUTION RULES

1. **Document Severity:** Classify each finding as Critical, Major, Minor, or Suggestion.
2. **Reproducibility:** Include steps to reproduce any issue found.
3. **Recommendations:** Provide clear recommendation for each finding.
4. **Approval Required:** Code cannot merge without architect sign-off.

## YOUR TASK

### A. Review for Quality (CMS 12)

- [ ] C# naming conventions (PascalCase for classes, camelCase for variables)
- [ ] Code formatting consistent (use StyleCop analyzer)
- [ ] Comments explain "why", not "what"
- [ ] No unused imports or variables
- [ ] DI (dependency injection) used correctly
- [ ] Async/await patterns correct (no deadlocks)
- [ ] Error handling in place (try-catch, validation)

### B. Review for Optimizely Patterns

**CMS 12 specific:**

- [ ] ContentReference used correctly (no lazy-loading issues)
- [ ] ContentArea iteration with proper fallback templates
- [ ] Initialization modules ordered correctly
- [ ] Scheduled jobs have proper safety (singleton, state management)
- [ ] Commerce patterns followed (if applicable)

**SaaS CMS specific:**

- [ ] Content Graph queries use fragments (no duplication)
- [ ] Caching strategy defined for each query
- [ ] Error handling for failed queries
- [ ] Preview mode authentication correct (HMAC)
- [ ] React component patterns (functional, memoization where needed)

### C. Review for Security

- [ ] No hardcoded API keys, passwords, secrets
- [ ] SQL queries parameterised (for CMS 12)
- [ ] XSS prevention (Content Security Policy, escaping)
- [ ] No dependency vulnerabilities (check npm audit, NuGet)

### D. Review for Performance

- [ ] No N+1 queries detected
- [ ] Database query explain plans checked
- [ ] Caching strategies explicit
- [ ] Image/asset lazy-loading implemented
- [ ] Bundle size checked (for React)

### E. Review for Accessibility

- [ ] WCAG 2.1 AA compliance verified
- [ ] Semantic HTML (headings, forms, landmarks)
- [ ] ARIA labels where needed
- [ ] Colour contrast >= 4.5:1
- [ ] Keyboard navigation works

### F. Document Findings

Format findings as:

```
## Finding: [Category] - [Severity]

**Issue:** [Description of problem]

**Location:** [File, line number]

**Steps to Reproduce:**
1. [Step 1]
2. [Step 2]

**Recommendation:**
[Clear fix recommendation]

**Example:**
[Code snippet showing correct approach]
```

### G. Obtain Approval

Review checklist:

- [ ] All findings documented (Critical, Major, Minor, Suggestion)
- [ ] Reviewer recommendations clear
- [ ] Team lead or architect reviews findings
- [ ] Architect signs off (approval statement with date)

## SEVERITY LEVELS

- **Critical:** Security or data integrity issue; blocks deployment
- **Major:** Code quality issue; should be fixed before merge
- **Minor:** Style or convention issue; nice-to-have fix
- **Suggestion:** Enhancement or alternative approach; for future consideration

## APPROVAL STATEMENT TEMPLATE

```markdown
## Code Review Approval

**Reviewer:** [Name]
**Date:** [Date]
**Status:** ✅ APPROVED | 🔄 APPROVED WITH MINOR CHANGES | ❌ CHANGES REQUIRED

**Summary:**
[1-2 sentence summary of findings]

**Critical Issues:** [Count]
**Major Issues:** [Count]
**Minor Issues:** [Count]

**Sign-off:**
I have reviewed this code and confirm it meets team quality standards.

Signature: _________________ Date: _______
```

## SUCCESS METRICS

- [ ] All findings documented
- [ ] No unresolved critical issues
- [ ] Code review approval signed
- [ ] Remediation plan documented (if changes needed)

## NEXT STEP

→ If approved: Code is ready for deployment
→ If changes required: Address feedback, re-review, obtain approval
