---
canonicalId: dept-shopify-data-flows
name: "Shopify Ecosystem Data Flows"
description: "Data synchronization patterns for product master data, customers, orders, reviews, and events across the Shopify ecosystem."
domain: shopify-ecosystem
category: reference
---

# Shopify Ecosystem Data Flows

**Entry Point**: `dept-shopify-data-flows`

Reference guide for data flows across the Shopify ecosystem. Maps how product data, customer data, orders, and behavioral events flow between platforms. Includes timing considerations, common pitfalls, and solutions.

## What This Skill Does

Provides:
- Product master data sync flows (simple and PIM-complex)
- Customer data and event unified profile flows
- Order lifecycle flows (simple and complex with subscriptions/returns)
- Search and personalization data flows
- Review and UGC ecosystem flows
- Event mapping examples and timing
- Critical sync points and latency considerations

## When To Use It

- Designing data architecture for Shopify ecosystem
- Troubleshooting data inconsistencies or sync failures
- Understanding timing and latency implications
- Planning data warehouse or analytics setup
- Documenting data lineage and dependencies

## Inputs

Platform stack, data sensitivity, reporting requirements, SLA targets.

## Key Concepts

---

## 1. Product Master Data Flow

### Scenario A: Simple Flow (No PIM)

**Architecture**: Shopify as source of truth → downstream platforms read-only

```
Shopify Admin
  ├─ Product created/updated
  └─ Webhook: product.created, product.updated
      ├─ Klaviyo: Import product catalog (for recommendations)
      ├─ Bloomreach/Nosto: Import product feed (for search/personalization)
      ├─ Gorgias: Import products (for support context)
      ├─ Email: Sync product images (for dynamic product recommendations)
      └─ Analytics: Sync product attributes (for reporting)
```

**Data Mapping**:
```json
Shopify Product:
{
  "id": 12345,
  "title": "T-Shirt",
  "handle": "t-shirt",
  "vendor": "Acme",
  "productType": "Apparel",
  "tags": ["mens", "summer"],
  "status": "active",
  "publishedAt": "2024-01-01T00:00:00Z",
  "variants": [
    {
      "id": 67890,
      "sku": "SHIRT-XS-BLUE",
      "title": "XS / Blue",
      "price": "29.99",
      "inventory_quantity": 50
    }
  ],
  "images": [
    {
      "src": "https://cdn.shopify.com/...",
      "alt": "Blue T-Shirt"
    }
  ]
}

Transforms to:

Klaviyo Product:
{
  "ProductID": "shopify_12345",
  "Title": "T-Shirt",
  "Description": "[from body_html]",
  "Images": ["https://..."],
  "Price": "29.99",
  "Categories": ["Apparel", "mens", "summer"]
}

Bloomreach Product Feed (CSV):
ProductID,Name,Description,Url,Image,Price,Availability
shopify_12345,T-Shirt,Blue T-Shirt,...,http://...,29.99,In Stock
```

**Timing**:
- Webhook fired: Immediate (< 1 second)
- Processed in middleware: 1-5 seconds
- Available in downstream: 2-10 seconds
- Visible in search results: 5-30 minutes (depends on crawler)

**Gotchas**:
- Images not included in webhook payload (fetch separately)
- Variant availability not in product webhook (fetch from inventory API)
- Product publish/unpublish not always in webhook (use polling)

---

### Scenario B: PIM-Complex Flow (Akeneo as Master)

**Architecture**: Akeneo as source of truth → Shopify receives product data → downstream platforms read from Shopify

```
Akeneo (Master)
  ├─ Product family defined
  ├─ Attributes assigned (description, images, specs)
  ├─ Variants created (size/color combinations)
  └─ Publish → Shopify
      └─ Sync Engine
          ├─ Create/update Shopify product
          ├─ Create/update Shopify variants (map PIM variants)
          ├─ Sync images (asset URLs)
          ├─ Map attributes to metafields (specs, handling)
          └─ Trigger Shopify webhooks
              ├─ Downstream: Klaviyo, Bloomreach, etc. (same as Scenario A)
```

