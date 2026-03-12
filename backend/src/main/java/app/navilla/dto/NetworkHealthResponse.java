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

package app.navilla.dto;

import java.time.OffsetDateTime;

/**
 * Response DTO for network health stats.
 *
 * <p>Returns aggregated, anonymized testing activity levels for a user's
 * connection network, used by the {@code GET /api/network-health} endpoint.
 *
 * @param testingActivityLevel  aggregated level: HIGH, MEDIUM, LOW, or UNKNOWN
 * @param testingActivityKey    i18n message key for frontend display
 * @param connectionCount       number of direct (1st-degree) connections
 * @param secondDegreeCount     number of 2nd-degree connections, null if unavailable
 * @param thirdDegreeCount      number of 3rd-degree connections, null if unavailable
 * @param totalNetworkSize      total network size across all degrees, null if unavailable
 * @param maxDepth              maximum traversal depth used for computation
 * @param activeExposureCount   number of currently active exposure alerts
 * @param recentlyResolvedCount number of recently resolved exposure alerts
 * @param computedAt            timestamp when this response was computed
 * @author Navilla Team
 * @since 2026-03-12
 */
public record NetworkHealthResponse(
    String testingActivityLevel,
    String testingActivityKey,
    int connectionCount,
    Integer secondDegreeCount,
    Integer thirdDegreeCount,
    Integer totalNetworkSize,
    int maxDepth,
    int activeExposureCount,
    int recentlyResolvedCount,
    OffsetDateTime computedAt
) {}
