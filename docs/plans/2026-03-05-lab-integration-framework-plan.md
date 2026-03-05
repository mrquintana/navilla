# Lab Integration Framework — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a pluggable lab verification framework with two mock providers, so real lab integrations (Chopo, Salud Digna) require only one new class + a YAML entry.

**Architecture:** Interface + Strategy pattern. Each lab is a Spring `@Component` implementing `LabProvider`. A `LabProviderRegistry` auto-discovers all providers. `LabVerificationService` orchestrates the flow: validate → call provider → store raw response → update test_visit/test_results/health_status. Mock providers behind dev-mode gate for development.

**Tech Stack:** Java 25, Spring Boot 4.0.2, JPA/Hibernate, AES-256-GCM encryption, application.yml config, React 19 + TypeScript frontend.

**Design doc:** `docs/plans/2026-03-05-lab-integration-framework-design.md`

---

## Dependency Graph

```
Task 1 (Migration + Entity) → Task 2 (Interfaces) → Task 3 (Config Properties) → Task 4 (Registry)
                                                                                       ↓
Task 5 (Mock Endpoints) → Task 6 (Mock Providers) ←──────────────────────────────── Task 4
                                                       ↓
                                                  Task 7 (Verification Service) → Task 8 (API Controller)
                                                                                       ↓
                                                  Task 9 (Frontend API + Types) → Task 10 (Frontend Verification UI)
                                                                                       ↓
                                                                                  Task 11 (i18n) → Task 12 (Docs)
```

---

### Task 1: Migration + Entity Updates

**Files:**
- Create: `database/migrations/015_lab_verification.sql`
- Modify: `backend/src/main/java/app/navilla/entity/TestVisit.java`
- Modify: `backend/src/main/java/app/navilla/entity/Lab.java`
- Delete: `backend/src/main/java/app/navilla/entity/LabProvider.java` (the enum)
- Modify: Any files that reference the `LabProvider` enum

**Context:** The existing `LabProvider` enum (`CHOPO, SALUD_DIGNA, OTHER`) conflicts with our new `LabProvider` interface name. Also, an enum is too rigid — adding a new lab requires a code change. We refactor `Lab.provider` from enum to plain String. The DB column is already `varchar(32)` (stored as STRING by `@Enumerated(EnumType.STRING)`), so no actual DB schema change needed for that — only Java-side refactoring.

**Step 1: Write migration 015**

```sql
-- Migration 015: Lab verification system
-- Adds raw_lab_response_encrypted column to test_visits for storing original lab responses
-- Widens provider column to accommodate longer provider codes
--
-- Rollback:
-- ALTER TABLE test_visits DROP COLUMN IF EXISTS raw_lab_response_encrypted;
-- ALTER TABLE labs ALTER COLUMN provider TYPE varchar(32);

-- Store encrypted raw lab API response for audit trail / re-parsing
ALTER TABLE test_visits ADD COLUMN raw_lab_response_encrypted BYTEA;

-- Widen provider column to support longer provider codes from config
ALTER TABLE labs ALTER COLUMN provider TYPE varchar(50);
```

**Step 2: Update TestVisit entity — add rawLabResponseEncrypted field**

Add after the existing `notesEncrypted` field in `TestVisit.java`:

```java
@Column(name = "raw_lab_response_encrypted")
private byte[] rawLabResponseEncrypted;
```

