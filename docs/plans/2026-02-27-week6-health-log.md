# Health Log Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the Health Status page with a full Health Log — test visit history, normalized lab storage, custom conditions, numeric results, and per-condition detail pages.

**Architecture:** Parent-child model (test_visits → test_results) with normalized lab storage (labs + lab_credentials EAV). Encrypted notes, facility names, result values, and lab credentials. Write-through to existing `health_status` table keeps exposure BFS working. New frontend pages at `/health-log` and `/health-log/:condition`.

**Tech Stack:** Java 25 + Spring Boot 4, React 19 + TypeScript + React Query, AES-256-GCM encryption, PostgreSQL (Supabase), i18n (en_US + es_MX)

**Design doc:** `docs/plans/2026-02-27-week6-health-log-design.md`

---

## Task 1: Database Migration

**Files:**
- Create: `database/migrations/010_health_log.sql`

**Step 1: Write the migration**

```sql
-- Migration 010: Health Log (test visits + results + labs)
-- Purpose: Replace single-status-per-condition model with full test visit history
--
-- ROLLBACK:
-- BEGIN;
-- DROP TABLE IF EXISTS lab_credentials;
-- DROP TABLE IF EXISTS test_results;
-- DROP TABLE IF EXISTS test_visits;
-- DROP TABLE IF EXISTS labs;
-- COMMIT;

BEGIN;

-- User's saved lab profiles
CREATE TABLE labs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_hash VARCHAR(64) NOT NULL,
    provider VARCHAR(32) NOT NULL,
    name_encrypted BYTEA NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_labs_user ON labs(user_hash);

COMMENT ON TABLE labs IS 'User-saved lab profiles (Chopo, Salud Digna, etc). Name is AES-256-GCM encrypted.';

-- EAV for lab-level persistent identifiers
CREATE TABLE lab_credentials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lab_id UUID NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
    credential_key VARCHAR(64) NOT NULL,
    value_encrypted BYTEA NOT NULL,
    UNIQUE (lab_id, credential_key)
);

COMMENT ON TABLE lab_credentials IS 'Key-value credentials per lab (patient_id, account_number, etc). Values are AES-256-GCM encrypted.';

-- One row per test visit
CREATE TABLE test_visits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_hash VARCHAR(64) NOT NULL,
    test_date DATE NOT NULL,
    lab_id UUID REFERENCES labs(id) ON DELETE SET NULL,
    lab_reference_encrypted BYTEA,
    notes_encrypted BYTEA,
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_test_visits_user ON test_visits(user_hash);
CREATE INDEX idx_test_visits_date ON test_visits(user_hash, test_date DESC);

COMMENT ON TABLE test_visits IS 'Test visit log. One row per lab visit. lab_reference and notes are AES-256-GCM encrypted.';

-- One row per condition tested in a visit
CREATE TABLE test_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    visit_id UUID NOT NULL REFERENCES test_visits(id) ON DELETE CASCADE,
    condition_type VARCHAR(32),
    custom_condition_encrypted BYTEA,
    status VARCHAR(16) NOT NULL,
    result_value_encrypted BYTEA,
    reference_range VARCHAR(200),
    cleared_at TIMESTAMPTZ,
    document_ref_encrypted BYTEA,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_test_results_visit ON test_results(visit_id);
CREATE INDEX idx_test_results_condition ON test_results(condition_type);

COMMENT ON TABLE test_results IS 'Per-condition results within a test visit. custom_condition and result_value are AES-256-GCM encrypted. reference_range is plaintext (public medical knowledge).';

COMMIT;
```

**Step 2: Verify migration syntax**

Read the file back and confirm SQL is valid. Compare with `008_encounter_journal.sql` for consistency.

**Step 3: Commit**

```bash
git add database/migrations/010_health_log.sql
git commit -m "feat: add migration 010 for health log tables (labs, test_visits, test_results)"
git push
```

---

## Task 2: Backend Enums

**Files:**
- Create: `backend/src/main/java/app/navilla/entity/LabProvider.java`
- Create: `backend/src/main/java/app/navilla/entity/TestResultStatus.java`

**Step 1: Create LabProvider enum**

```java
package app.navilla.entity;

public enum LabProvider {
  CHOPO,
  SALUD_DIGNA,
  OTHER;

  public static LabProvider fromValue(String value) {
    return LabProvider.valueOf(value.toUpperCase());
  }
}
```

