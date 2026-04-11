---
canonicalId: dept-opti-reference
name: "Optimizely Platform Reference"
description: "Comprehensive Optimizely platform reference covering CMS 12 architecture, SaaS CMS design, Content Graph fundamentals, Commerce integration, DXP Cloud deployment, CMP workflows, and Opal AI agent framework with code examples and best practices."
domain: optimizely
category: reference
---

# Optimizely Platform Reference

A comprehensive reference skill covering the complete Optimizely ecosystem, from traditional CMS 12 through modern SaaS architecture, Commerce, DXP Cloud, CMP, and Opal AI.

## CMS 12 (PaaS) Architecture

### Foundation Technologies
- **Framework**: ASP.NET Core with .NET 6+ runtime
- **Database**: Microsoft SQL Server (primary data store)
- **Caching**: Distributed cache (Redis) and in-memory cache strategies
- **Content Composition**: PageData, BlockData, MediaData abstract base classes

### Content Model

The CMS 12 content hierarchy is built on three foundational abstract types:

**PageData** - represents routable content pages
```csharp
[ContentType(GUID = "guid", DisplayName = "My Page")]
public class MyPage : PageData
{
    [Display(Name = "Page Heading")]
    public virtual string Heading { get; set; }

    [Display(Name = "Main Content")]
    public virtual XhtmlString MainBody { get; set; }

    [Display(Name = "Related Items")]
    public virtual ContentArea RelatedItems { get; set; }
}
```

**BlockData** - reusable content blocks (not independently routable)
```csharp
[ContentType(GUID = "guid", DisplayName = "Hero Block")]
public class HeroBlock : BlockData
{
    public virtual string Headline { get; set; }
    public virtual ContentReference Image { get; set; }
    public virtual string CallToAction { get; set; }
}
```

**MediaData** - digital assets (images, documents, videos)
```csharp
[MediaDescriptor(Extensions = new[] { "jpg", "jpeg" })]
public class ImageFile : ImageData
{
    [Display(Name = "Alternative Text")]
    public virtual string AltText { get; set; }

    [Display(Name = "Credit")]
    public virtual string Credit { get; set; }
}
```

### ContentArea and ContentReference

**ContentArea** enables page composers to add multiple blocks/items in sequence with layout hints:
```csharp
[Display(Name = "Page Sections")]
public virtual ContentArea PageSections { get; set; }

// Usage: iterate with layout control
foreach (var item in contentArea.Items)
{
    var content = contentRepository.Get<IContent>(item.ContentLink);
    var displayOption = item.DisplayOption; // "Default", "FullWidth", etc.
}
```

**ContentReference** provides typed links between content items:
```csharp
[Display(Name = "Related Page")]
public virtual ContentReference<MyPage> RelatedPage { get; set; }

// Resolution:
var page = contentRepository.Get<MyPage>(RelatedPage);
```

### Visitor Groups and Personalization

Visitor groups segment audiences based on criteria:
- Device type (mobile, desktop, tablet)
- Geography (country, region, city)
- Behavior (pages visited, conversions)
- Custom criteria (cookie values, querystring parameters)

```csharp
// Conditional rendering based on visitor group
if (visitorGroupRepository.IsInGroup(currentPrincipal, visitorGroupId))
{
    // Render personalized content
}
```

### Initialization Modules

Modules initialize CMS functionality on application startup:

```csharp
[InitializableModule]
[ModuleDependency(typeof(Cms.Web.Initialization.CmsModule))]
public class SiteInitializationModule : IInitializableModule
{
    public void Initialize(InitializationEngine context)
    {
        var contentEvents = ServiceLocator.Current.GetInstance<IContentEvents>();
        contentEvents.CreatingContent += (sender, args) => { /* custom logic */ };
        contentEvents.PublishingContent += (sender, args) => { /* validation */ };
    }

    public void Uninitialize(InitializationEngine context) { }
}
```

### Scheduled Jobs

Background tasks execute on intervals:

```csharp
[ScheduledPlugIn(DisplayName = "Sync External Data", Description = "Synchronizes data from external API")]
public class SyncExternalDataJob : ScheduledJobBase
{
    public override string Execute()
    {
        try
        {
            // Custom logic
            return "Sync completed successfully";
        }
        catch (Exception ex)
        {
            return $"Error: {ex.Message}";
        }
    }
}
```

