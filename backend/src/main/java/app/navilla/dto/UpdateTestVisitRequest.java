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

import jakarta.validation.constraints.Pattern;

/**
 * Request DTO for updating an existing test visit.
 *
 * @param testDate optional updated test date (YYYY-MM-DD format)
 * @param labId optional updated lab ID
 * @param labReference optional updated lab reference number
 * @param results optional updated list of test results
 * @param notes optional updated notes
 */
public record UpdateTestVisitRequest(
    @Pattern(regexp = "^\\d{4}-\\d{2}-\\d{2}$") String testDate,
    UUID labId,
    String labReference,
    List<CreateTestVisitRequest.TestResultInput> results,
    String notes
) {}
