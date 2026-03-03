# Week 7: Smart Reminders + Medication Tracking — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add medication tracking, vaccination series tracking, smart reminders (testing/follow-up/medication/vaccination), and expand the Health Log into a tabbed "My Health" page. Also: partner creation quick win + dashboard redesign.

**Architecture:** Unified reminder engine (`reminders` table) schedules all reminder types. Separate domain tables (`medications`, `medication_logs`, `vaccinations`) store feature data. A YAML-driven `HealthCatalogProperties` config defines all available types, dose schedules, frequencies, and heuristic thresholds — no hardcoded enums. Frontend expands the existing Health Log page with tabs (Tests / Meds / Vaccines) and a persistent Upcoming Reminders card. A `@Scheduled` cron job fires due reminders as notifications.

**Tech Stack:** Java 25 + Spring Boot 4.0.2, PostgreSQL (Supabase), React 19 + Vite + TypeScript + TailwindCSS, React Query, react-i18next, Vitest + RTL, Mockito + MockMvc

**Design Doc:** `docs/plans/2026-03-03-week7-reminders-medications-design.md`

---

## Phase A: Backend Foundation

### Task 1: Database Migration 011

**Files:**
- Create: `database/migrations/011_reminders_medications.sql`

**Step 1: Write migration SQL**

Follow the pattern in `010_health_log.sql`: `BEGIN; ... COMMIT;`, rollback in header comments, `uuid_generate_v4()` defaults, `BYTEA` for encrypted fields, indexes on `user_hash` and `scheduled_for`.

5 tables:
1. `medications` — id, user_hash(64), medication_type(32), name_encrypted(BYTEA), dosage_encrypted(BYTEA), start_date(DATE), end_date(DATE nullable), frequency(32), reminder_time(TIME nullable), notes_encrypted(BYTEA nullable), active(BOOL default true), created_at, updated_at
2. `medication_logs` — id, medication_id(FK CASCADE), user_hash(64), logged_at(TIMESTAMPTZ), scheduled_for(DATE), taken(BOOL), notes_encrypted(BYTEA nullable), created_at
3. `vaccinations` — id, user_hash(64), vaccine_type(32), dose_number(INT), total_doses(INT), administered_date(DATE), location_encrypted(BYTEA nullable), notes_encrypted(BYTEA nullable), created_at
4. `reminders` — id, user_hash(64), reminder_type(32), reference_id(UUID nullable), title_encrypted(BYTEA), message_encrypted(BYTEA nullable), scheduled_for(TIMESTAMPTZ), repeat_rule(64 nullable), snoozed_until(TIMESTAMPTZ nullable), completed_at(TIMESTAMPTZ nullable), active(BOOL default true), created_at, updated_at
5. `reminder_settings` — id, user_hash(64 UNIQUE), quiet_hours_start(TIME nullable), quiet_hours_end(TIME nullable), email_digest_enabled(BOOL default false), email_digest_day(12 nullable), testing_reminders_enabled(BOOL default true), medication_reminders_enabled(BOOL default true), vaccination_reminders_enabled(BOOL default true), created_at, updated_at

Indexes:
- `idx_medications_user` on medications(user_hash)
- `idx_medication_logs_medication` on medication_logs(medication_id)
- `idx_medication_logs_user_date` on medication_logs(user_hash, scheduled_for)
- `idx_vaccinations_user` on vaccinations(user_hash)
- `idx_vaccinations_user_type` on vaccinations(user_hash, vaccine_type)
- `idx_reminders_user` on reminders(user_hash)
- `idx_reminders_pending` on reminders(scheduled_for) WHERE completed_at IS NULL AND active = true
- `idx_reminders_reference` on reminders(reference_id) WHERE reference_id IS NOT NULL

**Step 2: Run migration on Supabase**

Run via Supabase SQL Editor.

**Step 3: Commit**

```bash
git add database/migrations/011_reminders_medications.sql
git commit -m "db: add migration 011 — medications, vaccinations, reminders tables"
git push
```

---

### Task 2: Health Catalog Configuration

**Files:**
- Modify: `backend/src/main/resources/application.yaml`
- Create: `backend/src/main/java/app/navilla/config/HealthCatalogProperties.java`

**Step 1: Add health-catalog section to application.yaml**

Under `navilla:`, add the full `health-catalog` block from the design doc (medication-types, frequencies, vaccine-series, testing-heuristics, follow-up-rules). Each entry has a `label-key` (i18n reference), type-specific config (default-frequency, ongoing flag, dose-intervals-days, etc.), and numeric thresholds.

**Step 2: Create HealthCatalogProperties record**

```java
package app.navilla.config;

import java.util.Map;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "navilla.health-catalog")
public record HealthCatalogProperties(
    Map<String, MedicationTypeConfig> medicationTypes,
    Map<String, FrequencyConfig> frequencies,
    Map<String, VaccineSeriesConfig> vaccineSeries,
    TestingHeuristicsConfig testingHeuristics,
    FollowUpRulesConfig followUpRules
) {
  public record MedicationTypeConfig(
      String labelKey,
      String defaultFrequency,
      boolean ongoing
  ) {}

  public record FrequencyConfig(
      Integer hours,
      Integer days
  ) {}

  public record VaccineSeriesConfig(
      String labelKey,
      int totalDoses,
      int[] doseIntervalsDays
  ) {}

  public record TestingHeuristicsConfig(
      int highActivityIntervalDays,
      int moderateActivityIntervalDays,
      int highActivityThreshold,
      int nudgeAfterDays
  ) {}

  public record FollowUpRulesConfig(
      int testOfCureDays,
      int windowPeriodDefaultDays
  ) {}
}
```

**Step 3: Enable config properties scanning**

Add `@EnableConfigurationProperties(HealthCatalogProperties.class)` to `NavillaBackendApplication.java` or a config class.

**Step 4: Write a simple test to verify config binds**

Create `backend/src/test/java/app/navilla/config/HealthCatalogPropertiesTest.java`:
- `@SpringBootTest` + `@ActiveProfiles("test")`
- Inject `HealthCatalogProperties`
- Assert medication types map contains "PREP_DAILY"
- Assert vaccine series "HPV" has totalDoses = 3
- Assert testing heuristics highActivityIntervalDays = 90

**Step 5: Run test**

```bash
cd backend && ./mvnw test -pl . -Dtest=HealthCatalogPropertiesTest
```

**Step 6: Commit**

```bash
git add backend/src/main/resources/application.yaml backend/src/main/java/app/navilla/config/HealthCatalogProperties.java backend/src/test/java/app/navilla/config/HealthCatalogPropertiesTest.java
git commit -m "feat: add config-driven HealthCatalogProperties for medications, vaccines, reminders"
git push
```

---

### Task 3: JPA Entities

**Files:**
- Create: `backend/src/main/java/app/navilla/entity/Medication.java`
- Create: `backend/src/main/java/app/navilla/entity/MedicationLog.java`
- Create: `backend/src/main/java/app/navilla/entity/Vaccination.java`
- Create: `backend/src/main/java/app/navilla/entity/Reminder.java`
- Create: `backend/src/main/java/app/navilla/entity/ReminderSettings.java`

Follow the exact entity pattern: `@Entity`, `@Table`, `@Getter/@Setter/@NoArgsConstructor/@AllArgsConstructor/@Builder`, `@Id @GeneratedValue(strategy = GenerationType.UUID)`, `@Column` with length/nullable constraints, `@CreationTimestamp` for created_at, `@UpdateTimestamp` for updated_at, `@Builder.Default` for booleans.

