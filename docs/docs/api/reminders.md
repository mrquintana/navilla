---
sidebar_position: 14
title: Reminders
---

# Reminders API

Endpoints for managing health reminders (testing, medication, vaccination), snoozing, completing, and configuring per-user reminder settings. All endpoints require authentication via Supabase JWT.

## Endpoints Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reminders` | List active reminders |
| GET | `/api/reminders/upcoming` | Get upcoming reminders |
| POST | `/api/reminders/{id}/snooze` | Snooze a reminder |
| POST | `/api/reminders/{id}/complete` | Mark reminder complete |
| POST | `/api/reminders/{id}/toggle` | Toggle reminder active state |
| DELETE | `/api/reminders/{id}` | Delete a reminder |
| GET | `/api/reminders/settings` | Get reminder settings |
| PUT | `/api/reminders/settings` | Update reminder settings |

---

## Reminders

### List Reminders

List all active, incomplete reminders for the authenticated user.

```
GET /api/reminders
```

#### Response (200 OK)

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440060",
    "reminderType": "TESTING",
    "referenceId": null,
    "title": "Routine STI Screening",
    "message": "It's been 90 days since your last test",
    "scheduledFor": "2026-03-15T09:00:00Z",
    "repeatRule": "EVERY_90_DAYS",
    "snoozedUntil": null,
    "completedAt": null,
    "active": true,
    "createdAt": "2026-03-01T10:00:00Z"
  },
  {
    "id": "550e8400-e29b-41d4-a716-446655440061",
    "reminderType": "MEDICATION",
    "referenceId": "550e8400-e29b-41d4-a716-446655440040",
    "title": "PrEP Daily Dose",
    "message": "Time to take your Truvada",
    "scheduledFor": "2026-03-09T09:00:00Z",
    "repeatRule": "DAILY",
    "snoozedUntil": null,
    "completedAt": null,
    "active": true,
    "createdAt": "2026-01-01T10:00:00Z"
  }
]
```

### Get Upcoming Reminders

Returns reminders due within a specified number of days.

```
GET /api/reminders/upcoming
```

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `days` | int | No | 7 | Number of days ahead to look |

#### Response (200 OK)

Returns a list of `ReminderResponse` objects (same shape as the list response).

### Snooze Reminder

Snooze a reminder until a specified datetime.

```
POST /api/reminders/{id}/snooze
```

#### Request Body

```json
{
  "until": "2026-03-10T09:00:00Z"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `until` | string | Yes | ISO-8601 datetime to snooze until |

#### Response (200 OK)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440060",
  "reminderType": "TESTING",
  "referenceId": null,
  "title": "Routine STI Screening",
  "message": "It's been 90 days since your last test",
  "scheduledFor": "2026-03-15T09:00:00Z",
  "repeatRule": "EVERY_90_DAYS",
  "snoozedUntil": "2026-03-10T09:00:00Z",
  "completedAt": null,
  "active": true,
  "createdAt": "2026-03-01T10:00:00Z"
}
```

### Complete Reminder

Mark a reminder as completed.

```
POST /api/reminders/{id}/complete
```

#### Response (200 OK)

Returns the updated `ReminderResponse` with `completedAt` set to the current timestamp.

### Toggle Reminder

Toggle the active/inactive state of a reminder.

```
POST /api/reminders/{id}/toggle
```

#### Response (200 OK)

Returns the updated `ReminderResponse` with the `active` flag toggled.

### Delete Reminder

Delete a reminder.

```
DELETE /api/reminders/{id}
```

#### Response (204 No Content)

No response body.

---

## Reminder Settings

### Get Settings

Returns the reminder settings for the authenticated user.

```
GET /api/reminders/settings
```

#### Response (200 OK)

```json
{
  "quietHoursStart": "22:00",
  "quietHoursEnd": "08:00",
  "emailDigestEnabled": true,
  "emailDigestDay": "MONDAY",
  "testingRemindersEnabled": true,
  "medicationRemindersEnabled": true,
  "vaccinationRemindersEnabled": true
}
```

### Update Settings

Update the reminder settings. All fields are optional (partial update).

```
PUT /api/reminders/settings
```

#### Request Body

```json
{
  "quietHoursStart": "23:00",
  "quietHoursEnd": "07:00",
  "emailDigestEnabled": false,
  "emailDigestDay": "FRIDAY",
  "testingRemindersEnabled": true,
  "medicationRemindersEnabled": true,
  "vaccinationRemindersEnabled": false
}
```

| Field | Type | Required | Max Length | Description |
|-------|------|----------|------------|-------------|
| `quietHoursStart` | string | No | - | Quiet hours start time in HH:mm format |
| `quietHoursEnd` | string | No | - | Quiet hours end time in HH:mm format |
| `emailDigestEnabled` | boolean | No | - | Whether email digests are enabled |
| `emailDigestDay` | string | No | 12 | Day of the week for email digests |
| `testingRemindersEnabled` | boolean | No | - | Enable testing reminders |
| `medicationRemindersEnabled` | boolean | No | - | Enable medication reminders |
| `vaccinationRemindersEnabled` | boolean | No | - | Enable vaccination reminders |

#### Response (200 OK)

Returns the updated `ReminderSettingsResponse`.

## Reminder Types

| Type | Description |
|------|-------------|
| `TESTING` | Periodic STI testing reminders |
| `MEDICATION` | Daily/scheduled medication dose reminders |
| `VACCINATION` | Upcoming vaccination dose reminders |

:::note Privacy
Reminder content (titles, messages) is generated server-side from locale keys and never contains raw health data. Push notifications use generic titles and route to the app for details.
:::
