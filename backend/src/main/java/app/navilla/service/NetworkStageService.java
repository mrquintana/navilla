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

import java.util.List;

import app.navilla.entity.NetworkStage;
import app.navilla.repository.NetworkStageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

/**
 * Service for network constellation stage management.
 *
 * <p>Determines the stage badge for a user's network based on configurable
 * node count thresholds stored in the database.
 *
 * @author Navilla Team
 * @since 2026-03-04
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class NetworkStageService {

  private static final NetworkStage FALLBACK_EMPTY_SKY = NetworkStage.builder()
      .code("EMPTY_SKY")
      .displayName("Empty Sky")
      .displayNameEs("Cielo Vacío")
      .minNodes(0)
      .maxNodes(0)
      .displayOrder(0)
      .build();

  private final NetworkStageRepository networkStageRepository;

  /**
   * Returns all network stages ordered by display order.
   *
   * @return list of all stages
   */
  @Cacheable(value = "catalog", key = "'network-stages'")
  public List<NetworkStage> listStages() {
    log.debug("Loading network stages from database");
    return networkStageRepository.findAllByOrderByDisplayOrder();
  }

  /**
   * Determines the network stage for the given total node count.
   *
   * <p>Finds the stage where {@code totalNodes} falls between {@code minNodes}
   * and {@code maxNodes} (inclusive). A null {@code maxNodes} means unlimited.
   * Falls back to EMPTY_SKY if no matching stage is found.
   *
   * @param totalNodes the total number of nodes in the user's network
   * @return the matching network stage
   */
  public NetworkStage getStageForNodeCount(int totalNodes) {
    List<NetworkStage> stages = listStages();

    return stages.stream()
        .filter(stage -> totalNodes >= stage.getMinNodes()
            && (stage.getMaxNodes() == null || totalNodes <= stage.getMaxNodes()))
        .findFirst()
        .orElse(FALLBACK_EMPTY_SKY);
  }
}
