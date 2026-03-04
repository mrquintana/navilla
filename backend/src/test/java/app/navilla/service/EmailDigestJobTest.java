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

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import app.navilla.entity.Medication;
import app.navilla.entity.Reminder;
import app.navilla.entity.ReminderSettings;
import app.navilla.entity.TestVisit;
import app.navilla.entity.User;
import app.navilla.entity.Vaccination;
import app.navilla.repository.MedicationLogRepository;
import app.navilla.repository.MedicationRepository;
import app.navilla.repository.ReminderRepository;
import app.navilla.repository.ReminderSettingsRepository;
import app.navilla.repository.TestVisitRepository;
import app.navilla.repository.UserRepository;
import app.navilla.repository.VaccinationRepository;
import app.navilla.security.EncryptionService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * Unit tests for {@link EmailDigestJob}.
 *
 * @author Navilla Team
 * @since 2026-03-03
 */
@ExtendWith(MockitoExtension.class)
class EmailDigestJobTest {

  @Mock
  private ReminderSettingsRepository reminderSettingsRepository;

  @Mock
  private UserRepository userRepository;

  @Mock
  private EncryptionService encryptionService;

  @Mock
  private EmailService emailService;

  @Mock
  private TestVisitRepository testVisitRepository;

  @Mock
  private MedicationRepository medicationRepository;

  @Mock
  private MedicationLogRepository medicationLogRepository;

  @Mock
  private VaccinationRepository vaccinationRepository;

  @Mock
  private ReminderRepository reminderRepository;

  @InjectMocks
  private EmailDigestJob emailDigestJob;

  @Captor
  private ArgumentCaptor<Map<String, Object>> variablesCaptor;

  private static final String USER_HASH = "abc123hash";
  private static final String USER_EMAIL = "user@example.com";
  private static final byte[] ENCRYPTED_EMAIL = new byte[]{10, 20, 30};

  private ReminderSettings buildSettings(String userHash, String day) {
    return ReminderSettings.builder()
        .id(UUID.randomUUID())
        .userHash(userHash)
        .emailDigestEnabled(true)
        .emailDigestDay(day)
        .build();
  }

  private User buildUser(String emailHash, byte[] emailEncrypted) {
    return User.builder()
        .id(UUID.randomUUID())
        .emailHash(emailHash)
        .emailEncrypted(emailEncrypted)
        .verified(true)
        .build();
  }

  @Test
  @DisplayName("should only process settings matching the given day")
  void sendDigestsForDay_shouldFilterByDay() {
    ReminderSettings mondaySettings = buildSettings(USER_HASH, "MONDAY");
    when(reminderSettingsRepository.findByEmailDigestEnabledTrueAndEmailDigestDay("MONDAY"))
        .thenReturn(List.of(mondaySettings));

    User user = buildUser(USER_HASH, ENCRYPTED_EMAIL);
    when(userRepository.findByEmailHash(USER_HASH)).thenReturn(Optional.of(user));
    when(encryptionService.decryptFromBytes(ENCRYPTED_EMAIL)).thenReturn(USER_EMAIL);

    // Stub repos with empty results for data gathering
    stubEmptyDataRepos(USER_HASH);

    emailDigestJob.sendDigestsForDay("MONDAY");

    verify(reminderSettingsRepository).findByEmailDigestEnabledTrueAndEmailDigestDay("MONDAY");
    verify(emailService).sendTemplatedEmail(
        eq(USER_EMAIL),
        eq("Your Navilla Weekly Digest"),
        eq("digest"),
        any(),
        eq(Locale.ENGLISH));
  }

  @Test
  @DisplayName("should skip users with no email")
  void sendDigestsForDay_shouldSkipUsersWithNoEmail() {
    ReminderSettings settings = buildSettings(USER_HASH, "TUESDAY");
    when(reminderSettingsRepository.findByEmailDigestEnabledTrueAndEmailDigestDay("TUESDAY"))
        .thenReturn(List.of(settings));

    // User exists but has null encrypted email
    User user = buildUser(USER_HASH, null);
    when(userRepository.findByEmailHash(USER_HASH)).thenReturn(Optional.of(user));

    emailDigestJob.sendDigestsForDay("TUESDAY");

    verify(emailService, never()).sendTemplatedEmail(any(), any(), any(), any(), any());
  }

  @Test
  @DisplayName("should skip when user is not found")
  void sendDigestsForDay_shouldSkipWhenUserNotFound() {
    ReminderSettings settings = buildSettings(USER_HASH, "WEDNESDAY");
    when(reminderSettingsRepository.findByEmailDigestEnabledTrueAndEmailDigestDay("WEDNESDAY"))
        .thenReturn(List.of(settings));

    when(userRepository.findByEmailHash(USER_HASH)).thenReturn(Optional.empty());

    emailDigestJob.sendDigestsForDay("WEDNESDAY");

    verify(emailService, never()).sendTemplatedEmail(any(), any(), any(), any(), any());
  }

