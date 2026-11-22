---
alwaysApply: false
description: omitted
globs: omitted
---

# Testing Rules

This project must maintain reliable automated tests.

Testing should prioritize:

- confidence
- maintainability
- critical business flows
- regression prevention

---

# Backend Testing

Framework:

- Pest PHP

## Feature Tests

Feature tests must cover:

- authentication
- authorization
- CRUD flows
- validation
- API responses
- permissions
- business rules

## Unit Tests

Unit tests should focus on:

- services
- actions
- DTOs
- helpers
- business logic

Avoid testing framework internals.

## Database

- Use factories
- Use refresh database
- Keep tests isolated
- Avoid shared state

## Queues

- Fake queues when appropriate
- Assert jobs were dispatched
- Test critical queued workflows

## External APIs

- Fake HTTP requests
- Never depend on real APIs in tests

---

# Frontend Testing

The frontend is Next.js 16 (App Router) + React 19 + TypeScript.

Tools:

- Vitest
- React Testing Library
- Playwright for async Server Components, which Vitest does not run

## Components

Test:

- rendering
- interactions
- edge cases
- loading states
- error states

Avoid implementation detail testing.
Prefer the rendered text and user-facing roles over internal state.

## E2E

Critical flows should have E2E coverage.

Examples:

- login
- dashboard
- creative piece approval
- content generation

Recommended:

- Playwright

---

# Test Quality

Tests must:

- be deterministic
- be isolated
- be readable
- avoid flaky behavior

Avoid:

- unnecessary mocks
- brittle selectors
- excessive snapshot testing

---

# Coverage

Prioritize:

- business-critical flows
- security-sensitive features
- payment flows
- async workflows

Coverage percentage is not the primary goal.
Reliable tests are more important.
