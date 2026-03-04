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

import app.navilla.entity.ConditionCatalogEntry;
import app.navilla.exception.ResourceNotFoundException;
import app.navilla.repository.ConditionCatalogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

/**
 * Service for managing the condition catalog.
 *
 * <p>Provides access to the database-driven catalog of STI conditions,
 * replacing the hardcoded ConditionType enum with configurable entries.
 *
 * @author Navilla Team
 * @since 2026-03-04
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ConditionCatalogService {

  private final ConditionCatalogRepository conditionCatalogRepository;

  /**
   * Returns all active condition catalog entries, sorted by display order.
   *
   * @return list of active entries
   */
  @Cacheable(value = "catalog", key = "'conditions-active'")
  public List<ConditionCatalogEntry> listActive() {
    log.debug("Loading active condition catalog entries from database");
    return conditionCatalogRepository.findByActiveTrueOrderByDisplayOrder();
  }

  /**
   * Finds a condition catalog entry by its unique code.
   *
   * @param code the condition code (e.g. "CHLAMYDIA", "HIV")
   * @return the matching catalog entry
   * @throws ResourceNotFoundException if no entry exists with the given code
   */
  public ConditionCatalogEntry findByCode(String code) {
    return conditionCatalogRepository.findByCode(code)
        .orElseThrow(() -> new ResourceNotFoundException("condition.not.found"));
  }

  /**
   * Checks whether the given code corresponds to an active condition.
   *
   * @param code the condition code to validate
   * @return true if the code exists and is active
   */
  public boolean isValidCode(String code) {
    return conditionCatalogRepository.existsByCodeAndActiveTrue(code);
  }
}
