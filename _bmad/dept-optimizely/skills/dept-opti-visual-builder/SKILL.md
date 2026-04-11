---
canonicalId: dept-opti-visual-builder
name: "Visual Builder Patterns"
description: "Comprehensive guide for SaaS CMS Visual Builder patterns covering Experience/Section/Element hierarchy, content type design, Styles system, Display Templates, Blueprints, Contracts, Content Graph integration, and best practices for composition, localisation, and performance."
domain: optimizely
category: development
---

# Visual Builder Patterns and Best Practices

Comprehensive guide for designing, implementing, and optimizing SaaS CMS Visual Builder experiences.

## Visual Builder Architecture

### Hierarchy and Structure

The Visual Builder organizes content using a three-level hierarchy:

```
Experience
├── Section
│   ├── Element
│   ├── Element
│   └── Element
├── Section
│   ├── Element
│   └── Element
└── Section
    └── Element

Experience "Product Launch Landing Page"
├── Section "Hero" (layout: fullWidth)
│   └── Element "HeroSection" (content type: HeroSection)
│       ├── heading: "Introducing X Series"
│       ├── description: "Revolutionary product"
│       └── image: [ContentLink]
├── Section "Features" (layout: gridThreeColumn)
│   ├── Element "Feature 1" (content type: FeatureCard)
│   ├── Element "Feature 2" (content type: FeatureCard)
│   └── Element "Feature 3" (content type: FeatureCard)
├── Section "Pricing" (layout: fullWidth)
│   └── Element "PricingTable" (content type: PricingTable)
└── Section "CTA" (layout: fullWidth)
    └── Element "CallToAction" (content type: CallToAction)
```

### Experience Properties

**Metadata**:
```yaml
- Name: Unique identifier for the experience
- Description: Human-readable summary
- Owner: Author/publisher
- Status: Draft, In Review, Scheduled, Published
- Version: Auto-managed versioning
- PublishDate: When it goes live
- ExpiryDate: When it's hidden (optional)
- Audience: Targeting rules (optional)
- Tags: Categorization and discovery
```

**Composition**:
```yaml
- Sections: Ordered list of sections
- Metadata: SEO, OG tags, custom fields
- Styles: Global Experience-level styling
- LocalizationInfo: Multi-language versions
```

### Section Properties

**Layout Types**:
- **FullWidth**: Single column, edge-to-edge
- **TwoColumn**: Left/right split
- **ThreeColumn**: Three equal columns
- **ThreeColumnAsym**: 2-col, 1-col, 2-col layout
- **FourColumn**: Four equal columns
- **Custom Grid**: N-column configurable grid
- **Masonry**: Pinterest-style layout

**Configuration**:
```yaml
- Name: Section identifier
- Layout: Layout type (fullWidth, grid, etc.)
- BackgroundStyle: Background image, color, pattern
- Spacing: Padding and margin configuration
- Elements: List of elements in section
- MaxWidth: Container width constraint
- Alignment: Content alignment (left, center, right)
```

### Element Properties

**Content Binding**:
- ContentType: The content type this element represents
- FieldBindings: Field mappings from content type to display template
- DisplayTemplate: How content renders
- DisplayOption: Render variation (optional)

**Styling and Layout**:
- Style: Applied style definition
- Width: Column span (for grid layouts)
- Alignment: Element alignment within section
- Responsive: Mobile/tablet overrides

## Content Type Design for Visual Builder

### Field Types and Definitions

