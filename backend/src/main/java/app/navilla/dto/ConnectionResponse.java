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

import app.navilla.entity.ConnectionStatus;

/**
 * Response DTO for connection information.
 *
 * <p>Contains anonymized connection data without revealing partner identity.
 *
 * @param id the connection's unique identifier
 * @param status the current connection status
 * @param isRequester whether the current user initiated this connection
 * @param requestedAt when the connection request was sent
 * @param confirmedAt when the connection was confirmed (null if not confirmed)
 * @author Navilla Team
 * @since 2026-01-31
 */
public record ConnectionResponse(
    UUID id,
    ConnectionStatus status,
    boolean isRequester,
    OffsetDateTime requestedAt,
    OffsetDateTime confirmedAt
) {}
