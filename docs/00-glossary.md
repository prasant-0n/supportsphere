# 00. Glossary

## Purpose

This document is the official terminology reference for the Multi-Tenant SaaS Backend.

All architecture, API, database, security, testing, and deployment documents should use these terms consistently. When a term has business and technical meaning, this glossary defines the project-specific meaning to avoid ambiguity during implementation.

## Naming Rules

- Use **Organization** for the business entity customers belong to.
- Use **Tenant** when discussing isolation, data ownership, tenancy strategy, and security boundaries.
- Use **Member** for a user inside an organization.
- Use **Membership** for the relationship between a user and an organization.
- Use **Role** for a named responsibility group.
- Use **Permission** for a specific allowed action.
- Use **Ticket** for the main work item.
- Use **Comment** for discussion attached to a ticket.
- Use **Attachment** for file metadata linked to a ticket or comment.
- Use **Worker** for a background process that consumes queued jobs.
- Use **Job** for a unit of asynchronous work.
- Use **Access Token** and **Refresh Token** explicitly. Do not call both simply "token" when precision matters.

## Business Terminology

| Term | Definition |
|---|---|
| Tenant | A logical customer boundary used to isolate data and permissions. In this project, each organization is a tenant. |
| Organization | A customer-owned workspace that contains members, teams, tickets, comments, attachments, notifications, and audit logs. |
| User | A person with an account in the system. A user can belong to multiple organizations through memberships. |
| Member | A user who has an active relationship with an organization. |
| Membership | The record connecting a user to an organization, including role, status, and invitation lifecycle information. |
| Invitation | A pending request for a user or email address to join an organization. |
| Team | A group of organization members used for ticket ownership, routing, and management. |
| Ticket | The primary work item representing a support request, customer issue, internal task, or operational item. |
| Comment | A message attached to a ticket for collaboration and history. |
| Attachment | Metadata for a file associated with a ticket or comment. File binaries should live in external object storage. |
| Notification | A message or event delivered to a user because of relevant activity, such as assignment or invitation. |
| Audit Log | An append-only record of security-sensitive or business-critical activity. |
| Workspace | Informal synonym for organization. Architecture documents should prefer organization. |
| Assignee | The user or team responsible for handling a ticket. |
| Creator | The user who created a resource such as a ticket or comment. |
| Watcher | A user who receives updates about a ticket without necessarily owning it. Watchers are a future enhancement unless explicitly required. |

## Role Terminology

| Term | Definition |
|---|---|
| Owner | The highest-privilege organization role. Owners can manage organization settings, members, roles, and critical administrative actions. |
| Admin | A privileged organization role for operational administration. Admins can manage members, teams, and tickets subject to owner-protected restrictions. |
| Manager | A team or workflow lead who can manage tickets and team-scoped operations. |
| Agent | A regular operational user who works on assigned or visible tickets. |
| Viewer | A read-only organization role. This role is optional but useful for audit, stakeholder, or observer access. |
| System Worker | A trusted background process that performs queued work. It is not a human role and must operate with explicit job context. |

## Technical Terminology

| Term | Definition |
|---|---|
| Modular Monolith | A single deployable application organized into clear business modules with disciplined internal boundaries. |
| Layered Architecture | An architecture style separating routes, controllers, services, repositories, middleware, and infrastructure adapters. |
| Route | The HTTP mapping layer that connects request paths and methods to controller behavior. |
| Controller | The layer responsible for request parsing, response shaping, and delegation to services. |
| Service | The layer containing business workflows, transaction boundaries, and coordination between repositories and infrastructure. |
| Repository | The data access layer responsible for MongoDB reads and writes. |
| Middleware | Reusable Express processing logic for authentication, validation, RBAC, errors, logging, and rate limiting. |
| Infrastructure Adapter | A wrapper around external systems such as Redis, BullMQ, notification providers, or object storage. |
| DTO | Data Transfer Object. A structured request or response shape used at API boundaries. |
| Request Context | Per-request metadata such as request ID, authenticated user, organization context, and permissions. |
| Correlation ID | A unique identifier used to trace a request or workflow across logs and background jobs. |

## Security Terms

| Term | Definition |
|---|---|
| Authentication | The process of proving user identity. |
| Authorization | The process of deciding whether an authenticated actor may perform an action. |
| Tenant Isolation | The guarantee that users can access only data belonging to organizations where they have valid permissions. |
| RBAC | Role-Based Access Control. A model where roles map to permissions. |
| Permission | A specific allowed action, such as `ticket:create` or `member:updateRole`. |
| Principle of Least Privilege | Users and processes receive only the permissions required for their responsibilities. |
| Defense in Depth | Applying multiple layers of protection instead of relying on a single security control. |
| NoSQL Injection | Manipulating database queries through unsafe input objects or operators. |
| Rate Limiting | Restricting request frequency to reduce abuse, brute force attempts, and accidental overload. |
| Secret | Sensitive configuration such as JWT signing keys, database credentials, API keys, or provider tokens. |
| Sensitive Data | Data that must not be logged or exposed unnecessarily, including passwords, tokens, secrets, and private user details. |
| Soft Delete | Marking a record as deleted without physically removing it from storage. |

## Authentication Terms

