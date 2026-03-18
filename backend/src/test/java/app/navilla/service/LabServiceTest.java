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

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.OffsetDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
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
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.oauth2.jwt.Jwt;

/**
 * Unit tests for {@link LabService}.
 *
 * @author Navilla Team
 * @since 2026-02-27
 */
@ExtendWith(MockitoExtension.class)
class LabServiceTest {

  @Mock
  private LabRepository labRepository;

  @Mock
  private LabCredentialRepository labCredentialRepository;

  @Mock
  private EncryptionService encryptionService;

  @Mock
  private ResourceCapService resourceCapService;

  @InjectMocks
  private LabService labService;

  private static final String USER_EMAIL = "user@example.com";
  private static final String USER_HASH = "userhash123";
  private static final UUID LAB_ID = UUID.randomUUID();
  private static final byte[] ENCRYPTED_NAME = new byte[]{1, 2, 3};
  private static final byte[] ENCRYPTED_CRED_VALUE = new byte[]{4, 5, 6};
  private static final byte[] ENCRYPTED_CRED_VALUE_2 = new byte[]{7, 8, 9};

  private Jwt mockJwt() {
    Jwt jwt = mock(Jwt.class);
    when(jwt.getClaimAsString("email")).thenReturn(USER_EMAIL);
    when(encryptionService.hashEmail(USER_EMAIL)).thenReturn(USER_HASH);
    return jwt;
  }

  private Lab buildLab(UUID id, String userHash) {
    return Lab.builder()
        .id(id)
        .userHash(userHash)
        .provider("CHOPO")
        .nameEncrypted(ENCRYPTED_NAME)
        .createdAt(OffsetDateTime.now())
        .build();
  }

  private LabCredential buildCredential(UUID labId, String key, byte[] valueEncrypted) {
    return LabCredential.builder()
        .id(UUID.randomUUID())
        .labId(labId)
        .credentialKey(key)
        .valueEncrypted(valueEncrypted)
        .build();
  }

  @Nested
  @DisplayName("createLab")
  class CreateLab {

    @Test
    @DisplayName("should encrypt name and credentials and return response")
    void createLab_shouldEncryptNameAndCredentials() {
      Jwt jwt = mockJwt();
      List<LabCredentialDto> credentials = List.of(
          new LabCredentialDto("username", "myuser"),
          new LabCredentialDto("patientId", "12345"));
      CreateLabRequest request = new CreateLabRequest("CHOPO", "Mi Chopo", credentials);

      when(encryptionService.encryptToBytes("Mi Chopo")).thenReturn(ENCRYPTED_NAME);
      when(encryptionService.encryptToBytes("myuser")).thenReturn(ENCRYPTED_CRED_VALUE);
      when(encryptionService.encryptToBytes("12345")).thenReturn(ENCRYPTED_CRED_VALUE_2);
      when(labRepository.save(any(Lab.class))).thenAnswer(invocation -> {
        Lab saved = invocation.getArgument(0);
        saved.setId(LAB_ID);
        saved.setCreatedAt(OffsetDateTime.now());
        return saved;
      });
      when(labCredentialRepository.saveAll(anyList())).thenAnswer(i -> i.getArgument(0));
      // Decryption stubs for toResponse
      when(encryptionService.decryptFromBytes(ENCRYPTED_NAME)).thenReturn("Mi Chopo");
      when(encryptionService.decryptFromBytes(ENCRYPTED_CRED_VALUE)).thenReturn("myuser");
      when(encryptionService.decryptFromBytes(ENCRYPTED_CRED_VALUE_2)).thenReturn("12345");
      when(labCredentialRepository.findByLabId(LAB_ID)).thenReturn(List.of(
          buildCredential(LAB_ID, "username", ENCRYPTED_CRED_VALUE),
          buildCredential(LAB_ID, "patientId", ENCRYPTED_CRED_VALUE_2)));

      LabResponse result = labService.createLab(jwt, request);

      // Verify Lab was saved with encrypted name
      ArgumentCaptor<Lab> labCaptor = ArgumentCaptor.forClass(Lab.class);
      verify(labRepository).save(labCaptor.capture());
      Lab capturedLab = labCaptor.getValue();
      assertThat(capturedLab.getUserHash()).isEqualTo(USER_HASH);
      assertThat(capturedLab.getProvider()).isEqualTo("CHOPO");
      assertThat(capturedLab.getNameEncrypted()).isEqualTo(ENCRYPTED_NAME);

      // Verify credentials were saved encrypted
      verify(encryptionService).encryptToBytes("myuser");
      verify(encryptionService).encryptToBytes("12345");

      // Verify response is decrypted
      assertThat(result.id()).isEqualTo(LAB_ID);
      assertThat(result.provider()).isEqualTo("CHOPO");
      assertThat(result.name()).isEqualTo("Mi Chopo");
      assertThat(result.credentials()).hasSize(2);
      assertThat(result.credentials().get(0).key()).isEqualTo("username");
      assertThat(result.credentials().get(0).value()).isEqualTo("myuser");
    }

