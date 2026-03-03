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
 * Request DTO for updating reminder settings. All fields are nullable (partial update).
 *
 * @param quietHoursStart quiet hours start time in HH:mm format
 * @param quietHoursEnd quiet hours end time in HH:mm format
 * @param emailDigestEnabled whether email digests are enabled
 * @param emailDigestDay day of the week for email digests
 * @param testingRemindersEnabled whether testing reminders are enabled
 * @param medicationRemindersEnabled whether medication reminders are enabled
 * @param vaccinationRemindersEnabled whether vaccination reminders are enabled
 */
public record UpdateReminderSettingsRequest(
    String quietHoursStart,
    String quietHoursEnd,
    Boolean emailDigestEnabled,
    @Size(max = 12) String emailDigestDay,
    Boolean testingRemindersEnabled,
    Boolean medicationRemindersEnabled,
    Boolean vaccinationRemindersEnabled
) {}