## SaaS CMS Architecture

### Headless-First Design

SaaS CMS is purpose-built for headless delivery with REST API as the primary interface:
- No server-side rendering (authors compose content, APIs deliver it)
- Multi-channel support (web, mobile, voice, AR)
- Framework-agnostic content consumption
- Separation of content from presentation

### Visual Builder and Experiences

The Visual Builder provides a drag-and-drop interface for authoring structured content:

**Experience** - Top-level container for visual composition
- Acts as a page or standalone content unit
- Contains one or more Sections
- Published as a single versioned unit

**Section** - Organizational grouping within an Experience
- Contains one or more Elements
- Defines layout (single column, multi-column grid, etc.)
- Can be reordered and duplicated

**Element** - Individual content component
- Bound to a Content Type
- Provides input fields based on Content Type schema
- Configurable Display Template for rendering

### Content Type Design for Visual Builder

```yaml
# Content Type definition
name: "Hero Section"
identifier: "heroSection"
baseType: "Element"
fields:
  - name: "heading"
    type: "Text"
    required: true
  - name: "description"
    type: "RichText"
  - name: "heroImage"
    type: "ContentLink"
    contentTypeFilter: ["ImageFile"]
  - name: "backgroundColor"
    type: "SingleSelect"
    options: ["primary", "secondary", "accent"]
displayTemplates:
  - name: "default"
    description: "Standard hero rendering"
  - name: "minimal"
    description: "Minimal hero with no background image"
```

### Styles

Styles are abstract metadata (not CSS) that provide visual configuration:
- Applied at Element level
- Define visual properties (colors, spacing, typography)
- Decoupled from markup or CSS class names
- Enable consistent styling across channels

### Display Templates

Templates control how content renders across different channels:
- Web template (React, Vue, Angular compatible)
- Mobile template
- Custom channel templates
- Template composition for consistent styling

### Blueprints

Blueprints are templates for rapid Experience creation:
- Pre-configured Experience structure
- Default Sections and Elements
- Locked/unlocked field defaults
- Reduce authoring time and ensure consistency

### Contracts

Contracts define rendering agreements between content types and consumers:
- Guarantee field availability
- Specify required vs. optional fields
- Enable frontend validation
- Support multi-version contracts

## Content Graph

### Architecture Overview

The Content Graph is a multi-tenant GraphQL endpoint providing unified access to all content:
- **Query Language**: GraphQL with extended search capabilities
- **Authentication**: HMAC or SingleKey modes
- **Performance**: Cached query templates, smooth rebuild
- **Search**: Semantic, fuzzy, geo, and faceted search types

### Query Anatomy

```graphql
# Full query structure
query GetPageContent($locale: String!, $pageId: String!) {
  _metadata {
    types {
      Page {
        fields
      }
    }
  }

  content: Page(
    where: { _id: { eq: $pageId } }
    locale: $locale
  ) {
    _id
    _type
    _version
    heading
    mainContent {
      json
      html
    }
    relatedPages: _references(
      contentType: ["Page"]
      depth: 2
    ) {
      _id
      heading
    }
  }
}
```

### Authentication Patterns

**HMAC Authentication** (time-based, suitable for server-to-server):
```
Signature = Base64(HMAC-SHA256(AccessKey, HTTPMethod + HTTPPath + MessageBody))
Header: EpiGraphQL-HMAC: {PublicKey};{Signature}
Timestamp: Unix timestamp (request must be within 5 minutes of server time)
```

**SingleKey Authentication** (static key, suitable for frontend):
```
Header: Authorization: Bearer {StaticAccessKey}
```

### Where Clauses and Filtering

```graphql
# Exact match
where: { title: { eq: "Home" } }

# String operations
where: { title: { startsWith: "Product" } }
where: { description: { contains: "sale" } }

# Numeric operations
where: { price: { gt: 100, lt: 500 } }
where: { publishedDate: { gte: "2024-01-01" } }

# Logical operations
where: {
  AND: [
    { status: { eq: "Published" } }
    { OR: [
        { category: { eq: "Electronics" } }
        { category: { eq: "Appliances" } }
      ]
    }
  ]
}
```

