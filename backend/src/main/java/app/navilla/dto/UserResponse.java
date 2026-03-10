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
 * @param firstName the user's first name (optional)
 * @param lastName the user's last name (optional)
 * @param username the user's public username (optional)
 * @param sex the user's self-reported sex (optional)
 * @param dateOfBirth the user's date of birth (optional)
 * @param age the user's age (only if showAge is true)
 * @param showAge whether age can be shown
 * @param country the user's country (optional)
 * @param location the user's location (optional)
 * @param profileVisibility profile visibility setting
 * @param searchableByEmail whether email search is allowed
 * @param avatarUrl public URL for avatar (optional)
 * @param avatarThumbUrl public URL for avatar thumbnail (optional)
 * @param verified whether the user's email is verified
 * @param createdAt when the account was created
 */
public record UserResponse(
    UUID id,
    String email,
    String firstName,
    String lastName,
    String username,
    String sex,
    String dateOfBirth,
    Integer age,
    Boolean showAge,
    String country,
    String location,
    String profileVisibility,
    Boolean searchableByEmail,
    String avatarUrl,
    String avatarThumbUrl,
    Boolean verified,
    OffsetDateTime createdAt
) {}