**Step 2: Create TestResultStatus enum**

```java
package app.navilla.entity;

public enum TestResultStatus {
  POSITIVE,
  NEGATIVE,
  PENDING,
  INDETERMINATE;

  public static TestResultStatus fromValue(String value) {
    return TestResultStatus.valueOf(value.toUpperCase());
  }
}
```

**Step 3: Commit**

```bash
git add backend/src/main/java/app/navilla/entity/LabProvider.java backend/src/main/java/app/navilla/entity/TestResultStatus.java
git commit -m "feat: add LabProvider and TestResultStatus enums"
git push
```

---

## Task 3: Backend Entities

**Files:**
- Create: `backend/src/main/java/app/navilla/entity/Lab.java`
- Create: `backend/src/main/java/app/navilla/entity/LabCredential.java`
- Create: `backend/src/main/java/app/navilla/entity/TestVisit.java`
- Create: `backend/src/main/java/app/navilla/entity/TestResult.java`

**Step 1: Create Lab entity**

Follow the EncounterJournal pattern — Lombok `@Builder`, `@Data`, `@NoArgsConstructor`, `@AllArgsConstructor`.

```java
package app.navilla.entity;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(name = "labs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Lab {
  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @Column(name = "user_hash", nullable = false, length = 64)
  private String userHash;

  @Enumerated(EnumType.STRING)
  @Column(name = "provider", nullable = false, length = 32)
  private LabProvider provider;

  @Column(name = "name_encrypted", nullable = false)
  private byte[] nameEncrypted;

  @CreationTimestamp
  @Column(name = "created_at", nullable = false, updatable = false)
  private OffsetDateTime createdAt;
}
```

**Step 2: Create LabCredential entity**

```java
package app.navilla.entity;

import jakarta.persistence.*;
import java.util.UUID;
import lombok.*;

@Entity
@Table(name = "lab_credentials",
    uniqueConstraints = @UniqueConstraint(columnNames = {"lab_id", "credential_key"}))
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LabCredential {
  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @Column(name = "lab_id", nullable = false)
  private UUID labId;

  @Column(name = "credential_key", nullable = false, length = 64)
  private String credentialKey;

  @Column(name = "value_encrypted", nullable = false)
  private byte[] valueEncrypted;
}
```

**Step 3: Create TestVisit entity**

```java
package app.navilla.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(name = "test_visits")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TestVisit {
  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @Column(name = "user_hash", nullable = false, length = 64)
  private String userHash;

  @Column(name = "test_date", nullable = false)
  private LocalDate testDate;

  @Column(name = "lab_id")
  private UUID labId;

  @Column(name = "lab_reference_encrypted")
  private byte[] labReferenceEncrypted;

  @Column(name = "notes_encrypted")
  private byte[] notesEncrypted;

  @Column(name = "verified", nullable = false)
  @Builder.Default
  private Boolean verified = false;

  @Column(name = "verified_at")
  private OffsetDateTime verifiedAt;

  @CreationTimestamp
  @Column(name = "created_at", nullable = false, updatable = false)
  private OffsetDateTime createdAt;

  @UpdateTimestamp
  @Column(name = "updated_at", nullable = false)
  private OffsetDateTime updatedAt;
}
```

**Step 4: Create TestResult entity**

```java
package app.navilla.entity;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(name = "test_results")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TestResult {
  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @Column(name = "visit_id", nullable = false)
  private UUID visitId;

  @Enumerated(EnumType.STRING)
  @Column(name = "condition_type", length = 32)
  private ConditionType conditionType;

  @Column(name = "custom_condition_encrypted")
  private byte[] customConditionEncrypted;

  @Enumerated(EnumType.STRING)
  @Column(name = "status", nullable = false, length = 16)
  private TestResultStatus status;

  @Column(name = "result_value_encrypted")
  private byte[] resultValueEncrypted;

  @Column(name = "reference_range", length = 200)
  private String referenceRange;

  @Column(name = "cleared_at")
  private OffsetDateTime clearedAt;

  @Column(name = "document_ref_encrypted")
  private byte[] documentRefEncrypted;

  @CreationTimestamp
  @Column(name = "created_at", nullable = false, updatable = false)
  private OffsetDateTime createdAt;

  @UpdateTimestamp
  @Column(name = "updated_at", nullable = false)
  private OffsetDateTime updatedAt;
}
```

