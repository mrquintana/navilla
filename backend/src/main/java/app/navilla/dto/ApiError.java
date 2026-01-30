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
import java.util.List;

/**
 * Standard API error response.
 *
 * @param timestamp when the error occurred
 * @param status HTTP status code
 * @param error HTTP status reason phrase
 * @param message localized error message
 * @param path request path
 * @param details additional error details (validation errors, etc.)
 */
public record ApiError(
    OffsetDateTime timestamp,
    int status,
    String error,
    String message,
    String path,
    List<String> details
) {

  /**
   * Creates an ApiError with a single message.
   */
  public static ApiError of(int status, String error, String message, String path) {
    return new ApiError(
        OffsetDateTime.now(),
        status,
        error,
        message,
        path,
        null
    );
  }

  /**
   * Creates an ApiError with details.
   */
  public static ApiError of(int status, String error, String message, String path,
      List<String> details) {
    return new ApiError(
        OffsetDateTime.now(),
        status,
        error,
        message,
        path,
        details
    );
  }
}
