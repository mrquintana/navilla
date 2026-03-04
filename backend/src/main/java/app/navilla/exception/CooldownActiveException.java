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

/**
 * Exception thrown when a user attempts an action that is blocked by a cooldown period.
 *
 * <p>For example, re-opting into the exposure network before the cooldown expires
 * after opting out.
 *
 * @author Navilla Team
 * @since 2026-03-04
 */
public class CooldownActiveException extends RuntimeException {

  private final String messageKey;
  private final int daysRemaining;

  /**
   * Creates a cooldown exception with the remaining days.
   *
   * @param messageKey    localized message key
   * @param daysRemaining number of days remaining in the cooldown
   */
  public CooldownActiveException(String messageKey, int daysRemaining) {
    super(messageKey);
    this.messageKey = messageKey;
    this.daysRemaining = daysRemaining;
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
   * Returns the number of cooldown days remaining.
   *
   * @return days remaining
   */
  public int getDaysRemaining() {
    return daysRemaining;
  }
}
