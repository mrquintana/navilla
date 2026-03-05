# Lab Integration Framework — Design Document

> **Date:** 2026-03-05
> **Status:** Approved
> **Scope:** Pluggable lab verification framework with mock providers, preparing for Chopo/Salud Digna partnerships

---

## Overview

A pluggable framework for verifying test results through lab APIs. Each lab is a Spring component implementing a `LabProvider` interface. The app routes verification requests to the right provider based on the lab's provider code. Mock providers enable full development and testing of the verification flow before real lab partnerships are closed.

**Why now:** Self-reported test data is useful for personal tracking (Layer 1) but should not feed into aggregate exposure statistics (Layer 2) without verification. Lab integration is the foundation that makes recency buckets, verified badges, and trusted network statistics meaningful.

---

## 1. Architecture: Interface + Strategy Pattern

### What the app owns (stays the same regardless of lab):
- Verification request routing (user picks lab, submits credentials)
- Storing extracted results + raw responses (encrypted)
- Updating test_visits, test_results, and health_status
- Frontend verification UI flow
- i18n for lab names, field labels, status messages

### What each lab provider owns (fully replaceable):
- How to call the lab's API/portal (HTTP client, auth, headers)
- How to interpret the response (parsing logic specific to that lab's format)
- Validation of input fields (orderId format, required fields)
- Error handling specific to that lab's quirks

### File structure

```
backend/src/main/java/app/navilla/
  lab/
    LabProvider.java                    ← core interface
    LabProviderRegistry.java            ← auto-discovers all providers, routes by code
    LabVerificationService.java         ← orchestrates verify → store → update
    LabVerificationResult.java          ← raw response + parsed results
    LabTestResult.java                  ← extracted fields per condition
    LabProviderProperties.java          ← binds application.yml config
    providers/
      MockDemoMxProvider.java           ← mock lab A (orderId + patientId)
      MockExpressProvider.java          ← mock lab B (orderId only)
    util/
      PdfTextExtractor.java            ← shared utility (for future PDF labs)
      HtmlDocumentFetcher.java         ← shared utility (for future HTML labs)
  controller/
    LabProviderController.java          ← GET /api/labs/providers, POST /api/labs/verify
    MockLabController.java              ← dev-only mock endpoints
```

### Adding a real lab

1. Write one `@Component` class implementing `LabProvider` (e.g., `ChopoProvider`)
2. Add YAML entry with real URL + credentials
3. Disable mock providers in production
4. Done — zero changes to the rest of the app

---

## 2. LabProvider Interface

```java
interface LabProvider {
    // Matches labs.provider field (e.g., "CHOPO", "SALUD_DIGNA")
    String getProviderCode();

    // Validate per-visit input before calling external API
    ValidationResult validateInput(Map<String, String> visitCredentials);

    // Call lab API, return raw response + parsed results
    LabVerificationResult verify(
        Map<String, String> visitCredentials,    // per-request: orderId, etc.
        Map<String, String> labCredentials       // persistent: patientId, etc.
    );
}
```

**Why two credential maps:**
- `visitCredentials` — per-request (orderId changes every visit), submitted with the verification request
- `labCredentials` — persistent identifiers (patientId), stored in the `lab_credentials` EAV table

### Result types

```java
record LabVerificationResult(
    boolean success,
    byte[] rawResponse,              // raw bytes for encrypted storage
    String contentType,              // "application/json", "application/pdf", etc.
    List<LabTestResult> results,     // parsed conditions (empty if failed)
    String errorCode,                // null if success
    String errorMessage              // null if success
)

record LabTestResult(
    String patientName,              // from report
    LocalDate testDate,              // from report
    String conditionCode,            // mapped to condition_catalog code
    String result,                   // POSITIVE, NEGATIVE, REACTIVE, NON_REACTIVE
    String resultValue,              // quantitative value if available
    String referenceRange,           // lab's reference range
    String labReferenceId            // order/reference number from report
)
```

### Provider registration

```java
@Component
class LabProviderRegistry {
    private final Map<String, LabProvider> providers;

    LabProviderRegistry(List<LabProvider> providers) {
        this.providers = providers.stream()
            .collect(toMap(LabProvider::getProviderCode, identity()));
    }

    Optional<LabProvider> getProvider(String code) {
        return Optional.ofNullable(providers.get(code));
    }
}
```

### No separate parser interface

Each provider owns its own parsing logic. A generic `PdfResultParser` or `HtmlResultParser` won't work — every lab document has a different layout, field positions, and terminology. Shared utilities (`PdfTextExtractor`, `HtmlDocumentFetcher`) are tools that providers use internally, not interfaces.

---

## 3. Storage — Wiring Into Existing Schema

**No new tables.** The existing schema already supports this:

| Table | Role |
|-------|------|
| `labs` | User's saved lab profiles (provider code, encrypted name) |
| `lab_credentials` | EAV table for persistent per-lab identifiers (patientId, etc.) |
| `test_visits` | One row per lab visit (verified, verified_at, lab_id, lab_reference) |
| `test_results` | Per-condition results within a visit (status, result_value, document_ref) |
| `health_status` | Legacy single-status-per-condition (updated on verification for exposure network) |

**One new column on `test_visits`:**
- `raw_lab_response_encrypted` (BYTEA) — encrypted raw response from lab API for audit/re-parsing

**Verification flow:**

1. User selects lab from `labs` table (or creates a new saved lab)
2. User enters per-visit credentials (orderId) — request-time inputs, NOT stored
3. Backend routes to correct `LabProvider` based on `labs.provider`
4. Provider calls lab API → returns raw response + parsed `LabTestResult` list
5. Raw response → `test_visits.raw_lab_response_encrypted`
6. `test_visits.verified = true`, `verified_at = now()`
7. Each parsed condition → `test_results` row
8. If condition matches `condition_catalog`, also update `health_status` for exposure network

**Privacy:**
- Raw credentials (orderId) never stored in plaintext
- Raw lab response encrypted at rest (AES-256-GCM, same pattern as all other sensitive fields)
- `lab_credentials` EAV stores persistent identifiers encrypted

---

## 4. Configuration

**`application.yml`:**

```yaml
navilla:
  labs:
    providers:
      - code: MOCK_DEMO_MX
        name: "Lab Demo MX"
        nameEs: "Lab Demo MX"
        enabled: true
        baseUrl: "${server.address}/api/dev/mock-labs/demo-mx"
        requiredFields:
          - key: orderId
            label: "Order ID"
            labelEs: "Número de orden"
          - key: patientId
            label: "Patient ID"
            labelEs: "ID del paciente"
      - code: MOCK_EXPRESS
        name: "Lab Express"
        nameEs: "Lab Express"
        enabled: true
        baseUrl: "${server.address}/api/dev/mock-labs/express"
        requiredFields:
          - key: orderId
            label: "Order ID"
            labelEs: "Número de orden"
```

Labs are added/removed by editing YAML and redeploying. Credentials and secrets live in environment variables, not YAML.

---

## 5. Mock Lab Providers

Two mock providers for development, behind dev-mode gate:

### Mock Lab A — "Lab Demo MX" (orderId + patientId)
- Simulates a lab like Chopo
- Returns JSON with 3-4 test results (Chlamydia, Gonorrhea, Syphilis, HIV)
- Deterministic: same orderId always returns same results (seeded from orderId hash)
- Some orderIds return all negative, some return one positive — predictable for testing

### Mock Lab B — "Lab Express" (orderId only)
- Simulates a simpler lab portal
- Returns JSON with 2 conditions (HIV, Syphilis)
- Single input field

### Mock endpoints (dev-only)
```
GET /api/dev/mock-labs/demo-mx/results?orderId=X&patientId=Y
GET /api/dev/mock-labs/express/results?orderId=X
```

---

## 6. API Endpoints

```
GET  /api/labs/providers    → list enabled labs + required fields (from YAML config)
POST /api/labs/verify       → { labCode, visitId, visitCredentials, labCredentials }
                              → LabVerificationResult (parsed results for user review)
POST /api/labs/confirm      → { visitId, results } → confirms and saves verified results
```

**Synchronous flow:** User submits → backend calls lab API → result returned immediately.

**Two-step save:** `verify` returns parsed results for user review. `confirm` saves them after user approves. No blind auto-import.

---

## 7. Frontend Verification Flow

**Where it lives:** Inside existing Health Log / Test Visits flow.

1. User navigates to a test visit → sees "Verify with lab" button (only if `verified = false`)
2. **Lab selection:** List of enabled labs from `GET /api/labs/providers`. Each shows name + required fields
3. **Credential input:** Form renders dynamically based on lab's `requiredFields`. Persistent credentials (patientId) pre-filled from `lab_credentials` if saved
4. **Submit → loading → result:**
   - Success: shows extracted results (condition, result, date) for user to review
   - Failed: shows error message
5. **Confirm:** User confirms results → saved to test_visit/test_results/health_status

**UX details:**
- "Save patient ID for future visits" checkbox for persistent credentials
- Lab selection remembers user's last-used lab
- No verification badge shown until user explicitly confirms imported results

**i18n:** Lab names, field labels, status messages, error messages in both en_US and es_MX.

---

## 8. What This Unlocks (After Real Lab Partnerships)

Once Chopo/Salud Digna providers are implemented:

- **Exposure Recency Buckets** — using `test_date` from verified lab reports, recency is credible
- **Verified Test Badges** — `verified = true` backed by actual lab data
- **Trusted aggregate statistics** — exposure network built on lab-verified results only
- **Clear labeling** — any metric including self-reported data explicitly says so

**Integration path for a real lab:**
1. Complete partnership analysis + contact lab
2. Receive API docs or portal access
3. Write one `LabProvider` class (auth, API call, parsing)
4. Add YAML entry with real URL
5. Disable mock providers in production
6. Done

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Architecture | Interface + Strategy pattern | Same proven pattern as visualization engine. Real lab APIs have quirks best handled in code |
| Parsing | Per-lab, not per-format | Every lab's PDF/HTML/JSON has different structure. Generic parsers won't work |
| Config storage | application.yml | Labs change rarely. Simpler than DB. Secrets in env vars |
| Verification flow | Synchronous | Simpler UX and architecture. Lab result lookups are fast |
| Raw response storage | Encrypted on test_visits | Audit trail, re-parsing, dispute resolution |
| New tables | None | Existing test_visits, test_results, labs, lab_credentials already support this |
| Mock providers | Two (orderId+patientId, orderId-only) | Covers the two most likely real-world input patterns |
| Result confirmation | Two-step (verify → review → confirm) | User reviews before results are saved. No blind import |
