# dept-opti-build-component Workflow

**Workflow Name:** Build Production-Ready Optimizely Component
**Phase:** Phase 3 — Solutioning
**Duration:** 1–3 days per component
**Target Audience:** Developers, solution architects, QA engineers

## Workflow Overview

This workflow guides you through designing and implementing a production-ready Optimizely component. A component is a reusable unit of content structure and presentation—either a CMS 12 BlockData/PageData class with MVC view, or a SaaS CMS content type with headless rendering.

The workflow enforces a **content-first design pattern**: define the content model before building UI. This ensures components remain:
- Flexible across design iterations
- Testable at the model layer
- Maintainable by future teams
- Accessible to all users

## Key Principle

**Content Model First**

Before writing any C# classes, MVC views, React components, or controllers:
1. Gather requirements from content authors
2. Design the data structure (fields, relationships, validation rules)
3. Validate the structure with stakeholders
4. Then implement presentation logic

This inverts the traditional UI-first approach and ensures your component serves content needs, not the reverse.

## Initialization Sequence

### Workflow Entry Point
1. Trigger this workflow with component requirements from `dept-opti-requirements`
2. Identify target platform: **CMS 12** (traditional .NET + MVC) or **SaaS CMS** (headless + React/SDK)
3. Load design system and coding standards documents
4. Create execution context with:
   - Component name and business purpose
   - Target platform and required fields
   - Accessibility and performance baselines
   - Team members and approval contacts

### Pre-Flight Checks
- Verify component does not already exist (search existing implementations)
- Confirm requirements are SMART (Specific, Measurable, Agreed, Realistic, Time-bound)
- Validate target platform environment is accessible
- Ensure team has necessary development tools and access

## Execution Context Boundaries

This workflow operates within these constraints:

