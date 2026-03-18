# Launch Readiness Sprint Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harden Navilla for soft launch — rate limiting, resource caps, validation, OWASP review, abuse detection, content verification, mobile polish, E2E expansion, and performance check.

**Architecture:** Security-first approach. Week 15 adds Bucket4j rate limiting via servlet filter, a shared ResourceCapService for per-user hard limits, and completes validation/OWASP gaps. Week 16 verifies content accuracy, polishes mobile UX, expands E2E coverage, and checks performance.

**Tech Stack:** Java 25 + Spring Boot 4.0.2, Bucket4j + Caffeine, Playwright E2E, Grafana/Loki alerting

**Spec:** `docs/superpowers/specs/2026-03-18-launch-readiness-sprint-design.md`

---

## Chunk 1: Rate Limiting

### Task 1: Add Bucket4j dependency and forward-headers config

**Files:**
- Modify: `backend/pom.xml`
- Modify: `backend/src/main/resources/application.yaml`

- [ ] **Step 1: Add Bucket4j dependency to pom.xml**

Add after the Caffeine dependency block (~line 106):

```xml
<!-- Rate limiting -->
<dependency>
  <groupId>com.bucket4j</groupId>
  <artifactId>bucket4j-core</artifactId>
  <version>8.14.0</version>
</dependency>
```

Note: We use bucket4j-core directly (not the Spring Boot starter) since we're writing a custom servlet filter. This gives us full control over bucket creation and key extraction.

- [ ] **Step 2: Add forward-headers-strategy to application.yaml**

Add under the `server:` section (after line ~48):

```yaml
server:
  forward-headers-strategy: framework
```

This is required for Railway's reverse proxy — without it, `request.getRemoteAddr()` returns the load balancer IP, not the client IP, making IP-based rate limiting useless.

- [ ] **Step 3: Add rate limit configuration to application.yaml**

Add under the `navilla:` section:

```yaml
navilla:
  rate-limit:
    write-per-minute: 30
    read-per-minute: 120
    sensitive-per-minute: 10
    global-per-minute-per-ip: 300
```

- [ ] **Step 4: Verify build compiles**

Run: `cd backend && ./mvnw compile -q`
Expected: BUILD SUCCESS

- [ ] **Step 5: Commit**

```bash
git add backend/pom.xml backend/src/main/resources/application.yaml
git commit -m "chore: add Bucket4j dependency and rate limit config"
git push
```

---

### Task 2: Rate limit properties class

**Files:**
- Create: `backend/src/main/java/app/navilla/config/RateLimitProperties.java`

- [ ] **Step 1: Create RateLimitProperties**

```java
package app.navilla.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "navilla.rate-limit")
public record RateLimitProperties(
    int writePerMinute,
    int readPerMinute,
    int sensitivePerMinute,
    int globalPerMinutePerIp
) {
  public RateLimitProperties {
    if (writePerMinute <= 0) writePerMinute = 30;
    if (readPerMinute <= 0) readPerMinute = 120;
    if (sensitivePerMinute <= 0) sensitivePerMinute = 10;
    if (globalPerMinutePerIp <= 0) globalPerMinutePerIp = 300;
  }
}
```

- [ ] **Step 2: Enable properties in SecurityConfig**

Add `RateLimitProperties.class` to the existing `@EnableConfigurationProperties` annotation in `SecurityConfig.java`:

```java
@EnableConfigurationProperties({CorsProperties.class, RateLimitProperties.class})
```

- [ ] **Step 3: Verify build compiles**

Run: `cd backend && ./mvnw compile -q`
Expected: BUILD SUCCESS

- [ ] **Step 4: Commit**

```bash
git add backend/src/main/java/app/navilla/config/RateLimitProperties.java backend/src/main/java/app/navilla/config/SecurityConfig.java
git commit -m "feat: add RateLimitProperties config class"
git push
```

---

### Task 3: RateLimitFilter implementation

**Files:**
- Create: `backend/src/main/java/app/navilla/config/RateLimitFilter.java`
- Create: `backend/src/test/java/app/navilla/config/RateLimitFilterTest.java`

- [ ] **Step 1: Write the failing tests**

