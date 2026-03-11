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
 * Response DTO for a publicly viewed verification card.
 */
public record PublicVerificationCardResponse(
    String displayName,
    String username,
    List<PublicConditionStatus> conditions,
    OffsetDateTime expiresAt,
    Integer viewsRemaining
) {
  /**
   * Status of a single condition on a public verification card.
   */
  public record PublicConditionStatus(
      String condition,
      String status,
      String verificationLevel,
      String testDate,
      String labName,
      String labProvider,
      String verifiedAt,
      String labWebsiteUrl
  ) {}
}
