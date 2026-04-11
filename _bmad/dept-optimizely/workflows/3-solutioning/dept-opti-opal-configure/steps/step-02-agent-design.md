# Step 2: Opal Agent Design and Configuration

## MANDATORY EXECUTION RULES

- All agents must be designed with clear use cases and success criteria
- Tool integrations must specify which Optimizely systems are accessed (CMS, Content Manager, Commerce Manager, etc.)
- RAG knowledge sources must be documented with content type, update frequency, and relevance scoring
- Custom tools via Opal Tools SDK must define Python/FastAPI implementation requirements
- Instructions framework must balance personal customization with org-wide governance
- All agents require testing against representative business scenarios before presenting
- Agent design documentation must be review-ready for cross-functional team approval
- Cannot present design without A/P/C menu options for each agent tier

## EXECUTION PROTOCOLS

1. **Use Case Definition** (30 mins)
   - Map business requirements to agent types
   - Define agent responsibilities and boundaries
   - Identify success criteria and failure modes

2. **Agent Architecture Design** (60 mins)
   - Design agent personas and instructions
   - Select tools and integrations
   - Plan RAG knowledge sources
   - Define inter-agent coordination (if multi-agent)

3. **Tool Configuration Planning** (30 mins)
   - System tools inventory (built-in capabilities)
   - Connector tools planning (CMS, CMP, Commerce, Analytics)
   - Custom tool requirements definition

4. **RAG Knowledge Source Planning** (30 mins)
   - Identify knowledge sources (internal docs, product KB, playbooks)
   - Define content selection and indexing strategy
   - Plan knowledge refresh cadence

5. **Instructions Framework Design** (30 mins)
   - Define personal-level instructions (user-specific context)
   - Create org-wide instruction standards
   - Establish governance and approval workflows

## CONTEXT BOUNDARIES

- Scope: Optimizely-specific agents leveraging Opal AI Agent framework
- Focus: Business process automation, content operations, customer service
- Excludes: Custom application integrations outside Optimizely scope, third-party proprietary systems
- Constraints: Opal complimentary tier (200 API calls/month base), escalate to paid for higher volumes

## YOUR TASK

Design Opal agents that address specific Optimizely operational use cases, including tool integrations, RAG strategy, and instructions framework.

---

## AGENT USE CASE ANALYSIS

### Tier 1: Simple Assistant Agents

These agents handle straightforward Q&A, content suggestions, and informational requests with minimal tool usage.

#### Use Case 1.1: Optimizely Content Manager Assistant
**Purpose**: Help content managers quickly find answers about CMS configuration, best practices, and common tasks

**Agent Profile**
- **Name**: Optimizely Content Specialist
- **Persona**: Friendly, knowledgeable content operations specialist with deep Optimizely expertise
- **Primary Use Case**: Q&A about content management workflows, CMS features, troubleshooting
- **Target Users**: Content managers, publishers, marketing teams
- **Success Criteria**:
  - Answers common questions in < 30 seconds
  - Accuracy > 90% (validated against official documentation)
  - User satisfaction > 4/5 stars
  - Reduces support tickets by 20%

**Tools Required**
- System Tools (built-in):
  - Web search (for external resources)
  - Document retrieval (internal KB)
  - Time/date functions (for scheduling examples)
- Connector Tools:
  - Optimizely CMS API (read-only, for feature documentation)
  - Internal Knowledge Base (indexed on Optimizely docs)
- Custom Tools:
  - None (simple Q&A agent)

**RAG Knowledge Sources**
- **Official Optimizely Documentation** (Primary)
  - Content: Product guides, API documentation, best practices
  - Update Frequency: Weekly (on new releases)
  - Relevance Scoring: High (official source)
  - Size: ~5,000 pages

- **Internal Optimizely Playbooks** (Secondary)
  - Content: Company-specific guidelines, approved workflows, templates
  - Update Frequency: Quarterly
  - Relevance Scoring: High (org standards)
  - Size: ~500 pages

