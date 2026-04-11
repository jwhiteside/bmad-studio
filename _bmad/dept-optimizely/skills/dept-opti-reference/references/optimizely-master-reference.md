# Optimizely Master Reference

Comprehensive reference guide for all Optimizely subsystems, architectures, development patterns, and integration strategies.

## 1. CMS 12 (PaaS) Platform

### 1.1 Architecture Overview

CMS 12 is a traditional ASP.NET Core content management system built on .NET 6+ and SQL Server. It follows a component-based architecture with server-side rendering and extensibility through modules and plugins.

**Technology Stack**:
```
Frontend: ASP.NET Core Razor / MVC
Backend: C# / .NET 6+
Database: Microsoft SQL Server 2016+
Cache: Redis (distributed) + In-Memory (local)
Search: Lucene / Elasticsearch (optional)
Message Queue: Azure Service Bus (optional)
```

**Deployment Options**:
- On-premises IIS hosting
- Azure App Service
- Docker containers
- DXP Cloud (managed)

### 1.2 Content Model Architecture

The CMS 12 content model is hierarchical, built on abstract base classes representing different content behaviors:

**PageData Hierarchy**
```
IContent (interface)
  ├── PageData (routable, publishable)
  │   ├── StandardPage
  │   ├── LandingPage
  │   └── ProductPage
  ├── BlockData (composition blocks, non-routable)
  │   ├── HeroBlock
  │   ├── CardBlock
  │   └── SliderBlock
  └── MediaData (binary assets)
      ├── ImageData
      ├── VideoData
      └── DocumentData
```

**Content Metadata**:
```csharp
public interface IContent
{
    ContentReference ContentLink { get; }
    int ContentTypeID { get; }
    string Name { get; }
    object this[string propertyName] { get; set; }
    ContentReference<T> ParentLink { get; }
    bool IsDeleted { get; }
}

public interface IVersionable
{
    int Status { get; } // Draft = 1, Published = 4
    DateTime StartPublish { get; set; }
    DateTime StopPublish { get; set; }
    string SavedInversion { get; }
}
```

### 1.3 Development Patterns

**Content Type Registration**
```csharp
[ContentType(
    GUID = "a7e4b8c2-d1f3-4a9b-8c7d-9e6f3a1b5c2d",
    DisplayName = "Product Page",
    GroupName = "Products",
    Order = 100,
    AvailableInEditMode = true
)]
[ImageUrl("/Images/page-icon.png")]
public class ProductPage : PageData
{
    [Display(GroupName = "Content", Name = "Product Name", Order = 10)]
    [Required]
    public virtual string ProductName { get; set; }

    [Display(GroupName = "Content", Name = "Description", Order = 20)]
    [UIHint(UIHint.Textarea)]
    public virtual string Description { get; set; }

    [Display(GroupName = "Content", Name = "Price", Order = 30)]
    [DataType(DataType.Currency)]
    public virtual decimal Price { get; set; }

    [Display(GroupName = "Layout", Name = "Featured Image", Order = 10)]
    [UIHint(UIHint.Image)]
    public virtual ContentReference FeaturedImage { get; set; }

    [Display(GroupName = "Layout", Name = "Content Sections", Order = 20)]
    public virtual ContentArea PageSections { get; set; }

    [Display(GroupName = "SEO", Name = "Meta Description", Order = 10)]
    [MaxLength(160)]
    public virtual string MetaDescription { get; set; }
}
```

**Event-Driven Architecture**
```csharp
[InitializableModule]
[ModuleDependency(typeof(CmsModule))]
public class EventInitializationModule : IInitializableModule
{
    public void Initialize(InitializationEngine context)
    {
        var contentEvents = ServiceLocator.Current.GetInstance<IContentEvents>();

        // Pre-publish validation
        contentEvents.PublishingContent += (sender, args) =>
        {
            var page = args.Content as PageData;
            if (string.IsNullOrEmpty(page?.MetaDescription))
            {
                args.CancelAction = true;
                args.CancelReason = "Meta description is required";
            }
        };

        // Post-publish cache invalidation
        contentEvents.PublishedContent += (sender, args) =>
        {
            var cacheManager = ServiceLocator.Current.GetInstance<ICacheManager>();
            cacheManager.Remove($"page_{args.Content.ContentLink.ID}");
        };

        // Content moved (parent changed)
        contentEvents.MovedContent += (sender, args) =>
        {
            var logger = ServiceLocator.Current.GetInstance<ILogger>();
            logger.Information($"Content {args.Content.Name} moved from {args.OldParent} to {args.NewParent}");
        };
    }

    public void Uninitialize(InitializationEngine context) { }
}
```

