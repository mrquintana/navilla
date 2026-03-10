---
sidebar_position: 11
title: Health Log
---

# Health Log API

Endpoints for managing test visits, lab results, lab connections, and health summaries. All endpoints require authentication via Supabase JWT.

## Endpoints Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health-log/visits` | List all test visits |
| POST | `/api/health-log/visits` | Create a test visit |
| GET | `/api/health-log/visits/{id}` | Get a single test visit |
| PUT | `/api/health-log/visits/{id}` | Update a test visit |
| DELETE | `/api/health-log/visits/{id}` | Delete a test visit |
| GET | `/api/health-log/summary` | Get health log summary |
| GET | `/api/health-log/condition/{type}` | Get condition history |
| GET | `/api/health-log/labs` | List lab connections |
| POST | `/api/health-log/labs` | Create a lab connection |
| PUT | `/api/health-log/labs/{id}` | Update a lab connection |
| DELETE | `/api/health-log/labs/{id}` | Delete a lab connection |

---

## Test Visits

### List Visits

List all test visits for the authenticated user.

```
GET /api/health-log/visits
```

#### Response (200 OK)

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440020",
    "testDate": "2026-03-01",
    "labId": "550e8400-e29b-41d4-a716-446655440030",
    "labName": "Chopo Downtown",
    "labProvider": "chopo",
    "labReference": "REF-2026-001",
    "notes": "Routine screening",
    "verified": false,
    "verifiedAt": null,
    "results": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440021",
        "conditionType": "hiv",
        "customCondition": null,
        "status": "NEGATIVE",
        "resultValue": "Non-reactive",
        "referenceRange": "Non-reactive",
        "clearedAt": null
      }
    ],
    "createdAt": "2026-03-01T14:00:00Z",
    "updatedAt": "2026-03-01T14:00:00Z"
  }
]
```

### Create Visit

Create a new test visit with one or more results.

```
POST /api/health-log/visits
```

#### Request Body

```json
{
  "testDate": "2026-03-01",
  "labId": "550e8400-e29b-41d4-a716-446655440030",
  "labReference": "REF-2026-001",
  "notes": "Routine screening",
  "results": [
    {
      "conditionType": "hiv",
      "customCondition": null,
      "status": "NEGATIVE",
      "resultValue": "Non-reactive",
      "referenceRange": "Non-reactive"
    },
    {
      "conditionType": "chlamydia",
      "customCondition": null,
      "status": "NEGATIVE",
      "resultValue": null,
      "referenceRange": null
    }
  ]
}
```

| Field | Type | Required | Max Length | Description |
|-------|------|----------|------------|-------------|
| `testDate` | string | Yes | - | Date in YYYY-MM-DD format |
| `labId` | UUID | No | - | ID of associated lab connection |
| `labReference` | string | No | 200 | Lab reference number |
| `notes` | string | No | 5000 | Notes about the visit |
| `results` | object[] | Yes | 20 items | List of test results (min 1) |

#### Test Result Object

| Field | Type | Required | Max Length | Description |
|-------|------|----------|------------|-------------|
| `conditionType` | string | No | 50 | Condition type key (e.g., `hiv`, `chlamydia`) |
| `customCondition` | string | No | 200 | Custom condition name if type is `OTHER` |
| `status` | string | Yes | 50 | Result status (e.g., `NEGATIVE`, `POSITIVE`) |
| `resultValue` | string | No | 200 | Raw result value |
| `referenceRange` | string | No | 200 | Reference range for the result |

#### Response (200 OK)

Returns the created `TestVisitResponse`.

### Get Visit

Retrieve a single test visit by ID.

```
GET /api/health-log/visits/{id}
```

#### Response (200 OK)

Returns a single `TestVisitResponse` (same shape as list response items).

### Update Visit

Update an existing test visit. All fields are optional (partial update).

```
PUT /api/health-log/visits/{id}
```

#### Request Body

```json
{
  "testDate": "2026-03-02",
  "labId": null,
  "labReference": "REF-2026-002",
  "notes": "Updated notes",
  "results": [
    {
      "conditionType": "hiv",
      "status": "NEGATIVE",
      "resultValue": "Non-reactive"
    }
  ]
}
```

| Field | Type | Required | Max Length | Description |
|-------|------|----------|------------|-------------|
| `testDate` | string | No | - | Date in YYYY-MM-DD format |
| `labId` | UUID | No | - | ID of associated lab connection |
| `labReference` | string | No | 200 | Lab reference number |
| `notes` | string | No | 5000 | Notes about the visit |
| `results` | object[] | No | 20 items | Updated list of test results |

#### Response (200 OK)

Returns the updated `TestVisitResponse`.

### Delete Visit

Delete a test visit and all its results.

```
DELETE /api/health-log/visits/{id}
```

#### Response (204 No Content)

No response body.

---

## Summary

### Get Health Log Summary

Returns a dashboard summary with testing statistics and per-condition summaries.

```
GET /api/health-log/summary
```

#### Response (200 OK)

```json
{
  "daysSinceLastTest": 15,
  "testsThisYear": 3,
  "conditionsCovered": 7,
  "totalStandardConditions": 10,
  "conditions": [
    {
      "conditionType": "hiv",
      "customCondition": null,
      "latestStatus": "NEGATIVE",
      "latestResultValue": "Non-reactive",
      "lastTestDate": "2026-03-01",
      "totalTests": 3,
      "hasPositive": false
    },
    {
      "conditionType": "chlamydia",
      "customCondition": null,
      "latestStatus": "NEGATIVE",
      "latestResultValue": null,
      "lastTestDate": "2026-03-01",
      "totalTests": 2,
      "hasPositive": false
    }
  ]
}
```

---

## Condition History

### Get Condition History

Returns the full testing history for a specific condition type.

```
GET /api/health-log/condition/{type}
```

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `type` | string | Condition type identifier (e.g., `hiv`, `chlamydia`) |

#### Response (200 OK)

```json
{
  "conditionType": "hiv",
  "latestStatus": "NEGATIVE",
  "totalTests": 3,
  "lastTestDate": "2026-03-01",
  "entries": [
    {
      "visitId": "550e8400-e29b-41d4-a716-446655440020",
      "testDate": "2026-03-01",
      "status": "NEGATIVE",
      "resultValue": "Non-reactive",
      "referenceRange": "Non-reactive",
      "labName": "Chopo Downtown",
      "labProvider": "chopo",
      "verified": false,
      "clearedAt": null
    },
    {
      "visitId": "550e8400-e29b-41d4-a716-446655440025",
      "testDate": "2026-01-15",
      "status": "NEGATIVE",
      "resultValue": "Non-reactive",
      "referenceRange": "Non-reactive",
      "labName": "Salud Digna Roma",
      "labProvider": "salud_digna",
      "verified": true,
      "clearedAt": null
    }
  ]
}
```

---

## Lab Connections

### List Labs

List all lab connections for the authenticated user.

```
GET /api/health-log/labs
```

#### Response (200 OK)

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440030",
    "provider": "chopo",
    "name": "Chopo Downtown",
    "credentials": [
      { "key": "patientId", "value": "CH-12345" }
    ],
    "createdAt": "2026-02-01T10:00:00Z"
  }
]
```

