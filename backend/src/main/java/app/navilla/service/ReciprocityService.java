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

import java.time.OffsetDateTime;
import java.time.temporal.ChronoUnit;

import app.navilla.dto.ReciprocityStatusResponse;
import app.navilla.entity.User;
import app.navilla.exception.CooldownActiveException;
import app.navilla.exception.ResourceNotFoundException;
import app.navilla.repository.UserRepository;
import app.navilla.security.EncryptionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service for managing user reciprocity (exposure network opt-in/opt-out).
 *
 * <p>Handles the opt-in and opt-out lifecycle with a configurable cooldown
 * period after opting out, preventing users from toggling rapidly.
 *
 * @author Navilla Team
 * @since 2026-03-04
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ReciprocityService {

  private static final String CONFIG_COOLDOWN_DAYS = "reciprocity.cooldown_days";
  private static final int DEFAULT_COOLDOWN_DAYS = 15;

  private final UserRepository userRepository;
  private final EncryptionService encryptionService;
  private final AppConfigService appConfigService;

  /**
   * Returns the current reciprocity status for the authenticated user.
   *
   * @param jwt the authenticated user's JWT
   * @return the reciprocity status including cooldown info
   * @throws ResourceNotFoundException if the user is not found
   */
  @Transactional(readOnly = true)
  public ReciprocityStatusResponse getStatus(Jwt jwt) {
    User user = findUser(jwt);
    return buildResponse(user);
  }

  /**
   * Opts the user into the exposure network.
   *
   * @param jwt the authenticated user's JWT
   * @return the updated reciprocity status
   * @throws IllegalStateException    if the user is already opted in
   * @throws CooldownActiveException  if the user is in a cooldown period
   * @throws ResourceNotFoundException if the user is not found
   */
  @Transactional
  public ReciprocityStatusResponse optIn(Jwt jwt) {
    User user = findUser(jwt);

    if (Boolean.TRUE.equals(user.getExposureOptedIn())) {
      throw new IllegalStateException("reciprocity.error.alreadyOptedIn");
    }

    // Check cooldown
    Integer cooldownRemaining = calculateCooldownDaysRemaining(user);
    if (cooldownRemaining != null && cooldownRemaining > 0) {
      throw new CooldownActiveException("reciprocity.error.cooldownActive", cooldownRemaining);
    }

    user.setExposureOptedIn(true);
    user.setExposureOptedInAt(OffsetDateTime.now());
    userRepository.save(user);

    log.info("User opted into exposure network: {}", user.getEmailHash());
    return buildResponse(user);
  }

  /**
   * Opts the user out of the exposure network.
   *
   * @param jwt the authenticated user's JWT
   * @return the updated reciprocity status
   * @throws IllegalStateException     if the user is not opted in
   * @throws ResourceNotFoundException if the user is not found
   */
  @Transactional
  public ReciprocityStatusResponse optOut(Jwt jwt) {
    User user = findUser(jwt);

    if (!Boolean.TRUE.equals(user.getExposureOptedIn())) {
      throw new IllegalStateException("reciprocity.error.notOptedIn");
    }

    user.setExposureOptedIn(false);
    user.setExposureOptedOutAt(OffsetDateTime.now());
    userRepository.save(user);

    log.info("User opted out of exposure network: {}", user.getEmailHash());
    return buildResponse(user);
  }

  // ---- Private helpers ----

  private User findUser(Jwt jwt) {
    String emailHash = encryptionService.hashEmail(jwt.getClaimAsString("email"));
    return userRepository.findByEmailHash(emailHash)
        .orElseThrow(() -> new ResourceNotFoundException("user.not.found"));
  }

  private ReciprocityStatusResponse buildResponse(User user) {
    return new ReciprocityStatusResponse(
        Boolean.TRUE.equals(user.getExposureOptedIn()),
        user.getExposureOptedInAt(),
        user.getExposureOptedOutAt(),
        calculateCooldownDaysRemaining(user)
    );
  }

  /**
   * Calculates the remaining cooldown days after an opt-out.
   *
   * @param user the user entity
   * @return days remaining, or null if not in cooldown
   */
  Integer calculateCooldownDaysRemaining(User user) {
    if (user.getExposureOptedOutAt() == null) {
      return null;
    }

    // If user is currently opted in, no cooldown applies
    if (Boolean.TRUE.equals(user.getExposureOptedIn())) {
      return null;
    }

    int cooldownDays = appConfigService.getInt(CONFIG_COOLDOWN_DAYS, DEFAULT_COOLDOWN_DAYS);
    long daysSinceOptOut = ChronoUnit.DAYS.between(
        user.getExposureOptedOutAt(), OffsetDateTime.now());

    if (daysSinceOptOut >= cooldownDays) {
      return 0;
    }

    return (int) (cooldownDays - daysSinceOptOut);
  }
}
