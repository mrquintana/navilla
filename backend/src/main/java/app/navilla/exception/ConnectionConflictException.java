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

package app.navilla.exception;

import java.util.UUID;

/**
 * Signals a conflict when a connection already exists.
 */
public class ConnectionConflictException extends RuntimeException {

  private final String messageKey;
  private final UUID existingConnectionId;

  /**
   * Creates a conflict exception with an optional existing connection id.
   *
   * @param messageKey localized message key
   * @param existingConnectionId existing connection id, if available
   */
  public ConnectionConflictException(String messageKey, UUID existingConnectionId) {
    super(messageKey);
    this.messageKey = messageKey;
    this.existingConnectionId = existingConnectionId;
  }

  /**
   * Returns the message key for localization.
   *
   * @return message key
   */
  public String getMessageKey() {
    return messageKey;
  }

  /**
   * Returns the existing connection id, if known.
   *
   * @return connection id or null
   */
  public UUID getExistingConnectionId() {
    return existingConnectionId;
  }
}
