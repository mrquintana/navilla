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
import java.util.List;
import java.util.Map;

/**
 * Response DTO for the personal insights endpoint.
 *
 * <p>Aggregates activity, testing, and prevention data into
 * a single response for the user's insights dashboard.
 *
 * @author Navilla Team
 * @since 2026-03-03
 */
public record InsightsResponse(
    ActivitySummary activity,
    TestingSummary testing,
    PreventionSummary prevention
) {

  /**
   * Summary of encounter journal activity.
   */
  public record ActivitySummary(
      int totalEncounters,
      int encountersThisMonth,
      Map<String, Integer> encountersByMonth,
      double protectionRate,
      Map<String, Integer> encounterTypeCounts,
      Map<String, Integer> protectionMethodCounts
  ) {}

  /**
   * Summary of STI testing coverage and status.
   */
  public record TestingSummary(
      int daysSinceLastTest,
      int testsThisYear,
      int conditionsCovered,
      int totalStandardConditions,
      LocalDate lastTestDate,
      Map<String, String> coverageMap
  ) {}

  /**
   * Summary of prevention measures (PrEP, vaccinations, reminders).
   */
  public record PreventionSummary(
      Double prepAdherenceRate,
      int currentPrepStreakDays,
      int longestPrepStreakDays,
      List<String> completedVaccines,
      List<String> pendingVaccines,
      int activeReminders
  ) {}
}
