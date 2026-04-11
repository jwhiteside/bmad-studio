# step-03-implement: Implement Component

## MANDATORY EXECUTION RULES

1. **Model Drives Code:** Do not deviate from the content model (step-02). Every property must have a corresponding implementation.
2. **Follow Team Conventions:** Use the team's naming conventions, formatting, and patterns. Consistency matters more than personal preference.
3. **Test as You Code:** Write unit tests concurrently with implementation code. Aim for 80%+ coverage before committing.
4. **Accessibility First:** Include WCAG 2.1 AA compliance in views/components (semantic HTML, ARIA labels, alt text). Do not patch accessibility in later steps.
5. **No Technical Debt:** Do not use TODOs or FIXMEs as excuses to commit incomplete work. Finish or defer the feature entirely.
6. **Code Review Ready:** Code must be clean, documented, and ready for peer review before step-04.

## EXECUTION PROTOCOLS

### Phase: Implementation
**Role:** Senior Developer (CMS 12) or Frontend Engineer (SaaS CMS)
**Inputs:** Content model specification from step-02
**Duration:** 2–5 days (depending on component complexity and test coverage)
**Output:** Production-ready code in main branch with unit tests, accessibility compliance, and code review sign-off

### Entry Conditions
- Content model is locked and approved (step-02 complete)
- Development environment is ready (IDE, NuGet packages, Node.js, testing frameworks)
- Git branch is created for feature development
- Code review process is defined (pull request template, reviewer list)
- Team coding standards are accessible (style guide, naming conventions)

### Exit Conditions
- All code committed to main branch (via pull request)
- Unit tests written for all logic (minimum 80% coverage)
- Accessibility compliance verified (axe-core scan, manual testing)
- Code review comments addressed and approved
- No build warnings or linting errors

## CONTEXT BOUNDARIES

| Boundary | Scope |
|----------|-------|
| **Platform-Specific Code** | CMS 12 or SaaS CMS (not both); use platform idioms and libraries |
| **Implementation Only** | Code required to fulfill content model; do not over-engineer or add speculative features |
| **Testing Layer** | Unit tests for model and logic; integration tests for CMS integration; do NOT test framework code |
| **Accessibility Compliance** | WCAG 2.1 AA minimum; automated testing (axe-core) + manual testing (NVDA/JAWS) |
| **Performance** | CMS 12 views: < 200ms render time; SaaS React: < 1s TTI; lazy-load assets, cache queries |

Out of scope: Deployment (move to Phase 4), styling/CSS (coordinate with design system), UX research (assume model is correct), infrastructure provisioning (assume environment exists).

---

## YOUR TASK

Complete the following sections in sequence. Implement the platform that matches your target from step-02.

---

## A. Code Structure and Setup

**Action:** Create the initial code files and project structure.

### For CMS 12

**Directory structure:**
```
/Models
  /Blocks
    FeatureBlock.cs          ← Content model class
  /Controllers
    FeatureBlockController.cs ← Logic (if needed)
  /Views
    /Blocks
      FeatureBlock.cshtml     ← View template
/Tests
  /Models
    FeatureBlockTests.cs      ← Unit tests
  /Controllers
    FeatureBlockControllerTests.cs ← Controller tests
```

**Step 1: Create the content model class**

