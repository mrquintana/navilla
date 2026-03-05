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

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;

class LabVerificationResultTest {

  @Test
  void successFactory() {
    var r = LabVerificationResult.success(
        new byte[]{1},
        "application/json",
        List.of(new LabTestResult(
            "John", LocalDate.of(2026, 3, 1),
            "CHLAMYDIA", "NEGATIVE", null, null, "ORD-1")));

    assertThat(r.success()).isTrue();
    assertThat(r.results()).hasSize(1);
    assertThat(r.errorCode()).isNull();
  }

  @Test
  void failureFactory() {
    var r = LabVerificationResult.failure("NOT_FOUND", "Order not found");

    assertThat(r.success()).isFalse();
    assertThat(r.results()).isEmpty();
    assertThat(r.errorCode()).isEqualTo("NOT_FOUND");
  }

  @Test
  void validationResultOk() {
    assertThat(ValidationResult.ok().valid()).isTrue();
    assertThat(ValidationResult.ok().fieldErrors()).isEmpty();
  }

  @Test
  void validationResultInvalid() {
    var invalid = ValidationResult.invalid(Map.of("orderId", "Required"));

    assertThat(invalid.valid()).isFalse();
    assertThat(invalid.fieldErrors()).containsKey("orderId");
  }
}
