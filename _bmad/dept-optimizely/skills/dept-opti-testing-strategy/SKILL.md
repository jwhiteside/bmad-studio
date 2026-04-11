---
canonicalId: dept-opti-testing-strategy
name: "Optimizely Testing Strategy Patterns"
description: "Comprehensive testing patterns for Optimizely implementations covering CMS 12 backend testing, SaaS CMS validation, front-end component testing, content migration validation, performance testing, accessibility compliance, and AI agent evaluation."
domain: optimizely
category: testing
---

# Optimizely Testing Strategy Patterns

## Overview

Comprehensive testing strategy for Optimizely implementations spans CMS 12 backend testing, SaaS CMS content validation, front-end component testing, content migration validation, performance testing, accessibility compliance, and AI agent evaluation. This skill provides patterns for test automation, quality gates, and test environment management.

## CMS 12 Backend Testing

### Unit Testing .NET Components

Implement unit tests for CMS 12 custom components:

**xUnit Testing Framework**
- Implement test class organization: one test class per component class
- Design test method naming: MethodUnderTest_Condition_ExpectedResult pattern
- Create fixtures: reusable test data and dependencies
- Implement theory tests: parameterized tests for multiple scenarios

**Block Component Testing**
```csharp
[Fact]
public void GetDisplayName_WithValidProperties_ReturnsExpectedName()
{
    // Arrange
    var block = new ProductCard { Title = "Test Product" };

    // Act
    var result = block.GetDisplayName();

    // Assert
    Assert.Equal("Test Product", result);
}

[Theory]
[InlineData("", "Default")]
[InlineData("Custom", "Custom")]
public void GetDisplayName_WithVariousInputs_ReturnsExpected(
    string input, string expected)
{
    var block = new ProductCard { Title = input };
    Assert.Equal(expected, block.GetDisplayName() ?? "Default");
}
```

**PageData Testing**
- Implement property testing: validate property serialization and defaults
- Design link validation: test content links resolve correctly
- Create property bag testing: test dynamic properties
- Implement archive flag testing: test archived content handling

**Validation Testing**
- Implement required field validation: test validation attributes
- Design conditional field validation: test dependent field validation
- Create custom validator testing: test complex business logic
- Implement validation message testing: verify user-friendly messages

### Integration Testing with TestHost

Test CMS functionality with in-memory host:

**TestHost Setup**
```csharp
public class CmsIntegrationTests : IAsyncLifetime
{
    private WebApplicationFactory<Startup> _factory;
    private HttpClient _client;

    public async Task InitializeAsync()
    {
        _factory = new WebApplicationFactory<Startup>()
            .WithWebHostBuilder(builder =>
            {
                builder.ConfigureServices(services =>
                {
                    // Configure test services
                    services.AddScoped<IContentRepository, TestContentRepository>();
                });
            });
        _client = _factory.CreateClient();
    }

    public async Task DisposeAsync()
    {
        _factory?.Dispose();
        _client?.Dispose();
    }
}
```

**API Integration Testing**
- Implement endpoint testing: test HTTP endpoints with real middleware
- Design request/response validation: verify correct status codes and payloads
- Create authentication testing: test role-based access control
- Implement content negotiation testing: test different response formats

**Database Testing**
- Implement repository testing: test data access layer
- Design transaction testing: verify transaction boundaries
- Create cleanup strategies: ensure test isolation
- Implement database state verification: assert database state after operations

### Content Type Testing

Validate content model configuration:

**Content Type Schema Testing**
- Implement property type testing: validate property definitions
- Design property validation testing: custom validation logic
- Create display template testing: verify template references exist
- Implement translation property testing: test multilingual properties

**Block Type Testing**
- Implement block instantiation testing: verify block creation
- Design block property testing: test block-specific properties
- Create container testing: test allowed child blocks
- Implement block display testing: verify block rendering in context

**Content Structure Testing**
- Implement required properties testing: enforced at runtime
- Design tree structure testing: valid parent-child relationships
- Create content type evolution testing: backward compatibility of changes
- Implement variant testing: test content type variations

