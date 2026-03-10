---
sidebar_position: 1
title: API Overview
---

# API Overview

The Navilla API is a RESTful API that provides access to all platform functionality.

## Base URL

```
Production: https://api.navilla.app # TODO: Update with actual production URL
Staging:    https://api-staging.navilla.app # TODO: Update with actual staging URL
Local:      http://localhost:8080
```

## Authentication

All endpoints except health checks require authentication via JWT token.

```bash
curl -H "Authorization: Bearer <jwt_token>" \
  https://api.navilla.app/api/users/me
```

Tokens are obtained from Supabase Auth. See [Authentication](./authentication) for details.

## Response Format

Responses return plain JSON objects or arrays. Error responses use the standard error shape defined by `ApiError`.

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Missing or invalid token |
| `FORBIDDEN` | 403 | Not allowed to access resource |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid input |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

## Rate Limits

| Endpoint Type | Limit | Window |
|---------------|-------|--------|
| Authentication | 5 requests | 15 minutes |
| Read operations | 100 requests | 1 minute |
| Write operations | 20 requests | 1 minute |

## API Endpoints

| Group | Endpoints |
|-------|-----------|
| [Authentication](./authentication) | Login, token refresh |
| [Users](./users) | Profile management |
| [Connections](./connections) | Connection requests |
| [Health Status](./health-status) | STI status management |
| [Exposures](./exposures) | Exposure calculations |
| [Notifications](./notifications) | In-app notifications |
| [Catalog](./catalog) | Conditions, network stages, health catalog |
| [Reciprocity](./reciprocity) | Exposure network opt-in/out |
| [Phone Matching](./phone-matching) | Phone-based connection matching |
| [Encounter Journal](./journal) | Encounter entries, partners, templates |
| [Health Log](./health-log) | Visits, labs, condition history |
| [Medications](./medications) | Medication tracking, doses, adherence |
| [Vaccinations](./vaccinations) | Vaccination series and doses |
| [Reminders](./reminders) | Reminder management and settings |
| [Insights](./insights) | Personal health insights |
