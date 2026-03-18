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
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import app.navilla.config.HealthCatalogProperties;
import app.navilla.config.HealthCatalogProperties.VaccineSeriesConfig;
import app.navilla.dto.CreateVaccinationRequest;
import app.navilla.dto.UpdateVaccinationRequest;
import app.navilla.dto.VaccinationResponse;
import app.navilla.dto.VaccineSeriesResponse;
import app.navilla.entity.Reminder;
import app.navilla.entity.Vaccination;
import app.navilla.repository.ReminderRepository;
import app.navilla.repository.VaccinationRepository;
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
 * Unit tests for {@link VaccinationService}.
 *
 * @author Navilla Team
 * @since 2026-03-03
 */
@ExtendWith(MockitoExtension.class)
class VaccinationServiceTest {

  @Mock
  private VaccinationRepository vaccinationRepository;

  @Mock
  private ReminderRepository reminderRepository;

  @Mock
  private EncryptionService encryptionService;

  @Mock
  private HealthCatalogProperties catalogProperties;

  @Mock
  private ResourceCapService resourceCapService;

  @InjectMocks
  private VaccinationService vaccinationService;

  private static final String USER_EMAIL = "user@example.com";
  private static final String USER_HASH = "userhash123";
  private static final UUID VAX_ID = UUID.randomUUID();
  private static final byte[] ENCRYPTED_LOCATION = new byte[]{1, 2, 3};
  private static final byte[] ENCRYPTED_NOTES = new byte[]{4, 5, 6};
  private static final byte[] ENCRYPTED_TITLE = new byte[]{7, 8, 9};

  private Jwt mockJwt() {
    Jwt jwt = mock(Jwt.class);
    when(jwt.getClaimAsString("email")).thenReturn(USER_EMAIL);
    when(encryptionService.hashEmail(USER_EMAIL)).thenReturn(USER_HASH);
    return jwt;
  }

  private Vaccination buildVaccination(UUID id, String userHash, String vaccineType,
                                       int doseNumber, int totalDoses, LocalDate administeredDate) {
    return Vaccination.builder()
        .id(id)
        .userHash(userHash)
        .vaccineType(vaccineType)
        .doseNumber(doseNumber)
        .totalDoses(totalDoses)
        .administeredDate(administeredDate)
        .locationEncrypted(ENCRYPTED_LOCATION)
        .notesEncrypted(ENCRYPTED_NOTES)
        .createdAt(OffsetDateTime.now())
        .build();
  }

  private Map<String, VaccineSeriesConfig> defaultVaccineSeries() {
    return Map.of(
        "HPV", new VaccineSeriesConfig("vaccinations.type.hpv", 3, List.of(0, 60, 120)),
        "HEPATITIS_B", new VaccineSeriesConfig("vaccinations.type.hepatitisB", 3, List.of(0, 30, 150)),
        "MPOX", new VaccineSeriesConfig("vaccinations.type.mpox", 2, List.of(0, 28)),
        "HEPATITIS_A", new VaccineSeriesConfig("vaccinations.type.hepatitisA", 2, List.of(0, 180))
    );
  }

  private void stubDecryption() {
    when(encryptionService.decryptFromBytes(ENCRYPTED_LOCATION)).thenReturn("City Clinic");
    when(encryptionService.decryptFromBytes(ENCRYPTED_NOTES)).thenReturn("No side effects");
  }

  @Nested
  @DisplayName("create")
  class CreateDose {

