# Step 2: Platform Dependency Mapping

## Objective

Identify what each platform depends on before it can be implemented. Map dependency graph.

## Instructions

For each platform, document:
- **Prerequisites**: What must be in place before implementation (licenses, vendor setup, data, infrastructure)
- **Data dependencies**: What data from other systems is needed
- **Integration dependencies**: Which integrations must be done first
- **Business dependencies**: What business processes must be ready

Create dependency matrix:

| Platform | Prerequisites | Depends On | Required Before | Critical Path? |
|---|---|---|---|---|
| Shopify Plus | Vendor account, DNS, SSL | None (core) | Everything | Yes |
| PIM | Vendor account, staff trained | Shopify in place | Product data sync | Yes |
| CRM | Vendor account, data model | Shopify customer data | Customer sync | Yes |

Identify critical path (platforms with no alternatives or many dependents).

## Outputs

- Dependency matrix
- Dependency graph/diagram
- Critical path identified

## Completion Criteria

- All platform dependencies mapped
- Dependency graph clear
- Critical path identified
