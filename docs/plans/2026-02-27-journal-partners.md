# Journal Partners (Regulars) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add first-class partner entities to the encounter journal so recurring partners can be saved, tracked, and viewed with encounter history and partner-level notes.

**Architecture:** New `journal_partners` table with encrypted alias and notes. Entries gain a nullable `partner_id` FK. Backend CRUD via new `JournalPartnerService` + controller. Frontend gets a Partners tab, partner detail page, and a partner picker in the entry modal with autocomplete and 3rd-encounter promotion prompt.

**Tech Stack:** Java 25 + Spring Boot 4 + JPA, PostgreSQL (Supabase), React 19 + TypeScript + TailwindCSS, React Query, Micrometer metrics, AES-256-GCM encryption via EncryptionService.

**Design doc:** `docs/plans/2026-02-27-journal-partners-design.md`

---

### Task 1: Database Migration

**Files:**
- Create: `database/migrations/009_journal_partners.sql`

**Step 1: Write the migration**

```sql
-- Navilla Database Schema
-- Migration 009: Journal Partners (Regulars)
-- Purpose: Add partner entities for recurring encounter partners
--
-- ROLLBACK:
-- BEGIN;
-- ALTER TABLE encounter_journal DROP COLUMN IF EXISTS partner_id;
-- DROP TABLE IF EXISTS journal_partners;
-- COMMIT;

BEGIN;

-- Saved partner aliases for recurring encounters
CREATE TABLE journal_partners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_hash VARCHAR(64) NOT NULL,
    alias_encrypted BYTEA NOT NULL,
    connection_id UUID REFERENCES connections(id) ON DELETE SET NULL,
    notes_encrypted BYTEA,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_journal_partners_user ON journal_partners(user_hash);

COMMENT ON TABLE journal_partners IS 'Encrypted partner aliases for recurring encounter journal entries.';
COMMENT ON COLUMN journal_partners.user_hash IS 'SHA-256 hashed user identity.';
COMMENT ON COLUMN journal_partners.alias_encrypted IS 'AES-256-GCM encrypted partner name/alias.';
COMMENT ON COLUMN journal_partners.notes_encrypted IS 'AES-256-GCM encrypted partner-level notes (not tied to any specific encounter).';

-- Add partner_id FK to encounter_journal
ALTER TABLE encounter_journal
    ADD COLUMN partner_id UUID REFERENCES journal_partners(id) ON DELETE SET NULL;

CREATE INDEX idx_encounter_journal_partner ON encounter_journal(partner_id);

COMMENT ON COLUMN encounter_journal.partner_id IS 'Optional link to a saved partner. Entries keep their own alias as a snapshot.';

COMMIT;
```

**Step 2: Commit**

```bash
git add database/migrations/009_journal_partners.sql
git commit -m "feat(db): add journal_partners table and partner_id column on encounter_journal"
```

**Step 3: Run migration in Supabase SQL Editor**

Paste the migration SQL into the Supabase SQL Editor and execute. Verify both the new table and the new column exist.

---

### Task 2: Backend Entity, Repository, DTOs

**Files:**
- Create: `backend/src/main/java/app/navilla/entity/JournalPartner.java`
- Create: `backend/src/main/java/app/navilla/repository/JournalPartnerRepository.java`
- Create: `backend/src/main/java/app/navilla/dto/CreatePartnerRequest.java`
- Create: `backend/src/main/java/app/navilla/dto/UpdatePartnerRequest.java`
- Create: `backend/src/main/java/app/navilla/dto/PartnerResponse.java`
- Create: `backend/src/main/java/app/navilla/dto/PartnerDetailResponse.java`
- Create: `backend/src/main/java/app/navilla/dto/PromoteAliasRequest.java`
- Modify: `backend/src/main/java/app/navilla/entity/EncounterJournal.java`
- Modify: `backend/src/main/java/app/navilla/dto/CreateJournalEntryRequest.java`
- Modify: `backend/src/main/java/app/navilla/dto/UpdateJournalEntryRequest.java`
- Modify: `backend/src/main/java/app/navilla/dto/JournalEntryResponse.java`
- Modify: `backend/src/main/java/app/navilla/repository/EncounterJournalRepository.java`

**Step 1: Create `JournalPartner` entity**

Follow the exact pattern of `JournalFieldTemplate.java`. Fields:
- `id` UUID PK with `@GeneratedValue(strategy = GenerationType.UUID)`
- `userHash` VARCHAR(64) NOT NULL
- `aliasEncrypted` BYTEA NOT NULL
- `connectionId` UUID nullable
- `notesEncrypted` BYTEA nullable
- `createdAt` with `@CreationTimestamp`
- `updatedAt` with `@UpdateTimestamp`

Use `@Entity`, `@Table(name = "journal_partners")`, `@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder`.

**Step 2: Create `JournalPartnerRepository`**

```java
@Repository
public interface JournalPartnerRepository extends JpaRepository<JournalPartner, UUID> {
    List<JournalPartner> findByUserHashOrderByUpdatedAtDesc(String userHash);
    void deleteByUserHash(String userHash);
}
```

