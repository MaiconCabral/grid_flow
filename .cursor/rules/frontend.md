---
alwaysApply: true
---

# AI Instructions

These rules are mandatory.
Always follow them when generating code.
Prefer consistency with project architecture.

# Frontend Rules

This is a social media management platform. Day-to-day work covers approving creative pieces and producing them.

Stack:

- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS

The app lives in `frontend/` and consumes the Laravel API in `backend/`.
Routes live under `frontend/src/app/` (`page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`).
Put reusable UI in `src/components/`, shared client logic in `src/hooks/`, and typed API access in `src/services/`.
Use the App Router. Do not add a `pages/` router.
Before using a Next.js API, read the matching guide in `frontend/node_modules/next/dist/docs/`. This version differs from older Next.js.

Patterns:

- Function components
- Server Components by default; add `"use client"` only for state, events, browser APIs, or hooks
- Reusable components
- Custom hooks for client business logic
- Explicit imports
- Typed props and API responses
- Tailwind utility classes
- Call the Laravel API through a typed client. Browser mutations that use the Sanctum cookie send `credentials: 'include'` and the CSRF cookie

Performance:

- Keep state local unless it is truly shared
- Derive values during render; use `useMemo` only when the work is expensive
- Lazy-load heavy client components with `next/dynamic`
- Virtualize large lists
- Debounce expensive operations
- Fetch on the server when the page needs the data, so the browser does not repeat the same request