Key details:
- **Medication**: `medicationType` and `frequency` are `String` (VARCHAR), NOT enums — they reference catalog keys. `nameEncrypted`, `dosageEncrypted`, `notesEncrypted` are `byte[]`. `reminderTime` is `LocalTime`. `startDate`/`endDate` are `LocalDate`.
- **MedicationLog**: `@ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "medication_id")` for the FK. `scheduledFor` is `LocalDate`. `loggedAt` is `OffsetDateTime`.
- **Vaccination**: `vaccineType` is `String`. `doseNumber`/`totalDoses` are `int`. `administeredDate` is `LocalDate`.
- **Reminder**: `reminderType` is `String`. `referenceId` is `UUID` (nullable, no FK constraint — polymorphic reference). `scheduledFor`, `snoozedUntil`, `completedAt` are `OffsetDateTime`.
- **ReminderSettings**: `@Table(uniqueConstraints = @UniqueConstraint(name = "unique_reminder_settings_user", columnNames = {"user_hash"}))`. `quietHoursStart`/`quietHoursEnd` are `LocalTime`.

**Step 1: Create all 5 entities**

**Step 2: Verify app starts (validates schema against entities)**

```bash
cd backend && ./mvnw spring-boot:run
```
(Hibernate `ddl-auto: validate` will catch mismatches)

**Step 3: Commit**

```bash
git add backend/src/main/java/app/navilla/entity/Medication.java backend/src/main/java/app/navilla/entity/MedicationLog.java backend/src/main/java/app/navilla/entity/Vaccination.java backend/src/main/java/app/navilla/entity/Reminder.java backend/src/main/java/app/navilla/entity/ReminderSettings.java
git commit -m "feat: add Medication, MedicationLog, Vaccination, Reminder, ReminderSettings entities"
git push
```

---

### Task 4: Repositories

**Files:**
- Create: `backend/src/main/java/app/navilla/repository/MedicationRepository.java`
- Create: `backend/src/main/java/app/navilla/repository/MedicationLogRepository.java`
- Create: `backend/src/main/java/app/navilla/repository/VaccinationRepository.java`
- Create: `backend/src/main/java/app/navilla/repository/ReminderRepository.java`
- Create: `backend/src/main/java/app/navilla/repository/ReminderSettingsRepository.java`

Follow the pattern: `@Repository public interface XRepository extends JpaRepository<X, UUID>`.

Key query methods:
- **MedicationRepository**: `findByUserHashOrderByActiveDescCreatedAtDesc(String userHash)`, `findByUserHashAndActiveTrue(String userHash)`
- **MedicationLogRepository**: `findByMedicationIdOrderByScheduledForDesc(UUID medicationId)`, `findByMedicationIdAndScheduledForBetween(UUID medicationId, LocalDate start, LocalDate end)`, `countByMedicationIdAndTakenTrueAndScheduledForBetween(UUID medicationId, LocalDate start, LocalDate end)`, `countByMedicationIdAndScheduledForBetween(UUID medicationId, LocalDate start, LocalDate end)`
- **VaccinationRepository**: `findByUserHashOrderByVaccineTypeAscDoseNumberAsc(String userHash)`, `findByUserHashAndVaccineType(String userHash, String vaccineType)`
- **ReminderRepository**: `findByUserHashAndActiveTrueAndCompletedAtIsNullOrderByScheduledForAsc(String userHash)`, `findByUserHashAndActiveTrueAndCompletedAtIsNullAndScheduledForBeforeOrderByScheduledForAsc(String userHash, OffsetDateTime before)`, `findByReferenceIdAndActiveTrueAndCompletedAtIsNull(UUID referenceId)`, `findByActiveTrueAndCompletedAtIsNullAndScheduledForBefore(OffsetDateTime before)`
- **ReminderSettingsRepository**: `Optional<ReminderSettings> findByUserHash(String userHash)`

**Step 1: Create all 5 repositories**

**Step 2: Commit**

```bash
git add backend/src/main/java/app/navilla/repository/MedicationRepository.java backend/src/main/java/app/navilla/repository/MedicationLogRepository.java backend/src/main/java/app/navilla/repository/VaccinationRepository.java backend/src/main/java/app/navilla/repository/ReminderRepository.java backend/src/main/java/app/navilla/repository/ReminderSettingsRepository.java
git commit -m "feat: add repositories for medications, vaccinations, reminders"
git push
```

---

### Task 5: DTOs

**Files:**
- Create all in `backend/src/main/java/app/navilla/dto/`:

**Medication DTOs:**
- `CreateMedicationRequest.java` — record with `@NotBlank @Size(max=32) String medicationType`, `@NotBlank @Size(max=200) String name`, `@Size(max=200) String dosage`, `@NotBlank String startDate`, `String endDate`, `@NotBlank @Size(max=32) String frequency`, `String reminderTime`, `@Size(max=5000) String notes`
- `UpdateMedicationRequest.java` — same fields, all nullable (partial update)
- `MedicationResponse.java` — record: UUID id, String medicationType, String name, String dosage, String startDate, String endDate, String frequency, String reminderTime, String notes, boolean active, String createdAt, String updatedAt
- `LogDoseRequest.java` — record: `@NotBlank String scheduledFor`, `boolean taken`, `@Size(max=5000) String notes`
- `MedicationAdherenceResponse.java` — record: String month, int totalDays, int takenCount, int missedCount, double adherenceRate, List<DoseLogEntry> logs
- `DoseLogEntry.java` — record: UUID id, String scheduledFor, boolean taken, String loggedAt, String notes

**Vaccination DTOs:**
- `CreateVaccinationRequest.java` — record: `@NotBlank @Size(max=32) String vaccineType`, `@NotNull Integer doseNumber`, `@NotBlank String administeredDate`, `@Size(max=200) String location`, `@Size(max=5000) String notes`
- `UpdateVaccinationRequest.java` — same fields, nullable
- `VaccinationResponse.java` — record: UUID id, String vaccineType, int doseNumber, int totalDoses, String administeredDate, String location, String notes, String createdAt
- `VaccineSeriesResponse.java` — record: String vaccineType, String labelKey, int totalDoses, int completedDoses, boolean complete, String nextDoseDate, List<VaccinationResponse> doses

**Reminder DTOs:**
- `ReminderResponse.java` — record: UUID id, String reminderType, UUID referenceId, String title, String message, String scheduledFor, String repeatRule, String snoozedUntil, String completedAt, boolean active, String createdAt
- `SnoozeReminderRequest.java` — record: `@NotBlank String until`
- `ReminderSettingsResponse.java` — record: String quietHoursStart, String quietHoursEnd, boolean emailDigestEnabled, String emailDigestDay, boolean testingRemindersEnabled, boolean medicationRemindersEnabled, boolean vaccinationRemindersEnabled
- `UpdateReminderSettingsRequest.java` — record: String quietHoursStart, String quietHoursEnd, Boolean emailDigestEnabled, @Size(max=12) String emailDigestDay, Boolean testingRemindersEnabled, Boolean medicationRemindersEnabled, Boolean vaccinationRemindersEnabled

**Catalog DTO:**
- `CatalogResponse.java` — record: Map<String, MedicationTypeInfo> medicationTypes, Map<String, FrequencyInfo> frequencies, Map<String, VaccineSeriesInfo> vaccineSeries
- Nested records: `MedicationTypeInfo(String labelKey, String defaultFrequency, boolean ongoing)`, `FrequencyInfo(Integer hours, Integer days)`, `VaccineSeriesInfo(String labelKey, int totalDoses, int[] doseIntervalsDays)`

All request DTOs use `@Valid` + `@Size`/`@NotBlank`/`@NotNull` per project rules.

**Step 1: Create all DTOs**

**Step 2: Commit**