**Step 3: Create DTOs**

`CreatePartnerRequest.java`:
```java
public record CreatePartnerRequest(
    @NotBlank(message = "{journal.partner.error.aliasRequired}")
    @Size(max = 200, message = "{journal.error.aliasTooLong}")
    String alias,
    UUID connectionId,
    @Size(max = 5000, message = "{journal.error.notesTooLong}")
    String notes
) {}
```

`UpdatePartnerRequest.java`:
```java
public record UpdatePartnerRequest(
    @Size(max = 200, message = "{journal.error.aliasTooLong}")
    String alias,
    UUID connectionId,
    @Size(max = 5000, message = "{journal.error.notesTooLong}")
    String notes,
    boolean unlinkConnection
) {}
```

`PartnerResponse.java`:
```java
public record PartnerResponse(
    UUID id,
    String alias,
    UUID connectionId,
    String connectionDisplayName,
    long encounterCount,
    LocalDate firstEncounterDate,
    LocalDate mostRecentEncounterDate
) {}
```

`PartnerDetailResponse.java`:
```java
public record PartnerDetailResponse(
    UUID id,
    String alias,
    UUID connectionId,
    String connectionDisplayName,
    String notes,
    long encounterCount,
    LocalDate firstEncounterDate,
    LocalDate mostRecentEncounterDate,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt
) {}
```

`PromoteAliasRequest.java`:
```java
public record PromoteAliasRequest(
    @NotBlank(message = "{journal.partner.error.aliasRequired}")
    String alias
) {}
```

**Step 4: Add `partnerId` to `EncounterJournal` entity**

Add to `EncounterJournal.java`:
```java
@Column(name = "partner_id")
private UUID partnerId;
```

**Step 5: Add `partnerId` to entry DTOs**

Add `UUID partnerId` field to both `CreateJournalEntryRequest` and `UpdateJournalEntryRequest`.

Add `UUID partnerId` and `Long partnerEncounterCount` fields to `JournalEntryResponse`.

**Step 6: Add repository queries to `EncounterJournalRepository`**

```java
List<EncounterJournal> findByUserHashAndPartnerIdOrderByEncounterDateDesc(
    String userHash, UUID partnerId);

long countByPartnerIdAndUserHash(UUID partnerId, String userHash);

@Query("SELECT MIN(e.encounterDate) FROM EncounterJournal e "
    + "WHERE e.partnerId = :partnerId AND e.userHash = :userHash")
LocalDate findFirstEncounterDate(
    @Param("partnerId") UUID partnerId, @Param("userHash") String userHash);

@Query("SELECT MAX(e.encounterDate) FROM EncounterJournal e "
    + "WHERE e.partnerId = :partnerId AND e.userHash = :userHash")
LocalDate findMostRecentEncounterDate(
    @Param("partnerId") UUID partnerId, @Param("userHash") String userHash);

List<EncounterJournal> findByPartnerIdAndUserHash(UUID partnerId, String userHash);

List<EncounterJournal> findByUserHashAndPartnerIdIsNullOrderByEncounterDateDesc(String userHash);
```

**Step 7: Commit**

```bash
git add backend/src/main/java/app/navilla/entity/ backend/src/main/java/app/navilla/repository/ backend/src/main/java/app/navilla/dto/
git commit -m "feat: add JournalPartner entity, repository, and DTOs"
```

---

### Task 3: Metrics Constants

**Files:**
- Modify: `backend/src/main/java/app/navilla/metrics/NavillaMetrics.java`
- Modify: `backend/src/main/java/app/navilla/metrics/JournalMetrics.java`

**Step 1: Add metric name constants to `NavillaMetrics.Names`**

After the existing journal constants (line 93), add:

```java
/** Journal partner created. */
public static final String JOURNAL_PARTNER_CREATED = "navilla.journal.partner.created";

/** Journal partner updated. */
public static final String JOURNAL_PARTNER_UPDATED = "navilla.journal.partner.updated";

/** Journal partner deleted. */
public static final String JOURNAL_PARTNER_DELETED = "navilla.journal.partner.deleted";

/** Alias promoted to a saved partner. */
public static final String JOURNAL_PARTNER_PROMOTED = "navilla.journal.partner.promoted";
```

**Step 2: Add recorder methods to `JournalMetrics`**

```java
public void recordPartnerCreated() {
    registry.counter(Names.JOURNAL_PARTNER_CREATED).increment();
}

public void recordPartnerUpdated() {
    registry.counter(Names.JOURNAL_PARTNER_UPDATED).increment();
}

public void recordPartnerDeleted() {
    registry.counter(Names.JOURNAL_PARTNER_DELETED).increment();
}

public void recordPartnerPromoted() {
    registry.counter(Names.JOURNAL_PARTNER_PROMOTED).increment();
}
```

**Step 3: Commit**

```bash
git add backend/src/main/java/app/navilla/metrics/
git commit -m "feat: add journal partner metric constants and recorders"
```

---

### Task 4: Backend i18n Error Messages

