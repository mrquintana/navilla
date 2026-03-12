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
import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;

/**
 * Request DTO for creating a new verification card.
 *
 * <p>Display name is auto-resolved from the user's profile (firstName + lastName).
 * Test dates are always shown on verification cards.
 */
public record CreateVerificationCardRequest(
    @Valid
    @Size(max = 50, message = "verification.error.tooManyConditions")
    List<@Size(max = 50) String> includedConditions,
    Boolean showVerificationLevel,
    Integer maxViews,
    OffsetDateTime expiresAt
) {}
