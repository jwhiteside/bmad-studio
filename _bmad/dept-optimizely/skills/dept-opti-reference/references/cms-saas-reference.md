# Optimizely CMS (SaaS) Comprehensive Reference Guide

**Version:** March 2026
**Scope:** Complete documentation synthesis for developers, content managers, and administrators

---

## Table of Contents

1. [Platform Overview](#platform-overview)
2. [Content Type System](#content-type-system)
3. [Property Types](#property-types)
4. [Visual Builder & Composition](#visual-builder--composition)
5. [Content Modelling](#content-modelling)
6. [JavaScript SDK](#javascript-sdk)
7. [REST API](#rest-api)
8. [Content Management](#content-management)
9. [Forms](#forms)
10. [Asset Management](#asset-management)
11. [Search & Graph Integration](#search--graph-integration)
12. [Administration](#administration)
13. [Localisation](#localisation)
14. [SEO & Analytics](#seo--analytics)
15. [Glossary](#glossary)

---

## Platform Overview

### What is Optimizely CMS (SaaS)?

Optimizely CMS (SaaS) is a headless content management system provided as a managed service. It separates content management from presentation delivery, enabling you to manage content once and distribute it across multiple platforms and devices.

### Architecture

**Headless Architecture** - The CMS decouples content (back end) from presentation (front end), allowing:
- Multiple frontend applications to consume the same content
- Independent scaling of content and delivery layers
- Technology flexibility for both content and presentation
- API-first design enabling programmatic content access

### Key Components

**Visual Builder**: Intuitive drag-and-drop interface for content creation with real-time previews
**REST API**: Programmatic configuration and management of CMS instances, content types, and content
**Optimizely Graph**: Query language and content retrieval engine for efficient content access
**Forms**: Build and manage data collection forms within the CMS

### Key Characteristics

- **Flexible content structure** - From simple text to complex nested structures
- **Multi-format support** - Text, images, videos, custom components
- **Content organization** - Via content types and properties
- **Workflow management** - Publishing, approvals, and versioning
- **Scalability** - Handle multiple sites and applications
- **Security** - Separate content from presentation reduces attack surface

---

## Content Type System

### Content Base Types

CMS (SaaS) provides fundamental content types that serve as building blocks:

**Page**
- Top-level content entity representing a publishable web page
- Contains properties and can host Experiences (Visual Builder content)
- Supports publishing workflow, versioning, and approval
- Can have metadata like SEO properties and publication schedule
- Example: Product page, blog post, landing page

**Block**
- Reusable content component that can be embedded in Pages or other Blocks
- Shared blocks can be published independently and referenced from multiple locations
- Inline blocks are embedded directly within content without independent publication
- Reduces duplication and enables content reuse across site
- Example: Header, footer, product teaser, call-to-action

**Element**
- Basic content unit within Visual Builder compositions
- Individual, configurable component with properties and styling
- Combines content properties with display templates
- Example: Text element, image element, button element

**Section**
- Container for Elements within Visual Builder
- Provides layout and composition structure
- Groups related Elements together
- Supports grid and outline layout modes

**Experience**
- Visual Builder content composition made up of Sections
- Created from scratch or from Blueprints
- Full-featured composition environment with layout, styles, and templates
- Can be nested and reused

**Media**
- Digital asset type: images, videos, documents
- Managed through DAM (Digital Asset Management)
- Can be referenced from content properties
- Supports metadata, tagging, and organization

### Content Type Hierarchy

```
Page
├── Properties (metadata, SEO, scheduling)
├── Content Areas (Section containers)
└── Experiences (Visual Builder compositions)
    ├── Sections (layout containers)
    │   └── Elements (content units)
    │       ├── Text content
    │       ├── Images/Media
    │       ├── Links
    │       └── Custom components
    └── Inline Blocks
        └── Block content

Block (Shared)
├── Properties
├── Sections/Elements (if Visual Builder)
└── Can be referenced from Pages or other Blocks

Block (Inline)
└── Embedded directly within content
```

---

## Property Types

Property types define the structure and validation of content attributes. Each property has configuration options for default values, validation, and display.

### Text Property

**Use cases**: Headlines, descriptions, body text, short text fields

**Configuration**:
- Default value
- Maximum length constraints
- Input type: single-line or multi-line (textarea)
- Required/optional
- Display format options

**Example**: 
- Headline (text, required)
- Meta description (text, max 160 characters)
- Product name (text, required)

**Validation**: 
- Length-based
- Pattern matching (regex)
- Custom validation rules

### Number Property

**Use cases**: Prices, quantities, ratings, counters, numeric IDs

**Configuration**:
- Data type: Integer or Decimal
- Default value
- Minimum/maximum constraints
- Step size (for decimal increments)
- Display format (currency, percentage, etc.)

**Validation**:
- Range checking (min/max)
- Required/optional
- Type enforcement

### DateTime Property

**Use cases**: Publication dates, event times, schedule start/end, timestamps

**Configuration**:
- Include time or date only
- Default to current time
- Timezone handling
- Display format
- Required/optional

**Example**:
- Publication date
- Event date and time
- Article publish date with scheduling

### Choice Property

**Use cases**: Dropdown selections, radio buttons, category/type selection, status fields

**Configuration**:
- Predefined list of options
- Single or multiple selection allowed
- Default selection
- Display as dropdown, checkboxes, or radio buttons
- Required/optional

**Example**:
```
Status: Draft | Published | Archived
Product Type: Electronics | Clothing | Books | Home
Featured: Yes | No
```

### Content Property

**Use cases**: Referencing other content items, creating content relationships

**Configuration**:
- Target content type(s) that can be referenced
- Single or multiple content items allowed
- Display name and preview configuration
- Required/optional
- Validation: restrict to specific content types

**Example**:
- Author reference (links to Author content type)
- Related products (multiple references to Product content type)
- Parent category (single reference to Category)

### Block Property

**Use cases**: Embedding blocks within pages, flexible block composition

**Configuration**:
- Allowed block types
- Single or multiple blocks
- Display mode (grid or list)
- Sort order options
- Required/optional

**Example**:
- Page sections (array of Block content)
- Header block (single required block)
- Call-to-action blocks (multiple allowed)

### Link Property

**Use cases**: External URLs, internal page references, downloadable files

**Configuration**:
- External URL, internal page link, or email link
- Display text
- Target (new window/tab, same window)
- Required/optional
- Validation: URL format, required fields

**Example**:
- Navigation links
- Download links
- External resource links
- Related article links

### Guid Property

**Use cases**: Unique identifiers, mapping to external systems, legacy ID storage

**Configuration**:
- Auto-generated or manual GUID
- Display format
- Required/optional

**Use in integrations**: Map CMS content to external system IDs

### Language-Specific Properties

Certain properties can be configured to vary by language/locale.

**Configuration**:
- Mark property as language-specific during content type definition
- Property value differs for each language variant
- Each language gets its own input field
- Applies to: Text, RichText, Choice, Link properties

**Example**:
- Product description in English vs French vs German
- Navigation labels in multiple languages
- Country-specific pricing
- Localized images or media

**Setting up**:
1. In content type definition, mark applicable properties as language-specific
2. When editing content, provide values for each enabled language
3. Query API with language parameter to get language-specific values

### Page Properties

Pages support additional property configurations for page-level metadata:

**Common page properties**:
- Title (SEO title, distinct from display heading)
- Meta description (for search results)
- URL slug/path
- Publication date
- Author
- Category/tags
- Featured image
- Open Graph properties (social sharing)
- Structured data (schema.org markup)

**Page-specific configuration**:
- SEO properties group
- Social sharing metadata
- Publishing schedule (delayed publication)
- Preview settings
- Canonical URL
- Robots directives (index, follow, etc.)

### Property Groups

Properties can be organized into logical groups for cleaner UI:

**Benefits**:
- Reduces visual clutter in editing interface
- Groups related fields together
- Improves content editor experience
- Optional collapsible sections

**Example groups**:
```
SEO & Metadata
├── Title
├── Meta description
├── Keywords
└── Canonical URL

Publishing
├── Publication date
├── Status
├── Author
└── Reviewer

Content
├── Body text
├── Featured image
└── Related items
```

---

## Visual Builder & Composition

### Visual Builder Overview

Visual Builder is an interactive drag-and-drop interface for creating and organizing visual content compositions.

**Key features**:
- Real-time preview of content
- Drag-and-drop interface
- Component library with reusable elements
- Style management and theming
- Responsive design preview
- Template system for consistent output

### Composition Model

**Experiences** - Top-level Visual Builder compositions
- Full-featured visual content creation
- Made up of Sections and Elements
- Created from scratch or from Blueprints
- Can include inline blocks
- Supports publishing and versioning

**Sections** - Layout containers within Experiences
- Organize Elements into logical groups
- Support multiple layout modes (Grid, Outline)
- Configurable spacing and styling
- Can be duplicated and reused within Experience

**Elements** - Individual content units
- Text elements (headings, paragraphs, rich text)
- Image/media elements
- Link/button elements
- Custom component elements
- Each Element has properties and styling

**Inline Blocks** - Block content embedded directly
- Reusable content blocks embedded in Experience
- Distinct from Shared Blocks (published separately)
- Content inherited from Block type definition
- Can be replaced with different block
- Instances don't exist independently

### Layout Systems

**Grid Layout**
- CSS Grid-based layout system
- Flexible column definitions
- Row and column spanning
- Responsive grid configurations
- Supports auto-placement

**Outline Layout**
- Hierarchical, tree-like structure
- Parent-child nesting
- Depth-based organization
- Sequential flow
- Use for linear, nested structures

### Styles & Theming

**Style management**:
- Create CSS classes and variables
- Apply styles to Sections and Elements
- Responsive style breakpoints (mobile, tablet, desktop)
- Override inherited styles at component level
- Reuse style definitions across site

**Display templates**:
- Define how content renders on frontend
- Map Element properties to HTML output
- Support conditional rendering
- Custom component templates
- Fallback templates for unknown elements

### Blueprints

**What are Blueprints?**
- Saved Experience templates
- Starting point for new content creation
- Reusable content structures and layouts
- Can include default values and placeholder content

**Creating Blueprints**:
1. Design an Experience with desired structure, layout, and styling
2. Use "Save as Blueprint" to save the template
3. Specify Blueprint name and description
4. Content in Blueprint becomes template

**Using Blueprints**:
1. Click "Create from Blueprint" when creating new Experience
2. Select blueprint to use
3. Template content and structure is applied
4. Edit content and properties as needed
5. Can override any aspect (layout, styling, content)

**Blueprint management**:
- View and organize Blueprints
- Delete unused Blueprints
- Update Blueprint (edit template for all future uses)
- Preview Blueprint before using

---

## Content Modelling

### What is Content Modelling?

Content modelling is the process of defining the structure, types, and organization of content in your CMS. It involves:
- Identifying content types needed for your business
- Defining properties and relationships
- Setting up reusable components and templates
- Establishing content taxonomy and organization

### Design Approach

**Three implementation paths**:

1. **Programmatic (SDK/CLI)**: Use code to define content types
2. **REST API**: Use API calls to create and manage content types
3. **UI (Admin Interface)**: Point-and-click content type creation

### Content Type Definition

**Creating a content type includes**:
- Type name and identifier
- Display name (label for UI)
- Description
- Icon/visual identification
- Property definitions with names and types
- Validation rules
- Group assignments for UI organization
- Default values
- Publication behavior

**Example: Product Content Type**

```
Name: Product
Properties:
  - title (Text, required)
  - sku (Text, required, unique)
  - description (Text, multi-line)
  - price (Number, decimal, required)
  - category (Choice: Electronics|Clothing|Books)
  - manufacturer (Content, references Manufacturer type)
  - images (Block, multiple allowed)
  - reviews (Content, multiple, references Review type)
  - featured (Choice: Yes|No, default=No)
  - seoTitle (Text, max 60, language-specific)
  - seoDescription (Text, max 160, language-specific)
```

### Content Type Relationships

**Content references** (Content property):
- One content item references another
- Can be required or optional
- Can restrict to specific content types
- Support 1:1, 1:N, N:N relationships
- Resolved through API as nested objects

**Block inclusion** (Block property):
- Embed blocks within content
- Blocks can be shared or inline
- Ordered arrays of blocks
- Dynamic composition

**Example relationship**:
```
Page
├── Author (Content reference)
├── Category (Content reference)
├── Related Items (multiple Content references)
├── Content Sections (Block array)
└── Tags (multiple Choice)
```

### Content Type Inheritance & Nesting

**Shared Block Pattern**:
- Create Block content types for reusable components
- Include in Pages via Block properties or inline
- Promotes DRY principle
- Simplifies maintenance

**Type composition**:
- Content types reference other content types
- Enables modular design
- Supports deep nesting (with performance considerations)
- API returns nested objects

### Contracts & Validation

**Contracts** define strict content requirements:
- Mandatory properties (required fields)
- Type constraints
- Relationship validation
- Validation rules per property
- Enforce at creation/publishing

**Use cases**:
- Ensure SEO fields are filled
- Verify required author or category
- Validate price ranges
- Check image dimensions

### Property Groups & Organization

**Group properties** for cleaner editing experience:
- Basic/Core properties
- SEO & Metadata
- Publishing & Workflow
- Custom groupings

**UI generation**:
- Collapsible sections
- Tab-based organization
- Required fields highlighting
- Contextual help text

### Programmatic Content Type Definition

Using SDK or CLI:
```javascript
// Example: Define content type programmatically
const productType = {
  name: 'Product',
  displayName: 'Product',
  properties: {
    title: {
      type: 'Text',
      required: true,
    },
    description: {
      type: 'Text',
      multiline: true,
    },
    price: {
      type: 'Number',
      dataType: 'decimal',
      required: true,
    },
    category: {
      type: 'Choice',
      options: ['Electronics', 'Clothing', 'Books'],
    },
  },
};
```

#
### Additional Authentication Details

**Token expiration**:
- Access tokens expire after 300 seconds (5 minutes)
- Request a new token before expiration
- Automatic token refresh recommended in SDK

**API key permissions**:
- Configure content type permissions
- Set operation restrictions (read, write, delete)
- Manage per content type
- Navigate to Settings > Set Access Rights

**Impersonation (Preview)**:
```
POST https://api.cms.optimizely.com/oauth/token
Content-Type: application/json
{
  "grant_type": "client_credentials",
  "client_id": "CLIENT_ID",
  "client_secret": "CLIENT_SECRET",
  "act_as": "username@example.com"
}
```
- Warning: Only available in preview endpoints
- Will be removed in future versions

### API Scope Claims

**Required scope**: `api:admin`
- Automatically included in access tokens
- Recently added (no breaking changes)
- May require partner implementation updates in future

## REST API Content Type Management

**Create content type via API**:
```
POST /api/contenttypes
Content-Type: application/json
Authorization: Bearer {JWT}

{
  "name": "Product",
  "displayName": "Product",
  "description": "Product content type",
  "properties": [
    {
      "name": "title",
      "displayName": "Title",
      "type": "Text",
      "required": true
    },
    {
      "name": "price",
      "displayName": "Price",
      "type": "Number"
    }
  ]
}
```

**Update content type**:
```
PUT /api/contenttypes/{id}
```

**Delete content type**:
```
DELETE /api/contenttypes/{id}
```

### UI-based Content Type Creation

Via Admin interface:
1. Navigate to Content Types
2. Click "Create Content Type"
3. Enter name, display name, description
4. Add properties by clicking "Add Property"
5. Configure each property (name, type, validation)
6. Organize into groups if desired
7. Save and publish

---

## JavaScript SDK


### CLI Setup

**Install CLI**:
```bash
npx @optimizely/cms-cli@latest
```

**No global installation needed** - Run directly with npx

**CLI commands**:
- Initialize project
- Upload content models
- Generate TypeScript types
- Sync with CMS

### Installation

**Install via npm**:
```bash
npm install @optimizely/cms-sdk
```

**Setup in your project**:
```javascript
import { ContentManager } from '@optimizely/cms-sdk';

const cms = new ContentManager({
  endpoint: 'https://your-cms-instance.example.com',
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
});
```

### Configuration

**Authentication options**:
- API credentials (client ID / client secret)
- Bearer JWT token
- OAuth 2.0 credentials

**Configuration example**:
```javascript
const config = {
  endpoint: 'https://your-cms.optimizely.com/graphql',
  accessToken: 'your-api-token',
  debug: true, // Enable detailed logging
  cacheStrategy: 'network-first', // or 'cache-first'
  timeout: 30000, // 30 seconds
};

const cms = new ContentManager(config);
```

### Content Fetching

**Fetch content by key**:
```javascript
const page = await cms.getContent('product-page-key', {
  expand: ['author', 'relatedProducts'],
  language: 'en',
});
```

**Fetch with filters**:
```javascript
const products = await cms.getContentByType('Product', {
  filter: {
    category: 'Electronics',
    featured: true,
  },
  language: 'en',
  limit: 50,
  offset: 0,
});
```

**Search content**:
```javascript
const results = await cms.search('laptop', {
  contentTypes: ['Product'],
  limit: 20,
});
```

### Content Type Modelling (SDK)

**Define content types in code**:
```javascript
cms.defineType('Product', {
  fields: {
    title: 'Text',
    description: 'Text',
    price: 'Number',
    category: 'Choice',
    images: 'Block',
  },
  validation: {
    title: { required: true },
    price: { required: true, min: 0 },
  },
});
```

**Custom type validation**:
```javascript
cms.defineType('Product', {
  fields: { /* ... */ },
  validate: (data) => {
    if (data.price < 0) throw new Error('Price must be positive');
    if (!data.title || data.title.length < 3) {
      throw new Error('Title must be at least 3 characters');
    }
  },
});
```

### Rendering with React

**Basic rendering**:
```javascript
import React, { useEffect, useState } from 'react';
import { ContentRenderer } from '@optimizely/cms-sdk/react';

function ProductPage({ slug }) {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cms.getContent(slug).then(setContent).finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div>Loading...</div>;
  if (!content) return <div>Not found</div>;

  return (
    <ContentRenderer
      content={content}
      displaySettings={{
        Product: ProductDisplay,
        Block: BlockDisplay,
      }}
    />
  );
}
```

**Custom component mapping**:
```javascript
const displaySettings = {
  Product: ({ data }) => (
    <div className="product">
      <h1>{data.title}</h1>
      <p className="price">${data.price}</p>
      <p>{data.description}</p>
    </div>
  ),
  Image: ({ data }) => (
    <img src={data.url} alt={data.alt} />
  ),
  TextBlock: ({ data }) => (
    <div className="text-block">{data.text}</div>
  ),
};
```

### Creating Content via SDK

**Create new content**:
```javascript
const newProduct = await cms.createContent({
  type: 'Product',
  data: {
    title: 'New Product',
    description: 'Product description',
    price: 99.99,
    category: 'Electronics',
  },
  language: 'en',
});
```

**Update content**:
```javascript
await cms.updateContent(productId, {
  title: 'Updated Title',
  price: 129.99,
});
```

**Publish content**:
```javascript
await cms.publishContent(productId, {
  language: 'en',
  version: 1,
});
```

### Live Preview with React

**Enable live preview**:
```javascript
import { useLivePreview } from '@optimizely/cms-sdk/react';

function ProductPage() {
  const { content, isPreviewMode } = useLivePreview('product-key');

  return (
    <div className={isPreviewMode ? 'preview-mode' : ''}>
      <h1>{content.title}</h1>
      {isPreviewMode && <div className="preview-badge">Preview Mode</div>}
    </div>
  );
}
```

**Preview configuration**:
```javascript
const previewConfig = {
  enabled: true,
  autoUpdate: true,
  contentKey: 'page-key',
  version: 'draft',
};
```

### GraphClient Utility Functions

**Initialize GraphClient**:
```javascript
import { GraphClient } from '@optimizely/cms-sdk';

const graphClient = new GraphClient({
  endpoint: 'https://your-cms.optimizely.com/graphql',
  accessToken: 'your-token',
});
```

**Query content**:
```javascript
const query = `
  query {
    products(where: { category: "Electronics" }) {
      edges {
        node {
          id
          title
          price
        }
      }
    }
  }
`;

const response = await graphClient.query(query);
```

**Mutation - create content**:
```javascript
const mutation = `
  mutation CreateProduct($input: CreateProductInput!) {
    createProduct(input: $input) {
      product {
        id
        title
        price
      }
    }
  }
`;

const variables = {
  input: {
    title: 'New Product',
    price: 99.99,
  },
};

const response = await graphClient.mutate(mutation, variables);
```

### RichText Handling

**RichText property type**:
- Stores formatted text content
- Supports HTML markup, links, formatting
- Configurable editor (TinyMCE)

**Normalize RichText in React**:
```javascript
import { RichTextRenderer } from '@optimizely/cms-sdk/react';

function ArticleContent({ richText }) {
  return <RichTextRenderer content={richText} />;
}
```

**RichText attribute normalization**:
- Sanitizes HTML to prevent XSS
- Removes dangerous attributes
- Normalizes class names and IDs
- Preserves semantic markup

**CSS property handling**:
- RichText can contain inline styles
- Convert inline styles to class names
- Define CSS variables for reusable styles
- Support mixed HTML attributes and CSS

### RichText Component Reference

**Supported elements**:
- Paragraphs, headings (h1-h6)
- Bold, italic, underline, strikethrough
- Lists (ordered, unordered)
- Links with target and title attributes
- Images with alt text
- Code blocks and inline code
- Blockquotes
- Tables

**Custom RichText rendering**:
```javascript
function CustomRichText({ content }) {
  const renderConfig = {
    p: (props) => <p className="body-text">{props.children}</p>,
    h1: (props) => <h1 className="heading-1">{props.children}</h1>,
    a: (props) => <a className="link" {...props}>{props.children}</a>,
    img: (props) => (
      <figure>
        <img {...props} />
        <figcaption>{props.alt}</figcaption>
      </figure>
    ),
  };

  return <RichTextRenderer content={content} renderConfig={renderConfig} />;
}
```

### Work with DAM Assets

**Access DAM assets**:
```javascript
const asset = await cms.getAsset(assetId, {
  expand: ['metadata'],
});

// Returns: {
//   id: 'asset-123',
//   url: 'https://cdn.example.com/image.jpg',
//   mimeType: 'image/jpeg',
//   size: 2048576,
//   width: 1920,
//   height: 1080,
//   metadata: { /* ... */ }
// }
```

**Search assets**:
```javascript
const assets = await cms.searchAssets({
  query: 'product-image',
  mimeType: 'image/*',
  limit: 50,
});
```

**Update asset metadata**:
```javascript
await cms.updateAsset(assetId, {
  title: 'Product Image',
  description: 'Main product image for marketing',
  tags: ['product', 'featured'],
});
```

**Asset URL variations**:
```javascript
const assetUrl = asset.url;
const thumbnail = asset.getUrl({ width: 200, height: 200 });
const responsive = asset.getUrl({ sizes: ['640w', '1280w'] });
```

### Work with Experiences

**Fetch Experience content**:
```javascript
const experience = await cms.getContent('homepage-experience', {
  type: 'Experience',
  expand: ['sections.elements'],
});

// Returns structure:
// {
//   type: 'Experience',
//   sections: [
//     {
//       id: 'section-1',
//       elements: [
//         { type: 'Text', content: 'Heading' },
//         { type: 'Image', url: '...' }
//       ]
//     }
//   ]
// }
```

**Render Experience in React**:
```javascript
function HomePage() {
  const { content } = useLivePreview('homepage-experience');

  return (
    <div className="homepage">
      {content.sections.map((section) => (
        <Section key={section.id} data={section} />
      ))}
    </div>
  );
}

function Section({ data }) {
  return (
    <section>
      {data.elements.map((element) => (
        <ElementRenderer key={element.id} element={element} />
      ))}
    </section>
  );
}
```

### Display Settings and Templates

**Configure display settings**:
```javascript
const displaySettings = {
  Product: {
    component: ProductComponent,
    template: 'grid',
    props: {
      showPrice: true,
      showRating: true,
    },
  },
  Article: {
    component: ArticleComponent,
    template: 'blog-post',
  },
};

const renderer = new ContentRenderer(content, displaySettings);
```

**Fallback strategy**:
```javascript
const displaySettings = {
  Product: ProductComponent,
  Block: GenericBlockComponent,
  unknown: FallbackComponent,
};

// Unknown content types render with FallbackComponent
```

### Common Use Cases and Best Practices

**1. Content versioning and drafts**:
```javascript
const draftContent = await cms.getContent(key, { version: 'draft' });
const publishedContent = await cms.getContent(key, { version: 'latest' });
```

**2. Multi-language content**:
```javascript
const englishContent = await cms.getContent(key, { language: 'en' });
const frenchContent = await cms.getContent(key, { language: 'fr' });

// Auto-fallback to default language if translation missing
```

**3. Content relationships**:
```javascript
const product = await cms.getContent('product-key', {
  expand: ['author', 'relatedProducts', 'reviews'],
});
// All referenced content fetched in single request
```

**4. Pagination**:
```javascript
const page1 = await cms.getContentByType('Article', {
  limit: 20,
  offset: 0,
});
const page2 = await cms.getContentByType('Article', {
  limit: 20,
  offset: 20,
});
```

**5. Caching strategy**:
```javascript
const config = {
  cacheStrategy: 'stale-while-revalidate',
  cacheTTL: 3600, // 1 hour
};

// Serve cached content while refreshing in background
```

**6. Error handling**:
```javascript
try {
  const content = await cms.getContent(key);
} catch (error) {
  if (error.code === 'NOT_FOUND') {
    return render404();
  } else if (error.code === 'UNAUTHORIZED') {
    redirectToLogin();
  } else {
    logError(error);
    return renderErrorPage();
  }
}
```

---

## REST API

### Authentication & Authorization

**Authentication methods**:
- OAuth 2.0 with JWT bearer tokens
- API key credentials
- Service account authentication

**OAuth 2.0 Token Endpoint**:
```
POST /oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials
&client_id={CLIENT_ID}
&client_secret={CLIENT_SECRET}
```

**Response**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

**Using JWT in requests**:
```
Authorization: Bearer {JWT_TOKEN}
```

**Create API Keys** (for permanent tokens):
1. Navigate to Admin > API Keys
2. Click "Create API Key"
3. Provide name and description
4. Configure scopes (read, write, delete)
5. Save and copy key

**API key usage**:
```
X-API-Key: {API_KEY}
```

**Authorization scopes**:
- `read:content` - Fetch content
- `write:content` - Create/update content
- `delete:content` - Delete content
- `read:contenttypes` - View content types
- `write:contenttypes` - Manage content types
- `manage:settings` - Administer CMS settings

### API Base URL

```
https://api.optimizely.com/content-management-system/v1
```

All endpoints are relative to this base URL.

### Content Endpoints

**Get content by key**:
```
GET /content/{key}
Authorization: Bearer {JWT}

Response (200):
{
  "id": "content-id",
  "key": "product-123",
  "type": "Product",
  "language": "en",
  "version": 1,
  "status": "published",
  "createdAt": "2026-01-15T10:30:00Z",
  "updatedAt": "2026-03-31T15:45:00Z",
  "properties": {
    "title": "Product Title",
    "description": "Product description",
    "price": 99.99,
    "category": "Electronics"
  }
}
```

**List content**:
```
GET /content?type=Product&language=en&limit=50&offset=0
Authorization: Bearer {JWT}

Response (200):
{
  "total": 150,
  "limit": 50,
  "offset": 0,
  "items": [
    { /* content item */ },
    { /* content item */ }
  ]
}
```

**Create content**:
```
POST /content
Authorization: Bearer {JWT}
Content-Type: application/json

{
  "type": "Product",
  "language": "en",
  "properties": {
    "title": "New Product",
    "description": "Product description",
    "price": 99.99
  }
}

Response (201):
{
  "id": "content-id",
  "key": "product-new",
  "type": "Product",
  "language": "en",
  "version": 1,
  "status": "draft"
}
```

**Update content**:
```
PUT /content/{id}
Authorization: Bearer {JWT}
Content-Type: application/json

{
  "properties": {
    "title": "Updated Title",
    "price": 129.99
  }
}

Response (200):
{
  "id": "content-id",
  "version": 2,
  "status": "draft"
}
```

**Delete content**:
```
DELETE /content/{id}
Authorization: Bearer {JWT}

Response (204): No Content
```

**Publish content**:
```
POST /content/{id}/publish
Authorization: Bearer {JWT}
Content-Type: application/json

{
  "language": "en",
  "version": 1
}

Response (200):
{
  "id": "content-id",
  "status": "published",
  "publishedVersion": 1
}
```

**Get content versions**:
```
GET /content/{id}/versions
Authorization: Bearer {JWT}

Response (200):
{
  "versions": [
    {
      "version": 2,
      "status": "draft",
      "updatedAt": "2026-03-31T15:45:00Z",
      "updatedBy": "editor@example.com"
    },
    {
      "version": 1,
      "status": "published",
      "publishedAt": "2026-03-30T10:00:00Z"
    }
  ]
}
```

### Content Type Management Endpoints

**Get content type**:
```
GET /content-types/{id}
Authorization: Bearer {JWT}

Response (200):
{
  "id": "product-type",
  "name": "Product",
  "displayName": "Product",
  "description": "Product content type",
  "properties": [
    {
      "name": "title",
      "displayName": "Title",
      "type": "Text",
      "required": true
    },
    {
      "name": "price",
      "displayName": "Price",
      "type": "Number"
    }
  ]
}
```

**List content types**:
```
GET /content-types
Authorization: Bearer {JWT}

Response (200):
{
  "items": [
    { /* content type */ },
    { /* content type */ }
  ]
}
```

**Create content type**:
```
POST /content-types
Authorization: Bearer {JWT}
Content-Type: application/json

{
  "name": "Product",
  "displayName": "Product",
  "description": "Product content type",
  "properties": [
    {
      "name": "title",
      "displayName": "Title",
      "type": "Text",
      "required": true
    }
  ]
}

Response (201):
{
  "id": "product-type",
  "name": "Product"
}
```

**Update content type**:
```
PUT /content-types/{id}
Authorization: Bearer {JWT}
Content-Type: application/json

{
  "properties": [
    { /* updated properties */ }
  ]
}

Response (200):
{
  "id": "product-type"
}
```

**Delete content type**:
```
DELETE /content-types/{id}
Authorization: Bearer {JWT}

Response (204): No Content
```

### Error Responses

**Standard error format**:
```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Invalid request parameters",
    "details": {
      "field": "price",
      "issue": "Value must be positive"
    }
  }
}
```

**Common error codes**:
- `UNAUTHORIZED` (401) - Invalid or missing authentication
- `FORBIDDEN` (403) - Insufficient permissions
- `NOT_FOUND` (404) - Content or resource not found
- `CONFLICT` (409) - Version conflict or duplicate content
- `VALIDATION_ERROR` (422) - Invalid request data
- `RATE_LIMITED` (429) - Too many requests

---

## Content Management

### Publishing Workflow

**Content lifecycle**:
1. **Draft** - Initial creation, in progress
2. **Ready for Review** - Submitted for approval
3. **Approved** - Approved by reviewer
4. **Scheduled** - Waiting for publication date/time
5. **Published** - Live and visible to users
6. **Archived** - Removed from active circulation

**Publishing process**:
```
Create (Draft)
    ↓
Submit for Approval
    ↓
[Review & Approve]
    ↓
Publish (Live)
    ↓
Archive (Remove)
```

**API publishing**:
```
POST /content/{id}/publish
Authorization: Bearer {JWT}

{
  "language": "en",
  "scheduleFor": "2026-04-15T10:00:00Z",
  "notifyUsers": ["editor@example.com"]
}
```

### Approval Sequences

**Approval workflow configuration**:
- Define review and approval steps
- Specify required approvers
- Set approval criteria (content requirements)
- Configure notifications

**Create approval sequence**:
1. Navigate to Admin > Approval Sequences
2. Click "New Approval Sequence"
3. Define steps and required approvers
4. Set content type requirements
5. Activate sequence

**Approve content**:
```
POST /content/{id}/approve
Authorization: Bearer {JWT}

{
  "step": 1,
  "approver": "reviewer@example.com",
  "comments": "Looks good to publish"
}
```

**Reject content**:
```
POST /content/{id}/reject
Authorization: Bearer {JWT}

{
  "reason": "Missing SEO metadata"
}
```

### Versioning

**Version management**:
- Each content change creates new version
- Versions are immutable records
- Draft version is editable
- Published versions are read-only
- Can revert to previous version

**Get version history**:
```
GET /content/{id}/versions?limit=10
Authorization: Bearer {JWT}
```

**Revert to previous version**:
```
POST /content/{id}/revert
Authorization: Bearer {JWT}

{
  "version": 3
}
```

**Compare versions**:
```
GET /content/{id}/versions/compare?v1=2&v2=3
Authorization: Bearer {JWT}

Response:
{
  "differences": [
    {
      "property": "title",
      "v1": "Old Title",
      "v2": "New Title",
      "type": "modification"
    }
  ]
}
```

### Content Variations

**Create content variations**:
- A/B testing versions of content
- Test different headlines, copy, layouts
- Track performance metrics
- Publish best performing version

**Create variation**:
```
POST /content/{id}/variations
Authorization: Bearer {JWT}

{
  "baseVersion": 1,
  "name": "Variation A",
  "properties": {
    "title": "Alternative Headline"
  }
}
```

### Scheduling

**Schedule content publication**:
```
POST /content/{id}/schedule
Authorization: Bearer {JWT}

{
  "publishAt": "2026-04-15T10:00:00Z",
  "timezone": "America/New_York"
}
```

**Schedule content archival**:
```
POST /content/{id}/schedule-archive
Authorization: Bearer {JWT}

{
  "archiveAt": "2026-06-01T00:00:00Z"
}
```

### Translations

**Create translation**:
```
POST /content/{id}/translations
Authorization: Bearer {JWT}

{
  "language": "fr",
  "properties": {
    "title": "Titre du Produit",
    "description": "Description du produit"
  }
}
```

**Get translated content**:
```
GET /content/{id}?language=fr
Authorization: Bearer {JWT}
```

**Publish translation**:
```
POST /content/{id}/publish?language=fr
Authorization: Bearer {JWT}
```

### Content Relationships

**Resolve related content**:
```
GET /content/{id}?expand=author,relatedProducts,category
Authorization: Bearer {JWT}

Response:
{
  "id": "product-123",
  "title": "Product Title",
  "author": {
    "id": "author-1",
    "name": "Jane Doe"
  },
  "relatedProducts": [
    { "id": "product-2", "title": "Related Product 1" },
    { "id": "product-3", "title": "Related Product 2" }
  ]
}
```

### Search and Filtering

**Search content**:
```
GET /content/search?q=laptop&type=Product&limit=20
Authorization: Bearer {JWT}

Response:
{
  "total": 45,
  "items": [
    { /* search result */ }
  ]
}
```

**Filter content**:
```
GET /content?type=Product&filter[category]=Electronics&filter[featured]=true
Authorization: Bearer {JWT}
```

### Bulk Operations

**Bulk publish**:
```
POST /content/bulk/publish
Authorization: Bearer {JWT}

{
  "ids": ["content-1", "content-2", "content-3"],
  "language": "en"
}
```

**Bulk delete**:
```
DELETE /content/bulk
Authorization: Bearer {JWT}

{
  "ids": ["content-1", "content-2"]
}
```

---

## Forms

### Form Creation

**Create form in UI**:
1. Navigate to Forms section
2. Click "Create Form"
3. Add form fields (text, email, checkbox, etc.)
4. Configure field validation and defaults
5. Set form submission behavior
6. Activate form

**Form structure**:
```
Form
├── Fields
│   ├── Name (Text, required)
│   ├── Email (Email, required)
│   ├── Message (Textarea, required)
│   └── Subscribe (Checkbox, optional)
├── Validation rules
├── Submission handling
└── Success/Error messages
```

### Form Elements

**Supported field types**:
- **Text** - Single-line text input
- **Email** - Email validation
- **Password** - Masked password input
- **Textarea** - Multi-line text
- **Number** - Numeric input
- **Checkbox** - Single or multiple selections
- **Radio** - Single selection from options
- **Dropdown/Select** - List selection
- **Date** - Date picker
- **File** - File upload
- **Hidden** - Hidden field values

**Field configuration**:
- Field name and label
- Placeholder text
- Help text/description
- Default value
- Required/optional
- Validation rules
- CSS classes for styling

### Form Rules

**Conditional field visibility**:
```javascript
{
  "fieldName": "department",
  "rules": [
    {
      "condition": "value == 'Sales'",
      "action": "show",
      "target": ["salesTeam", "region"]
    },
    {
      "condition": "value == 'Engineering'",
      "action": "show",
      "target": ["techStack", "experience"]
    }
  ]
}
```

**Configure rules in UI**:
1. Edit form
2. Select field
3. Click "Add Rule"
4. Choose condition (value equals, contains, etc.)
5. Select action (show, hide, require, etc.)
6. Choose target fields
7. Save rule

### Form Activation

**Activate form**:
1. Form must have fields configured
2. Validation rules applied
3. Submission handling configured
4. Click "Activate" to make live
5. Form becomes available to frontend

**Deactivate form**:
- Clicking "Deactivate" removes form
- Form becomes unavailable to new submissions
- Existing responses still accessible

### Collect Form Data from Frontend

**Render form on website**:
```javascript
import { FormRenderer } from '@optimizely/cms-sdk/react';

function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (formData) => {
    const response = await fetch('/api/forms/contact/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    if (response.ok) {
      setSubmitted(true);
    }
  };

  return (
    <FormRenderer
      formId="contact-form"
      onSubmit={handleSubmit}
      successMessage="Thank you for your submission!"
    />
  );
}
```

**Collect data with webhooks**:
```javascript
// Frontend submits to backend
const submitForm = async (formData) => {
  const response = await fetch('/api/submit-form', {
    method: 'POST',
    body: JSON.stringify(formData),
  });

  return response.json();
};

// Backend receives and processes
app.post('/api/submit-form', async (req, res) => {
  const formData = req.body;

  // Send to webhook
  await fetch('https://webhook.example.com/form-submit', {
    method: 'POST',
    body: JSON.stringify(formData),
  });

  // Store in database
  await saveFormSubmission(formData);

  res.json({ success: true });
});
```

### Form Data Webhook Integration

**Configure webhook endpoint**:
1. Navigate to Form settings
2. Under "Submission Handling"
3. Select "Webhook"
4. Enter webhook URL
5. Configure headers and authentication
6. Test webhook

**Webhook payload**:
```json
{
  "formId": "contact-form-123",
  "submissionId": "submission-456",
  "timestamp": "2026-03-31T15:45:00Z",
  "data": {
    "name": "John Doe",
    "email": "john@example.com",
    "message": "Inquiry about products",
    "subscribe": true
  },
  "metadata": {
    "ipAddress": "203.0.113.42",
    "userAgent": "Mozilla/5.0...",
    "referrer": "https://example.com/contact"
  }
}
```

**Webhook authentication**:
```javascript
// In webhook handler, verify signature
const crypto = require('crypto');

const verifySignature = (payload, signature, secret) => {
  const hash = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return hash === signature;
};

// Check header
const signature = req.headers['x-cms-signature'];
const payload = req.rawBody;
const isValid = verifySignature(payload, signature, process.env.WEBHOOK_SECRET);
```

**Webhook retry policy**:
- 3 attempts for failed submissions
- Exponential backoff: 5s, 25s, 125s
- Configurable via form settings

### Form Submission Management

**View submissions**:
1. Navigate to Forms
2. Select form
3. Click "Submissions"
4. View all submitted data
5. Export submissions as CSV

**Export data**:
```
GET /forms/{formId}/submissions?export=csv
Authorization: Bearer {JWT}
```

**Delete submissions**:
```
DELETE /forms/{formId}/submissions/{submissionId}
Authorization: Bearer {JWT}
```

### Render Forms with Optimizely Graph

**Query form schema via Graph**:
```graphql
query {
  form(id: "contact-form-123") {
    id
    name
    fields {
      id
      name
      type
      label
      required
      validation {
        type
        pattern
        message
      }
    }
    rules {
      condition
      action
      targetFields
    }
  }
}
```

**Render dynamic form from schema**:
```javascript
function DynamicFormRenderer({ formId }) {
  const [formSchema, setFormSchema] = useState(null);

  useEffect(() => {
    graphClient.query(`
      query { form(id: "${formId}") { fields { id name type label } } }
    `).then(data => setFormSchema(data));
  }, [formId]);

  const renderField = (field) => {
    switch(field.type) {
      case 'text': return <input type="text" name={field.name} />;
      case 'email': return <input type="email" name={field.name} />;
      case 'checkbox': return <input type="checkbox" name={field.name} />;
      default: return null;
    }
  };

  return (
    <form>
      {formSchema?.fields.map(field => (
        <div key={field.id}>
          <label>{field.label}</label>
          {renderField(field)}
        </div>
      ))}
      <button type="submit">Submit</button>
    </form>
  );
}
```

---

## Asset Management

### DAM Integration

**Digital Asset Management (DAM)**:
- Centralized storage for media files
- Versioning and metadata
- Permissions and access control
- Search and organization
- Workflow for asset approval

**Onboard DAM**:
1. Admin > DAM Settings
2. Configure storage backend (optional custom storage)
3. Set up folder structure
4. Configure metadata schema
5. Enable asset versioning if needed

### Asset Organization

**Folder structure**:
```
Assets/
├── Images/
│   ├── Products/
│   │   ├── Electronics/
│   │   └── Clothing/
│   ├── Blog/
│   └── Marketing/
├── Videos/
│   ├── Product demos/
│   └── Testimonials/
└── Documents/
    ├── PDFs/
    └── Whitepapers/
```

**Create folders**:
1. Navigate to Assets
2. Right-click > "New Folder"
3. Enter folder name
4. Set permissions (who can see/edit)
5. Save

**Move assets**:
- Drag and drop between folders
- Or right-click > Move
- Bulk operations supported

### Asset Metadata

**Configure metadata schema**:
1. Admin > Asset Metadata
2. Define custom fields (title, description, tags, etc.)
3. Set field types (text, dropdown, date, etc.)
4. Mark required fields
5. Save schema

**Edit asset metadata**:
1. Right-click on asset > Properties
2. Fill in metadata fields
3. Add tags and keywords
4. Set permissions
5. Save

**Metadata example**:
```json
{
  "id": "image-12345",
  "filename": "product-photo.jpg",
  "title": "Blue Widget Product Photo",
  "description": "Hero image for product page",
  "tags": ["product", "hero", "featured", "blue-widget"],
  "keywords": ["widget", "product", "photography"],
  "copyright": "Copyright 2026 Example Corp",
  "photographer": "John Smith",
  "dimensions": {
    "width": 1920,
    "height": 1080
  },
  "fileSize": 2048576,
  "mimeType": "image/jpeg"
}
```

### Asset Picker

**Insert asset in content**:
1. When editing content with Image/Media property
2. Click "Asset Picker" or "Choose Image"
3. Browse folders or search assets
4. Select asset
5. Configure alt text, title, dimensions
6. Save

**Asset picker features**:
- Browse folder tree
- Search by filename or metadata
- Filter by asset type (image, video, document)
- Sort by name, date, size
- Preview before selection
- Recent assets quick access

**API asset picker**:
```javascript
const asset = await assetPicker.selectAsset({
  type: 'image',
  folder: 'Products',
  onSelect: (asset) => {
    console.log('Selected:', asset.id, asset.url);
  },
});
```

### Media Types

**Supported media types**:

**Images**:
- JPG/JPEG
- PNG
- GIF
- WebP
- SVG
- TIFF
- BMP

**Videos**:
- MP4
- WebM
- Ogg
- MOV
- AVI

**Documents**:
- PDF
- DOCX
- XLSX
- PPTX
- TXT
- CSV

**Audio**:
- MP3
- WAV
- FLAC
- AAC
- OGG

### Asset Versioning

**Upload new version**:
1. Right-click asset > "Upload New Version"
2. Select new file
3. Optional: keep all versions or replace
4. Save

**Version history**:
1. Select asset > "Versions"
2. View all previous versions
3. See upload date, size, uploader
4. Restore previous version if needed
5. Delete old versions if needed

### Asset Sharing

**Shared blocks**:
- Reusable content blocks
- Embed block in multiple pages
- Update block once, all references updated
- Distinct from inline blocks (published separately)

**Inline blocks**:
- Block content embedded directly in page
- Not independently published
- Instance-specific configuration
- Content inherited from block definition

**Asset links**:
- Create shareable URLs for assets
- Set expiration dates
- Configure access restrictions
- Track download statistics

### Best Practices for Asset Organization

**Naming conventions**:
- Use descriptive, lowercase names
- Use hyphens instead of spaces
- Include asset type/purpose prefix
- Example: `product-photo-blue-widget-hero.jpg`

**Folder structure**:
- Organize by content type (product, blog, etc.)
- Secondary organization by date or category
- Avoid too many nesting levels (3-4 max)
- Keep folder names short and clear

**Metadata discipline**:
- Fill in all required metadata fields
- Use consistent tagging scheme
- Include keywords for searchability
- Add copyright and licensing info

**Asset reuse**:
- Check for existing assets before uploading
- Use shared blocks for reusable components
- Consider responsive image variations
- Store high-quality master images

---

## Search & Graph Integration

### Search Providers

**Configure search provider**:
1. Admin > Search Settings
2. Choose provider:
   - Default (CMS built-in)
   - Elasticsearch
   - Algolia
   - Custom provider
3. Configure connection details
4. Map content types to search index
5. Configure indexing schedule

**Default search**:
- Built-in full-text search
- Searches content title, description, body
- Content type filtering
- Language-aware search

**Elasticsearch integration**:
```javascript
// Configure Elasticsearch
const searchConfig = {
  provider: 'elasticsearch',
  host: 'https://elasticsearch.example.com',
  index: 'cms-content',
  settings: {
    numberOfShards: 1,
    numberOfReplicas: 1,
  },
};
```

### Optimizely Graph

**What is Optimizely Graph?**
- Query language for content retrieval
- GraphQL-based API
- Efficient content fetching with filtering
- Real-time updates
- Full-text search capabilities

**Graph endpoint**:
```
https://your-cms.optimizely.com/graphql
```

**Basic query**:
```graphql
query {
  products(limit: 10) {
    id
    title
    price
    category
  }
}
```

**Query with filters**:
```graphql
query {
  products(where: {
    category: { eq: "Electronics" }
    featured: { eq: true }
    price: { gt: 50, lt: 500 }
  }) {
    id
    title
    price
  }
}
```

**Query with pagination**:
```graphql
query {
  products(limit: 20, offset: 40) {
    id
    title
  }
  _meta {
    total
  }
}
```

**Query with relationships**:
```graphql
query {
  products(limit: 10) {
    id
    title
    author {
      id
      name
    }
    relatedProducts {
      id
      title
    }
  }
}
```

**Search query**:
```graphql
query {
  products(search: "laptop") {
    id
    title
    _score
  }
}
```

### Visual Builder Queries

**Query Visual Builder content**:
```graphql
query {
  pages(where: { name: { eq: "homepage" } }) {
    id
    name
    experiences {
      id
      sections {
        id
        elements {
          id
          type
          properties {
            title
            text
            image
          }
        }
      }
    }
  }
}
```

**Query Experience structure**:
```graphql
query {
  experience(id: "exp-123") {
    id
    sections {
      id
      layout {
        type
        columns
      }
      elements {
        id
        type
        displayTemplate
      }
    }
  }
}
```

### Search Capabilities with Optimizely Graph

**Full-text search**:
```graphql
query {
  articles(search: "best practices") {
    id
    title
    body
    _score
  }
}
```

**Search with filters**:
```graphql
query {
  articles(
    search: "tutorial"
    where: { category: { eq: "Development" } }
  ) {
    id
    title
  }
}
```

**Faceted search**:
```graphql
query {
  products(search: "camera") {
    items {
      id
      title
    }
    facets {
      category {
        values {
          name
          count
        }
      }
      brand {
        values {
          name
          count
        }
      }
    }
  }
}
```

### Content Retrieval with Graph

**Batch content retrieval**:
```graphql
query {
  products: productCollection(limit: 50) {
    items { id title }
  }
  articles: articleCollection(limit: 20) {
    items { id title }
  }
  categories: categoryCollection {
    items { id name }
  }
}
```

**Nested content resolution**:
```graphql
query {
  product(id: "prod-123") {
    id
    title
    author {
      id
      name
      email
    }
    reviews {
      id
      rating
      text
      reviewer {
        name
      }
    }
  }
}
```

### Search Performance

**Indexing**:
- Automatic indexing on content publish
- Manual reindex available in admin
- Incremental indexing for efficiency
- Configurable index fields

**Query optimization**:
- Limit result sets with `limit`
- Use filters to reduce result size
- Select only needed fields
- Use pagination for large datasets

---

## Administration

### CMS Settings

**Navigate to Settings**:
1. Admin > CMS Settings
2. Configure:
   - Site name and URL
   - Timezone
   - Default language
   - Content retention policies
   - Backup settings

**Global settings**:
```json
{
  "siteName": "My Site",
  "siteUrl": "https://example.com",
  "timezone": "America/New_York",
  "defaultLanguage": "en",
  "supportedLanguages": ["en", "es", "fr"],
  "contentRetentionDays": 90,
  "backupFrequency": "daily",
  "emailNotifications": true
}
```

### Access Rights

**User roles**:
- **Admin** - Full system access
- **Content Administrator** - Content type and workflow management
- **Content Manager** - Content creation and publishing
- **Editor** - Limited content editing (assigned content only)
- **Viewer** - Read-only access

**Set access rights**:
1. Admin > Users & Roles
2. Select user
3. Choose role or set custom permissions
4. Specify content type access
5. Set approval responsibilities
6. Save

**Content type permissions**:
- Read, create, edit, delete, publish
- Can be set per content type
- Applies to individual users or groups
- Overrides role defaults

### Applications

**Manage applications**:
1. Admin > Applications
2. Configure:
   - Frontend applications consuming CMS
   - API credentials
   - Webhook endpoints
   - Cache settings

**Application configuration**:
```json
{
  "name": "Mobile App",
  "type": "mobile",
  "clientId": "mobile-app-123",
  "clientSecret": "secret-key",
  "allowedOrigins": ["myapp://"],
  "webhooks": {
    "onPublish": "https://webhook.example.com/publish"
  },
  "caching": {
    "enabled": true,
    "ttl": 3600
  }
}
```

### Scheduled Jobs

**Schedule content publishing**:
1. Admin > Scheduled Jobs
2. Click "New Job"
3. Select job type (publish, archive, generate sitemap, etc.)
4. Configure schedule (cron expression)
5. Set parameters
6. Activate

**Job types**:
- **Publish content** - Publish scheduled items
- **Archive content** - Archive expired content
- **Generate sitemap** - Create XML sitemap
- **Index content** - Rebuild search index
- **Clean assets** - Remove unused assets
- **Backup** - Backup database

**View job history**:
1. Admin > Scheduled Jobs
2. Select job
3. View execution history
4. See logs and errors
5. Retry failed jobs

### Import/Export Data

**Export data**:
```
GET /admin/export?contentTypes=Product,Article&format=json
Authorization: Bearer {JWT}
```

**Export formats**:
- JSON - Complete content structure
- CSV - Simplified tabular format
- XML - XML representation
- ZIP - Multiple files compressed

**Import data**:
```
POST /admin/import
Authorization: Bearer {JWT}
Content-Type: multipart/form-data

file: export.json
mergeStrategy: replace | merge | skip-duplicates
```

**Import options**:
- Replace existing content
- Merge with existing (update if exists)
- Skip if content exists
- Map content types during import

### Smooth Rebuild

**Purpose**: Rebuild search index or cache without downtime

**Initiate rebuild**:
```
POST /admin/smooth-rebuild
Authorization: Bearer {JWT}

{
  "target": "search-index",
  "preview": true
}
```

**Process**:
1. Build in background without affecting live content
2. Validate new index
3. Optional: preview on shadow URL before switching
4. Atomically switch to new index when ready
5. Keep old index available for rollback

**Rebuild targets**:
- Search index
- Asset cache
- Content cache
- Generated sitemaps

### Backup and Recovery

**Automatic backups**:
- Daily backups of content database
- Retention: 30 days
- Encrypted storage
- Point-in-time recovery available

**Manual backup**:
1. Admin > Backup & Recovery
2. Click "Create Backup"
3. Select content to backup
4. Download backup file
5. Save to secure location

**Restore from backup**:
1. Admin > Backup & Recovery
2. Select backup to restore
3. Preview changes
4. Confirm restore
5. Wait for completion
6. Verify restored content

### Environments

**Environment types**:
- **Production** - Live content serving
- **Staging** - Pre-production testing
- **Development** - Development and experimentation
- **Custom** - Additional custom environments

**Configure environments**:
```json
{
  "environments": [
    {
      "name": "production",
      "url": "https://api.example.com",
      "apiKey": "prod-api-key"
    },
    {
      "name": "staging",
      "url": "https://staging-api.example.com",
      "apiKey": "staging-api-key"
    }
  ]
}
```

**Promote content between environments**:
1. Select content in source environment
2. Click "Promote"
3. Choose target environment
4. Review changes
5. Confirm promotion

---

## Localisation

### Language Selection

**Configure supported languages**:
1. Admin > Languages
2. Click "Add Language"
3. Select language/locale
4. Set as default (if first language)
5. Enable/disable for content editing

**Supported language codes**:
- en-US (English - United States)
- en-GB (English - United Kingdom)
- es-ES (Spanish - Spain)
- es-MX (Spanish - Mexico)
- fr-FR (French - France)
- de-DE (German - Germany)
- it-IT (Italian - Italy)
- pt-BR (Portuguese - Brazil)
- ja-JP (Japanese - Japan)
- zh-CN (Chinese - Simplified)
- zh-TW (Chinese - Traditional)
- ko-KR (Korean)
- And many more...

**Default language fallback**:
- Content without specific language translation falls back to default
- Can configure fallback chain (e.g., en-US → en → default)

### Language-Specific Properties

**Mark properties as language-specific**:
1. Edit content type
2. Select property
3. Enable "Language-specific"
4. Save

**Language-specific property types**:
- Text (single and multi-line)
- RichText
- Choice
- Link
- Custom text-based properties

**Properties that are NOT language-specific**:
- Date/DateTime
- Number
- Boolean/Checkbox
- Content reference (same reference for all languages)
- Media/Image (same asset for all languages)
- Block reference

**Editing language-specific content**:
1. Edit content
2. Select language tab/dropdown
3. Edit language-specific fields
4. Other fields show shared values
5. Save

### Translation Workflows

**Manual translation**:
1. Create content in default language
2. Publish default language version
3. Select "Translate to" option
4. Choose target language
5. Translator fills in translated fields
6. Publish translation

**Translation with external service**:
1. Configure translation API (e.g., Microsoft Translator)
2. Admin > Translation Settings
3. Select content to translate
4. Choose target languages
5. System sends for automatic translation
6. Review and approve translations
7. Publish

**Translation content workflow**:
```
English (Published)
    ↓
Send for French translation
    ↓
French draft (waiting for translator)
    ↓
Translator completes
    ↓
Review French translation
    ↓
French published
```

### Multi-Language Content Access

**Get content in specific language**:
```
GET /content/{id}?language=fr
Authorization: Bearer {JWT}

Returns: French version if exists, else default language fallback
```

**List available translations**:
```
GET /content/{id}/translations
Authorization: Bearer {JWT}

Response: {
  "availableLanguages": ["en", "fr", "es"],
  "defaultLanguage": "en",
  "translations": [
    { "language": "en", "status": "published" },
    { "language": "fr", "status": "published" },
    { "language": "es", "status": "draft" }
  ]
}
```

**Query Graph with language**:
```graphql
query {
  products(where: { language: "fr" }) {
    id
    title
    description
  }
}
```

### Language Fallback Strategy

**Fallback chain**:
1. Request language (e.g., fr-CA)
2. Language variant (e.g., fr)
3. Default language (e.g., en)
4. Return with fallback indication

**Configure fallback**:
```json
{
  "fallbackChain": {
    "fr-CA": ["fr", "en"],
    "es-MX": ["es", "en"],
    "pt-BR": ["pt", "en"]
  }
}
```

**Fallback API response**:
```json
{
  "id": "product-123",
  "language": "fr-CA",
  "data": { /* content */ },
  "fallbackFrom": "fr",
  "originalLanguage": "en"
}
```

---

## SEO & Analytics

### Search Engine Optimization

**SEO properties on content**:
- Meta title (60 char recommended)
- Meta description (160 char recommended)
- URL slug/path
- Canonical URL
- Open Graph tags
- Twitter card tags
- Structured data (schema.org)

**Configure SEO metadata**:
1. Edit content
2. Open SEO panel
3. Set title, description, slug
4. Add Open Graph image
5. Configure robots directives
6. Add schema markup

**SEO best practices**:
- Unique titles and descriptions per page
- Descriptive URLs (use hyphens, not underscores)
- Proper heading hierarchy (h1, h2, h3)
- Image alt text for accessibility
- Internal linking
- Mobile optimization

**Generate sitemap**:
1. Admin > SEO Settings
2. Click "Generate Sitemap"
3. Includes all published content
4. Excludes noindex pages
5. Respects robots directives
6. Submit to search engines

### GEO Analytics

**Track geographic content performance**:
- View analytics by country/region
- Track user location
- Analyze regional traffic patterns
- Identify regional content preferences

**Analytics dashboard**:
1. Admin > Analytics
2. Configure date range
3. View metrics:
   - Page views by country
   - User engagement by region
   - Content performance by geography
   - Traffic sources by location

**Tracked metrics**:
- Page views
- Unique visitors
- Bounce rate
- Average time on page
- Conversion rate
- Traffic source
- Device type
- Browser type

---

## Glossary

**API** - Application Programming Interface; allows programmatic access to CMS functions

**Approval Sequence** - Workflow defining review and approval steps required before publishing

**Asset** - Digital file (image, video, document) stored in DAM

**Backend** - Server-side content management system

**Bearer Token** - Authentication method using JWT in Authorization header

**Block** - Reusable content component that can be embedded in Pages

**Blueprint** - Saved Experience template for creating new content

**CMS (SaaS)** - Cloud-based headless content management system

**Content Administrator** - User role managing system configuration and workflows

**Content Manager** - User role creating and managing content

**Content Property** - Property type that references other content items

**Content Type** - Definition of content structure and properties

**Experience** - Visual Builder composition made of Sections and Elements

**Frontend** - Client-side application consuming content from CMS

**Graph** - Optimizely's GraphQL query interface for content retrieval

**Headless CMS** - System separating content (backend) from presentation (frontend)

**JWT** - JSON Web Token; authentication credential

**Language-specific** - Property that varies by language/locale

**Media** - Digital asset type (images, videos, documents)

**Metadata** - Information about content (title, description, tags, etc.)

**OAuth 2.0** - Authentication protocol using tokens

**Page** - Top-level publishable content type

**Property** - Individual field within a content type

**RichText** - Formatted text content with HTML markup

**Section** - Layout container within Experience

**SEO** - Search Engine Optimization; improving content findability

**Slug** - URL-friendly identifier for content

**Version** - Immutable snapshot of content at specific point in time

**Visual Builder** - Drag-and-drop interface for creating content compositions

**Webhook** - Endpoint receiving notifications of CMS events

---

## Quick Reference Tables

### Property Types Summary

| Type | Use Case | Multi-value | Language-specific | Example |
|------|----------|-------------|-------------------|---------|
| Text | Short text, headlines | No | Yes | Product name |
| Number | Prices, quantities | No | No | Price: 99.99 |
| DateTime | Dates, scheduling | No | No | Publish date |
| Choice | Dropdown selection | Yes | Yes | Category dropdown |
| Content | Content references | Yes | No | Author reference |
| Block | Block embedding | Yes | No | Section blocks |
| Link | URLs, internal links | No | Yes | Navigation link |
| Guid | Unique identifiers | No | No | External ID |

### API Endpoints Summary

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | /content/{id} | Fetch content |
| POST | /content | Create content |
| PUT | /content/{id} | Update content |
| DELETE | /content/{id} | Delete content |
| POST | /content/{id}/publish | Publish content |
| GET | /content-types | List content types |
| POST | /content-types | Create content type |
| PUT | /content-types/{id} | Update content type |
| DELETE | /content-types/{id} | Delete content type |

### Common GraphQL Queries

| Query | Purpose |
|-------|---------|
| `{ products { id title } }` | List products |
| `{ products(limit: 10) { id title } }` | Limit results |
| `{ products(where: { featured: true }) { id } }` | Filter content |
| `{ product(id: "123") { author { name } } }` | Resolve relationships |
| `{ products(search: "laptop") { id _score } }` | Full-text search |

---

**Document Last Updated**: March 2026
**Version**: 1.0
**Scope**: Complete CMS SaaS implementation reference
