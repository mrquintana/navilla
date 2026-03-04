---
sidebar_position: 8
title: Reciprocity
---

# Reciprocity API

Endpoints for managing exposure network opt-in/out. All endpoints require authentication via Supabase JWT.

## Endpoints Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reciprocity/status` | Get current reciprocity status |
| POST | `/api/reciprocity/opt-in` | Opt into the exposure network |
| POST | `/api/reciprocity/opt-out` | Opt out of the exposure network |

## How Reciprocity Works

Users must opt into the exposure network to see exposure data from their connections. This is a soft opt-in model:

1. **Not opted in** — user cannot see any exposure data. Dashboard shows opt-in card.
2. **Opted in** — user's health data is included in exposure calculations for their connections, and they can see exposure data.
3. **Opted out** — 15-day cooldown before re-opting in (configurable via `reciprocity.cooldown_days` in `app_config`).

:::note Privacy
Opting in means your test results become part of the anonymous exposure calculation for your direct connections. Your identity is never revealed — only aggregate exposure risk is shown.
:::

## Get Reciprocity Status

Get the current reciprocity status for the authenticated user.

```
GET /api/reciprocity/status
```

### Response (200 OK)

```json
{
  "optedIn": false,
  "optedInAt": null,
  "optedOutAt": null,
  "cooldownDaysRemaining": null
}
```

**After opting out (in cooldown):**

```json
{
  "optedIn": false,
  "optedInAt": "2026-03-01T10:00:00Z",
  "optedOutAt": "2026-03-04T14:30:00Z",
  "cooldownDaysRemaining": 12
}
```

## Opt In

Opt the authenticated user into the exposure network.

```
POST /api/reciprocity/opt-in
```

### Response (200 OK)

```json
{
  "optedIn": true,
  "optedInAt": "2026-03-04T15:00:00Z",
  "optedOutAt": null,
  "cooldownDaysRemaining": null
}
```

### Error Responses

| Status | Description |
|--------|-------------|
| 403 | Cooldown active — user opted out recently and must wait before re-opting in |

**403 Response:**

```json
{
  "message": "reciprocity.error.cooldownActive",
  "cooldownDaysRemaining": 12
}
```

## Opt Out

Opt the authenticated user out of the exposure network. Starts a cooldown period.

```
POST /api/reciprocity/opt-out
```

### Response (200 OK)

```json
{
  "optedIn": false,
  "optedInAt": "2026-03-01T10:00:00Z",
  "optedOutAt": "2026-03-04T15:30:00Z",
  "cooldownDaysRemaining": 15
}
```

## Configurable Settings

These values are stored in the `app_config` table and can be changed at runtime:

| Key | Default | Description |
|-----|---------|-------------|
| `reciprocity.cooldown_days` | `15` | Days before user can re-opt-in after opting out |
| `exposure.min_connections` | `3` | Minimum confirmed connections to see exposure data |
| `exposure.max_depth` | `3` | Maximum BFS depth for exposure calculation |
| `exposure.snapshot_ttl_days` | `7` | Days before exposure snapshot expires |
