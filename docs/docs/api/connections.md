---
sidebar_position: 4
title: Connections
---

# Connections API

Endpoints for managing user connections.

## List Connections

Get all confirmed connections for the authenticated user.

```
GET /api/connections
```

### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | Filter by status: `confirmed`, `pending` |

### Response

```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "status": "confirmed",
      "confirmedAt": "2026-01-20T10:00:00Z"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "status": "confirmed",
      "confirmedAt": "2026-01-18T14:30:00Z"
    }
  ],
  "meta": {
    "total": 2
  }
}
```

:::note Privacy
Connection responses do not include partner identities. Only connection IDs and metadata are returned.
:::

## Get Pending Requests

Get connection requests awaiting the user's response.

```
GET /api/connections/pending
```

### Response

```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440003",
      "requestedAt": "2026-01-29T10:00:00Z",
      "expiresAt": "2026-02-28T10:00:00Z"
    }
  ]
}
```

## Request Connection

Request a new connection with another user.

```
POST /api/connections
```

### Request Body

```json
{
  "email": "partner@example.com"
}
```

### Response

```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440004",
    "status": "pending",
    "requestedAt": "2026-01-30T10:00:00Z"
  }
}
```

:::note Privacy
The response does not reveal whether the target user has an account.
:::

## Confirm Connection

Accept a pending connection request.

```
POST /api/connections/{id}/confirm
```

### Response

```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440003",
    "status": "confirmed",
    "confirmedAt": "2026-01-30T10:15:00Z"
  }
}
```

## Deny Connection

Reject a pending connection request.

```
POST /api/connections/{id}/deny
```

### Response

```json
{
  "data": {
    "message": "Connection request denied"
  }
}
```

:::note Privacy
The requester only sees "not confirmed" - they don't know if the request was denied or ignored.
:::

## Remove Connection

Remove an existing confirmed connection.

```
DELETE /api/connections/{id}
```

### Response

```json
{
  "data": {
    "message": "Connection removed"
  }
}
```

:::note
Removing a connection only affects the requesting user's view. The other party retains the connection history for their exposure calculations.
:::
