# Step 3: Data Architecture Design

## Objective

Define data ownership model, customer identity strategy, and foundational data architecture principles. Establish which system is authoritative for each major data entity.

## Instructions

### Data Ownership Matrix

For each major data entity, define:
1. **Authoritative system** (which system owns/masters this data)
2. **Primary purpose** (why we track this data)
3. **Key attributes** (what fields are included)
4. **Sync pattern** (how it flows to other systems)
5. **Uniqueness** (how records are identified)

Create matrix for all major entities:

**Customer/Contact Data**:
- Authoritative system: [CRM, CDP, Shopify, or other]
- Primary purpose: Customer lifecycle management, segmentation, personalization
- Key attributes: Email, phone, shipping address, billing address, customer type, segment, preferences
- Sync pattern: [One-way to non-authoritative systems | Bi-directional | Other]
- Unique identifier: [Email | ID | Phone | Other]

**Product/Catalog Data**:
- Authoritative system: [PIM, Shopify, or hybrid]
- Primary purpose: Product information, content, pricing, variants
- Key attributes: SKU, title, description, pricing, inventory, images, specifications
- Sync pattern: [One-way from PIM to Shopify | Other]
- Unique identifier: [SKU | Product ID | Other]

**Order/Transaction Data**:
- Authoritative system: [Shopify, OMS, or other]
- Primary purpose: Order management, fulfillment, financial reporting
- Key attributes: Order ID, customer, items, total, shipping, payment, status
- Sync pattern: [One-way to downstream systems | Other]
- Unique identifier: [Order ID]

**Inventory/Stock Data**:
- Authoritative system: [Inventory system, Shopify, or warehouse system]
- Primary purpose: Stock management, fulfillment, availability
- Key attributes: SKU, location, quantity, reserved, available
- Sync pattern: [Real-time | Batch | Other]
- Unique identifier: [SKU + Location]

**Segment/Audience Data**:
- Authoritative system: [CDP, marketing platform, or other]
- Primary purpose: Customer segmentation, targeting, marketing automation
- Key attributes: Segment name, member list, rules, refresh frequency
- Sync pattern: [Push from CDP to targets | Other]
- Unique identifier: [Segment ID]

[Define additional entities as needed: Inventory, Financial, Marketing Metrics, etc.]

### Customer Identity & Resolution Strategy

**Primary Identity Resolution Challenge**:
- How do we uniquely identify the same customer across all systems?
- Example: Email in CRM, customer_id in Shopify, leadid in CDP - how do these link?

**Customer Identity Resolution Approach**:

Option 1: **Email as Universal Key**
- All systems use email as primary customer identifier
- Pros: Universal, customer-controlled, human-readable
- Cons: Email can change, case sensitivity issues, validation needed
- Implementation: Normalize email, handle duplicates via fuzzy matching

Option 2: **Dedicated Identity Service**
- Separate system maintains canonical customer ID
- Maps this ID across all other systems
- Pros: Flexible, handles complex scenarios, system-agnostic
- Cons: Additional platform, operational overhead

Option 3: **PII Tokenization**
- Hash email/phone to create stable identifier
- All systems reference the token
- Pros: Privacy-preserving, stable
- Cons: Can't query back to PII, limited use cases

Option 4: **API-Based Identity Lookup**
- At runtime, query identity service to map IDs
- No need to replicate keys everywhere
- Pros: Flexible, real-time, centralized
- Cons: Performance overhead, dependency on service

**Recommended Approach**: [Select and explain]

**Implementation Details**:
- How customer records will be matched across systems
- Handling of unmatched/orphaned records
- Duplicate resolution process
- Conflict resolution if customer exists in multiple systems

### Data Integration Principles

Define foundational principles for all data integration:

**1. Data Quality Standards**
- Required fields: [Fields that must always be populated]
- Valid values: [Validation rules, enums, formats]
- Completeness target: [% of records that must have all required fields]
- Freshness: [Maximum acceptable data age before sync required]

**2. Data Governance**:
- Who can modify each data entity?
- Approval workflows needed?
- Audit trail requirements?
- Access controls and privacy?

**3. Error Handling**:
- What happens when data sync fails?
- Retry logic? Exponential backoff?
- Failed record handling (dead letter queue)?
- Human intervention process?

**4. Data Transformation**:
- Which system performs transformations?
- Standard transformation library?
- Custom mappings by integration?

**5. Reconciliation & Monitoring**:
- How do we detect sync failures or data drift?
- Reconciliation frequency (hourly, daily, weekly)?
- Monitoring and alerting thresholds?
- Reporting on data health?

## Inputs

- Platform selections and roles
- Business requirements for data (what data is critical)
- Organizational data governance policies
- Privacy and compliance requirements

## Outputs

- Data ownership matrix for all major entities
- Customer identity resolution strategy and implementation
- Data integration principles and standards
- Data governance policies
- Data quality standards

## Completion Criteria

- Data ownership defined for all major entities
- Authoritative system clear for each entity
- Customer identity/resolution strategy decided
- Data integration principles documented
- Data governance framework established
- Business and technical stakeholders agree
