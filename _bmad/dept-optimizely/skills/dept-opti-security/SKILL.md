---
canonicalId: dept-opti-security
name: "Optimizely Security Patterns"
description: "Comprehensive security patterns for Optimizely implementations covering CMS 12 access control, SaaS CMS authentication, API security, data protection, DXP Cloud security, compliance requirements, and OWASP considerations."
domain: optimizely
category: security
---

# Optimizely Security Patterns

## Overview

Security across Optimizely implementations requires attention to CMS access control, API authentication, data protection, platform security, and compliance. This skill covers security patterns for designing secure Optimizely deployments that protect organizational and customer data while maintaining operational efficiency.

## CMS 12 Security

### Role-Based Access Control

Implement fine-grained permission system:

**Standard Roles**
- Content Author: create and edit content in assigned areas
- Content Editor: review, approve, and publish content
- Content Administrator: manage content structure, users, workflows
- System Administrator: system configuration, security policies

**Role Definition Pattern**
```
Role: Content Author
Permissions:
- Create new content in "Drafts" status
- Edit own content
- Submit for review
Restrictions:
- Cannot publish content
- Cannot modify content structure
- Cannot access admin functions
```

**Permission Scoping**
- Implement tree-level permissions: restrict access to content areas
- Design role combinations: users can have multiple roles
- Create temporary roles: temporary elevated permissions with expiration
- Implement role inheritance: specialized roles inherit base role permissions

**Permission Levels**
- Create: permission to create new content
- Read: permission to view content
- Edit: permission to modify content
- Delete: permission to remove content
- Publish: permission to publish content
- Approve: permission to approve workflows
- Manage Structure: permission to modify content model

### Virtual Role Providers

Extend role system with organizational context:

**Virtual Role Implementation**
```csharp
public class OrganizationalUnitRoleProvider : RoleProvider
{
    public override string[] GetRolesForUser(string username)
    {
        var user = GetUser(username);
        var roles = new List<string>();

        // Built-in roles
        if (user.IsAdmin) roles.Add("Administrator");
        if (user.IsEditor) roles.Add("Editor");

        // Virtual roles based on organizational context
        if (user.Department == "Marketing")
            roles.Add("MarketingTeam");

        if (user.IsRegionalLead)
            roles.Add($"Regional{user.Region}Lead");

        return roles.ToArray();
    }
}
```

**Use Cases**
- Department-based roles: marketing team, product team, compliance team
- Regional roles: specific roles by geographic region
- Project-specific roles: temporary elevated access for projects
- Compliance roles: special roles for compliance personnel

**Benefit**
- Dynamic permissions: permissions change with organizational structure
- Centralized management: sync with HR/identity systems
- Granular control: fine-grained permission assignment
- Audit trail: track role changes and access

### Content Security

Protect sensitive content:

**Content Classification**
- Define sensitivity levels: public, internal, confidential, restricted
- Implement classification metadata: mark content by sensitivity
- Design access controls: restrict access based on classification
- Create audit logging: log access to sensitive content

**Encryption at Rest**
- Implement database encryption: transparent encryption of stored data
- Design key management: secure key storage and rotation
- Create backup encryption: encrypted backups
- Implement purge procedures: secure deletion of sensitive data

**Preview Security**
- Implement preview authentication: only authorized users can preview
- Design preview tokens: time-limited preview access tokens
- Create preview logging: audit trail of preview access
- Implement preview restrictions: restrict sensitive content preview

### Scheduled Job Permissions

Secure automated operations:

**Job Authentication**
- Implement service account: dedicated account for scheduled jobs
- Design minimal privileges: service account has only needed permissions
- Create audit logging: log all job executions
- Implement error notifications: alert on job failures

**Sensitive Job Operations**
- Publishing jobs: jobs that publish content should have limited scope
- Data export jobs: restrict access to exported data
- Cleanup jobs: deletions should be logged and auditable
- Integration jobs: restricted to authorized integrations

**Job Security**
- Implement job encryption: sensitive parameters encrypted
- Design job scheduling: control which users can schedule jobs
- Create job execution logging: detailed execution logs
- Implement job validation: validate job parameters before execution

## SaaS CMS Security

### API Authentication

Secure API access:

**Authentication Methods**
- HMAC: symmetric key authentication for service-to-service
- SingleKey: simple key-based authentication
- OAuth 2.0: delegated authorization for user-based access
- JWT: token-based authentication with claims

**HMAC Authentication**
- Generate shared secret: unique per client
- Implement request signing: HMAC signature in request header
- Design signature verification: validate on server side
- Create nonce tracking: prevent replay attacks

