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

import java.util.List;
import java.util.UUID;

import app.navilla.dto.CreateLabRequest;
import app.navilla.dto.LabCredentialDto;
import app.navilla.dto.LabResponse;
import app.navilla.dto.UpdateLabRequest;
import app.navilla.entity.Lab;
import app.navilla.entity.LabCredential;
import app.navilla.exception.ResourceNotFoundException;
import app.navilla.repository.LabCredentialRepository;
import app.navilla.repository.LabRepository;
import app.navilla.security.EncryptionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service for managing lab connections with encrypted credentials.
 *
 * <p>Handles CRUD operations for lab profiles (Chopo, Salud Digna, etc.)
 * with end-to-end encryption of sensitive fields (name, credential values).
 * Uses the user's email hash for identity rather than raw email.
 *
 * @author Navilla Team
 * @since 2026-02-27
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class LabService {

  private final LabRepository labRepository;
  private final LabCredentialRepository labCredentialRepository;
  private final EncryptionService encryptionService;
  private final ResourceCapService resourceCapService;

  /**
   * Creates a new lab connection for the authenticated user.
   *
   * @param jwt     the JWT token containing user info
   * @param request the create request with provider, name, and optional credentials
   * @return the created lab response with decrypted data
   */
  @Transactional
  public LabResponse createLab(Jwt jwt, CreateLabRequest request) {
    String userHash = hashEmail(jwt);
    resourceCapService.checkCap("labs", labRepository.countByUserHash(userHash));

    String provider = request.provider().toUpperCase();

    Lab lab = Lab.builder()
        .userHash(userHash)
        .provider(provider)
        .nameEncrypted(encryptionService.encryptToBytes(request.name()))
        .build();

    Lab saved = labRepository.save(lab);
    log.info("Lab created for user with provider: {}", provider);

    if (request.credentials() != null && !request.credentials().isEmpty()) {
      List<LabCredential> credentials = request.credentials().stream()
          .map(dto -> LabCredential.builder()
              .labId(saved.getId())
              .credentialKey(dto.key())
              .valueEncrypted(encryptionService.encryptToBytes(dto.value()))
              .build())
          .toList();
      labCredentialRepository.saveAll(credentials);
    }

    return toResponse(saved);
  }

  /**
   * Lists all lab connections for the authenticated user.
   *
   * @param jwt the JWT token containing user info
   * @return list of decrypted lab responses with credentials
   */
  @Transactional(readOnly = true)
  public List<LabResponse> listLabs(Jwt jwt) {
    String userHash = hashEmail(jwt);

    List<Lab> labs = labRepository.findByUserHashOrderByCreatedAtDesc(userHash);

    return labs.stream()
        .map(this::toResponse)
        .toList();
  }

  /**
   * Updates an existing lab connection.
   *
   * @param jwt     the JWT token containing user info
   * @param id      the lab ID
   * @param request the update request with optional name and credentials
   * @return the updated lab response with decrypted data
   */
  @Transactional
  public LabResponse updateLab(Jwt jwt, UUID id, UpdateLabRequest request) {
    String userHash = hashEmail(jwt);

    Lab lab = labRepository.findById(id)
        .orElseThrow(() -> new ResourceNotFoundException(
            "healthLog.error.notFound"));

    if (!lab.getUserHash().equals(userHash)) {
      throw new IllegalStateException("healthLog.error.notOwner");
    }

    if (request.name() != null && !request.name().isBlank()) {
      lab.setNameEncrypted(encryptionService.encryptToBytes(request.name()));
    }

    if (request.credentials() != null) {
      labCredentialRepository.deleteByLabId(id);
      List<LabCredential> credentials = request.credentials().stream()
          .map(dto -> LabCredential.builder()
              .labId(id)
              .credentialKey(dto.key())
              .valueEncrypted(encryptionService.encryptToBytes(dto.value()))
              .build())
          .toList();
      labCredentialRepository.saveAll(credentials);
    }

    Lab saved = labRepository.save(lab);
    log.info("Lab updated: {}", id);

    return toResponse(saved);
  }

  /**
   * Deletes a lab connection owned by the authenticated user.
   *
   * @param jwt the JWT token containing user info
   * @param id  the lab ID
   */
  @Transactional
  public void deleteLab(Jwt jwt, UUID id) {
    String userHash = hashEmail(jwt);

    Lab lab = labRepository.findById(id)
        .orElseThrow(() -> new ResourceNotFoundException(
            "healthLog.error.notFound"));

    if (!lab.getUserHash().equals(userHash)) {
      throw new IllegalStateException("healthLog.error.notOwner");
    }

    labRepository.delete(lab);
    log.info("Lab deleted: {}", id);
  }

  // ---- Private helpers ----

  private String hashEmail(Jwt jwt) {
    return encryptionService
        .hashEmail(jwt.getClaimAsString("email"));
  }

  private LabResponse toResponse(Lab lab) {
    List<LabCredential> credentials =
        labCredentialRepository.findByLabId(lab.getId());

    List<LabCredentialDto> credentialDtos = credentials.stream()
        .map(cred -> new LabCredentialDto(
            cred.getCredentialKey(),
            encryptionService.decryptFromBytes(cred.getValueEncrypted())))
        .toList();

    return new LabResponse(
        lab.getId(),
        lab.getProvider(),
        encryptionService.decryptFromBytes(lab.getNameEncrypted()),
        credentialDtos,
        lab.getCreatedAt()
    );
  }
}