**Step 5: Commit**

```bash
git add backend/src/main/java/app/navilla/entity/Lab.java backend/src/main/java/app/navilla/entity/LabCredential.java backend/src/main/java/app/navilla/entity/TestVisit.java backend/src/main/java/app/navilla/entity/TestResult.java
git commit -m "feat: add Lab, LabCredential, TestVisit, TestResult entities"
git push
```

---

## Task 4: Backend Repositories

**Files:**
- Create: `backend/src/main/java/app/navilla/repository/LabRepository.java`
- Create: `backend/src/main/java/app/navilla/repository/LabCredentialRepository.java`
- Create: `backend/src/main/java/app/navilla/repository/TestVisitRepository.java`
- Create: `backend/src/main/java/app/navilla/repository/TestResultRepository.java`

**Step 1: Create all four repositories**

```java
// LabRepository.java
package app.navilla.repository;

import app.navilla.entity.Lab;
import java.util.UUID;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LabRepository extends JpaRepository<Lab, UUID> {
  List<Lab> findByUserHashOrderByCreatedAtDesc(String userHash);
}
```

```java
// LabCredentialRepository.java
package app.navilla.repository;

import app.navilla.entity.LabCredential;
import java.util.UUID;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LabCredentialRepository extends JpaRepository<LabCredential, UUID> {
  List<LabCredential> findByLabId(UUID labId);
  void deleteByLabId(UUID labId);
}
```

```java
// TestVisitRepository.java
package app.navilla.repository;

import app.navilla.entity.TestVisit;
import java.util.UUID;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TestVisitRepository extends JpaRepository<TestVisit, UUID> {
  List<TestVisit> findByUserHashOrderByTestDateDesc(String userHash);
}
```

```java
// TestResultRepository.java
package app.navilla.repository;

import app.navilla.entity.ConditionType;
import app.navilla.entity.TestResult;
import java.util.UUID;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface TestResultRepository extends JpaRepository<TestResult, UUID> {
  List<TestResult> findByVisitIdOrderByCreatedAt(UUID visitId);

  @Query("SELECT r FROM TestResult r JOIN TestVisit v ON r.visitId = v.id "
      + "WHERE v.userHash = :userHash AND r.conditionType = :conditionType "
      + "ORDER BY v.testDate DESC")
  List<TestResult> findByUserAndCondition(
      @Param("userHash") String userHash,
      @Param("conditionType") ConditionType conditionType);

  @Query("SELECT r FROM TestResult r JOIN TestVisit v ON r.visitId = v.id "
      + "WHERE v.userHash = :userHash ORDER BY v.testDate DESC")
  List<TestResult> findAllByUserHash(@Param("userHash") String userHash);
}
```

**Step 2: Commit**

```bash
git add backend/src/main/java/app/navilla/repository/LabRepository.java backend/src/main/java/app/navilla/repository/LabCredentialRepository.java backend/src/main/java/app/navilla/repository/TestVisitRepository.java backend/src/main/java/app/navilla/repository/TestResultRepository.java
git commit -m "feat: add repositories for health log tables"
git push
```

---

## Task 5: Backend DTOs

**Files:**
- Create: `backend/src/main/java/app/navilla/dto/CreateLabRequest.java`
- Create: `backend/src/main/java/app/navilla/dto/UpdateLabRequest.java`
- Create: `backend/src/main/java/app/navilla/dto/LabResponse.java`
- Create: `backend/src/main/java/app/navilla/dto/LabCredentialDto.java`
- Create: `backend/src/main/java/app/navilla/dto/CreateTestVisitRequest.java`
- Create: `backend/src/main/java/app/navilla/dto/UpdateTestVisitRequest.java`
- Create: `backend/src/main/java/app/navilla/dto/TestVisitResponse.java`
- Create: `backend/src/main/java/app/navilla/dto/TestResultDto.java`
- Create: `backend/src/main/java/app/navilla/dto/HealthLogSummaryResponse.java`
- Create: `backend/src/main/java/app/navilla/dto/ConditionSummary.java`
- Create: `backend/src/main/java/app/navilla/dto/ConditionHistoryResponse.java`

**Step 1: Create Lab DTOs**

