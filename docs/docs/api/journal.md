---
sidebar_position: 10
title: Encounter Journal
---

# Encounter Journal API

Endpoints for managing encounter journal entries, journal partners, custom field templates, and summary statistics. All endpoints require authentication via Supabase JWT.

## Endpoints Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/journal` | List journal entries |
| POST | `/api/journal` | Create a journal entry |
| PUT | `/api/journal/{id}` | Update a journal entry |
| DELETE | `/api/journal/{id}` | Delete a journal entry |
| GET | `/api/journal/templates` | Get custom field templates |
| PUT | `/api/journal/templates` | Save custom field templates |
| GET | `/api/journal/summary` | Get monthly encounter summary |
| GET | `/api/journal/recent-aliases` | Get recent partner aliases |
| GET | `/api/journal/partners` | List all partners |
| POST | `/api/journal/partners` | Create a partner |
| POST | `/api/journal/partners/promote` | Promote alias to partner |
| GET | `/api/journal/partners/{id}` | Get partner detail |
| PUT | `/api/journal/partners/{id}` | Update a partner |
| DELETE | `/api/journal/partners/{id}` | Delete a partner |
| GET | `/api/journal/partners/{id}/entries` | List partner's entries |

---

## Journal Entries

### List Entries

List journal entries for the authenticated user, optionally filtered by month.

```
GET /api/journal
```

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `month` | string | No | Filter by month in `YYYY-MM` format |

#### Response (200 OK)

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "encounterDate": "2026-03-01",
    "partnerAlias": "Alex",
    "connectionId": null,
    "connectionDisplayName": null,
    "notes": "Met at a friend's party",
    "customFields": [
      { "label": "Location", "value": "Downtown bar" }
    ],
    "partnerId": "550e8400-e29b-41d4-a716-446655440010",
    "partnerEncounterCount": 3,
    "encounterTypes": ["oral", "anal"],
    "protectionMethods": ["condom"],
    "createdAt": "2026-03-01T22:00:00Z",
    "updatedAt": "2026-03-01T22:00:00Z"
  }
]
```

### Create Entry

Create a new journal entry.

```
POST /api/journal
```

#### Request Body

```json
{
  "encounterDate": "2026-03-01",
  "partnerAlias": "Alex",
  "connectionId": null,
  "partnerId": "550e8400-e29b-41d4-a716-446655440010",
  "phone": "+521234567890",
  "notes": "Met at a friend's party",
  "encounterTypes": ["oral", "anal"],
  "protectionMethods": ["condom"],
  "customFields": [
    { "label": "Location", "value": "Downtown bar" }
  ]
}
```

| Field | Type | Required | Max Length | Description |
|-------|------|----------|------------|-------------|
| `encounterDate` | date | Yes | - | Date of the encounter (YYYY-MM-DD) |
| `partnerAlias` | string | No | 200 | Freeform alias for the partner |
| `connectionId` | UUID | No | - | Link to a Navilla connection |
| `partnerId` | UUID | No | - | Link to a journal partner |
| `phone` | string | No | 20 | Partner phone number |
| `notes` | string | No | 5000 | Notes about the encounter |
| `encounterTypes` | string[] | No | 10 items | Types of encounter |
| `protectionMethods` | string[] | No | 10 items | Protection methods used |
| `customFields` | object[] | No | 3 items | Custom label-value fields |

#### Custom Field Object

| Field | Type | Required | Max Length |
|-------|------|----------|------------|
| `label` | string | Yes | 100 |
| `value` | string | Yes | 500 |

#### Response (200 OK)

Returns the created `JournalEntryResponse` (same shape as list response items).

### Update Entry

Update an existing journal entry.

```
PUT /api/journal/{id}
```

#### Request Body

Same shape as the create request. All fields except `encounterDate` are optional.

#### Response (200 OK)

Returns the updated `JournalEntryResponse`.

### Delete Entry

Delete a journal entry.

```
DELETE /api/journal/{id}
```

#### Response (204 No Content)

No response body.

---

## Templates

### Get Templates

Retrieve the user's custom field template labels.

```
GET /api/journal/templates
```

#### Response (200 OK)

```json
{
  "labels": ["Location", "Mood", "Rating"]
}
```

### Save Templates

Save custom field template labels for the authenticated user.

```
PUT /api/journal/templates
```

#### Request Body

```json
{
  "labels": ["Location", "Mood", "Rating"]
}
```

| Field | Type | Required | Max Length | Description |
|-------|------|----------|------------|-------------|
| `labels` | string[] | Yes | 3 items | Template labels (each max 100 chars) |

#### Response (200 OK)

Returns the saved `JournalTemplateResponse`.

---

## Summary

### Get Summary

Returns monthly encounter counts for a given year.

```
GET /api/journal/summary
```

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `year` | int | No | 2026 | The year to summarize |

#### Response (200 OK)

```json
{
  "year": 2026,
  "monthlyCounts": {
    "2026-01": 2,
    "2026-02": 5,
    "2026-03": 1
  },
  "yearTotal": 8
}
```

---

## Recent Aliases

### List Recent Aliases

Returns up to 8 recent distinct aliases from entries that are not linked to a partner.

```
GET /api/journal/recent-aliases
```

#### Response (200 OK)

```json
["Alex", "Jordan", "Sam"]
```

---

## Journal Partners

### List Partners

List all partners for the authenticated user, with encounter statistics.

```
GET /api/journal/partners
```

#### Response (200 OK)

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440010",
    "alias": "Alex",
    "connectionId": null,
    "connectionDisplayName": null,
    "encounterCount": 3,
    "firstEncounterDate": "2026-01-15",
    "mostRecentEncounterDate": "2026-03-01"
  }
]
```

