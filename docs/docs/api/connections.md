---
sidebar_position: 4
title: Connections
---

# Connections API

Endpoints for managing user connections. All endpoints require authentication via Supabase JWT.

## Endpoints Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/connections` | Create a new connection request |
| GET | `/api/connections` | Get all connections |
| GET | `/api/connections/confirmed` | Get confirmed connections only |
| GET | `/api/connections/pending/incoming` | Get pending incoming requests |
| GET | `/api/connections/pending/sent` | Get pending sent requests |
| GET | `/api/connections/stats` | Get connection statistics |
| POST | `/api/connections/{id}/accept` | Accept a connection request |
| POST | `/api/connections/{id}/deny` | Deny a connection request |
| DELETE | `/api/connections/{id}` | Cancel a pending request |

## Create Connection Request

Request a new connection with another user by their email address.

```
POST /api/connections
```

### Request Body

```json
{
  "recipientEmail": "partner@example.com"
}
```

### Response (201 Created)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440004",
  "status": "PENDING",
  "isRequester": true,
  "requestedAt": "2026-01-30T10:00:00Z",
  "confirmedAt": null
}
```

### Error Responses

| Status | Code | Description |
|--------|------|-------------|
| 400 | `connection.error.selfConnection` | Cannot connect with yourself |
| 404 | `connection.error.recipientNotFound` | Recipient user not found |
| 409 | `connection.error.alreadyExists` | Connection already exists |

:::note Privacy
The response does not reveal whether the target user has an account - you'll receive a generic "not found" error either way.
:::

## Get All Connections

Get all connections for the authenticated user (all statuses).

```
GET /api/connections
```

### Response (200 OK)

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "status": "CONFIRMED",
    "isRequester": true,
    "requestedAt": "2026-01-20T10:00:00Z",
    "confirmedAt": "2026-01-20T12:00:00Z"
  },
  {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "status": "PENDING",
    "isRequester": false,
    "requestedAt": "2026-01-29T10:00:00Z",
    "confirmedAt": null
  }
]
```

:::note Privacy
Connection responses do not include partner identities. Only connection IDs, status, and timestamps are returned.
:::

## Get Confirmed Connections

Get only confirmed connections for the authenticated user.

```
GET /api/connections/confirmed
```

### Response (200 OK)

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "status": "CONFIRMED",
    "isRequester": true,
    "requestedAt": "2026-01-20T10:00:00Z",
    "confirmedAt": "2026-01-20T12:00:00Z"
  }
]
```

## Get Pending Incoming Requests

Get connection requests awaiting the user's response.

```
GET /api/connections/pending/incoming
```

### Response (200 OK)

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440003",
    "status": "PENDING",
    "isRequester": false,
    "requestedAt": "2026-01-29T10:00:00Z",
    "confirmedAt": null
  }
]
```

## Get Pending Sent Requests

Get connection requests sent by the user that are still pending.

```
GET /api/connections/pending/sent
```

### Response (200 OK)

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440004",
    "status": "PENDING",
    "isRequester": true,
    "requestedAt": "2026-01-29T10:00:00Z",
    "confirmedAt": null
  }
]
```

## Get Connection Statistics

Get connection count statistics for the authenticated user.

```
GET /api/connections/stats
```

### Response (200 OK)

```json
{
  "confirmedCount": 5,
  "pendingIncomingCount": 2,
  "pendingSentCount": 1
}
```

## Accept Connection Request

Accept a pending connection request. Only the recipient can accept.

```
POST /api/connections/{id}/accept
```

### Response (200 OK)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440003",
  "status": "CONFIRMED",
  "isRequester": false,
  "requestedAt": "2026-01-29T10:00:00Z",
  "confirmedAt": "2026-01-30T10:15:00Z"
}
```

### Error Responses

| Status | Code | Description |
|--------|------|-------------|
| 404 | `connection.error.notFound` | Connection not found |
| 409 | `connection.error.notRecipient` | Not the recipient of this request |
| 409 | `connection.error.notPending` | Connection is not pending |

## Deny Connection Request

Reject a pending connection request. Only the recipient can deny.

```
POST /api/connections/{id}/deny
```

### Response (200 OK)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440003",
  "status": "DENIED",
  "isRequester": false,
  "requestedAt": "2026-01-29T10:00:00Z",
  "confirmedAt": null
}
```

:::note Privacy
The requester only sees the connection disappears - they don't know if the request was denied or ignored.
:::

## Cancel Connection Request

Cancel a pending connection request. Only the requester can cancel.

```
DELETE /api/connections/{id}
```

### Response (204 No Content)

No response body.

### Error Responses

| Status | Code | Description |
|--------|------|-------------|
| 404 | `connection.error.notFound` | Connection not found |
| 409 | `connection.error.notRequester` | Not the requester of this connection |
| 409 | `connection.error.notPending` | Connection is not pending |

## Connection Status Values

| Status | Description |
|--------|-------------|
| `PENDING` | Request sent, awaiting response |
| `CONFIRMED` | Connection accepted by recipient |
| `DENIED` | Connection rejected by recipient |
| `EXPIRED` | Request expired without response |

## Postman Collection

A Postman collection with all API endpoints is available for download:

[Download Navilla API Postman Collection](/postman/navilla-api.postman_collection.json)