### Scheduled Job Testing

Test scheduled task execution:

**Job Execution Testing**
```csharp
[Fact]
public async Task ExecuteAsync_PublishesScheduledContent_OnSchedule()
{
    // Arrange
    var content = new PageData { PublishAt = DateTime.UtcNow.AddMinutes(-5) };
    var repository = new TestContentRepository { content };
    var job = new PublishScheduledContentJob(repository);

    // Act
    await job.ExecuteAsync();

    // Assert
    Assert.True(content.IsPublished);
}
```

**Job Configuration Testing**
- Implement schedule testing: verify job triggers at correct intervals
- Design configuration testing: test job configuration parameters
- Create context testing: test job execution context
- Implement error handling testing: job behavior on exceptions

**Commerce Catalog Testing**
- Implement product sync testing: catalog updates reflected in CMS
- Design inventory testing: inventory changes propagated
- Create pricing testing: price updates synced correctly
- Implement bulk operation testing: handle large catalog syncs

## SaaS CMS Testing

### Content Graph Query Testing

Validate GraphQL queries and performance:

**Query Structure Testing**
```graphql
query GetProductContent($id: String!) {
  product(id: $id) {
    id
    title
    description
    pricing {
      amount
      currency
    }
    relatedProducts {
      id
      title
    }
  }
}
```

- Implement query validation: GraphQL syntax correctness
- Design field availability testing: verify requested fields exist
- Create null handling testing: proper handling of null values
- Implement fragment testing: reusable query fragments

**Query Performance Testing**
- Implement query complexity analysis: prevent runaway queries
- Design connection limit testing: verify connection pooling
- Create caching validation: cached queries perform optimally
- Implement n+1 prevention testing: batch loading effectiveness

**Query Result Testing**
- Implement data accuracy testing: verify correct data returned
- Design filtering testing: filter criteria applied correctly
- Create pagination testing: pagination parameters work correctly
- Implement sorting testing: sort order correct

### Visual Builder Rendering Tests

Test Visual Builder output:

**Component Rendering Testing**
- Implement component mounting: test component initialization
- Design prop validation: components accept expected props
- Create event handling testing: component events fire correctly
- Implement rendering output testing: correct HTML generated

**Layout Testing**
- Implement grid/flex layout testing: layout calculations correct
- Design responsive testing: breakpoint behavior correct
- Create overflow handling: content overflow handled gracefully
- Implement alignment testing: content alignment correct

**Visual Testing**
- Implement screenshot comparison: visual regression detection
- Design styling testing: styles applied correctly
- Create theme testing: theme variations render correctly
- Implement accessibility testing: WCAG compliance

### Content Type Contract Testing

Validate content type schema:

**Schema Structure Testing**
- Implement required field testing: required fields enforced
- Design field type testing: field types behave correctly
- Create field validation testing: validation rules enforced
- Implement conditional field testing: conditional logic works

**Field Configuration Testing**
- Implement dropdown testing: valid options defined
- Design reference testing: references to other content types valid
- Create localization testing: locale-specific properties work
- Implement metadata testing: content type metadata correct

**Content Model Evolution**
- Implement backward compatibility testing: new schema compatible with old content
- Design migration path testing: old content can be migrated to new schema
- Create deprecation testing: deprecated fields handled correctly
- Implement versioning testing: schema versions managed correctly

### REST API Testing

Test content management API endpoints:

**Endpoint Testing**
- Implement CRUD operation testing: create, read, update, delete
- Design authentication testing: API key validation
- Create authorization testing: permission-based access control
- Implement error response testing: meaningful error messages

**Payload Testing**
- Implement request validation: invalid requests rejected
- Design response format testing: correct content type and structure
- Create pagination testing: pagination parameters work
- Implement filtering testing: filter parameters applied correctly

**API Reliability Testing**
- Implement rate limiting testing: rate limits enforced
- Design retry testing: idempotent operations safe to retry
- Create timeout testing: appropriate timeout handling
- Implement concurrency testing: handle concurrent requests correctly

## Front-End Testing

### Component Testing with Jest/React Testing Library