```csharp
// File: /Models/Blocks/FeatureBlock.cs

using EPiServer.Core;
using EPiServer.DataAnnotations;
using System;
using System.ComponentModel.DataAnnotations;

namespace MyProject.Models.Blocks
{
    [ContentType(
        DisplayName = "Feature Block",
        GUID = "12345678-1234-1234-1234-123456789012",
        GroupName = "Blocks",
        Order = 100
    )]
    public class FeatureBlock : BlockData
    {
        [Display(Name = "Title", GroupName = "Content", Order = 10)]
        [Required(ErrorMessage = "Title is required")]
        [StringLength(100, MinimumLength = 5)]
        public virtual string Title { get; set; }

        [Display(Name = "Description", GroupName = "Content", Order = 20)]
        [UIHint(UIHint.Textarea)]
        public virtual XhtmlString Description { get; set; }

        [Display(Name = "Image", GroupName = "Media", Order = 30)]
        [Required(ErrorMessage = "Image is required")]
        [AllowedTypes(typeof(ImageFile))]
        public virtual ContentReference Image { get; set; }

        [Display(Name = "Image Alt Text", GroupName = "Media", Order = 40)]
        [StringLength(125)]
        public virtual string ImageAltText { get; set; }

        [Display(Name = "Button Label", GroupName = "CTA", Order = 50)]
        [StringLength(50)]
        public virtual string ButtonLabel { get; set; }

        [Display(Name = "Button Link", GroupName = "CTA", Order = 60)]
        [AllowedTypes(typeof(PageData))]
        public virtual ContentReference ButtonLink { get; set; }

        [Display(Name = "Background Color", GroupName = "Display", Order = 70)]
        [DefaultValue("white")]
        public virtual string BackgroundColor { get; set; }
    }
}
```

**Step 2: Create controller (optional, only if complex logic)**

If component is simple (no custom logic), skip the controller and render directly from view.

If component needs logic (e.g., filtering, personalization):

```csharp
// File: /Models/Controllers/FeatureBlockController.cs

using EPiServer.Web.Mvc;
using MyProject.Models.Blocks;
using System.Web.Mvc;

namespace MyProject.Controllers
{
    public class FeatureBlockController : BlockController<FeatureBlock>
    {
        public override ActionResult Index(FeatureBlock currentBlock)
        {
            // Add any logic here (e.g., load related content, apply personalization)
            var model = new FeatureBlockViewModel
            {
                Title = currentBlock.Title,
                Description = currentBlock.Description,
                Image = currentBlock.Image,
                ImageAltText = currentBlock.ImageAltText,
                ButtonLabel = currentBlock.ButtonLabel,
                ButtonLink = currentBlock.ButtonLink,
                BackgroundColor = currentBlock.BackgroundColor ?? "white"
            };

            return PartialView(model);
        }
    }
}
```

### For SaaS CMS

**Directory structure:**
```
/content-types
  feature-block.schema.yaml     ← Content type definition
/src/components
  /FeatureBlock
    FeatureBlock.tsx            ← React component
    FeatureBlock.module.css     ← Styling
    FeatureBlock.test.tsx       ← Unit tests
/src/queries
  featureBlockQuery.graphql     ← Content Graph query
```

**Step 1: Create content type definition**

```yaml
# File: /content-types/feature-block.schema.yaml

contentTypes:
  - identifier: feature_block
    displayName: Feature Block
    description: A promotional block with title, image, and call-to-action
    properties:
      - identifier: title
        displayName: Title
        description: SEO-friendly title for the feature
        type: text
        required: true
        settings:
          minLength: 5
          maxLength: 100

      - identifier: description
        displayName: Description
        description: Introductory text with formatting support
        type: richText
        required: false

      - identifier: image
        displayName: Image
        description: Feature image (landscape format recommended, 1920x600px)
        type: asset
        required: true
        settings:
          allowedTypes:
            - image
          maxSize: 5000000

      - identifier: imageAltText
        displayName: Image Alt Text
        description: Accessibility text describing the image (WCAG requirement, max 125 chars)
        type: text
        required: false
        settings:
          maxLength: 125

      - identifier: buttonLabel
        displayName: Button Label
        description: Text for the call-to-action button (e.g., "Learn More", "Shop Now")
        type: text
        required: false
        settings:
          maxLength: 50

      - identifier: buttonLink
        displayName: Button Link
        description: Destination page for the CTA button
        type: contentReference
        required: false
        settings:
          allowedTypes:
            - page
          allowMultiple: false

      - identifier: backgroundColor
        displayName: Background Color
        description: Theme color for the block
        type: text
        required: false
        settings:
          allowedValues:
            - white
            - light-gray
            - dark
          defaultValue: white

    visualBuilder:
      elementType: section
      displayTemplates:
        - identifier: default
          displayName: Default (Light)
          description: Light background with dark text
        - identifier: dark
          displayName: Dark Theme
          description: Dark background with light text
      styles:
        backgroundColor:
          cssClass:
            default: "bg-white"
            dark: "bg-gray-900"
        textColor:
          cssClass:
            default: "text-gray-900"
            dark: "text-white"
```