```java
// CreateLabRequest.java
package app.navilla.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.List;

public record CreateLabRequest(
    @NotBlank String provider,
    @NotBlank String name,
    List<LabCredentialDto> credentials
) {}

// UpdateLabRequest.java
package app.navilla.dto;

import java.util.List;

public record UpdateLabRequest(
    String name,
    List<LabCredentialDto> credentials
) {}

// LabResponse.java
package app.navilla.dto;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record LabResponse(
    UUID id,
    String provider,
    String name,
    List<LabCredentialDto> credentials,
    OffsetDateTime createdAt
) {}

// LabCredentialDto.java
package app.navilla.dto;

public record LabCredentialDto(
    String key,
    String value
) {}
```

**Step 2: Create TestVisit DTOs**

```java
// TestResultDto.java
package app.navilla.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record TestResultDto(
    UUID id,
    String conditionType,
    String customCondition,
    String status,
    String resultValue,
    String referenceRange,
    OffsetDateTime clearedAt
) {}

// CreateTestVisitRequest.java
package app.navilla.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import java.util.List;
import java.util.UUID;

public record CreateTestVisitRequest(
    @NotBlank @Pattern(regexp = "^\\d{4}-\\d{2}-\\d{2}$") String testDate,
    UUID labId,
    String labReference,
    @NotEmpty List<TestResultInput> results,
    String notes
) {
  public record TestResultInput(
      String conditionType,
      String customCondition,
      @NotBlank String status,
      String resultValue,
      String referenceRange
  ) {}
}

// UpdateTestVisitRequest.java
package app.navilla.dto;

import jakarta.validation.constraints.Pattern;
import java.util.List;
import java.util.UUID;

public record UpdateTestVisitRequest(
    @Pattern(regexp = "^\\d{4}-\\d{2}-\\d{2}$") String testDate,
    UUID labId,
    String labReference,
    List<CreateTestVisitRequest.TestResultInput> results,
    String notes
) {}

// TestVisitResponse.java
package app.navilla.dto;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record TestVisitResponse(
    UUID id,
    LocalDate testDate,
    UUID labId,
    String labName,
    String labProvider,
    String labReference,
    String notes,
    boolean verified,
    OffsetDateTime verifiedAt,
    List<TestResultDto> results,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt
) {}
```

**Step 3: Create Summary DTOs**

```java
// ConditionSummary.java
package app.navilla.dto;

import java.time.LocalDate;

public record ConditionSummary(
    String conditionType,
    String customCondition,
    String latestStatus,
    String latestResultValue,
    LocalDate lastTestDate,
    int totalTests,
    boolean hasPositive
) {}

// HealthLogSummaryResponse.java
package app.navilla.dto;

import java.util.List;

public record HealthLogSummaryResponse(
    int daysSinceLastTest,
    int testsThisYear,
    int conditionsCovered,
    int totalStandardConditions,
    List<ConditionSummary> conditions
) {}

// ConditionHistoryResponse.java
package app.navilla.dto;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record ConditionHistoryResponse(
    String conditionType,
    String latestStatus,
    int totalTests,
    LocalDate lastTestDate,
    List<HistoryEntry> entries
) {
  public record HistoryEntry(
      UUID visitId,
      LocalDate testDate,
      String status,
      String resultValue,
      String referenceRange,
      String labName,
      String labProvider,
      boolean verified,
      OffsetDateTime clearedAt
  ) {}
}
```

**Step 4: Commit**

```bash
git add backend/src/main/java/app/navilla/dto/
git commit -m "feat: add DTOs for health log (labs, visits, results, summary)"
git push
```

---

## Task 6: Backend LabService (TDD)

**Files:**
- Create: `backend/src/main/java/app/navilla/service/LabService.java`
- Create: `backend/src/test/java/app/navilla/service/LabServiceTest.java`

**Step 1: Write failing tests for LabService**

Test CRUD operations: create lab with credentials, list labs, update lab, delete lab. Follow the EncounterJournalServiceTest pattern — `@ExtendWith(MockitoExtension.class)`, `@Mock` dependencies, `@InjectMocks` service, `@Nested` groups.

Key test cases:
- `createLab_shouldEncryptNameAndCredentials`
- `createLab_shouldRejectInvalidProvider`
- `listLabs_shouldDecryptAndReturnWithCredentials`
- `updateLab_shouldReplaceCredentials`
- `deleteLab_shouldCascadeToCredentials`
- `deleteLab_shouldRejectIfNotOwner`

