# step-04-test: Test and Validation

## MANDATORY EXECUTION RULES

1. **Test All Code Paths:** Run complete test suite; do not skip or ignore failures.
2. **Accessibility is Non-Negotiable:** All accessibility tests must pass (axe-core + manual). No workarounds or exceptions.
3. **Authoring Experience Matters:** Test as editors would use the component. If authoring is confusing, content model failed.
4. **Performance Measured:** Baseline metrics must be documented in writing (not assumptions).
5. **Code Review Required:** No merge to main without approval from at least one peer reviewer.
6. **Success Criteria Verified:** All metrics from "SUCCESS METRICS" section must be met before approval.

## EXECUTION PROTOCOLS

### Phase: Validation & Quality Gate
**Role:** QA Engineer, Lead Developer, Solution Architect (approval)
**Inputs:** Production-ready implementation code from step-03
**Duration:** 1–2 days (testing, remediation, approval)
**Output:** Test reports, accessibility audit, performance baseline, code review approval

### Entry Conditions
- Implementation code is complete and committed to feature branch
- Unit test suite is complete with 80%+ coverage
- Code review checklist from step-03 is complete
- CMS environment (dev or test) is available for authoring test
- Accessibility testing tools installed (axe-core, NVDA/JAWS)

### Exit Conditions
- All unit tests pass (100% success rate)
- Accessibility tests pass (axe-core + manual)
- Content authoring test successful
- Performance baseline documented
- Code review approved by peer
- Component ready for Phase 4 (Implementation)

## CONTEXT BOUNDARIES

| Boundary | Scope |
|----------|-------|
| **Test Execution** | Run all unit tests, integration tests, accessibility tests; document results |
| **Authoring Test** | Create real content as editors would; verify CMS UI, validation, publishing workflow |
| **Accessibility** | WCAG 2.1 AA compliance; axe-core scan + manual testing with screen reader |
| **Performance** | Measure render time (CMS 12 view) or TTI (React component); compare to baseline |
| **Code Review** | Peer review of all code changes; address feedback; obtain approval signature |

