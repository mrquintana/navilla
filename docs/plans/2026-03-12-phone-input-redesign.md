# Phone Input Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix phone matching format variance bug by adding country code dropdown and digits-only validation, so the same phone number always produces the same hash regardless of how users enter it.

**Architecture:** Add optional `country_code` column to `connection_phone_entries`. Update `EncryptionService.hashPhone()` to accept optional country code and strip it before hashing. Build a `CountryCodePicker` component with flags and searchable dropdown. Update `JournalEntryModal` phone input to enforce digits-only with inline validation hints.

**Tech Stack:** Java 25 / Spring Boot, PostgreSQL (Supabase), React 19 / TypeScript / TailwindCSS, react-i18next

---

### Task 1: Database migration — add country_code column

**Files:**
- Create: `database/migrations/020_phone_country_code.sql`

**Step 1: Write the migration**

```sql
-- Migration 020: Add country_code to phone entries for international matching
-- Rollback:
--   ALTER TABLE connection_phone_entries DROP COLUMN IF EXISTS country_code;

ALTER TABLE connection_phone_entries
    ADD COLUMN country_code VARCHAR(5);

COMMENT ON COLUMN connection_phone_entries.country_code IS 'Optional ISO country calling code (e.g. 52 for Mexico, 1 for US). Stored for future use, not part of matching hash.';
```

**Step 2: Commit**

```bash
git add database/migrations/020_phone_country_code.sql
git commit -m "feat: add country_code column to connection_phone_entries"
git push
```

---

### Task 2: Backend — update entity and DTO

**Files:**
- Modify: `backend/src/main/java/app/navilla/entity/ConnectionPhoneEntry.java`
- Modify: `backend/src/main/java/app/navilla/dto/CreateJournalEntryRequest.java`

**Step 1: Add `countryCode` to `ConnectionPhoneEntry` entity**

After the `phoneHash` field (line 72), add:

```java
  /**
   * Optional country calling code (e.g. "52" for Mexico, "1" for US).
   * Stored for future use, not part of the matching hash.
   */
  @Column(name = "country_code", length = 5)
  private String countryCode;
```

**Step 2: Add `countryCode` to `CreateJournalEntryRequest`**

After the `phone` field (line 55), add:

```java
    @Size(max = 5, message = "{journal.error.countryCodeTooLong}")
    String countryCode,
```

**Step 3: Run backend tests**

Run: `cd backend && ./mvnw test`
Expected: All pass (new field is nullable, no existing tests break)

**Step 4: Commit**

```bash
git add backend/src/main/java/app/navilla/entity/ConnectionPhoneEntry.java backend/src/main/java/app/navilla/dto/CreateJournalEntryRequest.java
git commit -m "feat: add countryCode to phone entry entity and DTO"
git push
```

---

### Task 3: Backend — update hashPhone to strip country code

**Files:**
- Modify: `backend/src/main/java/app/navilla/security/EncryptionService.java:121-130`
- Modify: `backend/src/test/java/app/navilla/service/PhoneMatchServiceTest.java`

**Step 1: Write failing test for country code stripping**

Add a new `@Nested` class in `PhoneMatchServiceTest.java` after the `HashPhone` class:

```java
  @Nested
  @DisplayName("hashPhone with country code stripping")
  class HashPhoneWithCountryCode {

    @Test
    @DisplayName("same phone with and without country code produces same hash")
    void samePhoneWithAndWithoutCountryCode_sameHash() {
      // When hashPhone is called with country code "52" and digits "525512345678",
      // it should strip the leading "52" and hash "5512345678".
      // When called without country code and digits "5512345678",
      // it should hash "5512345678" — same result.
      when(encryptionService.hashPhone("5512345678", null)).thenCallRealMethod();
      when(encryptionService.hashPhone("525512345678", "52")).thenCallRealMethod();

      // Both should delegate to the same normalized string
      // We verify by calling registerPhoneEntry with different formats
      // and asserting the same phoneHash is stored.
    }
  }
```

Actually — since `hashPhone` is on `EncryptionService` (not `PhoneMatchService`), the proper test belongs in an `EncryptionService` test. But `EncryptionService` requires a pepper. Let's add the test directly to verify the normalization logic:

Add a new test class `EncryptionServicePhoneHashTest.java`:

```java
package app.navilla.security;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

@DisplayName("EncryptionService — hashPhone with country code")
class EncryptionServicePhoneHashTest {

  private EncryptionService encryptionService;

  @BeforeEach
  void setUp() {
    encryptionService = new EncryptionService();
    // Use reflection to set the pepper field, or provide a test constructor.
    // EncryptionService has @Value("${navilla.encryption.pepper}") private String pepper;
    // For testing, we can set it via reflection:
    try {
      var pepperField = EncryptionService.class.getDeclaredField("pepper");
      pepperField.setAccessible(true);
      pepperField.set(encryptionService, "test-pepper");
    } catch (Exception e) {
      throw new RuntimeException(e);
    }
  }

  @Test
  @DisplayName("digits-only phone without country code")
  void digitsOnly_noCountryCode() {
    String hash = encryptionService.hashPhone("5512345678", null);
    assertThat(hash).hasSize(64); // SHA-256 hex
  }

  @Test
  @DisplayName("same phone with country code stripped matches without country code")
  void withCountryCode_matchesWithout() {
    String hashWithout = encryptionService.hashPhone("5512345678", null);
    String hashWith = encryptionService.hashPhone("525512345678", "52");
    assertThat(hashWith).isEqualTo(hashWithout);
  }

  @Test
  @DisplayName("country code not at start of digits — no stripping")
  void countryCodeNotAtStart_noStripping() {
    String hashNormal = encryptionService.hashPhone("5512345678", null);
    String hashDiff = encryptionService.hashPhone("5512345678", "1");
    // "1" is not at the start of "5512345678", so no stripping occurs
    assertThat(hashDiff).isEqualTo(hashNormal);
  }

  @Test
  @DisplayName("null country code same as no country code")
  void nullCountryCode_sameAsNone() {
    String hashNull = encryptionService.hashPhone("5512345678", null);
    String hashEmpty = encryptionService.hashPhone("5512345678", "");
    assertThat(hashEmpty).isEqualTo(hashNull);
  }

  @Test
  @DisplayName("backward compatible — old single-arg method still works")
  void backwardCompatible_singleArgMethod() {
    String hashOld = encryptionService.hashPhone("5512345678");
    String hashNew = encryptionService.hashPhone("5512345678", null);
    assertThat(hashOld).isEqualTo(hashNew);
  }
}
```

**Step 2: Run test to verify it fails**

Run: `cd backend && ./mvnw test -pl . -Dtest=EncryptionServicePhoneHashTest`
Expected: FAIL — `hashPhone(String, String)` method doesn't exist yet

**Step 3: Add overloaded `hashPhone` method to `EncryptionService`**

In `EncryptionService.java`, keep the existing `hashPhone(String)` method and add a new overload below it:

```java
  /**
   * Hashes a phone number, optionally stripping a country code prefix.
   *
   * <p>If a country code is provided and the normalized digits start with it,
   * the prefix is stripped before hashing. This ensures matching works regardless
   * of whether users include the country code.
   *
   * @param rawPhone    the raw phone number (digits only expected, but non-digits are stripped)
   * @param countryCode optional country calling code (e.g. "52", "1") — digits only, no "+"
   * @return the hex-encoded hash (64 characters)
   */
  public String hashPhone(String rawPhone, String countryCode) {
    if (rawPhone == null || rawPhone.isBlank()) {
      throw new IllegalArgumentException("Phone number cannot be null or blank");
    }
    String normalized = rawPhone.replaceAll("[^\\d]", "");
    if (normalized.isEmpty()) {
      throw new IllegalArgumentException("Phone number must contain at least one digit");
    }
    // Strip country code prefix if provided and present
    if (countryCode != null && !countryCode.isBlank()) {
      String ccDigits = countryCode.replaceAll("[^\\d]", "");
      if (!ccDigits.isEmpty() && normalized.startsWith(ccDigits)) {
        normalized = normalized.substring(ccDigits.length());
      }
    }
    return hash(normalized);
  }
```

Update the existing single-arg method to delegate:

```java
  public String hashPhone(String rawPhone) {
    return hashPhone(rawPhone, null);
  }
```

**Step 4: Run test to verify it passes**

Run: `cd backend && ./mvnw test -pl . -Dtest=EncryptionServicePhoneHashTest`
Expected: PASS

**Step 5: Run full test suite**

Run: `cd backend && ./mvnw test`
Expected: All pass (old tests use single-arg method which delegates)

**Step 6: Commit**

