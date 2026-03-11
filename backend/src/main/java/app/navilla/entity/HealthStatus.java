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
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(
    name = "health_status",
    uniqueConstraints = @UniqueConstraint(
        name = "unique_condition_per_user",
        columnNames = {"user_hash", "condition_type"}
    )
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HealthStatus {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @Column(name = "user_hash", nullable = false, length = 64)
  private String userHash;

  @Size(max = 50)
  @Column(name = "condition_type", nullable = false, length = 50)
  private String conditionType;

  @Enumerated(EnumType.STRING)
  @Column(name = "status", nullable = false, length = 16)
  private HealthStatusValue status;

  @Column(name = "test_date")
  private LocalDate testDate;

  @CreationTimestamp
  @Column(name = "reported_at", nullable = false, updatable = false)
  private OffsetDateTime reportedAt;

  @Column(name = "verified", nullable = false)
  @Builder.Default
  private Boolean verified = false;

  @Column(name = "visit_id")
  private UUID visitId;

  @Column(name = "cleared_at")
  private OffsetDateTime clearedAt;
}
