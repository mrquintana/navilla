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
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import app.navilla.dto.CreateVerificationCardRequest;
import app.navilla.dto.PublicVerificationCardResponse;
import app.navilla.dto.UpdateVerificationCardRequest;
import app.navilla.dto.VerificationCardResponse;
import app.navilla.entity.HealthStatus;
import app.navilla.entity.HealthStatusValue;
import app.navilla.entity.VerificationCard;
import app.navilla.repository.HealthStatusRepository;
import app.navilla.repository.VerificationCardRepository;
import app.navilla.security.EncryptionService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

/**
 * Unit tests for {@link VerificationCardService}.
 *
 * @author Navilla Team
 * @since 2026-03-10
 */
@ExtendWith(MockitoExtension.class)
class VerificationCardServiceTest {

  @Mock
  private VerificationCardRepository verificationCardRepository;

  @Mock
  private HealthStatusRepository healthStatusRepository;

  @Mock
  private EncryptionService encryptionService;

  @InjectMocks
  private VerificationCardService verificationCardService;

  private static final String USER_HASH = "hashed-user-email";
  private static final String OTHER_USER_HASH = "hashed-other-user";

  @Nested
  @DisplayName("createCard")
  class CreateCardTests {

    @Test
    @DisplayName("generates a unique 64-character hex share token")
    void createCard_generatesUniqueShareToken() {
      CreateVerificationCardRequest req = new CreateVerificationCardRequest(
          "Test User", List.of("hiv", "chlamydia"), true, true, null, null);

      when(encryptionService.encryptToBytes(anyString())).thenReturn(new byte[]{1, 2, 3});
      when(verificationCardRepository.save(any(VerificationCard.class)))
          .thenAnswer(invocation -> {
            VerificationCard card = invocation.getArgument(0);
            card.setId(UUID.randomUUID());
            card.setCreatedAt(OffsetDateTime.now());
            card.setUpdatedAt(OffsetDateTime.now());
            return card;
          });
      when(encryptionService.decryptFromBytes(any(byte[].class))).thenReturn("Test User");

      ReflectionTestUtils.setField(verificationCardService, "appBaseUrl", "https://navilla.app");

      VerificationCardResponse response = verificationCardService.createCard(USER_HASH, req);

      assertThat(response.shareToken()).hasSize(64);
      assertThat(response.shareToken()).matches("[0-9a-f]{64}");
    }

    @Test
    @DisplayName("encrypts display name via encryptionService")
    void createCard_encryptsDisplayName() {
      CreateVerificationCardRequest req = new CreateVerificationCardRequest(
          "My Name", List.of("hiv"), false, true, null, null);

      when(encryptionService.encryptToBytes("My Name")).thenReturn(new byte[]{10, 20, 30});
      when(verificationCardRepository.save(any(VerificationCard.class)))
          .thenAnswer(invocation -> {
            VerificationCard card = invocation.getArgument(0);
            card.setId(UUID.randomUUID());
            card.setCreatedAt(OffsetDateTime.now());
            card.setUpdatedAt(OffsetDateTime.now());
            return card;
          });
      when(encryptionService.decryptFromBytes(any(byte[].class))).thenReturn("My Name");

      ReflectionTestUtils.setField(verificationCardService, "appBaseUrl", "https://navilla.app");

      verificationCardService.createCard(USER_HASH, req);

      verify(encryptionService).encryptToBytes("My Name");

      ArgumentCaptor<VerificationCard> captor = ArgumentCaptor.forClass(VerificationCard.class);
      verify(verificationCardRepository).save(captor.capture());
      assertThat(captor.getValue().getDisplayNameEncrypted()).isEqualTo(new byte[]{10, 20, 30});
    }