```java
package app.navilla.config;

import static org.assertj.core.api.Assertions.assertThat;

import io.github.bucket4j.Bucket;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

class RateLimitFilterTest {

  private RateLimitFilter filter;
  private RateLimitProperties properties;

  @BeforeEach
  void setUp() {
    properties = new RateLimitProperties(30, 120, 10, 300);
    filter = new RateLimitFilter(properties);
    SecurityContextHolder.clearContext();
  }

  @Test
  @DisplayName("allows requests within write rate limit")
  void allowsRequestsWithinWriteLimit() throws Exception {
    setAuthenticatedUser("user-1");
    MockHttpServletRequest request = postRequest("/api/journal");
    MockHttpServletResponse response = new MockHttpServletResponse();
    MockFilterChain chain = new MockFilterChain();

    filter.doFilterInternal(request, response, chain);

    assertThat(response.getStatus()).isEqualTo(200);
    assertThat(chain.getRequest()).isNotNull(); // chain was invoked
  }

  @Test
  @DisplayName("blocks requests exceeding write rate limit with 429")
  void blocksExceedingWriteLimit() throws Exception {
    setAuthenticatedUser("user-2");
    RateLimitProperties strictProps = new RateLimitProperties(2, 120, 10, 300);
    RateLimitFilter strictFilter = new RateLimitFilter(strictProps);

    // Exhaust write limit
    for (int i = 0; i < 2; i++) {
      MockHttpServletResponse resp = new MockHttpServletResponse();
      strictFilter.doFilterInternal(postRequest("/api/journal"), resp, new MockFilterChain());
      assertThat(resp.getStatus()).isEqualTo(200);
    }

    // Third request should be blocked
    MockHttpServletResponse blocked = new MockHttpServletResponse();
    strictFilter.doFilterInternal(postRequest("/api/journal"), blocked, new MockFilterChain());

    assertThat(blocked.getStatus()).isEqualTo(429);
    assertThat(blocked.getHeader("Retry-After")).isNotNull();
    assertThat(blocked.getContentAsString()).contains("Too Many Requests");
  }

  @Test
  @DisplayName("uses IP-based limiting for unauthenticated requests")
  void usesIpLimitingForUnauthenticated() throws Exception {
    RateLimitProperties strictProps = new RateLimitProperties(30, 120, 10, 2);
    RateLimitFilter strictFilter = new RateLimitFilter(strictProps);

    // Exhaust IP limit
    for (int i = 0; i < 2; i++) {
      MockHttpServletResponse resp = new MockHttpServletResponse();
      MockHttpServletRequest req = getRequest("/api/catalog");
      req.setRemoteAddr("10.0.0.1");
      strictFilter.doFilterInternal(req, resp, new MockFilterChain());
    }

    // Third request blocked
    MockHttpServletResponse blocked = new MockHttpServletResponse();
    MockHttpServletRequest req = getRequest("/api/catalog");
    req.setRemoteAddr("10.0.0.1");
    strictFilter.doFilterInternal(req, blocked, new MockFilterChain());

    assertThat(blocked.getStatus()).isEqualTo(429);
  }

  @Test
  @DisplayName("applies sensitive tier to connection endpoints")
  void appliesSensitiveTierToConnections() throws Exception {
    setAuthenticatedUser("user-3");
    RateLimitProperties strictProps = new RateLimitProperties(30, 120, 2, 300);
    RateLimitFilter strictFilter = new RateLimitFilter(strictProps);

    // Exhaust sensitive limit
    for (int i = 0; i < 2; i++) {
      MockHttpServletResponse resp = new MockHttpServletResponse();
      strictFilter.doFilterInternal(postRequest("/api/connections"), resp, new MockFilterChain());
    }

    // Third request blocked
    MockHttpServletResponse blocked = new MockHttpServletResponse();
    strictFilter.doFilterInternal(postRequest("/api/connections"), blocked, new MockFilterChain());

    assertThat(blocked.getStatus()).isEqualTo(429);
  }

  @Test
  @DisplayName("allows read requests within read rate limit")
  void allowsReadRequestsWithinLimit() throws Exception {
    setAuthenticatedUser("user-4");
    MockHttpServletResponse response = new MockHttpServletResponse();

    filter.doFilterInternal(getRequest("/api/journal"), response, new MockFilterChain());

    assertThat(response.getStatus()).isEqualTo(200);
  }

  @Test
  @DisplayName("skips non-API requests")
  void skipsNonApiRequests() throws Exception {
    MockHttpServletRequest request = new MockHttpServletRequest("GET", "/actuator/health");
    MockHttpServletResponse response = new MockHttpServletResponse();
    MockFilterChain chain = new MockFilterChain();

    filter.doFilterInternal(request, response, chain);

    assertThat(response.getStatus()).isEqualTo(200);
    assertThat(chain.getRequest()).isNotNull();
  }

  @Test
  @DisplayName("different users have independent rate limit buckets")
  void differentUsersHaveIndependentBuckets() throws Exception {
    RateLimitProperties strictProps = new RateLimitProperties(1, 120, 10, 300);
    RateLimitFilter strictFilter = new RateLimitFilter(strictProps);

    // User A exhausts their write limit
    setAuthenticatedUser("user-a");
    MockHttpServletResponse respA = new MockHttpServletResponse();
    strictFilter.doFilterInternal(postRequest("/api/journal"), respA, new MockFilterChain());
    assertThat(respA.getStatus()).isEqualTo(200);

    // User B should still be able to write
    setAuthenticatedUser("user-b");
    MockHttpServletResponse respB = new MockHttpServletResponse();
    strictFilter.doFilterInternal(postRequest("/api/journal"), respB, new MockFilterChain());
    assertThat(respB.getStatus()).isEqualTo(200);
  }

  // --- helpers ---

  private void setAuthenticatedUser(String subject) {
    Jwt jwt = Jwt.withTokenValue("test")
        .header("alg", "RS256")
        .subject(subject)
        .claim("email", subject + "@test.com")
        .build();
    SecurityContextHolder.getContext()
        .setAuthentication(new JwtAuthenticationToken(jwt));
  }

  private MockHttpServletRequest postRequest(String uri) {
    MockHttpServletRequest request = new MockHttpServletRequest("POST", uri);
    request.setRemoteAddr("127.0.0.1");
    return request;
  }

  private MockHttpServletRequest getRequest(String uri) {
    MockHttpServletRequest request = new MockHttpServletRequest("GET", uri);
    request.setRemoteAddr("127.0.0.1");
    return request;
  }
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend && ./mvnw test -pl . -Dtest=RateLimitFilterTest -q`
Expected: FAIL — `RateLimitFilter` class does not exist

- [ ] **Step 3: Implement RateLimitFilter**

```java
package app.navilla.config;

import app.navilla.dto.ApiError;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;

import io.github.bucket4j.Bucket;
import io.github.bucket4j.ConsumptionProbe;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.time.Duration;
import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Rate limiting filter using Bucket4j token bucket algorithm.
 *
 * <p>Three tiers: write (POST/PUT/PATCH/DELETE), read (GET), and sensitive
 * (connection/phone-match endpoints). Falls back to IP-based limiting for
 * unauthenticated requests.
 */
public class RateLimitFilter extends OncePerRequestFilter {

  private static final Logger log = LoggerFactory.getLogger(RateLimitFilter.class);
  private static final ObjectMapper MAPPER = new ObjectMapper()
      .registerModule(new JavaTimeModule());

  private static final Set<String> SENSITIVE_PATHS = Set.of(
      "/api/connections",
      "/api/connections/phone-match",
      "/api/connections/respond",
      "/api/push/subscribe"
  );

  private static final Set<String> WRITE_METHODS = Set.of(
      "POST", "PUT", "PATCH", "DELETE"
  );

  private final RateLimitProperties properties;
  private final Cache<String, Bucket> writeBuckets = buildCache();
  private final Cache<String, Bucket> readBuckets = buildCache();
  private final Cache<String, Bucket> sensitiveBuckets = buildCache();
  private final Cache<String, Bucket> ipBuckets = buildCache();

  private static Cache<String, Bucket> buildCache() {
    return Caffeine.newBuilder()
        .expireAfterAccess(Duration.ofMinutes(5))
        .maximumSize(10_000)
        .build();
  }

  public RateLimitFilter(RateLimitProperties properties) {
    this.properties = properties;
  }

  @Override
  protected void doFilterInternal(HttpServletRequest request,
      HttpServletResponse response, FilterChain filterChain)
      throws ServletException, IOException {

    String path = request.getRequestURI();

    // Skip non-API requests
    if (!path.startsWith("/api/")) {
      filterChain.doFilter(request, response);
      return;
    }

    String method = request.getMethod();
    String userKey = extractUserKey(request);
    boolean authenticated = !userKey.startsWith("ip:");

    // Determine which bucket to check
    Bucket bucket;
    // Sensitive tier applies to writes on sensitive paths (all listed endpoints are POST)
    if (authenticated && isSensitivePath(path) && WRITE_METHODS.contains(method)) {
      bucket = sensitiveBuckets.get(
          userKey + ":sensitive", k -> createBucket(properties.sensitivePerMinute()));
    } else if (authenticated && WRITE_METHODS.contains(method)) {
      bucket = writeBuckets.get(
          userKey + ":write", k -> createBucket(properties.writePerMinute()));
    } else if (authenticated) {
      bucket = readBuckets.get(
          userKey + ":read", k -> createBucket(properties.readPerMinute()));
    } else {
      // Unauthenticated: IP-based global limit
      bucket = ipBuckets.get(
          userKey, k -> createBucket(properties.globalPerMinutePerIp()));
    }

    ConsumptionProbe probe = bucket.tryConsumeAndReturnRemaining(1);
    if (!probe.isConsumed()) {
      long retryAfterSeconds = Duration.ofNanos(probe.getNanosToWaitForRefill())
          .toSeconds() + 1;

      log.warn("Rate limit exceeded: user={} path={} method={} retryAfter={}s",
          userKey, path, method, retryAfterSeconds);

      response.setStatus(429);
      response.setContentType("application/json");
      response.setHeader("Retry-After", String.valueOf(retryAfterSeconds));

      ApiError body = ApiError.of(429, "Too Many Requests",
          "Rate limit exceeded. Please try again later.", path);
      MAPPER.writeValue(response.getWriter(), body);
      return;
    }

    filterChain.doFilter(request, response);
  }

  private String extractUserKey(HttpServletRequest request) {
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    if (auth != null && auth.isAuthenticated() && auth.getPrincipal() instanceof Jwt jwt) {
      return "user:" + jwt.getSubject();
    }
    return "ip:" + getClientIp(request);
  }

  private String getClientIp(HttpServletRequest request) {
    String forwarded = request.getHeader("X-Forwarded-For");
    if (forwarded != null && !forwarded.isBlank()) {
      return forwarded.split(",")[0].trim();
    }
    return request.getRemoteAddr();
  }

  private boolean isSensitivePath(String path) {
    for (String sensitive : SENSITIVE_PATHS) {
      if (path.equals(sensitive) || path.startsWith(sensitive + "/")) {
        return true;
      }
    }
    return false;
  }

  private Bucket createBucket(int tokensPerMinute) {
    return Bucket.builder()
        .addLimit(limit -> limit.capacity(tokensPerMinute)
            .refillGreedy(tokensPerMinute, Duration.ofMinutes(1)))
        .build();
  }
}
```

