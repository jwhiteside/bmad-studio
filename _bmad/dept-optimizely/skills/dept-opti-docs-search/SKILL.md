---
canonicalId: dept-opti-docs-search
name: "Optimizely Documentation Search"
description: "Expert guidance for searching and navigating official Optimizely documentation including structure overview, quick reference links, and strategies for finding information across CMS 12, SaaS CMS, Content Graph, Commerce, DXP Cloud, CMP, and Opal AI products."
domain: optimizely
category: reference
---

# Optimizely Documentation Search Skill

Expert guidance for finding and effectively using official Optimizely documentation across all product areas.

## Official Documentation Home

**Primary Resource**: `docs.developers.optimizely.com`

This is the single authoritative source for all Optimizely platform documentation. The site is organized into product-specific sections with progressive disclosure (overview → detailed guides → API reference).

## Documentation Structure

### CMS 12 Documentation
**Location**: `docs.developers.optimizely.com/cms-12`

Content areas:
- **Getting Started** - Installation, basic concepts, first content type
- **Content Model** - PageData, BlockData, MediaData, inheritance patterns
- **Content Composition** - ContentArea, AllowedTypes, layout hints
- **Personalization** - Visitor groups, segmentation, criteria
- **Publishing and Scheduling** - Workflows, publish hooks, scheduled jobs
- **Web Forms** - Form builder, form handlers, data collection
- **Commerce Integration** - Catalog, pricing, orders
- **Extensibility** - Modules, event handlers, DI (ServiceLocator, ASP.NET Core DI)
- **Deployment** - IIS, Azure App Service, Docker

### SaaS CMS Documentation
**Location**: `docs.developers.optimizely.com/cms-saas`

Content areas:
- **Visual Builder** - Experience/Section/Element hierarchy, composition
- **Content Types** - Field types, validation, localization
- **Content Graph** - GraphQL queries, API endpoints, authentication
- **Display Templates** - Channel support (web, mobile), template design
- **Styles System** - Style definitions, properties, theming
- **Blueprints** - Creating blueprints, template reuse
- **REST API** - Content CRUD operations, batch operations
- **Publishing Workflow** - Version management, scheduling, approvals

### Content Graph Documentation
**Location**: `docs.developers.optimizely.com/content-graph`

Content areas:
- **Query Language** - GraphQL syntax, query structure
- **Authentication** - HMAC signatures, SingleKey, bearer tokens
- **Filtering** - Where clauses, operators, complex conditions
- **Sorting and Pagination** - OrderBy, cursor-based pagination
- **Search Capabilities** - Semantic, fuzzy, geo, faceted search
- **Caching** - Query templates, cache invalidation, performance
- **Webhooks** - Content change events, subscription patterns
- **SDK and Libraries** - Client libraries for various languages

### Optimizely Commerce Documentation
**Location**: `docs.developers.optimizely.com/commerce`

Content areas:
- **Catalog Management** - Products, variants, associations
- **Pricing** - Price lists, customer pricing, promotions
- **Inventory** - Stock tracking, warehouse management
- **Orders and Fulfillment** - Order creation, pipeline, fulfillment
- **Payments** - Payment gateway integration, security
- **B2B Features** - Organizations, budgets, approval workflows

### DXP Cloud Documentation
**Location**: `docs.developers.optimizely.com/dxp-cloud`

Content areas:
- **Getting Started** - Account setup, first deployment
- **Environments** - Dev/staging/production configuration
- **Deployment** - Deployment API, CI/CD integration, rollback
- **Monitoring** - Logs, metrics, alerts
- **Database Management** - Backup, restore, maintenance
- **Scaling** - Auto-scaling configuration, performance tuning

### CMP (Campaign Management Platform) Documentation
**Location**: `docs.developers.optimizely.com/cmp`

Content areas:
- **Campaign Creation** - Planning, scheduling, asset management
- **Publishing Workflow** - Editorial calendars, task management
- **Integrations** - CMS integration, analytics, email
- **API Reference** - Campaign CRUD, publishing, analytics

