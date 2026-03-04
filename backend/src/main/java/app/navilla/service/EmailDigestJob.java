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

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

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
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Scheduled job that sends weekly email digests to opted-in users.
 *
 * <p>Runs daily at the configured batch hour. For each day of the week,
 * it finds users whose {@code emailDigestDay} matches the current day
 * and sends them a personalized digest email summarising their health
 * activity for the past week.
 *
 * <p>Digest contents include:
 * <ul>
 *   <li>PrEP adherence rate and current streak</li>
 *   <li>Days since last STI test</li>
 *   <li>Upcoming reminders for the next 7 days</li>
 *   <li>Pending vaccination doses</li>
 * </ul>
 *
 * @author Navilla Team
 * @since 2026-03-03
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class EmailDigestJob {

  private final ReminderSettingsRepository reminderSettingsRepository;
  private final UserRepository userRepository;
  private final EncryptionService encryptionService;
  private final EmailService emailService;
  private final TestVisitRepository testVisitRepository;
  private final MedicationRepository medicationRepository;
  private final MedicationLogRepository medicationLogRepository;
  private final VaccinationRepository vaccinationRepository;
  private final ReminderRepository reminderRepository;

  /**
   * Runs daily at the configured batch hour. Sends digest emails to users
   * whose selected digest day matches today's day of the week.
   */
  @Scheduled(cron = "0 0 ${navilla.notification.batch-hour:18} * * *")
  @Transactional(readOnly = true)
  public void sendDigests() {
    String today = DayOfWeek.from(LocalDate.now()).name();
    sendDigestsForDay(today);
  }

  /**
   * Sends digest emails for the given day of the week. Extracted for testability.
   *
   * @param dayOfWeek the uppercase day name (e.g. "MONDAY")
   */
  @Transactional(readOnly = true)
  public void sendDigestsForDay(String dayOfWeek) {
    log.info("Starting email digest processing for {}", dayOfWeek);

    List<ReminderSettings> optedIn =
        reminderSettingsRepository.findByEmailDigestEnabledTrueAndEmailDigestDay(dayOfWeek);

    int sent = 0;
    for (ReminderSettings settings : optedIn) {
      try {
        if (processDigest(settings)) {
          sent++;
        }
      } catch (Exception e) {
        log.error("Failed to send digest for userHash {}: {}",
            settings.getUserHash(), e.getMessage());
      }
    }

    log.info("Sent {} digest emails for {}", sent, dayOfWeek);
  }

  /**
   * Processes and sends a single digest email.
   *
   * @param settings the user's reminder settings (with digest enabled)
   * @return true if the email was sent, false if skipped
   */
  private boolean processDigest(ReminderSettings settings) {
    String userHash = settings.getUserHash();

    // Find the user by emailHash (userHash == emailHash in our model)
    Optional<User> userOpt = userRepository.findByEmailHash(userHash);
    if (userOpt.isEmpty()) {
      log.warn("No user found for userHash in digest processing");
      return false;
    }

    User user = userOpt.get();
    if (user.getEmailEncrypted() == null) {
      log.warn("User has no encrypted email, skipping digest");
      return false;
    }

    String email = encryptionService.decryptFromBytes(user.getEmailEncrypted());
    if (email == null || email.isBlank()) {
      log.warn("Decrypted email is blank, skipping digest");
      return false;
    }

    Map<String, Object> variables = gatherDigestData(userHash);
    Locale locale = Locale.ENGLISH;

    emailService.sendTemplatedEmail(
        email,
        "Your Navilla Weekly Digest",
        "digest",
        variables,
        locale);

    return true;
  }

  /**
   * Gathers all digest data for a user.
   *
   * @param userHash the user's hash
   * @return template variables map
   */
  Map<String, Object> gatherDigestData(String userHash) {
    Map<String, Object> variables = new HashMap<>();

    // PrEP adherence
    PrepDigestData prepData = calculatePrepData(userHash);
    variables.put("prepAdherenceRate", prepData.adherenceRate());
    variables.put("prepStreakDays", prepData.streakDays());

    // Testing data
    TestingDigestData testingData = calculateTestingData(userHash);
    variables.put("daysSinceLastTest", testingData.daysSinceLastTest());
    variables.put("lastTestDate", testingData.lastTestDate());

    // Upcoming reminders (next 7 days)
    List<String> upcomingReminders = getUpcomingReminderTitles(userHash);
    variables.put("upcomingReminders", upcomingReminders);

    // Pending vaccine doses
    List<String> pendingVaccines = getPendingVaccines(userHash);
    variables.put("pendingVaccines", pendingVaccines);

    return variables;
  }

  private PrepDigestData calculatePrepData(String userHash) {
    List<Medication> prepMeds = new ArrayList<>();
    prepMeds.addAll(medicationRepository.findByUserHashAndMedicationTypeAndActive(
        userHash, "PREP", true));
    prepMeds.addAll(medicationRepository.findByUserHashAndMedicationTypeAndActive(
        userHash, "PREP_DAILY", true));
    prepMeds.addAll(medicationRepository.findByUserHashAndMedicationTypeAndActive(
        userHash, "PREP_ON_DEMAND", true));

    if (prepMeds.isEmpty()) {
      return new PrepDigestData(null, 0);
    }

    // Calculate adherence for the past 7 days
    LocalDate weekEnd = LocalDate.now();
    LocalDate weekStart = weekEnd.minusDays(6);

    long totalTaken = 0;
    long totalScheduled = 0;

    for (Medication med : prepMeds) {
      totalTaken += medicationLogRepository
          .countByMedicationIdAndTakenTrueAndScheduledForBetween(
              med.getId(), weekStart, weekEnd);
      totalScheduled += medicationLogRepository
          .countByMedicationIdAndScheduledForBetween(
              med.getId(), weekStart, weekEnd);
    }

    Double adherenceRate = totalScheduled > 0
        ? (double) totalTaken / totalScheduled
        : null;

    // Calculate current streak
    int streakDays = calculateCurrentStreak(prepMeds);

    return new PrepDigestData(adherenceRate, streakDays);
  }

  private int calculateCurrentStreak(List<Medication> prepMeds) {
    int streak = 0;
    LocalDate checkDate = LocalDate.now();

    // Check backwards day by day
    for (int i = 0; i < 365; i++) {
      long taken = 0;
      long scheduled = 0;

      for (Medication med : prepMeds) {
        taken += medicationLogRepository
            .countByMedicationIdAndTakenTrueAndScheduledForBetween(
                med.getId(), checkDate, checkDate);
        scheduled += medicationLogRepository
            .countByMedicationIdAndScheduledForBetween(
                med.getId(), checkDate, checkDate);
      }

      if (scheduled == 0 || taken < scheduled) {
        break;
      }
      streak++;
      checkDate = checkDate.minusDays(1);
    }
    return streak;
  }

  private TestingDigestData calculateTestingData(String userHash) {
    List<TestVisit> visits =
        testVisitRepository.findByUserHashOrderByTestDateDesc(userHash);

    if (visits.isEmpty()) {
      return new TestingDigestData(null, null);
    }

    TestVisit lastVisit = visits.getFirst();
    LocalDate lastTestDate = lastVisit.getTestDate();
    long daysSince = ChronoUnit.DAYS.between(lastTestDate, LocalDate.now());

    return new TestingDigestData(daysSince, lastTestDate.toString());
  }

  private List<String> getUpcomingReminderTitles(String userHash) {
    OffsetDateTime now = OffsetDateTime.now();
    OffsetDateTime sevenDaysOut = now.plusDays(7);

    List<Reminder> upcoming = reminderRepository
        .findByUserHashAndActiveTrueAndCompletedAtIsNullAndScheduledForBetween(
            userHash, now, sevenDaysOut);

    List<String> titles = new ArrayList<>();
    for (Reminder reminder : upcoming) {
      try {
        String title = encryptionService.decryptFromBytes(reminder.getTitleEncrypted());
        titles.add(title != null ? title : reminder.getReminderType());
      } catch (Exception e) {
        titles.add(reminder.getReminderType());
      }
    }
    return titles;
  }

  private List<String> getPendingVaccines(String userHash) {
    List<Vaccination> vaccinations =
        vaccinationRepository.findByUserHashOrderByVaccineTypeAscDoseNumberAsc(userHash);

    Map<String, Integer> maxDoseByType = new HashMap<>();
    Map<String, Integer> totalDosesByType = new HashMap<>();

    for (Vaccination vax : vaccinations) {
      String type = vax.getVaccineType();
      maxDoseByType.merge(type, vax.getDoseNumber(), Math::max);
      totalDosesByType.put(type, vax.getTotalDoses());
    }

    List<String> pending = new ArrayList<>();
    for (Map.Entry<String, Integer> entry : maxDoseByType.entrySet()) {
      String type = entry.getKey();
      int completedDoses = entry.getValue();
      int totalDoses = totalDosesByType.getOrDefault(type, 1);
      if (completedDoses < totalDoses) {
        pending.add(type);
      }
    }
    return pending;
  }

  /**
   * PrEP digest data holder.
   *
   * @param adherenceRate weekly adherence rate (0.0-1.0), null if no PrEP
   * @param streakDays    current consecutive days of PrEP adherence
   */
  record PrepDigestData(Double adherenceRate, int streakDays) {
  }

  /**
   * Testing digest data holder.
   *
   * @param daysSinceLastTest days since the most recent test, null if never tested
   * @param lastTestDate      ISO date string of last test, null if never tested
   */
  record TestingDigestData(Long daysSinceLastTest, String lastTestDate) {
  }
}
