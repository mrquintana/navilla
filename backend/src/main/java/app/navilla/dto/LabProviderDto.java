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

import app.navilla.lab.LabProviderProperties;

/**
 * DTO representing a lab provider's public configuration.
 */
public record LabProviderDto(
    String code,
    String name,
    String nameEs,
    List<FieldDto> requiredFields) {

  /**
   * A required input field for a lab provider.
   */
  public record FieldDto(String key, String label, String labelEs) {
  }

  /**
   * Creates a LabProviderDto from a LabConfig.
   *
   * @param config the lab configuration
   * @return the DTO
   */
  public static LabProviderDto from(LabProviderProperties.LabConfig config) {
    return new LabProviderDto(
        config.code(),
        config.name(),
        config.nameEs(),
        config.requiredFields().stream()
            .map(f -> new FieldDto(f.key(), f.label(), f.labelEs()))
            .toList());
  }
}
