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
 * Notification types for in-app delivery.
 */
public enum NotificationType {
  CONNECTION_REQUEST,
  CONNECTION_CONFIRMED,
  CONNECTION_DENIED,
  EXPOSURE_ALERT,
  EXPOSURE_CLEARED,
  ACCOUNT_SECURITY,
  MEDICATION_REMINDER,
  VACCINATION_REMINDER,
  TESTING_REMINDER,
  FOLLOW_UP_REMINDER;

  /**
   * Parses a user-facing value into a {@link NotificationType}.
   *
   * @param value notification value (case-insensitive)
   * @return matching {@link NotificationType}
   */
  public static NotificationType fromValue(String value) {
    return NotificationType.valueOf(value.toUpperCase());
  }
}
