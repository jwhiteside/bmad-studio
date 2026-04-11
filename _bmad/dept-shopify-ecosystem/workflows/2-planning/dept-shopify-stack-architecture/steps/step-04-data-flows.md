# Step 4: Data Flow Mapping

## Objective

Map all significant data flows between platforms in the ecosystem. Document what data moves where, how often, and what transformations occur.

## Instructions

For each data flow, document:

### Data Flow Template

**Flow Name**: [Descriptive name for this flow]

**Source System**: [Where data originates]
**Destination System(s)**: [Where data is sent]

**Data Entities**:
- [Entity 1]: Description of what's included
- [Entity 2]: Description of what's included

**Sync Pattern**:
- Type: [Real-time | Near real-time (minutes) | Hourly | Daily | On-demand]
- Direction: [Unidirectional | Bidirectional | Selective]
- Frequency: [Every X minutes/hours/days]

**Data Mapping**:
| Source Field | Source System | Transform | Destination Field | Destination System |
|---|---|---|---|---|
| customer_id | Shopify | None | customer_id | CRM |
| email | Shopify | Lowercase | email | CRM |

**Transformation Logic**:
- [Describe any business logic applied]
- [How conflicts are resolved]
- [How null/missing values are handled]

**Uniqueness & Identity**:
- How records are matched: [Email | ID | Multi-field key]
- Duplicate handling: [How duplicates are identified and resolved]

**Volume & Performance**:
- Expected record volume: [X per sync interval]
- Expected data size: [X MB per sync]
- Acceptable latency: [X minutes]
- Error rate tolerance: [X%]

**Error Handling**:
- On sync failure: [Retry policy, notification, etc.]
- On validation failure: [What happens to invalid records]
- Conflict resolution: [If both systems updated simultaneously]

**Monitoring & SLA**:
- How is sync monitored?
- Alert if: [Sync fails, lag exceeds X, error rate exceeds Y]
- SLA: [Uptime target, RTO/RPO]

---

### Core Data Flows to Map

**Flow 1: Product Master Data**
- Source: [PIM, Shopify, or other]
- Destination: Shopify storefront, marketplaces, other sales channels
- Frequency: [Real-time | Hourly]
- Entities: Products, variants, pricing, inventory, images, descriptions

**Flow 2: Customer/Order Master Data**
- Source: Shopify
- Destination: CRM, CDP, accounting system, analytics
- Frequency: [Real-time | Hourly]
- Entities: Customer info, orders, fulfillment status, payments

**Flow 3: Customer Segments/Audiences**
- Source: CDP or marketing platform
- Destination: Shopify, email marketing, ads platforms
- Frequency: [Daily | Weekly]
- Entities: Segment membership, attributes, rules

**Flow 4: Inventory/Stock**
- Source: Inventory system or warehouse system
- Destination: Shopify, order management, analytics
- Frequency: [Real-time | Hourly]
- Entities: Available quantity, reserved, location

**Flow 5: Enrichment Data**
- Source: PIM, data enrichment services
- Destination: Shopify, marketing platforms
- Frequency: [On-demand | Weekly]
- Entities: Product descriptions, images, specifications

[Document additional flows specific to the business]

---

### Data Flow Complexity Assessment

For each flow, assess complexity (1-5):

| Flow | Entities | Transformation | Volume | Frequency | Complexity |
|---|---|---|---|---|---|
| [Flow] | [#] | [Simple/Complex] | [Vol] | [Freq] | [1-5] |

---

### Data Flow Dependencies

Document which flows must complete before others:

```
Flow A (Product Master) ──┐
                          ├──> Flow E (Inventory)
Flow B (Inventory) ───────┘

Flow C (Orders) ───────> Flow D (Financial Reporting)
```

**Critical Path**: Which flows are on the critical path to business operations?

**Non-Blocking Flows**: Which flows can fail without blocking business?

---

### Data Architecture Diagram

Create visual representation of all data flows:

```
┌──────────┐
│   PIM    │── productos──┐
└──────────┘              │
                          ▼
                    ┌──────────────┐
                    │ Shopify Plus │──────customer/orders────┐
                    └──────────────┘                         │
                          ▲                                   ▼
                          │                            ┌──────────────┐
                          │                            │   CRM        │
                     inventory              enrichment └──────────────┘
                          │                                   ▲
┌──────────┐              │                    segments       │
│ Inventory│──────────────┘                           │       │
│ System   │                                          ▼       │
└──────────┘                                    ┌──────────────┐
                                                │ CDP / Email  │
                                                │ Marketing    │
                                                └──────────────┘
```

## Inputs

- Platform selections and architecture pattern
- Data ownership matrix (from Step 3)
- Business requirements (volume, latency, data freshness)
- Existing integrations documentation (if applicable)

## Outputs

- Data flow specifications for all flows
- Data flow complexity assessment
- Data flow dependency map
- Data architecture diagram
- Data flow SLA and monitoring requirements

## Completion Criteria

- All significant data flows mapped
- Data mapping documented for each flow
- Transformation logic specified
- Error handling and conflict resolution defined
- Data flow SLAs and monitoring established
- Architecture diagram visualizes all flows
- Team validates completeness and accuracy