```bash
git add backend/src/main/java/app/navilla/security/EncryptionService.java backend/src/test/java/app/navilla/security/EncryptionServicePhoneHashTest.java
git commit -m "feat: hashPhone strips country code prefix for consistent matching"
git push
```

---

### Task 4: Backend — wire country code through service layer

**Files:**
- Modify: `backend/src/main/java/app/navilla/service/PhoneMatchService.java:91-116`
- Modify: `backend/src/main/java/app/navilla/service/EncounterJournalService.java:137-145`

**Step 1: Update `PhoneMatchService.registerPhoneEntry` signature**

Change method signature to accept `countryCode`:

```java
  @Transactional
  public void registerPhoneEntry(String userHash, String rawPhone, String countryCode,
                                  LocalDate encounterDate, UUID journalEntryId) {
```

Update the hash call (line 102):

```java
    String phoneHash = encryptionService.hashPhone(rawPhone, countryCode);
```

Update the builder (line 105-110) to include country code:

```java
    ConnectionPhoneEntry entry = ConnectionPhoneEntry.builder()
        .userHash(userHash)
        .phoneHash(phoneHash)
        .countryCode(countryCode)
        .encounterDate(encounterDate)
        .journalEntryId(journalEntryId)
        .build();
```

**Step 2: Update `EncounterJournalService` to pass country code**

Change lines 138-144 in `EncounterJournalService.java`:

```java
    if (request.phone() != null && !request.phone().isBlank()) {
      String phoneHash = encryptionService.hashPhone(request.phone(), request.countryCode());
      saved.setPhoneHash(phoneHash);
      saved = journalRepository.save(saved);
      phoneMatchService.registerPhoneEntry(
          userHash, request.phone(), request.countryCode(),
          request.encounterDate(), saved.getId());
    }
```

**Step 3: Fix existing `PhoneMatchServiceTest`**

Update the test calls to `registerPhoneEntry` to include null country code (4th arg):

In `RegisterPhoneEntry` nested class, update all 3 tests:
- `registerPhoneEntry_createsEntry`: change line 124 to `phoneMatchService.registerPhoneEntry(USER_A_HASH, RAW_PHONE, null, ENCOUNTER_DATE, null);`
- `registerPhoneEntry_rateLimitExceeded_throwsException`: change line 144 to `phoneMatchService.registerPhoneEntry(USER_A_HASH, RAW_PHONE, null, ENCOUNTER_DATE, null)`
- `registerPhoneEntry_withJournalEntryId`: change line 162 to `phoneMatchService.registerPhoneEntry(USER_A_HASH, RAW_PHONE, null, ENCOUNTER_DATE, journalId);`

**Step 4: Run full backend tests**

Run: `cd backend && ./mvnw test`
Expected: All pass

**Step 5: Commit**

```bash
git add backend/src/main/java/app/navilla/service/PhoneMatchService.java backend/src/main/java/app/navilla/service/EncounterJournalService.java backend/src/test/java/app/navilla/service/PhoneMatchServiceTest.java
git commit -m "feat: wire country code through phone matching service layer"
git push
```

---

### Task 5: Frontend — build CountryCodePicker component

**Files:**
- Create: `frontend/src/components/ui/CountryCodePicker.tsx`

**Step 1: Create the component**

Build a searchable dropdown component:
- Props: `value: string | null`, `onChange: (code: string | null) => void`
- Renders a button showing the selected flag + code (or "Country code" placeholder)
- On click, opens a dropdown with search input + scrollable list
- Each item shows: flag emoji + country name + calling code
- Searchable by country name or calling code (typing "mex" or "52")
- Selecting an item calls `onChange` with the calling code (e.g. "52")
- Close on click outside or Escape key
- Helper text below: the translation key `journal.countryCodeHint`

Country data: inline array of `{ code: string, name: string, flag: string, callingCode: string }`. Include all countries but sort Mexico (+52) and US (+1) to the top since they're the primary markets. The `name` field should be the English name — searching is case-insensitive.

Keep the component under 200 lines. Use Tailwind for styling. Match the existing `input` class styling from the app.

**Step 2: Run lint**

Run: `cd frontend && npm run lint`
Expected: Clean

**Step 3: Commit**

```bash
git add frontend/src/components/ui/CountryCodePicker.tsx
git commit -m "feat: add CountryCodePicker component with flag search"
git push
```

---

### Task 6: Frontend — update JournalEntryModal phone input