Out of scope: Fixing bugs discovered in production (that's Phase 4 hotfix), stress testing (done in Phase 4 load testing), user acceptance testing (done by business stakeholders after deployment).

---

## YOUR TASK

Complete the following sections in sequence. Do not skip any test category.

---

## A. Unit Test Execution

**Action:** Run the complete unit test suite and verify 80%+ code coverage.

### For CMS 12

```bash
# Build solution
dotnet build

# Run unit tests
dotnet test --logger:trx --collect:"XPlat Code Coverage"

# Generate coverage report
dotnet test --collect:"XPlat Code Coverage"
# Results in: TestResults/[GUID]/coverage.cobertura.xml
```

**Output:** Test results report

```markdown
## Unit Test Results - Feature Block Component

**Test Framework:** MSTest
**Test Count:** 12
**Passed:** 12
**Failed:** 0
**Skipped:** 0
**Duration:** 2.3 seconds

### Test Coverage
- **Code Coverage:** 85% (target: 80%)
- **Line Coverage:** 87%
- **Branch Coverage:** 82%

### Test Results
| Test Name | Status | Duration |
|-----------|--------|----------|
| FeatureBlock_WithAllRequiredFields_CreatesSuccessfully | PASS | 10ms |
| FeatureBlock_WithoutTitle_FailsValidation | PASS | 8ms |
| FeatureBlock_WithoutImage_FailsValidation | PASS | 7ms |
| FeatureBlock_TitleTooShort_FailsValidation | PASS | 6ms |
| FeatureBlock_TitleTooLong_FailsValidation | PASS | 9ms |
| FeatureBlock_WithOptionalFields_ValidatesSuccessfully | PASS | 5ms |
| FeatureBlock_BackgroundColorDefaultsToWhite | PASS | 4ms |
| FeatureBlock_ImageAltTextMaxLength | PASS | 8ms |
| FeatureBlockController_Index_ReturnsPartialView | PASS | 12ms |
| FeatureBlockController_WithNullImage_HandlesGracefully | PASS | 6ms |
| FeatureBlockController_WithLongDescription_RendersCorrectly | PASS | 11ms |
| FeatureBlockController_ButtonLinkValidation | PASS | 9ms |

**Status:** ✅ ALL TESTS PASS
```

### For SaaS CMS

```bash
# Run Jest tests with coverage
npm test -- --coverage --ci

# Output: coverage/ directory with HTML report
# Open coverage/lcov-report/index.html in browser
```

**Output:** Test results report

```markdown
## Unit Test Results - Feature Block Component

**Test Framework:** Jest + React Testing Library
**Test Count:** 11
**Passed:** 11
**Failed:** 0
**Skipped:** 0
**Duration:** 3.2 seconds

### Test Coverage
- **Statements:** 90% (target: 80%)
- **Branches:** 87%
- **Functions:** 92%
- **Lines:** 91%

### Test Results
| Test Name | Status | Duration |
|-----------|--------|----------|
| renders feature block with title | PASS | 45ms |
| renders image with alt text | PASS | 38ms |
| renders button with label and link | PASS | 41ms |
| renders section with region role | PASS | 32ms |
| renders description as HTML | PASS | 29ms |
| applies dark theme class when displayTemplate is dark | PASS | 35ms |
| renders without image when image is not provided | PASS | 28ms |
| renders without button when buttonLink is not provided | PASS | 26ms |
| uses title as aria-label when provided | PASS | 33ms |
| applies custom className | PASS | 31ms |
| should not have accessibility violations | PASS | 156ms |

**Status:** ✅ ALL TESTS PASS
```

**Validation checklist:**

- [ ] All tests pass (0 failures)
- [ ] Code coverage >= 80%
- [ ] No skipped tests (unless explicitly approved)
- [ ] Test execution time is reasonable (< 30 seconds total)
- [ ] Accessibility tests included and passing

**If tests fail:**
1. Identify failing test name and error message
2. Debug locally (run failing test in isolation)
3. Fix code or test
4. Re-run full suite
5. Repeat until all pass

---

## B. Accessibility Testing

**Action:** Verify WCAG 2.1 AA compliance with automated and manual testing.

### Automated Testing (axe-core)

**For CMS 12 (browser test):**

```bash
# Run Selenium + axe tests
dotnet test --filter "Category=Accessibility"
```

**Output:** Accessibility audit report

```markdown
## Accessibility Audit - Feature Block Component (CMS 12)

**Standard:** WCAG 2.1 Level AA
**Scan Date:** 2026-03-31
**Tool:** axe DevTools + Selenium WebDriver
**Browser:** Chrome 126

### Scan Results
- **Status:** ✅ PASS
- **Violations:** 0
- **Warnings:** 0
- **Best Practices:** 0

### Scanned Elements
- [ ] Headings (h1–h6): Correct hierarchy (h2 used for title)
- [ ] Images: All have alt text
- [ ] Links: Descriptive text, no "click here"
- [ ] Colour Contrast: All text >= 4.5:1 (WCAG AA)
- [ ] Focus Indicators: Visible keyboard focus on button
- [ ] Form Fields: Labels associated with inputs (N/A, no form in component)
- [ ] ARIA: Region role applied to section

### Detailed Findings
| Check | Result | Details |
|-------|--------|---------|
| Image alt text | PASS | Hero image has meaningful alt text |
| Colour contrast | PASS | Text on all backgrounds meets 4.5:1 requirement |
| Heading order | PASS | h2 used for component title; no h1 (page title) |
| Focus visible | PASS | Button has visible focus outline on keyboard tab |
| Region landmark | PASS | Section has role="region" |
| Lists | N/A | No lists in component |

**Status:** ✅ WCAG 2.1 AA COMPLIANT
```

**For SaaS CMS (Jest + jest-axe):**

```bash
npm test -- --testPathPattern=a11y
```

**Output:** Accessibility test results (included in step-03 test report).

### Manual Testing (Screen Reader)

**Use NVDA (Windows) or VoiceOver (Mac):**

**Test procedure:**

1. **Open component in browser**
2. **Enable screen reader**
   - Windows: NVDA (free, https://www.nvaccess.org/)
   - Mac: VoiceOver (built-in, Cmd+F5)
3. **Navigate with keyboard only (Tab key)**
4. **Verify each element is announced correctly**

**Manual test checklist:**

```markdown
## Manual Accessibility Test - Feature Block Component

**Screen Reader:** NVDA 2024.1 (Windows) or VoiceOver (Mac)
**Date:** 2026-03-31
**Tester:** [Name]

### Navigation and Announcements
- [ ] Section is announced as "region" with label (e.g., "region: Feature Block")
- [ ] Title is announced as "heading level 2, Test Feature"
- [ ] Description text is announced clearly
- [ ] Image is announced as "image, Test image alt text"
- [ ] Button is announced as "link, Learn More" with destination

### Keyboard Navigation
- [ ] Tab key moves focus in logical order: Title → Image → Button
- [ ] Shift+Tab moves focus backward
- [ ] Focus indicator is clearly visible (outline or highlight)
- [ ] No keyboard traps (user can navigate away from all elements)
- [ ] Enter key activates button/link

### Colour and Contrast
- [ ] No information conveyed by colour alone
- [ ] Text is readable on background (appears dark on light, light on dark)
- [ ] Button has adequate contrast (blue on white, white on dark blue)

### Overall Assessment
- [ ] Component is usable with keyboard only
- [ ] Component is understandable with screen reader
- [ ] No accessibility barriers found

**Tester Signature:** _________________ **Date:** _______

**Status:** ✅ PASS | ❌ FAIL (attach remediation plan)
```

**Common accessibility findings and fixes:**

| Issue | Root Cause | Fix |
|-------|-----------|-----|
| Image not announced | Missing alt text | Add alt attribute to img tag |
| Heading missing | h2 used instead of h1 (but page title is h1) | Check heading hierarchy; h2 is correct for block title |
| Button not keyboard accessible | No href or onclick handler | Use <a> or <button> element; ensure keyboard event handlers |
| Low colour contrast | Blue text on white background (< 4.5:1) | Darken text or change background; test with contrast checker |
| Focus not visible | No outline or highlight on focused element | Add :focus-visible style with outline or background change |

---

## C. Content Authoring Test

**Action:** Create real content as editors would use the component.

### For CMS 12

**Procedure:**

1. **Access CMS editor (episerver dev environment)**
2. **Navigate to content edit page**
3. **Add Feature Block component**
4. **Fill in all fields:**

```
Title: "Boost Your Sales with Our Solution"
Description: "Increase conversion rates by 30% with our proven platform."
Image: [Upload hero image, 1920x600px recommended]
Image Alt Text: "Laptop displaying dashboard with analytics charts"
Button Label: "Get Started Free"
Button Link: [Select /pricing page]
Background Color: "dark"
```

5. **Verify editor experience:**
   - [ ] Field labels are clear (authors understand what each field does)
   - [ ] Help text is helpful (tooltips/descriptions appear when needed)
   - [ ] Validation messages are clear (if invalid data entered)
   - [ ] Image picker works smoothly
   - [ ] Page link picker shows relevant pages
   - [ ] Preview shows accurate rendering
   - [ ] Publish button works without errors
   - [ ] Published page displays component correctly in frontend

**Output:** Content authoring test report

```markdown
## Content Authoring Test Report - Feature Block

**Date:** 2026-03-31
**Tester:** [Name]
**Component:** Feature Block
**CMS Version:** Episerver CMS 12

### Field Experience

| Field | Clarity | UX | Issues |
|-------|---------|----|----|
| Title | Clear | Good | None |
| Description | Good | Good | Help text could mention max length (if applicable) |
| Image | Clear | Good | Image cropping tool would be helpful |
| Image Alt Text | Good | Good | Could show character count (125 max) |
| Button Label | Clear | Good | None |
| Button Link | Clear | Good | Page picker search is slow (performance note) |
| Background Color | Clear | Good | Color preview in dropdown would help |

### Publishing Workflow
- [ ] Component saves without errors
- [ ] Validation prevents incomplete content (required fields)
- [ ] Preview shows accurate rendering
- [ ] Publish to live environment succeeds
- [ ] Component displays correctly on published page
- [ ] No console errors in browser DevTools

### Editor Feedback
"Overall, the component is intuitive. The field grouping (Content / Media / CTA) helps organize the form. One suggestion: show the image dimension recommendation in the Image field label."

### Issues Found
- [ ] Minor: Page link picker dropdown could be faster (currently takes 2s to load)
- [ ] Suggestion: Add character count to alt text field
- [ ] Suggestion: Preview image dimensions in image picker

### Recommendation
✅ **READY FOR DEPLOYMENT** (with optional performance notes for future optimization)

**Tester Signature:** _________________ **Date:** _______
```

### For SaaS CMS

**Procedure:**

1. **Access SaaS CMS content dashboard**
2. **Create new content instance of Feature Block type**
3. **Fill in fields (same as above)**
4. **Verify Visual Builder rendering:**
   - [ ] Content type appears in Visual Builder palette
   - [ ] Component can be dragged onto page
   - [ ] Fields appear in edit panel
   - [ ] Display templates (Light/Dark) can be switched
   - [ ] Preview updates in real-time as fields are edited
   - [ ] Styles (background color) are applied correctly
   - [ ] Publish to content API succeeds
   - [ ] Content Graph query returns expected data
   - [ ] Frontend component renders correctly

**Output:** Content authoring test report (same format as CMS 12 above).

---

## D. Performance Validation

**Action:** Measure component render/load time against baseline.

### For CMS 12

**Render time measurement:**

```csharp
// File: /Tests/Performance/FeatureBlockPerformanceTests.cs

[TestMethod]
public void FeatureBlock_RenderTime_UnderBaseline()
{
    var stopwatch = System.Diagnostics.Stopwatch.StartNew();

    // Simulate rendering
    var viewContent = RenderView("~/Views/Blocks/FeatureBlock.cshtml", new FeatureBlock
    {
        Title = "Performance Test Feature",
        Description = new XhtmlString("<p>Test description</p>"),
        Image = new ContentReference(1),
        ImageAltText = "Test image",
        ButtonLabel = "Learn More",
        ButtonLink = new ContentReference(2),
        BackgroundColor = "white"
    });

    stopwatch.Stop();

    Assert.IsTrue(stopwatch.ElapsedMilliseconds < 200,
        $"Render time {stopwatch.ElapsedMilliseconds}ms exceeds 200ms baseline");
}
```

**Performance report:**

```markdown
## Performance Report - Feature Block (CMS 12)

**Date:** 2026-03-31
**Component:** Feature Block
**Test Environment:** Visual Studio 2022, Windows 11, 16GB RAM

### Render Time
- **Baseline Target:** < 200ms
- **Measured Time (empty content):** 45ms ✅
- **Measured Time (full content):** 78ms ✅
- **Measured Time (large description):** 92ms ✅
- **Average Render Time:** 71.7ms ✅

### Database Queries
- **ContentLoader calls:** 2 (image + button link)
- **SQL queries:** 1 (load image asset metadata)
- **Cache hits:** 1 (button link from cache)
- **N+1 queries:** None detected ✅

### Recommendations
- Component render time is well within baseline (71.7ms avg vs. 200ms target)
- Consider caching image metadata if loading many blocks on single page
- No performance optimizations needed at this time

**Status:** ✅ PASS (exceeds performance targets)
```

### For SaaS CMS

**Bundle size and TTI measurement:**

```bash
# Build for production
npm run build

# Check bundle size
npm run analyze:bundle
# Output: component bundle size (aim for < 50KB gzipped)

# Test with Lighthouse
npm run lighthouse
# Check Time to Interactive (TTI), First Contentful Paint (FCP)
```

**Performance report:**

```markdown
## Performance Report - Feature Block (SaaS CMS)

**Date:** 2026-03-31
**Framework:** Next.js 14 + React 18
**Build:** Production optimized

### Bundle Size
- **Component JS:** 8.2KB (gzipped)
- **Component CSS:** 2.1KB (gzipped)
- **Total with deps:** 14.3KB (gzipped) ✅ (target: < 50KB)

### Content Graph Query
- **Query time (cold):** 240ms
- **Query time (cached):** 45ms
- **Payload size:** 3.2KB
- **Fields requested:** 8 (title, description, image, button, etc.)

### Lighthouse Scores (typical page with component)
- **Largest Contentful Paint (LCP):** 1.2s (target: < 2.5s) ✅
- **First Input Delay (FID):** 12ms (target: < 100ms) ✅
- **Cumulative Layout Shift (CLS):** 0.05 (target: < 0.1) ✅
- **Time to Interactive (TTI):** 2.1s (target: < 3s) ✅

### Recommendations
- Component performs well; no optimizations needed
- Image lazy-loading is enabled (reduces initial TTI)
- Content Graph query should cache responses for 30 minutes

**Status:** ✅ PASS (exceeds performance targets)
```

---

## E. Code Review

**Action:** Request and receive peer code review approval.

### Pull Request Template

```markdown
## Feature: Add Feature Block Component

### Description
Implements a reusable Feature Block component for CMS 12 (or SaaS CMS).

- Displays title, description, image, and CTA button
- Supports light/dark background theme
- WCAG 2.1 AA accessibility compliant
- 85%+ test coverage

### Related Issue
Closes #[issue-number] from dept-opti-requirements

### Changes
- Add FeatureBlock.cs (PageData model)
- Add FeatureBlock.cshtml (Razor view)
- Add FeatureBlockController.cs (controller with logic)
- Add FeatureBlockTests.cs (unit tests)
- Add FeatureBlock.css (styling)

### Testing
- [x] Unit tests pass (12/12)
- [x] Accessibility tests pass (WCAG 2.1 AA)
- [x] Content authoring test passed
- [x] Performance baseline verified (71.7ms render time)

### Test Coverage
![Coverage](./coverage-report.png)
- Statements: 85%
- Branches: 82%
- Functions: 87%

### Accessibility
- [x] axe-core scan: No violations
- [x] Manual NVDA test: Passed
- [x] Colour contrast: 4.7:1 (exceeds WCAG AA 4.5:1)
- [x] Keyboard navigation: Fully functional

### Performance
- Render time: 71.7ms (baseline: < 200ms) ✅
- No N+1 queries
- Image lazy-loading enabled

### Code Review Checklist
- [x] Code follows team conventions (naming, formatting)
- [x] No hardcoded values (configuration used)
- [x] No security vulnerabilities
- [x] Documentation and comments clear
- [x] No TODOs or FIXMEs in code

### Screenshots (if applicable)
[CMS editor screenshot showing Feature Block]
[Frontend rendering with light theme]
[Frontend rendering with dark theme]

---

**Ready for review. Request approval from @lead-developer @architect**
```

### Code Review Sign-off

**Reviewer comments:**

```markdown
## Code Review Approval

**Reviewer:** @lead-developer
**Date:** 2026-03-31
**PR:** #123 - Add Feature Block Component

### Review Notes

✅ **Code Quality**
- Well-structured code, follows team naming conventions
- Good separation of concerns (model, controller, view)
- Comments explain complex logic clearly

✅ **Testing**
- Comprehensive unit test coverage (85%)
- Edge cases tested (null values, length limits)
- Accessibility tests included

✅ **Accessibility**
- WCAG 2.1 AA compliant
- axe-core passes
- Manual screen reader test documented

✅ **Performance**
- Render time baseline documented (71.7ms)
- No N+1 queries
- Image lazy-loading implemented

### Minor Suggestions (not blocking)
1. Consider adding JSDoc comments to public methods (nice-to-have)
2. Add performance note about caching image metadata for pages with multiple blocks

### Approval
**Status:** ✅ **APPROVED**

Signature: _________________ Date: _______

Ready to merge to main branch.
```

---

## SUCCESS METRICS

| Metric | Target | Pass Criteria | Validation |
|--------|--------|---------------|-----------|
| Unit tests | 100% pass | All tests pass with 0 failures | Test results show all green |
| Code coverage | >= 80% | Coverage report shows 80%+ | Coverage report screenshot included |
| Accessibility | WCAG 2.1 AA | axe-core passes + manual test | Audit report signed off |
| Performance | CMS 12: < 200ms, SaaS: < 1s TTI | Measured baseline documented | Performance report attached |
| Content authoring | Success | Authors can create, edit, publish content | Authoring test report signed off |
| Code review | Approved | At least one peer reviewer approved | Code review approval signature |

---

## FAILURE MODES

| Failure | Cause | Recovery |
|---------|-------|----------|
| Unit tests fail | Code bug or incorrect test | Debug locally; fix code; re-run tests until all pass |
| Accessibility audit fails | Missing alt text, low contrast, or ARIA | Add missing attributes; re-run axe-core and manual test |
| Performance exceeds baseline | Inefficient rendering or query | Profile code; optimize queries, caching, lazy-loading; re-measure |
| Authoring test fails | Content model unclear or CMS UI issue | Return to step-02; clarify with content team; update content model if needed |
| Code review rejection | Style violations or anti-patterns | Address reviewer feedback; push new commit; request re-review |
| Missing documentation | No comments or README | Add comments and docs; push new commit; request re-review |

---

## DECISION GATE

**After all validations complete, present results with A/P/C menu:**

```
==== COMPONENT APPROVAL DECISION GATE ====

Component: Feature Block
Phase: Phase 3 - Solutioning
Step: step-04-test

✅ Unit Tests: PASS (12/12, 85% coverage)
✅ Accessibility: WCAG 2.1 AA COMPLIANT
✅ Authoring Test: PASS
✅ Performance: 71.7ms (< 200ms baseline)
✅ Code Review: APPROVED

All success criteria met.

═══════════════════════════════════════════════════════════════

What is your decision?

[A] Approve: Component is production-ready. Proceed to Phase 4.

[P] Preferred: Minor tweaks requested. Return to earlier step, iterate, re-test.

[C] Caution: Significant issues found. Hold pending architect review and remediation plan.

═══════════════════════════════════════════════════════════════
```

---

## NEXT STEP

**If Approved (A):**
→ **Proceed to dept-opti-code-review (Phase 4 final gate)** or **dept-opti-headless-implementation (if SaaS with Next.js)**

**If Preferred (P):**
→ Return to earlier step (step-03 if code changes needed; step-02 if content model unclear)

**If Caution (C):**
→ Schedule architect review; create remediation plan; address issues before re-testing

Component is complete and ready for Phase 4 deployment.
