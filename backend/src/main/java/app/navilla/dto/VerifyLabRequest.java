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

import java.util.Map;
import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Request DTO for initiating lab verification.
 *
 * <p>Either {@code visitId} or {@code testDate} must be provided.
 * When {@code visitId} is null, a shell visit is created from {@code testDate}.
 */
public record VerifyLabRequest(
    UUID visitId,
    @NotBlank @Size(max = 50) String labCode,
    @NotNull @Size(max = 10) Map<String, String> visitCredentials,
    @Size(max = 10) Map<String, String> labCredentials,
    @Size(max = 10) @Pattern(regexp = "^\\d{4}-\\d{2}-\\d{2}$", message = "must be yyyy-MM-dd")
    String testDate) {

  /**
   * Compact constructor that defaults labCredentials to empty map if null.
   */
  public VerifyLabRequest {
    if (labCredentials == null) {
      labCredentials = Map.of();
    }
  }
}