- **Common Issues Knowledge Base** (Tertiary)
  - Content: FAQ, troubleshooting guides, known limitations
  - Update Frequency: As-needed (on issue discovery)
  - Relevance Scoring: Medium (contextual)
  - Size: ~1,000 articles

**Instructions Framework**
- **Org-Wide Standards**:
  - Always reference official Optimizely documentation for accuracy
  - Escalate complex technical issues to support team
  - Focus on content management workflows (not developer topics)
  - Provide step-by-step examples for common tasks

- **Personal Customization**:
  - User's department/team context (content team, marketing, editorial)
  - Preferred communication style (brief, detailed, visual)
  - Role-specific focus (publisher vs content strategist vs approver)

**Design Decisions**
- **Why read-only API access**: Content managers shouldn't modify CMS via agent; read-only prevents accidental changes
- **Why document-based RAG**: Official docs provide authoritative baseline; internal playbooks add org context
- **Why no custom tools**: Simple Q&A doesn't require external API calls; leverage built-in capabilities

**Testing Scenarios**
1. Content manager asks "How do I create a block for A/B testing?"
   - Expected: Step-by-step guide to setting up CMS blocks and experiments
2. Publisher asks "What's the difference between segments and profiles?"
   - Expected: Clear explanation of targeting concepts with examples
3. User asks about specific CMS version feature
   - Expected: Accurate answer referencing official docs for that version

---

#### Use Case 1.2: Content Suggestion Agent
**Purpose**: Suggest new content ideas based on analytics, search trends, and editorial calendar

**Agent Profile**
- **Name**: Content Ideation Agent
- **Persona**: Creative content strategist with data-driven insights
- **Primary Use Case**: Suggest blog topics, landing page ideas, campaign angles
- **Target Users**: Content strategists, marketing managers, editorial teams
- **Success Criteria**:
  - Suggestions align with brand (> 80% approval rate)
  - Ideas are actionable (content team can execute in 1-2 weeks)
  - Engagement metrics improve 15% for suggested content

**Tools Required**
- System Tools:
  - Web search (for trends)
  - Document retrieval (editorial guidelines)
- Connector Tools:
  - Analytics platform API (traffic trends, user behavior)
  - Google Trends integration (search trends)
  - Marketing calendar system (existing content gaps)
- Custom Tools:
  - Content Topic Generator (Python service that analyzes trends and generates topic ideas)

**RAG Knowledge Sources**
- **Editorial Guidelines**: Brand voice, tone, content pillars, audience personas
- **Past High-Performing Content**: Topic analysis, engagement metrics
- **Competitor Content Analysis**: What competitors cover, gap analysis
- **Industry Trends Data**: Monthly trend reports, emerging topics

**Design Decisions**
- **Why Analytics integration**: Data-driven suggestions increase buy-in from leadership
- **Why custom Python service**: Trend analysis and topic generation require specialized NLP
- **Why no CMS write access**: Suggestions only; content creation remains human-owned

---

### Tier 2: Specialized Operational Agents

These agents handle specific business processes with deeper system integrations.

#### Use Case 2.1: Content Creation Agent
**Purpose**: Assist content creators with drafting, optimization, and SEO suggestions

**Agent Profile**
- **Name**: Content Creation Copilot
- **Persona**: Professional content writer and SEO specialist
- **Primary Use Case**: Draft content, optimize for keywords, suggest headlines/meta descriptions
- **Target Users**: Content creators, copywriters, SEO specialists
- **Success Criteria**:
  - Content creators adopt for 50%+ of new articles
  - SEO scores increase by 25%
  - Content creation time reduced by 30%
  - User satisfaction > 4/5 stars

**Tools Required**
- System Tools:
  - Web search (for research)
  - Document retrieval (brand guidelines, SEO standards)
- Connector Tools:
  - Optimizely CMS API (read current content structure)
  - Analytics API (search traffic trends)
  - SEO tool API (Semrush/Ahrefs - keyword data, competition analysis)
  - CMP (Content Marketing Platform) API (schedule integration)
