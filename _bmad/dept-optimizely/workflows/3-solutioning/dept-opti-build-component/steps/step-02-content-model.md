# step-02-content-model: Design Content Model

## MANDATORY EXECUTION RULES

1. **Content First, Always:** Design the content model before writing any C# classes, views, controllers, or React components. Content model is the contract between content authors and developers.
2. **Validation at Model Layer:** All business rules (required fields, field length, allowed values) belong in the content model, not in the view or UI component.
3. **Author Experience is Content Model:** If a field is confusing to authors, the content model is wrong. Iterate with editorial team.
4. **Single Responsibility:** Each content type/class is responsible for one concept. If a component models two unrelated things, split it.
5. **Schema as Documentation:** The content model is the first and best documentation. Clear field names, descriptions, and validation rules eliminate ambiguity downstream.

## EXECUTION PROTOCOLS

### Phase: Architecture & Design
**Role:** Solution Architect, Content Strategist, Lead Developer
**Inputs:** Initialization document from step-01
**Duration:** 4–8 hours (depending on complexity)
**Output:** Content model specification document with schema, validation rules, and author guide

### Entry Conditions
- Initialization document is complete and approved
- Component requirements are clear and unambiguous
- Target platform (CMS 12 or SaaS CMS) is declared
- Content team (editors, content strategists) is available for feedback

### Exit Conditions
- Content model specification is complete and documented
- Validation rules are specified for each field
- Author experience is described (editor UI, help text, guidance)
- Stakeholders have reviewed and approved the model
- No implementation code has been written

## CONTEXT BOUNDARIES

