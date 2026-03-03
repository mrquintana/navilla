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

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request DTO for creating a new medication.
 *
 * @param medicationType the catalog medication type key (e.g., PREP_DAILY)
 * @param name the medication name (will be encrypted)
 * @param dosage optional dosage description (will be encrypted)
 * @param startDate the start date in YYYY-MM-DD format
 * @param endDate optional end date in YYYY-MM-DD format
 * @param frequency the dosing frequency key (e.g., DAILY)
 * @param reminderTime optional preferred reminder time in HH:mm format
 * @param notes optional notes (will be encrypted)
 */
public record CreateMedicationRequest(
    @NotBlank @Size(max = 32) String medicationType,
    @NotBlank @Size(max = 200) String name,
    @Size(max = 200) String dosage,
    @NotBlank String startDate,
    String endDate,
    @NotBlank @Size(max = 32) String frequency,
    String reminderTime,
    @Size(max = 5000) String notes
) {}