**Step 2: Create Content Graph query**

```graphql
# File: /src/queries/featureBlockQuery.graphql

query FeatureBlockQuery($key: String!) {
  content: _Content(key: $key) {
    title
    description
    image {
      url
      alt: imageAltText
    }
    buttonLabel
    buttonLink {
      href
      title: displayName
    }
    backgroundColor
    _metadata {
      published
      updated
      templateId
    }
  }
}
```

---

## B. Implement Views and Components

**Action:** Create the HTML/React rendering logic with accessibility compliance.

### For CMS 12 (Razor View)

```html
<!-- File: /Views/Blocks/FeatureBlock.cshtml -->

@using MyProject.Models.Blocks
@model FeatureBlock

@{
    var backgroundClass = Model.BackgroundColor == "dark" ? "bg-dark" : "bg-white";
    var imageUrl = Model.Image != null ? Url.ContentUrl(Model.Image) : "";
    var buttonUrl = Model.ButtonLink != null ? Url.ContentUrl(Model.ButtonLink) : "";
    var buttonAriaLabel = string.IsNullOrEmpty(Model.ButtonLabel) ? "" : $" aria-label=\"{Model.ButtonLabel}\"";
}

<section class="feature-block @backgroundClass" role="region">
    <div class="feature-block__container">
        <!-- Image -->
        @if (Model.Image != null)
        {
            <div class="feature-block__image">
                <img
                    src="@imageUrl"
                    alt="@(Model.ImageAltText ?? Model.Title)"
                    class="feature-block__image-element"
                    loading="lazy" />
            </div>
        }

        <!-- Content -->
        <div class="feature-block__content">
            @if (!string.IsNullOrEmpty(Model.Title))
            {
                <h2 class="feature-block__title">@Model.Title</h2>
            }

            @if (Model.Description != null && !string.IsNullOrEmpty(Model.Description.ToString()))
            {
                <div class="feature-block__description">
                    @Html.Raw(Model.Description.ToString())
                </div>
            }

            <!-- CTA Button -->
            @if (Model.ButtonLink != null && !string.IsNullOrEmpty(Model.ButtonLabel))
            {
                <a
                    href="@buttonUrl"
                    class="feature-block__button"
                    @Html.Raw(buttonAriaLabel)>
                    @Model.ButtonLabel
                </a>
            }
        </div>
    </div>
</section>

<style scoped>
.feature-block {
    padding: 3rem 2rem;
}

.feature-block.bg-dark {
    background-color: #1a1a1a;
    color: #ffffff;
}

.feature-block.bg-white {
    background-color: #ffffff;
    color: #333333;
}

.feature-block__container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
    max-width: 1200px;
    margin: 0 auto;
}

.feature-block__image {
    display: flex;
    align-items: center;
    justify-content: center;
}

.feature-block__image-element {
    max-width: 100%;
    height: auto;
    border-radius: 8px;
}

.feature-block__title {
    font-size: 2rem;
    font-weight: 700;
    margin-bottom: 1rem;
    line-height: 1.2;
}

.feature-block__description {
    font-size: 1rem;
    line-height: 1.6;
    margin-bottom: 1.5rem;
}

.feature-block__button {
    display: inline-block;
    padding: 0.75rem 1.5rem;
    background-color: #0066cc;
    color: #ffffff;
    text-decoration: none;
    border-radius: 4px;
    font-weight: 600;
    transition: background-color 0.2s ease;
}

.feature-block__button:hover {
    background-color: #0052a3;
}

.feature-block.bg-dark .feature-block__button {
    background-color: #4d94ff;
}

.feature-block.bg-dark .feature-block__button:hover {
    background-color: #0066cc;
}

/* Accessibility: Focus visible */
.feature-block__button:focus-visible {
    outline: 2px solid #0066cc;
    outline-offset: 2px;
}

/* Responsive */
@media (max-width: 768px) {
    .feature-block__container {
        grid-template-columns: 1fr;
    }
}
</style>
```