- [ ] **Step 4: Register the filter in SecurityConfig**

Add to `SecurityConfig.java` — a new bean method:

```java
@Bean
public FilterRegistrationBean<RateLimitFilter> rateLimitFilterRegistration(
    RateLimitProperties rateLimitProperties) {
  FilterRegistrationBean<RateLimitFilter> registration =
      new FilterRegistrationBean<>(new RateLimitFilter(rateLimitProperties));
  registration.setOrder(10); // After CORS (0) and security filters
  registration.addUrlPatterns("/api/*");
  return registration;
}
```

Add this import:
```java
import org.springframework.boot.web.servlet.FilterRegistrationBean;
```

(Note: `FilterRegistrationBean` may already be imported for the CORS filter — check first.)

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd backend && ./mvnw test -pl . -Dtest=RateLimitFilterTest -q`
Expected: ALL PASS (7 tests)

- [ ] **Step 6: Run full test suite to verify no regressions**

Run: `cd backend && ./mvnw test -q`
Expected: ALL PASS (~476+ tests)

- [ ] **Step 7: Commit**

```bash
git add backend/src/main/java/app/navilla/config/RateLimitFilter.java backend/src/test/java/app/navilla/config/RateLimitFilterTest.java backend/src/main/java/app/navilla/config/SecurityConfig.java
git commit -m "feat: add Bucket4j rate limiting filter with three tiers"
git push
```

---

### Task 4: Update GlobalExceptionHandler for Retry-After header

**Files:**
- Modify: `backend/src/main/java/app/navilla/exception/RateLimitException.java`
- Modify: `backend/src/main/java/app/navilla/exception/GlobalExceptionHandler.java`
- Modify: `backend/src/main/java/app/navilla/config/SecurityConfig.java` (CORS exposed headers)

- [ ] **Step 1: Add retryAfterSeconds to RateLimitException**

```java
package app.navilla.exception;

public class RateLimitException extends RuntimeException {

  private final String messageKey;
  private final long retryAfterSeconds;

  public RateLimitException(String messageKey) {
    this(messageKey, 60);
  }

  public RateLimitException(String messageKey, long retryAfterSeconds) {
    super(messageKey);
    this.messageKey = messageKey;
    this.retryAfterSeconds = retryAfterSeconds;
  }

  public String getMessageKey() {
    return messageKey;
  }

  public long getRetryAfterSeconds() {
    return retryAfterSeconds;
  }
}
```

- [ ] **Step 2: Update handleRateLimit in GlobalExceptionHandler**

Replace the existing `handleRateLimit` method with:

```java
@ExceptionHandler(RateLimitException.class)
public ResponseEntity<ApiError> handleRateLimit(
    RateLimitException ex,
    HttpServletRequest request,
    Locale locale) {

  String message = messageSource.getMessage(
      ex.getMessageKey(), null, ex.getMessageKey(), locale);
  ApiError error = ApiError.of(429, "Too Many Requests", message, request.getRequestURI());
  return ResponseEntity.status(429)
      .header("Retry-After", String.valueOf(ex.getRetryAfterSeconds()))
      .body(error);
}
```

- [ ] **Step 3: Add Retry-After to CORS exposed headers**

In `SecurityConfig.java`, update the `corsConfigurationSource()` method's `setExposedHeaders` call:

```java
configuration.setExposedHeaders(List.of(
    "Authorization", "Content-Type", "X-Request-Id", "Retry-After"));
```

- [ ] **Step 4: Run full test suite**

Run: `cd backend && ./mvnw test -q`
Expected: ALL PASS

- [ ] **Step 5: Commit**

```bash
git add backend/src/main/java/app/navilla/exception/RateLimitException.java backend/src/main/java/app/navilla/exception/GlobalExceptionHandler.java backend/src/main/java/app/navilla/config/SecurityConfig.java
git commit -m "feat: add Retry-After header to rate limit responses"
git push
```

---

### Task 5: Rate limit i18n keys

**Files:**
- Modify: `backend/src/main/resources/messages.properties` (backend i18n for GlobalExceptionHandler)
- Modify: `backend/src/main/resources/messages_es_MX.properties` (backend i18n Spanish)
- Modify: `frontend/src/locales/en_US.json`
- Modify: `frontend/src/locales/es_MX.json`

- [ ] **Step 0: Add backend message keys**

In `messages.properties`:
```properties
errors.rateLimitExceeded=Too many requests. Please wait a moment and try again.
phoneMatch.rateLimitExceeded=Too many phone match attempts this week. Please try again later.
errors.resourceCapExceeded=You''ve reached the maximum limit of {1} for {0}.
```

In `messages_es_MX.properties`:
```properties
errors.rateLimitExceeded=Demasiadas solicitudes. Por favor espera un momento e intenta de nuevo.
phoneMatch.rateLimitExceeded=Demasiados intentos de coincidencia por teléfono esta semana. Intenta más tarde.
errors.resourceCapExceeded=Has alcanzado el límite máximo de {1} para {0}.
```

- [ ] **Step 1: Add rate limit error keys to en_US.json**

Add under the `"errors"` section:

```json
"errors.rateLimitExceeded": "Too many requests. Please wait a moment and try again.",
"errors.rateLimitWrite": "You're making changes too quickly. Please slow down.",
"errors.rateLimitSensitive": "This action is limited for security. Please try again shortly."
```

- [ ] **Step 2: Add rate limit error keys to es_MX.json**

```json
"errors.rateLimitExceeded": "Demasiadas solicitudes. Por favor espera un momento e intenta de nuevo.",
"errors.rateLimitWrite": "Estás haciendo cambios muy rápido. Por favor ve más despacio.",
"errors.rateLimitSensitive": "Esta acción está limitada por seguridad. Por favor intenta en un momento."
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/locales/en_US.json frontend/src/locales/es_MX.json
git commit -m "feat: add rate limit i18n keys (en_US + es_MX)"
git push
```

---

## Chunk 2: Resource Caps

### Task 6: ResourceCapExceededException

**Files:**
- Create: `backend/src/main/java/app/navilla/exception/ResourceCapExceededException.java`
- Modify: `backend/src/main/java/app/navilla/exception/GlobalExceptionHandler.java`

- [ ] **Step 1: Create the exception class**

```java
package app.navilla.exception;

