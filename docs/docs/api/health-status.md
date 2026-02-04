---
sidebar_position: 5
title: Health Status
---

# Health Status API

Endpoints for managing personal health records.

## List Health Statuses

Get all health status records for the authenticated user.

```
GET /api/health-status
```

### Response

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440010",
    "condition": "chlamydia",
    "status": "negative",
    "testDate": "2026-01-15",
    "reportedAt": "2026-01-16T10:00:00Z"
  },
  {
    "id": "550e8400-e29b-41d4-a716-446655440011",
    "condition": "hiv",
    "status": "negative",
    "testDate": "2026-01-15",
    "reportedAt": "2026-01-16T10:00:00Z"
  }
]
```

## Report Status

Report a new health status or update an existing one.

```
POST /api/health-status
```

### Request Body

```json
{
  "condition": "chlamydia",
  "status": "positive",
  "testDate": "2026-01-28"
}
```

### Supported Conditions

| Condition | Value |
|-----------|-------|
| Chlamydia | `chlamydia` |
| Gonorrhea | `gonorrhea` |
| Syphilis | `syphilis` |
| HIV | `hiv` |
| HSV-1 | `hsv1` |
| HSV-2 | `hsv2` |
| HPV | `hpv` |
| Hepatitis B | `hepatitis_b` |
| Hepatitis C | `hepatitis_c` |
| Trichomoniasis | `trichomoniasis` |

### Supported Statuses

| Status | Description |
|--------|-------------|
| `positive` | Tested positive |
| `negative` | Tested negative |
| `unknown` | Unknown/not tested |

### Response

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440012",
  "condition": "chlamydia",
  "status": "positive",
  "testDate": "2026-01-28",
  "reportedAt": "2026-01-30T10:00:00Z"
}
```

:::note Privacy Impact
Reporting a positive status will trigger exposure calculations for connected users in the next weekly batch. No user will learn your identity.
:::

## Clear Status

Mark a condition as cleared (for curable STIs).

```
POST /api/health-status/{id}/clear
```

### Request Body

```json
{
  "clearedDate": "2026-01-30"
}
```

### Response

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440012",
  "condition": "chlamydia",
  "status": "positive",
  "testDate": "2026-01-28",
  "clearedAt": "2026-01-30T00:00:00Z"
}
```

:::note
Cleared statuses are marked as "resolved" in partners' exposure alerts. Historical exposure alerts remain for reference.
:::

## Delete Status

Delete a health status record.

```
DELETE /api/health-status/{id}
```

### Response

```
204 No Content
```