**Files:**
- Modify: `backend/src/main/resources/messages.properties` (if exists, otherwise skip — validation messages use annotation-level defaults)

**Step 1: Verify message key patterns**

Check if `backend/src/main/resources/messages.properties` exists. The existing code uses `{journal.error.dateRequired}` style message keys in `@NotNull` annotations. If a properties file exists, add:

```properties
journal.partner.error.notFound=Partner not found
journal.partner.error.notOwner=You do not own this partner
journal.partner.error.aliasRequired=Partner alias is required
```

If no properties file exists (validation messages fall through to defaults), skip this step. The `ResourceNotFoundException` and `IllegalStateException` messages are used as-is from the code.

**Step 2: Commit (if changes made)**

```bash
git add backend/src/main/resources/
git commit -m "feat: add journal partner i18n error messages"
```

---

### Task 5: Partner Service — Tests (TDD Red)

**Files:**
- Create: `backend/src/test/java/app/navilla/service/JournalPartnerServiceTest.java`

**Step 1: Write the service test class**

Follow the exact pattern of `EncounterJournalServiceTest.java`. Use `@ExtendWith(MockitoExtension.class)`.

Mock dependencies:
```java
@Mock JournalPartnerRepository partnerRepository;
@Mock EncounterJournalRepository journalRepository;
@Mock EncryptionService encryptionService;
@Mock JournalMetrics journalMetrics;
@Mock Jwt jwt;
@InjectMocks JournalPartnerService partnerService;
```

Write tests for (each in a `@Nested` class):

**`createPartner`** (3 tests):
- Creates partner with encrypted alias, stores userHash
- Creates partner with notes and connectionId
- Records metric `recordPartnerCreated()`

**`listPartners`** (2 tests):
- Returns partners with encounter stats (mock count/min/max queries)
- Returns empty list for user with no partners

**`getPartner`** (3 tests):
- Returns partner detail with decrypted alias and notes
- Throws `ResourceNotFoundException` for non-existent ID
- Throws `IllegalStateException` for partner owned by different user

**`updatePartner`** (2 tests):
- Updates alias and notes (re-encrypts)
- Records metric `recordPartnerUpdated()`

**`deletePartner`** soft (2 tests):
- Sets `partnerId = null` on linked entries, deletes partner record
- Does NOT delete the entries themselves

**`deletePartner`** destructive (2 tests):
- Deletes partner AND all linked entries
- Records metric `recordPartnerDeleted()`

**`promoteAlias`** (3 tests):
- Creates partner from alias, backfills `partnerId` on matching entries (case-insensitive)
- Does not match entries that already have a `partnerId`
- Records metric `recordPartnerPromoted()`

**`listRecentAliases`** (2 tests):
- Returns distinct decrypted aliases from entries without `partnerId`, newest-first, limit 8
- Skips entries that have a `partnerId`

**Step 2: Run tests to verify they fail**

```bash
cd backend && ./mvnw test -pl . -Dtest=JournalPartnerServiceTest -Dsurefire.failIfNoTests=false
```