    @Test
    @DisplayName("should handle null credentials list")
    void createLab_shouldHandleNullCredentials() {
      Jwt jwt = mockJwt();
      CreateLabRequest request = new CreateLabRequest("SALUD_DIGNA", "Mi Salud Digna", null);

      when(encryptionService.encryptToBytes("Mi Salud Digna")).thenReturn(ENCRYPTED_NAME);
      when(labRepository.save(any(Lab.class))).thenAnswer(invocation -> {
        Lab saved = invocation.getArgument(0);
        saved.setId(LAB_ID);
        saved.setCreatedAt(OffsetDateTime.now());
        return saved;
      });
      // Decryption stubs for toResponse
      when(encryptionService.decryptFromBytes(ENCRYPTED_NAME)).thenReturn("Mi Salud Digna");
      when(labCredentialRepository.findByLabId(LAB_ID)).thenReturn(Collections.emptyList());

      LabResponse result = labService.createLab(jwt, request);

      assertThat(result.provider()).isEqualTo("SALUD_DIGNA");
      assertThat(result.name()).isEqualTo("Mi Salud Digna");
      assertThat(result.credentials()).isEmpty();
      verify(labCredentialRepository, never()).saveAll(anyList());
    }

    @Test
    @DisplayName("should handle empty credentials list")
    void createLab_shouldHandleEmptyCredentials() {
      Jwt jwt = mockJwt();
      CreateLabRequest request = new CreateLabRequest("OTHER", "Custom Lab", Collections.emptyList());

      when(encryptionService.encryptToBytes("Custom Lab")).thenReturn(ENCRYPTED_NAME);
      when(labRepository.save(any(Lab.class))).thenAnswer(invocation -> {
        Lab saved = invocation.getArgument(0);
        saved.setId(LAB_ID);
        saved.setCreatedAt(OffsetDateTime.now());
        return saved;
      });
      when(encryptionService.decryptFromBytes(ENCRYPTED_NAME)).thenReturn("Custom Lab");
      when(labCredentialRepository.findByLabId(LAB_ID)).thenReturn(Collections.emptyList());

      LabResponse result = labService.createLab(jwt, request);

      assertThat(result.credentials()).isEmpty();
      verify(labCredentialRepository, never()).saveAll(anyList());
    }
  }

  @Nested
  @DisplayName("listLabs")
  class ListLabs {

    @Test
    @DisplayName("should decrypt and return labs with credentials")
    void listLabs_shouldDecryptAndReturnWithCredentials() {
      Jwt jwt = mockJwt();
      Lab lab = buildLab(LAB_ID, USER_HASH);
      LabCredential cred = buildCredential(LAB_ID, "username", ENCRYPTED_CRED_VALUE);

      when(labRepository.findByUserHashOrderByCreatedAtDesc(USER_HASH))
          .thenReturn(List.of(lab));
      when(labCredentialRepository.findByLabId(LAB_ID))
          .thenReturn(List.of(cred));
      when(encryptionService.decryptFromBytes(ENCRYPTED_NAME)).thenReturn("Mi Chopo");
      when(encryptionService.decryptFromBytes(ENCRYPTED_CRED_VALUE)).thenReturn("myuser");

      List<LabResponse> result = labService.listLabs(jwt);

      assertThat(result).hasSize(1);
      LabResponse response = result.getFirst();
      assertThat(response.id()).isEqualTo(LAB_ID);
      assertThat(response.provider()).isEqualTo("CHOPO");
      assertThat(response.name()).isEqualTo("Mi Chopo");
      assertThat(response.credentials()).hasSize(1);
      assertThat(response.credentials().getFirst().key()).isEqualTo("username");
      assertThat(response.credentials().getFirst().value()).isEqualTo("myuser");
      verify(encryptionService).decryptFromBytes(ENCRYPTED_NAME);
      verify(encryptionService).decryptFromBytes(ENCRYPTED_CRED_VALUE);
    }