**Data Mapping Complexity**:
```
Akeneo Product Family:
{
  "code": "TSHIRT",
  "attributes": {
    "name": "T-Shirt",
    "description": "Classic cotton tee",
    "color_family": ["Blue", "Red", "Black"],
    "size_scale": ["XS", "S", "M", "L", "XL"],
    "material": "100% Cotton",
    "care_instructions": "Wash cold, tumble dry"
  },
  "variants": [
    {
      "code": "TSHIRT-XS-BLUE",
      "values": {
        "size": "XS",
        "color": "Blue",
        "sku": "TSHIRT-XS-BLUE"
      }
    },
    // ... more variants
  ]
}

Transforms to Shopify:
{
  "product": {
    "title": "T-Shirt",
    "body_html": "Classic cotton tee",
    "vendor": "Acme",
    "metafields": [
      {
        "key": "material",
        "value": "100% Cotton"
      },
      {
        "key": "care_instructions",
        "value": "Wash cold, tumble dry"
      }
    ],
    "variants": [
      {
        "option1": "XS",
        "option2": "Blue",
        "sku": "TSHIRT-XS-BLUE"
      },
      // ... more variants
    ]
  }
}
```

**Variant Mapping Decisions**:
- PIM "size" + "color" dimensions → Shopify options "Size" + "Color"
- PIM variant code → Shopify variant SKU
- PIM images → Shopify product image gallery
- PIM attributes → Shopify metafields (for non-standard attributes)

**Timing**:
- PIM publish → Akeneo API webhook: < 1 second
- Middleware processes: 2-5 seconds
- Shopify product updated: 2-5 seconds
- Variants created: 3-10 seconds
- Downstream systems sync: 5-60 seconds
- Search index updated: 30 minutes - 24 hours

**Gotchas**:
- Variant limit: Shopify max ~100 variants per product (if PIM has 500, split into linked products)
- Attribute translation: Akeneo attributes must map to Shopify fields or metafields (no 1:1 mapping)
- Image sync timing: Upload assets before product create or use async image sync
- Publish workflow: Test in Akeneo first, then publish to Shopify (not vice versa)

---

## 2. Customer Data & Event Unified Profile

### Data Sources & Synthesis

**Customer data originates from**:
```
Shopify Customer
  ├─ Email
  ├─ Phone
  ├─ Address
  ├─ Tags
  └─ Metadata

Unified Customer Profile:
  ├─ Shopify data (core)
  ├─ + Klaviyo data (email engagement)
  ├─ + Gorgias data (support history)
  ├─ + Yotpo data (reviews written)
  ├─ + Recharge data (subscription status)
  ├─ + Bloomreach data (search behavior)
  └─ + Custom events (tracked via SDK)
```

### Flow: Customer Creation

```
Customer signs up on Shopify storefront:
├─ POST Storefront API (create customer)
├─ Shopify creates customer record
├─ Shopify fires webhook: customer.created
│  ├─ Klaviyo receives webhook
│  │  └─ Creates Klaviyo customer (email)
│  ├─ Gorgias receives webhook
│  │  └─ Stores customer (for support context)
│  ├─ Analytics warehouse receives webhook
│  │  └─ Stores customer record (for reporting)
│  └─ Email system receives webhook
│     └─ Stores email address (for sync status)
└─ Customer can now receive email, support, etc.
```

**Timing**:
- Customer created: Immediate
- Webhook fired: < 1 second
- Klaviyo customer available: 1-5 seconds
- Gorgias customer available: 1-5 seconds
- Visible in email send: 5-30 seconds

**Gotcha: Customer Merge**
- Problem: john@gmail.com signs up; later john@work.com signs up (same person)
- System sees 2 customers, 2 Klaviyo profiles, duplicate email
- Solution: Manual merge (Shopify merge customer), re-sync to downstream

