# step-03-visual-builder-rendering: Visual Builder Rendering System

## MANDATORY EXECUTION RULES

1. **Component Registry Required:** Every Visual Builder content type must have a React component in the registry.
2. **Type Safety:** Use TypeScript interfaces for all content types. No `any` types.
3. **Lazy Loading:** Implement lazy-loading for components and images to meet TTI < 1s target.
4. **Styles Mapping:** Visual Builder Styles metadata must map to CSS classes (not inline styles).
5. **Preview Mode:** Editor preview must work for unpublished content (use HMAC authentication).

## EXECUTION PROTOCOLS

### Phase: Frontend Component Rendering
**Role:** Frontend Engineer / React Specialist
**Inputs:** Components from dept-opti-build-component, queries from step-02
**Duration:** 2–3 days
**Output:** Complete rendering system with preview mode, performance baseline, and test coverage

### Entry Conditions
- Step-02 Content Graph integration complete
- All component specifications from dept-opti-build-component available
- Visual Builder content structure understood (Experience → Section → Element)
- Performance targets defined (TTI < 1s)

### Exit Conditions
- All content types have React components
- Visual Builder experiences render correctly
- Preview mode works for editors
- Performance baseline measured (TTI < 1s)
- Accessibility tests pass (WCAG 2.1 AA)
- Test coverage >= 80%

---

## YOUR TASK

### A. Build Component Registry

**Action:** Create a registry of React components mapped to Visual Builder content types.

```typescript
// File: src/components/blocks/registry.ts

import { ComponentType } from 'react';

// Import all block components
import { FeatureBlock } from './FeatureBlock';
import { HeroSection } from './HeroSection';
import { CTABlock } from './CTABlock';

export interface BlockComponent {
  component: ComponentType<any>;
  displayName: string;
  preview?: string;
}

// Registry maps content type identifiers to React components
export const componentRegistry: Record<string, BlockComponent> = {
  feature_block: {
    component: FeatureBlock,
    displayName: 'Feature Block',
    preview: '/previews/feature-block.png',
  },
  hero_section: {
    component: HeroSection,
    displayName: 'Hero Section',
    preview: '/previews/hero-section.png',
  },
  cta_block: {
    component: CTABlock,
    displayName: 'CTA Block',
    preview: '/previews/cta-block.png',
  },
};

export function getComponent(
  contentTypeId: string
): ComponentType<any> | null {
  const entry = componentRegistry[contentTypeId];
  return entry ? entry.component : null;
}

export function isKnownContentType(contentTypeId: string): boolean {
  return contentTypeId in componentRegistry;
}
```

### B. Implement Content Type Components

**Action:** Create React components for each Visual Builder content type.

```typescript
// File: src/components/blocks/FeatureBlock.tsx

import React from 'react';
import Image from 'next/image';
import styles from './FeatureBlock.module.css';

export interface FeatureBlockProps {
  title?: string;
  description?: string;
  image?: {
    url: string;
    alt: string;
  };
  buttonLabel?: string;
  buttonLink?: {
    href: string;
    title: string;
  };
  backgroundColor?: 'white' | 'light-gray' | 'dark';
  displayTemplate?: 'default' | 'dark';
}

export const FeatureBlock: React.FC<FeatureBlockProps> = ({
  title,
  description,
  image,
  buttonLabel,
  buttonLink,
  backgroundColor = 'white',
  displayTemplate = 'default',
}) => {
  const bgClass =
    displayTemplate === 'dark' || backgroundColor === 'dark'
      ? styles.bgDark
      : styles.bgWhite;

  return (
    <section className={`${styles.featureBlock} ${bgClass}`} role="region">
      <div className={styles.container}>
        {/* Image */}
        {image?.url && (
          <div className={styles.imageWrapper}>
            <Image
              src={image.url}
              alt={image.alt || title || 'Feature image'}
              width={600}
              height={400}
              className={styles.image}
              loading="lazy"
            />
          </div>
        )}

        {/* Content */}
        <div className={styles.content}>
          {title && <h2 className={styles.title}>{title}</h2>}

          {description && (
            <div
              className={styles.description}
              dangerouslySetInnerHTML={{ __html: description }}
            />
          )}

          {/* Button */}
          {buttonLink?.href && buttonLabel && (
            <a
              href={buttonLink.href}
              className={styles.button}
              aria-label={buttonLabel}
            >
              {buttonLabel}
            </a>
          )}
        </div>
      </div>
    </section>
  );
};

export default FeatureBlock;
```

