# Week 14: Network Health Stats + Layer 2 Polish — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add aggregated network health stats (testing activity level, coverage, exposure summary) and fix 11 Layer 2 polish issues.

**Architecture:** New `NetworkHealthService` queries confirmed connections' testing activity to compute High/Medium/Low levels. Reuses existing exposure snapshot for coverage + exposure counts. Frontend shows compact card on Dashboard, full section on Network page. Polish items fix N+1 queries, hardcoded colors, mobile issues, validation gaps, and accessibility.

**Tech Stack:** Java 25 + Spring Boot 4.0.2 (backend), React 19 + TypeScript + TailwindCSS (frontend), Caffeine caching, React Query, i18next.

---

## Task 1: NetworkHealthResponse DTO + TestVisitRepository Query

**Files:**
- Create: `backend/src/main/java/app/navilla/dto/NetworkHealthResponse.java`
- Modify: `backend/src/main/java/app/navilla/repository/TestVisitRepository.java`

**Step 1: Create NetworkHealthResponse record**

```java
package app.navilla.dto;

import java.time.OffsetDateTime;

public record NetworkHealthResponse(
    String testingActivityLevel,       // HIGH, MEDIUM, LOW, UNKNOWN
    String testingActivityKey,         // i18n message key
    int connectionCount,
    Integer secondDegreeCount,
    Integer thirdDegreeCount,
    Integer totalNetworkSize,
    int maxDepth,
    int activeExposureCount,
    int recentlyResolvedCount,
    OffsetDateTime computedAt
) {}
```

**Step 2: Add batch query to TestVisitRepository**

In `backend/src/main/java/app/navilla/repository/TestVisitRepository.java`, add:

```java
@Query("SELECT DISTINCT tv.userHash FROM TestVisit tv WHERE tv.userHash IN :userHashes AND tv.testDate >= :after")
Set<String> findUserHashesWithTestsAfter(@Param("userHashes") Set<String> userHashes, @Param("after") LocalDate after);
```

**Step 3: Commit**

```bash
git add backend/src/main/java/app/navilla/dto/NetworkHealthResponse.java backend/src/main/java/app/navilla/repository/TestVisitRepository.java
git commit -m "feat: add NetworkHealthResponse DTO and batch test visit query"
git push
```

---

## Task 2: NetworkHealthService

**Files:**
- Create: `backend/src/main/java/app/navilla/service/NetworkHealthService.java`
- Create: `backend/src/test/java/app/navilla/service/NetworkHealthServiceTest.java`

**Step 1: Write failing tests**

