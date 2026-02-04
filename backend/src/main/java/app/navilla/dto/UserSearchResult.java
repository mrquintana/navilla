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

/**
 * Response DTO for public user search results.
 *
 * @param username public username
 * @param displayName public display name (if allowed)
 * @param avatarThumbUrl public avatar thumbnail (optional)
 */
public record UserSearchResult(
    String username,
    String displayName,
    String avatarThumbUrl
) {}