**Content Repository Usage**
```csharp
public class ProductPageService
{
    private readonly IContentRepository _contentRepository;
    private readonly IContentTypeRepository _contentTypeRepository;

    public ProductPageService(IContentRepository contentRepository, IContentTypeRepository contentTypeRepository)
    {
        _contentRepository = contentRepository;
        _contentTypeRepository = contentTypeRepository;
    }

    // Get strongly-typed content
    public ProductPage GetProductPage(ContentReference contentLink)
    {
        return _contentRepository.Get<ProductPage>(contentLink);
    }

    // List all published product pages
    public IEnumerable<ProductPage> GetPublishedProducts()
    {
        var contentTypeId = _contentTypeRepository.Load<ProductPage>().ID;
        return _contentRepository.GetChildren<ProductPage>(ContentReference.RootPage)
            .Where(p => p.Status == VersionStatus.Published)
            .OrderBy(p => p.Name);
    }

    // Create new content
    public ProductPage CreateProductPage(string name, ContentReference parentLink)
    {
        var newPage = _contentRepository.GetDefault<ProductPage>(parentLink);
        newPage.Name = name;
        newPage.PageName = name;
        var savedLink = _contentRepository.Save(newPage, SaveAction.Save);
        return _contentRepository.Get<ProductPage>(savedLink);
    }

    // Edit and publish
    public void PublishProductPage(ContentReference contentLink, string newDescription)
    {
        var page = _contentRepository.Get<ProductPage>(contentLink, LanguageSelector.AutoDetect()).CreateWritableClone();
        page.Description = newDescription;
        _contentRepository.Save(page, SaveAction.Publish);
    }
}
```

### 1.4 ContentArea and Block Composition

ContentArea enables flexible page composition with layout hints:

```csharp
[Display(Name = "Page Content Blocks", Order = 100)]
[AllowedTypes(new[] { typeof(HeroBlock), typeof(CardBlock), typeof(SliderBlock) })]
public virtual ContentArea ContentBlocks { get; set; }

// In template: iterate with layout control
@foreach (var contentAreaItem in Model.ContentBlocks.FilteredItems ?? Enumerable.Empty<ContentAreaItem>())
{
    var displayOption = contentAreaItem.DisplayOption; // "Default", "FullWidth", "Half"
    var content = contentAreaItem.GetContent();

    switch (displayOption)
    {
        case "FullWidth":
            <div class="content-full">@Html.PropertyFor(m => content)</div>
            break;
        case "Half":
            <div class="content-half">@Html.PropertyFor(m => content)</div>
            break;
        default:
            <div class="content-default">@Html.PropertyFor(m => content)</div>
            break;
    }
}
```

### 1.5 Visitor Groups and Personalization

Visitor groups enable content personalization based on audience segments:

```csharp
[ContentType(DisplayName = "Visitor Group Personalized Block")]
public class PersonalizedBlock : BlockData
{
    [Display(Name = "Default Content")]
    public virtual XhtmlString DefaultContent { get; set; }

    [Display(Name = "Personalized Content")]
    public virtual ContentArea PersonalizedContent { get; set; }

    [Display(Name = "Target Visitor Group")]
    [SelectOne(SelectionFactoryType = typeof(VisitorGroupSelectionFactory))]
    public virtual string TargetVisitorGroup { get; set; }
}

// Rendering with personalization logic
public class PersonalizedBlockController : Controller
{
    public ActionResult Index(PersonalizedBlock currentContent)
    {
        var visitorGroupRepository = ServiceLocator.Current.GetInstance<IVisitorGroupRepository>();
        var isPrincipalInGroup = visitorGroupRepository.IsInGroup(User, currentContent.TargetVisitorGroup);

        return View(new PersonalizedBlockModel
        {
            Content = isPrincipalInGroup ? currentContent.PersonalizedContent : currentContent.DefaultContent
        });
    }
}
```

### 1.6 Scheduled Publishing

Content can be scheduled for automatic publishing:

```csharp
var page = _contentRepository.Get<StandardPage>(contentLink).CreateWritableClone();
page.Name = "Easter Sale";
page.StartPublish = DateTime.Parse("2024-04-09 00:00:00");
page.StopPublish = DateTime.Parse("2024-04-10 23:59:59");

_contentRepository.Save(page, SaveAction.Publish);
// Content becomes visible at StartPublish, hidden at StopPublish
```

### 1.7 Commerce Integration

CMS 12 integrates with Optimizely Commerce:

```csharp
[ContentType(DisplayName = "Product Page")]
public class ProductPage : PageData
{
    [Display(Name = "SKU")]
    [Required]
    public virtual string SKU { get; set; }

    [Display(Name = "Display Price")]
    public virtual string DisplayPrice { get; set; }
}

public class ProductPageService
{
    private readonly IPriceService _priceService;
    private readonly IOrderRepository _orderRepository;

    public decimal GetProductPrice(string sku, IMarket market)
    {
        var prices = _priceService.GetPrices(sku, market.MarketId);
        return prices.FirstOrDefault()?.UnitPrice ?? 0;
    }

    public IEnumerable<OrderGroup> GetCustomerOrders(Guid customerId)
    {
        return _orderRepository.GetOrdersByCustomer(customerId);
    }
}
```

