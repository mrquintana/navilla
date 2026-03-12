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

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;
import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * Service for encryption and hashing operations.
 *
 * <p>Provides utilities for:
 * <ul>
 *   <li>Hashing emails for database lookups (SHA-256 with pepper)</li>
 *   <li>Hashing user IDs for anonymization</li>
 *   <li>Encrypting/decrypting sensitive data (AES-256-GCM)</li>
 * </ul>
 *
 * <p>All encryption uses AES-256-GCM with random IVs for semantic security.
 *
 * @author Navilla Team
 * @since 2026-01-30
 */
@Slf4j
@Service
public class EncryptionService {

  private static final String HASH_ALGORITHM = "SHA-256";
  private static final String ENCRYPTION_ALGORITHM = "AES/GCM/NoPadding";
  private static final int GCM_IV_LENGTH = 12;
  private static final int GCM_TAG_LENGTH = 128;

  @Value("${navilla.encryption.pepper}")
  private String pepper;

  private SecretKey encryptionKey;
  private final SecureRandom secureRandom = new SecureRandom();

  /**
   * Initializes the encryption key from the pepper.
   *
   * <p>Derives a 256-bit key from the pepper using SHA-256.
   */
  @PostConstruct
  public void init() {
    try {
      MessageDigest digest = MessageDigest.getInstance(HASH_ALGORITHM);
      byte[] keyBytes = digest.digest(pepper.getBytes(StandardCharsets.UTF_8));
      this.encryptionKey = new SecretKeySpec(keyBytes, "AES");
      log.info("Encryption service initialized successfully");
    } catch (NoSuchAlgorithmException ex) {
      throw new IllegalStateException("Failed to initialize encryption service", ex);
    }
  }

  /**
   * Hashes an email address for database lookup.
   *
   * <p>Uses SHA-256 with a pepper to prevent rainbow table attacks.
   * The result is a deterministic hash that can be used for lookups.
   *
   * @param email the email address to hash
   * @return the hex-encoded hash (64 characters)
   */
  public String hashEmail(String email) {
    if (email == null || email.isBlank()) {
      throw new IllegalArgumentException("Email cannot be null or blank");
    }
    return hash(email.toLowerCase().trim());
  }

  /**
   * Hashes a Supabase user ID for anonymization.
   *
   * <p>Used to create anonymous user identifiers for the connection graph.
   *
   * @param userId the Supabase user ID (UUID string)
   * @return the hex-encoded hash (64 characters)
   */
  public String hashUserId(String userId) {
    if (userId == null || userId.isBlank()) {
      throw new IllegalArgumentException("User ID cannot be null or blank");
    }
    return hash(userId);
  }

  /**
   * Hashes a phone number for privacy-preserving lookup.
   *
   * <p>Normalizes the phone number by stripping all non-digit characters
   * before hashing with the pepper.
   *
   * @param rawPhone the raw phone number (may contain dashes, spaces, etc.)
   * @return the hex-encoded hash (64 characters)
   */
  public String hashPhone(String rawPhone) {
    return hashPhone(rawPhone, null);
  }

  /**
   * Hashes a phone number, optionally stripping a country code prefix.
   *
   * <p>If a country code is provided and the normalized digits start with it,
   * the prefix is stripped before hashing. This ensures matching works regardless
   * of whether users include the country code.
   *
   * @param rawPhone    the raw phone number (digits only expected, but non-digits are stripped)
   * @param countryCode optional country calling code (e.g. "52", "1") — digits only, no "+"
   * @return the hex-encoded hash (64 characters)
   */
  public String hashPhone(String rawPhone, String countryCode) {
    if (rawPhone == null || rawPhone.isBlank()) {
      throw new IllegalArgumentException("Phone number cannot be null or blank");
    }
    String normalized = rawPhone.replaceAll("[^\\d]", "");
    if (normalized.isEmpty()) {
      throw new IllegalArgumentException("Phone number must contain at least one digit");
    }
    // Strip country code prefix if provided and present
    if (countryCode != null && !countryCode.isBlank()) {
      String ccDigits = countryCode.replaceAll("[^\\d]", "");
      if (!ccDigits.isEmpty() && normalized.startsWith(ccDigits)) {
        normalized = normalized.substring(ccDigits.length());
      }
    }
    return hash(normalized);
  }

  /**
   * Hashes a username for privacy-preserving lookup.
   *
   * @param username the username to hash
   * @return the hex-encoded hash (64 characters)
   */
  public String hashUsername(String username) {
    if (username == null || username.isBlank()) {
      throw new IllegalArgumentException("Username cannot be null or blank");
    }
    return hash(username.toLowerCase().trim());
  }

