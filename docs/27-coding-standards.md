# 27. Coding Standards

## General Rules

- Prefer TypeScript strict mode and explicit return types for public APIs.
- Use dependency injection or constructor-based wiring for infrastructure clients.
- Avoid business logic in controllers and routes.
- Keep modules focused around a single responsibility.
- Name files after the domain concept they encapsulate.

## Review Expectations

- Code must be readable without deep framework knowledge.
- Shared utilities must remain generic.
- Tests should cover behavior, not implementation details.
