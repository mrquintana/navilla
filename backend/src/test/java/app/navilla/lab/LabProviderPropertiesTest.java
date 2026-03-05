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

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.Test;

class LabProviderPropertiesTest {

  @Test
  void defaultNull() {
    assertThat(new LabProviderProperties(null).providers()).isEmpty();
  }

  @Test
  void parsesConfig() {
    var field = new LabProviderProperties.FieldConfig(
        "orderId", "Order ID", "Número de orden");
    var config = new LabProviderProperties.LabConfig(
        "MOCK", "Mock", "Mock", true, "http://localhost", List.of(field));
    var props = new LabProviderProperties(List.of(config));

    assertThat(props.providers()).hasSize(1);
    assertThat(props.providers().getFirst().code()).isEqualTo("MOCK");
    assertThat(props.providers().getFirst().requiredFields().getFirst().key())
        .isEqualTo("orderId");
  }
}