```css
/* File: src/components/blocks/FeatureBlock.module.css */

.featureBlock {
  padding: 3rem 2rem;
}

.bgDark {
  background-color: #1a1a1a;
  color: #ffffff;
}

.bgWhite {
  background-color: #ffffff;
  color: #333333;
}

.container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.imageWrapper {
  display: flex;
  align-items: center;
  justify-content: center;
}

.image {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
}

.title {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 1rem;
  line-height: 1.2;
}

.description {
  font-size: 1rem;
  line-height: 1.6;
  margin-bottom: 1.5rem;
}

.button {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  background-color: #0066cc;
  color: #ffffff;
  text-decoration: none;
  border-radius: 4px;
  font-weight: 600;
  transition: background-color 0.2s ease;
}

.button:hover {
  background-color: #0052a3;
}

.bgDark .button {
  background-color: #4d94ff;
}

.bgDark .button:hover {
  background-color: #0066cc;
}

.button:focus-visible {
  outline: 2px solid #0066cc;
  outline-offset: 2px;
}

@media (max-width: 768px) {
  .container {
    grid-template-columns: 1fr;
  }

  .title {
    font-size: 1.5rem;
  }
}
```

### C. Implement Visual Builder Rendering System

**Action:** Create system to render Experience → Section → Element tree.

```typescript
// File: src/components/blocks/VisualBuilderRenderer.tsx

import React, { lazy, Suspense } from 'react';
import { getComponent } from './registry';

export interface VisualBuilderElement {
  contentTypeId: string;
  content: any;
  displayTemplate?: string;
  styles?: Record<string, any>;
}

export interface VisualBuilderSection {
  elements: VisualBuilderElement[];
  backgroundImage?: string;
  backgroundColor?: string;
}

export interface VisualBuilderExperience {
  sections: VisualBuilderSection[];
  title?: string;
}

interface Props {
  experience: VisualBuilderExperience;
  preview?: boolean;
}

const LoadingFallback = () => (
  <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>
);

export const VisualBuilderRenderer: React.FC<Props> = ({
  experience,
  preview = false,
}) => {
  if (!experience?.sections) {
    return <div>No content to display</div>;
  }

  return (
    <>
      {experience.sections.map((section, sectionIndex) => (
        <section
          key={sectionIndex}
          style={{
            backgroundImage: section.backgroundImage
              ? `url(${section.backgroundImage})`
              : undefined,
            backgroundColor: section.backgroundColor,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="section-content">
            {section.elements.map((element, elementIndex) => (
              <ElementRenderer
                key={elementIndex}
                element={element}
                preview={preview}
              />
            ))}
          </div>
        </section>
      ))}
    </>
  );
};

interface ElementRendererProps {
  element: VisualBuilderElement;
  preview?: boolean;
}

const ElementRenderer: React.FC<ElementRendererProps> = ({
  element,
  preview,
}) => {
  const Component = getComponent(element.contentTypeId);

  if (!Component) {
    if (preview) {
      return (
        <div
          style={{
            padding: '1rem',
            backgroundColor: '#f0f0f0',
            border: '1px dashed #999',
            marginBottom: '1rem',
          }}
        >
          <p>Unknown content type: {element.contentTypeId}</p>
        </div>
      );
    }
    return null;
  }

  const cssClasses = buildCssClasses(element.styles);

  return (
    <Suspense fallback={<LoadingFallback />}>
      <div className={cssClasses}>
        <Component
          {...element.content}
          displayTemplate={element.displayTemplate}
        />
      </div>
    </Suspense>
  );
};

function buildCssClasses(styles?: Record<string, any>): string {
  if (!styles) return '';

  const classes: string[] = [];

  // Map Styles metadata to CSS classes
  if (styles.backgroundColor) {
    classes.push(`bg-${styles.backgroundColor}`);
  }
  if (styles.textColor) {
    classes.push(`text-${styles.textColor}`);
  }
  if (styles.spacing) {
    classes.push(`spacing-${styles.spacing}`);
  }

  return classes.join(' ');
}

export default VisualBuilderRenderer;
```

### D. Implement Styles and Display Templates

**Action:** Map Visual Builder Styles metadata to CSS classes.

```typescript
// File: src/lib/styleMapper.ts

export interface StyleMapping {
  [key: string]: Record<string, string>;
}

export const styleMapping: StyleMapping = {
  backgroundColor: {
    white: 'bg-white',
    'light-gray': 'bg-light-gray',
    dark: 'bg-dark-gray',
    primary: 'bg-primary-blue',
  },
  textColor: {
    dark: 'text-dark-gray',
    light: 'text-white',
    primary: 'text-primary-blue',
  },
  spacing: {
    compact: 'spacing-compact',
    normal: 'spacing-normal',
    generous: 'spacing-generous',
  },
};

export function mapStylesToClasses(
  styles?: Record<string, string>
): string[] {
  if (!styles) return [];

  const classes: string[] = [];

  Object.entries(styles).forEach(([styleKey, styleValue]) => {
    const mapping = styleMapping[styleKey];
    if (mapping && mapping[styleValue]) {
      classes.push(mapping[styleValue]);
    }
  });

  return classes;
}

// Example: Display Templates
export interface DisplayTemplateConfig {
  identifier: string;
  displayName: string;
  defaultStyles: Record<string, string>;
}

export const displayTemplates: Record<string, DisplayTemplateConfig> = {
  default: {
    identifier: 'default',
    displayName: 'Default (Light)',
    defaultStyles: {
      backgroundColor: 'white',
      textColor: 'dark',
    },
  },
  dark: {
    identifier: 'dark',
    displayName: 'Dark Theme',
    defaultStyles: {
      backgroundColor: 'dark',
      textColor: 'light',
    },
  },
  compact: {
    identifier: 'compact',
    displayName: 'Compact',
    defaultStyles: {
      spacing: 'compact',
    },
  },
};
```