### OrderBy and Sorting

```graphql
# Single field sort
orderBy: { title: ASC }

# Multiple fields
orderBy: [
  { publishedDate: DESC }
  { title: ASC }
]

# Nested field sorting
orderBy: { author: { name: ASC } }
```

### Locale Handling for Multi-Language

```graphql
# Fetch specific locale
content(locale: "en-US") {
  heading
  body
}

# Available locales in metadata
_metadata {
  locales
}

# Fallback handling (implicit, respects locale hierarchy)
content(locale: "fr-CA") # Falls back to fr, then en
```

### Fragments and Query Reuse

```graphql
# Fragment definition
fragment PageFields on Page {
  _id
  title
  description
  _version
  _modified
}

# Fragment usage
query GetPages {
  pages: Page(first: 10) {
    ...PageFields
    author {
      name
      email
    }
  }
}

# Aliases for multiple queries
query MultiQuery {
  featuredPages: Page(
    where: { featured: { eq: true } }
    first: 5
  ) {
    ...PageFields
  }

  recentPages: Page(
    orderBy: { _modified: DESC }
    first: 5
  ) {
    ...PageFields
  }
}
```

### Pagination Patterns

**Cursor-based** (recommended for large datasets):
```graphql
query GetPagesCursor($first: Int!, $after: String) {
  Page(first: $first, after: $after) {
    edges {
      node {
        _id
        title
      }
      cursor
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
```

**Skip/Limit** (simpler but less efficient for large offsets):
```graphql
query GetPagesOffset($skip: Int!, $limit: Int!) {
  Page(skip: $skip, limit: $limit) {
    _id
    title
  }
}
```

### Search Types

**Semantic Search** (AI-powered, understands intent):
```graphql
where: {
  _fulltext: {
    contains: "sustainable electronics"
    searchType: "Semantic"
  }
}
```

**Fuzzy Search** (typo-tolerant):
```graphql
where: {
  title: {
    contains: "prodct"
    searchType: "Fuzzy"
  }
}
```

**Geo Search** (location-based):
```graphql
where: {
  storeLocation: {
    near: {
      latitude: 40.7128
      longitude: -74.0060
      distance: 10
      unit: "km"
    }
  }
}
```

**Faceted Search** (aggregations):
```graphql
query GetProductsWithFacets {
  products: Product(where: { price: { gt: 50 } }) {
    edges {
      node {
        _id
        title
        category
      }
    }
  }

  categoryFacet: Product(where: { price: { gt: 50 } }) {
    facets {
      category {
        name
        count
      }
    }
  }
}
```

### Cached Query Templates

Cached query templates register frequently-used queries for performance:

```csharp
// Registration (C# backend)
var cachedQuery = new CachedQueryTemplate
{
    Name = "GetFeaturedProducts",
    Query = "query GetFeaturedProducts($locale: String!) { ... }",
    CacheDuration = TimeSpan.FromHours(1),
    InvalidationTriggers = new[] { "Product" } // Invalidate on Product changes
};
queryTemplateService.Register(cachedQuery);
```

Invocation:
```graphql
query GetFeaturedProducts($locale: String!) {
  __cached: "GetFeaturedProducts"
  variables: { locale: $locale }
}
```

Benefits:
- Pre-compiled and optimized
- Automatic cache management
- Conditional invalidation
- Reduced server processing

### Smooth Rebuild

Smooth rebuild rebuilds the Content Graph index without downtime:
- Progressive indexing of updated content
- Queries continue against current index
- New index becomes active when complete
- No performance spike during rebuild

Trigger via API or admin UI when:
- Making changes to content type definitions
- Adding new fields
- Modifying search configurations

## Commerce Integration

### Catalog Management

Optimizely Commerce manages product hierarchy:
- **Catalog**: Collection of products/variants for a market
- **Entry**: Individual product or variant
- **SKU**: Stock-keeping unit linking to fulfillment
- **Associations**: Product relationships (related, bundle, cross-sell)