- Custom Tools:
  - **SEO Analyzer** (Python/FastAPI service)
    - Input: Content draft, target keywords
    - Output: Keyword density, readability score, meta suggestions, heading structure analysis
  - **Headline Generator** (Python/FastAPI service)
    - Input: Topic, target audience
    - Output: 5-10 headline options with predicted CTR scores

**RAG Knowledge Sources**
- **SEO Best Practices**: Content length guidelines, keyword research strategy, on-page SEO rules
- **Brand Content Standards**: Tone, style guide, content templates, approved examples
- **High-Performing Content Database**: Topics that ranked well, engagement metrics
- **Competitor Content Analysis**: Benchmarks by topic, feature comparison

**Instructions Framework**
- **Org-Wide Standards**:
  - Always match brand voice and style guide
  - Include data sources and citations
  - Optimize for featured snippet potential
  - Follow internal SEO guidelines (keyword targets, content length)

- **Personal Customization**:
  - Content creator's preferred writing style (formal, conversational, technical)
  - Target audience focus (enterprise, SMB, individual contributors)
  - Content pillar assignment (product, thought leadership, customer story, etc.)

**Design Decisions**
- **Why SEO tool integration**: Competitive keyword data essential for effective optimization
- **Why custom Python services**: Complex analysis (headline scoring, SEO analysis) requires specialized logic
- **Why CMP integration**: Enable direct scheduling to content calendar
- **Why read-only CMS access**: No direct content publishing; ensure human review before publication

**Testing Scenarios**
1. Content creator provides article draft on "AI in personalization"
   - Expected: SEO analysis, headline suggestions, meta description, internal link opportunities
2. Agent suggests supporting content based on trending keywords
   - Expected: Topic recommendations with search volume and competition metrics
3. Content creator asks for A/B headline options
   - Expected: Multiple headline variations with predicted performance scores

---

#### Use Case 2.2: SEO and Translation Agent
**Purpose**: Optimize content for SEO and manage translation workflows for multi-language deployments

**Agent Profile**
- **Name**: SEO & Localization Specialist
- **Persona**: Bilingual SEO expert with translation industry experience
- **Primary Use Case**: Optimize content for global markets, manage translation workflows
- **Target Users**: SEO specialists, translation managers, global content teams
- **Success Criteria**:
  - Translation quality score > 95%
  - SEO rankings improve in target markets (20% increase in 6 months)
  - Translation cycle time reduced by 40%
  - Market-specific SEO recommendations adopted 80%+ of the time

**Tools Required**
- System Tools:
  - Web search (for market-specific trends)
  - Document retrieval (localization guidelines)
- Connector Tools:
  - Optimizely CMS API (read content, language variants)
  - Translation Management System API (manage translation projects)
  - Analytics API (geographic/language-specific performance)
  - SEO tool API (market-specific keyword research)
  - Localization platform (terminology database)
- Custom Tools:
  - **Market-Specific SEO Analyzer** (Python/FastAPI)
    - Analyzes content for target market SEO best practices
    - Provides locale-specific keyword recommendations
  - **Translation Quality Checker** (Python/FastAPI)
    - Validates translated content for accuracy, tone consistency, terminology
    - Flags issues for translator review
  - **Hreflang Validator** (Python/FastAPI)
    - Ensures correct hreflang implementation across language variants
    - Checks for canonicalization issues

**RAG Knowledge Sources**
- **Market-Specific SEO Guidelines**: Ranking factors by market, local search behaviors
- **Localization Best Practices**: Terminology standards, cultural considerations, formatting
- **Language-Specific Content Guidelines**: Tone, formality, cultural sensitivity per market
- **Translation Glossary**: Approved terminology, brand terminology, technical terms
- **Competitor Translation Analysis**: How competitors localize by market