    @Test
    @DisplayName("should save vaccination dose with encrypted fields")
    void create_shouldSaveWithEncryptedFields() {
      Jwt jwt = mockJwt();

      CreateVaccinationRequest request = new CreateVaccinationRequest(
          "HPV", 1, "2026-01-05", "City Clinic", "No side effects");

      when(catalogProperties.vaccineSeries()).thenReturn(defaultVaccineSeries());
      when(encryptionService.encryptToBytes("City Clinic")).thenReturn(ENCRYPTED_LOCATION);
      when(encryptionService.encryptToBytes("No side effects")).thenReturn(ENCRYPTED_NOTES);
      when(encryptionService.encryptToBytes("HPV Dose 2")).thenReturn(ENCRYPTED_TITLE);

      when(vaccinationRepository.save(any(Vaccination.class))).thenAnswer(invocation -> {
        Vaccination saved = invocation.getArgument(0);
        saved.setId(VAX_ID);
        saved.setCreatedAt(OffsetDateTime.now());
        return saved;
      });

      when(reminderRepository.save(any(Reminder.class))).thenAnswer(i -> {
        Reminder r = i.getArgument(0);
        r.setId(UUID.randomUUID());
        return r;
      });

      stubDecryption();

      VaccinationResponse response = vaccinationService.create(jwt, request);

      // Verify entity was saved with encrypted fields
      ArgumentCaptor<Vaccination> captor = ArgumentCaptor.forClass(Vaccination.class);
      verify(vaccinationRepository).save(captor.capture());
      Vaccination captured = captor.getValue();
      assertThat(captured.getUserHash()).isEqualTo(USER_HASH);
      assertThat(captured.getVaccineType()).isEqualTo("HPV");
      assertThat(captured.getDoseNumber()).isEqualTo(1);
      assertThat(captured.getTotalDoses()).isEqualTo(3);
      assertThat(captured.getAdministeredDate()).isEqualTo(LocalDate.of(2026, 1, 5));
      assertThat(captured.getLocationEncrypted()).isEqualTo(ENCRYPTED_LOCATION);
      assertThat(captured.getNotesEncrypted()).isEqualTo(ENCRYPTED_NOTES);

      // Verify response has decrypted fields
      assertThat(response.id()).isEqualTo(VAX_ID);
      assertThat(response.vaccineType()).isEqualTo("HPV");
      assertThat(response.doseNumber()).isEqualTo(1);
      assertThat(response.totalDoses()).isEqualTo(3);
      assertThat(response.location()).isEqualTo("City Clinic");
      assertThat(response.notes()).isEqualTo("No side effects");
    }

    @Test
    @DisplayName("should auto-set totalDoses from catalog config")
    void create_shouldAutoSetTotalDosesFromCatalog() {
      Jwt jwt = mockJwt();

      CreateVaccinationRequest request = new CreateVaccinationRequest(
          "MPOX", 1, "2026-02-10", null, null);

      when(catalogProperties.vaccineSeries()).thenReturn(defaultVaccineSeries());
      when(encryptionService.encryptToBytes("MPOX Dose 2")).thenReturn(ENCRYPTED_TITLE);

      when(vaccinationRepository.save(any(Vaccination.class))).thenAnswer(invocation -> {
        Vaccination saved = invocation.getArgument(0);
        saved.setId(VAX_ID);
        saved.setCreatedAt(OffsetDateTime.now());
        return saved;
      });

      when(reminderRepository.save(any(Reminder.class))).thenAnswer(i -> {
        Reminder r = i.getArgument(0);
        r.setId(UUID.randomUUID());
        return r;
      });

      VaccinationResponse response = vaccinationService.create(jwt, request);

      // MPOX has 2 total doses from catalog
      assertThat(response.totalDoses()).isEqualTo(2);
    }

    @Test
    @DisplayName("should create next-dose reminder when series is incomplete")
    void create_shouldCreateReminderWhenSeriesIncomplete() {
      Jwt jwt = mockJwt();

      CreateVaccinationRequest request = new CreateVaccinationRequest(
          "HPV", 1, "2026-01-05", null, null);

      when(catalogProperties.vaccineSeries()).thenReturn(defaultVaccineSeries());
      when(encryptionService.encryptToBytes("HPV Dose 2")).thenReturn(ENCRYPTED_TITLE);

      when(vaccinationRepository.save(any(Vaccination.class))).thenAnswer(invocation -> {
        Vaccination saved = invocation.getArgument(0);
        saved.setId(VAX_ID);
        saved.setCreatedAt(OffsetDateTime.now());
        return saved;
      });

      when(reminderRepository.save(any(Reminder.class))).thenAnswer(i -> {
        Reminder r = i.getArgument(0);
        r.setId(UUID.randomUUID());
        return r;
      });

      vaccinationService.create(jwt, request);

      // Verify reminder was created
      ArgumentCaptor<Reminder> captor = ArgumentCaptor.forClass(Reminder.class);
      verify(reminderRepository).save(captor.capture());
      Reminder reminder = captor.getValue();
      assertThat(reminder.getUserHash()).isEqualTo(USER_HASH);
      assertThat(reminder.getReminderType()).isEqualTo("VACCINATION");
      assertThat(reminder.getReferenceId()).isEqualTo(VAX_ID);
      assertThat(reminder.getActive()).isTrue();
    }

