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
 * Supported condition types for health status reporting.
 *
 * @deprecated Replaced by condition_catalog database table.
 * Use ConditionCatalogService.isValidCode() for validation.
 * Kept temporarily for backward compatibility during migration.
 */
@Deprecated
public enum ConditionType {
  CHLAMYDIA,
  GONORRHEA,
  SYPHILIS,
  HIV,
  HSV1,
  HSV2,
  HPV,
  HEPATITIS_B,
  HEPATITIS_C,
  TRICHOMONIASIS;

  /**
   * Parses a user-facing value into a {@link ConditionType}.
   *
   * @param value condition value (case-insensitive)
   * @return matching {@link ConditionType}
   */
  public static ConditionType fromValue(String value) {
    return ConditionType.valueOf(value.toUpperCase());
  }
}
