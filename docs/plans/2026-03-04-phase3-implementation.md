# Phase 3 Implementation Plan — Connections, Verified Badges, Network Constellation

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign Layer 2 with phone-based connections, verified test badges, network constellation visualization, and soft reciprocity model.

**Architecture:** Multi-week implementation building on existing Spring Boot backend + React frontend. Foundation layer (configurability, condition catalog) first, then connection redesign, verified badges, and constellation visualization. All conditions/thresholds DB-driven, no hardcoded values.

**Tech Stack:** Java 25, Spring Boot 4.0.2, PostgreSQL (Supabase), React 19, TypeScript, TailwindCSS, Canvas/WebGL (tsParticles or Three.js), React Query

**Design Doc:** `docs/plans/2026-03-04-phase3-redesign-design.md`

---

## Week Overview

| Week | Focus | Migration |
|------|-------|-----------|
| 10 | Foundation (configurability) + Connection Redesign + Reciprocity | 014 |
| 11 | Verified Test Badges + Card Builder | 015 |
| 12 | Network Constellation Visualization | — (frontend only) |
| 13 | Cold Start + Exposure Recency + Polish | — |

---

## Week 10: Foundation + Connection Redesign + Reciprocity

### Task 1: Database Migration 014 — Foundation + Connection Tables

**Files:**
- Create: `database/migrations/014_phase3_connections_config.sql`

**Step 1: Write migration file**

```sql
-- Migration 014: Phase 3 — Configurability foundation, connection redesign, reciprocity
-- Rollback:
--   DROP TABLE IF EXISTS phone_reports;
--   DROP TABLE IF EXISTS phone_blocks;
--   DROP TABLE IF EXISTS connection_phone_entries;
--   DROP TABLE IF EXISTS app_config;
--   DROP TABLE IF EXISTS network_stages;
--   DROP TABLE IF EXISTS condition_catalog;
--   ALTER TABLE connections DROP COLUMN IF EXISTS connection_type;
--   ALTER TABLE encounter_journal DROP COLUMN IF EXISTS phone_hash;
--   ALTER TABLE users DROP COLUMN IF EXISTS receive_match_notifications;
--   ALTER TABLE users DROP COLUMN IF EXISTS exposure_opted_in;
--   ALTER TABLE users DROP COLUMN IF EXISTS exposure_opted_in_at;
--   ALTER TABLE users DROP COLUMN IF EXISTS exposure_opted_out_at;

BEGIN;

-- ============================================================
-- 1. CONDITION CATALOG — Replaces hardcoded ConditionType enum
-- ============================================================
CREATE TABLE IF NOT EXISTS condition_catalog (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    display_name_es VARCHAR(100),
    description TEXT,
    description_es TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    icon VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE condition_catalog IS 'Database-driven catalog of STI conditions, replaces hardcoded ConditionType enum';

-- Seed with existing conditions (preserving current enum values as codes)
INSERT INTO condition_catalog (code, display_name, display_name_es, display_order, active) VALUES
    ('CHLAMYDIA', 'Chlamydia', 'Clamidia', 1, true),
    ('GONORRHEA', 'Gonorrhea', 'Gonorrea', 2, true),
    ('SYPHILIS', 'Syphilis', 'Sífilis', 3, true),
    ('HIV', 'HIV', 'VIH', 4, true),
    ('HSV1', 'HSV-1 (Oral Herpes)', 'VHS-1 (Herpes Oral)', 5, true),
    ('HSV2', 'HSV-2 (Genital Herpes)', 'VHS-2 (Herpes Genital)', 6, true),
    ('HPV', 'HPV', 'VPH', 7, true),
    ('HEPATITIS_B', 'Hepatitis B', 'Hepatitis B', 8, true),
    ('HEPATITIS_C', 'Hepatitis C', 'Hepatitis C', 9, true),
    ('TRICHOMONIASIS', 'Trichomoniasis', 'Tricomoniasis', 10, true)
ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- 2. NETWORK STAGES — Configurable constellation stage thresholds
-- ============================================================
CREATE TABLE IF NOT EXISTS network_stages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    display_name_es VARCHAR(100),
    min_nodes INTEGER NOT NULL,
    max_nodes INTEGER,
    description TEXT,
    description_es TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE network_stages IS 'Configurable thresholds for network constellation stage badges';

INSERT INTO network_stages (code, display_name, display_name_es, min_nodes, max_nodes, display_order) VALUES
    ('EMPTY_SKY', 'Empty Sky', 'Cielo Vacío', 0, 0, 1),
    ('SPARK', 'Spark', 'Chispa', 1, 50, 2),
    ('CLUSTER', 'Cluster', 'Cúmulo', 51, 500, 3),
    ('CONSTELLATION', 'Constellation', 'Constelación', 501, 2000, 4),
    ('GALAXY', 'Galaxy', 'Galaxia', 2001, 10000, 5),
    ('SUPERCLUSTER', 'Supercluster', 'Supercúmulo', 10001, NULL, 6)
ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- 3. APP CONFIG — Runtime key-value configuration
-- ============================================================
CREATE TABLE IF NOT EXISTS app_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_key VARCHAR(100) NOT NULL UNIQUE,
    config_value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE app_config IS 'Runtime-configurable key-value settings, no redeploy needed';

INSERT INTO app_config (config_key, config_value, description) VALUES
    ('phone_match.window_days', '2', 'Days tolerance for phone auto-match (±N days)'),
    ('phone_match.max_attempts_per_week', '5', 'Max outbound phone-match attempts per user per week'),
    ('phone_match.denial_cooldown_threshold', '3', 'Number of denials before throttling sender'),
    ('reciprocity.cooldown_days', '15', 'Days before user can re-opt-in after opting out'),
    ('exposure.min_connections', '3', 'Minimum confirmed connections to see exposure data'),
    ('exposure.max_depth', '3', 'Maximum BFS depth for exposure calculation'),
    ('exposure.snapshot_ttl_days', '7', 'Days before exposure snapshot expires'),
    ('verification.qr_token_lifetime_minutes', '5', 'QR code token lifetime in minutes'),
    ('verification.default_expiry_days', '30', 'Default verification card expiry'),
    ('verification.max_view_limit', '5', 'Maximum view limit option for private cards')
ON CONFLICT (config_key) DO NOTHING;

-- ============================================================
-- 4. CONNECTION PHONE MATCHING
-- ============================================================
CREATE TABLE IF NOT EXISTS connection_phone_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_hash VARCHAR(64) NOT NULL,
    phone_hash VARCHAR(64) NOT NULL,
    encounter_date DATE NOT NULL,
    journal_entry_id UUID REFERENCES encounter_journal(id) ON DELETE CASCADE,
    matched BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_phone_entries_phone_hash ON connection_phone_entries(phone_hash);
CREATE INDEX idx_phone_entries_user_hash ON connection_phone_entries(user_hash);
CREATE INDEX idx_phone_entries_unmatched ON connection_phone_entries(phone_hash, matched) WHERE matched = FALSE;

COMMENT ON TABLE connection_phone_entries IS 'Phone hashes from journal entries for auto-matching connections';

-- ============================================================
-- 5. PHONE BLOCKS & REPORTS
-- ============================================================
CREATE TABLE IF NOT EXISTS phone_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_hash VARCHAR(64) NOT NULL,
    blocked_phone_hash VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_hash, blocked_phone_hash)
);

COMMENT ON TABLE phone_blocks IS 'Blocked phone hashes per user for abuse prevention';

CREATE TABLE IF NOT EXISTS phone_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_hash VARCHAR(64) NOT NULL,
    reported_phone_hash VARCHAR(64) NOT NULL,
    reason VARCHAR(200),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_phone_reports_phone ON phone_reports(reported_phone_hash);

COMMENT ON TABLE phone_reports IS 'Abuse reports for phone-match senders';

-- ============================================================
-- 6. ALTER EXISTING TABLES
-- ============================================================

-- Connections: track how the connection was formed
ALTER TABLE connections ADD COLUMN IF NOT EXISTS connection_type VARCHAR(30) DEFAULT 'EXPLICIT';

COMMENT ON COLUMN connections.connection_type IS 'How connection was formed: PHONE_MATCH, NOTIFICATION_MATCH, EXPLICIT, LINK';

-- Encounter journal: optional phone hash for matching
ALTER TABLE encounter_journal ADD COLUMN IF NOT EXISTS phone_hash VARCHAR(64);

CREATE INDEX idx_journal_phone_hash ON encounter_journal(phone_hash) WHERE phone_hash IS NOT NULL;

-- Users: match notification preference + reciprocity
ALTER TABLE users ADD COLUMN IF NOT EXISTS receive_match_notifications BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS exposure_opted_in BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS exposure_opted_in_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS exposure_opted_out_at TIMESTAMPTZ;

COMMIT;
```