    @Test
    @DisplayName("should NOT create reminder when series is complete (doseNumber == totalDoses)")
    void create_shouldNotCreateReminderWhenSeriesComplete() {
      Jwt jwt = mockJwt();

      // HPV dose 3 of 3 — series complete
      CreateVaccinationRequest request = new CreateVaccinationRequest(
          "HPV", 3, "2026-06-05", null, null);

      when(catalogProperties.vaccineSeries()).thenReturn(defaultVaccineSeries());

      when(vaccinationRepository.save(any(Vaccination.class))).thenAnswer(invocation -> {
        Vaccination saved = invocation.getArgument(0);
        saved.setId(VAX_ID);
        saved.setCreatedAt(OffsetDateTime.now());
        return saved;
      });

      vaccinationService.create(jwt, request);

      // No reminder created — series is complete
      verify(reminderRepository, never()).save(any());
    }

    @Test
    @DisplayName("should calculate next dose date from catalog doseIntervalsDays")
    void create_shouldCalculateNextDoseDateFromCatalog() {
      Jwt jwt = mockJwt();

      // HPV dose 1 on Jan 5 → next dose reminder at Jan 5 + 60 days = March 6
      CreateVaccinationRequest request = new CreateVaccinationRequest(
          "HPV", 1, "2026-01-05", null, null);

      when(catalogProperties.vaccineSeries()).thenReturn(defaultVaccineSeries());
      when(encryptionService.encryptToBytes("HPV Dose 2")).thenReturn(ENCRYPTED_TITLE);

      when(vaccinationRepository.save(any(Vaccination.class))).thenAnswer(invocation -> {
        Vaccination saved = invocation.getArgument(0);
        saved.setId(VAX_ID);
        saved.setCreatedAt(OffsetDateTime.now());
        return saved;
      });

      when(reminderRepository.save(any(Reminder.class))).thenAnswer(i -> {
        Reminder r = i.getArgument(0);
        r.setId(UUID.randomUUID());
        return r;
      });

      vaccinationService.create(jwt, request);

      ArgumentCaptor<Reminder> captor = ArgumentCaptor.forClass(Reminder.class);
      verify(reminderRepository).save(captor.capture());
      Reminder reminder = captor.getValue();

      // Jan 5 + 60 days = March 6, 2026
      LocalDate expectedDate = LocalDate.of(2026, 1, 5).plusDays(60);
      assertThat(reminder.getScheduledFor().toLocalDate()).isEqualTo(expectedDate);
    }

    @Test
    @DisplayName("should throw when vaccine type not in catalog")
    void create_shouldThrowWhenVaccineTypeNotInCatalog() {
      Jwt jwt = mockJwt();

      CreateVaccinationRequest request = new CreateVaccinationRequest(
          "UNKNOWN_VACCINE", 1, "2026-03-01", null, null);

      when(catalogProperties.vaccineSeries()).thenReturn(defaultVaccineSeries());

      assertThatThrownBy(() -> vaccinationService.create(jwt, request))
          .isInstanceOf(IllegalArgumentException.class);
    }
  }

  @Nested
  @DisplayName("listSeries")
  class ListSeries {

