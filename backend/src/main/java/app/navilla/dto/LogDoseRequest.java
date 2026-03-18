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
 * Request DTO for logging a medication dose.
 *
 * @param scheduledFor the date the dose was scheduled for (YYYY-MM-DD)
 * @param taken whether the dose was taken
 * @param notes optional notes (will be encrypted)
 */
public record LogDoseRequest(
    @NotBlank @Size(max = 10) String scheduledFor,
    boolean taken,
    @Size(max = 5000) String notes
) {}
