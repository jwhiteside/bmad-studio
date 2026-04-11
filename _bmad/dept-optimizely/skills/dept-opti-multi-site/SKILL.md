---
canonicalId: dept-opti-multi-site
name: "Optimizely Multi-Site and Multi-Language Architecture"
description: "Comprehensive patterns for managing multiple sites and languages in Optimizely including site definitions, content organisation, translation workflows, regional governance, multi-brand architecture, and multi-market deployment strategies."
domain: optimizely
category: architecture
---

# Optimizely Multi-Site and Multi-Language Architecture

## Overview

Managing multiple sites and languages in Optimizely requires careful architectural planning. This skill covers patterns for organizing content, managing relationships between sites, handling multiple languages, supporting multi-brand deployments, and scaling across markets while maintaining operational efficiency.

## CMS 12 Multi-Site Architecture

### Site Definitions and Configuration

Configure multiple sites in CMS 12:

**Site Configuration Structure**
- Define site identifier: unique site name (typically domain-based)
- Configure site settings: culture, publishing settings, home page
- Create administrative role assignment: site-specific content administrators
- Implement site-specific properties: per-site configurations

**Site Configuration Implementation**
```xml
<sites>
  <site name="us-english"
        siteUrl="https://example.com"
        httpPort="80"
        httpsPort="443"
        culture="en-US">
    <bindings>
      <binding protocol="https" hostName="example.com" />
      <binding protocol="https" hostName="www.example.com" />
    </bindings>
  </site>
  <site name="eu-english"
        siteUrl="https://eu.example.com"
        httpPort="80"
        httpsPort="443"
        culture="en-GB">
    <bindings>
      <binding protocol="https" hostName="eu.example.com" />
    </bindings>
  </site>
</sites>
```

**Default Site Handling**
- Define default site: used when URL doesn't match other bindings
- Implement fallback logic: 404 handling for unmapped URLs
- Create redirect rules: invalid URLs redirect to appropriate site
- Implement root URL handling: domain root behavior

### Domain Mapping

Map domains to sites:

**Single Domain to Multiple Sites**
- Implement path-based routing: /us/, /eu/, /fr/ for different sites
- Design site selection: CMS resolves site based on URL path
- Create redirect strategy: old domain structure maintained via redirects
- Implement URL canonicalization: preferred domain/path structure

**Multiple Domains to Single Site**
- Implement multi-domain binding: single site responds to multiple domains
- Design primary domain: one domain as canonical
- Create domain aliases: additional domains redirect to primary
- Implement locale detection: infer locale from domain

**Subdomain-Based Routing**
- Implement subdomain sites: us.example.com, eu.example.com
- Design wildcard bindings: *.example.com routing
- Create DNS configuration: proper DNS records for subdomains
- Implement TLS certificates: wildcard or SAN certificates

### Shared vs. Site-Specific Content

Design content ownership model:

**Shared Content**
- Definition: content visible across all sites (corporate content, global policies)
- Management: centralized content ownership, single publication workflow
- Publishing: publish once, automatically visible on all sites
- Updates: single update point, consistent across sites
- Examples: corporate policies, brand guidelines, global news

**Site-Specific Content**
- Definition: content unique to specific site (regional products, local news)
- Management: site-specific content ownership, independent workflows
- Publishing: per-site publication workflows, independent schedules
- Updates: independent updates, no impact on other sites
- Examples: regional products, local events, market-specific promotions

**Hybrid Content (Shared Template + Site-Specific Data)**
- Definition: content template shared, data differs by site
- Management: template centrally managed, data per-site
- Publishing: template update affects all sites, data independently managed
- Examples: product detail page template with site-specific pricing

**Organizing Shared Content**
```
Content
├── Shared
│   ├── Corporate
│   │   ├── Company Information
│   │   ├── Privacy Policy
│   │   └── Terms of Service
│   └── Global Resources
│       ├── Brand Guidelines
│       └── Global Campaigns
├── Site-US
│   ├── Products (US-specific catalog)
│   ├── Events (US events)
│   └── News (US news)
└── Site-EU
    ├── Products (EU-specific catalog)
    ├── Events (EU events)
    └── News (EU news)
```

### Content Trees

Design content hierarchy:

**Single Tree Multiple Sites**
- Implement shared root content tree: common content for all sites
- Design site-specific branches: site-specific content in dedicated areas
- Create navigation management: site-specific navigation references
- Implement publication control: control which content visible to which sites

