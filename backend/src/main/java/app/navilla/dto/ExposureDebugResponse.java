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
import java.util.List;

/**
 * Dev-only response for inspecting exposure computations.
 *
 * @param userHash hashed identifier for the requested user
 * @param connectionCount first-degree connection count
 * @param secondDegreeCount second-degree count
 * @param thirdDegreeCount third-degree count
 * @param totalGraphNodes total nodes in graph (within configured max depth)
 * @param maxDepth configured max depth used for graph traversal
 * @param firstDegreeHashes hashes for first-degree connections
 * @param secondDegreeHashes hashes for second-degree connections
 * @param thirdDegreeHashes hashes for third-degree connections
 * @param exposures exposure items computed for this user
 * @param message optional exposure message
 * @param recommendation optional recommendation message
 * @param computedAt computation time
 */
public record ExposureDebugResponse(
    String userHash,
    int connectionCount,
    int secondDegreeCount,
    int thirdDegreeCount,
    int totalGraphNodes,
    int maxDepth,
    List<String> firstDegreeHashes,
    List<String> secondDegreeHashes,
    List<String> thirdDegreeHashes,
    List<ExposureItem> exposures,
    String message,
    String recommendation,
    OffsetDateTime computedAt
) {}