**Step 2: Run tests to verify they fail**

```bash
cd backend && ./mvnw test -pl . -Dtest=LabServiceTest -Dsurefire.failIfNoSpecifiedTests=false
```

**Step 3: Implement LabService**

Service follows the EncounterJournalService pattern:
- `@Service`, `@RequiredArgsConstructor`, `@Slf4j`
- Inject `LabRepository`, `LabCredentialRepository`, `EncryptionService`
- `hashEmail(Jwt)` helper for userHash
- `encryptOptional(String)` helper
- Methods: `createLab(Jwt, CreateLabRequest)`, `listLabs(Jwt)`, `updateLab(Jwt, UUID, UpdateLabRequest)`, `deleteLab(Jwt, UUID)`
- Ownership check on update/delete: throw `IllegalStateException("healthLog.error.notOwner")` if userHash doesn't match

**Step 4: Run tests to verify they pass**

```bash
cd backend && ./mvnw test -pl . -Dtest=LabServiceTest
```

**Step 5: Commit**

```bash
git add backend/src/main/java/app/navilla/service/LabService.java backend/src/test/java/app/navilla/service/LabServiceTest.java
git commit -m "feat: add LabService with CRUD and encryption (TDD)"
git push
```

---

## Task 7: Backend HealthLogService — Visit CRUD (TDD)

**Files:**
- Create: `backend/src/main/java/app/navilla/service/HealthLogService.java`
- Create: `backend/src/test/java/app/navilla/service/HealthLogServiceTest.java`

**Step 1: Write failing tests for visit CRUD**

Key test cases:
- `createVisit_shouldSaveVisitAndResultsWithEncryption`
- `createVisit_shouldWriteThroughToHealthStatus`
- `createVisit_shouldHandleCustomConditions`
- `createVisit_shouldNotWriteThroughPendingStatus`
- `getVisit_shouldDecryptAndReturnWithResults`
- `getVisit_shouldRejectIfNotOwner`
- `updateVisit_shouldReplaceResultsAndReSync`
- `deleteVisit_shouldCascadeAndReDeriveHealthStatus`
- `listVisits_shouldReturnNewestFirst`

**Step 2: Run tests, verify failure**

**Step 3: Implement HealthLogService**

Inject: `TestVisitRepository`, `TestResultRepository`, `LabRepository`, `HealthStatusRepository`, `EncryptionService`, `ObjectMapper`

Key methods:
- `createVisit(Jwt, CreateTestVisitRequest)` — save visit + results, call `syncHealthStatus(userHash, results)`
- `getVisit(Jwt, UUID)` — fetch with results, decrypt, ownership check
- `updateVisit(Jwt, UUID, UpdateTestVisitRequest)` — update visit, delete old results, insert new, resync
- `deleteVisit(Jwt, UUID)` — delete visit (CASCADE removes results), re-derive health_status
- `listVisits(Jwt)` — list all visits with results, newest first

**Write-through helper** `syncHealthStatus(String userHash, List<TestResult> results)`:
- For each result with a standard `conditionType` (not custom) and status POSITIVE or NEGATIVE:
  - Find or create `health_status` row for `(userHash, conditionType)`
  - Update `status`, `testDate`, `reportedAt`
  - If positive and was cleared, reset `clearedAt` to null
- Skip PENDING and INDETERMINATE (not actionable for exposure)

**Re-derive helper** `reDeriveHealthStatus(String userHash, ConditionType conditionType)`:
- Query latest `TestResult` for this condition across all visits
- If found, update `health_status` to match
- If none remain, delete the `health_status` row

**Step 4: Run tests, verify pass**

**Step 5: Commit**

```bash
git add backend/src/main/java/app/navilla/service/HealthLogService.java backend/src/test/java/app/navilla/service/HealthLogServiceTest.java
git commit -m "feat: add HealthLogService with visit CRUD, encryption, and health_status write-through (TDD)"
git push
```

---

## Task 8: Backend HealthLogService — Summary & Condition History (TDD)

**Files:**
- Modify: `backend/src/main/java/app/navilla/service/HealthLogService.java`
- Modify: `backend/src/test/java/app/navilla/service/HealthLogServiceTest.java`

**Step 1: Write failing tests**

