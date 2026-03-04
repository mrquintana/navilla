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
 * Response DTO for a push subscription.
 *
 * <p>Returns only the subscription id and creation timestamp.
 * Encrypted subscription data (endpoint, keys) is never exposed in responses.
 *
 * @param id the subscription id
 * @param createdAt the creation timestamp
 * @author Navilla Team
 * @since 2026-03-03
 */
public record PushSubscriptionResponse(
    UUID id,
    OffsetDateTime createdAt
) {}
