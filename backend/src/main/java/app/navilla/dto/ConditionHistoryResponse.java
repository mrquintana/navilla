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

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Response DTO for the testing history of a specific condition.
 *
 * @param conditionType the condition type identifier
 * @param latestStatus the most recent test result status
 * @param totalTests total number of tests for this condition
 * @param lastTestDate date of the most recent test
 * @param entries chronological list of test history entries
 */
public record ConditionHistoryResponse(
    String conditionType,
    String latestStatus,
    int totalTests,
    LocalDate lastTestDate,
    List<HistoryEntry> entries
) {

  /**
   * A single entry in the condition testing history.
   *
   * @param visitId the test visit ID
   * @param testDate the date of the test
   * @param status the result status
   * @param resultValue the raw result value
   * @param referenceRange the reference range
   * @param labName the name of the lab
   * @param labProvider the lab provider identifier
   * @param verified whether the result was verified
   * @param clearedAt when the result was cleared (if applicable)
   */
  public record HistoryEntry(
      UUID visitId,
      LocalDate testDate,
      String status,
      String resultValue,
      String referenceRange,
      String labName,
      String labProvider,
      boolean verified,
      OffsetDateTime clearedAt
  ) {}
}