**Step 2: Run migration via Supabase SQL Editor**

Paste the SQL and execute. Verify all tables created, all inserts succeeded, all ALTER TABLE completed.

**Step 3: Commit**

```bash
git add database/migrations/014_phase3_connections_config.sql
git commit -m "feat: add migration 014 — phase 3 foundation tables and connection redesign"
git push
```

---

### Task 2: Condition Catalog — Entity, Repository, Service

**Files:**
- Create: `backend/src/main/java/app/navilla/entity/ConditionCatalogEntry.java`
- Create: `backend/src/main/java/app/navilla/repository/ConditionCatalogRepository.java`
- Create: `backend/src/main/java/app/navilla/service/ConditionCatalogService.java`
- Create: `backend/src/test/java/app/navilla/service/ConditionCatalogServiceTest.java`

**Step 1: Write the failing test**

Test that the service can list active conditions, find by code, and validate condition codes.

```java
@ExtendWith(MockitoExtension.class)
class ConditionCatalogServiceTest {

  @Mock private ConditionCatalogRepository repository;
  @InjectMocks private ConditionCatalogService service;

  @Test
  void listActiveConditions_returnsOnlyActive() {
    // Given: 2 active, 1 inactive condition
    // When: listActive()
    // Then: returns 2 conditions sorted by displayOrder
  }

  @Test
  void findByCode_existingCode_returnsEntry() {
    // Given: CHLAMYDIA exists
    // When: findByCode("CHLAMYDIA")
    // Then: returns the entry
  }

  @Test
  void findByCode_unknownCode_throwsNotFound() {
    // Given: UNKNOWN does not exist
    // When: findByCode("UNKNOWN")
    // Then: throws ResourceNotFoundException
  }

  @Test
  void isValidCode_activeCode_returnsTrue() { ... }
  @Test
  void isValidCode_inactiveCode_returnsFalse() { ... }
}
```

**Step 2: Run test to verify it fails**

Run: `cd backend && ./mvnw test -pl . -Dtest=ConditionCatalogServiceTest -Dsurefire.failIfNoTests=false`
Expected: FAIL — class not found

