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
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import app.navilla.dto.ReminderResponse;
import app.navilla.dto.ReminderSettingsResponse;
import app.navilla.dto.SnoozeReminderRequest;
import app.navilla.dto.UpdateReminderSettingsRequest;
import app.navilla.entity.Reminder;
import app.navilla.entity.ReminderSettings;
import app.navilla.repository.ReminderRepository;
import app.navilla.repository.ReminderSettingsRepository;
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
 * Unit tests for {@link ReminderService}.
 *
 * @author Navilla Team
 * @since 2026-03-03
 */
@ExtendWith(MockitoExtension.class)
class ReminderServiceTest {

  @Mock
  private ReminderRepository reminderRepository;

  @Mock
  private ReminderSettingsRepository reminderSettingsRepository;

  @Mock
  private EncryptionService encryptionService;

  @InjectMocks
  private ReminderService reminderService;

  private static final String USER_EMAIL = "user@example.com";
  private static final String USER_HASH = "userhash123";
  private static final UUID REMINDER_ID = UUID.randomUUID();
  private static final byte[] ENCRYPTED_TITLE = new byte[]{1, 2, 3};
  private static final byte[] ENCRYPTED_MESSAGE = new byte[]{4, 5, 6};

  private Jwt mockJwt() {
    Jwt jwt = mock(Jwt.class);
    when(jwt.getClaimAsString("email")).thenReturn(USER_EMAIL);
    when(encryptionService.hashEmail(USER_EMAIL)).thenReturn(USER_HASH);
    return jwt;
  }

  private Reminder buildReminder(UUID id, String userHash, boolean active) {
    return Reminder.builder()
        .id(id)
        .userHash(userHash)
        .reminderType("TESTING")
        .referenceId(null)
        .titleEncrypted(ENCRYPTED_TITLE)
        .messageEncrypted(ENCRYPTED_MESSAGE)
        .scheduledFor(OffsetDateTime.of(2026, 3, 10, 9, 0, 0, 0, ZoneOffset.UTC))
        .repeatRule(null)
        .snoozedUntil(null)
        .completedAt(null)
        .active(active)
        .createdAt(OffsetDateTime.now())
        .updatedAt(OffsetDateTime.now())
        .build();
  }

  private void stubDecryption() {
    when(encryptionService.decryptFromBytes(ENCRYPTED_TITLE)).thenReturn("STI Test Reminder");
    when(encryptionService.decryptFromBytes(ENCRYPTED_MESSAGE)).thenReturn("Time to schedule your test");
  }

  @Nested
  @DisplayName("list")
  class ListReminders {

    @Test
    @DisplayName("should return active reminders ordered by scheduledFor ascending")
    void list_shouldReturnActiveRemindersOrderedByScheduledFor() {
      Jwt jwt = mockJwt();

      Reminder r1 = buildReminder(REMINDER_ID, USER_HASH, true);
      Reminder r2 = buildReminder(UUID.randomUUID(), USER_HASH, true);
      r2.setScheduledFor(OffsetDateTime.of(2026, 3, 15, 9, 0, 0, 0, ZoneOffset.UTC));

      when(reminderRepository.findByUserHashAndActiveTrueAndCompletedAtIsNullOrderByScheduledForAsc(USER_HASH))
          .thenReturn(List.of(r1, r2));

      stubDecryption();

      List<ReminderResponse> result = reminderService.list(jwt);

      assertThat(result).hasSize(2);
      assertThat(result.get(0).id()).isEqualTo(r1.getId());
      assertThat(result.get(1).id()).isEqualTo(r2.getId());
      assertThat(result.get(0).active()).isTrue();
    }

    @Test
    @DisplayName("should decrypt title and message in response")
    void list_shouldDecryptTitleAndMessageInResponse() {
      Jwt jwt = mockJwt();

      Reminder reminder = buildReminder(REMINDER_ID, USER_HASH, true);

      when(reminderRepository.findByUserHashAndActiveTrueAndCompletedAtIsNullOrderByScheduledForAsc(USER_HASH))
          .thenReturn(List.of(reminder));

      stubDecryption();

      List<ReminderResponse> result = reminderService.list(jwt);

      verify(encryptionService).decryptFromBytes(ENCRYPTED_TITLE);
      verify(encryptionService).decryptFromBytes(ENCRYPTED_MESSAGE);

      assertThat(result.getFirst().title()).isEqualTo("STI Test Reminder");
      assertThat(result.getFirst().message()).isEqualTo("Time to schedule your test");
    }
  }

  @Nested
  @DisplayName("getUpcoming")
  class GetUpcoming {