### Create Partner

Create a new journal partner.

```
POST /api/journal/partners
```

#### Request Body

```json
{
  "alias": "Alex",
  "connectionId": null,
  "notes": "Met through mutual friends"
}
```

| Field | Type | Required | Max Length | Description |
|-------|------|----------|------------|-------------|
| `alias` | string | Yes | 200 | Partner alias/nickname |
| `connectionId` | UUID | No | - | Link to a Navilla connection |
| `notes` | string | No | 5000 | Notes about the partner |

#### Response (200 OK)

Returns the created `PartnerResponse`.

### Promote Alias to Partner

Promotes a freeform alias into a partner record, backfilling all matching journal entries.

```
POST /api/journal/partners/promote
```

#### Request Body

```json
{
  "alias": "Alex"
}
```

| Field | Type | Required | Max Length | Description |
|-------|------|----------|------------|-------------|
| `alias` | string | Yes | 200 | The freeform alias to promote |

#### Response (200 OK)

Returns the created `PartnerResponse` with encounter stats from backfilled entries.

### Get Partner Detail

Get detailed information about a specific partner.

```
GET /api/journal/partners/{id}
```

#### Response (200 OK)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440010",
  "alias": "Alex",
  "connectionId": null,
  "connectionDisplayName": null,
  "notes": "Met through mutual friends",
  "encounterCount": 3,
  "firstEncounterDate": "2026-01-15",
  "mostRecentEncounterDate": "2026-03-01",
  "createdAt": "2026-01-15T10:00:00Z",
  "updatedAt": "2026-03-01T22:00:00Z"
}
```

### Update Partner

Update an existing partner. All fields are optional (partial update).

```
PUT /api/journal/partners/{id}
```

#### Request Body

```json
{
  "alias": "Alexander",
  "connectionId": null,
  "notes": "Updated notes",
  "unlinkConnection": false
}
```

| Field | Type | Required | Max Length | Description |
|-------|------|----------|------------|-------------|
| `alias` | string | No | 200 | Updated alias |
| `connectionId` | UUID | No | - | Link to a Navilla connection |
| `notes` | string | No | 5000 | Updated notes |
| `unlinkConnection` | boolean | No | - | If true, removes connection link |

#### Response (200 OK)

Returns the updated `PartnerResponse`.

### Delete Partner

Delete a partner. By default, linked entries are unlinked (partnerId set to null). Pass `deleteEntries=true` to also delete linked entries.

```
DELETE /api/journal/partners/{id}
```

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `deleteEntries` | boolean | No | false | Also delete linked journal entries |

#### Response (200 OK)

No response body.

### List Partner Entries

List all journal entries linked to a specific partner.

```
GET /api/journal/partners/{id}/entries
```

#### Response (200 OK)

Returns a list of `JournalEntryResponse` objects (same shape as the main list entries response).

:::note Privacy
All journal data (entries, partners, notes, custom fields) is encrypted at rest and accessible only by the authenticated user. No journal data is ever shared with other users or exposed through the connections API.
:::
