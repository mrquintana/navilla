---
sidebar_position: 7
title: Notifications
---

# Notifications API

Endpoints for viewing in-app notifications. Notifications are automatically pushed to subscribed devices via Web Push — see [Push Notifications API](./push-notifications) for subscription management.

## List Notifications

```
GET /api/notifications
```

### Response

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440020",
    "type": "CONNECTION_REQUEST",
    "messageKey": "notifications.connectionRequest",
    "connectionId": "550e8400-e29b-41d4-a716-446655440004",
    "createdAt": "2026-02-04T10:00:00Z",
    "readAt": null
  }
]
```

## Mark Notification Read

```
POST /api/notifications/{id}/read
```

### Response

```
204 No Content
```

## Mark All Notifications Read

Mark all unread notifications as read for the authenticated user.

```
POST /api/notifications/read-all
```

### Response

```
204 No Content
```