    @Test
    @DisplayName("should return empty list when no labs")
    void listLabs_shouldReturnEmptyList() {
      Jwt jwt = mockJwt();
      when(labRepository.findByUserHashOrderByCreatedAtDesc(USER_HASH))
          .thenReturn(Collections.emptyList());

      List<LabResponse> result = labService.listLabs(jwt);

      assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("should return lab with no credentials")
    void listLabs_shouldReturnLabWithNoCredentials() {
      Jwt jwt = mockJwt();
      Lab lab = buildLab(LAB_ID, USER_HASH);

      when(labRepository.findByUserHashOrderByCreatedAtDesc(USER_HASH))
          .thenReturn(List.of(lab));
      when(labCredentialRepository.findByLabId(LAB_ID))
          .thenReturn(Collections.emptyList());
      when(encryptionService.decryptFromBytes(ENCRYPTED_NAME)).thenReturn("Mi Chopo");

      List<LabResponse> result = labService.listLabs(jwt);

      assertThat(result).hasSize(1);
      assertThat(result.getFirst().credentials()).isEmpty();
    }
  }

  @Nested
  @DisplayName("updateLab")
  class UpdateLab {

    @Test
    @DisplayName("should update name and replace credentials")
    void updateLab_shouldReplaceCredentials() {
      Jwt jwt = mockJwt();
      Lab existing = buildLab(LAB_ID, USER_HASH);
      when(labRepository.findById(LAB_ID)).thenReturn(Optional.of(existing));

      byte[] newEncryptedName = new byte[]{10, 11, 12};
      byte[] newEncryptedCred = new byte[]{13, 14, 15};
      when(encryptionService.encryptToBytes("Updated Chopo")).thenReturn(newEncryptedName);
      when(encryptionService.encryptToBytes("newuser")).thenReturn(newEncryptedCred);
      when(labRepository.save(any(Lab.class))).thenAnswer(i -> i.getArgument(0));
      when(labCredentialRepository.saveAll(anyList())).thenAnswer(i -> i.getArgument(0));
      // Decryption stubs for toResponse
      when(encryptionService.decryptFromBytes(newEncryptedName)).thenReturn("Updated Chopo");
      when(encryptionService.decryptFromBytes(newEncryptedCred)).thenReturn("newuser");
      when(labCredentialRepository.findByLabId(LAB_ID)).thenReturn(List.of(
          buildCredential(LAB_ID, "username", newEncryptedCred)));

      List<LabCredentialDto> newCreds = List.of(new LabCredentialDto("username", "newuser"));
      UpdateLabRequest request = new UpdateLabRequest("Updated Chopo", newCreds);

      LabResponse result = labService.updateLab(jwt, LAB_ID, request);

      // Verify old credentials deleted
      verify(labCredentialRepository).deleteByLabId(LAB_ID);
      // Verify new credentials saved
      verify(labCredentialRepository).saveAll(anyList());
      // Verify name updated
      assertThat(existing.getNameEncrypted()).isEqualTo(newEncryptedName);
      assertThat(result.name()).isEqualTo("Updated Chopo");
      assertThat(result.credentials()).hasSize(1);
      assertThat(result.credentials().getFirst().value()).isEqualTo("newuser");
    }

    @Test
    @DisplayName("should update only name when credentials is null")
    void updateLab_shouldUpdateOnlyName() {
      Jwt jwt = mockJwt();
      Lab existing = buildLab(LAB_ID, USER_HASH);
      when(labRepository.findById(LAB_ID)).thenReturn(Optional.of(existing));

      byte[] newEncryptedName = new byte[]{10, 11, 12};
      when(encryptionService.encryptToBytes("New Name")).thenReturn(newEncryptedName);
      when(labRepository.save(any(Lab.class))).thenAnswer(i -> i.getArgument(0));
      // Decryption stubs for toResponse
      when(encryptionService.decryptFromBytes(newEncryptedName)).thenReturn("New Name");
      when(labCredentialRepository.findByLabId(LAB_ID)).thenReturn(Collections.emptyList());

      UpdateLabRequest request = new UpdateLabRequest("New Name", null);

      LabResponse result = labService.updateLab(jwt, LAB_ID, request);

      assertThat(result.name()).isEqualTo("New Name");
      verify(labCredentialRepository, never()).deleteByLabId(any());
      verify(labCredentialRepository, never()).saveAll(anyList());
    }