```java
package app.navilla.service;

import app.navilla.dto.ExposureItem;
import app.navilla.dto.ExposureResponse;
import app.navilla.dto.NetworkHealthResponse;
import app.navilla.entity.Connection;
import app.navilla.entity.User;
import app.navilla.repository.ConnectionRepository;
import app.navilla.repository.TestVisitRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.oauth2.jwt.Jwt;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NetworkHealthServiceTest {

    @Mock private ConnectionRepository connectionRepository;
    @Mock private TestVisitRepository testVisitRepository;
    @Mock private ExposureService exposureService;
    @Mock private HashService hashService;
    @Mock private Jwt jwt;

    @InjectMocks private NetworkHealthService networkHealthService;

    private String userHash;

    @BeforeEach
    void setUp() {
        userHash = "abc123hash";
        when(jwt.getClaimAsString("email")).thenReturn("user@test.com");
        when(hashService.hash("user@test.com")).thenReturn(userHash);
    }

    @Test
    void getNetworkHealth_highActivity_when60PercentTestedRecently() {
        // 5 connections, 3 tested recently = 60% = HIGH
        Set<String> connectionHashes = Set.of("h1", "h2", "h3", "h4", "h5");
        setupConfirmedConnections(connectionHashes);
        when(testVisitRepository.findUserHashesWithTestsAfter(eq(connectionHashes), any(LocalDate.class)))
            .thenReturn(Set.of("h1", "h2", "h3"));
        setupExposureSnapshot(5, 10, 15, 30, List.of(
            new ExposureItem("chlamydia", 2, 1, "0_30d", "active")
        ));

        NetworkHealthResponse result = networkHealthService.getNetworkHealth(jwt);

        assertThat(result.testingActivityLevel()).isEqualTo("HIGH");
        assertThat(result.connectionCount()).isEqualTo(5);
        assertThat(result.activeExposureCount()).isEqualTo(1);
    }

    @Test
    void getNetworkHealth_mediumActivity_when40PercentTested() {
        // 5 connections, 2 tested = 40% = MEDIUM
        Set<String> connectionHashes = Set.of("h1", "h2", "h3", "h4", "h5");
        setupConfirmedConnections(connectionHashes);
        when(testVisitRepository.findUserHashesWithTestsAfter(eq(connectionHashes), any(LocalDate.class)))
            .thenReturn(Set.of("h1", "h2"));
        setupExposureSnapshot(5, 10, 15, 30, List.of());

        NetworkHealthResponse result = networkHealthService.getNetworkHealth(jwt);

        assertThat(result.testingActivityLevel()).isEqualTo("MEDIUM");
    }

    @Test
    void getNetworkHealth_lowActivity_when10PercentTested() {
        // 10 connections, 1 tested = 10% = LOW
        Set<String> connectionHashes = new HashSet<>();
        for (int i = 0; i < 10; i++) connectionHashes.add("h" + i);
        setupConfirmedConnections(connectionHashes);
        when(testVisitRepository.findUserHashesWithTestsAfter(eq(connectionHashes), any(LocalDate.class)))
            .thenReturn(Set.of("h0"));
        setupExposureSnapshot(10, 20, 30, 60, List.of());

        NetworkHealthResponse result = networkHealthService.getNetworkHealth(jwt);

        assertThat(result.testingActivityLevel()).isEqualTo("LOW");
    }

    @Test
    void getNetworkHealth_unknown_whenFewerThan3Connections() {
        Set<String> connectionHashes = Set.of("h1", "h2");
        setupConfirmedConnections(connectionHashes);
        setupExposureSnapshot(2, null, null, 2, List.of());

        NetworkHealthResponse result = networkHealthService.getNetworkHealth(jwt);

        assertThat(result.testingActivityLevel()).isEqualTo("UNKNOWN");
    }

    @Test
    void getNetworkHealth_countsActiveAndResolvedExposures() {
        Set<String> connectionHashes = Set.of("h1", "h2", "h3");
        setupConfirmedConnections(connectionHashes);
        when(testVisitRepository.findUserHashesWithTestsAfter(eq(connectionHashes), any(LocalDate.class)))
            .thenReturn(Set.of("h1", "h2"));
        setupExposureSnapshot(3, 5, 8, 16, List.of(
            new ExposureItem("chlamydia", 2, 1, "0_30d", "active"),
            new ExposureItem("gonorrhea", 1, 2, "0_30d", "active"),
            new ExposureItem("syphilis", 1, 1, "31_90d", "resolved")
        ));

        NetworkHealthResponse result = networkHealthService.getNetworkHealth(jwt);

        assertThat(result.activeExposureCount()).isEqualTo(2);
        assertThat(result.recentlyResolvedCount()).isEqualTo(1);
    }

    @Test
    void getNetworkHealth_reciprocityRequired_returnsNull() {
        ExposureResponse reciprocityRequired = new ExposureResponse(
            null, null, null, null, null, null, null, null,
            "exposure.reciprocityRequired", null
        );
        when(exposureService.getExposureSnapshot(jwt)).thenReturn(reciprocityRequired);

        NetworkHealthResponse result = networkHealthService.getNetworkHealth(jwt);

        assertThat(result).isNull();
    }

    // Helper methods
    private void setupConfirmedConnections(Set<String> partnerHashes) {
        List<Connection> connections = new ArrayList<>();
        for (String hash : partnerHashes) {
            Connection c = new Connection();
            c.setRequesterHash(userHash);
            c.setRecipientHash(hash);
            c.setStatus("CONFIRMED");
            connections.add(c);
        }
        when(connectionRepository.findConfirmedByUserHash(userHash)).thenReturn(connections);
    }

    private void setupExposureSnapshot(Integer conn, Integer deg2, Integer deg3, Integer total, List<ExposureItem> exposures) {
        ExposureResponse snapshot = new ExposureResponse(
            conn, deg2, deg3, total, 3, exposures,
            OffsetDateTime.now(), OffsetDateTime.now().plusDays(1), null, null
        );
        when(exposureService.getExposureSnapshot(jwt)).thenReturn(snapshot);
    }
}
```

**Step 2: Run tests to verify they fail**

Run: `cd backend && ./mvnw test -pl . -Dtest=NetworkHealthServiceTest -Dsurefire.failIfNoTests=false`
Expected: Compilation failure (class not found)

**Step 3: Implement NetworkHealthService**