  @Test
  @DisplayName("should send no emails when no users opted in")
  void sendDigestsForDay_shouldSendNothingWhenNoOptIns() {
    when(reminderSettingsRepository.findByEmailDigestEnabledTrueAndEmailDigestDay("SUNDAY"))
        .thenReturn(List.of());

    emailDigestJob.sendDigestsForDay("SUNDAY");

    verify(emailService, never()).sendTemplatedEmail(any(), any(), any(), any(), any());
  }

  @Test
  @DisplayName("should include correct data in digest variables")
  @SuppressWarnings("unchecked")
  void sendDigestsForDay_shouldBuildCorrectVariables() {
    ReminderSettings settings = buildSettings(USER_HASH, "FRIDAY");
    when(reminderSettingsRepository.findByEmailDigestEnabledTrueAndEmailDigestDay("FRIDAY"))
        .thenReturn(List.of(settings));

    User user = buildUser(USER_HASH, ENCRYPTED_EMAIL);
    when(userRepository.findByEmailHash(USER_HASH)).thenReturn(Optional.of(user));
    when(encryptionService.decryptFromBytes(ENCRYPTED_EMAIL)).thenReturn(USER_EMAIL);

    // Set up PrEP medication with logs
    Medication prepMed = Medication.builder()
        .id(UUID.randomUUID())
        .userHash(USER_HASH)
        .medicationType("PREP_DAILY")
        .nameEncrypted(new byte[]{1})
        .startDate(LocalDate.now().minusDays(30))
        .frequency("DAILY")
        .active(true)
        .build();

    when(medicationRepository.findByUserHashAndMedicationTypeAndActive(
        USER_HASH, "PREP", true)).thenReturn(List.of());
    when(medicationRepository.findByUserHashAndMedicationTypeAndActive(
        USER_HASH, "PREP_DAILY", true)).thenReturn(List.of(prepMed));
    when(medicationRepository.findByUserHashAndMedicationTypeAndActive(
        USER_HASH, "PREP_ON_DEMAND", true)).thenReturn(List.of());

    // 5 of 7 taken this week
    when(medicationLogRepository.countByMedicationIdAndTakenTrueAndScheduledForBetween(
        eq(prepMed.getId()), any(LocalDate.class), any(LocalDate.class))).thenReturn(5L);
    when(medicationLogRepository.countByMedicationIdAndScheduledForBetween(
        eq(prepMed.getId()), any(LocalDate.class), any(LocalDate.class))).thenReturn(7L);

    // Test visit 10 days ago
    TestVisit lastVisit = TestVisit.builder()
        .id(UUID.randomUUID())
        .userHash(USER_HASH)
        .testDate(LocalDate.now().minusDays(10))
        .build();
    when(testVisitRepository.findByUserHashOrderByTestDateDesc(USER_HASH))
        .thenReturn(List.of(lastVisit));

    // One upcoming reminder
    Reminder upcoming = Reminder.builder()
        .id(UUID.randomUUID())
        .userHash(USER_HASH)
        .reminderType("TESTING")
        .titleEncrypted(new byte[]{5, 6, 7})
        .scheduledFor(OffsetDateTime.now().plusDays(3))
        .active(true)
        .build();
    when(reminderRepository.findByUserHashAndActiveTrueAndCompletedAtIsNullAndScheduledForBetween(
        eq(USER_HASH), any(OffsetDateTime.class), any(OffsetDateTime.class)))
        .thenReturn(List.of(upcoming));
    when(encryptionService.decryptFromBytes(new byte[]{5, 6, 7}))
        .thenReturn("STI Test Reminder");

    // One pending vaccine
    Vaccination partialVax = Vaccination.builder()
        .id(UUID.randomUUID())
        .userHash(USER_HASH)
        .vaccineType("HPV")
        .doseNumber(1)
        .totalDoses(3)
        .administeredDate(LocalDate.now().minusDays(60))
        .build();
    when(vaccinationRepository.findByUserHashOrderByVaccineTypeAscDoseNumberAsc(USER_HASH))
        .thenReturn(List.of(partialVax));

    emailDigestJob.sendDigestsForDay("FRIDAY");

    verify(emailService).sendTemplatedEmail(
        eq(USER_EMAIL),
        eq("Your Navilla Weekly Digest"),
        eq("digest"),
        variablesCaptor.capture(),
        eq(Locale.ENGLISH));

    Map<String, Object> vars = variablesCaptor.getValue();
    // PrEP adherence: 5/7
    org.assertj.core.api.Assertions.assertThat((Double) vars.get("prepAdherenceRate"))
        .isCloseTo(5.0 / 7.0, org.assertj.core.data.Offset.offset(0.01));
    // Days since last test: 10
    org.assertj.core.api.Assertions.assertThat((Long) vars.get("daysSinceLastTest"))
        .isEqualTo(10L);
    // Upcoming reminders: 1
    org.assertj.core.api.Assertions.assertThat((List<String>) vars.get("upcomingReminders"))
        .containsExactly("STI Test Reminder");
    // Pending vaccines: HPV
    org.assertj.core.api.Assertions.assertThat((List<String>) vars.get("pendingVaccines"))
        .containsExactly("HPV");
  }

