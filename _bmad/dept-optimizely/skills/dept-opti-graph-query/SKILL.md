---
canonicalId: dept-opti-graph-query
name: "Content Graph Query Helper"
description: "Comprehensive guide for Content Graph query design and optimisation covering query anatomy, authentication, filtering, sorting, locale handling, fragments, pagination, semantic/fuzzy/geo/faceted search, cached query templates, and performance optimisation."
domain: optimizely
category: development
---

# Content Graph Query Design and Optimization

Comprehensive guide for designing, executing, and optimizing GraphQL queries against the Optimizely Content Graph API.

## Query Anatomy and Structure

### Complete Query Template

```graphql
# Query Name (for operation identification and caching)
query GetProductsWithDetails(
  # Variables: passed from client, provide type safety
  $first: Int!
  $after: String
  $locale: String!
  $searchTerm: String
  $minPrice: Float
) {
  # Metadata: introspection data about available types and fields
  _metadata {
    types {
      Product {
        fields
      }
      Category {
        fields
      }
    }
  }

  # Query field: retrieves typed content
  products: Product(
    # Connection parameters (pagination)
    first: $first
    after: $after

    # Filtering conditions
    where: {
      AND: [
        { price: { gte: $minPrice } }
        { status: { eq: "Active" } }
        { OR: [
            { category: { eq: "Electronics" } }
            { category: { eq: "Computers" } }
          ]
        }
        { _fulltext: { contains: $searchTerm, searchType: "Semantic" } }
      ]
    }

    # Sorting
    orderBy: [
      { popularity: DESC }
      { name: ASC }
    ]

    # Locale for multi-language
    locale: $locale
  ) {
    # Requested fields
    _id
    _type
    _version
    _modified
    name
    price
    description
    category

    # Nested relationships
    manufacturer {
      _id
      name
      website
    }

    # References to related content
    reviews: _references(contentType: ["Review"]) {
      _id
      author
      rating
      reviewText
    }
  }

  # Metadata for pagination
  pageInfo: ProductConnection {
    pageInfo {
      hasNextPage
      endCursor
      hasPreviousPage
      startCursor
    }
  }

  # Aggregations for faceted search
  facets: ProductAggregation {
    facets {
      category {
        name
        count
      }
      manufacturer {
        name
        count
      }
      priceRange {
        name
        count
      }
    }
  }
}
```

## Authentication Patterns

### HMAC Authentication (Server-to-Server)

HMAC provides time-based authentication suitable for backend services:

```csharp
using System;
using System.Net.Http;
using System.Text;
using System.Security.Cryptography;
using Newtonsoft.Json;

public class ContentGraphHmacClient
{
    private readonly string _publicKey;
    private readonly string _accessKey;
    private readonly string _baseUrl;
    private readonly HttpClient _httpClient;

    public ContentGraphHmacClient(string publicKey, string accessKey, string baseUrl = "https://cg.optimizely.com")
    {
        _publicKey = publicKey;
        _accessKey = accessKey;
        _baseUrl = baseUrl;
        _httpClient = new HttpClient();
    }

    public async Task<T> QueryAsync<T>(string query, Dictionary<string, object> variables = null)
    {
        var requestBody = new
        {
            query = query,
            variables = variables ?? new Dictionary<string, object>()
        };

        var bodyJson = JsonConvert.SerializeObject(requestBody);
        var bodyBytes = Encoding.UTF8.GetBytes(bodyJson);

        // Create HMAC signature
        // Message = HTTP Method + HTTP Path + Body
        var message = $"POST/graphql{bodyJson}";
        var messageBytes = Encoding.UTF8.GetBytes(message);

        using (var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(_accessKey)))
        {
            var signatureBytes = hmac.ComputeHash(messageBytes);
            var signature = Convert.ToBase64String(signatureBytes);

            // Create request with HMAC headers
            var request = new HttpRequestMessage(HttpMethod.Post, $"{_baseUrl}/graphql")
            {
                Content = new StringContent(bodyJson, Encoding.UTF8, "application/json")
            };

            // Timestamp must be within 5 minutes of server time
            var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds();

            request.Headers.Add("EpiGraphQL-HMAC", $"{_publicKey};{signature}");
            request.Headers.Add("Timestamp", timestamp.ToString());

            var response = await _httpClient.SendAsync(request);
            var responseContent = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
                throw new Exception($"GraphQL request failed: {response.StatusCode} - {responseContent}");

            return JsonConvert.DeserializeObject<T>(responseContent);
        }
    }
}

// Usage
var client = new ContentGraphHmacClient(
    publicKey: "your-public-key",
    accessKey: "your-secret-access-key"
);

var result = await client.QueryAsync<dynamic>(
    query: @"query { Product(first: 10) { _id name price } }",
    variables: new Dictionary<string, object> { { "first", 10 } }
);
```