```java
package app.navilla.service;

import app.navilla.dto.ExposureItem;
import app.navilla.dto.ExposureResponse;
import app.navilla.dto.NetworkHealthResponse;
import app.navilla.entity.Connection;
import app.navilla.repository.ConnectionRepository;
import app.navilla.repository.TestVisitRepository;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class NetworkHealthService {

    private static final int PRIVACY_THRESHOLD = 3;
    private static final int TESTING_WINDOW_DAYS = 90;
    private static final double HIGH_THRESHOLD = 0.60;
    private static final double MEDIUM_THRESHOLD = 0.30;

    private final ConnectionRepository connectionRepository;
    private final TestVisitRepository testVisitRepository;
    private final ExposureService exposureService;
    private final HashService hashService;

    public NetworkHealthService(ConnectionRepository connectionRepository,
                                 TestVisitRepository testVisitRepository,
                                 ExposureService exposureService,
                                 HashService hashService) {
        this.connectionRepository = connectionRepository;
        this.testVisitRepository = testVisitRepository;
        this.exposureService = exposureService;
        this.hashService = hashService;
    }

    @Cacheable(value = "networkHealth", key = "#jwt.subject")
    public NetworkHealthResponse getNetworkHealth(Jwt jwt) {
        String email = jwt.getClaimAsString("email");
        String userHash = hashService.hash(email);

        // Reuse exposure snapshot (respects reciprocity guard)
        ExposureResponse exposure = exposureService.getExposureSnapshot(jwt);
        if (exposure.message() != null && exposure.message().contains("reciprocityRequired")) {
            return null;
        }

        // Get 1st-degree connection hashes
        List<Connection> confirmed = connectionRepository.findConfirmedByUserHash(userHash);
        Set<String> partnerHashes = confirmed.stream()
            .map(c -> c.getRequesterHash().equals(userHash) ? c.getRecipientHash() : c.getRequesterHash())
            .collect(Collectors.toSet());

        int connectionCount = partnerHashes.size();

        // Compute testing activity level
        String level;
        String levelKey;
        if (connectionCount < PRIVACY_THRESHOLD) {
            level = "UNKNOWN";
            levelKey = "networkHealth.activity.unknown";
        } else {
            LocalDate cutoff = LocalDate.now().minusDays(TESTING_WINDOW_DAYS);
            Set<String> testedHashes = testVisitRepository.findUserHashesWithTestsAfter(partnerHashes, cutoff);
            double rate = (double) testedHashes.size() / connectionCount;

            if (rate >= HIGH_THRESHOLD) {
                level = "HIGH";
                levelKey = "networkHealth.activity.high";
            } else if (rate >= MEDIUM_THRESHOLD) {
                level = "MEDIUM";
                levelKey = "networkHealth.activity.medium";
            } else {
                level = "LOW";
                levelKey = "networkHealth.activity.low";
            }
        }

        // Count active and recently resolved exposures
        List<ExposureItem> exposures = exposure.exposures() != null ? exposure.exposures() : List.of();
        int activeCount = (int) exposures.stream().filter(e -> "active".equals(e.status())).count();
        int resolvedCount = (int) exposures.stream().filter(e -> "resolved".equals(e.status())).count();

        return new NetworkHealthResponse(
            level,
            levelKey,
            connectionCount,
            exposure.secondDegreeCount(),
            exposure.thirdDegreeCount(),
            exposure.totalGraphNodes(),
            exposure.maxDepth() != null ? exposure.maxDepth() : 3,
            activeCount,
            resolvedCount,
            OffsetDateTime.now()
        );
    }
}
```

**Step 4: Run tests to verify they pass**

Run: `cd backend && ./mvnw test -pl . -Dtest=NetworkHealthServiceTest`
Expected: All 6 tests pass

**Step 5: Commit**

```bash
git add backend/src/main/java/app/navilla/service/NetworkHealthService.java backend/src/test/java/app/navilla/service/NetworkHealthServiceTest.java
git commit -m "feat: add NetworkHealthService with testing activity calculation"
git push
```

---

## Task 3: NetworkHealthController + Cache Config

**Files:**
- Create: `backend/src/main/java/app/navilla/controller/NetworkHealthController.java`
- Create: `backend/src/test/java/app/navilla/controller/NetworkHealthControllerTest.java`
- Modify: `backend/src/main/java/app/navilla/config/CacheConfig.java`

**Step 1: Add networkHealth cache to CacheConfig**

In `CacheConfig.java`, add a new cache alongside the existing ones (look for the cache map builder section):

```java
caches.put("networkHealth", Caffeine.newBuilder()
    .expireAfterWrite(Duration.ofMinutes(5))
    .maximumSize(500)
    .build());
```

**Step 2: Write controller integration test**

Follow the pattern from `InsightsController` tests. Create:

```java
package app.navilla.controller;

import app.navilla.dto.NetworkHealthResponse;
import app.navilla.service.NetworkHealthService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.bean.MockBean;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.test.web.servlet.MockMvc;

import java.time.OffsetDateTime;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(NetworkHealthController.class)
class NetworkHealthControllerTest {

    @Autowired private MockMvc mockMvc;
    @MockBean private NetworkHealthService networkHealthService;

    @Test
    void getNetworkHealth_returnsResponse() throws Exception {
        NetworkHealthResponse response = new NetworkHealthResponse(
            "HIGH", "networkHealth.activity.high", 8, 15, 8, 31, 3, 1, 0, OffsetDateTime.now()
        );
        when(networkHealthService.getNetworkHealth(any())).thenReturn(response);

        mockMvc.perform(get("/api/network-health")
                .with(SecurityMockMvcRequestPostProcessors.jwt()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.testingActivityLevel").value("HIGH"))
            .andExpect(jsonPath("$.connectionCount").value(8))
            .andExpect(jsonPath("$.activeExposureCount").value(1));
    }

    @Test
    void getNetworkHealth_reciprocityRequired_returns204() throws Exception {
        when(networkHealthService.getNetworkHealth(any())).thenReturn(null);

        mockMvc.perform(get("/api/network-health")
                .with(SecurityMockMvcRequestPostProcessors.jwt()))
            .andExpect(status().isNoContent());
    }
}
```

