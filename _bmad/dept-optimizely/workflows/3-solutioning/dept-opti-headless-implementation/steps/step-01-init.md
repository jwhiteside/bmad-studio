# step-01-init: Initialize Headless Project

## MANDATORY EXECUTION RULES

1. **Next.js Only:** Use Next.js 14 with App Router and TypeScript. Do not use Gatsby, Nuxt, or other frameworks.
2. **Content Graph Early:** Set up Content Graph authentication in step-01, not step-02. Verify connection before proceeding.
3. **Environment Isolation:** Use environment variables for all secrets (never hardcode API keys).
4. **SSR-First:** Configure for server-side rendering by default (enable SSG later for performance).
5. **No External CMS API:** Content Graph is the only content source. No fallback to direct CMS API calls.

## EXECUTION PROTOCOLS

### Phase: Project Setup & Configuration
**Role:** Frontend Lead / Full-Stack Developer
**Inputs:** Component specs, Content Graph credentials, design system
**Duration:** 1–2 days
**Output:** Next.js project scaffold with Content Graph client and environment setup

### Entry Conditions
- Component specifications from dept-opti-build-component are available
- Content Graph credentials (SingleKey for delivery, HMAC for preview) are obtained
- Design system tokens are accessible
- Node.js 18 LTS or higher installed locally
- Git and GitHub/GitLab access configured
- Deployment target identified (Vercel, Docker, custom)

### Exit Conditions
- Next.js project created with App Router
- Content Graph client is implemented and authenticated
- Environment variables configured (.env.local template created)
- Build succeeds locally (npm run build)
- Project structure is documented

---

## YOUR TASK

### A. Create Next.js Project Scaffold

**Action:** Initialize Next.js project with TypeScript and required dependencies.

```bash
# Create Next.js project
npx create-next-app@latest dept-optimizely-frontend \
  --typescript \
  --app \
  --tailwind \
  --eslint \
  --no-git

cd dept-optimizely-frontend

# Install Optimizely dependencies
npm install @optimizely/content-cloud @optimizely/graph-client

# Install additional packages
npm install graphql graphql-request lodash-es
npm install --save-dev @types/lodash-es

# Verify installation
npm run build
```

**Directory structure:**

```
dept-optimizely-frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Home page
│   │   └── [slug]/
│   │       └── page.tsx        # Dynamic pages
│   ├── components/
│   │   └── blocks/             # Visual Builder components
│   │       ├── FeatureBlock.tsx
│   │       ├── HeroSection.tsx
│   │       └── registry.ts     # Component registry for VB
│   ├── lib/
│   │   ├── contentGraph.ts     # Content Graph client
│   │   ├── queries.ts          # GraphQL fragments
│   │   └── utils.ts
│   ├── queries/                # Reusable GraphQL queries
│   │   ├── pages.graphql
│   │   └── blocks.graphql
│   └── styles/
│       └── globals.css
├── .env.local                  # Local environment (git-ignored)
├── .env.example                # Template for env vars
├── next.config.js
├── tsconfig.json
└── package.json
```

### B. Configure Content Graph Authentication

**Action:** Set up Content Graph client with SingleKey (delivery) and HMAC (preview).

**Step 1: Create .env.local**

```bash
# File: .env.local
# DO NOT COMMIT THIS FILE

# Content Graph API endpoint
NEXT_PUBLIC_CONTENT_GRAPH_URL=https://[your-instance].content.optimizely.com/graphql

# SingleKey for content delivery (public, safe to expose)
NEXT_PUBLIC_CONTENT_GRAPH_KEY=eyJ...  # Base64-encoded SingleKey

# HMAC secret for preview/draft content (PRIVATE, server-side only)
CONTENT_GRAPH_HMAC_SECRET=your-hmac-secret-here

# Optional: Content preview domain (for iframe preview in CMS editor)
NEXT_PUBLIC_PREVIEW_DOMAIN=http://localhost:3000

# Deployment environment
NEXT_PUBLIC_ENV=development
```

**Step 2: Create .env.example (for git)**

```bash
# File: .env.example
# Copy to .env.local and fill in your credentials

NEXT_PUBLIC_CONTENT_GRAPH_URL=https://[your-instance].content.optimizely.com/graphql
NEXT_PUBLIC_CONTENT_GRAPH_KEY=your-singlekey-here
CONTENT_GRAPH_HMAC_SECRET=your-hmac-secret-here
NEXT_PUBLIC_PREVIEW_DOMAIN=http://localhost:3000
NEXT_PUBLIC_ENV=development
```

