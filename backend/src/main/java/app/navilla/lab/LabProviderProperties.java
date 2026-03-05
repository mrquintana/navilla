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

package app.navilla.lab;

import java.util.List;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Configuration properties for lab providers.
 */
@ConfigurationProperties(prefix = "navilla.labs")
public record LabProviderProperties(List<LabConfig> providers) {

  /**
   * Configuration for a single lab provider.
   */
  public record LabConfig(
      String code,
      String name,
      String nameEs,
      boolean enabled,
      String baseUrl,
      List<FieldConfig> requiredFields) {
  }

  /**
   * Configuration for a required input field.
   */
  public record FieldConfig(String key, String label, String labelEs) {
  }

  /**
   * Compact constructor — defaults null providers to empty list.
   */
  public LabProviderProperties {
    if (providers == null) {
      providers = List.of();
    }
  }
}
