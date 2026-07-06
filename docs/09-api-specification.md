# 09. API Specification

## Purpose

This document defines the HTTP API contract for the Multi-Tenant SaaS Backend.

It converts the functional requirements and architecture decisions into implementation-ready interface guidance. The goal is to make the backend easy to build, easy to review, and easy to defend in interviews.

## Scope

This document covers:

- API versioning and base URL conventions.
- Authentication, session, and tenant-aware endpoints.
- Organization, membership, team, ticket, comment, attachment, notification, and audit endpoints.
- Standard request and response patterns.
- Validation, pagination, filtering, sorting, and error handling.
- Authorization expectations and cross-tenant protection rules.

Out of scope:

- Express route implementation.
- Controller or service code.
- Database schema details.
- Frontend behavior.

## Responsibilities

The API design must:

- Provide a consistent interface for all major business workflows.
- Enforce authentication and authorization server-side.
- Make tenant context explicit and mandatory for organization-scoped resources.
- Support safe pagination and filtering for list endpoints.
- Return predictable success and error payloads.
- Avoid leaking internal implementation details.

## Design Decisions

### 1. Versioned REST API

The API uses `/api/v1` to keep the contract future-proof and explicit.

### 2. JSON-first Responses

All requests and responses use JSON for portability and simplicity.

### 3. Consistent Envelope Pattern

Success responses use a `data` envelope and optional `meta` for paging. Error responses use a structured `error` envelope.

### 4. Tenant Context in URL and Middleware

Organization-scoped endpoints require both an organization identifier in the URL and server-side tenant resolution.

### 5. Explicit Authorization Checks

Role and permission checks are enforced per endpoint rather than being implicit in the UI.

## Trade-offs

- REST is straightforward and easy to explain, but it is less expressive than a richer contract model for complex workflows.
- A consistent envelope pattern improves client predictability but adds some extra response structure.
- Using URL-based organization scoping is explicit and interview-friendly, although it adds some URL verbosity.

## Alternatives Considered

- GraphQL: powerful but unnecessary for this project scope and less interview-friendly for a beginner-focused backend.
- Versionless APIs: simpler at first, but less maintainable for future growth.
- Implicit tenant resolution via headers only: flexible, but less explicit and harder to debug.

## Best Practices

- Validate input aggressively before business logic.
- Return `401` for missing/invalid authentication and `403` for insufficient authorization.
- Use `404` for unknown resources and `409` for state conflicts.
- Never expose password hashes, token values, or internal stack traces.
- Keep response payloads minimal and meaningful.

## Risks

- Inconsistent validation can lead to fragile services.
- Overly permissive authorization can create security bugs.
- Poor pagination can degrade list performance.
- Unclear error contracts can frustrate frontend consumers and interview reviewers.

## Future Improvements

- Add OpenAPI examples and schemas for each endpoint.
- Introduce webhook support for external integrations.
- Expand filtering and search capabilities as the product evolves.

## API Conventions

### Base URL

- All APIs should be served under `/api/v1`.

### Content Type

- Requests and responses use JSON.
- Responses should include explicit status codes and predictable error envelopes.

### Authentication

- Authenticated requests should include `Authorization: Bearer <accessToken>`.
- Refresh-token flows use dedicated auth endpoints.
- Access tokens should be short-lived and refresh tokens rotation-based.

### Tenant Context

- Organization-scoped resources must include an organization identifier in the URL.
- The server must resolve tenant context from the authenticated user, the path parameter, and active membership state.
- Requests that target unauthorized organizations should be rejected with `403` or `404` depending on policy.

### Pagination and Filtering

Common query parameters:

- `page`: 1-based page number, default `1`.
- `limit`: page size, default `20`, maximum `100`.
- `sort`: field name.
- `order`: `asc` or `desc`.
- `search`: free-text search term where supported.
- `status`: status filter.
- `priority`: priority filter.
- `assigneeId`: filter by assignee.
- `teamId`: filter by team.

### Response Shape

Success payload:

```json
{
  "data": {},
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

Error payload:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "One or more fields are invalid.",
    "details": [
      {
        "field": "email",
        "message": "Email is required."
      }
    ],
    "requestId": "req_123"
  }
}
```

