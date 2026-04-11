# Step 2: Data Accuracy & Completeness Validation

## Objective

Validate that data is accurately and completely synced across systems.

## Instructions

**Data Accuracy Testing**:
- Select sample of records synced between systems
- Manually verify data in both systems matches mapping spec
- Check for data corruption, transformation errors
- Verify calculated fields correct
- Check date/time handling (timezones, formatting)
- Verify special characters handled correctly
- Score: X% of sample records match exactly

**Data Completeness Testing**:
- Count records in source system
- Count matching records in destination system
- Identify any missing or orphaned records
- Verify all required fields populated
- Check for partial syncs or incomplete updates
- Score: X% of records synced successfully

**Data Quality Assessment**:
- Assess data quality in source (blanks, invalid values)
- Compare quality pre/post sync
- Identify transformation issues or data loss

Document findings:
- Data accuracy score
- Data completeness score
- Issues found and severity
- Recommended actions

## Inputs

- Sample data from both systems
- Data mapping specification
- Validation criteria

## Outputs

- Data validation report
- Issues and remediation plan
- Data accuracy/completeness scores

## Completion Criteria

- Data accuracy >95%
- Data completeness >99%
- Issues identified and tracked
