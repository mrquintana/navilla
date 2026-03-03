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

import java.util.List;

/**
 * Response DTO for PrEP adherence streak data with milestone tracking.
 */
public record PrepStreakResponse(
    int currentStreakDays,
    int longestStreakDays,
    List<Milestone> milestones
) {
  /**
   * Represents an adherence milestone (e.g., 7 days, 30 days, 90 days).
   */
  public record Milestone(
      int days,
      String labelKey,
      boolean achieved
  ) {}
}