**Step 3: Implement controller**

```java
package app.navilla.controller;

import app.navilla.dto.NetworkHealthResponse;
import app.navilla.service.NetworkHealthService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/network-health")
public class NetworkHealthController {

    private final NetworkHealthService networkHealthService;

    public NetworkHealthController(NetworkHealthService networkHealthService) {
        this.networkHealthService = networkHealthService;
    }

    @GetMapping
    public ResponseEntity<NetworkHealthResponse> getNetworkHealth(@AuthenticationPrincipal Jwt jwt) {
        NetworkHealthResponse response = networkHealthService.getNetworkHealth(jwt);
        if (response == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(response);
    }
}
```

**Step 4: Run tests**

Run: `cd backend && ./mvnw test -pl . -Dtest="NetworkHealth*Test"`
Expected: All tests pass

**Step 5: Commit**

```bash
git add backend/src/main/java/app/navilla/controller/NetworkHealthController.java backend/src/test/java/app/navilla/controller/NetworkHealthControllerTest.java backend/src/main/java/app/navilla/config/CacheConfig.java
git commit -m "feat: add GET /api/network-health endpoint with 5min cache"
git push
```

---

## Task 4: Frontend API Client + Hook + i18n Keys

**Files:**
- Modify: `frontend/src/lib/api.ts` — add NetworkHealth type + API method
- Create: `frontend/src/hooks/useNetworkHealth.ts`
- Modify: `frontend/src/locales/en_US.json` — add networkHealth keys
- Modify: `frontend/src/locales/es_MX.json` — add networkHealth keys

**Step 1: Add type and API method to api.ts**

Add the `NetworkHealth` interface near the other response types:

```typescript
export interface NetworkHealth {
  testingActivityLevel: 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN';
  testingActivityKey: string;
  connectionCount: number;
  secondDegreeCount: number | null;
  thirdDegreeCount: number | null;
  totalNetworkSize: number | null;
  maxDepth: number;
  activeExposureCount: number;
  recentlyResolvedCount: number;
  computedAt: string;
}
```

Add the API method in the `api` object:

```typescript
networkHealth: {
  get: (token: string): Promise<NetworkHealth | null> =>
    apiRequest<NetworkHealth>('/api/network-health', token).catch((err) => {
      if (err.status === 204) return null;
      throw err;
    }),
},
```

**Step 2: Create useNetworkHealth hook**

```typescript
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';

export function useNetworkHealth() {
  const { session } = useAuth();
  return useQuery({
    queryKey: ['networkHealth'],
    queryFn: () => api.networkHealth.get(session!.access_token),
    enabled: !!session?.access_token,
    staleTime: 5 * 60 * 1000,
  });
}
```

**Step 3: Add i18n keys to en_US.json**

Add under a new `"networkHealth"` key:

```json
"networkHealth": {
  "title": "Network Health",
  "testingActivity": "Testing Activity",
  "activity": {
    "high": "Most of your network has tested recently",
    "medium": "Some of your network has tested recently",
    "low": "Few in your network have tested recently",
    "unknown": "Not enough connections to determine"
  },
  "levelHigh": "High",
  "levelMedium": "Medium",
  "levelLow": "Low",
  "levelUnknown": "Unknown",
  "networkCoverage": "Network Coverage",
  "directConnections": "direct connections",
  "extendedConnections": "extended connections",
  "uniquePeople": "~{{count}} unique people across {{degrees}} degrees",
  "exposureSummary": "Exposure Summary",
  "activeConditions": "{{count}} active condition in your network",
  "activeConditions_plural": "{{count}} active conditions in your network",
  "resolvedRecently": "{{count}} resolved in last 30 days",
  "noActiveExposures": "No active exposures in your network",
  "compactSummary": "{{connections}} connections · {{network}} in network"
}
```

**Step 4: Add i18n keys to es_MX.json**

```json
"networkHealth": {
  "title": "Salud de la Red",
  "testingActivity": "Actividad de Pruebas",
  "activity": {
    "high": "La mayoría de tu red se ha hecho pruebas recientemente",
    "medium": "Algunos en tu red se han hecho pruebas recientemente",
    "low": "Pocos en tu red se han hecho pruebas recientemente",
    "unknown": "No hay suficientes conexiones para determinar"
  },
  "levelHigh": "Alta",
  "levelMedium": "Media",
  "levelLow": "Baja",
  "levelUnknown": "Desconocida",
  "networkCoverage": "Cobertura de Red",
  "directConnections": "conexiones directas",
  "extendedConnections": "conexiones extendidas",
  "uniquePeople": "~{{count}} personas únicas en {{degrees}} grados",
  "exposureSummary": "Resumen de Exposición",
  "activeConditions": "{{count}} condición activa en tu red",
  "activeConditions_plural": "{{count}} condiciones activas en tu red",
  "resolvedRecently": "{{count}} resueltas en los últimos 30 días",
  "noActiveExposures": "Sin exposiciones activas en tu red",
  "compactSummary": "{{connections}} conexiones · {{network}} en la red"
}
```