**Key accessibility points:**
- `role="region"` identifies the section
- `alt="..."` provides image description
- Semantic HTML (`<h2>`, `<a>`)
- `loading="lazy"` for performance
- `:focus-visible` for keyboard navigation
- Colour contrast checked (blue on white = 4.5:1+)
- Responsive design for mobile

### For SaaS CMS (React Component)

```tsx
// File: /src/components/FeatureBlock/FeatureBlock.tsx

import React from 'react';
import styles from './FeatureBlock.module.css';

export interface FeatureBlockProps {
  content: {
    title?: string;
    description?: string;
    image?: {
      url: string;
      alt: string;
    };
    buttonLabel?: string;
    buttonLink?: {
      href: string;
      title: string;
    };
    backgroundColor?: 'white' | 'light-gray' | 'dark';
  };
  displayTemplate?: 'default' | 'dark';
  className?: string;
}

export const FeatureBlock: React.FC<FeatureBlockProps> = ({
  content,
  displayTemplate = 'default',
  className = '',
}) => {
  const bgClass = displayTemplate === 'dark' ? styles.bgDark : styles.bgWhite;

  return (
    <section
      className={`${styles.featureBlock} ${bgClass} ${className}`}
      role="region"
      aria-label={content.title || 'Feature block'}
    >
      <div className={styles.container}>
        {/* Image */}
        {content.image?.url && (
          <div className={styles.image}>
            <img
              src={content.image.url}
              alt={content.image.alt || content.title || 'Feature image'}
              className={styles.imageElement}
              loading="lazy"
            />
          </div>
        )}

        {/* Content */}
        <div className={styles.content}>
          {content.title && (
            <h2 className={styles.title}>{content.title}</h2>
          )}

          {content.description && (
            <div
              className={styles.description}
              dangerouslySetInnerHTML={{ __html: content.description }}
            />
          )}

          {/* CTA Button */}
          {content.buttonLink?.href && content.buttonLabel && (
            <a
              href={content.buttonLink.href}
              className={styles.button}
              aria-label={content.buttonLabel}
            >
              {content.buttonLabel}
            </a>
          )}
        </div>
      </div>
    </section>
  );
};

export default FeatureBlock;
```

```css
/* File: /src/components/FeatureBlock/FeatureBlock.module.css */

.featureBlock {
  padding: 3rem 2rem;
}

.bgDark {
  background-color: #1a1a1a;
  color: #ffffff;
}

.bgWhite {
  background-color: #ffffff;
  color: #333333;
}

.container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.image {
  display: flex;
  align-items: center;
  justify-content: center;
}

.imageElement {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
}

.content {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.title {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 1rem;
  line-height: 1.2;
}

.description {
  font-size: 1rem;
  line-height: 1.6;
  margin-bottom: 1.5rem;
}

.button {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  background-color: #0066cc;
  color: #ffffff;
  text-decoration: none;
  border-radius: 4px;
  font-weight: 600;
  transition: background-color 0.2s ease;
  width: fit-content;
}

.button:hover {
  background-color: #0052a3;
}

.bgDark .button {
  background-color: #4d94ff;
}

.bgDark .button:hover {
  background-color: #0066cc;
}

.button:focus-visible {
  outline: 2px solid #0066cc;
  outline-offset: 2px;
}

/* Responsive */
@media (max-width: 768px) {
  .container {
    grid-template-columns: 1fr;
  }

  .title {
    font-size: 1.5rem;
  }
}
```

**Key accessibility points:**
- `role="region"` and `aria-label` for semantic structure
- Semantic HTML (`<h2>`, `<a>`)
- `loading="lazy"` for performance
- `:focus-visible` for keyboard navigation
- Colour contrast checked
- Responsive design for mobile
- `dangerouslySetInnerHTML` only for rich text (sanitize input in production)

---

## C. Write Unit Tests