**Step 3: Write entity**

```java
@Entity
@Table(name = "condition_catalog")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConditionCatalogEntry {
  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @Column(nullable = false, unique = true, length = 50)
  private String code;

  @Column(name = "display_name", nullable = false, length = 100)
  private String displayName;

  @Column(name = "display_name_es", length = 100)
  private String displayNameEs;

  @Column(columnDefinition = "TEXT")
  private String description;

  @Column(name = "description_es", columnDefinition = "TEXT")
  private String descriptionEs;

  @Column(name = "display_order", nullable = false)
  @Builder.Default
  private Integer displayOrder = 0;

  @Column(nullable = false)
  @Builder.Default
  private Boolean active = true;

  @Column(length = 50)
  private String icon;

  @CreationTimestamp
  @Column(name = "created_at", nullable = false, updatable = false)
  private OffsetDateTime createdAt;

  @UpdateTimestamp
  @Column(name = "updated_at", nullable = false)
  private OffsetDateTime updatedAt;
}
```

**Step 4: Write repository**

```java
@Repository
public interface ConditionCatalogRepository extends JpaRepository<ConditionCatalogEntry, UUID> {
  List<ConditionCatalogEntry> findByActiveTrueOrderByDisplayOrder();
  Optional<ConditionCatalogEntry> findByCode(String code);
  boolean existsByCodeAndActiveTrue(String code);
}
```

**Step 5: Write service**

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class ConditionCatalogService {
  private final ConditionCatalogRepository repository;

  @Cacheable(value = "catalog", key = "'conditions-active'")
  public List<ConditionCatalogEntry> listActive() {
    return repository.findByActiveTrueOrderByDisplayOrder();
  }

  public ConditionCatalogEntry findByCode(String code) {
    return repository.findByCode(code.toUpperCase())
        .orElseThrow(() -> new ResourceNotFoundException("condition.notFound"));
  }

  public boolean isValidCode(String code) {
    return repository.existsByCodeAndActiveTrue(code.toUpperCase());
  }

  @CacheEvict(value = "catalog", allEntries = true)
  public ConditionCatalogEntry create(ConditionCatalogEntry entry) {
    return repository.save(entry);
  }
}
```

**Step 6: Run tests to verify they pass**

Run: `cd backend && ./mvnw test -pl . -Dtest=ConditionCatalogServiceTest`
Expected: ALL PASS

**Step 7: Commit**

```bash
git add backend/src/main/java/app/navilla/entity/ConditionCatalogEntry.java \
  backend/src/main/java/app/navilla/repository/ConditionCatalogRepository.java \
  backend/src/main/java/app/navilla/service/ConditionCatalogService.java \
  backend/src/test/java/app/navilla/service/ConditionCatalogServiceTest.java
git commit -m "feat: add condition catalog entity, repository, and service with tests"
git push
```

---

### Task 3: App Config Service — Runtime Configuration

**Files:**
- Create: `backend/src/main/java/app/navilla/entity/AppConfig.java`
- Create: `backend/src/main/java/app/navilla/repository/AppConfigRepository.java`
- Create: `backend/src/main/java/app/navilla/service/AppConfigService.java`
- Create: `backend/src/test/java/app/navilla/service/AppConfigServiceTest.java`

**Step 1: Write failing tests**

Test: getString, getInt, getBoolean, fallback to default when key missing.

**Step 2: Write entity + repository + service**

Key methods on AppConfigService:
```java
public String getString(String key, String defaultValue)
public int getInt(String key, int defaultValue)
public boolean getBoolean(String key, boolean defaultValue)
public void set(String key, String value)  // for admin use
```

Cache the full config map with `@Cacheable("appConfig")`. Evict on set.

**Step 3: Run tests, verify pass**

**Step 4: Commit**

---

### Task 4: Network Stages Service

**Files:**
- Create: `backend/src/main/java/app/navilla/entity/NetworkStage.java`
- Create: `backend/src/main/java/app/navilla/repository/NetworkStageRepository.java`
- Create: `backend/src/main/java/app/navilla/service/NetworkStageService.java`
- Create: `backend/src/test/java/app/navilla/service/NetworkStageServiceTest.java`

**Step 1: Write failing tests**

Test: `getStageForNodeCount(0)` → EMPTY_SKY, `getStageForNodeCount(100)` → CLUSTER, `getStageForNodeCount(15000)` → SUPERCLUSTER

**Step 2: Write entity + repository + service**

Key method:
```java
@Cacheable(value = "catalog", key = "'network-stages'")
public NetworkStage getStageForNodeCount(int totalNodes) {
  return repository.findAll().stream()
      .filter(s -> totalNodes >= s.getMinNodes()
          && (s.getMaxNodes() == null || totalNodes <= s.getMaxNodes()))
      .findFirst()
      .orElse(defaultStage());
}
```

**Step 3: Run tests, verify pass**

**Step 4: Commit**

---

### Task 5: Replace ConditionType Enum References

**Files to modify (search for all usages):**
- Modify: `backend/src/main/java/app/navilla/entity/TestResult.java` — change `ConditionType conditionType` to `String conditionType`
- Modify: `backend/src/main/java/app/navilla/entity/HealthStatus.java` — same
- Modify: `backend/src/main/java/app/navilla/service/HealthLogService.java` — validate against catalog instead of enum
- Modify: `backend/src/main/java/app/navilla/service/ExposureService.java` — use String instead of enum
- Modify: `backend/src/main/java/app/navilla/repository/TestResultRepository.java` — update @Query params
- Modify: `backend/src/main/java/app/navilla/repository/HealthStatusRepository.java` — update queries
- Deprecate: `backend/src/main/java/app/navilla/entity/ConditionType.java` — keep for backward compat during migration, mark @Deprecated

**Strategy:**
1. Change entity fields from `ConditionType` enum to `String`
2. Add validation in services: `conditionCatalogService.isValidCode(code)` before save
3. Update all JPQL queries that reference the enum
4. Keep `ConditionType.java` with `@Deprecated` annotation temporarily — existing data in DB uses these exact strings
5. Update all existing tests

**Step 1: Update entities (TestResult, HealthStatus)**

Change `@Enumerated(EnumType.STRING) private ConditionType conditionType` to `@Column(name = "condition_type", length = 50) private String conditionType`

**Step 2: Update repositories**

Change query parameter types from `ConditionType` to `String`

**Step 3: Update services**

In HealthLogService, before saving a test result:
```java
if (result.conditionType() != null) {
  if (!conditionCatalogService.isValidCode(result.conditionType())) {
    throw new ValidationException("condition.invalid");
  }
}
```

**Step 4: Run ALL existing tests**

Run: `cd backend && ./mvnw test`
Expected: All tests pass (fix any that reference ConditionType enum directly)

**Step 5: Commit**

```bash
git commit -m "refactor: replace ConditionType enum with DB-driven condition catalog"
git push
```

---

### Task 6: Catalog API Endpoint (Public)

**Files:**
- Modify: `backend/src/main/java/app/navilla/controller/CatalogController.java`
- Create: `backend/src/main/java/app/navilla/dto/ConditionCatalogResponse.java`
- Create: `backend/src/main/java/app/navilla/dto/NetworkStageResponse.java`
- Create: `backend/src/test/java/app/navilla/controller/CatalogControllerTest.java`

**Step 1: Write integration tests**

Test: GET /api/catalog/conditions returns list of active conditions
Test: GET /api/catalog/stages returns list of network stages
Both should be public (no auth required).

**Step 2: Write DTOs**

```java
public record ConditionCatalogResponse(
    String code,
    String displayName,
    String displayNameEs,
    String description,
    String descriptionEs,
    String icon,
    int displayOrder
) {}

