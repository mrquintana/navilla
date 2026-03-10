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

import java.security.SecureRandom;
import java.time.OffsetDateTime;
import java.util.Arrays;
import java.util.HexFormat;
import java.util.List;

import app.navilla.dto.CreateVerificationCardRequest;
import app.navilla.dto.PublicVerificationCardResponse;
import app.navilla.dto.UpdateVerificationCardRequest;
import app.navilla.dto.VerificationCardResponse;
import app.navilla.entity.HealthStatus;
import app.navilla.entity.VerificationCard;
import app.navilla.repository.HealthStatusRepository;
import app.navilla.repository.VerificationCardRepository;
import app.navilla.security.EncryptionService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class VerificationCardService {

  private final VerificationCardRepository verificationCardRepository;
  private final HealthStatusRepository healthStatusRepository;
  private final EncryptionService encryptionService;
  private final SecureRandom secureRandom = new SecureRandom();

  @Value("${navilla.app.base-url:https://navilla.app}")
  private String appBaseUrl;

  /**
   * Creates a new verification card for the given user.
   *
   * @param userHash the user's hashed identifier
   * @param req the creation request with card configuration
   * @return the created verification card response
   */
  @Transactional
  public VerificationCardResponse createCard(String userHash, CreateVerificationCardRequest req) {
    byte[] tokenBytes = new byte[32];
    secureRandom.nextBytes(tokenBytes);
    String shareToken = HexFormat.of().formatHex(tokenBytes);

    byte[] displayNameEncrypted = null;
    if (req.displayName() != null && !req.displayName().isBlank()) {
      displayNameEncrypted = encryptionService.encryptToBytes(req.displayName());
    }

    String[] conditions = req.includedConditions() != null
        ? req.includedConditions().toArray(new String[0])
        : new String[0];

    VerificationCard card = VerificationCard.builder()
        .userHash(userHash)
        .displayNameEncrypted(displayNameEncrypted)
        .includedConditions(conditions)
        .showTestDates(req.showTestDates() != null ? req.showTestDates() : false)
        .showVerificationLevel(req.showVerificationLevel() != null ? req.showVerificationLevel() : true)
        .shareToken(shareToken)
        .maxViews(req.maxViews())
        .expiresAt(req.expiresAt())
        .build();

    card = verificationCardRepository.save(card);
    return toResponse(card);
  }

  /**
   * Lists all verification cards for the given user.
   *
   * @param userHash the user's hashed identifier
   * @return list of verification card responses ordered by creation date descending
   */
  @Transactional(readOnly = true)
  public List<VerificationCardResponse> getUserCards(String userHash) {
    return verificationCardRepository.findByUserHashOrderByCreatedAtDesc(userHash)
        .stream()
        .map(this::toResponse)
        .toList();
  }

  /**
   * Updates an existing verification card.
   *
   * @param userHash the user's hashed identifier
   * @param cardId the card's UUID as string
   * @param req the update request with fields to change
   * @return the updated verification card response
   */
  @Transactional
  public VerificationCardResponse updateCard(String userHash, String cardId,
      UpdateVerificationCardRequest req) {
    VerificationCard card = verificationCardRepository.findByIdAndUserHash(
        java.util.UUID.fromString(cardId), userHash)
        .orElseThrow(() -> new IllegalArgumentException("Card not found"));

    if (req.displayName() != null) {
      card.setDisplayNameEncrypted(
          req.displayName().isBlank() ? null : encryptionService.encryptToBytes(req.displayName()));
    }
    if (req.includedConditions() != null) {
      card.setIncludedConditions(req.includedConditions().toArray(new String[0]));
    }
    if (req.showTestDates() != null) {
      card.setShowTestDates(req.showTestDates());
    }
    if (req.showVerificationLevel() != null) {
      card.setShowVerificationLevel(req.showVerificationLevel());
    }
    if (req.privacyMode() != null) {
      card.setPrivacyMode(req.privacyMode());
    }
    if (req.maxViews() != null) {
      card.setMaxViews(req.maxViews());
    }
    if (req.expiresAt() != null) {
      card.setExpiresAt(req.expiresAt());
    }

    card = verificationCardRepository.save(card);
    return toResponse(card);
  }

  /**
   * Deletes a verification card owned by the given user.
   *
   * @param userHash the user's hashed identifier
   * @param cardId the card's UUID as string
   */
  @Transactional
  public void deleteCard(String userHash, String cardId) {
    VerificationCard card = verificationCardRepository.findByIdAndUserHash(
        java.util.UUID.fromString(cardId), userHash)
        .orElseThrow(() -> new IllegalArgumentException("Card not found"));
    verificationCardRepository.delete(card);
  }

  /**
   * Retrieves a public verification card by share token, incrementing the view count.
   *
   * @param shareToken the unique share token for the card
   * @return the public verification card response with condition statuses
   * @throws IllegalArgumentException if the card is not found
   * @throws IllegalStateException if the card has expired or reached its view limit
   */
  @Transactional
  public PublicVerificationCardResponse getPublicCard(String shareToken) {
    VerificationCard card = verificationCardRepository.findByShareToken(shareToken)
        .orElseThrow(() -> new IllegalArgumentException("Card not found"));

    // Check expiry
    if (card.getExpiresAt() != null && card.getExpiresAt().isBefore(OffsetDateTime.now())) {
      throw new IllegalStateException("Card has expired");
    }

    // Check view limit
    if (card.getMaxViews() != null && card.getCurrentViews() >= card.getMaxViews()) {
      throw new IllegalStateException("Card view limit reached");
    }

    // Increment views
    card.setCurrentViews(card.getCurrentViews() + 1);
    verificationCardRepository.save(card);

    // Build response
    String displayName = card.getDisplayNameEncrypted() != null
        ? encryptionService.decryptFromBytes(card.getDisplayNameEncrypted())
        : "Anonymous";

    List<HealthStatus> statuses = healthStatusRepository
        .findByUserHashOrderByReportedAtDesc(card.getUserHash());

    List<String> includedConditions = Arrays.asList(card.getIncludedConditions());

    List<PublicVerificationCardResponse.PublicConditionStatus> conditions = statuses.stream()
        .filter(hs -> includedConditions.contains(hs.getConditionType().toLowerCase())
            || includedConditions.contains(hs.getConditionType()))
        .map(hs -> new PublicVerificationCardResponse.PublicConditionStatus(
            hs.getConditionType(),
            hs.getStatus().name(),
            card.getShowVerificationLevel()
                ? (Boolean.TRUE.equals(hs.getVerified()) ? "LAB_VERIFIED" : "SELF_REPORTED")
                : null,
            card.getShowTestDates() && hs.getTestDate() != null
                ? hs.getTestDate().toString()
                : null
        ))
        .toList();

    Integer viewsRemaining = card.getMaxViews() != null
        ? card.getMaxViews() - card.getCurrentViews()
        : null;

    return new PublicVerificationCardResponse(
        displayName,
        conditions,
        card.getExpiresAt(),
        viewsRemaining
    );
  }

  private VerificationCardResponse toResponse(VerificationCard card) {
    String displayName = card.getDisplayNameEncrypted() != null
        ? encryptionService.decryptFromBytes(card.getDisplayNameEncrypted())
        : null;

    String shareUrl = appBaseUrl + "/v/" + card.getShareToken();

    return new VerificationCardResponse(
        card.getId().toString(),
        displayName,
        Arrays.asList(card.getIncludedConditions()),
        card.getShowTestDates(),
        card.getShowVerificationLevel(),
        card.getShareToken(),
        shareUrl,
        card.getPrivacyMode(),
        card.getMaxViews(),
        card.getCurrentViews(),
        card.getExpiresAt(),
        card.getCreatedAt(),
        card.getUpdatedAt()
    );
  }
}