### Flow: Behavioral Events (Engagement Signals)

```
Customer browses → Viewed product event
├─ JavaScript SDK fires
├─ POST /events (Bloomreach)
├─ POST /events (Klaviyo)
├─ POST /events (Analytics)
└─ Used for: Personalization, recommendations, analytics

Customer adds to cart → Add-to-cart event
├─ JavaScript SDK fires
├─ POST /events (all platforms)
├─ Triggers: Abandoned cart email (if not purchased)
├─ Triggers: Attentive SMS (if enrolled)

Customer completes purchase → Order created event
├─ Shopify fires: order.created webhook
├─ Klaviyo receives: Creates order object, triggers campaign
├─ Yotpo receives: Schedules review request email
├─ Gorgias receives: Stores order (support context)
├─ Recharge receives: If subscription, updates subscription status
├─ Analytics receives: Revenue event
```

**Event Mapping**:
```
Event: customer.created
├─ Shopify webhook
├─ Payload: customer_id, email, phone, first_name, last_name
├─ Consumed by: Klaviyo, Gorgias, Analytics, CRM

Event: add_to_cart (custom)
├─ JavaScript SDK
├─ Payload: customer_id, product_id, quantity, price
├─ Consumed by: Bloomreach, Klaviyo, Analytics

Event: order.created
├─ Shopify webhook
├─ Payload: order_id, customer_id, items[], total, created_at
├─ Consumed by: Klaviyo, Yotpo, Gorgias, Recharge, Analytics

Event: order.fulfilled
├─ Shopify webhook
├─ Payload: order_id, customer_id, items[], fulfilled_at
├─ Consumed by: Yotpo (review request), Gorgias (fulfillment update)
```

---

## 3. Order Lifecycle Flow

### Simple Order (One-Time Purchase)

```
Customer purchases:
  ├─ Shopify: Order created
  │  └─ order.created webhook
  │     ├─ Klaviyo: Create order, store items, customer
  │     ├─ Gorgias: Store order (support context)
  │     ├─ Rebuy: One-time post-purchase upsell offer
  │     ├─ Analytics: Revenue event
  │     └─ Recharge: Skip (if Recharge only for subscriptions)
  │
  ├─ Fulfillment: Order packed and shipped
  │  └─ order.fulfilled webhook
  │     ├─ Yotpo: Trigger review request email (3 days post-delivery)
  │     ├─ Gorgias: Update support context (fulfillment status)
  │     ├─ Analytics: Fulfillment event
  │     └─ Klaviyo: Maybe trigger post-purchase email sequence
  │
  └─ Return (if customer initiates):
     └─ Loop or Swap handles returns
        ├─ Shopify: Refund created (via Loop webhook)
        ├─ Inventory: Restore stock
        ├─ Accounting: Record refund
        └─ Gorgias: Log return (support context)

Timeline:
├─ Order created: T+0
├─ Fulfillment: T+2 days (processing, packing, shipping)
├─ Delivery: T+5 days (typical)
├─ Review request: T+8 days (3 days post-delivery)
├─ Return window: T+30 days (30-day window)
└─ Refund completed: T+35 days (refund processing)
```

### Complex Order (Subscription + One-Time)