```bash
git add backend/src/main/java/app/navilla/dto/
git commit -m "feat: add DTOs for medications, vaccinations, reminders, catalog"
git push
```

---

## Phase B: Backend Services

### Task 6: MedicationService

**Files:**
- Create: `backend/src/main/java/app/navilla/service/MedicationService.java`
- Create: `backend/src/test/java/app/navilla/service/MedicationServiceTest.java`

**Step 1: Write tests first**

Follow the pattern in `HealthLogServiceTest.java`: `@ExtendWith(MockitoExtension.class)`, `@Mock` all dependencies, `@InjectMocks` the service, `mockJwt()` helper.

Test cases (~15 tests):
- `@Nested CreateMedication`:
  - should save medication with encryption and return response
  - should create linked reminder when reminderTime is set
  - should validate medication type exists in catalog
  - should set active=true by default
- `@Nested ListMedications`:
  - should return medications ordered by active desc, created desc
  - should decrypt name and notes in response
- `@Nested UpdateMedication`:
  - should update fields and recalculate linked reminder
  - should reject update for medication not owned by user
- `@Nested DeleteMedication`:
  - should set active=false and deactivate linked reminders
- `@Nested LogDose`:
  - should create medication log entry
  - should reject dose for inactive medication
- `@Nested GetAdherence`:
  - should calculate adherence rate for given month
  - should return zero adherence when no logs exist

**Step 2: Run tests to verify they fail**

```bash
cd backend && ./mvnw test -Dtest=MedicationServiceTest
```

**Step 3: Implement MedicationService**

Follow `HealthLogService` pattern: `@Slf4j @Service @RequiredArgsConstructor`, inject repos + EncryptionService + HealthCatalogProperties + ReminderRepository. Use `@Transactional` for writes, `@Transactional(readOnly = true)` for reads.

Key implementation details:
- `create()`: Validate `medicationType` exists in `catalogProperties.medicationTypes()`. Encrypt name, dosage, notes. Save. If reminderTime is set, create a Reminder with `reminderType="MEDICATION"`, `referenceId=medication.id`, `scheduledFor` = today at reminderTime, `repeatRule` = frequency from catalog.
- `logDose()`: Create MedicationLog. Verify medication is active and owned by user.
- `getAdherence()`: Query logs for the given month range. Calculate taken/total/rate.
- `delete()`: Set `active=false`. Find reminders with `referenceId=medication.id` and set `active=false`.

**Step 4: Run tests to verify they pass**

```bash
cd backend && ./mvnw test -Dtest=MedicationServiceTest
```

**Step 5: Commit**

```bash
git add backend/src/main/java/app/navilla/service/MedicationService.java backend/src/test/java/app/navilla/service/MedicationServiceTest.java
git commit -m "feat: add MedicationService with tests — CRUD, dose logging, adherence"
git push
```

---

### Task 7: VaccinationService

**Files:**
- Create: `backend/src/main/java/app/navilla/service/VaccinationService.java`
- Create: `backend/src/test/java/app/navilla/service/VaccinationServiceTest.java`

**Step 1: Write tests first (~12 tests)**

- should log a dose and return response with decrypted fields
- should validate vaccine type exists in catalog
- should auto-calculate totalDoses from catalog if not provided
- should create next-dose reminder when series is incomplete
- should NOT create reminder when series is complete
- should calculate next dose date from catalog doseIntervalsDays
- should list series grouped by vaccine type with completion status
- should mark series as complete when all doses logged
- should reject dose number exceeding totalDoses
- should update dose and recalculate reminder
- should delete dose and recalculate series/reminders

**Step 2: Run tests to verify fail**

**Step 3: Implement VaccinationService**

Key logic:
- `create()`: Validate vaccineType in catalog. Encrypt location/notes. Save. Count existing doses for this user + vaccineType. If `doseNumber < totalDoses`, calculate next dose date from `doseIntervalsDays[doseNumber]` relative to `administeredDate`, create VACCINATION reminder.
- `listSeries()`: Group vaccinations by vaccineType. For each group, build `VaccineSeriesResponse` with completed count, completeness flag, and next due date.
- `delete()`: Remove dose. Re-query doses for that vaccineType. Recalculate completion and update/remove reminders.

**Step 4: Run tests to verify pass**

**Step 5: Commit**

```bash
git add backend/src/main/java/app/navilla/service/VaccinationService.java backend/src/test/java/app/navilla/service/VaccinationServiceTest.java
git commit -m "feat: add VaccinationService with tests — dose tracking, series completion, auto-reminders"
git push
```

---

### Task 8: ReminderService

**Files:**
- Create: `backend/src/main/java/app/navilla/service/ReminderService.java`
- Create: `backend/src/test/java/app/navilla/service/ReminderServiceTest.java`

**Step 1: Write tests first (~10 tests)**

- should list active reminders ordered by scheduledFor
- should return upcoming reminders within N days
- should snooze reminder and set snoozedUntil
- should complete reminder and set completedAt
- should toggle reminder active flag
- should delete reminder
- should reject snooze/complete/toggle for reminder not owned by user
- should get reminder settings (create default if none exist)
- should update reminder settings (upsert)

**Step 2: Run tests to verify fail**

**Step 3: Implement ReminderService**

Straightforward CRUD. `getSettings()` uses `findByUserHash()` and creates a default `ReminderSettings` if none exists. `updateSettings()` does an upsert — find or create, then apply non-null fields from request.

**Step 4: Run tests to verify pass**

**Step 5: Commit**

```bash
git add backend/src/main/java/app/navilla/service/ReminderService.java backend/src/test/java/app/navilla/service/ReminderServiceTest.java
git commit -m "feat: add ReminderService with tests — list, snooze, complete, toggle, settings"
git push
```

---

### Task 9: ReminderCalculationEngine

**Files:**
- Create: `backend/src/main/java/app/navilla/service/ReminderCalculationEngine.java`
- Create: `backend/src/test/java/app/navilla/service/ReminderCalculationEngineTest.java`

**Step 1: Write tests first (~10 tests)**

- should generate TESTING reminder when encounters since last test exceed threshold
- should use high-activity interval when unique partners >= highActivityThreshold
- should use moderate-activity interval when unique partners < threshold
- should generate nudge when no test in nudgeAfterDays with any activity
- should NOT generate reminder when no journal entries exist
- should NOT generate duplicate reminder if active TESTING reminder already exists
- should generate FOLLOW_UP reminder after POSITIVE health log result
- should set follow-up scheduledFor to testOfCureDays after test date
- should generate window-period reminder after unprotected encounter
- should not generate anything for user with no activity

**Step 2: Run tests to verify fail**

**Step 3: Implement ReminderCalculationEngine**

```java
@Slf4j
@Service
@RequiredArgsConstructor
public class ReminderCalculationEngine {

  private final EncounterJournalRepository journalRepository;
  private final TestVisitRepository testVisitRepository;
  private final TestResultRepository testResultRepository;
  private final ReminderRepository reminderRepository;
  private final EncryptionService encryptionService;
  private final HealthCatalogProperties catalogProperties;

  /**
   * Evaluate a single user and create/update reminders as needed.
   * Called by the scheduler job for each active user.
   */
  @Transactional
  public void evaluateUser(String userHash) {
    evaluateTestingReminders(userHash);
    evaluateFollowUpReminders(userHash);
  }

  private void evaluateTestingReminders(String userHash) {
    // 1. Find most recent test visit for this user
    // 2. Count journal entries since that test date
    // 3. Count unique partners since that test date
    // 4. Apply heuristics from catalogProperties.testingHeuristics()
    // 5. If threshold exceeded and no active TESTING reminder exists, create one
  }

  private void evaluateFollowUpReminders(String userHash) {
    // 1. Find recent POSITIVE test results without a matching FOLLOW_UP reminder
    // 2. Create FOLLOW_UP reminder scheduled testOfCureDays after test date
  }
}
```

