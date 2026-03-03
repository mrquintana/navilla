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
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import app.navilla.entity.NotificationType;
import app.navilla.entity.Reminder;
import app.navilla.entity.ReminderSettings;
import app.navilla.repository.ReminderRepository;
import app.navilla.repository.ReminderSettingsRepository;
import app.navilla.security.EncryptionService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * Unit tests for {@link ReminderSchedulerJob}.
 *
 * @author Navilla Team
 * @since 2026-03-03
 */
@ExtendWith(MockitoExtension.class)
class ReminderSchedulerJobTest {

  @Mock
  private ReminderRepository reminderRepository;

  @Mock
  private ReminderSettingsRepository reminderSettingsRepository;

  @Mock
  private NotificationService notificationService;

  @Mock
  private EncryptionService encryptionService;

  @InjectMocks
  private ReminderSchedulerJob schedulerJob;

  private static final String USER_HASH = "userhash123";
  private static final byte[] ENCRYPTED_TITLE = new byte[]{1, 2, 3};

  private Reminder buildReminder(String reminderType, String repeatRule,
                                  OffsetDateTime scheduledFor) {
    return Reminder.builder()
        .id(UUID.randomUUID())
        .userHash(USER_HASH)
        .reminderType(reminderType)
        .titleEncrypted(ENCRYPTED_TITLE)
        .scheduledFor(scheduledFor)
        .repeatRule(repeatRule)
        .active(true)
        .build();
  }

  @Test
  @DisplayName("should find due reminders and create notifications for each")
  void processReminders_shouldCreateNotificationsForDueReminders() {
    OffsetDateTime past = OffsetDateTime.now().minusHours(1);
    Reminder medicationReminder = buildReminder("MEDICATION", null, past);
    Reminder testingReminder = buildReminder("TESTING", null, past);

    when(reminderRepository.findByActiveTrueAndCompletedAtIsNullAndScheduledForBefore(
        any(OffsetDateTime.class)))
        .thenReturn(List.of(medicationReminder, testingReminder));

    when(reminderSettingsRepository.findByUserHash(USER_HASH))
        .thenReturn(Optional.empty());

    schedulerJob.processReminders();

    // Both reminders should generate notifications
    verify(notificationService).createReminderNotification(
        eq(USER_HASH), eq(NotificationType.MEDICATION_REMINDER),
        eq("notifications.medicationReminder"), eq(medicationReminder.getId()));
    verify(notificationService).createReminderNotification(
        eq(USER_HASH), eq(NotificationType.TESTING_REMINDER),
        eq("notifications.testingReminder"), eq(testingReminder.getId()));

    // One-time reminders should be marked completed
    assertThat(medicationReminder.getCompletedAt()).isNotNull();
    assertThat(testingReminder.getCompletedAt()).isNotNull();
  }

  @Test
  @DisplayName("should skip reminders in user quiet hours")
  void processReminders_shouldSkipRemindersInQuietHours() {
    // Set up a reminder due at 2 AM
    OffsetDateTime twoAm = OffsetDateTime.of(2026, 3, 3, 2, 0, 0, 0, ZoneOffset.UTC);
    Reminder reminder = buildReminder("MEDICATION", null, twoAm);

    when(reminderRepository.findByActiveTrueAndCompletedAtIsNullAndScheduledForBefore(
        any(OffsetDateTime.class)))
        .thenReturn(List.of(reminder));

    // Quiet hours: 10 PM to 7 AM (wraps midnight)
    ReminderSettings settings = ReminderSettings.builder()
        .userHash(USER_HASH)
        .quietHoursStart(LocalTime.of(22, 0))
        .quietHoursEnd(LocalTime.of(7, 0))
        .medicationRemindersEnabled(true)
        .testingRemindersEnabled(true)
        .vaccinationRemindersEnabled(true)
        .build();

    when(reminderSettingsRepository.findByUserHash(USER_HASH))
        .thenReturn(Optional.of(settings));

    schedulerJob.processRemindersAt(twoAm);

    // No notification should be created during quiet hours
    verify(notificationService, never()).createReminderNotification(
        any(), any(), any(), any());

    // Reminder should NOT be completed (it was skipped, not processed)
    assertThat(reminder.getCompletedAt()).isNull();
  }

  @Test
  @DisplayName("should advance repeating reminders to next occurrence after firing")
  void processReminders_shouldAdvanceRepeatingReminders() {
    OffsetDateTime past = OffsetDateTime.now().minusHours(1);
    Reminder dailyReminder = buildReminder("MEDICATION", "DAILY", past);

    when(reminderRepository.findByActiveTrueAndCompletedAtIsNullAndScheduledForBefore(
        any(OffsetDateTime.class)))
        .thenReturn(List.of(dailyReminder));

    when(reminderSettingsRepository.findByUserHash(USER_HASH))
        .thenReturn(Optional.empty());

    schedulerJob.processReminders();

    // Notification should be created
    verify(notificationService).createReminderNotification(
        eq(USER_HASH), eq(NotificationType.MEDICATION_REMINDER),
        eq("notifications.medicationReminder"), eq(dailyReminder.getId()));

    // Repeating reminder should NOT be completed but should be advanced
    assertThat(dailyReminder.getCompletedAt()).isNull();
    assertThat(dailyReminder.getScheduledFor()).isAfter(past);
    // Should be advanced by 1 day
    assertThat(dailyReminder.getScheduledFor()).isEqualToIgnoringSeconds(past.plusDays(1));
    // Snooze should be cleared after advancing
    assertThat(dailyReminder.getSnoozedUntil()).isNull();
  }

  @Test
  @DisplayName("should skip snoozed reminders where snoozedUntil is in the future")
  void processReminders_shouldSkipSnoozedReminders() {
    OffsetDateTime past = OffsetDateTime.now().minusHours(1);
    Reminder snoozedReminder = buildReminder("TESTING", null, past);
    snoozedReminder.setSnoozedUntil(OffsetDateTime.now().plusHours(2));

    when(reminderRepository.findByActiveTrueAndCompletedAtIsNullAndScheduledForBefore(
        any(OffsetDateTime.class)))
        .thenReturn(List.of(snoozedReminder));

    schedulerJob.processReminders();

    // No notification should be created for snoozed reminder
    verify(notificationService, never()).createReminderNotification(
        any(), any(), any(), any());

    // Reminder should not be completed
    assertThat(snoozedReminder.getCompletedAt()).isNull();
  }

  @Test
  @DisplayName("should not create notification when reminder type is disabled in settings")
  void processReminders_shouldSkipDisabledReminderTypes() {
    OffsetDateTime past = OffsetDateTime.now().minusHours(1);
    Reminder medicationReminder = buildReminder("MEDICATION", null, past);

    when(reminderRepository.findByActiveTrueAndCompletedAtIsNullAndScheduledForBefore(
        any(OffsetDateTime.class)))
        .thenReturn(List.of(medicationReminder));

    // Medication reminders are disabled
    ReminderSettings settings = ReminderSettings.builder()
        .userHash(USER_HASH)
        .medicationRemindersEnabled(false)
        .testingRemindersEnabled(true)
        .vaccinationRemindersEnabled(true)
        .build();

    when(reminderSettingsRepository.findByUserHash(USER_HASH))
        .thenReturn(Optional.of(settings));

    schedulerJob.processReminders();

    // No notification should be created
    verify(notificationService, never()).createReminderNotification(
        any(), any(), any(), any());
  }
}
