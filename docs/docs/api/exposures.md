---
sidebar_position: 6
title: Exposures
---

# Exposures API

Endpoints for viewing exposure information.

## Get Exposure Snapshot

Get the current exposure snapshot for the authenticated user.

```
GET /api/exposures
```

### Response (3+ connections)

```json
{
  "data": {
    "connectionCount": 5,
    "secondDegreeCount": 12,
    "thirdDegreeCount": 28,
    "exposures": [
      {
        "condition": "hiv",
        "count": 1,
        "closestDegree": 2,
        "timeframe": "recent",
        "status": "active"
      },
      {
        "condition": "chlamydia",
        "count": 2,
        "closestDegree": 1,
        "timeframe": "older",
        "status": "resolved"
      }
    ],
    "computedAt": "2026-01-28T00:00:00Z",
    "nextUpdateAt": "2026-02-04T00:00:00Z"
  }
}
```

### Response (< 3 connections)

```json
{
  "data": {
    "connectionCount": 2,
    "message": "Add more connections for exposure insights",
    "recommendation": "Consider regular STI testing every 3-6 months"
  }
}
```

:::note Minimum Threshold
Users with fewer than 3 confirmed connections do not receive specific exposure information to prevent inference attacks.
:::

## Exposure Fields

| Field | Description |
|-------|-------------|
| `condition` | STI type |
| `count` | Number of potential exposures |
| `closestDegree` | Nearest degree of separation (1, 2, or 3) |
| `timeframe` | `recent` (< 30 days) or `older` |
| `status` | `active` or `resolved` (if cleared) |

## Timeframes

| Timeframe | Description |
|-----------|-------------|
| `recent` | Reported within the last 30 days |
| `older` | Reported more than 30 days ago |

## Update Schedule

Exposure snapshots are recalculated weekly (Sunday evening). The `nextUpdateAt` field indicates when the next calculation will occur.

## Privacy Guarantees

The exposures endpoint never reveals:
- Which specific connection has an STI
- When a specific connection reported
- The identity behind any exposure
- Exact dates of reports

All data is aggregated to preserve privacy while still providing useful health awareness information.
