# step-01-init: CMP Requirements Discovery

## MANDATORY EXECUTION RULES

1. **Workflow-Centric:** Understand how editorial team works before configuring CMP.
2. **Role Mapping:** Map team structure to CMP roles (editor, approver, publisher).
3. **Integration First:** Plan CMS integration points upfront.

## YOUR TASK

### A. Document Campaign Types

Identify campaign types your editorial team needs:

- Product launches
- Seasonal campaigns
- Blog article series
- Newsletter campaigns
- Promotional events
- etc.

For each type, document:

- Campaign duration (1 week, 1 month, etc.)
- Approval path (1-step or multi-step?)
- Publishing channels (CMS, email, social, etc.)

### B. Map Editorial Team Structure

Document team roles:

- Content creators (writers, designers)
- Content reviewers/approvers
- Publishers/release managers
- Analytics/reporting owners

Create role-to-CMP mapping:

| Role | CMP Role | Responsibilities |
|------|----------|-----------------|
| Content Writer | Editor | Create/edit campaign content |
| Manager | Approver | Review and approve campaigns |
| Pub Manager | Publisher | Schedule and publish to CMS |

### C. Plan CMS Integration Points

Document how CMP connects to CMS:

**For CMS 12:**

- CMP task triggers CMS content creation?
- CMP approval triggers publishing?
- CMS assets available in CMP?

**For SaaS CMS:**

- CMP creates content type instances?
- CMP controls publishing workflow?
- Visual Builder integration?

### D. Create CMP Requirements Document

Template:

```markdown
# CMP Configuration Requirements

## Campaign Types

| Type | Duration | Approval Path | Channels |
|------|----------|---------------|----------|
| [Type 1] | [1 week] | [1-step] | [CMS, email] |

## Team Structure and Roles

[Role mapping table]

## CMS Integration

- **Platform:** CMS 12 | SaaS CMS
- **Connection:** REST API | Custom connector
- **Content Types:** [Which content types created by CMP?]
- **Publishing:** [Auto or manual?]

## Success Criteria

- Campaign types configured
- Approval workflows tested
- CMS integration working
- Team trained and adopting
```

## SUCCESS METRICS

- [ ] Campaign types documented
- [ ] Team structure mapped to CMP roles
- [ ] CMS integration points identified
- [ ] Requirements document signed off

## NEXT STEP

→ Proceed to step-02-configure: Configure CMP and integrate with CMS