```
Customer subscribes + one-time purchase:
  ├─ Recharge: Subscription created
  │  ├─ Sync to Shopify (order tagged as subscription)
  │  └─ Webhook to downstream (Klaviyo, Gorgias)
  │
  ├─ Shopify: Order created (subscription fulfillment)
  │  └─ order.created webhook
  │     ├─ Klaviyo: Order with subscription tag
  │     ├─ Yotpo: Maybe skip review request (subscription fatigue)
  │     ├─ Recharge: Knows this is subscription order
  │     └─ Fulfillment: Route to subscription warehouse
  │
  ├─ One-time purchase (separate):
  │  └─ order.created webhook (separate order)
  │     ├─ Klaviyo: Standard order (review-eligible)
  │     ├─ Yotpo: Review request
  │     └─ Fulfillment: Route to standard warehouse
  │
  ├─ Recurring fulfillment (every X days):
  │  └─ Recharge triggers order creation in Shopify
  │     ├─ Shopify: order.created for subscription renewal
  │     ├─ Klaviyo: Track subscription order separately
  │     └─ Fulfillment: Route to subscription warehouse
  │
  └─ Churn risk (customer pauses subscription):
     └─ Recharge webhook: subscription.paused
        ├─ Klaviyo: Stop subscription campaigns, start winback
        ├─ Gorgias: Flag customer (support alert)
        └─ Analytics: Track pause reason

Gotchas:
├─ Subscription order tagging inconsistent (Recharge vs Shopify)
├─ Inventory allocated to subscription, not available one-time
├─ Duplicate customer if multiple emails registered
└─ Refund initiated in Shopify doesn't cancel subscription (manual action needed)
```

---

## 4. Search & Personalization Data Flow

### Feed-Based Synchronization

**Bloomreach/Nosto receive product feed**:

```
Shopify products:
├─ Daily CSV export (or API crawl)
└─ Transform to search feed format:

ProductID,Name,Description,Url,Image,Price,Availability,Categories,Tags
123,T-Shirt,Blue cotton tee,/products/t-shirt,http://...,29.99,In Stock,Apparel|Mens,summer,new
124,Hoodie,Cozy sweatshirt,/products/hoodie,http://...,49.99,In Stock,Apparel|Mens,winter

Feed consumed by:
├─ Bloomreach: Indexes for search ranking
├─ Nosto: Trains recommendation model
└─ Google Shopping: Feed for Google Merchant Center

Timing:
├─ Feed generated: T+0
├─ Uploaded to platform: T+5 minutes
├─ Indexed for search: T+30 minutes (Bloomreach), T+5 minutes (Nosto)
├─ Visible in search: T+45 minutes
└─ Search ranking reflects feed: T+24 hours (ML model retrains daily)
```

### Behavioral Event Flow (Real-Time)

**User interactions feed ML models**:

```
Customer searches "blue shirt":
├─ Bloomreach receives search event
│  ├─ Log: customer_id, query, timestamp, results clicked
│  └─ Used for: Ranking optimization (which products clicked?)
│
Customer views product page:
├─ Bloomreach receives view event
│  ├─ Log: customer_id, product_id, view time
│  └─ Used for: Personalization (show similar products)
│
Customer clicks search result:
├─ Bloomreach receives click event
│  ├─ Log: product_id, rank position, clicked (Y/N)
│  └─ Used for: Ranking feedback (rank position X → 40% click rate)
│
Customer makes purchase:
├─ Bloomreach receives conversion event (via Shopify webhook or pixel)
│  ├─ Log: product_id, price, customer_segment
│  └─ Used for: Revenue-weighted ranking (product more profitable?)
```

**Machine Learning Retraining**:
```
Daily retraining cycle:
├─ T+00:00: Collect events from yesterday
├─ T+01:00: Aggregate search queries, clicks, conversions
├─ T+02:00: Retrain ranking model
├─ T+03:00: Deploy new rankings to production
├─ T+04:00: New rankings live for today's searches

Impact:
├─ Seasonal trends detected: 3-5 days
├─ Product quality issues: 1-2 days (if high click-through drop)
├─ Ranking manipulation/gaming: Flagged if anomaly detected
└─ Ranking improvements: 2-5% lift per week (typical)
```

---

## 5. Review & UGC Ecosystem Flow

### Review Request & Collection

