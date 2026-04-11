# Step 3: Field Mapping & Transformation Design

## Objective

Design field-level mapping and transformation rules from source to destination.

## Instructions

Create mapping specification:
1. List all source fields and destination fields
2. Map 1:1 correspondences where possible
3. For complex mappings, document transformation logic
4. Handle fields that don't have direct equivalents
5. Document how null/missing values are handled

Create mapping table:

| Source Field | Destination Field | Transformation | Handling Null |
|---|---|---|---|
| product_name | title | None | Leave empty |
| product_description | description_html | Convert markdown to HTML | Use empty string |

Test transformation logic with sample data.

## Outputs

- Field mapping specification
- Transformation rules/code
- Test results showing mapping accuracy