| Boundary | Scope |
|----------|-------|
| **CMS 12 Components** | BlockData/PageData classes, MVC controllers, .cshtml views, server-side validation, Commerce integration patterns |
| **SaaS CMS Components** | Content type definitions (via CLI or REST API), React functional components, Content Graph queries, Visual Builder compliance |
| **Accessibility** | WCAG 2.1 AA minimum; axe-core automated testing; manual NVDA/JAWS testing on views/components |
| **Testing** | Unit tests (C# MSTest or Jest/React Testing Library), integration tests, accessibility tests; minimum 80% code coverage |
| **Performance** | CMS 12 views: < 200ms render time; SaaS React: < 1s TTI for typical content; lazy-load images and large content areas |
| **Security** | No hardcoded secrets; parameterised queries for CMS 12; Content Security Policy headers; OWASP Top 10 review |

Out of scope: UI design direction (use design system), UX research (use requirements), deployment automation (see dept-opti-migration-execute).

## Workflow Structure

```
step-01-init
    ↓ (initialization context created)
step-02-content-model
    ↓ (content model validated)
step-03-implement
    ↓ (code complete, tests written)
step-04-test
    ↓ (all tests pass)
DECISION GATE → [Approval / Preferred / Caution]
```

## Step Details

### Step 1: Initialize and Requirements Discovery
**Goal:** Gather requirements and establish development context.

- Search existing component implementations to avoid duplication
- Confirm component requirements are clear (required fields, content relationships, validation rules)
- Determine target platform: CMS 12 or SaaS CMS
- Document component purpose and business metrics (author efficiency, engagement targets)
- Create development environment checklist (VS Code + extensions for CMS 12; Node.js 18+ for SaaS)
- Set accessibility baseline (WCAG 2.1 AA)

**Output:** Initialization document with requirements summary, platform decision, and dev environment confirmation.

### Step 2: Design Content Model
**Goal:** Define the data structure before building UI.

**For CMS 12:**
- Design C# PageData or BlockData class with properties:
  - Basic fields: String, Integer, DateTime, XhtmlString (for rich text)
  - Content references: ContentReference (single page or block), ContentArea (multiple items)
  - Validation: Required, Range, Custom validators
  - Display attributes: Display name, description, grouping (tabs)
  - Categories for CMS organization
- Example:
  ```csharp
  [ContentType(DisplayName = "Feature Block", GUID = "...")]
  public class FeatureBlock : BlockData
  {
      [Display(Name = "Title")]
      public virtual string Title { get; set; }

      [UIHint(UIHint.Textarea)]
      public virtual XhtmlString Description { get; set; }

      [AllowedTypes(typeof(ImageFile))]
      public virtual ContentReference Image { get; set; }

      [Range(1, 10)]
      public virtual int DisplayOrder { get; set; }
  }
  ```

**For SaaS CMS:**
- Define content type via CLI (Optimizely.ContentCloud) or REST API:
  - Identifier, display name, description
  - Properties with data types: Text, RichText, Asset (image/video), ContentReference, StructuredData
  - Validation rules
  - Visual Builder mapping (element / section type)
- Example (YAML):
  ```yaml
  contentTypes:
    - identifier: feature_block
      displayName: Feature Block
      properties:
        - identifier: title
          type: text
          required: true
        - identifier: description
          type: richText
        - identifier: image
          type: asset
          allowedTypes:
            - image
  ```

**Deliverable:** Content model specification document with schema, field descriptions, and validation rules.

### Step 3: Implement Component
**Goal:** Build production-ready code with full test coverage.

**For CMS 12:**
1. Create C# BlockData/PageData class (editor descriptors, display options)
2. Build MVC controller (if needed for complex logic) inheriting from BlockController or PageController
3. Write .cshtml view with Razor syntax, including:
   - ContentReference rendering via `Html.EditAttributes()`
   - ContentArea iteration with fallback templates
   - CSS classes for styling
   - ARIA labels for accessibility
4. Create CSS/JS files (or reference design system)
5. Write unit tests using MSTest:
   - Model construction and validation
   - Controller logic and caching
   - View rendering with mock ContentLoader
6. Example test:
   ```csharp
   [TestMethod]
   public void FeatureBlock_WithRequiredFields_RenderSuccessfully()
   {
       var block = new FeatureBlock
       {
           Title = "Test",
           Image = ContentReference.EmptyReference
       };
       Assert.IsNotNull(block);
   }
   ```

**For SaaS CMS:**
1. Create content type definition via CLI or REST API
2. Build React component:
   ```tsx
   export const FeatureBlock = ({ content, styles }: FeatureBlockProps) => {
     return (
       <section className={styles?.container}>
         <h2>{content.title}</h2>
         <RichText content={content.description} />
         <img src={content.image?.url} alt={content.image?.alt} />
       </section>
     );
   };
   ```
3. Write Content Graph query for the content type:
   ```graphql
   query FeatureBlockQuery($key: String!) {
     content: _Content(key: $key) {
       title
       description
       image {
         url
         alt
       }
     }
   }
   ```
4. Write Jest/React Testing Library tests:
   ```jsx
   test('renders feature block with title', () => {
     render(<FeatureBlock content={mockContent} />);
     expect(screen.getByText('Test')).toBeInTheDocument();
   });
   ```
5. Ensure Visual Builder compliance (Styles metadata mapping, Display Template selection)

**Deliverable:** Production code in main branch with full test coverage report (>= 80%).

### Step 4: Test and Validation
**Goal:** Ensure component meets quality, accessibility, and performance standards.

- **Unit tests:** Run test suite locally, verify 80%+ coverage
- **Accessibility tests:**
  - Automated: axe-core scan of rendered component
  - Manual: test with NVDA (Windows) or JAWS screen reader
  - Ensure all headings are semantic (h1–h6), images have alt text, form fields have labels
  - Check colour contrast (WCAG AA minimum 4.5:1 for text)
- **Content authoring test:**
  - For CMS 12: Create sample content in episerver, render on page, verify editor experience
  - For SaaS CMS: Create sample content type instance, verify Visual Builder rendering
- **Performance test:**
  - CMS 12: Measure controller + view render time (target < 200ms)
  - SaaS React: Measure component mount + Content Graph query time (target < 1s TTI)
- **Code review checklist:**
  - [ ] Code follows team naming conventions (PascalCase for C#, camelCase for JS)
  - [ ] No hardcoded secrets or environment-specific values
  - [ ] Parameterised queries (no SQL injection vectors)
  - [ ] Logging and error handling in place
  - [ ] Comments explain complex logic
  - [ ] Test coverage >= 80%
  - [ ] No warnings in build

**Deliverable:** Completed component with test reports, accessibility audit, and code review sign-off.

## Success Metrics

| Metric | Target | Validation |
|--------|--------|-----------|
| Component deployed | 100% | No build errors, component appears in CMS |
| Authoring test | Pass | Sample content created, published, and rendered correctly |
| Accessibility compliance | WCAG 2.1 AA | axe-core scan passes, manual NVDA test completes |
| Test coverage | >= 80% | Test report shows unit test coverage >= 80% |
| Performance baseline | < 200ms (CMS 12), < 1s TTI (React) | Measured during step-04-test |
| Code review approval | Signed off | At least one peer review completed and approved |

## Failure Modes and Recovery

| Failure Mode | Root Cause | Recovery |
|--------------|-----------|----------|
| Component already exists | Duplicate effort | Halt workflow; collaborate with existing component owner on re-use or refactoring |
| Requirements unclear | Incomplete gathering | Return to step-01-init; clarify with business stakeholders before proceeding |
| Content model validation fails | Missing fields or incorrect types | Review step-02-content-model output; iterate with content team |
| Tests fail during step-04 | Code bugs or test assumptions wrong | Debug in VS Code/Node.js debugger; update tests or code; re-run until 80% coverage achieved |
| Accessibility audit fails | ARIA labels missing or colour contrast low | Remediate in step-03-implement view/component; re-run axe-core and manual test |
| Performance baseline exceeded | Rendering time too long | Profile code; optimise queries, caching, lazy-loading; re-test |
| Peer code review blocks approval | Style violations or anti-patterns | Address reviewer feedback; request new review; iterate until approved |

## Next Step

After step-04-test completes and all success metrics are met:
1. **If approved:** Proceed to dept-opti-code-review (final quality gate) or dept-opti-headless-implementation (if SaaS CMS with Next.js)
2. **If preferred:** Minor tweaks needed—update component and re-test
3. **If caution:** Significant issues found—return to earlier step or halt pending stakeholder decision

When all components are built and approved, proceed to Phase 4 (Implementation): dept-opti-migration-execute.
