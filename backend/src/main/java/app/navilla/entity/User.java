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

import java.time.OffsetDateTime;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcType;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.dialect.PostgreSQLEnumJdbcType;

/**
 * User entity representing a Navilla user account.
 *
 * <p>This entity stores user information with privacy-preserving measures:
 * <ul>
 *   <li>Email is stored both hashed (for lookups) and encrypted (for recovery)</li>
 *   <li>Display name and date of birth are encrypted</li>
 *   <li>Supabase ID links to authentication provider</li>
 *   <li>Privacy settings control profile visibility</li>
 * </ul>
 *
 * <p>Encryption and decryption of sensitive fields should be handled by the
 * service layer using {@link app.navilla.security.EncryptionService}.
 *
 * @author Navilla Team
 * @since 2026-01-30
 */
@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

  /**
   * Unique identifier for the user (internal database ID).
   */
  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  /**
   * Supabase Auth user UUID for API authentication lookups.
   *
   * <p>This is the primary key used to find users from JWT tokens.
   */
  @Column(name = "supabase_id", unique = true)
  private UUID supabaseId;

  /**
   * SHA-256 hash of the user's email (with pepper) for connection lookups.
   *
   * <p>Used when another user wants to connect via email address.
   */
  @Column(name = "email_hash", length = 64, unique = true, nullable = false)
  private String emailHash;

  /**
   * AES-256-GCM encrypted email for account recovery purposes.
   *
   * <p>Only decrypted when needed for sending recovery emails.
   */
  @Column(name = "email_encrypted", nullable = false)
  private byte[] emailEncrypted;

  /**
   * AES-256-GCM encrypted display name (optional).
   */
  @Column(name = "display_name_encrypted")
  private byte[] displayNameEncrypted;

  /**
   * AES-256-GCM encrypted date of birth for age verification (optional).
   *
   * <p>Stored as encrypted ISO date string (YYYY-MM-DD).
   */
  @Column(name = "dob_encrypted")
  private byte[] dobEncrypted;

  /**
   * Whether the user's email has been verified.
   */
  @Column(nullable = false)
  @Builder.Default
  private Boolean verified = false;

  // ==================== Privacy Settings ====================

  /**
   * Controls who can find this user's profile.
   */
  @Enumerated(EnumType.STRING)
  @JdbcType(PostgreSQLEnumJdbcType.class)
  @Column(name = "profile_visibility", nullable = false)
  @Builder.Default
  private ProfileVisibility profileVisibility = ProfileVisibility.PRIVATE;

  /**
   * Whether the display name is shown in search results (for public profiles).
   */
  @Column(name = "display_name_public", nullable = false)
  @Builder.Default
  private Boolean displayNamePublic = false;

  /**
   * Whether the user can be found by email search (requires PUBLIC visibility).
   */
  @Column(name = "searchable_by_email", nullable = false)
  @Builder.Default
  private Boolean searchableByEmail = false;

  /**
   * Optional public username (only meaningful for public profiles).
   */
  @Column(name = "username", length = 30, unique = true)
  private String username;

  /**
   * SHA-256 hash of username for privacy-preserving lookups.
   */
  @Column(name = "username_hash", length = 64, unique = true)
  private String usernameHash;

  // ==================== Timestamps ====================

  /**
   * Timestamp when the user account was created.
   */
  @CreationTimestamp
  @Column(name = "created_at", nullable = false, updatable = false)
  private OffsetDateTime createdAt;

  /**
   * Timestamp when the user account was last updated.
   */
  @UpdateTimestamp
  @Column(name = "updated_at", nullable = false)
  private OffsetDateTime updatedAt;
}