**Step 5: Commit**

```bash
git add frontend/src/lib/api.ts frontend/src/hooks/useNetworkHealth.ts frontend/src/locales/en_US.json frontend/src/locales/es_MX.json
git commit -m "feat: add network health API client, hook, and i18n keys"
git push
```

---

## Task 5: NetworkHealthCard on Dashboard + NetworkHealthSection on Network Page

**Files:**
- Create: `frontend/src/components/network/NetworkHealthCard.tsx`
- Create: `frontend/src/components/network/NetworkHealthSection.tsx`
- Modify: `frontend/src/pages/DashboardPage.tsx` — add compact card
- Modify: `frontend/src/pages/NetworkPage.tsx` — add full section

**Step 1: Create NetworkHealthCard (compact for Dashboard)**

```tsx
import { useTranslation } from 'react-i18next';
import { Activity } from 'lucide-react';
import { NetworkHealth } from '../../lib/api';

interface Props {
  data: NetworkHealth;
}

const levelColors: Record<string, { bg: string; text: string; dot: string }> = {
  HIGH: { bg: 'var(--color-success-bg, rgba(22, 163, 74, 0.1))', text: 'var(--color-success)', dot: 'var(--color-success)' },
  MEDIUM: { bg: 'var(--color-warning-bg, rgba(227, 160, 8, 0.1))', text: 'var(--color-warning)', dot: 'var(--color-warning)' },
  LOW: { bg: 'var(--color-error-bg, rgba(220, 53, 69, 0.1))', text: 'var(--color-error)', dot: 'var(--color-error)' },
  UNKNOWN: { bg: 'var(--color-background-secondary)', text: 'var(--color-muted)', dot: 'var(--color-muted)' },
};

export default function NetworkHealthCard({ data }: Props) {
  const { t } = useTranslation();
  const colors = levelColors[data.testingActivityLevel] || levelColors.UNKNOWN;
  const levelLabel = t(`networkHealth.level${data.testingActivityLevel.charAt(0) + data.testingActivityLevel.slice(1).toLowerCase()}`);

  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 mb-2">
        <Activity className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
        <h3 className="font-semibold text-sm">{t('networkHealth.title')}</h3>
      </div>
      <div className="flex items-center gap-2 mb-1">
        <span
          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium"
          style={{ background: colors.bg, color: colors.text }}
          role="status"
        >
          <span className="w-2 h-2 rounded-full" style={{ background: colors.dot }} aria-hidden="true" />
          {levelLabel}
        </span>
        <span className="text-xs text-muted">
          {t(`networkHealth.activity.${data.testingActivityLevel.toLowerCase()}`)}
        </span>
      </div>
      <p className="text-xs text-muted">
        {t('networkHealth.compactSummary', {
          connections: data.connectionCount,
          network: data.totalNetworkSize ?? data.connectionCount,
        })}
      </p>
    </div>
  );
}
```

**Step 2: Create NetworkHealthSection (full for Network page)**

