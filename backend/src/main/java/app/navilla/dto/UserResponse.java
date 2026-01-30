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
import java.util.UUID;

/**
 * Response DTO for user profile information.
 *
 * <p>Contains decrypted user data for API responses.
 * Sensitive data is only included when the user is viewing their own profile.
 *
 * @param id the user's unique identifier
 * @param email the user's email (only included for own profile)
 * @param displayName the user's display name (optional)
 * @param verified whether the user's email is verified
 * @param createdAt when the account was created
 */
public record UserResponse(
    UUID id,
    String email,
    String displayName,
    Boolean verified,
    OffsetDateTime createdAt
) {}