| Boundary | Scope |
|----------|-------|
| **Data Structure** | Define what data is stored (fields, types, relationships); do NOT dictate how data is displayed (that's step-03) |
| **Validation Rules** | Include business rules (required, field length, allowed values); exclude UI constraints (max characters shown in editor) |
| **Relationships** | Define many-to-one (ContentReference) and one-to-many (ContentArea) relationships; document multiplicity and allowed types |
| **Editor Experience** | Document how authors will interact with the model (field order, grouping, help text); do NOT design the UI markup |

Out of scope: View/component design (move to step-03), database schema tuning (assume CMS handles persistence), styling or CSS classes (move to step-03), JavaScript interactions (move to step-03).

## YOUR TASK

Complete the following sections. Document your decisions thoroughly—the more detail here, the faster step-03 (implementation) will proceed.

---

## A. Gather Content Model Inputs

**Action:** Collect and review all materials needed to design the content model.

**Inputs required:**
1. **Initialization document** from step-01 (requirements, platform, environment)
2. **Design system specifications** (if available):
   - Standard component patterns (e.g., "hero section always has title + image + CTA")
   - Content field naming conventions (e.g., "introductory text" vs. "intro")
   - Asset types (image dimensions, video codecs, document formats)
3. **Existing content types or components** (if migrating from old platform):
   - Legacy system schema (if available)
   - Field mappings planned in migration
   - Any content that needs to be preserved
4. **Content governance documents** (if available):
   - Taxonomy and controlled vocabularies
   - SEO requirements (meta fields, alt text rules)
   - Accessibility requirements (form labels, ARIA attributes)
5. **Business requirements** from step-01:
   - Content relationships (which page types can contain this component?)
   - Variants or display options (dark theme, compact view, etc.)
   - Performance constraints (max file size for uploads, lazy-load rules)

**Checklist:**
- [ ] Initialization document available and reviewed
- [ ] Design system accessible (or confirmation that no design system exists)
- [ ] Existing components/content types documented (if applicable)
- [ ] Governance documents available (or confirmation that none exist)
- [ ] Business stakeholders available for model review

**Deliverable:** Inputs summary document listing all reviewed materials.

---

## B. Design Content Model for CMS 12

**Platform:** Episerver CMS 12 (traditional .NET + server-side rendering)

**Action:** Design a C# PageData or BlockData class with properties, validation, and editor configuration.

### Structure Overview

```csharp
[ContentType(DisplayName = "Component Display Name", GUID = "...")]
public class ComponentName : BlockData  // or PageData
{
    // Required properties (CMS base class provides these)
    // - PageName (string)
    // - PageTypeID (int)
    // - UpdateChanged (DateTime)

    [Display(Name = "Field Display Name", Description = "Help text for editors")]
    [Required]  // or [Optional]
    public virtual string FieldName { get; set; }

    // Additional properties follow...
}
```

### Field Types Reference

| Content Type | C# Type | Usage | Example |
|--------------|---------|-------|---------|
| Short text | `string` | Title, single-line input | "Hero Section Title" |
| Long text | `XhtmlString` | Rich text (bold, italic, links) | Article body, description |
| Number | `int`, `decimal` | Quantities, prices, orders | 5, 19.99 |
| True/false | `bool` | Toggles, feature flags | true |
| Date/time | `DateTime` | Publication dates, event times | 2026-03-31 |
| Single image | `ContentReference` | One image asset | Product photo |
| Multiple items | `ContentArea` | Repeating blocks, gallery | List of feature blocks |
| Single link | `ContentReference` | Link to page or file | Related article, PDF download |
| Dropdown list | `string` with custom editor | Predefined options | "Light" \| "Dark" theme |
| Custom object | `StructuredData` or separate class | Complex nested data | Author + bio + image |

### Design Steps

**1. List all fields from requirements:**

From your initialization document, create a table of all content fields needed:

```
| Field Name | Type | Required | Validation | Author Guidance |
|------------|------|----------|------------|-----------------|
| Title | String | Yes | Max 100 chars | SEO title, appears in search results |
| Description | XhtmlString | No | – | Introductory paragraph, max 500 words |
| Hero Image | ContentReference | Yes | Allowed types: ImageFile | Recommended size: 1920 x 600px |
| CTA Button Link | ContentReference | No | Allowed types: PageData | Link to destination page |
| Dark Theme | Boolean | No | – | Enable dark mode styling |
```

**2. Design validation attributes:**

For each field, add validation:

```csharp
[Display(Name = "Title")]
[Required(ErrorMessage = "Title is required")]
[StringLength(100, MinimumLength = 10,
    ErrorMessage = "Title must be between 10 and 100 characters")]
public virtual string Title { get; set; }

[Display(Name = "Description")]
[UIHint(UIHint.Textarea)]  // Multi-line text box
public virtual XhtmlString Description { get; set; }

[Display(Name = "Hero Image")]
[Required(ErrorMessage = "Hero image is required")]
[AllowedTypes(typeof(ImageFile))]  // Only images allowed
public virtual ContentReference HeroImage { get; set; }

[Display(Name = "Enable Dark Theme")]
[DefaultValue(false)]
public virtual bool DarkTheme { get; set; }
```

**3. Design editor grouping (if needed):**

Use `GroupName` attribute to organize fields into tabs:

```csharp
[Display(Name = "Title", GroupName = "Content")]
public virtual string Title { get; set; }

[Display(Name = "Image", GroupName = "Media")]
public virtual ContentReference HeroImage { get; set; }

[Display(Name = "Styling", GroupName = "Display")]
public virtual bool DarkTheme { get; set; }
```

**4. Design content relationships:**

If this component references other content (ContentReference or ContentArea):

```csharp
[Display(Name = "Related Articles")]
[AllowedTypes(typeof(ArticlePage))]  // Only articles allowed
public virtual ContentArea RelatedArticles { get; set; }

[Display(Name = "Author")]
[AllowedTypes(typeof(AuthorBlock))]  // Single reference to author block
public virtual ContentReference AuthorReference { get; set; }
```

**5. Add categories for CMS organization:**

```csharp
[ContentType(
    DisplayName = "Feature Block",
    GUID = "...",
    GroupName = "Blocks",  // Organize in CMS UI
    Order = 100
)]
public class FeatureBlock : BlockData
{
    // properties...
}
```

### Example: Feature Block (CMS 12)

```csharp
using EPiServer.Core;
using EPiServer.DataAnnotations;
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
        [Required]
        [AllowedTypes(typeof(ImageFile))]
        public virtual ContentReference Image { get; set; }

        [Display(Name = "Image Alt Text", GroupName = "Media", Order = 40)]
        [StringLength(125)]  // WCAG requirement
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

### Content Model Specification (CMS 12)

**Document these details:**

```markdown
## Content Model Specification: Feature Block

### Schema
```

**Namespace:** MyProject.Models.Blocks
**Class Name:** FeatureBlock
**Base Class:** BlockData
**Content Type GUID:** [12345678-1234-1234-1234-123456789012]
**Category:** Blocks

### Properties

| Property | Type | Required | Validation | Editor UI | Notes |
|----------|------|----------|------------|-----------|-------|
| Title | string | Yes | Max 100, min 5 | Single-line text | Page title, SEO relevant |
| Description | XhtmlString | No | – | Multi-line rich text | Introductory paragraph |
| Image | ContentReference | Yes | ImageFile only | Asset picker | Hero image, 1920x600 recommended |
| ImageAltText | string | No | Max 125 | Single-line text | WCAG alt text requirement |
| ButtonLabel | string | No | Max 50 | Single-line text | CTA button text, e.g., "Learn More" |
| ButtonLink | ContentReference | No | PageData only | Page picker | Destination page for CTA |
| BackgroundColor | string | No | Default: white | Dropdown | Options: white, light-gray, dark |

### Author Guidance
- Title should be concise and SEO-friendly (appears in search results)
- Description provides context; keep to 1–2 paragraphs
- Image should be landscape format (1920x600px minimum)
- Alt text is required for accessibility; describe the image briefly
- Button is optional; leave blank if no CTA needed
- Background color affects entire block; choose based on page context

### Validation Rules
1. Title: Required, 5–100 characters
2. Image: Required, must be an image file (no PDFs)
3. ButtonLink: Only PageData (pages, not blocks or files)
4. ImageAltText: Recommended, max 125 characters (WCAG requirement)

### Relationships
- Parent: Can be added to any PageData (on content pages, landing pages)
- Children: Image (required), Button Link (optional page reference)
- Multiplicity: Component allows multiple blocks of this type on same page (via ContentArea)

### Display Variations
- [ ] Light theme (white background)
- [ ] Dark theme (dark background)
- (Can be controlled via BackgroundColor property)

### Performance Notes
- Image will be lazy-loaded on frontend (implement in view)
- No database queries in property getters (keep model simple)
- ContentReference resolution handled by content loader
```

---

## C. Design Content Model for SaaS CMS

**Platform:** Optimizely SaaS CMS (cloud-based, headless, Content Graph)

**Action:** Design a content type definition with properties, validation, and Visual Builder mapping.

### Structure Overview

For SaaS CMS, content types are defined as YAML (CLI definition) or REST API JSON. The schema includes:

```yaml
contentTypes:
  - identifier: component_identifier
    displayName: Component Display Name
    description: What authors use this for
    properties:
      - identifier: property_name
        displayName: Property Display Name
        description: Help text
        type: text | richText | asset | contentReference | structuredData | etc.
        required: true|false
        # Additional constraints...
    visualBuilder:
      elementType: section|container|column  # How it renders in Visual Builder
      displayTemplate: default|dark|compact  # Display options
      styles:
        backgroundColor: # CSS class mapping
        textColor:
```

### Field Types Reference

| Content Type | GraphQL Type | Usage | Example |
|--------------|--------------|-------|---------|
| Short text | String | Title, single-line input | "Hero Section Title" |
| Long text | String (with UI hint) | Rich text (formatted) | Article body |
| Rich text | RichText | Rich HTML content | Description with bold, links |
| Number | Integer, Float | Quantities, prices | 5, 19.99 |
| True/false | Boolean | Toggles, flags | true |
| Date/time | DateTime | Publication dates | 2026-03-31 |
| Single asset | Asset | Image, video, file | Product photo |
| Multiple assets | Array[Asset] | Gallery, slider | List of images |
| Single link | ContentReference | Link to content | Related article |
| Multiple links | Array[ContentReference] | List of content | Featured articles |
| Dropdown | String (with allowed values) | Predefined options | "Light" \| "Dark" |
| Custom object | StructuredData | Nested object | Author { name, bio, image } |

### Design Steps

**1. Create content type definition (YAML):**

```yaml
contentTypes:
  - identifier: feature_block
    displayName: Feature Block
    description: A promotional block with title, description, and call-to-action
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
        description: Introductory text, supports rich formatting
        type: richText
        required: false

      - identifier: image
        displayName: Image
        description: Feature image (landscape format recommended)
        type: asset
        required: true
        allowedTypes:
          - image

      - identifier: imageAltText
        displayName: Image Alt Text
        description: Accessibility text describing the image
        type: text
        required: false
        settings:
          maxLength: 125

      - identifier: buttonLabel
        displayName: Button Label
        description: Text for the call-to-action button
        type: text
        required: false
        settings:
          maxLength: 50

      - identifier: buttonLink
        displayName: Button Link
        description: Destination page for the CTA button
        type: contentReference
        required: false
        allowedTypes:
          - page

      - identifier: backgroundColor
        displayName: Background Color
        description: Theme color for the block
        type: text
        required: false
        allowedValues:
          - white
          - light-gray
          - dark

    visualBuilder:
      elementType: section
      displayTemplates:
        - identifier: default
          displayName: Default (Light)
          description: Light background with dark text
        - identifier: dark
          displayName: Dark
          description: Dark background with light text
      styles:
        backgroundColor:
          cssClass:
            default: bg-white
            dark: bg-dark
        textColor:
          cssClass:
            default: text-dark
            dark: text-light
```

**2. Map content type to Visual Builder:**

Visual Builder rendering requires mapping content types to Element/Section/Column in the Experience:

```yaml
visualBuilder:
  elementType: section  # How this component renders
  # Options: section (full-width block), container (constrained width), column (flex column)

  displayTemplates:
    # Define display variations (dark, light, compact, etc.)
    - identifier: default
      displayName: Default
    - identifier: dark
      displayName: Dark
```

**3. Define properties with constraints:**

Each property should include:
- **identifier**: Machine-readable name (kebab-case)
- **displayName**: User-friendly label for editors
- **description**: Help text explaining usage
- **type**: text, richText, asset, contentReference, structuredData, etc.
- **required**: true/false
- **settings**: Type-specific constraints (maxLength, minValue, allowedValues, etc.)

**4. Example: Feature Block (SaaS CMS)**

```yaml
contentTypes:
  - identifier: feature_block
    displayName: Feature Block
    description: A promotional block with title, image, and call-to-action button
    properties:
      - identifier: title
        displayName: Title
        type: text
        required: true
        settings:
          minLength: 5
          maxLength: 100

      - identifier: description
        displayName: Description
        type: richText
        required: false
        settings:
          allowedFormats:
            - bold
            - italic
            - link

      - identifier: image
        displayName: Feature Image
        type: asset
        required: true
        settings:
          allowedTypes:
            - image
          maxSize: 5000000  # 5MB

      - identifier: imageAltText
        displayName: Image Alt Text
        type: text
        required: false
        settings:
          maxLength: 125
          helpText: "Describe the image for accessibility (WCAG requirement)"

      - identifier: buttonLabel
        displayName: Button Label
        type: text
        required: false
        settings:
          maxLength: 50
          helpText: "e.g., 'Learn More', 'Shop Now'"

      - identifier: buttonLink
        displayName: Button Link
        type: contentReference
        required: false
        settings:
          allowedTypes:
            - page
          allowMultiple: false

      - identifier: backgroundColor
        displayName: Background Color
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
        - identifier: dark
          displayName: Dark Theme
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

### Content Model Specification (SaaS CMS)

**Document these details:**

```markdown
## Content Model Specification: Feature Block

### Identifier
- Content Type ID: `feature_block`
- Display Name: Feature Block
- Description: A promotional block with title, image, and call-to-action

### Properties

| Property ID | Type | Required | Constraints | Purpose |
|-------------|------|----------|-------------|---------|
| title | text | Yes | Max 100, min 5 | SEO title, appears in search |
| description | richText | No | Formatting: bold, italic, link | Introductory paragraph |
| image | asset | Yes | Type: image, max 5MB | Hero image, 1920x600 recommended |
| imageAltText | text | No | Max 125 | WCAG alt text requirement |
| buttonLabel | text | No | Max 50 | CTA button text |
| buttonLink | contentReference | No | Type: page, single ref | Destination page |
| backgroundColor | text | No | Enum: white, light-gray, dark | Theme styling |

### Visual Builder Mapping

| Element Type | Display Template | Styles |
|--------------|------------------|--------|
| section | Default (Light) | bg-white, text-gray-900 |
| – | Dark Theme | bg-gray-900, text-white |

### Content Graph Query Template

```graphql
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
      title
    }
    backgroundColor: _metadata {
      // Display template metadata
      templateId
    }
  }
}
```

### Author Guidance
- Title should be concise and SEO-friendly
- Description provides context; 1–2 sentences recommended
- Image should be landscape (1920x600px minimum)
- Alt text is required for accessibility
- Button is optional; leave blank if no CTA needed
- Background color controls block styling

### Validation Rules
1. Title: Required, 5–100 characters
2. Image: Required, image file only, max 5MB
3. ButtonLink: Optional, references page content only
4. ImageAltText: Recommended, max 125 characters (WCAG)

### Relationships
- Parent: Can appear on any page (placed by editor in Visual Builder)
- Children: Image reference (required), Button link (optional)
- No multiplicity constraints (multiple instances per page allowed)

### Performance Notes
- Image will be lazy-loaded (implement in React component)
- Content Graph query should cache response (30 minutes TTL)
- No N+1 queries (load image metadata in single query)
```

---

## D. Content Model Review and Approval

**Action:** Present the content model to stakeholders for feedback and approval.

**Review participants:**
- [ ] Solution Architect (validates technical design)
- [ ] Content Lead/Editor (validates author experience)
- [ ] Business Owner (validates requirements coverage)
- [ ] Lead Developer (identifies implementation risks)

**Review checklist:**
- [ ] All requirements from step-01 are addressed by a property
- [ ] Field names are clear and unambiguous (editors understand what goes where)
- [ ] Validation rules are realistic (not too restrictive, not too permissive)
- [ ] Required fields are justified (is this field truly necessary?)
- [ ] Relationships are correct (allowed types, multiplicity)
- [ ] Performance considerations are documented
- [ ] Accessibility requirements are covered (alt text, ARIA labels)

**Feedback loops:**
- If reviewers suggest changes → Update model → Re-review
- If confusion about intent → Clarify in description/help text → Re-review
- Once approved → Lock model (no changes without architect approval)

**Deliverable:** Signed-off content model specification with approval signatures.

---

## SUCCESS METRICS

| Metric | Pass Criteria | Validation |
|--------|--------------|-----------|
| Model complete | All fields from step-01 documented | Content model spec includes all properties |
| Validation clear | Every field has validation rules | Constraints document is specific (e.g., "max 100 chars", not "reasonable") |
| Author experience documented | Editor guidance provided for each field | Help text, grouping, and recommendations are clear |
| Stakeholder approval | All reviewers have signed off | Approval section in spec completed with signatures/dates |
| No implementation started | Content model only (no code) | No C#, React, or view code in deliverable |
| Platform-specific | Design is CMS 12 OR SaaS CMS (not mixed) | Specification is consistent with target platform |

---

## FAILURE MODES

| Failure | Cause | Recovery |
|---------|-------|----------|
| Model too complex (20+ properties) | Requirements not simplified | Return to step-01; split into multiple smaller components |
| Ambiguous field names (e.g., "content") | Poor naming conventions | Revise field names to be specific; get design system naming conventions |
| Stakeholders request UI changes | Model is conflated with view design | Clarify that model defines data, not presentation; separate concerns |
| Reviewer wants to add fields mid-design | Scope creep from step-01 | Defer new requirements to Phase 2 update; lock current model for step-03 |
| Performance concerns (lazy-load, caching) | Not documented in model | Add performance notes section; plan caching and lazy-loading in step-03 |
| Accessibility gaps (missing alt text field) | Requirements missed | Add accessibility fields; re-review with accessibility specialist |

---

## NEXT STEP

Once the content model is approved and locked:

→ **Proceed to step-03-implement: Build the component code**

In step-03, you will:
- For CMS 12: Create the C# class file, MVC controller (if needed), and .cshtml view
- For SaaS CMS: Create the content type definition (via CLI), React component, and Content Graph query

The content model specification from step-02 is the contract that drives all step-03 decisions. Keep it visible during implementation.
