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
import java.util.UUID;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Request DTO for updating an existing journal entry.
 *
 * @param encounterDate the date of the encounter
 * @param partnerAlias optional alias for the partner
 * @param connectionId optional connection ID
 * @param notes optional notes
 * @param customFields optional custom fields (max 3)
 */
public record UpdateJournalEntryRequest(
    @NotNull(message = "{journal.error.dateRequired}")
    LocalDate encounterDate,

    @Size(max = 200, message = "{journal.error.aliasTooLong}")
    String partnerAlias,

    UUID connectionId,

    @Size(max = 5000, message = "{journal.error.notesTooLong}")
    String notes,

    @Valid
    @Size(max = 3, message = "{journal.error.tooManyCustomFields}")
    List<CustomFieldDto> customFields,

    UUID partnerId,

    @Size(max = 20, message = "{journal.error.phoneTooLong}")
    String phone,

    @Size(max = 10, message = "{journal.error.tooManyEncounterTypes}")
    List<String> encounterTypes,

    @Size(max = 10, message = "{journal.error.tooManyProtectionMethods}")
    List<String> protectionMethods
) {}
