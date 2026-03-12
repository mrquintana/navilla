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

package app.navilla.security;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * Tests for {@link EncryptionService#hashPhone(String, String)} country code stripping.
 *
 * @author Navilla Team
 * @since 2026-03-12
 */
@DisplayName("EncryptionService — hashPhone with country code")
class EncryptionServicePhoneHashTest {

  private EncryptionService encryptionService;

  @BeforeEach
  void setUp() {
    encryptionService = new EncryptionService();
    try {
      var pepperField = EncryptionService.class.getDeclaredField("pepper");
      pepperField.setAccessible(true);
      pepperField.set(encryptionService, "test-pepper");
    } catch (Exception e) {
      throw new RuntimeException(e);
    }
  }

  @Test
  @DisplayName("digits-only phone without country code")
  void digitsOnly_noCountryCode() {
    String hash = encryptionService.hashPhone("5512345678", null);
    assertThat(hash).hasSize(64); // SHA-256 hex
  }

  @Test
  @DisplayName("same phone with country code stripped matches without country code")
  void withCountryCode_matchesWithout() {
    String hashWithout = encryptionService.hashPhone("5512345678", null);
    String hashWith = encryptionService.hashPhone("525512345678", "52");
    assertThat(hashWith).isEqualTo(hashWithout);
  }

  @Test
  @DisplayName("country code not at start of digits — no stripping")
  void countryCodeNotAtStart_noStripping() {
    String hashNormal = encryptionService.hashPhone("5512345678", null);
    String hashDiff = encryptionService.hashPhone("5512345678", "1");
    // "1" is not at the start of "5512345678", so no stripping occurs
    assertThat(hashDiff).isEqualTo(hashNormal);
  }

  @Test
  @DisplayName("null country code same as no country code")
  void nullCountryCode_sameAsNone() {
    String hashNull = encryptionService.hashPhone("5512345678", null);
    String hashEmpty = encryptionService.hashPhone("5512345678", "");
    assertThat(hashEmpty).isEqualTo(hashNull);
  }

  @Test
  @DisplayName("backward compatible — old single-arg method still works")
  void backwardCompatible_singleArgMethod() {
    String hashOld = encryptionService.hashPhone("5512345678");
    String hashNew = encryptionService.hashPhone("5512345678", null);
    assertThat(hashOld).isEqualTo(hashNew);
  }
}
