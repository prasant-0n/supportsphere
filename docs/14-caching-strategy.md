# 14. Caching Strategy

## Purpose

This document defines the caching strategy for the Multi-Tenant SaaS Backend.

It explains where caching is appropriate, how Redis is used, how cache keys are structured, how invalidation works, and how the system keeps caching safe and understandable for a production-oriented SaaS backend.

## Scope

This document covers:

- Where caching is appropriate in the system.
- Redis usage patterns and responsibilities.
- Cache key design and naming conventions.
- Cache invalidation and update strategy.
- TTL guidance and failure behavior.
- Risks and testing expectations.

Out of scope:

- Full distributed cache topology beyond the planned Redis usage.
- Advanced cache warming or precomputation strategies.
- Caching of sensitive secrets or authentication material.

## Responsibilities

The caching strategy must:

- improve read performance for repetitive or expensive operations,
- reduce unnecessary database load,
- support rate limiting and lightweight session-adjacent data,
- remain easy to reason about and debug,
- never become the source of truth for business data.

## Design Decisions

### 1. Redis for Lightweight Cache and Queue Backing

Redis is used for:

- short-lived cache entries,
- rate-limit counters,
- queue backing for BullMQ,
- lightweight session-adjacent state.

This keeps Redis focused on fast, ephemeral use cases rather than replacing MongoDB.

### 2. Cache Only Read-Heavy or Expensive Data

Caching is applied to data that is read frequently and not updated constantly.

Examples include:

- organization profile summaries,
- user profile summaries,
- active membership lists for common dashboards,
- frequently requested ticket list filters.

### 3. Explicit Invalidation Over Blind Refresh

The system uses explicit invalidation rather than relying on stale-but-acceptable data for critical mutations.

This is important because correctness matters more than aggressive caching in a tenant-aware SaaS platform.

## Trade-offs

- Caching improves performance but adds complexity around freshness and invalidation.
- Short TTLs reduce stale data risk but make caching less effective.
- Aggressive caching can make debugging harder when data appears inconsistent.

## Alternatives Considered

- Caching everything aggressively: simpler in theory, but high risk of stale data and difficult invalidation.
- No caching: simpler operationally, but misses an opportunity to reduce database load for common reads.
- Using Redis as a primary data store: not appropriate because MongoDB remains the source of truth.

## Best Practices

- Cache only data that is safe to serve slightly stale.
- Use clear cache key prefixes for each domain.
- Keep TTLs short for tenant-sensitive content.
- Invalidate on mutation events.
- Avoid caching secrets, password hashes, tokens, or sensitive audit data.

## Risks

- Stale cache values can mislead users or workers.
- Poorly scoped keys can cause cross-tenant cache collisions.
- Cache misses can increase database load if the system is not prepared for them.
- Redis outages should not take the application down if the cache is optional.

## Future Improvements

- Add cache warming for frequently accessed organization dashboards.
- Introduce more nuanced cache invalidation for ticket list queries.
- Add metrics for hit rate, miss rate, and latency.

## Cache Use Cases

### 1. Organization and User Summary Cache

Use Redis to cache lightweight summaries such as:

- organization profile data,
- user public profile data,
- team summary metadata.

These are good candidates because they are read frequently and rarely change in ways that require immediate propagation.

### 2. Ticket List Query Cache

For common list queries, the system may cache query results keyed by:

- organization ID,
- status,
- assignee,
- team,
- page,
- limit.

This is useful for dashboards and support queues.

### 3. Rate-Limiting State

Redis stores counters for:

- login attempts,
- password reset requests,
- general API throttling,
- tenant-specific abuse protection.

### 4. Session-adjacent Data

Redis may temporarily hold:

- short-lived session state,
- token family metadata,
- temporary verification values.

## Cache Key Design

Cache keys should be structured clearly and consistently.

Recommended pattern:

```text
{service}:{tenantScope}:{resource}:{identifier}:{variant}
```

Examples:

- `org:org_123:profile:summary`
- `tickets:org_123:status:open:page:1:limit:20`
- `user:user_456:profile:summary`

Keys should include enough context to avoid collisions across tenants and resource types.

## TTL Guidance

Suggested TTL strategy:

- profile summaries: 5 to 15 minutes,
- ticket list queries: 30 seconds to 5 minutes,
- rate limit counters: short-lived, based on policy,
- session-adjacent data: as short as necessary.

TTL should be shorter for data that changes frequently and longer for stable summaries.

## Invalidation Strategy

The following mutation events should trigger cache invalidation:

- organization profile update,
- membership role change,
- team creation or update,
- ticket create/update/delete,
- comment create/delete,
- attachment upload/remove,
- notification read state change,
- user profile change.

Recommended approach:

- invalidate relevant keys on write operations,
- if an exact invalidation is complex, use versioned keys or a short TTL,
- avoid stale cache entries for business-critical workflows.

## Cache Failure Behavior

If Redis is unavailable:

- the application should continue serving requests from the database,
- cache misses should not crash the request path,
- non-critical features should degrade gracefully,
- the system should log the issue and continue operating.

Redis should be treated as an optimization layer, not as the system’s only access path to business data.

## Observability

The system should track:

- cache hit rate,
- cache miss rate,
- cache write count,
- cache latency,
- invalidation count,
- Redis connection failures.

This helps demonstrate mature operational thinking and supports future interview discussions.

## Testing Expectations

Caching behavior should be tested for:

- successful cache population,
- cache hit and miss scenarios,
- invalidation after write operations,
- tenant key separation,
- fallback behavior when Redis is unavailable.