## 2. SaaS CMS Platform

### 2.1 Architecture Philosophy

SaaS CMS is purpose-built for:
- **Headless-first delivery**: Content separated from presentation
- **Multi-channel**: Single content base serves web, mobile, voice, etc.
- **Scalability**: Managed infrastructure, auto-scaling
- **Flexibility**: Framework-agnostic content consumption
- **DX**: Visual Builder for non-technical authors

```
Content Creation (Visual Builder)
        ↓
Content Storage (Optimizely CMS)
        ↓
REST/GraphQL APIs
        ↓
Multiple Consumers (Web, Mobile, Voice, AR, etc.)
```

### 2.2 Visual Builder Workflow

The Visual Builder provides a drag-and-drop interface for assembling content:

**User Experience**:
1. Create new Experience (page)
2. Add Sections (layout groups)
3. Add Elements to sections (individual components)
4. Configure Element properties
5. Apply Styles
6. Assign Display Templates
7. Publish

**Experience Structure**:
```
Experience "Product Launch Campaign"
├── Section "Hero"
│   └── Element "HeroSection" (content type)
│       ├── heading: "Introducing X Series"
│       ├── description: "Revolutionary product"
│       └── backgroundColor: "primary"
├── Section "Feature Highlights"
│   ├── Element "Feature" (Cols: 1 of 3)
│   │   ├── title: "Fast"
│   │   └── icon: [ContentLink]
│   ├── Element "Feature" (Cols: 2 of 3)
│   │   ├── title: "Secure"
│   │   └── icon: [ContentLink]
│   └── Element "Feature" (Cols: 3 of 3)
│       ├── title: "Reliable"
│       └── icon: [ContentLink]
└── Section "CTA"
    └── Element "CallToAction"
        ├── text: "Get Started"
        └── link: [ContentLink]
```

### 2.3 Content Type Design for Visual Builder

Content types define the structure of Elements in the Visual Builder:

```yaml
---
# Content Type: HeroSection
type: Element
name: HeroSection
icon: images/hero-icon.png

fields:
  # Text fields
  - fieldName: heading
    type: Text
    label: "Page Heading"
    helpText: "Main headline (max 100 chars)"
    required: true
    maxLength: 100

  - fieldName: description
    type: RichText
    label: "Description"
    helpText: "Secondary headline or description"
    required: false

  # Content link (media)
  - fieldName: backgroundImage
    type: ContentLink
    label: "Background Image"
    contentTypeFilter:
      - image
    helpText: "Recommended: 1920x600px"
    required: false

  # Selection fields
  - fieldName: backgroundColor
    type: SingleSelect
    label: "Background Color"
    options:
      - value: "primary"
        label: "Primary Brand"
      - value: "secondary"
        label: "Secondary Brand"
      - value: "accent"
        label: "Accent"
    required: true

  # Multi-select
  - fieldName: badges
    type: MultiSelect
    label: "Display Badges"
    options:
      - value: "new"
        label: "New"
      - value: "featured"
        label: "Featured"
      - value: "limited"
        label: "Limited Time"

  # Structured content (nested)
  - fieldName: buttons
    type: Repeater
    label: "Call-to-Action Buttons"
    fields:
      - fieldName: text
        type: Text
        label: "Button Text"
      - fieldName: link
        type: ContentLink
        label: "Button Link"
        contentTypeFilter:
          - page

displayTemplates:
  - templateName: "default"
    description: "Full-width hero with background image"
    channel: "web"

  - templateName: "minimal"
    description: "Simple hero without background"
    channel: "web"

  - templateName: "mobile"
    description: "Mobile-optimized hero"
    channel: "mobile"
```

### 2.4 Styles System

Styles provide visual configuration without hardcoded CSS:

```yaml
# Style Definition
name: "PrimaryButton"
description: "Primary call-to-action button"
targetElement: "Button"

properties:
  - styleName: "backgroundColor"
    label: "Background Color"
    type: "color"
    defaultValue: "#0066CC"

  - styleName: "textColor"
    label: "Text Color"
    type: "color"
    defaultValue: "#FFFFFF"

  - styleName: "padding"
    label: "Padding"
    type: "spacing"
    defaultValue: "12px 24px"
    options: ["8px 16px", "12px 24px", "16px 32px"]

  - styleName: "borderRadius"
    label: "Corner Radius"
    type: "select"
    defaultValue: "medium"
    options:
      - { label: "Sharp", value: "0px" }
      - { label: "Small", value: "4px" }
      - { label: "Medium", value: "8px" }
      - { label: "Large", value: "16px" }

  - styleName: "fontSize"
    label: "Font Size"
    type: "select"
    defaultValue: "base"
    options: ["small", "base", "large", "xlarge"]
```