```yaml
# Text field
- fieldName: pageHeading
  type: Text
  label: "Page Heading"
  required: true
  maxLength: 100
  helpText: "Main headline for the page"
  defaultValue: ""
  validation:
    pattern: "^[A-Za-z0-9 ]*$"
    errorMessage: "Only letters, numbers, and spaces allowed"

# Rich text field (allows HTML, formatting)
- fieldName: description
  type: RichText
  label: "Description"
  required: false
  maxLength: 5000
  allowedFormats:
    - bold
    - italic
    - underline
    - lists
    - links
  forbiddenFormats:
    - scripts
    - stylesheets

# Content link field (references other content)
- fieldName: featuredImage
  type: ContentLink
  label: "Featured Image"
  contentTypeFilter:
    - Image
    - Photo
  required: true
  helpText: "Recommended size: 1920x1080px"

# Single select field
- fieldName: themeColor
  type: SingleSelect
  label: "Theme Color"
  required: true
  defaultValue: "primary"
  options:
    - value: "primary"
      label: "Primary Brand Blue"
    - value: "secondary"
      label: "Secondary Gray"
    - value: "accent"
      label: "Accent Orange"

# Multi-select field
- fieldName: displayOptions
  type: MultiSelect
  label: "Display Options"
  required: false
  options:
    - value: "showAuthor"
      label: "Show Author Information"
    - value: "showDate"
      label: "Show Publication Date"
    - value: "showTags"
      label: "Show Content Tags"

# Number field
- fieldName: itemsPerPage
  type: Number
  label: "Items Per Page"
  required: true
  defaultValue: 10
  min: 1
  max: 100
  step: 1

# Boolean field
- fieldName: showRelatedItems
  type: Boolean
  label: "Show Related Items"
  required: false
  defaultValue: false

# Repeater field (dynamic list)
- fieldName: buttonsList
  type: Repeater
  label: "Buttons"
  required: false
  minItems: 0
  maxItems: 5
  fields:
    - fieldName: buttonText
      type: Text
      label: "Button Text"
      required: true
    - fieldName: buttonLink
      type: ContentLink
      label: "Link Target"
      contentTypeFilter:
        - Page
      required: true
    - fieldName: buttonStyle
      type: SingleSelect
      label: "Button Style"
      options:
        - value: "primary"
          label: "Primary"
        - value: "secondary"
          label: "Secondary"
```

### Content Type Metadata

```yaml
---
# Content Type Definition
type: "Element"
name: "HeroSection"
description: "Full-width hero banner with image and call-to-action"
icon: "images/hero-icon.png"
preview: "images/hero-preview.png"

# Content Type Behavior
grouping: "Layout Components"
sortOrder: 10
allowedParents:
  - "Experience"
  - "Section"

# Inherits from
inherits:
  - "BaseElement"

# Fields (detailed in separate section above)
fields:
  - fieldName: heading
    # ...

# Display templates (rendering options)
displayTemplates:
  - templateName: "default"
    description: "Standard hero with full-width image"
    channel: "web"
    tags:
      - "featured"
      - "main"

  - templateName: "minimal"
    description: "Simple hero without background image"
    channel: "web"
    tags:
      - "alternative"

  - templateName: "mobile"
    description: "Mobile-optimized version"
    channel: "mobile"
    tags:
      - "responsive"

# Contracts (rendering agreements)
contracts:
  - contractName: "IHeroSectionRenderer"
    version: "1.0"
    requiredFields:
      - heading
      - backgroundColor
    optionalFields:
      - description
      - backgroundImage
      - buttons

# Styles
applicableStyles:
  - "PrimaryButton"
  - "HeroBackground"
  - "HeadingStyle"

# Localization
localizableFields:
  - heading
  - description
  - buttonText
```

## Styles System

Styles define visual properties without hardcoding CSS:

### Style Definition Structure

