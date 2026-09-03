# Magnanimous BPO Operations

Magnanimous supports a multi-client outsourced-operations model alongside its contact-center stack.

## Operating model

- Tenant: the outsourcing company or operating organization.
- Client: a customer organization whose work must stay logically separated from other clients.
- Program: a contracted service line such as customer service, sales, appointment setting, back office, ecommerce support, technical support, collections support, or another authorized workflow.
- Work item: one unit of work assigned to a human agent, AI agent, or hybrid team.

## Controls

Each program can define channel, timezone, response SLA, resolution SLA, required skills, knowledge scope, service-level target, QA target, CSAT target, and queue association.

Work items track customer/account labels, priority, due date, first response, resolution, disposition, human assignment, AI assignment and metadata. Every significant mutation is written to an audit log.

## Regulated and banking clients

The platform can host a program for an authorized bank, insurer, healthcare organization, ecommerce company, public-sector organization or similar client. A named organization such as BDO must only be connected with that organization's authorized APIs, credentials, contractual permission and required security controls. The platform must never impersonate a bank or bypass a provider's authentication or authorization requirements.

For regulated programs, use per-client knowledge scopes, least-privilege credentials, explicit role access, audit logging, redaction/minimization of sensitive data, recording/consent policy controls, approved retention schedules, and provider-specific compliance requirements.

## Human + AI workforce

Magnanimous is designed so human and AI agents can operate against the same service programs while retaining separate actor identity and auditability. AI may assist with research, summarization, routing, knowledge retrieval, drafts and repetitive back-office work. Human review should remain available for regulated, high-impact, ambiguous or exception cases.

## Free-first principle

Core browser communication, internal work queues and native operations should remain free or low-cost wherever feasible. Carrier minutes, premium model inference, premium video/avatar providers and other externally metered services remain governed by plan entitlements and direct-cost limits.