Key test cases:
- `getSummary_shouldReturnDaysSinceLastTest`
- `getSummary_shouldReturnTestsThisYear`
- `getSummary_shouldReturnCoverageCount`
- `getSummary_shouldReturnLatestStatusPerCondition`
- `getSummary_shouldIncludeCustomConditions`
- `getConditionHistory_shouldReturnAllVisitsForCondition`
- `getConditionHistory_shouldIncludeLabInfo`

**Step 2: Run tests, verify failure**

**Step 3: Implement**

- `getSummary(Jwt)` → `HealthLogSummaryResponse`
  - Fetch all results for user, group by condition
  - Compute: days since MAX(test_date), count visits this year, count distinct standard conditions tested in last year
  - Build `ConditionSummary` list from latest result per condition
- `getConditionHistory(Jwt, String conditionType)` → `ConditionHistoryResponse`
  - Fetch all results for this condition, join with visit + lab data
  - Build timeline entries with lab name, provider, verified status

**Step 4: Run tests, verify pass**

**Step 5: Commit**

```bash
git add backend/src/main/java/app/navilla/service/HealthLogService.java backend/src/test/java/app/navilla/service/HealthLogServiceTest.java
git commit -m "feat: add summary and condition history to HealthLogService (TDD)"
git push
```

---

## Task 9: Backend Controller + Integration Tests

**Files:**
- Create: `backend/src/main/java/app/navilla/controller/HealthLogController.java`
- Create: `backend/src/test/java/app/navilla/controller/HealthLogControllerTest.java`

**Step 1: Create HealthLogController**

```java
@RestController
@RequestMapping("/api/health-log")
@RequiredArgsConstructor
public class HealthLogController {

  private final HealthLogService healthLogService;
  private final LabService labService;

  // Visits
  @GetMapping("/visits")
  public ResponseEntity<List<TestVisitResponse>> listVisits(@AuthenticationPrincipal Jwt jwt)

  @PostMapping("/visits")
  public ResponseEntity<TestVisitResponse> createVisit(
      @AuthenticationPrincipal Jwt jwt, @Valid @RequestBody CreateTestVisitRequest request)

  @GetMapping("/visits/{id}")
  public ResponseEntity<TestVisitResponse> getVisit(
      @AuthenticationPrincipal Jwt jwt, @PathVariable UUID id)

  @PutMapping("/visits/{id}")
  public ResponseEntity<TestVisitResponse> updateVisit(
      @AuthenticationPrincipal Jwt jwt, @PathVariable UUID id,
      @Valid @RequestBody UpdateTestVisitRequest request)

  @DeleteMapping("/visits/{id}")
  public ResponseEntity<Void> deleteVisit(
      @AuthenticationPrincipal Jwt jwt, @PathVariable UUID id)

  // Summary & Condition
  @GetMapping("/summary")
  public ResponseEntity<HealthLogSummaryResponse> getSummary(@AuthenticationPrincipal Jwt jwt)

  @GetMapping("/condition/{type}")
  public ResponseEntity<ConditionHistoryResponse> getConditionHistory(
      @AuthenticationPrincipal Jwt jwt, @PathVariable String type)

  // Labs
  @GetMapping("/labs")
  public ResponseEntity<List<LabResponse>> listLabs(@AuthenticationPrincipal Jwt jwt)

  @PostMapping("/labs")
  public ResponseEntity<LabResponse> createLab(
      @AuthenticationPrincipal Jwt jwt, @Valid @RequestBody CreateLabRequest request)

  @PutMapping("/labs/{id}")
  public ResponseEntity<LabResponse> updateLab(
      @AuthenticationPrincipal Jwt jwt, @PathVariable UUID id,
      @Valid @RequestBody UpdateLabRequest request)

  @DeleteMapping("/labs/{id}")
  public ResponseEntity<Void> deleteLab(
      @AuthenticationPrincipal Jwt jwt, @PathVariable UUID id)
}
```

**Step 2: Write integration tests**

Follow existing controller test patterns. Test all endpoints return correct status codes, validation errors, ownership checks.

**Step 3: Run all backend tests**

```bash
cd backend && ./mvnw test
```

**Step 4: Commit**

```bash
git add backend/src/main/java/app/navilla/controller/HealthLogController.java backend/src/test/java/app/navilla/controller/HealthLogControllerTest.java
git commit -m "feat: add HealthLogController with all endpoints + integration tests"
git push
```

---