```
Order fulfilled (T+0):
├─ Yotpo receives order.fulfilled webhook
├─ Schedule review request email (T+3 days post-delivery)
│
Review request email sent (T+3 days):
├─ Customer receives: "Please review your recent purchase"
├─ Click → Yotpo review form (pre-filled with order items)
├─ Submit review → Yotpo stores review
│
Review moderation (T+4 days):
├─ Yotpo checks for spam, profanity, authenticity
├─ Review approved or rejected
├─ If approved: Synced to Shopify product page
│
Review published (T+5 days):
├─ Shopify product page shows review + rating
├─ Customer sees review rating (social proof)
├─ Conversion lift (typically 5-15% from reviews)
│
Review syndication (T+7 days):
├─ Yotpo syncs approved reviews to:
│  ├─ Google Shopping (review stars in search results)
│  ├─ Google Local (if local business)
│  ├─ Facebook (social proof)
│  └─ TrustPilot (multi-channel visibility)
```

### UGC Collection

```
Review contains user-generated content (photo):
├─ Yotpo extracts photo from review
├─ Tag with: customer name, product, rating
├─ Photo added to UGC gallery
│
UGC displayed on:
├─ Product page (photo grid below reviews)
├─ Email (dynamic email with customer photos)
├─ Social media (Yotpo feed embeddable on website)
│
UGC engagement:
├─ Customer sees their photo on site → social proof
├─ Other customers see UGC → drives conversion
├─ Marketing uses UGC in campaigns (pre-approval needed)
```

### Loyalty Integration (if using Yotpo)

```
Review submitted:
├─ Customer earns points (e.g., 10 points)
├─ Yotpo updates loyalty account balance
├─ Customer sees "You earned 10 points"
│
Customer redeems points:
├─ Chooses reward (e.g., $5 off next purchase)
├─ Yotpo generates discount code
├─ Code redeemable in Shopify checkout
├─ Conversion lift (loyalty retention 15-25% higher)
```

---

## 6. Event Mapping Examples

### Standard Shopify Webhooks

| Webhook | Timing | Payload | Consumers |
|---------|--------|---------|-----------|
| `customer.created` | Immediate | email, phone, name | Klaviyo, Gorgias, Analytics |
| `customer.updated` | Immediate | email (new), phone (new) | Klaviyo, Gorgias, Analytics |
| `product.created` | Immediate | title, handle, variants, images | Klaviyo, Bloomreach, Nosto, Analytics |
| `product.updated` | Immediate | updated fields only | All platforms (delta sync) |
| `order.created` | Immediate | order_id, customer_id, items, total | Klaviyo, Yotpo, Gorgias, Recharge, Analytics |
| `order.fulfilled` | On fulfillment | order_id, fulfilled items | Yotpo (review request), Gorgias, Analytics |
| `order.refunded` | On refund | refund_id, items, amount | Gorgias, Analytics, Accounting |
| `inventory_items.update` | On inventory change | quantity_available | PIM (if sync back), Analytics |

### Custom Events (JavaScript)

```javascript
// Add-to-cart event
analytics.track('add_to_cart', {
  product_id: 'shopify_123',
  sku: 'SHIRT-XS-BLUE',
  name: 'T-Shirt',
  price: 29.99,
  quantity: 1,
  timestamp: new Date().toISOString()
});
// Sent to: Klaviyo, Bloomreach, Analytics

// Search event
analytics.track('search', {
  query: 'blue shirt',
  results_count: 45,
  timestamp: new Date().toISOString()
});
// Sent to: Bloomreach, Analytics

// Product view event
analytics.track('view_item', {
  product_id: 'shopify_123',
  sku: 'SHIRT-XS',
  view_time_seconds: 45,
  timestamp: new Date().toISOString()
});
// Sent to: Bloomreach, Nosto, Analytics
```

---

## 7. Critical Sync Points & Timing Considerations

### Sync Latency SLA Targets

| Data Type | Target Latency | Impact |
|-----------|-----------------|--------|
| **Product data** | < 5 minutes | Search indexing, personalization |
| **Customer data** | < 30 seconds | Email deliverability, support context |
| **Order data** | < 1 second | Fulfillment routing, email triggers |
| **Inventory updates** | < 2 minutes | Overselling prevention, search OOS status |
| **Review data** | < 24 hours | Social proof display, conversion impact |
| **Loyalty points** | < 5 minutes | Customer engagement, redemption |