```csharp
var catalog = catalogSystem.GetCatalogByName("Default Catalog");
var entries = catalogSystem.GetEntriesByCatalog(catalog.CatalogId)
    .Include(e => e.Prices)
    .Include(e => e.Associations);

foreach (var entry in entries)
{
    var pricing = entry.Prices.First();
    var relatedProducts = entry.Associations
        .Where(a => a.AssociationType == "CrossSell");
}
```

### Pricing Engine

Dynamic pricing based on market, customer, and promotion:

```csharp
var priceService = ServiceLocator.Current.GetInstance<IPriceService>();
var applicablePrices = priceService.GetPrices(catalogEntry.Code, market.MarketId);

// Apply customer segment pricing
var adjustedPrice = priceService.ApplyCustomerPricing(
    applicablePrices,
    customerGroup: PricingCustomerGroup.PriceGroup5
);
```

### Promotions

Rules-based promotional discounts:

```csharp
// Promotion applies when:
// - Cart subtotal > $100
// - Contains eligible product
// - Applied code matches

var promotion = new Promotion
{
    Name = "Summer Sale",
    RewardType = RewardType.Percentage,
    RewardValue = 20,
    Code = "SUMMER20",
    Conditions = new[]
    {
        new CartCondition { MinValue = 100 },
        new EntryCondition { ProductIds = new[] { 1, 2, 3 } }
    }
};
```

### Order Pipeline

Extensible stages in order processing:

```
Cart → Validation → Pre-Payment Processing → Payment →
Post-Payment Processing → Fulfillment → Completion
```

Each stage has entry and exit hooks for custom logic.

### B2B Features

- Company and organization hierarchies
- Budget enforcement
- Approval workflows
- Negotiated pricing
- Purchase order management

## DXP Cloud

### Deployment Model

DXP Cloud runs Optimizely on Azure App Service for Containers:
- Containerized application (Docker)
- Managed infrastructure scaling
- Integrated CI/CD pipeline
- Environment promotion (dev → staging → production)

### Application Architecture

```
┌─────────────────────────────────┐
│   Load Balancer / CDN           │
└─────────────────────────────────┘
              ↓
┌─────────────────────────────────┐
│   Container Instances            │
│   - App Service (CMS/Commerce)   │
│   - Worker Roles                 │
└─────────────────────────────────┘
              ↓
┌─────────────────────────────────┐
│   Data Layer                     │
│   - SQL Database                 │
│   - Blob Storage                 │
│   - Search Service               │
└─────────────────────────────────┘
```

### Deployment API

Deploy applications and configurations:

```bash
# Deploy via REST API
curl -X POST https://api.{environment}.optimizely.com/api/deployments \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "sourceRepository": "https://github.com/myorg/myrepo",
    "sourceBranch": "main",
    "targetEnvironment": "staging"
  }'
```

### Environment Promotion

```
Development (continuous updates)
        ↓
Staging (pre-production validation)
        ↓
Production (live)
```

Each environment is independently scalable and configurable.

### CI/CD Integration

GitHub Actions / Azure DevOps workflows:
1. Code push triggers build
2. Tests execute (unit, integration, BDD)
3. Docker image created and pushed
4. Deployment API promotes to target environment
5. Smoke tests validate deployment

## CMP (Campaign Management Platform)

### Campaign Management

Editorial calendars organize campaign scheduling:
- Multi-channel campaigns (web, email, social)
- Asset management (images, copy, creative)
- Approval workflows
- Performance analytics

### Task Workflows

Publishers create tasks for authors:
- Content creation requests
- Review cycles
- Publication scheduling
- Cross-team collaboration

### Publishing Pipeline

```
Draft → In Review → Approved → Scheduled → Published
```

Each state has notifications and approval rules.

### Analytics Integration

Campaign performance tracking:
- Impressions, clicks, conversions
- Audience engagement
- Content effectiveness
- ROI measurement

## Opal AI

### Agent Types

**Query Agent**: Answers questions about content and data
```yaml
agent:
  type: "QueryAgent"
  instructions: "Answer user questions about product inventory"
  tools:
    - contentGraphQuery
    - catalogLookup
```

**Action Agent**: Performs operations (create, update, delete)
```yaml
agent:
  type: "ActionAgent"
  instructions: "Create product listings from user descriptions"
  tools:
    - createContentType
    - publishContent
```

