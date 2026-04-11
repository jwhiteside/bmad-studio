# step-02-content-graph-integration: Content Graph Query Layer

## MANDATORY EXECUTION RULES

1. **Query Caching Required:** Every production query must have a caching strategy (ISR, Redis, or in-memory TTL).
2. **No N+1 Queries:** Design queries to fetch all needed data in single request; document query complexity.
3. **Errors Are First-Class:** Implement explicit error handling and fallback strategies; no silent failures.
4. **Pagination Defined:** Choose pagination strategy (cursor-based or offset) and document limits.
5. **Query Fragments Reused:** Define fragments per content type; reuse across queries to avoid duplication.

## EXECUTION PROTOCOLS

### Phase: Query Layer Implementation
**Role:** Full-Stack Developer / Backend Engineer
**Inputs:** Content models from dept-opti-build-component, project from step-01
**Duration:** 2–3 days
**Output:** Production-ready Content Graph client with caching, error handling, and test coverage

### Entry Conditions
- Step-01 project scaffold is complete
- Content Graph authentication verified
- GraphQL query fragments defined
- Caching strategy decided (ISR, Redis, in-memory)
- Team understands query patterns

### Exit Conditions
- All queries have defined caching strategy
- Error handling implemented (timeouts, 5xx errors, missing data)
- Pagination strategy chosen and documented
- Integration tests pass (80%+ coverage)
- Query performance measured (< 500ms for typical query)

---

## YOUR TASK

### A. Implement Query Caching Strategy

**Action:** Choose and implement caching strategy appropriate for your content volume and update frequency.

**Option 1: Next.js ISR (Incremental Static Regeneration)**

Best for: Medium-frequency updates (daily or weekly)

```typescript
// File: src/lib/cache.ts

export const REVALIDATE_TIMES = {
  PAGES: 60 * 60 * 24,      // 24 hours
  COMPONENTS: 60 * 60 * 12,  // 12 hours
  IMAGES: 60 * 60 * 24 * 7,  // 7 days
  SHORT: 60 * 5,             // 5 minutes (frequently changing content)
};

// Example: Page with ISR
// File: src/app/[slug]/page.tsx

import { revalidatePath } from 'next/cache';

export const revalidate = REVALIDATE_TIMES.PAGES; // ISR: revalidate every 24h

async function getPage(slug: string) {
  const client = getContentGraphClient();
  return client.query(GET_PAGE_QUERY, { slug }, false);
}

export default async function Page({ params }: { params: { slug: string } }) {
  const page = await getPage(params.slug);
  return <PageComponent page={page} />;
}

// Webhook handler to invalidate on publish
// File: src/app/api/revalidate/route.ts

import { revalidatePath } from 'next/cache';

export async function POST(req: Request) {
  const body = await req.json();

  // Validate webhook signature
  const signature = req.headers.get('x-signature');
  if (!verifySignature(body, signature)) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Revalidate affected paths
  const { contentKey, contentType } = body;

  if (contentType === 'page') {
    revalidatePath(`/${contentKey}`);
  } else if (contentType === 'featureBlock') {
    revalidatePath('/', 'layout');  // Revalidate all pages
  }

  return new Response(JSON.stringify({ success: true }), { status: 200 });
}
```

**Option 2: Redis Caching**

Best for: High-frequency updates (real-time or hourly)

```typescript
// File: src/lib/redisCache.ts

import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.REDIS_URL,
  token: process.env.REDIS_TOKEN,
});

export async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 3600
): Promise<T> {
  // Try cache first
  const cached = await redis.get(key);
  if (cached) return cached as T;

  // Fetch fresh data
  const data = await fetcher();

  // Store in cache
  await redis.setex(key, ttl, JSON.stringify(data));

  return data;
}

export async function invalidateCache(pattern: string) {
  const keys = await redis.keys(pattern);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}

// Usage
export async function getPageCached(slug: string) {
  return getCached(
    `page:${slug}`,
    () => getContentGraphClient().query(GET_PAGE_QUERY, { slug }),
    60 * 60  // 1 hour TTL
  );
}
```