    @Test
    @DisplayName("should group vaccinations by vaccine type with completion status")
    void listSeries_shouldGroupByVaccineTypeWithCompletionStatus() {
      Jwt jwt = mockJwt();

      Vaccination hpvDose1 = buildVaccination(UUID.randomUUID(), USER_HASH, "HPV", 1, 3,
          LocalDate.of(2026, 1, 5));
      Vaccination hpvDose2 = buildVaccination(UUID.randomUUID(), USER_HASH, "HPV", 2, 3,
          LocalDate.of(2026, 3, 6));
      Vaccination mpoxDose1 = buildVaccination(UUID.randomUUID(), USER_HASH, "MPOX", 1, 2,
          LocalDate.of(2026, 2, 1));

      when(vaccinationRepository.findByUserHashOrderByVaccineTypeAscDoseNumberAsc(USER_HASH))
          .thenReturn(List.of(hpvDose1, hpvDose2, mpoxDose1));

      when(catalogProperties.vaccineSeries()).thenReturn(defaultVaccineSeries());

      stubDecryption();

      List<VaccineSeriesResponse> result = vaccinationService.listSeries(jwt);

      assertThat(result).hasSize(2);

      // HPV series: 2 of 3 done
      VaccineSeriesResponse hpv = result.stream()
          .filter(s -> s.vaccineType().equals("HPV"))
          .findFirst().orElseThrow();
      assertThat(hpv.completedDoses()).isEqualTo(2);
      assertThat(hpv.totalDoses()).isEqualTo(3);
      assertThat(hpv.complete()).isFalse();
      assertThat(hpv.doses()).hasSize(2);

      // MPOX series: 1 of 2 done
      VaccineSeriesResponse mpox = result.stream()
          .filter(s -> s.vaccineType().equals("MPOX"))
          .findFirst().orElseThrow();
      assertThat(mpox.completedDoses()).isEqualTo(1);
      assertThat(mpox.totalDoses()).isEqualTo(2);
      assertThat(mpox.complete()).isFalse();
    }

    @Test
    @DisplayName("should mark series as complete when completedDoses == totalDoses")
    void listSeries_shouldMarkSeriesCompleteWhenAllDosesDone() {
      Jwt jwt = mockJwt();

      Vaccination mpoxDose1 = buildVaccination(UUID.randomUUID(), USER_HASH, "MPOX", 1, 2,
          LocalDate.of(2026, 1, 10));
      Vaccination mpoxDose2 = buildVaccination(UUID.randomUUID(), USER_HASH, "MPOX", 2, 2,
          LocalDate.of(2026, 2, 7));

      when(vaccinationRepository.findByUserHashOrderByVaccineTypeAscDoseNumberAsc(USER_HASH))
          .thenReturn(List.of(mpoxDose1, mpoxDose2));

      when(catalogProperties.vaccineSeries()).thenReturn(defaultVaccineSeries());

      stubDecryption();

      List<VaccineSeriesResponse> result = vaccinationService.listSeries(jwt);

      assertThat(result).hasSize(1);
      VaccineSeriesResponse mpox = result.getFirst();
      assertThat(mpox.complete()).isTrue();
      assertThat(mpox.completedDoses()).isEqualTo(2);
      assertThat(mpox.totalDoses()).isEqualTo(2);
      assertThat(mpox.nextDoseDate()).isNull();
    }

    @Test
    @DisplayName("should calculate nextDoseDate for incomplete series")
    void listSeries_shouldCalculateNextDoseDateForIncompleteSeries() {
      Jwt jwt = mockJwt();

      // HPV dose 1 on Jan 5 → next dose at +60 days = March 6
      Vaccination hpvDose1 = buildVaccination(UUID.randomUUID(), USER_HASH, "HPV", 1, 3,
          LocalDate.of(2026, 1, 5));

      when(vaccinationRepository.findByUserHashOrderByVaccineTypeAscDoseNumberAsc(USER_HASH))
          .thenReturn(List.of(hpvDose1));

      when(catalogProperties.vaccineSeries()).thenReturn(defaultVaccineSeries());

      stubDecryption();

      List<VaccineSeriesResponse> result = vaccinationService.listSeries(jwt);

      assertThat(result).hasSize(1);
      VaccineSeriesResponse hpv = result.getFirst();
      assertThat(hpv.complete()).isFalse();

      // Last dose is dose 1 (Jan 5). Next dose interval is doseIntervalsDays[1] = 60.
      // Next dose date = Jan 5 + 60 = March 6
      LocalDate expectedNext = LocalDate.of(2026, 1, 5).plusDays(60);
      assertThat(hpv.nextDoseDate()).isEqualTo(expectedNext.toString());
    }
  }

  @Nested
  @DisplayName("update")
  class UpdateDose {