**Multiple Content Trees**
- Implement per-site content trees: independent content hierarchies
- Design shared content references: link to shared content as needed
- Create navigation simplicity: navigation specific to each site
- Implement management isolation: site teams manage own content

**Content Migration Between Trees**
- Implement move operations: move content between trees
- Design relationship maintenance: preserve content relationships
- Create publication handling: update publication state on move
- Implement validation: ensure content compatible with destination tree

**Page Type Configuration by Site**
- Implement page type availability: control which page types per site
- Design page type inheritance: shared page types across sites
- Create page type customization: site-specific page type properties
- Implement access control: restrict page type usage by site

## SaaS CMS Multi-Site Architecture

### Content Type Reuse

Design content types for multi-site scenarios:

**Shared Content Type Definitions**
- Define content types: reusable across sites
- Configure properties: shared properties across sites
- Create default values: reasonable defaults for all sites
- Implement validation: rules appropriate for all sites

**Site-Specific Content Type Extensions**
- Implement property groups: optional site-specific properties
- Design conditional visibility: show properties only for specific sites
- Create site-specific validation: additional rules for specific sites
- Implement property inheritance: extend base properties

**Composition Pattern for Flexibility**
- Implement component-based types: build from reusable components
- Design content blocks: composable content structures
- Create layout flexibility: different layouts per site
- Implement responsive content: single content, multiple presentations

### Language-Specific Properties

Handle multi-language in SaaS CMS:

**Language as Property**
- Define language property: content indicates language
- Implement locale detection: CMS detects content language
- Create language metadata: language information in Content Graph
- Implement language filtering: query content by language

**Locale-Specific Properties**
- Implement locale variants: content property values by locale
- Design locale fallback: use fallback locale if translation unavailable
- Create translation status: track which locales translated
- Implement locale selection: content manager selects locale

**Language-Specific Metadata**
```yaml
content:
  id: product-123
  name:
    en: "Premium Widget"
    es: "Widget Premium"
    fr: "Widget Premium"
  description:
    en: "High-quality widget for professional use"
    es: "Widget de alta calidad para uso profesional"
    fr: "Widget de haute qualité pour usage professionnel"
  locale: "en"
  available_locales: ["en", "es", "fr"]
```

**Locale Handling in Content Graph**
- Implement locale parameters: filter by locale in queries
- Design language fallback: graceful fallback for missing languages
- Create language list: available languages per content
- Implement language selector: client-side language selection

## Language Management

### Master Language Strategy

Establish single source of truth:

**Master Language Selection**
- Define master language: typically English or corporate language
- Implement authoring process: create content in master language first
- Design publication workflow: approve master before translation
- Create language status: distinguish master from translations

**Master Language Governance**
- Implement quality gates: master language review before translation release
- Design master modification: update master, trigger re-translation
- Create translation triggers: master publication initiates translation
- Implement translation scheduling: coordinate translation with content release

### Fallback Chains

Design graceful language degradation:

**Fallback Chain Examples**
```
French-Canadian → French → English
German-Swiss → German → English
Portuguese-Brazil → Portuguese → English
```

**Fallback Implementation**
- Define explicit fallback: specify fallback language per language
- Implement implicit fallback: language hierarchy for unmapped languages
- Design fallback indicators: show users when viewing fallback language
- Create fallback reporting: track fallback usage, identify gaps

**Smart Fallback**
- Implement regional fallback: regional variants fall back to language
- Design parent language fallback: variant falls back to language, language to English
- Create fallback configuration: flexible fallback rules
- Implement fallback caching: cache fallback decisions for performance

### Translation Workflows

Manage translation processes:

**Translation Request Process**
- Implementation workflow:
  1. Content author completes content in master language
  2. Content approved for translation
  3. Translation request batch created
  4. Translation service receives request
  5. Translator completes translation
  6. Reviewer validates translation
  7. Translation published to CMS

**Translation Service Integration**
- Implement service API integration: Smartcat, Wordfast, or custom
- Design field selection: which fields translatable
- Create terminology database: consistent translations
- Implement quality assurance: automated QA checks

**Translation Metrics**
- Track translation velocity: how quickly content translated
- Measure translation backlog: untranslated content volume
- Monitor quality: translation accuracy and consistency
- Implement SLA tracking: translation completion timelines

### Regional Content Ownership

Organize teams by region:

**Regional Team Structure**
```
Global Content Team
├── US Regional Team
│   ├── English content ownership
│   ├── Spanish content approval
│   └── Local event management
├── EU Regional Team
│   ├── English content ownership
│   ├── French content approval
│   ├── German content approval
│   └── Local event management
└── APAC Regional Team
    ├── English content ownership
    ├── Japanese content approval
    └── Local event management
```

**Regional Content Responsibilities**
- Regional content team owns regional content
- Regional team oversees regional translations
- Regional team approves regional adaptations
- Corporate team oversees corporate content

**Regional Approval Workflows**
- Define regional approvals: regional team approves regional content
- Design escalation paths: corporate review for strategic content
- Create approval communications: transparent approval process
- Implement approval SLAs: timely approval commitment

**Content Sharing Between Regions**
- Enable content reuse: regions use corporate content when applicable
- Design sharing mechanisms: easy content sharing between regions
- Create version management: track content across regions
- Implement conflict resolution: resolve regional content conflicts

## Multi-Brand Architecture

### Shared Component Library

Maintain brand consistency:

**Component Definitions**
- Define core components: button, card, header, footer
- Create component specifications: design, behavior, accessibility
- Implement component variants: component variations by brand
- Document component usage: guidelines and examples

**Component Management**
- Implement version control: track component versions
- Design backward compatibility: support old component versions
- Create deprecation process: retire old components gradually
- Implement component discovery: searchable component library

**Visual Component System**
- Implement CSS-in-JS: component styles in JavaScript
- Design component theming: brands apply different themes
- Create responsive design: components work across devices
- Implement dark mode: brand-appropriate dark themes

### Brand-Specific Theming

Apply brand identity through themes:

**Theme Components**
- Color palettes: brand-specific colors
- Typography: brand fonts and sizing
- Spacing system: brand spacing conventions
- Component variations: brand-specific component appearances

**Theme Application**
- Implement theme provider: wrap application with theme
- Design theme switching: change themes dynamically
- Create theme persistence: save user theme preference
- Implement theme consistency: ensure consistent application

**Brand Identity Preservation**
- Implement brand guidelines: enforce brand standards through theme
- Design accessibility: ensure theme maintains accessibility
- Create performance optimization: optimize themed components
- Implement cross-browser support: theme compatibility

### Brand-Specific Content Adaptation

Customize content by brand:

**Content Adaptation Strategy**
- Corporate messaging: core messaging shared across brands
- Brand adaptation: messaging adapted for brand voice
- Market positioning: market-specific messaging adjustments
- Regional customization: regional language and cultural adaptations

**Content Management by Brand**
- Define brand-owned content: content only for specific brand
- Create shared content: common content across brands
- Implement adaptation workflows: approve adaptations per brand
- Design content reuse: efficient content sharing

**Brand Voice Guidelines**
- Implement tone guides: brand-specific tone and voice
- Create messaging frameworks: approved messages by brand
- Design terminology guides: preferred terms by brand
- Implement training: ensure teams follow brand guidelines

## Multi-Market Deployment

### Regional Content Governance

Manage content across markets:

**Market Content Strategy**
- Master content: corporate content in English
- Market content: market-specific content and messaging
- Local events: market-specific events and promotions
- Regional products: products specific to market

**Approval Chains by Market**
- Define market approvals: required approvals for market content
- Design escalation: escalation for corporate review
- Create communication: transparency in approval process
- Implement SLAs: timely approval commitment

### Localization Workflows

Prepare content for markets:

**Localization Process**
1. Content creation: create content in master language
2. Translation: translate to market languages
3. Localization: adapt content for market
4. Review: market team reviews localization
5. Publication: publish localized content

**Beyond Translation**
- Currency adaptation: market-specific pricing
- Date/time formats: locale-appropriate formatting
- Unit conversions: metric vs. imperial units
- Measurement units: market-specific units

**Cultural Adaptation**
- Images: use culturally appropriate imagery
- Idioms: avoid idioms, use clear language
- Color symbolism: be aware of color meanings across cultures
- Holiday acknowledgment: respect regional holidays and observances

### Market-Specific Integrations

Connect with market-specific systems:

**Regional Payment Processors**
- Implement payment gateway per market: local preferred payment methods
- Design currency handling: multi-currency support
- Create compliance management: payment regulation compliance per market
- Implement fraud prevention: region-specific fraud detection

