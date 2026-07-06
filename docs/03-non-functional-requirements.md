# 03. Non-Functional Requirements

## Purpose

This document defines the non-functional requirements for the Multi-Tenant SaaS Backend.

Non-functional requirements describe the quality attributes the system must satisfy: security, performance, reliability, maintainability, observability, scalability, testability, and deployment readiness. These requirements constrain how the functional requirements should be implemented.

The goal is not to claim unrealistic production scale. The goal is to define measurable, defensible engineering standards for a backend portfolio project that can be implemented, tested, deployed, and explained clearly in interviews.

## Scope

This document covers:

- Security requirements.
- Performance requirements.
- Scalability requirements.
- Reliability and availability requirements.
- Data integrity requirements.
- Maintainability requirements.
- Testability requirements.
- Observability requirements.
- Operational requirements.
- Deployment and environment requirements.
- Documentation requirements.
- Compliance-inspired requirements appropriate for a portfolio project.

Out of scope:

- Exact endpoint contracts.
- Database collection schemas.
- Infrastructure provisioning scripts.
- Detailed load test implementation.
- Source code.

Detailed designs will be covered in later documents:

- `08-database-design.md`
- `10-authentication-design.md`
- `11-rbac-design.md`
- `12-multi-tenancy-design.md`
- `15-logging-monitoring.md`
- `17-security.md`
- `18-testing-strategy.md`
- `19-infrastructure.md`
- `20-deployment.md`
- `21-performance.md`

## Responsibilities

The backend must be designed to:

- Protect tenant data from unauthorized access.
- Fail predictably and safely.
- Handle expected portfolio-scale traffic without inefficient query patterns.
- Keep implementation maintainable through clear module boundaries.
- Provide enough logs and health signals for debugging.
- Make performance and resume claims measurable.
- Support reproducible local development and deployment.
- Avoid unnecessary distributed-system complexity.

## Quality Attribute Summary

| Attribute | Requirement |
|---|---|
| Security | Secure by default, tenant-isolated, RBAC-enforced, validated inputs, protected secrets. |
| Performance | Indexed queries, pagination, bounded payloads, asynchronous external work. |
| Reliability | Graceful failure, retries for background jobs, health checks, safe shutdown. |
| Maintainability | Modular monolith, layered architecture, clear ownership, low coupling. |
| Testability | Unit, integration, API, auth, RBAC, tenant isolation, and performance tests. |
| Observability | Structured logs, request IDs, health checks, job visibility. |
| Scalability | Scale vertically and horizontally within a simple stateless API design. |
| Deployability | Dockerized, environment-driven, CI-validated, free-tier compatible. |

## Security Requirements

### Authentication Security

The system must authenticate users securely.

Requirements:

- Passwords must be hashed using bcrypt or an equivalent adaptive hashing algorithm.
- Plaintext passwords must never be stored or logged.
- Access tokens must be short-lived.
- Refresh tokens must be rotatable and revocable.
- Refresh token reuse must be detectable.
- Login and refresh endpoints must be rate-limited.
- Authentication errors must not reveal whether a user account exists.
- Disabled or deleted users must not receive new sessions.

### Authorization Security

The system must authorize every protected action.

Requirements:

- Authorization must be enforced server-side.
- RBAC must be evaluated in the context of the active organization.
- Permissions must deny by default.
- Platform-level and organization-level permissions must be separated.
- Privileged actions must generate audit logs.
- Users must not be able to modify their own role unless explicitly permitted.
- The final organization owner must not be removable or demotable through normal flows.

### Tenant Isolation

Tenant isolation is a critical security requirement.

Requirements:

- Tenant-scoped resources must include organization context.
- Tenant-scoped queries must filter by organization.
- Users must have active membership before accessing organization resources.
- Cross-tenant access must be covered by integration tests.
- Background jobs must include tenant context when processing tenant data.
- Audit logs must include tenant context where applicable.

### Input Validation and Sanitization

The system must validate and sanitize all client-controlled input.

Requirements:

- Request bodies must be validated before business logic.
- Query parameters must be validated before database access.
- Object IDs must be validated before use.
- Unknown fields should be rejected or stripped consistently.
- Search input must be constrained to prevent expensive queries.
- NoSQL injection must be prevented by schema validation and safe query construction.
- File metadata must validate filename, MIME type, size, and parent resource.

### Transport and Browser Security

Requirements:

- Production traffic must use HTTPS.
- Security headers should be applied through Helmet or equivalent middleware.
- CORS must allow only approved origins.
- Cookie settings must use `HttpOnly`, `Secure`, and `SameSite` where cookie-based refresh tokens are used.
- CSRF risk must be evaluated if refresh tokens are stored in cookies.

### Secrets Management

Requirements:

- Secrets must come from environment variables or managed secret stores.
- Secrets must never be committed to source control.
- Required environment variables must be validated at startup.
- Development secrets must be clearly separated from production secrets.
- Token signing secrets must be long, random, and rotatable.

## Performance Requirements

### API Latency

The backend should be designed for predictable latency under realistic portfolio-scale load.

Targets for local or staging benchmarks must be measured before being used in resumes or documentation.

Initial design goals:

- Simple read endpoints should avoid unnecessary database round trips.
- List endpoints must use pagination.
- Expensive work must not run synchronously inside request handlers.
- External provider calls should be delegated to background jobs where practical.
- Response payloads should be bounded.

No specific millisecond latency claim should be made until measured with a documented test setup.

### Database Performance

MongoDB queries must be designed around expected access patterns.

Requirements:

- Tenant-scoped collections must use indexes that include `organizationId` where appropriate.
- List filters must be supported by indexes before implementation.
- Unbounded collection scans must be avoided for core workflows.
- Pagination must be required for large collections.
- Sorting must use indexed fields where practical.
- Unique constraints must be scoped correctly, such as unique organization slug or unique team name per organization if required.
- Query plans should be reviewed for critical endpoints during performance work.

### Caching Performance

Redis caching must be used only for clear read-heavy or operational needs.

Requirements:

- Cached data must have explicit TTLs.
- Cache keys must include tenant context where data is tenant-scoped.
- Cache invalidation rules must be documented before use.
- The system must remain functionally correct if Redis cache data is missing.
- Cache failures must degrade gracefully where possible.

### Background Processing

Slow or retryable tasks must move to BullMQ workers.

Requirements:

- Notification delivery must not block API responses.
- Retry policies must be configured for transient failures.
- Jobs must be idempotent where practical.
- Failed jobs must be inspectable.
- Workers must support graceful shutdown.

## Scalability Requirements

The system must be scalable within the constraints of a modular monolith.

Requirements:

- API servers should be stateless except for external stores.
- Sessions must not depend on in-memory server state.
- MongoDB must remain the source of truth.
- Redis may support cache, queues, and rate limiting.
- Background workers should be independently scalable from API processes.
- Tenant-scoped indexes must support growth in organizations, users, tickets, and comments.

Explicitly not required:

- Multi-region architecture.
- Service mesh.
- Kubernetes.
- Event streaming platform.
- Database sharding in the initial design.

## Reliability Requirements

### Failure Handling

The system must fail safely and predictably.

Requirements:

- API errors must use a consistent response format.
- Internal errors must not leak stack traces in production.
- Database connection failures must be logged clearly.
- Redis failures must not break core database-backed reads and writes unless Redis is required for the specific operation.
- Queue failures must surface operational errors and avoid silent job loss.

### Graceful Shutdown

API and worker processes must shut down gracefully.

Requirements:

- Stop accepting new requests during shutdown.
- Allow in-flight requests a bounded time to finish.
- Close MongoDB connections.
- Close Redis connections.
- Stop BullMQ workers safely.
- Log shutdown reason and outcome.

### Data Durability

Requirements:

- Business-critical state must be persisted before dependent jobs are queued.
- Audit logs should be written for critical state changes.
- Soft deletion should preserve recovery and investigation capability.
- Refresh token state must be persisted enough to support revocation and reuse detection.

## Availability Requirements

The project should target practical availability for a free-tier deployment, not enterprise SLA guarantees.

Requirements:

- Expose liveness health checks.
- Expose readiness checks for critical dependencies.
- Avoid startup success when required environment variables are missing.
- Avoid request handlers that can hang indefinitely.
- Use timeouts for external provider calls.
- Keep deployment architecture simple enough to operate.

No uptime percentage should be claimed unless measured through monitoring over a defined period.

## Data Integrity Requirements

The system must preserve consistency for critical workflows.

Requirements:

- Organization creation and owner membership creation must be atomic.
- Role changes must preserve at least one organization owner.
- Invitation acceptance must not create duplicate active memberships.
- Ticket assignment must verify same-organization membership.
- Comment and attachment creation must verify access to parent ticket.
- Refresh token rotation must prevent token replay.
- Audit logs should include enough metadata to reconstruct important actions.

