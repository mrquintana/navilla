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
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "displayName": "Anonymous User",
  "fullName": "Full Name",
  "username": "user_handle",
  "sex": "female",
  "dateOfBirth": "1990-01-01",
  "age": 34,
  "showAge": true,
  "country": "US",
  "location": "New York, NY",
  "profileVisibility": "PRIVATE",
  "displayNamePublic": false,
  "searchableByEmail": false,
  "avatarUrl": "https://project.supabase.co/storage/v1/object/public/avatars/profiles/...",
  "avatarThumbUrl": "https://project.supabase.co/storage/v1/object/public/avatars/profiles/...",
  "verified": true,
  "createdAt": "2026-01-15T10:00:00Z"
}
```

## Update Profile

Update the authenticated user's profile.

```
PUT /api/users/me
```

### Request Body

```json
{
  "displayName": "New Display Name",
  "fullName": "Full Name",
  "username": "user_handle",
  "sex": "female",
  "dateOfBirth": "1990-01-01",
  "showAge": true,
  "country": "US",
  "location": "New York, NY",
  "profileVisibility": "PUBLIC",
  "displayNamePublic": true,
  "searchableByEmail": true,
  "avatarKey": "profiles/550e8400-e29b-41d4-a716-446655440000/profile.png",
  "avatarThumbKey": "profiles/550e8400-e29b-41d4-a716-446655440000/thumb.png"
}
```

### Response

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "displayName": "New Display Name",
  "verified": true,
  "createdAt": "2026-01-15T10:00:00Z"
}
```

## Search Public Users

Search for a public profile by email or username.

```
GET /api/users/search?q={email_or_username}
```

### Response

```json
{
  "username": "user_handle",
  "displayName": "Public Name",
  "avatarThumbUrl": "https://project.supabase.co/storage/v1/object/public/avatars/profiles/..."
}
```

## Delete Account

Permanently delete the authenticated user's account and all associated data.

```
DELETE /api/users/me
```

### Response

```
204 No Content
```

:::danger
This action is irreversible. All user data, connections, and health records will be permanently deleted.
:::