## Task 10: Backend i18n Messages

**Files:**
- Modify: `backend/src/main/resources/messages.properties`
- Modify: `backend/src/main/resources/messages_es_MX.properties`

Add validation error messages for health log: `healthLog.error.notOwner`, `healthLog.error.notFound`, `healthLog.error.invalidProvider`, `healthLog.error.invalidStatus`, `healthLog.error.resultsRequired`.

**Commit after adding.**

---

## Task 11: Frontend API Types + Client Methods

**Files:**
- Modify: `frontend/src/lib/api.ts`

**Step 1: Add TypeScript interfaces**

Add types: `Lab`, `LabCredential`, `TestVisit`, `TestVisitResult`, `HealthLogSummary`, `ConditionSummary`, `ConditionHistory`, `ConditionHistoryEntry`

Add request types: `CreateLabRequest`, `UpdateLabRequest`, `CreateTestVisitRequest`, `TestResultInput`, `UpdateTestVisitRequest`

**Step 2: Add API client methods**

```typescript
healthLog: {
  visits: {
    list: (token: string) => apiRequest<TestVisit[]>('/api/health-log/visits', token),
    create: (token: string, data: CreateTestVisitRequest) =>
      apiRequest<TestVisit>('/api/health-log/visits', token, { method: 'POST', body: data }),
    get: (token: string, id: string) =>
      apiRequest<TestVisit>(`/api/health-log/visits/${id}`, token),
    update: (token: string, id: string, data: UpdateTestVisitRequest) =>
      apiRequest<TestVisit>(`/api/health-log/visits/${id}`, token, { method: 'PUT', body: data }),
    delete: (token: string, id: string) =>
      apiRequest<void>(`/api/health-log/visits/${id}`, token, { method: 'DELETE' }),
  },
  summary: (token: string) =>
    apiRequest<HealthLogSummary>('/api/health-log/summary', token),
  condition: (token: string, type: string) =>
    apiRequest<ConditionHistory>(`/api/health-log/condition/${type}`, token),
  labs: {
    list: (token: string) => apiRequest<Lab[]>('/api/health-log/labs', token),
    create: (token: string, data: CreateLabRequest) =>
      apiRequest<Lab>('/api/health-log/labs', token, { method: 'POST', body: data }),
    update: (token: string, id: string, data: UpdateLabRequest) =>
      apiRequest<Lab>(`/api/health-log/labs/${id}`, token, { method: 'PUT', body: data }),
    delete: (token: string, id: string) =>
      apiRequest<void>(`/api/health-log/labs/${id}`, token, { method: 'DELETE' }),
  },
},
```

**Step 3: Commit**

```bash
git add frontend/src/lib/api.ts
git commit -m "feat: add health log API types and client methods"
git push
```

---

## Task 12: Frontend React Query Hooks

**Files:**
- Create: `frontend/src/hooks/useHealthLog.ts`

Follow `useJournal.ts` pattern. Create hooks:
- `useHealthLogSummary()`, `useHealthLogVisits()`, `useHealthLogVisit(id)`
- `useConditionHistory(type)`, `useHealthLogLabs()`
- `useCreateTestVisit()`, `useUpdateTestVisit()`, `useDeleteTestVisit()`
- `useCreateLab()`, `useUpdateLab()`, `useDeleteLab()`

All mutations invalidate `queryKey: ['health-log']`.

**Commit after creating.**

---

## Task 13: Frontend i18n Strings

**Files:**
- Modify: `frontend/src/locales/en_US.json`
- Modify: `frontend/src/locales/es_MX.json`

Add all `healthLog.*` keys: page title, stats labels, condition names, status labels, modal labels, form fields, error messages, empty states. Both languages in parallel.

Key namespaces: `healthLog.title`, `healthLog.addVisit`, `healthLog.daysSinceTest`, `healthLog.testsThisYear`, `healthLog.coverage`, `healthLog.noTests`, `healthLog.lab`, `healthLog.reference`, `healthLog.results`, `healthLog.customCondition`, `healthLog.resultValue`, `healthLog.referenceRange`, etc.

**Commit after adding.**

---

## Task 14: Frontend HealthLogStats Component

**Files:**
- Create: `frontend/src/components/health-log/HealthLogStats.tsx`

Hero stats bar showing: days since last test (large number), tests this year, coverage (X/10 with bar). Receives `HealthLogSummary` as props. Warm, non-clinical styling with indigo accents.

