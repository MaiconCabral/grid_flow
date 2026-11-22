---
alwaysApply: false
description: provided
globs: omitted
---

# Performance Rules

This application must prioritize:

- scalability
- responsiveness
- low memory usage
- optimized database access
- efficient frontend rendering

---

# Backend Performance

## Database

- Avoid N+1 queries
- Always use eager loading when needed
- Use pagination for large datasets
- Prefer cursor pagination for large collections
- Use indexes for searchable/filterable columns
- Avoid SELECT \*
- Use query caching for expensive operations

## Queues

Use queues for:

- emails
- notifications
- exports
- image processing
- webhook processing
- third-party integrations

Long-running operations must never block HTTP requests.

## Caching

Prefer caching for:

- settings
- permissions
- dashboard metrics
- expensive queries
- API integrations

Use:

- Redis
- cache tags
- cache invalidation strategies

## API

- Avoid overfetching
- Return only required fields
- Use API Resources
- Prefer lazy loading only when intentional

## Jobs

- Jobs must be idempotent
- Avoid heavy logic inside controllers
- Split large jobs into smaller jobs when possible

---

# Frontend Performance

The frontend is Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS.

## Rendering

- Keep client state small
- Derive values during render
- Keep pages as Server Components and isolate interactivity in small Client Components
- Lazy load heavy client components with `next/dynamic`
- Avoid effects that only recompute derived data

## State Management

- Keep state localized when possible
- Reach for Context or a client store only when state is shared across routes
- Pass server data as props instead of copying it into `useState`

## Data loading

- Fetch in the Server Component that renders the data
- Do not refetch the same payload in both a page and a child
- Paginate large lists on the API

## Lists

- Paginate large lists
- Virtualize large datasets when needed

## Requests

- Debounce search inputs
- Cancel stale requests
- Avoid duplicate requests

## Assets

- Optimize images with `next/image`
- Use responsive images
- Keep Tailwind usage to utilities that the build can purge
- Avoid loading unnecessary JS

---

# General Rules

- Prefer readability over micro-optimization
- Optimize bottlenecks first
- Measure before optimizing
- Keep architecture scalable
- Avoid premature optimization