```tsx
import { useTranslation } from 'react-i18next';
import { Activity, Users, Shield } from 'lucide-react';
import { NetworkHealth } from '../../lib/api';

interface Props {
  data: NetworkHealth;
}

const levelColors: Record<string, { bg: string; text: string; dot: string }> = {
  HIGH: { bg: 'var(--color-success-bg, rgba(22, 163, 74, 0.1))', text: 'var(--color-success)', dot: 'var(--color-success)' },
  MEDIUM: { bg: 'var(--color-warning-bg, rgba(227, 160, 8, 0.1))', text: 'var(--color-warning)', dot: 'var(--color-warning)' },
  LOW: { bg: 'var(--color-error-bg, rgba(220, 53, 69, 0.1))', text: 'var(--color-error)', dot: 'var(--color-error)' },
  UNKNOWN: { bg: 'var(--color-background-secondary)', text: 'var(--color-muted)', dot: 'var(--color-muted)' },
};

export default function NetworkHealthSection({ data }: Props) {
  const { t } = useTranslation();
  const colors = levelColors[data.testingActivityLevel] || levelColors.UNKNOWN;
  const levelLabel = t(`networkHealth.level${data.testingActivityLevel.charAt(0) + data.testingActivityLevel.slice(1).toLowerCase()}`);

  return (
    <div className="space-y-4 p-4">
      <h3 className="font-semibold flex items-center gap-2">
        <Activity className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
        {t('networkHealth.title')}
      </h3>

      {/* Testing Activity */}
      <div className="card p-4">
        <h4 className="text-sm font-medium mb-2">{t('networkHealth.testingActivity')}</h4>
        <div className="flex items-center gap-2">
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium"
            style={{ background: colors.bg, color: colors.text }}
            role="status"
          >
            <span className="w-2 h-2 rounded-full" style={{ background: colors.dot }} aria-hidden="true" />
            {levelLabel}
          </span>
        </div>
        <p className="text-sm text-muted mt-1">
          {t(`networkHealth.activity.${data.testingActivityLevel.toLowerCase()}`)}
        </p>
      </div>

      {/* Network Coverage */}
      <div className="card p-4">
        <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
          <Users className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
          {t('networkHealth.networkCoverage')}
        </h4>
        <div className="space-y-1 text-sm">
          <p><span className="font-medium">{data.connectionCount}</span> {t('networkHealth.directConnections')}</p>
          {data.secondDegreeCount != null && (
            <p><span className="font-medium">{(data.secondDegreeCount || 0) + (data.thirdDegreeCount || 0)}</span> {t('networkHealth.extendedConnections')}</p>
          )}
          {data.totalNetworkSize != null && (
            <p className="text-muted">
              {t('networkHealth.uniquePeople', { count: data.totalNetworkSize, degrees: data.maxDepth })}
            </p>
          )}
        </div>
      </div>

      {/* Exposure Summary */}
      <div className="card p-4">
        <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
          <Shield className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
          {t('networkHealth.exposureSummary')}
        </h4>
        <div className="space-y-1 text-sm">
          {data.activeExposureCount > 0 ? (
            <p>{t('networkHealth.activeConditions', { count: data.activeExposureCount })}</p>
          ) : (
            <p className="text-muted">{t('networkHealth.noActiveExposures')}</p>
          )}
          {data.recentlyResolvedCount > 0 && (
            <p className="text-muted">{t('networkHealth.resolvedRecently', { count: data.recentlyResolvedCount })}</p>
          )}
        </div>
      </div>
    </div>
  );
}
```

**Step 3: Add NetworkHealthCard to DashboardPage**

In `DashboardPage.tsx`, import and add after the constellation preview card. Use `useNetworkHealth()` hook. Only render if data exists (reciprocity opted in).

**Step 4: Add NetworkHealthSection to NetworkPage**

In `NetworkPage.tsx`, add below the constellation visualization div (around line 82). Use `useNetworkHealth()` hook. Only render if data exists.

**Step 5: Commit**

```bash
git add frontend/src/components/network/NetworkHealthCard.tsx frontend/src/components/network/NetworkHealthSection.tsx frontend/src/pages/DashboardPage.tsx frontend/src/pages/NetworkPage.tsx
git commit -m "feat: add network health cards to Dashboard and Network page"
git push
```

---

## Task 6: P1 — Fix N+1 Queries in ConnectionService

**Files:**
- Modify: `backend/src/main/java/app/navilla/repository/UserRepository.java` — add batch query
- Modify: `backend/src/main/java/app/navilla/service/ConnectionService.java` — batch-fetch users
- Modify: existing ConnectionService tests to verify batch behavior

**Step 1: Add batch query to UserRepository**

```java
List<User> findByEmailHashIn(Set<String> emailHashes);
```

**Step 2: Refactor ConnectionService**

Change `getConnections()`, `getPendingSent()`, `getConfirmedConnections()`, and `getStats()` to:
1. Collect all partner hashes from connections
2. Batch-fetch all users: `userRepository.findByEmailHashIn(partnerHashes)`
3. Build a `Map<String, User>` lookup
4. Pass the map to `toConnectionResponse()` instead of querying per connection

Change `toConnectionResponse()` signature:
```java
private ConnectionResponse toConnectionResponse(Connection connection, String currentUserHash, Map<String, User> userLookup)
```

Use `userLookup.get(partnerHash)` instead of `userRepository.findByEmailHash(partnerHash)`.

**Step 3: Run all connection tests**

Run: `cd backend && ./mvnw test -pl . -Dtest="Connection*Test"`
Expected: All tests pass

**Step 4: Commit**

```bash
git add backend/src/main/java/app/navilla/repository/UserRepository.java backend/src/main/java/app/navilla/service/ConnectionService.java
git commit -m "perf: batch-fetch users in ConnectionService to fix N+1 queries"
git push
```

---

## Task 7: P4 + P5 + P6 + P8 — Verification Card Backend Fixes

**Files:**
- Modify: `backend/src/main/java/app/navilla/dto/CreateVerificationCardRequest.java`
- Modify: `backend/src/main/java/app/navilla/dto/UpdateVerificationCardRequest.java`
- Modify: `backend/src/main/java/app/navilla/repository/VerificationCardRepository.java`
- Modify: `backend/src/main/java/app/navilla/service/VerificationCardService.java`
- Modify: `backend/src/main/java/app/navilla/controller/VerificationCardController.java`
- Add tests for each fix