### Standard Status Codes

- `200 OK`: Successful read or update.
- `201 Created`: Resource created.
- `204 No Content`: Successful delete or no-body success.
- `400 Bad Request`: Malformed or invalid request.
- `401 Unauthorized`: Missing or invalid authentication.
- `403 Forbidden`: Authenticated but not authorized.
- `404 Not Found`: Resource not found.
- `409 Conflict`: Duplicate state or conflict.
- `422 Unprocessable Entity`: Semantic validation failure.
- `429 Too Many Requests`: Rate limit exceeded.
- `500 Internal Server Error`: Unexpected server error.

## Endpoint Catalog

### Authentication Endpoints

#### Register a user

- Method: `POST`
- Path: `/auth/register`
- Auth: None
- Purpose: Create a new user account.

Request body:

```json
{
  "name": "Ada Lovelace",
  "email": "ada@example.com",
  "password": "StrongPassword123!"
}
```

Response:
- `201 Created`
- Returns a user summary and authentication tokens.

Possible errors:
- `400` invalid input
- `409` duplicate email
- `429` rate-limited

#### Login

- Method: `POST`
- Path: `/auth/login`
- Auth: None
- Purpose: Authenticate with email and password.

Request body:

```json
{
  "email": "ada@example.com",
  "password": "StrongPassword123!"
}
```

Response:
- `200 OK`
- Returns access token, refresh token, and basic user profile.

Possible errors:
- `401` invalid credentials
- `429` too many attempts

#### Refresh token

- Method: `POST`
- Path: `/auth/refresh`
- Auth: None
- Purpose: Rotate the refresh token and issue a new access token.

Request body:

```json
{
  "refreshToken": "..."
}
```

Possible errors:
- `401` invalid or expired token
- `403` revoked session

#### Logout

- Method: `POST`
- Path: `/auth/logout`
- Auth: Required
- Purpose: Revoke the current session or refresh token.

#### Logout all sessions

- Method: `POST`
- Path: `/auth/logout-all`
- Auth: Required
- Purpose: Revoke all active refresh tokens for the current user.

### User Endpoints

#### Get current user profile

- Method: `GET`
- Path: `/users/me`
- Auth: Required
- Purpose: Return the authenticated user profile.

#### Update current user profile

- Method: `PATCH`
- Path: `/users/me`
- Auth: Required
- Purpose: Update safe profile fields such as display name, avatar URL, and timezone.

### Organization Endpoints

#### Create organization

- Method: `POST`
- Path: `/organizations`
- Auth: Required
- Purpose: Create a new organization and initial owner membership.

Request body:

```json
{
  "name": "Acme Support",
  "slug": "acme-support"
}
```

#### List organizations

- Method: `GET`
- Path: `/organizations`
- Auth: Required
- Purpose: Return organizations where the current user has an active membership.

#### Get organization details

- Method: `GET`
- Path: `/organizations/{organizationId}`
- Auth: Required
- Purpose: Return one tenant that the user can access.

#### Update organization

- Method: `PATCH`
- Path: `/organizations/{organizationId}`
- Auth: Required
- Purpose: Update organization settings and profile data.

### Membership and Invitation Endpoints

#### List memberships

- Method: `GET`
- Path: `/organizations/{organizationId}/memberships`
- Auth: Required
- Purpose: List members and roles within an organization.

#### Invite member

- Method: `POST`
- Path: `/organizations/{organizationId}/invitations`
- Auth: Required
- Purpose: Create an invitation for a new member.

Request body:

```json
{
  "email": "newmember@example.com",
  "role": "agent"
}
```

#### Accept invitation

- Method: `POST`
- Path: `/organizations/{organizationId}/invitations/{invitationId}/accept`
- Auth: Required
- Purpose: Accept an invitation and create or activate the membership.

#### Update membership role

- Method: `PATCH`
- Path: `/organizations/{organizationId}/memberships/{membershipId}`
- Auth: Required
- Purpose: Change the role of an existing member.

#### Remove member

- Method: `DELETE`
- Path: `/organizations/{organizationId}/memberships/{membershipId}`
- Auth: Required
- Purpose: Remove a member from the organization.

