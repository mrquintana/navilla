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
 * Request DTO for registering a web push subscription.
 *
 * <p>Contains the three components of a Web Push API subscription:
 * the push endpoint URL, the p256dh public key, and the auth secret.
 * All values are encrypted at rest in the database.
 *
 * @param endpoint the push service endpoint URL
 * @param p256dh the p256dh public key (Base64-encoded)
 * @param auth the auth secret (Base64-encoded)
 * @author Navilla Team
 * @since 2026-03-03
 */
public record PushSubscriptionRequest(
    @NotBlank(message = "{push.error.endpointRequired}")
    @Size(max = 2000, message = "{push.error.endpointTooLong}")
    String endpoint,

    @NotBlank(message = "{push.error.p256dhRequired}")
    @Size(max = 500, message = "{push.error.p256dhTooLong}")
    String p256dh,

    @NotBlank(message = "{push.error.authRequired}")
    @Size(max = 500, message = "{push.error.authTooLong}")
    String auth
) {}
