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

import java.time.LocalDate;
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

/**
 * Entity representing a phone-based connection entry submitted by a user.
 *
 * <p>When a user logs an encounter with a phone number, a hashed entry is stored.
 * If both parties log each other's phone numbers within a configurable time window,
 * a mutual match is created.
 *
 * @author Navilla Team
 * @since 2026-03-04
 */
@Entity
@Table(name = "connection_phone_entries")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConnectionPhoneEntry {

  /**
   * Unique identifier for the phone entry.
   */
  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  /**
   * SHA-256 hash of the user who submitted this entry.
   */
  @Column(name = "user_hash", nullable = false, length = 64)
  private String userHash;

  /**
   * SHA-256 hash of the phone number submitted.
   */
  @Column(name = "phone_hash", nullable = false, length = 64)
  private String phoneHash;

  /**
   * Date of the encounter associated with this phone entry.
   */
  @Column(name = "encounter_date", nullable = false)
  private LocalDate encounterDate;

  /**
   * Optional reference to the journal entry this phone was logged from.
   */
  @Column(name = "journal_entry_id")
  private UUID journalEntryId;

  /**
   * Whether this entry has been matched with another user's entry.
   */
  @Column(name = "matched", nullable = false)
  @Builder.Default
  private Boolean matched = false;

  /**
   * Timestamp when this entry was created.
   */
  @CreationTimestamp
  @Column(name = "created_at", nullable = false, updatable = false)
  private OffsetDateTime createdAt;
}
