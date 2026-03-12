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

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import app.navilla.dto.ExposureItem;
import app.navilla.dto.ExposureResponse;
import app.navilla.dto.NetworkHealthResponse;
import app.navilla.entity.Connection;
import app.navilla.repository.ConnectionRepository;
import app.navilla.repository.TestVisitRepository;
import app.navilla.security.EncryptionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;

/**
 * Service for calculating aggregated network health statistics.
 *
 * <p>Combines exposure snapshot data with connection testing activity to produce
 * a privacy-preserving summary of a user's network health. Testing activity levels
 * are only computed when the user has at least {@link #PRIVACY_THRESHOLD} connections,
 * preventing identification of individual partners' testing behavior.
 *
 * @author Navilla Team
 * @since 2026-03-12
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class NetworkHealthService {

  private static final int PRIVACY_THRESHOLD = 3;
  private static final int TESTING_LOOKBACK_DAYS = 90;
  private static final double HIGH_THRESHOLD = 0.60;
  private static final double MEDIUM_THRESHOLD = 0.30;

  private final ExposureService exposureService;
  private final ConnectionRepository connectionRepository;
  private final TestVisitRepository testVisitRepository;
  private final EncryptionService encryptionService;

  /**
   * Computes network health stats for the authenticated user.
   *
   * <p>Steps:
   * <ol>
   *   <li>Fetch exposure snapshot — if reciprocity not opted in, return null</li>
   *   <li>Get confirmed connections and extract partner hashes</li>
   *   <li>If fewer than {@link #PRIVACY_THRESHOLD} connections, testing level is UNKNOWN</li>
   *   <li>Otherwise, query recent test visits to compute testing activity rate</li>
   *   <li>Count active and resolved exposures from the snapshot</li>
   * </ol>
   *
   * @param jwt the authenticated user's JWT token
   * @return network health response, or null if reciprocity is required
   */
  @Cacheable(value = "networkHealth", key = "#jwt.subject")
  public NetworkHealthResponse getNetworkHealth(Jwt jwt) {
    String userHash = encryptionService.hashEmail(jwt.getClaimAsString("email"));

    // Step 1: Get exposure snapshot — guard for reciprocity
    ExposureResponse exposure = exposureService.getExposureSnapshot(jwt);
    if (exposure.message() != null && exposure.message().contains("reciprocityRequired")) {
      return null;
    }

    // Step 2: Get confirmed connections and extract partner hashes
    List<Connection> connections = connectionRepository.findConfirmedByUserHash(userHash);
    Set<String> partnerHashes = new HashSet<>();
    for (Connection c : connections) {
      if (c.getRequesterHash().equals(userHash)) {
        partnerHashes.add(c.getRecipientHash());
      } else {
        partnerHashes.add(c.getRequesterHash());
      }
    }

    int connectionCount = partnerHashes.size();

    // Step 3: Determine testing activity level
    String testingActivityLevel;
    if (connectionCount < PRIVACY_THRESHOLD) {
      testingActivityLevel = "UNKNOWN";
    } else {
      // Step 4: Query recent test visits
      Set<String> testedPartners = testVisitRepository.findUserHashesWithTestsAfter(
          partnerHashes, LocalDate.now().minusDays(TESTING_LOOKBACK_DAYS));
      double rate = (double) testedPartners.size() / connectionCount;

      if (rate >= HIGH_THRESHOLD) {
        testingActivityLevel = "HIGH";
      } else if (rate >= MEDIUM_THRESHOLD) {
        testingActivityLevel = "MEDIUM";
      } else {
        testingActivityLevel = "LOW";
      }
    }

    // Step 5: Count active and resolved exposures
    int activeExposureCount = 0;
    int recentlyResolvedCount = 0;
    if (exposure.exposures() != null) {
      for (ExposureItem item : exposure.exposures()) {
        if ("active".equals(item.status())) {
          activeExposureCount++;
        } else if ("resolved".equals(item.status())) {
          recentlyResolvedCount++;
        }
      }
    }

    return new NetworkHealthResponse(
        testingActivityLevel,
        "networkHealth.testingActivity." + testingActivityLevel,
        connectionCount,
        exposure.secondDegreeCount(),
        exposure.thirdDegreeCount(),
        exposure.totalGraphNodes(),
        exposure.maxDepth() != null ? exposure.maxDepth() : 0,
        activeExposureCount,
        recentlyResolvedCount,
        OffsetDateTime.now()
    );
  }
}
