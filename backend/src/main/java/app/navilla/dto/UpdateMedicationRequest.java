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

import jakarta.validation.constraints.Size;

/**
 * Request DTO for updating an existing medication. All fields are nullable (partial update).
 *
 * @param medicationType the catalog medication type key
 * @param name the medication name (will be encrypted)
 * @param dosage dosage description (will be encrypted)
 * @param startDate start date in YYYY-MM-DD format
 * @param endDate end date in YYYY-MM-DD format
 * @param frequency the dosing frequency key
 * @param reminderTime preferred reminder time in HH:mm format
 * @param notes notes (will be encrypted)
 * @param active whether the medication is active
 */
public record UpdateMedicationRequest(
    @Size(max = 32) String medicationType,
    @Size(max = 200) String name,
    @Size(max = 200) String dosage,
    String startDate,
    String endDate,
    @Size(max = 32) String frequency,
    String reminderTime,
    @Size(max = 5000) String notes,
    Boolean active
) {}