**HMAC Implementation Pattern**
```
Client Request:
  - Timestamp: 2026-03-31T10:00:00Z
  - Nonce: unique-request-id
  - Request Body: {content data}
  - Signature: HMAC-SHA256(Timestamp + Nonce + Body, Secret)

Server Validation:
  - Verify timestamp: not older than 5 minutes
  - Verify nonce: not seen before
  - Verify signature: calculate HMAC, compare with provided signature
```

**Key Rotation**
- Implement scheduled rotation: rotate keys every 90 days
- Design zero-downtime rotation: support old and new keys temporarily
- Create key inventory: track all active keys
- Implement emergency rotation: quickly rotate compromised keys

### Content Access Control

Manage content permissions:

**Content-Level Access**
- Implement permission inheritance: folder permissions apply to children
- Design permission delegation: allow users to grant limited permissions
- Create permission groups: simplify management with role-based groups
- Implement time-limited access: temporary access with expiration

**API Endpoint Permissions**
- Design scope-based permissions: tokens have specific scope (read/write)
- Implement content type restrictions: limit access by content type
- Create locale restrictions: limit access by language
- Implement branch restrictions: limit access by environment

**Query-Level Security**
- Implement field-level security: expose only authorized fields
- Design query filtering: automatically filter by user permissions
- Create permission caching: cache permission checks for performance
- Implement permission audit: log permission checks for sensitive queries

### Webhook Verification

Ensure webhook authenticity:

**Webhook Signature Verification**
```javascript
function verifyWebhookSignature(body, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(body))
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
```

**Webhook Security**
- Implement signature verification: verify webhook authenticity
- Design timestamp validation: ensure recent webhooks
- Create delivery verification: confirm webhook receipts
- Implement replay protection: prevent duplicate processing

**Webhook Receiver Security**
- Implement TLS validation: verify webhook endpoint TLS certificate
- Design error handling: graceful handling of webhook failures
- Create authentication: authenticate webhook receiver
- Implement logging: detailed webhook delivery logging

## Content Graph Security

### Query Complexity Limits

Prevent DoS attacks:

**Query Complexity Calculation**
- Implement complexity score: assign score per field
- Design depth limits: limit query nesting depth
- Create connection limits: limit pagination size
- Implement timeout limits: maximum query execution time

**Complexity Example**
```
Simple query (complexity 1):
  product { title }  // 1 + 1 = 2

Complex query (complexity 5):
  products {         // 1
    edges {          // 1
      node {         // 1
        reviews {    // 3 (multiple nested connections)
          edges {    // 1
            node {   // 1
```

**Rate Limiting**
- Implement per-user limits: limit queries per user
- Design per-token limits: limit queries per API token
- Create burst allowance: allow temporary spikes
- Implement gradual backoff: increase wait time on rate limit

### Sensitive Content Filtering

Exclude unauthorized content:

**Field-Level Filtering**
- Implement field authorization: check access before exposing field
- Design sensitive field masking: redact sensitive fields
- Create conditional field exposure: show fields based on user role
- Implement field-level auditing: log access to sensitive fields

**Query-Level Filtering**
- Implement automatic filtering: automatically filter results by permission
- Design transparent filtering: users don't see unauthorized results
- Create filter audit logging: log filtering decisions
- Implement filter performance: efficient permission filtering

**Content Type Restrictions**
- Implement type-level access: control access to content types
- Design type visibility: hide non-accessible types from schema
- Create error handling: appropriate error for unauthorized access
- Implement schema-level filtering: exclude unauthorized fields from schema

## DXP Cloud Security

### Environment Access Control

Manage environment permissions:

**Environment Roles**
- Developer: local development environments
- Staging: staging environment access
- Production: production environment access
- Administrator: all environment access

**Access Policy Pattern**
```
Development:
  - All developers can access
  - Code deployment automated from CI/CD

Staging:
  - QA team can access
  - Manual deployment approval required

Production:
  - Limited team access
  - Change control board approval required
  - Deployment window restrictions
```

**Just-In-Time Access**
- Implement temporary access: grant access for specific time period
- Design approval workflow: require approval for production access
- Create audit logging: log all environment access
- Implement emergency access: emergency production access with approval

### Secrets Management

Secure credential storage:

**Secret Types**
- API Keys: third-party service credentials
- Database passwords: database connection credentials
- Certificates: TLS certificates
- Tokens: authentication tokens for integrations

**Secret Storage**
- Implement secret vault: dedicated secure storage
- Design environment-specific secrets: different secrets per environment
- Create secret versioning: version secrets for rollback
- Implement automatic rotation: rotate secrets on schedule

**Secret Access**
- Implement least privilege: applications only access needed secrets
- Design audit logging: log all secret access
- Create secret usage monitoring: alert on unusual access
- Implement secret injection: inject secrets at runtime, not in code

