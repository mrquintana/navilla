/*
 * Copyright 2026 Navilla
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package app.navilla.service;

import java.time.OffsetDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayDeque;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import app.navilla.dto.ExposureDebugResponse;
import app.navilla.dto.ExposureItem;
import app.navilla.dto.ExposureResponse;
import app.navilla.entity.Connection;
import app.navilla.entity.ConnectionStatus;
import app.navilla.entity.ExposureSnapshot;
import app.navilla.entity.HealthStatus;
import app.navilla.entity.HealthStatusValue;
import app.navilla.repository.ConnectionRepository;
import app.navilla.repository.ExposureSnapshotRepository;
import app.navilla.repository.HealthStatusRepository;
import app.navilla.security.EncryptionService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class ExposureService {

  private final ConnectionRepository connectionRepository;
  private final HealthStatusRepository healthStatusRepository;
  private final ExposureSnapshotRepository exposureSnapshotRepository;
  private final EncryptionService encryptionService;
  private final ObjectMapper objectMapper;

  @Value("${navilla.privacy.minimum-connections}")
  private int minimumConnections;

  @Value("${navilla.exposure.max-depth}")
  private int maxDepth;

  @Value("${navilla.exposure.snapshot-ttl-days}")
  private int snapshotTtlDays;

  @Transactional(readOnly = true)
  public ExposureResponse getExposureSnapshot(Jwt jwt) {
    String userHash = encryptionService.hashEmail(jwt.getClaimAsString("email"));

    ExposureSnapshot snapshot = exposureSnapshotRepository.findByUserHash(userHash).orElse(null);
    if (snapshot != null && snapshot.getExpiresAt().isAfter(OffsetDateTime.now())) {
      return decodeSnapshot(snapshot);
    }

    ExposureResponse response = computeExposureSnapshot(userHash);
    persistSnapshot(userHash, response);
    return response;
  }

  /**
   * Computes a debug view of exposure data without relying on cached snapshots.
   *
   * @param userHash hashed user identifier
   * @return debug exposure response
   */
  @Transactional(readOnly = true)
  public ExposureDebugResponse getExposureDebug(String userHash) {
    Map<String, Set<String>> graph = buildConnectionGraph();
    Map<String, Integer> degrees = computeDegrees(graph, userHash, maxDepth);
    ExposureResponse response = computeExposureSnapshot(userHash);

    List<String> firstDegree = degreeHashes(degrees, 1);
    List<String> secondDegree = degreeHashes(degrees, 2);
    List<String> thirdDegree = degreeHashes(degrees, 3);

    return new ExposureDebugResponse(
        userHash,
        firstDegree.size(),
        secondDegree.size(),
        thirdDegree.size(),
        response.totalGraphNodes() == null ? 0 : response.totalGraphNodes(),
        maxDepth,
        firstDegree,
        secondDegree,
        thirdDegree,
        response.exposures(),
        response.message(),
        response.recommendation(),
        OffsetDateTime.now()
    );
  }

  /**
   * Forces recomputation of the exposure snapshot for the authenticated user.
   *
   * @param jwt the JWT token containing user info
   * @return a newly computed exposure snapshot
   */
  @Transactional
  public ExposureResponse recomputeExposureSnapshot(Jwt jwt) {
    String userHash = encryptionService.hashEmail(jwt.getClaimAsString("email"));
    ExposureResponse response = computeExposureSnapshot(userHash);
    persistSnapshot(userHash, response);
    return response;
  }

  private ExposureResponse computeExposureSnapshot(String userHash) {
    Map<String, Set<String>> graph = buildConnectionGraph();
    Map<String, Integer> degrees = computeDegrees(graph, userHash, maxDepth);

    int connectionCount = (int) degrees.values().stream().filter(d -> d == 1).count();
    int secondDegreeCount = (int) degrees.values().stream().filter(d -> d == 2).count();
    int thirdDegreeCount = (int) degrees.values().stream().filter(d -> d == 3).count();
    int totalGraphNodes = (int) degrees.values().stream()
        .filter(d -> d >= 1 && d <= maxDepth)
        .count();

    if (connectionCount < minimumConnections) {
      return new ExposureResponse(
          connectionCount,
          null,
          null,
          totalGraphNodes,
          maxDepth,
          List.of(),
          OffsetDateTime.now(),
          OffsetDateTime.now().plusDays(snapshotTtlDays),
          "exposure.message.insufficientConnections",
          "exposure.message.recommendation"
      );
    }

    List<String> exposureUsers = degrees.entrySet().stream()
        .filter(e -> e.getValue() >= 1 && e.getValue() <= maxDepth)
        .map(Map.Entry::getKey)
        .toList();

    List<HealthStatus> statuses = exposureUsers.isEmpty()
        ? List.of()
        : healthStatusRepository.findByUserHashInAndStatus(
            exposureUsers, HealthStatusValue.POSITIVE);

    Map<String, ExposureAggregate> aggregates = new HashMap<>();

    OffsetDateTime now = OffsetDateTime.now();
    for (HealthStatus status : statuses) {
      Integer degree = degrees.get(status.getUserHash());
      if (degree == null || degree == 0 || degree > maxDepth) {
        continue;
      }
      String condition = status.getConditionType().name().toLowerCase();
      aggregates.putIfAbsent(condition, new ExposureAggregate());
      ExposureAggregate agg = aggregates.get(condition);

      agg.userHashes.add(status.getUserHash());
      agg.closestDegree = Math.min(agg.closestDegree, degree);
      if (status.getClearedAt() == null) {
        agg.hasActive = true;
      }
      if (status.getReportedAt() != null
          && status.getReportedAt().isAfter(now.minus(30, ChronoUnit.DAYS))) {
        agg.hasRecent = true;
      }
    }

    List<ExposureItem> items = aggregates.entrySet().stream()
        .map(entry -> {
          ExposureAggregate agg = entry.getValue();
          return new ExposureItem(
              entry.getKey(),
              agg.userHashes.size(),
              agg.closestDegree == Integer.MAX_VALUE ? maxDepth : agg.closestDegree,
              agg.hasRecent ? "recent" : "older",
              agg.hasActive ? "active" : "resolved"
          );
        })
        .toList();

    return new ExposureResponse(
        connectionCount,
        secondDegreeCount,
        thirdDegreeCount,
        totalGraphNodes,
        maxDepth,
        items,
        OffsetDateTime.now(),
        OffsetDateTime.now().plusDays(snapshotTtlDays),
        null,
        null
    );
  }

  private List<String> degreeHashes(Map<String, Integer> degrees, int depth) {
    return degrees.entrySet().stream()
        .filter(entry -> entry.getValue() == depth)
        .map(Map.Entry::getKey)
        .sorted()
        .collect(Collectors.toList());
  }

  private Map<String, Set<String>> buildConnectionGraph() {
    Map<String, Set<String>> graph = new HashMap<>();
    List<Connection> confirmed = connectionRepository.findByStatus(ConnectionStatus.CONFIRMED);

    for (Connection c : confirmed) {
      graph.computeIfAbsent(c.getRequesterHash(), key -> new HashSet<>()).add(c.getRecipientHash());
      graph.computeIfAbsent(c.getRecipientHash(), key -> new HashSet<>()).add(c.getRequesterHash());
    }
    return graph;
  }

  private Map<String, Integer> computeDegrees(Map<String, Set<String>> graph, String start, int maxDepth) {
    Map<String, Integer> degrees = new HashMap<>();
    ArrayDeque<String> queue = new ArrayDeque<>();
    degrees.put(start, 0);
    queue.add(start);

    while (!queue.isEmpty()) {
      String current = queue.poll();
      int currentDegree = degrees.getOrDefault(current, 0);
      if (currentDegree >= maxDepth) {
        continue;
      }
      for (String neighbor : graph.getOrDefault(current, Set.of())) {
        if (!degrees.containsKey(neighbor)) {
          degrees.put(neighbor, currentDegree + 1);
          queue.add(neighbor);
        }
      }
    }

    return degrees;
  }

  private ExposureResponse decodeSnapshot(ExposureSnapshot snapshot) {
    try {
      String json = encryptionService.decryptFromBytes(snapshot.getSnapshotDataEncrypted());
      return objectMapper.readValue(json, ExposureResponse.class);
    } catch (Exception ex) {
      log.warn("Failed to decode exposure snapshot {}", snapshot.getId(), ex);
      return computeExposureSnapshot(snapshot.getUserHash());
    }
  }

  private void persistSnapshot(String userHash, ExposureResponse response) {
    try {
      String json = objectMapper.writeValueAsString(response);
      byte[] encrypted = encryptionService.encryptToBytes(json);

      ExposureSnapshot snapshot = exposureSnapshotRepository.findByUserHash(userHash)
          .orElseGet(() -> ExposureSnapshot.builder().userHash(userHash).build());

      snapshot.setSnapshotDataEncrypted(encrypted);
      snapshot.setComputedAt(OffsetDateTime.now());
      snapshot.setExpiresAt(OffsetDateTime.now().plusDays(snapshotTtlDays));
      exposureSnapshotRepository.save(snapshot);
    } catch (Exception ex) {
      log.warn("Failed to persist exposure snapshot for user {}", userHash, ex);
    }
  }

  private static final class ExposureAggregate {
    private final Set<String> userHashes = new HashSet<>();
    private int closestDegree = Integer.MAX_VALUE;
    private boolean hasRecent = false;
    private boolean hasActive = false;
  }
}