```yaml
---
name: "PrimaryButton"
description: "Primary call-to-action button style"
version: "1.0"

# Target element type
targetElement: "Button"
targetContentType: "CallToActionElement"

# Style categories (grouping for UI)
category: "Buttons"
subcategory: "Primary Actions"

# Visual properties
properties:

  # Color properties
  - styleName: "backgroundColor"
    label: "Background Color"
    type: "color"
    defaultValue: "#0066CC"
    required: true
    description: "Button background color"

  - styleName: "textColor"
    label: "Text Color"
    type: "color"
    defaultValue: "#FFFFFF"
    required: true

  - styleName: "borderColor"
    label: "Border Color"
    type: "color"
    defaultValue: "#0052A3"
    required: false

  # Spacing properties
  - styleName: "padding"
    label: "Padding"
    type: "spacing"
    defaultValue: "12px 24px"
    required: true
    preset: true
    presetValues:
      - label: "Small"
        value: "8px 16px"
      - label: "Medium"
        value: "12px 24px"
      - label: "Large"
        value: "16px 32px"

  # Typography properties
  - styleName: "fontSize"
    label: "Font Size"
    type: "select"
    defaultValue: "base"
    required: true
    options:
      - label: "Small (12px)"
        value: "small"
      - label: "Base (16px)"
        value: "base"
      - label: "Large (18px)"
        value: "large"
      - label: "Extra Large (20px)"
        value: "xlarge"

  - styleName: "fontWeight"
    label: "Font Weight"
    type: "select"
    defaultValue: "600"
    options:
      - label: "Regular (400)"
        value: "400"
      - label: "Semi-bold (600)"
        value: "600"
      - label: "Bold (700)"
        value: "700"

  # Border properties
  - styleName: "borderRadius"
    label: "Corner Radius"
    type: "select"
    defaultValue: "medium"
    preset: true
    options:
      - label: "Sharp (0px)"
        value: "0px"
      - label: "Small (4px)"
        value: "4px"
      - label: "Medium (8px)"
        value: "8px"
      - label: "Large (16px)"
        value: "16px"
      - label: "Full (999px)"
        value: "999px"

  # Shadow properties
  - styleName: "boxShadow"
    label: "Shadow"
    type: "select"
    defaultValue: "medium"
    options:
      - label: "None"
        value: "none"
      - label: "Small"
        value: "0 1px 2px rgba(0,0,0,0.1)"
      - label: "Medium"
        value: "0 4px 6px rgba(0,0,0,0.15)"
      - label: "Large"
        value: "0 10px 15px rgba(0,0,0,0.2)"

  # Hover/State properties
  - styleName: "hoverBackgroundColor"
    label: "Hover Background Color"
    type: "color"
    defaultValue: "#0052A3"
    required: false
    description: "Background color on hover"

# Application rules
appliesTo:
  contentTypes:
    - "CallToActionElement"
    - "Button"
  displayTemplates:
    - "primary"
    - "default"

# Inheritance
inheritsFrom: "BaseButton"
canBeOverridden: true

# Usage examples
examples:
  - name: "Standard Primary Button"
    description: "Default primary button"
    screenshot: "examples/primary-button.png"
  - name: "Large Primary Button"
    description: "Oversized for hero section"
    screenshot: "examples/large-primary-button.png"
```

### Applying Styles to Elements

```graphql
# GraphQL mutation to apply style
mutation ApplyStyleToElement($elementId: String!, $styleId: String!) {
  applyStyle(elementId: $elementId, styleId: $styleId) {
    _id
    style {
      _id
      name
    }
  }
}

# In Visual Builder UI:
# 1. Select Element
# 2. Open Styles panel
# 3. Choose style from dropdown
# 4. View preview with style applied
# 5. Override individual properties if needed
```

### Style Inheritance and Cascading

Styles can inherit from parent styles:

```yaml
# Base button style
name: "BaseButton"
properties:
  - styleName: "padding"
    defaultValue: "12px 24px"
  - styleName: "fontSize"
    defaultValue: "base"

---
# Primary button inherits from BaseButton
name: "PrimaryButton"
inheritsFrom: "BaseButton"
properties:
  - styleName: "backgroundColor"
    defaultValue: "#0066CC"
  # Inherits padding and fontSize from BaseButton
  # Can override with new values

---
# Large primary button inherits from PrimaryButton
name: "LargePrimaryButton"
inheritsFrom: "PrimaryButton"
properties:
  - styleName: "fontSize"
    defaultValue: "large"  # Overrides inherited value
  - styleName: "padding"
    defaultValue: "16px 32px"  # Overrides inherited value
```

## Display Templates

Display templates control how content renders across channels:

### Template Definition

```jsx
// Display Template: HeroSection (React)
import React from 'react';
import styles from './HeroSection.module.css';

interface HeroSectionProps {
  heading: string;
  description?: string;
  backgroundImage?: string;
  backgroundColor: 'primary' | 'secondary' | 'accent';
  buttons?: Array<{
    text: string;
    href: string;
    style?: 'primary' | 'secondary';
  }>;
  style?: {
    padding?: string;
    minHeight?: string;
  };
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  heading,
  description,
  backgroundImage,
  backgroundColor,
  buttons,
  style
}) => {
  const bgClass = {
    primary: styles.bgPrimary,
    secondary: styles.bgSecondary,
    accent: styles.bgAccent
  }[backgroundColor];

  return (
    <section
      className={`${styles.hero} ${bgClass}`}
      style={{
        backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
        ...style
      }}
    >
      <div className={styles.content}>
        <h1 className={styles.heading}>{heading}</h1>
        {description && (
          <p className={styles.description}>{description}</p>
        )}
        {buttons && buttons.length > 0 && (
          <div className={styles.buttons}>
            {buttons.map((btn, idx) => (
              <a
                key={idx}
                href={btn.href}
                className={`${styles.button} ${styles[`button${btn.style || 'primary'}`]}`}
              >
                {btn.text}
              </a>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
```