public record NetworkStageResponse(
    String code,
    String displayName,
    String displayNameEs,
    int minNodes,
    Integer maxNodes,
    String description,
    String descriptionEs
) {}
```

**Step 3: Add endpoints to CatalogController**

```java
@GetMapping("/conditions")
public ResponseEntity<List<ConditionCatalogResponse>> listConditions() { ... }

@GetMapping("/stages")
public ResponseEntity<List<NetworkStageResponse>> listStages() { ... }
```

**Step 4: Run tests, verify pass**

**Step 5: Commit**

---

### Task 7: User Entity — Add Reciprocity + Match Notification Fields

**Files:**
- Modify: `backend/src/main/java/app/navilla/entity/User.java`
- Modify: existing user-related tests if needed

**Step 1: Add fields to User entity**

```java
@Column(name = "receive_match_notifications", nullable = false)
@Builder.Default
private Boolean receiveMatchNotifications = false;

@Column(name = "exposure_opted_in", nullable = false)
@Builder.Default
private Boolean exposureOptedIn = false;

@Column(name = "exposure_opted_in_at")
private OffsetDateTime exposureOptedInAt;

@Column(name = "exposure_opted_out_at")
private OffsetDateTime exposureOptedOutAt;
```

**Step 2: Run all existing tests to verify nothing breaks**

Run: `cd backend && ./mvnw test`

**Step 3: Commit**

---

### Task 8: Reciprocity Opt-In/Out — Service + Controller

**Files:**
- Create: `backend/src/main/java/app/navilla/service/ReciprocityService.java`
- Create: `backend/src/main/java/app/navilla/controller/ReciprocityController.java`
- Create: `backend/src/main/java/app/navilla/dto/ReciprocityStatusResponse.java`
- Create: `backend/src/test/java/app/navilla/service/ReciprocityServiceTest.java`
- Create: `backend/src/test/java/app/navilla/controller/ReciprocityControllerTest.java`

**Step 1: Write failing tests for ReciprocityService**

Tests:
- `optIn_userNotOptedIn_setsOptedIn` — happy path
- `optIn_userAlreadyOptedIn_throwsConflict` — already opted in
- `optIn_userInCooldown_throwsForbidden` — opted out less than 15 days ago
- `optOut_userOptedIn_setsOptedOut` — happy path
- `optOut_userNotOptedIn_throwsConflict` — can't opt out if not in
- `getStatus_returnsCurrentState` — returns opted_in, opted_in_at, cooldown_remaining

**Step 2: Write ReciprocityService**

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class ReciprocityService {
  private final UserRepository userRepository;
  private final AppConfigService appConfigService;

  @Transactional
  public ReciprocityStatusResponse optIn(Jwt jwt) {
    User user = findUser(jwt);
    if (user.getExposureOptedIn()) {
      throw new ConflictException("reciprocity.alreadyOptedIn");
    }
    int cooldownDays = appConfigService.getInt("reciprocity.cooldown_days", 15);
    if (user.getExposureOptedOutAt() != null
        && user.getExposureOptedOutAt().plusDays(cooldownDays).isAfter(OffsetDateTime.now())) {
      throw new ForbiddenException("reciprocity.cooldownActive");
    }
    user.setExposureOptedIn(true);
    user.setExposureOptedInAt(OffsetDateTime.now());
    userRepository.save(user);
    return buildStatusResponse(user);
  }

  @Transactional
  public ReciprocityStatusResponse optOut(Jwt jwt) {
    User user = findUser(jwt);
    if (!user.getExposureOptedIn()) {
      throw new ConflictException("reciprocity.notOptedIn");
    }
    user.setExposureOptedIn(false);
    user.setExposureOptedOutAt(OffsetDateTime.now());
    userRepository.save(user);
    // TODO: evict exposure snapshot cache
    return buildStatusResponse(user);
  }

  public ReciprocityStatusResponse getStatus(Jwt jwt) {
    return buildStatusResponse(findUser(jwt));
  }
}
```

