# Notification Privacy Design

**Date:** 2026-03-11
**Week:** 12 (Phase 3 — Notification privacy + polish)

## Problem

Push notifications currently expose sensitive health information on lock screens:

1. **Title** shows raw enum names: `CONNECTION_REQUEST`, `MEDICATION_REMINDER`, `EXPOSURE_ALERT`
2. **Body** shows untranslated i18n keys: `notifications.connectionRequest`
3. Missing locale keys for reminder notifications cause raw key strings in-app

Anyone glancing at a locked phone can infer the user's sexual health activity.

## Decision

**Always generic** — every push notification shows "Navilla: You have a new update". No opt-in for detailed previews. Users see details only after opening the app and authenticating.

## Changes

### Backend: `NotificationService.sendPushForNotification()`

Replace specific content with generic:
- **Title**: `"Navilla"` (was `type.name()`)
- **Body**: `"You have a new update"` (was `messageKey`)
- **Tag**: keep `type.name()` (internal grouping only, not user-visible)

### Locale files: add missing i18n keys

Add to both `en_US.json` and `es_MX.json` for in-app display (behind auth):
- `notifications.medicationReminder`
- `notifications.vaccinationReminder`
- `notifications.testingReminder`
- `notifications.followUpReminder`

### No changes needed

- **Service worker** — already handles generic payloads correctly
- **In-app NotificationsPage** — continues showing translated detailed messages (behind auth)
- **Database** — notification payload already encrypted
- **Email digest** — separate system, not affected

### Tests

- Update existing tests for `sendPushForNotification` to verify generic content
- Add test asserting push payload never contains notification type in title/body
