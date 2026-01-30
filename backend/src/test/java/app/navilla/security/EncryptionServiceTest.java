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
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.lang.reflect.Field;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

/**
 * Unit tests for {@link EncryptionService}.
 *
 * <p>Tests cover:
 * <ul>
 *   <li>Email hashing determinism and normalization</li>
 *   <li>User ID hashing</li>
 *   <li>AES-256-GCM encryption/decryption round trips</li>
 *   <li>Semantic security (same plaintext produces different ciphertexts)</li>
 *   <li>Null and edge case handling</li>
 * </ul>
 *
 * @author Navilla Team
 * @since 2026-01-30
 */
class EncryptionServiceTest {

  private static final String TEST_PEPPER = "test-pepper-for-unit-tests-only";

  private EncryptionService encryptionService;

  /**
   * Sets up a fresh EncryptionService instance before each test.
   *
   * @throws Exception if reflection fails
   */
  @BeforeEach
  void setUp() throws Exception {
    encryptionService = new EncryptionService();
    setPepper(encryptionService, TEST_PEPPER);
    encryptionService.init();
  }

  /**
   * Sets the pepper field via reflection for testing.
   *
   * @param service the service instance
   * @param pepper the pepper value to set
   * @throws Exception if reflection fails
   */
  private void setPepper(EncryptionService service, String pepper) throws Exception {
    Field pepperField = EncryptionService.class.getDeclaredField("pepper");
    pepperField.setAccessible(true);
    pepperField.set(service, pepper);
  }

  /**
   * Tests for {@link EncryptionService#hashEmail(String)}.
   */
  @Nested
  @DisplayName("hashEmail")
  class HashEmailTests {

    @Test
    @DisplayName("should produce deterministic hash for same email")
    void shouldProduceDeterministicHash() {
      String email = "test@example.com";

      String hash1 = encryptionService.hashEmail(email);
      String hash2 = encryptionService.hashEmail(email);

      assertThat(hash1).isEqualTo(hash2);
    }

    @Test
    @DisplayName("should normalize email to lowercase")
    void shouldNormalizeEmailToLowercase() {
      String hash1 = encryptionService.hashEmail("TEST@EXAMPLE.COM");
      String hash2 = encryptionService.hashEmail("test@example.com");

      assertThat(hash1).isEqualTo(hash2);
    }

    @Test
    @DisplayName("should trim whitespace from email")
    void shouldTrimWhitespace() {
      String hash1 = encryptionService.hashEmail("  test@example.com  ");
      String hash2 = encryptionService.hashEmail("test@example.com");

      assertThat(hash1).isEqualTo(hash2);
    }

    @Test
    @DisplayName("should produce 64-character hex hash")
    void shouldProduceSha256HexHash() {
      String hash = encryptionService.hashEmail("test@example.com");

      assertThat(hash).hasSize(64);
      assertThat(hash).matches("^[a-f0-9]+$");
    }

    @Test
    @DisplayName("should produce different hashes for different emails")
    void shouldProduceDifferentHashesForDifferentEmails() {
      String hash1 = encryptionService.hashEmail("user1@example.com");
      String hash2 = encryptionService.hashEmail("user2@example.com");

      assertThat(hash1).isNotEqualTo(hash2);
    }

    @Test
    @DisplayName("should throw exception for null email")
    void shouldThrowExceptionForNullEmail() {
      assertThatThrownBy(() -> encryptionService.hashEmail(null))
          .isInstanceOf(IllegalArgumentException.class)
          .hasMessage("Email cannot be null or blank");
    }

    @Test
    @DisplayName("should throw exception for blank email")
    void shouldThrowExceptionForBlankEmail() {
      assertThatThrownBy(() -> encryptionService.hashEmail("   "))
          .isInstanceOf(IllegalArgumentException.class)
          .hasMessage("Email cannot be null or blank");
    }
  }

  /**
   * Tests for {@link EncryptionService#hashUserId(String)}.
   */
  @Nested
  @DisplayName("hashUserId")
  class HashUserIdTests {

    @Test
    @DisplayName("should produce deterministic hash for same user ID")
    void shouldProduceDeterministicHash() {
      String userId = "550e8400-e29b-41d4-a716-446655440000";

      String hash1 = encryptionService.hashUserId(userId);
      String hash2 = encryptionService.hashUserId(userId);

      assertThat(hash1).isEqualTo(hash2);
    }

    @Test
    @DisplayName("should produce 64-character hex hash")
    void shouldProduceSha256HexHash() {
      String hash = encryptionService.hashUserId("550e8400-e29b-41d4-a716-446655440000");

      assertThat(hash).hasSize(64);
      assertThat(hash).matches("^[a-f0-9]+$");
    }

    @Test
    @DisplayName("should throw exception for null user ID")
    void shouldThrowExceptionForNullUserId() {
      assertThatThrownBy(() -> encryptionService.hashUserId(null))
          .isInstanceOf(IllegalArgumentException.class)
          .hasMessage("User ID cannot be null or blank");
    }

    @Test
    @DisplayName("should throw exception for blank user ID")
    void shouldThrowExceptionForBlankUserId() {
      assertThatThrownBy(() -> encryptionService.hashUserId(""))
          .isInstanceOf(IllegalArgumentException.class)
          .hasMessage("User ID cannot be null or blank");
    }
  }

  /**
   * Tests for {@link EncryptionService#encrypt(String)} and
   * {@link EncryptionService#decrypt(String)}.
   */
  @Nested
  @DisplayName("encrypt/decrypt")
  class EncryptDecryptTests {