    @Test
    @DisplayName("null display name does not trigger encryption")
    void createCard_withoutDisplayName_noEncryption_null() {
      CreateVerificationCardRequest req = new CreateVerificationCardRequest(
          null, List.of("hiv"), false, true, null, null);

      when(verificationCardRepository.save(any(VerificationCard.class)))
          .thenAnswer(invocation -> {
            VerificationCard card = invocation.getArgument(0);
            card.setId(UUID.randomUUID());
            card.setCreatedAt(OffsetDateTime.now());
            card.setUpdatedAt(OffsetDateTime.now());
            return card;
          });

      ReflectionTestUtils.setField(verificationCardService, "appBaseUrl", "https://navilla.app");

      verificationCardService.createCard(USER_HASH, req);

      verify(encryptionService, never()).encryptToBytes(anyString());

      ArgumentCaptor<VerificationCard> captor = ArgumentCaptor.forClass(VerificationCard.class);
      verify(verificationCardRepository).save(captor.capture());
      assertThat(captor.getValue().getDisplayNameEncrypted()).isNull();
    }

    @Test
    @DisplayName("blank display name does not trigger encryption")
    void createCard_withoutDisplayName_noEncryption_blank() {
      CreateVerificationCardRequest req = new CreateVerificationCardRequest(
          "   ", List.of("hiv"), false, true, null, null);

      when(verificationCardRepository.save(any(VerificationCard.class)))
          .thenAnswer(invocation -> {
            VerificationCard card = invocation.getArgument(0);
            card.setId(UUID.randomUUID());
            card.setCreatedAt(OffsetDateTime.now());
            card.setUpdatedAt(OffsetDateTime.now());
            return card;
          });

      ReflectionTestUtils.setField(verificationCardService, "appBaseUrl", "https://navilla.app");

      verificationCardService.createCard(USER_HASH, req);

      verify(encryptionService, never()).encryptToBytes(anyString());

      ArgumentCaptor<VerificationCard> captor = ArgumentCaptor.forClass(VerificationCard.class);
      verify(verificationCardRepository).save(captor.capture());
      assertThat(captor.getValue().getDisplayNameEncrypted()).isNull();
    }
  }

  @Nested
  @DisplayName("getUserCards")
  class GetUserCardsTests {

    @Test
    @DisplayName("returns decrypted display names")
    void getUserCards_returnsDecryptedNames() {
      VerificationCard card1 = VerificationCard.builder()
          .id(UUID.randomUUID())
          .userHash(USER_HASH)
          .displayNameEncrypted(new byte[]{1, 2, 3})
          .includedConditions(new String[]{"hiv"})
          .showTestDates(false)
          .showVerificationLevel(true)
          .shareToken("abc123")
          .privacyMode("PRIVATE")
          .currentViews(0)
          .createdAt(OffsetDateTime.now())
          .updatedAt(OffsetDateTime.now())
          .build();

      VerificationCard card2 = VerificationCard.builder()
          .id(UUID.randomUUID())
          .userHash(USER_HASH)
          .displayNameEncrypted(new byte[]{4, 5, 6})
          .includedConditions(new String[]{"chlamydia"})
          .showTestDates(true)
          .showVerificationLevel(false)
          .shareToken("def456")
          .privacyMode("PUBLIC")
          .currentViews(5)
          .createdAt(OffsetDateTime.now())
          .updatedAt(OffsetDateTime.now())
          .build();

      when(verificationCardRepository.findByUserHashOrderByCreatedAtDesc(USER_HASH))
          .thenReturn(List.of(card1, card2));
      when(encryptionService.decryptFromBytes(new byte[]{1, 2, 3})).thenReturn("Alice");
      when(encryptionService.decryptFromBytes(new byte[]{4, 5, 6})).thenReturn("Bob");

      ReflectionTestUtils.setField(verificationCardService, "appBaseUrl", "https://navilla.app");

      List<VerificationCardResponse> results = verificationCardService.getUserCards(USER_HASH);

      assertThat(results).hasSize(2);
      assertThat(results.get(0).displayName()).isEqualTo("Alice");
      assertThat(results.get(1).displayName()).isEqualTo("Bob");
    }

    @Test
    @DisplayName("returns empty list when user has no cards")
    void getUserCards_emptyList() {
      when(verificationCardRepository.findByUserHashOrderByCreatedAtDesc(USER_HASH))
          .thenReturn(List.of());

      List<VerificationCardResponse> results = verificationCardService.getUserCards(USER_HASH);

      assertThat(results).isEmpty();
    }
  }

