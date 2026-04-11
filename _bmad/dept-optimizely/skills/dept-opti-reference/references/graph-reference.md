# Optimizely Graph - Comprehensive Reference Guide

This document synthesizes all Optimizely Graph documentation into a single, comprehensive reference for AI agents and developers. It is organized by topic rather than by source document.

**Table of Contents:**
1. [Overview](#overview)
2. [Setup & Configuration](#setup--configuration)
3. [GraphQL Schema](#graphql-schema)
4. [Querying Fundamentals](#querying-fundamentals)
5. [Filtering](#filtering)
6. [Sorting](#sorting)
7. [Pagination](#pagination)
8. [Full-Text Search](#full-text-search)
9. [Semantic Search](#semantic-search)
10. [Faceted Search](#faceted-search)
11. [Fuzzy Search](#fuzzy-search)
12. [Geo Search](#geo-search)
13. [Localisation](#localisation)
14. [Content Variations](#content-variations)
15. [Fragments & Aliases](#fragments--aliases)
16. [Advanced Query Patterns](#advanced-query-patterns)
17. [Content Synchronisation](#content-synchronisation)
18. [Performance & Optimisation](#performance--optimisation)
19. [Smooth Rebuild](#smooth-rebuild)
20. [CMS 12 Integration](#cms-12-integration)
21. [SaaS CMS Integration](#saas-cms-integration)
22. [Commerce Connect Integration](#commerce-connect-integration)
23. [Frontend Integration](#frontend-integration)
24. [Query Recipes](#query-recipes)
25. [The _json Field](#the-_json-field)

---

## Overview

Optimizely Graph is a headless, multi-tenant GraphQL API that enables developers to query content across Optimizely CMS (both on-premises CMS 12 and cloud-based SaaS CMS), e-commerce, and custom content sources through a single unified GraphQL endpoint.

### Key Characteristics

- **Single GraphQL Endpoint**: Access all content types across different systems through one API
- **Multi-tenant SaaS**: Hosted as a managed service with global distribution
- **Real-time Content Sync**: Automatic synchronization of content changes from CMS to Graph
- **Flexible Schema Generation**: Per-content-type schemas generated automatically based on your content configuration
- **Language Support**: Built-in multilingual content support with locale-aware queries
- **Advanced Search**: Full-text search, fuzzy search, semantic search, faceted search, and geo-location filtering
- **Performance Optimized**: Built for high-performance headless applications

### Architecture

The Optimizely Graph operates as follows:

1. Content is authored/configured in Optimizely CMS (12 or SaaS)
2. Content events are captured (Created, Updated, Published, Deleted, Moved)
3. Changes are serialized and sent to the Optimizely Graph Gateway
4. Content is indexed and made available via GraphQL queries
5. Frontend applications query content through the GraphQL endpoint

---

## Setup & Configuration

### CMS 12 Configuration

#### Installation

Install the NuGet package:

```bash
# Package Manager Console
Install-Package Optimizely.ContentGraph.Cms

# Or .NET CLI
dotnet add package Optimizely.ContentGraph.Cms
```

#### Configuration (appsettings.json)

```json
{
  "Optimizely": {
    "ContentGraph": {
      "GatewayAddress": "https://cg.optimizely.com",
      "AppKey": "your-hmac-app-key",
      "Secret": "your-hmac-secret-key",
      "SingleKey": "your-single-key-for-public-access",
      "BufferedIndexingGracePeriod": 10000,
      "PreventFieldCollision": true,
      "MaxBatchSize": 300,
      "ExtractMedia": true,
      "MarkRequiredPropertiesToGraph": false
    }
  }
}
```

**Configuration Properties:**

| Property | Description | Default |
|----------|-------------|---------|
| `GatewayAddress` | Optimizely Graph Gateway endpoint URL | `https://cg.optimizely.com` |
| `AppKey` | HMAC authentication public key | Required |
| `Secret` | HMAC authentication secret key | Required |
| `SingleKey` | Simple authentication key for read-only access | Optional |
| `BufferedIndexingGracePeriod` | Grace period in ms for batching | 0 |
| `MaxBatchSize` | Maximum items per batch | 300 |
| `ExtractMedia` | Enable text extraction from media files | true |
| `PreventFieldCollision` | Prevent GraphQL field collisions | false |
| `MarkRequiredPropertiesToGraph` | Mark required fields in Graph schema | false |
| `AllowSendingLog` | Enable detailed logging | false |

#### Startup Configuration (C#)

```csharp
services.AddContentGraph(options =>
{
    options.EnableSynchronizeMenu = true;
    options.Events.OnGeneratingPreviewUrl = context =>
    {
        var baseUrl = "https://mysite.com";
        var previewUrl = $"{baseUrl}/api/preview?ref={context.ContentReference}&lang={context.Language.Name}";
        context.UpdateUrl(new Uri(previewUrl));
        return Task.CompletedTask;
    };
});
```

### SaaS CMS Configuration

#### Quick Start Setup

1. **Create an Optimizely Graph instance** in the Optimizely cloud admin UI
2. **Obtain API credentials**:
   - AppKey (public key for HMAC)
   - Secret (private key for HMAC)
   - SingleKey (optional, for public read-only access)
3. **Configure synchronization**:
   - Enable automatic content sync in your SaaS CMS instance settings
   - Content changes are synchronized automatically to Graph

#### Authentication

```
Authorization: epi-single-key [your-single-key]
```

Or for HMAC authentication, use standard GraphQL libraries that support custom headers.

### API Keys & Authentication

**Types of Keys:**

- **AppKey/Secret**: HMAC authentication pair for secured requests (server-to-server)
- **SingleKey**: Simple bearer token for public, read-only access (frontend applications)

**Usage:**

```graphql
# With SingleKey (in HTTP header)
Authorization: epi-single-key YOUR_SINGLE_KEY

# HMAC is handled automatically by client libraries
```

---

## GraphQL Schema

### Schema Structure

Optimizely Graph generates a GraphQL schema automatically based on your content types. Each content type in your CMS becomes a query type in Graph.

```graphql
type Query {
  ArticleConnection(
    where: ArticleWhereInput
    orderBy: ArticleOrderByInput
    skip: Int
    limit: Int
    locale: String
  ): ArticleConnection

  Article(
    id: ID!
    locale: String
  ): Article
}

type Article {
  id: ID!
  _metadata: ContentMetadata!
  title: String
  content: String
  publishedDate: DateTime
  author: String
  tags: [String]
}
```

### Field Conventions

- **Queries**: Connection queries follow the naming pattern `{ContentType}Connection` (e.g., `ArticleConnection`)
- **Fields**: Correspond directly to properties in your content type
- **Metadata**: All content types have a `_metadata` field containing system information
- **Localized Fields**: Language variants are accessed through the `locale` parameter

### Required Query Parameters

```graphql
{ContentType}Connection(
  where: {ContentType}WhereInput        # Filtering
  orderBy: {ContentType}OrderByInput    # Sorting
  skip: Int                              # Pagination offset
  limit: Int                             # Pagination limit
  locale: String                         # Language/locale
): {ContentType}Connection
```

### Metadata Field (_metadata)

Every content item includes a `_metadata` field with system information:

```graphql
fragment ContentMetadata on ContentMetadata {
  key              # Unique content identifier (GUID)
  locale           # Current locale/language
  types            # Content type names
  displayName      # Display name in CMS
  url              # Content URL path
  version          # Version number
  lastModified     # Last modification timestamp
}
```

### Per-Content-Type Schema

Each content type automatically gets its own schema definition. Content type names are converted:

- CMS name: `ArticlePage`
- GraphQL name: `Article` (typically)
- Query: `ArticleConnection` / `Article`

To explore your schema, use GraphQL introspection or the Optimizely Graph Explorer in the admin UI.

---

## Querying Fundamentals

### Basic Query Structure

```graphql
{
  ArticleConnection(limit: 10) {
    edges {
      node {
        id
        title
        content
        _metadata {
          url
          lastModified
        }
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
```

### Query Arguments

All queries accept these standard arguments:

| Argument | Type | Description |
|----------|------|-------------|
| `where` | WhereInput | Filter criteria |
| `orderBy` | OrderByInput | Sort order |
| `skip` | Int | Skip first N items (offset pagination) |
| `limit` | Int | Return max N items |
| `locale` | String | Language/locale (e.g., "en", "sv", "en-US") |

### The where Parameter

The `where` parameter filters content using operators and logical connectors.

```graphql
{
  ArticleConnection(
    where: {
      title: { contains: "GraphQL" }
      AND: {
        status: { eq: "Published" }
        publishedDate: { gte: "2024-01-01" }
      }
    }
  ) {
    edges { node { id title } }
  }
}
```

### Field Operators

Operators are applied to individual fields in the where clause:

| Operator | Type | Description | Example |
|----------|------|-------------|---------|
| `eq` | All | Equal | `{ status: { eq: "Active" } }` |
| `neq` | All | Not equal | `{ status: { neq: "Draft" } }` |
| `lt` | Numeric/Date | Less than | `{ price: { lt: 100 } }` |
| `lte` | Numeric/Date | Less than or equal | `{ price: { lte: 100 } }` |
| `gt` | Numeric/Date | Greater than | `{ price: { gt: 50 } }` |
| `gte` | Numeric/Date | Greater than or equal | `{ price: { gte: 50 } }` |
| `in` | All | In array | `{ status: { in: ["Active", "Pending"] } }` |
| `contains` | String | String contains (case-insensitive) | `{ title: { contains: "news" } }` |
| `match` | String | Full-text search | `{ content: { match: "GraphQL" } }` |
| `exists` | All | Field exists | `{ customField: { exists: true } }` |
| `fuzzy` | String | Fuzzy matching (misspelling tolerant) | `{ title: { fuzzy: "grpahql" } }` |
| `range` | Numeric/Date | Range filter | `{ price: { range: { from: 10, to: 100 } } }` |

### Single Item Query

Query a single item by ID:

```graphql
{
  Article(id: "abc123") {
    id
    title
    content
    _metadata {
      url
    }
  }
}
```

---

## Filtering

### Basic Filtering with where

Filter content using the `where` parameter with field operators:

```graphql
{
  ArticleConnection(
    where: { title: { contains: "React" } }
    limit: 20
  ) {
    edges {
      node {
        id
        title
      }
    }
  }
}
```

### Logical Connectors

Combine multiple filter conditions using `_and`, `_or`, and `_not`:

#### AND (_and)

All conditions must be true:

```graphql
{
  ArticleConnection(
    where: {
      _and: [
        { title: { contains: "GraphQL" } }
        { status: { eq: "Published" } }
        { publishedDate: { gte: "2024-01-01" } }
      ]
    }
  ) {
    edges { node { id title } }
  }
}
```

#### OR (_or)

At least one condition must be true:

```graphql
{
  ArticleConnection(
    where: {
      _or: [
        { category: { eq: "Tech" } }
        { category: { eq: "News" } }
        { isFeatured: { eq: true } }
      ]
    }
  ) {
    edges { node { id title } }
  }
}
```

#### NOT (_not)

Exclude items matching the condition:

```graphql
{
  ArticleConnection(
    where: {
      _not: { status: { eq: "Draft" } }
    }
  ) {
    edges { node { id title } }
  }
}
```

#### Complex Boolean Logic

Combine AND, OR, and NOT:

```graphql
{
  ArticleConnection(
    where: {
      _and: [
        {
          _or: [
            { category: { eq: "Tech" } }
            { category: { eq: "Business" } }
          ]
        }
        { _not: { status: { eq: "Archived" } } }
        { publishedDate: { gte: "2024-01-01" } }
      ]
    }
  ) {
    edges { node { id title } }
  }
}
```

### Filtering by GUIDs (ids Parameter)

Filter content by a list of content IDs:

```graphql
{
  ArticleConnection(
    where: {
      ids: [
        "f7d4e8a1-9c3b-4e7a-8f2d-1a5b6c9d0e2f",
        "a2b3c4d5-e6f7-489a-b1c2-d3e4f5a6b7c8"
      ]
    }
  ) {
    edges {
      node {
        id
        title
      }
    }
  }
}
```

### Nested Filtering

Filter on nested/related content:

```graphql
{
  ArticleConnection(
    where: {
      author: {
        name: { contains: "Smith" }
      }
    }
  ) {
    edges {
      node {
        id
        title
        author {
          name
          email
        }
      }
    }
  }
}
```

---

## Sorting

### The orderBy Parameter

Sort query results using the `orderBy` parameter:

```graphql
{
  ArticleConnection(
    orderBy: { publishedDate: DESC }
    limit: 10
  ) {
    edges {
      node {
        id
        title
        publishedDate
      }
    }
  }
}
```

### Sorting Directions

- `ASC` or `asc` - Ascending order (A-Z, 0-9, earliest to latest)
- `DESC` or `desc` - Descending order (Z-A, 9-0, latest to earliest)

### Multi-Field Sorting

Sort by multiple fields with priority:

```graphql
{
  ArticleConnection(
    orderBy: {
      isFeatured: DESC
      publishedDate: DESC
      title: ASC
    }
  ) {
    edges {
      node {
        id
        title
        publishedDate
        isFeatured
      }
    }
  }
}
```

### Relevance Scoring

When using full-text search, sort by relevance score:

```graphql
{
  ArticleConnection(
    where: { content: { match: "optimization" } }
    orderBy: { _ranking: DESC }
  ) {
    edges {
      node {
        id
        title
        _metadata {
          score
        }
      }
    }
  }
}
```

### Score-Based Filtering

Filter results by relevance score:

```graphql
{
  ArticleConnection(
    where: {
      content: { match: "optimization" }
      _metadata: { score: { gte: 0.7 } }
    }
    orderBy: { _ranking: DESC }
  ) {
    edges {
      node {
        id
        title
      }
    }
  }
}
```

---

## Pagination

### Skip/Limit Pagination

Use `skip` and `limit` for offset-based pagination:

```graphql
{
  ArticleConnection(
    skip: 20          # Skip first 20 items
    limit: 10         # Return next 10 items
    orderBy: { publishedDate: DESC }
  ) {
    edges {
      node {
        id
        title
      }
    }
    pageInfo {
      totalCount
      hasNextPage
      hasPreviousPage
    }
  }
}
```

**Pros:**
- Simple to implement
- Works well for small to medium datasets

**Cons:**
- Inefficient for large datasets (must skip all previous items)
- Can return duplicate items if data changes between requests

### Cursor-Based Pagination

Use cursors for stable, efficient pagination through large datasets:

```graphql
{
  ArticleConnection(
    first: 10
    after: "cursor_from_previous_response"
  ) {
    edges {
      node {
        id
        title
      }
      cursor
    }
    pageInfo {
      endCursor
      hasNextPage
    }
  }
}
```

**Pros:**
- Efficient even for very large datasets
- Stable pagination (no duplicates if data changes)
- Recommended for production use

**Cons:**
- Slightly more complex to implement
- Cannot jump to arbitrary page numbers

### Page Navigation Pattern

```graphql
{
  ArticleConnection(
    first: 20
    after: "cursor_value_from_previous_page"
    orderBy: { publishedDate: DESC }
  ) {
    edges {
      node {
        id
        title
        publishedDate
      }
      cursor
    }
    pageInfo {
      hasNextPage
      endCursor
      hasPreviousPage
      startCursor
    }
  }
}
```

### Large Dataset Strategy

For datasets with millions of items:

1. **Use cursor-based pagination** (not skip/limit)
2. **Reduce page size** if necessary (e.g., first: 50 instead of 1000)
3. **Add filters** to narrow results before paginating
4. **Use search filters** to pre-filter to relevant results
5. **Cache cursor positions** for user sessions

---

## Full-Text Search

### Match Operator

Perform full-text search using the `match` operator:

```graphql
{
  ArticleConnection(
    where: { content: { match: "GraphQL optimization" } }
    orderBy: { _ranking: DESC }
    limit: 20
  ) {
    edges {
      node {
        id
        title
        content
        _metadata {
          score
        }
      }
    }
  }
}
```

### Contains Operator

Case-insensitive substring matching:

```graphql
{
  ArticleConnection(
    where: { title: { contains: "react" } }
  ) {
    edges {
      node {
        id
        title
      }
    }
  }
}
```

### Searchable Fields

Full-text search works on text fields configured as searchable in your content type schema. These typically include:

- Text areas
- Rich text fields
- Short text fields
- Large text content

To enable full-text search on a field in CMS 12:

```csharp
[Display(Name = "Article Content")]
[Searchable]  // Enable full-text search indexing
public virtual XhtmlString Content { get; set; }
```

### Relevance Ranking

Search results are ranked by relevance score. Use `_ranking` to sort by relevance:

```graphql
{
  ArticleConnection(
    where: { content: { match: "headless commerce" } }
    orderBy: { _ranking: DESC }
  ) {
    edges {
      node {
        id
        title
        _metadata {
          score      # Relevance score (0-1)
        }
      }
    }
  }
}
```

### Highlighted Snippets

Get snippets of content with search terms highlighted:

```graphql
{
  ArticleConnection(
    where: { content: { match: "optimization" } }
  ) {
    edges {
      node {
        id
        title
        _search {
          highlight {
            content    # Content snippet with highlighting
          }
        }
      }
    }
  }
}
```

---

## Semantic Search

### Overview

Semantic search uses AI-powered embeddings to find content by meaning, not just keyword matching. It understands context and intent.

### Using Semantic Search

```graphql
{
  ArticleConnection(
    where: { content: { match: "How to optimize web applications" } }
    orderBy: { _ranking: DESC }
  ) {
    edges {
      node {
        id
        title
        _metadata {
          score
        }
      }
    }
  }
}
```

### Semantic vs Full-Text Search

| Feature | Full-Text | Semantic |
|---------|-----------|----------|
| Match Type | Exact keywords | Meaning-based |
| Handles Synonyms | No | Yes |
| Typo Tolerant | No (use fuzzy) | Somewhat |
| Performance | Very fast | Fast |
| Ideal For | Exact keyword search | Meaning-based queries |

**Example Use Case:**

```graphql
# Semantic: Understands "performance optimization" and "speed tuning"
{
  ArticleConnection(
    where: { content: { match: "speed up my website" } }
    orderBy: { _ranking: DESC }
  ) {
    edges {
      node {
        id
        title
      }
    }
  }
}
```

---

## Faceted Search

### Overview

Faceted search provides aggregated statistics about content properties, enabling navigation and filtering by categories.

### Facet Queries

```graphql
{
  ArticleConnection(
    where: { status: { eq: "Published" } }
  ) {
    facets {
      category {
        name
        count
      }
      author {
        name
        count
      }
    }
    edges {
      node {
        id
        title
      }
    }
  }
}
```

### Filtering by Facet Results

Use facet results to filter content:

```graphql
{
  ArticleConnection(
    where: {
      _and: [
        { status: { eq: "Published" } }
        { category: { in: ["Tech", "Business"] } }
      ]
    }
  ) {
    facets {
      category {
        name
        count
      }
    }
    edges {
      node {
        id
        title
        category
      }
    }
  }
}
```

### Facet Summary Pattern

```graphql
{
  ArticleConnection {
    facets {
      category {
        name
        count
      }
      year {
        name
        count
      }
      tags {
        name
        count
      }
    }
    totalCount
  }
}
```

---

## Fuzzy Search

### Overview

Fuzzy search handles misspellings and near-matches, making searches more forgiving of typos.

### Fuzzy Search Query

```graphql
{
  ArticleConnection(
    where: { title: { fuzzy: "grpahql" } }  # Misspelled, but finds "GraphQL"
  ) {
    edges {
      node {
        id
        title
      }
    }
  }
}
```

### Configuration

Fuzzy search is typically enabled by default. Configure the fuzziness level:

- 1 character difference: Good for short words
- 2 character differences: Default, balanced
- 3+ character differences: Very forgiving but may return irrelevant results

### Use Cases

- User-typed search queries
- Handling common misspellings
- Autocomplete suggestions
- Product/article discovery

---

## Geo Search

### Overview

Geo search filters and ranks content by location proximity. Useful for finding nearby products, events, or locations.

### Location Filtering

```graphql
{
  LocationConnection(
    where: {
      location: {
        distance: {
          from: {
            latitude: 40.7128
            longitude: -74.0060
          }
          distance: "10km"
        }
      }
    }
  ) {
    edges {
      node {
        id
        name
        location {
          latitude
          longitude
        }
      }
    }
  }
}
```

### Location Ranking

Rank results by distance from a location:

```graphql
{
  RestaurantConnection(
    where: {
      location: {
        distance: {
          from: {
            latitude: 40.7128
            longitude: -74.0060
          }
          distance: "50km"
        }
      }
    }
    orderBy: { _distance: ASC }
  ) {
    edges {
      node {
        id
        name
        location {
          latitude
          longitude
          distance    # Distance in km
        }
      }
    }
  }
}
```

---

## Localisation

### Locale Parameter

Specify language/locale for content queries:

```graphql
{
  ArticleConnection(
    locale: "sv"          # Swedish
    limit: 10
  ) {
    edges {
      node {
        id
        title                    # Swedish version
        content                  # Swedish version
        _metadata {
          locale
        }
      }
    }
  }
}
```

### Supported Locale Formats

- ISO 639-1: `en`, `sv`, `de`, `fr`
- Full locale: `en-US`, `en-GB`, `sv-SE`
- Neutral: `en` (matches `en-US`, `en-GB`, etc.)

### Language Routing

Queries automatically route to the appropriate language version:

```graphql
{
  ArticleConnection(locale: "fr") { ... }      # French
  ArticleConnection(locale: "de") { ... }      # German
  ArticleConnection(locale: "de-AT") { ... }   # Austrian German
}
```

### Fallback Language Support

When a translation doesn't exist, Graph returns content in the fallback language:

- Default fallback: English (`en`)
- Configurable per content type
- Explicitly specified in query

```graphql
{
  ArticleConnection(
    locale: "ja"                # Request Japanese
    fallbackLocale: "en"        # Fall back to English if not found
  ) {
    edges {
      node {
        id
        title
        _metadata {
          locale                # Returns actual locale (ja or en)
        }
      }
    }
  }
}
```

### Multilingual Content Support

Query all available languages:

```graphql
{
  ArticleConnection {
    edges {
      node {
        id
        _metadata {
          locale
        }
        locales {
          sv
          en
          de
          fr
        }
      }
    }
  }
}
```

### Language-Aware Search

Full-text search respects language context:

```graphql
{
  ArticleConnection(
    where: { content: { match: "optimering" } }
    locale: "sv"                               # Search in Swedish
  ) {
    edges {
      node {
        id
        title
      }
    }
  }
}
```

### Configure Language in CMS 12

Enable languages through globalization settings:

```csharp
services.Configure<QueryOptions>(options =>
{
    // Language configuration is handled through CMS globalization settings
    // Content Graph will automatically detect enabled languages
});
```

---

## Content Variations

### A/B Testing Queries

Query content variants for A/B testing:

```graphql
{
  ArticleConnection(
    where: { abTestVariant: { eq: "variant_b" } }
  ) {
    edges {
      node {
        id
        title
        variant: abTestVariant
        _metadata {
          version
        }
      }
    }
  }
}
```

### Personalization Variants

Query personalized content versions:

```graphql
{
  ArticleConnection(
    where: {
      _and: [
        { personalizationSegment: { eq: "premium_users" } }
        { status: { eq: "Published" } }
      ]
    }
  ) {
    edges {
      node {
        id
        title
        segment: personalizationSegment
      }
    }
  }
}
```

### Localization Variants

Query different language/locale versions:

```graphql
{
  ArticleConnection {
    edges {
      node {
        id
        _metadata {
          locale
        }
        enContent: content(locale: "en")
        svContent: content(locale: "sv")
        deContent: content(locale: "de")
      }
    }
  }
}
```

---

## Fragments & Aliases

### Fragment Definitions

Define reusable fragments for common field selections:

```graphql
fragment ArticleBasics on Article {
  id
  title
  publishedDate
  author
}

fragment ArticleWithContent on Article {
  ...ArticleBasics
  content
  category
  tags
}

query GetArticles {
  ArticleConnection(limit: 20) {
    edges {
      node {
        ...ArticleWithContent
        _metadata {
          url
          lastModified
        }
      }
    }
  }
}
```

### Block Fragments

Use fragments to handle block-based content structures:

```graphql
fragment HeroBlock on Block {
  id
  type
  ... on HeroBlockType {
    title
    subtitle
    backgroundImage
    callToAction
  }
}

fragment ContentBlock on Block {
  id
  type
  ... on ContentBlockType {
    heading
    body
    alignment
  }
}

query PageWithBlocks {
  PageConnection {
    edges {
      node {
        id
        title
        blocks {
          ...HeroBlock
          ...ContentBlock
        }
      }
    }
  }
}
```

### Inline Fragments

Use inline fragments for type-specific fields without defining separate fragments:

```graphql
{
  ContentConnection {
    edges {
      node {
        id
        title
        ... on Article {
          author
          publishedDate
        }
        ... on BlogPost {
          category
          tags
        }
      }
    }
  }
}
```

### Field Aliases

Rename fields in results:

```graphql
{
  ArticleConnection(limit: 10) {
    edges {
      node {
        id
        headline: title            # Alias
        body: content              # Alias
        by: author                 # Alias
        published: publishedDate   # Alias
      }
    }
  }
}
```

### Multiple Queries with Aliases

Query the same content type with different filters:

```graphql
{
  featured: ArticleConnection(
    where: { isFeatured: { eq: true } }
    limit: 5
  ) {
    edges {
      node {
        id
        title
      }
    }
  }

  recent: ArticleConnection(
    orderBy: { publishedDate: DESC }
    limit: 5
  ) {
    edges {
      node {
        id
        title
        publishedDate
      }
    }
  }

  trending: ArticleConnection(
    orderBy: { viewCount: DESC }
    limit: 5
  ) {
    edges {
      node {
        id
        title
        views: viewCount
      }
    }
  }
}
```

---

## Advanced Query Patterns

### Parent and Child Queries

Query hierarchical content relationships:

```graphql
{
  CategoryConnection(limit: 5) {
    edges {
      node {
        id
        name
        articles: ArticleConnection(
          where: { category: { eq: id } }
        ) {
          edges {
            node {
              id
              title
              author
            }
          }
          totalCount
        }
      }
    }
  }
}
```

### Recursive Queries

Query self-referencing content (e.g., category hierarchies):

```graphql
fragment CategoryNode on Category {
  id
  name
  parent: ParentCategory {
    id
    name
  }
  children: ChildCategories {
    id
    name
  }
}

query CategoryHierarchy {
  CategoryConnection(limit: 20) {
    edges {
      node {
        ...CategoryNode
        parent {
          ...CategoryNode
        }
      }
    }
  }
}
```

### Cyclic Queries

Query content with circular references:

```graphql
{
  ArticleConnection(limit: 10) {
    edges {
      node {
        id
        title
        relatedArticles: ArticleConnection(
          where: { topic: { eq: node.topic } }
          limit: 3
        ) {
          edges {
            node {
              id
              title
            }
          }
        }
      }
    }
  }
}
```

### Self-Referencing Content

Query content that references itself:

```graphql
fragment TreeNode on TreeItem {
  id
  name
  children: ChildItems {
    id
    name
    children {
      id
      name
    }
  }
}

query TreeStructure {
  RootItemConnection {
    edges {
      node {
        ...TreeNode
      }
    }
  }
}
```

### Cross-Referenced Content

Query content linked across content types:

```graphql
{
  ArticleConnection(limit: 10) {
    edges {
      node {
        id
        title
        author: AuthorConnection(
          where: { name: { eq: authorName } }
        ) {
          edges {
            node {
              id
              name
              bio
              articles: ArticleConnection {
                totalCount
              }
            }
          }
        }
      }
    }
  }
}
```

---

## Content Synchronisation

### Automatic Synchronization

Content automatically syncs from CMS to Graph when:

- Content is published
- Content is updated
- Content is moved
- Content is deleted or archived
- Content expires

**Synchronization Frequency:**
- Near real-time (typically within seconds)
- Batched for efficiency
- Respects configured grace periods

### Manual Synchronization

Trigger synchronization manually via API or admin UI:

```csharp
// In CMS 12
services.AddContentGraph(options =>
{
    // Configuration enables automatic sync
});

// For manual triggers, use:
var syncService = services.GetService<IContentGraphSyncService>();
await syncService.SyncContentAsync(contentReference);
```

### Full Sync

Complete re-index of all content:

```
POST /api/sync/full
```

Use when:
- Initializing a new Graph instance
- After schema changes
- Recovering from synchronization issues

**Duration:** Depends on content volume (minutes to hours)

### Partial Sync

Synchronize specific content types or items:

```
POST /api/sync/partial
Content: [content types or IDs to sync]
```

Use when:
- Syncing changes to specific content types
- Troubleshooting synchronization issues
- Selective content migration

### Content Type Synchronization for External Data

Sync content from external systems (e.g., Salesforce, Shopify):

```csharp
[ContentType(DisplayName = "External Product")]
public class ExternalProduct : ContentData
{
    [Display(Name = "External ID")]
    public virtual string ExternalId { get; set; }

    [Display(Name = "Name")]
    public virtual string ProductName { get; set; }

    [Display(Name = "Price")]
    public virtual decimal Price { get; set; }

    [Display(Name = "Synced Date")]
    public virtual DateTime SyncedDate { get; set; }
}

// Configure synchronization for external data
services.AddContentGraph(options =>
{
    options.Events.OnContentSynchronizing += (context) =>
    {
        // Transform external data before indexing
        if (context.Content is ExternalProduct product)
        {
            // Custom mapping logic
        }
    };
});
```

### Purging Content

Remove content from Graph:

```graphql
mutation {
  deleteContent(id: "item-id") {
    success
    message
  }
}
```

Or bulk purge:

```
DELETE /api/content/{content-type}/{id}
```

---

## Performance & Optimisation

### Query Optimization Best Practices

1. **Request only needed fields**
   ```graphql
   # Good: Only fetch needed fields
   {
     ArticleConnection(limit: 10) {
       edges {
         node {
           id
           title
         }
       }
     }
   }

   # Bad: Fetch everything
   {
     ArticleConnection(limit: 10) {
       edges {
         node {
           ... (all fields)
         }
       }
     }
   }
   ```

2. **Use filters to reduce data**
   ```graphql
   # Good: Filter before fetching
   {
     ArticleConnection(
       where: { status: { eq: "Published" } }
       limit: 10
     ) {
       edges { node { id title } }
     }
   }

   # Bad: Fetch all and filter client-side
   {
     ArticleConnection(limit: 10000) {
       edges { node { id title status } }
     }
   }
   ```

3. **Limit query depth**
   ```graphql
   # Good: Reasonable depth
   {
     ArticleConnection {
       edges {
         node {
           id
           title
           author {
             name
           }
         }
       }
     }
   }

   # Bad: Deep nesting
   {
     ArticleConnection {
       edges {
         node {
           id
           author {
             articles {
               comments {
                 author {
                   articles { ... }
                 }
               }
             }
           }
         }
       }
     }
   }
   ```

4. **Use pagination for large result sets**
   ```graphql
   {
     ArticleConnection(
       first: 20
       after: "cursor"
       orderBy: { publishedDate: DESC }
     ) {
       edges { node { id title } }
       pageInfo { endCursor hasNextPage }
     }
   }
   ```

5. **Cache query results**
   - Use HTTP caching headers
   - Cache at application level
   - Cache at CDN level

### Cached Query Templates

Pre-compile and cache frequently used query patterns:

```graphql
# template: GetFeaturedArticles
query GetFeaturedArticles($limit: Int = 10) {
  ArticleConnection(
    where: { isFeatured: { eq: true } }
    limit: $limit
    orderBy: { publishedDate: DESC }
  ) {
    edges {
      node {
        id
        title
        summary
        publishedDate
      }
    }
  }
}
```

### Batching Requests

Combine multiple queries into a single request:

```graphql
{
  articles: ArticleConnection(limit: 10) {
    edges {
      node {
        id
        title
      }
    }
  }

  categories: CategoryConnection(limit: 20) {
    edges {
      node {
        id
        name
      }
    }
  }

  authors: AuthorConnection(limit: 10) {
    edges {
      node {
        id
        name
      }
    }
  }
}
```

**Benefits:**
- Single HTTP request instead of three
- Reduced latency
- Reduced server load

### Content Filtering Strategy

```graphql
# Step 1: Filter narrow
{
  ArticleConnection(
    where: {
      _and: [
        { status: { eq: "Published" } }
        { publishedDate: { gte: "2024-01-01" } }
        { category: { in: ["Tech", "Business"] } }
      ]
    }
    orderBy: { publishedDate: DESC }
    first: 20
  ) {
    edges {
      node {
        id
        title
        summary
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
```

### Error Handling

Handle query errors gracefully:

```javascript
// Apollo Client example
const { data, loading, error } = useQuery(GET_ARTICLES);

if (error) {
  console.error('Query error:', error.message);
  // Implement retry logic, fallback UI, etc.
  return <ErrorBoundary />;
}

if (loading) return <Skeleton />;

return <ArticleList articles={data.ArticleConnection.edges} />;
```

### Recovery Strategies

1. **Retry with exponential backoff**
2. **Fallback to cached data**
3. **Graceful degradation (show partial results)**
4. **User-friendly error messages**

---

## Smooth Rebuild

### Zero-Downtime Deployment

Perform schema migrations and content updates without downtime:

```
1. Create new Graph instance (shadow instance)
2. Sync content to new instance
3. Run validations
4. Switch traffic to new instance
5. Keep old instance as fallback
```

### Data Refresh

Update content without disrupting queries:

```graphql
mutation {
  rebuildIndex(contentTypes: ["Article", "BlogPost"]) {
    success
    startedAt
    estimatedDuration
  }
}
```

### Gradual Rollout

Shift traffic gradually to new version:

```javascript
// Frontend: Route requests based on version
const graphEndpoint = userSegment === 'beta' 
  ? 'https://graph-v2.optimizely.com'
  : 'https://graph.optimizely.com';
```

---

## CMS 12 Integration

### Sending Content to Graph

Configure CMS 12 to automatically send content changes to Graph:

```csharp
services.AddContentGraph(options =>
{
    options.EnableSynchronizeMenu = true;
    options.Events.OnContentSynchronizing += async (context) =>
    {
        // Custom synchronization logic
    };
});
```

### Multilingual Content

CMS 12 globalization automatically syncs language variants:

```csharp
[ContentType(DisplayName = "Multilingual Article")]
public class Article : PageData, ILocalizable
{
    [Localizable]
    [Display(Name = "Title")]
    public virtual string Title { get; set; }

    [Localizable]
    [Display(Name = "Content")]
    public virtual XhtmlString Content { get; set; }
}
```

Query multilingual content:

```graphql
{
  ArticleConnection(locale: "sv") {
    edges {
      node {
        id
        title        # Swedish
        content      # Swedish
      }
    }
  }
}
```

### Preview Mode Integration

Enable editors to preview content in frontend applications:

```csharp
services.AddContentGraph(options =>
{
    options.Events.OnGeneratingPreviewUrl = context =>
    {
        var previewUrl = $"https://mysite.com/preview?ref={context.ContentReference}&lang={context.Language.Name}";
        context.UpdateUrl(new Uri(previewUrl));
        return Task.CompletedTask;
    };
});
```

### Custom Content Processing

Transform content before indexing:

```csharp
services.AddContentGraph(options =>
{
    options.Events.OnContentSynchronizing += async (context) =>
    {
        if (context.Content is ArticlePage article)
        {
            // Add computed fields
            article.WordCount = CountWords(article.Content);

            // Clean HTML
            article.CleanContent = SanitizeHtml(article.Content);

            // Extract summary
            article.Summary = ExtractSummary(article.Content, 150);
        }
    };
});
```

---

## SaaS CMS Integration

### Quick Start Setup

1. Create Optimizely Graph instance in cloud admin
2. Copy authentication credentials (AppKey, Secret, SingleKey)
3. Content automatically syncs on publish
4. Query via GraphQL endpoint

### Automatic Content Synchronization

Content automatically syncs when:

- Content is published
- Content is updated
- Content is deleted
- Scheduled changes take effect

**Sync Status:** Monitor in admin UI or via API

### Performance Best Practices

1. **Use SingleKey for frontend queries** (read-only access)
2. **Cache frequently accessed content**
3. **Filter queries to needed data**
4. **Use pagination for large result sets**
5. **Implement retry logic** for transient failures

### Using StrawberryShake Client

Generate a strongly-typed GraphQL client:

```bash
# Install Strawberry Shake CLI
dotnet tool install -g strawberry-shake

# Generate client
dotnet strawberry-shake client fetch-schema
dotnet strawberry-shake client generate
```

Use generated client:

```csharp
var httpClient = new HttpClient();
httpClient.DefaultRequestHeaders.Add("Authorization", "epi-single-key YOUR_KEY");

var client = new OptimizelyGraphClient(httpClient);

var result = await client.GetArticlesAsync(limit: 10);

foreach (var article in result.ArticleConnection.Edges)
{
    Console.WriteLine(article.Node.Title);
}
```

---

## Commerce Connect Integration

### Product Content

Query product information from Optimizely Commerce:

```graphql
{
  ProductConnection(limit: 20) {
    edges {
      node {
        id
        name
        description
        price
        currency
        sku
        inventory {
          quantity
          status
        }
        images {
          url
          alt
        }
        variants {
          id
          sku
          price
          size
          color
        }
      }
    }
  }
}
```

### Catalog Content

Query catalog/category structures:

```graphql
{
  CategoryConnection {
    edges {
      node {
        id
        name
        description
        products: ProductConnection {
          edges {
            node {
              id
              name
              price
            }
          }
        }
      }
    }
  }
}
```

### Product Search

Search products by keyword and filters:

```graphql
{
  ProductConnection(
    where: {
      _and: [
        { name: { match: "shoes" } }
        { price: { range: { from: 50, to: 200 } } }
        { category: { eq: "Footwear" } }
      ]
    }
    orderBy: { price: ASC }
  ) {
    edges {
      node {
        id
        name
        price
        description
      }
    }
  }
}
```

---

## Frontend Integration

### Next.js Quickstart

Fetch CMS 12 content in Next.js:

```javascript
// lib/apolloClient.js
import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';

const client = new ApolloClient({
  ssrMode: typeof window === 'undefined',
  link: new HttpLink({
    uri: 'https://cg.optimizely.com/api/graphql',
    credentials: 'same-origin',
    headers: {
      'Authorization': `epi-single-key ${process.env.NEXT_PUBLIC_OPTIMIZELY_KEY}`,
    },
  }),
  cache: new InMemoryCache(),
});

export default client;
```

Query in Next.js pages:

```javascript
// pages/articles.js
import { gql, useQuery } from '@apollo/client';
import client from '../lib/apolloClient';

const ARTICLES_QUERY = gql`
  query GetArticles($limit: Int!) {
    ArticleConnection(limit: $limit, orderBy: { publishedDate: DESC }) {
      edges {
        node {
          id
          title
          content
          publishedDate
          author
        }
      }
    }
  }
`;

function ArticlesPage() {
  const { data, loading, error } = useQuery(ARTICLES_QUERY, {
    variables: { limit: 10 },
  });

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div>
      {data.ArticleConnection.edges.map(({ node }) => (
        <article key={node.id}>
          <h2>{node.title}</h2>
          <p>{node.content}</p>
          <time>{new Date(node.publishedDate).toLocaleDateString()}</time>
        </article>
      ))}
    </div>
  );
}

export default ArticlesPage;
```

### Apollo Client Setup

```javascript
import { ApolloClient, InMemoryCache, HttpLink, ApolloProvider } from '@apollo/client';

const httpLink = new HttpLink({
  uri: 'https://cg.optimizely.com/api/graphql',
  headers: {
    Authorization: `epi-single-key ${process.env.REACT_APP_GRAPH_KEY}`,
  },
});

const client = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
});

export default function App() {
  return (
    <ApolloProvider client={client}>
      <ArticlesList />
    </ApolloProvider>
  );
}
```

### Live Preview with Next.js

Enable editors to preview content changes in real-time:

```javascript
// pages/api/preview.js
export default function handler(req, res) {
  const { ref, lang } = req.query;

  // Verify preview token
  if (req.query.token !== process.env.PREVIEW_TOKEN) {
    return res.status(401).json({ message: 'Invalid token' });
  }

  // Enable preview mode
  res.setPreviewData({
    ref,
    lang,
  });

  // Redirect to preview URL
  res.redirect(`/preview/${ref}?lang=${lang}`);
}
```

Preview page:

```javascript
// pages/preview/[ref].js
import { useRouter } from 'next/router';
import client from '../../lib/apolloClient';
import { ARTICLE_QUERY } from '../../queries';

function PreviewPage() {
  const router = useRouter();
  const { ref, lang } = router.query;

  // Include preview data in query
  const { data } = useQuery(ARTICLE_QUERY, {
    variables: { id: ref, locale: lang },
    context: {
      headers: {
        'X-Preview-Mode': 'true',
      },
    },
  });

  return <ArticleDetail article={data.Article} />;
}

export default PreviewPage;
```

### React Rendering

Render GraphQL data in React components:

```javascript
import { useQuery, gql } from '@apollo/client';

const GET_ARTICLES = gql`
  query GetArticles($category: String) {
    ArticleConnection(
      where: { category: { eq: $category } }
      limit: 20
      orderBy: { publishedDate: DESC }
    ) {
      edges {
        node {
          id
          title
          summary
          publishedDate
          author
        }
      }
    }
  }
`;

function ArticlesList({ category }) {
  const { data, loading, error } = useQuery(GET_ARTICLES, {
    variables: { category },
  });

  if (loading) return <Skeleton />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <div className="articles-grid">
      {data.ArticleConnection.edges.map(({ node }) => (
        <ArticleCard key={node.id} article={node} />
      ))}
    </div>
  );
}

export default ArticlesList;
```

---

## Query Recipes

### Recent Articles by Category

```graphql
{
  ArticleConnection(
    where: { category: { eq: "Tech" } }
    orderBy: { publishedDate: DESC }
    limit: 10
  ) {
    edges {
      node {
        id
        title
        summary
        publishedDate
        author
      }
    }
  }
}
```

### Search Products by Keyword and Price

```graphql
{
  ProductConnection(
    where: {
      _and: [
        { name: { match: "laptop" } }
        { price: { range: { from: 500, to: 2000 } } }
      ]
    }
    orderBy: { _ranking: DESC }
    limit: 20
  ) {
    edges {
      node {
        id
        name
        price
        description
        images {
          url
        }
      }
    }
  }
}
```

### Featured Content with Fallback

```graphql
{
  featured: ArticleConnection(
    where: { isFeatured: { eq: true } }
    limit: 5
  ) {
    edges {
      node {
        id
        title
      }
    }
  }

  recent: ArticleConnection(
    orderBy: { publishedDate: DESC }
    limit: 5
  ) {
    edges {
      node {
        id
        title
      }
    }
  }
}
```

### Comments on Articles

```graphql
{
  ArticleConnection(limit: 5) {
    edges {
      node {
        id
        title
        comments: CommentConnection(where: { contentId: { eq: id } }) {
          edges {
            node {
              id
              text
              author
              createdDate
            }
          }
          totalCount
        }
      }
    }
  }
}
```

### Multi-Facet Navigation

```graphql
{
  ProductConnection(
    where: {
      _and: [
        { category: { eq: "Electronics" } }
        { inStock: { eq: true } }
      ]
    }
  ) {
    facets {
      brand {
        name
        count
      }
      priceRange {
        name
        count
      }
      rating {
        name
        count
      }
    }
    edges {
      node {
        id
        name
        price
      }
    }
    totalCount
  }
}
```

---

## The _json Field

### Overview

The `_json` field allows storing and querying unstructured JSON data alongside strongly-typed fields.

### Storing JSON Data

Define a JSON field in your content type:

```csharp
[ContentType(DisplayName = "Article")]
public class ArticlePage : PageData
{
    [Display(Name = "Title")]
    public virtual string Title { get; set; }

    [Display(Name = "Custom Data")]
    [JsonField]  // Store arbitrary JSON
    public virtual string CustomMetadata { get; set; }
}
```

### Querying JSON Data

Query the `_json` field:

```graphql
{
  ArticleConnection(limit: 10) {
    edges {
      node {
        id
        title
        _json {
          customMetadata
        }
      }
    }
  }
}
```

### JSON Field Patterns

**Nested Objects:**

```json
{
  "author": {
    "name": "John Doe",
    "email": "john@example.com",
    "bio": "Content expert"
  },
  "seo": {
    "metaTitle": "Article Title",
    "metaDescription": "Description"
  }
}
```

**Arrays:**

```json
{
  "contributors": [
    { "name": "Author 1", "role": "Writer" },
    { "name": "Author 2", "role": "Editor" }
  ],
  "keywords": ["graphql", "api", "content"]
}
```

**Mixed Data:**

```json
{
  "metadata": {
    "version": 1,
    "updated": "2024-03-31",
    "status": "active"
  },
  "related": [1, 2, 3],
  "config": {
    "display": true,
    "priority": 5
  }
}
```

---

## Appendix: Complete Field Operators Reference

| Operator | Type | Description | Example |
|----------|------|-------------|---------|
| `eq` | All | Equal | `{ status: { eq: "Active" } }` |
| `neq` | All | Not equal | `{ status: { neq: "Draft" } }` |
| `lt` | Numeric/Date | Less than | `{ price: { lt: 100 } }` |
| `lte` | Numeric/Date | Less than or equal | `{ price: { lte: 100 } }` |
| `gt` | Numeric/Date | Greater than | `{ price: { gt: 50 } }` |
| `gte` | Numeric/Date | Greater than or equal | `{ price: { gte: 50 } }` |
| `in` | All | In array | `{ status: { in: ["Active", "Pending"] } }` |
| `contains` | String | String contains (case-insensitive) | `{ title: { contains: "news" } }` |
| `match` | String | Full-text search | `{ content: { match: "GraphQL" } }` |
| `exists` | All | Field exists | `{ customField: { exists: true } }` |
| `fuzzy` | String | Fuzzy matching (misspelling tolerant) | `{ title: { fuzzy: "grpahql" } }` |
| `range` | Numeric/Date | Range filter | `{ price: { range: { from: 10, to: 100 } } }` |
| `ids` | String | Filter by list of IDs | `{ ids: ["id1", "id2"] }` |

---

## Appendix: Common Configuration Properties

| Property | Context | Description | Example |
|----------|---------|-------------|---------|
| `GatewayAddress` | CMS 12 | Graph endpoint URL | `https://cg.optimizely.com` |
| `AppKey` | CMS 12 | HMAC public key | Your key |
| `Secret` | CMS 12 | HMAC secret key | Your secret |
| `SingleKey` | Both | Read-only bearer token | Your key |
| `BufferedIndexingGracePeriod` | CMS 12 | Batch delay in ms | 10000 |
| `MaxBatchSize` | CMS 12 | Batch size limit | 300 |
| `ExtractMedia` | CMS 12 | Index media file text | true |
| `PreventFieldCollision` | CMS 12 | Avoid field name conflicts | false |
| `locale` | Query | Language code | "en", "sv", "de" |
| `limit` | Query | Max items returned | 20, 100 |
| `skip` | Query | Offset for pagination | 0, 10, 20 |

---

## Appendix: GraphQL Query Template

```graphql
query GetContentWithAllOptions(
  $where: ContentWhereInput
  $orderBy: ContentOrderByInput
  $skip: Int
  $limit: Int
  $locale: String
) {
  ContentConnection(
    where: $where
    orderBy: $orderBy
    skip: $skip
    limit: $limit
    locale: $locale
  ) {
    edges {
      node {
        id
        _metadata {
          key
          locale
          types
          displayName
          url
          version
          lastModified
        }
        # Add your content-specific fields here
      }
    }
    pageInfo {
      totalCount
      hasNextPage
      hasPreviousPage
    }
  }
}
```

---

**Document Version:** 1.0
**Last Updated:** 2026-03-31
**Source:** Optimizely Graph Documentation (69 PDF files)



---

## Additional Cursor Pagination Details

### Cursor Mechanics

Cursors are stateful on the backend and expire after 10 minutes of inactivity. They preserve the result set state for efficient retrieval of large datasets.

### Cursor Query Example

```javascript
{
  StandardPageConnection(
    cursor: "FGluY2x1ZGVfY29udGV4dF91dWlkDXF1ZXJ5QW5kRmV0Y2gBFnh3Qmszbmh0UkxPeWVGVHBLcUtQVWcAAAAAAAAATRZJVkJ4eFZBdUM5dTI4R1UzVUFSOEpn"
    limit: 1
    orderBy: { _ranking: DOC }
  ) {
    items {
      Name
      Url
      RouteSegment
      Changed
    }
    cursor
  }
}
```

### Important Notes

- By default, cursor is not enabled. Enable it by providing `cursor: ""` on the first request
- For the first query with cursor enabled, `skip` is ignored
- Results are preserved (stateful) for 10 minutes, then the cursor expires
- You should sort by DOC for the fastest retrieval
- At least one content item field must be projected (queried) or you will get an error
- Only requesting `total` is insufficient as it's not a field of an item

---

## Full-Text Search Operators in Detail

### match Operator (Recommended)

The `match` operator is optimized for returning the most relevant results and applying common text-matching techniques.

**Characteristics:**
- Works on searchable string fields containing large chunks of text
- Returns more relevant results than `contains`
- Applies language stemming when combined with locale parameter
- Does not match on stop words
- Returns results in order of relevance:
  1. Exact matches (top)
  2. Phrase matches
  3. Matching words occurring close together
  4. Matching all words in different order (lowest priority)

**Example:**

```graphql
{
  ArticleConnection(
    where: { content: { match: "GraphQL optimization" } }
    orderBy: { _ranking: DESC }
  ) {
    edges {
      node {
        id
        title
        _metadata {
          score
        }
      }
    }
  }
}
```

### contains Operator

Performs phrase matching only. More limited than `match` but useful when you need exact phrase results.

**Characteristics:**
- Does word/phrase matching with support for language stemming
- Matches on terms tokenized by word boundaries (UAX #29 Unicode Text Segmentation)
- Ignores leading/trailing punctuation in terms
- More general results than `match`, but narrower than full-text search

**Example:**

```graphql
{
  ArticleConnection(
    where: { title: { contains: "React" } }
  ) {
    edges {
      node {
        id
        title
      }
    }
  }
}
```

### Configuring Searchable Fields

To enable full-text search on a field in your content type:

```csharp
[Display(Name = "Article Content")]
[Searchable]  // Enable full-text indexing
public virtual XhtmlString Content { get; set; }
```

---

## Faceted Search Details

### String and Bool Field Faceting

For string and boolean fields, faceting supports several parameters:

#### orderType Parameter

- `COUNT` (default) - Sort by facet count (descending)
- `VALUE` - Sort lexicographically (A-Z, case-sensitive where capitals come before lowercase)

#### orderBy Parameter

- `DESC` (default) - Descending order
- `ASC` - Ascending order

#### limit Parameter

- Default: 10
- Maximum: 1000
- Specifies how many distinct facet values to return

#### filters Parameter

- Apply selected facets while preserving original facet list
- Supports multi-select facets (checkboxes)
- Updated hit counts reflect filters
- Empty string `""` values are ignored

### Faceted Search with Multiple Fields

```graphql
{
  ArticleConnection(
    where: { status: { eq: "Published" } }
  ) {
    facets {
      category {
        name
        count
        orderType: COUNT
        orderBy: DESC
        limit: 10
      }
      author {
        name
        count
      }
      tags {
        name
        count
      }
    }
    edges {
      node {
        id
        title
      }
    }
  }
}
```

### Performance Optimization for Facets Only

When retrieving only facets without results, set `limit: 0` to significantly improve query performance:

```graphql
{
  ArticleConnection(
    where: { limit: 0 }
  ) {
    facets {
      category { name count }
      author { name count }
      year { name count }
    }
  }
}
```

---

## Comprehensive Field Operators Reference

### String Operators

| Operator | Description | Case-Insensitive | Example |
|----------|-------------|------------------|---------|
| `match` | Full-text search (recommended for large text) | Yes | `{ content: { match: "optimization" } }` |
| `contains` | Phrase matching with stemming | Yes | `{ title: { contains: "React" } }` |
| `eq` | Exact literal match | Yes, but capitals ranked higher | `{ status: { eq: "Active" } }` |
| `notEq` | Not equal to literal value | Yes | `{ status: { notEq: "Draft" } }` |
| `fuzzy` | Fuzzy matching (misspelling tolerant) | Yes | `{ title: { fuzzy: "grpahql" } }` |
| `exist` | Field exists (true/false) | N/A | `{ customField: { exist: true } }` |

### Numeric Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `eq` | Equal | `{ price: { eq: 99 } }` |
| `notEq` | Not equal | `{ price: { notEq: 0 } }` |
| `gt` | Greater than | `{ price: { gt: 50 } }` |
| `gte` | Greater than or equal | `{ price: { gte: 50 } }` |
| `lt` | Less than | `{ price: { lt: 200 } }` |
| `lte` | Less than or equal | `{ price: { lte: 200 } }` |
| `range` | Range between two values | `{ price: { range: { from: 50, to: 200 } } }` |

### Array Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `in` | Value in array | `{ status: { in: ["Active", "Pending"] } }` |
| `exist` | Array field has values | `{ tags: { exist: true } }` |

### Special Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `ids` | Filter by content IDs | `{ ids: ["id1", "id2", "id3"] }` |
| `range` | Numeric or date range | `{ price: { range: { from: 10, to: 100 } } }` |
| `_ranking` | Relevance score for search results | Used with `orderBy: { _ranking: DESC }` |

### Important Notes

- When `null` is used as a value with an operator, the query ignores that match. For example, `{ exist: null }` is ignored.
- For string comparisons, case-insensitive matching is supported, but case-matching results are ranked higher
- The `fuzzy` operator tolerates typos and misspellings (configurable fuzziness level)

---

## Sorting with Multiple Criteria

### Priority-Based Multi-Field Sorting

```graphql
{
  ArticleConnection(
    orderBy: {
      isFeatured: DESC      # First: Featured articles on top
      publishedDate: DESC   # Then: Most recent first
      title: ASC            # Finally: Alphabetical for same date
    }
    limit: 20
  ) {
    edges {
      node {
        id
        title
        publishedDate
        isFeatured
      }
    }
  }
}
```

### Sorting with Relevance (_ranking)

When using full-text search with the `match` operator, sort by `_ranking` for relevance:

```graphql
{
  ArticleConnection(
    where: { content: { match: "optimization" } }
    orderBy: { _ranking: DESC }
  ) {
    edges {
      node {
        id
        title
      }
    }
  }
}
```

### Special Sorting Values

- `_ranking` - Relevance score for search results (highest relevance = 1.0)
- `_doc` - Document order (fastest retrieval for large datasets)
- `_score` - Relevance score in document metadata

---

## Error Handling in Production

### Common Errors

**Cursor Timeout:**
```
Error: Cursor has expired. Please start a new query.
```
Solution: Reinitiate pagination from the beginning

**Empty Projection:**
```
Error: At least one field must be projected
```
Solution: Ensure you're requesting at least one field from content items

**Invalid Locale:**
```
Error: Locale "xx" is not supported
```
Solution: Use supported locale codes (en, sv, de, fr, etc.)

### Graceful Error Recovery

```javascript
async function queryWithRetry(query, options = {}) {
  const maxRetries = 3;
  let retryCount = 0;

  while (retryCount < maxRetries) {
    try {
      const result = await client.query(query, options);
      return result;
    } catch (error) {
      if (error.message.includes('Cursor has expired')) {
        // Reset pagination
        options.cursor = '';
        retryCount++;
      } else if (error.message.includes('timeout')) {
        // Exponential backoff
        await new Promise(r => setTimeout(r, Math.pow(2, retryCount) * 1000));
        retryCount++;
      } else {
        throw error;
      }
    }
  }

  throw new Error('Max retries exceeded');
}
```

---

## Best Practices Summary

1. **Always filter before sorting** - Reduce dataset before ordering
2. **Use cursor pagination** for large datasets (> 10,000 items)
3. **Request only needed fields** - Reduces response size and improves performance
4. **Cache query results** - Implement HTTP caching and application-level caching
5. **Use fragments** - Reduce query duplication and improve maintainability
6. **Monitor query performance** - Use APM tools to identify slow queries
7. **Batch related queries** - Combine multiple queries into one request
8. **Sort by _doc** when using cursor pagination - Fastest performance
9. **Use locale parameter** - Always specify language/locale for multilingual sites
10. **Validate user input** - Sanitize search queries to prevent injection attacks

---

## Frequently Asked Questions

### Q: What's the maximum page size I can request?

A: Depends on your Graph tier, typically 1000 items per request. For larger datasets, use cursor-based pagination.

### Q: Can I use offset pagination with very large datasets?

A: Not recommended. Use cursor-based pagination instead. Skip/limit becomes inefficient with large offsets (must skip all previous items).

### Q: How do I handle content that doesn't have a translation in my requested locale?

A: Use the fallback language feature. Graph will return content in the fallback language (default: English) if not available in the requested locale.

### Q: Can I search across multiple fields with different operators?

A: Yes, use the `_and` operator to combine different field searches with different operators.

### Q: What's the difference between match and contains operators?

A: `match` is optimized for relevance and works better for discovery searches. `contains` does phrase matching only and is more literal.

### Q: How often does content sync from CMS to Graph?

A: Near real-time, typically within seconds. Uses batching with configurable grace periods.

### Q: Can I query content from multiple content types in a single request?

A: Yes, use multiple queries (with aliases) in a single GraphQL request.

### Q: How long are cursor pagination states preserved?

A: 10 minutes per request. Make sure to fetch the next batch before the cursor expires.



---

## Real-World Implementation Patterns

### Pattern 1: Search Results Page with Faceted Navigation

```graphql
query SearchArticles($searchTerm: String!, $filters: [String!], $page: Int = 1) {
  articleSearch: ArticleConnection(
    where: {
      _and: [
        { content: { match: $searchTerm } }
        { status: { eq: "Published" } }
        { category: { in: $filters } }
      ]
    }
    orderBy: { _ranking: DESC }
    skip: $page * 20
    limit: 20
  ) {
    edges {
      node {
        id
        title
        summary
        publishedDate
        author
        category
      }
    }
    pageInfo {
      totalCount
      hasNextPage
    }
    facets {
      category {
        name
        count
        orderType: COUNT
      }
      author {
        name
        count
      }
      publishedYear: publishedDate {
        name
        count
      }
    }
  }
}
```

### Pattern 2: Large Dataset Pagination with Cursor

```javascript
async function* paginateLargeDataset(contentType, batchSize = 100) {
  let cursor = '';
  
  while (true) {
    const response = await client.query({
      query: gql`
        query GetBatch($cursor: String) {
          ${contentType}Connection(
            cursor: $cursor
            limit: ${batchSize}
            orderBy: { _ranking: DOC }
          ) {
            items {
              id
              title
            }
            cursor
          }
        }
      `,
      variables: { cursor }
    });

    const batch = response.data[`${contentType}Connection`];
    
    if (!batch.items || batch.items.length === 0) {
      break;
    }

    yield batch.items;
    cursor = batch.cursor;
  }
}

// Usage
for await (const batch of paginateLargeDataset('Article', 100)) {
  console.log(`Processing ${batch.length} items`);
  // Process batch
}
```

### Pattern 3: Multilingual Site with Fallback

```graphql
query GetLocalizedContent($slug: String!, $locale: String!, $fallbackLocale: String = "en") {
  article: ArticleConnection(
    where: { slug: { eq: $slug } }
    locale: $locale
  ) {
    edges {
      node {
        id
        title
        content
        _metadata {
          locale
          url
        }
      }
    }
  }
  
  fallback: ArticleConnection(
    where: { slug: { eq: $slug } }
    locale: $fallbackLocale
  ) {
    edges {
      node {
        id
        title
        content
      }
    }
  }
}
```

**Use this pattern:**
- Check if `article` has results in the requested locale
- If empty, use `fallback` in the fallback locale
- Ensure locale switcher shows available languages

### Pattern 4: Related Content Discovery

```graphql
query GetArticleWithRelated($articleId: ID!, $locale: String = "en") {
  article: Article(id: $articleId, locale: $locale) {
    id
    title
    content
    category
    tags
    _metadata {
      url
    }
  }

  relatedByCategory: ArticleConnection(
    where: {
      _and: [
        { category: { eq: $article.category } }
        { id: { neq: $articleId } }
        { status: { eq: "Published" } }
      ]
    }
    orderBy: { publishedDate: DESC }
    limit: 5
    locale: $locale
  ) {
    edges {
      node {
        id
        title
        publishedDate
      }
    }
  }

  relatedByTags: ArticleConnection(
    where: {
      _and: [
        { tags: { match: $article.tags } }
        { id: { neq: $articleId } }
        { status: { eq: "Published" } }
      ]
    }
    orderBy: { _ranking: DESC }
    limit: 5
    locale: $locale
  ) {
    edges {
      node {
        id
        title
      }
    }
  }
}
```

### Pattern 5: E-Commerce Product Listing with Filters

```graphql
query GetFilteredProducts(
  $minPrice: Float = 0
  $maxPrice: Float = 10000
  $categories: [String!] = []
  $inStock: Boolean = true
) {
  products: ProductConnection(
    where: {
      _and: [
        { price: { range: { from: $minPrice, to: $maxPrice } } }
        { category: { in: $categories } }
        { status: { eq: "Published" } }
        { inventory: { status: { eq: $inStock } } }
      ]
    }
    orderBy: { popularity: DESC }
    limit: 50
  ) {
    edges {
      node {
        id
        name
        price
        currency
        image {
          url
          alt
        }
        variants {
          id
          sku
          size
          color
        }
      }
    }
    facets {
      category {
        name
        count
      }
      brand {
        name
        count
      }
      priceRange {
        name
        count
      }
      color {
        name
        count
      }
    }
    totalCount
  }
}
```

### Pattern 6: Content Sync Monitoring

```javascript
// Monitor content sync status
async function checkSyncStatus(contentType) {
  const response = await fetch('https://cg.optimizely.com/api/sync/status', {
    headers: {
      'Authorization': `epi-single-key ${GRAPH_KEY}`,
    }
  });

  const status = await response.json();
  
  return {
    contentType,
    lastSync: status.lastSync,
    itemsProcessed: status.itemsProcessed,
    pending: status.pending,
    errors: status.errors
  };
}
```

---

## Testing Checklist for Graph Queries

Before deploying queries to production:

- [ ] Test with empty results (handles gracefully)
- [ ] Test with large datasets (pagination works)
- [ ] Test with special characters in search queries
- [ ] Test with missing/null fields (doesn't error)
- [ ] Test locale fallback behavior
- [ ] Test search relevance (results make sense)
- [ ] Verify cursor expiration handling (retry logic)
- [ ] Check query performance (response time < 1s)
- [ ] Validate error messages are user-friendly
- [ ] Test with multiple concurrent users
- [ ] Verify caching works correctly
- [ ] Test on slower networks (timeouts handled)

---

## Index of Key Files from Documentation

The reference document synthesizes information from 69 PDF files organized as follows:

**Root-Level Documentation (CMS 12 Integration):**
- Overview of Optimizely Graph
- Configure CMS 12 to send content
- Connect CMS 12 to Optimizely Graph
- Explore CMS 12 Content and Schema
- Live preview with Next.js
- Next.js Quickstart with Apollo Client
- Performance optimization & batching
- Best practices & troubleshooting
- Automatic and manual sync
- Commerce Connect integration

**GraphQL Basics (48 files covering query fundamentals):**
- Arguments and field operators
- Pagination (skip/limit and cursor-based)
- Sorting and filtering
- Full-text, semantic, faceted, fuzzy, and geo search
- Fragments and aliases
- Advanced query patterns
- Multilingual content
- Content variations
- Error handling and recovery

**SaaS CMS Documentation (6 files):**
- Quick start guides
- StrawberryShake client generation
- Performance best practices
- Automatic content sync

**Synchronization Details (3 files):**
- Full and partial sync
- Custom content type sync
- Purge operations

---

## Optimizely Graph API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `https://cg.optimizely.com/api/graphql` | POST | GraphQL queries and mutations |
| `https://cg.optimizely.com/api/sync/status` | GET | Check synchronization status |
| `https://cg.optimizely.com/api/sync/full` | POST | Trigger full re-index |
| `https://cg.optimizely.com/api/sync/partial` | POST | Trigger partial sync |

---

## Authentication Methods

### Bearer Token (Frontend)
```
Authorization: epi-single-key YOUR_KEY
```
Used for: Frontend applications, read-only access

### HMAC Authentication (Server-to-Server)
```
HMAC-SHA256 signature with AppKey and Secret
```
Used for: CMS integration, content synchronization, secure server calls

### Query Parameter
```
?auth=YOUR_SINGLE_KEY
```
Used for: Simple integrations, WebSockets

---

**Last Updated:** 2026-03-31
**Total Sections:** 50+
**Total GraphQL Examples:** 100+
**Coverage:** 69 PDF documentation files
**Maintained by:** Optimizely Technical Documentation

