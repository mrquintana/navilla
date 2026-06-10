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
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import app.navilla.entity.Connection;
import app.navilla.entity.ConnectionPhoneEntry;
import app.navilla.entity.ConnectionType;
import app.navilla.exception.RateLimitException;
import app.navilla.repository.ConnectionPhoneEntryRepository;
import app.navilla.repository.ConnectionRepository;
import app.navilla.repository.PhoneBlockRepository;
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

/**
 * Unit tests for {@link PhoneMatchService}.
 *
 * @author Navilla Team
 * @since 2026-03-04
 */
@ExtendWith(MockitoExtension.class)
class PhoneMatchServiceTest {

  @Mock
  private ConnectionPhoneEntryRepository phoneEntryRepository;

  @Mock
  private PhoneBlockRepository phoneBlockRepository;

  @Mock
  private ConnectionRepository connectionRepository;

  @Mock
  private AppConfigService appConfigService;

  @Mock
  private EncryptionService encryptionService;

  @InjectMocks
  private PhoneMatchService phoneMatchService;

  private static final String USER_A_HASH = "user-a-hash";
  private static final String USER_B_HASH = "user-b-hash";
  private static final String RAW_PHONE = "+52 55 1234-5678";
  private static final String PHONE_HASH = "hashed-phone-number";
  private static final LocalDate ENCOUNTER_DATE = LocalDate.of(2026, 3, 1);

  @BeforeEach
  void setUp() {
    // Default: phone hashing returns deterministic value
  }

  private void stubDefaultConfig() {
    when(appConfigService.getInt("phone_match.max_attempts_per_week", 5)).thenReturn(5);
    when(appConfigService.getInt("phone_match.window_days", 2)).thenReturn(2);
  }

  @Nested
  @DisplayName("registerPhoneEntry")
  class RegisterPhoneEntry {

    @Test
    @DisplayName("creates entry successfully")
    void registerPhoneEntry_createsEntry() {
      stubDefaultConfig();
      when(phoneEntryRepository.countEntriesThisWeek(eq(USER_A_HASH), any(OffsetDateTime.class)))
          .thenReturn(0L);
      when(encryptionService.hashPhone(RAW_PHONE, null)).thenReturn(PHONE_HASH);
      when(phoneEntryRepository.findByPhoneHashAndMatchedFalseAndUserHashNot(PHONE_HASH, USER_A_HASH))
          .thenReturn(List.of());

      phoneMatchService.registerPhoneEntry(USER_A_HASH, RAW_PHONE, null, ENCOUNTER_DATE, null);

      ArgumentCaptor<ConnectionPhoneEntry> captor =
          ArgumentCaptor.forClass(ConnectionPhoneEntry.class);
      verify(phoneEntryRepository).save(captor.capture());
      ConnectionPhoneEntry saved = captor.getValue();
      assertThat(saved.getUserHash()).isEqualTo(USER_A_HASH);
      assertThat(saved.getPhoneHash()).isEqualTo(PHONE_HASH);
      assertThat(saved.getEncounterDate()).isEqualTo(ENCOUNTER_DATE);
      assertThat(saved.getMatched()).isFalse();
    }

    @Test
    @DisplayName("rate limit exceeded throws exception")
    void registerPhoneEntry_rateLimitExceeded_throwsException() {
      when(appConfigService.getInt("phone_match.max_attempts_per_week", 5)).thenReturn(5);
      when(phoneEntryRepository.countEntriesThisWeek(eq(USER_A_HASH), any(OffsetDateTime.class)))
          .thenReturn(5L);

      assertThatThrownBy(() ->
          phoneMatchService.registerPhoneEntry(USER_A_HASH, RAW_PHONE, null, ENCOUNTER_DATE, null))
          .isInstanceOf(RateLimitException.class)
          .hasMessage("phoneMatch.rateLimitExceeded");

      verify(phoneEntryRepository, never()).save(any());
    }

    @Test
    @DisplayName("stores journal entry ID when provided")
    void registerPhoneEntry_withJournalEntryId() {
      stubDefaultConfig();
      UUID journalId = UUID.randomUUID();
      when(phoneEntryRepository.countEntriesThisWeek(eq(USER_A_HASH), any(OffsetDateTime.class)))
          .thenReturn(0L);
      when(encryptionService.hashPhone(RAW_PHONE, null)).thenReturn(PHONE_HASH);
      when(phoneEntryRepository.findByPhoneHashAndMatchedFalseAndUserHashNot(PHONE_HASH, USER_A_HASH))
          .thenReturn(List.of());

      phoneMatchService.registerPhoneEntry(USER_A_HASH, RAW_PHONE, null, ENCOUNTER_DATE, journalId);

      ArgumentCaptor<ConnectionPhoneEntry> captor =
          ArgumentCaptor.forClass(ConnectionPhoneEntry.class);
      verify(phoneEntryRepository).save(captor.capture());
      assertThat(captor.getValue().getJournalEntryId()).isEqualTo(journalId);
    }
  }

  @Nested
  @DisplayName("checkAndCreateMutualMatch")
  class CheckMutualMatch {