### Opal AI Documentation
**Location**: `docs.developers.optimizely.com/opal-ai`

Content areas:
- **Agent Framework** - Agent types, architecture, routing
- **Tool Development** - Creating custom tools, tool patterns
- **Instructions** - System prompts, few-shot examples, constraints
- **Agent Directory** - Registration, discovery, versioning
- **RAG Integration** - Document indexing, retrieval strategies
- **Evaluation** - Testing agents, metrics, benchmarking
- **SDK and Libraries** - Agent SDKs for different languages
- **Workflows** - Multi-agent orchestration, state management

## How to Search Effectively

### Search Strategy

1. **Start Broad**: Search for product area (e.g., "Visual Builder", "Content Graph")
2. **Identify Section**: Navigate to relevant documentation section
3. **Use Table of Contents**: Most pages have hierarchical TOC for navigation
4. **Search Within Page**: Use browser Ctrl+F to find specific terms
5. **Check Related Links**: Documentation pages often link to related topics

### Common Search Patterns

**"How do I create a content type in SaaS CMS?"**
- Navigate to: SaaS CMS → Content Types → Create a Content Type
- Look for: Field types, validation, localization examples

**"What's the GraphQL syntax for filtering?"**
- Navigate to: Content Graph → Query Language → Filtering
- Look for: Where clause examples, operators, nested conditions

**"How do I authenticate with Content Graph?"**
- Navigate to: Content Graph → Authentication
- Look for: HMAC vs SingleKey comparison, code examples

**"How do I set up CI/CD for DXP Cloud?"**
- Navigate to: DXP Cloud → Deployment → CI/CD Integration
- Look for: Azure DevOps templates, GitHub Actions examples

**"What's the order pipeline in Commerce?"**
- Navigate to: Commerce → Orders and Fulfillment → Order Pipeline
- Look for: Pipeline stages, hooks, customization points

### Quick Reference Links

**Architecture and Concepts**:
- CMS 12 Content Model: `/cms-12/content-model`
- SaaS CMS Hierarchy: `/cms-saas/visual-builder`
- Content Graph Overview: `/content-graph/overview`

**API Reference**:
- Content Graph GraphQL: `/content-graph/api/graphql`
- SaaS CMS REST API: `/cms-saas/api/rest`
- Commerce API: `/commerce/api/reference`
- DXP Cloud Deployment API: `/dxp-cloud/api/deployment`

**Code Examples**:
- C# SDKs: Search for "C#" or ".NET" in relevant section
- JavaScript/Node: Search for "JavaScript" or "Node.js"
- Python: Search for "Python" in relevant section
- GraphQL Examples: `/content-graph/examples`

**Troubleshooting**:
- Each product section has a "Troubleshooting" or "Common Issues" page
- Search your error message in the documentation site search

## Documentation Features

### Code Examples

Most documentation includes code snippets in:
- C# (for .NET developers)
- JavaScript/TypeScript (for frontend)
- GraphQL (for Content Graph queries)
- YAML (for configuration)
- Bash/PowerShell (for CLI and deployment)

Example code is often:
- Copy-paste ready
- Commented with explanations
- Available in multiple language variants
- Updated with latest API versions

### Diagrams and Visuals

Documentation includes:
- Architecture diagrams (text and/or images)
- Flow diagrams (publishing, order pipeline)
- Feature comparison matrices
- Data model relationships
- UI screenshots

### Versioning

Documentation is versioned by:
- **Product Major Version** (CMS 12, SaaS CMS)
- **API Version** (sometimes - check headers)
- **Last Updated Date** (shown on most pages)

Always check the version dropdown if your issue doesn't match documentation.

### API Reference

Official API references include:
- **Endpoint Definitions**: URL, method, headers required
- **Parameter Documentation**: Required vs. optional, types, validation
- **Response Schemas**: Fields returned, data types, examples
- **Error Codes**: Status codes, error messages, resolution steps
- **Rate Limits**: Calls per minute, concurrent request limits

