# Step 3: Cutover Planning

## Objective

Plan cutover sequence: which platforms go live when and in what order.

## Instructions

Develop cutover plan:

**Cutover Phases**:
- Phase 1: Which platforms go live first? Why this order?
  - Critical platforms first
  - Dependencies respected
  - Risk managed (don't cut over everything simultaneously)
  - Business impacts minimized

Example:
- Hour 1: Switch order routing from old system to Shopify
- Hour 2: Enable PIM product sync to Shopify
- Hour 3: Activate customer sync from CRM

**Cutover Window**:
- When: Date, start time, planned end time
- Blackout: When business can't operate (minimize this)
- Rollback window: How long to stay ready to rollback

**Cutover Activities** (minute-by-minute or hour-by-hour):
- Time X: [Activity] by [Owner]
- Time X+5: Verify [Check] - responsible party
- Continue through full cutover

**Communication Plan**:
- Who needs to know status?
- How will updates be communicated?
- When will business be notified of go-live?

## Outputs

- Detailed cutover schedule
- Cutover checklist (activities, owners, timing)
- Communication plan
- Signoff from all teams