**Option 3: In-Memory Cache (Development)**

Best for: Development and testing

```typescript
// File: src/lib/memoryCache.ts

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry<any>>();

export async function getMemoryCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 3600
): Promise<T> {
  const cached = cache.get(key);

  if (cached && cached.expiresAt > Date.now()) {
    console.log(`Cache hit: ${key}`);
    return cached.data;
  }

  console.log(`Cache miss: ${key}`);
  const data = await fetcher();
  cache.set(key, {
    data,
    expiresAt: Date.now() + ttl * 1000,
  });

  return data;
}
```

### B. Implement Error Handling and Retries

**Action:** Add robust error handling to all Content Graph queries.

```typescript
// File: src/lib/queryClient.ts

import { GraphQLClient } from 'graphql-request';

export interface QueryOptions {
  retries?: number;
  timeout?: number;
  fallback?: any;
}

async function queryWithRetry<T>(
  query: string,
  variables: Record<string, any>,
  options: QueryOptions = {}
): Promise<T> {
  const { retries = 3, timeout = 10000, fallback = null } = options;
  const client = getContentGraphClient();

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const result = await Promise.race([
        client.query<T>(query, variables),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Query timeout')), timeout)
        ),
      ]);

      clearTimeout(timeoutId);
      return result;
    } catch (error) {
      console.error(`Query attempt ${attempt} failed:`, error);

      if (attempt === retries) {
        if (fallback !== null) {
          console.warn(`Returning fallback data for query`);
          return fallback;
        }
        throw new Error(
          `Query failed after ${retries} attempts: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }

      // Exponential backoff
      const delayMs = Math.pow(2, attempt - 1) * 1000;
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  throw new Error('Unexpected error in queryWithRetry');
}

export async function getPageSafe(slug: string): Promise<PageData | null> {
  try {
    return await queryWithRetry(
      GET_PAGE_QUERY,
      { slug },
      {
        retries: 3,
        timeout: 10000,
        fallback: { title: 'Page Not Found', content: [] },
      }
    );
  } catch (error) {
    console.error('Failed to fetch page:', error);
    return null;
  }
}
```

### C. Implement Pagination

**Action:** Choose and implement pagination strategy.

**Cursor-Based Pagination (Recommended):**

```graphql
# Cursor-based query
query GetPageBlocks($key: String!, $first: Int!, $after: String) {
  page: _Content(key: $key) {
    blocks(first: $first, after: $after) {
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        node {
          title
          description
        }
      }
    }
  }
}
```

```typescript
// Implementation
async function getPageBlocksPaginated(
  pageKey: string,
  pageSize: number = 10
) {
  const client = getContentGraphClient();
  let allBlocks = [];
  let cursor = null;
  let hasNextPage = true;

  while (hasNextPage) {
    const result = await client.query(GET_PAGE_BLOCKS_QUERY, {
      key: pageKey,
      first: pageSize,
      after: cursor,
    });

    allBlocks = [
      ...allBlocks,
      ...result.page.blocks.edges.map(edge => edge.node),
    ];

    hasNextPage = result.page.blocks.pageInfo.hasNextPage;
    cursor = result.page.blocks.pageInfo.endCursor;
  }

  return allBlocks;
}
```

### D. Configure Webhook Invalidation

**Action:** Set up webhooks to invalidate cache when content changes.

```typescript
// File: src/app/api/webhooks/content-publish/route.ts

import { headers } from 'next/headers';
import crypto from 'crypto';

const WEBHOOK_SECRET = process.env.OPTIMIZELY_WEBHOOK_SECRET;