Add getter/setter (or if using Lombok `@Data`/`@Getter`/`@Setter`, it's automatic).

**Step 3: Refactor Lab entity — remove enum, use String**

In `Lab.java`, change:
```java
// BEFORE:
@Enumerated(EnumType.STRING)
@Column(name = "provider", nullable = false, length = 32)
private LabProvider provider;

// AFTER:
@Column(name = "provider", nullable = false, length = 50)
private String provider;
```

**Step 4: Delete the LabProvider enum file**

Delete `backend/src/main/java/app/navilla/entity/LabProvider.java`.

**Step 5: Fix all compilation errors from enum removal**

Search for all references to the old `LabProvider` enum across the codebase. Update:
- `HealthLogService.java` — any place that calls `Lab.getProvider()` or uses `LabProvider.fromValue()`
- `LabRepository.java` — if any queries filter by provider enum
- DTOs — `TestVisitResponse.labProvider` field (already a String, so should be fine)
- Tests — `HealthLogServiceTest.java`, `HealthLogControllerTest.java`

Replace `LabProvider.CHOPO` with `"CHOPO"`, `LabProvider.SALUD_DIGNA` with `"SALUD_DIGNA"`, etc.

**Step 6: Run backend tests**

Run: `cd backend && ./mvnw test`
Expected: All tests pass (compilation errors fixed, no schema change needed for existing tests)

**Step 7: Commit**

```bash
git add database/migrations/015_lab_verification.sql \
  backend/src/main/java/app/navilla/entity/TestVisit.java \
  backend/src/main/java/app/navilla/entity/Lab.java
git add -u  # pick up deleted enum + all reference fixes
git commit -m "feat: migration 015 + refactor Lab.provider from enum to String"
git push
```

---

### Task 2: Core Interfaces + Record Types

**Files:**
- Create: `backend/src/main/java/app/navilla/lab/LabProvider.java` (interface)
- Create: `backend/src/main/java/app/navilla/lab/LabVerificationResult.java`
- Create: `backend/src/main/java/app/navilla/lab/LabTestResult.java`
- Create: `backend/src/main/java/app/navilla/lab/ValidationResult.java`
- Test: `backend/src/test/java/app/navilla/lab/LabTestResultTest.java`

**Step 1: Create the lab package directory**

Run: `mkdir -p backend/src/main/java/app/navilla/lab`

**Step 2: Create LabProvider interface**

```java
package app.navilla.lab;

import java.util.Map;

/**
 * Contract for lab verification providers.
 * Each lab implements this interface as a Spring @Component.
 * The registry auto-discovers all implementations.
 */
public interface LabProvider {

    /**
     * Provider code matching application.yml and labs.provider column.
     * Examples: "CHOPO", "SALUD_DIGNA", "MOCK_DEMO_MX"
     */
    String getProviderCode();

    /**
     * Validate per-visit credentials before calling external API.
     * @param visitCredentials per-request fields (orderId, etc.)
     * @return validation result with errors if invalid
     */
    ValidationResult validateInput(Map<String, String> visitCredentials);

    /**
     * Call lab API and return raw response + parsed results.
     * @param visitCredentials per-request fields (orderId, etc.)
     * @param labCredentials persistent fields from lab_credentials EAV (patientId, etc.)
     * @return verification result with raw response and parsed test results
     */
    LabVerificationResult verify(
            Map<String, String> visitCredentials,
            Map<String, String> labCredentials);
}
```

**Step 3: Create LabVerificationResult record**

```java
package app.navilla.lab;

import java.util.List;

public record LabVerificationResult(
        boolean success,
        byte[] rawResponse,
        String contentType,
        List<LabTestResult> results,
        String errorCode,
        String errorMessage
) {
    public static LabVerificationResult success(
            byte[] rawResponse, String contentType, List<LabTestResult> results) {
        return new LabVerificationResult(true, rawResponse, contentType, results, null, null);
    }

    public static LabVerificationResult failure(String errorCode, String errorMessage) {
        return new LabVerificationResult(false, null, null, List.of(), errorCode, errorMessage);
    }
}
```

**Step 4: Create LabTestResult record**

```java
package app.navilla.lab;

import java.time.LocalDate;

public record LabTestResult(
        String patientName,
        LocalDate testDate,
        String conditionCode,
        String result,
        String resultValue,
        String referenceRange,
        String labReferenceId
) {}
```

**Step 5: Create ValidationResult record**

```java
package app.navilla.lab;

import java.util.List;
import java.util.Map;

public record ValidationResult(
        boolean valid,
        Map<String, String> fieldErrors
) {
    public static ValidationResult ok() {
        return new ValidationResult(true, Map.of());
    }

    public static ValidationResult invalid(Map<String, String> fieldErrors) {
        return new ValidationResult(false, fieldErrors);
    }
}
```

**Step 6: Write basic unit test**

```java
package app.navilla.lab;

import org.junit.jupiter.api.Test;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import static org.assertj.core.api.Assertions.assertThat;

class LabVerificationResultTest {

    @Test
    void successFactory_createsSuccessResult() {
        var result = LabVerificationResult.success(
                new byte[]{1, 2, 3}, "application/json",
                List.of(new LabTestResult("John", LocalDate.of(2026, 3, 1),
                        "CHLAMYDIA", "NEGATIVE", null, null, "ORD-123")));

        assertThat(result.success()).isTrue();
        assertThat(result.results()).hasSize(1);
        assertThat(result.errorCode()).isNull();
    }

    @Test
    void failureFactory_createsFailureResult() {
        var result = LabVerificationResult.failure("NOT_FOUND", "Order not found");

        assertThat(result.success()).isFalse();
        assertThat(result.results()).isEmpty();
        assertThat(result.errorCode()).isEqualTo("NOT_FOUND");
    }

    @Test
    void validationResult_okAndInvalid() {
        assertThat(ValidationResult.ok().valid()).isTrue();
        assertThat(ValidationResult.ok().fieldErrors()).isEmpty();

        var invalid = ValidationResult.invalid(Map.of("orderId", "Required"));
        assertThat(invalid.valid()).isFalse();
        assertThat(invalid.fieldErrors()).containsKey("orderId");
    }
}
```

**Step 7: Run tests**

Run: `cd backend && ./mvnw test -pl . -Dtest=LabVerificationResultTest`
Expected: 3 tests PASS

**Step 8: Commit**

```bash
git add backend/src/main/java/app/navilla/lab/ \
  backend/src/test/java/app/navilla/lab/
git commit -m "feat: add LabProvider interface and result types"
git push
```

---

### Task 3: Configuration Properties

**Files:**
- Create: `backend/src/main/java/app/navilla/lab/LabProviderProperties.java`
- Modify: `backend/src/main/resources/application.yaml`
- Test: `backend/src/test/java/app/navilla/lab/LabProviderPropertiesTest.java`

**Step 1: Create LabProviderProperties**

```java
package app.navilla.lab;

import org.springframework.boot.context.properties.ConfigurationProperties;
import java.util.List;

@ConfigurationProperties(prefix = "navilla.labs")
public record LabProviderProperties(
        List<LabConfig> providers
) {
    public record LabConfig(
            String code,
            String name,
            String nameEs,
            boolean enabled,
            String baseUrl,
            List<FieldConfig> requiredFields
    ) {}

    public record FieldConfig(
            String key,
            String label,
            String labelEs
    ) {}

    public LabProviderProperties {
        if (providers == null) {
            providers = List.of();
        }
    }
}
```

**Step 2: Add YAML config**

Add to `backend/src/main/resources/application.yaml` under the `navilla:` section:

```yaml
  labs:
    providers:
      - code: MOCK_DEMO_MX
        name: "Lab Demo MX"
        name-es: "Lab Demo MX"
        enabled: ${NAVILLA_DEV_MODE:false}
        base-url: "http://localhost:${server.port:8080}/api/dev/mock-labs/demo-mx"
        required-fields:
          - key: orderId
            label: "Order ID"
            label-es: "Número de orden"
          - key: patientId
            label: "Patient ID"
            label-es: "ID del paciente"
      - code: MOCK_EXPRESS
        name: "Lab Express"
        name-es: "Lab Express"
        enabled: ${NAVILLA_DEV_MODE:false}
        base-url: "http://localhost:${server.port:8080}/api/dev/mock-labs/express"
        required-fields:
          - key: orderId
            label: "Order ID"
            label-es: "Número de orden"
```

**Step 3: Enable config properties scanning**

Check if `@ConfigurationPropertiesScan` or `@EnableConfigurationProperties` exists on the main application class. If not, add `@EnableConfigurationProperties(LabProviderProperties.class)` to the main class or create a config class:

```java
package app.navilla.lab;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(LabProviderProperties.class)
public class LabConfiguration {
}
```

**Step 4: Write test**

```java
package app.navilla.lab;

import org.junit.jupiter.api.Test;
import java.util.List;
import static org.assertj.core.api.Assertions.assertThat;

class LabProviderPropertiesTest {

    @Test
    void defaultProvidersIsEmptyList() {
        var props = new LabProviderProperties(null);
        assertThat(props.providers()).isEmpty();
    }

    @Test
    void parsesProviderConfig() {
        var field = new LabProviderProperties.FieldConfig("orderId", "Order ID", "Número de orden");
        var config = new LabProviderProperties.LabConfig(
                "MOCK_DEMO_MX", "Lab Demo MX", "Lab Demo MX",
                true, "http://localhost:8080/api/dev/mock-labs/demo-mx",
                List.of(field));
        var props = new LabProviderProperties(List.of(config));

        assertThat(props.providers()).hasSize(1);
        assertThat(props.providers().getFirst().code()).isEqualTo("MOCK_DEMO_MX");
        assertThat(props.providers().getFirst().requiredFields()).hasSize(1);
        assertThat(props.providers().getFirst().requiredFields().getFirst().key()).isEqualTo("orderId");
    }
}
```

**Step 5: Run tests**

Run: `cd backend && ./mvnw test`
Expected: All tests pass

**Step 6: Commit**

```bash
git add backend/src/main/java/app/navilla/lab/LabProviderProperties.java \
  backend/src/main/java/app/navilla/lab/LabConfiguration.java \
  backend/src/main/resources/application.yaml \
  backend/src/test/java/app/navilla/lab/LabProviderPropertiesTest.java
git commit -m "feat: add lab provider YAML configuration and properties binding"
git push
```

---

### Task 4: LabProviderRegistry

**Files:**
- Create: `backend/src/main/java/app/navilla/lab/LabProviderRegistry.java`
- Test: `backend/src/test/java/app/navilla/lab/LabProviderRegistryTest.java`

**Step 1: Write failing test**

```java
package app.navilla.lab;

import org.junit.jupiter.api.Test;
import java.util.List;
import java.util.Map;
import static org.assertj.core.api.Assertions.assertThat;

class LabProviderRegistryTest {

    private final LabProvider mockProvider = new LabProvider() {
        @Override public String getProviderCode() { return "TEST_LAB"; }
        @Override public ValidationResult validateInput(Map<String, String> creds) {
            return ValidationResult.ok();
        }
        @Override public LabVerificationResult verify(Map<String, String> visit, Map<String, String> lab) {
            return LabVerificationResult.failure("NOT_IMPLEMENTED", "Mock");
        }
    };

    @Test
    void findsRegisteredProvider() {
        var registry = new LabProviderRegistry(List.of(mockProvider));
        assertThat(registry.getProvider("TEST_LAB")).isPresent();
        assertThat(registry.getProvider("TEST_LAB").get().getProviderCode()).isEqualTo("TEST_LAB");
    }

    @Test
    void returnsEmptyForUnknownProvider() {
        var registry = new LabProviderRegistry(List.of(mockProvider));
        assertThat(registry.getProvider("UNKNOWN")).isEmpty();
    }

    @Test
    void handlesEmptyProviderList() {
        var registry = new LabProviderRegistry(List.of());
        assertThat(registry.getProvider("ANYTHING")).isEmpty();
    }
}
```

**Step 2: Run test to verify it fails**

Run: `cd backend && ./mvnw test -pl . -Dtest=LabProviderRegistryTest`
Expected: FAIL — class not found

**Step 3: Implement LabProviderRegistry**

```java
package app.navilla.lab;

import org.springframework.stereotype.Component;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

@Component
public class LabProviderRegistry {

    private final Map<String, LabProvider> providers;

    public LabProviderRegistry(List<LabProvider> providers) {
        this.providers = providers.stream()
                .collect(Collectors.toMap(LabProvider::getProviderCode, Function.identity()));
    }

    public Optional<LabProvider> getProvider(String code) {
        return Optional.ofNullable(providers.get(code));
    }
}
```

**Step 4: Run tests**

Run: `cd backend && ./mvnw test -pl . -Dtest=LabProviderRegistryTest`
Expected: 3 tests PASS

**Step 5: Commit**

```bash
git add backend/src/main/java/app/navilla/lab/LabProviderRegistry.java \
  backend/src/test/java/app/navilla/lab/LabProviderRegistryTest.java
git commit -m "feat: add LabProviderRegistry with auto-discovery"
git push
```

---

### Task 5: Mock Lab Endpoints

**Files:**
- Create: `backend/src/main/java/app/navilla/controller/MockLabController.java`
- Test: `backend/src/test/java/app/navilla/controller/MockLabControllerTest.java`

**Context:** Dev-only endpoints that simulate external lab APIs. These respond with JSON payloads that look like real lab responses. The mock providers (Task 6) will call these endpoints via HTTP.

**Step 1: Write MockLabController**

```java
package app.navilla.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/dev/mock-labs")
public class MockLabController {

    @Value("${navilla.dev-mode:false}")
    private boolean devMode;

    @GetMapping("/demo-mx/results")
    public ResponseEntity<Map<String, Object>> demoMxResults(
            @RequestParam String orderId,
            @RequestParam String patientId) {

        if (!devMode) {
            return ResponseEntity.notFound().build();
        }

        if (orderId.isBlank() || patientId.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "INVALID_INPUT",
                    "message", "orderId and patientId are required"));
        }

        // Deterministic results based on orderId hash
        int hash = orderId.hashCode();
        boolean hasPositive = (hash % 3 == 0);

        var results = new ArrayList<Map<String, Object>>();
        results.add(Map.of(
                "condition", "CHLAMYDIA",
                "result", hasPositive ? "POSITIVE" : "NEGATIVE",
                "resultValue", hasPositive ? "Detected" : "Not detected",
                "referenceRange", "Not detected"));
        results.add(Map.of(
                "condition", "GONORRHEA",
                "result", "NEGATIVE",
                "resultValue", "Not detected",
                "referenceRange", "Not detected"));
        results.add(Map.of(
                "condition", "SYPHILIS",
                "result", "NEGATIVE",
                "resultValue", "Non-reactive",
                "referenceRange", "Non-reactive"));
        results.add(Map.of(
                "condition", "HIV",
                "result", "NEGATIVE",
                "resultValue", "Non-reactive",
                "referenceRange", "Non-reactive"));

        return ResponseEntity.ok(Map.of(
                "status", "SUCCESS",
                "orderId", orderId,
                "patientName", "Demo Patient " + patientId,
                "testDate", LocalDate.now().minusDays(3).toString(),
                "labName", "Lab Demo MX",
                "results", results));
    }

    @GetMapping("/express/results")
    public ResponseEntity<Map<String, Object>> expressResults(
            @RequestParam String orderId) {

        if (!devMode) {
            return ResponseEntity.notFound().build();
        }

        if (orderId.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "INVALID_INPUT",
                    "message", "orderId is required"));
        }

        int hash = orderId.hashCode();
        boolean hasPositive = (hash % 5 == 0);

        var results = new ArrayList<Map<String, Object>>();
        results.add(Map.of(
                "condition", "HIV",
                "result", hasPositive ? "REACTIVE" : "NON_REACTIVE",
                "resultValue", hasPositive ? "Reactive" : "Non-reactive",
                "referenceRange", "Non-reactive"));
        results.add(Map.of(
                "condition", "SYPHILIS",
                "result", "NEGATIVE",
                "resultValue", "Non-reactive",
                "referenceRange", "Non-reactive"));

        return ResponseEntity.ok(Map.of(
                "status", "SUCCESS",
                "orderId", orderId,
                "patientName", "Express Patient",
                "testDate", LocalDate.now().minusDays(1).toString(),
                "labName", "Lab Express",
                "results", results));
    }
}
```

**Step 2: Write integration test**

```java
package app.navilla.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = {"navilla.dev-mode=true"})
class MockLabControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void demoMx_returnsResults() throws Exception {
        mockMvc.perform(get("/api/dev/mock-labs/demo-mx/results")
                        .param("orderId", "ORD-001")
                        .param("patientId", "PAT-001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SUCCESS"))
                .andExpect(jsonPath("$.patientName").value("Demo Patient PAT-001"))
                .andExpect(jsonPath("$.results").isArray())
                .andExpect(jsonPath("$.results.length()").value(4));
    }

    @Test
    void demoMx_deterministic_sameOrderSameResults() throws Exception {
        // Same orderId should always return same results
        mockMvc.perform(get("/api/dev/mock-labs/demo-mx/results")
                        .param("orderId", "ORD-100")
                        .param("patientId", "PAT-001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.results[0].result").exists());
    }

    @Test
    void express_returnsResults() throws Exception {
        mockMvc.perform(get("/api/dev/mock-labs/express/results")
                        .param("orderId", "EXP-001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SUCCESS"))
                .andExpect(jsonPath("$.results.length()").value(2));
    }

    @Test
    void demoMx_missingParams_returnsBadRequest() throws Exception {
        mockMvc.perform(get("/api/dev/mock-labs/demo-mx/results")
                        .param("orderId", "")
                        .param("patientId", ""))
                .andExpect(status().isBadRequest());
    }
}
```

**Note:** These tests may need to account for the existing Spring Security config. Check how `DevTestController` tests handle auth — the mock lab endpoints should be publicly accessible (no JWT) since they simulate an external lab API. Add the `/api/dev/mock-labs/**` path to the security config's permit list if needed.

**Step 3: Run tests**

Run: `cd backend && ./mvnw test -pl . -Dtest=MockLabControllerTest`
Expected: 4 tests PASS

**Step 4: Commit**

```bash
git add backend/src/main/java/app/navilla/controller/MockLabController.java \
  backend/src/test/java/app/navilla/controller/MockLabControllerTest.java
git commit -m "feat: add dev-only mock lab API endpoints"
git push
```

---

### Task 6: Mock Lab Providers

**Files:**
- Create: `backend/src/main/java/app/navilla/lab/providers/MockDemoMxProvider.java`
- Create: `backend/src/main/java/app/navilla/lab/providers/MockExpressProvider.java`
- Test: `backend/src/test/java/app/navilla/lab/providers/MockDemoMxProviderTest.java`
- Test: `backend/src/test/java/app/navilla/lab/providers/MockExpressProviderTest.java`

**Context:** These providers call the mock lab endpoints from Task 5 via HTTP, parse the JSON response, and return `LabVerificationResult`. They demonstrate the full provider lifecycle.

**Step 1: Create MockDemoMxProvider**

```java
package app.navilla.lab.providers;

import app.navilla.lab.*;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Component
public class MockDemoMxProvider implements LabProvider {

    private final LabProviderProperties properties;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient = HttpClient.newHttpClient();

    public MockDemoMxProvider(LabProviderProperties properties, ObjectMapper objectMapper) {
        this.properties = properties;
        this.objectMapper = objectMapper;
    }

    @Override
    public String getProviderCode() {
        return "MOCK_DEMO_MX";
    }

    @Override
    public ValidationResult validateInput(Map<String, String> visitCredentials) {
        var errors = new java.util.HashMap<String, String>();
        if (visitCredentials.getOrDefault("orderId", "").isBlank()) {
            errors.put("orderId", "Order ID is required");
        }
        return errors.isEmpty() ? ValidationResult.ok() : ValidationResult.invalid(errors);
    }

    @Override
    public LabVerificationResult verify(
            Map<String, String> visitCredentials,
            Map<String, String> labCredentials) {

        try {
            String orderId = visitCredentials.get("orderId");
            String patientId = labCredentials.getOrDefault("patientId",
                    visitCredentials.getOrDefault("patientId", ""));

            var config = properties.providers().stream()
                    .filter(p -> p.code().equals(getProviderCode()))
                    .findFirst()
                    .orElseThrow(() -> new IllegalStateException("Provider config not found"));

            URI uri = URI.create(config.baseUrl() + "/results?orderId="
                    + orderId + "&patientId=" + patientId);

            HttpRequest request = HttpRequest.newBuilder().uri(uri).GET().build();
            HttpResponse<byte[]> response = httpClient.send(request,
                    HttpResponse.BodyHandlers.ofByteArray());

            if (response.statusCode() != 200) {
                return LabVerificationResult.failure("LAB_ERROR",
                        "Lab returned status " + response.statusCode());
            }

            JsonNode json = objectMapper.readTree(response.body());
            String status = json.path("status").asText();
            if (!"SUCCESS".equals(status)) {
                return LabVerificationResult.failure("LAB_ERROR",
                        json.path("message").asText("Unknown error"));
            }

            List<LabTestResult> results = new ArrayList<>();
            String patientName = json.path("patientName").asText(null);
            LocalDate testDate = LocalDate.parse(json.path("testDate").asText());
            String labRef = json.path("orderId").asText();

            for (JsonNode r : json.path("results")) {
                String resultStr = r.path("result").asText();
                // Normalize REACTIVE/NON_REACTIVE to POSITIVE/NEGATIVE
                String normalized = switch (resultStr.toUpperCase()) {
                    case "REACTIVE" -> "POSITIVE";
                    case "NON_REACTIVE" -> "NEGATIVE";
                    default -> resultStr.toUpperCase();
                };
                results.add(new LabTestResult(
                        patientName,
                        testDate,
                        r.path("condition").asText(),
                        normalized,
                        r.path("resultValue").asText(null),
                        r.path("referenceRange").asText(null),
                        labRef));
            }

            return LabVerificationResult.success(response.body(), "application/json", results);

        } catch (Exception e) {
            return LabVerificationResult.failure("CONNECTION_ERROR", e.getMessage());
        }
    }
}
```

**Step 2: Create MockExpressProvider**

Same pattern but simpler — only `orderId` required, no `patientId`:

```java
package app.navilla.lab.providers;

import app.navilla.lab.*;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Component
public class MockExpressProvider implements LabProvider {

    private final LabProviderProperties properties;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient = HttpClient.newHttpClient();

    public MockExpressProvider(LabProviderProperties properties, ObjectMapper objectMapper) {
        this.properties = properties;
        this.objectMapper = objectMapper;
    }

    @Override
    public String getProviderCode() {
        return "MOCK_EXPRESS";
    }

    @Override
    public ValidationResult validateInput(Map<String, String> visitCredentials) {
        if (visitCredentials.getOrDefault("orderId", "").isBlank()) {
            return ValidationResult.invalid(Map.of("orderId", "Order ID is required"));
        }
        return ValidationResult.ok();
    }

    @Override
    public LabVerificationResult verify(
            Map<String, String> visitCredentials,
            Map<String, String> labCredentials) {

        try {
            String orderId = visitCredentials.get("orderId");

            var config = properties.providers().stream()
                    .filter(p -> p.code().equals(getProviderCode()))
                    .findFirst()
                    .orElseThrow(() -> new IllegalStateException("Provider config not found"));

            URI uri = URI.create(config.baseUrl() + "/results?orderId=" + orderId);

            HttpRequest request = HttpRequest.newBuilder().uri(uri).GET().build();
            HttpResponse<byte[]> response = httpClient.send(request,
                    HttpResponse.BodyHandlers.ofByteArray());

            if (response.statusCode() != 200) {
                return LabVerificationResult.failure("LAB_ERROR",
                        "Lab returned status " + response.statusCode());
            }

            JsonNode json = objectMapper.readTree(response.body());
            if (!"SUCCESS".equals(json.path("status").asText())) {
                return LabVerificationResult.failure("LAB_ERROR",
                        json.path("message").asText("Unknown error"));
            }

            List<LabTestResult> results = new ArrayList<>();
            String patientName = json.path("patientName").asText(null);
            LocalDate testDate = LocalDate.parse(json.path("testDate").asText());
            String labRef = json.path("orderId").asText();

            for (JsonNode r : json.path("results")) {
                String resultStr = r.path("result").asText().toUpperCase();
                String normalized = switch (resultStr) {
                    case "REACTIVE" -> "POSITIVE";
                    case "NON_REACTIVE" -> "NEGATIVE";
                    default -> resultStr;
                };
                results.add(new LabTestResult(
                        patientName, testDate,
                        r.path("condition").asText(),
                        normalized,
                        r.path("resultValue").asText(null),
                        r.path("referenceRange").asText(null),
                        labRef));
            }

            return LabVerificationResult.success(response.body(), "application/json", results);

        } catch (Exception e) {
            return LabVerificationResult.failure("CONNECTION_ERROR", e.getMessage());
        }
    }
}
```

**Step 3: Write unit tests for both providers**

Test validation logic (doesn't need HTTP — unit test only):

```java
package app.navilla.lab.providers;

import org.junit.jupiter.api.Test;
import java.util.Map;
import static org.assertj.core.api.Assertions.assertThat;

class MockDemoMxProviderTest {

    // Use a minimal test that doesn't require Spring context or HTTP
    @Test
    void providerCode() {
        var provider = new MockDemoMxProvider(
                new app.navilla.lab.LabProviderProperties(java.util.List.of()),
                new com.fasterxml.jackson.databind.ObjectMapper());
        assertThat(provider.getProviderCode()).isEqualTo("MOCK_DEMO_MX");
    }

    @Test
    void validateInput_missingOrderId_fails() {
        var provider = new MockDemoMxProvider(
                new app.navilla.lab.LabProviderProperties(java.util.List.of()),
                new com.fasterxml.jackson.databind.ObjectMapper());
        var result = provider.validateInput(Map.of());
        assertThat(result.valid()).isFalse();
        assertThat(result.fieldErrors()).containsKey("orderId");
    }

    @Test
    void validateInput_validOrderId_passes() {
        var provider = new MockDemoMxProvider(
                new app.navilla.lab.LabProviderProperties(java.util.List.of()),
                new com.fasterxml.jackson.databind.ObjectMapper());
        var result = provider.validateInput(Map.of("orderId", "ORD-001"));
        assertThat(result.valid()).isTrue();
    }
}
```

```java
package app.navilla.lab.providers;

import org.junit.jupiter.api.Test;
import java.util.Map;
import static org.assertj.core.api.Assertions.assertThat;

class MockExpressProviderTest {

    @Test
    void providerCode() {
        var provider = new MockExpressProvider(
                new app.navilla.lab.LabProviderProperties(java.util.List.of()),
                new com.fasterxml.jackson.databind.ObjectMapper());
        assertThat(provider.getProviderCode()).isEqualTo("MOCK_EXPRESS");
    }

    @Test
    void validateInput_missingOrderId_fails() {
        var provider = new MockExpressProvider(
                new app.navilla.lab.LabProviderProperties(java.util.List.of()),
                new com.fasterxml.jackson.databind.ObjectMapper());
        var result = provider.validateInput(Map.of());
        assertThat(result.valid()).isFalse();
    }

    @Test
    void validateInput_validOrderId_passes() {
        var provider = new MockExpressProvider(
                new app.navilla.lab.LabProviderProperties(java.util.List.of()),
                new com.fasterxml.jackson.databind.ObjectMapper());
        var result = provider.validateInput(Map.of("orderId", "ORD-001"));
        assertThat(result.valid()).isTrue();
    }
}
```

**Step 4: Run tests**

Run: `cd backend && ./mvnw test -pl . -Dtest="MockDemoMxProviderTest,MockExpressProviderTest"`
Expected: 6 tests PASS

**Step 5: Commit**

```bash
git add backend/src/main/java/app/navilla/lab/providers/ \
  backend/src/test/java/app/navilla/lab/providers/
git commit -m "feat: add MockDemoMx and MockExpress lab providers"
git push
```

---

### Task 7: LabVerificationService

**Files:**
- Create: `backend/src/main/java/app/navilla/service/LabVerificationService.java`
- Test: `backend/src/test/java/app/navilla/service/LabVerificationServiceTest.java`

**Context:** Orchestrates the full verification flow. Takes a visit ID + lab code + credentials, routes to the correct provider, stores raw response, updates test_visit/test_results/health_status.

**Step 1: Write failing test**

```java
package app.navilla.service;

import app.navilla.entity.*;
import app.navilla.lab.*;
import app.navilla.repository.*;
import app.navilla.security.EncryptionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LabVerificationServiceTest {

    @Mock private LabProviderRegistry providerRegistry;
    @Mock private TestVisitRepository testVisitRepository;
    @Mock private TestResultRepository testResultRepository;
    @Mock private HealthStatusRepository healthStatusRepository;
    @Mock private LabCredentialRepository labCredentialRepository;
    @Mock private EncryptionService encryptionService;
    @Mock private ConditionCatalogService conditionCatalogService;

    @InjectMocks
    private LabVerificationService service;

    private static final String USER_HASH = "testhash123";
    private static final UUID VISIT_ID = UUID.randomUUID();
    private static final UUID LAB_ID = UUID.randomUUID();

    private TestVisit testVisit;
    private LabProvider mockProvider;

    @BeforeEach
    void setUp() {
        testVisit = TestVisit.builder()
                .id(VISIT_ID)
                .userHash(USER_HASH)
                .testDate(LocalDate.of(2026, 3, 1))
                .labId(LAB_ID)
                .verified(false)
                .build();

        mockProvider = new LabProvider() {
            @Override public String getProviderCode() { return "TEST_LAB"; }
            @Override public ValidationResult validateInput(Map<String, String> creds) {
                return ValidationResult.ok();
            }
            @Override public LabVerificationResult verify(Map<String, String> visit, Map<String, String> lab) {
                return LabVerificationResult.success(
                        new byte[]{1, 2, 3}, "application/json",
                        List.of(new LabTestResult("Test Patient", LocalDate.of(2026, 3, 1),
                                "CHLAMYDIA", "NEGATIVE", "Not detected", "Not detected", "ORD-001")));
            }
        };
    }

    @Test
    void verify_success_returnsResults() {
        when(testVisitRepository.findById(VISIT_ID)).thenReturn(Optional.of(testVisit));
        when(providerRegistry.getProvider("TEST_LAB")).thenReturn(Optional.of(mockProvider));

        var result = service.verify(USER_HASH, VISIT_ID, "TEST_LAB",
                Map.of("orderId", "ORD-001"), Map.of());

        assertThat(result.success()).isTrue();
        assertThat(result.results()).hasSize(1);
    }

    @Test
    void verify_unknownProvider_fails() {
        when(testVisitRepository.findById(VISIT_ID)).thenReturn(Optional.of(testVisit));
        when(providerRegistry.getProvider("UNKNOWN")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.verify(USER_HASH, VISIT_ID, "UNKNOWN",
                Map.of(), Map.of()))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Unknown lab provider");
    }

    @Test
    void verify_visitNotFound_fails() {
        when(testVisitRepository.findById(VISIT_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.verify(USER_HASH, VISIT_ID, "TEST_LAB",
                Map.of(), Map.of()))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("not found");
    }

    @Test
    void verify_wrongUser_fails() {
        when(testVisitRepository.findById(VISIT_ID)).thenReturn(Optional.of(testVisit));

        assertThatThrownBy(() -> service.verify("wrong-hash", VISIT_ID, "TEST_LAB",
                Map.of(), Map.of()))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("not found");
    }

    @Test
    void confirm_savesResultsAndMarksVerified() {
        when(testVisitRepository.findById(VISIT_ID)).thenReturn(Optional.of(testVisit));
        when(encryptionService.encryptToBytes(any())).thenReturn(new byte[]{1});
        when(conditionCatalogService.isValidConditionCode(anyString())).thenReturn(true);
        when(testVisitRepository.save(any())).thenReturn(testVisit);

        var labResults = List.of(new LabTestResult("Test Patient",
                LocalDate.of(2026, 3, 1), "CHLAMYDIA", "NEGATIVE",
                "Not detected", "Not detected", "ORD-001"));

        service.confirm(USER_HASH, VISIT_ID, labResults, new byte[]{1, 2, 3});

        verify(testVisitRepository).save(argThat(v ->
                v.getVerified() && v.getVerifiedAt() != null
                        && v.getRawLabResponseEncrypted() != null));
        verify(testResultRepository).saveAll(anyList());
    }
}
```

**Step 2: Run test to verify it fails**

Run: `cd backend && ./mvnw test -pl . -Dtest=LabVerificationServiceTest`
Expected: FAIL — class not found

**Step 3: Implement LabVerificationService**

```java
package app.navilla.service;

import app.navilla.entity.*;
import app.navilla.lab.*;
import app.navilla.repository.*;
import app.navilla.security.EncryptionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class LabVerificationService {

    private final LabProviderRegistry providerRegistry;
    private final TestVisitRepository testVisitRepository;
    private final TestResultRepository testResultRepository;
    private final HealthStatusRepository healthStatusRepository;
    private final LabCredentialRepository labCredentialRepository;
    private final EncryptionService encryptionService;
    private final ConditionCatalogService conditionCatalogService;

    /**
     * Step 1: Call lab API and return parsed results for user review.
     * Does NOT save anything yet.
     */
    public LabVerificationResult verify(
            String userHash,
            UUID visitId,
            String labCode,
            Map<String, String> visitCredentials,
            Map<String, String> labCredentials) {

        var visit = testVisitRepository.findById(visitId)
                .filter(v -> v.getUserHash().equals(userHash))
                .orElseThrow(() -> new IllegalArgumentException("Test visit not found"));

        var provider = providerRegistry.getProvider(labCode)
                .orElseThrow(() -> new IllegalArgumentException("Unknown lab provider: " + labCode));

        var validation = provider.validateInput(visitCredentials);
        if (!validation.valid()) {
            return LabVerificationResult.failure("VALIDATION_ERROR",
                    "Invalid input: " + validation.fieldErrors());
        }

        return provider.verify(visitCredentials, labCredentials);
    }

    /**
     * Step 2: User confirmed results — save to DB.
     * Updates test_visit, creates test_results, syncs health_status.
     */
    @Transactional
    public void confirm(
            String userHash,
            UUID visitId,
            List<LabTestResult> labResults,
            byte[] rawResponse) {

        var visit = testVisitRepository.findById(visitId)
                .filter(v -> v.getUserHash().equals(userHash))
                .orElseThrow(() -> new IllegalArgumentException("Test visit not found"));

        // Mark visit as verified
        visit.setVerified(true);
        visit.setVerifiedAt(OffsetDateTime.now());
        if (rawResponse != null) {
            visit.setRawLabResponseEncrypted(encryptionService.encryptToBytes(
                    Base64.getEncoder().encodeToString(rawResponse)));
        }

        // Update test date from lab if available
        if (!labResults.isEmpty() && labResults.getFirst().testDate() != null) {
            visit.setTestDate(labResults.getFirst().testDate());
        }

        testVisitRepository.save(visit);

        // Delete existing results for this visit (will be replaced by lab data)
        var existingResults = testResultRepository.findByVisitIdOrderByCreatedAt(visitId);
        if (!existingResults.isEmpty()) {
            testResultRepository.deleteAll(existingResults);
        }

        // Create new results from lab data
        var newResults = new ArrayList<TestResult>();
        for (var labResult : labResults) {
            var result = TestResult.builder()
                    .visitId(visitId)
                    .conditionType(labResult.conditionCode())
                    .status(TestResultStatus.fromValue(labResult.result()))
                    .build();

            if (labResult.resultValue() != null) {
                result.setResultValueEncrypted(
                        encryptionService.encryptToBytes(labResult.resultValue()));
            }
            if (labResult.referenceRange() != null) {
                result.setReferenceRange(labResult.referenceRange());
            }
            newResults.add(result);
        }
        testResultRepository.saveAll(newResults);

        // Sync to health_status for exposure network
        syncHealthStatus(userHash, newResults, visit.getTestDate());

        log.info("Lab verification confirmed for visit {} — {} results saved",
                visitId, newResults.size());
    }

    private void syncHealthStatus(String userHash, List<TestResult> results, LocalDate testDate) {
        for (var result : results) {
            if (result.getConditionType() == null) continue;
            if (!conditionCatalogService.isValidConditionCode(result.getConditionType())) continue;

            var existing = healthStatusRepository
                    .findByUserHashAndConditionType(userHash, result.getConditionType());

            if (existing.isPresent()) {
                var hs = existing.get();
                hs.setStatus(result.getStatus() == TestResultStatus.POSITIVE
                        ? HealthStatusValue.POSITIVE : HealthStatusValue.NEGATIVE);
                hs.setTestDate(testDate);
                hs.setVerified(true);
                if (result.getStatus() != TestResultStatus.POSITIVE && hs.getClearedAt() == null) {
                    hs.setClearedAt(OffsetDateTime.now());
                }
                healthStatusRepository.save(hs);
            } else if (result.getStatus() == TestResultStatus.POSITIVE) {
                var hs = HealthStatus.builder()
                        .userHash(userHash)
                        .conditionType(result.getConditionType())
                        .status(HealthStatusValue.POSITIVE)
                        .testDate(testDate)
                        .verified(true)
                        .build();
                healthStatusRepository.save(hs);
            }
        }
    }
}
```

**Step 4: Run tests**

Run: `cd backend && ./mvnw test -pl . -Dtest=LabVerificationServiceTest`
Expected: 5 tests PASS

**Step 5: Run all backend tests**

Run: `cd backend && ./mvnw test`
Expected: All tests pass

**Step 6: Commit**

```bash
git add backend/src/main/java/app/navilla/service/LabVerificationService.java \
  backend/src/test/java/app/navilla/service/LabVerificationServiceTest.java
git commit -m "feat: add LabVerificationService with verify + confirm flow"
git push
```

---

### Task 8: Lab Provider API Controller

**Files:**
- Create: `backend/src/main/java/app/navilla/controller/LabProviderController.java`
- Create: `backend/src/main/java/app/navilla/dto/VerifyLabRequest.java`
- Create: `backend/src/main/java/app/navilla/dto/ConfirmLabRequest.java`
- Create: `backend/src/main/java/app/navilla/dto/LabProviderDto.java`
- Test: `backend/src/test/java/app/navilla/controller/LabProviderControllerTest.java`

**Step 1: Create DTOs**

`LabProviderDto.java`:
```java
package app.navilla.dto;

import app.navilla.lab.LabProviderProperties;
import java.util.List;

public record LabProviderDto(
        String code,
        String name,
        String nameEs,
        List<FieldDto> requiredFields
) {
    public record FieldDto(String key, String label, String labelEs) {}

    public static LabProviderDto from(LabProviderProperties.LabConfig config) {
        return new LabProviderDto(
                config.code(),
                config.name(),
                config.nameEs(),
                config.requiredFields().stream()
                        .map(f -> new FieldDto(f.key(), f.label(), f.labelEs()))
                        .toList());
    }
}
```

`VerifyLabRequest.java`:
```java
package app.navilla.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.Map;
import java.util.UUID;

public record VerifyLabRequest(
        @NotNull UUID visitId,
        @NotBlank @Size(max = 50) String labCode,
        @NotNull Map<@Size(max = 64) String, @Size(max = 200) String> visitCredentials,
        Map<@Size(max = 64) String, @Size(max = 200) String> labCredentials
) {
    public VerifyLabRequest {
        if (labCredentials == null) labCredentials = Map.of();
    }
}
```

`ConfirmLabRequest.java`:
```java
package app.navilla.dto;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record ConfirmLabRequest(
        @NotNull UUID visitId
) {}
```

**Step 2: Create controller**

```java
package app.navilla.controller;

import app.navilla.dto.*;
import app.navilla.lab.LabProviderProperties;
import app.navilla.lab.LabVerificationResult;
import app.navilla.security.EncryptionService;
import app.navilla.service.LabVerificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/labs")
@RequiredArgsConstructor
public class LabProviderController {

    private final LabProviderProperties labProperties;
    private final LabVerificationService verificationService;
    private final EncryptionService encryptionService;

    // Temporary storage for raw responses between verify and confirm
    // In production, consider a short-TTL cache or session storage
    private final Map<String, byte[]> pendingRawResponses = new ConcurrentHashMap<>();

    @GetMapping("/providers")
    public ResponseEntity<List<LabProviderDto>> listProviders() {
        var providers = labProperties.providers().stream()
                .filter(LabProviderProperties.LabConfig::enabled)
                .map(LabProviderDto::from)
                .toList();
        return ResponseEntity.ok(providers);
    }

    @PostMapping("/verify")
    public ResponseEntity<Map<String, Object>> verify(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody VerifyLabRequest request) {

        String userHash = encryptionService.hashUserId(jwt.getSubject());

        var result = verificationService.verify(
                userHash,
                request.visitId(),
                request.labCode(),
                request.visitCredentials(),
                request.labCredentials());

        if (!result.success()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "errorCode", result.errorCode(),
                    "errorMessage", result.errorMessage()));
        }

        // Store raw response for confirm step
        String key = userHash + ":" + request.visitId();
        if (result.rawResponse() != null) {
            pendingRawResponses.put(key, result.rawResponse());
        }

        return ResponseEntity.ok(Map.of(
                "success", true,
                "results", result.results()));
    }

    @PostMapping("/confirm")
    public ResponseEntity<Map<String, Object>> confirm(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody ConfirmLabRequest request) {

        String userHash = encryptionService.hashUserId(jwt.getSubject());
        String key = userHash + ":" + request.visitId();

        byte[] rawResponse = pendingRawResponses.remove(key);

        // Retrieve cached verification results
        // The confirm endpoint re-uses the last verify result
        // For now, we need the results from the verify step
        // This requires the frontend to pass back the results from verify
        // OR we cache them server-side (which we do with raw response)

        // For the MVP, the frontend sends the results back
        // This will be refined based on the actual UX flow
        return ResponseEntity.ok(Map.of("success", true));
    }
}
```

**Note to implementer:** The confirm endpoint needs refinement. The cleanest approach is to cache both raw response AND parsed results server-side between verify and confirm (short TTL, e.g., 5 minutes). Use Caffeine cache with `pendingVerifications` cache name. The implementer should evaluate the best approach when wiring the frontend.

**Step 3: Write integration tests**

Follow the patterns in existing controller tests (check `HealthLogControllerTest.java` for auth setup). Test:
- `GET /api/labs/providers` returns enabled providers
- `POST /api/labs/verify` with valid credentials returns results
- `POST /api/labs/verify` with unknown provider returns error
- Auth required on verify/confirm endpoints

**Step 4: Run tests**

Run: `cd backend && ./mvnw test`
Expected: All tests pass

**Step 5: Commit**

```bash
git add backend/src/main/java/app/navilla/controller/LabProviderController.java \
  backend/src/main/java/app/navilla/dto/VerifyLabRequest.java \
  backend/src/main/java/app/navilla/dto/ConfirmLabRequest.java \
  backend/src/main/java/app/navilla/dto/LabProviderDto.java \
  backend/src/test/java/app/navilla/controller/LabProviderControllerTest.java
git commit -m "feat: add /api/labs endpoints for provider listing and verification"
git push
```

---

### Task 9: Frontend API Types + Hooks

**Files:**
- Create: `frontend/src/types/lab.ts`
- Modify: `frontend/src/lib/api.ts` — add lab verification endpoints
- Create: `frontend/src/hooks/useLabProviders.ts`
- Create: `frontend/src/hooks/useLabVerification.ts`

**Context:** Check how existing API calls and hooks are structured in `api.ts` and `hooks/` directory. Follow the exact same patterns (apiRequest, useQuery, useMutation).

**Step 1: Create lab types**

```typescript
// frontend/src/types/lab.ts

export interface LabProviderConfig {
  code: string;
  name: string;
  nameEs: string;
  requiredFields: LabFieldConfig[];
}

export interface LabFieldConfig {
  key: string;
  label: string;
  labelEs: string;
}

export interface LabTestResultDto {
  patientName: string | null;
  testDate: string;
  conditionCode: string;
  result: string;
  resultValue: string | null;
  referenceRange: string | null;
  labReferenceId: string | null;
}

export interface LabVerifyResponse {
  success: boolean;
  results?: LabTestResultDto[];
  errorCode?: string;
  errorMessage?: string;
}

export interface LabVerifyRequest {
  visitId: string;
  labCode: string;
  visitCredentials: Record<string, string>;
  labCredentials?: Record<string, string>;
}

export interface LabConfirmRequest {
  visitId: string;
}
```

**Step 2: Add API endpoints to api.ts**

Add to the `api` object following the existing pattern:

```typescript
labs: {
  providers: (token: string) =>
    apiRequest<LabProviderConfig[]>('/api/labs/providers', token, { method: 'GET' }),
  verify: (token: string, data: LabVerifyRequest) =>
    apiRequest<LabVerifyResponse>('/api/labs/verify', token, {
      method: 'POST', body: data
    }),
  confirm: (token: string, data: LabConfirmRequest) =>
    apiRequest<{ success: boolean }>('/api/labs/confirm', token, {
      method: 'POST', body: data
    }),
},
```

**Step 3: Create useLabProviders hook**

```typescript
// frontend/src/hooks/useLabProviders.ts
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import type { LabProviderConfig } from '../types/lab';

export function useLabProviders() {
  const { token } = useAuth();

  return useQuery<LabProviderConfig[]>({
    queryKey: ['lab-providers'],
    queryFn: () => api.labs.providers(token!),
    enabled: !!token,
    staleTime: 1000 * 60 * 60, // 1 hour — lab config rarely changes
  });
}
```

**Step 4: Create useLabVerification hook**

```typescript
// frontend/src/hooks/useLabVerification.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import type { LabVerifyRequest, LabVerifyResponse, LabConfirmRequest } from '../types/lab';

export function useLabVerify() {
  const { token } = useAuth();

  return useMutation<LabVerifyResponse, Error, LabVerifyRequest>({
    mutationFn: (data) => api.labs.verify(token!, data),
  });
}

export function useLabConfirm() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<{ success: boolean }, Error, LabConfirmRequest>({
    mutationFn: (data) => api.labs.confirm(token!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['health-log'] });
      queryClient.invalidateQueries({ queryKey: ['healthLogSummary'] });
      queryClient.invalidateQueries({ queryKey: ['exposures'] });
    },
  });
}
```

**Step 5: Run frontend lint**

Run: `cd frontend && npm run lint`
Expected: No errors

**Step 6: Commit**

```bash
git add frontend/src/types/lab.ts \
  frontend/src/lib/api.ts \
  frontend/src/hooks/useLabProviders.ts \
  frontend/src/hooks/useLabVerification.ts
git commit -m "feat: add frontend lab verification types, API, and hooks"
git push
```

---

### Task 10: Frontend Verification UI

**Files:**
- Create: `frontend/src/components/health/LabVerificationModal.tsx`
- Modify: Health Log page or test visit component — add "Verify with lab" button
- Modify: `frontend/src/index.css` — styles for verification modal

**Context:** Check the existing modal patterns in the codebase (e.g., `ShareConstellationModal.tsx`, `TestVisitModal` if it exists). Follow the same pattern for portal rendering, escape key, backdrop click. Check the existing Health Log page to understand where the verify button goes.

**Step 1: Create LabVerificationModal**

The modal has three states:
1. **Lab selection** — user picks a lab from the enabled providers list
2. **Credential input** — dynamic form based on lab's requiredFields
3. **Results review** — shows parsed results, user confirms or cancels

Implementation should:
- Use `useLabProviders()` to fetch available labs
- Use `useLabVerify()` mutation for the API call
- Use `useLabConfirm()` mutation after user confirms
- Render field labels using i18n (check language, use `labelEs` when Spanish)
- Show loading state during lab API call
- Show error state if verification fails
- Pre-fill persistent credentials from saved lab if available
- "Save credentials for future visits" checkbox

**Step 2: Add "Verify with lab" button to test visit display**

Find the component that renders individual test visits in the Health Log page. Add a button that:
- Only appears when `visit.verified === false`
- Opens `LabVerificationModal` with the visit ID
- After successful verification, shows a verified badge

**Step 3: Add CSS styles**

Follow the existing modal styles pattern. Add verification-specific styles:
- `.lab-verification-modal` — modal container
- `.lab-selection-list` — list of available labs
- `.lab-results-preview` — table showing extracted results before confirmation
- `.lab-result-positive` / `.lab-result-negative` — color coding for results

**Step 4: Run frontend lint**

Run: `cd frontend && npm run lint`
Expected: No errors

**Step 5: Commit**

```bash
git add frontend/src/components/health/LabVerificationModal.tsx \
  frontend/src/index.css
git add -u  # modified files
git commit -m "feat: add lab verification modal with 3-step flow"
git push
```

---

### Task 11: i18n — Locale Files

**Files:**
- Modify: `frontend/src/locales/en_US.json`
- Modify: `frontend/src/locales/es_MX.json`

**Step 1: Add English keys**

Add under a `"labVerification"` namespace:

```json
{
  "labVerification": {
    "title": "Verify with Lab",
    "selectLab": "Select your lab",
    "enterCredentials": "Enter your lab information",
    "verifying": "Checking with lab...",
    "reviewResults": "Review your results",
    "confirmResults": "Confirm & Save",
    "cancel": "Cancel",
    "back": "Back",
    "saveCredentials": "Save for future visits",
    "verified": "Lab Verified",
    "verifyButton": "Verify with lab",
    "noProviders": "No lab providers available",
    "errorNotFound": "Order not found. Please check your information.",
    "errorConnection": "Could not connect to lab. Please try again.",
    "errorGeneric": "Verification failed. Please try again.",
    "resultPositive": "Positive",
    "resultNegative": "Negative",
    "resultReactive": "Reactive",
    "resultNonReactive": "Non-reactive",
    "condition": "Condition",
    "result": "Result",
    "testDate": "Test Date",
    "patientName": "Patient Name"
  }
}
```

**Step 2: Add Spanish keys**

```json
{
  "labVerification": {
    "title": "Verificar con laboratorio",
    "selectLab": "Selecciona tu laboratorio",
    "enterCredentials": "Ingresa la información del laboratorio",
    "verifying": "Consultando con el laboratorio...",
    "reviewResults": "Revisa tus resultados",
    "confirmResults": "Confirmar y guardar",
    "cancel": "Cancelar",
    "back": "Atrás",
    "saveCredentials": "Guardar para futuras consultas",
    "verified": "Verificado por laboratorio",
    "verifyButton": "Verificar con laboratorio",
    "noProviders": "No hay laboratorios disponibles",
    "errorNotFound": "Orden no encontrada. Por favor verifica tu información.",
    "errorConnection": "No se pudo conectar con el laboratorio. Intenta de nuevo.",
    "errorGeneric": "La verificación falló. Intenta de nuevo.",
    "resultPositive": "Positivo",
    "resultNegative": "Negativo",
    "resultReactive": "Reactivo",
    "resultNonReactive": "No reactivo",
    "condition": "Condición",
    "result": "Resultado",
    "testDate": "Fecha de prueba",
    "patientName": "Nombre del paciente"
  }
}
```

**Step 3: Run frontend lint**

Run: `cd frontend && npm run lint`
Expected: No errors

**Step 4: Commit**

```bash
git add frontend/src/locales/en_US.json frontend/src/locales/es_MX.json
git commit -m "feat: add lab verification i18n keys (en_US + es_MX)"
git push
```

---

### Task 12: Documentation

**Files:**
- Create: `docs/docs/api/lab-verification.md` — API docs for the new endpoints
- Create: `docs/docs/architecture/lab-integration.md` — Architecture docs for the pluggable system
- Modify: `docs/sidebars.ts` — add new pages to sidebar
- Modify: `docs/static/postman/navilla-api.postman_collection.json` — add new endpoints

**Step 1: Write API documentation**

Document:
- `GET /api/labs/providers` — response shape, no auth required
- `POST /api/labs/verify` — request/response shapes, auth required, error codes
- `POST /api/labs/confirm` — request/response shapes, auth required

**Step 2: Write architecture documentation**

Document:
- The pluggable LabProvider interface
- How to add a new lab provider (step by step)
- Data flow diagram
- Config structure in application.yml
- How verification connects to health_status and exposure network

**Step 3: Update Postman collection**

Add the three new endpoints with example requests/responses.

**Step 4: Update sidebars**

Add new pages under the appropriate sections.

**Step 5: Commit**

```bash
git add docs/
git commit -m "docs: add lab verification API and architecture documentation"
git push
```

---

## Summary

| Task | Description | New Files | Modified Files |
|------|-------------|-----------|---------------|
| 1 | Migration + entity updates | 1 (migration) | 2+ (entities, enum refs) |
| 2 | Core interfaces + records | 4 (interface, records) | 0 |
| 3 | Config properties | 2 (properties, config) | 1 (application.yaml) |
| 4 | LabProviderRegistry | 1 | 0 |
| 5 | Mock lab endpoints | 1 (controller) | 0 |
| 6 | Mock lab providers | 2 (providers) | 0 |
| 7 | LabVerificationService | 1 | 0 |
| 8 | API controller + DTOs | 4 (controller, DTOs) | 0 |
| 9 | Frontend types + hooks | 4 (types, hooks) | 1 (api.ts) |
| 10 | Frontend verification UI | 1 (modal) | 2 (page, css) |
| 11 | i18n | 0 | 2 (locale files) |
| 12 | Documentation | 2 (docs) | 2 (sidebars, postman) |
