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

package app.navilla.entity;

/**
 * How a connection between two users was formed.
 *
 * <p>This is a small, stable enum (not a data catalog) representing
 * the mechanism that created the connection:
 * <ul>
 *   <li>{@link #PHONE_MATCH} — mutual phone-hash match from journal entries</li>
 *   <li>{@link #NOTIFICATION_MATCH} — matched via anonymous notification flow</li>
 *   <li>{@link #EXPLICIT} — manual connection request (email/username)</li>
 *   <li>{@link #LINK} — connected via a shared link</li>
 * </ul>
 *
 * @author Navilla Team
 * @since 2026-03-04
 */
public enum ConnectionType {

  /**
   * Connection formed by mutual phone-hash match from journal entries.
   */
  PHONE_MATCH,

  /**
   * Connection formed via the anonymous notification matching flow.
   */
  NOTIFICATION_MATCH,

  /**
   * Connection formed by explicit request (email or username lookup).
   */
  EXPLICIT,

  /**
   * Connection formed via a shared connection link.
   */
  LINK;

  /**
   * Parses a user-facing value into a {@link ConnectionType}.
   *
   * @param value connection type value (case-insensitive)
   * @return matching {@link ConnectionType}
   */
  public static ConnectionType fromValue(String value) {
    return ConnectionType.valueOf(value.toUpperCase());
  }
}