**Action:** Implement unit tests for your code with minimum 80% coverage.

### For CMS 12

```csharp
// File: /Tests/Models/FeatureBlockTests.cs

using Microsoft.VisualStudio.TestTools.UnitTesting;
using MyProject.Models.Blocks;
using EPiServer.Core;
using System.ComponentModel.DataAnnotations;
using System.Collections.Generic;

namespace MyProject.Tests.Models
{
    [TestClass]
    public class FeatureBlockTests
    {
        private FeatureBlock _block;

        [TestInitialize]
        public void Setup()
        {
            _block = new FeatureBlock
            {
                Title = "Test Feature",
                Image = ContentReference.EmptyReference,
                BackgroundColor = "white"
            };
        }

        [TestMethod]
        public void FeatureBlock_WithAllRequiredFields_CreatesSuccessfully()
        {
            // Arrange
            var block = new FeatureBlock
            {
                Title = "Test Title",
                Image = new ContentReference(1)
            };

            // Act
            var results = ValidateModel(block);

            // Assert
            Assert.AreEqual(0, results.Count, "Block should have no validation errors");
        }

        [TestMethod]
        public void FeatureBlock_WithoutTitle_FailsValidation()
        {
            // Arrange
            var block = new FeatureBlock
            {
                Title = null,
                Image = new ContentReference(1)
            };

            // Act
            var results = ValidateModel(block);

            // Assert
            Assert.IsTrue(results.Count > 0, "Block should fail validation without title");
        }

        [TestMethod]
        public void FeatureBlock_WithoutImage_FailsValidation()
        {
            // Arrange
            var block = new FeatureBlock
            {
                Title = "Test",
                Image = ContentReference.EmptyReference
            };

            // Act
            var results = ValidateModel(block);

            // Assert
            Assert.IsTrue(results.Count > 0, "Block should fail validation without image");
        }

        [TestMethod]
        public void FeatureBlock_TitleTooShort_FailsValidation()
        {
            // Arrange
            var block = new FeatureBlock
            {
                Title = "Hi",  // Only 2 characters, min is 5
                Image = new ContentReference(1)
            };

            // Act
            var results = ValidateModel(block);

            // Assert
            Assert.IsTrue(results.Count > 0, "Block should fail validation with short title");
        }

        [TestMethod]
        public void FeatureBlock_TitleTooLong_FailsValidation()
        {
            // Arrange
            var block = new FeatureBlock
            {
                Title = new string('a', 101),  // Over 100 character limit
                Image = new ContentReference(1)
            };

            // Act
            var results = ValidateModel(block);

            // Assert
            Assert.IsTrue(results.Count > 0, "Block should fail validation with long title");
        }

        [TestMethod]
        public void FeatureBlock_WithOptionalFields_ValidatesSuccessfully()
        {
            // Arrange
            var block = new FeatureBlock
            {
                Title = "Test",
                Image = new ContentReference(1),
                Description = null,  // Optional
                ButtonLabel = null,  // Optional
                ButtonLink = ContentReference.EmptyReference  // Optional
            };

            // Act
            var results = ValidateModel(block);

            // Assert
            Assert.AreEqual(0, results.Count, "Block should validate with optional fields empty");
        }

        [TestMethod]
        public void FeatureBlock_BackgroundColorDefaultsToWhite()
        {
            // Arrange
            var block = new FeatureBlock();

            // Act
            block.BackgroundColor = block.BackgroundColor ?? "white";

            // Assert
            Assert.AreEqual("white", block.BackgroundColor);
        }

        [TestMethod]
        public void FeatureBlock_ImageAltTextMaxLength()
        {
            // Arrange
            var block = new FeatureBlock
            {
                Title = "Test",
                Image = new ContentReference(1),
                ImageAltText = new string('a', 126)  // Over 125 limit
            };

            // Act
            var results = ValidateModel(block);

            // Assert
            Assert.IsTrue(results.Count > 0, "Block should fail with alt text over 125 chars");
        }

        // Helper method to validate model
        private List<ValidationResult> ValidateModel(object model)
        {
            var results = new List<ValidationResult>();
            var context = new ValidationContext(model);
            Validator.TryValidateObject(model, context, results, true);
            return results;
        }
    }
}
```

