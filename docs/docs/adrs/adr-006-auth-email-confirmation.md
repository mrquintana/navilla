---
sidebar_position: 6
title: ADR-006 Email Confirmation
---

# ADR-006: Email Confirmation Handling

## Status

Accepted

## Date

2026-01-31

## Context

Supabase Auth supports optional email confirmation. When enabled:
- Users receive a verification email after signup
- They cannot sign in until they verify their email

When disabled:
- Users are auto-confirmed and can sign in immediately
- No verification email is sent

We needed to handle both scenarios gracefully in the frontend.

## Decision

### Dynamic Email Confirmation Detection

The signup flow detects whether email confirmation is required by checking if a session exists after `signUp()`:

```typescript
const { data, error } = await supabase.auth.signUp({ email, password });
const needsEmailConfirmation = !error && !data.session;
```

**Behavior:**
- If `session` exists after signup → User was auto-confirmed → Redirect to dashboard
- If no `session` after signup → Email confirmation required → Show confirmation screen

### Configuration

Email confirmation is configured in Supabase Dashboard:
- **Authentication** → **Providers** → **Email** → **Confirm email** toggle

For development, we recommend disabling email confirmation to simplify testing.

## Consequences

### Positive
- Works with any Supabase email confirmation setting
- No code changes needed when toggling email confirmation
- Clear UX in both scenarios
- Developers can test signup without email setup

### Negative
- Users might be confused if they don't receive an expected email
- Need to configure SMTP in Supabase for production email delivery

## Implementation

- `AuthContext.tsx`: Returns `needsEmailConfirmation` from `signUp()`
- `SignUpPage.tsx`: Conditionally shows confirmation screen or redirects
