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

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

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
    @Size(max = 200) String labReference,
    @NotEmpty @Valid @Size(max = 20) List<TestResultInput> results,
    @Size(max = 5000) String notes
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
      @Size(max = 50) String conditionType,
      @Size(max = 200) String customCondition,
      @NotBlank @Size(max = 50) String status,
      @Size(max = 200) String resultValue,
      @Size(max = 200) String referenceRange
  ) {}
}
