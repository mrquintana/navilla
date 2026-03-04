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

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import app.navilla.entity.NetworkStage;
import app.navilla.repository.NetworkStageRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * Unit tests for {@link NetworkStageService}.
 *
 * @author Navilla Team
 * @since 2026-03-04
 */
@ExtendWith(MockitoExtension.class)
class NetworkStageServiceTest {

  @Mock
  private NetworkStageRepository networkStageRepository;

  @InjectMocks
  private NetworkStageService networkStageService;

  private List<NetworkStage> allStages;

  private NetworkStage buildStage(String code, String displayName, int minNodes,
      Integer maxNodes, int order) {
    return NetworkStage.builder()
        .id(UUID.randomUUID())
        .code(code)
        .displayName(displayName)
        .displayNameEs(displayName)
        .minNodes(minNodes)
        .maxNodes(maxNodes)
        .displayOrder(order)
        .createdAt(OffsetDateTime.now())
        .build();
  }

  @BeforeEach
  void setUp() {
    allStages = List.of(
        buildStage("EMPTY_SKY", "Empty Sky", 0, 0, 1),
        buildStage("SPARK", "Spark", 1, 50, 2),
        buildStage("CLUSTER", "Cluster", 51, 500, 3),
        buildStage("CONSTELLATION", "Constellation", 501, 2000, 4),
        buildStage("GALAXY", "Galaxy", 2001, 10000, 5),
        buildStage("SUPERCLUSTER", "Supercluster", 10001, null, 6)
    );
  }

  @Nested
  @DisplayName("listStages")
  class ListStages {

    @Test
    @DisplayName("returns all stages ordered by displayOrder")
    void returnsAllStagesOrdered() {
      when(networkStageRepository.findAllByOrderByDisplayOrder())
          .thenReturn(allStages);

      List<NetworkStage> result = networkStageService.listStages();

      assertThat(result).hasSize(6);
      assertThat(result.get(0).getCode()).isEqualTo("EMPTY_SKY");
      assertThat(result.get(5).getCode()).isEqualTo("SUPERCLUSTER");
    }
  }

  @Nested
  @DisplayName("getStageForNodeCount")
  class GetStageForNodeCount {

    @Test
    @DisplayName("0 nodes returns EMPTY_SKY")
    void zeroNodesReturnsEmptySky() {
      when(networkStageRepository.findAllByOrderByDisplayOrder())
          .thenReturn(allStages);

      NetworkStage result = networkStageService.getStageForNodeCount(0);

      assertThat(result.getCode()).isEqualTo("EMPTY_SKY");
    }

    @Test
    @DisplayName("25 nodes returns SPARK")
    void twentyFiveNodesReturnsSpark() {
      when(networkStageRepository.findAllByOrderByDisplayOrder())
          .thenReturn(allStages);

      NetworkStage result = networkStageService.getStageForNodeCount(25);

      assertThat(result.getCode()).isEqualTo("SPARK");
    }

    @Test
    @DisplayName("100 nodes returns CLUSTER")
    void hundredNodesReturnsCluster() {
      when(networkStageRepository.findAllByOrderByDisplayOrder())
          .thenReturn(allStages);

      NetworkStage result = networkStageService.getStageForNodeCount(100);

      assertThat(result.getCode()).isEqualTo("CLUSTER");
    }

    @Test
    @DisplayName("1500 nodes returns CONSTELLATION")
    void fifteenHundredNodesReturnsConstellation() {
      when(networkStageRepository.findAllByOrderByDisplayOrder())
          .thenReturn(allStages);

      NetworkStage result = networkStageService.getStageForNodeCount(1500);

      assertThat(result.getCode()).isEqualTo("CONSTELLATION");
    }

    @Test
    @DisplayName("5000 nodes returns GALAXY")
    void fiveThousandNodesReturnsGalaxy() {
      when(networkStageRepository.findAllByOrderByDisplayOrder())
          .thenReturn(allStages);

      NetworkStage result = networkStageService.getStageForNodeCount(5000);

      assertThat(result.getCode()).isEqualTo("GALAXY");
    }

    @Test
    @DisplayName("50000 nodes returns SUPERCLUSTER")
    void fiftyThousandNodesReturnsSupercluster() {
      when(networkStageRepository.findAllByOrderByDisplayOrder())
          .thenReturn(allStages);

      NetworkStage result = networkStageService.getStageForNodeCount(50000);

      assertThat(result.getCode()).isEqualTo("SUPERCLUSTER");
    }

    @Test
    @DisplayName("falls back to EMPTY_SKY when no stages match")
    void fallsBackToEmptySkyWhenNoMatch() {
      // Edge case: empty stage list
      when(networkStageRepository.findAllByOrderByDisplayOrder())
          .thenReturn(List.of());

      NetworkStage result = networkStageService.getStageForNodeCount(5);

      assertThat(result.getCode()).isEqualTo("EMPTY_SKY");
      assertThat(result.getDisplayName()).isEqualTo("Empty Sky");
    }
  }
}