**Step 4: Run tests to verify pass**

**Step 5: Commit**

```bash
git add backend/src/main/java/app/navilla/service/ReminderCalculationEngine.java backend/src/test/java/app/navilla/service/ReminderCalculationEngineTest.java
git commit -m "feat: add ReminderCalculationEngine — testing heuristics + follow-up rules"
git push
```

---

### Task 10: NotificationType Extension + Scheduler Job

**Files:**
- Modify: `backend/src/main/java/app/navilla/entity/NotificationType.java`
- Modify: `backend/src/main/java/app/navilla/NavillaBackendApplication.java` (add `@EnableScheduling`)
- Create: `backend/src/main/java/app/navilla/service/ReminderSchedulerJob.java`
- Create: `backend/src/test/java/app/navilla/service/ReminderSchedulerJobTest.java`

**Step 1: Add new NotificationType values**

Add to the enum: `MEDICATION_REMINDER`, `VACCINATION_REMINDER`, `TESTING_REMINDER`, `FOLLOW_UP_REMINDER`

**Step 2: Add @EnableScheduling**

Add `@EnableScheduling` to `NavillaBackendApplication.java`.

**Step 3: Write scheduler tests (~5 tests)**

- should find due reminders and create notifications
- should skip reminders in user's quiet hours
- should advance repeating reminders to next occurrence after firing
- should skip snoozed reminders where snoozedUntil > now
- should call ReminderCalculationEngine.evaluateUser for active users

**Step 4: Implement ReminderSchedulerJob**

```java
@Slf4j
@Service
@RequiredArgsConstructor
public class ReminderSchedulerJob {

  private final ReminderRepository reminderRepository;
  private final ReminderSettingsRepository reminderSettingsRepository;
  private final NotificationService notificationService;
  private final ReminderCalculationEngine calculationEngine;
  private final EncryptionService encryptionService;
  private final UserRepository userRepository;

  @Scheduled(cron = "0 0 6 * * *") // Daily at 6 AM
  @Transactional
  public void processReminders() {
    log.info("Starting daily reminder processing");

    // 1. Run calculation engine for all users with recent activity
    // 2. Find all due reminders (scheduledFor <= now, active, not completed, not snoozed)
    // 3. For each: check quiet hours, create notification, advance if repeating
  }
}
```

**Step 5: Run tests**

```bash
cd backend && ./mvnw test -Dtest=ReminderSchedulerJobTest
```

**Step 6: Commit**

```bash
git add backend/src/main/java/app/navilla/entity/NotificationType.java backend/src/main/java/app/navilla/NavillaBackendApplication.java backend/src/main/java/app/navilla/service/ReminderSchedulerJob.java backend/src/test/java/app/navilla/service/ReminderSchedulerJobTest.java
git commit -m "feat: add ReminderSchedulerJob + @EnableScheduling + new notification types"
git push
```

---

## Phase C: Backend Controllers

### Task 11: CatalogController

**Files:**
- Create: `backend/src/main/java/app/navilla/controller/CatalogController.java`
- Create: `backend/src/test/java/app/navilla/controller/CatalogControllerTest.java`

**Step 1: Write integration tests (~3 tests)**

- GET /api/catalog should return 200 with medication types, vaccine series, frequencies
- GET /api/catalog should work without authentication (public endpoint)
- response should contain expected keys (PREP_DAILY, HPV, DAILY, etc.)

**Step 2: Implement controller**

```java
@RestController
@RequestMapping("/api/catalog")
@RequiredArgsConstructor
public class CatalogController {

  private final HealthCatalogProperties catalogProperties;

  @GetMapping
  public ResponseEntity<CatalogResponse> getCatalog() {
    return ResponseEntity.ok(mapToResponse(catalogProperties));
  }
}
```

**Step 3: Add `/api/catalog` to SecurityConfig's public endpoints**

Modify `SecurityConfig.java`: add `/api/catalog` to the permitAll list alongside `/api/health`, `/actuator/health`, etc.

**Step 4: Run tests**

**Step 5: Commit**

```bash
git add backend/src/main/java/app/navilla/controller/CatalogController.java backend/src/test/java/app/navilla/controller/CatalogControllerTest.java backend/src/main/java/app/navilla/config/SecurityConfig.java
git commit -m "feat: add CatalogController — public endpoint for health catalog config"
git push
```

---

### Task 12: MedicationController

**Files:**
- Create: `backend/src/main/java/app/navilla/controller/MedicationController.java`
- Create: `backend/src/test/java/app/navilla/controller/MedicationControllerTest.java`

**Step 1: Write integration tests (~10 tests)**

Follow `HealthLogControllerTest` pattern: `@SpringBootTest`, `@AutoConfigureMockMvc`, `@ActiveProfiles("test")`, `@BeforeEach` cleanup, JWT injection with `.with(jwt().jwt(builder -> ...))`.

Test cases:
- POST /api/medications — should create and return medication
- POST /api/medications — should reject missing required fields (400)
- POST /api/medications — should reject invalid medication type (400)
- GET /api/medications — should list user's medications
- GET /api/medications/{id} — should return single medication
- PUT /api/medications/{id} — should update medication
- DELETE /api/medications/{id} — should deactivate
- POST /api/medications/{id}/log — should log a dose
- GET /api/medications/{id}/adherence?month=2026-03 — should return stats
- All endpoints should return 401 without auth

**Step 2: Implement controller**

```java
@RestController
@RequestMapping("/api/medications")
@RequiredArgsConstructor
public class MedicationController {

  private final MedicationService medicationService;

  @GetMapping
  public ResponseEntity<List<MedicationResponse>> list(@AuthenticationPrincipal Jwt jwt) { ... }

  @PostMapping
  public ResponseEntity<MedicationResponse> create(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody CreateMedicationRequest request) { ... }

  @GetMapping("/{id}")
  public ResponseEntity<MedicationResponse> get(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) { ... }

  @PutMapping("/{id}")
  public ResponseEntity<MedicationResponse> update(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id, @Valid @RequestBody UpdateMedicationRequest request) { ... }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> delete(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) { ... }

  @PostMapping("/{id}/log")
  public ResponseEntity<DoseLogEntry> logDose(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id, @Valid @RequestBody LogDoseRequest request) { ... }

  @GetMapping("/{id}/adherence")
  public ResponseEntity<MedicationAdherenceResponse> adherence(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id, @RequestParam String month) { ... }
}
```

**Step 3: Run tests**

**Step 4: Commit**

```bash
git add backend/src/main/java/app/navilla/controller/MedicationController.java backend/src/test/java/app/navilla/controller/MedicationControllerTest.java
git commit -m "feat: add MedicationController with integration tests — 7 endpoints"
git push
```

---

### Task 13: VaccinationController

**Files:**
- Create: `backend/src/main/java/app/navilla/controller/VaccinationController.java`
- Create: `backend/src/test/java/app/navilla/controller/VaccinationControllerTest.java`

**Step 1: Write integration tests (~6 tests)**

- POST /api/vaccinations — should log dose and return response
- POST /api/vaccinations — should reject invalid vaccine type
- GET /api/vaccinations — should list series grouped by type
- PUT /api/vaccinations/{id} — should update dose
- DELETE /api/vaccinations/{id} — should remove dose
- should return 401 without auth

**Step 2: Implement controller**

4 endpoints: GET list, POST create, PUT update, DELETE remove. Delegates to VaccinationService.

