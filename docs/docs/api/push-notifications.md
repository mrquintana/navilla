---
sidebar_position: 8
title: Push Notifications
---

# Push Notifications API

Web Push subscription management for PWA push notifications (VAPID / RFC 8030).

## Get VAPID Public Key

Returns the server's VAPID public key needed by the browser's `PushManager.subscribe()`.

```
GET /api/push/vapid-public-key
```

**Authentication:** None (public endpoint)

### Response

```json
"BOtflOPjosI0rUZH-fFgpIK0pmC2mFSgx3yRKHLpO6eLudqRz7PtK9a5NVa1QL104SVoSgC2iBWH_6QLrA1BSQI"
```

---

## Subscribe to Push

Registers a Web Push subscription. The `endpoint`, `p256dh`, and `auth` values come from the browser's `PushManager.subscribe()` result.

```
POST /api/push/subscribe
```

### Request Body

```json
{
  "endpoint": "https://fcm.googleapis.com/fcm/send/example",
  "p256dh": "BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XbjhazAkj7I99e8p8REfWRs",
  "auth": "tBHItJI5svbpC7htfNMaRw"
}
```

| Field | Type | Max Length | Description |
|-------|------|-----------|-------------|
| `endpoint` | string | 2048 | Push service endpoint URL |
| `p256dh` | string | 500 | P-256 Diffie-Hellman public key (base64url) |
| `auth` | string | 500 | Authentication secret (base64url) |

All three fields are encrypted (AES-256-GCM) before storage.

### Response

```
201 Created
```

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440030",
  "createdAt": "2026-03-03T10:00:00Z"
}
```

---

## List Push Subscriptions

Returns all push subscriptions for the authenticated user.

```
GET /api/push/subscriptions
```

### Response

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440030",
    "createdAt": "2026-03-03T10:00:00Z"
  }
]
```

---

## Delete Push Subscription

Removes a push subscription by ID.

```
DELETE /api/push/subscriptions/{id}
```

### Response

```
204 No Content
```

---

## How Push Delivery Works

1. **Backend creates notification** via `NotificationService.createNotification()`
2. **NotificationService sends push** to all user's subscriptions (fire-and-forget)
3. **WebPushService** signs VAPID JWT (jose4j), encrypts payload, sends HTTP POST to push endpoint
4. **Service worker** receives `push` event, shows browser notification
5. **User clicks notification** → `notificationclick` event navigates to relevant page

### Notification Click Routes

| NotificationType | Click URL |
|-----------------|-----------|
| `MEDICATION_REMINDER` | `/health-log` |
| `VACCINATION_REMINDER` | `/health-log` |
| `TESTING_REMINDER` | `/health-log` |
| `FOLLOW_UP_REMINDER` | `/health-log` |
| `CONNECTION_REQUEST` | `/connections` |
| `CONNECTION_CONFIRMED` | `/connections` |
| `CONNECTION_DENIED` | `/connections` |
| `HEALTH_STATUS_UPDATE` | `/dashboard` |
| `EXPOSURE_ALERT` | `/dashboard` |
| `SYSTEM` | `/` |

### Stale Subscription Cleanup

When a push endpoint returns HTTP 404 or 410, the subscription is automatically deleted from the database.