    @Test
    @DisplayName("should return reminders due within N days")
    void getUpcoming_shouldReturnRemindersDueWithinDays() {
      Jwt jwt = mockJwt();

      Reminder r1 = buildReminder(REMINDER_ID, USER_HASH, true);

      when(reminderRepository
          .findByUserHashAndActiveTrueAndCompletedAtIsNullAndScheduledForBeforeOrderByScheduledForAsc(
              any(String.class), any(OffsetDateTime.class)))
          .thenReturn(List.of(r1));

      stubDecryption();

      List<ReminderResponse> result = reminderService.getUpcoming(jwt, 7);

      assertThat(result).hasSize(1);
      assertThat(result.getFirst().id()).isEqualTo(REMINDER_ID);
      assertThat(result.getFirst().title()).isEqualTo("STI Test Reminder");
    }
  }

  @Nested
  @DisplayName("snooze")
  class SnoozeReminder {

    @Test
    @DisplayName("should set snoozedUntil and save")
    void snooze_shouldSetSnoozedUntilAndSave() {
      Jwt jwt = mockJwt();

      Reminder reminder = buildReminder(REMINDER_ID, USER_HASH, true);
      when(reminderRepository.findById(REMINDER_ID)).thenReturn(Optional.of(reminder));
      when(reminderRepository.save(any(Reminder.class))).thenAnswer(i -> i.getArgument(0));

      stubDecryption();

      String snoozeUntil = "2026-03-11T09:00:00Z";
      SnoozeReminderRequest request = new SnoozeReminderRequest(snoozeUntil);

      ReminderResponse response = reminderService.snooze(jwt, REMINDER_ID, request);

      ArgumentCaptor<Reminder> captor = ArgumentCaptor.forClass(Reminder.class);
      verify(reminderRepository).save(captor.capture());
      assertThat(captor.getValue().getSnoozedUntil()).isNotNull();
      assertThat(response.snoozedUntil()).isNotNull();
    }

    @Test
    @DisplayName("should throw for reminder not owned by user")
    void snooze_shouldThrowForNotOwner() {
      Jwt jwt = mockJwt();

      Reminder otherReminder = buildReminder(REMINDER_ID, "other_hash", true);
      when(reminderRepository.findById(REMINDER_ID)).thenReturn(Optional.of(otherReminder));

      SnoozeReminderRequest request = new SnoozeReminderRequest("2026-03-11T09:00:00Z");

      assertThatThrownBy(() -> reminderService.snooze(jwt, REMINDER_ID, request))
          .isInstanceOf(IllegalStateException.class)
          .hasMessage("reminder.error.notOwner");
    }
  }

  @Nested
  @DisplayName("complete")
  class CompleteReminder {

    @Test
    @DisplayName("should set completedAt to now")
    void complete_shouldSetCompletedAtToNow() {
      Jwt jwt = mockJwt();

      Reminder reminder = buildReminder(REMINDER_ID, USER_HASH, true);
      when(reminderRepository.findById(REMINDER_ID)).thenReturn(Optional.of(reminder));
      when(reminderRepository.save(any(Reminder.class))).thenAnswer(i -> i.getArgument(0));

      stubDecryption();

      ReminderResponse response = reminderService.complete(jwt, REMINDER_ID);

      ArgumentCaptor<Reminder> captor = ArgumentCaptor.forClass(Reminder.class);
      verify(reminderRepository).save(captor.capture());
      assertThat(captor.getValue().getCompletedAt()).isNotNull();
      assertThat(response.completedAt()).isNotNull();
    }
  }

  @Nested
  @DisplayName("toggle")
  class ToggleReminder {

    @Test
    @DisplayName("should flip active flag")
    void toggle_shouldFlipActiveFlag() {
      Jwt jwt = mockJwt();

      Reminder reminder = buildReminder(REMINDER_ID, USER_HASH, true);
      when(reminderRepository.findById(REMINDER_ID)).thenReturn(Optional.of(reminder));
      when(reminderRepository.save(any(Reminder.class))).thenAnswer(i -> i.getArgument(0));

      stubDecryption();

      ReminderResponse response = reminderService.toggle(jwt, REMINDER_ID);

      ArgumentCaptor<Reminder> captor = ArgumentCaptor.forClass(Reminder.class);
      verify(reminderRepository).save(captor.capture());
      assertThat(captor.getValue().getActive()).isFalse();
      assertThat(response.active()).isFalse();
    }
  }

  @Nested
  @DisplayName("delete")
  class DeleteReminder {

    @Test
    @DisplayName("should delete reminder")
    void delete_shouldDeleteReminder() {
      Jwt jwt = mockJwt();

      Reminder reminder = buildReminder(REMINDER_ID, USER_HASH, true);
      when(reminderRepository.findById(REMINDER_ID)).thenReturn(Optional.of(reminder));

      reminderService.delete(jwt, REMINDER_ID);

      verify(reminderRepository).delete(reminder);
    }