**Commit after creating.**

---

## Task 15: Frontend ConditionCard Component

**Files:**
- Create: `frontend/src/components/health-log/ConditionCard.tsx`

Card showing: condition name, latest status (colored badge), last test date, total test count, right chevron. Tappable — navigates to `/health-log/:condition`. Receives `ConditionSummary` as props.

**Commit after creating.**

---

## Task 16: Frontend LabPicker Component

**Files:**
- Create: `frontend/src/components/health-log/LabPicker.tsx`

Autocomplete dropdown from saved labs + "New lab" inline creation. When "New lab" selected, show: provider select (Chopo, Salud Digna, Other) + name input + dynamic credential fields based on provider. Receives `labs` list and `onSelect(labId)` / `onCreateNew(lab)` callbacks.

**Commit after creating.**

---

## Task 17: Frontend TestVisitModal Component

**Files:**
- Create: `frontend/src/components/health-log/TestVisitModal.tsx`

Full modal for logging/editing a test visit:
- Date input (min=DOB, max=today — same pattern as JournalEntryModal)
- LabPicker component
- Lab reference input (visit-specific)
- Condition checkboxes (10 standard + custom) with status dropdown, optional value + reference fields per result
- Notes textarea
- Save/Cancel buttons

Reuse the modal-backdrop/modal pattern from JournalEntryModal.

**Commit after creating.**

---

## Task 18: Frontend HealthLogPage

**Files:**
- Create: `frontend/src/pages/HealthLogPage.tsx`

Main dashboard. Layout:
1. Page header with encrypted badge + "Log Test Visit" button
2. HealthLogStats bar
3. Exposure overview section (carry over from HealthStatusPage — same data, same component)
4. Condition cards grid
5. Coverage summary line

Uses: `useHealthLogSummary()`, exposure query (existing). Empty state if no test visits.

**Commit after creating.**

---

## Task 19: Frontend ConditionDetailPage

**Files:**
- Create: `frontend/src/pages/ConditionDetailPage.tsx`

Route: `/health-log/:condition`. Shows:
1. Back link to Health Log
2. Condition name + current status
3. Stats line (total tests, last date)
4. History timeline with: date, status badge, result value, lab name, verified badge

Uses: `useConditionHistory(condition)`.

**Commit after creating.**

---

## Task 20: Frontend Routing + Nav

**Files:**
- Modify: `frontend/src/router.tsx` — add `/health-log` and `/health-log/:condition` routes, redirect `/health` to `/health-log`
- Modify: nav component — rename "Health Status" to "Health Log", update path and icon
- Modify: any references to `/health` across the app (dashboard links, etc.)

**Commit after updating.**

---

## Task 21: Frontend Component Tests

**Files:**
- Create: `frontend/src/pages/HealthLogPage.test.tsx`
- Create: `frontend/src/pages/ConditionDetailPage.test.tsx`
- Create: `frontend/src/components/health-log/HealthLogStats.test.tsx`
- Create: `frontend/src/components/health-log/ConditionCard.test.tsx`

Follow existing test patterns (vitest + testing-library). Test: loading states, empty states, rendering with data, navigation.

**Commit after passing.**

---

## Task 22: Final Verification

**Step 1: Run all backend tests**

```bash
cd backend && ./mvnw test
```

**Step 2: Run frontend lint + tests**

```bash
cd frontend && npm run lint && npm test
```

**Step 3: Update CONTEXT.md and roadmap**

**Step 4: Final commit and push**

---

## Commit Cadence

22 tasks, commit after each. Push after every commit per CLAUDE.md rules.

## Notes for Implementer

- **Encryption pattern**: Copy from `EncounterJournalService` — `encryptOptional()`, `hashEmail()` helpers
- **Ownership checks**: Every get/update/delete must verify `userHash` matches JWT. Throw `IllegalStateException` if not
- **Write-through**: The sync to `health_status` is critical — exposure calculation depends on it. Test thoroughly
- **i18n**: Every UI string in locale files, never hardcoded. Both en_US and es_MX
- **Mobile-first**: Design all components for 375px width first. Use the frontend-design skill for UI work
- **Existing exposure section**: Port the exposure overview JSX from `HealthStatusPage.tsx` into `HealthLogPage.tsx`. Same queries, same display