function verifySignature(body: string, signature: string): boolean {
  const computed = crypto
    .createHmac('sha256', WEBHOOK_SECRET || '')
    .update(body)
    .digest('hex');
  return computed === signature;
}

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get('x-signature') || '';

  if (!verifySignature(body, signature)) {
    return new Response('Unauthorized', { status: 401 });
  }

  const event = JSON.parse(body);
  const { contentKey, contentType, action } = event;

  console.log(`Webhook received: ${action} on ${contentType} ${contentKey}`);

  // Invalidate cache based on content type
  if (action === 'published' || action === 'unpublished') {
    // For ISR: trigger revalidation
    // For Redis: invalidate cache keys
    // For in-memory: clear entries

    try {
      // Example: Invalidate ISR
      await fetch(`${process.env.NEXT_PUBLIC_PREVIEW_DOMAIN}/api/revalidate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentKey, contentType }),
      });
    } catch (error) {
      console.error('Failed to trigger revalidation:', error);
    }
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
}
```

### E. Write Integration Tests

**Action:** Test Content Graph queries with mocked responses.

```typescript
// File: src/lib/__tests__/queries.integration.test.ts

import { getContentGraphClient } from '../contentGraph';
import { GET_PAGE_QUERY } from '../queries';

describe('Content Graph Integration Tests', () => {
  it('should fetch page with all required fields', async () => {
    const client = getContentGraphClient();
    const result = await client.query(GET_PAGE_QUERY, { slug: 'test-page' });

    expect(result).toHaveProperty('page');
    expect(result.page).toHaveProperty('title');
    expect(result.page).toHaveProperty('_experience');
  });

  it('should handle missing page gracefully', async () => {
    const client = getContentGraphClient();

    await expect(
      client.query(GET_PAGE_QUERY, { slug: 'non-existent' })
    ).rejects.toThrow();
  });

  it('should respect query timeout', async () => {
    const client = getContentGraphClient();
    const startTime = Date.now();

    try {
      await queryWithTimeout(GET_PAGE_QUERY, { slug: 'slow-page' }, 1000);
    } catch (error) {
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(2000);
    }
  });

  it('should paginate blocks correctly', async () => {
    const blocks = await getPageBlocksPaginated('test-page', 5);
    expect(Array.isArray(blocks)).toBe(true);
    expect(blocks.length).toBeGreaterThan(0);
  });
});
```

### F. Document Query Patterns

**Action:** Create reference documentation for common query patterns.

```markdown
# Content Graph Query Patterns

## Performance Guidelines

- **Query timeout:** 10 seconds (abort after 10s)
- **Retry attempts:** 3 retries with exponential backoff
- **Cache TTL:** 24 hours for pages, 1 hour for components
- **Pagination size:** 10–50 items per page (avoid fetching 1000+ items in single query)

## Pattern: Fetch Page with All Sections

\`\`\`graphql
query GetPageFull($key: String!) {
  page: _Content(key: $key) {
    title: displayName
    description
    _experience {
      sections {
        elements {
          content {
            ... on FeatureBlock {
              ...FeatureBlockContent
            }
            ... on HeroSection {
              ...HeroSectionContent
            }
          }
        }
      }
    }
  }
}
\`\`\`

## Pattern: Fetch with Pagination

Use cursor-based pagination for large datasets:

\`\`\`graphql
query GetPageBlocks($key: String!, $first: Int, $after: String) {
  page: _Content(key: $key) {
    blocks(first: $first, after: $after) {
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        node { title }
      }
    }
  }
}
\`\`\`

## Pattern: Error Handling

Always include fallback behavior for failed queries:

\`\`\`typescript
const page = await getPageSafe(slug) || {
  title: '404 Not Found',
  content: []
};
\`\`\`

## Common Mistakes to Avoid

1. **N+1 Queries:** Don't fetch parent, then loop through children querying each. Use fragments.
2. **No timeout:** Always set query timeout (10s max).
3. **No caching:** Every query should have TTL strategy.
4. **Silent failures:** Log all errors; never fail silently.
```

## SUCCESS METRICS

| Metric | Target |
|--------|--------|
| All queries cached | 100% of production queries have TTL |
| Error rate | < 1% (measured over 1 week) |
| Query latency | < 500ms p95 (typical query) |
| N+1 detection | Zero N+1 query patterns found |
| Test coverage | >= 80% (query layer) |

## NEXT STEP

→ **Proceed to step-03-visual-builder-rendering: Implement component rendering system**

In step-03, you will:
- Build component registry for Visual Builder types
- Implement Experience → Section → Element rendering
- Configure Styles and Display Templates
- Set up preview mode for editors
