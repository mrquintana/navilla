---
sidebar_position: 2
title: Authentication
---

# Authentication API

Authentication is handled by Supabase Auth. The backend validates JWT tokens.

## Overview

```mermaid
sequenceDiagram
    participant Client
    participant Supabase
    participant API

    Client->>Supabase: Sign in (email/password)
    Supabase-->>Client: JWT + Refresh Token
    Client->>API: Request + Bearer Token
    API->>API: Validate JWT
    API-->>Client: Response
```

## Getting a Token

Use the Supabase client to authenticate:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Email/Password
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123',
});

// OAuth
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
});

// Get token
const token = data.session.access_token;
```

## Using the Token

Include the JWT in the Authorization header:

```bash
curl -X GET https://api.navilla.app/api/users/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

## Token Refresh

Tokens expire after 1 hour. Refresh using:

```typescript
const { data, error } = await supabase.auth.refreshSession();
```

## Sign Out

```typescript
await supabase.auth.signOut();
```

## Error Responses

### Invalid Token

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or expired token"
  }
}
```

### Missing Token

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authorization header required"
  }
}
```
