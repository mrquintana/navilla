---
sidebar_position: 13
title: Vaccinations
---

# Vaccinations API

Endpoints for recording and managing vaccination doses and viewing vaccine series completion status. All endpoints require authentication via Supabase JWT.

## Endpoints Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/vaccinations` | List vaccine series |
| POST | `/api/vaccinations` | Record a vaccination dose |
| PUT | `/api/vaccinations/{id}` | Update a vaccination dose |
| DELETE | `/api/vaccinations/{id}` | Delete a vaccination dose |

---

## List Vaccine Series

List all vaccination series for the authenticated user, grouped by vaccine type with completion status.

```
GET /api/vaccinations
```

### Response (200 OK)

```json
[
  {
    "vaccineType": "HPV",
    "labelKey": "vaccines.hpv",
    "totalDoses": 3,
    "completedDoses": 2,
    "complete": false,
    "nextDoseDate": "2026-07-01",
    "doses": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440050",
        "vaccineType": "HPV",
        "doseNumber": 1,
        "totalDoses": 3,
        "administeredDate": "2026-01-01",
        "location": "Clinic Roma Norte",
        "notes": "No side effects",
        "createdAt": "2026-01-01T10:00:00Z"
      },
      {
        "id": "550e8400-e29b-41d4-a716-446655440051",
        "vaccineType": "HPV",
        "doseNumber": 2,
        "totalDoses": 3,
        "administeredDate": "2026-03-01",
        "location": "Clinic Roma Norte",
        "notes": null,
        "createdAt": "2026-03-01T10:00:00Z"
      }
    ]
  },
  {
    "vaccineType": "MPOX",
    "labelKey": "vaccines.mpox",
    "totalDoses": 2,
    "completedDoses": 2,
    "complete": true,
    "nextDoseDate": null,
    "doses": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440052",
        "vaccineType": "MPOX",
        "doseNumber": 1,
        "totalDoses": 2,
        "administeredDate": "2025-09-15",
        "location": "CDMX Health Center",
        "notes": null,
        "createdAt": "2025-09-15T10:00:00Z"
      },
      {
        "id": "550e8400-e29b-41d4-a716-446655440053",
        "vaccineType": "MPOX",
        "doseNumber": 2,
        "totalDoses": 2,
        "administeredDate": "2025-10-15",
        "location": "CDMX Health Center",
        "notes": null,
        "createdAt": "2025-10-15T10:00:00Z"
      }
    ]
  }
]
```

---

## Record Vaccination Dose

Record a new vaccination dose.

```
POST /api/vaccinations
```

### Request Body

```json
{
  "vaccineType": "HPV",
  "doseNumber": 3,
  "administeredDate": "2026-07-01",
  "location": "Clinic Roma Norte",
  "notes": "Final dose in series"
}
```

| Field | Type | Required | Max Length | Description |
|-------|------|----------|------------|-------------|
| `vaccineType` | string | Yes | 32 | Catalog vaccine type key (e.g., `HPV`, `MPOX`, `HEP_A`, `HEP_B`) |
| `doseNumber` | integer | Yes | - | Dose number in the series (1-based) |
| `administeredDate` | string | Yes | - | Date administered in YYYY-MM-DD format |
| `location` | string | No | 200 | Where the dose was administered (encrypted) |
| `notes` | string | No | 5000 | Notes (encrypted) |

### Response (200 OK)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440054",
  "vaccineType": "HPV",
  "doseNumber": 3,
  "totalDoses": 3,
  "administeredDate": "2026-07-01",
  "location": "Clinic Roma Norte",
  "notes": "Final dose in series",
  "createdAt": "2026-07-01T10:00:00Z"
}
```

---

## Update Vaccination Dose

Update an existing vaccination dose record. All fields are optional (partial update).

```
PUT /api/vaccinations/{id}
```

### Request Body

```json
{
  "vaccineType": "HPV",
  "doseNumber": 3,
  "administeredDate": "2026-07-02",
  "location": "Updated clinic name",
  "notes": "Updated notes"
}
```

| Field | Type | Required | Max Length | Description |
|-------|------|----------|------------|-------------|
| `vaccineType` | string | No | 32 | Catalog vaccine type key |
| `doseNumber` | integer | No | - | Dose number in the series |
| `administeredDate` | string | No | - | Date administered in YYYY-MM-DD format |
| `location` | string | No | 200 | Where the dose was administered (encrypted) |
| `notes` | string | No | 5000 | Notes (encrypted) |

### Response (200 OK)

Returns the updated `VaccinationResponse`.

---

## Delete Vaccination Dose

Delete a vaccination dose record.

```
DELETE /api/vaccinations/{id}
```

### Response (204 No Content)

No response body.

:::note Privacy
All vaccination data (locations, notes) is encrypted at rest. Vaccination records are only accessible by the authenticated user. Completed vaccine types may appear in the user's Insights summary but are never shared with other users.
:::