**Design Decisions**
- **Why translation system integration**: Centralize workflow management
- **Why market-specific SEO analyzer**: Global vs local SEO strategies differ significantly
- **Why custom quality checker**: Automated validation improves translation consistency
- **Why hreflang validator**: Prevents critical SEO implementation errors

**Testing Scenarios**
1. Global content team wants to expand blog to 5 new markets
   - Expected: Market-specific SEO recommendations, translation vendor suggestions, hreflang implementation guidance
2. Translation comes back with quality issues
   - Expected: Specific issues flagged (terminology misuse, tone, technical accuracy)
3. Content exists in multiple languages but hreflang is incorrect
   - Expected: Identifies hreflang errors and canonicalization issues

---

### Tier 3: Workflow Automation Agents

These agents handle complex business processes with write access and multi-step workflows.

#### Use Case 3.1: Content Approval Workflow Agent
**Purpose**: Automate content review and approval workflows, routing content to appropriate reviewers

**Agent Profile**
- **Name**: Content Approval Orchestrator
- **Persona**: Workflow manager with editorial governance expertise
- **Primary Use Case**: Route content for review, track approval status, manage escalations
- **Target Users**: Editorial managers, approval managers, content operations teams
- **Success Criteria**:
  - Approval cycle time reduced by 50%
  - Reduced approval bottlenecks (content stuck in review)
  - Zero missed approvals/deadlines
  - Stakeholder satisfaction > 4/5 stars

**Tools Required**
- System Tools:
  - Notification system (email, Slack notifications)
  - Document management
- Connector Tools:
  - Optimizely CMS API (read content status, publish workflows)
  - **Workflow management system** (routing rules, approval definitions)
  - **Email/notification platform** (sendgrid, mailgun, Slack API)
  - **Analytics platform** (track approval metrics, bottlenecks)
  - **User directory** (find appropriate reviewers by role/expertise)
- Custom Tools:
  - **Smart Routing Engine** (Python/FastAPI)
    - Analyzes content and routes to appropriate reviewers based on:
      - Content type/category (requires expert reviewer)
      - Content sensitivity (requires senior approval)
      - Reviewer availability/workload
      - Approval history (which reviewers approve fastest)
    - Escalates if approval stuck > 2 days
  - **Approval Status Tracker** (Python/FastAPI)
    - Tracks approval progress across multiple reviewers
    - Sends reminders to pending reviewers
    - Identifies bottlenecks and slow reviewers
  - **Compliance Checker** (Python/FastAPI)
    - Validates content against compliance rules before routing
    - Flags issues that require legal/compliance review

**RAG Knowledge Sources**
- **Approval Workflow Guidelines**: Rules, escalation procedures, SLAs per content type
- **Reviewer Expertise Database**: Who reviews what content types, reviewer capabilities
- **Compliance and Governance Rules**: Brand standards, compliance requirements, escalation triggers
- **Historical Approval Data**: Average approval time by content type, bottleneck analysis

**Instructions Framework**
- **Org-Wide Standards**:
  - Follow approval hierarchy (content type -> seniority -> expertise)
  - Escalate non-compliance issues automatically
  - Route based on reviewer availability and workload
  - Send status updates at 24h and 48h if pending

- **Personal Customization**:
  - User's role (content creator, approver, editor)
  - Notification preferences (email, Slack, SMS)
  - Workload priorities (urgent, standard, low-priority content)

**Design Decisions**
- **Why write access to CMS**: Needs to update content status through workflows
- **Why smart routing engine**: Manual routing causes bottlenecks; AI routing optimizes throughput
- **Why escalation automation**: Prevents content getting stuck in approval
- **Why compliance checker**: Catches issues early before they reach reviewers

**Testing Scenarios**
1. Content creator submits blog post for approval
   - Expected: Smart routing assigns to appropriate reviewer based on topic/expertise
2. Reviewer goes on vacation
   - Expected: Agent reassigns to backup reviewer, notifies creator of change