### Multi-Channel Display Templates

```tsx
// Template variants for different channels

// Web Desktop Template
export const HeroSectionWeb: React.FC<HeroSectionProps> = ({...}) => {
  return (
    <section className="hero hero-desktop">
      {/* Full-featured layout */}
    </section>
  );
};

// Mobile Template (optimized for small screens)
export const HeroSectionMobile: React.FC<HeroSectionProps> = ({
  heading,
  description,
  buttons
}) => {
  return (
    <section className="hero hero-mobile">
      <h1 className="mobile-heading">{heading}</h1>
      {description && <p className="mobile-description">{description}</p>}
      {buttons && (
        <div className="mobile-buttons">
          {buttons.map((btn, idx) => (
            <a key={idx} href={btn.href} className="mobile-button">
              {btn.text}
            </a>
          ))}
        </div>
      )}
    </section>
  );
};

// Headless/API Template (JSON serialization)
export const HeroSectionHeadless = (props: HeroSectionProps) => {
  return {
    type: 'HeroSection',
    heading: props.heading,
    description: props.description,
    image: props.backgroundImage,
    buttons: props.buttons,
    style: {
      backgroundColor: props.backgroundColor
    }
  };
};
```

### Template Registration

```yaml
# Display Template Manifest
displayTemplates:
  - templateName: "default"
    description: "Default hero with background image"
    channel: "web"
    component: "HeroSection"
    requiredFields:
      - heading
    optionalFields:
      - description
      - backgroundImage
      - buttons
    responsive: true
    previewImage: "hero-preview.png"

  - templateName: "minimal"
    description: "Simple text-only hero"
    channel: "web"
    component: "HeroSectionMinimal"
    requiredFields:
      - heading
    responsive: true

  - templateName: "mobile"
    description: "Mobile-optimized hero"
    channel: "mobile"
    component: "HeroSectionMobile"
    requiredFields:
      - heading
    responsive: true

  - templateName: "api"
    description: "Headless API response"
    channel: "api"
    component: "HeroSectionHeadless"
    format: "json"
```

## Blueprints for Author Productivity

### Blueprint Definition

Blueprints are reusable Experience templates that accelerate content creation:

```yaml
---
# Blueprint: ProductLaunchPage
name: "Product Launch Page"
description: "Complete landing page for product launches"
category: "Product Marketing"
thumbnail: "images/product-launch-blueprint.png"

# Blueprint sections (pre-configured structure)
sections:

  # Section 1: Hero
  - sectionName: "Hero"
    layout: "fullWidth"
    backgroundColor: "primary"
    backgroundImage: "[PLACEHOLDER: Hero Image]"

    elements:
      - elementType: "HeroSection"
        label: "Hero Section"
        locked: false  # Author can edit
        properties:
          heading: "[Add Product Name]"
          description: "[Add Product Tagline]"
          backgroundColor: "primary"
          buttons:
            - text: "Get Started"
              href: ""
            - text: "Learn More"
              href: ""

  # Section 2: Features
  - sectionName: "Key Features"
    layout: "gridThreeColumn"
    spacing:
      padding: "60px 20px"

    elements:
      - elementType: "FeatureCard"
        label: "Feature 1"
        locked: false
        properties:
          title: "[Feature 1 Title]"
          description: "[Feature 1 Description]"
          icon: "[PLACEHOLDER: Icon]"

      - elementType: "FeatureCard"
        label: "Feature 2"
        locked: false
        properties:
          title: "[Feature 2 Title]"
          description: "[Feature 2 Description]"
          icon: "[PLACEHOLDER: Icon]"

      - elementType: "FeatureCard"
        label: "Feature 3"
        locked: false
        properties:
          title: "[Feature 3 Title]"
          description: "[Feature 3 Description]"
          icon: "[PLACEHOLDER: Icon]"

  # Section 3: Pricing
  - sectionName: "Pricing"
    layout: "fullWidth"
    backgroundColor: "secondary"

    elements:
      - elementType: "PricingTable"
        label: "Pricing Plans"
        locked: false
        properties:
          title: "Simple, Transparent Pricing"
          subtitle: "Choose the plan that fits your needs"
          plans:
            - name: "Starter"
              price: "$99"
              features: []
            - name: "Professional"
              price: "$299"
              features: []
            - name: "Enterprise"
              price: "Custom"
              features: []

  # Section 4: Testimonials
  - sectionName: "Customer Reviews"
    layout: "gridTwoColumn"

    elements:
      - elementType: "Testimonial"
        label: "Testimonial 1"
        locked: false
        properties:
          quote: "[Customer quote goes here]"
          attribution: "[Customer name and title]"

      - elementType: "Testimonial"
        label: "Testimonial 2"
        locked: false
        properties:
          quote: "[Customer quote goes here]"
          attribution: "[Customer name and title]"

  # Section 5: CTA
  - sectionName: "Call to Action"
    layout: "fullWidth"
    backgroundColor: "accent"

    elements:
      - elementType: "CallToAction"
        label: "Final CTA"
        locked: false
        properties:
          headline: "Ready to Launch?"
          subheadline: "[Optional subheading]"
          buttonText: "Start Your Journey"
          buttonLink: ""

# Default metadata
defaultMetadata:
  author: ""
  owner: ""
  tags:
    - "product"
    - "launch"
    - "landing-page"
  seoTitle: "[Product Name] - Launch Page"
  seoDescription: "Discover the features and benefits of [Product Name]"

# Locked sections (cannot be edited by author)
lockedSections: []

# Required fields (author must fill these)
requiredFields:
  - "Hero.properties.heading"
  - "Key Features.properties[0].title"
  - "Key Features.properties[1].title"
  - "Key Features.properties[2].title"
  - "Pricing.properties.plans"

# Variants (alternative blueprints)
variants:
  - name: "SaaS Product"
    description: "Optimized for SaaS product launches"
  - name: "Physical Product"
    description: "Optimized for hardware/physical products"
```

### Using Blueprints

1. **In Visual Builder UI**:
   - Click "Create from Blueprint"
   - Select "Product Launch Page" blueprint
   - Blueprint structure is populated
   - Author fills in placeholders
   - Sections can be reordered or duplicated
   - Elements can be removed or added

2. **Programmatic Creation**:
```csharp
public class BlueprintService
{
    public async Task<Experience> CreateFromBlueprint(
        string blueprintId,
        Dictionary<string, object> values)
    {
        var blueprint = await GetBlueprint(blueprintId);
        var experience = new Experience();

        // Populate sections from blueprint
        foreach (var section in blueprint.Sections)
        {
            var newSection = CreateSectionFromTemplate(section, values);
            experience.AddSection(newSection);
        }

        // Apply defaults
        experience.Tags = blueprint.DefaultMetadata.Tags;
        experience.SeoTitle = blueprint.DefaultMetadata.SeoTitle;

        return experience;
    }
}
```

## Contracts for Rendering Consistency

Contracts define rendering agreements between content and display templates:

### Contract Definition

```csharp
// Contract interface for HeroSection
public interface IHeroSectionContract
{
    string Heading { get; }
    string Description { get; }
    string BackgroundImageUrl { get; }
    string BackgroundColor { get; }
    IEnumerable<IButtonContract> Buttons { get; }
    IStyleContract AppliedStyle { get; }
}

public interface IButtonContract
{
    string Text { get; }
    string Href { get; }
    string Style { get; }
}

// Contract implementation
public class HeroSectionContent : IHeroSectionContract
{
    public string Heading { get; set; }
    public string Description { get; set; }
    public string BackgroundImageUrl { get; set; }
    public string BackgroundColor { get; set; }
    public IEnumerable<IButtonContract> Buttons { get; set; }
    public IStyleContract AppliedStyle { get; set; }
}
```