**Step 1: P4 — Add @Size to conditions list in both DTOs**

In `CreateVerificationCardRequest.java` and `UpdateVerificationCardRequest.java`:

```java
@Valid
@Size(max = 50, message = "verification.error.tooManyConditions")
List<@Size(max = 50) String> includedConditions
```

**Step 2: P5 — Atomic view counting**

Add to `VerificationCardRepository.java`:

```java
@Modifying
@Query("UPDATE VerificationCard v SET v.currentViews = v.currentViews + 1 WHERE v.id = :id AND (v.maxViews IS NULL OR v.currentViews < v.maxViews)")
int incrementViewsIfAllowed(@Param("id") UUID id);
```

Update `VerificationCardService.java` to use the atomic query instead of read-check-write:

```java
int updated = verificationCardRepository.incrementViewsIfAllowed(card.getId());
if (updated == 0 && card.getMaxViews() != null) {
    throw new IllegalStateException("card.error.viewLimitReached");
}
```

**Step 3: P6 — Replace hardcoded error messages with i18n keys**

In `VerificationCardService.java`, replace:
- `"User not found"` → `"user.error.notFound"`
- `"First name, last name, and username must be set"` → `"card.error.incompleteProfile"`
- `"Card not found"` → `"card.error.notFound"`
- `"Card has expired"` → `"card.error.expired"`
- `"Card view limit reached"` → `"card.error.viewLimitReached"`

**Step 4: P8 — Add shareToken validation to controller**

In `VerificationCardController.java`, add `@Size` to path variable:

```java
@GetMapping("/api/public/cards/{shareToken}")
public ResponseEntity<?> getPublicCard(@PathVariable @Size(min = 1, max = 64) String shareToken)
```

Same for the `/verify` endpoint. Add `@Validated` to the controller class.

**Step 5: Write tests for P5 (atomic view counting)**

Test that concurrent calls don't exceed maxViews — use the repository method directly.

**Step 6: Run all verification card tests**

Run: `cd backend && ./mvnw test -pl . -Dtest="VerificationCard*Test"`
Expected: All tests pass

**Step 7: Commit**

```bash
git add backend/src/main/java/app/navilla/dto/CreateVerificationCardRequest.java backend/src/main/java/app/navilla/dto/UpdateVerificationCardRequest.java backend/src/main/java/app/navilla/repository/VerificationCardRepository.java backend/src/main/java/app/navilla/service/VerificationCardService.java backend/src/main/java/app/navilla/controller/VerificationCardController.java
git commit -m "fix: verification card validation, atomic views, i18n errors, token length"
git push
```

---

## Task 8: P2 + P7 + P9 — Frontend Color, Date, and Accessibility Fixes

**Files:**
- Modify: `frontend/src/pages/DashboardPage.tsx` — CSS variables, status label
- Modify: `frontend/src/pages/ConnectionsPage.tsx` — date locale
- Modify: `frontend/src/pages/HealthLogPage.tsx` — date locale

**Step 1: P2 — Replace hardcoded colors with CSS variables in DashboardPage**

Find all inline `rgba(99, 102, 241, ...)` and replace with CSS variable references. For example, quick action button backgrounds:

```tsx
style={{ background: 'var(--color-primary-light-bg)', color: 'var(--color-primary)' }}
```

Add the CSS variable `--color-primary-light-bg: rgba(99, 102, 241, 0.08)` to the root CSS if it doesn't exist.

Also fix any hardcoded colors in HealthLogPage and ProfilePage exposure/urgency styling.

**Step 2: P7 — Fix date locale in ConnectionsPage and HealthLogPage**

Replace all `.toLocaleDateString()` calls (without locale) with:

```tsx
.toLocaleDateString(i18n.language.replace('_', '-'), { year: 'numeric', month: 'short', day: 'numeric' })
```

Import `useTranslation` if not already imported. Use `i18n` from the hook.

**Step 3: P9 — Add text label to status indicator on Dashboard**

Find the status circle (red/green based on `hasPositiveStatus`). Add a text label:

```tsx
<span className="sr-only">
  {hasPositiveStatus ? t('dashboard.statusActive') : t('dashboard.statusClear')}
</span>
```

Also add visible text next to the circle for sighted users: a small label like "Active exposure" / "No active exposure" in muted text.

Add i18n keys for both locales.

**Step 4: Run frontend lint**

Run: `cd frontend && npm run lint`
Expected: No errors

**Step 5: Commit**

```bash
git add frontend/src/pages/DashboardPage.tsx frontend/src/pages/ConnectionsPage.tsx frontend/src/pages/HealthLogPage.tsx frontend/src/locales/en_US.json frontend/src/locales/es_MX.json
git commit -m "fix: CSS variables, date locale, status indicator accessibility"
git push
```

---

## Task 9: P3 — Mobile Responsiveness Fixes

