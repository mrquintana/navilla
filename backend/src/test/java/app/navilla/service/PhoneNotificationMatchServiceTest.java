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
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import app.navilla.entity.Connection;
import app.navilla.entity.ConnectionPhoneEntry;
import app.navilla.entity.ConnectionType;
import app.navilla.entity.PhoneBlock;
import app.navilla.entity.PhoneReport;
import app.navilla.exception.ConnectionConflictException;
import app.navilla.exception.ResourceNotFoundException;
import app.navilla.repository.ConnectionPhoneEntryRepository;
import app.navilla.repository.ConnectionRepository;
import app.navilla.repository.PhoneBlockRepository;
import app.navilla.repository.PhoneReportRepository;
import app.navilla.repository.UserRepository;
import app.navilla.security.EncryptionService;
import org.junit.jupiter.api.BeforeEach;
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
 * Unit tests for {@link PhoneNotificationMatchService}.
 *
 * @author Navilla Team
 * @since 2026-03-04
 */
@ExtendWith(MockitoExtension.class)
class PhoneNotificationMatchServiceTest {

  @Mock
  private UserRepository userRepository;

  @Mock
  private ConnectionPhoneEntryRepository phoneEntryRepository;

  @Mock
  private PhoneBlockRepository phoneBlockRepository;

  @Mock
  private PhoneReportRepository phoneReportRepository;

  @Mock
  private ConnectionRepository connectionRepository;

  @Mock
  private EncryptionService encryptionService;

  @InjectMocks
  private PhoneNotificationMatchService service;

  private Jwt jwt;

  private static final String USER_EMAIL = "confirm@example.com";
  private static final String USER_HASH = "confirmer-hash";
  private static final String OTHER_USER_HASH = "other-user-hash";
  private static final String PHONE_HASH = "phone-hash-123";

  @BeforeEach
  void setUp() {
    jwt = Jwt.withTokenValue("test-token")
        .header("alg", "RS256")
        .subject("test-subject")
        .claim("email", USER_EMAIL)
        .build();
  }

  private ConnectionPhoneEntry buildEntry() {
    return ConnectionPhoneEntry.builder()
        .id(UUID.randomUUID())
        .userHash(OTHER_USER_HASH)
        .phoneHash(PHONE_HASH)
        .encounterDate(LocalDate.of(2026, 3, 1))
        .matched(false)
        .build();
  }

  @Nested
  @DisplayName("confirmMatch")
  class ConfirmMatch {

    @Test
    @DisplayName("creates connection with CONFIRMED status")
    void confirmMatch_createsConnection() {
      ConnectionPhoneEntry entry = buildEntry();
      when(encryptionService.hashEmail(USER_EMAIL)).thenReturn(USER_HASH);
      when(phoneEntryRepository.findById(entry.getId())).thenReturn(Optional.of(entry));
      when(connectionRepository.existsBetweenUsers(USER_HASH, OTHER_USER_HASH)).thenReturn(false);

      Connection result = service.confirmMatch(jwt, entry.getId());

      ArgumentCaptor<Connection> captor = ArgumentCaptor.forClass(Connection.class);
      verify(connectionRepository).save(captor.capture());
      Connection saved = captor.getValue();
      assertThat(saved.getRequesterHash()).isEqualTo(OTHER_USER_HASH);
      assertThat(saved.getRecipientHash()).isEqualTo(USER_HASH);
      assertThat(saved.getStatus().name()).isEqualTo("CONFIRMED");
      assertThat(saved.getConnectionType()).isEqualTo(ConnectionType.NOTIFICATION_MATCH);
      assertThat(saved.getConfirmedAt()).isNotNull();

      // Entry should be marked as matched
      assertThat(entry.getMatched()).isTrue();
      verify(phoneEntryRepository).save(entry);
    }

    @Test
    @DisplayName("already connected throws ConnectionConflictException")
    void confirmMatch_alreadyConnected_throwsConflict() {
      ConnectionPhoneEntry entry = buildEntry();
      when(encryptionService.hashEmail(USER_EMAIL)).thenReturn(USER_HASH);
      when(phoneEntryRepository.findById(entry.getId())).thenReturn(Optional.of(entry));
      when(connectionRepository.existsBetweenUsers(USER_HASH, OTHER_USER_HASH)).thenReturn(true);

      assertThatThrownBy(() -> service.confirmMatch(jwt, entry.getId()))
          .isInstanceOf(ConnectionConflictException.class);

      verify(connectionRepository, never()).save(any());
    }