/**
 * Thrown when a user has reached the maximum allowed count for a resource type.
 * Returns HTTP 409 with a specific message distinguishable from other conflicts.
 */
public class ResourceCapExceededException extends RuntimeException {

  private final String messageKey;
  private final String resourceType;
  private final int cap;

  public ResourceCapExceededException(String messageKey, String resourceType, int cap) {
    super(messageKey);
    this.messageKey = messageKey;
    this.resourceType = resourceType;
    this.cap = cap;
  }

  public String getMessageKey() {
    return messageKey;
  }

  public String getResourceType() {
    return resourceType;
  }

  public int getCap() {
    return cap;
  }
}
```

- [ ] **Step 2: Add handler to GlobalExceptionHandler**

Add a new handler method (after the existing `handleIllegalState`):

```java
@ExceptionHandler(ResourceCapExceededException.class)
public ResponseEntity<ApiError> handleResourceCapExceeded(
    ResourceCapExceededException ex,
    HttpServletRequest request,
    Locale locale) {

  String message = messageSource.getMessage(
      ex.getMessageKey(),
      new Object[]{ex.getResourceType(), ex.getCap()},
      ex.getMessageKey(),
      locale);
  ApiError error = ApiError.of(409, "Resource Limit Reached", message, request.getRequestURI());
  return ResponseEntity.status(409).body(error);
}
```

- [ ] **Step 3: Run full test suite**

Run: `cd backend && ./mvnw test -q`
Expected: ALL PASS

- [ ] **Step 4: Commit**

```bash
git add backend/src/main/java/app/navilla/exception/ResourceCapExceededException.java backend/src/main/java/app/navilla/exception/GlobalExceptionHandler.java
git commit -m "feat: add ResourceCapExceededException with handler"
git push
```

---

### Task 7: ResourceCapService + properties

**Files:**
- Create: `backend/src/main/java/app/navilla/config/ResourceCapProperties.java`
- Create: `backend/src/main/java/app/navilla/service/ResourceCapService.java`
- Create: `backend/src/test/java/app/navilla/service/ResourceCapServiceTest.java`

- [ ] **Step 1: Create ResourceCapProperties**

```java
package app.navilla.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "navilla.resource-caps")
public record ResourceCapProperties(
    int journalEntries,
    int partners,
    int testVisits,
    int labs,
    int connections,
    int customFieldTemplates,
    int verificationCards,
    int reminders,
    int medications
) {
  public ResourceCapProperties {
    if (journalEntries <= 0) journalEntries = 10000;
    if (partners <= 0) partners = 500;
    if (testVisits <= 0) testVisits = 5000;
    if (labs <= 0) labs = 50;
    if (connections <= 0) connections = 500;
    if (customFieldTemplates <= 0) customFieldTemplates = 10;
    if (verificationCards <= 0) verificationCards = 20;
    if (reminders <= 0) reminders = 50;
    if (medications <= 0) medications = 50;
  }
}
```

- [ ] **Step 2: Add resource cap config to application.yaml**

Add under the `navilla:` section:

```yaml
navilla:
  resource-caps:
    journal-entries: 10000
    partners: 500
    test-visits: 5000
    labs: 50
    connections: 500
    custom-field-templates: 10
    verification-cards: 20
    reminders: 50
    medications: 50
```

- [ ] **Step 3: Enable properties — add to SecurityConfig @EnableConfigurationProperties**

```java
@EnableConfigurationProperties({CorsProperties.class, RateLimitProperties.class, ResourceCapProperties.class})
```

- [ ] **Step 4: Write failing tests for ResourceCapService**

```java
package app.navilla.service;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import app.navilla.config.ResourceCapProperties;
import app.navilla.exception.ResourceCapExceededException;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class ResourceCapServiceTest {

  private ResourceCapService service;

  @BeforeEach
  void setUp() {
    ResourceCapProperties props = new ResourceCapProperties(
        100, 50, 200, 10, 50, 5, 10, 20, 20);
    service = new ResourceCapService(props);
  }

  @Test
  @DisplayName("allows creation when below cap")
  void allowsCreationBelowCap() {
    assertThatCode(() -> service.checkCap("journalEntries", 99))
        .doesNotThrowException();
  }

  @Test
  @DisplayName("throws when at cap")
  void throwsWhenAtCap() {
    assertThatThrownBy(() -> service.checkCap("journalEntries", 100))
        .isInstanceOf(ResourceCapExceededException.class);
  }

  @Test
  @DisplayName("throws when over cap")
  void throwsWhenOverCap() {
    assertThatThrownBy(() -> service.checkCap("journalEntries", 150))
        .isInstanceOf(ResourceCapExceededException.class);
  }

  @Test
  @DisplayName("checks each resource type independently")
  void checksEachResourceType() {
    assertThatCode(() -> service.checkCap("partners", 49)).doesNotThrowException();
    assertThatThrownBy(() -> service.checkCap("partners", 50))
        .isInstanceOf(ResourceCapExceededException.class);

    assertThatCode(() -> service.checkCap("testVisits", 199)).doesNotThrowException();
    assertThatThrownBy(() -> service.checkCap("testVisits", 200))
        .isInstanceOf(ResourceCapExceededException.class);

    assertThatCode(() -> service.checkCap("labs", 9)).doesNotThrowException();
    assertThatThrownBy(() -> service.checkCap("labs", 10))
        .isInstanceOf(ResourceCapExceededException.class);

    assertThatCode(() -> service.checkCap("connections", 49)).doesNotThrowException();
    assertThatThrownBy(() -> service.checkCap("connections", 50))
        .isInstanceOf(ResourceCapExceededException.class);

    assertThatCode(() -> service.checkCap("customFieldTemplates", 4)).doesNotThrowException();
    assertThatThrownBy(() -> service.checkCap("customFieldTemplates", 5))
        .isInstanceOf(ResourceCapExceededException.class);

    assertThatCode(() -> service.checkCap("verificationCards", 9)).doesNotThrowException();
    assertThatThrownBy(() -> service.checkCap("verificationCards", 10))
        .isInstanceOf(ResourceCapExceededException.class);

    assertThatCode(() -> service.checkCap("reminders", 19)).doesNotThrowException();
    assertThatThrownBy(() -> service.checkCap("reminders", 20))
        .isInstanceOf(ResourceCapExceededException.class);

    assertThatCode(() -> service.checkCap("medications", 19)).doesNotThrowException();
    assertThatThrownBy(() -> service.checkCap("medications", 20))
        .isInstanceOf(ResourceCapExceededException.class);
  }

  @Test
  @DisplayName("throws IllegalArgumentException for unknown resource type")
  void throwsForUnknownResourceType() {
    assertThatThrownBy(() -> service.checkCap("unknownResource", 1))
        .isInstanceOf(IllegalArgumentException.class);
  }
}
```

- [ ] **Step 5: Run tests to verify they fail**

Run: `cd backend && ./mvnw test -pl . -Dtest=ResourceCapServiceTest -q`
Expected: FAIL — `ResourceCapService` does not exist

- [ ] **Step 6: Implement ResourceCapService**

```java
package app.navilla.service;