**Step 3: Run tests**

**Step 4: Commit**

```bash
git add backend/src/main/java/app/navilla/controller/VaccinationController.java backend/src/test/java/app/navilla/controller/VaccinationControllerTest.java
git commit -m "feat: add VaccinationController with integration tests — 4 endpoints"
git push
```

---

### Task 14: ReminderController

**Files:**
- Create: `backend/src/main/java/app/navilla/controller/ReminderController.java`
- Create: `backend/src/test/java/app/navilla/controller/ReminderControllerTest.java`

**Step 1: Write integration tests (~8 tests)**

- GET /api/reminders — list active reminders
- GET /api/reminders/upcoming?days=7 — upcoming
- POST /api/reminders/{id}/snooze — snooze with body
- POST /api/reminders/{id}/complete — complete
- POST /api/reminders/{id}/toggle — toggle
- DELETE /api/reminders/{id} — delete
- GET /api/reminders/settings — get or create default
- PUT /api/reminders/settings — update settings

**Step 2: Implement controller**

6 reminder endpoints + 2 settings endpoints. Settings endpoints delegate to ReminderService.

**Step 3: Run tests**

**Step 4: Commit**

```bash
git add backend/src/main/java/app/navilla/controller/ReminderController.java backend/src/test/java/app/navilla/controller/ReminderControllerTest.java
git commit -m "feat: add ReminderController with integration tests — 8 endpoints"
git push
```

---

### Task 15: Run full backend test suite

**Step 1: Run all backend tests**

```bash
cd backend && ./mvnw test
```

Expected: All tests pass (existing 159 + ~60-80 new = ~220-240 total).

**Step 2: Fix any failures**

**Step 3: Commit any fixes**

```bash
git add -A && git commit -m "fix: resolve integration issues from Week 7 backend" && git push
```

---

## Phase D: Frontend Foundation

### Task 16: API Types + Client Methods

**Files:**
- Modify: `frontend/src/lib/api.ts`

**Step 1: Add TypeScript interfaces**

At the top of api.ts (near existing type definitions), add:

```typescript
// ── Catalog ──
export interface CatalogResponse {
  medicationTypes: Record<string, { labelKey: string; defaultFrequency: string; ongoing: boolean }>;
  frequencies: Record<string, { hours?: number; days?: number }>;
  vaccineSeries: Record<string, { labelKey: string; totalDoses: number; doseIntervalsDays: number[] }>;
}

// ── Medications ──
export interface Medication {
  id: string;
  medicationType: string;
  name: string;
  dosage: string | null;
  startDate: string;
  endDate: string | null;
  frequency: string;
  reminderTime: string | null;
  notes: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMedicationRequest {
  medicationType: string;
  name: string;
  dosage?: string;
  startDate: string;
  endDate?: string;
  frequency: string;
  reminderTime?: string;
  notes?: string;
}

export interface UpdateMedicationRequest extends Partial<CreateMedicationRequest> {}

export interface LogDoseRequest {
  scheduledFor: string;
  taken: boolean;
  notes?: string;
}

export interface DoseLogEntry {
  id: string;
  scheduledFor: string;
  taken: boolean;
  loggedAt: string;
  notes: string | null;
}

export interface MedicationAdherence {
  month: string;
  totalDays: number;
  takenCount: number;
  missedCount: number;
  adherenceRate: number;
  logs: DoseLogEntry[];
}

// ── Vaccinations ──
export interface VaccinationDose {
  id: string;
  vaccineType: string;
  doseNumber: number;
  totalDoses: number;
  administeredDate: string;
  location: string | null;
  notes: string | null;
  createdAt: string;
}

export interface VaccineSeries {
  vaccineType: string;
  labelKey: string;
  totalDoses: number;
  completedDoses: number;
  complete: boolean;
  nextDoseDate: string | null;
  doses: VaccinationDose[];
}

export interface CreateVaccinationRequest {
  vaccineType: string;
  doseNumber: number;
  administeredDate: string;
  location?: string;
  notes?: string;
}

export interface UpdateVaccinationRequest extends Partial<CreateVaccinationRequest> {}

// ── Reminders ──
export interface Reminder {
  id: string;
  reminderType: string;
  referenceId: string | null;
  title: string;
  message: string | null;
  scheduledFor: string;
  repeatRule: string | null;
  snoozedUntil: string | null;
  completedAt: string | null;
  active: boolean;
  createdAt: string;
}

export interface ReminderSettings {
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
  emailDigestEnabled: boolean;
  emailDigestDay: string | null;
  testingRemindersEnabled: boolean;
  medicationRemindersEnabled: boolean;
  vaccinationRemindersEnabled: boolean;
}

export interface UpdateReminderSettingsRequest extends Partial<ReminderSettings> {}
```

**Step 2: Add API methods**

In the `api` object, add new namespaces:

```typescript
catalog: {
  get: async (): Promise<CatalogResponse> =>
    fetch(`${BASE}/api/catalog`).then(r => r.json()),
},
medications: {
  list: async (token: string): Promise<Medication[]> =>
    apiRequest('/api/medications', token),
  create: async (token: string, data: CreateMedicationRequest): Promise<Medication> =>
    apiRequest('/api/medications', token, { method: 'POST', body: JSON.stringify(data), headers: { 'Content-Type': 'application/json' } }),
  get: async (token: string, id: string): Promise<Medication> =>
    apiRequest(`/api/medications/${id}`, token),
  update: async (token: string, id: string, data: UpdateMedicationRequest): Promise<Medication> =>
    apiRequest(`/api/medications/${id}`, token, { method: 'PUT', body: JSON.stringify(data), headers: { 'Content-Type': 'application/json' } }),
  delete: async (token: string, id: string): Promise<void> =>
    apiRequest(`/api/medications/${id}`, token, { method: 'DELETE' }),
  logDose: async (token: string, id: string, data: LogDoseRequest): Promise<DoseLogEntry> =>
    apiRequest(`/api/medications/${id}/log`, token, { method: 'POST', body: JSON.stringify(data), headers: { 'Content-Type': 'application/json' } }),
  adherence: async (token: string, id: string, month: string): Promise<MedicationAdherence> =>
    apiRequest(`/api/medications/${id}/adherence?month=${month}`, token),
},
vaccinations: {
  list: async (token: string): Promise<VaccineSeries[]> =>
    apiRequest('/api/vaccinations', token),
  create: async (token: string, data: CreateVaccinationRequest): Promise<VaccinationDose> =>
    apiRequest('/api/vaccinations', token, { method: 'POST', body: JSON.stringify(data), headers: { 'Content-Type': 'application/json' } }),
  update: async (token: string, id: string, data: UpdateVaccinationRequest): Promise<VaccinationDose> =>
    apiRequest(`/api/vaccinations/${id}`, token, { method: 'PUT', body: JSON.stringify(data), headers: { 'Content-Type': 'application/json' } }),
  delete: async (token: string, id: string): Promise<void> =>
    apiRequest(`/api/vaccinations/${id}`, token, { method: 'DELETE' }),
},
reminders: {
  list: async (token: string): Promise<Reminder[]> =>
    apiRequest('/api/reminders', token),
  upcoming: async (token: string, days: number): Promise<Reminder[]> =>
    apiRequest(`/api/reminders/upcoming?days=${days}`, token),
  snooze: async (token: string, id: string, until: string): Promise<Reminder> =>
    apiRequest(`/api/reminders/${id}/snooze`, token, { method: 'POST', body: JSON.stringify({ until }), headers: { 'Content-Type': 'application/json' } }),
  complete: async (token: string, id: string): Promise<Reminder> =>
    apiRequest(`/api/reminders/${id}/complete`, token, { method: 'POST' }),
  toggle: async (token: string, id: string): Promise<Reminder> =>
    apiRequest(`/api/reminders/${id}/toggle`, token, { method: 'POST' }),
  delete: async (token: string, id: string): Promise<void> =>
    apiRequest(`/api/reminders/${id}`, token, { method: 'DELETE' }),
  settings: {
    get: async (token: string): Promise<ReminderSettings> =>
      apiRequest('/api/reminders/settings', token),
    update: async (token: string, data: UpdateReminderSettingsRequest): Promise<ReminderSettings> =>
      apiRequest('/api/reminders/settings', token, { method: 'PUT', body: JSON.stringify(data), headers: { 'Content-Type': 'application/json' } }),
  },
},
```