3. Content not approved after 48 hours
   - Expected: Escalates to manager, sends reminder notifications

**Approval Workflow Example**
```
1. Content submitted for approval
   ↓
2. Smart Router analyzes content
   ├─ Is it compliant?
   │  └─ No → Send to Compliance team
   │  └─ Yes → Continue
   ├─ Content type? (Blog, Product, Thought Leadership)
   ├─ Sensitivity level? (Standard, High, Restricted)
   └─ Route to appropriate reviewers
   ↓
3. Reviewers receive notifications (email + Slack)
   ↓
4. Agent tracks approval progress
   ├─ Approved? → Queue for publishing
   ├─ Rejected? → Notify creator of feedback
   └─ No response after 48h? → Escalate to manager
   ↓
5. All approvals complete → Content ready to publish
```

---

#### Use Case 3.2: Campaign Management and Publishing Agent
**Purpose**: Automate campaign orchestration across channels, manage publishing schedules

**Agent Profile**
- **Name**: Campaign Orchestration Agent
- **Persona**: Marketing operations specialist with multi-channel campaign expertise
- **Primary Use Case**: Coordinate multi-channel campaigns, schedule content publishing, manage campaign variants
- **Target Users**: Campaign managers, marketing operations, product marketers
- **Success Criteria**:
  - Campaign launch cycle time reduced by 60%
  - Zero missed publish deadlines
  - Cross-channel consistency > 95%
  - Campaign team productivity increased 40%

**Tools Required**
- System Tools:
  - Scheduling and calendar management
  - Notification system
- Connector Tools:
  - Optimizely CMS API (content publishing, scheduling)
  - **Optimizely Campaign (CMP) API** (campaign creation, audience targeting)
  - **Optimizely Commerce API** (product synchronization, pricing)
  - **Email platform API** (email campaign creation, scheduling)
  - **Social media API** (post scheduling, calendar)
  - **Analytics platform** (campaign performance tracking)
  - **Asset management system** (retrieve campaign assets)
- Custom Tools:
  - **Campaign Orchestrator** (Python/FastAPI)
    - Manages multi-channel campaign execution across CMS, CMP, email, social
    - Handles scheduling, variant management, compliance checks
    - Coordinates approvals across channels
  - **Content-to-Campaign Mapper** (Python/FastAPI)
    - Maps CMS content to campaign variants
    - Generates campaign-specific variants (email subject, social copy, etc.)
    - Ensures messaging consistency across channels
  - **Campaign Performance Analyzer** (Python/FastAPI)
    - Tracks campaign performance across channels
    - Identifies underperforming variants
    - Recommends optimization actions

**RAG Knowledge Sources**
- **Campaign Best Practices**: Multi-channel coordination, timing, frequency capping
- **Brand Campaign Guidelines**: Approved messaging, visual standards, compliance rules
- **Campaign Templates**: Historical campaigns, templates by type, proven structures
- **Performance Benchmarks**: CTR targets, conversion benchmarks by channel/type
- **Compliance and Privacy**: Data privacy rules, compliance requirements per channel

**Design Decisions**
- **Why write access to CMS, CMP, email**: Needs to publish and schedule content across channels
- **Why custom orchestrator**: Managing dependencies across 5+ channels requires sophisticated logic
- **Why content-to-campaign mapper**: Reduces manual variant creation work
- **Why performance analyzer**: Enables data-driven optimization and automated recommendations

**Testing Scenarios**
1. Campaign manager creates campaign for product launch
   - Expected: Agent generates campaign variants across channels (CMS pages, emails, social, CMP ads)
   - Agent schedules all channels to publish simultaneously
   - Agent sends final review checklist
2. Email variant underperforming
   - Expected: Agent identifies low performance, suggests subject line test
3. Campaign requires compliance review
   - Expected: Agent routes to compliance team, blocks publishing until approved