    @Test
    @DisplayName("should skip name update when name is null")
    void updateLab_shouldSkipNameWhenNull() {
      Jwt jwt = mockJwt();
      Lab existing = buildLab(LAB_ID, USER_HASH);
      when(labRepository.findById(LAB_ID)).thenReturn(Optional.of(existing));

      when(labRepository.save(any(Lab.class))).thenAnswer(i -> i.getArgument(0));
      when(encryptionService.decryptFromBytes(ENCRYPTED_NAME)).thenReturn("Mi Chopo");
      when(labCredentialRepository.findByLabId(LAB_ID)).thenReturn(Collections.emptyList());

      UpdateLabRequest request = new UpdateLabRequest(null, null);

      LabResponse result = labService.updateLab(jwt, LAB_ID, request);

      // Original encrypted name should remain
      assertThat(existing.getNameEncrypted()).isEqualTo(ENCRYPTED_NAME);
      assertThat(result.name()).isEqualTo("Mi Chopo");
    }

    @Test
    @DisplayName("should throw ResourceNotFoundException for missing lab")
    void updateLab_shouldThrowNotFound() {
      Jwt jwt = mockJwt();
      when(labRepository.findById(LAB_ID)).thenReturn(Optional.empty());

      UpdateLabRequest request = new UpdateLabRequest("New Name", null);

      assertThatThrownBy(() -> labService.updateLab(jwt, LAB_ID, request))
          .isInstanceOf(ResourceNotFoundException.class)
          .hasMessage("healthLog.error.notFound");

      verify(labRepository, never()).save(any());
    }

    @Test
    @DisplayName("should reject update if not owner")
    void updateLab_shouldRejectIfNotOwner() {
      Jwt jwt = mockJwt();
      Lab existing = buildLab(LAB_ID, "other_user_hash");
      when(labRepository.findById(LAB_ID)).thenReturn(Optional.of(existing));

      UpdateLabRequest request = new UpdateLabRequest("New Name", null);

      assertThatThrownBy(() -> labService.updateLab(jwt, LAB_ID, request))
          .isInstanceOf(IllegalStateException.class)
          .hasMessage("healthLog.error.notOwner");

      verify(labRepository, never()).save(any());
    }
  }

  @Nested
  @DisplayName("deleteLab")
  class DeleteLab {

    @Test
    @DisplayName("should delete owned lab")
    void deleteLab_shouldDeleteOwnedLab() {
      Jwt jwt = mockJwt();
      Lab existing = buildLab(LAB_ID, USER_HASH);
      when(labRepository.findById(LAB_ID)).thenReturn(Optional.of(existing));

      labService.deleteLab(jwt, LAB_ID);

      verify(labRepository).delete(existing);
    }

    @Test
    @DisplayName("should throw ResourceNotFoundException for missing lab")
    void deleteLab_shouldThrowNotFound() {
      Jwt jwt = mockJwt();
      when(labRepository.findById(LAB_ID)).thenReturn(Optional.empty());

      assertThatThrownBy(() -> labService.deleteLab(jwt, LAB_ID))
          .isInstanceOf(ResourceNotFoundException.class)
          .hasMessage("healthLog.error.notFound");

      verify(labRepository, never()).delete(any());
    }

    @Test
    @DisplayName("should reject delete if not owner")
    void deleteLab_shouldRejectIfNotOwner() {
      Jwt jwt = mockJwt();
      Lab existing = buildLab(LAB_ID, "other_user_hash");
      when(labRepository.findById(LAB_ID)).thenReturn(Optional.of(existing));

      assertThatThrownBy(() -> labService.deleteLab(jwt, LAB_ID))
          .isInstanceOf(IllegalStateException.class)
          .hasMessage("healthLog.error.notOwner");

      verify(labRepository, never()).delete(any());
    }
  }
}