MongoDB transactions should be used when multiple writes must succeed or fail together and the deployment supports them.

## Maintainability Requirements

The backend must be easy to reason about and modify.

Requirements:

- Use a modular monolith structure.
- Separate routes, controllers, services, repositories, middleware, validations, and infrastructure adapters.
- Keep business logic out of route declarations.
- Keep database access out of controllers.
- Keep provider-specific logic behind adapters.
- Use consistent naming conventions.
- Keep modules cohesive around business domains.
- Avoid circular dependencies between modules.
- Prefer explicit behavior over hidden magic.

## Testability Requirements

The system must be designed for automated testing.

Required test categories:

- Unit tests for pure business logic and utilities.
- Service tests for workflows.
- Repository or integration tests for MongoDB behavior where needed.
- API tests with Supertest.
- Authentication tests.
- Authorization tests.
- Tenant isolation tests.
- Validation tests.
- Background job tests.
- Error handling tests.
- Performance tests for selected critical flows.

Requirements:

- Critical authorization failures must be tested.
- Cross-tenant access attempts must be tested.
- Refresh token rotation and reuse detection must be tested.
- Tests must use deterministic fixtures.
- Test data must not depend on production services.

## Observability Requirements

### Logging

The system must produce structured logs.

Requirements:

- Include request correlation ID.
- Include HTTP method, route pattern, status code, and duration for API requests.
- Include user ID and organization ID where safe and available.
- Include job ID, job name, and attempt count for workers.
- Avoid logging passwords, tokens, secrets, or sensitive payloads.
- Use appropriate log levels.

### Health Checks

Requirements:

- Liveness endpoint should confirm the process is running.
- Readiness endpoint should confirm required dependencies are available.
- Health responses must not expose secrets.
- Expensive health checks must be avoided on high-frequency probes.

### Metrics and Monitoring

The project should be designed to support metrics even if the first deployment uses basic logging.

Useful metrics:

- Request count.
- Error count.
- Request duration.
- Authentication failure count.
- Rate limit events.
- Queue depth.
- Job failures.
- Database query latency for critical operations where measurable.

Any metric used in resume claims must be generated by reproducible tests, logs, or monitoring data.

## Operational Requirements

### Configuration

Requirements:

- Configuration must be environment-driven.
- Required variables must be validated on startup.
- Optional variables must have safe defaults.
- Development, test, and production configuration must be separated.
- Configuration validation errors must fail fast.

### Rate Limiting

Requirements:

- Authentication endpoints must have strict rate limits.
- Public or unauthenticated endpoints must be rate-limited.
- Tenant-sensitive write endpoints should have reasonable abuse protection.
- Rate limit keys should consider IP, user, and tenant where appropriate.
- Rate limit responses must be consistent.

### File Handling

The backend must not store uploaded file binaries in MongoDB.

Requirements:

- Store attachment metadata only.
- Validate file metadata.
- Use external object storage for binary content in future implementation.
- Use signed URLs or equivalent secure access pattern when object storage is added.

## Deployment Requirements

The system must support practical deployment using the selected stack.

Requirements:

- Dockerfile must be planned for API runtime.
- Docker Compose must support local MongoDB and Redis where appropriate.
- Render deployment must be documented.
- MongoDB Atlas must be supported as the hosted database.
- Upstash Redis must be supported as hosted Redis.
- GitHub Actions must run validation before deployment.
- Nginx configuration should be documented where reverse proxy behavior is needed.

Deployment must not depend on local machine state.

## Documentation Requirements

Documentation must be detailed enough for another engineer to implement the system.

Requirements:

- Every document must define purpose, scope, responsibilities, design decisions, trade-offs, alternatives, best practices, risks, and future improvements where applicable.
- Mermaid diagrams should be used where they clarify architecture or flow.
- API documentation must eventually define method, URL, authentication, authorization, request body, response body, validation, errors, and status codes.
- Architecture decisions must be recorded as ADRs.
- Resume feature mapping must avoid invented metrics.

## Design Decisions

### Measurable Claims Only

The project must not claim performance, scale, uptime, or reliability numbers without evidence.

Reasoning:

- Interviewers can challenge invented metrics quickly.
- Honest measurement is more defensible than inflated claims.
- A reproducible k6 test with modest results is stronger than vague scale claims.

### Security as a Baseline

Security requirements are treated as core backend requirements, not optional hardening.

