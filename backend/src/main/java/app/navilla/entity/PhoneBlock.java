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
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

/**
 * Entity representing a user blocking a phone hash from matching.
 *
 * <p>Once a user blocks a phone hash, no future matches will be created
 * between the blocking user and the blocked phone hash.
 *
 * @author Navilla Team
 * @since 2026-03-04
 */
@Entity
@Table(
    name = "phone_blocks",
    uniqueConstraints = @UniqueConstraint(
        name = "unique_phone_block",
        columnNames = {"user_hash", "blocked_phone_hash"}
    )
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PhoneBlock {

  /**
   * Unique identifier for the phone block.
   */
  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  /**
   * SHA-256 hash of the user who created this block.
   */
  @Column(name = "user_hash", nullable = false, length = 64)
  private String userHash;

  /**
   * SHA-256 hash of the blocked phone number.
   */
  @Column(name = "blocked_phone_hash", nullable = false, length = 64)
  private String blockedPhoneHash;

  /**
   * Timestamp when the block was created.
   */
  @CreationTimestamp
  @Column(name = "created_at", nullable = false, updatable = false)
  private OffsetDateTime createdAt;
}