### Create Lab

Create a new lab connection.

```
POST /api/health-log/labs
```

#### Request Body

```json
{
  "provider": "chopo",
  "name": "Chopo Downtown",
  "credentials": [
    { "key": "patientId", "value": "CH-12345" }
  ]
}
```

| Field | Type | Required | Max Length | Description |
|-------|------|----------|------------|-------------|
| `provider` | string | Yes | 200 | Lab provider identifier |
| `name` | string | Yes | 200 | User-defined display name |
| `credentials` | object[] | No | 10 items | Credential key-value pairs |

#### Credential Object

| Field | Type | Required | Max Length |
|-------|------|----------|------------|
| `key` | string | Yes | 100 |
| `value` | string | Yes | 500 |

#### Response (200 OK)

Returns the created `LabResponse`.

### Update Lab

Update an existing lab connection.

```
PUT /api/health-log/labs/{id}
```

#### Request Body

```json
{
  "name": "Chopo Roma Norte",
  "credentials": [
    { "key": "patientId", "value": "CH-12345-new" }
  ]
}
```

| Field | Type | Required | Max Length | Description |
|-------|------|----------|------------|-------------|
| `name` | string | No | 200 | Updated display name |
| `credentials` | object[] | No | 10 items | Updated credentials |

#### Response (200 OK)

Returns the updated `LabResponse`.

### Delete Lab

Delete a lab connection.

```
DELETE /api/health-log/labs/{id}
```

#### Response (204 No Content)

No response body.

:::note Privacy
All health log data (visit notes, lab credentials, result values) is encrypted at rest. Lab credentials are stored encrypted and never exposed to other users. Test results are only accessible by the authenticated user.
:::