| Term | Definition |
|---|---|
| Access Token | A short-lived token used to authenticate API requests. |
| Refresh Token | A longer-lived token used to obtain new access tokens without re-entering credentials. |
| Refresh Token Rotation | Replacing a refresh token every time it is used, then revoking the previous token. |
| Token Family | A chain of refresh tokens derived from an original login session. |
| Token Reuse Detection | Detecting use of a refresh token that was already rotated or revoked. |
| Session | A logical authenticated login represented by refresh token state and related metadata. |
| Password Hash | A one-way hashed password value generated with bcrypt or equivalent adaptive hashing. |
| Credential | User-provided proof of identity, such as email and password. |
| Logout | Revoking the active session so the refresh token can no longer be used. |
| Global Logout | Revoking all active sessions for a user. |

## Authorization Terms

| Term | Definition |
|---|---|
| Role | A named set of responsibilities assigned to a member inside an organization. |
| Permission Matrix | A table mapping roles to allowed actions. |
| Role Hierarchy | Rules defining which roles can manage or assign other roles. |
| Organization-Scoped Permission | A permission evaluated inside one organization context. |
| Platform-Scoped Permission | A permission evaluated at the system level, outside a single organization. |
| Deny by Default | The rule that access is rejected unless explicitly allowed. |
| Ownership Rule | A rule allowing access based on resource ownership, such as a comment author editing their own comment. |
| Final Owner Rule | A safety rule preventing removal or demotion of the last organization owner. |

## Database Terms

| Term | Definition |
|---|---|
| Collection | A MongoDB grouping of documents, similar to a table in relational databases. |
| Document | A MongoDB record stored as a JSON-like object. |
| ObjectId | MongoDB's standard unique identifier type. |
| Schema Validation | MongoDB or application-level enforcement of required fields, types, and allowed values. |
| Index | A database structure that improves query performance for selected fields. |
| Compound Index | An index over multiple fields, commonly including `organizationId` for tenant-scoped queries. |
| Unique Constraint | A rule preventing duplicate values for a field or field combination. |
| TTL Index | A MongoDB index that automatically removes documents after a configured time. |
| Aggregation | A MongoDB pipeline for transforming, grouping, filtering, or calculating data. |
| Transaction | A database operation group that succeeds or fails atomically. |
| Source of Truth | The authoritative data store for business state. In this project, MongoDB is the source of truth. |

## Queue Terms

| Term | Definition |
|---|---|
| Queue | A durable list of jobs waiting to be processed asynchronously. |
| BullMQ | The Redis-backed queue library selected for background jobs. |
| Job | A single unit of asynchronous work, such as sending a notification. |
| Worker | A process that consumes jobs from a queue. |
| Retry | A later attempt to process a failed job. |
| Backoff | A delay strategy between retries. |
| Dead Letter | A failed job state requiring inspection after retry exhaustion. |
| Idempotency | The property that retrying an operation does not create duplicate harmful side effects. |
| Job Payload | The data required by a worker to process a job. |
| Job Context | Metadata included with a job, such as organization ID, actor ID, correlation ID, and target resource ID. |

## Caching Terms

| Term | Definition |
|---|---|
| Cache | A faster temporary store used to reduce repeated database or computation work. |
| Redis | The in-memory data store used for caching, rate limiting support, and BullMQ. |
| Cache Key | A unique string identifying a cached value. Tenant-scoped keys must include organization context. |
| TTL | Time to Live. The duration before cached data expires automatically. |
| Cache Invalidation | Removing or updating cached data when source data changes. |
| Cache Miss | A lookup where the requested value is not present in cache. |
| Cache Hit | A lookup where the requested value is present in cache. |
| Stale Data | Cached data that no longer matches the source of truth. |
| Graceful Degradation | Continuing core behavior when cache data is unavailable, usually by reading from MongoDB. |

## Infrastructure Terms

| Term | Definition |
|---|---|
| Docker | Containerization technology used to package the application runtime. |
| Docker Compose | A local orchestration tool for running the API and dependencies during development. |
| Nginx | A reverse proxy used for routing, TLS termination, compression, or request handling where applicable. |
| Render | The planned hosting platform for the backend API. |
| MongoDB Atlas | The managed MongoDB hosting platform. |
| Upstash Redis | The managed Redis-compatible hosting platform. |
| GitHub Actions | The CI/CD automation system used for validation and deployment workflows. |
| Environment Variable | Runtime configuration supplied outside source code. |
| Health Check | An endpoint or command used to determine whether a process or dependency is healthy. |
| Liveness Check | A health check confirming the process is running. |
| Readiness Check | A health check confirming the process is ready to serve traffic. |

## Development Terms

| Term | Definition |
|---|---|
| Documentation First | Designing system behavior, architecture, and contracts before writing implementation code. |
| API First | Defining API contracts clearly before implementing handlers. |
| ADR | Architecture Decision Record. A documented decision with context, alternatives, trade-offs, and final choice. |
| Functional Requirement | A statement describing what the system must do. |
| Non-Functional Requirement | A statement describing system quality attributes such as security, reliability, and performance. |
| Acceptance Criteria | Specific conditions that prove a requirement is satisfied. |
| Test Fixture | Controlled test data used to make automated tests repeatable. |
| Integration Test | A test that verifies multiple components working together, such as API plus database behavior. |
| API Test | A test that verifies HTTP request and response behavior. |
| Tenant Isolation Test | A test proving users cannot access another organization's data. |
| Performance Test | A reproducible test used to measure throughput, latency, or resource behavior. |
| Resume Metric | A measured, evidence-backed project result suitable for resume use. |