import app.navilla.config.ResourceCapProperties;
import app.navilla.exception.ResourceCapExceededException;

import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/**
 * Enforces per-user resource creation limits.
 *
 * <p>Each service should call {@link #checkCap} before creating a new resource.
 * Caps are configurable via {@code navilla.resource-caps.*} in application.yaml.
 */
@Service
public class ResourceCapService {

  private static final Logger log = LoggerFactory.getLogger(ResourceCapService.class);

  private final Map<String, Integer> caps;

  public ResourceCapService(ResourceCapProperties props) {
    this.caps = Map.of(
        "journalEntries", props.journalEntries(),
        "partners", props.partners(),
        "testVisits", props.testVisits(),
        "labs", props.labs(),
        "connections", props.connections(),
        "customFieldTemplates", props.customFieldTemplates(),
        "verificationCards", props.verificationCards(),
        "reminders", props.reminders(),
        "medications", props.medications()
    );
  }

  /**
   * Checks if the user has reached the cap for the given resource type.
   *
   * @param resourceType the resource type key (e.g., "journalEntries")
   * @param currentCount the user's current count of this resource
   * @throws ResourceCapExceededException if currentCount >= cap
   * @throws IllegalArgumentException if resourceType is unknown
   */
  public void checkCap(String resourceType, long currentCount) {
    Integer cap = caps.get(resourceType);
    if (cap == null) {
      throw new IllegalArgumentException("Unknown resource type: " + resourceType);
    }
    if (currentCount >= cap) {
      log.warn("Resource cap reached: type={} count={} cap={}", resourceType, currentCount, cap);
      throw new ResourceCapExceededException(
          "errors.resourceCapExceeded", resourceType, cap);
    }
  }
}
```

- [ ] **Step 7: Run tests to verify they pass**

Run: `cd backend && ./mvnw test -pl . -Dtest=ResourceCapServiceTest -q`
Expected: ALL PASS (5 tests)

- [ ] **Step 8: Commit**

```bash
git add backend/src/main/java/app/navilla/config/ResourceCapProperties.java backend/src/main/java/app/navilla/service/ResourceCapService.java backend/src/test/java/app/navilla/service/ResourceCapServiceTest.java backend/src/main/java/app/navilla/config/SecurityConfig.java backend/src/main/resources/application.yaml
git commit -m "feat: add ResourceCapService with configurable per-user limits"
git push
```

---

### Task 8: Wire ResourceCapService into create methods

**Files:**
- Modify: All services with create methods (EncounterJournalService, PartnerService, TestVisitService, LabService, ConnectionService, VerificationCardService, ReminderService, MedicationService, VaccinationService)
- Modify: Corresponding repositories (add `countByUserHash` query if not present)

This task requires reading each service to understand its create method and the corresponding repository. The pattern is the same for each:

- [ ] **Step 1: Add count queries to repositories that don't have them**

Add `long countByUserHash(String userHash);` to these repositories (verified they don't have it):
- `JournalPartnerRepository`
- `LabRepository`
- `VerificationCardRepository`
- `ReminderRepository` (has a filtered count but not total — add `countByUserHash`)
- `MedicationRepository`
- `VaccinationRepository`
- `JournalFieldTemplateRepository`

Already have a count method (verify and reuse):
- `EncounterJournalRepository` — has `countByUserHash`
- `ConnectionRepository` — has `countConfirmedByUserHash` via custom query (use this one)
- `TestVisitRepository` — check if exists, add if not

- [ ] **Step 2: Inject ResourceCapService into each service with a create method**

Add `private final ResourceCapService resourceCapService;` to the constructor of each service.

- [ ] **Step 3: Add cap check at the top of each create method**

Pattern for each service's create method (e.g., `EncounterJournalService.createEntry()`):

```java
// At the top of the create method, after extracting userHash
long count = journalRepository.countByUserHash(userHash);
resourceCapService.checkCap("journalEntries", count);
```

Apply to all resource types. **Read each service first** to find the exact create method:
- `EncounterJournalService.createEntry()` → `"journalEntries"`
- `JournalPartnerService.createPartner()` → `"partners"` (NOT `PartnerService` — doesn't exist)
- `HealthLogService.createVisit()` → `"testVisits"` (NOT `TestVisitService` — doesn't exist)
- `LabService.createLab()` → `"labs"`
- `ConnectionService` — find the create/accept connection method → `"connections"`. Use existing `countConfirmedByUserHash` query (denied/cancelled shouldn't count)
- `VerificationCardService.createCard()` → `"verificationCards"`
- `MedicationService.createMedication()` → `"medications"`
- `VaccinationService.create()` → `"medications"` (shares the medications cap — low-volume, same category)
- **Reminders**: NOT `ReminderService.createReminder()` (doesn't exist). Reminders are auto-created by `ReminderCalculationEngine.generateReminder()`, `MedicationService`, and `VaccinationService`. Add cap check in these internal creation points. Use `reminderRepository.countByUserHash(userHash)` (add this query)
- **Custom field templates**: `EncounterJournalService.saveTemplates()` is a **replace-all** operation (deletes + re-saves). Cap check should verify `request.labels().size() <= cap`, NOT the DB count

- [ ] **Step 4: Run full test suite**

Run: `cd backend && ./mvnw test -q`
Expected: Some existing tests may fail because they don't mock ResourceCapService. Fix by adding `@Mock ResourceCapService resourceCapService;` to affected test classes.

- [ ] **Step 5: Fix any failing tests by adding ResourceCapService mock**

For each failing test class, add:
```java
@Mock private ResourceCapService resourceCapService;
```

The mock will allow all calls by default (Mockito returns void for void methods without configuration).

- [ ] **Step 6: Run full test suite again**

Run: `cd backend && ./mvnw test -q`
Expected: ALL PASS

- [ ] **Step 7: Commit**

Stage all modified service, repository, and test files explicitly (list each file — do NOT use `git add -A`):

```bash
git add backend/src/main/java/app/navilla/service/ backend/src/main/java/app/navilla/repository/ backend/src/test/java/app/navilla/service/
git commit -m "feat: wire ResourceCapService into all create methods"
git push
```

---

### Task 9: Resource cap i18n keys

**Files:**
- Modify: `frontend/src/locales/en_US.json`
- Modify: `frontend/src/locales/es_MX.json`

- [ ] **Step 1: Add resource cap error keys to en_US.json**

```json
"errors.resourceCapExceeded": "You've reached the maximum limit for this resource. Please remove some existing items if you need to add more."
```

- [ ] **Step 2: Add resource cap error keys to es_MX.json**

```json
"errors.resourceCapExceeded": "Has alcanzado el límite máximo para este recurso. Por favor elimina algunos elementos existentes si necesitas agregar más."
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/locales/en_US.json frontend/src/locales/es_MX.json
git commit -m "feat: add resource cap i18n keys (en_US + es_MX)"
git push
```

---

## Chunk 3: Validation Sweep + OWASP

### Task 10: Fix SnoozeReminderRequest validation

**Files:**
- Modify: `backend/src/main/java/app/navilla/dto/SnoozeReminderRequest.java`
- Modify: Corresponding service/controller if type changes from String to Instant

- [ ] **Step 1: Read the current SnoozeReminderRequest**

Read `backend/src/main/java/app/navilla/dto/SnoozeReminderRequest.java` and the service that uses it to understand if the `until` field can be changed to `Instant`.

- [ ] **Step 2: Fix the validation**

Preferred: change to `OffsetDateTime` (matches the entity field `Reminder.snoozedUntil`):
```java
public record SnoozeReminderRequest(
    @NotNull @Future OffsetDateTime until
) {}
```
Then simplify `ReminderService.snooze()` — replace `OffsetDateTime.parse(request.until())` with just `request.until()`.

Fallback (if type change causes issues):
```java
public record SnoozeReminderRequest(
    @NotBlank @Size(max = 30)
    @Pattern(regexp = "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}.*")
    String until
) {}
```

- [ ] **Step 3: Run tests**

Run: `cd backend && ./mvnw test -q`
Expected: ALL PASS (fix any tests that break from the type change)

- [ ] **Step 4: Commit**

```bash
git add backend/src/main/java/app/navilla/dto/SnoozeReminderRequest.java
git commit -m "fix: add validation to SnoozeReminderRequest.until"
git push
```

---

### Task 11: Fix UpdateReminderSettingsRequest validation

**Files:**
- Modify: `backend/src/main/java/app/navilla/dto/UpdateReminderSettingsRequest.java`

- [ ] **Step 1: Read the current DTO**

Read `backend/src/main/java/app/navilla/dto/UpdateReminderSettingsRequest.java`.

- [ ] **Step 2: Add validation to quiet hours fields**

Add `@Size(max = 5)` and `@Pattern` to `quietHoursStart` and `quietHoursEnd`:

```java
@Size(max = 5)
@Pattern(regexp = "^\\d{2}:\\d{2}$", message = "Must be in HH:mm format")
String quietHoursStart,