**Multi-Channel Campaign Orchestration Example**
```
Campaign: "Q2 Product Launch"
├─ CMS Content
│  ├─ Product landing page (publish 2024-04-01 09:00 EST)
│  ├─ Blog post announcement (publish 2024-03-31 12:00 EST)
│  └─ Case study integration (publish 2024-04-02 10:00 EST)
├─ Optimizely Campaign
│  ├─ Product email campaign (send 2024-04-01 10:00 EST)
│  ├─ Remarketing ads (activate 2024-04-01 09:00 EST)
│  └─ A/B subject line test (email variant A vs B)
├─ Email Marketing
│  ├─ Announcement email (send 2024-04-01 10:00 EST)
│  ├─ Nurture sequence (4 emails over 2 weeks)
│  └─ Frequency cap: 1 email per day max
├─ Social Media
│  ├─ LinkedIn announcement (post 2024-04-01 09:00 EST)
│  ├─ Twitter/X thread (post 2024-04-01 10:00 EST)
│  └─ Instagram carousel (post 2024-04-01 11:00 EST)
└─ Governance
   ├─ Legal review required
   ├─ Compliance check (privacy, claims)
   └─ Executive approval workflow
```

---

## AGENT SUMMARY TABLE

| Agent Name | Use Case | Tier | Primary Tools | Complexity | Estimated Volume | Monthly Cost |
|---|---|---|---|---|---|
| Content Specialist | Q&A, troubleshooting | 1 | Web search, KB | Low | 50/month | Free |
| Content Ideation | Suggest topics | 1 | Analytics, Trends | Low | 20/month | Free |
| Content Copilot | Draft & optimize | 2 | SEO, CMS, Analytics | Medium | 100/month | $5-15 |
| SEO/Localization | Market optimization | 2 | CMS, TMS, Analytics | High | 80/month | $10-25 |
| Approval Orchestrator | Route & track approvals | 3 | CMS, Workflow, Notifications | High | 200/month | $25-50 |
| Campaign Orchestrator | Multi-channel campaigns | 3 | CMS, CMP, Email, Social | Very High | 150/month | $30-60 |

**Total Estimated Monthly Volume**: ~600 API calls (well within free tier of 200 initial, escalate for paid tier if exceeds capacity)

---

## TOOL INTEGRATION MAPPING

### System Tools (Built-in, Always Available)
| Tool | Purpose | Used By Agents |
|---|---|---|
| Web Search | Research, trending topics, external resources | All assistants |
| Document Retrieval | KB search, guideline lookup | Content Specialist, SEO Agent |
| Chat Continuity | Multi-turn conversations | All agents |
| File Upload | Asset upload, document processing | Campaign Orchestrator |

### Connector Tools (Optimizely Ecosystem)

**Optimizely CMS Connector**
- Capabilities: Read content, read publishing status, write content (publish, schedule)
- Used By: All agents
- Typical Queries:
  - Content Manager Agent: Fetch documentation about CMS features
  - Campaign Orchestrator: Publish campaign landing pages and content
  - Content Copilot: Check existing content structure for context

**Optimizely Campaign (CMP) Connector**
- Capabilities: Read/write campaigns, audience management, experiment configuration
- Used By: Content Specialist (campaign concepts), Campaign Orchestrator (campaign execution)
- Typical Queries:
  - Fetch audience definitions for campaign targeting
  - Create and schedule campaigns
  - Manage variants and A/B tests

**Optimizely Commerce Connector**
- Capabilities: Read product catalog, pricing, inventory, write order information
- Used By: Campaign Orchestrator (product integration)
- Typical Queries:
  - Fetch product data for campaign content
  - Sync pricing to campaign messaging

**Optimizely Analytics Connector**
- Capabilities: Read traffic data, conversion metrics, user behavior, segment definitions
- Used By: Content Ideation, Content Copilot, SEO Agent, Campaign Orchestrator
- Typical Queries:
  - Identify trending topics (high-traffic content)
  - Get performance benchmarks for content type
  - Track campaign performance

### Custom Tools (Python/FastAPI)

