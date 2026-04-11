# step-02-execute-wave: Execute Per-Wave Migration Loop

## MANDATORY EXECUTION RULES

1. **Validate Before Next Wave:** Do not proceed to next wave until current wave validates successfully.
2. **Document All Exceptions:** Log every exception, rework item, and recovery action.
3. **No Silent Failures:** If any item fails, explicitly document and decide: rework or defer.

## YOUR TASK (Per Wave)

### A. Transform Content Per Mappings

- Load legacy content for this wave
- Apply transformation rules (field mappings, data cleanup)
- Validate transformed data (schema compliance, required fields)

### B. Load to Target CMS

**For CMS 12:**

- Use Episerver API or scheduled job for bulk import
- Verify ContentReference integrity (links between content)
- Confirm publishing workflow (draft → published)

**For SaaS CMS:**

- Use REST API for content creation
- Verify Content Graph indexing (check query results)
- Validate Visual Builder rendering (test with real editor)

### C. Validate Wave Exit Criteria

Success criteria (per wave):

- **Completeness:** Count of migrated items >= expected count
- **Integrity:** All required fields populated, no data loss
- **Correctness:** Field mappings applied correctly (spot-check samples)

### D. Document Wave Results

Record in execution tracking:

- [ ] Items migrated: [count]
- [ ] Items successful: [count]
- [ ] Items failed: [count]
- [ ] Exceptions: [list with rework plan]
- [ ] Integrity validation: [% pass rate]
- [ ] Status: ✅ Complete / ⏳ Rework Needed

### E. Decision Gate: Proceed or Hold

**If validation passes (exit criteria met):**
- ✅ Approve wave → Proceed to next wave

**If validation fails (issues found):**
- 🔄 Rework → Fix exceptions → Re-validate → Re-execute gate
- 🛑 Hold → Document blockers → Escalate to architect → Decide: proceed or rollback

## SUCCESS METRICS

- [ ] All waves complete
- [ ] Exit criteria met for each wave
- [ ] Zero unrecovered exceptions
- [ ] Content integrity >= 99%

## NEXT STEP

→ After all waves: Proceed to dept-opti-migration-validate for go-live prep