**Local Shipping Providers**
- Implement provider integration: local shipping APIs
- Design shipping calculation: market-specific rates
- Create delivery time estimates: accurate delivery predictions
- Implement tracking integration: track shipments in-market

**Regional Analytics**
- Implement analytics by market: market-specific analytics
- Design performance reporting: market-level KPIs
- Create localization validation: ensure localization quality
- Implement usage metrics: track market-specific usage patterns

## Content Graph Multi-Language Queries

### Locale Parameters

Query content by language:

**Basic Locale Query**
```graphql
query GetProductByLocale($id: String!, $locale: String!) {
  product(id: $id, locale: $locale) {
    id
    title
    description
    pricing {
      amount
      currency
    }
    availableLocales
  }
}
```

**Multiple Locale Queries**
```graphql
query GetProductMultipleLocales($id: String!) {
  product(id: $id) {
    id
    en: product(locale: "en") { title description }
    es: product(locale: "es") { title description }
    fr: product(locale: "fr") { title description }
  }
}
```

**Query Implementation**
- Implement locale parameter: pass locale to queries
- Design default locale: use default when not specified
- Create available locales: query available languages
- Implement locale validation: verify requested locale exists

### Language Fallback in Queries

Handle missing translations:

**Automatic Fallback**
```graphql
query GetProductWithFallback($id: String!, $locale: String!) {
  product(id: $id, locale: $locale, fallbackLocale: "en") {
    title
    description
    usedLocale  # indicates which locale was used
  }
}
```

**Fallback Chain Implementation**
- Define fallback chain: explicit chain for locale resolution
- Implement fallback logic: search fallback chain for content
- Create usage tracking: track which fallback used
- Implement notification: indicate fallback to user

### Content Availability by Locale

Query content status per language:

**Content Status Query**
```graphql
query GetProductAvailability($id: String!) {
  product(id: $id) {
    id
    title
    localeStatus {
      locale: "en"
      status: "published"
      publishedAt: "2026-03-31"
    }
    localeStatus {
      locale: "es"
      status: "draft"
      publishedAt: null
    }
  }
}
```

## Commerce Multi-Market

### Currency Handling

Manage multi-currency pricing:

**Currency Configuration**
- Define market currencies: primary currency per market
- Implement exchange rates: current exchange rates
- Create price management: pricing in different currencies
- Implement conversion: convert prices on request

**Price Display**
- Implement locale-based pricing: show appropriate currency
- Design price formatting: locale-specific formatting
- Create currency symbols: show symbol or code
- Implement decimal handling: locale-specific decimal places

**Dynamic Pricing**
- Implement real-time rates: current exchange rates
- Design promotional pricing: market-specific promotions
- Create volume pricing: market-specific volume discounts
- Implement customer-specific pricing: negotiated pricing

### Market-Specific Catalogs

Manage product availability:

**Catalog Availability**
- Define available products: which products available per market
- Implement product variants: market-specific variants
- Design region restrictions: products not available in some markets
- Create supply chain visibility: inventory by market

**Market Product Adaptation**
- Implement regional variants: product customization by market
- Design market pricing: different prices per market
- Create regional compliance: market-specific certifications
- Implement market positioning: different positioning per market

### Regional Pricing

Implement market-appropriate pricing:

**Pricing Strategy**
- Cost-based pricing: base price + regional markup
- Competitive pricing: based on market competition
- Value-based pricing: based on customer perception
- Penetration pricing: low initial prices for market entry

**Pricing Factors by Market**
- Labor costs: regional wage differences
- Import duties: tariffs and customs duties
- Local regulations: price regulations, restrictions
- Competitive landscape: competitor pricing analysis
- Customer purchasing power: market income levels

## Implementation Best Practices

1. **Plan Architecture Early**: Multi-site/language needs affect design
2. **Start with Clear Content Models**: Design supports multi-site, multi-language from start
3. **Implement Governance Frameworks**: Clear ownership, approval processes
4. **Use Automation**: Automate translation, regional deployment where possible
5. **Monitor Consistency**: Ensure brand consistency across markets
6. **Document Regional Differences**: Clear documentation of regional variations
7. **Test Multi-Site Thoroughly**: Test content visibility, navigation per site
8. **Plan for Scale**: Architecture should support growth
9. **Consider SEO**: Implement hreflang, locale-specific SEO
10. **Maintain Performance**: Multi-site, multi-language can impact performance
