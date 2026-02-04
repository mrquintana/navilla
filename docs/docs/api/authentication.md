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

// Environment variables are typically loaded via a build process (e.g., Vite)
// and prefixed with VITE_.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
curl -X GET http://localhost:8080/api/users/me \
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

## Forgot Password

Request a password reset email:

```typescript
const { error } = await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: 'https://navilla.app/reset-password',
});
```

The user receives an email with a link to reset their password. The link includes a token that's valid for a limited time.

## Reset Password

After clicking the reset link, update the password:

```typescript
// This works because the user clicked the magic link
// which establishes a session
const { error } = await supabase.auth.updateUser({
  password: newPassword,
});
```

### Password Requirements

- Minimum 8 characters
- No maximum length restriction
- No specific complexity requirements (by default)

## Email Verification

When email confirmation is enabled in Supabase:

```typescript
// Sign up - user gets verification email
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123',
});

// Check if email confirmation was required
if (!data.session) {
  // User needs to verify email before logging in
}
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