Test React components in isolation:

**Component Unit Testing**
```javascript
import { render, screen } from '@testing-library/react';
import ProductCard from './ProductCard';

describe('ProductCard', () => {
  it('renders product title', () => {
    const product = {
      id: '1',
      title: 'Test Product',
      price: 99.99
    };

    render(<ProductCard product={product} />);
    expect(screen.getByText('Test Product')).toBeInTheDocument();
  });

  it('displays price with currency', () => {
    const product = { id: '1', title: 'Test', price: 99.99 };
    render(<ProductCard product={product} />);
    expect(screen.getByText('$99.99')).toBeInTheDocument();
  });
});
```

**User Interaction Testing**
- Implement click event testing: buttons respond to clicks
- Design form input testing: form inputs capture user data
- Create submission testing: form submission works
- Implement async action testing: async operations complete

**Props and State Testing**
- Implement prop validation: components accept expected props
- Design state change testing: state updates trigger re-renders
- Create callback testing: callbacks invoked correctly
- Implement conditional rendering testing: content renders based on conditions

**Snapshot Testing**
- Implement snapshot generation: capture component output
- Design snapshot updates: intentional changes only
- Create snapshot review: code review of snapshot changes
- Implement snapshot regression detection: catch unintended changes

### E2E Testing with Playwright/Cypress

Test complete user workflows:

**Page Navigation Testing**
```javascript
describe('Product Page Navigation', () => {
  it('navigates from product list to detail page', async () => {
    const { page } = await browser.newPage();
    await page.goto('https://example.com/products');

    const firstProduct = await page.$('[data-testid="product-1"]');
    await firstProduct.click();

    await page.waitForNavigation();
    const title = await page.textContent('h1');
    expect(title).toBe('Product Details');
  });
});
```

**Form Testing**
- Implement form fill testing: form fields can be filled
- Design form validation testing: invalid input rejected
- Create form submission testing: forms submit successfully
- Implement error message testing: error messages display

**Multi-Page Workflows**
- Implement user journey testing: complete workflows functional
- Design state preservation testing: data persists across pages
- Create session testing: authentication persists
- Implement history testing: browser back button works

**Performance Testing**
- Implement load time testing: pages load within SLA
- Design interaction responsiveness: UI responds quickly to interactions
- Create animation testing: animations smooth and performant
- Implement memory leak testing: no memory leaks with repeated actions

### Visual Regression Testing

Detect unintended visual changes:

**Screenshot Comparison**
- Implement baseline capture: reference screenshots for comparison
- Design visual diff generation: highlight visual differences
- Create threshold configuration: pixel-level tolerance for changes
- Implement baseline updates: intentional visual changes approved

**Responsive Testing**
- Implement multi-device testing: test across device sizes
- Design breakpoint testing: responsive breakpoints work
- Create orientation testing: portrait/landscape rendering
- Implement font loading testing: text renders after font loads

**Cross-Browser Testing**
- Implement browser compatibility: test across major browsers
- Design CSS feature testing: CSS features supported correctly
- Create polyfill testing: fallbacks work for unsupported features
- Implement vendor prefix testing: vendor-specific behavior correct

## Content Migration Testing

### Field Mapping Validation

Verify correct data transformation:

**Mapping Rule Testing**
- Implement field transformation testing: fields mapped correctly
- Design type conversion testing: data types converted correctly
- Create null handling testing: null values handled appropriately
- Implement default value testing: defaults applied when needed

**Data Integrity Testing**
- Implement before/after comparison: source and target data match
- Design sample validation: spot-check migrated content
- Create completeness testing: all content migrated
- Implement accuracy testing: data accuracy verified

### Content Completeness Checks

Ensure all content migrated successfully:

**Source Coverage Testing**
- Implement source audit: all source content identified
- Design migration tracking: track which content migrated
- Create orphan detection: identify unmigrated content
- Implement completeness reporting: migration coverage metrics

**Target Validation Testing**
- Implement count validation: migrated content count matches source
- Design sample validation: random sample of migrated content verified
- Create relationship validation: content relationships preserved
- Implement metadata validation: all metadata present

