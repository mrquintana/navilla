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
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import app.navilla.entity.ConnectionPhoneEntry;
import app.navilla.repository.ConnectionPhoneEntryRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * Unit tests for {@link PhoneMatchJob}.
 *
 * @author Navilla Team
 * @since 2026-03-04
 */
@ExtendWith(MockitoExtension.class)
class PhoneMatchJobTest {

  @Mock
  private PhoneMatchService phoneMatchService;

  @Mock
  private PhoneNotificationMatchService notificationMatchService;

  @Mock
  private ConnectionPhoneEntryRepository phoneEntryRepository;

  @InjectMocks
  private PhoneMatchJob phoneMatchJob;

  @Test
  @DisplayName("processUnmatchedEntries runs without error on empty entries")
  void processUnmatchedEntries_emptyEntries_noError() {
    when(phoneEntryRepository.findByMatchedFalse()).thenReturn(List.of());

    phoneMatchJob.processUnmatchedEntries();

    verify(phoneMatchService, never()).checkAndCreateMutualMatch(any(), any(), any());
    verify(notificationMatchService, never()).processOneSidedEntry(any());
  }

  @Test
  @DisplayName("processUnmatchedEntries processes entries and delegates unmatched to notification")
  void processUnmatchedEntries_processesEntries() {
    UUID entryId = UUID.randomUUID();
    ConnectionPhoneEntry entry = ConnectionPhoneEntry.builder()
        .id(entryId)
        .userHash("user-hash")
        .phoneHash("phone-hash")
        .encounterDate(LocalDate.of(2026, 3, 1))
        .matched(false)
        .build();

    when(phoneEntryRepository.findByMatchedFalse()).thenReturn(List.of(entry));

    // After checkAndCreateMutualMatch, the entry is still unmatched
    ConnectionPhoneEntry stillUnmatched = ConnectionPhoneEntry.builder()
        .id(entryId)
        .userHash("user-hash")
        .phoneHash("phone-hash")
        .encounterDate(LocalDate.of(2026, 3, 1))
        .matched(false)
        .build();
    when(phoneEntryRepository.findById(entryId)).thenReturn(Optional.of(stillUnmatched));

    phoneMatchJob.processUnmatchedEntries();

    verify(phoneMatchService).checkAndCreateMutualMatch(
        "user-hash", "phone-hash", LocalDate.of(2026, 3, 1));
    verify(notificationMatchService).processOneSidedEntry(stillUnmatched);
  }

  @Test
  @DisplayName("processUnmatchedEntries skips notification for matched entries")
  void processUnmatchedEntries_matchedEntry_skipsNotification() {
    UUID entryId = UUID.randomUUID();
    ConnectionPhoneEntry entry = ConnectionPhoneEntry.builder()
        .id(entryId)
        .userHash("user-hash")
        .phoneHash("phone-hash")
        .encounterDate(LocalDate.of(2026, 3, 1))
        .matched(false)
        .build();

    when(phoneEntryRepository.findByMatchedFalse()).thenReturn(List.of(entry));

    // After checkAndCreateMutualMatch, the entry IS matched
    ConnectionPhoneEntry nowMatched = ConnectionPhoneEntry.builder()
        .id(entryId)
        .userHash("user-hash")
        .phoneHash("phone-hash")
        .encounterDate(LocalDate.of(2026, 3, 1))
        .matched(true)
        .build();
    when(phoneEntryRepository.findById(entryId)).thenReturn(Optional.of(nowMatched));

    phoneMatchJob.processUnmatchedEntries();

    verify(phoneMatchService).checkAndCreateMutualMatch(
        "user-hash", "phone-hash", LocalDate.of(2026, 3, 1));
    // Should NOT delegate to notification service since it was matched
    verify(notificationMatchService, never()).processOneSidedEntry(any());
  }
}
