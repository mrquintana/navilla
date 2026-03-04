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

package app.navilla.controller;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import app.navilla.config.HealthCatalogProperties;
import app.navilla.dto.CatalogResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller for the public health catalog.
 *
 * <p>Exposes medication types, dosing frequencies, and vaccine series
 * configuration as a single read-only endpoint. This endpoint does not
 * require authentication so the frontend can populate forms before login.
 *
 * @author Navilla Team
 * @since 2026-03-03
 */
@RestController
@RequestMapping("/api/catalog")
@RequiredArgsConstructor
public class CatalogController {

  private final HealthCatalogProperties catalogProperties;

  /**
   * Returns the full health catalog configuration.
   *
   * @return the catalog response with medication types, frequencies, and vaccine series
   */
  @GetMapping
  @Cacheable("catalog")
  public ResponseEntity<CatalogResponse> getCatalog() {
    Map<String, CatalogResponse.MedicationTypeInfo> medicationTypes = new LinkedHashMap<>();
    if (catalogProperties.medicationTypes() != null) {
      catalogProperties.medicationTypes().forEach((key, config) ->
          medicationTypes.put(key, new CatalogResponse.MedicationTypeInfo(
              config.labelKey(), config.defaultFrequency(), config.ongoing())));
    }

    Map<String, CatalogResponse.FrequencyInfo> frequencies = new LinkedHashMap<>();
    if (catalogProperties.frequencies() != null) {
      catalogProperties.frequencies().forEach((key, config) ->
          frequencies.put(key, new CatalogResponse.FrequencyInfo(
              config.hours(), config.days())));
    }

    Map<String, CatalogResponse.VaccineSeriesInfo> vaccineSeries = new LinkedHashMap<>();
    if (catalogProperties.vaccineSeries() != null) {
      catalogProperties.vaccineSeries().forEach((key, config) ->
          vaccineSeries.put(key, new CatalogResponse.VaccineSeriesInfo(
              config.labelKey(), config.totalDoses(), config.doseIntervalsDays())));
    }

    List<String> encounterTypes = List.of(
        "ORAL", "ANAL", "VAGINAL", "MANUAL", "OTHER");

    List<String> protectionMethods = List.of(
        "CONDOM", "INTERNAL_CONDOM", "PREP", "PEP",
        "DENTAL_DAM", "NONE", "OTHER");

    return ResponseEntity.ok(new CatalogResponse(
        medicationTypes, frequencies, vaccineSeries,
        encounterTypes, protectionMethods));
  }
}
