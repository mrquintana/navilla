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

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Request DTO for updating user profile.
 *
 * @param displayName the user's display name (optional, max 100 characters)
 * @param fullName the user's full name (optional, max 120 characters)
 * @param username the public username (optional, 3-30, alphanumeric/underscore)
 * @param sex self-reported sex (optional)
 * @param dateOfBirth date of birth in YYYY-MM-DD (optional)
 * @param showAge whether to display age (optional)
 * @param country ISO 3166-1 alpha-2 country code (optional)
 * @param location user location (optional, max 120 characters)
 * @param profileVisibility profile visibility setting (optional)
 * @param displayNamePublic whether to show display name publicly (optional)
 * @param searchableByEmail whether to allow email search (optional)
 * @param avatarKey storage key for profile avatar (optional)
 * @param avatarThumbKey storage key for avatar thumbnail (optional)
 */
public record UpdateProfileRequest(
    @Size(max = 100, message = "{validation.size.max}")
    String displayName,

    @Size(max = 120, message = "{validation.size.max}")
    String fullName,

    @Size(min = 3, max = 30, message = "{validation.size.range}")
    @Pattern(regexp = "^[a-zA-Z0-9_]+$", message = "{validation.username.invalid}")
    String username,

    @Size(max = 20, message = "{validation.size.max}")
    String sex,

    @Pattern(regexp = "^\\d{4}-\\d{2}-\\d{2}$", message = "{validation.date.invalid}")
    String dateOfBirth,

    Boolean showAge,

    @Pattern(regexp = "^[A-Za-z]{2}$", message = "{validation.country.invalid}")
    String country,

    @Size(max = 120, message = "{validation.size.max}")
    String location,

    String profileVisibility,
    Boolean displayNamePublic,
    Boolean searchableByEmail,
    String avatarKey,
    String avatarThumbKey
) {}