**Step 3: Commit**

```bash
git add frontend/src/lib/api.ts
git commit -m "feat: add API types + client methods for medications, vaccinations, reminders, catalog"
git push
```

---

### Task 17: React Query Hooks

**Files:**
- Create: `frontend/src/hooks/useCatalog.ts`
- Create: `frontend/src/hooks/useMedications.ts`
- Create: `frontend/src/hooks/useVaccinations.ts`
- Create: `frontend/src/hooks/useReminders.ts`

Follow the exact pattern from `useHealthLog.ts`: import `useQuery`/`useMutation` from `@tanstack/react-query`, import `useAuth`, import `api` from `lib/api`.

**useCatalog.ts:**
- `useCatalog()` — `queryKey: ['catalog']`, `staleTime: 30 * 60 * 1000` (30 min — reference data), `queryFn: () => api.catalog.get()`, no auth required

**useMedications.ts:**
- `useMedications()` — queryKey `['medications']`, staleTime 2 min
- `useMedication(id)` — queryKey `['medications', id]`
- `useCreateMedication()` — invalidates `['medications']` + `['reminders']`
- `useUpdateMedication()` — invalidates `['medications']` + `['reminders']`
- `useDeleteMedication()` — invalidates `['medications']` + `['reminders']`
- `useLogDose()` — invalidates `['medications']` + `['reminders']`
- `useAdherence(id, month)` — queryKey `['medications', id, 'adherence', month]`

**useVaccinations.ts:**
- `useVaccinations()` — queryKey `['vaccinations']`, staleTime 2 min
- `useCreateVaccination()` — invalidates `['vaccinations']` + `['reminders']`
- `useUpdateVaccination()` — invalidates `['vaccinations']` + `['reminders']`
- `useDeleteVaccination()` — invalidates `['vaccinations']` + `['reminders']`

**useReminders.ts:**
- `useReminders()` — queryKey `['reminders']`, staleTime 1 min
- `useUpcomingReminders(days)` — queryKey `['reminders', 'upcoming', days]`, staleTime 1 min
- `useSnoozeReminder()` — invalidates `['reminders']`
- `useCompleteReminder()` — invalidates `['reminders']`
- `useToggleReminder()` — invalidates `['reminders']`
- `useDeleteReminder()` — invalidates `['reminders']`
- `useReminderSettings()` — queryKey `['reminders', 'settings']`, staleTime 5 min
- `useUpdateReminderSettings()` — invalidates `['reminders', 'settings']`

**Step 1: Create all 4 hook files**

**Step 2: Commit**

```bash
git add frontend/src/hooks/useCatalog.ts frontend/src/hooks/useMedications.ts frontend/src/hooks/useVaccinations.ts frontend/src/hooks/useReminders.ts
git commit -m "feat: add React Query hooks for catalog, medications, vaccinations, reminders"
git push
```

---

### Task 18: i18n Keys

**Files:**
- Modify: `frontend/src/locales/en_US.json`
- Modify: `frontend/src/locales/es_MX.json`

Add keys under new top-level sections: `"medications"`, `"vaccinations"`, `"reminders"`. Also update `"nav"` and `"healthLog"` sections.

**Key sections to add (~80-100 keys per locale):**

```json
"nav": {
  "health": "My Health"  // rename from "Health Log"
},
"myHealth": {
  "title": "My Health",
  "tabs": {
    "tests": "Tests",
    "medications": "Meds",
    "vaccines": "Vaccines"
  },
  "upcoming": {
    "title": "Upcoming",
    "noReminders": "No upcoming reminders",
    "seeAll": "See all",
    "dueToday": "Today",
    "dueTomorrow": "Tomorrow",
    "dueInDays": "in {{count}} days",
    "overdue": "Overdue"
  }
},
"medications": {
  "add": "Add Medication",
  "edit": "Edit Medication",
  "name": "Medication Name",
  "type": "Type",
  "frequency": "Frequency",
  "startDate": "Start Date",
  "endDate": "End Date",
  "reminderTime": "Reminder Time",
  "notes": "Notes",
  "active": "Active",
  "inactive": "Past",
  "logDose": "Log Dose",
  "taken": "Taken",
  "missed": "Missed",
  "adherence": "Adherence",
  "adherenceRate": "{{rate}}% this month",
  "takenCount": "{{taken}} of {{total}}",
  "noMedications": "No medications tracked yet",
  "noMedicationsDescription": "Track PrEP, treatments, and other medications here",
  "type": {
    "prepDaily": "PrEP (Daily)",
    "prepInjectable": "PrEP (Injectable)",
    "treatmentCourse": "Treatment Course",
    "doxyPep": "DoxyPEP"
  },
  "frequency": {
    "daily": "Daily",
    "every2Months": "Every 2 Months",
    "weekly": "Weekly",
    "asNeeded": "As Needed",
    "custom": "Custom"
  }
},
"vaccinations": {
  "add": "Log Dose",
  "edit": "Edit Dose",
  "doseNumber": "Dose {{current}} of {{total}}",
  "complete": "Complete",
  "nextDose": "Next dose: {{date}}",
  "administeredDate": "Date Administered",
  "location": "Location",
  "noVaccinations": "No vaccinations tracked yet",
  "noVaccinationsDescription": "Track your HPV, Hepatitis, and Mpox vaccination series here",
  "type": {
    "hpv": "HPV",
    "hepatitisB": "Hepatitis B",
    "mpox": "Mpox",
    "hepatitisA": "Hepatitis A"
  }
},
"reminders": {
  "settings": "Reminder Settings",
  "quietHours": "Quiet Hours",
  "quietHoursStart": "Start",
  "quietHoursEnd": "End",
  "emailDigest": "Email Digest",
  "emailDigestDay": "Send on",
  "testingReminders": "Testing Reminders",
  "medicationReminders": "Medication Reminders",
  "vaccinationReminders": "Vaccination Reminders",
  "snooze": "Snooze",
  "snooze1Day": "1 day",
  "snooze3Days": "3 days",
  "snooze1Week": "1 week",
  "markDone": "Mark Done",
  "enable": "Enable",
  "disable": "Disable"
},
"journal": {
  "addPartner": "Add Partner",
  "partnerAlias": "Partner Alias",
  "createPartner": "Create Partner",
  "partnerNotes": "Notes (optional)"
}
```

Provide equivalent Spanish translations in `es_MX.json`.

**Step 1: Add all keys to en_US.json**

**Step 2: Add all keys to es_MX.json with Spanish translations**

**Step 3: Commit**

```bash
git add frontend/src/locales/en_US.json frontend/src/locales/es_MX.json
git commit -m "i18n: add locale keys for medications, vaccinations, reminders, partner creation (en_US + es_MX)"
git push
```

---

## Phase E: Frontend Components

### Task 19: Partner Creation Quick Win

