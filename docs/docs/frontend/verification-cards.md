---
sidebar_position: 7
---

# Verification Cards

Shareable, tamper-resistant health verification artifacts that prove a user's lab-verified test results.

## Architecture

### Why Verification Cards Exist
A regular HTML page showing test results is trivially forgeable. Navilla verification cards combine five layers of trust:

1. **Identity locked to profile** — No free-text names. Cards auto-resolve `firstName lastName` + `@username` from the user's verified profile. Card creation requires complete profile (firstName, lastName, username).

2. **Lab-verified results only** — Only conditions with `verified=true` AND `testDate != null` appear on cards. Self-reported results are excluded entirely. Test dates are always shown.

3. **Real-time server verification** — Public cards call `GET /api/public/cards/{token}/verify` on load and every 60 seconds. Returns HMAC-signed response. Green pulsing "Server Verified" badge confirms liveness. Screenshots go stale immediately.

4. **Visual anti-forgery (holographic CSS)** — Animated shimmer overlay, mouse-tracking radial gradient, rotating gradient border, micro-text watermark ("NAVILLA VERIFIED" at 3% opacity). All CSS-only.

5. **Access controls** — Optional view limits, optional expiry dates, view count tracking.

### Backend

#### Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/verification-cards` | JWT | Create card (auto-resolves identity from profile) |
| GET | `/api/verification-cards` | JWT | List user's cards |
| PUT | `/api/verification-cards/{id}` | JWT | Update card |
| DELETE | `/api/verification-cards/{id}` | JWT | Delete card |
| GET | `/api/public/cards/{shareToken}` | None | View public card (increments view count) |
| GET | `/api/public/cards/{shareToken}/verify` | None | Verify card validity (read-only, no view increment) |

#### Key Service Logic (`VerificationCardService`)

- **createCard**: Fetches user profile, requires firstName + lastName + username, builds encrypted displayName from profile, filters conditions to verified-only, generates 64-char hex share token
- **getPublicCard**: Filters to verified+testDate conditions, fetches username from user entity, increments view count
- **verifyCard**: Validates card exists/not expired/not over limit, returns HMAC signature (`HmacSHA256(shareToken:timestamp)`) without incrementing views

#### DTOs

- `CreateVerificationCardRequest`: includedConditions, showVerificationLevel, maxViews, expiresAt (no displayName, no showTestDates)
- `VerificationCardResponse`: includes username, displayName (auto-resolved), no showTestDates
- `PublicVerificationCardResponse`: includes username, conditions always have testDates
- `CardVerificationResponse`: valid, verifiedAt, signature (HMAC hex)

### Frontend

#### Pages

- **`/verification-card`** — Card builder page. Shows read-only identity from profile, verified-only condition picker, and card management (copy link, QR, share, edit, delete)
- **`/v/{shareToken}`** — Public card view with holographic effects and live verification

#### Holographic CSS Classes

- `.verification-card-holographic` — Container with shimmer overlay
- `.holographic-border` — Rotating gradient border using `@property --border-angle`
- `.verification-card-watermark` — Repeating diagonal "NAVILLA VERIFIED" text
- `.verification-badge-live` — Live verification badge (green valid / red invalid)

#### Card Builder Guards

1. Profile must have firstName, lastName, and username set
2. At least one condition must be lab-verified with a test date
3. If either guard fails, card creation is blocked with a helpful message

### Database

Table: `verification_cards` (migration 016)

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_hash | TEXT | FK to users(email_hash) |
| display_name_encrypted | BYTEA | Auto-resolved from profile |
| included_conditions | TEXT[] | Array of condition codes |
| show_test_dates | BOOLEAN | Always true (legacy column) |
| show_verification_level | BOOLEAN | Whether to show verification badges |
| share_token | VARCHAR(64) | Unique hex token for public access |
| privacy_mode | VARCHAR(20) | Card privacy mode |
| max_views | INTEGER | Optional view limit |
| current_views | INTEGER | Current view count |
| expires_at | TIMESTAMPTZ | Optional expiry |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

### Security Considerations

- Display names are AES-256-GCM encrypted at rest
- Share tokens are 256-bit cryptographically random hex strings
- HMAC signatures use the app's encryption key (HmacSHA256)
- View counting prevents unlimited access to limited cards
- The verify endpoint is intentionally read-only to prevent view count manipulation
