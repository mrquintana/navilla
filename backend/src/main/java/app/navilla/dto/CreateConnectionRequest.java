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

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/**
 * Request DTO for creating a new connection request.
 *
 * <p>The recipient is identified by email address, which will be hashed
 * before storage for privacy.
 *
 * @param recipientEmail the email address of the user to connect with
 * @author Navilla Team
 * @since 2026-01-31
 */
public record CreateConnectionRequest(
    @NotBlank(message = "{connection.error.emailRequired}")
    @Email(message = "{connection.error.emailInvalid}")
    String recipientEmail
) {}
