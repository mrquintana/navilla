# Phone Input Redesign — Design

**Date:** 2026-03-12
**Week:** 12 (Phase 3 — Polish)

## Problem

Phone matching has a critical format variance bug. The normalization strips non-digits but doesn't handle country codes, so the same phone number in different formats produces different hashes and fails to match:

- User A: `5512345678` → hash A
- User B: `+52 55 1234 5678` → normalized `525512345678` → hash B (different)
- No match despite being the same phone number

Additionally:
- No input validation (accepts any string up to 20 chars)
- No country code field (needed for future international features)
- No REST API controller (frontend hooks call endpoints that 404)

## Design

### Phone Input Field

- **Digits only** — reject any non-digit character on input
- **Validation hints:**
  - User types `+` → *"To include a country code like +52 for Mexico or +1 for US, select it from the dropdown"*
  - User types any other non-digit → *"Only digits"*
- **Digit count:** 4-15 digits
- **No spaces, dashes, or formatting** — clean digit string

### Country Code Dropdown

- Optional, placed to the left of the phone input
- Shows flag + country name + code (e.g., flag MX Mexico +52)
- Searchable by country name or code (typing "mex" or "52" both find Mexico)
- Default: empty (no country code)
- Helper text: *"Optional — if you don't know, that's fine"*
- Stored separately from phone number for future use
- **Not part of the matching hash**

### Normalization for Hashing

1. Phone field already contains digits only (validated on input)
2. If country code selected AND digits start with that code → strip the country code prefix
3. Hash the remaining digits (SHA-256 + pepper, same as current)

**Match table:**

| User A enters | CC selected | User B enters | CC selected | Match? |
|---|---|---|---|---|
| `5512345678` | none | `5512345678` | none | Yes |
| `5512345678` | +52 | `5512345678` | none | Yes |
| `525512345678` | +52 | `5512345678` | none | Yes (52 stripped) |
| `525512345678` | none | `5512345678` | none | No (can't guess) |

The only failure case is when someone types the country code digits into the phone field without selecting from dropdown. The UI and validation guide users away from this.

### Database Migration (018)

Add `country_code VARCHAR(5)` nullable column to `connection_phone_entries`.

### Backend Changes

- `CreateJournalEntryRequest`: add optional `countryCode` field
- `EncryptionService.hashPhone()`: accept optional country code, strip prefix before hashing
- `PhoneMatchService.registerPhoneEntry()`: accept and store country code
- `EncounterJournalService`: pass country code through

### Frontend Changes

- New `CountryCodePicker` component (searchable dropdown with flags)
- Update `JournalEntryModal` phone input: digits-only validation, inline hints, country code picker
- Update API types and hooks for country code field

### No Changes To

- Matching logic (still mutual only, same window, same scheduled job)
- One-sided notifications (still deferred)
- Users table (no phone_hash needed yet)
- PhoneMatchController (still missing — separate task, not part of this redesign)

### Missing PhoneMatchController (noted, not in scope)

Frontend hooks expect `/api/phone-match/*` endpoints that don't exist. This is a separate task — the controller needs to expose pending matches, confirm, deny, and block. Not part of this phone input redesign but should be built soon.