**Files:**
- Create: `frontend/src/components/journal/CreatePartnerModal.tsx`
- Create: `frontend/src/components/journal/CreatePartnerModal.test.tsx`
- Modify: `frontend/src/components/journal/JournalPartnersTab.tsx`
- Modify: `frontend/src/components/journal/JournalPartnersTab.test.tsx`

**Step 1: Write CreatePartnerModal test**

- should render alias input and submit button
- should call useCreatePartner on submit with alias
- should close modal on success
- should show error on failure

**Step 2: Implement CreatePartnerModal**

Simple modal: alias input (required, maxLength=200) + optional notes textarea (maxLength=5000) + Create button. Uses `useCreatePartner()` hook. Follows `TestVisitModal` pattern (isOpen/onClose props, key-based reset).

**Step 3: Update JournalPartnersTab**

Add "Add Partner" button at top. Add `useState<boolean>` for modal open state. Render `CreatePartnerModal`.

**Step 4: Update JournalPartnersTab test**

- should render "Add Partner" button
- should open modal on button click

**Step 5: Run tests**

```bash
cd frontend && npm test -- --run
```

**Step 6: Commit**

```bash
git add frontend/src/components/journal/CreatePartnerModal.tsx frontend/src/components/journal/CreatePartnerModal.test.tsx frontend/src/components/journal/JournalPartnersTab.tsx frontend/src/components/journal/JournalPartnersTab.test.tsx
git commit -m "feat: add partner creation modal + button in Partners tab"
git push
```

---

### Task 20: Medication Components

**Files:**
- Create: `frontend/src/components/reminders/MedicationModal.tsx`
- Create: `frontend/src/components/reminders/MedicationModal.test.tsx`
- Create: `frontend/src/components/reminders/MedicationCard.tsx`
- Create: `frontend/src/components/reminders/MedicationCard.test.tsx`
- Create: `frontend/src/components/reminders/DoseLogButton.tsx`
- Create: `frontend/src/components/reminders/MedicationAdherenceChart.tsx`

**Step 1: Write MedicationCard tests**

- should render medication name, type, frequency
- should show today's adherence status (taken/not yet)
- should show adherence bar with percentage
- should separate active from inactive medications

**Step 2: Implement MedicationCard**

Shows: medication name, type label (from catalog via i18n key), frequency label, "Today: taken/not yet" status, adherence bar (progress element). "Log Dose" quick action button. Tap navigates to detail page.

**Step 3: Write MedicationModal tests**

- should render form fields (type dropdown, name, frequency, start date, reminder time)
- should populate type dropdown from catalog
- should call useCreateMedication on submit
- should pre-fill fields in edit mode

**Step 4: Implement MedicationModal**

Form fields: medication type (select from catalog), name (input maxLength=200), dosage (input maxLength=200), frequency (select from catalog), start date (date input), end date (optional date input), reminder time (time input), notes (textarea maxLength=5000). Uses `useCatalog()` for dropdown options. Create/edit mode via optional `medication` prop.

**Step 5: Implement DoseLogButton**

Compact button: "Log Dose" → on click calls `useLogDose()` with `{ scheduledFor: today, taken: true }`. Shows checkmark after success. Can be used inline on MedicationCard.

**Step 6: Implement MedicationAdherenceChart**

Monthly calendar grid (7 columns, Mon-Sun). Each day cell shows a colored dot: green (taken), red (missed), gray (future/no data). Used on MedicationDetailPage.

**Step 7: Run tests**

```bash
cd frontend && npm test -- --run
```

**Step 8: Commit**

```bash
git add frontend/src/components/reminders/
git commit -m "feat: add MedicationCard, MedicationModal, DoseLogButton, AdherenceChart components"
git push
```

---

### Task 21: Vaccination Components

**Files:**
- Create: `frontend/src/components/reminders/VaccinationModal.tsx`
- Create: `frontend/src/components/reminders/VaccinationModal.test.tsx`
- Create: `frontend/src/components/reminders/VaccinationSeriesCard.tsx`
- Create: `frontend/src/components/reminders/VaccinationSeriesCard.test.tsx`

**Step 1: Write VaccinationSeriesCard tests**

- should render vaccine type name and dose progress
- should show visual dots for completed and remaining doses
- should show "Complete" badge when all doses logged
- should show next dose date when series incomplete

**Step 2: Implement VaccinationSeriesCard**

Visual: vaccine type label, progress dots (●───●───○ pattern), completed doses / total, next dose date if incomplete. Green checkmark if complete. Tap to expand/edit doses.

**Step 3: Write VaccinationModal tests**

- should render vaccine type dropdown from catalog
- should auto-calculate dose number based on existing doses
- should call useCreateVaccination on submit

**Step 4: Implement VaccinationModal**

Form: vaccine type (select from catalog), dose number (auto-calculated but editable), administered date, location (optional, maxLength=200), notes (optional, maxLength=5000).

**Step 5: Run tests**

**Step 6: Commit**

```bash
git add frontend/src/components/reminders/VaccinationModal.tsx frontend/src/components/reminders/VaccinationModal.test.tsx frontend/src/components/reminders/VaccinationSeriesCard.tsx frontend/src/components/reminders/VaccinationSeriesCard.test.tsx
git commit -m "feat: add VaccinationSeriesCard + VaccinationModal components"
git push
```

---

### Task 22: Reminder Components

**Files:**
- Create: `frontend/src/components/reminders/ReminderCard.tsx`
- Create: `frontend/src/components/reminders/ReminderCard.test.tsx`
- Create: `frontend/src/components/reminders/UpcomingReminders.tsx`
- Create: `frontend/src/components/reminders/UpcomingReminders.test.tsx`
- Create: `frontend/src/components/reminders/ReminderSettingsModal.tsx`
- Create: `frontend/src/components/reminders/ReminderSettingsModal.test.tsx`

**Step 1: Write ReminderCard tests**

- should render reminder title and relative time
- should show type icon (pill for medication, syringe for vaccination, clipboard for testing)
- should call snooze/complete on button click

**Step 2: Implement ReminderCard**

Compact chip/card: icon + title + relative time ("Today", "in 3 days"). Action buttons: checkmark (complete), clock (snooze). Snooze opens a small dropdown: 1 day, 3 days, 1 week.

**Step 3: Write UpcomingReminders tests**

- should render horizontal scrollable row of ReminderCards
- should show "No upcoming reminders" when empty
- should show gear icon for settings
- should collapse to single line when empty

**Step 4: Implement UpcomingReminders**

Uses `useUpcomingReminders(14)` to fetch next 2 weeks. Renders as horizontal scrollable `div` with `overflow-x-auto flex gap-3`. Max 5 chips visible, "See all" link if more. Gear icon opens ReminderSettingsModal.

**Step 5: Write ReminderSettingsModal tests**

- should render toggle switches for each reminder type
- should render quiet hours inputs
- should call useUpdateReminderSettings on save

**Step 6: Implement ReminderSettingsModal**

Form: quiet hours (two time inputs), email digest toggle + day select, per-type toggles (testing, medication, vaccination). Uses `useReminderSettings()` to load current state, `useUpdateReminderSettings()` to save.

**Step 7: Run tests**

**Step 8: Commit**

```bash
git add frontend/src/components/reminders/ReminderCard.tsx frontend/src/components/reminders/ReminderCard.test.tsx frontend/src/components/reminders/UpcomingReminders.tsx frontend/src/components/reminders/UpcomingReminders.test.tsx frontend/src/components/reminders/ReminderSettingsModal.tsx frontend/src/components/reminders/ReminderSettingsModal.test.tsx
git commit -m "feat: add ReminderCard, UpcomingReminders, ReminderSettingsModal components"
git push
```

---