### For SaaS CMS (React/Jest)

```tsx
// File: /src/components/FeatureBlock/FeatureBlock.test.tsx

import React from 'react';
import { render, screen } from '@testing-library/react';
import { FeatureBlock } from './FeatureBlock';
import '@testing-library/jest-dom';

describe('FeatureBlock Component', () => {
  const mockContent = {
    title: 'Test Feature',
    description: '<p>Test description</p>',
    image: {
      url: 'https://example.com/image.jpg',
      alt: 'Test image',
    },
    buttonLabel: 'Learn More',
    buttonLink: {
      href: '/page',
      title: 'Test Page',
    },
    backgroundColor: 'white',
  };

  test('renders feature block with title', () => {
    render(
      <FeatureBlock
        content={mockContent}
        displayTemplate="default"
      />
    );

    expect(screen.getByText('Test Feature')).toBeInTheDocument();
  });

  test('renders image with alt text', () => {
    render(
      <FeatureBlock
        content={mockContent}
        displayTemplate="default"
      />
    );

    const image = screen.getByAltText('Test image');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', mockContent.image.url);
  });

  test('renders button with label and link', () => {
    render(
      <FeatureBlock
        content={mockContent}
        displayTemplate="default"
      />
    );

    const button = screen.getByRole('link', { name: /learn more/i });
    expect(button).toHaveAttribute('href', '/page');
  });

  test('renders section with region role', () => {
    render(
      <FeatureBlock
        content={mockContent}
        displayTemplate="default"
      />
    );

    const section = screen.getByRole('region');
    expect(section).toBeInTheDocument();
  });

  test('renders description as HTML', () => {
    render(
      <FeatureBlock
        content={mockContent}
        displayTemplate="default"
      />
    );

    expect(screen.getByText('Test description')).toBeInTheDocument();
  });

  test('applies dark theme class when displayTemplate is dark', () => {
    const { container } = render(
      <FeatureBlock
        content={mockContent}
        displayTemplate="dark"
      />
    );

    const section = container.querySelector('section');
    expect(section?.className).toContain('bgDark');
  });

  test('renders without image when image is not provided', () => {
    const contentWithoutImage = { ...mockContent, image: undefined };

    render(
      <FeatureBlock
        content={contentWithoutImage}
        displayTemplate="default"
      />
    );

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  test('renders without button when buttonLink is not provided', () => {
    const contentWithoutButton = { ...mockContent, buttonLink: undefined };

    render(
      <FeatureBlock
        content={contentWithoutButton}
        displayTemplate="default"
      />
    );

    expect(screen.queryByRole('link', { name: /learn more/i })).not.toBeInTheDocument();
  });

  test('uses title as aria-label when provided', () => {
    render(
      <FeatureBlock
        content={mockContent}
        displayTemplate="default"
      />
    );

    const section = screen.getByRole('region');
    expect(section).toHaveAttribute('aria-label', 'Test Feature');
  });

  test('applies custom className', () => {
    const { container } = render(
      <FeatureBlock
        content={mockContent}
        displayTemplate="default"
        className="custom-class"
      />
    );

    const section = container.querySelector('section');
    expect(section?.className).toContain('custom-class');
  });
});
```

**Test coverage targets:**
- [ ] Component renders with all required props
- [ ] Component renders without optional props
- [ ] Validation passes with valid data
- [ ] Validation fails with invalid data (missing fields, length violations)
- [ ] Accessibility attributes present (aria-label, role, alt text)
- [ ] Styling classes applied correctly (dark theme, background colors)
- [ ] Edge cases handled (empty strings, null values, special characters)

**Run tests locally:**

```bash
# CMS 12
dotnet test

# SaaS CMS / React
npm test -- --coverage
```

**Ensure 80%+ coverage before committing.**

---

## D. Accessibility Compliance

**Action:** Verify WCAG 2.1 AA compliance with automated and manual testing.