### Contract Validation

```csharp
public class HeroSectionValidator : IContentValidator
{
    public ValidationResult Validate(IContent content)
    {
        if (!(content is HeroSectionContent heroContent))
            return ValidationResult.Invalid("Not a HeroSection");

        var errors = new List<string>();

        // Required field validation
        if (string.IsNullOrWhiteSpace(heroContent.Heading))
            errors.Add("Heading is required");

        if (string.IsNullOrWhiteSpace(heroContent.BackgroundColor))
            errors.Add("BackgroundColor is required");

        // Field value validation
        if (heroContent.Heading?.Length > 100)
            errors.Add("Heading must be 100 characters or less");

        // Complex validation
        if (heroContent.BackgroundImageUrl != null)
        {
            if (!IsValidImageUrl(heroContent.BackgroundImageUrl))
                errors.Add("BackgroundImageUrl must be a valid image URL");
        }

        // Button validation
        if (heroContent.Buttons?.Any() == true)
        {
            foreach (var button in heroContent.Buttons)
            {
                if (string.IsNullOrWhiteSpace(button.Text))
                    errors.Add("All buttons must have text");

                if (string.IsNullOrWhiteSpace(button.Href))
                    errors.Add("All buttons must have a target link");
            }
        }

        return errors.Any()
            ? ValidationResult.Invalid(string.Join("; ", errors))
            : ValidationResult.Valid();
    }
}
```

### Contract Versioning

Contracts can have multiple versions for backward compatibility:

```csharp
public interface IHeroSectionContractV1
{
    string Heading { get; }
    string Description { get; }
}

public interface IHeroSectionContractV2 : IHeroSectionContractV1
{
    string BackgroundImageUrl { get; }
    string BackgroundColor { get; }
    IEnumerable<IButtonContract> Buttons { get; }
}

// Adapter for legacy contract
public class HeroSectionContractV1Adapter : IHeroSectionContractV1
{
    private readonly IHeroSectionContractV2 _v2Content;

    public HeroSectionContractV1Adapter(IHeroSectionContractV2 v2Content)
    {
        _v2Content = v2Content;
    }

    public string Heading => _v2Content.Heading;
    public string Description => _v2Content.Description;
}
```

## Integration with Content Graph (Headless Rendering)

### Query Content for Display Templates

```graphql
query GetExperienceForDisplay($experienceId: String!, $locale: String!) {
  experience: Experience(
    where: { _id: { eq: $experienceId } }
    locale: $locale
  ) {
    _id
    name
    sections {
      _id
      layout
      backgroundColor
      elements {
        _id
        _type
        displayTemplate
        style {
          _id
          name
          properties { key value }
        }
        content {
          ... on HeroSection {
            heading
            description
            backgroundImage {
              _id
              url
            }
            buttons {
              text
              href
            }
          }
          ... on FeatureCard {
            title
            description
            icon {
              _id
              url
            }
          }
          ... on CallToAction {
            headline
            buttonText
            buttonLink {
              _id
              url
            }
          }
        }
      }
    }
  }
}
```

### Rendering from API

```typescript
// React component renders Experience from Content Graph
interface ExperienceRendererProps {
  experienceId: string;
  locale: string;
}

export const ExperienceRenderer: React.FC<ExperienceRendererProps> = ({
  experienceId,
  locale
}) => {
  const { data, loading } = useQuery(GetExperienceQuery, {
    variables: { experienceId, locale }
  });

  if (loading) return <div>Loading...</div>;

  const experience = data?.experience;

  return (
    <div className="experience">
      {experience.sections.map((section) => (
        <SectionRenderer
          key={section._id}
          section={section}
          locale={locale}
        />
      ))}
    </div>
  );
};

const SectionRenderer: React.FC<{ section: Section; locale: string }> = ({
  section
}) => {
  const layoutClass = `layout-${section.layout}`;

  return (
    <section className={layoutClass}>
      {section.elements.map((element) => (
        <ElementRenderer
          key={element._id}
          element={element}
        />
      ))}
    </section>
  );
};

const ElementRenderer: React.FC<{ element: Element }> = ({ element }) => {
  // Dynamic component resolution based on element type
  const ComponentMap = {
    HeroSection,
    FeatureCard,
    CallToAction,
    PricingTable,
    Testimonial
  };

  const Component = ComponentMap[element._type];

  if (!Component) {
    return <div>Unknown element type: {element._type}</div>;
  }

  return (
    <Component
      {...element.content}
      style={element.style?.properties}
      displayTemplate={element.displayTemplate}
    />
  );
};
```