**Step 3: Write ReciprocityController**

```java
@RestController
@RequestMapping("/api/reciprocity")
@RequiredArgsConstructor
public class ReciprocityController {
  private final ReciprocityService reciprocityService;

  @GetMapping("/status")
  public ResponseEntity<ReciprocityStatusResponse> getStatus(@AuthenticationPrincipal Jwt jwt) { ... }

  @PostMapping("/opt-in")
  public ResponseEntity<ReciprocityStatusResponse> optIn(@AuthenticationPrincipal Jwt jwt) { ... }

  @PostMapping("/opt-out")
  public ResponseEntity<ReciprocityStatusResponse> optOut(@AuthenticationPrincipal Jwt jwt) { ... }
}
```

**Step 4: Write ReciprocityStatusResponse**

```java
public record ReciprocityStatusResponse(
    boolean optedIn,
    OffsetDateTime optedInAt,
    OffsetDateTime optedOutAt,
    Integer cooldownDaysRemaining
) {}
```

**Step 5: Run tests, verify pass**

**Step 6: Commit**

---

### Task 9: Guard ExposureService with Reciprocity Check

**Files:**
- Modify: `backend/src/main/java/app/navilla/service/ExposureService.java`
- Modify: existing ExposureService tests

**Step 1: Write failing test**

Test: `getExposure_userNotOptedIn_returnsInsufficientData` — user who hasn't opted in gets a response with null exposures and an i18n message key

**Step 2: Add guard in ExposureService**

In `computeExposureSnapshot()`, before building graph:
```java
User user = userRepository.findByEmailHash(userHash)
    .orElseThrow(() -> new ResourceNotFoundException("user.notFound"));
if (!user.getExposureOptedIn()) {
  return ExposureResponse.builder()
      .message("exposure.reciprocityRequired")
      .build();
}
```

Also: filter the exposure pool to only include users who have opted in. Non-opted-in users' data should NOT appear in anyone's exposure calculations.

**Step 3: Run ALL exposure tests**

Run: `cd backend && ./mvnw test -Dtest="ExposureServiceTest"`
Expected: All pass

**Step 4: Commit**

---

### Task 10: Connection Phone Entry — Entity + Repository

**Files:**
- Create: `backend/src/main/java/app/navilla/entity/ConnectionPhoneEntry.java`
- Create: `backend/src/main/java/app/navilla/repository/ConnectionPhoneEntryRepository.java`
- Create: `backend/src/main/java/app/navilla/entity/PhoneBlock.java`
- Create: `backend/src/main/java/app/navilla/repository/PhoneBlockRepository.java`
- Create: `backend/src/main/java/app/navilla/entity/PhoneReport.java`
- Create: `backend/src/main/java/app/navilla/repository/PhoneReportRepository.java`

**Step 1: Write entities**

ConnectionPhoneEntry:
```java
@Entity
@Table(name = "connection_phone_entries")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ConnectionPhoneEntry {
  @Id @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;
  @Column(name = "user_hash", nullable = false, length = 64)
  private String userHash;
  @Column(name = "phone_hash", nullable = false, length = 64)
  private String phoneHash;
  @Column(name = "encounter_date", nullable = false)
  private LocalDate encounterDate;
  @Column(name = "journal_entry_id")
  private UUID journalEntryId;
  @Column(nullable = false) @Builder.Default
  private Boolean matched = false;
  @CreationTimestamp
  @Column(name = "created_at", nullable = false, updatable = false)
  private OffsetDateTime createdAt;
}
```

**Step 2: Write repositories with key queries**

```java
@Repository
public interface ConnectionPhoneEntryRepository extends JpaRepository<ConnectionPhoneEntry, UUID> {
  // Find unmatched entries where someone logged MY phone
  @Query("SELECT e FROM ConnectionPhoneEntry e WHERE e.phoneHash = :myPhoneHash "
      + "AND e.matched = false AND e.userHash != :myUserHash")
  List<ConnectionPhoneEntry> findUnmatchedEntriesForPhone(
      @Param("myPhoneHash") String myPhoneHash,
      @Param("myUserHash") String myUserHash);

  // Find my entries for a specific phone hash
  List<ConnectionPhoneEntry> findByUserHashAndPhoneHashAndMatchedFalse(
      String userHash, String phoneHash);

  // Count entries created by user this week (rate limiting)
  @Query("SELECT COUNT(e) FROM ConnectionPhoneEntry e WHERE e.userHash = :userHash "
      + "AND e.createdAt >= :weekStart")
  long countEntriesThisWeek(@Param("userHash") String userHash,
      @Param("weekStart") OffsetDateTime weekStart);
}
```

**Step 3: Commit**

---

### Task 11: Phone Matching Service

