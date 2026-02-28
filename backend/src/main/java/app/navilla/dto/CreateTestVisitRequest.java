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
import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;

/**
 * Request DTO for creating a new test visit with results.
 *
 * @param testDate the date of the test visit (YYYY-MM-DD format)
 * @param labId optional ID of the associated lab
 * @param labReference optional lab reference number
 * @param results list of test results (at least one required)
 * @param notes optional notes about the visit
 */
public record CreateTestVisitRequest(
    @NotBlank @Pattern(regexp = "^\\d{4}-\\d{2}-\\d{2}$") String testDate,
    UUID labId,
    String labReference,
    @NotEmpty List<TestResultInput> results,
    String notes
) {

  /**
   * Input for an individual test result within a visit.
   *
   * @param conditionType the condition being tested
   * @param customCondition custom condition name if conditionType is OTHER
   * @param status the result status (e.g., NEGATIVE, POSITIVE)
   * @param resultValue optional raw result value
   * @param referenceRange optional reference range
   */
  public record TestResultInput(
      String conditionType,
      String customCondition,
      @NotBlank String status,
      String resultValue,
      String referenceRange
  ) {}
}
