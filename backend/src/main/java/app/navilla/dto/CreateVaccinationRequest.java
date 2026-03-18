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
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Request DTO for recording a vaccination dose.
 *
 * @param vaccineType the catalog vaccine type key (e.g., HPV, MPOX)
 * @param doseNumber which dose in the series (1-based)
 * @param administeredDate date the dose was administered (YYYY-MM-DD)
 * @param location optional location where administered (will be encrypted)
 * @param notes optional notes (will be encrypted)
 */
public record CreateVaccinationRequest(
    @NotBlank @Size(max = 32) String vaccineType,
    @NotNull Integer doseNumber,
    @NotBlank @Size(max = 10) String administeredDate,
    @Size(max = 200) String location,
    @Size(max = 5000) String notes
) {}
