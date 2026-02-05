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

package app.navilla.service;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;

import app.navilla.dto.ClearHealthStatusRequest;
import app.navilla.dto.HealthStatusRequest;
import app.navilla.dto.HealthStatusResponse;
import app.navilla.entity.ConditionType;
import app.navilla.entity.HealthStatus;
import app.navilla.entity.HealthStatusValue;
import app.navilla.exception.ResourceNotFoundException;
import app.navilla.repository.HealthStatusRepository;
import app.navilla.security.EncryptionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class HealthStatusService {

  private final HealthStatusRepository healthStatusRepository;
  private final EncryptionService encryptionService;

  /**
   * Lists the authenticated user's health status records.
   *
   * @param jwt the JWT token containing user info
   * @return list of health status records
   */
  @Transactional(readOnly = true)
  public List<HealthStatusResponse> listMyStatuses(Jwt jwt) {
    String userHash = encryptionService.hashEmail(jwt.getClaimAsString("email"));
    return healthStatusRepository.findByUserHashOrderByReportedAtDesc(userHash).stream()
        .map(this::toResponse)
        .toList();
  }

  /**
   * Reports or updates a health status record for the authenticated user.
   *
   * @param jwt the JWT token containing user info
   * @param request the health status request
   * @return the saved health status record
   */
  @Transactional
  public HealthStatusResponse reportStatus(Jwt jwt, HealthStatusRequest request) {
    String userHash = encryptionService.hashEmail(jwt.getClaimAsString("email"));
    ConditionType condition = ConditionType.fromValue(request.condition().trim());
    HealthStatusValue status = HealthStatusValue.fromValue(request.status().trim());
    LocalDate testDate = request.testDate() != null && !request.testDate().isBlank()
        ? LocalDate.parse(request.testDate().trim())
        : null;

    HealthStatus record = healthStatusRepository.findByUserHashAndConditionType(userHash, condition)
        .orElseGet(() -> HealthStatus.builder()
            .userHash(userHash)
            .conditionType(condition)
            .build());

    record.setStatus(status);
    record.setTestDate(testDate);
    record.setClearedAt(null);

    HealthStatus saved = healthStatusRepository.save(record);
    log.info("Health status reported: {} {}", condition, status);
    return toResponse(saved);
  }

  /**
   * Clears a health status record.
   *
   * @param jwt the JWT token containing user info
   * @param id the health status record id
   * @param request optional cleared date
   * @return the updated health status record
   */
  @Transactional
  public HealthStatusResponse clearStatus(Jwt jwt, UUID id, ClearHealthStatusRequest request) {
    String userHash = encryptionService.hashEmail(jwt.getClaimAsString("email"));
    HealthStatus record = healthStatusRepository.findById(id)
        .orElseThrow(() -> new ResourceNotFoundException("health.error.notFound"));

    if (!record.getUserHash().equals(userHash)) {
      throw new IllegalStateException("health.error.notOwner");
    }

    OffsetDateTime clearedAt = OffsetDateTime.now();
    if (request != null && request.clearedDate() != null && !request.clearedDate().isBlank()) {
      LocalDate date = LocalDate.parse(request.clearedDate().trim());
      clearedAt = date.atStartOfDay().atOffset(ZoneOffset.UTC);
    }

    record.setClearedAt(clearedAt);
    HealthStatus saved = healthStatusRepository.save(record);
    return toResponse(saved);
  }

  /**
   * Reactivates a cleared health status record.
   *
   * @param jwt the JWT token containing user info
   * @param id the health status record id
   * @return the updated health status record
   */
  @Transactional
  public HealthStatusResponse activateStatus(Jwt jwt, UUID id) {
    String userHash = encryptionService.hashEmail(jwt.getClaimAsString("email"));
    HealthStatus record = healthStatusRepository.findById(id)
        .orElseThrow(() -> new ResourceNotFoundException("health.error.notFound"));

    if (!record.getUserHash().equals(userHash)) {
      throw new IllegalStateException("health.error.notOwner");
    }

    record.setClearedAt(null);
    HealthStatus saved = healthStatusRepository.save(record);
    log.info("Health status reactivated: {} {}", record.getConditionType(), record.getStatus());
    return toResponse(saved);
  }

  /**
   * Deletes a health status record for the authenticated user.
   *
   * @param jwt the JWT token containing user info
   * @param id the health status record id
   */
  @Transactional
  public void deleteStatus(Jwt jwt, UUID id) {
    String userHash = encryptionService.hashEmail(jwt.getClaimAsString("email"));
    HealthStatus record = healthStatusRepository.findById(id)
        .orElseThrow(() -> new ResourceNotFoundException("health.error.notFound"));

    if (!record.getUserHash().equals(userHash)) {
      throw new IllegalStateException("health.error.notOwner");
    }

    healthStatusRepository.delete(record);
  }

  private HealthStatusResponse toResponse(HealthStatus record) {
    return new HealthStatusResponse(
        record.getId(),
        record.getConditionType().name().toLowerCase(),
        record.getStatus().name().toLowerCase(),
        record.getTestDate(),
        record.getReportedAt(),
        record.getClearedAt()
    );
  }
}