### 2.5 Display Templates

Display templates define how content renders across channels:

**Web (React) Display Template**:
```tsx
// Components/HeroSection.tsx
import React from 'react';
import { ContentLink } from './types';

interface HeroSectionProps {
  heading: string;
  description?: string;
  backgroundImage?: string;
  backgroundColor: 'primary' | 'secondary' | 'accent';
  buttons?: Array<{ text: string; link: string }>;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  heading,
  description,
  backgroundImage,
  backgroundColor,
  buttons
}) => {
  const bgColorClass = {
    'primary': 'bg-primary',
    'secondary': 'bg-secondary',
    'accent': 'bg-accent'
  }[backgroundColor];

  return (
    <section className={`hero ${bgColorClass}`}>
      {backgroundImage && (
        <img
          src={backgroundImage}
          alt={heading}
          className="hero-bg"
        />
      )}
      <div className="hero-content">
        <h1>{heading}</h1>
        {description && <p>{description}</p>}
        {buttons && (
          <div className="hero-buttons">
            {buttons.map((btn, idx) => (
              <a key={idx} href={btn.link} className="btn btn-primary">
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

**Mobile Display Template**:
```tsx
// Components/HeroSection.mobile.tsx
export const HeroSectionMobile: React.FC<HeroSectionProps> = ({
  heading,
  description,
  buttons
}) => {
  return (
    <section className="hero-mobile">
      <h1 className="hero-title-mobile">{heading}</h1>
      {description && <p className="hero-desc-mobile">{description}</p>}
      {buttons && (
        <div className="hero-buttons-mobile">
          {buttons.map((btn, idx) => (
            <a key={idx} href={btn.link} className="btn btn-mobile">
              {btn.text}
            </a>
          ))}
        </div>
      )}
    </section>
  );
};
```

### 2.6 Blueprints for Content Creation

Blueprints accelerate content creation with pre-configured structures:

```yaml
# Blueprint: "ProductLaunchPage"
name: "Product Launch"
description: "Full product launch landing page"
icon: "launch.png"

sections:
  - sectionName: "Hero"
    layout: "fullWidth"
    elements:
      - elementType: "HeroSection"
        properties:
          heading: "[Add Product Name]"
          description: "[Add Brief Description]"
          backgroundColor: "primary"

  - sectionName: "Features"
    layout: "gridThreeColumn"
    elements:
      - elementType: "FeatureCard"
        properties:
          title: "[Feature 1]"
          description: "[Description]"
      - elementType: "FeatureCard"
        properties:
          title: "[Feature 2]"
          description: "[Description]"
      - elementType: "FeatureCard"
        properties:
          title: "[Feature 3]"
          description: "[Description]"

  - sectionName: "Pricing"
    layout: "fullWidth"
    elements:
      - elementType: "PricingTable"
        properties:
          title: "Select Your Plan"

  - sectionName: "CTA"
    layout: "fullWidth"
    elements:
      - elementType: "CallToAction"
        properties:
          headline: "Ready to Get Started?"
          buttonText: "Start Free Trial"

defaultValues:
  author: ""
  publishDate: ""
  tags: ["product", "launch"]
```

### 2.7 Contracts for Rendering Consistency

Contracts define agreements between content and frontend:

```csharp
// Contract defines required fields for reliable rendering
public interface IHeroSectionContract
{
    string Heading { get; }
    string Description { get; }
    string BackgroundImageUrl { get; }
    string BackgroundColor { get; }
    IEnumerable<IButtonContract> Buttons { get; }
}

public interface IButtonContract
{
    string Text { get; }
    string Href { get; }
    string Style { get; }
}

