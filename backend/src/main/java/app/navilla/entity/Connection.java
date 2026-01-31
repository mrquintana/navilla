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
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

/**
 * Connection entity representing a bidirectional connection between two users.
 *
 * <p>Connections are stored using hashed user identifiers for privacy:
 * <ul>
 *   <li>user_a_hash: Hash of the user who initiated the connection request</li>
 *   <li>user_b_hash: Hash of the user who received the connection request</li>
 * </ul>
 *
 * <p>The connection follows a request-response flow:
 * <ol>
 *   <li>User A sends request (status: PENDING)</li>
 *   <li>User B responds (status: CONFIRMED or DENIED)</li>
 *   <li>Or request expires (status: EXPIRED)</li>
 * </ol>
 *
 * @author Navilla Team
 * @since 2026-01-31
 */
@Entity
@Table(
    name = "connections",
    uniqueConstraints = @UniqueConstraint(
        name = "unique_connection",
        columnNames = {"user_a_hash", "user_b_hash"}
    )
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Connection {

  /**
   * Unique identifier for the connection.
   */
  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  /**
   * SHA-256 hash of the user who initiated the connection request.
   */
  @Column(name = "user_a_hash", length = 64, nullable = false)
  private String requesterHash;

  /**
   * SHA-256 hash of the user who received the connection request.
   */
  @Column(name = "user_b_hash", length = 64, nullable = false)
  private String recipientHash;

  /**
   * Current status of the connection.
   */
  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 20)
  @Builder.Default
  private ConnectionStatus status = ConnectionStatus.PENDING;

  /**
   * Timestamp when the connection request was sent.
   */
  @CreationTimestamp
  @Column(name = "requested_at", nullable = false, updatable = false)
  private OffsetDateTime requestedAt;

  /**
   * Timestamp when the recipient responded (confirmed or denied).
   */
  @Column(name = "responded_at")
  private OffsetDateTime respondedAt;

  /**
   * Timestamp when the connection was confirmed.
   * Only set when status is CONFIRMED.
   */
  @Column(name = "confirmed_at")
  private OffsetDateTime confirmedAt;
}
