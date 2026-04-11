# Optimizely Graph Documentation - Index

This directory contains a comprehensive, LLM-friendly reference guide for Optimizely Graph.

## Files

### graph-reference.md (Primary Reference)
The main comprehensive reference document synthesizing all 69 Optimizely Graph documentation PDFs.

**Size:** 69KB, 3,564 lines
**Sections:** 41 major sections + 142 subsections
**Content:**
- Complete GraphQL schema documentation
- All field operators with examples
- Pagination strategies (skip/limit and cursor-based)
- Search capabilities (full-text, semantic, faceted, fuzzy, geo)
- Multilingual content handling
- Integration guides (CMS 12, SaaS CMS, Commerce Connect)
- Real-world implementation patterns
- 122 code examples
- 100+ tables with reference data
- FAQ and troubleshooting

## How to Use This Reference

### For AI Agents
1. Load the entire `graph-reference.md` file into context
2. Search for specific topics using Ctrl+F
3. Reference section numbers for precise information
4. Use "Query Recipes" section for common patterns
5. Check "Real-World Implementation Patterns" for production-ready code

### For Developers
1. Start with "Overview" and "Setup & Configuration"
2. Review "GraphQL Schema" to understand your content structure
3. Use "Field Operators Reference" as a lookup table
4. Reference "Query Recipes" for common use cases
5. Check "Best Practices Summary" before implementing

### For DevOps/Integration Teams
1. See "CMS 12 Integration" for on-premises setup
2. See "SaaS CMS Integration" for cloud setup
3. Review "Content Synchronisation" for sync configuration
4. Check "Smooth Rebuild" for deployment procedures

## Quick Navigation

| Need | Section |
|------|---------|
| Set up CMS 12 | [Setup & Configuration](#setup--configuration) |
| Understand schema | [GraphQL Schema](#graphql-schema) |
| Write basic query | [Querying Fundamentals](#querying-fundamentals) |
| Filter results | [Filtering](#filtering) |
| Sort results | [Sorting](#sorting) |
| Handle large datasets | [Pagination](#pagination) |
| Search by text | [Full-Text Search](#full-text-search) |
| Search by meaning | [Semantic Search](#semantic-search) |
| Filter by category | [Faceted Search](#faceted-search) |
| Handle typos | [Fuzzy Search](#fuzzy-search) |
| Filter by location | [Geo Search](#geo-search) |
| Multi-language site | [Localisation](#localisation) |
| A/B testing | [Content Variations](#content-variations) |
| Reuse query parts | [Fragments & Aliases](#fragments--aliases) |
| Complex queries | [Advanced Query Patterns](#advanced-query-patterns) |
| Sync content | [Content Synchronisation](#content-synchronisation) |
| Improve performance | [Performance & Optimisation](#performance--optimisation) |
| Deploy safely | [Smooth Rebuild](#smooth-rebuild) |
| Integrate with CMS 12 | [CMS 12 Integration](#cms-12-integration) |
| Integrate with SaaS | [SaaS CMS Integration](#saas-cms-integration) |
| Sell products | [Commerce Connect Integration](#commerce-connect-integration) |
| Build frontend | [Frontend Integration](#frontend-integration) |
| Example queries | [Query Recipes](#query-recipes) |
| Store custom data | [The _json Field](#the-_json-field) |
| Find all operators | [Appendix](#appendix-complete-field-operators-reference) |

## Document Origins

This reference synthesizes information from **69 PDF files** across multiple categories:

### Root-Level Documentation (CMS 12 Integration)
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
- Advanced features (multilingual, preview, custom processing)

### GraphQL Basics (48 files)
Comprehensive coverage of:
- Arguments and field operators (20+ operators documented)
- Pagination (skip/limit and cursor-based)
- Sorting (orderBy parameter)
- Filtering (where parameter and logical operators)
- Full-text search (match and contains)
- Semantic search (AI-powered matching)
- Faceted search (aggregation and navigation)
- Fuzzy search (typo tolerant)
- Geo search (location-based filtering)
- Fragments and aliases
- Advanced query patterns
- Multilingual content (CMS 12 and SaaS)
- Content variations (A/B testing, personalization, localization)
- Error handling and recovery strategies

### SaaS CMS Documentation (6 files)
- Quick start setup
- StrawberryShake client generation
- Performance best practices
- Automatic content synchronization
- Optimizely Graph configuration
- React/Next.js integration

### Synchronization Details (3 files)
- Full and partial synchronization
- Custom content type synchronization
- Content purging and cleanup

## Key Features Documented

### Search Capabilities
- Full-text search with relevance ranking
- Semantic search with AI embeddings
- Faceted search for navigation
- Fuzzy search for typo tolerance
- Geo-location filtering and ranking

### Pagination
- Skip/limit (offset-based) pagination
- Cursor-based pagination for large datasets
- Pagination info (hasNextPage, totalCount)
- Cursor state preservation (10 minutes)

### Content Management
- Automatic content synchronization from CMS
- Manual sync options
- Full and partial rebuilds
- Zero-downtime deployment
- Fallback language support

### Multilingual Support
- Per-locale queries
- Language routing
- Fallback language handling
- Language-aware search
- CMS globalization integration

### Integration Options
- CMS 12 (on-premises)
- SaaS CMS (cloud)
- Commerce Connect (e-commerce)
- Custom content sources
- Next.js/React frontend

## Authentication

### Frontend Queries
```
Authorization: epi-single-key YOUR_KEY
```

### Server-to-Server
```
HMAC-SHA256 with AppKey/Secret
```

## Common Patterns

### Search Results Page
See "Real-World Implementation Patterns" → "Pattern 1: Search Results Page with Faceted Navigation"

### Large Dataset Pagination
See "Real-World Implementation Patterns" → "Pattern 2: Large Dataset Pagination with Cursor"

### Multilingual Fallback
See "Real-World Implementation Patterns" → "Pattern 3: Multilingual Site with Fallback"

### Related Content
See "Real-World Implementation Patterns" → "Pattern 4: Related Content Discovery"

### E-Commerce
See "Real-World Implementation Patterns" → "Pattern 5: E-Commerce Product Listing with Filters"

## Performance Tips

1. **Always filter before sorting** - Reduces dataset size first
2. **Use cursor pagination** for datasets > 10,000 items
3. **Request only needed fields** - Reduces response size
4. **Cache query results** - Implement HTTP caching
5. **Use fragments** - Reduce query duplication
6. **Batch related queries** - Single HTTP request for multiple queries
7. **Sort by _doc when paginating** - Fastest performance
8. **Use locale parameter** - Always specify language
9. **Validate input** - Prevent injection attacks

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Cursor expired | Reinitiate pagination |
| No results | Check filter operators |
| Slow query | Add filters, reduce fields, use pagination |
| Wrong language | Specify locale parameter |
| Missing translation | Use fallback locale |
| Field not found | Check schema in admin UI |
| Authentication error | Verify key is correct |

## Version Information

- **Document Version:** 1.0
- **Created:** 2026-03-31
- **Updated:** 2026-03-31
- **Coverage:** All available Optimizely Graph documentation (69 PDFs)
- **Target:** AI agents and developers implementing Optimizely Graph

## Additional Resources

- **Optimizely Developer Portal:** https://docs.developers.optimizely.com
- **GraphQL Specification:** https://graphql.org
- **Apollo Client:** https://www.apollographql.com/docs/react/
- **StrawberryShake:** https://chillicream.com/docs/strawberry-shake

---

**This is an LLM-friendly, comprehensive reference document designed for AI agents to write correct Optimizely Graph queries and integration code.**