  @Nested
  @DisplayName("updateCard")
  class UpdateCardTests {

    @Test
    @DisplayName("updates fields when card belongs to user")
    void updateCard_updatesFields() {
      UUID cardId = UUID.randomUUID();
      VerificationCard existing = VerificationCard.builder()
          .id(cardId)
          .userHash(USER_HASH)
          .displayNameEncrypted(new byte[]{1, 2, 3})
          .includedConditions(new String[]{"hiv"})
          .showTestDates(false)
          .showVerificationLevel(true)
          .shareToken("token123")
          .privacyMode("PRIVATE")
          .currentViews(0)
          .createdAt(OffsetDateTime.now())
          .updatedAt(OffsetDateTime.now())
          .build();

      UpdateVerificationCardRequest req = new UpdateVerificationCardRequest(
          "Updated Name", List.of("hiv", "chlamydia"), true, false, "PUBLIC", 10,
          OffsetDateTime.now().plusDays(7));

      when(verificationCardRepository.findByIdAndUserHash(cardId, USER_HASH))
          .thenReturn(Optional.of(existing));
      when(encryptionService.encryptToBytes("Updated Name")).thenReturn(new byte[]{7, 8, 9});
      when(verificationCardRepository.save(any(VerificationCard.class)))
          .thenAnswer(invocation -> invocation.getArgument(0));
      when(encryptionService.decryptFromBytes(new byte[]{7, 8, 9})).thenReturn("Updated Name");

      ReflectionTestUtils.setField(verificationCardService, "appBaseUrl", "https://navilla.app");

      VerificationCardResponse response = verificationCardService.updateCard(
          USER_HASH, cardId.toString(), req);

      assertThat(response.displayName()).isEqualTo("Updated Name");
      assertThat(response.includedConditions()).containsExactly("hiv", "chlamydia");
      assertThat(response.showTestDates()).isTrue();
      assertThat(response.showVerificationLevel()).isFalse();
      assertThat(response.privacyMode()).isEqualTo("PUBLIC");
      assertThat(response.maxViews()).isEqualTo(10);
    }

    @Test
    @DisplayName("throws exception when card does not belong to user")
    void updateCard_wrongUser_throwsException() {
      UUID cardId = UUID.randomUUID();

      when(verificationCardRepository.findByIdAndUserHash(cardId, USER_HASH))
          .thenReturn(Optional.empty());

      UpdateVerificationCardRequest req = new UpdateVerificationCardRequest(
          "Name", null, null, null, null, null, null);

      assertThatThrownBy(() ->
          verificationCardService.updateCard(USER_HASH, cardId.toString(), req))
          .isInstanceOf(IllegalArgumentException.class)
          .hasMessage("Card not found");
    }
  }

  @Nested
  @DisplayName("deleteCard")
  class DeleteCardTests {

    @Test
    @DisplayName("deletes card when it belongs to user")
    void deleteCard_removesCard() {
      UUID cardId = UUID.randomUUID();
      VerificationCard existing = VerificationCard.builder()
          .id(cardId)
          .userHash(USER_HASH)
          .includedConditions(new String[]{})
          .shareToken("token")
          .build();

      when(verificationCardRepository.findByIdAndUserHash(cardId, USER_HASH))
          .thenReturn(Optional.of(existing));

      verificationCardService.deleteCard(USER_HASH, cardId.toString());

      verify(verificationCardRepository).delete(existing);
    }

    @Test
    @DisplayName("throws exception when card does not belong to user")
    void deleteCard_wrongUser_throwsException() {
      UUID cardId = UUID.randomUUID();

      when(verificationCardRepository.findByIdAndUserHash(cardId, USER_HASH))
          .thenReturn(Optional.empty());

      assertThatThrownBy(() ->
          verificationCardService.deleteCard(USER_HASH, cardId.toString()))
          .isInstanceOf(IllegalArgumentException.class)
          .hasMessage("Card not found");
    }
  }

  @Nested
  @DisplayName("getPublicCard")
  class GetPublicCardTests {

