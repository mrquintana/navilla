---
title: Dev Tools
description: Dev-only endpoints and UI helpers for local troubleshooting.
---

# Dev Tools

This page documents developer-only tools that are **disabled in production**.

## Enable Dev Mode

These tools are gated by a backend flag and frontend build flag:

- Backend: `NAVILLA_DEV_MODE=true`
- Frontend: `VITE_DEV_MODE=true`

If these flags are not set, dev endpoints return `404` and dev UI elements are hidden.

## Exposure Debug Tools

### Force recompute exposure snapshot (dev-only)

```
POST /api/exposures/recompute
```

Returns a freshly computed exposure snapshot for the authenticated user.

### Inspect exposure graph and results (dev-only)

```
GET /api/dev/exposures/inspect?username=user001
GET /api/dev/exposures/inspect?email=user001@navilla.app
```

Response includes:
- `userHash`
- `connectionCount`, `secondDegreeCount`, `thirdDegreeCount`
- Lists of `firstDegreeHashes`, `secondDegreeHashes`, `thirdDegreeHashes`
- `exposures` list (condition, count, closest degree, status, timeframe)
- `message`, `recommendation`, `computedAt`

## Hash Lookup

### Get user hashes (dev-only)

```
GET /api/dev/users/hash?username=user001
GET /api/dev/users/hash?email=user001@navilla.app
```

Response includes:
- `userId`
- `username`
- `emailHash`
- `usernameHash`

## Dev UI Helpers

When `VITE_DEV_MODE=true`, the UI shows:

- A red **DEV MODE** banner.
- A **Recompute exposure** button on the dashboard.
- **Fill random** buttons on Signup, Profile, and Health Status forms.

