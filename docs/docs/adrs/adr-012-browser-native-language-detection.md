---
title: "ADR-012: Browser-native language and country detection"
---

# ADR-012: Browser-native language and country detection

| Field | Value |
|-------|-------|
| **Status** | Accepted |
| **Date** | February 2026 |
| **Deciders** | Miguel |

## Context

Navilla supports English and Spanish. On first visit, the app should pick the right language without asking the user. Additionally, the signup form has a country dropdown that benefits from a pre-selected value.

The initial implementation used the [ip-api.com](http://ip-api.com) free JSON endpoint to resolve the user's IP address to a country. This introduced two problems:

1. **Mixed content error** — `ip-api.com` only supports HTTPS on paid plans. Since `navilla.app` enforces HTTPS at the registry level, the browser blocked the HTTP request.
2. **Unnecessary external dependency** — an outbound network call on every signup page load, adding latency and a third-party failure mode for a non-critical feature.

## Decision

Replace the IP geolocation API call with **browser-native signals** only:

1. `Intl.DateTimeFormat().resolvedOptions().timeZone` — the device's IANA timezone, mapped to a country code via a static lookup table.
2. `navigator.language` — the browser's locale string (e.g. `es-MX`, `es`, `en-US`), used as a fallback.

These are synchronous, require no network request, involve no third party, and are available in all modern browsers.

## Detection logic

```
timezone → TIMEZONE_TO_COUNTRY map → country code
  if country is Spanish-speaking → es_MX

navigator.language starts with 'es' → es_MX

otherwise → en_US
```

Timezone is checked first because it reflects physical location more reliably than browser language settings. A user in Mexico City with an English browser should still see Spanish by default.

## i18next integration

The detection is registered as a custom `i18next-browser-languagedetector` detector named `timezoneLocale`. Detection order in production:

```
localStorage → timezoneLocale → fallback (en_US)
```

`localStorage` is always checked first so the user's explicit language choice is always respected. In development, only `localStorage` is used to avoid automatic detection interfering with testing.

## Alternatives considered

| Option | Reason rejected |
|--------|-----------------|
| ip-api.com (HTTP) | Blocked by HTTPS enforcement on navilla.app |
| ip-api.com (HTTPS, paid) | Paid plan for a non-critical UX feature; adds external dependency |
| ipapi.co or similar free HTTPS providers | Still an external call; rate limits; adds latency on signup load |
| Ask user to select language on first visit | Adds friction to an already multi-step signup flow |
| i18next built-in `navigator` detector | Reads `navigator.languages` raw; language codes (`es-MX`) don't match our resource keys (`es_MX`); no timezone signal |

## Consequences

- **No external API call** for language or country detection — zero latency, zero third-party dependency.
- **No IP address transmitted** to any service for this purpose.
- Accuracy is slightly lower than IP geolocation (e.g. a VPN user or a traveller with a foreign browser locale may get the wrong language), but the user can always switch via `LanguageSwitcher`.
- The static `TIMEZONE_TO_COUNTRY` table covers the countries in our dropdown; it must be extended if the country list grows.