@Size(max = 5)
@Pattern(regexp = "^\\d{2}:\\d{2}$", message = "Must be in HH:mm format")
String quietHoursEnd,
```

- [ ] **Step 3: Run tests**

Run: `cd backend && ./mvnw test -q`
Expected: ALL PASS

- [ ] **Step 4: Commit**

```bash
git add backend/src/main/java/app/navilla/dto/UpdateReminderSettingsRequest.java
git commit -m "fix: add @Pattern validation to quiet hours fields"
git push
```

---

### Task 12: Request body size limits

**Files:**
- Modify: `backend/src/main/resources/application.yaml`

- [ ] **Step 1: Verify the correct property name for Spring Boot 4.0.2**

Search the Spring Boot 4.0.2 docs for the Tomcat max post size property. In Spring Boot 3.x+ it was renamed from `max-http-post-size` to `max-http-form-post-size`. Verify which property Spring Boot 4.0.2 uses.

- [ ] **Step 2: Add the size limits to application.yaml**

Under the `server:` section:

Under `server:`:
```yaml
server:
  tomcat:
    max-http-form-post-size: 1048576  # 1MB
```

Under `spring:` (NOT under `server:` — multipart config belongs to Spring, not Tomcat):
```yaml
spring:
  servlet:
    multipart:
      max-file-size: 1MB
      max-request-size: 1MB
```

- [ ] **Step 3: Verify build starts correctly**

Run: `cd backend && ./mvnw spring-boot:run &` then check logs for any property warnings. Kill the process after verification.

- [ ] **Step 4: Commit**

```bash
git add backend/src/main/resources/application.yaml
git commit -m "fix: add request body size limits (1MB max)"
git push
```

---

### Task 13: Full DTO validation sweep

**Files:**
- Potentially modify: all ~26 request DTOs in `backend/src/main/java/app/navilla/dto/`

- [ ] **Step 1: List and read all request DTOs**

Use glob to find all `*Request.java` files in the dto directory. Read each one and verify:
- Every `String` field has `@Size(max = N)`
- Every list field has `@Size(max = N)` to cap array length
- Every nested DTO reference has `@Valid`
- Every nullable field with constraints uses the correct annotation order

- [ ] **Step 2: Fix any gaps found**

Apply `@Size` constraints following the standard limits from CLAUDE.md:
- Email: 254, Password: 128, Alias/name: 200, Notes: 5000
- Custom field label: 100, Custom field value: 500
- Location: 150, Enum-like: 50, Confirmation inputs: 50

- [ ] **Step 3: Run tests**

Run: `cd backend && ./mvnw test -q`
Expected: ALL PASS

- [ ] **Step 4: Commit**

```bash
git add backend/src/main/java/app/navilla/dto/
git commit -m "fix: complete DTO validation sweep — all string fields capped"
git push
```

---

### Task 14: OWASP review + security headers

**Files:**
- Modify: `backend/src/main/java/app/navilla/config/SecurityConfig.java`
- Modify: `backend/src/main/resources/application.yaml` (CORS cleanup)
- Potentially modify: service files (IDOR check)

- [ ] **Step 1: IDOR audit**

Read each controller and its service. Verify that every endpoint that takes a resource ID (UUID path variable) filters by the authenticated user's hash. Pattern to check:

```java
// SAFE: filters by userHash
repository.findByIdAndUserHash(id, userHash)

// UNSAFE: only filters by ID — user A could access user B's data
repository.findById(id)
```

Fix any IDOR vulnerabilities found.

- [ ] **Step 2: CSP audit**

Check what external resources the frontend loads:
- Google Fonts (`fonts.gstatic.com`, `fonts.googleapis.com`)
- Supabase APIs (`*.supabase.co`)
- Any CDN resources

First, deploy with `Content-Security-Policy-Report-Only` to detect violations without breaking anything:

```java
.contentSecurityPolicy(csp ->
    csp.policyDirectives(
        "default-src 'self'; "
        + "font-src 'self' fonts.gstatic.com; "
        + "style-src 'self' 'unsafe-inline' fonts.googleapis.com; "
        + "connect-src 'self' *.supabase.co; "
        + "img-src 'self' data: blob:"))
```

Note: Start with `Report-Only` header, then switch to enforcing after verifying no breakage.

- [ ] **Step 3: Add missing security headers**

In SecurityConfig's `headers` configuration:

```java
.headers(headers -> headers
    .contentSecurityPolicy(csp -> /* as above */)
    .frameOptions(HeadersConfigurer.FrameOptionsConfig::deny)
    .contentTypeOptions(content -> {})
    .httpStrictTransportSecurity(hsts ->
        hsts.includeSubDomains(true).maxAgeInSeconds(31536000))
    .referrerPolicy(referrer ->
        referrer.policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN))
    .permissionsPolicy(permissions ->
        permissions.policy("camera=(), microphone=(), geolocation=()")))
```

- [ ] **Step 4: Clean up stale CORS origin**

In `application.yaml`, find and remove `http://54.159.90.88` from `navilla.cors.allowed-origins`.

- [ ] **Step 5: Clean up dead spring.mail config**