**Files:**
- Create: `backend/src/main/java/app/navilla/service/PhoneMatchService.java`
- Create: `backend/src/test/java/app/navilla/service/PhoneMatchServiceTest.java`

**Step 1: Write failing tests**

Tests:
- `registerPhoneEntry_validPhone_createsEntry` — stores hashed phone
- `registerPhoneEntry_rateLimitExceeded_throwsForbidden` — over weekly limit
- `findMutualMatches_bothLogged_returnsMatch` — A logged B's phone, B logged A's phone within window
- `findMutualMatches_oneSided_returnsEmpty` — only A logged B, no match
- `findMutualMatches_outsideDateWindow_returnsEmpty` — dates too far apart
- `findMutualMatches_phoneBlocked_returnsEmpty` — blocked phone excluded
- `createConnectionFromMatch_success` — creates connection with type PHONE_MATCH

**Step 2: Write PhoneMatchService**

Key methods:
```java
@Service
@RequiredArgsConstructor
@Slf4j
public class PhoneMatchService {
  private final ConnectionPhoneEntryRepository phoneEntryRepository;
  private final PhoneBlockRepository phoneBlockRepository;
  private final ConnectionRepository connectionRepository;
  private final AppConfigService appConfigService;
  private final EncryptionService encryptionService;

  /**
   * Register a phone entry from a journal encounter.
   * Phone is hashed before storage.
   */
  @Transactional
  public void registerPhoneEntry(String userHash, String rawPhone, LocalDate encounterDate, UUID journalEntryId) {
    // 1. Normalize phone (strip +, spaces, dashes)
    // 2. Hash phone (SHA-256 + pepper)
    // 3. Check rate limit (configurable max per week)
    // 4. Save ConnectionPhoneEntry
    // 5. Check for immediate mutual match
  }

  /**
   * Find mutual matches: both parties logged each other's phone within date window.
   */
  public List<PhoneMatch> findMutualMatches(String userHash, String userPhoneHash) {
    int windowDays = appConfigService.getInt("phone_match.window_days", 2);
    // 1. Find entries where someone logged MY phone hash
    // 2. For each, check if I also logged THEIR phone hash
    // 3. Verify dates are within ±windowDays
    // 4. Exclude blocked phones
    // 5. Return matches
  }

  /**
   * Create connection from a confirmed phone match.
   */
  @Transactional
  public Connection createConnectionFromMatch(String userHashA, String userHashB) {
    // Create Connection with type PHONE_MATCH
    // Mark both phone entries as matched=true
  }

  /**
   * Hash a phone number consistently.
   */
  public String hashPhone(String rawPhone) {
    String normalized = normalizePhone(rawPhone);
    return encryptionService.hashWithPepper(normalized);
  }

  private String normalizePhone(String phone) {
    // Strip +, spaces, dashes, parens
    // Keep only digits
    return phone.replaceAll("[^\\d]", "");
  }
}
```

**Step 3: Run tests, verify pass**

**Step 4: Commit**

---

### Task 12: Phone Match Background Job

**Files:**
- Create: `backend/src/main/java/app/navilla/job/PhoneMatchJob.java`
- Create: `backend/src/test/java/app/navilla/job/PhoneMatchJobTest.java`

**Step 1: Write failing test**

Test: job processes unmatched entries, finds mutual matches, creates connections

**Step 2: Write scheduled job**

```java
@Component
@RequiredArgsConstructor
@Slf4j
public class PhoneMatchJob {
  private final PhoneMatchService phoneMatchService;
  private final ConnectionPhoneEntryRepository phoneEntryRepository;

  @Scheduled(fixedDelayString = "${navilla.phone-match.interval-ms:300000}") // 5 min default
  public void processUnmatchedEntries() {
    List<ConnectionPhoneEntry> unmatched = phoneEntryRepository.findAllByMatchedFalse();
    // Group by phone hash, attempt matching
    // Log results
  }
}
```

**Step 3: Run tests, verify pass**

**Step 4: Commit**

---

### Task 13: Phone Notification Match Service

**Files:**
- Create: `backend/src/main/java/app/navilla/service/PhoneNotificationMatchService.java`
- Create: `backend/src/test/java/app/navilla/service/PhoneNotificationMatchServiceTest.java`

**Step 1: Write failing tests**

Tests:
- `processOneSidedEntry_recipientOptedIn_sendsNotification` — notification sent with masked phone + city
- `processOneSidedEntry_recipientNotOptedIn_noNotification` — respects preference
- `processOneSidedEntry_phoneBlocked_noNotification` — blocked phone excluded
- `confirmMatch_validConfirmation_createsConnection` — connection with type NOTIFICATION_MATCH
- `confirmMatch_deniedTooManyTimes_throttlesSender` — cooldown after N denials

**Step 2: Write service**

Key methods:
```java
public void processOneSidedEntries()  // Called by PhoneMatchJob when no mutual match
public Connection confirmMatch(Jwt jwt, UUID phoneEntryId)  // Recipient confirms
public void denyMatch(Jwt jwt, UUID phoneEntryId)  // Recipient denies
public void blockPhone(Jwt jwt, String phoneHash)  // Block sender's phone
public void reportPhone(Jwt jwt, String phoneHash, String reason)  // Report abuse
```

Notification contains: city/state of sender (from journal entry location if available), masked phone (show first 3 digits + area code, mask rest), approximate date.

**Step 3: Run tests, verify pass**

**Step 4: Commit**

---

### Task 14: Connection Type on Existing Connection Entity

