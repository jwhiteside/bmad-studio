---
canonicalId: dept-shopify-marketing-stack
name: "Shopify Marketing Technology Stack"
description: "Marketing platform selection, orchestration strategies, and closed-loop patterns for email, SMS, personalization, and reviews in the Shopify ecosystem."
domain: shopify-ecosystem
category: strategy
---

# Shopify Marketing Technology Stack

**Entry Point**: `dept-shopify-marketing-stack`

Strategic guidance for assembling and orchestrating the marketing technology stack within the Shopify ecosystem. Covers email, SMS, reviews, loyalty, personalization, and data flow patterns for unified customer journeys.

## What This Skill Does

Provides:
- Email and SMS platform selection criteria and positioning
- Reviews/UGC/Loyalty bundling vs separate platform strategies
- Personalization engine selection (Bloomreach vs Nosto)
- Marketing data flows and event mapping
- Closed-loop patterns (email-to-Gorgias, review-to-Klaviyo)
- Segmentation consistency across platforms

## When To Use It

- Building or evaluating marketing tech stack
- Choosing between email/SMS vendors
- Deciding on bundled (Yotpo) vs separate reviews/loyalty
- Setting up unified customer data flows
- Creating closed-loop feedback between marketing and support/product

## Inputs

Business profile (revenue, geography, customer volume, marketing maturity), marketing priorities (email primary? SMS needed? Loyalty critical?), existing tech debt.

## Key Concepts

---

## 1. Email Platform: Klaviyo as Market Standard

### Klaviyo Positioning

**Market Position**: Shopify-native email powerhouse
- 60%+ market share in Shopify email platforms
- Native Shopify app with automatic customer/order sync
- Most sophisticated email builder in Shopify ecosystem
- Strong integration marketplace (200+ partners)

### Klaviyo Core Capabilities

**Email Automation**:
- Drag-and-drop builder with conditional logic
- Behavioral triggers (abandoned cart, post-purchase, winback)
- Segmentation: RFM, churn scoring, custom attributes
- Dynamic product recommendations
- A/B testing (subject, send time, content)

**SMS Messaging**:
- SMS and MMS (images)
- SMS + email coordination (SMS primary, email fallback if opted out)
- One-click SMS links for mobile optimization

**Integration Capabilities**:
- Native: Shopify, WooCommerce
- Marketplace: 200+ integrations (Gorgias, Yotpo, Recharge, etc.)
- Custom: API for webhook ingestion, custom events

**Analytics & Attribution**:
- Campaign performance (open rate, click rate, revenue)
- Customer journey (path to conversion)
- Cohort analysis (purchase frequency, retention)
- Revenue attribution (which campaigns drove sales?)

### Shopify Integration Details

**Automatic Syncs**:
- Customer created → Klaviyo customer created
- Customer updated (email, phone) → Klaviyo updated
- Order created → Klaviyo order event
- Order fulfilled → Klaviyo event
- Order refunded → Klaviyo event

**Custom Events**:
- Add-to-cart: Fire via JavaScript SDK
- Viewed product: Fire via JavaScript SDK
- Custom behaviors: API POST to `/events`

**Dynamic Content**:
- Customer merge: Handle customers with multiple emails
- Product recommendations: Use Shopify product catalog
- Personalization: First name, last purchase, browsing history

### When to Use Klaviyo

**Choose Klaviyo if**:
- Email is primary marketing channel
- Need sophisticated segmentation and automation
- SMS secondary (coordinated fallback acceptable)
- Budget: €250-1000/month (depends on contact count)
- Shopify-first strategy

**Don't choose Klaviyo if**:
- SMS is primary revenue driver (see Attentive instead)
- Email volume < 1000/month (overkill; use Mailchimp)
- Very specific vertical needs (Klaviyo is generalist)

### Klaviyo SMS Strategy

**Positioning**: Email-centric platform with SMS secondary