Reasoning:

- Multi-tenant systems fail badly when security is treated late.
- Auth, RBAC, validation, and tenant isolation shape the whole architecture.

### Operational Simplicity

The system should be deployable with Docker, Render, MongoDB Atlas, and Upstash Redis.

Reasoning:

- The deployment path is realistic for a portfolio.
- Simpler operations make the system easier to finish and explain.
- Avoiding Kubernetes and microservices keeps focus on backend fundamentals.

### Asynchronous External Work

External provider work should be asynchronous when practical.

Reasoning:

- Provider latency and failure should not dominate API request latency.
- Retries and dead-letter handling belong in worker workflows.

## Trade-offs

### Security Depth vs. Delivery Speed

Strong security requirements increase implementation effort.

This is acceptable because authentication, authorization, tenant isolation, and input validation are central to a credible SaaS backend.

### Observability vs. Complexity

Structured logging and health checks add setup work.

This is acceptable because debugging production-like deployments without logs and health signals is inefficient and unrealistic.

### Caching vs. Correctness

Redis can improve performance but adds invalidation complexity.

This is acceptable only when cache usage is documented, tenant-scoped, and safe to miss.

### Free-Tier Deployment vs. Production Guarantees

Render, MongoDB Atlas, and Upstash free tiers are practical but limited.

This is acceptable because the project should demonstrate deployability, not enterprise uptime. Any availability claims must be bounded by the actual deployment environment.

## Alternatives Considered

### Enterprise SLA Targets

Rejected.

Reason:

- Free-tier hosting cannot support serious SLA commitments.
- SLA claims would be misleading without monitoring, redundancy, and operational history.

### Aggressive Caching Everywhere

Rejected.

Reason:

- Caching before query patterns are understood creates correctness risk.
- MongoDB indexes and pagination should be solved first.
- Redis should support specific bottlenecks, not mask poor data design.

### In-Memory Sessions

Rejected.

Reason:

- In-memory sessions break horizontal scaling.
- Process restarts would invalidate server state unpredictably.
- Refresh token state belongs in persistent storage.

### Hard Deletes for Operational Simplicity

Rejected for normal business records.

Reason:

- Hard deletes reduce auditability.
- Soft delete supports investigation and recovery.
- Tenant systems need historical traceability.

## Best Practices

The system should follow these non-functional best practices:

- Validate configuration at startup.
- Fail fast on missing critical environment variables.
- Use consistent error responses.
- Keep access tokens short-lived.
- Rotate refresh tokens.
- Scope every tenant cache key by organization.
- Require pagination for large lists.
- Use compound indexes for tenant-scoped queries.
- Keep external provider calls out of request-critical paths where possible.
- Use structured logs, not ad hoc console output.
- Avoid logging sensitive data.
- Prefer simple deployment over unnecessary infrastructure.
- Document every performance claim with measurement method.

## Risks

### Overstated Production Claims

Claiming unmeasured scale or uptime can damage credibility.

Mitigation:

- Use measured results only.
- Document test environment and methodology.
- Keep resume claims tied to implemented features.

### Security Regression

Future implementation may accidentally bypass tenant or RBAC rules.

Mitigation:

- Require tenant isolation and authorization tests.
- Centralize permission checks.
- Keep repository access tenant-aware.

### Poor Query Performance

Flexible filters can cause collection scans.

Mitigation:

- Define query patterns before indexes.
- Limit supported filters.
- Review query plans for critical endpoints.

### Redis Dependency Misuse

Using Redis as required state can make outages more damaging.

Mitigation:

- Keep MongoDB as source of truth.
- Treat cache misses as normal.
- Document operations that truly require Redis, such as queue processing.

### Weak Observability

Without logs and correlation IDs, debugging failures becomes guesswork.

Mitigation:

- Add request IDs from the start.
- Log structured request and job lifecycle events.
- Exclude secrets from logs.

## Future Improvements

Potential improvements after the core backend is implemented and deployed:

- Add metrics collection with Prometheus-compatible instrumentation.
- Add dashboarding through a managed monitoring provider.
- Add centralized log aggregation.
- Add MongoDB Atlas Search for richer ticket search.
- Add object storage with signed URLs.
- Add deployment smoke tests.
- Add scheduled backup and restore documentation.
- Add uptime monitoring with historical reports.
- Add synthetic checks for critical user journeys.

These should be added only when the core system is stable enough that extra operational tooling provides real value.
