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
  "connectionCount": 5,
  "secondDegreeCount": 12,
  "thirdDegreeCount": 28,
  "exposures": [
    {
      "condition": "hiv",
      "count": 1,
      "closestDegree": 2,
      "timeframe": "0_30d",
      "status": "active"
    },
    {
      "condition": "chlamydia",
      "count": 2,
      "closestDegree": 1,
      "timeframe": "91_365d",
      "status": "resolved"
    }
  ],
  "computedAt": "2026-01-28T00:00:00Z",
  "nextUpdateAt": "2026-02-04T00:00:00Z"
}
```

### Response (< 3 connections)

```json
{
  "connectionCount": 2,
  "message": "exposure.message.insufficientConnections",
  "recommendation": "exposure.message.recommendation"
}
```

:::note Minimum Threshold
Users with fewer than 3 confirmed connections do not receive specific exposure information to prevent inference attacks.
:::

:::note Configurable Depth
Exposure calculations default to 3 degrees of separation, but can be increased via configuration for future iterations.
:::

## Exposure Fields

| Field | Description |
|-------|-------------|
| `condition` | STI type |
| `count` | Number of potential exposures |
| `closestDegree` | Nearest degree of separation (1, 2, or 3) |
| `timeframe` | Recency bucket: `0_30d`, `31_90d`, `91_365d`, or `365d_plus` |
| `status` | `active` or `resolved` (if cleared) |

## Timeframes

| Timeframe | Description |
|-----------|-------------|
| `0_30d` | Reported within the last 30 days |
| `31_90d` | Reported 31–90 days ago |
| `91_365d` | Reported 91–365 days ago |
| `365d_plus` | Reported more than 365 days ago |

## Priority Sorting

The frontend sorts exposure items by a weighted score so the most relevant items appear first:

| Factor | Weight | Values |
|--------|--------|--------|
| Status | ×4 | active=2, resolved=0 |
| Degree | ×3 | 1st→3, 2nd→2, 3rd→1 |
| Recency | ×3 | 0_30d→4, 31_90d→3, 91_365d→2, 365d_plus→1 |
| Cases | ×1 | min(count, 10) |

Tiebreaker: closest degree ascending, then most recent first.

Cards display a colored left border indicating urgency:
- **High** (score ≥ 25): amber `#e3a008`
- **Medium** (score 15–24): indigo `#4f46e5`
- **Low** (score < 15): stone `#d6d3d1`

## Update Schedule

Exposure snapshots are recalculated weekly (Sunday evening). The `nextUpdateAt` field indicates when the next calculation will occur.

## Privacy Guarantees

The exposures endpoint never reveals:
- Which specific connection has an STI
- When a specific connection reported
- The identity behind any exposure
- Exact dates of reports

All data is aggregated to preserve privacy while still providing useful health awareness information.
