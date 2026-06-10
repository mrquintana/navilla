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
 * Browser-side error report posted by the frontend error reporter.
 *
 * <p>Size caps are mirrored in {@code frontend/src/lib/errorReporter.ts} —
 * the client truncates before sending so reports always validate.
 *
 * @param message   the error message (required)
 * @param stack     optional stack trace
 * @param url       optional page URL where the error occurred
 * @param userAgent optional browser user agent
 */
public record ClientErrorRequest(
    @NotBlank
    @Size(max = 500)
    String message,

    @Size(max = 5000)
    String stack,

    @Size(max = 500)
    String url,

    @Size(max = 300)
    String userAgent
) {}
