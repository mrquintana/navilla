---
sidebar_position: 8
title: PWA
---

# Progressive Web App (PWA)

Navilla is installable as a PWA, enabling push notifications, offline access, and a native app experience.

---

## Setup

Built with `vite-plugin-pwa` using the `injectManifest` strategy for a custom service worker.

### Web App Manifest

Generated at `dist/manifest.webmanifest`:

| Property | Value |
|----------|-------|
| Name | Navilla — Sexual Health Companion |
| Short Name | Navilla |
| Theme Color | `#4f46e5` (indigo-600) |
| Background Color | `#fafaf9` (warm stone) |
| Display | `standalone` |
| Start URL | `/` |

### Icons

| File | Size | Purpose |
|------|------|---------|
| `icons/icon-192.png` | 192x192 | Standard icon |
| `icons/icon-512.png` | 512x512 | Splash screen |
| `icons/icon-512-maskable.png` | 512x512 | Adaptive icon (safe zone) |

Generated from `favicon.svg` using sharp-cli.

---

## Service Worker

Custom service worker at `frontend/src/sw.ts` handles:

1. **Precaching** — all build assets via Workbox `precacheAndRoute()`
2. **Runtime caching** — API, fonts, images (see [Caching](./caching))
3. **Push notifications** — `push` and `notificationclick` event handlers
4. **Update flow** — `SKIP_WAITING` message for prompt updates

---

## Frontend Components

### InstallPrompt (`components/pwa/InstallPrompt.tsx`)
Bottom banner prompting PWA installation:
- Only shown to authenticated users
- Uses `beforeinstallprompt` browser event
- 7-day dismiss via localStorage
- Indigo accent matching design system

### OfflineIndicator (`components/pwa/OfflineIndicator.tsx`)
Amber top banner when `navigator.onLine === false`:
- Auto-hides when connection restored
- Non-intrusive, dismissible

### PwaUpdatePrompt (`components/pwa/PwaUpdatePrompt.tsx`)
Notification when a new app version is available:
- Uses `useRegisterSW` from `virtual:pwa-register/react`
- "Update" sends `SKIP_WAITING` to service worker
- "Later" dismisses for current session

### Push Notifications Toggle
Added to `ReminderSettingsModal.tsx`:
- Toggle to subscribe/unsubscribe from push
- Shows "blocked" warning if browser permission denied

---

## Hooks

### `usePwaInstall`
Captures `beforeinstallprompt` event, manages dismiss state.

### `usePushNotifications`
Returns `{ isSupported, permission, isSubscribed, isLoading, subscribe, unsubscribe }`.

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VAPID_PUBLIC_KEY` | Yes | VAPID public key for push subscriptions |
| `VAPID_PRIVATE_KEY` | Yes | VAPID private key for signing push messages |
| `VAPID_SUBJECT` | No | Contact URI (defaults to `mailto:contact@navilla.app`) |

Generate keys: `npx web-push generate-vapid-keys`

---

## nginx Configuration

The following rules in `frontend/nginx.conf` support PWA:

```nginx
# CSP allows service worker and manifest
Content-Security-Policy "... worker-src 'self'; manifest-src 'self';";

# Service worker and manifest must not be cached
location ~* (sw\.js|manifest\.webmanifest)$ {
    expires -1;
    add_header Cache-Control "no-cache, no-store, must-revalidate";
}
```