    @Test
    @DisplayName("entry not found throws ResourceNotFoundException")
    void confirmMatch_notFound_throwsException() {
      UUID missingId = UUID.randomUUID();
      when(encryptionService.hashEmail(USER_EMAIL)).thenReturn(USER_HASH);
      when(phoneEntryRepository.findById(missingId)).thenReturn(Optional.empty());

      assertThatThrownBy(() -> service.confirmMatch(jwt, missingId))
          .isInstanceOf(ResourceNotFoundException.class);
    }
  }

  @Nested
  @DisplayName("denyMatch")
  class DenyMatch {

    @Test
    @DisplayName("marks entry as processed")
    void denyMatch_marksEntryAsProcessed() {
      ConnectionPhoneEntry entry = buildEntry();
      when(encryptionService.hashEmail(USER_EMAIL)).thenReturn(USER_HASH);
      when(phoneEntryRepository.findById(entry.getId())).thenReturn(Optional.of(entry));

      service.denyMatch(jwt, entry.getId());

      assertThat(entry.getMatched()).isTrue();
      verify(phoneEntryRepository).save(entry);
    }
  }

  @Nested
  @DisplayName("blockPhone")
  class BlockPhone {

    @Test
    @DisplayName("creates block entry")
    void blockPhone_createsBlockEntry() {
      when(encryptionService.hashEmail(USER_EMAIL)).thenReturn(USER_HASH);
      when(phoneBlockRepository.existsByUserHashAndBlockedPhoneHash(USER_HASH, PHONE_HASH))
          .thenReturn(false);

      service.blockPhone(jwt, PHONE_HASH);

      ArgumentCaptor<PhoneBlock> captor = ArgumentCaptor.forClass(PhoneBlock.class);
      verify(phoneBlockRepository).save(captor.capture());
      PhoneBlock saved = captor.getValue();
      assertThat(saved.getUserHash()).isEqualTo(USER_HASH);
      assertThat(saved.getBlockedPhoneHash()).isEqualTo(PHONE_HASH);
    }

    @Test
    @DisplayName("already blocked does not create duplicate")
    void blockPhone_alreadyBlocked_noDuplicate() {
      when(encryptionService.hashEmail(USER_EMAIL)).thenReturn(USER_HASH);
      when(phoneBlockRepository.existsByUserHashAndBlockedPhoneHash(USER_HASH, PHONE_HASH))
          .thenReturn(true);

      service.blockPhone(jwt, PHONE_HASH);

      verify(phoneBlockRepository, never()).save(any());
    }
  }

  @Nested
  @DisplayName("reportPhone")
  class ReportPhone {

    @Test
    @DisplayName("creates report and auto-blocks")
    void reportPhone_createsReportAndBlock() {
      when(encryptionService.hashEmail(USER_EMAIL)).thenReturn(USER_HASH);
      when(phoneBlockRepository.existsByUserHashAndBlockedPhoneHash(USER_HASH, PHONE_HASH))
          .thenReturn(false);

      service.reportPhone(jwt, PHONE_HASH, "Spam");

      ArgumentCaptor<PhoneReport> reportCaptor = ArgumentCaptor.forClass(PhoneReport.class);
      verify(phoneReportRepository).save(reportCaptor.capture());
      PhoneReport savedReport = reportCaptor.getValue();
      assertThat(savedReport.getReporterHash()).isEqualTo(USER_HASH);
      assertThat(savedReport.getReportedPhoneHash()).isEqualTo(PHONE_HASH);
      assertThat(savedReport.getReason()).isEqualTo("Spam");

      ArgumentCaptor<PhoneBlock> blockCaptor = ArgumentCaptor.forClass(PhoneBlock.class);
      verify(phoneBlockRepository).save(blockCaptor.capture());
      assertThat(blockCaptor.getValue().getBlockedPhoneHash()).isEqualTo(PHONE_HASH);
    }
  }
}
