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
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import app.navilla.entity.ConditionCatalogEntry;
import app.navilla.exception.ResourceNotFoundException;
import app.navilla.repository.ConditionCatalogRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * Unit tests for {@link ConditionCatalogService}.
 *
 * @author Navilla Team
 * @since 2026-03-04
 */
@ExtendWith(MockitoExtension.class)
class ConditionCatalogServiceTest {

  @Mock
  private ConditionCatalogRepository conditionCatalogRepository;

  @InjectMocks
  private ConditionCatalogService conditionCatalogService;

  private ConditionCatalogEntry buildEntry(String code, String displayName, int order, boolean active) {
    return ConditionCatalogEntry.builder()
        .id(UUID.randomUUID())
        .code(code)
        .displayName(displayName)
        .displayNameEs(displayName)
        .displayOrder(order)
        .active(active)
        .createdAt(OffsetDateTime.now())
        .updatedAt(OffsetDateTime.now())
        .build();
  }

  @Nested
  @DisplayName("listActive")
  class ListActive {

    @Test
    @DisplayName("returns only active entries sorted by displayOrder")
    void returnsOnlyActiveSortedByDisplayOrder() {
      var chlamydia = buildEntry("CHLAMYDIA", "Chlamydia", 1, true);
      var gonorrhea = buildEntry("GONORRHEA", "Gonorrhea", 2, true);
      var hiv = buildEntry("HIV", "HIV", 4, true);

      when(conditionCatalogRepository.findByActiveTrueOrderByDisplayOrder())
          .thenReturn(List.of(chlamydia, gonorrhea, hiv));

      List<ConditionCatalogEntry> result = conditionCatalogService.listActive();

      assertThat(result).hasSize(3);
      assertThat(result.get(0).getCode()).isEqualTo("CHLAMYDIA");
      assertThat(result.get(1).getCode()).isEqualTo("GONORRHEA");
      assertThat(result.get(2).getCode()).isEqualTo("HIV");
    }

    @Test
    @DisplayName("returns empty list when no active entries")
    void returnsEmptyListWhenNoActive() {
      when(conditionCatalogRepository.findByActiveTrueOrderByDisplayOrder())
          .thenReturn(List.of());

      List<ConditionCatalogEntry> result = conditionCatalogService.listActive();

      assertThat(result).isEmpty();
    }
  }

  @Nested
  @DisplayName("findByCode")
  class FindByCode {

    @Test
    @DisplayName("existing code returns entry")
    void existingCodeReturnsEntry() {
      var entry = buildEntry("CHLAMYDIA", "Chlamydia", 1, true);
      when(conditionCatalogRepository.findByCode("CHLAMYDIA"))
          .thenReturn(Optional.of(entry));

      ConditionCatalogEntry result = conditionCatalogService.findByCode("CHLAMYDIA");

      assertThat(result.getCode()).isEqualTo("CHLAMYDIA");
      assertThat(result.getDisplayName()).isEqualTo("Chlamydia");
    }

    @Test
    @DisplayName("unknown code throws ResourceNotFoundException")
    void unknownCodeThrowsResourceNotFoundException() {
      when(conditionCatalogRepository.findByCode("UNKNOWN"))
          .thenReturn(Optional.empty());

      assertThatThrownBy(() -> conditionCatalogService.findByCode("UNKNOWN"))
          .isInstanceOf(ResourceNotFoundException.class);
    }
  }

  @Nested
  @DisplayName("isValidCode")
  class IsValidCode {

    @Test
    @DisplayName("active code returns true")
    void activeCodeReturnsTrue() {
      when(conditionCatalogRepository.existsByCodeAndActiveTrue("HIV"))
          .thenReturn(true);

      assertThat(conditionCatalogService.isValidCode("HIV")).isTrue();
    }

    @Test
    @DisplayName("inactive or unknown code returns false")
    void inactiveOrUnknownCodeReturnsFalse() {
      when(conditionCatalogRepository.existsByCodeAndActiveTrue("DEPRECATED"))
          .thenReturn(false);

      assertThat(conditionCatalogService.isValidCode("DEPRECATED")).isFalse();
    }
  }
}