**Tool 1: SEO Analyzer** (Python/FastAPI)
```
POST /analyze-seo
Input:
  - content: string (article text)
  - keywords: list[string] (target keywords)
  - target_length: int (recommended word count)
Output:
  - keyword_density: dict
  - readability_score: float (Flesch-Kincaid)
  - meta_suggestions: dict (title, description)
  - heading_structure: list
  - internal_link_opportunities: list
  - estimated_word_count: int
```

**Tool 2: Headline Generator** (Python/FastAPI)
```
POST /generate-headlines
Input:
  - topic: string
  - target_audience: string
  - content_type: string (blog, landing_page, email)
  - num_options: int (default: 5)
Output:
  - headlines: list[dict]
    - text: string
    - predicted_ctr: float
    - rationale: string
```

**Tool 3: Smart Approval Router** (Python/FastAPI)
```
POST /route-approval
Input:
  - content_id: string
  - content_type: string
  - sensitivity_level: string (low, medium, high)
  - created_by: string (creator ID)
Output:
  - primary_reviewer: dict (name, email, expertise)
  - backup_reviewers: list[dict]
  - escalation_path: list
  - estimated_approval_time: float
  - compliance_checks_required: list
```

**Tool 4: Campaign Orchestrator** (Python/FastAPI)
```
POST /orchestrate-campaign
Input:
  - campaign_name: string
  - channels: list[string] (cms, email, social, cmp, commerce)
  - start_date: datetime
  - content_mapping: dict (channel -> content/variant)
Output:
  - execution_plan: dict (schedule, dependencies, approvals)
  - channel_variants: dict (email, social, etc. variants)
  - compliance_flags: list
  - missing_assets: list
```

---

## RAG KNOWLEDGE SOURCE CONSOLIDATION

### Primary Sources (Official Authoritative)
1. **Optimizely Official Documentation**
   - Content: Product guides, API docs, best practices
   - Update: Weekly (on releases)
   - Size: ~10,000 pages
   - Indexing: Full-text search + semantic embeddings
   - Refresh: Automated via API

2. **Internal Brand Guidelines**
   - Content: Brand voice, visual standards, content pillars
   - Update: Quarterly
   - Size: ~100 pages
   - Indexing: Semantic search (high organization specificity)
   - Refresh: Manual on update

### Secondary Sources (Curated Operational)
3. **Company Playbooks and Templates**
   - Content: Approved workflows, content templates, campaign templates
   - Update: Quarterly
   - Size: ~500 pages
   - Indexing: Category + semantic search

4. **Common Issues & FAQ**
   - Content: Troubleshooting, known issues, workarounds
   - Update: As-needed
   - Size: ~1,000 articles
   - Indexing: Tag-based + semantic

5. **Performance Benchmarks**
   - Content: Industry benchmarks, internal performance targets
   - Update: Semi-annually
   - Size: ~500 articles
   - Indexing: Numeric filtering + semantic

### Tertiary Sources (External/Reference)
6. **Competitor Content Analysis**
   - Content: How competitors use Optimizely, feature comparisons
   - Update: Quarterly
   - Size: ~200 articles
   - Indexing: Entity-based + semantic

7. **Industry Trends**
   - Content: Market trends, emerging technologies, best practices
   - Update: Monthly
   - Size: ~500 articles
   - Indexing: Date-based + semantic

---

## INSTRUCTIONS FRAMEWORK DESIGN

### Org-Wide Instructions (Applied to All Agents)

**Core Values**
- Always accurate: Prefer not-knowing over guessing; escalate uncertainty
- Always helpful: Provide context, examples, and actionable next steps
- Always compliant: Follow brand guidelines, privacy rules, governance policies
- Always efficient: Respect user time; provide concise answers with optional depth

**Common Practices**
- Cite sources: Reference official documentation or internal sources for credibility
- Provide examples: Use realistic Optimizely scenarios when explaining concepts
- Offer alternatives: Give 2-3 approaches when multiple valid options exist
- Escalate appropriately: Route complex issues to human specialists