### E. Configure Preview Mode

**Action:** Set up preview mode for editors viewing unpublished content.

```typescript
// File: src/lib/preview.ts

import { cookies } from 'next/headers';

const PREVIEW_SECRET = process.env.PREVIEW_SECRET || 'preview-secret';

export function setPreviewCookie() {
  const cookieStore = cookies();
  cookieStore.set('__preview', PREVIEW_SECRET, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });
}

export function isPreviewMode(): boolean {
  const cookieStore = cookies();
  const previewCookie = cookieStore.get('__preview');
  return previewCookie?.value === PREVIEW_SECRET;
}

// File: src/app/api/preview/route.ts

import { setPreviewCookie } from '@/lib/preview';
import { redirect } from 'next/navigation';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get('secret');
  const slug = searchParams.get('slug') || '/';

  // Validate secret
  if (secret !== process.env.PREVIEW_SECRET) {
    return new Response('Invalid preview secret', { status: 401 });
  }

  // Set preview cookie
  setPreviewCookie();

  // Redirect to preview page
  redirect(`/${slug}`);
}

// Usage in page component
// File: src/app/[slug]/page.tsx

import { isPreviewMode } from '@/lib/preview';

export default async function Page({
  params,
}: {
  params: { slug: string };
}) {
  const preview = isPreviewMode();
  const page = await getPage(params.slug, preview);

  return (
    <>
      {preview && (
        <div style={{ backgroundColor: '#ffd700', padding: '0.5rem' }}>
          Preview Mode (Unpublished Content)
        </div>
      )}
      <PageContent page={page} />
    </>
  );
}

async function getPage(slug: string, preview: boolean) {
  const client = getContentGraphClient();
  return client.query(GET_PAGE_QUERY, { slug }, preview);
}
```

### F. Performance Optimization

**Action:** Implement lazy-loading and code splitting for performance.

```typescript
// File: src/components/blocks/LazyFeatureBlock.tsx

import dynamic from 'next/dynamic';

const FeatureBlock = dynamic(() => import('./FeatureBlock'), {
  loading: () => <div>Loading...</div>,
  ssr: true,
});

export default FeatureBlock;

// File: src/components/blocks/registry.ts (updated)

import dynamic from 'next/dynamic';

export const componentRegistry: Record<string, BlockComponent> = {
  feature_block: {
    component: dynamic(() => import('./FeatureBlock'), { ssr: true }),
    displayName: 'Feature Block',
  },
  hero_section: {
    component: dynamic(() => import('./HeroSection'), { ssr: true }),
    displayName: 'Hero Section',
  },
};
```

### G. Write Component Tests

**Action:** Test Visual Builder rendering with various configurations.

```typescript
// File: src/components/blocks/__tests__/VisualBuilderRenderer.test.tsx

import React from 'react';
import { render, screen } from '@testing-library/react';
import { VisualBuilderRenderer } from '../VisualBuilderRenderer';

describe('VisualBuilderRenderer', () => {
  it('should render sections with elements', () => {
    const experience = {
      sections: [
        {
          elements: [
            {
              contentTypeId: 'feature_block',
              content: {
                title: 'Test Feature',
                description: '<p>Test description</p>',
              },
            },
          ],
        },
      ],
    };

    render(<VisualBuilderRenderer experience={experience} />);
    expect(screen.getByText('Test Feature')).toBeInTheDocument();
  });

  it('should handle unknown content types in preview mode', () => {
    const experience = {
      sections: [
        {
          elements: [
            {
              contentTypeId: 'unknown_type',
              content: {},
            },
          ],
        },
      ],
    };

    render(<VisualBuilderRenderer experience={experience} preview={true} />);
    expect(screen.getByText(/unknown content type/i)).toBeInTheDocument();
  });

  it('should skip unknown content types in production', () => {
    const experience = {
      sections: [
        {
          elements: [
            {
              contentTypeId: 'unknown_type',
              content: {},
            },
          ],
        },
      ],
    };

    const { container } = render(
      <VisualBuilderRenderer experience={experience} preview={false} />
    );
    expect(container.querySelector('div')).not.toBeEmptyDOMElement();
  });
});
```

## SUCCESS METRICS

| Metric | Target |
|--------|--------|
| All content types registered | 100% of VB types have React components |
| Visual Builder rendering | Experiences render correctly |
| Preview mode | Editors can preview unpublished content |
| TTI (typical page) | < 1 second |
| Code splitting | Components lazy-loaded |
| Accessibility | WCAG 2.1 AA compliant |
| Test coverage | >= 80% |

## NEXT STEP

→ **Proceed to dept-opti-code-review: Final code quality gate**

Project is now complete and ready for Phase 4 deployment.