**DXP Cloud Secret Management**
- Implement Secrets API: manage secrets via API
- Design environment variable injection: secrets injected as environment variables
- Create rotation automation: automate secret rotation
- Implement zero-downtime rotation: rotate without application restart

### Network Configuration

Secure network access:

**Network Policies**
- Implement IP allowlisting: restrict connections by IP
- Design VPN requirements: require VPN for sensitive operations
- Create egress filtering: control outbound connections
- Implement ingress filtering: control inbound connections

**TLS Configuration**
- Implement minimum TLS version: TLS 1.2 minimum
- Design cipher suite selection: strong ciphers only
- Create certificate pinning: pin trusted certificates
- Implement HSTS: enforce HTTPS connections

**DDoS Protection**
- Implement rate limiting: limit request rate per IP
- Design connection limits: limit concurrent connections
- Create traffic pattern analysis: detect attack patterns
- Implement automatic mitigation: activate protection on attack

## Commerce Security

### PCI Compliance

Protect payment data:

**PCI DSS Requirements**
- Implement secure network: firewall, intrusion detection
- Design data protection: encryption in transit and at rest
- Create access control: role-based access to payment data
- Implement monitoring: comprehensive logging and monitoring

**Payment Data Handling**
- Never store full PAN: never store full credit card numbers
- Implement tokenization: use payment tokens instead of card data
- Design secure transmission: TLS for all payment data transmission
- Create data minimization: collect only necessary payment data

**PCI Compliance Verification**
- Implement compliance audits: annual compliance verification
- Design vulnerability scanning: regular security scanning
- Create penetration testing: test security controls
- Implement incident response: plan for security incidents

### Payment Gateway Security

Secure payment processing:

**Gateway Integration**
- Implement HTTPS only: secure channel for all payment requests
- Design request validation: validate payment requests
- Create response verification: verify gateway responses
- Implement error handling: secure error handling without exposing data

**Hosted Payment Pages**
- Implement hosted checkout: never handle card data directly
- Design form validation: client-side validation for usability
- Create SSL/TLS: encrypted payment transmission
- Implement CSP headers: prevent script injection

**Webhook Validation**
- Implement signature verification: verify webhook authenticity
- Design duplicate protection: prevent processing duplicate webhooks
- Create error handling: graceful failure handling
- Implement audit logging: detailed webhook logging

### Customer Data Protection

Secure customer information:

**Data Classification**
- PII: personally identifiable information (encrypted, access restricted)
- Financial data: payment and transaction data (PCI compliance)
- Behavioral data: customer interaction data (aggregated, anonymized)
- Preference data: customer preferences (access controlled)

**Encryption Strategy**
- Implement encryption at rest: database encryption for sensitive data
- Design encryption in transit: TLS for data transmission
- Create key management: secure key storage and rotation
- Implement encryption transparency: transparent to applications

**Data Minimization**
- Implement minimal collection: collect only necessary data
- Design data retention: delete data when no longer needed
- Create user consent: explicit consent for data collection
- Implement user rights: support data access and deletion requests

## Opal AI Security

### Instructions as Guardrails

Implement AI safety through careful instructions:

**Instruction Design**
- Define scope: explicitly state what agent should do
- Create boundaries: clearly state what agent should NOT do
- Design verification: require human verification for sensitive operations
- Implement escalation: escalate to human for edge cases

**Sensitive Operations**
- Publishing decisions: human approval required before publishing
- Content deletion: human confirmation for deletions
- Data access: limit data access to minimum needed
- External communications: human review before sending

**Jailbreak Prevention**
- Implement instruction clarity: unambiguous, explicit instructions
- Design constraint enforcement: technical controls preventing violations
- Create monitoring: detect attempts to override instructions
- Implement audit logging: log all agent decisions

### Tool Permission Scope

Limit agent tool access:

**Tool Access Matrix**
```
Agent: Content Creation Assistant

Tools:
  create_content: Yes
    - Only in "Draft" status
    - Limited to product descriptions
    - Max 1000 words

  publish_content: No
    - Blocked entirely, requires human approval

  modify_existing: Yes
    - Only to own created content
    - Not to published content

  delete_content: No
    - Blocked entirely
```

**Permission Levels**
- Read-only: view data only
- Create: create new items in limited scope
- Modify: modify items within scope
- Delete: remove items (restricted)
- Approve: authorize others' work (restricted)

**Dynamic Permissions**
- Implement time-based access: access available during working hours
- Design quota limits: limit operations per time period
- Create escalation: escalate on limit exceeded
- Implement review loops: human review after quota exhaustion

### Data Access Controls

Limit AI agent data exposure:

**Data Visibility**
- Implement field-level access: expose only necessary fields
- Design data aggregation: aggregate data to reduce PII exposure
- Create data anonymization: anonymize sensitive data
- Implement redaction: redact sensitive values

**Data Handling**
- Implement memory management: clear sensitive data from memory
- Design output filtering: filter sensitive data from outputs
- Create audit logging: log data accessed by agents
- Implement breach response: procedures for data access anomalies

## OWASP Considerations

### Injection Attacks Prevention

Prevent code and command injection:

**Input Validation**
- Implement strict validation: validate all user input
- Design whitelist approach: only allow expected characters
- Create encoding: properly encode output
- Implement parameterized queries: use parameterized database queries

**CMS Specific Risks**
- Script injection in content fields: sanitize HTML content
- Shell command injection in scheduled jobs: validate job parameters
- SQL injection in custom queries: use parameterized queries
- File path traversal: validate file paths

### Cross-Site Scripting Prevention

Prevent XSS attacks:

**Content Sanitization**
- Implement HTML sanitization: remove dangerous tags from content
- Design script filtering: filter out script tags
- Create event handler removal: remove onclick, onload handlers
- Implement CSP headers: Content Security Policy headers

**Display Template Security**
- Implement output encoding: encode content for display context
- Design context-aware encoding: different encoding per context (HTML, URL, JavaScript)
- Create template review: security review of templates
- Implement auto-escaping: templates auto-escape by default

### Cross-Site Request Forgery Prevention

Prevent CSRF attacks:

**CSRF Token Implementation**
- Implement token generation: generate unique token per session
- Design token validation: validate token on form submission
- Create token rotation: rotate tokens after use
- Implement SameSite cookies: restrict cookie sending on cross-site requests

**API CSRF Protection**
- Implement header validation: require specific headers (X-Requested-With)
- Design origin checking: validate request origin
- Create token validation: require CSRF token for mutating operations

## GDPR and Data Privacy

### Privacy by Design

Embed privacy in architecture:

**Data Minimization**
- Collect minimal data: only data needed for purposes
- Design retention policies: delete data when no longer needed
- Create purpose limitation: use data only for stated purposes
- Implement consent management: manage user consent

**Data Protection**
- Implement encryption: encrypt sensitive data
- Design access controls: role-based access
- Create audit logging: log data access
- Implement breach notification: procedures for security incidents

### User Rights Support

Enable GDPR rights:

**Right to Access**
- Implement data export: export user data in standard format
- Design completeness: export includes all user data
- Create timeliness: provide data within 30 days
- Implement verification: verify user identity

**Right to Deletion**
- Implement deletion: remove user data on request
- Design completeness: delete data across systems
- Create exceptions: maintain deletion exceptions (legal requirements)
- Implement verification: confirm deletion completion

**Right to Rectification**
- Implement data update: allow users to update their data
- Design verification: verify updates before application
- Create audit trails: maintain records of corrections
- Implement notification: notify data processors of corrections

**Right to Data Portability**
- Implement standard formats: export in standard formats
- Design completeness: include all user data
- Create machine readability: data in machine-readable format
- Implement ease of transfer: facilitate transfer to other services

## Security Testing

### Vulnerability Assessment

Regular security evaluation:

**Static Analysis**
- Implement code scanning: automated security code analysis
- Design vulnerability detection: identify known vulnerabilities
- Create dependency scanning: scan for vulnerable dependencies
- Implement results review: security team reviews findings

**Dynamic Testing**
- Implement penetration testing: authorized security testing
- Design vulnerability exploitation: test vulnerability impact
- Create remediation validation: verify fixes
- Implement retesting: retest after remediation

### Compliance Verification

Ensure ongoing compliance:

**Regular Audits**
- CMS access control audits: verify appropriate access
- API authentication audits: verify authentication configuration
- Data encryption audits: verify encryption in place
- Compliance documentation: maintain compliance records

**Monitoring and Alerting**
- Implement threat detection: detect suspicious activity
- Design anomaly detection: identify unusual patterns
- Create alert escalation: route alerts appropriately
- Implement response procedures: procedures for responding to alerts

## Implementation Best Practices

1. **Principle of Least Privilege**: Grant minimum permissions needed
2. **Defense in Depth**: Multiple security layers, not single control
3. **Secure by Default**: Secure defaults, require opt-in for risky features
4. **Audit Everything**: Comprehensive logging of security-relevant events
5. **Encrypt Sensitive Data**: Data encryption at rest and in transit
6. **Validate Input**: Validate all user input rigorously
7. **Encode Output**: Context-aware output encoding
8. **Keep Dependencies Updated**: Regular security patches
9. **Security Training**: Regular training for development teams
10. **Incident Response Plan**: Plan and procedures for security incidents
