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
import java.util.UUID;

import app.navilla.dto.ReminderResponse;
import app.navilla.dto.ReminderSettingsResponse;
import app.navilla.dto.SnoozeReminderRequest;
import app.navilla.dto.UpdateReminderSettingsRequest;
import app.navilla.entity.Reminder;
import app.navilla.entity.ReminderSettings;
import app.navilla.exception.ResourceNotFoundException;
import app.navilla.repository.ReminderRepository;
import app.navilla.repository.ReminderSettingsRepository;
import app.navilla.security.EncryptionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service for managing user reminders and reminder settings.
 *
 * <p>Handles listing, snoozing, completing, toggling, and deleting reminders.
 * Also manages per-user reminder settings (quiet hours, digest preferences,
 * category toggles). Sensitive fields (title, message) are decrypted on read.
 *
 * @author Navilla Team
 * @since 2026-03-03
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ReminderService {

  private final ReminderRepository reminderRepository;
  private final ReminderSettingsRepository reminderSettingsRepository;
  private final EncryptionService encryptionService;

  /**
   * Lists all active, incomplete reminders for the authenticated user,
   * ordered by scheduledFor ascending.
   *
   * @param jwt the authenticated user's JWT
   * @return list of reminder responses with decrypted fields
   */
  @Transactional(readOnly = true)
  public List<ReminderResponse> list(Jwt jwt) {
    String userHash = hashEmail(jwt);

    return reminderRepository
        .findByUserHashAndActiveTrueAndCompletedAtIsNullOrderByScheduledForAsc(userHash)
        .stream()
        .map(this::toResponse)
        .toList();
  }

  /**
   * Returns reminders due within the given number of days for the authenticated user.
   *
   * @param jwt  the authenticated user's JWT
   * @param days the number of days ahead to look
   * @return list of upcoming reminder responses with decrypted fields
   */
  @Transactional(readOnly = true)
  public List<ReminderResponse> getUpcoming(Jwt jwt, int days) {
    String userHash = hashEmail(jwt);
    OffsetDateTime cutoff = OffsetDateTime.now().plusDays(days);

    return reminderRepository
        .findByUserHashAndActiveTrueAndCompletedAtIsNullAndScheduledForBeforeOrderByScheduledForAsc(
            userHash, cutoff)
        .stream()
        .map(this::toResponse)
        .toList();
  }

  /**
   * Snoozes a reminder until the specified time.
   *
   * @param jwt     the authenticated user's JWT
   * @param id      the reminder ID
   * @param request the snooze request containing the until datetime
   * @return the updated reminder response
   * @throws ResourceNotFoundException if the reminder does not exist
   * @throws IllegalStateException     if the reminder belongs to another user
   */
  @Transactional
  public ReminderResponse snooze(Jwt jwt, UUID id, SnoozeReminderRequest request) {
    String userHash = hashEmail(jwt);

    Reminder reminder = reminderRepository.findById(id)
        .orElseThrow(() -> new ResourceNotFoundException("reminder.error.notFound"));

    verifyOwnership(reminder, userHash);

    OffsetDateTime until = OffsetDateTime.parse(request.until());
    reminder.setSnoozedUntil(until);

    reminderRepository.save(reminder);
    log.info("Reminder snoozed: {} until {}", id, until);

    return toResponse(reminder);
  }

  /**
   * Marks a reminder as completed.
   *
   * @param jwt the authenticated user's JWT
   * @param id  the reminder ID
   * @return the updated reminder response
   * @throws ResourceNotFoundException if the reminder does not exist
   * @throws IllegalStateException     if the reminder belongs to another user
   */
  @Transactional
  public ReminderResponse complete(Jwt jwt, UUID id) {
    String userHash = hashEmail(jwt);

    Reminder reminder = reminderRepository.findById(id)
        .orElseThrow(() -> new ResourceNotFoundException("reminder.error.notFound"));

    verifyOwnership(reminder, userHash);

    reminder.setCompletedAt(OffsetDateTime.now());

    reminderRepository.save(reminder);
    log.info("Reminder completed: {}", id);

    return toResponse(reminder);
  }

  /**
   * Toggles the active flag on a reminder.
   *
   * @param jwt the authenticated user's JWT
   * @param id  the reminder ID
   * @return the updated reminder response
   * @throws ResourceNotFoundException if the reminder does not exist
   * @throws IllegalStateException     if the reminder belongs to another user
   */
  @Transactional
  public ReminderResponse toggle(Jwt jwt, UUID id) {
    String userHash = hashEmail(jwt);

    Reminder reminder = reminderRepository.findById(id)
        .orElseThrow(() -> new ResourceNotFoundException("reminder.error.notFound"));

    verifyOwnership(reminder, userHash);

    reminder.setActive(!Boolean.TRUE.equals(reminder.getActive()));

    reminderRepository.save(reminder);
    log.info("Reminder toggled: {} active={}", id, reminder.getActive());

    return toResponse(reminder);
  }

  /**
   * Deletes a reminder.
   *
   * @param jwt the authenticated user's JWT
   * @param id  the reminder ID
   * @throws ResourceNotFoundException if the reminder does not exist
   * @throws IllegalStateException     if the reminder belongs to another user
   */
  @Transactional
  public void delete(Jwt jwt, UUID id) {
    String userHash = hashEmail(jwt);

    Reminder reminder = reminderRepository.findById(id)
        .orElseThrow(() -> new ResourceNotFoundException("reminder.error.notFound"));

    verifyOwnership(reminder, userHash);

    reminderRepository.delete(reminder);
    log.info("Reminder deleted: {}", id);
  }

  /**
   * Returns the reminder settings for the authenticated user,
   * creating defaults if none exist.
   *
   * @param jwt the authenticated user's JWT
   * @return the reminder settings response
   */
  @Transactional
  public ReminderSettingsResponse getSettings(Jwt jwt) {
    String userHash = hashEmail(jwt);

    ReminderSettings settings = reminderSettingsRepository.findByUserHash(userHash)
        .orElseGet(() -> {
          ReminderSettings defaults = ReminderSettings.builder()
              .userHash(userHash)
              .emailDigestEnabled(false)
              .testingRemindersEnabled(true)
              .medicationRemindersEnabled(true)
              .vaccinationRemindersEnabled(true)
              .build();
          return reminderSettingsRepository.save(defaults);
        });

    return toSettingsResponse(settings);
  }

  /**
   * Updates the reminder settings for the authenticated user.
   * Creates default settings first if none exist. Only applies non-null fields.
   *
   * @param jwt     the authenticated user's JWT
   * @param request the update request with nullable fields
   * @return the updated reminder settings response
   */
  @Transactional
  public ReminderSettingsResponse updateSettings(Jwt jwt, UpdateReminderSettingsRequest request) {
    String userHash = hashEmail(jwt);

    ReminderSettings settings = reminderSettingsRepository.findByUserHash(userHash)
        .orElseGet(() -> ReminderSettings.builder()
            .userHash(userHash)
            .emailDigestEnabled(false)
            .testingRemindersEnabled(true)
            .medicationRemindersEnabled(true)
            .vaccinationRemindersEnabled(true)
            .build());

    // Apply non-null fields
    if (request.quietHoursStart() != null) {
      settings.setQuietHoursStart(LocalTime.parse(request.quietHoursStart()));
    }
    if (request.quietHoursEnd() != null) {
      settings.setQuietHoursEnd(LocalTime.parse(request.quietHoursEnd()));
    }
    if (request.emailDigestEnabled() != null) {
      settings.setEmailDigestEnabled(request.emailDigestEnabled());
    }
    if (request.emailDigestDay() != null) {
      settings.setEmailDigestDay(request.emailDigestDay());
    }
    if (request.testingRemindersEnabled() != null) {
      settings.setTestingRemindersEnabled(request.testingRemindersEnabled());
    }
    if (request.medicationRemindersEnabled() != null) {
      settings.setMedicationRemindersEnabled(request.medicationRemindersEnabled());
    }
    if (request.vaccinationRemindersEnabled() != null) {
      settings.setVaccinationRemindersEnabled(request.vaccinationRemindersEnabled());
    }

    reminderSettingsRepository.save(settings);
    log.info("Reminder settings updated for user");

    return toSettingsResponse(settings);
  }

  // ---- Private helpers ----

  private String hashEmail(Jwt jwt) {
    return encryptionService.hashEmail(jwt.getClaimAsString("email"));
  }

  private String decryptOptional(byte[] encrypted) {
    if (encrypted == null) {
      return null;
    }
    return encryptionService.decryptFromBytes(encrypted);
  }

  private void verifyOwnership(Reminder reminder, String userHash) {
    if (!reminder.getUserHash().equals(userHash)) {
      throw new IllegalStateException("reminder.error.notOwner");
    }
  }

  private ReminderResponse toResponse(Reminder reminder) {
    return new ReminderResponse(
        reminder.getId(),
        reminder.getReminderType(),
        reminder.getReferenceId(),
        decryptOptional(reminder.getTitleEncrypted()),
        decryptOptional(reminder.getMessageEncrypted()),
        reminder.getScheduledFor() != null ? reminder.getScheduledFor().toString() : null,
        reminder.getRepeatRule(),
        reminder.getSnoozedUntil() != null ? reminder.getSnoozedUntil().toString() : null,
        reminder.getCompletedAt() != null ? reminder.getCompletedAt().toString() : null,
        Boolean.TRUE.equals(reminder.getActive()),
        reminder.getCreatedAt() != null ? reminder.getCreatedAt().toString() : null
    );
  }

  private ReminderSettingsResponse toSettingsResponse(ReminderSettings settings) {
    return new ReminderSettingsResponse(
        settings.getQuietHoursStart() != null ? settings.getQuietHoursStart().toString() : null,
        settings.getQuietHoursEnd() != null ? settings.getQuietHoursEnd().toString() : null,
        Boolean.TRUE.equals(settings.getEmailDigestEnabled()),
        settings.getEmailDigestDay(),
        Boolean.TRUE.equals(settings.getTestingRemindersEnabled()),
        Boolean.TRUE.equals(settings.getMedicationRemindersEnabled()),
        Boolean.TRUE.equals(settings.getVaccinationRemindersEnabled())
    );
  }
}
