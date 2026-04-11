# Shopify Ecosystem Platform References

Complete reference documentation for all 16 core platforms in the Shopify partner ecosystem.

## Commerce Platform

- **Shopify Plus**: /Users/jwhiteside/Code/bmad-studio/skills/shopify/SKILL.md, /Users/jwhiteside/Code/bmad-studio/skills/shopify/shopify-reference.md

## PIM Platforms

- **Akeneo**: /Users/jwhiteside/Code/bmad-studio/skills/akeneo/SKILL.md, /Users/jwhiteside/Code/bmad-studio/skills/akeneo/akeneo-reference.md
- **Bluestone**: /Users/jwhiteside/Code/bmad-studio/skills/bluestone/SKILL.md, /Users/jwhiteside/Code/bmad-studio/skills/bluestone/bluestone-reference.md
- **Inriver**: /Users/jwhiteside/Code/bmad-studio/skills/inriver/SKILL.md, /Users/jwhiteside/Code/bmad-studio/skills/inriver/inriver-reference.md

## Headless CMS

- **Contentstack**: /Users/jwhiteside/Code/bmad-studio/skills/contentstack/SKILL.md, /Users/jwhiteside/Code/bmad-studio/skills/contentstack/contentstack-reference.md

## Search & Personalisation

- **Bloomreach**: /Users/jwhiteside/Code/bmad-studio/skills/bloomreach/SKILL.md, /Users/jwhiteside/Code/bmad-studio/skills/bloomreach/bloomreach-reference.md
- **Nosto**: /Users/jwhiteside/Code/bmad-studio/skills/nosto/SKILL.md, /Users/jwhiteside/Code/bmad-studio/skills/nosto/nosto-reference.md

## Email & SMS Marketing

- **Klaviyo**: /Users/jwhiteside/Code/bmad-studio/skills/klaviyo/SKILL.md, /Users/jwhiteside/Code/bmad-studio/skills/klaviyo/klaviyo-reference.md
- **Attentive**: /Users/jwhiteside/Code/bmad-studio/skills/attentive/SKILL.md, /Users/jwhiteside/Code/bmad-studio/skills/attentive/attentive-reference.md
- **Yotpo SMS**: /Users/jwhiteside/Code/bmad-studio/skills/yotpo/SKILL.md, /Users/jwhiteside/Code/bmad-studio/skills/yotpo/yotpo-reference.md

## Customer Support

- **Gorgias**: /Users/jwhiteside/Code/bmad-studio/skills/gorgias/SKILL.md, /Users/jwhiteside/Code/bmad-studio/skills/gorgias/gorgias-reference.md

## Reviews, UGC & Loyalty

- **Yotpo**: /Users/jwhiteside/Code/bmad-studio/skills/yotpo/SKILL.md, /Users/jwhiteside/Code/bmad-studio/skills/yotpo/yotpo-reference.md

## Subscriptions

- **Recharge**: /Users/jwhiteside/Code/bmad-studio/skills/recharge/SKILL.md, /Users/jwhiteside/Code/bmad-studio/skills/recharge/recharge-reference.md

## Returns Management

- **Loop**: /Users/jwhiteside/Code/bmad-studio/skills/loop/SKILL.md, /Users/jwhiteside/Code/bmad-studio/skills/loop/loop-reference.md
- **Swap**: /Users/jwhiteside/Code/bmad-studio/skills/swap/SKILL.md, /Users/jwhiteside/Code/bmad-studio/skills/swap/swap-reference.md

## Cross-Border & Fulfillment

- **Global-e**: /Users/jwhiteside/Code/bmad-studio/skills/global-e/SKILL.md, /Users/jwhiteside/Code/bmad-studio/skills/global-e/global-e-reference.md

## Post-Purchase Optimization

- **Rebuy**: /Users/jwhiteside/Code/bmad-studio/skills/rebuy/SKILL.md, /Users/jwhiteside/Code/bmad-studio/skills/rebuy/rebuy-reference.md

## Platform Categories at a Glance

| Category | Platforms | Typical Selection |
|----------|-----------|-------------------|
| **Commerce** | Shopify Plus | Always required |
| **PIM** | Akeneo, Bluestone, Inriver | Choose 1 if >1000 SKUs |
| **CMS** | Contentstack | Optional; needed for content-rich sites |
| **Search** | Bloomreach, Nosto | Optional; typically 1 for 10K+ SKUs |
| **Email** | Klaviyo | Primary (market leader) |
| **SMS** | Attentive, Klaviyo SMS, Yotpo SMS | Secondary; often bundled |
| **Support** | Gorgias | Optional but best-in-class for unified inbox |
| **Reviews** | Yotpo | Optional; critical if conversion-focused |
| **Loyalty** | Yotpo | Often bundled with reviews |
| **Subscriptions** | Recharge | Only if >10% recurring revenue |
| **Returns** | Loop, Swap | Optional; impactful if high return rate |
| **Cross-Border** | Global-e | Only if 20%+ international revenue |
| **Post-Purchase** | Rebuy | Optional; AOV optimization |

## Typical Stack Patterns

See `dept-shopify-integration-patterns` for complete integration architecture guidance. These are common configurations:

### Starter Plus (Basic D2C)
- Shopify Plus (core)
- Klaviyo (email)
- Yotpo (reviews + loyalty)

### Content-Rich Brand
- Shopify Plus
- Contentstack (CMS)
- Klaviyo (email)
- Bloomreach or Nosto (search)

### Global Enterprise
- Shopify Plus
- Akeneo (PIM)
- Global-e (cross-border)
- Klaviyo (email)
- Gorgias (support)
- Bloomreach (search)

### Subscription-First
- Shopify Plus
- Recharge (subscriptions)
- Klaviyo (email)
- Yotpo (reviews + retention)

### Headless Commerce
- Shopify Plus (Admin API)
- Contentstack (CMS)
- Custom frontend (React/Next.js)
- Bloomreach (search)
- Klaviyo (email)
- Gorgias (support)
