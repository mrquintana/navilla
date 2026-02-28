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

/**
 * Summary of a user's testing history for a single condition.
 *
 * @param conditionType the condition type identifier
 * @param customCondition custom condition name if conditionType is OTHER
 * @param latestStatus the most recent test result status
 * @param latestResultValue the most recent raw result value
 * @param lastTestDate date of the most recent test
 * @param totalTests total number of tests for this condition
 * @param hasPositive whether any test has returned a positive result
 */
public record ConditionSummary(
    String conditionType,
    String customCondition,
    String latestStatus,
    String latestResultValue,
    LocalDate lastTestDate,
    int totalTests,
    boolean hasPositive
) {}