**Files:**
- Modify: `frontend/src/components/journal/JournalEntryModal.tsx:128-132,582-601`
- Modify: `frontend/src/locales/en_US.json`
- Modify: `frontend/src/locales/es_MX.json`

**Step 1: Add locale keys**

In `en_US.json`, in the `"journal"` section, after `"phoneHint"` (line 617), add:

```json
    "phoneDigitsOnly": "Only digits",
    "phoneCountryCodeHint": "To include a country code like +52 for Mexico or +1 for US, select it from the dropdown",
    "countryCodeHint": "Optional — if you don't know, that's fine",
    "countryCodePlaceholder": "Country code",
```

In `es_MX.json`, in the `"journal"` section, after `"phoneHint"` (line 616), add:

```json
    "phoneDigitsOnly": "Solo dígitos",
    "phoneCountryCodeHint": "Para incluir código de país como +52 para México o +1 para EE.UU., selecciónalo del menú",
    "countryCodeHint": "Opcional — si no lo sabes, no hay problema",
    "countryCodePlaceholder": "Código de país",
```

**Step 2: Update the phone placeholder**

Change the phone input placeholder from `"+52 55 1234 5678"` to `"5512345678"` (digits only, no country code since that goes in the dropdown).

**Step 3: Add state and validation logic**

In `JournalEntryModal.tsx`, after `const [formPhone, setFormPhone] = useState('');` (line 132), add:

```tsx
const [formCountryCode, setFormCountryCode] = useState<string | null>(null);
const [phoneHint, setPhoneHint] = useState<string | null>(null);
```

Create a phone change handler that enforces digits-only:

```tsx
const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const raw = e.target.value;
  if (raw === '') {
    setFormPhone('');
    setPhoneHint(null);
    return;
  }
  // Check for "+" character
  if (raw.includes('+')) {
    setPhoneHint(t('journal.phoneCountryCodeHint'));
    setFormPhone(formPhone); // Don't update — reject the input
    return;
  }
  // Check for non-digit characters
  if (/[^0-9]/.test(raw)) {
    setPhoneHint(t('journal.phoneDigitsOnly'));
    setFormPhone(formPhone); // Don't update — reject the input
    return;
  }
  setPhoneHint(null);
  setFormPhone(raw);
};
```

**Step 4: Update the phone input JSX**

Replace the phone input section (lines 583-601) with:

```tsx
          {/* Phone number */}
          <div>
            <label className="label" htmlFor="journal-phone">
              {t('journal.phone')}
            </label>
            <div className="flex gap-2">
              <CountryCodePicker
                value={formCountryCode}
                onChange={setFormCountryCode}
              />
              <input
                id="journal-phone"
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                className="input flex-1"
                value={formPhone}
                placeholder="5512345678"
                maxLength={15}
                onChange={handlePhoneChange}
                autoComplete="off"
              />
            </div>
            {phoneHint ? (
              <p className="text-xs mt-1" style={{ color: 'var(--color-warning)' }}>
                {phoneHint}
              </p>
            ) : (
              <p className="text-xs text-muted mt-1">
                {t('journal.phoneHint')}
              </p>
            )}
          </div>
```

Add the `CountryCodePicker` import at the top of the file.

**Step 5: Update the form submission**

In the submit handler (~line 317), update the phone field to include country code:

```tsx
      phone: formPhone.trim() || undefined,
      countryCode: formCountryCode || undefined,
```

**Step 6: Update the API type**

In `frontend/src/lib/api.ts`, find the `CreateJournalEntryRequest` type (or where journal creation params are typed) and add `countryCode?: string`.

**Step 7: Run lint**

Run: `cd frontend && npm run lint`
Expected: Clean

**Step 8: Commit**

```bash
git add frontend/src/components/journal/JournalEntryModal.tsx frontend/src/locales/en_US.json frontend/src/locales/es_MX.json frontend/src/lib/api.ts
git commit -m "feat: digits-only phone input with country code picker and validation hints"
git push
```

---

### Task 7: Run migration and verify end-to-end

**Step 1: Run the migration on Supabase**

The migration needs to be run via Supabase SQL Editor. Contents of `020_phone_country_code.sql`.

**Step 2: Run full backend tests**

Run: `cd backend && ./mvnw test`
Expected: All pass

**Step 3: Run frontend lint**

Run: `cd frontend && npm run lint`
Expected: Clean

**Step 4: Commit any fixes**