    private VerificationCard buildCard(String shareToken, String userHash) {
      return VerificationCard.builder()
          .id(UUID.randomUUID())
          .userHash(userHash)
          .displayNameEncrypted(new byte[]{1, 2, 3})
          .includedConditions(new String[]{"hiv", "chlamydia"})
          .showTestDates(true)
          .showVerificationLevel(true)
          .shareToken(shareToken)
          .privacyMode("PUBLIC")
          .currentViews(0)
          .createdAt(OffsetDateTime.now())
          .updatedAt(OffsetDateTime.now())
          .build();
    }

    @Test
    @DisplayName("valid token returns public card with conditions")
    void getPublicCard_validToken_returnsCard() {
      VerificationCard card = buildCard("valid-token", USER_HASH);

      when(verificationCardRepository.findByShareToken("valid-token"))
          .thenReturn(Optional.of(card));
      when(encryptionService.decryptFromBytes(any(byte[].class))).thenReturn("Public User");

      HealthStatus hs = HealthStatus.builder()
          .userHash(USER_HASH)
          .conditionType("hiv")
          .status(HealthStatusValue.POSITIVE)
          .verified(true)
          .testDate(LocalDate.of(2026, 1, 15))
          .build();
      when(healthStatusRepository.findByUserHashOrderByReportedAtDesc(USER_HASH))
          .thenReturn(List.of(hs));
      when(verificationCardRepository.save(any(VerificationCard.class)))
          .thenAnswer(invocation -> invocation.getArgument(0));

      PublicVerificationCardResponse response =
          verificationCardService.getPublicCard("valid-token");

      assertThat(response.displayName()).isEqualTo("Public User");
      assertThat(response.conditions()).hasSize(1);
      assertThat(response.conditions().get(0).condition()).isEqualTo("hiv");
      assertThat(response.conditions().get(0).status()).isEqualTo("POSITIVE");
      assertThat(response.conditions().get(0).verificationLevel()).isEqualTo("LAB_VERIFIED");
      assertThat(response.conditions().get(0).testDate()).isEqualTo("2026-01-15");
    }

    @Test
    @DisplayName("view count increments on each access")
    void getPublicCard_incrementsViewCount() {
      VerificationCard card = buildCard("view-token", USER_HASH);
      card.setCurrentViews(5);
      card.setMaxViews(100);

      when(verificationCardRepository.findByShareToken("view-token"))
          .thenReturn(Optional.of(card));
      when(encryptionService.decryptFromBytes(any(byte[].class))).thenReturn("User");
      when(healthStatusRepository.findByUserHashOrderByReportedAtDesc(USER_HASH))
          .thenReturn(List.of());

      ArgumentCaptor<VerificationCard> captor = ArgumentCaptor.forClass(VerificationCard.class);
      when(verificationCardRepository.save(captor.capture()))
          .thenAnswer(invocation -> invocation.getArgument(0));

      verificationCardService.getPublicCard("view-token");

      assertThat(captor.getValue().getCurrentViews()).isEqualTo(6);
    }

    @Test
    @DisplayName("expired card throws IllegalStateException")
    void getPublicCard_expiredCard_throwsException() {
      VerificationCard card = buildCard("expired-token", USER_HASH);
      card.setExpiresAt(OffsetDateTime.now().minusDays(1));

      when(verificationCardRepository.findByShareToken("expired-token"))
          .thenReturn(Optional.of(card));

      assertThatThrownBy(() ->
          verificationCardService.getPublicCard("expired-token"))
          .isInstanceOf(IllegalStateException.class)
          .hasMessage("Card has expired");
    }

    @Test
    @DisplayName("view limit reached throws IllegalStateException")
    void getPublicCard_viewLimitReached_throwsException() {
      VerificationCard card = buildCard("limited-token", USER_HASH);
      card.setMaxViews(10);
      card.setCurrentViews(10);

      when(verificationCardRepository.findByShareToken("limited-token"))
          .thenReturn(Optional.of(card));

      assertThatThrownBy(() ->
          verificationCardService.getPublicCard("limited-token"))
          .isInstanceOf(IllegalStateException.class)
          .hasMessage("Card view limit reached");
    }

