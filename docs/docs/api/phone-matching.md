---
sidebar_position: 9
title: Phone Matching
---

# Phone Matching

Phone matching is the primary mechanism for creating connections between users who exchanged phone numbers during an encounter. There is no direct HTTP API for phone matching — it is triggered automatically when journal entries include phone numbers.

## How It Works

### Path 1: Mutual Auto-Match (No Opt-In Required)

1. User A creates a journal entry and includes User B's phone number
2. User B creates a journal entry and includes User A's phone number
3. If the encounter dates are within ±2 days (configurable), a **confirmed connection** is auto-created with type `PHONE_MATCH`
4. Neither user needs to confirm — mutual logging IS consent

```
User A logs encounter (March 3) with phone +52 614 111 2222
User B logs encounter (March 4) with phone +52 614 333 4444  ← User A's phone
                                                    ↓
            Mutual match detected → CONFIRMED connection created
```

### Path 2: Notification Match (Opt-In Required)

1. User B has enabled `receive_match_notifications` in their settings
2. User A creates a journal entry with User B's phone number
3. User B receives a notification showing a partial phone number: `614235*****`
4. User B can:
   - **Confirm** → connection created with type `NOTIFICATION_MATCH`
   - **Deny** → no connection, denial tracked
   - **Block** → phone hash blocked, no future notifications
   - **Report** → phone hash reported and auto-blocked

:::caution Work in Progress
The notification delivery for one-sided entries (`processOneSidedEntry`) is not yet fully implemented. It requires a `phone_hash` column on the `users` table to look up notification recipients. The mutual auto-match path works fully.
:::

## Phone Hashing

Phone numbers are never stored in plaintext. The process:

1. **Normalize**: Strip all non-digit characters (`+52 614-235-1234` → `526142351234`)
2. **Hash**: SHA-256 with application pepper (same pattern as email hashing via `EncryptionService`)
3. **Store**: Only the 64-character hex hash is stored in `connection_phone_entries` and `encounter_journal.phone_hash`

## Anti-Abuse Protections

### Rate Limiting

Users are limited to a configurable number of phone match attempts per week (default: 5).

| Config Key | Default | Description |
|-----------|---------|-------------|
| `phone_match.max_attempts_per_week` | `5` | Max outbound phone-match entries per user per week |

Exceeding the limit returns HTTP 429.

### Denial Cooldown

After a configurable number of denials, the sender is throttled.

| Config Key | Default | Description |
|-----------|---------|-------------|
| `phone_match.denial_cooldown_threshold` | `3` | Number of denials before throttling sender |

### Phone Blocking

Users can block specific phone hashes. Blocked phones:
- Never trigger auto-matches
- Never send notifications
- Are stored per-user in the `phone_blocks` table

### Phone Reporting

Users can report abusive phone hashes with a reason. Reporting auto-blocks the phone. Reports are stored in the `phone_reports` table for admin review.

## Background Job

`PhoneMatchJob` runs every 5 minutes (configurable via `navilla.phone-match.interval-ms`):

1. Scans `connection_phone_entries` for unmatched entries
2. Attempts mutual matching first
3. Falls back to notification matching for opted-in users

## Connection Types

| Type | Description | Confirmation |
|------|-------------|-------------|
| `PHONE_MATCH` | Both users logged each other's phones within date window | Automatic (mutual) |
| `NOTIFICATION_MATCH` | One user logged, other confirmed via notification | Manual (one-sided) |
| `EXPLICIT` | Traditional connection request via email/username | Manual (accept/deny) |
| `LINK` | Connected via shareable link | Manual (accept) |

## Configurable Settings

All settings stored in `app_config`, changeable at runtime:

| Key | Default | Description |
|-----|---------|-------------|
| `phone_match.window_days` | `2` | ±N days tolerance for encounter date matching |
| `phone_match.max_attempts_per_week` | `5` | Rate limit per user per week |
| `phone_match.denial_cooldown_threshold` | `3` | Denials before throttling |

## Database Tables

| Table | Purpose |
|-------|---------|
| `connection_phone_entries` | Phone hashes from journal entries, tracks match status |
| `phone_blocks` | Per-user blocked phone hashes |
| `phone_reports` | Abuse reports with reason |
| `encounter_journal.phone_hash` | Optional phone hash on journal entries |
| `connections.connection_type` | How the connection was formed |