## Key Documentation Areas by Use Case

### For Content Authors
- SaaS CMS → Visual Builder
- SaaS CMS → Publishing Workflow
- CMP → Campaign Management

### For Frontend Developers
- Content Graph → Query Language and Examples
- SaaS CMS → Display Templates
- Content Graph → SDKs and Libraries

### For Backend Developers
- CMS 12 → Content Model and Extensibility
- Commerce → Catalog and Orders
- Opal AI → Tool Development
- DXP Cloud → Deployment and Scaling

### For DevOps/Infrastructure
- DXP Cloud → All sections
- DXP Cloud → CI/CD Integration
- DXP Cloud → Monitoring

### For Architects
- CMS 12 → Architecture Overview
- SaaS CMS → Architecture Overview
- Content Graph → Architecture and Caching
- Migration Patterns (cross-product)

## Official Support Resources

**Beyond Documentation**:
- **Support Portal**: `support.optimizely.com` (for tickets)
- **Community Forum**: `forum.developers.optimizely.com` (peer support)
- **Release Notes**: `docs.developers.optimizely.com/releases` (new features, breaking changes)
- **Sample Projects**: GitHub `optimizely` organization (code examples)
- **Blog**: `blog.optimizely.com` (product updates, case studies)

## Documentation Best Practices

### When Using Documentation

1. **Always Check Version**: Verify the docs match your product version
2. **Read the Overview First**: Start with concept explanations before diving into API details
3. **Review Examples**: Always look for code examples matching your use case
4. **Check Related Topics**: Follow links to dependent/related topics
5. **Search Across Sections**: Some concepts appear in multiple product areas

### When Documentation is Unclear

1. **Check Examples**: Code examples often clarify ambiguous documentation
2. **Review Release Notes**: New features may have updated documentation
3. **Post on Community Forum**: `forum.developers.optimizely.com` (often answered by Optimizely team)
4. **Create Support Ticket**: `support.optimizely.com` for urgent issues
5. **Check GitHub Issues**: Official samples repos often have discussed issues

## Common Documentation Pain Points and Solutions

### "I can't find the information I need"
- Try searching for the concept rather than the specific feature
- Check multiple product sections (feature may be cross-product)
- Look for related features that might have similar documentation

### "The example doesn't match my use case"
- Review all code examples (not just the first one)
- Check the comments in code for variations
- Post on community forum with your specific scenario

### "Documentation says X but API behaves differently"
- Check the release notes (API behavior may have changed)
- Verify your product version matches documentation
- Check for known issues in community forum
- Create a support ticket with API response details

### "How do I do [advanced pattern]?"
- Search for the pattern name + "Optimizely" in documentation
- Check GitHub sample projects for implementation patterns
- Review community forum for similar questions
- Post question with your architecture context

## Integration Points in Documentation

Key sections where product documentation intersects:

**CMS ↔ Content Graph**: How to query CMS content via GraphQL
**CMS ↔ Commerce**: How CMS displays commerce content
**CMS ↔ CMP**: Campaign content published to CMS
**Commerce ↔ Opal AI**: AI agents managing product catalog
**All Products ↔ DXP Cloud**: Deployment and operations for all products

## Documentation Navigation Tips

### Breadcrumb Navigation
Most pages show breadcrumb path at top:
`Docs > CMS 12 > Content Model > PageData`

Breadcrumbs are clickable for quick navigation.

### Table of Contents
Most pages have left sidebar TOC showing:
- Main sections (bold)
- Subsections (indented)
- Clickable links to jump within page

### Search Box
Top-level search box searches entire documentation:
- Use specific keywords (e.g., "HMAC authentication")
- Try product names combined with features
- Search error messages for troubleshooting

### "Was this page helpful?"
Most pages have feedback section at bottom:
- Indicates documentation quality
- Allows you to report issues directly to Optimizely

---

**Last Updated**: 2024
**Optimizely Docs URL**: https://docs.developers.optimizely.com