### Team Endpoints

#### List teams

- Method: `GET`
- Path: `/organizations/{organizationId}/teams`
- Auth: Required
- Purpose: Return teams for an organization.

#### Create team

- Method: `POST`
- Path: `/organizations/{organizationId}/teams`
- Auth: Required
- Purpose: Create a new team.

#### Get team

- Method: `GET`
- Path: `/organizations/{organizationId}/teams/{teamId}`
- Auth: Required
- Purpose: Return one team and summary metadata.

#### Update team

- Method: `PATCH`
- Path: `/organizations/{organizationId}/teams/{teamId}`
- Auth: Required
- Purpose: Update team details.

#### Delete team

- Method: `DELETE`
- Path: `/organizations/{organizationId}/teams/{teamId}`
- Auth: Required
- Purpose: Soft-delete a team.

### Ticket Endpoints

#### List tickets

- Method: `GET`
- Path: `/organizations/{organizationId}/tickets`
- Auth: Required
- Purpose: List tickets with pagination, search, status, priority, team, and assignee filters.

#### Create ticket

- Method: `POST`
- Path: `/organizations/{organizationId}/tickets`
- Auth: Required
- Purpose: Create a new ticket.

Request body:

```json
{
  "title": "Login issue",
  "description": "Users cannot sign in after password reset.",
  "priority": "high",
  "teamId": "team_123"
}
```

#### Get ticket

- Method: `GET`
- Path: `/organizations/{organizationId}/tickets/{ticketId}`
- Auth: Required
- Purpose: Return ticket details, comments, and attachment summary.

#### Update ticket

- Method: `PATCH`
- Path: `/organizations/{organizationId}/tickets/{ticketId}`
- Auth: Required
- Purpose: Update ticket workflow state and related metadata.

#### Delete ticket

- Method: `DELETE`
- Path: `/organizations/{organizationId}/tickets/{ticketId}`
- Auth: Required
- Purpose: Soft-delete a ticket.

### Comment and Attachment Endpoints

#### List comments

- Method: `GET`
- Path: `/organizations/{organizationId}/tickets/{ticketId}/comments`
- Auth: Required
- Purpose: Return ticket discussion entries.

#### Create comment

- Method: `POST`
- Path: `/organizations/{organizationId}/tickets/{ticketId}/comments`
- Auth: Required
- Purpose: Add a comment to a ticket.

#### Upload attachment metadata

- Method: `POST`
- Path: `/organizations/{organizationId}/tickets/{ticketId}/attachments`
- Auth: Required
- Purpose: Register attachment metadata before or after object storage upload.

### Notification and Audit Endpoints

#### List notifications

- Method: `GET`
- Path: `/users/me/notifications`
- Auth: Required
- Purpose: Return notifications for the current user.

#### Mark notification as read

- Method: `PATCH`
- Path: `/users/me/notifications/{notificationId}/read`
- Auth: Required
- Purpose: Mark a single notification as read.

#### List audit logs

- Method: `GET`
- Path: `/organizations/{organizationId}/audit-logs`
- Auth: Required
- Purpose: Return organization audit history.

### Health Endpoints

#### Liveness

- Method: `GET`
- Path: `/health/live`
- Auth: None
- Purpose: Return a simple live status payload.

#### Readiness

- Method: `GET`
- Path: `/health/ready`
- Auth: None
- Purpose: Report whether dependencies such as MongoDB and Redis are reachable.

## Authorization Expectations

- Anonymous users may access only authentication and health endpoints.
- Authenticated users may access their own profile and notification data.
- Organization-scoped resources require an active membership.
- Role-based checks must happen server-side before privileged actions execute.
- Users cannot bypass tenant boundaries through parameter tampering.

## Error Handling Policy

Common error codes:

- `AUTH_REQUIRED`
- `INVALID_CREDENTIALS`
- `TOKEN_EXPIRED`
- `TOKEN_REVOKED`
- `VALIDATION_ERROR`
- `FORBIDDEN`
- `NOT_FOUND`
- `CONFLICT`
- `RATE_LIMITED`
- `TENANT_CONTEXT_REQUIRED`

Every error response should include a message, optional details, and a request identifier.