### Timing Dependencies (Must Happen in Order)

```
PIM Sync Sequence (Critical Path):
├─ Step 1: Product created (Akeneo)
├─ Step 2: Images uploaded (asset sync)
├─ Step 3: Product synced to Shopify
│  └─ Wait: Shopify product API confirms create
├─ Step 4: Variants created (linked to product from Step 3)
│  └─ Wait: Shopify variant API confirms create
├─ Step 5: Inventory synced
├─ Step 6: Shopify webhooks fired (product.created, variants added)
│  └─ Wait: Webhooks processed by downstream
└─ Step 7: Available in search, Klaviyo, etc.

If Step 4 before Step 3 completes → Variant orphaned (product doesn't exist)
If Step 5 before Step 4 → Inventory attached to wrong variant
```

### Common Timing Pitfalls

**Pitfall 1: Inventory overselling**
- Problem: Inventory updated in PIM; 2-minute sync delay; customer purchases in Shopify before sync
- Solution: Shopify as inventory source of truth, not PIM; PIM syncs to Shopify every 30 seconds

**Pitfall 2: Email campaign timing**
- Problem: Customer purchases; order event arrives after email campaign already sent
- Solution: Email campaigns triggered on order confirmation webhook (not polling)

**Pitfall 3: Search result stale**
- Problem: Product price reduced; customer searches; old price still shown (24h index lag)
- Solution: Nosto (real-time) better than Bloomreach (daily reindex); accept staleness or use real-time API

**Pitfall 4: Refund loop**
- Problem: Refund initiated in Shopify; subscription app doesn't see refund for 1 hour; issues second refund
- Solution: Explicit refund orchestration with status tracking (prevent duplicate refunds)

---

## 8. Data Warehouse Integration

### Recommended Data Model

```
Fact tables:
├─ orders_fact (grain: order)
│  ├─ order_id, customer_id, order_date, revenue, order_source
│  ├─ Synced from: Shopify order.created webhook
│  └─ Updated: On order.fulfilled, order.refunded
│
├─ order_items_fact (grain: order line item)
│  ├─ order_id, product_id, sku, quantity, price, revenue
│  ├─ Synced from: Shopify order items
│  └─ Used for: Product revenue analysis, LTV by product
│
├─ customer_events_fact (grain: event)
│  ├─ customer_id, event_type, timestamp, properties (JSON)
│  ├─ Synced from: JavaScript tracking, webhooks
│  └─ Used for: Funnel analysis, cohort analysis, retention
│
└─ reviews_fact (grain: review)
   ├─ review_id, customer_id, product_id, rating, text, created_date
   ├─ Synced from: Yotpo API daily
   └─ Used for: Product quality tracking, sentiment analysis

Dimension tables:
├─ customers_dim
│  ├─ customer_id, email, phone, name, city, country
│  ├─ lifetime_value, acquisition_channel, last_order_date
│  ├─ Synced from: Shopify (daily)
│  └─ Enhanced with: Klaviyo engagement metrics, Gorgias support tickets
│
└─ products_dim
   ├─ product_id, sku, name, category, vendor, price
   ├─ average_rating, review_count
   ├─ Synced from: Shopify (daily) + Yotpo (daily)
   └─ Enhanced with: PIM attributes (material, specs)
```

---

## 9. Data Sync Validation Checklist

Before pushing to production:

- [ ] All required fields present in sync payload
- [ ] Timestamps in UTC (not local time)
- [ ] IDs map correctly (Shopify IDs → Platform IDs)
- [ ] Data types correct (email as string, price as decimal)
- [ ] Null values handled (skip or default?)
- [ ] Large data (images, descriptions) streaming (not in webhook)
- [ ] Retry logic tested (simulate API timeout)
- [ ] Deduplication logic tested (same event sent twice)
- [ ] Order of operations validated (no dependent steps out-of-order)
- [ ] Reconciliation job validates data consistency
