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
 * Response DTO for connection request submissions.
 *
 * <p>This response is intentionally generic to avoid leaking whether
 * the recipient exists or has a private profile.
 *
 * @param message the generic status message
 */
public record ConnectionRequestResponse(
    String message
) {}