// Implementation validates content against contract
public class HeroSectionValidator : IContentValidator
{
    public ValidationResult Validate(IContent content)
    {
        if (!(content is HeroSection hero))
            return ValidationResult.Invalid("Not a HeroSection");

        var errors = new List<string>();

        if (string.IsNullOrEmpty(hero.Heading))
            errors.Add("Heading is required");

        if (string.IsNullOrEmpty(hero.BackgroundColor))
            errors.Add("BackgroundColor is required");

        return errors.Any()
            ? ValidationResult.Invalid(string.Join("; ", errors))
            : ValidationResult.Valid();
    }
}
```

## 3. Content Graph

### 3.1 Query Language and Anatomy

The Content Graph is a GraphQL endpoint with extended search capabilities:

```graphql
# Complete query structure
query GetProductsWithReviews($first: Int!, $locale: String!, $priceMin: Float!) {
  # Operation name for identification and caching
  # Variables passed from client

  _metadata {
    types {
      Product {
        fields {
          name
          price
          description
        }
      }
    }
  }

  products: Product(
    where: {
      AND: [
        { price: { gte: $priceMin } }
        { status: { eq: "Active" } }
        { _fulltext: { contains: "electronics" } }
      ]
    }
    locale: $locale
    first: $first
    orderBy: { _modified: DESC }
  ) {
    _id
    _type
    _version
    _modified
    name
    price
    description
    reviews: _references(contentType: ["Review"]) {
      _id
      author
      rating
      text
    }
  }

  aggregations: Product(
    where: { price: { gte: $priceMin } }
  ) {
    facets {
      category {
        name
        count
      }
      manufacturer {
        name
        count
      }
    }
  }
}
```

### 3.2 Authentication Patterns

**HMAC Signature Generation** (Server-to-Server):
```csharp
public class ContentGraphClient
{
    private readonly string _accessKey;
    private readonly string _publicKey;
    private readonly HttpClient _httpClient;

    public async Task<T> Query<T>(string query, Dictionary<string, object> variables)
    {
        var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
        var body = JsonConvert.SerializeObject(new { query, variables });

        // HMAC signature: Base64(HMAC-SHA256(accessKey, method + path + body))
        var message = $"POST/graphql{body}";
        var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(_accessKey));
        var signature = Convert.ToBase64String(hmac.ComputeHash(Encoding.UTF8.GetBytes(message)));

        var request = new HttpRequestMessage(HttpMethod.Post, "https://cg.optimizely.com/graphql")
        {
            Content = new StringContent(body, Encoding.UTF8, "application/json")
        };

        request.Headers.Add("EpiGraphQL-HMAC", $"{_publicKey};{signature}");
        request.Headers.Add("Timestamp", timestamp.ToString());

        var response = await _httpClient.SendAsync(request);
        var content = await response.Content.ReadAsStringAsync();
        return JsonConvert.DeserializeObject<T>(content);
    }
}
```

**SingleKey Authentication** (Frontend/Lightweight):
```javascript
// JavaScript/TypeScript
const query = `
  query GetProducts($locale: String!) {
    Product(locale: $locale) {
      _id
      name
      price
    }
  }
`;

