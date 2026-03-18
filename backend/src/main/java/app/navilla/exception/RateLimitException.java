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
 * Exception thrown when a rate limit is exceeded.
 *
 * <p>Returns HTTP 429 (Too Many Requests) via the global exception handler.
 *
 * @author Navilla Team
 * @since 2026-03-04
 */
public class RateLimitException extends RuntimeException {

  private final String messageKey;
  private final long retryAfterSeconds;

  /**
   * Creates a rate limit exception with an i18n message key and default retry of 60s.
   *
   * @param messageKey localized message key
   */
  public RateLimitException(String messageKey) {
    this(messageKey, 60);
  }

  /**
   * Creates a rate limit exception with an i18n message key and retry delay.
   *
   * @param messageKey localized message key
   * @param retryAfterSeconds seconds until the client should retry
   */
  public RateLimitException(String messageKey, long retryAfterSeconds) {
    super(messageKey);
    this.messageKey = messageKey;
    this.retryAfterSeconds = retryAfterSeconds;
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
   * Returns the number of seconds until the client should retry.
   *
   * @return retry delay in seconds
   */
  public long getRetryAfterSeconds() {
    return retryAfterSeconds;
  }
}