Remove the unused `spring.mail` section from `application.yaml` (SendGrid uses HTTP API, not SMTP).

- [ ] **Step 6: PII log audit**

Search all log statements for potential PII leakage:
```
grep -r "log\." backend/src/main/java/ | grep -i "email\|phone\|name\|address"
```

Ensure logs use user hashes, not identifiable information. Fix any that leak PII.

- [ ] **Step 7: Dependency vulnerability scan**

Run: `cd backend && ./mvnw dependency:tree > /dev/null && echo "Dependencies OK"`
Run: `cd frontend && npm audit`

For critical/high vulnerabilities: fix by updating dependencies.
For medium/low: document as accepted risks.

- [ ] **Step 8: Verify production profile is correctly set on Railway**

Check Railway environment variables to confirm `SPRING_PROFILES_ACTIVE=production` is set. This ensures the dev actuator exposure (`include: "*"`) is never active in production.

- [ ] **Step 9: Run full test suite**

Run: `cd backend && ./mvnw test -q`
Expected: ALL PASS

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "security: OWASP review — CSP, CORS cleanup, headers, IDOR audit"
git push
```

---

### Task 15: Abuse detection — structured logging + Grafana alerts

**Files:**
- The RateLimitFilter already logs rate limit events (from Task 3)
- The ResourceCapService already logs cap hits (from Task 7)
- Create: Grafana dashboard/alert configuration (documented, applied manually)

- [ ] **Step 1: Verify structured logging format**

Check that the rate limit and resource cap log messages use structured key=value format that Loki can parse. The messages from Tasks 3 and 7 should already use:

```
log.warn("Rate limit exceeded: user={} path={} method={} retryAfter={}s", ...)
log.warn("Resource cap reached: type={} count={} cap={}", ...)
```

If not, update them to use this format.

- [ ] **Step 2: Add auth failure logging**

Check if failed JWT authentication attempts are logged. Spring Security's OAuth2 resource server usually logs these at DEBUG level. In `application-production.yaml`, ensure:

```yaml
logging:
  level:
    org.springframework.security.oauth2: WARN
```

This ensures auth failures are visible in Loki without being drowned by debug noise.

- [ ] **Step 3: Document Grafana/Loki alert rules**

Create a reference document with the LogQL queries to configure as Grafana alerts:

```
# High write volume (>100 writes/hour from single user)
sum by (user) (count_over_time({app="navilla"} |= "Rate limit exceeded" | logfmt | user != "" [1h])) > 100

# High request volume (>1000 requests/hour from single IP)
sum by (ip) (count_over_time({app="navilla"} |= "Rate limit exceeded" | logfmt [1h])) > 1000

# Resource cap hits
{app="navilla"} |= "Resource cap reached"

# Auth failures
{app="navilla"} |= "401" | logfmt
```

Save to `docs/docs/operations/grafana-alerts.md` (create the `operations/` directory under the Docusaurus docs path).

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "ops: add abuse detection logging and Grafana alert documentation"
git push
```

---

## Chunk 4: Content Verification + Mobile Polish

### Task 16: Content verification — audit Layer 0 against official sources

**Files:**
- Potentially modify: `frontend/src/lib/stiContent.ts`

- [ ] **Step 1: Read stiContent.ts**

Read the full file. Extract all medical claims for each of the 10 STIs:
- Symptoms list
- Window periods (minDays, maxDays)
- Transmission routes
- Treatment info
- Curable/vaccine status
- Cost tiers

- [ ] **Step 2: Cross-reference against CDC fact sheets**

For each STI, fetch the current CDC fact sheet and compare:
- Chlamydia: https://www.cdc.gov/chlamydia/
- Gonorrhea: https://www.cdc.gov/gonorrhea/
- Syphilis: https://www.cdc.gov/syphilis/
- HIV: https://www.cdc.gov/hiv/
- Herpes: https://www.cdc.gov/herpes/
- HPV: https://www.cdc.gov/hpv/
- Hepatitis B: https://www.cdc.gov/hepatitis-b/
- Hepatitis C: https://www.cdc.gov/hepatitis-c/
- Trichomoniasis: https://www.cdc.gov/trichomoniasis/
- Mycoplasma genitalium: CDC STI treatment guidelines

Check:
- Are window periods accurate?
- Are symptom lists complete and correct?
- Is curable/vaccine status correct?
- Are treatment descriptions current?

- [ ] **Step 3: Fix discrepancies**

Update `stiContent.ts` with corrected data. For anything requiring medical judgment, create a list for user review.

- [ ] **Step 4: Verify symptom-to-STI mappings**

Check that SYMPTOM_LABELS and the symptoms[] arrays in each STI correctly map symptoms to conditions. No false mappings (symptom listed for an STI that doesn't cause it).

- [ ] **Step 5: Verify window period calculator**

Read the calculator component and verify the logic correctly uses the window period data from stiContent.ts.

- [ ] **Step 6: Run frontend lint and any content tests**

Run: `cd frontend && npm run lint`
Run: `cd frontend && npx vitest run src/lib/stiContent.test.ts`
Expected: ALL PASS

- [ ] **Step 7: Commit**

```bash
git add frontend/src/lib/stiContent.ts
git commit -m "fix: update STI content after CDC/WHO verification audit"
git push
```

---

### Task 17: Mobile polish pass

**Files:**
- Potentially modify: various page components and CSS in `frontend/src/`

- [ ] **Step 1: Set up mobile testing environment**

Open the dev server and use browser DevTools responsive mode at:
- 375px width (iPhone SE)
- 390px width (iPhone 14)

Run: `cd frontend && npm run dev`

- [ ] **Step 2: Audit landing page + Layer 0 public pages**

Walk through each page at both viewport widths. Check:
- Touch targets >= 44x44px
- No text truncation or overflow
- Navigation menu works (hamburger/drawer)
- Hero section readable
- CTAs tappable

Pages: landing, how-it-works, STI guides (all 10), symptom checker, window period calculator, cost estimator, privacy policy, terms

- [ ] **Step 3: Audit authenticated pages**

Walk through each page at both viewport widths:
- Dashboard
- Journal (list + entry modal)
- Health Log (test visits + labs)
- Network (constellation, stats, health cards)
- Connections (list, pagination, add modal)
- Notifications
- Insights
- Verification Card (builder + public view)
- Profile
- More dropdown

Check the same criteria: touch targets, text, forms, modals, tables.

- [ ] **Step 4: Fix issues found**

Fix CSS/layout issues directly. For anything that needs a design decision (e.g., "should this table become cards on mobile?"), screenshot and flag for user review.

- [ ] **Step 5: Verify PWA install experience**

Test the PWA install flow on a real mobile device (or Chrome DevTools Application tab):
- Install prompt appears
- App icon correct
- Splash screen shows
- Standalone mode works (no browser chrome)
- Offline indicator works

- [ ] **Step 6: Run frontend lint**

Run: `cd frontend && npm run lint`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "fix: mobile polish pass — layout and touch target fixes"
git push
```

---

## Chunk 5: E2E Tests + Performance

### Task 18: E2E — Verification cards

**Files:**
- Create: `frontend/e2e/verification-cards.spec.ts`

- [ ] **Step 1: Write verification card E2E tests**

```typescript
import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';

test.describe('Verification Cards', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'user2');
  });

  test('navigates to verification card page', async ({ page }) => {
    // Navigate via More dropdown or direct URL
    await page.goto('/verification-card');
    await expect(page.getByRole('heading')).toContainText(/verification|verificación/i);
  });

  test('creates a new verification card', async ({ page }) => {
    await page.goto('/verification-card');
    // Click create button
    await page.getByRole('button', { name: /create|crear/i }).click();
    // Fill card details (conditions, privacy mode, etc.)
    // Submit and verify card appears in list
    await expect(page.getByText(/card created|tarjeta creada/i)).toBeVisible();
  });

  test('views public card via share link', async ({ page }) => {
    // Navigate to an existing card's share URL
    // Verify the public view renders correctly
    // Check that anti-forgery elements are present
  });
});
```

**Important:** Read `frontend/e2e/seed-data.spec.ts` first — it contains working patterns for form interactions, journal creation, and health log flows. Adapt those selectors. Read the verification card page components to get exact selectors. Public card view is at route `/v/:shareToken`.

- [ ] **Step 2: Run E2E test**

Run: `cd frontend && npx playwright test e2e/verification-cards.spec.ts`
Expected: ALL PASS

- [ ] **Step 3: Commit**

```bash
git add frontend/e2e/verification-cards.spec.ts
git commit -m "test: add E2E tests for verification cards"
git push
```

---

### Task 19: E2E — Phone matching

**Files:**
- Create: `frontend/e2e/phone-matching.spec.ts`

- [ ] **Step 1: Read phone matching UI components**

Understand how phone matching works in the frontend — where the phone input is, how matches are displayed.

- [ ] **Step 2: Write phone matching E2E tests**

Test the phone entry flow:
- Navigate to journal entry creation
- Enter a phone number for matching
- Verify the entry is saved
- Check the connections page for pending matches

Note: Actual phone matching requires two users with matching phone entries. The E2E test may need to create entries from two test accounts or verify the UI handles the "no match yet" state.

- [ ] **Step 3: Run and verify**

Run: `cd frontend && npx playwright test e2e/phone-matching.spec.ts`

- [ ] **Step 4: Commit**

```bash
git add frontend/e2e/phone-matching.spec.ts
git commit -m "test: add E2E tests for phone matching flow"
git push
```

---

### Task 20: E2E — Journal lifecycle

**Files:**
- Create: `frontend/e2e/journal-lifecycle.spec.ts`

- [ ] **Step 1: Write journal CRUD E2E tests**

```typescript
import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';