    @Test
    @DisplayName("should update dose fields and recalculate reminders")
    void update_shouldUpdateFieldsAndRecalculateReminders() {
      Jwt jwt = mockJwt();

      Vaccination existing = buildVaccination(VAX_ID, USER_HASH, "HPV", 1, 3,
          LocalDate.of(2026, 1, 5));

      when(vaccinationRepository.findById(VAX_ID)).thenReturn(Optional.of(existing));
      when(catalogProperties.vaccineSeries()).thenReturn(defaultVaccineSeries());

      byte[] newLocationEncrypted = new byte[]{20, 21, 22};
      when(encryptionService.encryptToBytes("New Clinic")).thenReturn(newLocationEncrypted);
      when(encryptionService.encryptToBytes("HPV Dose 2")).thenReturn(ENCRYPTED_TITLE);

      UpdateVaccinationRequest request = new UpdateVaccinationRequest(
          null, null, "2026-01-10", "New Clinic", null);

      when(vaccinationRepository.save(any(Vaccination.class))).thenAnswer(i -> i.getArgument(0));
      when(reminderRepository.save(any(Reminder.class))).thenAnswer(i -> {
        Reminder r = i.getArgument(0);
        r.setId(UUID.randomUUID());
        return r;
      });

      // Decryption for toResponse
      when(encryptionService.decryptFromBytes(newLocationEncrypted)).thenReturn("New Clinic");
      when(encryptionService.decryptFromBytes(ENCRYPTED_NOTES)).thenReturn("No side effects");

      VaccinationResponse response = vaccinationService.update(jwt, VAX_ID, request);

      // Verify fields were updated
      assertThat(existing.getAdministeredDate()).isEqualTo(LocalDate.of(2026, 1, 10));
      assertThat(existing.getLocationEncrypted()).isEqualTo(newLocationEncrypted);

      // Verify old reminders deleted and new one created
      verify(reminderRepository).deleteByReferenceId(VAX_ID);
      verify(reminderRepository).save(any(Reminder.class));

      assertThat(response.location()).isEqualTo("New Clinic");
    }

    @Test
    @DisplayName("should throw for dose not owned by user")
    void update_shouldThrowForNotOwner() {
      Jwt jwt = mockJwt();

      Vaccination other = buildVaccination(VAX_ID, "other_hash", "HPV", 1, 3,
          LocalDate.of(2026, 1, 5));
      when(vaccinationRepository.findById(VAX_ID)).thenReturn(Optional.of(other));

      UpdateVaccinationRequest request = new UpdateVaccinationRequest(
          null, null, null, "New Clinic", null);

      assertThatThrownBy(() -> vaccinationService.update(jwt, VAX_ID, request))
          .isInstanceOf(IllegalStateException.class)
          .hasMessage("vaccination.error.notOwner");
    }
  }

  @Nested
  @DisplayName("delete")
  class DeleteDose {

    @Test
    @DisplayName("should delete dose and clean up linked reminders")
    void delete_shouldDeleteDoseAndCleanUpReminders() {
      Jwt jwt = mockJwt();

      Vaccination existing = buildVaccination(VAX_ID, USER_HASH, "HPV", 1, 3,
          LocalDate.of(2026, 1, 5));

      when(vaccinationRepository.findById(VAX_ID)).thenReturn(Optional.of(existing));

      vaccinationService.delete(jwt, VAX_ID);

      // Verify entity was deleted
      verify(vaccinationRepository).delete(existing);

      // Verify linked reminders were cleaned up
      verify(reminderRepository).deleteByReferenceId(VAX_ID);
    }

    @Test
    @DisplayName("should throw for dose not owned by user")
    void delete_shouldThrowForNotOwner() {
      Jwt jwt = mockJwt();

      Vaccination other = buildVaccination(VAX_ID, "other_hash", "MPOX", 1, 2,
          LocalDate.of(2026, 2, 1));
      when(vaccinationRepository.findById(VAX_ID)).thenReturn(Optional.of(other));

      assertThatThrownBy(() -> vaccinationService.delete(jwt, VAX_ID))
          .isInstanceOf(IllegalStateException.class)
          .hasMessage("vaccination.error.notOwner");
    }
  }
}
