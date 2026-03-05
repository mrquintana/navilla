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
import java.util.Map;

import org.junit.jupiter.api.Test;

class LabProviderRegistryTest {

  private final LabProvider mock = new LabProvider() {
    @Override
    public String getProviderCode() {
      return "TEST";
    }

    @Override
    public ValidationResult validateInput(Map<String, String> credentials) {
      return ValidationResult.ok();
    }

    @Override
    public LabVerificationResult verify(
        Map<String, String> visitCreds, Map<String, String> labCreds) {
      return LabVerificationResult.failure("N/A", "mock");
    }
  };

  @Test
  void findsRegisteredProvider() {
    assertThat(new LabProviderRegistry(List.of(mock)).getProvider("TEST"))
        .isPresent();
  }

  @Test
  void returnsEmptyForUnknownCode() {
    assertThat(new LabProviderRegistry(List.of(mock)).getProvider("X"))
        .isEmpty();
  }

  @Test
  void handlesEmptyProviderList() {
    assertThat(new LabProviderRegistry(List.of()).getProvider("X"))
        .isEmpty();
  }
}
