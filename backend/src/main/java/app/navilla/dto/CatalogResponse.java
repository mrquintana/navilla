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

import java.util.List;
import java.util.Map;

/**
 * Response DTO for the health catalog (medication types, frequencies, vaccine series).
 */
public record CatalogResponse(
    Map<String, MedicationTypeInfo> medicationTypes,
    Map<String, FrequencyInfo> frequencies,
    Map<String, VaccineSeriesInfo> vaccineSeries
) {

  /** Info about a medication type from the catalog. */
  public record MedicationTypeInfo(
      String labelKey,
      String defaultFrequency,
      boolean ongoing
  ) {}

  /** Info about a dosing frequency from the catalog. */
  public record FrequencyInfo(
      Integer hours,
      Integer days
  ) {}

  /** Info about a vaccine series from the catalog. */
  public record VaccineSeriesInfo(
      String labelKey,
      int totalDoses,
      List<Integer> doseIntervalsDays
  ) {}
}