**Step 3: Create Content Graph client**

```typescript
// File: src/lib/contentGraph.ts

import { GraphQLClient } from 'graphql-request';

export interface ContentGraphClientConfig {
  url: string;
  key: string;
  hmacSecret?: string;
}

class ContentGraphClient {
  private deliveryClient: GraphQLClient;
  private previewClient?: GraphQLClient;
  private config: ContentGraphClientConfig;

  constructor(config: ContentGraphClientConfig) {
    this.config = config;

    // Delivery client (public, cached)
    this.deliveryClient = new GraphQLClient(config.url, {
      headers: {
        'Authorization': `epi-single ${config.key}`,
      },
    });

    // Preview client (authenticated, not cached)
    if (config.hmacSecret) {
      this.previewClient = new GraphQLClient(config.url, {
        headers: {
          'Authorization': `epi-hmac ${Buffer.from(config.hmacSecret).toString('base64')}`,
        },
      });
    }
  }

  async query<T = any>(
    query: string,
    variables?: Record<string, any>,
    preview: boolean = false
  ): Promise<T> {
    const client = preview && this.previewClient ? this.previewClient : this.deliveryClient;

    try {
      return await client.request<T>(query, variables);
    } catch (error) {
      console.error('Content Graph query failed:', error);
      throw new Error(`Content Graph query error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  isPreviewMode(): boolean {
    return !!this.previewClient;
  }
}

// Singleton instance
let clientInstance: ContentGraphClient;

export function getContentGraphClient(): ContentGraphClient {
  if (!clientInstance) {
    clientInstance = new ContentGraphClient({
      url: process.env.NEXT_PUBLIC_CONTENT_GRAPH_URL || '',
      key: process.env.NEXT_PUBLIC_CONTENT_GRAPH_KEY || '',
      hmacSecret: process.env.CONTENT_GRAPH_HMAC_SECRET,
    });
  }
  return clientInstance;
}
```

### C. Create GraphQL Query Fragments

**Action:** Define reusable GraphQL fragments for each content type.

```graphql
# File: src/queries/blocks.graphql

# Feature Block fragment
fragment FeatureBlockContent on FeatureBlock {
  title
  description
  image {
    url
    alt: imageAltText
  }
  buttonLabel
  buttonLink {
    href
    title: displayName
  }
  backgroundColor
  _metadata {
    displayName
    updated
    published
    templateId
  }
}

# Hero Section fragment
fragment HeroSectionContent on HeroSection {
  title
  subtitle
  backgroundImage {
    url
    alt: imageAltText
  }
  ctaButtonLabel
  ctaButtonLink {
    href
    title: displayName
  }
  _metadata {
    displayName
    updated
    published
  }
}
```

```typescript
// File: src/lib/queries.ts

import { gql } from 'graphql-request';

// Define fragments as constants
export const FEATURE_BLOCK_FRAGMENT = gql`
  fragment FeatureBlockContent on FeatureBlock {
    title
    description
    image {
      url
      alt: imageAltText
    }
    buttonLabel
    buttonLink {
      href
      title: displayName
    }
    backgroundColor
    _metadata {
      displayName
      updated
      published
      templateId
    }
  }
`;

// Example: Query for a page
export const GET_PAGE_QUERY = gql`
  query GetPage($key: String!) {
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

  ${FEATURE_BLOCK_FRAGMENT}
`;

export const HERO_SECTION_FRAGMENT = gql`
  fragment HeroSectionContent on HeroSection {
    title
    subtitle
    backgroundImage {
      url
      alt: imageAltText
    }
    ctaButtonLabel
    ctaButtonLink {
      href
      title: displayName
    }
  }
`;
```

### D. Set Up Environment Variables in Next.js

**Action:** Configure Next.js to use environment variables.

```typescript
// File: src/lib/env.ts

