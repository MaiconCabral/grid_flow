---
alwaysApply: false
description: omitted
globs: omitted
---

# Web Security Rules

Security is a first-class requirement.

Every feature must consider:

- authentication
- authorization
- input validation
- data protection
- abuse prevention

---

# Authentication

- Use Laravel authentication best practices
- Never trust frontend authentication state
- Protect all sensitive routes
- Use secure password hashing
- Enforce email verification when necessary

---

# Authorization

- Always validate permissions server-side
- Use Policies and Gates
- Never expose unauthorized resources
- Avoid trusting client-provided IDs

---

# Validation

- Validate all incoming data
- Use FormRequest classes
- Sanitize user-generated content
- Never trust frontend validation only

---

# File Uploads

- Validate mime types
- Validate file size
- Sanitize filenames
- Never execute uploaded files
- Store uploads outside public root when possible

---

# XSS Prevention

- Escape unsafe HTML
- Avoid `dangerouslySetInnerHTML` unless the HTML was sanitized on the server
- Sanitize rich text content
- Never trust user-generated markup

---

# SQL Injection Prevention

- Always use Eloquent or parameterized queries
- Never concatenate raw SQL with user input

---

# CSRF

- Protect all state-changing requests
- Use Laravel CSRF protection
- The Next.js app is a separate frontend. Browser requests that use the Sanctum session cookie send `credentials: 'include'` and read the CSRF cookie before mutating requests. Server Components must not pass session secrets into client props

---

# API Security

- Rate limit sensitive endpoints
- Protect private APIs
- Validate tokens properly
- Avoid exposing internal errors

---

# Sensitive Data

Never expose:

- stack traces
- internal IDs unnecessarily
- secrets
- tokens
- credentials

Never hardcode:

- API keys
- secrets
- passwords

Use:

- environment variables
- secret managers

---

# Logging

- Never log sensitive data
- Avoid logging passwords
- Avoid logging tokens

---

# Frontend Security

The frontend is Next.js 16 + TypeScript.

- Keep the API base URL in environment variables, not hardcoded in components. Only `NEXT_PUBLIC_` values may reach the browser
- Prefer the Sanctum session cookie over tokens in localStorage
- Avoid storing sensitive data in localStorage
- Protect against XSS
- Validate frontend input
- Avoid exposing internal implementation details

---

# Infrastructure

- Use HTTPS
- Secure cookies
- Use proper CORS configuration
- Use secure headers

---

# Third-Party Integrations

- Validate webhook signatures
- Retry safely
- Handle API failures gracefully
- Protect secrets

---

# Security Mindset

Always assume:

- requests can be manipulated
- users can bypass frontend rules
- uploaded content is malicious
- APIs can fail
