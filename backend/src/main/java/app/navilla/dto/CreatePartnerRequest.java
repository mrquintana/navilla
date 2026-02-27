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

import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request DTO for creating a new journal partner.
 *
 * @param alias the partner alias/nickname
 * @param connectionId optional connection ID to link
 * @param notes optional notes about the partner
 */
public record CreatePartnerRequest(
    @NotBlank(message = "{journal.partner.error.aliasRequired}")
    @Size(max = 200, message = "{journal.error.aliasTooLong}")
    String alias,

    UUID connectionId,

    @Size(max = 5000, message = "{journal.error.notesTooLong}")
    String notes
) {}