test.describe('Journal Entry Lifecycle', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'user2');
  });

  test('creates a new journal entry', async ({ page }) => {
    await page.goto('/journal');
    await page.getByRole('button', { name: /add|agregar|new|nuevo/i }).click();
    // Fill form fields
    // Submit
    // Verify entry appears in list
  });

  test('edits an existing journal entry', async ({ page }) => {
    await page.goto('/journal');
    // Click on an existing entry
    // Edit a field
    // Save
    // Verify change persisted
  });

  test('deletes a journal entry', async ({ page }) => {
    await page.goto('/journal');
    // Open an entry
    // Click delete
    // Confirm deletion
    // Verify entry is gone
  });
});
```

- [ ] **Step 2: Run and verify**
- [ ] **Step 3: Commit**

---

### Task 21: E2E — Reminders + Health log

**Files:**
- Create: `frontend/e2e/reminders.spec.ts`
- Create: `frontend/e2e/health-log-crud.spec.ts`

- [ ] **Step 1: Write reminder E2E tests**

Cover: create reminder, snooze reminder, quiet hours settings.

- [ ] **Step 2: Write health log E2E tests**

Cover: add test visit, add lab result, view visit history.

- [ ] **Step 3: Run and verify**
- [ ] **Step 4: Commit**

```bash
git add frontend/e2e/reminders.spec.ts frontend/e2e/health-log-crud.spec.ts
git commit -m "test: add E2E tests for reminders and health log CRUD"
git push
```

---

### Task 22: Performance check

**Files:**
- No files to create — this is an audit task

- [ ] **Step 1: Check bundle size**

Run: `cd frontend && npm run build`

Check the output for chunk sizes. Flag anything over 500KB gzipped. Check if vendor chunks are code-split properly.

- [ ] **Step 2: Verify lazy loading**

Read `frontend/src/router.tsx` (NOT App.tsx — router is where routes are defined). Verify all authenticated routes use `lazyWithReload()` (the project's custom wrapper around `React.lazy`):

```typescript
// GOOD: lazy loaded
const Dashboard = lazy(() => import('./pages/Dashboard'));

// BAD: static import
import Dashboard from './pages/Dashboard';
```

- [ ] **Step 3: Spot-check API response times**

Start the backend and make requests to key endpoints:
- `GET /api/journal` (list)
- `GET /api/connections/confirmed` (paginated)
- `GET /api/health-log/summary`
- `GET /api/network-health`

Flag anything over 500ms.

- [ ] **Step 4: Scan for N+1 queries**

Search service files for patterns like:
```java
// N+1 pattern: fetching in a loop
for (Connection c : connections) {
    User user = userRepository.findByEmailHash(c.getUserBHash()); // N queries!
}
```

The fix is batch fetching: `userRepository.findByEmailHashIn(hashes)`

One N+1 was already fixed in Week 14 (ConnectionService). Check other services.

- [ ] **Step 5: Verify cache effectiveness**

Check that the 6 Caffeine caches are configured correctly in `CacheConfig.java`. Verify key cache consumers:
- `catalog` cache: CatalogController
- `appConfig` cache: AppConfigService
- `healthLogSummary` cache: HealthLogService
- `insights` cache: InsightsService
- `prepStreak` cache: MedicationService
- `networkHealth` cache: NetworkHealthService

- [ ] **Step 6: Check for large assets**

Search for images/assets over 200KB:
```bash
find frontend/public frontend/src -type f \( -name "*.png" -o -name "*.jpg" -o -name "*.svg" \) -size +200k
```

- [ ] **Step 7: Document findings and commit any fixes**

```bash
git add -A
git commit -m "perf: performance audit fixes"
git push
```

---

## Final: Post-Implementation

### Task 23: Update project documentation

**Files:**
- Modify: `CONTEXT.md`
- Modify: `ROADMAP_SUMMARY.md`
- Modify: `docs/static/postman/navilla-api.postman_collection.json`

- [ ] **Step 1: Update CONTEXT.md with session notes**

Add session notes covering what was done: rate limiting, resource caps, validation sweep, OWASP review, abuse detection, content verification, mobile polish, E2E expansion, performance check.

- [ ] **Step 2: Update ROADMAP_SUMMARY.md**

Mark Week 15 and Week 16 as complete. Update current position to Week 17 (soft launch).

- [ ] **Step 3: Update Postman collection**

Document new 429 rate limit responses and Retry-After header behavior for affected endpoints.

- [ ] **Step 4: Close relevant GitHub issues**

Check for any open issues related to security, launch prep, or Week 15-16 work. Close with comments.

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "docs: update project docs after launch readiness sprint"
git push
```
