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

import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.util.List;

import app.navilla.entity.NotificationType;
import app.navilla.entity.Reminder;
import app.navilla.entity.ReminderSettings;
import app.navilla.repository.ReminderRepository;
import app.navilla.repository.ReminderSettingsRepository;
import app.navilla.security.EncryptionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Scheduled job that processes due reminders and creates notifications.
 *
 * <p>Runs daily at 6 AM server time. For each due reminder:
 * <ol>
 *   <li>Skips if snoozed (snoozedUntil is in the future)</li>
 *   <li>Skips if currently in the user's quiet hours</li>
 *   <li>Skips if the reminder type is disabled in user settings</li>
 *   <li>Creates a notification via {@link NotificationService}</li>
 *   <li>For repeating reminders, advances to the next occurrence</li>
 *   <li>For one-time reminders, marks as completed</li>
 * </ol>
 *
 * @author Navilla Team
 * @since 2026-03-03
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ReminderSchedulerJob {

  private final ReminderRepository reminderRepository;
  private final ReminderSettingsRepository reminderSettingsRepository;
  private final NotificationService notificationService;
  private final EncryptionService encryptionService;

  /**
   * Processes all due reminders. Runs daily at 6 AM server time.
   */
  @Scheduled(cron = "0 0 6 * * *")
  @Transactional
  public void processReminders() {
    processRemindersAt(OffsetDateTime.now());
  }

  /**
   * Processes due reminders using the given timestamp as "now".
   * Extracted for testability.
   *
   * @param now the current time to use for processing
   */
  @Transactional
  public void processRemindersAt(OffsetDateTime now) {
    log.info("Starting daily reminder processing");

    List<Reminder> dueReminders = reminderRepository
        .findByActiveTrueAndCompletedAtIsNullAndScheduledForBefore(now);

    log.info("Found {} due reminders", dueReminders.size());

    for (Reminder reminder : dueReminders) {
      try {
        processReminder(reminder, now);
      } catch (Exception e) {
        log.error("Failed to process reminder {}: {}", reminder.getId(), e.getMessage());
      }
    }
  }

  private void processReminder(Reminder reminder, OffsetDateTime now) {
    // 1. Check if snoozed (snoozedUntil > now) -> skip
    if (reminder.getSnoozedUntil() != null && reminder.getSnoozedUntil().isAfter(now)) {
      log.debug("Skipping snoozed reminder {}", reminder.getId());
      return;
    }

    // 2. Check quiet hours for this user
    ReminderSettings settings = reminderSettingsRepository
        .findByUserHash(reminder.getUserHash())
        .orElse(null);

    if (settings != null && isInQuietHours(settings, now)) {
      log.debug("Skipping reminder {} during quiet hours for user", reminder.getId());
      return;
    }

    // 3. Check if reminder type is enabled in settings
    if (settings != null && !isReminderTypeEnabled(settings, reminder.getReminderType())) {
      log.debug("Skipping reminder {} because type {} is disabled",
          reminder.getId(), reminder.getReminderType());
      return;
    }

    // 4. Create notification
    createNotificationForReminder(reminder);

    // 5. Handle repeat vs one-time
    if (reminder.getRepeatRule() != null && !reminder.getRepeatRule().isBlank()) {
      advanceToNextOccurrence(reminder);
      reminder.setSnoozedUntil(null); // Clear snooze after advancing
    } else {
      reminder.setCompletedAt(now);
    }

    reminderRepository.save(reminder);
  }

  /**
   * Creates a notification for the given reminder, mapping the reminder type
   * to the appropriate {@link NotificationType}. Also sends a web push
   * notification (fire-and-forget).
   */
  private void createNotificationForReminder(Reminder reminder) {
    NotificationType notificationType = mapReminderTypeToNotificationType(
        reminder.getReminderType());
    String messageKey = mapReminderTypeToMessageKey(reminder.getReminderType());

    notificationService.createReminderNotification(
        reminder.getUserHash(),
        notificationType,
        messageKey,
        reminder.getId());

    log.info("Created {} notification for reminder {}", notificationType, reminder.getId());
    // Push is sent by NotificationService.createNotification() — no duplicate needed
  }

  /**
   * Maps a reminder type string to the corresponding {@link NotificationType}.
   *
   * @param reminderType the reminder type (e.g., "MEDICATION", "TESTING", "VACCINATION")
   * @return the matching notification type
   */
  private NotificationType mapReminderTypeToNotificationType(String reminderType) {
    return switch (reminderType.toUpperCase()) {
      case "MEDICATION" -> NotificationType.MEDICATION_REMINDER;
      case "VACCINATION" -> NotificationType.VACCINATION_REMINDER;
      case "TESTING" -> NotificationType.TESTING_REMINDER;
      case "FOLLOW_UP" -> NotificationType.FOLLOW_UP_REMINDER;
      default -> {
        log.warn("Unknown reminder type: {}, defaulting to FOLLOW_UP_REMINDER", reminderType);
        yield NotificationType.FOLLOW_UP_REMINDER;
      }
    };
  }

  /**
   * Maps a reminder type string to the corresponding i18n message key.
   *
   * @param reminderType the reminder type
   * @return the i18n message key
   */
  private String mapReminderTypeToMessageKey(String reminderType) {
    return switch (reminderType.toUpperCase()) {
      case "MEDICATION" -> "notifications.medicationReminder";
      case "VACCINATION" -> "notifications.vaccinationReminder";
      case "TESTING" -> "notifications.testingReminder";
      case "FOLLOW_UP" -> "notifications.followUpReminder";
      default -> "notifications.reminder";
    };
  }

  /**
   * Advances a repeating reminder to its next occurrence based on the repeat rule.
   *
   * <p>Supported formats:
   * <ul>
   *   <li>{@code DAILY} - adds 1 day</li>
   *   <li>{@code WEEKLY} - adds 7 days</li>
   *   <li>{@code MONTHLY} - adds 1 month</li>
   *   <li>{@code CUSTOM_DAYS:N} - adds N days</li>
   * </ul>
   *
   * @param reminder the reminder to advance
   */
  private void advanceToNextOccurrence(Reminder reminder) {
    OffsetDateTime current = reminder.getScheduledFor();
    String rule = reminder.getRepeatRule().trim().toUpperCase();

    OffsetDateTime next = switch (rule) {
      case "DAILY" -> current.plusDays(1);
      case "WEEKLY" -> current.plusDays(7);
      case "MONTHLY" -> current.plusMonths(1);
      default -> {
        if (rule.startsWith("CUSTOM_DAYS:")) {
          try {
            int days = Integer.parseInt(rule.substring("CUSTOM_DAYS:".length()));
            yield current.plusDays(days);
          } catch (NumberFormatException e) {
            log.warn("Invalid CUSTOM_DAYS rule: {}, defaulting to 1 day", rule);
            yield current.plusDays(1);
          }
        } else {
          log.warn("Unknown repeat rule: {}, defaulting to 1 day", rule);
          yield current.plusDays(1);
        }
      }
    };

    reminder.setScheduledFor(next);
    log.debug("Advanced reminder {} from {} to {}", reminder.getId(), current, next);
  }

  /**
   * Checks if the current time falls within the user's configured quiet hours.
   * Handles midnight wraparound (e.g., 22:00 to 07:00).
   *
   * @param settings the user's reminder settings
   * @param now      the current time
   * @return true if currently in quiet hours
   */
  boolean isInQuietHours(ReminderSettings settings, OffsetDateTime now) {
    LocalTime start = settings.getQuietHoursStart();
    LocalTime end = settings.getQuietHoursEnd();

    if (start == null || end == null) {
      return false;
    }

    LocalTime currentTime = now.toLocalTime();

    if (start.isBefore(end)) {
      // Same-day range (e.g., 13:00 to 17:00)
      return !currentTime.isBefore(start) && currentTime.isBefore(end);
    } else {
      // Wraps midnight (e.g., 22:00 to 07:00)
      return !currentTime.isBefore(start) || currentTime.isBefore(end);
    }
  }

  /**
   * Checks if the given reminder type is enabled in the user's settings.
   *
   * @param settings     the user's reminder settings
   * @param reminderType the reminder type string
   * @return true if the reminder type is enabled (or not specifically configured)
   */
  private boolean isReminderTypeEnabled(ReminderSettings settings, String reminderType) {
    return switch (reminderType.toUpperCase()) {
      case "MEDICATION" -> Boolean.TRUE.equals(settings.getMedicationRemindersEnabled());
      case "VACCINATION" -> Boolean.TRUE.equals(settings.getVaccinationRemindersEnabled());
      case "TESTING" -> Boolean.TRUE.equals(settings.getTestingRemindersEnabled());
      default -> true; // Unknown types are allowed by default
    };
  }
}