### SingleKey Authentication (Frontend)

SingleKey provides static bearer token authentication suitable for frontend applications:

```javascript
// JavaScript/TypeScript
class ContentGraphClient {
  constructor(accessKey, baseUrl = 'https://cg.optimizely.com') {
    this.accessKey = accessKey;
    this.baseUrl = baseUrl;
  }

  async query(query, variables = {}) {
    const response = await fetch(`${this.baseUrl}/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.accessKey}`
      },
      body: JSON.stringify({
        query,
        variables
      })
    });

    const data = await response.json();

    if (data.errors) {
      throw new Error(`GraphQL Error: ${JSON.stringify(data.errors)}`);
    }

    return data;
  }

  async queryProducts(locale = 'en-US', first = 10, after = null) {
    const query = `
      query GetProducts($first: Int!, $after: String, $locale: String!) {
        Product(first: $first, after: $after, locale: $locale) {
          edges {
            node {
              _id
              name
              price
              description
            }
            cursor
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    `;

    const variables = {
      first,
      after,
      locale
    };

    return this.query(query, variables);
  }
}

// Usage
const client = new ContentGraphClient('your-single-key-token');
const products = await client.queryProducts('en-US', 20);
```

### Token Rotation and Expiration

Implement token management to handle expiring credentials:

```csharp
public class TokenManager
{
    private string _currentToken;
    private DateTime _tokenExpiration;
    private readonly ITokenService _tokenService;

    public async Task<string> GetValidToken()
    {
        if (_currentToken == null || DateTime.UtcNow >= _tokenExpiration)
        {
            var newToken = await _tokenService.RefreshToken();
            _currentToken = newToken.AccessKey;
            _tokenExpiration = DateTime.UtcNow.AddHours(newToken.ExpiresInHours);
        }

        return _currentToken;
    }
}
```

## Where Clauses and Filtering

### Basic Operators

```graphql
# Equality operators
where: { status: { eq: "Active" } }           # Equals
where: { status: { ne: "Deleted" } }          # Not equals

# String operators
where: { name: { startsWith: "Product" } }    # Begins with
where: { name: { endsWith: "2024" } }         # Ends with
where: { name: { contains: "Spring" } }       # Contains substring
where: { name: { in: ["A", "B", "C"] } }      # In list
where: { name: { notIn: ["X", "Y"] } }        # Not in list

# Numeric operators
where: { price: { gt: 100 } }                 # Greater than
where: { price: { gte: 100 } }                # Greater than or equal
where: { price: { lt: 500 } }                 # Less than
where: { price: { lte: 500 } }                # Less than or equal

# Range query
where: { price: { gte: 100, lte: 500 } }

# Boolean operators
where: { active: { eq: true } }
where: { available: { ne: false } }

# Field existence
where: { description: { exists: true } }
where: { stockPhoto: { exists: false } }
```

### Complex Filtering with AND/OR

```graphql
# Basic AND (all conditions must match)
query GetQualifiedProducts {
  Product(
    where: {
      AND: [
        { price: { gte: 50 } }
        { price: { lte: 500 } }
        { status: { eq: "Active" } }
        { featured: { eq: true } }
      ]
    }
    first: 20
  ) {
    _id
    name
    price
  }
}

# OR within AND (flexible matching)
query GetProductsByMultipleCriteria {
  Product(
    where: {
      AND: [
        { price: { gte: 100 } }
        { OR: [
            { category: { eq: "Electronics" } }
            { category: { eq: "Computers" } }
            { category: { eq: "Accessories" } }
          ]
        }
        { OR: [
            { manufacturer: { contains: "Apple" } }
            { manufacturer: { contains: "Microsoft" } }
            { manufacturer: { contains: "Dell" } }
          ]
        }
      ]
    }
    first: 50
  ) {
    _id
    name
    category
    manufacturer
  }
}

# Complex nested logic
query AdvancedFilter {
  Product(
    where: {
      AND: [
        {
          OR: [
            { AND: [
                { price: { gte: 100, lte: 500 } }
                { featured: { eq: true } }
              ]
            }
            { AND: [
                { salePrice: { exists: true } }
                { discount: { gte: 20 } }
              ]
            }
          ]
        }
        { status: { eq: "Active" } }
      ]
    }
  ) {
    _id
    name
    price
  }
}
```

### Negation and Exclusion

```graphql
# Exclude specific values
where: {
  AND: [
    { status: { ne: "Deleted" } }
    { status: { ne: "Draft" } }
  ]
}

# Exclude from categories
where: {
  category: { notIn: ["Internal", "Test", "Archive"] }
}

# Exclude by manufacturer
where: {
  manufacturer: { ne: "UnknownBrand" }
}
```

### Nested Object Filtering

```graphql
# Filter by nested object properties
where: {
  AND: [
    { manufacturer: { name: { startsWith: "Top" } } }
    { category: { status: { eq: "Active" } } }
  ]
}

# Multiple levels of nesting
where: {
  supplier: {
    location: {
      country: { eq: "United States" }
    }
  }
}
```

## OrderBy and Sorting

### Single Field Sorting

```graphql
query GetProductsByName {
  Product(
    orderBy: { name: ASC }
    first: 20
  ) {
    _id
    name
  }
}

query GetLatestProducts {
  Product(
    orderBy: { _modified: DESC }
    first: 20
  ) {
    _id
    name
    _modified
  }
}

query GetHighestPrice {
  Product(
    orderBy: { price: DESC }
    first: 20
  ) {
    _id
    name
    price
  }
}
```

### Multi-Field Sorting

```graphql
query GetProductsByCategoryAndPrice {
  Product(
    orderBy: [
      { category: ASC }
      { price: DESC }
      { name: ASC }
    ]
    first: 50
  ) {
    _id
    category
    name
    price
  }
}
```

### Relevance Sorting (for full-text search)

```graphql
query SemanticSearchProducts($searchTerm: String!) {
  Product(
    where: {
      _fulltext: {
        contains: $searchTerm
        searchType: "Semantic"
      }
    }
    orderBy: { _relevance: DESC }
    first: 20
  ) {
    _id
    name
    description
    _relevance: _score
  }
}
```

### Nested Field Sorting

```graphql
query GetProductsByAuthor {
  Product(
    orderBy: { author: { name: ASC } }
    first: 20
  ) {
    _id
    name
    author {
      name
      email
    }
  }
}
```

## Locale Handling for Multi-Language

### Requesting Specific Locales

```graphql
query GetProductInMultipleLocales($productId: String!) {
  # English (US)
  enUs: Product(
    locale: "en-US"
    where: { _id: { eq: $productId } }
  ) {
    _id
    name
    description
  }

  # French (Canada)
  frCa: Product(
    locale: "fr-CA"
    where: { _id: { eq: $productId } }
  ) {
    _id
    name
    description
  }

  # Spanish (Spain)
  esEs: Product(
    locale: "es-ES"
    where: { _id: { eq: $productId } }
  ) {
    _id
    name
    description
  }

  # German
  de: Product(
    locale: "de-DE"
    where: { _id: { eq: $productId } }
  ) {
    _id
    name
    description
  }
}
```

### Fallback Locale Behavior

Content Graph automatically respects locale hierarchy:

```
fr-CA (French Canadian)
  ↓ fallback to
fr (French)
  ↓ fallback to
en (English - default)
```

When requesting `locale: "fr-CA"`, the system returns:
1. French Canadian content if available
2. French content if Canadian variant unavailable
3. English content if neither French variant exists

### Available Locales Query

```graphql
query GetAvailableLocales {
  _metadata {
    locales
  }
}

# Returns: ["en-US", "en-GB", "fr-FR", "fr-CA", "de-DE", "es-ES", ...]
```

### Per-Field Locale Configuration

Some fields support locale-specific values:

```graphql
query GetProductWithLocaleFields {
  Product(locale: "fr-FR") {
    _id
    name
    description  # May be translated
    sku           # Usually non-translatable
    localizedUrl  # May vary by locale
  }
}
```

## Fragments and Query Reuse

### Fragment Definition and Usage

```graphql
# Define reusable fragment
fragment ProductBasics on Product {
  _id
  name
  price
  rating
  reviewCount
}

# Use fragment in query
query GetFeaturedProducts {
  featuredProducts: Product(
    where: { featured: { eq: true } }
    first: 10
  ) {
    ...ProductBasics
    category
  }
}

# Use same fragment in different query
query GetSaleProducts {
  saleProducts: Product(
    where: { onSale: { eq: true } }
    first: 20
  ) {
    ...ProductBasics
    originalPrice
    discountPercentage
  }
}
```

### Nested Fragments

```graphql
fragment ManufacturerInfo on Manufacturer {
  _id
  name
  website
  supportEmail
}

fragment ProductWithManufacturer on Product {
  _id
  name
  price
  manufacturer {
    ...ManufacturerInfo
  }
}

query GetProductsWithDetails {
  products: Product(first: 20) {
    ...ProductWithManufacturer
    category
    description
  }
}
```

### Fragments with Arguments

```graphql
# Fragment with inline type conditions
fragment PriceInfo on Product {
  price
  currency
  formattedPrice: price  # Alias for custom formatting
}

# Fragment for specific content type
fragment BlogPostContent on BlogPost {
  _id
  title
  body
  author {
    name
  }
  publishDate
  tags
}

query GetBlogPosts {
  posts: BlogPost(first: 10, orderBy: { publishDate: DESC }) {
    ...BlogPostContent
  }
}
```

### Aliases for Query Reuse

```graphql
query GetProductsByCategory {
  # Using aliases to fetch multiple categories in single query
  electronics: Product(
    where: { category: { eq: "Electronics" } }
    first: 5
  ) {
    _id
    name
    price
  }

  appliances: Product(
    where: { category: { eq: "Appliances" } }
    first: 5
  ) {
    _id
    name
    price
  }

  accessories: Product(
    where: { category: { eq: "Accessories" } }
    first: 5
  ) {
    _id
    name
    price
  }
}
```

## Pagination Patterns

### Cursor-Based Pagination (Recommended)

Cursor-based pagination is more efficient for large datasets:

```graphql
query GetProductsWithCursor($first: Int!, $after: String, $locale: String!) {
  Product(first: $first, after: $after, locale: $locale) {
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
      hasPreviousPage
      startCursor
      endCursor
    }
  }
}
```

**JavaScript Implementation**:
```javascript
async function fetchAllProducts(client, pageSize = 50) {
  let allProducts = [];
  let cursor = null;
  let hasMore = true;

  while (hasMore) {
    const result = await client.query(GetProductsQuery, {
      first: pageSize,
      after: cursor,
      locale: 'en-US'
    });

    const { edges, pageInfo } = result.data.Product;

    // Process batch
    allProducts = allProducts.concat(
      edges.map(edge => edge.node)
    );

    // Check for more pages
    hasMore = pageInfo.hasNextPage;
    cursor = pageInfo.endCursor;

    console.log(`Fetched ${allProducts.length} products...`);
  }

  return allProducts;
}
```

### Skip/Limit Pagination (Legacy)

Skip/limit is simpler but inefficient for large offsets:

```graphql
query GetProductsByOffset($skip: Int!, $limit: Int!) {
  Product(skip: $skip, limit: $limit) {
    _id
    name
    price
  }
}
```

**When to use Skip/Limit**:
- Small datasets (< 1000 items)
- User jumping to specific page
- Consistent ordering (data shouldn't change between requests)

**When to avoid Skip/Limit**:
- Large datasets (> 10,000 items)
- Continuous scrolling (use cursor instead)
- Frequently changing data

### Pagination Edge Cases

```graphql
# First page (no cursor)
query FirstPage {
  Product(first: 20, locale: "en-US") {
    edges { node { _id name } }
    pageInfo { hasNextPage endCursor }
  }
}

# Middle pages (with cursor)
# Execute with: after: "cursor-from-previous-page"

# Last page handling
query CheckForMore {
  Product(first: 20, after: $lastCursor) {
    pageInfo {
      hasNextPage  # Will be false when no more pages
      endCursor
    }
  }
}
```

## Search Types

### Semantic Search

Semantic search understands intent and meaning:

```graphql
query SemanticProductSearch($searchTerm: String!) {
  Product(
    where: {
      _fulltext: {
        contains: $searchTerm
        searchType: "Semantic"
      }
    }
    orderBy: { _relevance: DESC }
    first: 20
  ) {
    _id
    name
    description
    _score  # Relevance score (0-100)
  }
}

# Example: searching "waterproof hiking boots"
# Matches products like "water-resistant trekking shoes" even without exact phrase match
```

### Fuzzy Search

Fuzzy search tolerates typos and misspellings:

```graphql
query FuzzyProductSearch($searchTerm: String!) {
  Product(
    where: {
      _fulltext: {
        contains: $searchTerm
        searchType: "Fuzzy"
        fuzziness: 2  # Allow up to 2 character edits
      }
    }
    first: 20
  ) {
    _id
    name
    description
  }
}

# Example: searching "laptpo" matches "laptop"
# searching "monitr" matches "monitor"
```

### Geo Search

Location-based search for proximity queries:

```graphql
query NearbyStores($latitude: Float!, $longitude: Float!, $radiusKm: Int!) {
  Store(
    where: {
      location: {
        near: {
          latitude: $latitude
          longitude: $longitude
          distance: $radiusKm
          unit: "km"
        }
      }
    }
    orderBy: { _distance: ASC }
  ) {
    _id
    name
    address
    location {
      latitude
      longitude
    }
    distanceKm: _distance
  }
}

# Variables:
# { "latitude": 40.7128, "longitude": -74.0060, "radiusKm": 25 }
```

### Faceted Search

Aggregations for filtering and analytics:

```graphql
query ProductsWithFacets($minPrice: Float!, $maxPrice: Float!) {
  # Main results
  products: Product(
    where: {
      price: { gte: $minPrice, lte: $maxPrice }
      status: { eq: "Active" }
    }
    first: 20
  ) {
    _id
    name
    price
    category
    manufacturer
    rating
  }

  # Category facet (for filter options)
  categoryFacets: Product(
    where: {
      price: { gte: $minPrice, lte: $maxPrice }
      status: { eq: "Active" }
    }
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
    where: {
      price: { gte: $minPrice, lte: $maxPrice }
      status: { eq: "Active" }
    }
  ) {
    facets {
      manufacturer {
        name
        count
      }
    }
  }

  # Price range facet
  priceFacets: Product(
    where: { status: { eq: "Active" } }
  ) {
    facets {
      priceRanges {
        ranges {
          min
          max
          count
        }
      }
    }
  }
}

# Usage: display facets as filter options on UI
```

## Cached Query Templates

### Registration and Configuration

Cached query templates pre-compile and cache frequently-used queries:

```csharp
public class CachedQueryTemplateService
{
    private readonly IContentGraphClient _client;

    public async Task RegisterCachedTemplates()
    {
        // Simple cached template
        var getFeaturedProducts = new CachedQueryTemplate
        {
            Name = "GetFeaturedProducts",
            Query = @"
                query GetFeaturedProducts($locale: String!) {
                  Product(
                    where: { featured: { eq: true } }
                    orderBy: { _modified: DESC }
                    locale: $locale
                  ) {
                    _id
                    name
                    price
                    description
                  }
                }
            ",
            CacheDuration = TimeSpan.FromHours(1),
            InvalidationTriggers = new[] { "Product" }
        };

        // Parameterized cached template
        var getProductsByCategory = new CachedQueryTemplate
        {
            Name = "GetProductsByCategory",
            Query = @"
                query GetProductsByCategory($category: String!, $limit: Int!, $locale: String!) {
                  Product(
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
                { "limit", 20 }
            }
        };

        await _client.RegisterTemplate(getFeaturedProducts);
        await _client.RegisterTemplate(getProductsByCategory);
    }
}
```

### Using Cached Templates

```graphql
# Invoke cached template by name
query GetFeaturedProducts($locale: String!) {
  __cached: "GetFeaturedProducts"
  variables: { locale: $locale }
}

# Invoke with parameter override
query GetProductsByCategory($locale: String!) {
  __cached: "GetProductsByCategory"
  variables: {
    category: "Electronics"
    limit: 50
    locale: $locale
  }
}
```

### Cache Invalidation

```csharp
// Automatic invalidation when specified content type changes
var template = new CachedQueryTemplate
{
    Name = "GetProductsWithDetails",
    Query = "...",
    InvalidationTriggers = new[] { "Product", "Category", "Manufacturer" }
};

// Manual invalidation if needed
await cacheService.InvalidateTemplate("GetProductsWithDetails");

// Invalidate all cached queries
await cacheService.InvalidateAll();
```

## Smooth Rebuild

Smooth rebuild progressively reindexes Content Graph without downtime.

### When to Use Smooth Rebuild

- After modifying content type definitions
- After adding new searchable fields
- After changing field types
- After modifying search analyzer configuration
- After adding new locales

### Initiating Smooth Rebuild

```csharp
public class ContentGraphRebuildService
{
    private readonly IContentGraphClient _client;

    public async Task InitiateSmoothRebuild()
    {
        var rebuildRequest = new SmoothRebuildRequest
        {
            RebuildType = RebuildType.Incremental,
            ContentTypes = new[] { "Product", "Category" },
            StartDate = DateTime.UtcNow
        };

        var rebuildJob = await _client.StartSmoothRebuild(rebuildRequest);

        Console.WriteLine($"Rebuild started: {rebuildJob.RebuildId}");
        Console.WriteLine($"Estimated completion: {rebuildJob.EstimatedCompletion}");
    }

    public async Task MonitorRebuildProgress(string rebuildId)
    {
        while (true)
        {
            var status = await _client.GetRebuildStatus(rebuildId);

            Console.WriteLine($"Rebuild {rebuildId}:");
            Console.WriteLine($"  Status: {status.Status}");
            Console.WriteLine($"  Progress: {status.PercentageComplete}%");
            Console.WriteLine($"  Indexed: {status.IndexedCount}/{status.TotalCount}");

            if (status.Status == RebuildStatus.Complete)
            {
                Console.WriteLine("Rebuild complete! New index is now active.");
                break;
            }

            await Task.Delay(TimeSpan.FromSeconds(30));
        }
    }
}
```

## Common Query Patterns and Examples

### Product Listing with Filtering and Pagination

```graphql
query GetProductListing(
  $first: Int!
  $after: String
  $locale: String!
  $minPrice: Float
  $maxPrice: Float
  $category: String
) {
  products: Product(
    first: $first
    after: $after
    locale: $locale
    where: {
      AND: [
        { price: { gte: $minPrice, lte: $maxPrice } }
        { category: { eq: $category } }
        { status: { eq: "Active" } }
      ]
    }
    orderBy: { _modified: DESC }
  ) {
    edges {
      node {
        _id
        name
        price
        category
        rating
        image: _references(contentType: ["Image"]) {
          _id
        }
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

### Search with Facets

```graphql
query SearchProducts($searchTerm: String!, $locale: String!) {
  results: Product(
    where: {
      _fulltext: {
        contains: $searchTerm
        searchType: "Semantic"
      }
    }
    locale: $locale
    orderBy: { _relevance: DESC }
    first: 20
  ) {
    edges {
      node {
        _id
        name
        price
      }
    }
  }

  categoryFacet: Product(
    where: {
      _fulltext: { contains: $searchTerm }
    }
  ) {
    facets {
      category { name count }
    }
  }
}
```

### Related Content

```graphql
query GetProductWithRelated($productId: String!) {
  product: Product(where: { _id: { eq: $productId } }) {
    _id
    name
    price

    # Related products via association
    relatedProducts: _references(contentType: ["Product"]) {
      _id
      name
      price
    }

    # Category and other items in category
    category {
      name
      items: _references(contentType: ["Product"]) {
        _id
        name
      }
    }
  }
}
```

## Performance Optimization Guidelines

### Query Optimization Best Practices

1. **Request Only Needed Fields**: Don't over-fetch
```graphql
# Good - request specific fields
query GetProductNames {
  Product { _id name }
}

# Bad - requests all fields including descriptions
query GetProductNames {
  Product { ... }  # All fields
}
```

2. **Use Fragments for Reusable Selections**: Reduces duplication
```graphql
fragment ProductSummary on Product {
  _id name price
}

query GetProducts {
  products: Product { ...ProductSummary }
  featured: Product { ...ProductSummary }
}
```

3. **Limit Result Sets**: Use first/limit parameters
```graphql
# Good - bounded result set
query GetTop20 {
  Product(first: 20) { _id name }
}

# Bad - unbounded (could return thousands)
query GetAll {
  Product { _id name }
}
```

4. **Use Cached Query Templates**: For frequently-executed queries
```graphql
query GetFeaturedProducts($locale: String!) {
  __cached: "GetFeaturedProducts"
  variables: { locale: $locale }
}
```

5. **Leverage Cursor-Based Pagination**: For large datasets
```graphql
# Good - cursor pagination
Product(first: 50, after: $cursor) { }

# Less efficient - offset pagination for large offsets
Product(skip: 10000, limit: 50) { }
```

### Query Depth and Complexity

```graphql
# Reasonable depth (2-3 levels)
Product {
  _id
  name
  manufacturer {
    name
    website
  }
  reviews: _references(contentType: ["Review"]) {
    author
    rating
  }
}

# Excessive depth (problematic)
Product {
  manufacturer {
    country {
      region {
        area {
          neighborhood {
            # ... very deep nesting
          }
        }
      }
    }
  }
}
```

### Reducing Query Cost

```graphql
# Expensive: loads detailed data for each item
Product(first: 100) {
  details { very { nested { structure } } }
}

# Optimized: load summary first, details on demand
Product(first: 100) {
  _id name price
}

# Then request details for specific items
Product(where: { _id: { in: $selectedIds } }) {
  details { ... }
}
```

---

**Last Updated**: 2024
**Version**: 2.0