    @Test
    @DisplayName("should encrypt and decrypt successfully")
    void shouldEncryptAndDecryptSuccessfully() {
      String plaintext = "sensitive data";

      String encrypted = encryptionService.encrypt(plaintext);
      String decrypted = encryptionService.decrypt(encrypted);

      assertThat(decrypted).isEqualTo(plaintext);
    }

    @Test
    @DisplayName("should produce different ciphertext for same plaintext (semantic security)")
    void shouldProduceDifferentCiphertextForSamePlaintext() {
      String plaintext = "sensitive data";

      String encrypted1 = encryptionService.encrypt(plaintext);
      String encrypted2 = encryptionService.encrypt(plaintext);

      assertThat(encrypted1).isNotEqualTo(encrypted2);

      // Both should decrypt to the same plaintext
      assertThat(encryptionService.decrypt(encrypted1)).isEqualTo(plaintext);
      assertThat(encryptionService.decrypt(encrypted2)).isEqualTo(plaintext);
    }

    @Test
    @DisplayName("should handle empty string")
    void shouldHandleEmptyString() {
      String plaintext = "";

      String encrypted = encryptionService.encrypt(plaintext);
      String decrypted = encryptionService.decrypt(encrypted);

      assertThat(decrypted).isEqualTo(plaintext);
    }

    @Test
    @DisplayName("should handle unicode characters")
    void shouldHandleUnicodeCharacters() {
      String plaintext = "Hello 世界 🌍 émojis";

      String encrypted = encryptionService.encrypt(plaintext);
      String decrypted = encryptionService.decrypt(encrypted);

      assertThat(decrypted).isEqualTo(plaintext);
    }

    @Test
    @DisplayName("should handle long strings")
    void shouldHandleLongStrings() {
      String plaintext = "x".repeat(10000);

      String encrypted = encryptionService.encrypt(plaintext);
      String decrypted = encryptionService.decrypt(encrypted);

      assertThat(decrypted).isEqualTo(plaintext);
    }

    @Test
    @DisplayName("should return null for null input (encrypt)")
    void shouldReturnNullForNullInputEncrypt() {
      String encrypted = encryptionService.encrypt(null);

      assertThat(encrypted).isNull();
    }

    @Test
    @DisplayName("should return null for null input (decrypt)")
    void shouldReturnNullForNullInputDecrypt() {
      String decrypted = encryptionService.decrypt(null);

      assertThat(decrypted).isNull();
    }

    @Test
    @DisplayName("should throw exception for invalid ciphertext")
    void shouldThrowExceptionForInvalidCiphertext() {
      assertThatThrownBy(() -> encryptionService.decrypt("not-valid-base64!!!"))
          .isInstanceOf(RuntimeException.class);
    }

    @Test
    @DisplayName("should throw exception for tampered ciphertext")
    void shouldThrowExceptionForTamperedCiphertext() {
      String encrypted = encryptionService.encrypt("test");
      // Tamper with the ciphertext by modifying a character
      char[] chars = encrypted.toCharArray();
      chars[20] = chars[20] == 'A' ? 'B' : 'A';
      String tampered = new String(chars);

      assertThatThrownBy(() -> encryptionService.decrypt(tampered))
          .isInstanceOf(RuntimeException.class)
          .hasMessageContaining("Decryption failed");
    }
  }

  /**
   * Tests for {@link EncryptionService#encryptToBytes(String)} and
   * {@link EncryptionService#decryptFromBytes(byte[])}.
   */
  @Nested
  @DisplayName("encryptToBytes/decryptFromBytes")
  class ByteEncryptionTests {

    @Test
    @DisplayName("should encrypt to bytes and decrypt successfully")
    void shouldEncryptToBytesAndDecryptSuccessfully() {
      String plaintext = "sensitive data for database";

      byte[] encrypted = encryptionService.encryptToBytes(plaintext);
      String decrypted = encryptionService.decryptFromBytes(encrypted);

      assertThat(decrypted).isEqualTo(plaintext);
    }

    @Test
    @DisplayName("should return null for null input (encryptToBytes)")
    void shouldReturnNullForNullInputEncryptToBytes() {
      byte[] encrypted = encryptionService.encryptToBytes(null);

      assertThat(encrypted).isNull();
    }

    @Test
    @DisplayName("should return null for null input (decryptFromBytes)")
    void shouldReturnNullForNullInputDecryptFromBytes() {
      String decrypted = encryptionService.decryptFromBytes(null);

      assertThat(decrypted).isNull();
    }
  }

  /**
   * Tests for pepper-based security.
   */
  @Nested
  @DisplayName("pepper security")
  class PepperSecurityTests {

    @Test
    @DisplayName("should produce different hashes with different peppers")
    void shouldProduceDifferentHashesWithDifferentPeppers() throws Exception {
      String email = "test@example.com";

      String hash1 = encryptionService.hashEmail(email);

      // Create a new service with different pepper
      EncryptionService service2 = new EncryptionService();
      setPepper(service2, "different-pepper");
      service2.init();

      String hash2 = service2.hashEmail(email);

      assertThat(hash1).isNotEqualTo(hash2);
    }

    @Test
    @DisplayName("encrypted data from different keys should not be decryptable")
    void encryptedDataFromDifferentKeysShouldNotBeDecryptable() throws Exception {
      String plaintext = "sensitive data";
      String encrypted = encryptionService.encrypt(plaintext);

      // Create a new service with different pepper (different key)
      EncryptionService service2 = new EncryptionService();
      setPepper(service2, "different-pepper");
      service2.init();

      assertThatThrownBy(() -> service2.decrypt(encrypted))
          .isInstanceOf(RuntimeException.class);
    }
  }
}