**Files:**
- Modify: `frontend/src/pages/DashboardPage.tsx` — quick action buttons
- Modify: `frontend/src/pages/VerificationCardPage.tsx` — action buttons
- Modify: `frontend/src/pages/ProfilePage.tsx` — segmented control

**Step 1: Dashboard quick action buttons**

Change the grid to show icons-only on very small screens, text + icon on larger:

```tsx
<span className="hidden sm:inline">{t('dashboard.goToHealth')}</span>
```

Keep icons always visible. Adjust grid: `grid-cols-4` with smaller gap on mobile, or `grid-cols-2 sm:grid-cols-4`.

**Step 2: Verification card action buttons**

Stack buttons vertically on mobile:

```tsx
<div className="flex flex-col sm:flex-row flex-wrap gap-2">
```

**Step 3: Profile segmented control**

Abbreviate labels on small screens:

```tsx
<span className="sm:hidden">{t('profile.visibility.privateShort')}</span>
<span className="hidden sm:inline">{t('profile.visibility.private')}</span>
```

Add short label i18n keys: "Priv" / "Conn" / "Pub" for en_US, "Priv" / "Con" / "Púb" for es_MX.

**Step 4: Run frontend lint**

Run: `cd frontend && npm run lint`
Expected: No errors

**Step 5: Commit**

```bash
git add frontend/src/pages/DashboardPage.tsx frontend/src/pages/VerificationCardPage.tsx frontend/src/pages/ProfilePage.tsx frontend/src/locales/en_US.json frontend/src/locales/es_MX.json
git commit -m "fix: mobile responsiveness for buttons and segmented control"
git push
```

---

## Task 10: P10 + P11 — Focus Traps and Empty States

**Files:**
- Modify: `frontend/src/pages/ProfilePage.tsx` — focus trap in delete modal
- Modify: `frontend/src/pages/VerificationCardPage.tsx` — focus trap in delete confirm
- Modify: `frontend/src/pages/ConnectionsPage.tsx` — empty state icons
- Modify: `frontend/src/pages/HealthLogPage.tsx` — exposure empty state icon

**Step 1: P10 — Focus trap in ProfilePage delete modal**

Add `useEffect` to focus the cancel button when the modal opens. Add `onKeyDown` handler for Escape:

```tsx
const cancelRef = useRef<HTMLButtonElement>(null);

useEffect(() => {
  if (showDeleteModal) {
    cancelRef.current?.focus();
  }
}, [showDeleteModal]);
```

Add `ref={cancelRef}` to the cancel button. Add Escape key handler to close modal.

**Step 2: P10 — Focus in VerificationCardPage delete confirmation**

When delete confirmation appears (inline), focus the cancel button:

```tsx
useEffect(() => {
  if (deleteConfirmId) {
    document.getElementById(`cancel-delete-${deleteConfirmId}`)?.focus();
  }
}, [deleteConfirmId]);
```

**Step 3: P11 — Empty state icons on ConnectionsPage**

Replace plain muted text with icon + text pattern:

```tsx
<div className="text-center py-8">
  <Users className="w-10 h-10 mx-auto text-muted mb-2 opacity-50" />
  <p className="text-sm text-muted">{t('connections.noConfirmed')}</p>
</div>
```

Apply same pattern to pending incoming and pending sent empty states.

**Step 4: P11 — Empty state icon on HealthLogPage exposure section**

```tsx
<div className="text-center py-6">
  <Shield className="w-10 h-10 mx-auto text-muted mb-2 opacity-50" />
  <p className="text-sm text-muted">{t('health.noExposure')}</p>
</div>
```

**Step 5: Run frontend lint**

Run: `cd frontend && npm run lint`
Expected: No errors

**Step 6: Commit**

```bash
git add frontend/src/pages/ProfilePage.tsx frontend/src/pages/VerificationCardPage.tsx frontend/src/pages/ConnectionsPage.tsx frontend/src/pages/HealthLogPage.tsx
git commit -m "fix: focus traps in modals, icons in empty states"
git push
```

---

## Task 11: Run Full Test Suite + Update Docs

**Files:**
- Modify: `CONTEXT.md` — add session notes
- Modify: `ROADMAP_SUMMARY.md` — mark Week 14 complete

**Step 1: Run backend tests**

Run: `cd backend && ./mvnw test`
Expected: All tests pass (should be ~465+ with new tests)

**Step 2: Run frontend lint**

Run: `cd frontend && npm run lint`
Expected: No errors

**Step 3: Update CONTEXT.md with session notes**

Add Week 14 session notes: what was built, key decisions, test counts.

**Step 4: Update ROADMAP_SUMMARY.md**

Mark Week 14 as complete. Update current position to Phase 4.

**Step 5: Commit docs**

```bash
git add CONTEXT.md ROADMAP_SUMMARY.md
git commit -m "docs: mark Week 14 complete, update session notes"
git push
```
