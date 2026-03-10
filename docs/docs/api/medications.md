---
sidebar_position: 12
title: Medications
---

# Medications API

Endpoints for managing medications, logging doses, viewing adherence statistics, and tracking PrEP streaks. All endpoints require authentication via Supabase JWT.

## Endpoints Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/medications` | List all medications |
| POST | `/api/medications` | Create a medication |
| GET | `/api/medications/{id}` | Get a single medication |
| PUT | `/api/medications/{id}` | Update a medication |
| DELETE | `/api/medications/{id}` | Deactivate a medication |
| POST | `/api/medications/{id}/log` | Log a dose |
| GET | `/api/medications/{id}/adherence` | Get adherence statistics |
| GET | `/api/medications/prep-streak` | Get PrEP streak data |

---

## Medications CRUD

### List Medications

List all medications for the authenticated user.

```
GET /api/medications
```

#### Response (200 OK)

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440040",
    "medicationType": "PREP_DAILY",
    "name": "Truvada",
    "dosage": "200mg/300mg",
    "startDate": "2026-01-01",
    "endDate": null,
    "frequency": "DAILY",
    "reminderTime": "09:00",
    "notes": "Take with food",
    "active": true,
    "createdAt": "2026-01-01T10:00:00Z",
    "updatedAt": "2026-01-01T10:00:00Z"
  }
]
```

### Create Medication

Create a new medication.

```
POST /api/medications
```

#### Request Body

```json
{
  "medicationType": "PREP_DAILY",
  "name": "Truvada",
  "dosage": "200mg/300mg",
  "startDate": "2026-01-01",
  "endDate": null,
  "frequency": "DAILY",
  "reminderTime": "09:00",
  "notes": "Take with food"
}
```

| Field | Type | Required | Max Length | Description |
|-------|------|----------|------------|-------------|
| `medicationType` | string | Yes | 32 | Catalog medication type key (e.g., `PREP_DAILY`) |
| `name` | string | Yes | 200 | Medication name (encrypted) |
| `dosage` | string | No | 200 | Dosage description (encrypted) |
| `startDate` | string | Yes | - | Start date in YYYY-MM-DD format |
| `endDate` | string | No | - | End date in YYYY-MM-DD format |
| `frequency` | string | Yes | 32 | Dosing frequency key (e.g., `DAILY`) |
| `reminderTime` | string | No | - | Preferred reminder time in HH:mm format |
| `notes` | string | No | 5000 | Notes (encrypted) |

#### Response (200 OK)

Returns the created `MedicationResponse`.

### Get Medication

Retrieve a single medication by ID.

```
GET /api/medications/{id}
```

#### Response (200 OK)

Returns a single `MedicationResponse` (same shape as list response items).

### Update Medication

Update an existing medication. All fields are optional (partial update).

```
PUT /api/medications/{id}
```

#### Request Body

```json
{
  "medicationType": "PREP_DAILY",
  "name": "Descovy",
  "dosage": "200mg/25mg",
  "startDate": "2026-02-01",
  "endDate": null,
  "frequency": "DAILY",
  "reminderTime": "08:00",
  "notes": "Switched from Truvada",
  "active": true
}
```

| Field | Type | Required | Max Length | Description |
|-------|------|----------|------------|-------------|
| `medicationType` | string | No | 32 | Catalog medication type key |
| `name` | string | No | 200 | Medication name (encrypted) |
| `dosage` | string | No | 200 | Dosage description (encrypted) |
| `startDate` | string | No | - | Start date in YYYY-MM-DD format |
| `endDate` | string | No | - | End date in YYYY-MM-DD format |
| `frequency` | string | No | 32 | Dosing frequency key |
| `reminderTime` | string | No | - | Preferred reminder time in HH:mm format |
| `notes` | string | No | 5000 | Notes (encrypted) |
| `active` | boolean | No | - | Whether the medication is active |

#### Response (200 OK)

Returns the updated `MedicationResponse`.

### Deactivate Medication

Deactivate a medication (soft delete).

```
DELETE /api/medications/{id}
```

#### Response (204 No Content)

No response body.

---

## Dose Logging

### Log Dose

Log a dose for a medication.

```
POST /api/medications/{id}/log
```

#### Request Body

```json
{
  "scheduledFor": "2026-03-01",
  "taken": true,
  "notes": "Took at 9:15am"
}
```

| Field | Type | Required | Max Length | Description |
|-------|------|----------|------------|-------------|
| `scheduledFor` | string | Yes | - | Date the dose was scheduled for (YYYY-MM-DD) |
| `taken` | boolean | Yes | - | Whether the dose was taken |
| `notes` | string | No | 5000 | Notes (encrypted) |

#### Response (200 OK)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440041",
  "scheduledFor": "2026-03-01",
  "taken": true,
  "loggedAt": "2026-03-01T09:15:00Z",
  "notes": "Took at 9:15am"
}
```

---

## Adherence

### Get Adherence

Returns adherence statistics for a medication over a given month.

```
GET /api/medications/{id}/adherence
```

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `month` | string | Yes | Month in YYYY-MM format |

#### Response (200 OK)

```json
{
  "month": "2026-03",
  "totalDays": 31,
  "takenCount": 28,
  "missedCount": 3,
  "adherenceRate": 0.903,
  "logs": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440041",
      "scheduledFor": "2026-03-01",
      "taken": true,
      "loggedAt": "2026-03-01T09:15:00Z",
      "notes": null
    }
  ]
}
```

---

## PrEP Streak

### Get PrEP Streak

Returns PrEP adherence streak data with milestones for the authenticated user.

```
GET /api/medications/prep-streak
```

#### Response (200 OK)

```json
{
  "currentStreakDays": 45,
  "longestStreakDays": 90,
  "milestones": [
    { "days": 7, "labelKey": "milestones.oneWeek", "achieved": true },
    { "days": 30, "labelKey": "milestones.oneMonth", "achieved": true },
    { "days": 90, "labelKey": "milestones.threeMonths", "achieved": false },
    { "days": 180, "labelKey": "milestones.sixMonths", "achieved": false },
    { "days": 365, "labelKey": "milestones.oneYear", "achieved": false }
  ]
}
```

:::note Privacy
All medication data (names, dosages, notes) is encrypted at rest. Medication information is never shared with other users or exposed through any public API.
:::
