---
sidebar_position: 3
title: Users
---

# Users API

Endpoints for user profile management.

## Get Current User

Get the authenticated user's profile.

```
GET /api/users/me
```

### Response

```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "displayName": "Anonymous User",
    "verified": true,
    "connectionCount": 5,
    "createdAt": "2026-01-15T10:00:00Z"
  }
}
```

## Update Profile

Update the authenticated user's profile.

```
PATCH /api/users/me
```

### Request Body

```json
{
  "displayName": "New Display Name"
}
```

### Response

```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "displayName": "New Display Name",
    "verified": true,
    "connectionCount": 5,
    "createdAt": "2026-01-15T10:00:00Z"
  }
}
```

## Delete Account

Permanently delete the authenticated user's account and all associated data.

```
DELETE /api/users/me
```

### Request Body

```json
{
  "confirmation": "DELETE MY ACCOUNT"
}
```

### Response

```json
{
  "data": {
    "message": "Account deleted successfully"
  }
}
```

:::danger
This action is irreversible. All user data, connections, and health records will be permanently deleted.
:::