Expected: compilation errors (JournalPartnerService doesn't exist yet).

**Step 3: Commit**

```bash
git add backend/src/test/java/app/navilla/service/JournalPartnerServiceTest.java
git commit -m "test: add JournalPartnerService unit tests (red)"
```

---

### Task 6: Partner Service — Implementation (TDD Green)

**Files:**
- Create: `backend/src/main/java/app/navilla/service/JournalPartnerService.java`

**Step 1: Implement `JournalPartnerService`**

Follow the pattern of `EncounterJournalService.java`. Annotate with `@Slf4j @Service @RequiredArgsConstructor`.

Inject:
```java
private final JournalPartnerRepository partnerRepository;
private final EncounterJournalRepository journalRepository;
private final EncryptionService encryptionService;
private final JournalMetrics journalMetrics;
```

**Methods to implement:**

`listPartners(Jwt jwt)` → `List<PartnerResponse>`:
- Get userHash, fetch all partners for user
- For each partner: decrypt alias, query encounter count/first/last date from journalRepository
- `connectionDisplayName` = null for now (same as existing pattern)

`createPartner(Jwt jwt, CreatePartnerRequest request)` → `PartnerResponse`:
- Encrypt alias and optional notes
- Save via partnerRepository
- Log + record metric

`getPartner(Jwt jwt, UUID id)` → `PartnerDetailResponse`:
- Find partner by ID, verify ownership (same pattern as entry ownership check)
- Decrypt alias and notes
- Query encounter stats

`updatePartner(Jwt jwt, UUID id, UpdatePartnerRequest request)` → `PartnerResponse`:
- Find + verify ownership
- Update encrypted fields (only re-encrypt non-null fields)
- Handle `unlinkConnection` flag
- Save, log, record metric

`deletePartner(Jwt jwt, UUID id, boolean deleteEntries)`:
- Find + verify ownership
- If deleteEntries: delete all linked entries via `journalRepository.deleteAll(entries)`
- Else: set `partnerId = null` on all linked entries, save them
- Delete partner record
- Log + record metric

`listPartnerEntries(Jwt jwt, UUID partnerId)` → `List<JournalEntryResponse>`:
- Verify partner ownership
- Fetch entries by partnerId, use existing `toEntryResponse()` helper

`promoteAlias(Jwt jwt, PromoteAliasRequest request)` → `PartnerResponse`:
- Get userHash
- Fetch all entries without a partnerId for this user
- Decrypt each entry's `partnerAliasEncrypted`, compare case-insensitive trim to request alias
- Collect matching entry IDs
- Create new partner with encrypted alias
- Bulk update matching entries to set `partnerId`
- Save all, log, record metric

`listRecentAliases(Jwt jwt)` → `List<String>`:
- Fetch entries without a partnerId, newest-first
- Decrypt aliases, deduplicate (case-insensitive), limit 8
- Return distinct alias strings

**Private helper** `hashEmail(Jwt jwt)` — same pattern as EncounterJournalService.

**Step 2: Run tests to verify they pass**

```bash
cd backend && ./mvnw test -pl . -Dtest=JournalPartnerServiceTest
```

Expected: all tests pass.

**Step 3: Commit**

```bash
git add backend/src/main/java/app/navilla/service/JournalPartnerService.java
git commit -m "feat: implement JournalPartnerService — CRUD, promote, recent aliases"
```

---

### Task 7: Update EncounterJournalService for Partner Support

**Files:**
- Modify: `backend/src/main/java/app/navilla/service/EncounterJournalService.java`
- Modify: `backend/src/test/java/app/navilla/service/EncounterJournalServiceTest.java`

**Step 1: Update `createEntry` and `updateEntry`**

When `request.partnerId()` is non-null:
- Fetch the partner from `JournalPartnerRepository`
- Verify ownership
- Snapshot the partner's current alias: `entry.setPartnerAliasEncrypted(partner.getAliasEncrypted())`
- Set `entry.setPartnerId(request.partnerId())`
- If partner has a `connectionId`, set `entry.setConnectionId(partner.getConnectionId())`

When `request.partnerId()` is null:
- Keep existing behavior (use `request.partnerAlias()` directly)
- Set `entry.setPartnerId(null)`

**Step 2: Update `toResponse` method**

Add `partnerId` and `partnerEncounterCount` to the `JournalEntryResponse` constructor call:
```java
private JournalEntryResponse toResponse(EncounterJournal entry) {
    Long partnerCount = null;
    if (entry.getPartnerId() != null) {
        partnerCount = journalRepository.countByPartnerIdAndUserHash(
            entry.getPartnerId(), entry.getUserHash());
    }
    return new JournalEntryResponse(
        entry.getId(),
        entry.getEncounterDate(),
        // ... existing fields ...
        entry.getPartnerId(),
        partnerCount,
        entry.getCreatedAt(),
        entry.getUpdatedAt()
    );
}
```

**Step 3: Inject `JournalPartnerRepository`**

Add `private final JournalPartnerRepository partnerRepository;` to the service's dependencies.

**Step 4: Update existing tests**

Add `@Mock JournalPartnerRepository partnerRepository;` to `EncounterJournalServiceTest`. Update the `toResponse` assertions to include the new `partnerId` and `partnerEncounterCount` fields.

**Step 5: Run all tests**

```bash
cd backend && ./mvnw test
```

Expected: all tests pass.

**Step 6: Commit**

```bash
git add backend/src/main/java/app/navilla/service/EncounterJournalService.java backend/src/test/java/app/navilla/service/
git commit -m "feat: update EncounterJournalService to support partnerId on entries"
```

---

### Task 8: Partner Controller — Tests (TDD Red)

**Files:**
- Create: `backend/src/test/java/app/navilla/controller/JournalPartnerControllerTest.java`

**Step 1: Write integration tests**

Follow the pattern of `EncounterJournalControllerTest.java`. Use `@SpringBootTest @AutoConfigureMockMvc @ActiveProfiles("test")`.

Test all 8 endpoints:

1. `POST /api/journal/partners` — creates partner, returns 200 with alias
2. `GET /api/journal/partners` — returns list with encounter counts
3. `GET /api/journal/partners/{id}` — returns detail with notes
4. `PUT /api/journal/partners/{id}` — updates alias, returns updated
5. `DELETE /api/journal/partners/{id}` — soft delete, entries survive
6. `DELETE /api/journal/partners/{id}?deleteEntries=true` — destructive delete, entries gone
7. `POST /api/journal/partners/promote` — creates partner, backfills entries
8. `GET /api/journal/recent-aliases` — returns aliases without partnerId
9. `GET /api/journal/partners/{id}/entries` — returns entries for partner
10. All endpoints return 401 without JWT

**Step 2: Run tests to verify they fail**

```bash
cd backend && ./mvnw test -pl . -Dtest=JournalPartnerControllerTest -Dsurefire.failIfNoTests=false
```

**Step 3: Commit**

```bash
git add backend/src/test/java/app/navilla/controller/JournalPartnerControllerTest.java
git commit -m "test: add JournalPartnerController integration tests (red)"
```

---

### Task 9: Partner Controller — Implementation (TDD Green)

**Files:**
- Create: `backend/src/main/java/app/navilla/controller/JournalPartnerController.java`

**Step 1: Implement controller**

```java
@RestController
@RequestMapping("/api/journal/partners")
@RequiredArgsConstructor
public class JournalPartnerController {
    private final JournalPartnerService partnerService;

    @GetMapping
    public List<PartnerResponse> listPartners(
            @AuthenticationPrincipal Jwt jwt) { ... }

    @PostMapping
    public PartnerResponse createPartner(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody CreatePartnerRequest request) { ... }

    @PostMapping("/promote")
    public PartnerResponse promoteAlias(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody PromoteAliasRequest request) { ... }

    @GetMapping("/{id}")
    public PartnerDetailResponse getPartner(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID id) { ... }

    @PutMapping("/{id}")
    public PartnerResponse updatePartner(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID id,
            @Valid @RequestBody UpdatePartnerRequest request) { ... }

    @DeleteMapping("/{id}")
    public void deletePartner(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID id,
            @RequestParam(defaultValue = "false") boolean deleteEntries) { ... }

    @GetMapping("/{id}/entries")
    public List<JournalEntryResponse> listPartnerEntries(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID id) { ... }
}
```

**IMPORTANT:** The `@PostMapping("/promote")` must be declared BEFORE `@GetMapping("/{id}")` in the class. Spring maps `/promote` before trying to parse it as a UUID path variable.

Also add to `EncounterJournalController`:

```java
@GetMapping("/recent-aliases")
public List<String> listRecentAliases(@AuthenticationPrincipal Jwt jwt) {
    return partnerService.listRecentAliases(jwt);
}
```

**Step 2: Run all backend tests**

```bash
cd backend && ./mvnw test
```

Expected: all tests pass.

**Step 3: Commit**

```bash
git add backend/src/main/java/app/navilla/controller/
git commit -m "feat: implement JournalPartnerController — all 8 partner endpoints"
```

---

### Task 10: Frontend API Types and Methods

**Files:**
- Modify: `frontend/src/lib/api.ts`
- Modify: `frontend/src/hooks/useJournal.ts`

**Step 1: Add types to `api.ts`**

After existing journal types, add:

```typescript
export interface JournalPartner {
  id: string;
  alias: string;
  connectionId: string | null;
  connectionDisplayName: string | null;
  encounterCount: number;
  firstEncounterDate: string | null;
  mostRecentEncounterDate: string | null;
}

export interface JournalPartnerDetail extends JournalPartner {
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePartnerRequest {
  alias: string;
  connectionId?: string;
  notes?: string;
}

export interface UpdatePartnerRequest {
  alias?: string;
  connectionId?: string;
  notes?: string;
  unlinkConnection?: boolean;
}

export interface PromoteAliasRequest {
  alias: string;
}
```

Update `JournalEntry`:
```typescript
// Add to existing JournalEntry interface:
partnerId: string | null;
partnerEncounterCount: number | null;
```

Update `CreateJournalEntryRequest` and `UpdateJournalEntryRequest`:
```typescript
// Add to both:
partnerId?: string;
```

**Step 2: Add API methods**

Add to the `api.journal` object:

```typescript
partners: {
  list: (token: string) =>
    apiRequest<JournalPartner[]>('/api/journal/partners', token),
  create: (token: string, data: CreatePartnerRequest) =>
    apiRequest<JournalPartner>('/api/journal/partners', token, { method: 'POST', body: data }),
  get: (token: string, id: string) =>
    apiRequest<JournalPartnerDetail>(`/api/journal/partners/${id}`, token),
  update: (token: string, id: string, data: UpdatePartnerRequest) =>
    apiRequest<JournalPartner>(`/api/journal/partners/${id}`, token, { method: 'PUT', body: data }),
  delete: (token: string, id: string, deleteEntries = false) =>
    apiRequest<void>(`/api/journal/partners/${id}?deleteEntries=${deleteEntries}`, token, { method: 'DELETE' }),
  entries: (token: string, id: string) =>
    apiRequest<JournalEntry[]>(`/api/journal/partners/${id}/entries`, token),
  promote: (token: string, data: PromoteAliasRequest) =>
    apiRequest<JournalPartner>('/api/journal/partners/promote', token, { method: 'POST', body: data }),
},
recentAliases: (token: string) =>
  apiRequest<string[]>('/api/journal/recent-aliases', token),
```

**Step 3: Add React Query hooks to `useJournal.ts`**

```typescript
export function useJournalPartners() {
  const { session } = useAuth();
  return useQuery({
    queryKey: ['journal', 'partners'],
    queryFn: () => api.journal.partners.list(session!.access_token),
    enabled: !!session?.access_token,
    staleTime: 2 * 60 * 1000,
  });
}

export function useJournalPartner(id: string) {
  const { session } = useAuth();
  return useQuery({
    queryKey: ['journal', 'partner', id],
    queryFn: () => api.journal.partners.get(session!.access_token, id),
    enabled: !!session?.access_token && !!id,
    staleTime: 2 * 60 * 1000,
  });
}

export function useJournalPartnerEntries(partnerId: string) {
  const { session } = useAuth();
  return useQuery({
    queryKey: ['journal', 'partner', partnerId, 'entries'],
    queryFn: () => api.journal.partners.entries(session!.access_token, partnerId),
    enabled: !!session?.access_token && !!partnerId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useRecentAliases() {
  const { session } = useAuth();
  return useQuery({
    queryKey: ['journal', 'recent-aliases'],
    queryFn: () => api.journal.recentAliases(session!.access_token),
    enabled: !!session?.access_token,
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreatePartner() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePartnerRequest) =>
      api.journal.partners.create(session!.access_token, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal'] });
    },
  });
}

export function useUpdatePartner() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePartnerRequest }) =>
      api.journal.partners.update(session!.access_token, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal'] });
    },
  });
}

export function useDeletePartner() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, deleteEntries }: { id: string; deleteEntries: boolean }) =>
      api.journal.partners.delete(session!.access_token, id, deleteEntries),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal'] });
    },
  });
}

export function usePromoteAlias() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: PromoteAliasRequest) =>
      api.journal.partners.promote(session!.access_token, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal'] });
    },
  });
}
```

**Step 4: Commit**

```bash
git add frontend/src/lib/api.ts frontend/src/hooks/useJournal.ts
git commit -m "feat: add partner API types, methods, and React Query hooks"
```

---

### Task 11: i18n Keys

**Files:**
- Modify: `frontend/src/locales/en_US.json`
- Modify: `frontend/src/locales/es_MX.json`

**Step 1: Add English keys**

Add to the `journal` section of `en_US.json`:

```json
"partnersTab": "Partners",
"recentPartners": "Recent",
"noPartners": "Partners you see regularly will appear here",
"noPartnersDescription": "When you save a recurring partner, they'll show up here with their encounter history.",
"saveAsPartner": "Save as partner",
"promotePrompt": "You've logged {{count}} encounters with {{alias}}. Save as a partner?",
"promoteYes": "Save partner",
"promoteNotNow": "Not now",
"partnerNotes": "Notes",
"partnerNotesPlaceholder": "Notes about this person...",
"partnerFirstEncounter": "First",
"partnerLastEncounter": "Last",
"partnerEncounterCount_one": "{{count}} encounter",
"partnerEncounterCount_other": "{{count}} encounters",
"viewAllEncounters": "View all",
"encountersWith": "{{count}} encounters \u00b7 View all",
"editPartner": "Edit partner",
"deletePartner": "Delete partner",
"deletePartnerTitle": "Delete partner",
"deletePartnerSoftLabel": "Remove partner profile only",
"deletePartnerSoftDescription": "Entries will keep their alias but won't be linked to a partner anymore.",
"deletePartnerDestructiveLabel": "Delete partner and all entries",
"deletePartnerDestructiveWarning": "This will permanently delete {{alias}} and {{count}} encounter entries. This cannot be undone.",
"deletePartnerTypeConfirm": "Type DELETE to confirm",
"deletePartnerConfirmWord": "DELETE",
"partnerDeleted": "Partner deleted",
"partnerSaved": "Partner saved",
"partnerUpdated": "Partner updated"
```

**Step 2: Add Spanish keys**

Add to the `journal` section of `es_MX.json`:

```json
"partnersTab": "Parejas",
"recentPartners": "Recientes",
"noPartners": "Las parejas que veas regularmente aparecerán aquí",
"noPartnersDescription": "Cuando guardes una pareja recurrente, aparecerá aquí con su historial de encuentros.",
"saveAsPartner": "Guardar como pareja",
"promotePrompt": "Has registrado {{count}} encuentros con {{alias}}. ¿Guardar como pareja?",
"promoteYes": "Guardar pareja",
"promoteNotNow": "Ahora no",
"partnerNotes": "Notas",
"partnerNotesPlaceholder": "Notas sobre esta persona...",
"partnerFirstEncounter": "Primero",
"partnerLastEncounter": "Último",
"partnerEncounterCount_one": "{{count}} encuentro",
"partnerEncounterCount_other": "{{count}} encuentros",
"viewAllEncounters": "Ver todos",
"encountersWith": "{{count}} encuentros \u00b7 Ver todos",
"editPartner": "Editar pareja",
"deletePartner": "Eliminar pareja",
"deletePartnerTitle": "Eliminar pareja",
"deletePartnerSoftLabel": "Solo eliminar perfil de pareja",
"deletePartnerSoftDescription": "Las entradas conservarán su alias pero ya no estarán vinculadas a una pareja.",
"deletePartnerDestructiveLabel": "Eliminar pareja y todas las entradas",
"deletePartnerDestructiveWarning": "Esto eliminará permanentemente a {{alias}} y {{count}} entradas de encuentros. Esta acción no se puede deshacer.",
"deletePartnerTypeConfirm": "Escribe DELETE para confirmar",
"deletePartnerConfirmWord": "DELETE",
"partnerDeleted": "Pareja eliminada",
"partnerSaved": "Pareja guardada",
"partnerUpdated": "Pareja actualizada"
```

**Step 3: Commit**

```bash
git add frontend/src/locales/
git commit -m "feat: add journal partner i18n keys (en_US + es_MX)"
```

---

### Task 12: Partners Tab Components

**Files:**
- Create: `frontend/src/components/journal/JournalPartnerCard.tsx`
- Create: `frontend/src/components/journal/JournalPartnersTab.tsx`
- Modify: `frontend/src/pages/JournalPage.tsx`

**Step 1: Create `JournalPartnerCard`**

A card component for the Partners tab list. Shows: alias, encounter count, most recent encounter date, linked connection badge. Tapping navigates to `/journal/partner/:id`.

Follow the design patterns of `JournalEntryCard.tsx`:
- Use `useTranslation` and locale-aware date formatting
- Use `useNavigate` for click-through to partner detail page
- Show encounter count as "5 encounters"
- Show most recent date as "Last: Feb 27"
- If `connectionDisplayName` exists, show a small badge

**Step 2: Create `JournalPartnersTab`**

Lists all saved partners using `useJournalPartners()`. If empty, show warm empty state (follow `JournalEmptyState.tsx` pattern) with Users icon and "Partners you see regularly will appear here" message. If data exists, render `JournalPartnerCard` for each.

**Step 3: Add Partners tab to `JournalPage`**

- Change `ViewMode` type to `'timeline' | 'calendar' | 'partners'`
- Add third toggle button with `Users` icon from lucide-react
- Render `<JournalPartnersTab />` when `viewMode === 'partners'`
- When switching to partners, clear `selectedDate`

**Step 4: Commit**

```bash
git add frontend/src/components/journal/JournalPartnerCard.tsx frontend/src/components/journal/JournalPartnersTab.tsx frontend/src/pages/JournalPage.tsx
git commit -m "feat: add Partners tab to journal page with partner card list"
```

---

### Task 13: Partner Detail Page

**Files:**
- Create: `frontend/src/pages/PartnerDetailPage.tsx`
- Modify: `frontend/src/router.tsx`

**Step 1: Create `PartnerDetailPage`**

Route: `/journal/partner/:id`

Uses `useJournalPartner(id)` and `useJournalPartnerEntries(id)`.

**Layout:**
- Back link to `/journal` (with ChevronLeft icon)
- Partner alias as h1 heading
- Linked connection badge (if present)
- Stats row: first encounter date | most recent date | encounter count — in a card-like container
- **Partner notes section:** textarea with save button. Uses `useUpdatePartner` mutation. Editable inline — shows the current notes, user can edit and save. If empty, show placeholder.
- **Encounter timeline:** reuse `JournalTimeline` component with the partner's entries
- **Actions:** Edit (rename alias, link/unlink connection) and Delete buttons

**Delete partner modal:**
Two-choice modal. First choice: "Remove partner only" (soft). Second choice: "Delete partner and all entries" (destructive). The destructive option shows a red warning with the count and requires typing "DELETE" (same pattern as account deletion in Settings). Use `useDeletePartner` mutation.

**Step 2: Add route to `router.tsx`**

Add after the existing `journal` route:
```typescript
{
  path: 'journal/partner/:id',
  element: (
    <ProtectedRoute>
      <PartnerDetailPage />
    </ProtectedRoute>
  ),
},
```

Import `PartnerDetailPage` with a lazy import.

**Step 3: Commit**

```bash
git add frontend/src/pages/PartnerDetailPage.tsx frontend/src/router.tsx
git commit -m "feat: add partner detail page with notes, stats, timeline, and delete modal"
```

---

### Task 14: Entry Card — Partner Link

**Files:**
- Modify: `frontend/src/components/journal/JournalEntryCard.tsx`

**Step 1: Add partner encounter link to card**

When `entry.partnerId` is set and `entry.partnerEncounterCount > 1`:
- Below the alias line, show a clickable link: "5 encounters · View all"
- Uses `useNavigate()` to go to `/journal/partner/${entry.partnerId}`
- Style: small text, primary color, with hover underline

When `entry.partnerId` is set (regardless of count):
- Show a subtle `Bookmark` icon (from lucide-react, 12px) next to the alias to indicate this is a saved partner

**Step 2: Commit**

```bash
git add frontend/src/components/journal/JournalEntryCard.tsx
git commit -m "feat: show partner encounter count and link on entry cards"
```

---

### Task 15: Entry Modal — Partner Picker and Autocomplete

**Files:**
- Modify: `frontend/src/components/journal/JournalEntryModal.tsx`

**Step 1: Add partner picker to the modal**

Replace the plain alias `<input>` with a partner picker section:

**Recent partners chips:**
- Fetch saved partners via `useJournalPartners()` and recent aliases via `useRecentAliases()`
- Show the top 8 as small chips/buttons in a horizontal scrollable row
- Saved partners show a subtle bookmark icon
- Tapping a chip sets `formPartnerId` + `formAlias` + hides connection dropdown

**Autocomplete input:**
- As the user types in the alias field, filter the combined list (saved partners + recent aliases) and show matching suggestions in a dropdown below the input
- Matching is case-insensitive
- Selecting a suggestion from the dropdown behaves like tapping a chip
- Pressing Enter or clicking away closes the dropdown and uses the typed text as-is

**Connection dropdown behavior:**
- When a saved partner is selected (`formPartnerId` is set): hide the connection dropdown entirely (connection lives on the partner)
- When no saved partner is selected: show the connection dropdown as before

**Clear button:**
- When a partner is selected, show an X button next to the alias to deselect and return to freeform input mode

**Step 2: Add 3rd-encounter promotion prompt**

After a successful save (in `handleSubmit` `onSuccess`):
- If the entry was saved WITHOUT a `partnerId`
- Count how many existing entries share the same alias (can check from the entries list or query recent aliases)
- If count >= 3: show a toast/banner at the top of the page: "You've logged 3 encounters with Alex. Save as a partner?"
- "Save partner" button calls `usePromoteAlias().mutateAsync({ alias })`
- "Not now" dismisses (store dismissed alias in session state to avoid re-prompting)

Implementation: pass an `onPromote` callback from `JournalPage` to the modal. The modal calls it with the alias and count after save. `JournalPage` shows a toast/banner component.

**Step 3: Commit**

```bash
git add frontend/src/components/journal/JournalEntryModal.tsx frontend/src/pages/JournalPage.tsx
git commit -m "feat: add partner picker, autocomplete, and 3rd-encounter promotion prompt"
```

---

### Task 16: Frontend Tests

**Files:**
- Modify: `frontend/src/pages/JournalPage.test.tsx`
- Modify: `frontend/src/components/journal/JournalEntryCard.test.tsx`
- Create: `frontend/src/components/journal/JournalPartnerCard.test.tsx`
- Create: `frontend/src/components/journal/JournalPartnersTab.test.tsx`
- Create: `frontend/src/pages/PartnerDetailPage.test.tsx`

**Step 1: Add tests for new components**

`JournalPartnerCard.test.tsx` (4 tests):
- Renders alias and encounter count
- Renders most recent date in locale-aware format
- Shows connection badge when linked
- Navigates to partner detail on click

`JournalPartnersTab.test.tsx` (3 tests):
- Shows empty state when no partners
- Renders partner cards when data exists
- Sorts by most recent encounter

`PartnerDetailPage.test.tsx` (5 tests):
- Shows partner alias as heading
- Shows encounter stats
- Renders partner notes textarea
- Shows encounter timeline
- Shows delete modal on delete button click

**Step 2: Update existing tests**

`JournalEntryCard.test.tsx`:
- Add test: shows encounter count link when `partnerId` and `partnerEncounterCount > 1`
- Add test: shows bookmark icon when `partnerId` is set
- Add test: does not show encounter link when `partnerId` is null

`JournalPage.test.tsx`:
- Add test: renders Partners tab button
- Add test: switches to partners view on tab click

**Step 3: Run all frontend tests**

```bash
cd frontend && npx vitest run
```

Expected: all tests pass.

**Step 4: Commit**

```bash
git add frontend/src/pages/ frontend/src/components/journal/
git commit -m "test: add frontend tests for partner components and updated cards"
```

---

### Task 17: Postman Collection + Documentation

**Files:**
- Modify: `docs/static/postman/navilla-api.postman_collection.json`
- Modify: `CONTEXT.md`

**Step 1: Add partner endpoints to Postman collection**

Add a "Journal Partners" subfolder inside the existing Journal folder with requests for all 8 new endpoints:
1. List Partners — `GET /api/journal/partners`
2. Create Partner — `POST /api/journal/partners`
3. Get Partner — `GET /api/journal/partners/:id`
4. Update Partner — `PUT /api/journal/partners/:id`
5. Delete Partner (soft) — `DELETE /api/journal/partners/:id`
6. Delete Partner (destructive) — `DELETE /api/journal/partners/:id?deleteEntries=true`
7. Promote Alias — `POST /api/journal/partners/promote`
8. Recent Aliases — `GET /api/journal/recent-aliases`
9. Partner Entries — `GET /api/journal/partners/:id/entries`

**Step 2: Update `CONTEXT.md`**

Add session notes for the Journal Partners feature. Update the progress tracker. Note the new migration 009 that needs to be run.

**Step 3: Commit**

```bash
git add docs/static/postman/ CONTEXT.md
git commit -m "docs: add partner endpoints to Postman collection, update CONTEXT.md"
```

---

### Task 18: Full Verification

**Step 1: Run all backend tests**

```bash
cd backend && ./mvnw test
```

Expected: all tests pass (existing + new partner tests).

**Step 2: Run all frontend tests**

```bash
cd frontend && npx vitest run
```

Expected: all tests pass.

**Step 3: Run frontend lint**

```bash
cd frontend && npm run lint
```

Expected: no errors.

**Step 4: Run frontend build**

```bash
cd frontend && npm run build
```

Expected: clean build, no errors.

**Step 5: Final commit (if any fixes needed)**

```bash
git add -A && git commit -m "fix: address issues found in full verification"
```
