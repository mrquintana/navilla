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
 * DTO for a custom field within a journal entry.
 *
 * @param label the custom field label
 * @param value the custom field value
 */
public record CustomFieldDto(
    @NotBlank(message = "{journal.error.customFieldLabelRequired}")
    @Size(max = 100, message = "{journal.error.customFieldLabelTooLong}")
    String label,

    @NotBlank(message = "{journal.error.customFieldValueRequired}")
    @Size(max = 500, message = "{journal.error.customFieldValueTooLong}")
    String value
) {}