## Best Practices and Patterns

### 1. Content Type Design Best Practices

**Do**:
- Keep content types focused (single responsibility)
- Use clear, descriptive field names
- Provide helpful labels and descriptions
- Set reasonable field maxLengths
- Use appropriate field types (don't use Text for everything)
- Enable localization for translatable fields
- Validate field values appropriately

**Don't**:
- Create overly complex content types with too many fields
- Use generic names like "data" or "field1"
- Forget to set required/optional correctly
- Mix concerns (e.g., styling + content in one field)
- Neglect SEO-related fields
- Ignore localization requirements

### 2. Element Composition Best Practices

**Do**:
- Keep elements focused and reusable
- Use Sections to organize related elements
- Leverage Blueprints for consistent page structures
- Apply Styles consistently across similar elements
- Use Display Templates to support multiple channels
- Provide sensible defaults in Blueprints

**Don't**:
- Create deeply nested elements (3+ levels)
- Mix layout and content concerns
- Duplicate element definitions (use fragments/components)
- Hardcode styling in templates (use Styles system)
- Forget responsive design in Display Templates

### 3. Multi-Channel Best Practices

**Do**:
- Create separate Display Templates for each channel
- Test rendering across devices
- Consider performance implications
- Use responsive units (rem, %, vw) in CSS
- Provide channel-specific content when needed
- Document channel-specific behavior

**Don't**:
- Assume one template works everywhere
- Use fixed pixel widths
- Ignore mobile experience
- Create overly complex responsive logic
- Forget about accessibility
- Hardcode channel-specific content in template

### 4. Performance Optimization

**Do**:
- Lazy-load Display Templates
- Optimize image sizes and formats
- Cache Experience and Section metadata
- Use cursor pagination for large element lists
- Minimize field nesting depth
- Profile rendering performance

**Don't**:
- Load all Display Templates at once
- Use unoptimized image sizes
- Create extremely large Experiences (100+ sections)
- Fetch all fields for listing views
- Nest relationships 5+ levels deep
- Ignore Web Vitals metrics

### 5. Localization Best Practices

**Do**:
- Mark translatable fields as localizable
- Provide context for translators
- Test multi-language rendering
- Use RTL-aware layouts when needed
- Fall back gracefully when translations missing
- Version translations with content

**Don't**:
- Hardcode strings in Display Templates
- Assume all fields need localization
- Forget about date/number formatting
- Ignore text expansion in translations
- Create language-specific content types
- Forget about SEO for multiple languages

## Common Patterns and Examples

### Product Showcase Pattern

```yaml
# Experience: "Product Showcase"
sections:
  - Hero (Hero Section content type)
  - Features (Grid of Feature Card elements)
  - Specifications (Table content type)
  - Testimonials (Grid of Testimonial elements)
  - Related Products (Content link to other products)
  - CTA (Call to Action element)

# Reusable across all product pages
# Changes to Feature Card template auto-update all product pages
```

### Blog Post Pattern

```yaml
# Experience: "Blog Post"
sections:
  - Hero (Hero Section with blog post image)
  - Metadata (Author, date, reading time)
  - Content (Rich text body)
  - Related Posts (Content references)
  - Comment Section (Comments content type)
  - Email Signup (CTA for newsletter)

# Supports multiple Display Templates:
# - Desktop (sidebar layout)
# - Mobile (single column)
# - Email (plain text optimized)
```

### Marketing Campaign Pattern

```yaml
# Experience: "Campaign Landing Page"
sections:
  - Hero (Campaign-specific messaging)
  - Value Proposition (3-4 key benefits)
  - Social Proof (Testimonials, stats, logos)
  - FAQ (Expandable Q&A)
  - Pricing/Offer (Clear pricing or special offer)
  - Risk Reversal (Money-back guarantee, etc.)
  - Final CTA (Strong call to action)
```

---

**Last Updated**: 2024
**Version**: 2.0