**Routing Agent**: Directs queries to specialized agents
```yaml
agent:
  type: "RoutingAgent"
  routes:
    - pattern: "inventory"
      destination: "InventoryQueryAgent"
    - pattern: "campaign"
      destination: "CampaignActionAgent"
```

### Tool Types

**API Tool**: Calls REST/GraphQL endpoints
```yaml
tool:
  type: "APITool"
  endpoint: "https://api.optimizely.com/graphql"
  method: "POST"
  authentication: "HMAC"
```

**Plugin Tool**: Executes custom code
```yaml
tool:
  type: "PluginTool"
  implementation: "MyCustomPlugin"
  parameters:
    - name: "productId"
      type: "string"
```

### Instructions Framework

Instructions guide agent behavior:
- System instructions (agent purpose and constraints)
- Few-shot examples
- Tool usage patterns
- Error handling rules

```yaml
instructions:
  system: |
    You are a helpful content creation assistant for Optimizely CMS.
    You understand the content type schema and can generate appropriate
    field values for new content items.

  examples:
    - input: "Create a product with name 'Laptop' and price 999"
      output: "I'll create a new Product content type with those details"

    - input: "What products are in the 'Electronics' category?"
      output: "Let me query the Content Graph for products in that category"
```

### Agent Directory

Centralized registry of available agents:
- Agent metadata (name, description, capabilities)
- Tool configuration
- Usage analytics
- Version management

### RAG (Retrieval-Augmented Generation)

Agents augment knowledge with retrieved documentation:
1. User query → Retrieve relevant docs
2. Context injection into LLM prompt
3. LLM generates response with context
4. Response cites source documentation

### Evaluations

Test agent performance:
```yaml
evaluation:
  name: "ProductQueryAccuracy"
  testCases:
    - query: "How many units of SKU-123 are in stock?"
      expectedOutput: "numeric value between 0-1000"
    - query: "What's the description of product ABC?"
      expectedOutput: "string matching product description"
  metrics:
    - accuracy
    - latency
    - toolCallCount
```

### Opal Tools SDK

Build custom tools for agents:

```csharp
using Optimizely.Opal.Tools;

public class InventoryLookupTool : OpalTool
{
    public override string Name => "InventoryLookup";

    public override async Task<string> Execute(ToolInput input)
    {
        var productId = input.Parameters["productId"];
        var inventory = await _inventoryService.GetStock(productId);
        return $"Current stock: {inventory.Quantity} units";
    }
}
```

### Workflows

Complex multi-agent workflows orchestrate actions:
```yaml
workflow:
  name: "ContentCreationWorkflow"
  steps:
    1. agent: "ContentPlanningAgent"
       task: "Plan content structure"
    2. agent: "ContentCreationAgent"
       task: "Write content based on plan"
    3. agent: "ReviewAgent"
       task: "Review for quality and compliance"
    4. agent: "PublishingAgent"
       task: "Publish approved content"
```

## Migration Patterns

### CMS 12 to SaaS CMS

Key architectural shifts:
- **From**: Monolithic ASP.NET Core application
- **To**: Headless API-first architecture
- **Content Model**: Map PageData → Experiences, BlockData → Elements
- **APIs**: Replace server-side rendering with REST/GraphQL
- **Assets**: Migrate media library to SaaS CMS blob storage

Migration checklist:
1. Audit content types and designs
2. Map old content model to new
3. Create SaaS CMS content types and Experiences
4. Migrate content (automated scripts + manual review)
5. Update frontend apps to consume APIs
6. Validate all content and functionality
7. Switch traffic and decommission old system

### Platform Migration Patterns

**From WordPress/Drupal**:
- Map traditional page structure to Experiences/Sections
- Extract content from relational DB to Optimizely content types
- Rebuild routing via REST API (Optimizely has no URL routing)

**From HubSpot/Contentful**:
- Map CMS to SaaS CMS content types
- Migrate Assets to blob storage
- Rebuild integrations (forms, personalization, etc.)

**From Sitecore**:
- Similar content model (Items → Content Types)
- Migrate versioning and publication workflow
- Rebuild personalization with Opal AI or visitor groups

---

**Last Updated**: 2024 | **Version**: 2.0