const response = await fetch('https://cg.optimizely.com/graphql', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${OPTIMIZELY_ACCESS_KEY}`
  },
  body: JSON.stringify({
    query,
    variables: { locale: 'en-US' }
  })
});

const data = await response.json();
```

### 3.3 Filtering Patterns

**Complex Where Clauses**:
```graphql
query GetQualifiedLeads {
  Contact(
    where: {
      AND: [
        # Must have viewed product page
        { pageViews: { exists: true } }
        # Must be from qualifying region
        { region: { in: ["North America", "Europe", "APAC"] } }
        # Must meet revenue threshold
        { annualRevenue: { gte: 1000000 } }
        # AND must be either decision maker or influencer
        { OR: [
            { jobTitle: { contains: "Director" } }
            { jobTitle: { contains: "Manager" } }
            { jobTitle: { contains: "VP" } }
          ]
        }
        # But exclude specific companies
        { company: { notIn: ["Competitor A", "Competitor B"] } }
      ]
    }
    first: 100
  ) {
    _id
    name
    company
    email
  }
}
```

### 3.4 Ordering and Sorting

```graphql
# Multi-field ordering with mixed directions
query GetProductsByPopularity {
  Product(
    orderBy: [
      { views: DESC }
      { rating: DESC }
      { name: ASC }
    ]
  ) {
    _id
    name
    views
    rating
  }
}
```

### 3.5 Locale and Multi-Language Support

```graphql
query GetProductInMultipleLanguages($productId: String!) {
  # English version
  en: Product(locale: "en-US", where: { _id: { eq: $productId } }) {
    name
    description
  }

  # French version
  fr: Product(locale: "fr-FR", where: { _id: { eq: $productId } }) {
    name
    description
  }

  # Swedish version
  sv: Product(locale: "sv-SE", where: { _id: { eq: $productId } }) {
    name
    description
  }

  # Available locales for fallback handling
  _metadata {
    locales
  }
}
```

### 3.6 Query Fragments and Reuse

```graphql
# Reusable fragment
fragment ProductSummary on Product {
  _id
  name
  price
  rating
  reviewCount
}

# Fragment with nested structure
fragment ProductDetails on Product {
  ...ProductSummary
  description
  specifications {
    color
    size
    weight
  }
  manufacturer {
    name
    website
  }
}

# Multiple fragments in single query
query GetProductsAndCategories {
  featuredProducts: Product(first: 5) {
    ...ProductDetails
  }

  categories: ProductCategory(first: 20) {
    _id
    name
    productCount
    products: _references(contentType: ["Product"]) {
      ...ProductSummary
    }
  }
}
```

### 3.7 Pagination Strategies

**Cursor-Based Pagination** (recommended):
```graphql
query GetProductsWithCursor($first: Int!, $after: String) {
  Product(first: $first, after: $after) {
    edges {
      cursor
      node {
        _id
        name
        price
      }
    }
    pageInfo {
      hasNextPage
      endCursor
      hasPreviousPage
      startCursor
    }
  }
}

# Implementation in JavaScript
let allProducts = [];
let hasMore = true;
let cursor = null;

while (hasMore) {
  const result = await contentGraphClient.query(GetProductsQuery, {
    first: 50,
    after: cursor
  });

  allProducts = [...allProducts, ...result.data.Product.edges.map(e => e.node)];
  hasMore = result.data.Product.pageInfo.hasNextPage;
  cursor = result.data.Product.pageInfo.endCursor;
}
```

**Offset-Based Pagination** (simpler, less efficient):
```graphql
query GetProductsByOffset($skip: Int!, $limit: Int!) {
  Product(skip: $skip, limit: $limit) {
    _id
    name
    price
  }
}
```

### 3.8 Search Capabilities

**Semantic Search**:
```graphql
query SemanticProductSearch {
  Product(
    where: {
      _fulltext: {
        contains: "water-resistant outdoor gear"
        searchType: "Semantic"
      }
    }
    first: 20
  ) {
    _id
    name
    description
    category
  }
}
```

**Fuzzy Search** (typo-tolerant):
```graphql
query FuzzySearch($term: String!) {
  Product(
    where: {
      _fulltext: {
        contains: $term
        searchType: "Fuzzy"
        fuzziness: 2
      }
    }
  ) {
    _id
    name
  }
}
```

**Geospatial Search**:
```graphql
query NearbyStores {
  Store(
    where: {
      location: {
        near: {
          latitude: 40.7128
          longitude: -74.0060
          distance: 25
          unit: "km"
        }
      }
    }
  ) {
    _id
    name
    address
    location {
      latitude
      longitude
    }
    distanceInKm: _distance
  }
}
```

**Faceted Search** (aggregations):
```graphql
query ProductsWithFacets {
  # Main results
  products: Product(
    where: { price: { gte: 50, lte: 500 } }
    first: 20
  ) {
    _id
    name
    price
    category
  }

  # Category facet
  categoryFacets: Product(
    where: { price: { gte: 50, lte: 500 } }
  ) {
    facets {
      category {
        name
        count
      }
    }
  }

  # Manufacturer facet
  manufacturerFacets: Product(
    where: { price: { gte: 50, lte: 500 } }
  ) {
    facets {
      manufacturer {
        name
        count
      }
    }
  }

  # Price range facet
  priceFacets: Product {
    facets {
      priceRange {
        ranges: [
          { min: 0, max: 100, count: 45 }
          { min: 100, max: 500, count: 120 }
          { min: 500, max: 1000, count: 38 }
        ]
      }
    }
  }
}
```

### 3.9 Cached Query Templates

```csharp
// Server registration
public class CachedQueryTemplateService
{
    public void RegisterTemplates()
    {
        // Simple query template
        var getFeaturedProducts = new CachedQueryTemplate
        {
            Name = "GetFeaturedProducts",
            Query = @"
                query GetFeaturedProducts($locale: String!) {
                  Product(where: { featured: { eq: true } }) {
                    _id
                    name
                    price
                  }
                }
            ",
            CacheDuration = TimeSpan.FromHours(1),
            InvalidationTriggers = new[] { "Product" }
        };

        // Query with parameters
        var getProductsByCategory = new CachedQueryTemplate
        {
            Name = "GetProductsByCategory",
            Query = @"
                query GetProductsByCategory($category: String!, $limit: Int!, $locale: String!) {
                  products: Product(
                    where: { category: { eq: $category } }
                    limit: $limit
                    locale: $locale
                  ) {
                    _id
                    name
                    price
                    rating
                  }
                }
            ",
            CacheDuration = TimeSpan.FromMinutes(30),
            InvalidationTriggers = new[] { "Product" },
            Variables = new Dictionary<string, object>
            {
                { "limit", 20 },
                { "locale", "en-US" }
            }
        };

        Register(getFeaturedProducts);
        Register(getProductsByCategory);
    }
}
```

Client invocation of cached template:
```graphql
query GetFeaturedProducts($locale: String!) {
  __cached: "GetFeaturedProducts"
  variables: { locale: $locale }
}
```

### 3.10 Smooth Rebuild

Smooth rebuild progressively reindexes Content Graph without downtime:

```csharp
public class ContentGraphRebuildService
{
    private readonly IContentGraphClient _client;

    public async Task StartSmoothRebuild()
    {
        var rebuildRequest = new SmoothRebuildRequest
        {
            RebuildType = RebuildType.Incremental,
            StartDate = DateTime.UtcNow,
            ContentTypes = new[] { "Product", "Category" }
        };

        var result = await _client.InitiateSmoothRebuild(rebuildRequest);

        // Poll for completion
        while (result.Status != RebuildStatus.Complete)
        {
            await Task.Delay(TimeSpan.FromSeconds(30));
            result = await _client.GetRebuildStatus(result.RebuildId);

            Console.WriteLine($"Rebuild progress: {result.PercentageComplete}%");
            Console.WriteLine($"Indexed items: {result.IndexedCount}/{result.TotalCount}");
        }

        Console.WriteLine("Rebuild complete, new index is now live");
    }
}
```

When to trigger smooth rebuild:
- After content type definition changes
- After adding new searchable fields
- After modifying search analyzer configuration
- After changing locale settings
- During off-peak hours (optional)

## 4. DXP Cloud

### 4.1 Container-Based Deployment

DXP Cloud runs containerized Optimizely instances on Azure App Service:

**Dockerfile example**:
```dockerfile
FROM mcr.microsoft.com/dotnet/framework/aspnet:4.8

WORKDIR /app

# Copy compiled application
COPY bin/Release/net48/ ./

# Set environment configuration
ENV ASPNETCORE_ENVIRONMENT=Production
ENV ASPNETCORE_URLS=http://+:80

EXPOSE 80

ENTRYPOINT ["cmd.exe", "/c", "start /wait w3wp.exe -apppool DefaultAppPool"]
```

### 4.2 Environment Hierarchy and Promotion

```
┌─────────────────────┐
│  Development        │  Continuous updates, debugging enabled
│  (Feature branches) │
└──────────┬──────────┘
           ↓ (automated)
┌─────────────────────┐
│  Integration        │  Pre-release testing, integration tests
│  (Main branch)      │
└──────────┬──────────┘
           ↓ (manual promotion)
┌─────────────────────┐
│  Staging            │  Pre-production validation, UAT
│  (Main branch)      │
└──────────┬──────────┘
           ↓ (scheduled release)
┌─────────────────────┐
│  Production         │  Live customer traffic
│  (Tagged releases)  │
└─────────────────────┘
```

### 4.3 CI/CD Pipeline Example

```yaml
# Azure DevOps Pipeline
trigger:
  - main
  - release/*

pool:
  vmImage: 'windows-latest'

stages:
  - stage: Build
    jobs:
      - job: CompileAndTest
        steps:
          - task: DotNetCoreCLI@2
            inputs:
              command: 'build'
              arguments: '--configuration Release'

          - task: DotNetCoreCLI@2
            inputs:
              command: 'test'
              arguments: '--configuration Release --no-build'

          - task: DotNetCoreCLI@2
            inputs:
              command: 'publish'
              arguments: '--configuration Release --output $(Build.ArtifactStagingDirectory)'

          - task: PublishBuildArtifacts@1
            inputs:
              pathToPublish: '$(Build.ArtifactStagingDirectory)'
              artifactName: 'drop'

  - stage: Deploy_Staging
    dependsOn: Build
    condition: succeeded()
    jobs:
      - deployment: DeployToStaging
        environment: 'Staging'
        strategy:
          runOnce:
            deploy:
              steps:
                - task: DownloadBuildArtifacts@0
                  inputs:
                    artifactName: 'drop'
                    downloadPath: '$(Pipeline.Workspace)'

                - task: AzureAppServiceDeploy@1
                  inputs:
                    azureSubscription: 'Azure Subscription'
                    appType: 'webAppOnWindows'
                    appName: 'optimizely-staging'
                    package: '$(Pipeline.Workspace)/**/*.zip'

  - stage: Deploy_Production
    dependsOn: Deploy_Staging
    condition: succeeded()
    jobs:
      - deployment: DeployToProduction
        environment: 'Production'
        strategy:
          runOnce:
            deploy:
              steps:
                - task: DownloadBuildArtifacts@0
                - task: AzureAppServiceDeploy@1
                  inputs:
                    azureSubscription: 'Azure Subscription'
                    appName: 'optimizely-production'
```

## 5. Commerce

### 5.1 Catalog Structure

```csharp
// Catalog hierarchy
var catalog = catalogSystem.GetCatalogByName("Electronics");

// Products
var laptop = catalogSystem.GetEntryByCode("LAPTOP-PRO-15", catalog.CatalogId);

// Variants
var variants = laptop.Variations;
// Example: [Color: Silver, Storage: 512GB], [Color: Space Gray, Storage: 1TB]

// Associations
var relatedProducts = laptop.Associations
    .Where(a => a.AssociationType == "CrossSell")
    .Select(a => catalogSystem.GetEntryByCode(a.LinkedEntryCode, catalog.CatalogId));
```

### 5.2 Pricing and Inventory

```csharp
// Dynamic pricing
var market = MarketService.GetMarket(MarketId.Default);
var prices = priceService.GetPrices(productCode, market.MarketId);
var customerPrice = priceService.GetCustomerPrice(productCode, customer.CustomerGroup);

// Inventory management
var inventory = inventoryService.GetInventoryInformation(productCode);
if (inventory.QuantityOnHand > 0)
{
    // Product available for purchase
}
```

### 5.3 Order Pipeline

```csharp
// Create order
var cart = orderRepository.LoadCart<CartHelper>(customer, CartHelper.DefaultCartName);
cart.Add(new CartItem { Code = productCode, Quantity = 1 });
var savedCart = cart.SaveAsOrder();

// Process payment and fulfillment
var orderForm = savedCart.OrderForms.First();
orderForm.Status = OrderFormStatus.Completed;
orderRepository.Save(savedCart);
```

## 6. CMP (Campaign Management Platform)

### 6.1 Campaign Creation

```csharp
// Create campaign
var campaign = new Campaign
{
    Name = "Holiday Sale 2024",
    StartDate = new DateTime(2024, 11, 1),
    EndDate = new DateTime(2024, 12, 25),
    Description = "Major holiday promotions",
    Owner = currentUser,
    Status = CampaignStatus.Planning
};

campaignService.Create(campaign);
```

### 6.2 Publishing Workflow

```
Draft → Content Review → Manager Approval → Scheduled → Published
```

Each transition triggers notifications and audit logging.

## 7. Opal AI

### 7.1 Agent Types and Capabilities

```yaml
agents:
  - name: "ProductQueryAgent"
    type: "QueryAgent"
    purpose: "Answer questions about product information"
    knowledgeBase: "Product Catalog"
    tools:
      - contentGraphQuery
      - catalogLookup
    examples:
      - input: "What's the price of the Pro laptop?"
        output: "The Pro laptop is priced at $1,999"

  - name: "ContentCreationAgent"
    type: "ActionAgent"
    purpose: "Create and publish content"
    requiredApprovals: true
    tools:
      - createContent
      - publishContent
    rateLimit: "10 operations per hour"
```

### 7.2 Tool Configuration

```yaml
tools:
  - name: "ContentGraphQuery"
    type: "APITool"
    endpoint: "https://cg.optimizely.com/graphql"
    authentication: "HMAC"
    retryPolicy:
      maxAttempts: 3
      backoffMultiplier: 2

  - name: "EmailNotification"
    type: "PluginTool"
    handler: "EmailNotificationPlugin"
    config:
      smtpServer: "smtp.company.com"
      fromAddress: "noreply@company.com"
```

### 7.3 Evaluation Framework

```csharp
public class ContentQueryAgentEvaluation
{
    [Fact]
    public async Task Agent_AnswersProductQuestionsAccurately()
    {
        var testCases = new[]
        {
            new { Query = "What products are under $100?", ExpectedMin = 5 },
            new { Query = "Show me electronics", ExpectedMin = 10 },
            new { Query = "Newest products", ExpectedMin = 1 }
        };

        foreach (var testCase in testCases)
        {
            var result = await agent.Query(testCase.Query);
            Assert.True(result.Products.Count >= testCase.ExpectedMin);
        }
    }
}
```

## 8. Migration Patterns

### 8.1 CMS 12 to SaaS CMS

**Content Model Mapping**:
```
CMS 12 PageData → SaaS CMS Experience
CMS 12 BlockData → SaaS CMS Element
CMS 12 ContentArea → SaaS CMS Section
CMS 12 PropertyData → SaaS CMS Field
```

**Migration Steps**:
1. Audit existing content types (extract metadata)
2. Design SaaS CMS content types (field mapping)
3. Create Experiences structure
4. Migrate content (batch process + validation)
5. Update frontend (API consumption)
6. Parallel run (old + new systems)
7. Traffic switch
8. Decommission legacy system

### 8.2 Other Platform Migrations

**WordPress → Optimizely**:
- Posts → Experiences
- Categories → Taxonomies
- Media Library → Asset Management
- Plugins → Opal Tools or custom integrations

**Sitecore → Optimizely**:
- Items → Content Types
- Renderings → Display Templates
- Workflows → Publishing Pipeline
- Personalization → Visitor Groups or Opal AI

---

**Document Version**: 2.0
**Last Updated**: March 2024
**Maintainer**: BMAD Optimizely CoE
