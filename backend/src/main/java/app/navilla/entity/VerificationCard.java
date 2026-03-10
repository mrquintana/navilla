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
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "verification_cards")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VerificationCard {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @Column(name = "user_hash", nullable = false, length = 64)
  private String userHash;

  @Column(name = "display_name_encrypted")
  private byte[] displayNameEncrypted;

  @JdbcTypeCode(SqlTypes.ARRAY)
  @Column(name = "included_conditions", columnDefinition = "text[]", nullable = false)
  @Builder.Default
  private String[] includedConditions = new String[]{};

  @Column(name = "show_test_dates", nullable = false)
  @Builder.Default
  private Boolean showTestDates = false;

  @Column(name = "show_verification_level", nullable = false)
  @Builder.Default
  private Boolean showVerificationLevel = true;

  @Column(name = "share_token", nullable = false, unique = true, length = 64)
  private String shareToken;

  @Column(name = "privacy_mode", nullable = false, length = 20)
  @Builder.Default
  private String privacyMode = "PRIVATE";

  @Column(name = "max_views")
  private Integer maxViews;

  @Column(name = "current_views", nullable = false)
  @Builder.Default
  private int currentViews = 0;

  @Column(name = "expires_at")
  private OffsetDateTime expiresAt;

  @CreationTimestamp
  @Column(name = "created_at", nullable = false, updatable = false)
  private OffsetDateTime createdAt;

  @UpdateTimestamp
  @Column(name = "updated_at", nullable = false)
  private OffsetDateTime updatedAt;
}