**Files:**
- Modify: `backend/src/main/java/app/navilla/entity/Connection.java`
- Create: `backend/src/main/java/app/navilla/entity/ConnectionType.java`
- Modify: `backend/src/main/java/app/navilla/dto/ConnectionResponse.java`
- Modify: existing connection tests

**Step 1: Add ConnectionType**

```java
public enum ConnectionType {
  PHONE_MATCH,
  NOTIFICATION_MATCH,
  EXPLICIT,
  LINK;

  public static ConnectionType fromValue(String value) {
    return ConnectionType.valueOf(value.toUpperCase());
  }
}
```

Note: This is a small, stable enum (how a connection formed) — not a data catalog. OK to keep as enum.

**Step 2: Add to Connection entity**

```java
@Enumerated(EnumType.STRING)
@Column(name = "connection_type", length = 30)
@Builder.Default
private ConnectionType connectionType = ConnectionType.EXPLICIT;
```

**Step 3: Add to ConnectionResponse DTO**

**Step 4: Run all connection tests, verify pass**

**Step 5: Commit**

---

### Task 15: Journal Entry — Add Phone Field

**Files:**
- Modify: `backend/src/main/java/app/navilla/entity/EncounterJournal.java` — add `phoneHash` field
- Modify: `backend/src/main/java/app/navilla/dto/CreateEncounterRequest.java` — add optional `phone` field
- Modify: `backend/src/main/java/app/navilla/service/JournalService.java` — hash phone, call PhoneMatchService
- Modify: existing journal tests

**Step 1: Add phone to create request DTO**

```java
@Size(max = 20) String phone  // Optional, will be hashed before storage
```

**Step 2: In JournalService.createEncounter(), after saving entry:**

```java
if (request.phone() != null && !request.phone().isBlank()) {
  String phoneHash = phoneMatchService.hashPhone(request.phone());
  entry.setPhoneHash(phoneHash);
  journalRepository.save(entry);
  phoneMatchService.registerPhoneEntry(userHash, request.phone(), entry.getEncounterDate(), entry.getId());
}
```

**Step 3: Run all journal tests + phone match tests**

**Step 4: Commit**

---

### Task 16: Frontend — Reciprocity API + Hook

**Files:**
- Modify: `frontend/src/lib/api.ts` — add reciprocity endpoints
- Create: `frontend/src/hooks/useReciprocity.ts`
- Create: `frontend/src/types/reciprocity.ts`

**Step 1: Add types**

```typescript
export interface ReciprocityStatus {
  optedIn: boolean;
  optedInAt: string | null;
  optedOutAt: string | null;
  cooldownDaysRemaining: number | null;
}
```

**Step 2: Add API methods**

```typescript
reciprocity: {
  status: (token: string) => apiRequest<ReciprocityStatus>('/api/reciprocity/status', token),
  optIn: (token: string) => apiRequest<ReciprocityStatus>('/api/reciprocity/opt-in', token, { method: 'POST' }),
  optOut: (token: string) => apiRequest<ReciprocityStatus>('/api/reciprocity/opt-out', token, { method: 'POST' }),
}
```

**Step 3: Write hook**

```typescript
export function useReciprocityStatus() {
  const { session } = useAuth();
  return useQuery({
    queryKey: ['reciprocity', 'status'],
    queryFn: () => api.reciprocity.status(session!.access_token),
    enabled: !!session?.access_token,
  });
}

export function useOptIn() { ... }
export function useOptOut() { ... }
```

**Step 4: Commit**

---

### Task 17: Frontend — Reciprocity Opt-In Screen

**Files:**
- Create: `frontend/src/components/reciprocity/ReciprocityOptInCard.tsx`
- Modify: `frontend/src/pages/DashboardPage.tsx` — show opt-in card when not opted in, show exposure data when opted in
- Update: `frontend/src/locales/en_US.json` — add reciprocity i18n keys
- Update: `frontend/src/locales/es_MX.json` — add reciprocity i18n keys

**Step 1: Design the opt-in card component**

Use the `@frontend-design` skill for UI. The card should:
- Explain clearly: "Contribute your test results to see exposure data from your network"
- Show what you give and what you get
- Confirm button (not scary, not permanent-sounding)
- If in cooldown, show "You can opt back in in X days"
- Warm, non-clinical tone

**Step 2: Integrate with DashboardPage**

```typescript
const { data: reciprocity } = useReciprocityStatus();

// If not opted in, show ReciprocityOptInCard instead of exposure data
// If opted in, show exposure dashboard as before
```

**Step 3: Add i18n keys for both languages**

**Step 4: Run frontend lint**

Run: `cd frontend && npm run lint`

**Step 5: Commit**

---

### Task 18: Frontend — Phone Field in Journal Entry

**Files:**
- Modify: `frontend/src/components/journal/JournalEntryModal.tsx` — add optional phone field
- Modify: `frontend/src/types/journal.ts` — add phone to request type
- Update: `frontend/src/locales/en_US.json` — add phone field i18n
- Update: `frontend/src/locales/es_MX.json`

**Step 1: Add phone input to JournalEntryModal**

Optional field with phone input mask. Hint text: "Add a phone number to enable automatic matching" (translated).
`maxLength={20}` per input constraints spec.

**Step 2: Add to API request type**

**Step 3: Run frontend lint**

**Step 4: Commit**

---

### Task 19: Frontend — Phone Match Notifications + Confirmation