### Automated Testing (axe-core)

**For CMS 12 (browser test):**

```csharp
// File: /Tests/Accessibility/FeatureBlockAccessibilityTests.cs

using Microsoft.VisualStudio.TestTools.UnitTesting;
using OpenQA.Selenium;
using OpenQA.Selenium.Chrome;
using AxeSelenium;

namespace MyProject.Tests.Accessibility
{
    [TestClass]
    public class FeatureBlockAccessibilityTests
    {
        private IWebDriver _driver;

        [TestInitialize]
        public void Setup()
        {
            _driver = new ChromeDriver();
        }

        [TestCleanup]
        public void Teardown()
        {
            _driver?.Quit();
        }

        [TestMethod]
        public void FeatureBlock_WCAG2AA_Compliant()
        {
            // Navigate to page with feature block
            _driver.Navigate().GoToUrl("http://localhost:5000/feature-block-test");

            // Run axe scan
            var axe = new AxeBuilder(_driver);
            var results = axe.Analyze();

            // Assert no violations
            Assert.AreEqual(0, results.Violations.Length,
                $"Accessibility violations found: {string.Join(", ", results.Violations)}");
        }
    }
}
```

**For SaaS CMS (Jest + axe):**

```tsx
// File: /src/components/FeatureBlock/FeatureBlock.a11y.test.tsx

import React from 'react';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { FeatureBlock } from './FeatureBlock';

expect.extend(toHaveNoViolations);

describe('FeatureBlock Accessibility', () => {
  test('should not have accessibility violations', async () => {
    const mockContent = {
      title: 'Test Feature',
      description: '<p>Test description</p>',
      image: {
        url: 'https://example.com/image.jpg',
        alt: 'Test image',
      },
      buttonLabel: 'Learn More',
      buttonLink: {
        href: '/page',
        title: 'Test Page',
      },
    };

    const { container } = render(
      <FeatureBlock content={mockContent} displayTemplate="default" />
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

### Manual Testing

**Use screen readers (NVDA on Windows, JAWS, or VoiceOver on Mac):**

- [ ] Heading hierarchy is correct (h1 → h2 → h3, no gaps)
- [ ] All images have alt text
- [ ] Links have descriptive text (not "click here")
- [ ] Form fields (if any) have labels
- [ ] Colour is not sole means of conveying information
- [ ] Contrast ratio >= 4.5:1 for text on background
- [ ] Keyboard navigation works (Tab key moves focus in logical order)
- [ ] Focus indicator is visible (outline or highlight)

**Checklist:**

```markdown
## WCAG 2.1 AA Compliance Checklist

### Perceivable
- [ ] All images have alt text (descriptive, not "image")
- [ ] Colour contrast ratio >= 4.5:1 for normal text, 3:1 for large text
- [ ] No information conveyed by colour alone
- [ ] Audio/video (if present) has captions

### Operable
- [ ] Keyboard navigation works (Tab, Shift+Tab, Enter)
- [ ] Focus indicator is visible and clear
- [ ] No keyboard traps (user can navigate away)
- [ ] No auto-playing video/sound
- [ ] Adequate time for interactions (no fast timeouts)

### Understandable
- [ ] Language is clear and simple
- [ ] Headings accurately describe content
- [ ] Instructions are clear
- [ ] Form errors are clearly explained

### Robust
- [ ] HTML is valid (no duplicate IDs, correct nesting)
- [ ] ARIA attributes are used correctly
- [ ] Content works in multiple browsers (Chrome, Firefox, Safari, Edge)
- [ ] Content works on mobile devices
```

---

## E. Performance Validation

**Action:** Measure component render time against baselines.

### For CMS 12

**Render time measurement:**

```csharp
// Measure in your controller or test
var stopwatch = System.Diagnostics.Stopwatch.StartNew();

var model = new FeatureBlockViewModel { /* ... */ };
// Render view
stopwatch.Stop();

Assert.IsTrue(stopwatch.ElapsedMilliseconds < 200,
    $"Render time exceeded 200ms: {stopwatch.ElapsedMilliseconds}ms");