### URL Redirect Verification

Maintain SEO and user experience:

**Redirect Rule Testing**
```
Source URL → Target URL
/old-product → /new-product
/category/old → /category/new
```

- Implement redirect response testing: HTTP status codes correct
- Design redirect chain testing: no redirect loops or chains
- Create performance testing: redirects execute quickly
- Implement monitoring testing: redirect usage tracked

**SEO Preservation**
- Implement canonical URL testing: proper canonicalization
- Design sitemap updates: new URLs in sitemap
- Create search console updates: search console notified of changes
- Implement ranking preservation: search rankings maintained

## Performance Testing

### Content Graph Query Performance

Benchmark query response times:

**Query Load Testing**
- Implement concurrent query testing: multiple simultaneous queries
- Design query complexity testing: performance by query complexity
- Create query result size testing: large result set handling
- Implement cache validation: cache effectiveness

**Performance Benchmarking**
- Implement response time SLAs: query response time targets
- Design percentile tracking: p50, p95, p99 response times
- Create performance regression detection: catch performance regressions
- Implement monitoring setup: continuous performance tracking

### CMS Response Time Benchmarks

Measure CMS API performance:

**API Endpoint Benchmarking**
- Implement endpoint load testing: concurrent requests
- Design operation benchmarking: create/read/update/delete times
- Create batch operation testing: bulk operation performance
- Implement throughput measurement: requests per second

**Database Performance Testing**
- Implement query profiling: slow query identification
- Design index effectiveness testing: proper indexes in place
- Create connection pool testing: connection pool configuration
- Implement lock contention testing: concurrent update handling

### CDN Cache Hit Ratios

Optimize content delivery performance:

**Cache Configuration Testing**
- Implement cache header validation: correct cache headers
- Design cache key testing: proper cache key generation
- Create invalidation testing: cache invalidation works correctly
- Implement bypass testing: bypass cache when necessary

**Cache Performance Metrics**
- Implement hit ratio tracking: percentage of cached responses
- Design cache age monitoring: track content freshness
- Create stale content detection: serve stale when appropriate
- Implement metrics dashboard: cache performance visibility

## Accessibility Testing

### WCAG 2.1 AA Compliance

Ensure content meets accessibility standards:

**Color Contrast Testing**
- Implement contrast ratio testing: minimum 4.5:1 for normal text
- Design contrast validation: automated contrast checking
- Create exception handling: acceptable contrast exceptions documented
- Implement monitoring: ongoing contrast compliance

**Heading Hierarchy Testing**
- Implement nesting validation: proper heading structure
- Design skip-to-content testing: navigation shortcuts work
- Create heading contextuality testing: headings descriptive
- Implement outline testing: document outline makes sense

**Form Accessibility Testing**
- Implement label testing: all form fields have labels
- Design error message testing: error messages linked to fields
- Create help text testing: help text available and clear
- Implement focus testing: focus visible and logical

**Link Testing**
- Implement link purpose testing: link text describes purpose
- Design link context testing: links understandable in context
- Create skip link testing: skip links for navigation
- Implement duplicate link testing: identical links to same destination

### axe-core Automation

Integrate accessibility testing:

**Automated Testing**
```javascript
import { axe } from 'jest-axe';

it('should not have accessibility violations', async () => {
  const { container } = render(<ProductCard product={mockProduct} />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

- Implement integration testing: axe in component tests
- Design CI/CD integration: accessibility checks in pipeline
- Create reporting: accessibility violation reporting
- Implement remediation tracking: track violation fixes

### Screen Reader Testing

Validate screen reader experience:

**Screen Reader Compatibility Testing**
- Implement ARIA role testing: proper ARIA roles
- Design ARIA label testing: descriptive labels for screen readers
- Create semantic HTML testing: proper semantic structure
- Implement live region testing: dynamic content announced

**Manual Screen Reader Testing**
- Implement NVDA testing: NVDA screen reader compatibility
- Design JAWS testing: JAWS screen reader compatibility
- Create VoiceOver testing: Apple VoiceOver compatibility
- Implement testing documentation: screen reader testing process

## Opal AI Testing

### Agent Evaluation Framework

Measure AI agent effectiveness:

**Evaluation Metrics**
- Implement task completion rate: percentage of tasks successfully completed
- Design accuracy metrics: quality of AI outputs
- Create latency metrics: AI response time
- Implement cost metrics: API call costs for agent operations

**Test Case Development**
- Implement use case coverage: test common agent scenarios
- Design edge case testing: unusual but valid inputs
- Create adversarial testing: attempt to trick agent
- Implement regression testing: ensure fixes don't break previously working cases

### Response Quality Scoring

Evaluate AI-generated content:

**Relevance Scoring**
- Implement semantic similarity: compare AI output to expected output
- Design topic matching: verify AI response addresses topic
- Create completeness scoring: all required information present
- Implement accuracy validation: factual correctness

**Style and Tone Scoring**
- Implement brand voice validation: output matches brand voice
- Design tone detection: appropriate tone for audience
- Create clarity scoring: writing clarity and readability
- Implement grammar validation: grammatical correctness

### Tool Integration Testing

Test AI agent tools:

**Tool Invocation Testing**
- Implement tool availability testing: required tools available
- Design tool parameter testing: parameters passed correctly
- Create tool result handling: AI processes tool results
- Implement error handling: graceful handling of tool errors

**Tool Chain Testing**
- Implement multi-step testing: AI coordinates tool sequence
- Design dependency testing: tool dependencies handled
- Create state management testing: state preserved across tool calls
- Implement result aggregation: AI combines tool results

## Test Environment Strategy

### DXP Cloud Environment Promotion Testing

Validate environment transitions:

**Pre-Promotion Testing**
- Implement smoke testing: critical functionality works
- Design configuration validation: environment config correct
- Create content verification: all content present
- Implement integration testing: integrations functional

**Promotion Process Testing**
- Implement deployment testing: deployment completes successfully
- Design rollback testing: rollback capability verified
- Create health check testing: promoted environment healthy
- Implement monitoring testing: monitoring in promoted environment

### Content Sync Between Environments

Validate content promotion:

**Content Migration Testing**
- Implement content count testing: all content migrated
- Design content structure testing: content organization preserved
- Create content relationship testing: references maintained
- Implement content version testing: correct content versions migrated

**Configuration Sync Testing**
- Implement setting migration: environment settings transferred
- Design secret management testing: secrets securely transferred
- Create integration config testing: integration configuration updated
- Implement feature flag testing: flags appropriate per environment

## Test Automation Strategy

### Test Pyramid

Balance test coverage across levels:

**Unit Tests (70%)**
- Fast execution, isolated testing
- Test individual components, functions
- Low maintenance, clear failures
- Examples: .NET component tests, JavaScript function tests

**Integration Tests (20%)**
- Test component interactions
- Require test infrastructure
- Medium maintenance
- Examples: TestHost content tests, API integration tests

**E2E Tests (10%)**
- Test complete workflows
- Slow execution
- High maintenance
- Examples: Playwright user journey tests

### Test Scheduling

Manage test execution time:

**Continuous Testing**
- Unit tests: run on every commit
- Integration tests: run on pull requests
- E2E tests: run before merge
- Performance tests: scheduled nightly

**Nightly Builds**
- Full test suite execution
- Performance baseline captures
- Load testing execution
- Visual regression checks

## Testing Best Practices

1. **Start with Unit Tests**: Fast feedback, focus on business logic
2. **Test Business Logic**: Test requirements, not implementation
3. **Use Realistic Test Data**: Test with data patterns from production
4. **Automate Regression Testing**: Prevent regressions with automated tests
5. **Monitor Test Health**: Track test pass rates, identify flaky tests
6. **Document Test Cases**: Clear test documentation for maintenance
7. **Test Accessibility Early**: Accessibility testing throughout development
8. **Performance Test Regularly**: Monitor performance, detect regressions
9. **Test Failure Scenarios**: Don't only test happy paths
10. **Maintain Test Environment Parity**: Test environment resembles production
