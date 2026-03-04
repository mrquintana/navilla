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

import java.time.OffsetDateTime;

/**
 * Response DTO for the user's reciprocity (exposure network) status.
 *
 * @param optedIn               whether the user is currently opted in
 * @param optedInAt             when the user last opted in (null if never)
 * @param optedOutAt            when the user last opted out (null if never)
 * @param cooldownDaysRemaining days remaining in cooldown period (null if not in cooldown)
 * @author Navilla Team
 * @since 2026-03-04
 */
public record ReciprocityStatusResponse(
    boolean optedIn,
    OffsetDateTime optedInAt,
    OffsetDateTime optedOutAt,
    Integer cooldownDaysRemaining
) {}