**Files:**
- Create: `frontend/src/components/connections/PhoneMatchNotification.tsx`
- Modify: `frontend/src/pages/ConnectionsPage.tsx` — show pending phone matches
- Create: `frontend/src/hooks/usePhoneMatch.ts`
- Modify: `frontend/src/lib/api.ts` — add phone match endpoints
- Update: locale files

**Step 1: Add API methods for phone match**

```typescript
phoneMatch: {
  pending: (token: string) => apiRequest<PhoneMatchNotification[]>('/api/phone-match/pending', token),
  confirm: (token: string, entryId: string) => apiRequest<Connection>(`/api/phone-match/${entryId}/confirm`, token, { method: 'POST' }),
  deny: (token: string, entryId: string) => apiRequest<void>(`/api/phone-match/${entryId}/deny`, token, { method: 'POST' }),
  block: (token: string, phoneHash: string) => apiRequest<void>(`/api/phone-match/block`, token, { method: 'POST', body: { phoneHash } }),
}
```

**Step 2: Build PhoneMatchNotification component**

Shows: "Someone in [City], phone [masked], ~[date]"
Actions: "Yes, I remember" (confirm), "Deny", "Block"

**Step 3: Integrate into ConnectionsPage**

Show pending phone matches above existing pending connections.

**Step 4: Run frontend lint**

**Step 5: Commit**

---

### Task 20: Frontend — Catalog Hooks + Updated Condition Selectors

**Files:**
- Create: `frontend/src/hooks/useCatalog.ts`
- Modify: `frontend/src/lib/api.ts` — add catalog endpoints
- Modify: all components that use hardcoded condition lists → use catalog hook instead
- Components to check: TestVisitModal, ConditionCard, HealthLogPage, any condition dropdowns

**Step 1: Add catalog API + hook**

```typescript
export function useConditionCatalog() {
  return useQuery({
    queryKey: ['catalog', 'conditions'],
    queryFn: () => api.catalog.conditions(),
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}
```

**Step 2: Replace hardcoded condition arrays with catalog data**

Search for hardcoded STI lists in frontend and replace with `useConditionCatalog()`.

**Step 3: Run frontend lint**

**Step 4: Commit**

---

### Task 21: Full Test Suite Run + Integration Verification

**Step 1: Run all backend tests**

Run: `cd backend && ./mvnw test`
Expected: ALL PASS (previous count: 299 + new tests)

**Step 2: Run frontend lint**

Run: `cd frontend && npm run lint`
Expected: No errors

**Step 3: Fix any failures**

**Step 4: Final commit**

---

### Task 22: Update Documentation + Locale Files

**Files:**
- Update: `frontend/src/locales/en_US.json` — all new keys (reciprocity, phone match, catalog)
- Update: `frontend/src/locales/es_MX.json` — Spanish translations
- Update: `docs/docs/api/` — new endpoints documentation
- Update: `docs/static/postman/navilla-api.postman_collection.json` — new endpoints
- Update: `CONTEXT.md` — session notes, progress tracker
- Update: `UPCOMING_FEATURES_AND_ROADMAP.md` — mark Week 10 status

**Step 1: i18n — add all new keys to both locale files**

**Step 2: Update Postman collection with new endpoints:**
- GET/POST /api/reciprocity/*
- GET /api/catalog/conditions
- GET /api/catalog/stages
- GET/POST /api/phone-match/*

**Step 3: Update CONTEXT.md with session notes**

**Step 4: Commit and push**

---

## Week 11: Verified Test Badges (High-Level)

### Migration 015
- `verification_cards` table
- `verification_card_views` table
- `user_card_preferences` table (or JSON column on users)

### Backend Tasks
1. VerificationCard entity + repository
2. VerificationCardService — generate, validate token, track views, expire
3. VerificationCardController — POST /api/verification-cards (create), GET /api/verify/{token} (public)
4. Card preferences — save/load user defaults
5. QR token generation — short-lived tokens for in-app display
6. Document upload — encrypted file storage for lab PDFs (Supabase Storage)

### Frontend Tasks
7. Card builder UI — toggles for data, privacy mode, view limit, expiry, name
8. Card preferences settings screen
9. Shareable link generation + copy button
10. In-app verification screen with live QR code
11. Public verification page (navilla.app/verify/{token}) — pre-rendered for SEO
12. i18n for all new strings

---

## Week 12: Network Constellation Visualization (High-Level)

### Backend Tasks
1. Network stats endpoint — GET /api/network/stats → { directCount, degree2, degree3, total, stage, constellationName }
2. Constellation naming algorithm
3. Estimated network calculation (CDC data-based formula)
4. Shareable network card generation endpoint

### Frontend Tasks
5. Pluggable NetworkVisualization interface/contract
6. Constellation renderer (Canvas + tsParticles or Three.js)
7. Stage badge component
8. Shareable network card component (dark background, stats overlay)
9. "Share my network" — generate + export as image
10. Estimated network ghost constellation (cold start)
11. My Network page/section in dashboard
12. i18n for all strings

---

## Week 13: Cold Start + Exposure Recency + Polish (High-Level)

### Tasks
1. Estimated network formula implementation (encounter count → estimated indirect nodes)
2. Ghost constellation rendering (translucent, aspirational version)
3. Exposure recency buckets in ExposureService (0-30d, 31-90d, 91-365d, 365d+)
4. Updated exposure dashboard with recency labels
5. End-to-end testing for all Phase 3 features
6. Performance optimization (Canvas rendering, API response times)
7. Accessibility audit (constellation screen reader support, verification card)
8. Full i18n review