  /**
   * Encrypts sensitive data using AES-256-GCM.
   *
   * <p>Each encryption uses a random IV for semantic security.
   * The IV is prepended to the ciphertext in the returned byte array.
   *
   * @param plaintext the data to encrypt
   * @return the encrypted data (IV + ciphertext) as Base64 string
   */
  public String encrypt(String plaintext) {
    if (plaintext == null) {
      return null;
    }
    try {
      byte[] iv = new byte[GCM_IV_LENGTH];
      secureRandom.nextBytes(iv);

      Cipher cipher = Cipher.getInstance(ENCRYPTION_ALGORITHM);
      GCMParameterSpec parameterSpec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
      cipher.init(Cipher.ENCRYPT_MODE, encryptionKey, parameterSpec);

      byte[] ciphertext = cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));

      // Prepend IV to ciphertext
      byte[] combined = new byte[iv.length + ciphertext.length];
      System.arraycopy(iv, 0, combined, 0, iv.length);
      System.arraycopy(ciphertext, 0, combined, iv.length, ciphertext.length);

      return Base64.getEncoder().encodeToString(combined);
    } catch (Exception ex) {
      throw new RuntimeException("Encryption failed", ex);
    }
  }

  /**
   * Decrypts data that was encrypted with {@link #encrypt(String)}.
   *
   * @param encryptedData the Base64-encoded encrypted data (IV + ciphertext)
   * @return the decrypted plaintext
   */
  public String decrypt(String encryptedData) {
    if (encryptedData == null) {
      return null;
    }
    try {
      byte[] combined = Base64.getDecoder().decode(encryptedData);

      // Extract IV and ciphertext
      byte[] iv = new byte[GCM_IV_LENGTH];
      byte[] ciphertext = new byte[combined.length - GCM_IV_LENGTH];
      System.arraycopy(combined, 0, iv, 0, iv.length);
      System.arraycopy(combined, iv.length, ciphertext, 0, ciphertext.length);

      Cipher cipher = Cipher.getInstance(ENCRYPTION_ALGORITHM);
      GCMParameterSpec parameterSpec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
      cipher.init(Cipher.DECRYPT_MODE, encryptionKey, parameterSpec);

      byte[] plaintext = cipher.doFinal(ciphertext);
      return new String(plaintext, StandardCharsets.UTF_8);
    } catch (Exception ex) {
      throw new RuntimeException("Decryption failed", ex);
    }
  }

  /**
   * Encrypts data to a byte array for database storage.
   *
   * @param plaintext the data to encrypt
   * @return the encrypted data as byte array
   */
  public byte[] encryptToBytes(String plaintext) {
    if (plaintext == null) {
      return null;
    }
    String encrypted = encrypt(plaintext);
    return Base64.getDecoder().decode(encrypted);
  }

  /**
   * Decrypts data from a byte array.
   *
   * @param encryptedBytes the encrypted data as byte array
   * @return the decrypted plaintext
   */
  public String decryptFromBytes(byte[] encryptedBytes) {
    if (encryptedBytes == null) {
      return null;
    }
    String encoded = Base64.getEncoder().encodeToString(encryptedBytes);
    return decrypt(encoded);
  }

  /**
   * Internal hash function using SHA-256 with pepper.
   */
  private String hash(String input) {
    try {
      MessageDigest digest = MessageDigest.getInstance(HASH_ALGORITHM);
      String peppered = input + pepper;
      byte[] hashBytes = digest.digest(peppered.getBytes(StandardCharsets.UTF_8));
      return bytesToHex(hashBytes);
    } catch (NoSuchAlgorithmException ex) {
      throw new RuntimeException("Hash algorithm not available", ex);
    }
  }

  /**
   * Signs data using HMAC-SHA256 with the encryption key.
   *
   * <p>Used for anti-forgery verification of card data.
   *
   * @param data the data to sign
   * @return the hex-encoded HMAC signature
   */
  public String hmacSign(String data) {
    try {
      javax.crypto.Mac mac = javax.crypto.Mac.getInstance("HmacSHA256");
      mac.init(encryptionKey);
      byte[] hmacBytes = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
      return bytesToHex(hmacBytes);
    } catch (Exception ex) {
      throw new RuntimeException("HMAC signing failed", ex);
    }
  }

  /**
   * Converts byte array to hex string.
   */
  private static String bytesToHex(byte[] bytes) {
    StringBuilder hex = new StringBuilder();
    for (byte b : bytes) {
      hex.append(String.format("%02x", b));
    }
    return hex.toString();
  }
}