### Task 23: Medication Detail Page

**Files:**
- Create: `frontend/src/pages/MedicationDetailPage.tsx`
- Create: `frontend/src/pages/MedicationDetailPage.test.tsx`
- Modify: `frontend/src/router.tsx` (add route)

**Step 1: Write tests**

- should render medication details (name, type, frequency, start date)
- should render adherence chart for current month
- should render dose log list
- should show edit button that opens MedicationModal
- should navigate back to My Health page

**Step 2: Implement page**

Header: medication name + edit button. Stats: adherence rate, streak count. MedicationAdherenceChart (current month). Dose history list (scrollable). Back link to `/health-log`.

**Step 3: Add route to router.tsx**

```typescript
{
  path: 'health-log/medication/:id',
  element: (
    <ProtectedRoute>
      <MedicationDetailPage />
    </ProtectedRoute>
  ),
},
```

**Step 4: Run tests**

**Step 5: Commit**

```bash
git add frontend/src/pages/MedicationDetailPage.tsx frontend/src/pages/MedicationDetailPage.test.tsx frontend/src/router.tsx
git commit -m "feat: add MedicationDetailPage with adherence chart + route"
git push
```

---

### Task 24: Expand Health Log into My Health Page (Tabs)

**Files:**
- Modify: `frontend/src/pages/HealthLogPage.tsx`
- Modify: `frontend/src/pages/HealthLogPage.test.tsx`
- Modify: `frontend/src/components/layout/Header.tsx` (rename nav label)

This is the biggest frontend task. We're refactoring HealthLogPage to add tabs.

**Step 1: Update HealthLogPage tests**

- should render "My Health" title
- should render Upcoming Reminders card
- should render three tabs: Tests, Meds, Vaccines
- should show Tests tab content by default
- should switch to Medications tab on click
- should switch to Vaccines tab on click
- Tests tab should render existing health log content

**Step 2: Refactor HealthLogPage**

Structure:
```tsx
function HealthLogPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'tests' | 'medications' | 'vaccines'>('tests');

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <h1 className="text-2xl font-bold">{t('myHealth.title')}</h1>

      {/* Upcoming Reminders */}
      <UpcomingReminders />

      {/* Tab Bar */}
      <div className="flex border-b border-border">
        {(['tests', 'medications', 'vaccines'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-primary text-primary'
                : 'border-transparent text-muted hover:text-foreground'
            }`}
          >
            {t(`myHealth.tabs.${tab}`)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'tests' && <TestsTabContent />}
      {activeTab === 'medications' && <MedicationsTabContent />}
      {activeTab === 'vaccines' && <VaccinesTabContent />}
    </div>
  );
}
```

Extract current Health Log content into a `TestsTabContent` component (inline or separate file — keep it inline if under 100 lines). Create `MedicationsTabContent` (uses `useMedications()`, renders MedicationCards + add button + MedicationModal). Create `VaccinesTabContent` (uses `useVaccinations()`, renders VaccinationSeriesCards + add button + VaccinationModal).

**Step 3: Update Header nav label**

In `Header.tsx`, the nav item that links to `/health-log` currently uses `t('nav.health')` which was "Health Log". The locale key is already updated in Task 18 to "My Health".

**Step 4: Run tests**

```bash
cd frontend && npm test -- --run
```

**Step 5: Commit**

```bash
git add frontend/src/pages/HealthLogPage.tsx frontend/src/pages/HealthLogPage.test.tsx frontend/src/components/layout/Header.tsx
git commit -m "feat: expand Health Log into tabbed My Health page — Tests, Meds, Vaccines tabs + Upcoming Reminders"
git push
```

---

## Phase F: Polish

### Task 25: Dashboard Redesign

**Files:**
- Modify: `frontend/src/pages/DashboardPage.tsx`
- Modify: `frontend/src/pages/DashboardPage.test.tsx`

**Step 1: Read current DashboardPage to understand existing layout**

**Step 2: Design the new layout**

Use the `frontend-design` skill for the dashboard redesign. The dashboard should include:
- "Next Up" widget showing 2-3 nearest upcoming reminders (uses `useUpcomingReminders(7)`)
- Quick stats: days since last test, active medications count, vaccination completeness
- Existing dashboard content (connections, exposure overview) reorganized
- Mobile-first card layout

**Step 3: Implement redesign**

**Step 4: Update tests**

**Step 5: Run all frontend tests**

```bash
cd frontend && npm test -- --run && npm run lint
```

**Step 6: Commit**

```bash
git add frontend/src/pages/DashboardPage.tsx frontend/src/pages/DashboardPage.test.tsx
git commit -m "feat: redesign Dashboard with Next Up widget + health quick stats"
git push
```

---

### Task 26: Final Integration + Full Test Suite

**Step 1: Run full backend tests**

```bash
cd backend && ./mvnw test
```

Expected: ~220-240 tests passing.

**Step 2: Run full frontend tests + lint**

```bash
cd frontend && npm test -- --run && npm run lint
```

Expected: ~280-300 tests passing, no lint errors.

**Step 3: Build frontend**

```bash
cd frontend && npm run build:full
```

Verify build succeeds (TypeScript compilation + Vite build + prerender).

**Step 4: Update CONTEXT.md**

Add Week 7 session notes with:
- Migration 011 (5 new tables)
- HealthCatalogProperties (config-driven types)
- 5 new backend services + scheduler job
- 5 new controllers (20 endpoints)
- Expanded "My Health" page with tabs
- Partner creation quick win
- Dashboard redesign
- Test counts

**Step 5: Update UPCOMING_FEATURES_AND_ROADMAP.md**

Mark Week 7 as complete in the progress snapshot section.

**Step 6: Commit**

```bash
git add CONTEXT.md UPCOMING_FEATURES_AND_ROADMAP.md
git commit -m "docs: mark Week 7 complete — smart reminders + medication tracking"
git push
```

---

## Dependency Graph

```
Task 1 (Migration) ─────────────────────────────────┐
Task 2 (Config) ──────────────────────────────────┐  │
                                                   ▼  ▼
Task 3 (Entities) ← depends on 1 (schema match)
Task 4 (Repositories) ← depends on 3
Task 5 (DTOs) ← independent (can parallel with 3-4)
                                                   │
                 ┌─────────────────────────────────┘
                 ▼
Task 6 (MedicationService) ← depends on 2,3,4,5
Task 7 (VaccinationService) ← depends on 2,3,4,5
Task 8 (ReminderService) ← depends on 3,4,5
Task 9 (CalcEngine) ← depends on 2,4
Task 10 (Scheduler) ← depends on 8,9
                 │
                 ▼
Tasks 11-14 (Controllers) ← depend on respective services
Task 15 (Full test suite) ← depends on 11-14
                 │
                 ▼
Task 16 (API types) ← independent of backend (just types)
Task 17 (Hooks) ← depends on 16
Task 18 (i18n) ← independent
                 │
                 ▼
Task 19 (Partner creation) ← depends on 18
Task 20 (Medication components) ← depends on 17,18
Task 21 (Vaccination components) ← depends on 17,18
Task 22 (Reminder components) ← depends on 17,18
Task 23 (Medication detail page) ← depends on 20
Task 24 (My Health page) ← depends on 20,21,22
Task 25 (Dashboard) ← depends on 22
Task 26 (Final integration) ← depends on all
```

**Parallelization opportunities:**
- Tasks 3+5 can run in parallel
- Tasks 6+7+8 can run in parallel (independent services)
- Tasks 11+12+13+14 can run in parallel (independent controllers)
- Tasks 16+18 can run in parallel
- Tasks 19+20+21+22 can run in parallel (independent component groups)