const requiredEnvVars = [
  'NEXT_PUBLIC_CONTENT_GRAPH_URL',
  'NEXT_PUBLIC_CONTENT_GRAPH_KEY',
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

export const env = {
  contentGraphUrl: process.env.NEXT_PUBLIC_CONTENT_GRAPH_URL,
  contentGraphKey: process.env.NEXT_PUBLIC_CONTENT_GRAPH_KEY,
  hmacSecret: process.env.CONTENT_GRAPH_HMAC_SECRET,
  previewDomain: process.env.NEXT_PUBLIC_PREVIEW_DOMAIN || 'http://localhost:3000',
  isDevelopment: process.env.NEXT_PUBLIC_ENV === 'development',
};
```

### E. Test Content Graph Connection

**Action:** Verify Content Graph authentication works.

```bash
# Test SingleKey (delivery)
curl -X POST https://[your-instance].content.optimizely.com/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: epi-single [your-singlekey]" \
  -d '{"query":"query { __typename }"}'

# Expected response: { "data": { "__typename": "Query" } }
```

**Verify in code:**

```typescript
// File: src/lib/__tests__/contentGraph.test.ts

import { getContentGraphClient } from '../contentGraph';

describe('Content Graph Client', () => {
  it('should authenticate with SingleKey', async () => {
    const client = getContentGraphClient();
    const result = await client.query('query { __typename }');
    expect(result).toHaveProperty('__typename');
  });
});
```

### F. Configure Deployment

**Action:** Set up deployment configuration (Vercel, Docker, or custom).

**For Vercel:**

```json
// File: vercel.json

{
  "env": [
    {
      "key": "NEXT_PUBLIC_CONTENT_GRAPH_URL",
      "value": "@content-graph-url"
    },
    {
      "key": "NEXT_PUBLIC_CONTENT_GRAPH_KEY",
      "value": "@content-graph-key"
    },
    {
      "key": "CONTENT_GRAPH_HMAC_SECRET",
      "value": "@hmac-secret"
    }
  ],
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm ci"
}
```

**For Docker:**

```dockerfile
# File: Dockerfile

FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy source
COPY . .

# Build
RUN npm run build

# Run
EXPOSE 3000
CMD ["npm", "start"]
```

### G. Document Project Setup

**Action:** Create setup documentation for team.

```markdown
# Frontend Setup Guide

## Prerequisites
- Node.js 18 LTS or higher
- npm 9 or higher
- Content Graph credentials (SingleKey, HMAC)

## Local Setup

1. Clone repository
   \`\`\`bash
   git clone https://github.com/yourorg/dept-optimizely-frontend.git
   cd dept-optimizely-frontend
   \`\`\`

2. Install dependencies
   \`\`\`bash
   npm ci
   \`\`\`

3. Configure environment
   \`\`\`bash
   cp .env.example .env.local
   # Edit .env.local with your Content Graph credentials
   \`\`\`

4. Test Content Graph connection
   \`\`\`bash
   npm run test:cg
   \`\`\`

5. Run development server
   \`\`\`bash
   npm run dev
   # Open http://localhost:3000
   \`\`\`

## Build for Production
\`\`\`bash
npm run build
npm run start
\`\`\`

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| NEXT_PUBLIC_CONTENT_GRAPH_URL | Content Graph API endpoint | https://instance.content.optimizely.com/graphql |
| NEXT_PUBLIC_CONTENT_GRAPH_KEY | SingleKey (public) | eyJ... |
| CONTENT_GRAPH_HMAC_SECRET | HMAC secret (private) | secret-here |
| NEXT_PUBLIC_ENV | Environment (development/production) | development |

## Troubleshooting

**Content Graph auth fails:**
- Verify SingleKey format (should be base64-encoded)
- Check Content Graph URL (must end with /graphql)
- Confirm network connectivity (test with curl)

**Build fails:**
- Run \`npm ci\` to install exact versions
- Check Node.js version (must be 18 LTS)
- Verify all environment variables are set
```

## SUCCESS METRICS

| Metric | Pass Criteria |
|--------|---------------|
| Project created | Next.js builds locally without errors |
| CG authentication | Content Graph queries return data |
| Environment config | .env.local template created and documented |
| Deployment ready | Build succeeds with \`npm run build\` |
| Project structure | src/ directories created and organized |

## NEXT STEP

→ **Proceed to step-02-content-graph-integration: Build query layer with caching**

In step-02, you will:
- Implement query caching (ISR, Redis, or in-memory)
- Add error handling and retry logic
- Build pagination strategies
- Configure webhook invalidation
