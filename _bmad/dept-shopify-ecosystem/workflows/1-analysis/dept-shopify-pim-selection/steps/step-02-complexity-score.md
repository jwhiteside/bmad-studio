# Step 2: PIM Complexity Scoring

## Objective

Calculate a quantitative PIM complexity score (0-100) based on product portfolio characteristics. This score helps determine whether a dedicated PIM is necessary and which platforms can handle the complexity.

## Instructions

Score each category below on a 1-5 scale, then calculate weighted total.

### Scoring Categories

#### 1. SKU Complexity (Weight: 20%)

**SKU Count & Variants Score**:
- 1: <500 SKUs, <2 variants per product
- 2: 500-2,000 SKUs, 2-5 variants per product
- 3: 2,000-10,000 SKUs, 5-20 variants per product
- 4: 10,000-50,000 SKUs, 20-100 variants per product
- 5: >50,000 SKUs, >100 variants per product

#### 2. Attribute Complexity (Weight: 15%)

**Number of Product Attributes & Customization**:
- 1: <10 attributes (basic: name, desc, price, image)
- 2: 10-20 attributes (standard: specs, categories, tags, reviews)
- 3: 20-50 attributes (rich: multi-language, rich media, SEO data)
- 4: 50-100 attributes (advanced: warehouse attributes, supplier data, certifications)
- 5: >100 attributes or highly custom attribute system

#### 3. Data Enrichment Needs (Weight: 15%)

**Digital Asset & Rich Media Requirements**:
- 1: Text and basic images only
- 2: Multiple images and simple rich content
- 3: Images, PDFs, specs, basic videos
- 4: Video, 3D models, interactive content, multi-language assets
- 5: Extensive video, 3D models, AR/VR content, high-resolution requirements

#### 4. Channel & Market Complexity (Weight: 15%)

**Multi-Channel & Multi-Market Requirements**:
- 1: Single channel, single market
- 2: 2-3 channels, single market
- 3: 3-5 channels, 2-5 markets
- 4: 5+ channels, 5-10 markets with localization
- 5: 10+ channels/markets with complex localization and channel-specific assortments

#### 5. Data Governance & Workflow (Weight: 15%)

**Governance Complexity & Workflow Requirements**:
- 1: Simple: centralized data, minimal approval workflow, infrequent updates
- 2: Moderate: some decentralization, basic approval workflow
- 3: Complex: decentralized teams, multi-level approval, audit trails needed
- 4: Highly complex: federated governance, complex rules, compliance requirements
- 5: Enterprise: strict governance, complex rules, regulatory compliance, complex syncing

#### 6. Team & Technical Capability (Weight: 10%)

**Team Size & Technical Sophistication**:
- 1: <2 people, non-technical team, manual processes acceptable
- 2: 2-5 people, mixed technical capability
- 3: 5-10 people, moderate technical capability
- 4: 10-20 people, distributed team, strong technical capability
- 5: 20+ people, distributed, need enterprise-grade data management

### Calculation

**PIM Complexity Score = (SKU Score × 0.20) + (Attribute Score × 0.15) + (Enrichment Score × 0.15) + (Channel Score × 0.15) + (Governance Score × 0.15) + (Team Score × 0.10)**

Multiply by 20 to get 0-100 scale.

### Complexity Score Interpretation

- **0-20 (Low)**: Shopify alone likely sufficient; PIM not required
- **21-40 (Low-Medium)**: Can use Shopify + basic product data sync; consider lightweight PIM
- **41-60 (Medium)**: Dedicated lightweight PIM recommended (Bluestone, simple Akeneo)
- **61-80 (Medium-High)**: Full-featured PIM recommended (Akeneo, Inriver)
- **81-100 (High)**: Enterprise PIM required (Inriver, Akeneo Enterprise)

### Scoring Example

**Example Business: D2C Growth Brand**

- SKU Complexity: 3 (8,000 SKUs, 12 avg variants) = 3
- Attribute Complexity: 3 (35 attributes including multi-language) = 3
- Data Enrichment: 2 (images, basic specs, PDFs) = 2
- Channel & Market: 3 (Shopify + 2 marketplaces, 3 markets) = 3
- Data Governance: 2 (centralized team, basic approval) = 2
- Team Capability: 3 (8 people, moderate technical skill) = 3

**Score = (3×0.20 + 3×0.15 + 2×0.15 + 3×0.15 + 2×0.15 + 3×0.10) × 20 = 2.65 × 20 = 53**

**Interpretation**: Medium complexity - full-featured PIM recommended

## Inputs

- Product portfolio profile (from Step 1)
- Product data samples showing attribute structure

## Outputs

- Completed complexity scoring sheet with all 6 categories scored
- Calculated PIM complexity score (0-100)
- Interpretation and preliminary platform sizing

## Completion Criteria

- All 6 complexity categories scored with justification
- Total PIM complexity score calculated
- Score interpretation clear and validated with team
- Understanding of what score means for platform needs
