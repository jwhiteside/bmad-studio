# step-01-init: Code Review Scope Setup

## MANDATORY EXECUTION RULES

1. **Scope Clear:** Define exactly what code is being reviewed (PR, component, full codebase).
2. **Standards Loaded:** Load team coding standards and platform-specific guidelines before review.
3. **Review Plan Documented:** Create review document identifying code files and review focus areas.

## YOUR TASK

### A. Identify Review Scope

Define code being reviewed:

- Specific PR numbers or branch names
- Component or module (e.g., CMS 12 blocks, React components, API integrations)
- Full codebase (for pre-deployment review)

### B. Detect Platform

Identify which platform(s) are being reviewed:

- **CMS 12:** .NET C#, MVC controllers/views, initialization modules
- **SaaS CMS:** React/Next.js, GraphQL queries, Content Graph integration

### C. Load Coding Standards

Gather:

- Team naming conventions
- Code formatting rules (linting config)
- Optimizely API patterns (CMS 12 or SaaS)
- Security checklist (OWASP Top 10)
- Performance checklist
- Accessibility guidelines (WCAG 2.1 AA)

### D. Create Review Document

Document template:

```markdown
# Code Review: [Component/PR/Module]

**Scope:** [Description]
**Platform:** CMS 12 | SaaS CMS
**Reviewer:** [Name]
**Review Date:** [Date]

## Code Files Reviewed

- [File 1.cs or .tsx]
- [File 2.cs or .tsx]
- [File 3 - Tests]

## Review Checklist

### Quality
- [ ] Naming conventions followed
- [ ] Code formatted consistently
- [ ] Comments explain complex logic

### Security
- [ ] No hardcoded secrets
- [ ] Parameterised queries (CMS 12)
- [ ] Input validation present

### Performance
- [ ] No N+1 queries
- [ ] Caching strategies defined
- [ ] Lazy-loading implemented

### Accessibility
- [ ] WCAG 2.1 AA compliant
- [ ] Semantic HTML used
- [ ] ARIA labels present (where needed)

## Findings

[To be completed in step-02]
```

## SUCCESS METRICS

- [ ] Scope clearly defined
- [ ] Platform identified
- [ ] Standards loaded and accessible
- [ ] Review document created

## NEXT STEP

→ Proceed to step-02-review: Conduct code review and document findings