    @Test
    @DisplayName("both logged each other within window - creates connection")
    void mutualMatch_withinWindow_createsConnection() {
      when(appConfigService.getInt("phone_match.window_days", 2)).thenReturn(2);

      ConnectionPhoneEntry otherEntry = ConnectionPhoneEntry.builder()
          .id(UUID.randomUUID())
          .userHash(USER_B_HASH)
          .phoneHash(PHONE_HASH)
          .encounterDate(ENCOUNTER_DATE.plusDays(1))
          .matched(false)
          .build();

      when(phoneEntryRepository.findByPhoneHashAndMatchedFalseAndUserHashNot(PHONE_HASH, USER_A_HASH))
          .thenReturn(List.of(otherEntry));
      when(phoneBlockRepository.existsByUserHashAndBlockedPhoneHash(anyString(), anyString()))
          .thenReturn(false);
      when(connectionRepository.existsBetweenUsers(USER_A_HASH, USER_B_HASH))
          .thenReturn(false);
      when(phoneEntryRepository.findByUserHashAndPhoneHashAndMatchedFalse(USER_A_HASH, PHONE_HASH))
          .thenReturn(List.of());

      phoneMatchService.checkAndCreateMutualMatch(USER_A_HASH, PHONE_HASH, ENCOUNTER_DATE);

      ArgumentCaptor<Connection> connCaptor = ArgumentCaptor.forClass(Connection.class);
      verify(connectionRepository).save(connCaptor.capture());
      Connection created = connCaptor.getValue();
      assertThat(created.getRequesterHash()).isEqualTo(USER_A_HASH);
      assertThat(created.getRecipientHash()).isEqualTo(USER_B_HASH);
      assertThat(created.getStatus().name()).isEqualTo("CONFIRMED");
      assertThat(created.getConnectionType()).isEqualTo(ConnectionType.PHONE_MATCH);
      assertThat(created.getConfirmedAt()).isNotNull();

      // Other entry should be marked as matched
      assertThat(otherEntry.getMatched()).isTrue();
    }

    @Test
    @DisplayName("one-sided - no connection created")
    void oneSided_noConnection() {
      when(appConfigService.getInt("phone_match.window_days", 2)).thenReturn(2);
      when(phoneEntryRepository.findByPhoneHashAndMatchedFalseAndUserHashNot(PHONE_HASH, USER_A_HASH))
          .thenReturn(List.of());

      phoneMatchService.checkAndCreateMutualMatch(USER_A_HASH, PHONE_HASH, ENCOUNTER_DATE);

      verify(connectionRepository, never()).save(any());
    }

    @Test
    @DisplayName("dates outside window - no connection")
    void datesOutsideWindow_noConnection() {
      when(appConfigService.getInt("phone_match.window_days", 2)).thenReturn(2);

      ConnectionPhoneEntry otherEntry = ConnectionPhoneEntry.builder()
          .id(UUID.randomUUID())
          .userHash(USER_B_HASH)
          .phoneHash(PHONE_HASH)
          .encounterDate(ENCOUNTER_DATE.plusDays(5)) // 5 days apart > 2 day window
          .matched(false)
          .build();

      when(phoneEntryRepository.findByPhoneHashAndMatchedFalseAndUserHashNot(PHONE_HASH, USER_A_HASH))
          .thenReturn(List.of(otherEntry));

      phoneMatchService.checkAndCreateMutualMatch(USER_A_HASH, PHONE_HASH, ENCOUNTER_DATE);

      verify(connectionRepository, never()).save(any());
    }

    @Test
    @DisplayName("phone blocked - no connection")
    void phoneBlocked_noConnection() {
      when(appConfigService.getInt("phone_match.window_days", 2)).thenReturn(2);

      ConnectionPhoneEntry otherEntry = ConnectionPhoneEntry.builder()
          .id(UUID.randomUUID())
          .userHash(USER_B_HASH)
          .phoneHash(PHONE_HASH)
          .encounterDate(ENCOUNTER_DATE)
          .matched(false)
          .build();

      when(phoneEntryRepository.findByPhoneHashAndMatchedFalseAndUserHashNot(PHONE_HASH, USER_A_HASH))
          .thenReturn(List.of(otherEntry));
      when(phoneBlockRepository.existsByUserHashAndBlockedPhoneHash(USER_A_HASH, PHONE_HASH))
          .thenReturn(true);

      phoneMatchService.checkAndCreateMutualMatch(USER_A_HASH, PHONE_HASH, ENCOUNTER_DATE);

      verify(connectionRepository, never()).save(any());
    }

    @Test
    @DisplayName("already connected - no duplicate connection")
    void alreadyConnected_noDuplicate() {
      when(appConfigService.getInt("phone_match.window_days", 2)).thenReturn(2);

      ConnectionPhoneEntry otherEntry = ConnectionPhoneEntry.builder()
          .id(UUID.randomUUID())
          .userHash(USER_B_HASH)
          .phoneHash(PHONE_HASH)
          .encounterDate(ENCOUNTER_DATE)
          .matched(false)
          .build();

      when(phoneEntryRepository.findByPhoneHashAndMatchedFalseAndUserHashNot(PHONE_HASH, USER_A_HASH))
          .thenReturn(List.of(otherEntry));
      when(phoneBlockRepository.existsByUserHashAndBlockedPhoneHash(anyString(), anyString()))
          .thenReturn(false);
      when(connectionRepository.existsBetweenUsers(USER_A_HASH, USER_B_HASH))
          .thenReturn(true);

      phoneMatchService.checkAndCreateMutualMatch(USER_A_HASH, PHONE_HASH, ENCOUNTER_DATE);

      verify(connectionRepository, never()).save(any());
    }
  }
}