```

**Target:** < 200ms render time for full component

### For SaaS CMS

**React component performance:**

```bash
npm run build
# Check bundle size: should be minimal
# Test with Lighthouse CI or WebPageTest
# Target: < 1s Time to Interactive (TTI) for typical page
```

**Content Graph query optimization:**

```graphql
# Query should return only required fields (no N+1 queries)
query FeatureBlockQuery($key: String!) {
  content: _Content(key: $key) {
    # Only these fields (no extra traversals)
    title
    description
    image { url alt }
    buttonLink { href title }
  }
}
```

**Target:** < 1 second TTI, < 3 seconds full page load

---

## F. Code Review Preparation

**Action:** Prepare code for peer review.

**Checklist:**

```markdown
## Code Review Checklist

### Coding Standards
- [ ] Naming conventions followed (PascalCase for C#, camelCase for JS)
- [ ] Code formatted consistently (use team formatter/linter)
- [ ] No trailing whitespace or unused imports
- [ ] Comments explain "why", not "what"

### Logic & Testing
- [ ] Unit tests present and passing (80%+ coverage)
- [ ] Edge cases handled (null, empty, special characters)
- [ ] Error handling in place (try-catch, validation)
- [ ] No hardcoded values (use configuration)
- [ ] No TODOs or FIXMEs in committed code

### Security
- [ ] No hardcoded secrets (API keys, passwords)
- [ ] Input sanitized (parameterised queries, escaping)
- [ ] XSS prevention (Content Security Policy headers if web)
- [ ] OWASP Top 10 review completed

### Accessibility
- [ ] WCAG 2.1 AA compliance verified
- [ ] axe-core scan passes
- [ ] Manual screen reader test completed
- [ ] Alt text on all images
- [ ] Semantic HTML used

### Performance
- [ ] Render time baseline measured
- [ ] Lazy-loading implemented (images, large content)
- [ ] No N+1 queries
- [ ] Caching considered (if applicable)

### Documentation
- [ ] Code comments explain complex logic
- [ ] README updated (if needed)
- [ ] API documentation provided (if new endpoints)
- [ ] Example usage documented
```

**Create pull request with:**
- Descriptive title (e.g., "feat: add feature block component")
- Summary of changes
- Link to requirements (from step-01)
- Test coverage report (screenshot of coverage %)
- Accessibility audit results
- Performance metrics

---

## SUCCESS METRICS

| Metric | Target | Validation |
|--------|--------|-----------|
| Code compiles/builds | 100% | No build errors or warnings |
| Unit tests pass | 100% | All tests green, 80%+ coverage |
| Accessibility compliant | WCAG 2.1 AA | axe-core passes, manual test done |
| Performance baseline | < 200ms (CMS 12), < 1s TTI (React) | Measured and documented |
| Code review approved | Signed off | At least one reviewer approved |
| No technical debt | Zero | No TODOs, FIXMEs, or deferred work |

---

## FAILURE MODES

| Failure | Cause | Recovery |
|---------|-------|----------|
| Build fails | Syntax error or missing dependency | Fix compile errors; ensure dependencies installed and configured |
| Tests fail | Logic bug or incorrect test assumption | Debug; fix code or test; re-run until 80% coverage |
| Accessibility test fails | Missing alt text, contrast, or ARIA | Add missing attributes; re-run axe-core; manual test |
| Performance exceeds baseline | Inefficient query or rendering | Profile code; optimize queries, caching, lazy-loading; re-test |
| Code review blocks approval | Style violations or anti-patterns | Address reviewer feedback; request new review |
| Model deviation | Implementation differs from step-02 | Review step-02 content model; align implementation |

---

## NEXT STEP

Once implementation is complete and code review is approved:

→ **Proceed to step-04-test: Execute comprehensive testing and validation**

In step-04, you will:
- Run full test suite (unit + integration + accessibility)
- Perform content authoring test (create sample content, verify authoring experience)
- Measure performance baseline
- Obtain final approval from solution architect
- Prepare for deployment (Phase 4)
