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
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import app.navilla.dto.CardVerificationResponse;
import app.navilla.dto.CreateVerificationCardRequest;
import app.navilla.dto.PublicVerificationCardResponse;
import app.navilla.dto.UpdateVerificationCardRequest;
import app.navilla.dto.VerificationCardResponse;
import app.navilla.entity.HealthStatus;
import app.navilla.entity.HealthStatusValue;
import app.navilla.entity.Lab;
import app.navilla.entity.TestVisit;
import app.navilla.entity.User;
import app.navilla.entity.VerificationCard;
import app.navilla.lab.LabProviderProperties;
import app.navilla.repository.HealthStatusRepository;
import app.navilla.repository.LabRepository;
import app.navilla.repository.TestVisitRepository;
import app.navilla.repository.UserRepository;
import app.navilla.repository.VerificationCardRepository;
import app.navilla.security.EncryptionService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
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

  @Mock
  private UserRepository userRepository;

  @Mock
  private TestVisitRepository testVisitRepository;

  @Mock
  private LabRepository labRepository;

  @Mock
  private LabProviderProperties labProviderProperties;

  @Mock
  private ResourceCapService resourceCapService;

  @InjectMocks
  private VerificationCardService verificationCardService;

  private static final String USER_HASH = "hashed-user-email";

  private User buildUser(String firstName, String lastName, String username) {
    User user = User.builder()
        .id(UUID.randomUUID())
        .emailHash(USER_HASH)
        .emailEncrypted(new byte[]{1})
        .username(username)
        .build();
    if (firstName != null) {
      user.setFirstNameEncrypted(new byte[]{10, 20});
    }
    if (lastName != null) {
      user.setLastNameEncrypted(new byte[]{30, 40});
    }
    return user;
  }

  private void setupUserMock(String firstName, String lastName, String username) {
    User user = buildUser(firstName, lastName, username);
    when(userRepository.findByEmailHash(USER_HASH)).thenReturn(Optional.of(user));
    if (firstName != null) {
      when(encryptionService.decryptFromBytes(user.getFirstNameEncrypted())).thenReturn(firstName);
    }
    if (lastName != null) {
      when(encryptionService.decryptFromBytes(user.getLastNameEncrypted())).thenReturn(lastName);
    }
  }

  @Nested
  @DisplayName("createCard")
  class CreateCardTests {

    @Test
    @DisplayName("generates a unique 64-character hex share token")
    void createCard_generatesUniqueShareToken() {
      setupUserMock("John", "Doe", "johndoe");

      CreateVerificationCardRequest req = new CreateVerificationCardRequest(
          List.of("hiv"), true, null, null);

      HealthStatus hs = HealthStatus.builder()
          .userHash(USER_HASH).conditionType("hiv")
          .status(HealthStatusValue.NEGATIVE).verified(true)
          .testDate(LocalDate.of(2026, 1, 15)).build();
      when(healthStatusRepository.findByUserHashOrderByReportedAtDesc(USER_HASH))
          .thenReturn(List.of(hs));
      when(encryptionService.encryptToBytes(anyString())).thenReturn(new byte[]{1, 2, 3});
      when(verificationCardRepository.save(any(VerificationCard.class)))
          .thenAnswer(invocation -> {
            VerificationCard card = invocation.getArgument(0);
            card.setId(UUID.randomUUID());
            card.setCreatedAt(OffsetDateTime.now());
            card.setUpdatedAt(OffsetDateTime.now());
            return card;
          });

      ReflectionTestUtils.setField(verificationCardService, "appBaseUrl", "https://www.navilla.app");

      VerificationCardResponse response = verificationCardService.createCard(USER_HASH, req);

      assertThat(response.shareToken()).hasSize(64);
      assertThat(response.shareToken()).matches("[0-9a-f]{64}");
    }

    @Test
    @DisplayName("auto-resolves display name from profile firstName + lastName")
    void createCard_autoResolvesDisplayName() {
      setupUserMock("Alice", "Smith", "alicesmith");

      CreateVerificationCardRequest req = new CreateVerificationCardRequest(
          List.of("hiv"), true, null, null);

      HealthStatus hs = HealthStatus.builder()
          .userHash(USER_HASH).conditionType("hiv")
          .status(HealthStatusValue.NEGATIVE).verified(true)
          .testDate(LocalDate.of(2026, 1, 15)).build();
      when(healthStatusRepository.findByUserHashOrderByReportedAtDesc(USER_HASH))
          .thenReturn(List.of(hs));
      when(encryptionService.encryptToBytes("Alice Smith")).thenReturn(new byte[]{10, 20, 30});
      when(encryptionService.decryptFromBytes(new byte[]{10, 20, 30})).thenReturn("Alice Smith");
      when(verificationCardRepository.save(any(VerificationCard.class)))
          .thenAnswer(invocation -> {
            VerificationCard card = invocation.getArgument(0);
            card.setId(UUID.randomUUID());
            card.setCreatedAt(OffsetDateTime.now());
            card.setUpdatedAt(OffsetDateTime.now());
            return card;
          });

      ReflectionTestUtils.setField(verificationCardService, "appBaseUrl", "https://www.navilla.app");

      VerificationCardResponse response = verificationCardService.createCard(USER_HASH, req);

      verify(encryptionService).encryptToBytes("Alice Smith");
      assertThat(response.displayName()).isEqualTo("Alice Smith");
      assertThat(response.username()).isEqualTo("alicesmith");
    }

    @Test
    @DisplayName("throws when user not found")
    void createCard_userNotFound_throws() {
      when(userRepository.findByEmailHash(USER_HASH)).thenReturn(Optional.empty());

      CreateVerificationCardRequest req = new CreateVerificationCardRequest(
          List.of("hiv"), true, null, null);

      assertThatThrownBy(() -> verificationCardService.createCard(USER_HASH, req))
          .isInstanceOf(IllegalStateException.class)
          .hasMessage("user.error.notFound");
    }

    @Test
    @DisplayName("throws when profile fields are incomplete")
    void createCard_incompleteProfile_throws() {
      // User with no firstName
      User user = buildUser(null, null, "johndoe");
      when(userRepository.findByEmailHash(USER_HASH)).thenReturn(Optional.of(user));

      CreateVerificationCardRequest req = new CreateVerificationCardRequest(
          List.of("hiv"), true, null, null);

      assertThatThrownBy(() -> verificationCardService.createCard(USER_HASH, req))
          .isInstanceOf(IllegalStateException.class)
          .hasMessage("card.error.incompleteProfile");
    }

    @Test
    @DisplayName("filters out non-verified conditions")
    void createCard_filtersNonVerifiedConditions() {
      // Inline user setup to avoid conflicting Mockito stubs
      User user = User.builder()
          .id(UUID.randomUUID())
          .emailHash(USER_HASH)
          .emailEncrypted(new byte[]{1})
          .firstNameEncrypted(new byte[]{10, 20})
          .lastNameEncrypted(new byte[]{30, 40})
          .username("johndoe")
          .build();
      when(userRepository.findByEmailHash(USER_HASH)).thenReturn(Optional.of(user));

      CreateVerificationCardRequest req = new CreateVerificationCardRequest(
          List.of("hiv", "chlamydia"), true, null, null);

      HealthStatus hivVerified = HealthStatus.builder()
          .userHash(USER_HASH).conditionType("hiv")
          .status(HealthStatusValue.NEGATIVE).verified(true)
          .testDate(LocalDate.of(2026, 1, 15)).build();
      HealthStatus chlamydiaSelfReported = HealthStatus.builder()
          .userHash(USER_HASH).conditionType("chlamydia")
          .status(HealthStatusValue.NEGATIVE).verified(false)
          .testDate(LocalDate.of(2026, 1, 10)).build();

      when(healthStatusRepository.findByUserHashOrderByReportedAtDesc(USER_HASH))
          .thenReturn(List.of(hivVerified, chlamydiaSelfReported));
      when(encryptionService.decryptFromBytes(new byte[]{10, 20})).thenReturn("John");
      when(encryptionService.decryptFromBytes(new byte[]{30, 40})).thenReturn("Doe");
      when(encryptionService.encryptToBytes("John Doe")).thenReturn(new byte[]{50, 60});
      when(encryptionService.decryptFromBytes(new byte[]{50, 60})).thenReturn("John Doe");
      when(verificationCardRepository.save(any(VerificationCard.class)))
          .thenAnswer(invocation -> {
            VerificationCard card = invocation.getArgument(0);
            card.setId(UUID.randomUUID());
            card.setCreatedAt(OffsetDateTime.now());
            card.setUpdatedAt(OffsetDateTime.now());
            return card;
          });

      ReflectionTestUtils.setField(verificationCardService, "appBaseUrl", "https://www.navilla.app");

      VerificationCardResponse response = verificationCardService.createCard(USER_HASH, req);

      // Only hiv should be included (verified=true + testDate), not chlamydia (verified=false)
      assertThat(response.includedConditions()).containsExactly("hiv");
    }
  }

  @Nested
  @DisplayName("getUserCards")
  class GetUserCardsTests {

    @Test
    @DisplayName("returns decrypted display names with username")
    void getUserCards_returnsDecryptedNamesWithUsername() {
      User user = buildUser("Alice", "Smith", "alicesmith");
      when(userRepository.findByEmailHash(USER_HASH)).thenReturn(Optional.of(user));

      VerificationCard card1 = VerificationCard.builder()
          .id(UUID.randomUUID())
          .userHash(USER_HASH)
          .displayNameEncrypted(new byte[]{1, 2, 3})
          .includedConditions(new String[]{"hiv"})
          .showTestDates(true)
          .showVerificationLevel(true)
          .shareToken("abc123")
          .privacyMode("PRIVATE")
          .currentViews(0)
          .createdAt(OffsetDateTime.now())
          .updatedAt(OffsetDateTime.now())
          .build();

      when(verificationCardRepository.findByUserHashOrderByCreatedAtDesc(USER_HASH))
          .thenReturn(List.of(card1));
      when(encryptionService.decryptFromBytes(new byte[]{1, 2, 3})).thenReturn("Alice Smith");

      ReflectionTestUtils.setField(verificationCardService, "appBaseUrl", "https://www.navilla.app");

      List<VerificationCardResponse> results = verificationCardService.getUserCards(USER_HASH);

      assertThat(results).hasSize(1);
      assertThat(results.get(0).displayName()).isEqualTo("Alice Smith");
      assertThat(results.get(0).username()).isEqualTo("alicesmith");
    }

    @Test
    @DisplayName("returns empty list when user has no cards")
    void getUserCards_emptyList() {
      when(userRepository.findByEmailHash(USER_HASH)).thenReturn(Optional.empty());
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
    @DisplayName("re-resolves name from profile and validates conditions")
    void updateCard_reResolvesNameAndValidatesConditions() {
      UUID cardId = UUID.randomUUID();
      VerificationCard existing = VerificationCard.builder()
          .id(cardId)
          .userHash(USER_HASH)
          .displayNameEncrypted(new byte[]{1, 2, 3})
          .includedConditions(new String[]{"hiv"})
          .showTestDates(true)
          .showVerificationLevel(true)
          .shareToken("token123")
          .privacyMode("PRIVATE")
          .currentViews(0)
          .createdAt(OffsetDateTime.now())
          .updatedAt(OffsetDateTime.now())
          .build();

      setupUserMock("Updated", "Name", "updatedname");

      UpdateVerificationCardRequest req = new UpdateVerificationCardRequest(
          List.of("hiv", "chlamydia"), false, "PUBLIC", 10,
          OffsetDateTime.now().plusDays(7));

      when(verificationCardRepository.findByIdAndUserHash(cardId, USER_HASH))
          .thenReturn(Optional.of(existing));

      HealthStatus hivVerified = HealthStatus.builder()
          .userHash(USER_HASH).conditionType("hiv")
          .status(HealthStatusValue.NEGATIVE).verified(true)
          .testDate(LocalDate.of(2026, 1, 15)).build();
      when(healthStatusRepository.findByUserHashOrderByReportedAtDesc(USER_HASH))
          .thenReturn(List.of(hivVerified));

      when(encryptionService.encryptToBytes("Updated Name")).thenReturn(new byte[]{7, 8, 9});
      when(verificationCardRepository.save(any(VerificationCard.class)))
          .thenAnswer(invocation -> invocation.getArgument(0));
      when(encryptionService.decryptFromBytes(new byte[]{7, 8, 9})).thenReturn("Updated Name");

      ReflectionTestUtils.setField(verificationCardService, "appBaseUrl", "https://www.navilla.app");

      VerificationCardResponse response = verificationCardService.updateCard(
          USER_HASH, cardId.toString(), req);

      assertThat(response.displayName()).isEqualTo("Updated Name");
      assertThat(response.username()).isEqualTo("updatedname");
      // Only hiv is verified, chlamydia gets filtered out
      assertThat(response.includedConditions()).containsExactly("hiv");
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
          null, null, null, null, null);

      assertThatThrownBy(() ->
          verificationCardService.updateCard(USER_HASH, cardId.toString(), req))
          .isInstanceOf(IllegalArgumentException.class)
          .hasMessage("card.error.notFound");
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
          .hasMessage("card.error.notFound");
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
    @DisplayName("valid token returns public card with verified conditions only")
    void getPublicCard_validToken_returnsVerifiedConditionsOnly() {
      VerificationCard card = buildCard("valid-token", USER_HASH);

      when(verificationCardRepository.findByShareToken("valid-token"))
          .thenReturn(Optional.of(card));
      when(encryptionService.decryptFromBytes(any(byte[].class))).thenReturn("Public User");
      when(userRepository.findByEmailHash(USER_HASH))
          .thenReturn(Optional.of(buildUser("Public", "User", "publicuser")));

      HealthStatus hivVerified = HealthStatus.builder()
          .userHash(USER_HASH)
          .conditionType("hiv")
          .status(HealthStatusValue.NEGATIVE)
          .verified(true)
          .testDate(LocalDate.of(2026, 1, 15))
          .build();
      HealthStatus chlamydiaNotVerified = HealthStatus.builder()
          .userHash(USER_HASH)
          .conditionType("chlamydia")
          .status(HealthStatusValue.NEGATIVE)
          .verified(false)
          .testDate(LocalDate.of(2026, 1, 10))
          .build();
      when(healthStatusRepository.findByUserHashOrderByReportedAtDesc(USER_HASH))
          .thenReturn(List.of(hivVerified, chlamydiaNotVerified));
      when(verificationCardRepository.incrementViewsIfAllowed(card.getId()))
          .thenReturn(1);

      PublicVerificationCardResponse response =
          verificationCardService.getPublicCard("valid-token");

      assertThat(response.displayName()).isEqualTo("Public User");
      assertThat(response.username()).isEqualTo("publicuser");
      // Only hiv (verified=true) should be present, chlamydia (verified=false) filtered out
      assertThat(response.conditions()).hasSize(1);
      assertThat(response.conditions().get(0).condition()).isEqualTo("hiv");
      assertThat(response.conditions().get(0).status()).isEqualTo("NEGATIVE");
      assertThat(response.conditions().get(0).verificationLevel()).isEqualTo("LAB_VERIFIED");
      assertThat(response.conditions().get(0).testDate()).isEqualTo("2026-01-15");
    }

    @Test
    @DisplayName("view count increments atomically on each access")
    void getPublicCard_incrementsViewCount() {
      VerificationCard card = buildCard("view-token", USER_HASH);
      card.setCurrentViews(5);
      card.setMaxViews(100);

      when(verificationCardRepository.findByShareToken("view-token"))
          .thenReturn(Optional.of(card));
      when(verificationCardRepository.incrementViewsIfAllowed(card.getId()))
          .thenReturn(1);
      when(encryptionService.decryptFromBytes(any(byte[].class))).thenReturn("User");
      when(userRepository.findByEmailHash(USER_HASH)).thenReturn(Optional.empty());
      when(healthStatusRepository.findByUserHashOrderByReportedAtDesc(USER_HASH))
          .thenReturn(List.of());

      verificationCardService.getPublicCard("view-token");

      verify(verificationCardRepository).incrementViewsIfAllowed(card.getId());
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
          .hasMessage("card.error.expired");
    }

    @Test
    @DisplayName("view limit reached throws IllegalStateException")
    void getPublicCard_viewLimitReached_throwsException() {
      VerificationCard card = buildCard("limited-token", USER_HASH);
      card.setMaxViews(10);
      card.setCurrentViews(10);

      when(verificationCardRepository.findByShareToken("limited-token"))
          .thenReturn(Optional.of(card));
      when(verificationCardRepository.incrementViewsIfAllowed(card.getId()))
          .thenReturn(0);

      assertThatThrownBy(() ->
          verificationCardService.getPublicCard("limited-token"))
          .isInstanceOf(IllegalStateException.class)
          .hasMessage("card.error.viewLimitReached");
    }

    @Test
    @DisplayName("only verified conditions with test dates are included")
    void getPublicCard_filtersToVerifiedWithTestDates() {
      VerificationCard card = buildCard("filter-token", USER_HASH);
      card.setIncludedConditions(new String[]{"hiv", "chlamydia", "gonorrhea"});

      when(verificationCardRepository.findByShareToken("filter-token"))
          .thenReturn(Optional.of(card));
      when(encryptionService.decryptFromBytes(any(byte[].class))).thenReturn("User");
      when(userRepository.findByEmailHash(USER_HASH)).thenReturn(Optional.empty());

      HealthStatus hivVerified = HealthStatus.builder()
          .userHash(USER_HASH).conditionType("hiv")
          .status(HealthStatusValue.NEGATIVE).verified(true)
          .testDate(LocalDate.of(2026, 2, 1)).build();
      HealthStatus chlamydiaNoTestDate = HealthStatus.builder()
          .userHash(USER_HASH).conditionType("chlamydia")
          .status(HealthStatusValue.POSITIVE).verified(true)
          .testDate(null).build();
      HealthStatus gonorrheaNotVerified = HealthStatus.builder()
          .userHash(USER_HASH).conditionType("gonorrhea")
          .status(HealthStatusValue.NEGATIVE).verified(false)
          .testDate(LocalDate.of(2026, 1, 10)).build();

      when(healthStatusRepository.findByUserHashOrderByReportedAtDesc(USER_HASH))
          .thenReturn(List.of(hivVerified, chlamydiaNoTestDate, gonorrheaNotVerified));
      when(verificationCardRepository.incrementViewsIfAllowed(card.getId()))
          .thenReturn(1);

      PublicVerificationCardResponse response =
          verificationCardService.getPublicCard("filter-token");

      // Only hiv: verified=true AND testDate!=null
      assertThat(response.conditions()).hasSize(1);
      assertThat(response.conditions().get(0).condition()).isEqualTo("hiv");
      assertThat(response.conditions().get(0).testDate()).isEqualTo("2026-02-01");
    }

    @Test
    @DisplayName("invalid token throws IllegalArgumentException")
    void getPublicCard_invalidToken_throwsException() {
      when(verificationCardRepository.findByShareToken("nonexistent"))
          .thenReturn(Optional.empty());

      assertThatThrownBy(() ->
          verificationCardService.getPublicCard("nonexistent"))
          .isInstanceOf(IllegalArgumentException.class)
          .hasMessage("card.error.notFound");
    }

    @Test
    @DisplayName("card with null display name returns Anonymous")
    void getPublicCard_nullDisplayName_returnsAnonymous() {
      VerificationCard card = buildCard("anon-token", USER_HASH);
      card.setDisplayNameEncrypted(null);

      when(verificationCardRepository.findByShareToken("anon-token"))
          .thenReturn(Optional.of(card));
      when(userRepository.findByEmailHash(USER_HASH)).thenReturn(Optional.empty());
      when(healthStatusRepository.findByUserHashOrderByReportedAtDesc(USER_HASH))
          .thenReturn(List.of());
      when(verificationCardRepository.incrementViewsIfAllowed(card.getId()))
          .thenReturn(1);

      PublicVerificationCardResponse response =
          verificationCardService.getPublicCard("anon-token");

      assertThat(response.displayName()).isEqualTo("Anonymous");
    }

    @Test
    @DisplayName("condition with visit + lab populates all provenance fields")
    void getPublicCard_conditionWithVisitAndLab_populatesProvenance() {
      UUID visitId = UUID.randomUUID();
      UUID labId = UUID.randomUUID();
      OffsetDateTime verifiedAt = OffsetDateTime.now();

      VerificationCard card = buildCard("provenance-token", USER_HASH);
      card.setIncludedConditions(new String[]{"hiv"});

      when(verificationCardRepository.findByShareToken("provenance-token"))
          .thenReturn(Optional.of(card));
      when(encryptionService.decryptFromBytes(any(byte[].class))).thenReturn("User");
      when(userRepository.findByEmailHash(USER_HASH)).thenReturn(Optional.empty());

      HealthStatus hivStatus = HealthStatus.builder()
          .userHash(USER_HASH).conditionType("hiv")
          .status(HealthStatusValue.NEGATIVE).verified(true)
          .testDate(LocalDate.of(2026, 3, 1)).visitId(visitId).build();
      when(healthStatusRepository.findByUserHashOrderByReportedAtDesc(USER_HASH))
          .thenReturn(List.of(hivStatus));

      TestVisit visit = TestVisit.builder()
          .id(visitId).userHash(USER_HASH).testDate(LocalDate.of(2026, 3, 1))
          .labId(labId).verified(true).verifiedAt(verifiedAt).build();
      when(testVisitRepository.findById(visitId)).thenReturn(Optional.of(visit));

      Lab lab = Lab.builder()
          .id(labId).userHash(USER_HASH).provider("MOCK_DEMO_MX")
          .nameEncrypted(new byte[]{50, 60}).build();
      when(labRepository.findById(labId)).thenReturn(Optional.of(lab));
      when(encryptionService.decryptFromBytes(new byte[]{50, 60})).thenReturn("Lab Demo MX");

      when(labProviderProperties.providers()).thenReturn(List.of(
          new LabProviderProperties.LabConfig(
              "MOCK_DEMO_MX", "Lab Demo MX", "Lab Demo MX", true,
              "http://localhost:8080", "https://www.labdemomx.com", List.of())
      ));

      when(verificationCardRepository.incrementViewsIfAllowed(card.getId()))
          .thenReturn(1);

      PublicVerificationCardResponse response =
          verificationCardService.getPublicCard("provenance-token");

      assertThat(response.conditions()).hasSize(1);
      PublicVerificationCardResponse.PublicConditionStatus condition = response.conditions().get(0);
      assertThat(condition.labName()).isEqualTo("Lab Demo MX");
      assertThat(condition.labProvider()).isEqualTo("MOCK_DEMO_MX");
      assertThat(condition.verifiedAt()).isEqualTo(verifiedAt.toString());
      assertThat(condition.labWebsiteUrl()).isEqualTo("https://www.labdemomx.com");
    }

    @Test
    @DisplayName("condition with visit but no lab returns only verifiedAt")
    void getPublicCard_conditionWithVisitNoLab_returnsOnlyVerifiedAt() {
      UUID visitId = UUID.randomUUID();
      OffsetDateTime verifiedAt = OffsetDateTime.now();

      VerificationCard card = buildCard("no-lab-token", USER_HASH);
      card.setIncludedConditions(new String[]{"hiv"});

      when(verificationCardRepository.findByShareToken("no-lab-token"))
          .thenReturn(Optional.of(card));
      when(encryptionService.decryptFromBytes(any(byte[].class))).thenReturn("User");
      when(userRepository.findByEmailHash(USER_HASH)).thenReturn(Optional.empty());

      HealthStatus hivStatus = HealthStatus.builder()
          .userHash(USER_HASH).conditionType("hiv")
          .status(HealthStatusValue.NEGATIVE).verified(true)
          .testDate(LocalDate.of(2026, 3, 1)).visitId(visitId).build();
      when(healthStatusRepository.findByUserHashOrderByReportedAtDesc(USER_HASH))
          .thenReturn(List.of(hivStatus));

      TestVisit visit = TestVisit.builder()
          .id(visitId).userHash(USER_HASH).testDate(LocalDate.of(2026, 3, 1))
          .verified(true).verifiedAt(verifiedAt).build();
      when(testVisitRepository.findById(visitId)).thenReturn(Optional.of(visit));

      when(verificationCardRepository.incrementViewsIfAllowed(card.getId()))
          .thenReturn(1);

      PublicVerificationCardResponse response =
          verificationCardService.getPublicCard("no-lab-token");

      assertThat(response.conditions()).hasSize(1);
      PublicVerificationCardResponse.PublicConditionStatus condition = response.conditions().get(0);
      assertThat(condition.labName()).isNull();
      assertThat(condition.labProvider()).isNull();
      assertThat(condition.verifiedAt()).isEqualTo(verifiedAt.toString());
      assertThat(condition.labWebsiteUrl()).isNull();
    }

    @Test
    @DisplayName("condition without visitId returns null provenance fields")
    void getPublicCard_conditionWithoutVisitId_nullProvenance() {
      VerificationCard card = buildCard("no-visit-token", USER_HASH);
      card.setIncludedConditions(new String[]{"hiv"});

      when(verificationCardRepository.findByShareToken("no-visit-token"))
          .thenReturn(Optional.of(card));
      when(encryptionService.decryptFromBytes(any(byte[].class))).thenReturn("User");
      when(userRepository.findByEmailHash(USER_HASH)).thenReturn(Optional.empty());

      HealthStatus hivStatus = HealthStatus.builder()
          .userHash(USER_HASH).conditionType("hiv")
          .status(HealthStatusValue.NEGATIVE).verified(true)
          .testDate(LocalDate.of(2026, 3, 1)).build();
      when(healthStatusRepository.findByUserHashOrderByReportedAtDesc(USER_HASH))
          .thenReturn(List.of(hivStatus));

      when(verificationCardRepository.incrementViewsIfAllowed(card.getId()))
          .thenReturn(1);

      PublicVerificationCardResponse response =
          verificationCardService.getPublicCard("no-visit-token");

      assertThat(response.conditions()).hasSize(1);
      PublicVerificationCardResponse.PublicConditionStatus condition = response.conditions().get(0);
      assertThat(condition.labName()).isNull();
      assertThat(condition.labProvider()).isNull();
      assertThat(condition.verifiedAt()).isNull();
      assertThat(condition.labWebsiteUrl()).isNull();
    }
  }

  @Nested
  @DisplayName("verifyCard")
  class VerifyCardTests {

    @Test
    @DisplayName("valid card returns valid=true with signature")
    void verifyCard_validCard_returnsTrue() {
      VerificationCard card = VerificationCard.builder()
          .id(UUID.randomUUID())
          .userHash(USER_HASH)
          .includedConditions(new String[]{"hiv"})
          .shareToken("verify-token")
          .currentViews(0)
          .build();

      when(verificationCardRepository.findByShareToken("verify-token"))
          .thenReturn(Optional.of(card));
      when(encryptionService.hmacSign(anyString())).thenReturn("hmac-signature");

      CardVerificationResponse response = verificationCardService.verifyCard("verify-token");

      assertThat(response.valid()).isTrue();
      assertThat(response.verifiedAt()).isNotNull();
      assertThat(response.signature()).isEqualTo("hmac-signature");
    }

    @Test
    @DisplayName("expired card returns valid=false")
    void verifyCard_expiredCard_returnsFalse() {
      VerificationCard card = VerificationCard.builder()
          .id(UUID.randomUUID())
          .userHash(USER_HASH)
          .includedConditions(new String[]{"hiv"})
          .shareToken("expired-verify")
          .currentViews(0)
          .expiresAt(OffsetDateTime.now().minusDays(1))
          .build();

      when(verificationCardRepository.findByShareToken("expired-verify"))
          .thenReturn(Optional.of(card));

      CardVerificationResponse response = verificationCardService.verifyCard("expired-verify");

      assertThat(response.valid()).isFalse();
      assertThat(response.verifiedAt()).isNull();
      assertThat(response.signature()).isNull();
    }

    @Test
    @DisplayName("view-limited card returns valid=false")
    void verifyCard_viewLimited_returnsFalse() {
      VerificationCard card = VerificationCard.builder()
          .id(UUID.randomUUID())
          .userHash(USER_HASH)
          .includedConditions(new String[]{"hiv"})
          .shareToken("limited-verify")
          .currentViews(10)
          .maxViews(10)
          .build();

      when(verificationCardRepository.findByShareToken("limited-verify"))
          .thenReturn(Optional.of(card));

      CardVerificationResponse response = verificationCardService.verifyCard("limited-verify");

      assertThat(response.valid()).isFalse();
    }

    @Test
    @DisplayName("nonexistent token throws IllegalArgumentException")
    void verifyCard_invalidToken_throws() {
      when(verificationCardRepository.findByShareToken("nonexistent"))
          .thenReturn(Optional.empty());

      assertThatThrownBy(() -> verificationCardService.verifyCard("nonexistent"))
          .isInstanceOf(IllegalArgumentException.class)
          .hasMessage("card.error.notFound");
    }
  }
}
