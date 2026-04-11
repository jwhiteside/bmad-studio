# Step 3: Data Mapping

## Objective

Define and implement data mapping (attribute mapping, ID mapping, transformation logic).

## Instructions

Create detailed field-level mapping:
- For each source field, map to destination field
- Identify any transformations needed
- Define how empty/null values are handled
- Handle ID mapping (how records are matched across systems)
- Implement transformations (if using middleware or APIs)

Document mapping in table format:

| Source System | Source Field | Transform | Destination Field | Destination System |
|---|---|---|---|---|
| PIM | name | None | title | Shopify |
| PIM | description | HTML cleanup | description | Shopify |

Validate mapping:
- Test with sample data
- Verify all required fields mapped
- Test transformation logic
- Handle edge cases

## Inputs

- Data flow specification
- Source/destination data samples
- Transformation rules

## Outputs

- Mapping documentation
- Transformation code/rules
- Mapping validation results

## Completion Criteria

- All fields mapped
- Transformation logic implemented
- Sample data validates successfully
- Team reviews and approves mapping