    @Test
    @DisplayName("conditions are joined from HealthStatus records")
    void getPublicCard_joinsHealthStatuses() {
      VerificationCard card = buildCard("join-token", USER_HASH);
      card.setIncludedConditions(new String[]{"hiv", "chlamydia", "gonorrhea"});

      when(verificationCardRepository.findByShareToken("join-token"))
          .thenReturn(Optional.of(card));
      when(encryptionService.decryptFromBytes(any(byte[].class))).thenReturn("User");

      HealthStatus hiv = HealthStatus.builder()
          .userHash(USER_HASH)
          .conditionType("hiv")
          .status(HealthStatusValue.NEGATIVE)
          .verified(true)
          .testDate(LocalDate.of(2026, 2, 1))
          .build();
      HealthStatus chlamydia = HealthStatus.builder()
          .userHash(USER_HASH)
          .conditionType("chlamydia")
          .status(HealthStatusValue.POSITIVE)
          .verified(false)
          .testDate(LocalDate.of(2026, 1, 20))
          .build();
      HealthStatus syphilis = HealthStatus.builder()
          .userHash(USER_HASH)
          .conditionType("syphilis")
          .status(HealthStatusValue.NEGATIVE)
          .verified(true)
          .testDate(LocalDate.of(2026, 1, 10))
          .build();

      when(healthStatusRepository.findByUserHashOrderByReportedAtDesc(USER_HASH))
          .thenReturn(List.of(hiv, chlamydia, syphilis));
      when(verificationCardRepository.save(any(VerificationCard.class)))
          .thenAnswer(invocation -> invocation.getArgument(0));

      PublicVerificationCardResponse response =
          verificationCardService.getPublicCard("join-token");

      // Only hiv and chlamydia match included conditions; syphilis is excluded
      assertThat(response.conditions()).hasSize(2);
      assertThat(response.conditions())
          .extracting(PublicVerificationCardResponse.PublicConditionStatus::condition)
          .containsExactlyInAnyOrder("hiv", "chlamydia");

      // Verify verification levels: hiv is verified → LAB_VERIFIED, chlamydia is not → SELF_REPORTED
      PublicVerificationCardResponse.PublicConditionStatus hivStatus = response.conditions()
          .stream().filter(c -> "hiv".equals(c.condition())).findFirst().orElseThrow();
      assertThat(hivStatus.verificationLevel()).isEqualTo("LAB_VERIFIED");
      assertThat(hivStatus.testDate()).isEqualTo("2026-02-01");

      PublicVerificationCardResponse.PublicConditionStatus chlamydiaStatus = response.conditions()
          .stream().filter(c -> "chlamydia".equals(c.condition())).findFirst().orElseThrow();
      assertThat(chlamydiaStatus.verificationLevel()).isEqualTo("SELF_REPORTED");
      assertThat(chlamydiaStatus.testDate()).isEqualTo("2026-01-20");
    }

    @Test
    @DisplayName("invalid token throws IllegalArgumentException")
    void getPublicCard_invalidToken_throwsException() {
      when(verificationCardRepository.findByShareToken("nonexistent"))
          .thenReturn(Optional.empty());

      assertThatThrownBy(() ->
          verificationCardService.getPublicCard("nonexistent"))
          .isInstanceOf(IllegalArgumentException.class)
          .hasMessage("Card not found");
    }

    @Test
    @DisplayName("card with null display name returns Anonymous")
    void getPublicCard_nullDisplayName_returnsAnonymous() {
      VerificationCard card = buildCard("anon-token", USER_HASH);
      card.setDisplayNameEncrypted(null);

      when(verificationCardRepository.findByShareToken("anon-token"))
          .thenReturn(Optional.of(card));
      when(healthStatusRepository.findByUserHashOrderByReportedAtDesc(USER_HASH))
          .thenReturn(List.of());
      when(verificationCardRepository.save(any(VerificationCard.class)))
          .thenAnswer(invocation -> invocation.getArgument(0));

      PublicVerificationCardResponse response =
          verificationCardService.getPublicCard("anon-token");

      assertThat(response.displayName()).isEqualTo("Anonymous");
    }
  }
}