**Governance Rules**
- No write access without explicit approval workflow
- All recommendations include rationale and supporting data
- Privacy-first: Never suggest collecting unnecessary user data
- Compliance-aware: Flag potential compliance issues automatically

### Agent-Level Instructions (Customizable per Agent Type)

**Assistant Agent Instructions** (Content Specialist, Ideation Agent)
- Focus: Informational and advisory (no action taken)
- Depth: Provide detailed context but not overwhelming
- Examples: Include 2-3 real Optimizely scenarios
- Escalation: Link to support resources, offer human escalation

**Operational Agent Instructions** (Content Copilot, SEO Agent)
- Focus: Productivity enhancement with human oversight
- Depth: Actionable recommendations with confidence scores
- Examples: Include before/after examples showing impact
- Escalation: Flag high-uncertainty decisions for human review

**Automation Agent Instructions** (Approval Orchestrator, Campaign Orchestrator)
- Focus: Efficiency and consistency
- Depth: Clear decision rationale and exception handling
- Examples: Include system workflow diagrams
- Escalation: Clear paths for edge cases and unusual scenarios

### Personal-Level Instructions (User Customization)

Each user can customize instructions for personal context:

**Content Manager (Example)**
```
Role: Content Manager at Marketing Company
Team: 5-person editorial team
Focus: Blog and resource center content
Customizations:
- Communication style: Brief and direct
- Content type: Focus on blog and guides
- Audience: B2B SaaS marketing professionals
- Approval workflow: Needs manager approval before publishing
- Escalation: Route technical issues to dev team
```

**Campaign Manager (Example)**
```
Role: Campaign Manager at Enterprise
Team: 2 marketing ops coordinators
Focus: Multi-channel campaigns with 5+ variants
Customizations:
- Communication style: Detailed with checklists
- Content: Product campaigns with email/social/CMS
- Channels: Email, Slack, Adobe Experience Cloud integration
- SLAs: 2-day campaign launch cycles required
- Escalation: Compliance review needed for regulatory claims
```

---

## AGENT DESIGN PRESENTATION (A/P/C MENU)

### APPROVE: Implement All Tier 1 & 2 Agents (Recommended)
**Scope**: 4 agents (Content Specialist, Ideation, Copilot, SEO/Localization)
**Timeline**: 4-6 weeks
**Cost**: Minimal (within free tier)
**Impact**: 40% productivity improvement for content teams
**Next Steps**:
1. Approve design
2. Proceed to Step 3 (Evaluation & Deployment)
3. Begin Tier 1 agent deployment in week 1

### PROCEED WITH CAUTION: Add Tier 3 Agents (Requires Governance Review)
**Scope**: Add 2 automation agents (Approval Orchestrator, Campaign Orchestrator)
**Timeline**: Additional 6-8 weeks (after Tier 1/2 baseline)
**Cost**: $25-60/month (may exceed free tier)
**Impact**: 50% workflow automation, but requires change management
**Governance Concerns**:
- Write access to CMS/CMP requires approval workflows
- Escalation procedures must be defined
- Need audit trail for compliance
**Next Steps**:
1. Schedule governance review with IT/Compliance
2. Define escalation procedures
3. Plan rollout with change management

### CUSTOMIZE: Modify Agent Selection
**Option A**: Skip Tier 1 agents, implement Tier 2 + Tier 3 (higher complexity, higher impact)
**Option B**: Implement Tier 1 + Tier 2 only, add Tier 3 later (proven value before automation)
**Option C**: Implement phased approach - start with Content Specialist, add agents monthly

---

## NEXT STEP

Present agent design to stakeholders with A/P/C menu options. Upon approval of agent tier:
1. Proceed to Step 3 (Evaluate & Deploy)
2. Configure selected agents with approved RAG sources
3. Conduct testing against business scenarios
4. Deploy to production with monitoring and governance