**When to use Klaviyo SMS**:
- SMS < 20% of email marketing ROI
- Want unified platform (one interface for email + SMS)
- Budget constraint (don't want two platforms)

**Limitations vs Attentive**:
- Lower SMS feature set (no SMS-specific journey builder)
- No SMS-specific A/B testing
- Higher SMS cost per message (bundled pricing)

**Strategy**: Use Klaviyo SMS for secondary SMS campaigns (recovery, VIP); use Attentive if SMS is material channel.

---

## 2. SMS Strategy Decision Tree

**Is SMS material to your business?**

```
SMS revenue as % of email marketing revenue?
├─ < 5%: SMS is experimental/nice-to-have
│  └─ Strategy: Use Klaviyo SMS (unified platform, simple)
├─ 5-20%: SMS is secondary
│  └─ Strategy: Attentive OR Klaviyo SMS (either works)
│     └─ If brand-aware: choose Attentive for SMS sophistication
│     └─ If budget-constrained: Klaviyo SMS
└─ > 20%: SMS is primary channel
   └─ Strategy: Attentive (SMS-first) + email fallback
```

### Attentive: SMS-First Platform

**Positioning**: SMS powerhouse with email as fallback
- Focus: High SMS engagement, one-click checkout
- Strength: SMS feature depth (segmentation, A/B testing, MMS)
- Integration: Email lighter (don't expect Klaviyo sophistication)

**Core Features**:
- SMS messaging (text, MMS)
- SMS + email coordination (SMS primary, email fallback on optout)
- One-click checkout (mobile optimization)
- Keyword trigger-based campaigns (reply to SMS triggers email)
- SMS-specific A/B testing
- List management by SMS engagement

**Attentive SMS Advantages**:
- SMS-specific UX (easier than Klaviyo)
- Better SMS analytics and reporting
- SMS replay workflows (if customer doesn't click SMS, then email)

**When to Choose Attentive**:
- SMS ≥ 20% of email revenue
- Audience is mobile-first (retail, fashion)
- One-click checkout critical (conversion lift)
- SMS engagement tracking important

**Cost**: €500-2000/month (depends on SMS volume)

### Yotpo SMS: Bundled with Loyalty

**Positioning**: SMS within loyalty/reviews platform
- Part of Yotpo all-in-one (reviews + UGC + loyalty + SMS)
- SMS features lighter than Attentive
- Good if: Already using Yotpo for reviews/loyalty, SMS secondary

**When to Choose Yotpo SMS**:
- Already committed to Yotpo for reviews/loyalty
- Want single vendor (all in one)
- SMS volume low (< 50K/month)

**When NOT to Choose**:
- SMS is material channel (Attentive better)
- Need SMS-specific features (A/B test, segmentation)

---

## 3. Email vs SMS Split Strategy

**High-engagement brands** (SMS + email both needed):

### Option A: Klaviyo (Email) + Attentive (SMS)

**Architecture**:
```
Shopify → Klaviyo (email primary)
       → Attentive (SMS primary)
          ↓
       Email + SMS coordinated
       (if SMS optout, fallback to email)
```

**Advantages**:
- Best-in-class email (Klaviyo) + SMS (Attentive)
- Independent platforms, no compromises
- Each platform optimized for its channel

**Disadvantages**:
- Two platforms (integration overhead)
- Higher cost (€1000-2000/month for both)
- Customer data sync needed between platforms
- Coordination complexity (send email if SMS fails)

**Use when**: Email + SMS both > 10% of revenue, budget allows

### Option B: Klaviyo (Email + SMS)

**Architecture**:
```
Shopify → Klaviyo
         ├─ Email journeys
         └─ SMS (email fallback)
```

**Advantages**:
- Single platform (simpler integration)
- Unified customer view
- Coordinated email + SMS sequences

**Disadvantages**:
- SMS features less sophisticated than Attentive
- Email focus means SMS as afterthought
- Less SMS analytics detail

**Use when**: SMS < 20% of revenue, budget constrained, want single platform

---

## 4. Reviews, UGC & Loyalty: Bundling Strategy

**Core question**: Single bundled platform (Yotpo) or separate point solutions?

### Strategy A: Yotpo (All-in-One Bundling)

**What You Get**:
- **Reviews**: Collect, display, syndicate (Google, Facebook)
- **UGC**: Customer photos/videos from reviews
- **Loyalty**: Points, tiers, VIP programs, referral
- **SMS**: SMS messaging (basic)
- **Rewards**: Redeem points for discounts or free products

**Shopify Integration**:
- Native app with automatic sync
- Review request email/SMS (post-purchase)
- Loyalty program on product pages
- Points earned on purchase (automatic)
- Customer portal (manage loyalty, referral)

**Advantages**:
- Single vendor (one integration, one contract)
- Unified data model (customer view across reviews, UGC, loyalty)
- Bundle discount (cheaper than separate)
- Built-in feedback loops (reviews → product insights)

**Disadvantages**:
- **Jack-of-all-trades**: Reviews not as sophisticated as Bazaarvoice; UGC not as rich as Stackla; loyalty not as advanced as dedicated platform
- **Cost at scale**: Becomes expensive for large UGC volumes
- **Limited specialization**: If loyalty is critical, dedicated platform better
- **Vendor lock-in**: Hard to extract if want to switch one component

**Yotpo Pricing Model**:
```
Base: €100/month
+ per-review: €0.01-0.05/review
+ per-UGC item: €0.05-0.10
+ SMS: €0.01/message
Typical: €300-1500/month depending on volume
```

**When to Choose Yotpo**:
- Reviews + loyalty both important (not just one)
- Want single vendor
- Budget €300-800/month
- Early stage (volume < 500 reviews/month)
- UGC nice-to-have (not critical)

### Strategy B: Separate Point Solutions

**Architecture**:
```
Reviews: TrustPilot or Bazaarvoice
  ↓
UGC: Stackla or Taggbox
  ↓
Loyalty: Smile or Churn Buster
```

**Advantages**:
- **Best-in-class each category**: Each platform specialized
- **Customization**: Fine-tune each individually
- **Cost optimization**: Pay only for what you need
- **Flexibility**: Easy to swap platforms if needed

**Disadvantages**:
- **Multiple vendors**: Integration complexity
- **Data silos**: Reviews, UGC, loyalty not unified (need API calls)
- **Higher total cost**: Often > Yotpo if combining
- **Operational overhead**: Three vendor relationships, three contracts

**When to Choose Separate**:
- One category is critical (e.g., loyalty for subscription business)
- Volume high (Yotpo becomes expensive)
- Customization needed (Yotpo doesn't offer)
- Multi-year plan (separate easier to evolve/replace)

### Bundling Decision Matrix

| Scenario | Recommendation |
|----------|-----------------|
| **High volume (1000+ reviews/month)** | Separate (Yotpo too expensive) |
| **Loyalty critical to business** | Separate (dedicated loyalty better) |
| **Limited budget** | Yotpo (bundling discount) |
| **Early stage D2C** | Yotpo (simplicity) |
| **UGC user-generated (not synthetic)** | Separate (Stackla depth) |
| **Multiple brands** | Separate (easier to configure per brand) |
| **Conversion optimization focus** | Yotpo (easy A/B test reviews + loyalty) |

---

## 5. Personalization Engine Selection

**Where personalization sits**: Product discovery (search results), product pages, email, site navigation

### Bloomreach: Enterprise Personalization

**Positioning**: AI-powered personalization + search at scale
**Price**: €5000-20000/month (depends on volume)
**Best for**: 10K+ SKU, personalization ROI critical

**Core Features**:
- **Search**: ML-powered ranking (learns from clicks, conversions)
- **Personalization**: Behavior-based product recommendations
- **Merchandising**: AI-driven category organization
- **A/B Testing**: Multivariate testing (test ranking, recommendations)

**Shopify Integration**:
- Import product feed (catalog, prices, inventory)
- Embed search bar JavaScript
- Order feedback loop (clicks, conversions train ML)
- Personalization widget (JavaScript, GraphQL)

**When to Choose Bloomreach**:
- 10K+ SKU catalog
- Personalization ROI > €100K/year
- Complex ranking needs (seasonality, trending, profitability)
- A/B testing critical for conversion lift

### Nosto: Merchant-Friendly Personalization

**Positioning**: Easy personalization for mid-market
**Price**: €800-3000/month
**Best for**: 1K-10K SKU, faster implementation

**Core Features**:
- **Recommendations**: Personalized product recommendations
- **Product recommendations**: "Frequently bought together", trending
- **Email recommendations**: Personalized product feeds in email
- **Behavioral targeting**: Segment customers (new, repeat, at-risk)

**Shopify Integration**:
- Native Shopify app (automatic product sync)
- Lightweight JavaScript embed
- Minimal configuration needed
- Real-time analytics

**When to Choose Nosto**:
- 1K-10K SKU
- Want faster go-live (vs Bloomreach months)
- Budget < €3000/month
- Recommendations primary (not complex search ranking)

### Native Shopify Personalization

**What You Get**:
- Product Recommendations API (JavaScript)
- Metafield-based segmentation
- Basic theme-based personalization

**When to Use**:
- < 1K SKU
- Personalization experimental (don't want vendor)
- Budget zero (built into Shopify)

**Limitations**:
- No ML ranking
- No A/B testing
- Basic segmentation only

### Personalization Platform Decision Tree

```
SKU count?
├─ < 1K: Native Shopify sufficient
├─ 1K-10K: Nosto (ease + cost balance)
└─ > 10K: Bloomreach (sophistication needed)

Conversion optimization focus?
├─ Critical (CEO metric): Bloomreach (A/B testing, ML)
└─ Nice-to-have: Nosto (sufficient)

Time-to-value requirement?
├─ < 4 weeks: Nosto
└─ 8-12 weeks OK: Bloomreach
```

---

## 6. Marketing Data Flows

### Flow A: Customer & Event Lifecycle

```
Customer Journey:
├─ Signup
│  └─ Customer created → Klaviyo customer
│                     → Gorgias (context)
│                     → Analytics warehouse
├─ Browse
│  └─ Viewed product → Bloomreach/Nosto tracking
│                    → Klaviyo custom event
├─ Add to Cart
│  └─ Cart abandoned event → Klaviyo trigger
│                          → SMS trigger (Attentive)
├─ Purchase
│  └─ Order created → Klaviyo order event
│                   → Yotpo loyalty (points earned)
│                   → Analytics
│                   → Recharge (if subscription)
├─ Post-Purchase
│  └─ Order fulfilled → Klaviyo event
│                     → Yotpo review request (email/SMS)
│                     → Rebuy post-purchase upsell
└─ Support
   └─ Creates ticket → Gorgias
                     → Klaviyo notification
```

### Flow B: Closed-Loop: Email → Gorgias Support

```
Customer receives Klaviyo email:
├─ Clicks link → Conversion tracked
├─ Opens but no click → Winback campaign
└─ Doesn't open → Email reputation concern

Customer replies to email:
├─ Reply captured by Klaviyo
├─ Sent to Gorgias (unified inbox)
├─ Support agent responds
└─ Conversation tracked back to Klaviyo

Benefit: Support tied to marketing campaign
Example: Email about product → Customer confused → Support handles → Feedback to product team
```

### Flow C: Closed-Loop: Reviews → Email → Loyalty

```
Order fulfilled → Yotpo review request email sent
  ├─ Customer leaves review → Yotpo tracking
  │                         → Yotpo loyalty (points for review)
  │                         → Klaviyo custom event
  │                         → Email thank you (Klaviyo)
  └─ No review (3 days later) → Yotpo reminder email

Review published → Shopify product page shows review
  ├─ Other customers see review → Conversion lift
  ├─ Review rating impacts search ranking (Google)
  └─ Feedback to product team (low rating → quality issue?)

Example: Negative review detected (rating < 3)
  ├─ Alert product team
  ├─ Gorgias support reaches out
  ├─ Resolution offered (refund/replacement)
  └─ Customer satisfaction recovered
```

---

## 7. Segmentation Consistency Across Platforms

**Challenge**: Customer segmented as "VIP" in Yotpo; "high-value" in Klaviyo; "premium" in Gorgias → inconsistency

**Solution Framework**:

### Approach A: Single Source of Truth (Recommended)

**Implement**:
1. Define segments in one platform (usually data warehouse or Klaviyo)
2. Sync segment membership to other platforms via API
3. Other platforms read-only

**Example**:
```
Segment: VIP (spend > $1000, not churned)

Definition in Klaviyo:
  - Cohort: Customers with lifetime_value >= 1000
  - AND: Last purchase < 90 days ago

Sync to:
  - Yotpo: API PATCH customer with tag "vip"
  - Gorgias: Metafield "segment = vip"
  - Attentive: List "vip_customers"

Benefit: Single definition, consistent across platforms
```

### Approach B: Platform-Specific Segments

**Use when**: Platforms have different segmentation logic

**Example**:
```
Email segmentation (Klaviyo):
  - Engaged: Opened any email last 30 days
  - Churned: No purchase > 180 days

Support segmentation (Gorgias):
  - Priority: High lifetime value
  - At-risk: 3+ support tickets, low CSAT

These don't overlap → OK to define separately
```

### Approach C: Segment Naming Convention

**Establish standard across platforms**:
```
Segment naming: {dimension}_{value}
  - lifecycle_active
  - lifecycle_dormant
  - value_high
  - value_low
  - product_category_shoes
  - geography_eu

Benefits:
  - Consistent naming across platforms
  - Easy to understand
  - Machine-readable for automation
```

---

## 8. Data Sync Strategy

### Customer Data Master

**Question**: Where does customer master data live? (Email, phone, name, address, preferences)

**Option A: Shopify as Master**
```
Shopify Customer (master)
  ├─ Email, phone, address
  └─ Sync → Klaviyo, Gorgias, Yotpo, etc.

Best for: Shopify-primary businesses
Sync frequency: Real-time (webhooks) + daily reconciliation
```

**Option B: Klaviyo as Master**
```
Klaviyo (master)
  ├─ Email, phone, address, preferences
  └─ Sync → Shopify customer metafields

Best for: Email-driven marketing businesses
Issue: Harder to sync back to Shopify
```

**Option C: Unified Customer Platform (Segment, mParticle)**
```
Unified CDP (master)
  ├─ Customer ID, email, phone, attributes
  └─ Sync → Shopify, Klaviyo, Gorgias, Attentive

Best for: Complex multi-channel operations
Cost: €2K-10K/month additional
ROI: Clear customer view across all platforms
```

**Recommendation**: Start with Shopify as master (simpler); upgrade to CDP if multi-channel complexity demands.

---

## 9. Marketing Stack Checklist

Before committing to stack:

- [ ] Email platform chosen (Klaviyo primary choice)
- [ ] SMS strategy defined (Klaviyo SMS vs Attentive)
- [ ] SMS budget determined (if material channel)
- [ ] Personalization platform selected (Nosto vs Bloomreach vs native)
- [ ] Reviews/UGC/Loyalty decision made (Yotpo vs separate)
- [ ] Segment definitions documented
- [ ] Data sync frequency defined (real-time vs batch)
- [ ] Customer master data source identified
- [ ] Closed-loop patterns documented (email → support, review → email, etc.)
- [ ] Integration priorities sequenced (email first, then SMS, then personalization)
- [ ] Budget approved (total stack cost €800-5K/month typical)
- [ ] Training plan for marketing team
- [ ] Success metrics defined (email open rate, SMS engagement, customer lifetime value)