    @Test
    @DisplayName("should throw for reminder not owned by user")
    void delete_shouldThrowForNotOwner() {
      Jwt jwt = mockJwt();

      Reminder otherReminder = buildReminder(REMINDER_ID, "other_hash", true);
      when(reminderRepository.findById(REMINDER_ID)).thenReturn(Optional.of(otherReminder));

      assertThatThrownBy(() -> reminderService.delete(jwt, REMINDER_ID))
          .isInstanceOf(IllegalStateException.class)
          .hasMessage("reminder.error.notOwner");
    }
  }

  @Nested
  @DisplayName("getSettings")
  class GetSettings {

    @Test
    @DisplayName("should return settings or create default if none exist")
    void getSettings_shouldReturnSettingsOrCreateDefault() {
      Jwt jwt = mockJwt();

      // No existing settings
      when(reminderSettingsRepository.findByUserHash(USER_HASH)).thenReturn(Optional.empty());

      when(reminderSettingsRepository.save(any(ReminderSettings.class))).thenAnswer(invocation -> {
        ReminderSettings saved = invocation.getArgument(0);
        saved.setId(UUID.randomUUID());
        return saved;
      });

      ReminderSettingsResponse response = reminderService.getSettings(jwt);

      // Verify a default was created and saved
      ArgumentCaptor<ReminderSettings> captor = ArgumentCaptor.forClass(ReminderSettings.class);
      verify(reminderSettingsRepository).save(captor.capture());
      ReminderSettings created = captor.getValue();
      assertThat(created.getUserHash()).isEqualTo(USER_HASH);
      assertThat(created.getTestingRemindersEnabled()).isTrue();
      assertThat(created.getMedicationRemindersEnabled()).isTrue();
      assertThat(created.getVaccinationRemindersEnabled()).isTrue();
      assertThat(created.getEmailDigestEnabled()).isFalse();

      // Verify response defaults
      assertThat(response.testingRemindersEnabled()).isTrue();
      assertThat(response.medicationRemindersEnabled()).isTrue();
      assertThat(response.vaccinationRemindersEnabled()).isTrue();
      assertThat(response.emailDigestEnabled()).isFalse();
    }
  }

  @Nested
  @DisplayName("updateSettings")
  class UpdateSettings {

    @Test
    @DisplayName("should upsert settings applying non-null fields")
    void updateSettings_shouldUpsertAndApplyNonNullFields() {
      Jwt jwt = mockJwt();

      // Existing settings
      ReminderSettings existing = ReminderSettings.builder()
          .id(UUID.randomUUID())
          .userHash(USER_HASH)
          .quietHoursStart(null)
          .quietHoursEnd(null)
          .emailDigestEnabled(false)
          .emailDigestDay(null)
          .testingRemindersEnabled(true)
          .medicationRemindersEnabled(true)
          .vaccinationRemindersEnabled(true)
          .build();

      when(reminderSettingsRepository.findByUserHash(USER_HASH)).thenReturn(Optional.of(existing));
      when(reminderSettingsRepository.save(any(ReminderSettings.class))).thenAnswer(i -> i.getArgument(0));

      UpdateReminderSettingsRequest request = new UpdateReminderSettingsRequest(
          "22:00", "08:00", true, "MONDAY", null, false, null);

      ReminderSettingsResponse response = reminderService.updateSettings(jwt, request);

      // Verify fields were applied
      ArgumentCaptor<ReminderSettings> captor = ArgumentCaptor.forClass(ReminderSettings.class);
      verify(reminderSettingsRepository).save(captor.capture());
      ReminderSettings saved = captor.getValue();
      assertThat(saved.getQuietHoursStart()).isEqualTo(LocalTime.of(22, 0));
      assertThat(saved.getQuietHoursEnd()).isEqualTo(LocalTime.of(8, 0));
      assertThat(saved.getEmailDigestEnabled()).isTrue();
      assertThat(saved.getEmailDigestDay()).isEqualTo("MONDAY");
      // Null fields should NOT overwrite existing
      assertThat(saved.getTestingRemindersEnabled()).isTrue();
      assertThat(saved.getMedicationRemindersEnabled()).isFalse();
      assertThat(saved.getVaccinationRemindersEnabled()).isTrue();

      // Verify response
      assertThat(response.quietHoursStart()).isEqualTo("22:00");
      assertThat(response.quietHoursEnd()).isEqualTo("08:00");
      assertThat(response.emailDigestEnabled()).isTrue();
      assertThat(response.emailDigestDay()).isEqualTo("MONDAY");
      assertThat(response.medicationRemindersEnabled()).isFalse();
    }
  }
}
