---
alwaysApply: true
---

# AI Instructions

These rules are mandatory.
Always follow them when generating code.
Prefer consistency with project architecture.

# Backend Rules

This is a social media management platform. Day-to-day work covers approving creative pieces and producing them.
The API lives in `backend/` and is consumed by the Next.js 16 app in `frontend/`.

Stack:

- Laravel 12 API
- Laravel Sanctum
- MySQL
- Redis
- SQS

Architecture:

- Controllers thin
- Business logic in Services/Actions
- DTOs for complex payloads
- FormRequest for validation
- Queues for async processing
- Repository pattern only when needed

Patterns:

- SOLID
- Feature based organization
- Avoid fat models
- Prefer readonly DTOs
- Use policies for authorization

Performance:

- Avoid N+1
- Always eager load
- Cache expensive queries
- Prefer chunking for large datasets

Testing:

- Pest
- Feature tests for endpoints
- Unit tests for services

Code style:

- Typed properties
- Return types
- Small methods
- No duplicated code