  @Test
  @DisplayName("should process multiple users on the same day")
  void sendDigestsForDay_shouldProcessMultipleUsers() {
    String userHash2 = "xyz789hash";
    byte[] encryptedEmail2 = new byte[]{40, 50, 60};

    ReminderSettings settings1 = buildSettings(USER_HASH, "THURSDAY");
    ReminderSettings settings2 = buildSettings(userHash2, "THURSDAY");
    when(reminderSettingsRepository.findByEmailDigestEnabledTrueAndEmailDigestDay("THURSDAY"))
        .thenReturn(List.of(settings1, settings2));

    User user1 = buildUser(USER_HASH, ENCRYPTED_EMAIL);
    User user2 = buildUser(userHash2, encryptedEmail2);
    when(userRepository.findByEmailHash(USER_HASH)).thenReturn(Optional.of(user1));
    when(userRepository.findByEmailHash(userHash2)).thenReturn(Optional.of(user2));
    when(encryptionService.decryptFromBytes(ENCRYPTED_EMAIL)).thenReturn(USER_EMAIL);
    when(encryptionService.decryptFromBytes(encryptedEmail2)).thenReturn("other@example.com");

    stubEmptyDataRepos(USER_HASH);
    stubEmptyDataRepos(userHash2);

    emailDigestJob.sendDigestsForDay("THURSDAY");

    verify(emailService, times(2)).sendTemplatedEmail(
        anyString(), anyString(), eq("digest"), any(), any());
  }

  @Test
  @DisplayName("should continue processing other users when one fails")
  void sendDigestsForDay_shouldContinueOnFailure() {
    String userHash2 = "xyz789hash";
    byte[] encryptedEmail2 = new byte[]{40, 50, 60};

    ReminderSettings settings1 = buildSettings(USER_HASH, "SATURDAY");
    ReminderSettings settings2 = buildSettings(userHash2, "SATURDAY");
    when(reminderSettingsRepository.findByEmailDigestEnabledTrueAndEmailDigestDay("SATURDAY"))
        .thenReturn(List.of(settings1, settings2));

    // First user lookup throws
    when(userRepository.findByEmailHash(USER_HASH))
        .thenThrow(new RuntimeException("DB error"));

    // Second user should still process
    User user2 = buildUser(userHash2, encryptedEmail2);
    when(userRepository.findByEmailHash(userHash2)).thenReturn(Optional.of(user2));
    when(encryptionService.decryptFromBytes(encryptedEmail2)).thenReturn("other@example.com");

    stubEmptyDataRepos(userHash2);

    emailDigestJob.sendDigestsForDay("SATURDAY");

    // Second user should still get an email despite the first one failing
    verify(emailService).sendTemplatedEmail(
        eq("other@example.com"),
        anyString(),
        eq("digest"),
        any(),
        any());
  }

  /**
   * Stubs all data repositories with empty results for the given userHash.
   */
  private void stubEmptyDataRepos(String userHash) {
    when(medicationRepository.findByUserHashAndMedicationTypeAndActive(
        userHash, "PREP", true)).thenReturn(List.of());
    when(medicationRepository.findByUserHashAndMedicationTypeAndActive(
        userHash, "PREP_DAILY", true)).thenReturn(List.of());
    when(medicationRepository.findByUserHashAndMedicationTypeAndActive(
        userHash, "PREP_ON_DEMAND", true)).thenReturn(List.of());
    when(testVisitRepository.findByUserHashOrderByTestDateDesc(userHash))
        .thenReturn(List.of());
    when(reminderRepository
        .findByUserHashAndActiveTrueAndCompletedAtIsNullAndScheduledForBetween(
            eq(userHash), any(OffsetDateTime.class), any(OffsetDateTime.class)))
        .thenReturn(List.of());
    when(vaccinationRepository.findByUserHashOrderByVaccineTypeAscDoseNumberAsc(userHash))
        .thenReturn(List.of());
  }
}
