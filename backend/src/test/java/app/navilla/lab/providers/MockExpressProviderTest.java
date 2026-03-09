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

package app.navilla.lab.providers;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Map;

import app.navilla.lab.LabProviderProperties;
import app.navilla.lab.ValidationResult;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class MockExpressProviderTest {

  private MockExpressProvider provider;

  @BeforeEach
  void setUp() {
    LabProviderProperties props = new LabProviderProperties(null, List.of());
    provider = new MockExpressProvider(props, new ObjectMapper());
  }

  @Test
  void providerCode_returnsMockExpress() {
    assertThat(provider.getProviderCode()).isEqualTo("MOCK_EXPRESS");
  }

  @Test
  void validateInput_missingOrderId_returnsInvalid() {
    ValidationResult result = provider.validateInput(Map.of());
    assertThat(result.valid()).isFalse();
    assertThat(result.fieldErrors()).containsKey("orderId");
  }

  @Test
  void validateInput_blankOrderId_returnsInvalid() {
    ValidationResult result = provider.validateInput(Map.of("orderId", "  "));
    assertThat(result.valid()).isFalse();
    assertThat(result.fieldErrors()).containsKey("orderId");
  }

  @Test
  void validateInput_validOrderId_returnsOk() {
    ValidationResult result = provider.validateInput(Map.of("orderId", "EXP-456"));
    assertThat(result.valid()).isTrue();
    assertThat(result.fieldErrors()).isEmpty();
  }
}
